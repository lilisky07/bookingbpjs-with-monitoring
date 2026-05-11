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
            $data = DB::table('kamar as k')
                ->join('bangsal as b', 'k.kd_bangsal', '=', 'b.kd_bangsal')
                ->where('b.status', '1')
                ->where('k.statusdata', '1')
                ->select(
                    'b.nm_bangsal',
                    'b.kd_bangsal',
                    'k.kelas',
                    DB::raw("CAST(COUNT(k.kd_kamar) AS SIGNED) as total"),
                    DB::raw("CAST(SUM(k.status = 'ISI') AS SIGNED) as terisi"),
                    DB::raw("CAST(SUM(k.status = 'KOSONG') AS SIGNED) as kosong"),
                    DB::raw("CAST(SUM(k.status = 'DIBERSIHKAN') AS SIGNED) as dibersihkan"),
                    DB::raw("CAST(SUM(k.status = 'DIBOOKING') AS SIGNED) as dibooking"),
                    DB::raw("CAST(SUM(k.status = 'PERBAIKAN') AS SIGNED) as perbaikan"),
                    DB::raw("NOW() as last_update")
                )
                ->groupBy('b.nm_bangsal', 'b.kd_bangsal', 'k.kelas')
                ->orderBy('b.nm_bangsal')
                ->orderBy('k.kelas')
                ->get();

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            Log::error('Monitoring tempatTidur error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function startAntrol(Request $request): JsonResponse
    {
        try {
            $tanggal = $request->get('tanggal', now()->format('Y-m-d'));

            // ── GABUNGAN: MJKN + non-MJKN rawat jalan (exclude ranap)
            // Ini yang cocok dengan cara SIMRS Khanza hitung "Record" dan "Selesai"
            $gabungan = DB::select("
                SELECT 
                    COUNT(*) as total_record,
                    SUM(CASE WHEN no_rawat IS NOT NULL THEN 1 ELSE 0 END) as sudah_registrasi,
                    SUM(CASE WHEN no_rawat IS NULL THEN 1 ELSE 0 END) as belum_registrasi,
                    SUM(CASE WHEN status = 'Batal' THEN 1 ELSE 0 END) as batal,
                    SUM(CASE WHEN status = 'Checkin' THEN 1 ELSE 0 END) as checkin
                FROM (
                    SELECT no_rawat, status
                    FROM referensi_mobilejkn_bpjs
                    WHERE DATE(tanggalperiksa) = ?

                    UNION ALL

                    SELECT rp.no_rawat, 'Checkin' as status
                    FROM reg_periksa rp
                    WHERE DATE(rp.tgl_registrasi) = ?
                    AND rp.kd_pj = 'BPJ'
                    AND rp.kd_poli IS NOT NULL AND rp.kd_poli != ''
                    AND NOT EXISTS (
                        SELECT 1 FROM referensi_mobilejkn_bpjs rmb2
                        WHERE rmb2.norm = rp.no_rkm_medis
                        AND DATE(rmb2.tanggalperiksa) = ?
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM kamar_inap ki WHERE ki.no_rawat = rp.no_rawat
                    )
                ) as gabungan
            ", [$tanggal, $tanggal, $tanggal]);

            $g = $gabungan[0] ?? null;
            $totalAntrol    = (int)($g->total_record ?? 0);
            $sudahRegistrasi = (int)($g->sudah_registrasi ?? 0);
            $belumRegistrasi = (int)($g->belum_registrasi ?? 0);
            $totalBatal     = (int)($g->batal ?? 0);

            // MJKN only count
            $viaMjkn = DB::table('referensi_mobilejkn_bpjs')
                ->whereDate('tanggalperiksa', $tanggal)
                ->count();

            $mjknSelesai = DB::table('referensi_mobilejkn_bpjs')
                ->whereDate('tanggalperiksa', $tanggal)
                ->whereNotNull('no_rawat')
                ->count();

            $sepTerbit = DB::table('bridging_sep')->whereDate('tglsep', $tanggal)->count();
            $sepRalan  = DB::table('bridging_sep')->whereDate('tglsep', $tanggal)->where('jnspelayanan', '1')->count();
            $sepRanap  = DB::table('bridging_sep')->whereDate('tglsep', $tanggal)->where('jnspelayanan', '2')->count();

            // ── TASKID: status alur pelayanan (filter by reg_periksa.tgl_registrasi)
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
                    'total_antrol'      => $totalAntrol,       // MJKN + non-MJKN ralan
                    'sudah_registrasi'  => $sudahRegistrasi,   // = "Selesai" versi SIMRS
                    'belum_registrasi'  => $belumRegistrasi,   // = "Belum" versi SIMRS
                    'total_batal'       => $totalBatal,
                    'via_mjkn'          => $viaMjkn,           // hanya dari referensi_mobilejkn_bpjs
                    'mjkn_selesai'      => $mjknSelesai,       // MJKN yang sudah punya no_rawat
                    'sep_terbit'        => $sepTerbit,
                    'sep_ralan'         => $sepRalan,
                    'sep_ranap'         => $sepRanap,
                    // taskid breakdown (dari yang sudah registrasi)
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

    // ─────────────────────────────────────────
    // ANTROL PER TANGGAL — data dari API BPJS real-time
    // Digabung dengan data DB lokal untuk info tambahan (nama pasien, dll)
    // ─────────────────────────────────────────
    public function antrolPertanggal(Request $request): JsonResponse
    {
        try {
            $tanggal = $request->get('tanggal', now()->format('Y-m-d'));
            $search  = $request->get('search');
            $status  = $request->get('status');

            $bpjs = new BpjsAntreanService();

            // Hit API BPJS — ambil semua antrian per tanggal
            $apiResult = $bpjs->getAntreanByTanggal($tanggal);

            // Kalau API error / tidak ada data, fallback ke DB lokal
            if (empty($apiResult) || isset($apiResult['error'])) {
                return $this->antrolPertanggalFromDb($request);
            }

            // Ambil list antrian dari response API
            // Struktur response BPJS: { metaData: {...}, response: { list: [...] } }
            $listAntrian = $apiResult['response']['list']
                ?? $apiResult['response']
                ?? $apiResult['list']
                ?? [];

            if (empty($listAntrian)) {
                // Coba fallback DB jika API tidak return data
                return $this->antrolPertanggalFromDb($request);
            }

            // Enrich data API dengan info dari DB lokal (nama pasien, nm_poli, nm_dokter)
            // Ambil semua norm (no RM) dari API response untuk batch query
            $norms = collect($listAntrian)->pluck('norm')->filter()->unique()->values()->toArray();

            $pasienMap = [];
            if (!empty($norms)) {
                $pasienMap = \DB::table('pasien')
                    ->whereIn('no_rkm_medis', $norms)
                    ->pluck('nm_pasien', 'no_rkm_medis')
                    ->toArray();
            }

            // Ambil SEP yang sudah terbit
            $sepMap = \DB::table('bridging_sep')
                ->whereDate('tglsep', $tanggal)
                ->pluck('no_sep', 'no_rawat')
                ->toArray();

            // Ambil taskid terakhir dari DB
            $taskMap = \DB::select("
                SELECT t.no_rawat, t.taskid as last_taskid
                FROM referensi_mobilejkn_bpjs_taskid t
                INNER JOIN (
                    SELECT no_rawat, MAX(waktu) as max_waktu
                    FROM referensi_mobilejkn_bpjs_taskid
                    GROUP BY no_rawat
                ) lt ON t.no_rawat = lt.no_rawat AND t.waktu = lt.max_waktu
                INNER JOIN reg_periksa rp ON rp.no_rawat = t.no_rawat
                WHERE DATE(rp.tgl_registrasi) = ?
            ", [$tanggal]);
            $taskById = collect($taskMap)->pluck('last_taskid', 'no_rawat')->toArray();

            // Normalize data API ke format frontend
            // Field sesuai dokumentasi BPJS Antrean RS:
            // kodebooking, norekammedis, nokapst, noantrean, sumberdata,
            // estimasidilayani (ms timestamp), createdtime (ms timestamp), status (string)
            $normalized = collect($listAntrian)->map(function ($item) use ($pasienMap, $sepMap, $taskById) {
                $norm    = $item['norekammedis'] ?? $item['noRekamMedis'] ?? '';
                $noRawat = null; // API BPJS tidak return no_rawat, ambil dari DB via kodebooking

                // Convert timestamp ms ke jam HH:mm
                $estimasi = '-';
                if (!empty($item['estimasidilayani']) && is_numeric($item['estimasidilayani'])) {
                    $estimasi = date('H:i', (int)($item['estimasidilayani'] / 1000));
                }
                $createdTime = '-';
                if (!empty($item['createdtime']) && is_numeric($item['createdtime'])) {
                    $createdTime = date('Y-m-d H:i', (int)($item['createdtime'] / 1000));
                }

                // Map status BPJS ke status lokal
                $statusRaw = $item['status'] ?? '-';
                $statusMap = [
                    'Selesai dilayani' => 'Checkin',
                    'Belum dilayani'   => 'Belum',
                    'Batal'            => 'Batal',
                    'Checkin'          => 'Checkin',
                ];
                $status = $statusMap[$statusRaw] ?? $statusRaw;

                return [
                    'nobooking'        => $item['kodebooking'] ?? '-',
                    'no_rm'            => $norm,
                    'nama'             => $pasienMap[$norm] ?? '-',
                    'nomorkartu'       => $item['nokapst'] ?? '-',
                    'nik'              => $item['nik'] ?? '-',
                    'nohp'             => $item['nohp'] ?? '-',
                    'nm_poli'          => $item['kodepoli'] ?? '-',   // enrich dari DB jika perlu
                    'nm_dokter'        => (string)($item['kodedokter'] ?? '-'),
                    'jampraktek'       => $item['jampraktek'] ?? '-',
                    'tanggalperiksa'   => $item['tanggal'] ?? '-',
                    'nomorantrean'     => $item['noantrean'] ?? '-',
                    'angkaantrean'     => (int) preg_replace('/[^0-9]/', '', $item['noantrean'] ?? '0'),
                    'estimasidilayani' => $estimasi,
                    'jeniskunjungan'   => (string)($item['jeniskunjungan'] ?? '-'),
                    'nomorreferensi'   => $item['nomorreferensi'] ?? '-',
                    'sumber'           => $item['sumberdata'] ?? 'Mobile JKN',
                    'ispeserta'        => $item['ispeserta'] ?? 0,
                    'no_sep'           => $sepMap[$noRawat] ?? null,
                    'status'           => $status,
                    'status_raw'       => $statusRaw,   // status asli dari BPJS
                    'last_taskid'      => null,          // taskid dari DB via no_rawat (tidak tersedia dari API)
                    'waktu_booking'    => $createdTime,
                    'no_rawat'         => $noRawat,
                ];
            });

            // Filter search
            if ($search) {
                $s = strtolower($search);
                $normalized = $normalized->filter(function ($r) use ($s) {
                    return str_contains(strtolower($r['nama'] ?? ''), $s)
                        || str_contains(strtolower($r['no_rm'] ?? ''), $s)
                        || str_contains(strtolower($r['nobooking'] ?? ''), $s)
                        || str_contains(strtolower($r['nik'] ?? ''), $s)
                        || str_contains(strtolower($r['no_sep'] ?? ''), $s);
                });
            }

            // Filter status
            if ($status) {
                $normalized = $normalized->filter(fn($r) => ($r['status'] ?? '') === $status);
            }

            return response()->json([
                'success' => true,
                'source'  => 'api_bpjs',
                'data'    => $normalized->values(),
            ]);

        } catch (\Exception $e) {
            Log::error('Monitoring antrolPertanggal error', ['msg' => $e->getMessage()]);
            // Fallback ke DB jika exception
            return $this->antrolPertanggalFromDb($request);
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


}