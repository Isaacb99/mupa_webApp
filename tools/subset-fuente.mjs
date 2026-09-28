// Recorta la fuente variable a lo que usa el sitio y la deja en src/assets/fonts como woff2.
//
// Por qué autoalojar: el V03 de la diseñadora usa Google Sans Flex con el eje de ANCHO en 130 para "sanjuaninos"
// (medido glifo a glifo contra la fuente real), y la API de Google Fonts sirve solo el eje de peso: pedirle wdth
// devuelve caras estáticas y redondea a 125 o 150. Además, el pedido a fonts.googleapis.com demoraba ~530 ms el primer
// texto. Con la fuente en el repo tenemos los dos ejes y ninguna ida y vuelta a un tercero.
//
// Uso (la fuente original no se versiona; bajarla antes):
//   curl -L -o gsf.ttf https://github.com/google/fonts/raw/main/ofl/googlesansflex/GoogleSansFlex%5BGRAD,ROND,opsz,slnt,wdth,wght%5D.ttf
//   node tools/subset-fuente.mjs gsf.ttf
// Google Sans Flex: SIL Open Font License 1.1 sin Reserved Font Names (ofl/googlesansflex/OFL.txt).
//
// Roboto Mono no hace falta recortarla: Google ya sirve un woff2 variable por subconjunto y guardamos el de latin tal
// cual (ver tools/README.md).

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import subsetFont from 'subset-font'

const aqui = dirname(fileURLToPath(import.meta.url))
const salida = resolve(aqui, '../src/assets/fonts/google-sans-flex-latin.woff2')

// latin + latin-ext, que es lo que puede aparecer en un texto en español (más comillas, guiones y símbolos del sitio).
const rangos = [
  [0x20, 0x7e], // básico
  [0xa0, 0x17f], // latin-1 y latin extended-A (ñ, á, ü, ç…)
  [0x2018, 0x201f], // comillas
  [0x2013, 0x2014], // rayas
  [0x2022, 0x2022], // viñeta
  [0x20ac, 0x20ac], // €
  [0x2026, 0x2026], // …
]
const texto = rangos.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i))).join('')

const original = await readFile(process.argv[2] ?? resolve(aqui, '../gsf.ttf'))
const recortada = await subsetFont(original, texto, {
  targetFormat: 'woff2',
  // Se conservan los dos ejes que usa el sitio y se fijan los demás en lo que tiene el V03: el tamaño óptico en 20
  // (la óptica con la que la diseñadora armó el PDF; si quedara variable, el navegador lo movería con cada cuerpo y
  // los anchos dejarían de coincidir), sin grado, sin redondeo y sin inclinación.
  variationAxes: {
    wght: { min: 100, max: 1000 },
    wdth: { min: 100, max: 130 },
    opsz: 20,
    GRAD: 0,
    ROND: 0,
    slnt: 0,
  },
})

await mkdir(dirname(salida), { recursive: true })
await writeFile(salida, recortada)
console.log(`${salida}: ${(recortada.length / 1024).toFixed(1)} kB (original ${(original.length / 1024 / 1024).toFixed(2)} MB)`)
