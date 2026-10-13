-- PharmaFlow · MySQL 8 / MariaDB 10.4 · datos de prueba.
-- Inicialización no destructiva. Para reiniciar, ejecutar reset.sql explícitamente.
CREATE DATABASE IF NOT EXISTS pharmaflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pharmaflow;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('client','employee') NOT NULL DEFAULT 'client',
  dui VARCHAR(20) NOT NULL DEFAULT '',
  phone VARCHAR(30) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT employee_domain CHECK (role <> 'employee' OR email REGEXP '^[^@[:space:]]+@farmacia[.]com$')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS branches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  city VARCHAR(80) NOT NULL DEFAULT 'San Salvador',
  address VARCHAR(200) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS drugs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  ingredient VARCHAR(120) NOT NULL,
  form VARCHAR(120) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  category VARCHAR(60) NOT NULL,
  rx BOOLEAN NOT NULL DEFAULT FALSE,
  controlled BOOLEAN NOT NULL DEFAULT FALSE,
  price DECIMAL(10,2) NOT NULL,
  CONSTRAINT drug_price CHECK (price > 0),
  CONSTRAINT controlled_rx CHECK (controlled = FALSE OR rx = TRUE)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  drug_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NOT NULL,
  lot VARCHAR(60) NOT NULL,
  expiry DATE NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  minimum INT NOT NULL DEFAULT 10,
  UNIQUE KEY stock_lot (drug_id, branch_id, lot, expiry),
  KEY stock_branch (branch_id),
  CONSTRAINT stock_drug FOREIGN KEY (drug_id) REFERENCES drugs(id),
  CONSTRAINT stock_branch_fk FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT stock_quantity CHECK (quantity >= 0),
  CONSTRAINT stock_minimum CHECK (minimum > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  patient VARCHAR(100) NOT NULL,
  dui VARCHAR(20) NOT NULL DEFAULT '',
  phone VARCHAR(30) NOT NULL DEFAULT '',
  branch_id INT UNSIGNED NOT NULL,
  status ENUM('pending','ready','completed','rejected','cancelled') NOT NULL,
  priority ENUM('normal','high') NOT NULL DEFAULT 'normal',
  pickup_code VARCHAR(60) NOT NULL UNIQUE,
  note TEXT NULL,
  reviewer_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY orders_queue (status, branch_id, created_at),
  CONSTRAINT order_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT order_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT order_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  stock_id INT UNSIGNED NOT NULL,
  drug_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  CONSTRAINT item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT item_stock FOREIGN KEY (stock_id) REFERENCES stock(id),
  CONSTRAINT item_drug FOREIGN KEY (drug_id) REFERENCES drugs(id),
  CONSTRAINT item_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL UNIQUE,
  image MEDIUMTEXT NOT NULL,
  doctor VARCHAR(120) NOT NULL DEFAULT 'Por verificar',
  license VARCHAR(60) NOT NULL DEFAULT 'Por verificar',
  CONSTRAINT prescription_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  KEY sessions_expiry (expires_at),
  CONSTRAINT session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  branch_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  detail VARCHAR(1200) NOT NULL,
  kind ENUM('info','success','critical') NOT NULL DEFAULT 'info',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT event_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT event_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

-- Ambas claves son Pharma123!; hash generado con password_hash(PASSWORD_BCRYPT).
-- Exactamente dos usuarios de prueba, con roles explícitos.
INSERT IGNORE INTO users (id, name, email, password, role, dui, phone) VALUES
(1, 'Elena Morales Ramos', 'cliente@correo.com', '$2y$10$co5PXtva7Fn931DWCTzmSO8FnGoTToWKhfO5RS24VuvlLRUWdWjDe', 'client', '02849102-4', '+503 7849-2019'),
(2, 'Lic. David Chen', 'empleado@farmacia.com', '$2y$10$co5PXtva7Fn931DWCTzmSO8FnGoTToWKhfO5RS24VuvlLRUWdWjDe', 'employee', '04910283-9', '+503 2222-8042');

INSERT IGNORE INTO branches (id, name, address, phone) VALUES
(1, 'Central', 'Av. Roosevelt #124, San Salvador', '2222-1001'),
(2, 'Norte', 'Bulevar Constitución #85, San Salvador', '2222-1002'),
(3, 'Escalón', 'Paseo General Escalón #3100, San Salvador', '2222-1003');

INSERT IGNORE INTO drugs (id, name, ingredient, form, code, category, rx, controlled, price) VALUES
(1, 'Amoxicilina 500mg', 'Amoxicilina trihidrato', 'Cápsulas (caja x30)', 'J01CA04', 'Antibióticos', 1, 0, 8.50),
(2, 'Clonazepam 2mg', 'Clonazepam', 'Comprimidos ranurados (caja x30)', 'N05BA04', 'Psicotrópicos', 1, 1, 12.75),
(3, 'Paracetamol 500mg', 'Acetaminofén', 'Tabletas recubiertas (caja x100)', 'N02BE01', 'Analgésicos', 0, 0, 3.50),
(4, 'Azitromicina 500mg', 'Azitromicina dihidrato', 'Tabletas (caja x3)', 'J01FA10', 'Antibióticos', 1, 0, 9.90),
(5, 'Insulina Glargina 100 UI/ml', 'Insulina análoga', 'Lapicero prellenado (3ml)', 'A10AE04', 'Refrigerados', 1, 0, 32.00),
(6, 'Losartán Potásico 50mg', 'Losartán', 'Tabletas recubiertas (caja x30)', 'C09CA01', 'Cardiovasculares', 1, 0, 7.25),
(7, 'Salbutamol Inhalador 100mcg', 'Salbutamol sulfato', 'Aerosol para inhalación (200 dosis)', 'R03AC02', 'Respiratorios', 1, 0, 6.80),
(8, 'Ibuprofeno 400mg', 'Ibuprofeno', 'Cápsulas blandas (caja x20)', 'M01AE01', 'Analgésicos', 0, 0, 4.25);

INSERT IGNORE INTO stock (id, drug_id, branch_id, lot, expiry, quantity, minimum) VALUES
(1, 1, 1, 'AMX-2026-09', '2027-11-30', 340, 80),
(2, 2, 1, 'CLZ-8812', '2027-05-31', 14, 25),
(3, 3, 2, 'PCT-1049', '2028-01-31', 890, 150),
(4, 4, 2, 'AZM-4402', '2027-09-30', 8, 30),
(5, 5, 3, 'INS-9011', '2027-03-31', 42, 20),
(6, 6, 1, 'LOS-3312', '2027-08-31', 520, 100),
(7, 7, 2, 'SAL-7721', '2027-12-31', 3, 15),
(8, 8, 3, 'IBU-5520', '2028-04-30', 610, 120);

-- Existencias de la semilla son unidades disponibles: las reservas ya se descontaron.
INSERT IGNORE INTO orders (id, user_id, patient, dui, phone, branch_id, status, priority, pickup_code, created_at) VALUES
(9402, 1, 'Elena Morales Ramos', '02849102-4', '+503 7849-2019', 1, 'pending', 'high', 'PF-9402-EM', NOW() - INTERVAL 12 MINUTE),
(9401, 2, 'Carlos Mendizábal', '04910283-9', '+503 7981-0920', 1, 'pending', 'normal', 'PF-9401-CM', NOW() - INTERVAL 24 MINUTE),
(9398, 2, 'Sofía Valiente', '01928374-1', '+503 7298-1390', 2, 'pending', 'high', 'PF-9398-SV', NOW() - INTERVAL 38 MINUTE),
(9395, 2, 'Mauricio Guzmán', '05819283-0', '+503 7589-1728', 3, 'pending', 'normal', 'PF-9395-MG', NOW() - INTERVAL 45 MINUTE),
(8104, 1, 'Elena Morales Ramos', '02849102-4', '+503 7849-2019', 2, 'ready', 'normal', 'PF-8104-EM', NOW() - INTERVAL 60 MINUTE),
(8099, 1, 'Elena Morales Ramos', '02849102-4', '+503 7849-2019', 3, 'completed', 'normal', 'PF-8099-EM', NOW() - INTERVAL 90 MINUTE);

INSERT IGNORE INTO items (id, order_id, stock_id, drug_id, quantity, price) VALUES
(1, 9402, 1, 1, 2, 8.50), (2, 9402, 2, 2, 1, 12.75), (3, 9401, 6, 6, 1, 7.25),
(4, 9398, 4, 4, 1, 9.90), (5, 9395, 5, 5, 1, 32.00),
(6, 8104, 3, 3, 1, 3.50), (7, 8099, 8, 8, 1, 4.25);

INSERT IGNORE INTO prescriptions (order_id, image, doctor, license) VALUES
(9402, '/prescription.svg', 'Dr. Alejandro Vargas C.', '7894512'),
(9401, '/prescription.svg', 'Dra. Isabel Ramírez', '6590234'),
(9398, '/prescription.svg', 'Dr. Miguel Funes', '6700921'),
(9395, '/prescription.svg', 'Dra. Laura Pérez', '7021893');

INSERT IGNORE INTO events (id, user_id, branch_id, title, detail, kind, created_at) VALUES
(1, 2, 2, 'Reserva lista para retiro', 'Orden #ORD-8104 · identidad pendiente de verificar en mostrador.', 'success', NOW() - INTERVAL 3 MINUTE),
(2, 2, 1, 'Receta recibida #RX-9402', 'Amoxicilina y Clonazepam · requiere revisión del regente.', 'info', NOW() - INTERVAL 12 MINUTE),
(3, 2, 2, 'Alerta de existencia crítica', 'Azitromicina 500mg en Sede Norte descendió a 8 unidades.', 'critical', NOW() - INTERVAL 18 MINUTE),
(4, 2, 3, 'Retiro completado #ORD-8099', 'Entrega registrada en Sede Escalón.', 'success', NOW() - INTERVAL 26 MINUTE),
(5, 2, 1, 'Inventario de pruebas cargado', '8 medicamentos distribuidos en 3 sedes. Datos ficticios para pruebas.', 'info', NOW() - INTERVAL 30 MINUTE);
