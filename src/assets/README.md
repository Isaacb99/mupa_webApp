# Fotos y logos de la landing

WebP generados con `sharp` (calidad 78-80). Cada archivo está al tamaño en que se muestra (o en dos tamaños, para
`srcset`), ya recortado al aspecto de su celda cuando hizo falta. Dos orígenes:

- **Figma "MUPA"** (página "Sitio Web", frame "Institucional"): las fotos que puso el diseñador, descargadas del archivo
  con `download_assets` (los originales que sube Figma vienen a 1000-1200 px de ancho, salvo el hero, a 4096) y los
  logos en SVG tal cual los exporta Figma (blancos, con `width`/`height` en la raíz).
- **Drive del museo** ("Seleccion Fotográfica"): la selección original, para lo que el diseño todavía no cubre.

| Archivo | Origen | Uso |
|---|---|---|
| logo-mupa-marca.svg, logo-mupa-texto.svg | Figma, header (nodo 2318:4776) | Header (las dos piezas del logo); la marca también en las bandas de Áreas, como máscara en color |
| hero-fachada-{768,1280,1920,2560} | Figma "IMG_1524 1" (2318:4642), con el recorte del diseño (franja vertical 11-80 %) | Hero (srcset) |
| render-cupula-esqueletos-{800,1400} | Figma "HighresScreenshot00013" (render, 2250×1266) | Identidad, panel Eje narrativo (srcset) |
| cupula-render | Drive, Sala_8_01 | Identidad, panel Misión (provisorio) |
| cartel-fachada | Drive, IMG_1676 | Identidad, panel Visión (provisorio) |
| collage-exterior-cupula-{500,1000} | Figma "05 1" | Collage de Identidad, capa del fondo |
| collage-render-hall-{500,1000} | Figma "04 1" | Collage, capa 2 |
| collage-restaurador-{500,1000} | Figma "02 1" | Collage, capa 3 |
| collage-fachada-cartel-{500,1000} | Figma "03 1" | Collage, capa 4 |
| collage-esqueleto-hall-{500,1000} | Figma "01 1" | Collage, capa de adelante |
| logo-gobierno-san-juan.svg, logo-unsj.svg | Figma "Group 2" y "Group 3" (2392:192) | Cierre de Identidad y footer |
| obra-restauracion-{500,1000} | Figma "06 1" | Mosaico de Obra, foto 1 (arriba a la izquierda) |
| obra-carnivoro-hall-{600,1200} | Figma "07 1" | Mosaico, foto 2 (la grande) |
| obra-fachada-{500,1000} | Figma "08 1" | Mosaico, foto 3 (derecha) |
| obra-montaje-sala-{500,1000} | Figma "09 1" | Mosaico, foto 4 (abajo) |
| obra-preparacion-{352,704} | Figma "10 1" | Mosaico, foto 5 (vertical, derecha) |
| preparacion-fosil | Drive, IMG_1878 | Área Ciencia (provisorio: el V02 trae otra foto, solo en baja resolución) |
| area-educacion-570 / -1140 | Museo, 22/09/2026 (magnific_mejorar_nVhF3TGYQD.png) | Área Educación |
| area-produccion-570 / -1140 | Museo, 22/09/2026 (IMG_0065.jpg) | Área Producción |
| area-formalab-570 / -1140 | Museo, 22/09/2026 (lab.png) | Área Forma Lab |

Sin uso desde el Figma del 21/09/2026 (quedan por si el museo prefiere alguna): restauradora (IMG_7735, era la de Educación hasta que el museo mandó la suya, 22/09/2026), craneo-dinosaurio (IMG_2033, franja
10-60 %), montaje-sala (IMG_8110), restauracion-detalle (IMG_7822, franja 30-80 %), dinosaurio-tecnicos (IMG_7746,
franja 0-67 %), esqueleto-sala (IMG_2011) y hall-central-render (Sala_8_02: era el bloque destacado de la intro, que el
museo decidió no usar). Los originales no se versionan; los del Drive se convierten con
`tools/convertir-fotos.mjs`, los del Figma se descargaron del archivo de diseño y se convirtieron con `sharp` a mano
(mismo recorte que el diseño; los WebP del hero llevan calidad 80).
