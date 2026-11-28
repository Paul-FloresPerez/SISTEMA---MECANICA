# Acceso al taller

El primer administrador se crea una sola vez desde una terminal privada con acceso a `DATABASE_URL_UNPOOLED`:

```sh
npm run auth:create-admin
```

El comando solicita nombre, nombre de usuario, correo opcional y contraseña sin mostrarla. El usuario se normaliza a minúsculas, debe tener de 3 a 64 caracteres y admite letras ASCII, números, puntos, guiones y guiones bajos; debe empezar por letra o número. Es único globalmente. Crea la organización, taller, usuario y membresía en una transacción, y se detiene si ya existe una organización o usuario. No hay registro público. La contraseña debe tener al menos 12 caracteres; guárdala en un gestor de contraseñas. En Vercel configura `DATABASE_URL` como variable de servidor para los entornos que utilicen el acceso.

Las contraseñas usan Argon2id. La cookie contiene un token aleatorio, HttpOnly y SameSite=Lax; en producción es Secure y usa el prefijo `__Host-`. La base almacena únicamente el hash del token. La sesión caduca en siete días y cerrar sesión la revoca. Cinco intentos incorrectos bloquean temporalmente la cuenta durante quince minutos.

La sesión se verifica en el layout de servidor antes de mostrar las pantallas del taller. Los módulos operativos aún no conectados siguen utilizando datos locales de demostración; las futuras operaciones de servidor deberán verificar sesión, rol y taller en cada acción y consulta. La recuperación por correo sigue pendiente.

Cada usuario puede cambiar su contraseña desde «Mi cuenta» con su contraseña actual y una nueva distinta. Se guarda con Argon2id y se revocan las demás sesiones en la misma transacción que registra la auditoría. La sesión usada para el cambio permanece activa. El inicio de sesión y el cambio bloquean la misma credencial para evitar que un acceso concurrente con la contraseña anterior sobreviva al cambio.

Las cuentas nuevas creadas en Configuración reciben una contraseña inicial temporal: al iniciar sesión deben sustituirla antes de acceder a los módulos. Un administrador puede asignar otra contraseña temporal a un integrante desde Equipo; se cierran todas las sesiones de esa cuenta y se registra la acción sin guardar la contraseña en auditoría. El administrador no puede restablecerse a sí mismo mediante esta opción y las cuentas compartidas entre organizaciones no se restablecen desde un taller. Las cuentas existentes conservan su contraseña y no se fuerzan a cambiarla por la migración.

## Recuperación de emergencia por terminal

Sólo una persona autorizada con acceso privado a la conexión directa de Neon debe ejecutar `npm run auth:reset-admin` desde una terminal interactiva y privada. Antes de ejecutarlo, verificar que `DATABASE_URL_UNPOOLED` apunta al entorno correcto y obtener por un canal autorizado el UUID exacto de la organización y el nombre de usuario del administrador. No incluir contraseñas en comandos, argumentos, archivos ni mensajes.

El comando pide ambos identificadores, exige escribir `RESTABLECER` y solicita dos veces la contraseña temporal sin mostrarla. Sólo acepta un administrador activo de un taller activo de esa organización y rechaza cuentas con múltiples membresías. Actualiza la credencial, obliga a cambiarla al ingresar, revoca todas sus sesiones y registra `user.emergency_password_reset` con el método `private_terminal` en auditoría; el actor es nulo porque no existe una sesión de aplicación en este procedimiento. Entregar la contraseña temporal por un canal seguro y distinto. La recuperación por correo no está implementada.

La prueba de integración usa registros temporales aislados y los elimina al terminar. En una terminal con las variables de la base de desarrollo configuradas se ejecuta con `NODE_OPTIONS=--conditions=react-server npx tsx scripts/verify-account.ts` (en PowerShell: `$env:NODE_OPTIONS='--conditions=react-server'` y luego `npx tsx scripts/verify-account.ts`).
