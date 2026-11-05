# Fotos y logos de la landing

WebP generados con `sharp` (calidad 78; el hero, 80). Cada archivo está al tamaño en que se muestra (o en dos tamaños,
para `srcset`), ya recortado al aspecto de su celda cuando hizo falta. Tres orígenes:

- **"Seleccion Fotográfica" del V04 de la diseñadora** (Drive, 28/09/2026): las fotos que el V04 asigna a cada lugar,
  con el recorte leído de los rectángulos de recorte del PDF (`tools/convertir-fotos.mjs`).
- **Figma "MUPA"** (página "Sitio Web", frame "Institucional"): las fotos del mosaico de Obra (el V04 mantuvo cuatro),
  descargadas del archivo con `download_assets`, y los logos en SVG tal cual los exporta Figma (blancos, con
  `width`/`height` en la raíz).
- **El museo** (Drive del 22/09/2026): las fotos de los paneles de Educación y Forma Lab.

| Archivo | Origen | Uso |
|---|---|---|
| hero-esqueletos-{800,1280,1440,1920,2394} | Tablero "Web" de la diseñadora (Figma, 02/11/2026): la foto del hero de la Home ("image 1", 2627:1169), el original que tiene el archivo (2394x1346, el más grande que hay: no está en la "Seleccion Fotográfica"; pedir el original al museo), bajado con `download_assets` y convertido con `sharp` a WebP 80, sin recorte (`tools/salida/e6-impl-b/herr/hero.mjs`, no versionado) | Hero de la Home (HeroHome.jsx, srcset; el encuadre del tablero lo hace el CSS) |
| hero-visitas-{960,1440,1920,2880} | V04 "Carrusel - IMG_1862 (1)" (el pincel sobre el fósil, 6000x4000), la foto del hero de Visitas del tablero "Web" (Figma, nodo 2846:999, 03/11/2026). El tablero la estira (la de 1400x933 en un rectángulo de 1439x720); acá va sin deformar: 3:1 a todo el ancho del original y con la punta del pincel sobre el fósil a la misma altura que en el tablero, filas del 33,9 al 83,9 % (`tools/convertir-fotos.mjs`, WebP 80) | Hero de Visitas (HeroPagina.jsx, srcset) |
| visitas-accesibilidad-{600,900,1200} | V04 "Carrusel - IMG_1817" (la mano con el torno, 6000x4000), recortada a 5:3 desde el centro (sin el 5 % de arriba y de abajo), como la cubre el tablero en su caja de 600x360 (nodo 2849:104) | "Museo accesible" de Visitas (srcset) |
| mapa-museo.svg | Tablero "Web": "Group 4" (2999:6555, el plano bordó con los nombres de los espacios) de "Mapa del Museo", exportado en SVG con `download_assets`; sin los id ni los atributos del export en la raíz y con las coordenadas redondeadas a 2 decimales (91 → 77 kB, 19 kB con Brotli; rasterizado al doble, 381 píxeles de 2,9 millones cambian algo: `tools/salida/e6-impl-b/herr/svg-limpiar.mjs`, no versionado) | "Mapa del Museo" de la Home (MapaMuseo.jsx). Los nombres del dibujo son trazados: van además como texto en `home.mapa.espacios` de content.js |
| patron-galeria.svg | Tablero "Web": las piedritas de "El MuPa en imágenes" (2629:2321, 406x460 con trazo crema #EBE3DE de 2 px), exportadas y limpiadas igual que el plano (7,3 → 6,2 kB). Es el dibujo de patron-a.svg, pero a otra escala y con otro grosor de trazo | "El MuPa en imágenes" de la Home (GaleriaHome.jsx): arriba a la izquierda y, girado, abajo a la derecha |
| logo-mupa-marca.svg | Figma, header (nodo 2318:4776) | Header y pie (la marca MuPa de 120x40 del tablero "Web", 02/11/2026); también en las bandas de Áreas, como máscara en color |
| isotipo-unsj.svg, isotipo-gobierno-san-juan.svg | Tablero "Web" de la diseñadora (Figma, 02/11/2026): "Group 2" (2629:2659, el sello de la UNSJ, 51 trazados) y "Group 1" (2629:2711, la flor de Gobierno, 25) del header de la Home, exportados en SVG con `download_assets`; las coordenadas redondeadas a 2 decimales y sin los id (52 → 36 kB y 6,1 → 3,9 kB; rasterizados a 400 px no hay diferencia visible: `tools/salida/e6-impl-a/svg-isotipo.mjs`, no versionado) | Header (Logo.jsx: los isotipos de 40x40, en blanco, a la derecha de la marca) |
| logo-formalab.svg | V04 (vectorial en el .ai, sacado con pdf.js: letras crema #EBE3DE y el punto en #EC4C2D) | Panel de Forma Lab |
| patron-a.svg, patron-b.svg, patron-c.svg | V04 (vectoriales en el .ai, sacados con pdf.js: un trazado crema de 2 px cada uno) | Piedritas del logo en los costados: intro (a), cierre de Identidad (b) y Áreas (c); las máscaras que los desvanecen están en index.css. Las cuatro piedras rellenas de la marca MuPa que el archivo pone en el c viven en `src/components/marcaPatron.js` (Areas.jsx las enciende con el scroll) |
| hero-fachada-{768,1280,1920,2560} | V04 "Header - IMG_1526 v2", con el recorte del diseño (menos el 5,7 % de arriba y el 1,1 % de abajo), 1920x1594 | Hero (srcset) |
| carrusel-{lamas,dremel,restaurador,pincel,patio}-{700,1400} | V04 "Carrusel - IMG_1648 / 1817 / 2001 / 1862 (1) / 1605", enteras (3:2) | «El MuPa en imágenes» de la Home (Collage.jsx; en la rama landing, el carrusel de fotos entre la intro e Identidad), en ese orden de atrás hacia adelante |
| eje-mision-{800,1400} | V03 de la diseñadora (PDF, 25/09/2026), 2029×1352 | Identidad, eje Misión (srcset) |
| eje-vision-{800,1400} | V04 "Id. Vision - IMG_1676" (el cartel de la fachada), entera | Identidad, eje Visión (srcset) |
| eje-narrativo-{800,1400} | V03 (PDF, 25/09/2026), 2016×1344 | Identidad, eje Eje narrativo (srcset) |
| mid-fachada-piedra-{1300,2000} | V04 "Mid - IMG_1613", recorte x 0,7..87,4 %, y 1..87,7 % (3:2) | Foto sola entre los ejes y el cierre de Identidad |
| logo-gobierno-san-juan.svg | Figma "Group 2" (2392:192) | Cierre de Identidad y pie (a 42 px de alto en el pie del tablero "Web") |
| logo-unsj.svg | PDF oficial de la universidad ("Logo UNSJ.pdf", Illustrator, 28/09/2026), convertido a SVG con pdf.js (79 trazados blancos, viewBox recortado a la tinta); hasta entonces el "Group 3" del Figma, que era el mismo dibujo | Cierre de Identidad y pie (a 42 px de alto en el pie del tablero "Web") |
| obra-restauracion-{500,1000} | Figma "06 1" | Mosaico de Obra, foto 1 (arriba a la izquierda) |
| obra-carnivoro-hall-{600,1200} | Figma "07 1" | Mosaico, foto 2 (la grande) |
| obra-fachada-{500,1000} | Figma "08 1" | Mosaico, foto 3 (derecha) |
| obra-montaje-sala-{500,1000} | Figma "09 1" | Mosaico, foto 4 (abajo) |
| obra-soldador-{390,780} | V04 "Mosaico - IMG_1085", franja x 28,3..74,5 %, y 1,7..100 % | Mosaico, foto 5 (vertical, derecha) |
| area-ciencia-570 | V04 "Acordeon - Ciencia" (920x633: no da para la versión de 1140; pedir el original al museo) | Área Ciencia |
| area-educacion-570 / -1140 | Museo, 22/09/2026 (magnific_mejorar_nVhF3TGYQD.png) | Área Educación |
| area-produccion-570 / -1140 | V04 "Acordeon - Produccion" (render nocturno), recorte x 15,5..79,2 % | Área Producción |
| area-formalab-570 / -1140 | Museo, 22/09/2026 (lab.png) | Área Forma Lab |

Los nodos de Figma de la tabla: los del tablero "Web" son los de hoy (04/11/2026). La diseñadora reorganizó el archivo
y los 3014:* de cuando se exportaron la foto del hero, el plano, las piedritas y los isotipos de la Home ya no existen
(la Home es ahora 2627:1165, en la sección 2627:1163; CLAUDE.md, «Sitio con el diseño de la diseñadora»). Los del
Figma de la landing (2318:4776 y 2392:192) tampoco existen; los de Visitas (2846:999 y 2849:104) siguen.

Sin uso en el sitio desde el header del tablero "Web" (02/11/2026): logo-mupa-texto.svg (el texto "Museo
Paleontológico / San Juan · Argentina" del logo de 458 px del V04; el header nuevo lleva la marca sola y los isotipos).

Sin uso en master desde la Home del tablero "Web" (02/11/2026: reemplaza a la landing, que sigue en la rama `landing`):
lo de la landing que la Home nueva ya no muestra. Sus componentes (Hero, Intro, Identidad, ObraHistorica, Areas) quedan
sin importarse hasta el cierre, donde se decide si se borran: hero-fachada-*, eje-*, mid-fachada-piedra-*, obra-*,
area-*, logo-formalab.svg y patron-a/b/c.svg. De la landing siguen en uso las cinco fotos del carrusel (carrusel-*: "El
MuPa en imágenes", Collage.jsx) y los logos de la UNSJ y de Gobierno (el pie).

Antes de borrar alguno al cierre: fuera del sitio los siguen usando la portada del manual del panel (logo-mupa-texto.svg,
en `docs/manual/manual.html`), las fotos de ejemplo de `tools/manual.mjs` (eje-narrativo-1400, eje-vision-1400,
obra-montaje-sala-1000, area-educacion-1140 y area-formalab-1140) y `tools/iconos.mjs` (logo-mupa-texto.svg y, sin el
original, hero-fachada-2560, para og.jpg). Sin ellos, `manual.mjs` falla al preparar las fotos, `iconos.mjs` al armar
og.jpg y, con `--solo-pdf`, la portada del manual sale sin el logo y sin aviso.

Sin uso desde el V04 del 28/09/2026 (quedan por si el museo prefiere alguna): las cinco del collage del Figma
(collage-esqueleto-hall, collage-restaurador, collage-fachada-cartel, collage-render-hall y collage-exterior-cupula,
en 500 y 1000), obra-preparacion-{352,704} (era la quinta del mosaico), preparacion-fosil (IMG_1878, era Ciencia) y
la Visión del V03 (la cúpula desde abajo) quedó reemplazada en el mismo archivo. De la selección del V04 no se usa
`IMG_1910.jpg` (el taller grande): no aparece en ninguna página del archivo.

Sin uso desde el V03 del 25/09/2026: render-cupula-esqueletos-{800,1400} (era el eje Eje narrativo), cartel-fachada (era
Visión) y eje-mision-{500,1000} (era Misión, la que mandó el museo el 22/09/2026).

Sin uso desde el Figma del 21/09/2026: cupula-render, restauradora (IMG_7735), craneo-dinosaurio (IMG_2033, franja
10-60 %), montaje-sala (IMG_8110), restauracion-detalle (IMG_7822, franja 30-80 %), dinosaurio-tecnicos (IMG_7746,
franja 0-67 %), esqueleto-sala (IMG_2011) y hall-central-render (Sala_8_02: era el bloque destacado de la intro, que el
museo decidió no usar). Los originales no se versionan; los del Drive y del V04 se convierten con
`tools/convertir-fotos.mjs`, los del Figma se descargaron del archivo de diseño y se convirtieron con `sharp` a mano
(mismo recorte que el diseño).
