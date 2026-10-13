<?php
declare(strict_types=1);

require __DIR__ . '/src/config.php';
require __DIR__ . '/src/http.php';
require __DIR__ . '/src/auth.php';
require __DIR__ . '/src/state.php';
require __DIR__ . '/src/inventory.php';
require __DIR__ . '/src/orders.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = config('APP_ORIGIN', 'http://127.0.0.1:5173');
if ($origin === $allowed) {
    header('Access-Control-Allow-Origin: ' . $allowed);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

try {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $offset = strpos($path, '/api');
    ensure($offset !== false, 'Ruta no encontrada.', 404);
    $path = substr($path, $offset + 4) ?: '/';
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET' && $path === '/health') json(['ok' => true, 'service' => 'PharmaFlow']);
    if ($method === 'POST' && $path === '/auth/login') json(signIn(body()));
    if ($method === 'POST' && $path === '/auth/register') json(signUp(body()), 201);
    $user = currentUser();
    if ($method === 'GET' && $path === '/auth/me') json(['user' => $user]);
    if ($method === 'POST' && $path === '/auth/logout') { signOut(); json(['ok' => true]); }
    if ($method === 'GET' && $path === '/state') json(['state' => state($user)]);
    $resources = ['inventory' => 'stock', 'drugs' => 'drugs', 'orders' => 'orders', 'branches' => 'branches', 'events' => 'events'];
    if ($method === 'GET' && isset($resources[ltrim($path, '/')])) {
        if ($path === '/events') staff($user);
        $key = $resources[ltrim($path, '/')]; json([$key => state($user)[$key]]);
    }
    if ($method === 'PATCH' && preg_match('#^/stock/(\d+)$#', $path, $m)) adjust($user, (int) $m[1], body());
    elseif ($method === 'POST' && preg_match('#^/stock/(\d+)/transfer$#', $path, $m)) transfer($user, (int) $m[1], body());
    elseif ($method === 'POST' && $path === '/stock/import') importStock($user, body());
    elseif ($method === 'POST' && $path === '/drugs') addDrug($user, body());
    elseif ($method === 'PATCH' && preg_match('#^/branches/(\d+)$#', $path, $m)) editBranch($user, (int) $m[1], body());
    elseif ($method === 'POST' && $path === '/orders') reserve($user, body());
    elseif ($method === 'POST' && preg_match('#^/orders/(\d+)/(cancel|review|dispatch)$#', $path, $m)) changeOrder($user, (int) $m[1], $m[2], body());
    else throw new ApiError('Ruta no encontrada.', 404);
    json(['state' => state($user)], $method === 'POST' && in_array($path, ['/orders', '/drugs']) ? 201 : 200);
} catch (ApiError $error) {
    json(['error' => $error->getMessage()], $error->status);
} catch (PDOException $error) {
    error_log($error->getMessage());
    if ($error->getCode() === '23000') json(['error' => 'El registro ya existe o tiene referencias inválidas.'], 409);
    json(['error' => 'No fue posible acceder a la base de datos. Verifica la configuración y vuelve a intentar.'], 503);
} catch (Throwable $error) {
    error_log($error->getMessage());
    json(['error' => 'No fue posible completar la operación.'], 500);
}
