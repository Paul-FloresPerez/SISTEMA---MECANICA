<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Interfaz visual

Para cualquier cambio de interfaz, consultar y cumplir `docs/design-system.md`. Conservar la identidad visual, componentes y patrones existentes salvo que el usuario solicite explícitamente un rediseño. Verificar los estados y tamaños afectados.

## Protocolo de desarrollo

- Cada implementación debe concluir con sus pruebas funcionales, compilación y comprobación de tipos.
- Cada implementación terminada y validada debe contar con un commit descriptivo y `git push` a `develop`.
- Al finalizar, informar el hash del commit, los archivos modificados, las funcionalidades implementadas, las pruebas ejecutadas y los pendientes.
- No publicar implementaciones incompletas como funcionales ni subir credenciales, archivos sensibles o cambios ajenos a la tarea.
- No realizar merge a `main` sin autorización del usuario.
