<?php
declare(strict_types=1);
// Crea SOLO una base temporal nueva. Nunca modifica o elimina una base existente.
$name = getenv('TEST_DB') ?: '';
if (!preg_match('/^pharmaflow_test_[a-z0-9]+$/', $name)) exit("TEST_DB debe comenzar con pharmaflow_test_.\n");
$port = getenv('DB_PORT') ?: '3308';
$pdo = new PDO("mysql:host=127.0.0.1;port=$port;charset=utf8mb4", getenv('DB_USER') ?: 'root', getenv('DB_PASS') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$check = $pdo->prepare('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?');
$check->execute([$name]);
if ($check->fetch()) exit("La base temporal ya existe. Selecciona otro nombre.\n");
$sql = file_get_contents(dirname(__DIR__, 2) . '/database/init.sql');
$sql = preg_replace('/\bpharmaflow\b/', $name, $sql);
$pdo->exec($sql);
$count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
if ($count !== 2) throw new RuntimeException('Se esperaban exactamente dos usuarios de prueba.');
foreach ($pdo->query('SELECT password FROM users') as $row) {
    if (!password_verify('Pharma123!', $row['password'])) throw new RuntimeException('Hash de contraseña inválido.');
}
$pdo->exec("INSERT INTO `$name`.stock (id, drug_id, branch_id, lot, expiry, quantity, minimum) VALUES (99, 8, 3, 'TEST-EXPIRED', '2000-01-01', 5, 1)");
$pdo->exec("INSERT INTO `$name`.orders (id, user_id, patient, branch_id, status, pickup_code) VALUES (8105, 2, 'Prueba de vencimiento', 3, 'ready', 'PF-TEST-EXPIRED')");
$pdo->exec("INSERT INTO `$name`.items (order_id, stock_id, drug_id, quantity, price) VALUES (8105, 99, 8, 1, 4.25)");
echo "Inicialización SQL correcta: 2 usuarios, hashes válidos, 3 sedes.\n";
