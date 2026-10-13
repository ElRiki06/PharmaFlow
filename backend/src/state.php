<?php
declare(strict_types=1);

function stamp(string $date): string { return str_replace(' ', 'T', $date) . 'Z'; }

function state(array $user): array
{
    $branches = query('SELECT * FROM branches ORDER BY id')->fetchAll();
    foreach ($branches as &$row) { $row['id'] = (int) $row['id']; $row['active'] = (bool) $row['active']; }
    unset($row);
    $drugs = query('SELECT * FROM drugs ORDER BY id')->fetchAll();
    foreach ($drugs as &$row) { $row['id'] = (int) $row['id']; $row['price'] = (float) $row['price']; $row['rx'] = (bool) $row['rx']; $row['controlled'] = (bool) $row['controlled']; }
    unset($row);
    $stock = array_map(fn($r) => ['id' => (int) $r['id'], 'drugId' => (int) $r['drug_id'], 'branchId' => (int) $r['branch_id'], 'lot' => $r['lot'], 'expiry' => $r['expiry'], 'quantity' => (int) $r['quantity'], 'minimum' => (int) $r['minimum']], query('SELECT * FROM stock ORDER BY id')->fetchAll());
    $filter = employee($user) ? '' : ' WHERE o.user_id = ?';
    $orders = query('SELECT o.*, p.image, p.doctor, p.license, u.name AS reviewer FROM orders o LEFT JOIN prescriptions p ON p.order_id = o.id LEFT JOIN users u ON u.id = o.reviewer_id' . $filter . ' ORDER BY o.created_at DESC', employee($user) ? [] : [$user['id']])->fetchAll();
    $ids = array_column($orders, 'id');
    $items = $ids ? query('SELECT * FROM items WHERE order_id IN (' . implode(',', array_fill(0, count($ids), '?')) . ') ORDER BY id', $ids)->fetchAll() : [];
    $byOrder = [];
    foreach ($items as $i) $byOrder[$i['order_id']][] = ['stockId' => (int) $i['stock_id'], 'drugId' => (int) $i['drug_id'], 'quantity' => (int) $i['quantity'], 'price' => (float) $i['price']];
    $orders = array_map(fn($o) => ['id' => (int) $o['id'], 'userId' => (int) $o['user_id'], 'patient' => $o['patient'], 'dui' => $o['dui'], 'phone' => $o['phone'], 'branchId' => (int) $o['branch_id'], 'status' => $o['status'], 'priority' => $o['priority'], 'pickupCode' => $o['pickup_code'], 'createdAt' => stamp($o['created_at']), 'items' => $byOrder[$o['id']] ?? [], 'image' => $o['image'], 'doctor' => $o['doctor'], 'license' => $o['license'], 'note' => $o['note'] ?? '', 'reviewer' => $o['reviewer']], $orders);
    $events = employee($user) ? array_map(fn($e) => ['id' => (int) $e['id'], 'title' => $e['title'], 'detail' => $e['detail'], 'branchId' => (int) $e['branch_id'], 'kind' => $e['kind'], 'createdAt' => stamp($e['created_at'])], query('SELECT * FROM events ORDER BY created_at DESC, id DESC LIMIT 200')->fetchAll()) : [];
    return compact('branches', 'drugs', 'stock', 'orders', 'events') + ['version' => 1];
}
