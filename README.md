# PharmaFlow universal

Frontend nuevo en React Native + Expo. El frontend anterior y PHP/MySQL se conservan sin cambios.

## Diseño

La referencia visual es `../frontend/src` y `../pantallas/design.md`, junto con las capturas de dashboard, inventario y auditoría. El tema inicial es claro. Se usan Inter y JetBrains Mono incluidas localmente; no requieren descargar fuentes al iniciar.

- Sidebar de 256 px, 220 px en escritorio compacto y menú lateral en celular.
- Cabecera de 72 px (64 px en móvil), selector de sede, búsqueda, avisos y perfil.
- Dashboard: cuatro indicadores, cola de auditoría en tabla y actividad a la derecha.
- Inventario: filtros compactos, ocho columnas, paginación y modales de movimientos.
- Auditoría: visor oscuro y panel de decisión en dos columnas; apilados en móvil.
- Catálogo, reservas, configuración y acceso mantienen la composición del frontend original.

## Arranque

```powershell
cd frontend-native
npm ci
npx expo start
```

Abre la web en http://localhost:8081. En iPhone usa Expo Go y escanea el QR de Metro. PC y teléfono deben estar en la misma red Wi-Fi.

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

## Límites de validación

Las pruebas del agente se realizan en navegador. La captura de cámara, permisos iOS, selección de archivos, compartir y almacenamiento nativo requieren validación manual en iPhone. El contraste de imagen del visor está disponible únicamente en web; zoom, arrastre y giro comparten componentes nativos.

La auditoría de npm detecta 23 avisos transitivos de herramientas del SDK seleccionado. `npm audit fix` no los elimina; la corrección forzada propone una versión antigua e incompatible de Expo y no se aplica. Las versiones nativas se verifican con `npx expo install --check`.

## Evidencia

Las capturas verificadas de la interfaz se guardan en `evidence/`. La compilación web se genera con `npm run export:web`.
