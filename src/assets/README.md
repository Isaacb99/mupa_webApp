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
| hero-exposiciones-{960,1440,1920,2880} | V04 "Id. Eje narrativo - IMG_2033" (el cráneo del carnívoro del hall, 6000x4000; en la landing, el eje Eje narrativo de Identidad, que master no usa), 3:1 a todo el ancho, filas del 10 al 60 % (`tools/convertir-fotos.mjs`, WebP 80). El tablero no dibuja esta página: la foto es nuestra (decisión R1 del desarrollador, 04/11/2026; las candidatas y por qué esta, en `tools/salida/e6-restyle/impl-listas/fotos/candidatas.md`, no versionado) | Hero de Exposiciones (HeroPagina.jsx, srcset; su punto de interés, el cráneo, en `paginas.exposiciones.imagen` de content.js) |
| hero-novedades-{960,1440,1920,2880} | "IMG_1910" de la selección (el taller grande con el equipo trabajando, 6000x4000; hasta ahora no la usaba ninguna página), 3:1 a todo el ancho, filas del 20 al 70 %, WebP 75 (con mucho detalle: en 80 el de 2880 pesaba 241 kB) | Hero de Novedades (HeroPagina.jsx, srcset; `paginas.novedades.imagen`) |
| hero-contacto-{960,1440,1920,2880} | V04 "Header - IMG_1526 v2" (la fachada con el cartel "Museo Paleontológico", 6000x5283; el hero de la landing, que master no usa), 3:1 a todo el ancho, filas del 27,14 al 65 %: el cielo y las torres arriba (el h1) y el cartel entero abajo (sus letras, del 54 al 62,2 % del original; hasta la corrección del rediseño, EST-03 del 05/11/2026, filas del 24 al 61,9 %, que cortaban el "co" del final) | Hero de Contacto (HeroPagina.jsx, srcset; `contacto.imagen`) |
| hero-divulgacion-{960,1440,1920,2880} | "Mosaico - IMG_7822" de la selección (el restaurador entre los huesos, 6000x4000; la foto 1 del mosaico de Obra de la landing, que master no usaba), 3:1 a todo el ancho, filas del 20 al 70 %: el h1 sobre los huesos fuera de foco y la mano, y la cara a la derecha del primer renglón (decisión DV6, 06/11/2026; la del tablero, de campo, mide 1000 px, no está en la selección y es la misma de Circuitos: pedir el original al museo) | Hero de Divulgación (HeroPagina.jsx, srcset; `divulgacion.hero.imagen`) |
| hero-educacion-{960,1440,1920,2880} | V04 "Id. Mision - IMG_7735" (la restauradora con el pincel en el hall, 6000x4000; el eje Misión de la landing, que master no usaba), 3:1 sin el 15 % de la derecha del original (x 0-0,85: la cara pasa al 62-70 % del ancho), filas del 9,5 al 52 %: el h1 sobre la pared y el pelo, y los ojos y la boca debajo del h1 hasta ~1640 px y a su derecha más allá (con la posicion `50% 90%` de content.js; medido de 1024 a 3440). Relleno: la del tablero (los chicos, area-educacion-1140) mide 1.140 px y no alcanza para el hero (decisión R-A del orquestador, 06/11/2026; pedir el original al museo, EDU-1) | Hero de Educación (HeroPagina.jsx, srcset; `educacion.hero.imagen`) |
| educacion-escolares-{600,1140} | area-educacion-1140 (los chicos de guardapolvo en la baranda; el original del museo, educacion.png, no está en esta PC), 10:7 con las filas del 27 al 97,4 % (`tools/convertir-fotos.mjs` con src/assets como carpeta de originales). El tablero la pone en el hero de Educación y en esta sección pone la paleontóloga del campo (relleno); acá va al revés (decisión R-B del orquestador, 06/11/2026) | "Visitas Escolares" de Educación (BloqueTextoFoto.jsx, srcset; `fotoDeVisitasEscolares` de content.js) |
| hero-circuitos-{960,1440,1920,2880} | V04 "Mosaico - IMG_1085" (el soldador con la máscara entre los caños celestes, 3744x2496; la foto 5 del mosaico de Obra de la landing, obra-soldador-*, que master no usaba), 3:1 a todo el ancho, filas del 40 al 90 %: las chispas arriba y la máscara a la derecha del h1 (posicion `62% 40%` de content.js), en WebP 65 desde el cierre de E6.3 (09/11/2026, INT-COD-03: era 75; la de 2880, de 150 a 131 kB, con el mismo recorte y sin diferencia a la vista; el soldador se queda, C3 del desarrollador). Relleno: la del tablero (de campo, 1000x993, la misma del tablero de Divulgación) no alcanza y no está en la selección; con el esqueleto de IMG_8110 (la primera propuesta) la bajada quedaba sobre una pared blanca, con el 1,5-2 % del anillo de sus letras bajo 3:1, y ninguna fila lo arreglaba (IN6 y decisión R-D del orquestador, 06/11/2026; pedir fotos de los parques al museo, pregunta 35) | Hero de Circuitos (HeroPagina.jsx, srcset; `circuitos.hero.imagen`) |
| bloque-ciencia-{600,880} | V04 "Acordeon - Ciencia" (la paleontóloga con la cuadrícula de hilos, 920x633, escaneada), 10:7 sin el marco del escaneo: columnas del 2 al 97,6 % y filas del 1 al 98,3 % (880x616 del original: la de 880 sale sin agrandar ni achicar). La misma foto que area-ciencia-570, desde el original y más abierta (decisión R-C del orquestador, 06/11/2026); relleno del tablero (pregunta 35: fotos de los dos lugares) | Los dos circuitos de Circuitos (BloqueTextoFoto.jsx, srcset; `fotoDeCircuito` de content.js). Divulgación no: este encuadre es más abierto que el del tablero, y va bloque-divulgacion-600 (abajo) |
| bloque-divulgacion-600 | V04 "Acordeon - Ciencia" (la misma foto, 920x633), 10:7 con el encuadre del tablero, el que se veía con area-ciencia-570 en su caja de 600x420 con object-cover: columnas del 15,4 al 84,6 % y filas del 14,8 al 85,2 % (636x446 del original), achicada a 600x420 en vez de estirada un 5 % (28 kB; area-ciencia-570, 35 kB). Cierre de E6.3 (DIV-FOTO-01, 09/11/2026); para la densidad 2 hace falta el original del museo (pregunta 14 de Divulgación) | Los cuatro bloques de Divulgación (BloqueTextoFoto.jsx; `fotoDeBloque` de content.js; relleno del tablero) |
| hero-el-museo-{960,1440,1920,2880} | V04 "Id. Vision - IMG_1676" (el frente del museo con las torres blancas curvas y el cartel, contra el cielo, 6000x4000; el eje Visión de la landing, eje-vision-*, que master no usaba), 3:1 de la franja x del 5 al 95 % y las filas del 0 al 45 % (5400x1800): el h1 sobre el cielo y las torres debajo; el cartel queda afuera (posicion `50% 60%` de content.js). WebP 80: 42, 23, 15 y 8 kB (casi todo cielo). Relleno: la del tablero (2823:10228) es "Header - IMG_1526 v2", que ya es el hero de Contacto (IN6 y decisión R-E del orquestador, 06/11/2026; pregunta M1 de El Museo) | Hero de El Museo (HeroPagina.jsx, srcset; `elMuseo.hero.imagen`) |
| mapa-museo.svg | Tablero "Web": desde el cierre de E6.3 (09/11/2026, decisión D15), el plano en reposo, la versión naranja de "Mapa del Museo" ("Group 3", 2996:5992): mapa-museo-hover.svg con 133 colores cambiados (las 13 salas en #EB622D, el Jardín Triásico en #CF7349, los 13 contornos en #EB622D al 70 %, la opacidad de capa del Group 3, y los 105 trazados de los nombres en #010101, que en el Group 3 van del color de la sala); la planta, las paredes y las rosetas, como están (77 kB; `tools/salida/e6-cierre/prep-mapa/herr/generar.mjs`, no versionado). Contra la captura del Group 3, el mismo color en las salas, el Jardín y la planta | "Mapa del Museo" de la Home (MapaMuseo.jsx), en reposo. Los nombres del dibujo son trazados: van además como texto en `home.mapa.espacios` de content.js |
| mapa-museo-hover.svg | Tablero "Web": "Group 4" (2999:6555, el plano bordó con los nombres de los espacios en blanco) de "Mapa del Museo", exportado en SVG con `download_assets`; sin los id ni los atributos del export en la raíz y con las coordenadas redondeadas a 2 decimales (91 → 77 kB, 19 kB con Brotli; rasterizado al doble, 381 píxeles de 2,9 millones cambian algo: `tools/salida/e6-impl-b/herr/svg-limpiar.mjs`, no versionado). Hasta el cierre de E6.3 era mapa-museo.svg (el mismo archivo, byte a byte) | "Mapa del Museo" de la Home, con el mouse sobre una sala (D15): 14 copias encima del plano, cada una recortada a su sala con un clipPath (los trazados de `src/components/mapaSalas.js`, los mismos del relleno de cada sala en los dos SVG) y transparentes hasta el hover |
| patron-galeria.svg | Tablero "Web": las piedritas de "El MuPa en imágenes" (2629:2321, 406x460 con trazo crema #EBE3DE de 2 px), exportadas y limpiadas igual que el plano (7,3 → 6,2 kB). Es el dibujo de patron-a.svg, pero a otra escala y con otro grosor de trazo | "El MuPa en imágenes" de la Home (GaleriaHome.jsx): arriba a la izquierda y, girado, abajo a la derecha; desde el 06/11/2026, también "El MuPa" de El Museo (ElMuseo.jsx: el mismo dibujo del tablero, 2826:322), arriba a la derecha y sin girar |
| logo-mupa-marca.svg | Figma, header (nodo 2318:4776) | Header y pie (la marca MuPa de 120x40 del tablero "Web", 02/11/2026); también en las bandas de Áreas, como máscara en color |
| isotipo-unsj.svg, isotipo-gobierno-san-juan.svg | Tablero "Web" de la diseñadora (Figma, 02/11/2026): "Group 2" (2629:2659, el sello de la UNSJ, 51 trazados) y "Group 1" (2629:2711, la flor de Gobierno, 25) del header de la Home, exportados en SVG con `download_assets`; las coordenadas redondeadas a 2 decimales y sin los id (52 → 36 kB y 6,1 → 3,9 kB; rasterizados a 400 px no hay diferencia visible: `tools/salida/e6-impl-a/svg-isotipo.mjs`, no versionado) | Header (Logo.jsx: los isotipos de 40x40, en blanco, a la derecha de la marca) |
| logo-formalab.svg | V04 (vectorial en el .ai, sacado con pdf.js: letras crema #EBE3DE y el punto en #EC4C2D) | Panel de Forma Lab |
| patron-a.svg, patron-b.svg, patron-c.svg | V04 (vectoriales en el .ai, sacados con pdf.js: un trazado crema de 2 px cada uno) | Piedritas del logo en los costados: intro (a), cierre de Identidad (b) y Áreas (c); las máscaras que los desvanecen están en index.css. Desde el 06/11/2026, patron-b.svg vuelve a usarse en master: "Cómo nos organizamos" de El Museo (ElMuseo.jsx, 3123:18997 del tablero, con la máscara patron-b). Las cuatro piedras rellenas de la marca MuPa que el archivo pone en el c viven en `src/components/marcaPatron.js` (Areas.jsx las enciende con el scroll) |
| hero-fachada-{768,1280,1920,2560} | V04 "Header - IMG_1526 v2", con el recorte del diseño (menos el 5,7 % de arriba y el 1,1 % de abajo), 1920x1594 | Hero (srcset) |
| carrusel-{lamas,dremel,restaurador,pincel,patio}-{700,1400} | V04 "Carrusel - IMG_1648 / 1817 / 2001 / 1862 (1) / 1605", enteras (3:2) | «El MuPa en imágenes» de la Home (Collage.jsx; en la rama landing, el carrusel de fotos entre la intro e Identidad), en ese orden de atrás hacia adelante. Desde el 06/11/2026 también El Museo (ElMuseo.jsx, con FOTOS_CARRUSEL de content.js): el patio en "El MuPa" (5:3 por CSS) y el restaurador, el torno y el pincel en los documentales (405/280 por CSS; relleno del tablero) |
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
| area-ciencia-570 | V04 "Acordeon - Ciencia" (920x633: no da para la versión de 1140; pedir el original al museo) | Área Ciencia (landing). Del 06 al 09/11/2026, en master, la foto de los cuatro bloques de Divulgación (600x420 con object-cover: con 570 px no llegaba a los 600 de la caja); desde el cierre de E6.3, bloque-divulgacion-600 |
| area-educacion-570 / -1140 | Museo, 22/09/2026 (magnific_mejorar_nVhF3TGYQD.png) | Área Educación (landing); desde el 06/11/2026, la de 1140 es el original de educacion-escolares-* (Educación de master) |
| area-produccion-570 / -1140 | V04 "Acordeon - Produccion" (render nocturno), recorte x 15,5..79,2 % | Área Producción |
| area-formalab-570 / -1140 | Museo, 22/09/2026 (lab.png) | Área Forma Lab |

Los nodos de Figma de la tabla: los del tablero "Web" son los de hoy (04/11/2026). La diseñadora reorganizó el archivo
y los 3014:* de cuando se exportaron la foto del hero, el plano, las piedritas y los isotipos de la Home ya no existen
(la Home es ahora 2627:1165, en la sección 2627:1163; CLAUDE.md, «Sitio con el diseño de la diseñadora»). Los del
Figma de la landing (2318:4776 y 2392:192) tampoco existen; los de Visitas (2846:999 y 2849:104) siguen.

Sin uso en el sitio desde el header del tablero "Web" (02/11/2026): logo-mupa-texto.svg (el texto "Museo
Paleontológico / San Juan · Argentina" del logo de 458 px del V04; el header nuevo lleva la marca sola y los isotipos).

Las fotos de la selección que usa master, para no repetirlas en un hero nuevo (R1): el pincel (IMG_1862, el hero de
Visitas y el carrusel), la mano con el torno (IMG_1817, "Museo accesible" y el carrusel), el cráneo del hall
(IMG_2033, Exposiciones), el taller grande (IMG_1910, Novedades), la fachada con el cartel (IMG_1526, Contacto), el
restaurador entre los huesos (IMG_7822, Divulgación, desde el 06/11/2026), la restauradora con el pincel (IMG_7735,
Educación, desde el 06/11/2026), el soldador (IMG_1085, Circuitos, desde el 06/11/2026), el frente contra el cielo (IMG_1676, El Museo, desde el 06/11/2026) y las otras tres del carrusel de «El MuPa en imágenes» (IMG_1648, IMG_2001 e IMG_1605);
la del hero de la Home no es de la selección; la de "Acordeon - Ciencia" va, como relleno del tablero, en los bloques de
Divulgación y en los de Circuitos, desde su original (bloque-divulgacion-600 y bloque-ciencia-*). Sin usar en master: IMG_8110, IMG_7746, IMG_1613 y la otra del
acordeón (Producción).

Sin uso en master desde la Home del tablero "Web" (02/11/2026: reemplaza a la landing, que sigue en la rama `landing`):
lo de la landing que la Home nueva ya no muestra. Sus componentes (Hero, Intro, Identidad, ObraHistorica, Areas) quedan
sin importarse y sin borrar (decisión C1 del desarrollador, 09/11/2026, al cierre de E6.3): hero-fachada-*, eje-*,
mid-fachada-piedra-*, obra-*, area-* (area-ciencia-570 fue, del 06 al 09/11/2026, la foto de los bloques de
Divulgación), logo-formalab.svg y patron-a/c.svg (patron-b.svg, desde el 06/11/2026, en El Museo). De la landing siguen en uso las cinco fotos del carrusel (carrusel-*: "El MuPa en
imágenes", Collage.jsx) y los logos de la UNSJ y de Gobierno (el pie).

Si algún día se borra alguno (por ahora se quedan: C1): fuera del sitio los siguen usando la portada del manual del panel (logo-mupa-texto.svg,
en `docs/manual/manual.html`), las fotos de ejemplo de `tools/manual.mjs` (eje-narrativo-1400, eje-vision-1400,
obra-montaje-sala-1000, area-educacion-1140 y area-formalab-1140) y `tools/iconos.mjs` (logo-mupa-texto.svg y, sin el
original, hero-fachada-2560, para og.jpg). Sin ellos, `manual.mjs` falla al preparar las fotos, `iconos.mjs` al armar
og.jpg y, con `--solo-pdf`, la portada del manual sale sin el logo y sin aviso.

Sin uso desde el V04 del 28/09/2026 (quedan por si el museo prefiere alguna): las cinco del collage del Figma
(collage-esqueleto-hall, collage-restaurador, collage-fachada-cartel, collage-render-hall y collage-exterior-cupula,
en 500 y 1000), obra-preparacion-{352,704} (era la quinta del mosaico), preparacion-fosil (IMG_1878, era Ciencia) y
la Visión del V03 (la cúpula desde abajo) quedó reemplazada en el mismo archivo. De la selección del V04, `IMG_1910.jpg`
(el taller grande) no aparece en ninguna página del archivo: desde el 04/11/2026 es el hero de Novedades.

Sin uso desde el V03 del 25/09/2026: render-cupula-esqueletos-{800,1400} (era el eje Eje narrativo), cartel-fachada (era
Visión) y eje-mision-{500,1000} (era Misión, la que mandó el museo el 22/09/2026).

Sin uso desde el Figma del 21/09/2026: cupula-render, restauradora (IMG_7735), craneo-dinosaurio (IMG_2033, franja
10-60 %), montaje-sala (IMG_8110), restauracion-detalle (IMG_7822, franja 30-80 %), dinosaurio-tecnicos (IMG_7746,
franja 0-67 %), esqueleto-sala (IMG_2011) y hall-central-render (Sala_8_02: era el bloque destacado de la intro, que el
museo decidió no usar). Los originales no se versionan; los del Drive y del V04 se convierten con
`tools/convertir-fotos.mjs`, los del Figma se descargaron del archivo de diseño y se convirtieron con `sharp` a mano
(mismo recorte que el diseño).
