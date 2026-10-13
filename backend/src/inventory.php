<?php
declare(strict_types=1);

function adjust(array $user, int $id, array $data): void
{
    staff($user);
    $quantity = countValue($data, 'quantity', 0);
    $note = text($data, 'note', 3, 1000);
    transaction(function () use ($user, $id, $quantity, $note) {
        $row = query('SELECT * FROM stock WHERE id = ? FOR UPDATE', [$id])->fetch();
        ensure((bool) $row, 'Existencia no encontrada.', 404);
        query('UPDATE stock SET quantity = ? WHERE id = ?', [$quantity, $id]);
        event($user, (int) $row['branch_id'], 'Ajuste de inventario registrado', $note);
    });
}

function transfer(array $user, int $id, array $data): void
{
    staff($user);
    $quantity = countValue($data, 'quantity');
    $branch = countValue($data, 'branchId');
    $note = text($data, 'note', 3, 1000);
    transaction(function () use ($user, $id, $quantity, $branch, $note) {
        activeBranch($branch);
        $row = query('SELECT * FROM stock WHERE id = ? FOR UPDATE', [$id])->fetch();
        ensure((bool) $row, 'Existencia no encontrada.', 404);
        ensure((int) $row['branch_id'] !== $branch, 'Selecciona otra sede.');
        ensure($row['expiry'] >= gmdate('Y-m-d'), 'El lote está vencido.');
        ensure((int) $row['quantity'] >= $quantity, 'No hay suficientes existencias.', 409);
        query('UPDATE stock SET quantity = quantity - ? WHERE id = ?', [$quantity, $id]);
        query('INSERT INTO stock (drug_id, branch_id, lot, expiry, quantity, minimum) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)', [$row['drug_id'], $branch, $row['lot'], $row['expiry'], $quantity, $row['minimum']]);
        event($user, $branch, 'Transferencia entre sedes completada', $note);
    });
}

function addDrug(array $user, array $data): void
{
    staff($user);
    ensure(isset($data['drug']) && is_array($data['drug']), 'Medicamento inválido.');
    $drug = $data['drug'];
    $name = text($drug, 'name', 3, 120);
    $ingredient = text($drug, 'ingredient', 1, 120);
    $form = text($drug, 'form', 1, 120);
    $code = strtoupper(text($drug, 'code', 1, 30));
    $category = text($drug, 'category', 1, 60);
    $price = $drug['price'] ?? null;
    ensure(is_numeric($price) && is_finite((float) $price) && $price > 0 && $price <= 100000, 'Precio inválido.');
    $quantity = countValue($data, 'quantity', 0);
    $minimum = countValue($data, 'minimum');
    $branch = countValue($data, 'branchId');
    $lot = text($data, 'lot', 1, 60);
    $expiry = text($data, 'expiry', 10, 10);
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $expiry);
    ensure($date !== false && $date->format('Y-m-d') === $expiry && $expiry >= gmdate('Y-m-d'), 'Fecha de vencimiento inválida.');
    $rx = (bool) ($drug['rx'] ?? false) || (bool) ($drug['controlled'] ?? false);
    $controlled = (bool) ($drug['controlled'] ?? false);
    transaction(function () use ($user, $name, $ingredient, $form, $code, $category, $price, $rx, $controlled, $branch, $lot, $expiry, $quantity, $minimum) {
        activeBranch($branch);
        ensure(!query('SELECT id FROM drugs WHERE code = ?', [$code])->fetch(), 'El código ATC ya existe.', 409);
        query('INSERT INTO drugs (name, ingredient, form, code, category, rx, controlled, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$name, $ingredient, $form, $code, $category, (int) $rx, (int) $controlled, $price]);
        $id = (int) db()->lastInsertId();
        query('INSERT INTO stock (drug_id, branch_id, lot, expiry, quantity, minimum) VALUES (?, ?, ?, ?, ?, ?)', [$id, $branch, $lot, $expiry, $quantity, $minimum]);
        event($user, $branch, 'Nuevo medicamento registrado', $name);
    });
}

function importStock(array $user, array $data): void
{
    staff($user);
    $rows = $data['rows'] ?? [];
    ensure(is_array($rows) && count($rows) > 0 && count($rows) <= 500, 'Importa entre 1 y 500 filas.');
    $ids = [];
    foreach ($rows as $row) {
        ensure(is_array($row), 'Fila inválida.');
        $ids[] = countValue($row, 'id'); countValue($row, 'quantity', 0); countValue($row, 'minimum');
    }
    ensure(count(array_unique($ids)) === count($ids), 'El archivo contiene filas duplicadas.');
    usort($rows, fn($a, $b) => $a['id'] <=> $b['id']);
    transaction(function () use ($user, $rows) {
        $branch = 1;
        foreach ($rows as $row) {
            $stock = query('SELECT * FROM stock WHERE id = ? FOR UPDATE', [$row['id']])->fetch();
            ensure((bool) $stock, 'Existencia no encontrada.', 404);
            $branch = (int) $stock['branch_id'];
            query('UPDATE stock SET quantity = ?, minimum = ? WHERE id = ?', [$row['quantity'], $row['minimum'], $row['id']]);
        }
        event($user, $branch, 'Importación de existencias completada', count($rows) . ' filas');
    });
}

function editBranch(array $user, int $id, array $data): void
{
    staff($user);
    $name = text($data, 'name', 2, 80);
    $address = text($data, 'address', 5, 200);
    $phone = text($data, 'phone', 7, 30);
    ensure(preg_match('/^[\d+\s-]{7,20}$/', $phone) === 1, 'Teléfono inválido.');
    ensure(isset($data['active']) && is_bool($data['active']), 'Estado de sede inválido.');
    transaction(function () use ($user, $id, $data, $name, $address, $phone) {
        $branches = query('SELECT id, active FROM branches ORDER BY id FOR UPDATE')->fetchAll();
        ensure(in_array($id, array_map('intval', array_column($branches, 'id')), true), 'Sede no encontrada.', 404);
        if (!$data['active']) {
            ensure(count(array_filter($branches, fn($b) => (int) $b['id'] !== $id && $b['active'])) > 0, 'Debe quedar una sede activa.');
            ensure(!query("SELECT id FROM orders WHERE branch_id = ? AND status IN ('pending','ready') LIMIT 1", [$id])->fetch(), 'Hay reservas activas en esta sede.', 409);
        }
        query('UPDATE branches SET name = ?, address = ?, phone = ?, active = ? WHERE id = ?', [$name, $address, $phone, (int) $data['active'], $id]);
        event($user, $id, 'Configuración de sede actualizada');
    });
}
