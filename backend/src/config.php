<?php
declare(strict_types=1);

function config(string $key, string $fallback = ''): string
{
    static $values = null;
    if ($values === null) {
        $file = dirname(__DIR__) . '/.env';
        $values = is_file($file) ? (parse_ini_file($file, false, INI_SCANNER_RAW) ?: []) : [];
    }
    $value = getenv($key);
    return $value !== false ? $value : (string) ($values[$key] ?? $fallback);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', config('DB_HOST', '127.0.0.1'), config('DB_PORT', '3306'), config('DB_NAME', 'pharmaflow'));
        $pdo = new PDO($dsn, config('DB_USER', 'root'), config('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}

function query(string $sql, array $params = []): PDOStatement
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function transaction(callable $work): mixed
{
    db()->beginTransaction();
    try {
        $result = $work();
        db()->commit();
        return $result;
    } catch (Throwable $error) {
        if (db()->inTransaction()) db()->rollBack();
        throw $error;
    }
}
