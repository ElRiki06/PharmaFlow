<?php
declare(strict_types=1);

function publicUser(array $row): array
{
    return ['id' => (int) $row['id'], 'name' => $row['name'], 'email' => $row['email'], 'role' => $row['role'], 'dui' => $row['dui'], 'phone' => $row['phone']];
}

function currentUser(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    ensure(preg_match('/^Bearer ([a-f0-9]{64})$/', $header, $match) === 1, 'Inicia sesión para continuar.', 401);
    $row = query('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()', [hash('sha256', $match[1])])->fetch();
    ensure((bool) $row, 'La sesión expiró. Inicia sesión nuevamente.', 401);
    return publicUser($row);
}

function signIn(array $data): array
{
    $email = strtolower(text($data, 'email', 5, 190));
    $password = text($data, 'password', 1, 128);
    $row = query('SELECT * FROM users WHERE email = ?', [$email])->fetch();
    // Hash ficticio evita revelar cuentas existentes por tiempo de respuesta.
    $hash = $row['password'] ?? '$2y$10$co5PXtva7Fn931DWCTzmSO8FnGoTToWKhfO5RS24VuvlLRUWdWjDe';
    $valid = password_verify($password, $hash);
    ensure($row && $valid, 'Credenciales incorrectas.', 401);
    ensure($row['role'] !== 'employee' || employee($row), 'Cuenta de empleado inválida.', 403);
    $token = bin2hex(random_bytes(32));
    $hours = max(1, min(24, (int) config('TOKEN_HOURS', '8')));
    query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()');
    query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [hash('sha256', $token), $row['id'], gmdate('Y-m-d H:i:s', time() + $hours * 3600)]);
    return ['user' => publicUser($row), 'token' => $token];
}

function signUp(array $data): array
{
    $name = text($data, 'name', 3, 100);
    $email = strtolower(text($data, 'email', 5, 190));
    ensure(filter_var($email, FILTER_VALIDATE_EMAIL) !== false, 'Correo inválido.');
    ensure(!preg_match('/@farmacia\.com$/i', $email), 'Las cuentas de empleados las crea el administrador.');
    $password = text($data, 'password', 8, 128);
    ensure(preg_match('/[A-Za-z]/', $password) === 1 && preg_match('/\d/', $password) === 1, 'La contraseña debe incluir letras y números.');
    ensure(!query('SELECT id FROM users WHERE email = ?', [$email])->fetch(), 'El correo ya está registrado.', 409);
    query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [$name, $email, password_hash($password, PASSWORD_BCRYPT), 'client']);
    return signIn(['email' => $email, 'password' => $password]);
}

function signOut(): void
{
    $token = substr($_SERVER['HTTP_AUTHORIZATION'] ?? '', 7);
    query('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $token)]);
}
