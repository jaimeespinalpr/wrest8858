<?php
// db.php
declare(strict_types=1);

function parse_sqlite_statements(string $schemaPath): array
{
    if (!is_file($schemaPath)) {
        return [];
    }
    $raw = file_get_contents($schemaPath);
    if ($raw === false) {
        return [];
    }
    $parts = array_filter(array_map('trim', explode(';', str_replace(["\r\n", "\r"], "\n", $raw))));
    return array_values($parts);
}

function run_sqlite_schema(PDO $pdo, string $schemaPath): void
{
    static $ran = [];
    if (isset($ran[$schemaPath]) || !is_file($schemaPath)) {
        return;
    }
    $statements = parse_sqlite_statements($schemaPath);
    foreach ($statements as $statement) {
        if ($statement === '') {
            continue;
        }
        $pdo->exec($statement);
    }
    $ran[$schemaPath] = true;
}

function ensure_directory(string $path): void
{
    if (is_dir($path)) {
        return;
    }
    mkdir($path, 0755, true);
}

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';
    $driver = $config['driver'] ?? 'mysql';

    if ($driver === 'sqlite') {
        $sqlitePath = $config['sqlite_path'] ?? (__DIR__ . '/data/wpl.sqlite');
        $dir = dirname($sqlitePath);
        ensure_directory($dir);

        $dsn = "sqlite:{$sqlitePath}";
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

        $schemaPath = $config['sqlite_schema'] ?? (__DIR__ . '/schema-sqlite.sql');
        $pdo->exec('PRAGMA foreign_keys = ON');
        run_sqlite_schema($pdo, $schemaPath);
        return $pdo;
    }

    $host = $config['db_host'];
    $dbname = $config['db_name'];
    $user = $config['db_user'];
    $pass = $config['db_pass'];
    $charset = $config['db_charset'] ?? 'utf8mb4';

    $dsn = "mysql:host={$host};dbname={$dbname};charset={$charset}";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}
