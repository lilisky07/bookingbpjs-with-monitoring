<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AntreanListController;
use App\Http\Controllers\Api\PublicAntreanController;
use App\Http\Controllers\Api\MonitoringController;
use App\Http\Controllers\Api\AdminwablasController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/



// ─── ANTREAN PUBLIK (TANPA AUTENTIKASI) ─────────────────────────────
    Route::get('/antrean/public-list', [PublicAntreanController::class, 'list']);
    Route::post('/antrean/ambil', [PublicAntreanController::class, 'ambilAntrean']);
    Route::get('/antrean/cek', [PublicAntreanController::class, 'cekAntrean']);
    Route::get('/antrean/sisakuota', [PublicAntreanController::class, 'sisaKuota']); 
    Route::get('/antrean/poli-list', [PublicAntreanController::class, 'getPoliList']);

    Route::get('/antrean/detail', [PublicAntreanController::class, 'getDetailAntrean']);
    Route::get('/antrean/dokter-list', [PublicAntreanController::class, 'getDokterList']);

    // ─── MONITORING KEPATUHAN BPJS ───────────────────────────────────
    Route::prefix('monitoring')->group(function () {
        Route::get('/tempat-tidur',   [MonitoringController::class, 'tempatTidur']);
        Route::get('/start-antrol',   [MonitoringController::class, 'startAntrol']);
        Route::get('/detail-antrol',  [MonitoringController::class, 'detailAntrol']);
        Route::get('/sep-vclaim',     [MonitoringController::class, 'sepVclaim']);
        Route::get('/surat-kontrol',  [MonitoringController::class, 'suratKontrol']);
        Route::get('/jadwal-operasi', [MonitoringController::class, 'jadwalOperasi']);
        Route::get('/antrol-pertanggal', [MonitoringController::class, 'antrolPertanggal']);
        Route::get('/bor', [MonitoringController::class, 'borDashboard']);
        Route::post('/sync-taskid', [MonitoringController::class, 'syncTaskId']);
        Route::get('/taskid/{nobooking}', [MonitoringController::class, 'getTaskId']);
        Route::get('/test-bpjs', function() {
    $service = new \App\Services\BpjsAntreanService();
    $result = $service->getAntreanByTanggal('2026-05-07');
    return response()->json($result);
});
    });

    // ─── ADMIN WABLAS ───────────────────────────────────────────────
    Route::prefix('wablas')->group(function () {
    Route::get  ('/config',        [AdminwablasController::class, 'getConfig']);
    Route::post ('/config',        [AdminwablasController::class, 'saveConfig']);
    Route::post ('/ping',          [AdminwablasController::class, 'ping']);
    Route::post ('/test-send',     [AdminwablasController::class, 'testSend']);
    Route::get  ('/sessions',      [AdminwablasController::class, 'sessions']);
    Route::delete('/sessions/{id}',[AdminwablasController::class, 'deleteSession']);
    Route::get  ('/stats',         [AdminwablasController::class, 'stats']);
    Route::post ('/trigger',       [AdminwablasController::class, 'trigger']);
});


    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    // Route::get('/antrean/poli', [AntreanController::class, 'poli']);
    Route::get('/antrean/list', [AntreanListController::class, 'index']);

});

Route::get('/test-db', function () {
  try {
    DB::connection()->getPdo();
    return 'Koneksi DB sukses!';
  } catch (\Exception $e) {
    return 'Koneksi gagal: ' . $e->getMessage();
  }
});


