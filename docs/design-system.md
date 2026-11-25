# Sistema de diseño de ZONA RACING

La implementación existente es la referencia visual. En nuevas pantallas y cambios de interfaz se deben reutilizar los componentes, clases y patrones de este documento; no se debe rediseñar una pantalla existente sin una petición explícita. Ante una diferencia, contrastar el resultado con la pantalla actual y conservar su identidad en escritorio, móvil y ambos temas.

## Tipografía y color

- Texto de interfaz: Plus Jakarta Sans (`--font-sans`); títulos de marca: Barlow Condensed (`--font-display`); cifras y códigos: JetBrains Mono (`--font-mono`, `.font-mono-num`). Las fuentes se cargan en `app/layout.tsx` y se definen en `src/index.css`.
- Acento y acciones principales: `rose-600`, con `rose-700` al pasar el cursor; enlaces y detalles de énfasis emplean la misma familia.
- Fondo claro `#F5F6F8`; texto principal `#111827`; tarjetas blancas con bordes `slate-200`. Fondo oscuro `#0B0E14`; tarjetas `#131822`; campos y navegación `#0F141C`; bordes `slate-700`/`slate-800`; texto claro `#F3F4F6`.
- El modo oscuro se activa mediante la clase `.dark` en el elemento raíz, desde `WorkshopContext`.

## Estructura y componentes

- Mantener navegación lateral fija en escritorio y navegación inferior/menú en móvil según `src/layouts/MainLayout.tsx`.
- Tarjetas de configuración: superficie blanca u oscura, `border`, `rounded-xl`, `p-5 lg:p-6`; separar grupos con `space-y-4` o `space-y-5`.
- Formularios: etiquetas `text-xs font-semibold`; campos de ancho completo, `px-3 py-2 text-sm`, fondo `slate-50` o `#0F141C`, borde `slate-200`/`slate-700` y `rounded-lg`. Usar cuadrícula de una columna que pase a dos en `sm` cuando corresponda.
- Botón principal: `bg-rose-600 hover:bg-rose-700`, texto blanco, `rounded-lg`, `px-4 py-2 text-xs font-semibold`; secundario en tonos `slate`. Usar los iconos de `lucide-react` con `aria-hidden` cuando sean decorativos.
- Diálogos: reutilizar `src/components/common/Modal.tsx`, con panel inferior en móvil y centrado desde `sm`, cabecera y botón de cierre existentes. Los estados vacíos deben seguir `src/components/common/EmptyState.tsx`.
- Respetar la preferencia de movimiento reducido declarada en `src/index.css`; las transiciones existentes son discretas.

## Comprobación para futuros cambios

Comprobar la pantalla y sus controles en escritorio y móvil, en claro y oscuro, incluyendo contenido real, vacío, carga, errores y confirmaciones cuando correspondan. Mantener etiquetas, foco de teclado, mensajes accesibles y controles utilizables en pantallas táctiles. Los módulos aún simulados deben identificarse como tales y no presentarse como datos persistentes.
