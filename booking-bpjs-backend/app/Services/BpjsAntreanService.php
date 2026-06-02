<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BpjsAntreanService
{
    private string $baseUrl;
    private string $consId;
    private string $secretKey;
    private string $userKey;

    public function __construct()
    {
        $this->baseUrl   = rtrim(config('bpjs.antrean_url'), '/');
        $this->consId    = config('bpjs.antrean_cons_id');
        $this->secretKey = config('bpjs.antrean_secret_key');
        $this->userKey   = config('bpjs.antrean_user_key');
    }

    // ─── Auth headers HMAC-SHA256 ────────────────────────────────────
    private function getHeaders(): array
    {
        $timestamp = (string) (time() - strtotime('1970-01-01 00:00:00'));

        $signature = base64_encode(
            hash_hmac(
                'sha256',
                $this->consId . '&' . $timestamp,
                $this->secretKey,
                true
            )
        );

        return [
            'headers' => [
                'X-cons-id'    => $this->consId,
                'X-timestamp'  => $timestamp,
                'X-signature'  => $signature,
                'user_key'     => $this->userKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ],
            'timestamp' => $timestamp
        ];
    }

    // ─── Dekripsi BPJS AES-256-CBC ──────────────────────────────────
    // Formula mengikuti Mobile JKN / Khanza:
    // key = SHA256(consid + secretKey + timestamp)
    public function decrypt(string $encryptedData, string $timestamp): ?array
    {
        try {

            $key = $this->consId . $this->secretKey . $timestamp;

            $keyHash = hex2bin(hash('sha256', $key));

            $iv = substr($keyHash, 0, 16);

            $decoded = base64_decode($encryptedData);

            $decrypted = openssl_decrypt(
                $decoded,
                'AES-256-CBC',
                $keyHash,
                OPENSSL_RAW_DATA,
                $iv
            );

            if ($decrypted === false) {

                Log::error('BPJS decrypt failed', [
                    'sample' => substr($encryptedData, 0, 50)
                ]);

                return null;
            }

            // ── Handle kemungkinan compressed response ───────────────
           // Decompress LZ-string (wajib untuk response BPJS)
$jsonString = \LZCompressor\LZString::decompressFromEncodedURIComponent($decrypted);

if (!$jsonString) {
    Log::warning('BPJS lzstring decompress failed, trying raw');
    $jsonString = $decrypted;
}

            $json = json_decode($jsonString, true);

            if (json_last_error() !== JSON_ERROR_NONE) {

                Log::warning('BPJS decrypt JSON invalid', [
                    'error' => json_last_error_msg()
                ]);

                return null;
            }

            return $json;

        } catch (\Exception $e) {

            Log::error('BPJS decrypt exception', [
                'msg' => $e->getMessage()
            ]);

            return null;
        }
    }

    // ─── GET request ─────────────────────────────────────────────────
    private function get(string $path): array
    {
        try {

            $auth = $this->getHeaders();

            $url = $this->baseUrl . $path;

            Log::info('BPJS FULL URL', [
                'url' => $url
            ]);

            $response = Http::withHeaders($auth['headers'])
                ->timeout(15)
                ->get($url);

            // ── Error handling ────────────────────────────────────────
            if (!$response->successful()) {

                Log::error('BPJS API error', [
                    'path'   => $path,
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return [
                    'error'  => $response->body(),
                    'status' => $response->status()
                ];
            }

            $json = $response->json();

            // ── Response encrypted ────────────────────────────────────
            if (
                isset($json['response']) &&
                is_string($json['response'])
            ) {

                $decrypted = $this->decrypt(
                    $json['response'],
                    $auth['timestamp']
                );

                if ($decrypted !== null) {

                    return array_merge($json, [
                        'response' => $decrypted
                    ]);
                }

                // fallback raw response
                return $json;
            }

            return $json ?? [];

        } catch (\Exception $e) {

            Log::error('BPJS API exception', [
                'msg' => $e->getMessage()
            ]);

            return [
                'error' => $e->getMessage()
            ];
        }
    }

    // ─── Antrian per tanggal ─────────────────────────────────────────
    // GET /antrean/pendaftaran/tanggal/{tanggal}
    public function getAntreanByTanggal(string $tanggal): array
    {
        {
    $result = $this->get("/antrean/pendaftaran/tanggal/{$tanggal}");
    Log::info('BPJS getAntreanByTanggal', [
        'code'     => $result['metadata']['code'] ?? null,
        'is_array' => is_array($result['response'] ?? null),
        'count'    => is_array($result['response'] ?? null) ? count($result['response']) : 'bukan array',
    ]);
    return $result;
}

    }

    // ─── Antrian per tanggal + poli + dokter ────────────────────────
    public function getAntreanByPoliDokter(
        string $tanggal,
        string $kodePoli,
        string $kodeDokter
    ): array {
        return $this->get(
            "/antrean/pendaftaran/tanggal/{$tanggal}/{$kodePoli}/{$kodeDokter}"
        );
    }

    // ─── Status antrean per booking ─────────────────────────────────
    public function getStatusAntrean(string $noBooking): array
    {
        return $this->get(
            "/antrean/status/{$noBooking}"
        );
    }
    // ─── List waktu task id per booking ─────────────────────────────
// POST /antrean/getlisttask
public function getListTask(string $kodebooking): array
{
    try {
        $auth = $this->getHeaders();

        $response = Http::withHeaders($auth['headers'])
            ->timeout(15)
            ->post($this->baseUrl . '/antrean/getlisttask', [
                'kodebooking' => $kodebooking
            ]);

        if (!$response->successful()) {
            return ['error' => $response->body(), 'status' => $response->status()];
        }

        $json = $response->json();

        if (isset($json['response']) && is_string($json['response'])) {
            $decrypted = $this->decrypt($json['response'], $auth['timestamp']);
            if ($decrypted !== null) {
                return array_merge($json, ['response' => $decrypted]);
            }
        }

        return $json ?? [];

    } catch (\Exception $e) {
        Log::error('BPJS getListTask exception', ['msg' => $e->getMessage()]);
        return ['error' => $e->getMessage()];
    }
}
}