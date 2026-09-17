# MuPa · landing / futura Home del sitio

Sitio público del **Museo Paleontológico de San Juan (MuPa)**, Argentina. Cliente institucional (Gobierno de San Juan + UNSJ + Fiduciaria San Juan). Trabajo freelance a precio fijo (USD 3.500, 8-10 semanas). Esta carpeta es la landing "one page" pedida por el museo, construida para convertirse en la Home del sitio definitivo (React + Vite + Express + PostgreSQL + Mercado Pago Checkout Pro; el spike de Mercado Pago ya funciona en la PC personal del desarrollador y no está en este repo).

## Stack y comandos
- React 19 + Vite 8 + Tailwind 4 (`@tailwindcss/vite`). `vite.config.js` usa `base: './'` para que el build sirva desde la raíz del dominio o desde una subcarpeta de Hostinger.
- `npm run dev` (servidor en 5173), `npm run build` (dist/), `npm run preview`.
- Windows: si `npm` no aparece en el PATH del proceso, usar `C:/Program Files/nodejs/npm.cmd`.

## Estructura
- `src/content.js`: TODO el texto, centralizado. Es el **texto exacto del mockup** (extraído del `.ai` con PDF.js). No inventar copy: lo que el museo no escribió queda como `ui.pendiente`. Educación, Espectáculo y Forma Lab están vacíos también en el mockup. `ejesVerificar: true` marca lo único no confirmado (qué texto va bajo Eje narrativo / Visión / Misión).
- `src/components/`: Header, Hero, Intro (usa `TituloParallax`), Identidad, ObraHistorica, Areas (acordeón accesible), Footer, Placeholder.
- `src/hooks/useParallaxPalabra.js`: parallax de la palabra "sanjuaninos" (ver Decisiones).
- `src/assets/`: 13 WebP generados con `tools/convertir-fotos.mjs` desde la selección fotográfica del museo (Drive, ~90 MB de originales, no versionados). `src/assets/README.md` tiene el mapa archivo -> celda.
- `src/index.css`: tokens `@theme` (colores PROVISORIOS hasta el Figma del diseñador) y estilos base **dentro de `@layer base`**.
- `tools/`: herramientas de verificación y de assets (ver abajo).
- `design/`: (no versionado) lugar para el mockup `Landing Page - V01.ai`.

## Convenciones
- Comentarios, nombres y textos en español.
- Tailwind 4: clases estáticas siempre (nada de `bg-${x}`); tokens en `@theme`; CSS base propio SOLO dentro de `@layer base` (fuera de capa le gana a las utilidades); valores arbitrarios de tamaño con prefijo: `text-[length:clamp(...)]`.
- Accesibilidad: un solo h1; secciones con `aria-labelledby`; acordeón con `aria-expanded`/`aria-controls`; `prefers-reduced-motion` respetado; imágenes con `alt` real.
- No commitear ni pushear sin que el desarrollador lo pida.

## Decisiones ya tomadas (no re-discutir salvo que el desarrollador lo pida)
- **Tipografía** (medida en el `.ai`, 16-17/09/2026): Google Sans Flex para todo el texto y Roboto Mono 700 solo en las etiquetas EJE NARRATIVO / VISIÓN / MISIÓN y el lema de Ciencia. Pesos inferidos por avance de glifo: h1 y h2 de Identidad/Obra 500, párrafos y h2 de Áreas 400, bandas e hitos 300, palabras grandes 200. Sin eje opsz (el mockup usa 18 fijo). Fallbacks locales con `size-adjust` en `index.css`.
- **Titular con parallax**: las tres líneas fijas ("un museo de" / "hecho por" / "y para") van alineadas a la derecha en la columna izquierda y "sanjuaninos" en la derecha; con el scroll la palabra baja de fila en fila formando "un museo de sanjuaninos", "hecho por sanjuaninos", "y para sanjuaninos". Mesetas del 30 % en cada parada y recorrido de al menos 480 px de scroll (0,6 del alto del viewport) para que cada frase se lea; alto del viewport cacheado (la barra del navegador móvil no hace saltar la palabra); transform 2D redondeado a píxel entero. Con reduced-motion la palabra queda fija arriba y aparecen copias estáticas en las otras filas (las tres frases se leen completas). Al final del recorrido queda en "y para". Mismo efecto en móvil: el h1 usa tamaños en vw con tope (`clamp`/`min`) para que "un museo de sanjuaninos" entre en una fila a 375 px aunque el usuario agrande la letra; con espaciado de texto forzado (WCAG 1.4.12) la palabra se parte en vez de desbordar. Separación línea/palabra 0,36 em como el mockup; el párrafo arranca donde arranca la palabra (gap del grid exterior con la misma fórmula).
- **Fotos**: 11 del Drive del museo, recortadas a medida para las celdas verticales y cuadradas; Educación lleva foto aunque su texto siga pendiente (a confirmar); Espectáculo y Forma Lab con placeholder; logos de Gobierno de San Juan y UNSJ pendientes (`logo: null`).
- **Hosting**: landing en Hostinger (FTP, dominio mupa.ar ya en Hostinger); sitio definitivo en Render (backend + Postgres). Nunca dar de baja Hostinger (correo + DNS). Mercado Pago sin efectivo (solo tarjeta/dinero en cuenta/transferencia). El diseñador UX/UI entrega Figma más adelante: entonces se reemplazan tokens en `index.css` y nada más.

## Verificación (recetas que funcionan)
- `node tools/measure.mjs <ancho> <alto> "<expresión JS>" [--shot salida.png] [--url URL] [--reduce]`: emula cualquier viewport por DevTools Protocol (Chrome headless), espera las fuentes, evalúa la expresión en la página y captura página completa. Es la única forma fiable de medir en móvil: `chrome --headless --window-size=375,...` no baja de ~500 px en Windows. Requiere Chrome; `CHROME_PATH` para otra ruta.
- `tools/parallax-expr.js`: expresión que recorre el scroll y mide las paradas de la palabra (deben dar 0 px en 0 / 0,5 / 1).
- `node tools/fonts.mjs [ruta.ai]` y `node tools/titulo-pos.mjs [ruta.ai]`: leen el mockup con PDF.js (fuentes, tamaños, posiciones exactas).
- `node tools/convertir-fotos.mjs <carpeta-originales> src/assets`: regenera los WebP (lista de recortes adentro).
- Para capturas con todas las fotos: forzar `img.loading='eager'` y recorrer la página antes de capturar (las lazy no cargan en headless).
- Tailwind 4 en dev: un archivo nuevo no se escanea hasta reiniciar el servidor.

## Pendiente / decisiones abiertas
- Confirmar con el museo el orden Eje narrativo / Visión / Misión, la foto de Educación y los logos.
- Palabras grandes Inspirar / Referente / Patrimonio: quedan a -25 % del mockup; llegar al tamaño del diseño exige otro layout (un eje por vez).
- Ancho del contenido a 1920 px (mockup 1:1 con ~1620 px; hoy `max-w-7xl`).
- Alojar las fuentes en `public/fonts` (Google Fonts demora ~530 ms el primer texto).
- Dos fragmentos del texto de Ciencia van en peso 600 en el diseño (viven dentro de cadenas de `content.js`).
- Publicar en Hostinger por FTP (renombrar `default.php` a `.bak`; nunca subir `index.html` de prueba).

## Memoria de Claude Code
La memoria automática de Claude (decisiones, presupuesto, dominio, Mercado Pago, aprendizajes) vive fuera del repo, en `~/.claude/projects/<slug-de-la-carpeta>/memory/`. Al cambiar de PC hay que copiar esa carpeta al slug nuevo (ver `docs/migracion.md`).
