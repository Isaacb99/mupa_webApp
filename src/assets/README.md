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
| logo-mupa-marca.svg, logo-mupa-texto.svg | Figma, header (nodo 2318:4776) | Header (las dos piezas del logo); la marca también en las bandas de Áreas, como máscara en color |
| logo-formalab.svg | V04 (vectorial en el .ai, sacado con pdf.js: letras crema #EBE3DE y el punto en #EC4C2D) | Panel de Forma Lab |
| patron-a.svg, patron-b.svg, patron-c.svg | V04 (vectoriales en el .ai, sacados con pdf.js: un trazado crema de 2 px cada uno) | Piedritas del logo en los costados: intro (a), cierre de Identidad (b) y Áreas (c); las máscaras que los desvanecen están en index.css. Las cuatro piedras rellenas de la marca MuPa que el archivo pone en el c viven en `src/components/marcaPatron.js` (Areas.jsx las enciende con el scroll) |
| hero-fachada-{768,1280,1920,2560} | V04 "Header - IMG_1526 v2", con el recorte del diseño (menos el 5,7 % de arriba y el 1,1 % de abajo), 1920x1594 | Hero (srcset) |
| carrusel-{lamas,dremel,restaurador,pincel,patio}-{700,1400} | V04 "Carrusel - IMG_1648 / 1817 / 2001 / 1862 (1) / 1605", enteras (3:2) | Carrusel de fotos entre la intro e Identidad (Collage.jsx), en ese orden de atrás hacia adelante |
| eje-mision-{800,1400} | V03 de la diseñadora (PDF, 25/09/2026), 2029×1352 | Identidad, eje Misión (srcset) |
| eje-vision-{800,1400} | V04 "Id. Vision - IMG_1676" (el cartel de la fachada), entera | Identidad, eje Visión (srcset) |
| eje-narrativo-{800,1400} | V03 (PDF, 25/09/2026), 2016×1344 | Identidad, eje Eje narrativo (srcset) |
| mid-fachada-piedra-{1300,2000} | V04 "Mid - IMG_1613", recorte x 0,7..87,4 %, y 1..87,7 % (3:2) | Foto sola entre los ejes y el cierre de Identidad |
| logo-gobierno-san-juan.svg, logo-unsj.svg | Figma "Group 2" y "Group 3" (2392:192) | Cierre de Identidad y footer |
| obra-restauracion-{500,1000} | Figma "06 1" | Mosaico de Obra, foto 1 (arriba a la izquierda) |
| obra-carnivoro-hall-{600,1200} | Figma "07 1" | Mosaico, foto 2 (la grande) |
| obra-fachada-{500,1000} | Figma "08 1" | Mosaico, foto 3 (derecha) |
| obra-montaje-sala-{500,1000} | Figma "09 1" | Mosaico, foto 4 (abajo) |
| obra-soldador-{390,780} | V04 "Mosaico - IMG_1085", franja x 28,3..74,5 %, y 1,7..100 % | Mosaico, foto 5 (vertical, derecha) |
| area-ciencia-570 | V04 "Acordeon - Ciencia" (920x633: no da para la versión de 1140; pedir el original al museo) | Área Ciencia |
| area-educacion-570 / -1140 | Museo, 22/09/2026 (magnific_mejorar_nVhF3TGYQD.png) | Área Educación |
| area-produccion-570 / -1140 | V04 "Acordeon - Produccion" (render nocturno), recorte x 15,5..79,2 % | Área Producción |
| area-formalab-570 / -1140 | Museo, 22/09/2026 (lab.png) | Área Forma Lab |

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
