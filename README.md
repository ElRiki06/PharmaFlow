Iniciar la aplicación
Requisitos: Node.js 22.12+ o 24, XAMPP (con PHP 8.2+ y MySQL 8 o MariaDB 10.4+).

El modo predeterminado es demostración local:
permite probar todos los flujos sin arrancar PHP o MySQL. Los datos ficticios,
la sesión, las preferencias y el carrito se guardan usando AsyncStorage 3
(IndexedDB en web). No se guardan contraseñas en el navegador.



Rol,Correo,Contraseña
Cliente,cliente@correo.com,Pharma123!
Empleado,empleado@farmacia.com,Pharma123!



El cliente consulta el catálogo, crea reservas, ve sus propios pedidos y puede
cancelarlos antes de la entrega. El empleado gestiona todas las reservas, audita
recetas, confirma retiros, ajusta/importa/traslada existencias, registra
medicamentos y configura sedes.

El dominio exacto @farmacia.com es obligatorio para empleados, además del rol
provisionado en la base de datos. Escribir ese dominio no concede el rol. El
registro público de la API crea únicamente clientes y rechaza correos de empleados.

Conectar PHP y MySQL usando XAMPP

1. Base de datos Vía phpMyAdmin
En XAMPP, dale "Start" a MySQL y Apache.
Entra a http://localhost/phpmyadmin en tu navegador.
Crea una base de datos nueva (ej. pharmaflow).
Ve a la pestaña Importar, selecciona tu archivo database/init.sql y dale a continuar.
2. Backend Vía consola de PHP
Tienes que copiar la carpeta entera del proyecto para copiarla en la ruta "C:\\xampp\\htdocs"
3. Frontend
Abre una nueva ventana de terminal, entra a la carpeta del frontend y levanta la aplicación:
cd frontend
npm install
npm run dev

Abre http://127.0.0.1:5173 en tu navegador.

Funcionalidades
Panel con métricas calculadas, cola de revisión, actividad y reporte CSV.

Inventario por lote, sede, categoría, estado y requisito. Paginación,
vencimientos, ajustes con motivo, transferencias atómicas y alta de medicamentos.

Importación CSV con plantilla id,quantity,minimum, hasta 500 filas.
Los archivos se validan y se confirma antes de reemplazar conteos.

Reserva con carrito local y receta JPG/PNG/WebP de hasta 2 MB para productos Rx.
Las unidades se reservan al guardar; un carrito no bloquea existencias.

Auditoría manual con zoom, arrastre, giro, contraste y registro del dictamen.
Aprobar habilita el retiro; rechazar o cancelar libera las unidades una sola vez.

Despacho con código de retiro, comprobante descargable y validación de estado.

Confirmaciones para cambios, cancelaciones, dictámenes y reinicio local.

Navegación adaptable a móviles, controles etiquetados, foco visible y ventanas
con manejo de teclado. Fuentes e iconos incluidos sin servicios externos.

El sistema no incorpora OCR, firmas digitales, sensores, validación de registros
médicos ni verificación normativa externa. Estos servicios no se presentan como
activos. La receta incluida es un documento de ejemplo sin validez clínica.

