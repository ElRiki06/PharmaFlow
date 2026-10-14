# PharmaFlow universal
## Arranque

```powershell
cd frontend-native
npm ci
npx expo start
```

Abre la web en http://localhost:8081. En móvil usa Expo Go y escanea el QR de Metro. PC y teléfono deben estar en la misma red Wi-Fi.

La IP usada durante el desarrollo es 192.168.2.123. Si cambia, actualiza `.env` y reinicia Expo. Las variables EXPO_PUBLIC son configuración pública, nunca secretos.

Para el backend, desde la raíz del proyecto:

```powershell
$env:APP_ORIGIN='http://localhost:8081'
& C:\xampp\php\php.exe -S 0.0.0.0:8082 -t backend backend/router.php
```

MySQL debe estar activo en XAMPP. La app usa `http://192.168.2.123:8082/api`. Para navegar desde Safari con esta API, el proceso PHP debe tener APP_ORIGIN igual a http://192.168.2.123:8081; el acceso de Expo Go nativo no depende de CORS.

## Datos

El valor predeterminado configurado en `.env` es API PHP/MySQL. Para pruebas aisladas, establece `EXPO_PUBLIC_DATA_MODE=demo` y reinicia Expo. El modo demo conserva los datos y carrito localmente, por usuario; no modifica MySQL.

Usuarios de demostración: cliente@correo.com / empleado@farmacia.com, contraseña Pharma123!.

Los tokens móviles se guardan en SecureStore. Preferencias, carrito y datos demo usan AsyncStorage. Las recetas se convierten a JPEG y se valida el límite de 2 MB; CSV y comprobantes se descargan en web o se comparten en móvil.