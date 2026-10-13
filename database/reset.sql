-- DESTRUCTIVO: elimina únicamente la base de pruebas pharmaflow.
-- Ejecutar manualmente desde database: mysql -u root < reset.sql
DROP DATABASE IF EXISTS pharmaflow;
SOURCE init.sql;
