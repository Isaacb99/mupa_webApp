import sharp from 'sharp';
import path from 'node:path';
import { existsSync } from 'node:fs';
const [orig, out] = process.argv.slice(2);
if (!orig || !out) { console.error('Uso: node tools/convertir-fotos.mjs <carpeta-originales> <carpeta-salida>'); process.exit(1); }
// x0/x1: franja horizontal a conservar (fracción del ancho) antes de recortar al aspecto final; y0/y1, lo mismo en
// vertical (los recortes del V04 vienen de los rectángulos de recorte del PDF, medidos con pdf.js).
const JOBS = [
  ['IMG_1526.jpg',   'fachada-mupa-1920', 1920, 1280],
  ['IMG_1526.jpg',   'fachada-mupa-1280', 1280,  853],
  ['IMG_1526.jpg',   'fachada-mupa-768',   768,  512],
  ['Sala_8_02.jpeg', 'hall-central-render', 1600, 900],
  ['Sala_8_01.jpeg', 'cupula-render',       1400, 1050],
  ['IMG_2033.jpg',   'craneo-dinosaurio',   1000, 1334, 0.10, 0.60],
  ['IMG_1676.jpg',   'cartel-fachada',      1000,  750],
  ['IMG_8110.jpg',   'montaje-sala',        1400,  875],
  ['IMG_7822.jpg',   'restauracion-detalle',1000, 1334, 0.30, 0.80],
  ['IMG_7746.jpg',   'dinosaurio-tecnicos',  900,  900, 0.00, 0.67],
  ['IMG_2011.jpg',   'esqueleto-sala',       900,  900],
  ['IMG_1878.jpg',   'preparacion-fosil',   1200,  900],
  ['IMG_7735.jpg',   'restauradora',        1200,  900],
  // Fotos de las bandas de Áreas que mandó el museo el 22/09/2026 (Drive): recorte casi cuadrado (569x566 en el panel).
  ['educacion.png',  'area-educacion-1140', 1140, 1134, 0.22, 0.8597],
  ['educacion.png',  'area-educacion-570',   570,  567, 0.22, 0.8597],
  ['produccion.jpg', 'area-produccion-1140',1140, 1134, 0.10, 0.7702],
  ['produccion.jpg', 'area-produccion-570',  570,  567, 0.10, 0.7702],
  ['formalab.png',   'area-formalab-1140',  1140, 1134, 0.03, 0.7714],
  ['formalab.png',   'area-formalab-570',    570,  567, 0.03, 0.7714],
  // Foto del eje Misión de Identidad (la mandó el museo el 22/09/2026); el original ya viene apaisado, sin recorte.
  ['eje-mision.png', 'eje-mision-1000',     1000,  455],
  ['eje-mision.png', 'eje-mision-500',       500,  228],
  // Fotos de los tres ejes de Identidad, sacadas del PDF V03 de la diseñadora (25/09/2026). Marco 710x476 en lg.
  ['eje-mision-v03.jpg',   'eje-mision-1400',    1400, 938],
  ['eje-mision-v03.jpg',   'eje-mision-800',      800, 536],
  ['eje-vision-v03.jpg',   'eje-vision-1400',    1400, 938],
  ['eje-vision-v03.jpg',   'eje-vision-800',      800, 536],
  ['eje-narrativo-v03.jpg','eje-narrativo-1400', 1400, 938],
  ['eje-narrativo-v03.jpg','eje-narrativo-800',   800, 536],
  // V04 de la diseñadora (28/09/2026), carpeta "Seleccion Fotográfica" del Drive. Recortes leídos del PDF (fracción del
  // original que queda dentro del rectángulo de recorte de cada foto).
  // Hero: la foto entera menos el 5,7 % de arriba y el 1,1 % de abajo, a 1920x1594 (1440x1195,5 en el sitio).
  ['Header - IMG_1526 v2.jpg', 'hero-fachada-2560', 2560, 2125, 0.0057, 0.9943, 0.057, 0.989],
  ['Header - IMG_1526 v2.jpg', 'hero-fachada-1920', 1920, 1594, 0.0057, 0.9943, 0.057, 0.989],
  ['Header - IMG_1526 v2.jpg', 'hero-fachada-1280', 1280, 1063, 0.0057, 0.9943, 0.057, 0.989],
  ['Header - IMG_1526 v2.jpg', 'hero-fachada-768',   768,  638, 0.0057, 0.9943, 0.057, 0.989],
  // Carrusel (las cinco fotos del bloque nuevo, 3:2 enteras; la más grande mide 667 px a 1440).
  ['Carrusel - IMG_1648.jpg',     'carrusel-lamas-1400',        1400, 933],
  ['Carrusel - IMG_1648.jpg',     'carrusel-lamas-700',          700, 467],
  ['Carrusel - IMG_1817.jpg',     'carrusel-dremel-1400',       1400, 933],
  ['Carrusel - IMG_1817.jpg',     'carrusel-dremel-700',         700, 467],
  ['Carrusel - IMG_2001.jpg',     'carrusel-restaurador-1400',  1400, 933],
  ['Carrusel - IMG_2001.jpg',     'carrusel-restaurador-700',    700, 467],
  ['Carrusel - IMG_1862 (1).jpg', 'carrusel-pincel-1400',       1400, 933],
  ['Carrusel - IMG_1862 (1).jpg', 'carrusel-pincel-700',         700, 467],
  ['Carrusel - IMG_1605.jpg',     'carrusel-patio-1400',        1400, 933],
  ['Carrusel - IMG_1605.jpg',     'carrusel-patio-700',          700, 467],
  // Eje Visión: el cartel de la fachada (entera; en el PDF el recorte deja fuera un 1,5 % de cada lado).
  ['Id. Vision - IMG_1676.jpg',   'eje-vision-1400',            1400, 938],
  ['Id. Vision - IMG_1676.jpg',   'eje-vision-800',              800, 536],
  // Foto "Mid" (bloque nuevo entre los ejes y el cierre): 1215 px de ancho a 1440, 3:2.
  ['Mid - IMG_1613.jpg',          'mid-fachada-piedra-2000',    2000, 1333, 0.007, 0.874, 0.01, 0.877],
  ['Mid - IMG_1613.jpg',          'mid-fachada-piedra-1300',    1300,  867, 0.007, 0.874, 0.01, 0.877],
  // Mosaico de Obra, celda vertical (390x553 a 1440): el soldador, recortado a la franja central.
  ['Mosaico - IMG_1085.jpg',      'obra-soldador-780',           780, 1106, 0.283, 0.745, 0.017, 1],
  ['Mosaico - IMG_1085.jpg',      'obra-soldador-390',           390,  553, 0.283, 0.745, 0.017, 1],
  // Paneles de Áreas (casi cuadrados, 569x566): Ciencia viene en 920x633, así que solo hay versión de 570 (pedir el
  // original); Producción es el render nocturno, recortado alrededor de la pantalla.
  ['Acordeon - Ciencia.jpg',      'area-ciencia-570',            570,  567, 0.154, 0.846],
  ['Acordeon - Produccion.png',   'area-produccion-1140',       1140, 1134, 0.155, 0.792],
  ['Acordeon - Produccion.png',   'area-produccion-570',         570,  567, 0.155, 0.792],
];
(async () => {
  let total = 0;
  for (const [src, name, w, h, x0, x1, y0, y1] of JOBS) {
    // Cada tanda de originales llega por separado: los que no están en la carpeta se saltean.
    if (!existsSync(path.join(orig, src))) { console.log(`(sin ${src}: salteado ${name})`); continue; }
    let img = sharp(path.join(orig, src)).rotate();
    if (x0 !== undefined) {
      const m = await img.metadata();
      const left = Math.round(m.width * x0), width = Math.round(m.width * (x1 - x0));
      const top = Math.round(m.height * (y0 ?? 0)), height = Math.round(m.height * ((y1 ?? 1) - (y0 ?? 0)));
      img = img.extract({ left, top, width, height });
    }
    // El hero va a calidad 80 (es la foto más grande y la primera que se ve); el resto a 78.
    const info = await img.resize(w, h, { fit: 'cover', position: 'centre' })
      .webp({ quality: name.startsWith('hero-') ? 80 : 78, effort: 5 }).toFile(path.join(out, name + '.webp'));
    total += info.size;
    console.log(`${(name + '.webp').padEnd(26)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
  console.log(`TOTAL ${(total / 1024).toFixed(0)} KB`);
})();
