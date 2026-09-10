<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AntrianPanggilanController extends Controller
{
    // Daftar loket yang tersedia — tambah/ubah di sini kalau perlu jenis loket baru
    private array $jenisLoket = [
        'A' => 'Umum',
        'B' => 'BPJS',
        'F' => 'Farmasi',
    ];

    // ═══════════════════════════════════════════════════════════════
    // AMBIL NOMOR BARU (dipanggil dari kios/tombol ambil nomor)
    // POST { prefix: "A" }
    // ═══════════════════════════════════════════════════════════════
    public function ambilNomor(Request $request): JsonResponse
    {
        try {
            $prefix = strtoupper($request->input('prefix'));
            if (!isset($this->jenisLoket[$prefix])) {
                return response()->json(['success' => false, 'message' => 'Jenis loket tidak dikenal'], 422);
            }

            $tanggal = now()->format('Y-m-d');

            $nomorTerakhir = DB::table('antrian_panggilan')
                ->where('tanggal', $tanggal)
                ->where('prefix', $prefix)
                ->max('nomor');

            $nomorBaru = ($nomorTerakhir ?? 0) + 1;

            $id = DB::table('antrian_panggilan')->insertGetId([
                'tanggal'     => $tanggal,
                'prefix'      => $prefix,
                'nomor'       => $nomorBaru,
                'label_loket' => $this->jenisLoket[$prefix],
                'status'      => 'menunggu',
                'created_at'  => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id'          => $id,
                    'kode'        => $prefix . $nomorBaru,
                    'prefix'      => $prefix,
                    'nomor'       => $nomorBaru,
                    'label_loket' => $this->jenisLoket[$prefix],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('AntrianPanggilan ambilNomor error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GENERATE BANYAK NOMOR SEKALIGUS (buat testing / seed data awal)
    // POST { prefix: "A", jumlah: 100 }
    // ═══════════════════════════════════════════════════════════════
    public function generateBanyak(Request $request): JsonResponse
    {
        try {
            $prefix = strtoupper($request->input('prefix'));
            $jumlah = min((int) $request->input('jumlah', 10), 500); // batas aman maksimal 500 sekali generate

            if (!isset($this->jenisLoket[$prefix])) {
                return response()->json(['success' => false, 'message' => 'Jenis loket tidak dikenal'], 422);
            }

            $tanggal = now()->format('Y-m-d');

            $nomorTerakhir = DB::table('antrian_panggilan')
                ->where('tanggal', $tanggal)
                ->where('prefix', $prefix)
                ->max('nomor') ?? 0;

            $rows = [];
            for ($i = 1; $i <= $jumlah; $i++) {
                $rows[] = [
                    'tanggal'     => $tanggal,
                    'prefix'      => $prefix,
                    'nomor'       => $nomorTerakhir + $i,
                    'label_loket' => $this->jenisLoket[$prefix],
                    'status'      => 'menunggu',
                    'created_at'  => now(),
                ];
            }

            DB::table('antrian_panggilan')->insert($rows);

            return response()->json([
                'success' => true,
                'message' => "$jumlah nomor $prefix berhasil dibuat (mulai dari {$prefix}" . ($nomorTerakhir + 1) . " sampai {$prefix}" . ($nomorTerakhir + $jumlah) . ')',
            ]);
        } catch (\Exception $e) {
            Log::error('AntrianPanggilan generateBanyak error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DAFTAR ANTRIAN MENUNGGU (buat panel petugas)
    // GET ?prefix=A  (opsional, kalau kosong tampilkan semua)
    // ═══════════════════════════════════════════════════════════════
    public function listMenunggu(Request $request): JsonResponse
    {
        try {
            $prefix  = strtoupper($request->get('prefix', ''));
            $tanggal = now()->format('Y-m-d');

            $query = DB::table('antrian_panggilan')
                ->where('tanggal', $tanggal)
                ->where('status', 'menunggu')
                ->orderBy('prefix')
                ->orderBy('nomor');

            if ($prefix) {
                $query->where('prefix', $prefix);
            }

            $rows = $query->get()->map(fn($r) => [
                'id'    => $r->id,
                'kode'  => $r->prefix . $r->nomor,
                'prefix'=> $r->prefix,
                'nomor' => $r->nomor,
            ]);

            return response()->json(['success' => true, 'data' => $rows]);
        } catch (\Exception $e) {
            Log::error('AntrianPanggilan listMenunggu error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PANGGIL NOMOR BERIKUTNYA (tombol "Panggil Berikutnya" di panel petugas)
    // POST { prefix: "A", loket: "Loket 1" }
    // Otomatis ambil nomor menunggu paling kecil buat prefix itu.
    // ═══════════════════════════════════════════════════════════════
    public function panggilBerikutnya(Request $request): JsonResponse
    {
        try {
            $prefix = strtoupper($request->input('prefix'));
            $loket  = $request->input('loket', 'Loket');
            $tanggal = now()->format('Y-m-d');

            $antrian = DB::table('antrian_panggilan')
                ->where('tanggal', $tanggal)
                ->where('prefix', $prefix)
                ->where('status', 'menunggu')
                ->orderBy('nomor')
                ->first();

            if (!$antrian) {
                return response()->json(['success' => false, 'message' => 'Tidak ada antrian menunggu untuk loket ini'], 404);
            }

            DB::table('antrian_panggilan')->where('id', $antrian->id)->update([
                'status'       => 'dipanggil',
                'loket'        => $loket,
                'dipanggil_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id'     => $antrian->id,
                    'kode'   => $antrian->prefix . $antrian->nomor,
                    'loket'  => $loket,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('AntrianPanggilan panggilBerikutnya error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PANGGIL ULANG (nomor yang sama, kalau pasien belum masuk)
    // POST { id: 123 }
    // ═══════════════════════════════════════════════════════════════
    public function panggilUlang(Request $request): JsonResponse
    {
        try {
            $id = $request->input('id');
            $row = DB::table('antrian_panggilan')->where('id', $id)->first();

            if (!$row) {
                return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
            }

            DB::table('antrian_panggilan')->where('id', $id)->update(['dipanggil_at' => now()]);

            return response()->json([
                'success' => true,
                'data' => ['id' => $row->id, 'kode' => $row->prefix . $row->nomor, 'loket' => $row->loket],
            ]);
        } catch (\Exception $e) {
            Log::error('AntrianPanggilan panggilUlang error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TANDAI SELESAI (pasien sudah dilayani, keluar dari daftar aktif)
    // POST { id: 123 }
    // ═══════════════════════════════════════════════════════════════
    public function selesai(Request $request): JsonResponse
    {
        try {
            $id = $request->input('id');
            DB::table('antrian_panggilan')->where('id', $id)->update(['status' => 'selesai']);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('AntrianPanggilan selesai error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // DATA UNTUK LAYAR PUBLIK (di-poll tiap beberapa detik)
    // Balikin: nomor yang sedang dipanggil per loket + riwayat 8 panggilan terakhir
    // ═══════════════════════════════════════════════════════════════
    public function display(Request $request): JsonResponse
    {
        try {
            $tanggal = now()->format('Y-m-d');
            $loketFilter = $request->get('loket'); // opsional — kalau diisi, cuma tampilkan panggilan loket itu

            $queryDipanggil = DB::table('antrian_panggilan')
                ->where('tanggal', $tanggal)
                ->where('status', 'dipanggil')
                ->orderBy('dipanggil_at', 'desc');

            $queryRiwayat = DB::table('antrian_panggilan')
                ->where('tanggal', $tanggal)
                ->whereIn('status', ['dipanggil', 'selesai'])
                ->orderBy('dipanggil_at', 'desc')
                ->limit(8);

            if ($loketFilter) {
                $queryDipanggil->where('loket', $loketFilter);
                $queryRiwayat->where('loket', $loketFilter);
            }

            $rowsDipanggil = $queryDipanggil->get();

            // Kalau filter per loket: cuma 1 nomor (nomor terbaru loket itu).
            // Kalau tanpa filter (layar gabungan semua loket): 1 nomor terbaru per prefix.
            $sedangDipanggil = ($loketFilter ? $rowsDipanggil->take(1) : $rowsDipanggil->unique('prefix'))
                ->map(fn($r) => [
                    'id' => $r->id, 'kode' => $r->prefix . $r->nomor,
                    'prefix' => $r->prefix, 'label_loket' => $r->label_loket,
                    'loket' => $r->loket, 'dipanggil_at' => $r->dipanggil_at,
                ])
                ->values();

            $riwayat = $queryRiwayat->get()->map(fn($r) => [
                'kode' => $r->prefix . $r->nomor, 'loket' => $r->loket,
                'dipanggil_at' => $r->dipanggil_at,
            ]);

            return response()->json([
                'success' => true,
                'sedang_dipanggil' => $sedangDipanggil,
                'riwayat' => $riwayat,
            ]);
        } catch (\Exception $e) {
            Log::error('AntrianPanggilan display error', ['msg' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}