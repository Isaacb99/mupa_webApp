import sharp from 'sharp';
import path from 'node:path';
import { existsSync } from 'node:fs';
const [orig, out] = process.argv.slice(2);
if (!orig || !out) { console.error('Uso: node tools/convertir-fotos.mjs <carpeta-originales> <carpeta-salida>'); process.exit(1); }
// x0/x1: franja horizontal a conservar (fracción del ancho) antes de recortar al aspecto final
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
];
(async () => {
  let total = 0;
  for (const [src, name, w, h, x0, x1] of JOBS) {
    // Cada tanda de originales llega por separado: los que no están en la carpeta se saltean.
    if (!existsSync(path.join(orig, src))) { console.log(`(sin ${src}: salteado ${name})`); continue; }
    let img = sharp(path.join(orig, src)).rotate();
    if (x0 !== undefined) {
      const m = await img.metadata();
      const left = Math.round(m.width * x0), width = Math.round(m.width * (x1 - x0));
      img = img.extract({ left, top: 0, width, height: m.height });
    }
    const info = await img.resize(w, h, { fit: 'cover', position: 'centre' })
      .webp({ quality: 78, effort: 5 }).toFile(path.join(out, name + '.webp'));
    total += info.size;
    console.log(`${(name + '.webp').padEnd(26)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
  console.log(`TOTAL ${(total / 1024).toFixed(0)} KB`);
})();
