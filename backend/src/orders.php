<?php
declare(strict_types=1);

function reserve(array $user, array $data): void
{
    $branch = countValue($data, 'branchId');
    $items = $data['items'] ?? [];
    ensure(is_array($items) && count($items) > 0 && count($items) <= 50, 'Añade entre 1 y 50 medicamentos.');
    $grouped = [];
    foreach ($items as $item) {
        ensure(is_array($item), 'Producto inválido.');
        $id = countValue($item, 'stockId');
        $grouped[$id] = ($grouped[$id] ?? 0) + countValue($item, 'quantity');
        ensure($grouped[$id] <= 1000000, 'Cantidad inválida.');
    }
    ksort($grouped);
    transaction(function () use ($user, $data, $branch, $grouped) {
        activeBranch($branch);
        $rx = false; $controlled = false; $rows = [];
        foreach ($grouped as $id => $quantity) {
            $row = query('SELECT s.*, d.price, d.rx, d.controlled FROM stock s JOIN drugs d ON d.id = s.drug_id WHERE s.id = ? FOR UPDATE', [$id])->fetch();
            ensure($row && (int) $row['branch_id'] === $branch, 'Todos los productos deben pertenecer a la sede de retiro.');
            ensure($row['expiry'] >= gmdate('Y-m-d'), 'El lote está vencido.');
            ensure((int) $row['quantity'] >= $quantity, 'No hay suficientes existencias.', 409);
            $rx = $rx || (bool) $row['rx']; $controlled = $controlled || (bool) $row['controlled'];
            $rows[] = $row + ['count' => $quantity];
        }
        if ($rx) {
            $image = $data['image'] ?? '';
            ensure(is_string($image) && preg_match('/^data:image\/(png|jpeg|webp);base64,(.+)$/s', $image, $match) === 1, 'Adjunta una receta en PNG, JPG o WebP.');
            $binary = base64_decode($match[2], true);
            ensure($binary !== false && strlen($binary) <= 2097152, 'La receta debe pesar como máximo 2 MB.');
            $info = @getimagesizefromstring($binary);
            ensure($info !== false && in_array($info['mime'], ['image/png', 'image/jpeg', 'image/webp'], true), 'La receta no contiene una imagen válida.');
        }
        $code = 'PF-' . strtoupper(bin2hex(random_bytes(6)));
        query('INSERT INTO orders (user_id, patient, dui, phone, branch_id, status, priority, pickup_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$user['id'], $user['name'], $user['dui'], $user['phone'], $branch, $rx ? 'pending' : 'ready', $controlled ? 'high' : 'normal', $code]);
        $orderId = (int) db()->lastInsertId();
        foreach ($rows as $row) {
            query('UPDATE stock SET quantity = quantity - ? WHERE id = ?', [$row['count'], $row['id']]);
            query('INSERT INTO items (order_id, stock_id, drug_id, quantity, price) VALUES (?, ?, ?, ?, ?)', [$orderId, $row['id'], $row['drug_id'], $row['count'], $row['price']]);
        }
        if ($rx) query('INSERT INTO prescriptions (order_id, image, doctor, license) VALUES (?, ?, ?, ?)', [$orderId, $data['image'], isset($data['doctor']) && trim($data['doctor']) !== '' ? text($data, 'doctor', 1, 120) : 'Por verificar', isset($data['license']) && trim($data['license']) !== '' ? text($data, 'license', 1, 60) : 'Por verificar']);
        event($user, $branch, "Nueva reserva #ORD-$orderId", '', 'success');
    });
}

function changeOrder(array $user, int $id, string $action, array $data): void
{
    if ($action !== 'cancel') staff($user);
    transaction(function () use ($user, $id, $action, $data) {
        $order = query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [$id])->fetch();
        ensure((bool) $order, 'Reserva no encontrada.', 404);
        $note = '';
        $reviewer = $order['reviewer_id'];
        if ($action === 'cancel') {
            ensure(employee($user) || (int) $order['user_id'] === $user['id'], 'No tienes permiso para esta reserva.', 403);
            ensure(in_array($order['status'], ['pending', 'ready'], true), 'El estado actual no permite cancelar.', 409);
            $status = 'cancelled';
        } elseif ($action === 'review') {
            ensure($order['status'] === 'pending', 'La receta ya fue decidida.', 409);
            $status = $data['decision'] ?? '';
            ensure(in_array($status, ['ready', 'rejected'], true), 'Dictamen inválido.');
            $note = text($data, 'note', 3, 1000); $reviewer = $user['id'];
        } else {
            ensure($order['status'] === 'ready', 'La reserva no está lista para retiro.', 409);
            ensure(hash_equals($order['pickup_code'], text($data, 'code', 1, 60)), 'El código de retiro no coincide.');
            $lots = query('SELECT s.expiry FROM stock s JOIN items i ON i.stock_id = s.id WHERE i.order_id = ? ORDER BY s.id FOR UPDATE', [$id])->fetchAll();
            ensure(count($lots) > 0, 'La reserva no tiene lotes válidos.', 409);
            foreach ($lots as $lot) ensure($lot['expiry'] >= gmdate('Y-m-d'), 'No se puede despachar un lote vencido. Cancela la reserva y selecciona un lote vigente.');
            $status = 'completed';
        }
        if (in_array($status, ['cancelled', 'rejected'], true)) {
            $items = query('SELECT stock_id, quantity FROM items WHERE order_id = ? ORDER BY stock_id', [$id])->fetchAll();
            foreach ($items as $item) query('UPDATE stock SET quantity = quantity + ? WHERE id = ?', [$item['quantity'], $item['stock_id']]);
        }
        query('UPDATE orders SET status = ?, note = ?, reviewer_id = ? WHERE id = ?', [$status, $note ?: ($order['note'] ?? ''), $reviewer, $id]);
        $labels = ['cancelled' => 'cancelada', 'ready' => 'aprobada', 'rejected' => 'rechazada', 'completed' => 'despachada'];
        event($user, (int) $order['branch_id'], "Reserva #ORD-$id " . $labels[$status], $note, $status === 'rejected' ? 'critical' : 'success');
    });
}
