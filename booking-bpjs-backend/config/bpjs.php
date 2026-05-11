<?php

return [

    // VClaim
    'vclaim_url'        => env('BPJS_VCLAIM_URL', 'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev'),
    'vclaim_cons_id'    => env('BPJS_VCLAIM_CONS_ID'),
    'vclaim_secret_key' => env('BPJS_VCLAIM_SECRET_KEY'),
    'vclaim_user_key'   => env('BPJS_VCLAIM_USER_KEY'),

    // Antrean RS
    'antrean_url'        => env('BPJS_ANTREAN_URL', 'https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev'),
    'antrean_cons_id'    => env('BPJS_ANTREAN_CONS_ID'),
    'antrean_secret_key' => env('BPJS_ANTREAN_SECRET_KEY'),
    'antrean_user_key'   => env('BPJS_ANTREAN_USER_KEY'),
];