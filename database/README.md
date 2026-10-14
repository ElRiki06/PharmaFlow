# Base de datos de prueba

- `init.sql`: esquema InnoDB y semilla no destructiva; MySQL 8 / MariaDB 10.4.
- `reset.sql`: eliminación explícita de `pharmaflow` y carga de `init.sql`.

Usuarios iniciales: `cliente@correo.com` (cliente) y `empleado@farmacia.com`
(empleado). Contraseña de ambos: `Pharma123!`, guardada mediante bcrypt.

El cliente MySQL debe ejecutar `reset.sql` desde esta carpeta para resolver
`SOURCE init.sql`. Nunca usar el reset sobre datos reales.
