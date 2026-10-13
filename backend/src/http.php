<?php
declare(strict_types=1);

final class ApiError extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 422) { parent::__construct($message); }
}

function ensure(bool $ok, string $message, int $status = 422): void
{
    if (!$ok) throw new ApiError($message, $status);
}

function json(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function body(): array
{
    ensure((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) <= 3000000, 'Solicitud demasiado grande.', 413);
    try { $data = json_decode(file_get_contents('php://input'), true, 64, JSON_THROW_ON_ERROR); }
    catch (JsonException) { throw new ApiError('JSON inválido.', 400); }
    ensure(is_array($data), 'Se esperaba un objeto JSON.', 400);
    return $data;
}

function text(array $data, string $key, int $min = 1, int $max = 200): string
{
    $value = $data[$key] ?? null;
    ensure(is_string($value), "Campo $key inválido.");
    $value = trim($value);
    ensure(strlen($value) >= $min && strlen($value) <= $max, "Campo $key debe tener entre $min y $max caracteres.");
    return $value;
}

function countValue(array $data, string $key, int $min = 1): int
{
    $value = $data[$key] ?? null;
    ensure(is_int($value) && $value >= $min && $value <= 1000000, "Cantidad inválida en $key.");
    return $value;
}

function employee(array $user): bool
{
    return $user['role'] === 'employee' && preg_match('/^[^@\s]+@farmacia\.com$/i', $user['email']) === 1;
}

function staff(array $user): void { ensure(employee($user), 'No tienes permiso para esta operación.', 403); }

function activeBranch(int $id): void
{
    ensure((bool) query('SELECT id FROM branches WHERE id = ? AND active = 1 FOR UPDATE', [$id])->fetch(), 'Selecciona una sede activa.');
}

function event(array $user, int $branch, string $title, string $detail = '', string $kind = 'info'): void
{
    query('INSERT INTO events (user_id, branch_id, title, detail, kind) VALUES (?, ?, ?, ?, ?)', [$user['id'], $branch, $title, $detail . ' · ' . $user['name'], $kind]);
}
