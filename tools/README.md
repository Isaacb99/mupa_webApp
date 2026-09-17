# Herramientas de verificación y assets

Requieren Node 22+ y las devDependencies del proyecto (`npm install`). Correr desde la raíz de `mupa-web`.

| Script | Para qué | Uso |
|---|---|---|
| `measure.mjs` | Medir la página real en cualquier viewport (incluso 375 px) por DevTools Protocol, evaluar JS y capturar página completa. | `node tools/measure.mjs 375 812 "({ overflow: document.documentElement.scrollWidth > innerWidth })" --shot salida.png [--url http://127.0.0.1:5173/] [--reduce]` |
| `parallax-expr.js` | Expresión para `measure.mjs` que recorre el scroll y mide las paradas de "sanjuaninos". | `node tools/measure.mjs 1280 900 "$(cat tools/parallax-expr.js)"` |
| `fonts.mjs` | Lista el texto del mockup agrupado por fuente y tamaño. | `node tools/fonts.mjs "design/Landing Page - V01.ai"` |
| `titulo-pos.mjs` | Posiciones exactas de las palabras del titular en el mockup. | `node tools/titulo-pos.mjs "design/Landing Page - V01.ai"` |
| `convertir-fotos.mjs` | Regenera los WebP de `src/assets` desde las fotos originales del Drive (recortes definidos adentro). | `node tools/convertir-fotos.mjs C:/ruta/originales src/assets` |

Notas: `measure.mjs` busca Chrome en `C:/Program Files/Google/Chrome/Application/chrome.exe`; en otra ruta, definir `CHROME_PATH`. Las capturas de página completa no cargan las imágenes `lazy`: forzar `img.loading='eager'` y recorrer la página en la expresión antes de capturar.
