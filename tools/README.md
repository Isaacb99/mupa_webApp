# Herramientas de verificación y assets

Requieren Node 22+ y las devDependencies del proyecto (`npm install`). Correr desde la raíz de `mupa-web`.

| Script | Para qué | Uso |
|---|---|---|
| `measure.mjs` | Medir la página real en cualquier viewport (incluso 375 px) por DevTools Protocol, evaluar JS y capturar página completa. | `node tools/measure.mjs 375 812 "({ overflow: document.documentElement.scrollWidth > innerWidth })" --shot salida.png [--url http://127.0.0.1:5173/] [--reduce]` |
| `parallax-expr.js` | Expresión para `measure.mjs` que recorre el scroll y mide las paradas de "sanjuaninos", esperando a que termine cada viaje (`dy` debe dar 0 en 0 / 0,5 / 1). | `node tools/measure.mjs 1280 900 "$(cat tools/parallax-expr.js)"` |
| `parallax-compuerta.js` | Expresión para `measure.mjs` que comprueba lo que depende del DOM: sin gesto el scroll pinta directo, con gesto viaja, un salto desde lejos pinta directo y uno con el titular a la vista viaja (`ok: true`). | `node tools/measure.mjs 1366 657 "$(cat tools/parallax-compuerta.js)"` |
| `parallax-ejes.js` | Expresión para `measure.mjs` que recorre los paneles de Identidad: panel correcto en cada tramo, posición exacta, un viaje por cambio, enganche debajo del header y sin scroll horizontal (`ok: true`). | `node tools/measure.mjs 1366 657 "$(cat tools/parallax-ejes.js)"` |
| `parallax-check.mjs` | Comprueba sin navegador la matemática del titular (umbrales con histéresis, curva del easing, duración y arranque de cada viaje). Correrlo después de tocar `useParallaxPalabra.js`. | `node tools/parallax-check.mjs` |
| `fonts.mjs` | Lista el texto del mockup agrupado por fuente y tamaño. | `node tools/fonts.mjs "design/Landing Page - V01.ai"` |
| `titulo-pos.mjs` | Posiciones exactas de las palabras del titular en el mockup. | `node tools/titulo-pos.mjs "design/Landing Page - V01.ai"` |
| `convertir-fotos.mjs` | Regenera los WebP de `src/assets` desde las fotos originales del Drive (recortes definidos adentro). | `node tools/convertir-fotos.mjs C:/ruta/originales src/assets` |

Notas: `measure.mjs` busca Chrome en `C:/Program Files/Google/Chrome/Application/chrome.exe`; en otra ruta, definir `CHROME_PATH`. Por debajo de 768 px emula touch, así `(hover: none)` es verdadero como en un celular. Las capturas de página completa no cargan las imágenes `lazy`: forzar `img.loading='eager'` y recorrer la página en la expresión antes de capturar.
