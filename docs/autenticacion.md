# Acceso al taller

El primer administrador se crea una sola vez desde una terminal privada con acceso a `DATABASE_URL_UNPOOLED`:

```sh
npm run auth:create-admin
```

El comando solicita nombre, nombre de usuario, correo opcional y contraseña sin mostrarla. El usuario se normaliza a minúsculas, debe tener de 3 a 64 caracteres y admite letras ASCII, números, puntos, guiones y guiones bajos; debe empezar por letra o número. Es único globalmente. Crea la organización, taller, usuario y membresía en una transacción, y se detiene si ya existe una organización o usuario. No hay registro público. La contraseña debe tener al menos 12 caracteres; guárdala en un gestor de contraseñas. En Vercel configura `DATABASE_URL` como variable de servidor para los entornos que utilicen el acceso.

Las contraseñas usan Argon2id. La cookie contiene un token aleatorio, HttpOnly y SameSite=Lax; en producción es Secure y usa el prefijo `__Host-`. La base almacena únicamente el hash del token. La sesión caduca en siete días y cerrar sesión la revoca. Cinco intentos incorrectos bloquean temporalmente la cuenta durante quince minutos.

La sesión se verifica en el layout de servidor antes de mostrar las pantallas del taller. Los módulos operativos aún no conectados siguen utilizando datos locales de demostración; las futuras operaciones de servidor deberán verificar sesión, rol y taller en cada acción y consulta. La recuperación de contraseña por administrador o correo sigue pendiente.

Cada usuario puede cambiar su contraseña desde «Mi cuenta» con su contraseña actual y una nueva distinta. Se guarda con Argon2id y se revocan las demás sesiones en la misma transacción que registra la auditoría. La sesión usada para el cambio permanece activa. El inicio de sesión y el cambio bloquean la misma credencial para evitar que un acceso concurrente con la contraseña anterior sobreviva al cambio.

La prueba de integración usa registros temporales aislados y los elimina al terminar. En una terminal con las variables de la base de desarrollo configuradas se ejecuta con `NODE_OPTIONS=--conditions=react-server npx tsx scripts/verify-account.ts` (en PowerShell: `$env:NODE_OPTIONS='--conditions=react-server'` y luego `npx tsx scripts/verify-account.ts`).
