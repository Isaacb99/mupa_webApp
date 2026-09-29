// Genera los archivos de public/ que no salen del código: favicon.ico (32 px, PNG adentro de un contenedor ICO) y
// apple-touch-icon.png (180 px, sin esquinas redondeadas: iOS las pone) a partir de public/favicon.svg, y og.jpg
// (1200x630: la tarjeta que muestran WhatsApp, Instagram o X al compartir el link) a partir de la foto del hero con
// el degradé de arriba y el logo, como en el header. Toma el original si se le pasa la ruta; si no, el hero de
// src/assets (2560 px, ya recortado al 5,7..98,9 % del original), que alcanza de sobra para 1200 px.
// Uso: node tools/iconos.mjs ["C:/ruta/Header - IMG_1526 v2.jpg"]
import sharp from 'sharp'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const [original] = process.argv.slice(2)
const svg = readFileSync('public/favicon.svg')

// PNG de 32 px envuelto en un ICO: cabecera (6 bytes) + una entrada de directorio (16) + el PNG tal cual. Chrome, Edge,
// Firefox y Safari leen ICO con PNG adentro desde hace más de diez años.
const png32 = await sharp(svg).resize(32, 32).png().toBuffer()
const ico = Buffer.alloc(6 + 16)
ico.writeUInt16LE(0, 0) // reservado
ico.writeUInt16LE(1, 2) // tipo: ícono
ico.writeUInt16LE(1, 4) // cantidad de imágenes
ico.writeUInt8(32, 6) // ancho
ico.writeUInt8(32, 7) // alto
ico.writeUInt8(0, 8) // paleta
ico.writeUInt8(0, 9) // reservado
ico.writeUInt16LE(1, 10) // planos
ico.writeUInt16LE(32, 12) // bits por píxel
ico.writeUInt32LE(png32.length, 14) // tamaño de la imagen
ico.writeUInt32LE(22, 18) // desplazamiento de la imagen
writeFileSync('public/favicon.ico', Buffer.concat([ico, png32]))
console.log(`public/favicon.ico  32x32  ${(ico.length + png32.length)} bytes`)

// apple-touch-icon: el mismo dibujo sin el redondeo (rx) del cuadrado.
const sinRedondeo = svg.toString().replace(' rx="14"', '')
const touch = await sharp(Buffer.from(sinRedondeo)).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log(`public/apple-touch-icon.png  ${touch.width}x${touch.height}  ${touch.size} bytes`)

// og.jpg: la franja de la foto con el cartel y la entrada (del 32 % al 92 % del alto del original; el hero del repo ya
// viene recortado, así que ahí es del 28,2 % al 92,6 %), a 1200x630, con el degradé negro de arriba (como el del hero,
// hasta el 40 % del alto) y el logo a 70 px del borde, como en el header (marca 145 px, texto 279 px a partir de 161,
// 4,8 px más abajo).
const conOriginal = original && existsSync(original)
if (original && !conOriginal) console.log(`(no encuentro ${original}: uso el hero del repo)`)
const foto = conOriginal ? original : 'src/assets/hero-fachada-2560.webp'
const [y0, y1] = conOriginal ? [0.32, 0.9164] : [0.282, 0.926]
const ANCHO = 1200, ALTO = 630
const m = await sharp(foto).rotate().metadata()
const top = Math.round(m.height * y0), alto = Math.round(m.height * (y1 - y0))
const base = await sharp(foto).rotate().extract({ left: 0, top, width: m.width, height: alto }).resize(ANCHO, ALTO, { fit: 'cover' }).toBuffer()
const degrade = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    '<stop offset="0" stop-color="#0e100d" stop-opacity="1"/><stop offset="0.25" stop-color="#0e100d" stop-opacity="0.52"/>' +
    '<stop offset="0.6" stop-color="#0e100d" stop-opacity="0.12"/><stop offset="1" stop-color="#0e100d" stop-opacity="0"/></linearGradient></defs>' +
    `<rect width="${ANCHO}" height="${Math.round(ALTO * 0.55)}" fill="url(#g)"/></svg>`,
)
const marca = await sharp(readFileSync('src/assets/logo-mupa-marca.svg')).resize({ width: 145 }).png().toBuffer()
const texto = await sharp(readFileSync('src/assets/logo-mupa-texto.svg')).resize({ width: 279 }).png().toBuffer()
const og = await sharp(base)
  .composite([
    { input: degrade, left: 0, top: 0 },
    { input: marca, left: 70, top: 60 },
    { input: texto, left: 70 + 161, top: 60 + 5 },
  ])
  .jpeg({ quality: 82 })
  .toFile('public/og.jpg')
console.log(`public/og.jpg  ${og.width}x${og.height}  ${(og.size / 1024).toFixed(0)} KB`)
