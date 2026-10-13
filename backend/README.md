# API PharmaFlow

Desde la raíz del proyecto:

```powershell
Copy-Item backend/.env.example backend/.env
& C:\xampp\php\php.exe -S 127.0.0.1:8000 -t backend backend/router.php
```

Inicializa MySQL con `database/init.sql` y ajusta `backend/.env`.
Consulta `README.md` en la raíz para todos los endpoints y los ejemplos JSON.

Para Apache, sirve esta carpeta con `mod_rewrite` y `AllowOverride All`; el
`.htaccess` envía todas las solicitudes al controlador. El router del servidor
PHP evita servir archivos internos o el entorno como archivos estáticos.
