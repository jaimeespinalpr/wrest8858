<?php
$env = fn (string $key, $fallback = null) => getenv($key) ?: $fallback;

$driver = $env('WPL_DB_DRIVER', 'mysql');
$driver = strtolower($driver) === 'sqlite' ? 'sqlite' : 'mysql';

$config = [
  'driver' => $driver,
  'cookie_secure' => $env('WPL_COOKIE_SECURE', 'true') !== 'false',
  'cookie_domain' => $env('WPL_COOKIE_DOMAIN', ''),
];

if ($driver === 'sqlite') {
  $dataDir = __DIR__ . '/data';
  $defaultPath = $dataDir . '/wpl.sqlite';
  $config['sqlite_path'] = $env('WPL_SQLITE_PATH', $defaultPath);
  $config['sqlite_schema'] = $env('WPL_SQLITE_SCHEMA', __DIR__ . '/schema-sqlite.sql');
} else {
  $config += [
    'db_host' => $env('WPL_DB_HOST', '195.179.239.0'),
    'db_name' => $env('WPL_DB_NAME', 'u467534899_wrestling'),
    'db_user' => $env('WPL_DB_USER', 'u467534899_jaimeespinalpr'),
    'db_pass' => $env('WPL_DB_PASS', 'Elvacan17#'),
    'db_charset' => $env('WPL_DB_CHARSET', 'utf8mb4')
  ];
}

return $config;
