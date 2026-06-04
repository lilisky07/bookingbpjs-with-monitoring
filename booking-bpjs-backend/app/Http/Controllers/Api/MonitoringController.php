<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\BpjsAntreanService;

class MonitoringController extends Controller
{
    public function tempatTidur(Request $request): JsonResponse
{
    try {
        $data = DB::connection('kamar')->table('datkamar as dk')
            ->join('ref_kamar as rk', 'dk.kodekelas', '=', 'rk.kodekelas')
            ->select(
                'rk.namakelas as kelas',
                'dk.namaruang as nm_bangsal',
                'dk.kapasitas as total',
                DB::raw("(dk.kapasitas - COALESCE(dk.tersedia, 0)) as terisi"),
                'dk.tersedia as kosong',
                DB::raw("CASE 
                    WHEN dk.kapasitas > 0 
                    THEN ROUND((dk.kapasitas - dk.tersedia) / dk.kapasitas * 100, 1)
                    ELSE 0 
                END as bor_persen"),
                'dk.updated_at as last_update'
            )
            ->orderBy('rk.namakelas')
            ->orderBy('dk.namaruang')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    } catch (\Exception $e) {
        Log::error('Monitoring tempatTidur error', ['msg' => $e->getMessage()]);
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}


public function borDashboard(Request $request)
{
    $tanggal = $request->get('tanggal', now()->format('Y-m-d'));
    $bulan   = substr($tanggal, 0, 7);     // YYYY-MM
    $tahun   = substr($tanggal, 0, 4);

    try {
        $db = DB::connection('kamar');

        // === Data BOR Real Time ===
        $totalPerKelas = $db->table('datkamar')
            ->join('ref_kamar', 'datkamar.kodekelas', '=', 'ref_kamar.kodekelas')
            ->select(
                'ref_kamar.kodekelas',
                'ref_kamar.namakelas',
                DB::raw('SUM(datkamar.kapasitas) as total_tt')
            )
            ->groupBy('ref_kamar.kodekelas', 'ref_kamar.namakelas')
            ->get();

        $tersediaPerKelas = $db->table('datkamar')
            ->join('ref_kamar', 'datkamar.kodekelas', '=', 'ref_kamar.kodekelas')
            ->select('ref_kamar.kodekelas', DB::raw('SUM(datkamar.tersedia) as total_tersedia'))
            ->groupBy('ref_kamar.kodekelas')
            ->get();

        $data = [];
        $grandTotalTT = 0;
        $grandTotalTerisi = 0;

        foreach ($totalPerKelas as $kelas) {
            $tersedia = $tersediaPerKelas->firstWhere('kodekelas', $kelas->kodekelas)->total_tersedia ?? 0;
            $terisi = $kelas->total_tt - $tersedia;
            $bor = $kelas->total_tt > 0 ? round(($terisi / $kelas->total_tt) * 100, 2) : 0;

            $data[] = [
                'kodekelas' => $kelas->kodekelas,
                'namakelas' => $kelas->namakelas,
                'total_tt'  => (int)$kelas->total_tt,
                'terisi'    => (int)$terisi,
                'tersedia'  => (int)$tersedia,
                'bor'       => $bor,
            ];

            $grandTotalTT += $kelas->total_tt;
            $grandTotalTerisi += $terisi;
        }

        $borRealisasi = $grandTotalTT > 0 ? round(($grandTotalTerisi / $grandTotalTT) * 100, 2) : 0;

        // === Target BOR (Hardcode) ===
        $targets = [
            'harian' => [
                'target' => 78.0,
                'realisasi' => $borRealisasi,
                'selisih' => round($borRealisasi - 78.0, 2)
            ],
            'bulanan' => [
                'target' => 75.0,
                'realisasi' => $borRealisasi,   // nanti bisa dihitung rata-rata bulanan
                'selisih' => round($borRealisasi - 75.0, 2)
            ],
            'tahunan' => [
                'target' => 72.0,
                'realisasi' => $borRealisasi,   // nanti bisa dihitung rata-rata tahunan
                'selisih' => round($borRealisasi - 72.0, 2)
            ]
        ];

        return response()->json([
            'success'            => true,
            'tanggal'            => $tanggal,
            'total_tempat_tidur' => $grandTotalTT,
            'total_terisi'       => $grandTotalTerisi,
            'total_tersedia'     => $grandTotalTT - $grandTotalTerisi,
            'bor_harian'         => $data,
            'bor_realisasi'      => $borRealisasi,
            'targets'            => $targets
        ]);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

    public function startAntrol(Request $request): JsonResponse
    {
        try {
            $tanggal = $request->get('tanggal', now()->format('Y-m-d'));

            // ══════════════════════════════════════════════════════════
            // BLOK 1 — DATA MJKN (referensi_mobilejkn_bpjs)
            // ══════════════════════════════════════════════════════════
            
            $mjknStats = DB::select("
    SELECT
        COUNT(*)                AS record,
        SUM(status = 'Belum')   AS mjkn_belum,
        SUM(status = 'Checkin') AS mjkn_selesai,
        SUM(status = 'Batal')   AS mjkn_batal,
        SUM(status = 'Gagal')   AS mjkn_gagal
    FROM referensi_mobilejkn_bpjs
    WHERE DATE(tanggalperiksa) = ?
", [$tanggal]);

            $batalCount = DB::table('referensi_mobilejkn_bpjs_batal as rbb')
                ->leftJoin('referensi_mobilejkn_bpjs as rmb', 'rmb.nobooking', '=', 'rbb.nobooking')
                ->whereDate('rmb.tanggalperiksa', $tanggal)
                ->count();

            $m = $mjknStats[0];
            $record      = (int)$m->record + $batalCount;
            $mjknBelum   = (int)($m->mjkn_belum ?? 0);
            $mjknSelesai = (int)($m->mjkn_selesai ?? 0);
            $mjknBatal   = (int)($m->mjkn_batal ?? 0) + $batalCount;
            $mjknGagal   = (int)($m->mjkn_gagal ?? 0);

            // ══════════════════════════════════════════════════════════
            // BLOK 2 — DATA JKN NON-MJKN
            // = pasien BPJS (kd_pj = 'BPJ') rawat jalan yang terdaftar
            //   di reg_periksa tapi TIDAK ada di referensi_mobilejkn_bpjs
            //   (bukan via Mobile JKN — daftar langsung di loket)
            // Definisi sama dengan kolom "JKN" di SIM RS Khanza
            // ══════════════════════════════════════════════════════════
            $jknStats = DB::select("
                SELECT
                    COUNT(*)                              AS jkn_total,
                    SUM(rp.stts != 'Batal')              AS jkn_selesai,
                    SUM(rp.stts = 'Batal')               AS jkn_batal,
                    SUM(rp.stts = 'Belum')               AS jkn_belum
                FROM reg_periksa rp
                WHERE DATE(rp.tgl_registrasi) = ?
                  AND rp.kd_pj = 'BPJ'
                  AND rp.status_lanjut = 'Ralan'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM referensi_mobilejkn_bpjs rmb
                      WHERE rmb.norm = rp.no_rkm_medis
                        AND DATE(rmb.tanggalperiksa) = ?
                  )
            ", [$tanggal, $tanggal]);

            $j = $jknStats[0];
            $jknTotal   = (int)$j->jkn_total;
            $jknSelesai = (int)$j->jkn_selesai;
            $jknBelum   = (int)$j->jkn_belum;

            // ══════════════════════════════════════════════════════════
            // BLOK 3 — DATA NON JKN
            // = pasien rawat jalan BUKAN BPJS (kd_pj != 'BPJ')
            // Definisi sama dengan kolom "Non JKN" di SIM RS Khanza
            // ══════════════════════════════════════════════════════════
            $nonJknStats = DB::select("
                SELECT
                    COUNT(*)                              AS non_jkn_total,
                    SUM(rp.stts != 'Batal')              AS non_jkn_selesai,
                    SUM(rp.stts = 'Belum')               AS non_jkn_belum
                FROM reg_periksa rp
                WHERE DATE(rp.tgl_registrasi) = ?
                  AND rp.kd_pj != 'BPJ'
                  AND rp.status_lanjut = 'Ralan'
            ", [$tanggal]);

            $nj = $nonJknStats[0];
            $nonJknTotal   = (int)$nj->non_jkn_total;
            $nonJknSelesai = (int)$nj->non_jkn_selesai;
            $nonJknBelum   = (int)$nj->non_jkn_belum;

            // ══════════════════════════════════════════════════════════
            // BLOK 4 — TOTAL BELUM & TOTAL SELESAI
            // = gabungan MJKN + JKN non-MJKN (tidak include Non-JKN)
            // Sama persis dengan "Total Belum" & "Total Selesai" di SIM RS
            // ══════════════════════════════════════════════════════════
            $totalBelum   = $mjknBelum + $jknBelum;
            $totalSelesai = $mjknSelesai + $jknSelesai;
            $totalBatal   = $mjknBatal + $j->jkn_batal;

            // ══════════════════════════════════════════════════════════
            // BLOK 5 — SEP TERBIT
            // Filter: join ke reg_periksa supaya hanya hitung SEP
            // yang registrasinya di tanggal tersebut (bukan tglsep doang)
            // Ini yang bikin angka SIM RS beda dengan COUNT(*) bridging_sep
            // ══════════════════════════════════════════════════════════
            $sepStats = DB::select("
    SELECT
        COUNT(*)                          AS sep_terbit,
        SUM(bs.jnspelayanan = '1')        AS sep_ralan,
        SUM(bs.jnspelayanan = '2')        AS sep_ranap
    FROM bridging_sep bs
    INNER JOIN reg_periksa rp ON rp.no_rawat = bs.no_rawat
    WHERE DATE(rp.tgl_registrasi) = ?
    AND bs.jnspelayanan = '2'
    AND bs.kdpolitujuan != 'IGD'
", [$tanggal]);

            $s = $sepStats[0];
            $sepTerbit = (int)$s->sep_terbit;
            $sepRalan  = (int)$s->sep_ralan;
            $sepRanap  = (int)$s->sep_ranap;

            // ══════════════════════════════════════════════════════════
            // BLOK 6 — TASKID (alur pelayanan MJKN)
            // ══════════════════════════════════════════════════════════
            $taskStats = DB::select("
                SELECT t.taskid, COUNT(DISTINCT t.no_rawat) as jumlah
                FROM referensi_mobilejkn_bpjs_taskid t
                INNER JOIN (
                    SELECT no_rawat, MAX(waktu) as max_waktu
                    FROM referensi_mobilejkn_bpjs_taskid
                    GROUP BY no_rawat
                ) latest ON t.no_rawat = latest.no_rawat AND t.waktu = latest.max_waktu
                INNER JOIN reg_periksa rp ON rp.no_rawat = t.no_rawat
                WHERE DATE(rp.tgl_registrasi) = ?
                GROUP BY t.taskid
            ", [$tanggal]);
            $taskMap = collect($taskStats)->pluck('jumlah', 'taskid');

            return response()->json([
                'success' => true,
                'data' => [
                    // ── Angka utama (sama dengan header SIM RS) ──────
                    'record'            => $record,          // semua entri MJKN termasuk Batal
                    'total_belum'       => $totalBelum,      // MJKN Belum + JKN Belum
                    'total_selesai'     => $totalSelesai,    // MJKN Checkin + JKN Selesai
                    'total_batal'       => $totalBatal,

                    // ── MJKN (Mobile JKN) ────────────────────────────
                    'mjkn_total'        => $record,
                    'mjkn_belum'        => $mjknBelum,
                    'mjkn_selesai'      => $mjknSelesai,
                    'mjkn_batal'        => $mjknBatal,

                    // ── JKN non-MJKN (loket BPJS) ───────────────────
                    'jkn_total'         => $jknTotal,
                    'jkn_belum'         => $jknBelum,
                    'jkn_selesai'       => $jknSelesai,

                    // ── Non JKN (umum/non-BPJS) ─────────────────────
                    'non_jkn_total'     => $nonJknTotal,
                    'non_jkn_belum'     => $nonJknBelum,
                    'non_jkn_selesai'   => $nonJknSelesai,

                    // ── SEP ──────────────────────────────────────────
                    'sep_terbit'        => $sepTerbit,
                    'sep_ralan'         => $sepRalan,
                    'sep_ranap'         => $sepRanap,

                    // ── Alur pelayanan taskid ────────────────────────
                    'tunggu_pelayanan'  => (int)($taskMap['3'] ?? 0),
                    'dilayani'          => (int)($taskMap['4'] ?? 0),
                    'selesai_dilayani'  => (int)($taskMap['5'] ?? 0),
                    'tunggu_farmasi'    => (int)($taskMap['6'] ?? 0),
                    'selesai'           => (int)($taskMap['7'] ?? 0),
                    'batal_taskid'      => (int)($taskMap['99'] ?? 0),

                    'tanggal'           => $tanggal,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Monitoring startAntrol error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function detailAntrol(Request $request): JsonResponse
    {
        try {
            $tanggal  = $request->get('tanggal', now()->format('Y-m-d'));
            $search   = $request->get('search');
            $hariArr  = ['MINGGU','SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU'];
            $namaHari = $hariArr[(int) date('w', strtotime($tanggal))];

            $query = DB::table('referensi_mobilejkn_bpjs as rmb')
                ->leftJoin('reg_periksa as rp', 'rmb.no_rawat', '=', 'rp.no_rawat')
                ->leftJoin('pasien as p', 'rmb.norm', '=', 'p.no_rkm_medis')
                ->leftJoin('poliklinik as pol', 'rmb.kodepoli', '=', 'pol.kd_poli')
                ->leftJoin('dokter as d', 'rmb.kodedokter', '=', 'd.kd_dokter')
                ->leftJoin('bridging_sep as bs', 'bs.no_rawat', '=', 'rp.no_rawat')
                ->leftJoin('jadwal as jd', function ($join) use ($namaHari) {
                    $join->on('jd.kd_dokter', '=', 'rmb.kodedokter')
                         ->on('jd.kd_poli',   '=', 'rmb.kodepoli')
                         ->where('jd.hari_kerja', '=', $namaHari);
                })
                // Ambil taskid TERAKHIR berdasarkan waktu terbaru (bukan MAX nilai)
                // Join: rmb.norm = rp2.no_rkm_medis + tgl sama, lalu rp2.no_rawat = tk.no_rawat
                ->leftJoin(DB::raw("(
                    SELECT t.no_rawat,
                           t.taskid as last_taskid,
                           t.waktu as waktu_task
                    FROM referensi_mobilejkn_bpjs_taskid t
                    INNER JOIN (
                        SELECT no_rawat, MAX(waktu) as max_waktu
                        FROM referensi_mobilejkn_bpjs_taskid
                        GROUP BY no_rawat
                    ) latest ON t.no_rawat = latest.no_rawat
                           AND t.waktu = latest.max_waktu
                ) as tk"), 'tk.no_rawat', '=', 'rp.no_rawat')
                ->whereDate('rmb.tanggalperiksa', $tanggal)
                ->select(
                    'rmb.norm as no_rm',
                    DB::raw("COALESCE(p.nm_pasien, '-') as nama"),
                    'bs.no_sep',
                    DB::raw("DATE_FORMAT(rmb.validasi, '%H:%i') as jam_sep"),
                    DB::raw("LEFT(jd.jam_mulai, 5) as jam_praktek"),
                    DB::raw("COALESCE(pol.nm_poli, rmb.kodepoli) as poli"),
                    DB::raw("COALESCE(d.nm_dokter, rmb.kodedokter) as dokter"),
                    'rmb.status',
                    'rmb.jeniskunjungan',
                    DB::raw("1 as via_mjkn"),
                    'rmb.jampraktek as jam_dilayani',
                    'rmb.estimasidilayani as estimasi',
                    DB::raw("COALESCE(rp.jam_reg, '-') as jam_selesai"),
                    'rmb.nomorantrean',
                    'rmb.angkaantrean',
                    'rmb.tanggalperiksa',
                    'rmb.validasi as waktu_booking',
                    // taskid terkini & waktu update-nya
                    'tk.last_taskid',
                    DB::raw("DATE_FORMAT(tk.waktu_task, '%H:%i') as waktu_task")
                )
                ->orderByRaw("CAST(rmb.angkaantrean AS UNSIGNED) ASC");

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('p.nm_pasien', 'like', "%$search%")
                      ->orWhere('rmb.norm',  'like', "%$search%")
                      ->orWhere('bs.no_sep', 'like', "%$search%");
                });
            }

            return response()->json(['success' => true, 'data' => $query->get()]);
        } catch (\Exception $e) {
            Log::error('Monitoring detailAntrol error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function sepVclaim(Request $request): JsonResponse
    {
        try {
            $tanggal    = $request->get('tanggal', now()->format('Y-m-d'));
            $total      = DB::table('bridging_sep')->whereDate('tglsep', $tanggal)->count();
            $rawatJalan = DB::table('bridging_sep')->whereDate('tglsep', $tanggal)->where('jnspelayanan', '1')->count();
            $rawatInap  = DB::table('bridging_sep')->whereDate('tglsep', $tanggal)->where('jnspelayanan', '2')->count();
            $sepKontrol = DB::table('bridging_sep as bs')
                ->join('bridging_surat_kontrol_bpjs as bsk', 'bsk.no_sep', '=', 'bs.no_sep')
                ->whereDate('bs.tglsep', $tanggal)->whereNotNull('bsk.no_surat')->count();

            return response()->json(['success' => true, 'data' => compact('total', 'rawatJalan', 'rawatInap', 'sepKontrol', 'tanggal')]);
        } catch (\Exception $e) {
            Log::error('Monitoring sepVclaim error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ─────────────────────────────────────────
    // SURAT KONTROL — 2 filter: tgl_sep + tgl_rencana
    // ?tgl_sep=YYYY-MM-DD&tgl_rencana=YYYY-MM-DD
    // Kalau keduanya diisi = AND, salah satu = filter by yang diisi
    // Kalau keduanya kosong = default tgl_sep = today
    // ─────────────────────────────────────────
    public function suratKontrol(Request $request): JsonResponse
    {
        try {
            $tglSep      = $request->get('tgl_sep');
            $tglRencana  = $request->get('tgl_rencana');

            // Default: pakai tgl_sep = today jika keduanya kosong
            if (!$tglSep && !$tglRencana) {
                $tglSep = now()->format('Y-m-d');
            }

            $query = DB::table('bridging_surat_kontrol_bpjs as bsk')
                ->join('bridging_sep as bs', 'bsk.no_sep', '=', 'bs.no_sep')
                ->join('reg_periksa as rp', 'bs.no_rawat', '=', 'rp.no_rawat')
                ->join('pasien as p', 'rp.no_rkm_medis', '=', 'p.no_rkm_medis')
                ->whereNotNull('bsk.no_surat');

            if ($tglSep) {
                $query->whereDate('bs.tglsep', $tglSep);
            }

            if ($tglRencana) {
                $query->whereDate('bsk.tgl_rencana', $tglRencana);
            }

            $data = $query->select(
                    'p.no_rkm_medis as no_rm',
                    'p.nm_pasien as nama',
                    'bsk.no_surat',
                    DB::raw("DATE(bsk.tgl_surat) as tgl_surat"),
                    DB::raw("DATE(bsk.tgl_rencana) as tgl_rencana"),
                    'bs.no_sep',
                    DB::raw("DATE(bs.tglsep) as tgl_sep"),
                    DB::raw("DATEDIFF(DATE(bs.tglsep), DATE(bsk.tgl_surat)) as selisih_hari"),
                    'bsk.nm_poli_bpjs as poli',
                    'bsk.nm_dokter_bpjs as dokter'
                )
                ->orderBy('bs.tglsep', 'desc')
                ->get();

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('Monitoring suratKontrol error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function jadwalOperasi(Request $request): JsonResponse
    {
        try {
            $tanggal = $request->get('tanggal', now()->format('Y-m-d'));

            $data = DB::table('operasi as o')
                ->join('reg_periksa as rp', 'o.no_rawat', '=', 'rp.no_rawat')
                ->join('pasien as p', 'rp.no_rkm_medis', '=', 'p.no_rkm_medis')
                ->leftJoin('dokter as d', 'o.operator1', '=', 'd.kd_dokter')
                ->whereDate('o.tgl_operasi', $tanggal)
                ->select(
                    'p.no_rkm_medis as no_rm',
                    'p.nm_pasien as nama',
                    'o.no_rawat',
                    DB::raw("DATE(o.tgl_operasi) as tgl_operasi"),
                    DB::raw("TIME(o.tgl_operasi) as jam_mulai"),
                    'o.kategori as jenis_operasi',
                    DB::raw("COALESCE(d.nm_dokter, o.operator1) as dokter_operator"),
                    'o.status as status_rawat',
                    DB::raw("'Terjadwal' as status_operasi")
                )
                ->orderBy('o.tgl_operasi')
                ->get();

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('Monitoring jadwalOperasi error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }


public function syncTaskId(Request $request): JsonResponse
{
    try {
        $tanggal = $request->get('tanggal', now()->format('Y-m-d'));

        $rows = DB::table('referensi_mobilejkn_bpjs')
            ->whereDate('tanggalperiksa', $tanggal)
            ->whereNotNull('no_rawat')
            ->select('nobooking', 'no_rawat')
            ->get();

        if ($rows->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Tidak ada data untuk tanggal tersebut']);
        }

        $service  = new \App\Services\BpjsAntreanService();
        $berhasil = 0;
        $gagal    = 0;
        $errors   = [];

        foreach ($rows as $row) {
            try {
                $result = $service->getListTask($row->nobooking);

                if (isset($result['error'])) {
                    $gagal++;
                    $errors[] = $row->nobooking . ': ' . $result['error'];
                    continue;
                }

                $list = $result['response']['list'] ?? [];

                foreach ($list as $task) {
                    $taskid = (string)($task['taskid'] ?? null);
                    $waktu  = $task['wakturs'] ?? null;

                    if (!$taskid || !$row->no_rawat) continue;

                    $waktuFormatted = null;
                    if ($waktu) {
                        $waktuClean     = str_replace(' WIB', '', $waktu);
                        $waktuFormatted = \Carbon\Carbon::createFromFormat('d-m-Y H:i:s', $waktuClean)
                                            ->format('Y-m-d H:i:s');
                    }

                    DB::table('referensi_mobilejkn_bpjs_taskid')->insertOrIgnore([
                        'no_rawat' => $row->no_rawat,
                        'taskid'   => $taskid,
                        'waktu'    => $waktuFormatted,
                    ]);
                }

                $berhasil++;

            } catch (\Exception $ex) {
                $gagal++;
                $errors[] = $row->nobooking . ': ' . $ex->getMessage();
            }
        }

        return response()->json([
            'success'  => true,
            'tanggal'  => $tanggal,
            'berhasil' => $berhasil,
            'gagal'    => $gagal,
            'errors'   => $errors,
        ]);

    } catch (\Exception $e) {
        Log::error('syncTaskId error', ['msg' => $e->getMessage()]);
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

public function antrolPertanggal(Request $request): JsonResponse
{
    try {
        set_time_limit(300);
        $tanggal = $request->get('tanggal', now()->format('Y-m-d'));
        $search  = $request->get('search');
        $status  = $request->get('status');

        // Hit BPJS langsung
        $service = new \App\Services\BpjsAntreanService();
        $result  = $service->getAntreanByTanggal($tanggal);

        if (isset($result['error']) || ($result['metadata']['code'] ?? null) != 200) {
            // Fallback ke DB lokal kalau BPJS tidak bisa diakses
            return $this->antrolPertanggalFromDb($request);
        }

        $list = $result['response'] ?? [];
        if (!is_array($list)) {
            return $this->antrolPertanggalFromDb($request);
        }

        // Ambil data enrichment dari lokal (nama, no_sep, taskid, dll)
        $localData = DB::table('referensi_mobilejkn_bpjs as rmb')
            ->leftJoin('pasien as p', 'rmb.norm', '=', 'p.no_rkm_medis')
            ->leftJoin('poliklinik as pol', 'rmb.kodepoli', '=', 'pol.kd_poli')
            ->leftJoin('dokter as d', 'rmb.kodedokter', '=', 'd.kd_dokter')
            ->leftJoin('bridging_sep as bs', 'bs.no_rawat', '=', 'rmb.no_rawat')
            ->leftJoin(DB::raw("(
                SELECT t.no_rawat,
                       t.taskid as last_taskid,
                       t.waktu as waktu_task
                FROM referensi_mobilejkn_bpjs_taskid t
                INNER JOIN (
                    SELECT no_rawat, MAX(waktu) as max_waktu
                    FROM referensi_mobilejkn_bpjs_taskid
                    GROUP BY no_rawat
                ) latest ON t.no_rawat = latest.no_rawat
                       AND t.waktu = latest.max_waktu
            ) as tk"), 'tk.no_rawat', '=', 'rmb.no_rawat')
            ->whereDate('rmb.tanggalperiksa', $tanggal)
            ->select(
                'rmb.nobooking',
                'rmb.no_rawat',
                'p.nm_pasien as nama',
                'p.no_rkm_medis as no_rm',
                DB::raw("COALESCE(pol.nm_poli, rmb.kodepoli) as nm_poli"),
                DB::raw("COALESCE(d.nm_dokter, rmb.kodedokter) as nm_dokter"),
                'bs.no_sep',
                'tk.last_taskid',
                DB::raw("DATE_FORMAT(tk.waktu_task, '%H:%i') as waktu_task"),
                DB::raw("DATE_FORMAT(rmb.validasi, '%Y-%m-%d %H:%i') as waktu_booking")
            )
            ->get()
            ->keyBy('nobooking');

        // Gabungkan data BPJS dengan data lokal
        $data = collect($list)->map(function($item) use ($localData) {
            $local = $localData[$item['kodebooking']] ?? null;

            $task = $local->last_taskid ?? null;
            $statusBpjs = $item['status'] ?? '';

            // Kalau BPJS bilang sudah selesai/batal, ikut BPJS
            // Taskid lokal hanya dipakai kalau status BPJS masih "Belum dilayani"
            if ($statusBpjs === 'Selesai dilayani') {
                $statusAlur = match((string)$task) {
                    '6'  => 'Tunggu Farmasi',
                    '7'  => 'Selesai',
                    default => 'Selesai Dilayani',
                };
            } elseif ($statusBpjs === 'Batal') {
                $statusAlur = 'Batal';
            } else {
                // Belum dilayani — pakai taskid lokal kalau ada
                $statusAlur = match((string)$task) {
                    '3'  => 'Tunggu Pelayanan',
                    '4'  => 'Sedang Dilayani',
                    '5'  => 'Selesai Dilayani',
                    '6'  => 'Tunggu Farmasi',
                    '7'  => 'Selesai',
                    '99' => 'Batal',
                    default => 'Belum',
                };
            }

            return [
                'nobooking'        => $item['kodebooking']    ?? null,
                'no_rm'            => $local->no_rm           ?? $item['norekammedis'] ?? null,
                'nama'             => $local->nama            ?? $item['nama'] ?? null,
                'nomorkartu'       => $item['nokapst']        ?? null,
                'nik'              => $item['nik']            ?? null,
                'kodepoli'         => $item['kodepoli']       ?? null,
                'nm_poli'          => $local->nm_poli         ?? $item['kodepoli'] ?? null,
                'nm_dokter'        => $local->nm_dokter       ?? $item['kodedokter'] ?? null,
                'jampraktek'       => $item['jampraktek']     ?? null,
                'tanggalperiksa'   => $item['tanggal']        ?? null,
                'nomorantrean'     => $item['noantrean']      ?? null,
                'angkaantrean'     => $item['angkaantrean']   ?? null,
                'estimasidilayani' => $item['estimasidilayani'] ?? null,
                'jeniskunjungan'   => $item['jeniskunjungan'] ?? null,
                'status_antrol'    => $item['status']         ?? null,
                'no_sep'           => $local->no_sep          ?? null,
                'waktu_booking'    => $local->waktu_booking   ?? $item['createdtime'] ?? null,
                'last_taskid'      => $task,
                'waktu_task'       => $local->waktu_task      ?? null,
                'sumber'           => $item['sumberdata']     ?? 'Mobile JKN',
                'status_alur'      => $statusAlur,
            ];
        });

        // Filter search
        if ($search) {
            $data = $data->filter(function($row) use ($search) {
                $s = strtolower($search);
                return str_contains(strtolower($row['nama'] ?? ''), $s)
                    || str_contains(strtolower($row['no_rm'] ?? ''), $s)
                    || str_contains(strtolower($row['nobooking'] ?? ''), $s)
                    || str_contains(strtolower($row['no_sep'] ?? ''), $s);
            });
        }

        // Filter status
        // status_antrol dari BPJS: 'Belum dilayani', 'Selesai dilayani', 'Batal'
        // Dropdown frontend kirim: 'Belum', 'Checkin', 'Batal', 'Gagal'
        if ($status) {
            $data = $data->filter(function($row) use ($status) {
                $s = $row['status_antrol'] ?? '';
                return match($status) {
                    'Belum'   => $s === 'Belum dilayani' || $s === 'Belum',
                    'Checkin' => $s === 'Selesai dilayani' || $s === 'Checkin',
                    'Batal'   => $s === 'Batal',
                    'Gagal'   => $s === 'Gagal',
                    default   => $s === $status,
                };
            });
        }

        $data = $data->values();

        return response()->json([
            'success' => true,
            'total'   => $data->count(),
            'data'    => $data,
        ]);

    } catch (\Exception $e) {
        Log::error('Monitoring antrolPertanggal error', ['msg' => $e->getMessage()]);
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

    // Fallback: ambil dari DB lokal jika API BPJS tidak tersedia
    private function antrolPertanggalFromDb(Request $request): JsonResponse
    {
        try {
            $tanggal = $request->get('tanggal', now()->format('Y-m-d'));
            $search  = $request->get('search');
            $status  = $request->get('status');

            $query = DB::table('referensi_mobilejkn_bpjs as rmb')
                ->leftJoin('pasien as p', 'rmb.norm', '=', 'p.no_rkm_medis')
                ->leftJoin('poliklinik as pol', 'rmb.kodepoli', '=', 'pol.kd_poli')
                ->leftJoin('dokter as d', 'rmb.kodedokter', '=', 'd.kd_dokter')
                ->leftJoin('bridging_sep as bs', 'bs.no_rawat', '=', 'rmb.no_rawat')
                ->leftJoin(DB::raw("(
                    SELECT t.no_rawat, t.taskid as last_taskid
                    FROM referensi_mobilejkn_bpjs_taskid t
                    INNER JOIN (
                        SELECT no_rawat, MAX(waktu) as max_waktu
                        FROM referensi_mobilejkn_bpjs_taskid
                        GROUP BY no_rawat
                    ) lt ON t.no_rawat = lt.no_rawat AND t.waktu = lt.max_waktu
                ) as tk"), 'tk.no_rawat', '=', 'rmb.no_rawat')
                ->whereDate('rmb.tanggalperiksa', $tanggal)
                ->select(
                    'rmb.nobooking',
                    DB::raw("COALESCE(p.no_rkm_medis, rmb.norm) as no_rm"),
                    DB::raw("COALESCE(p.nm_pasien, '-') as nama"),
                    'rmb.nomorkartu', 'rmb.nik',
                    DB::raw("COALESCE(pol.nm_poli, rmb.kodepoli) as nm_poli"),
                    DB::raw("COALESCE(d.nm_dokter, rmb.kodedokter) as nm_dokter"),
                    'rmb.jampraktek', 'rmb.tanggalperiksa',
                    'rmb.nomorantrean', 'rmb.angkaantrean',
                    'rmb.estimasidilayani', 'rmb.jeniskunjungan',
                    DB::raw("'Mobile JKN' as sumber"),
                    'bs.no_sep', 'rmb.status',
                    'tk.last_taskid',
                    DB::raw("DATE_FORMAT(rmb.validasi, '%Y-%m-%d %H:%i') as waktu_booking"),
                    'rmb.no_rawat'
                )
                ->orderByRaw("CAST(rmb.angkaantrean AS UNSIGNED) ASC");

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('p.nm_pasien',      'like', "%{$search}%")
                      ->orWhere('rmb.norm',        'like', "%{$search}%")
                      ->orWhere('rmb.nobooking',   'like', "%{$search}%")
                      ->orWhere('bs.no_sep',        'like', "%{$search}%");
                });
            }

            if ($status) {
                $query->where('rmb.status', $status);
            }

            return response()->json([
                'success' => true,
                'source'  => 'db_lokal',
                'data'    => $query->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('antrolPertanggalFromDb error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

public function getTaskId(Request $request, string $nobooking): JsonResponse
{
    try {
        $service = new \App\Services\BpjsAntreanService();
        $result  = $service->getListTask($nobooking);

        if (isset($result['error'])) {
            return response()->json(['success' => false, 'message' => $result['error']], 500);
        }

        $list = $result['response']['list'] ?? [];

        return response()->json([
            'success'     => true,
            'nobooking'   => $nobooking,
            'data'        => $list,
        ]);

    } catch (\Exception $e) {
        Log::error('getTaskId error', ['msg' => $e->getMessage()]);
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}
}