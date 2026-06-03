<?php

// config/wablas.php
// Tambahkan file ini ke folder config/

return [

    'url'    => env('WABLAS_URL',    'https://jogja.wablas.com'),
    'token'  => env('WABLAS_TOKEN',  ''),
    'secret' => env('WABLAS_SECRET', ''),

    'no_gcare'       => env('WABLAS_NO_GCARE',       '628117978776'),
    'no_pendaftaran' => env('WABLAS_NO_PENDAFTARAN',  '6281373550684'),
    'jadwal_img_url' => env('WABLAS_JADWAL_IMG',      ''),

    'reminder_aktif' => env('WABLAS_REMINDER_AKTIF', true),
    'nps_aktif'      => env('WABLAS_NPS_AKTIF',      true),

];