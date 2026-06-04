<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WaConversationState;
use App\Models\NpsUlasan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class AdminWablasController extends Controller
{
    public function getConfig()
    {
        return response()->json([
            'wablas_url'    => config('wablas.url',    'https://jogja.wablas.com'),
            'wablas_token'  => config('wablas.token',  ''),
            'wablas_secret' => config('wablas.secret', ''),
            'no_gcare'      => config('wablas.no_gcare',      ''),
            'no_pendaftaran'=> config('wablas.no_pendaftaran', ''),
            'jadwal_img_url'=> config('wablas.jadwal_img_url', ''),
            'reminder_aktif'=> config('wablas.reminder_aktif', true),
            'nps_aktif'     => config('wablas.nps_aktif', true),
        ]);
    }

    public function saveConfig(Request $request)
    {
        $data = $request->validate([
            'wablas_url'     => 'required|url',
            'wablas_token'   => 'required|string',
            'wablas_secret'  => 'required|string',
            'no_gcare'       => 'required|string',
            'no_pendaftaran' => 'required|string',
            'jadwal_img_url' => 'nullable|url',
            'reminder_aktif' => 'boolean',
            'nps_aktif'      => 'boolean',
        ]);

        $this->updateEnv([
            'WABLAS_URL'            => $data['wablas_url'],
            'WABLAS_TOKEN'          => $data['wablas_token'],
            'WABLAS_SECRET'         => $data['wablas_secret'],
            'WABLAS_NO_GCARE'       => $data['no_gcare'],
            'WABLAS_NO_PENDAFTARAN' => $data['no_pendaftaran'],
            'WABLAS_JADWAL_IMG'     => $data['jadwal_img_url'] ?? '',
            'WABLAS_REMINDER_AKTIF' => $data['reminder_aktif'] ? 'true' : 'false',
            'WABLAS_NPS_AKTIF'      => $data['nps_aktif'] ? 'true' : 'false',
        ]);

        Artisan::call('config:clear');

        return response()->json(['message' => 'Konfigurasi berhasil disimpan']);
    }

    public function ping()
    {
        $url    = config('wablas.url', 'https://jogja.wablas.com');
        $token  = config('wablas.token');
        $secret = config('wablas.secret');

        try {
            $res = Http::timeout(5)->withHeaders([
                'Authorization' => $token,
                'secret-key'    => $secret,
            ])->get($url . '/api/device/info');

            if ($res->successful()) {
                return response()->json(['message' => 'Wablas terhubung (' . $res->status() . ')']);
            }

            return response()->json(['message' => 'Respon tidak OK: ' . $res->status()], 502);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal terhubung: ' . $e->getMessage()], 503);
        }
    }

    public function testSend(Request $request)
    {
        $request->validate([
            'phone'   => 'required|string',
            'message' => 'required|string',
        ]);

        $url    = config('wablas.url', 'https://jogja.wablas.com') . '/api/send-message';
        $token  = config('wablas.token');
        $secret = config('wablas.secret');

        try {
            $res = Http::withHeaders([
                'Authorization' => $token,
                'secret-key'    => $secret,
            ])->post($url, [
                'phone'   => $request->phone,
                'message' => $request->message,
            ]);

            if ($res->successful()) {
                return response()->json(['message' => 'Pesan berhasil dikirim']);
            }

            return response()->json(['message' => 'Gagal kirim: ' . $res->body()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function sessions()
    {
        $data = WaConversationState::query()
            ->orderByDesc('updated_at')
            ->get([
                'id','phone','state','nm_pasien','nm_poli',
                'nm_dokter','tgl_rencana','expires_at','updated_at'
            ]);

        return response()->json(['data' => $data]);
    }

    public function deleteSession($id)
    {
        $s = WaConversationState::findOrFail($id);
        $s->delete();
        return response()->json(['message' => 'Session dihapus']);
    }

    public function stats()
    {
        $activeSessions = WaConversationState::count();
        $npsToday       = NpsUlasan::whereDate('created_at', today())->count();

        // Hitung reminder terkirim hari ini dari wa_surkon_sent
        $reminderToday = DB::table('wa_surkon_sent')
            ->whereDate('created_at', today())
            ->count();

        return response()->json([
            'active_sessions'   => $activeSessions,
            'reminder_h3_today' => $reminderToday,
            'reminder_h1_today' => 0,
            'nps_today'         => $npsToday,
        ]);
    }

    // ─── Trigger artisan command — synchronous, return output ─────────
    public function trigger(Request $request)
    {
        $allowed = [
            'reminder:harian',
            'reminder:surkon',
            'nps:kirim',
        ];

        $cmd = $request->input('command');

        if (!in_array($cmd, $allowed)) {
            return response()->json(['message' => 'Command tidak diizinkan'], 403);
        }

        try {
            Artisan::call($cmd);
            $output = Artisan::output();

            // Simpan log ke file juga
            $logFile = storage_path('logs/trigger-' . str_replace(':', '-', $cmd) . '.log');
            file_put_contents(
                $logFile,
                '[' . now() . '] ' . $cmd . PHP_EOL . $output . PHP_EOL,
                FILE_APPEND
            );

            return response()->json([
                'message' => "Command '{$cmd}' selesai dijalankan.",
                'output'  => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal: ' . $e->getMessage()], 500);
        }
    }

    private function updateEnv(array $data): void
    {
        $envPath = base_path('.env');
        $env     = file_get_contents($envPath);

        foreach ($data as $key => $value) {
            $val = strpos($value, ' ') !== false ? "\"{$value}\"" : $value;

            if (preg_match("/^{$key}=.*/m", $env)) {
                $env = preg_replace("/^{$key}=.*/m", "{$key}={$val}", $env);
            } else {
                $env .= PHP_EOL . "{$key}={$val}";
            }
        }

        file_put_contents($envPath, $env);
    }
}