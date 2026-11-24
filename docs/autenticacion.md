# Acceso al taller

El primer administrador se crea una sola vez desde una terminal privada con acceso a `DATABASE_URL_UNPOOLED`:

```sh
npm run auth:create-admin
```

El comando solicita nombre, correo y contraseña sin mostrarla. Crea la organización, taller, usuario y membresía en una transacción, y se detiene si ya existe una organización o usuario. No hay registro público. La contraseña debe tener al menos 12 caracteres; guárdala en un gestor de contraseñas. En Vercel configura `DATABASE_URL` como variable de servidor para los entornos que utilicen el acceso.

Las contraseñas usan Argon2id. La cookie contiene un token aleatorio, HttpOnly y SameSite=Lax; en producción es Secure y usa el prefijo `__Host-`. La base almacena únicamente el hash del token. La sesión caduca en siete días y cerrar sesión la revoca. Cinco intentos incorrectos bloquean temporalmente la cuenta durante quince minutos.

La sesión se verifica en el layout de servidor antes de mostrar las pantallas del taller. Los módulos operativos siguen utilizando sus datos locales de demostración; las futuras operaciones de servidor deberán verificar sesión, rol y taller en cada acción y consulta. El acceso aún no ofrece recuperación de contraseña ni administración de usuarios desde la interfaz.
