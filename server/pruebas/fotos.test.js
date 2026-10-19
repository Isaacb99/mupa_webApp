// Fotos (E3.1; plan 7, 13.1 y las decisiones del desarrollador del 15/10/2026: en Postgres, achique en el navegador).
// Sin base (corren siempre): el procesado con sharp (tipo real, EXIF y GPS fuera, orientación, variantes sin agrandar,
// SVG, HEIC y texto -> 415, 60 megapíxeles -> 413, dañada -> 400, el tope de tiempo), la cola, la caché y el semáforo
// del almacén, la ruta /fotos sin base, los mensajes y la lógica del achique del panel (panel/src/achicarFoto.js).
// Con base: POST /fotos de punta a punta (la foto y sus cinco archivos, servidos con sus cabeceras; la maestra no se
// publica; HEAD, 304, 404 con no-store), que multer no corre antes de la sesión, el rol, el CSRF ni el límite, que una
// falla en medio de la transacción no deja nada, PATCH /fotos/:id, liberarFotos, las huérfanas de la tarea diaria, que
// las lecturas a la base son como mucho 2 a la vez y que la lista de usos coincide con las claves foráneas de la base.
// Desde la corrección de E3 (16/10/2026): un JPG progresivo o un PNG entrelazado que ocuparía demasiada memoria da 413
// sin decodificarse, una imagen muy alta sale con sus salidas de hasta 16383 px de alto (antes, "dañada"), como mucho 3
// subidas en curso (la cuarta, 503 sin leer el archivo), la fila de lecturas espera (hasta 1000, 10 s) en vez de dar 503
// en el momento, y lo que no existe se recuerda.
// Las imágenes se arman acá con sharp (nada de archivos en el repo).
import assert from 'node:assert/strict'
import { request } from 'node:http'
import { crc32 } from 'node:zlib'
import { after, before, describe, test } from 'node:test'
import express from 'express'
import sharp from 'sharp'
import {
  ARCHIVOS_PUBLICOS,
  FOTO_BYTES_MAX,
  MENSAJE_HEIC,
  MENSAJE_PROGRESIVA,
  MENSAJE_SVG,
  MENSAJE_TIPO,
  megas,
  mensajePeso,
  urlFoto,
} from '../../compartido/fotos.js'
import {
  AREA_MAX_LIENZO,
  BYTES_SIN_ACHICAR,
  elegirEnvio,
  formatoDeSalida,
  hayQueAchicar,
  medidasAchicadas,
  nombreConExtension,
  tieneTransparencia,
} from '../../panel/src/achicarFoto.js'
import { crearAlmacen, crearLru, crearSemaforo } from '../fotos/almacen.js'
import { crearCola, MENSAJE_COLA_LLENA } from '../fotos/cola.js'
import {
  formatoPorFirma,
  LADO_MAX,
  MEMORIA_PROGRESIVA_MAX,
  memoriaAlDecodificar,
  pareceHeic,
  procesarFoto,
} from '../fotos/procesar.js'
import { coincideEtag, crearRutaDeFotos } from '../fotos/servir.js'
import { condicionEnUso, USOS_DE_FOTOS } from '../fotos/usos.js'
import { crearRegistroDeTareas, programarTareas } from '../tareas.js'
import {
  cerrarBase,
  contarConsultas,
  escucharLogs,
  levantar,
  multipart,
  prepararBase,
  salteoVisible,
  sql,
} from './ayudas.js'

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

// --- Imágenes de prueba ---

/** Una foto de color liso (lo que importa son las medidas y el formato, no el contenido). */
function lisa({ ancho = 2600, alto = 1600, formato = 'jpeg', alfa = false } = {}) {
  const fondo = alfa ? { r: 30, g: 120, b: 200, alpha: 0.5 } : { r: 122, g: 82, b: 48 }
  return sharp({ create: { width: ancho, height: alto, channels: alfa ? 4 : 3, background: fondo } })[formato]().toBuffer()
}

/** Un JPEG con EXIF y GPS, como el de un teléfono. */
async function conGps({ ancho = 2600, alto = 1600 } = {}) {
  return sharp(await lisa({ ancho, alto }))
    .withExif({
      IFD0: { Make: 'TelefonoDePrueba', Copyright: 'Persona de prueba' },
      IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '31/1 32/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '68/1 31/1 0/1' },
    })
    .jpeg()
    .toBuffer()
}

/** 300x200: la mitad izquierda roja y la derecha azul, guardada con Orientation 6 (se ve girada 90° a la derecha). */
async function girada() {
  const azul = await sharp({ create: { width: 150, height: 200, channels: 3, background: '#0000ff' } }).png().toBuffer()
  const derecha = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#ff0000' } })
    .composite([{ input: azul, left: 150, top: 0 }])
    .jpeg()
    .toBuffer()
  return sharp(derecha).withMetadata({ orientation: 6 }).jpeg().toBuffer()
}

/** Un JPEG chico con el encabezado (SOF) cambiado para que diga ancho x alto: sharp lee eso sin decodificar. */
async function encabezadoDe(ancho, alto) {
  const buf = Buffer.from(await lisa({ ancho: 8, alto: 8 }))
  for (let i = 2; i < buf.length - 9; ) {
    const marca = buf[i + 1]
    if (marca >= 0xc0 && marca <= 0xc2) {
      buf.writeUInt16BE(alto, i + 5)
      buf.writeUInt16BE(ancho, i + 7)
      return buf
    }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  throw new Error('no se encontró el SOF')
}

/** Un PNG chico (8x8) con el encabezado (IHDR) cambiado para que diga ancho x alto, con su CRC: sharp lee eso sin decodificar. */
function pngConMedidas(png, ancho, alto) {
  const buf = Buffer.from(png)
  buf.writeUInt32BE(ancho, 16)
  buf.writeUInt32BE(alto, 20)
  buf.writeUInt32BE(crc32(buf.subarray(12, 29)), 29)
  return buf
}

const SVG = Buffer.from('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>')
const HEIC_FALSO = Buffer.concat([
  Buffer.from([0, 0, 0, 0x18]),
  Buffer.from('ftypheic'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('mif1heic'),
  Buffer.alloc(300, 7),
])
const TEXTO = Buffer.from('Esto es un texto con extensión .jpg, no una foto.\n')

const tieneGpsEnExif = (exif) => Boolean(exif?.includes(Buffer.from([0x25, 0x88])) || exif?.includes(Buffer.from([0x88, 0x25])))

// --- Sin base ---

describe('procesar una foto (sin base)', () => {
  test('un JPEG con EXIF y GPS: las cinco variantes, sin EXIF ni GPS, sin agrandar, con sus anchos', async () => {
    const entrada = await conGps()
    const meta = await sharp(entrada).metadata()
    assert.ok(tieneGpsEnExif(meta.exif), 'la de prueba trae GPS')
    assert.ok(entrada.includes(Buffer.from('TelefonoDePrueba')))
    const p = await procesarFoto(entrada)
    assert.deepEqual(p.variantes, [480, 960, 1600, 2400])
    assert.deepEqual(p.archivos.map((a) => a.variante), ['480', '960', '1600', '2400', 'og'])
    assert.deepEqual([p.ancho, p.alto], [2400, 1477])
    assert.equal(p.bytes, p.archivos.reduce((t, a) => t + a.datos.length, 0))
    const anchos = { 480: 480, 960: 960, 1600: 1600, 2400: 2400, og: 1200 }
    for (const a of p.archivos) {
      const m = await sharp(a.datos).metadata()
      assert.equal(m.format, a.variante === 'og' ? 'jpeg' : 'webp', a.variante)
      assert.equal(m.width, anchos[a.variante], a.variante)
      assert.equal(a.ancho, m.width)
      assert.equal(m.exif, undefined, `${a.variante} sin EXIF`)
      assert.equal(m.icc, undefined, `${a.variante} sin perfil ICC`)
      assert.ok(!a.datos.includes(Buffer.from('TelefonoDePrueba')), `${a.variante} sin la marca del teléfono`)
      assert.ok(!a.datos.includes(Buffer.from('Exif')), `${a.variante} sin el bloque Exif`)
    }
  })

  test('la orientación del EXIF se aplica: una 300x200 con Orientation 6 sale 200x300 y derecha', async () => {
    const p = await procesarFoto(await girada())
    assert.deepEqual([p.ancho, p.alto], [200, 300])
    const maestra = p.archivos.find((a) => a.variante === '2400')
    const { data, info } = await sharp(maestra.datos).raw().toBuffer({ resolveWithObject: true })
    assert.deepEqual([info.width, info.height], [200, 300])
    const pixel = (x, y) => [...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3)]
    // La mitad izquierda (roja) queda arriba y la derecha (azul) abajo.
    assert.ok(pixel(100, 20)[0] > 200 && pixel(100, 20)[2] < 60, `arriba rojo: ${pixel(100, 20)}`)
    assert.ok(pixel(100, 280)[2] > 200 && pixel(100, 280)[0] < 60, `abajo azul: ${pixel(100, 280)}`)
    assert.equal((await sharp(maestra.datos).metadata()).orientation, undefined)
  })

  test('PNG (con transparencia) y WebP entran; og.jpg de una transparente sale sobre blanco', async () => {
    const png = await procesarFoto(await lisa({ ancho: 1000, alto: 500, formato: 'png', alfa: true }))
    assert.deepEqual([png.ancho, png.alto], [1000, 500])
    const og = png.archivos.find((a) => a.variante === 'og')
    const { data } = await sharp(og.datos).raw().toBuffer({ resolveWithObject: true })
    // 50 % de (30, 120, 200) sobre blanco: ~(142, 187, 227), no sobre negro (~15, 60, 100).
    assert.ok(data[0] > 120 && data[1] > 160, `sobre blanco: ${[...data.subarray(0, 3)]}`)
    assert.equal((await sharp(png.archivos[0].datos).metadata()).hasAlpha, true, 'el WebP conserva la transparencia')
    const webp = await procesarFoto(await lisa({ ancho: 700, alto: 700, formato: 'webp' }))
    assert.deepEqual([webp.ancho, webp.alto], [700, 700])
  })

  test('nunca agranda: una de 300 px queda de 300 en las cinco', async () => {
    const p = await procesarFoto(await lisa({ ancho: 300, alto: 450 }))
    assert.deepEqual([p.ancho, p.alto], [300, 450])
    for (const a of p.archivos) assert.deepEqual([a.ancho, a.alto], [300, 450], a.variante)
  })

  test('SVG, HEIC (falso), texto con extensión .jpg, GIF, AVIF y TIFF: 415 con su mensaje, sin llegar a sharp', async () => {
    const casos = [
      [SVG, MENSAJE_SVG],
      [HEIC_FALSO, MENSAJE_HEIC],
      [TEXTO, MENSAJE_TIPO],
      [await lisa({ ancho: 20, alto: 20, formato: 'gif' }), MENSAJE_TIPO],
      [await lisa({ ancho: 20, alto: 20, formato: 'avif' }), MENSAJE_TIPO],
      [await lisa({ ancho: 20, alto: 20, formato: 'tiff' }), MENSAJE_TIPO],
    ]
    for (const [buf, mensaje] of casos) {
      await assert.rejects(procesarFoto(buf), (err) => err.status === 415 && err.message === mensaje && err.extra.campos.foto === mensaje)
    }
    assert.equal(formatoPorFirma(SVG), null)
    assert.equal(pareceHeic(HEIC_FALSO), true)
    // Un AVIF (mif1 con avif entre las compatibles) no es un HEIC.
    assert.equal(pareceHeic(await lisa({ ancho: 20, alto: 20, formato: 'avif' })), false)
  })

  test('más de 50 megapíxeles: 413 leyendo solo el encabezado; 50 justos no se rechazan por eso', async () => {
    await assert.rejects(procesarFoto(await encabezadoDe(10_000, 6_000)), (err) => {
      assert.equal(err.status, 413)
      assert.match(err.message, /tiene 60 megapíxeles y el máximo es 50/)
      return true
    })
    // 8000 x 6250 = 50 MP justos: pasa el control (y falla después, porque los datos son de una de 8x8).
    await assert.rejects(procesarFoto(await encabezadoDe(8_000, 6_250)), (err) => err.status === 400)
  })

  test('vacía, dañada o con la firma de un tipo y el contenido de otro: 400 o 415', async () => {
    await assert.rejects(procesarFoto(Buffer.alloc(0)), (err) => err.status === 400)
    const entera = await lisa({ ancho: 400, alto: 300 })
    await assert.rejects(procesarFoto(entera.subarray(0, 200)), (err) => err.status === 400)
    // Empieza como PNG pero lo demás es un JPEG.
    const mezcla = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), entera])
    await assert.rejects(procesarFoto(mezcla), (err) => err.status === 400 || err.status === 415)
  })

  test('lo que ocupa decodificar: solo lo progresivo (JPG progresivo, PNG entrelazado) cuenta, por canales y bits', () => {
    const MB = 1024 * 1024
    const base = { width: 7000, height: 7000, isProgressive: true }
    // El PNG entrelazado de 16 bits con transparencia de la verificación: 392 MB (el proceso subía ~470 MB).
    assert.equal(memoriaAlDecodificar({ ...base, format: 'png', channels: 4, depth: 'ushort' }), 7000 * 7000 * 8)
    assert.ok(memoriaAlDecodificar({ ...base, format: 'png', channels: 4, depth: 'ushort' }) > MEMORIA_PROGRESIVA_MAX)
    // El de 8 bits sin transparencia: 147 MB, entra.
    assert.ok(memoriaAlDecodificar({ ...base, format: 'png', channels: 3, depth: 'uchar' }) < MEMORIA_PROGRESIVA_MAX)
    // JPG progresivo de 50 megapíxeles: 4:2:0 (lo común) entra; 4:4:4 no (300 MB de coeficientes).
    const jpg = { width: 8000, height: 6250, isProgressive: true, format: 'jpeg', channels: 3 }
    assert.equal(memoriaAlDecodificar({ ...jpg, chromaSubsampling: '4:2:0' }), 150_000_000)
    assert.ok(memoriaAlDecodificar({ ...jpg, chromaSubsampling: '4:4:4' }) > MEMORIA_PROGRESIVA_MAX)
    // Sin el dato del submuestreo, el peor caso (un plano por canal).
    assert.equal(memoriaAlDecodificar(jpg), 300_000_000)
    // Lo que no es progresivo se lee de a franjas: 0.
    assert.equal(memoriaAlDecodificar({ ...jpg, isProgressive: false }), 0)
    assert.equal(memoriaAlDecodificar({ width: 7000, height: 7000, format: 'webp', channels: 4 }), 0)
    assert.ok(MEMORIA_PROGRESIVA_MAX / MB <= 160)
  })

  test('un PNG entrelazado de 16 bits o un JPG progresivo 4:4:4 enormes: 413 leyendo solo el encabezado', async () => {
    const pngChico = await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 0.5 } } })
      .toColourspace('rgb16')
      .png({ progressive: true })
      .toBuffer()
    const png = pngConMedidas(pngChico, 7000, 7000)
    const meta = await sharp(png, { limitInputPixels: false }).metadata()
    assert.deepEqual([meta.width, meta.height, meta.isProgressive, meta.depth], [7000, 7000, true, 'ushort'])
    const inicio = Date.now()
    await assert.rejects(procesarFoto(png), (err) => err.status === 413 && err.message === MENSAJE_PROGRESIVA)
    assert.ok(Date.now() - inicio < 2000, 'sin decodificar')
    // El mismo PNG sin entrelazar y de 8 bits pasa ese control (y falla después: los datos son de uno de 8x8).
    const pngComun = pngConMedidas(await sharp({ create: { width: 8, height: 8, channels: 3, background: '#123456' } }).png().toBuffer(), 7000, 7000)
    await assert.rejects(procesarFoto(pngComun), (err) => err.status === 400)
    // Un JPG progresivo 4:4:4 de 50 megapíxeles.
    const jpg = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#405060' } })
      .jpeg({ progressive: true, chromaSubsampling: '4:4:4' })
      .toBuffer()
    const grande = Buffer.from(jpg)
    for (let i = 2; i < grande.length - 9; ) {
      const marca = grande[i + 1]
      if (marca >= 0xc0 && marca <= 0xc2) {
        grande.writeUInt16BE(6250, i + 5)
        grande.writeUInt16BE(8000, i + 7)
        break
      }
      i += 2 + grande.readUInt16BE(i + 2)
    }
    await assert.rejects(procesarFoto(grande), (err) => err.status === 413 && err.extra.campos.foto === MENSAJE_PROGRESIVA)
  })

  test('una imagen muy alta (una captura larga): todas las salidas hasta 16383 px de alto, con su proporción', async () => {
    const p = await procesarFoto(await lisa({ ancho: 400, alto: 20_000, formato: 'png' }))
    assert.equal(LADO_MAX, 16_383)
    // 400 x 20000 entra en 2400 x 16383 achicándola a 328 x 16383.
    assert.deepEqual([p.ancho, p.alto], [328, 16_383])
    for (const a of p.archivos) {
      assert.ok(a.alto <= LADO_MAX, `${a.variante}: ${a.ancho}x${a.alto}`)
      assert.ok(Math.abs(a.alto / a.ancho - 50) < 1, `${a.variante}: ${a.ancho}x${a.alto}`)
    }
  })

  test('el tope de tiempo: pasado el tope, 503 sin seguir con las demás variantes', async () => {
    await assert.rejects(procesarFoto(await lisa({ ancho: 400, alto: 300 }), { hasta: Date.now() - 1 }), (err) => {
      assert.equal(err.status, 503)
      assert.match(err.message, /tardó demasiado/)
      return true
    })
  })
})

describe('la cola, la caché y el semáforo (sin base)', () => {
  test('la cola: de a una y en orden; una que falla no frena a la siguiente; con demasiadas esperando, 503', async () => {
    const cola = crearCola({ enCursoMax: 3 })
    const orden = []
    let aLaVez = 0
    let maximo = 0
    const tarea = (n, falla = false) => async ({ hasta }) => {
      assert.ok(hasta > Date.now())
      aLaVez += 1
      maximo = Math.max(maximo, aLaVez)
      await new Promise((r) => setTimeout(r, 20))
      orden.push(n)
      aLaVez -= 1
      if (falla) throw new Error('falla')
      return n
    }
    const a = cola.encolar(tarea(1))
    const b = cola.encolar(tarea(2, true))
    const c = cola.encolar(tarea(3))
    await assert.rejects(cola.encolar(tarea(4)), (err) => err.status === 503)
    assert.equal(await a, 1)
    await assert.rejects(b, /falla/)
    assert.equal(await c, 3)
    assert.deepEqual(orden, [1, 2, 3])
    assert.equal(maximo, 1)
    assert.equal(cola.pendientes, 0)
    assert.equal(await cola.encolar(tarea(5)), 5)
  })

  test('los lugares de las subidas en curso: como mucho 3; soltar dos veces no da uno de más', () => {
    const cola = crearCola()
    const lugares = [cola.reservar(), cola.reservar(), cola.reservar()]
    assert.ok(lugares.every(Boolean))
    assert.equal(cola.reservar(), null)
    assert.equal(cola.reservadas, 3)
    lugares[0]()
    lugares[0]()
    assert.equal(cola.reservadas, 2)
    const otro = cola.reservar()
    assert.ok(otro)
    assert.equal(cola.reservar(), null)
    for (const soltar of [otro, lugares[1], lugares[2]]) soltar()
    assert.equal(cola.reservadas, 0)
    assert.equal(MENSAJE_COLA_LLENA, 'Hay muchas fotos subiéndose en este momento. Probá de nuevo en un minuto.')
  })

  test('el semáforo: la que espera más que el tope sale de la fila con FOTOS_OCUPADO y las demás siguen', async () => {
    const semaforo = crearSemaforo(1, 10, 50)
    let soltar
    const larga = semaforo.con(() => new Promise((r) => (soltar = r)))
    const espera = semaforo.con(async () => 'no llega')
    await assert.rejects(espera, (err) => err.code === 'FOTOS_OCUPADO')
    assert.equal(semaforo.esperando, 0, 'salió de la fila')
    const siguiente = semaforo.con(async () => 'sí llega')
    soltar('larga')
    assert.equal(await larga, 'larga')
    assert.equal(await siguiente, 'sí llega')
    assert.equal(semaforo.activas, 0)
  })

  test('la caché LRU: por bytes, saca la menos usada, no guarda lo que pasa de un cuarto, y saca por prefijo', () => {
    const lru = crearLru(100)
    lru.set('a/1', Buffer.alloc(20))
    lru.set('a/2', Buffer.alloc(20))
    lru.set('b/1', Buffer.alloc(20))
    assert.equal(lru.bytes, 60)
    lru.get('a/1') // a/1 pasa a ser la más usada
    lru.set('c/1', Buffer.alloc(25))
    lru.set('d/1', Buffer.alloc(25))
    assert.equal(lru.get('a/2'), null, 'la menos usada se fue')
    assert.ok(lru.get('a/1'))
    assert.ok(lru.bytes <= 100)
    lru.set('grande', Buffer.alloc(26))
    assert.equal(lru.get('grande'), null, 'más de un cuarto no entra')
    lru.sacarPrefijo('a/')
    assert.equal(lru.get('a/1'), null)
  })

  test('el semáforo: como mucho 2 a la vez; con la fila llena, FOTOS_OCUPADO', async () => {
    const semaforo = crearSemaforo(2, 3)
    let aLaVez = 0
    const tarea = () =>
      semaforo.con(async () => {
        aLaVez += 1
        assert.ok(aLaVez <= 2)
        await new Promise((r) => setTimeout(r, 10))
        aLaVez -= 1
        return true
      })
    const cinco = Array.from({ length: 5 }, tarea)
    await assert.rejects(tarea(), (err) => err.code === 'FOTOS_OCUPADO')
    assert.deepEqual(await Promise.all(cinco), [true, true, true, true, true])
    assert.equal(semaforo.maximoVisto, 2)
    assert.equal(semaforo.activas, 0)
  })

  test('los usos: sin ninguno, ninguna está en uso; con usos, un EXISTS por cada uno; nombres raros, error', () => {
    // Desde E3.3 y E3.4: las portadas y las galerías (la prueba con base los compara con las claves foráneas).
    assert.deepEqual(
      USOS_DE_FOTOS.map((u) => `${u.tabla}.${u.columna}`),
      [
        'galeria_muestras.foto_id',
        'galeria_novedades.foto_id',
        'muestras.portada_id',
        'novedades.portada_id',
        'salas.portada_id',
      ],
    )
    assert.equal(condicionEnUso('f', []), 'false')
    assert.equal(
      condicionEnUso('f', [{ tabla: 'novedades', columna: 'portada_id' }, { tabla: 'galeria_novedades', columna: 'foto_id' }]),
      'EXISTS (SELECT 1 FROM novedades uso WHERE uso.portada_id = f.id) OR EXISTS (SELECT 1 FROM galeria_novedades uso WHERE uso.foto_id = f.id)',
    )
    assert.throws(() => condicionEnUso('f', [{ tabla: 'x; DROP TABLE fotos', columna: 'id' }]), /inválido/)
  })
})

/** Un pedido crudo a un servidor de prueba (sin las cabeceras de pedir()). */
function pedirA(puerto, metodo, ruta, cabeceras = {}) {
  return new Promise((resolver, rechazar) => {
    const p = request({ host: '127.0.0.1', port: puerto, path: ruta, method: metodo, headers: { host: 'mupa.ar', ...cabeceras } }, (res) => {
      const trozos = []
      res.on('data', (d) => trozos.push(d))
      res.on('end', () => resolver({ status: res.statusCode, h: res.headers, cuerpo: Buffer.concat(trozos) }))
    })
    p.on('error', rechazar)
    p.end()
  })
}

describe('la ruta /fotos sin base', () => {
  let servidor
  let puerto
  const datos = Buffer.from('bytes de una foto')
  before(async () => {
    const app = express()
    app.get('/sin-base/:clave/:archivo', crearRutaDeFotos({ almacen: null }))
    const almacen = {
      abrir: async (clave) => {
        if (clave === 'eeeeeeeeeeeeeeee') throw Object.assign(new Error('se cayó'), { code: 'ECONNREFUSED' })
        if (clave === 'bbbbbbbbbbbbbbbb') throw Object.assign(new Error('ocupado'), { code: 'FOTOS_OCUPADO' })
        return clave === 'aaaaaaaaaaaaaaaa' ? datos : null
      },
    }
    app.get('/fotos/:clave/:archivo', crearRutaDeFotos({ almacen }))
    servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    puerto = servidor.address().port
  })
  after(() => servidor?.close())

  test('sin almacén (sin base): 404 con no-store', async () => {
    const r = await pedirA(puerto, 'GET', '/sin-base/aaaaaaaaaaaaaaaa/960.webp')
    assert.equal(r.status, 404)
    assert.equal(r.h['cache-control'], 'no-store')
  })

  test('la base caída o demasiadas lecturas esperando: 503 con no-store y Retry-After, sin el error', async () => {
    const logs = escucharLogs()
    let caida
    let ocupada
    try {
      caida = await pedirA(puerto, 'GET', '/fotos/eeeeeeeeeeeeeeee/960.webp')
      ocupada = await pedirA(puerto, 'GET', '/fotos/bbbbbbbbbbbbbbbb/960.webp')
    } finally {
      logs.detener()
    }
    for (const r of [caida, ocupada]) {
      assert.equal(r.status, 503)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.equal(r.h['retry-after'], '5')
      assert.doesNotMatch(r.cuerpo.toString(), /se cayó|ocupado/)
    }
    // Solo la base caída va al log (lo de la fila llena es esperable con tráfico).
    assert.deepEqual(logs.eventos().map((e) => [e.evento, e.codigo]), [['foto_sin_base', 'ECONNREFUSED']])
  })

  test('ETag: If-None-Match con una lista, con W/ o con *', () => {
    const etag = '"aaaaaaaaaaaaaaaa-960"'
    assert.equal(coincideEtag(undefined, etag), false)
    assert.equal(coincideEtag('"otro"', etag), false)
    assert.equal(coincideEtag(`"otro", ${etag}`, etag), true)
    assert.equal(coincideEtag(`W/${etag}`, etag), true)
    assert.equal(coincideEtag('*', etag), true)
  })
})

describe('mensajes y achique en el navegador (sin base)', () => {
  test('los megas y el mensaje del peso (plan 5.5)', () => {
    assert.equal(megas(25 * 1024 * 1024), '25')
    assert.equal(megas(FOTO_BYTES_MAX + 1), '20,1')
    assert.equal(megas(500 * 1024), '0,5')
    assert.equal(mensajePeso(25 * 1024 * 1024), 'La foto pesa 25 MB; el máximo es 20 MB.')
    assert.equal(mensajePeso(0), 'La foto pesa más de 20 MB, que es el máximo.')
    assert.equal(urlFoto('0123456789abcdef'), '/fotos/0123456789abcdef/960.webp')
    assert.deepEqual(Object.keys(ARCHIVOS_PUBLICOS), ['480.webp', '960.webp', '1600.webp', 'og.jpg'])
  })

  test('cuándo se achica: más de 2400 de ancho o más de ~4 MB', () => {
    assert.equal(hayQueAchicar({ ancho: 6000, bytes: 1_000_000 }), true)
    assert.equal(hayQueAchicar({ ancho: 2401, bytes: 1 }), true)
    assert.equal(hayQueAchicar({ ancho: 2400, bytes: BYTES_SIN_ACHICAR }), false)
    assert.equal(hayQueAchicar({ ancho: 2000, bytes: BYTES_SIN_ACHICAR + 1 }), true)
    assert.equal(hayQueAchicar({ ancho: 800, bytes: 300_000 }), false)
  })

  test('las medidas: hasta 2400 de ancho con la misma proporción, nunca agranda y entra en el lienzo de Safari', () => {
    assert.deepEqual(medidasAchicadas(6000, 4000), { ancho: 2400, alto: 1600 })
    assert.deepEqual(medidasAchicadas(4000, 6000), { ancho: 2400, alto: 3600 })
    assert.deepEqual(medidasAchicadas(1200, 900), { ancho: 1200, alto: 900 })
    // Una muy alta: 2400 de ancho daría 2400 x 12000 = 28,8 millones de píxeles.
    const alta = medidasAchicadas(3000, 15000)
    assert.ok(alta.ancho * alta.alto <= AREA_MAX_LIENZO, JSON.stringify(alta))
    assert.ok(Math.abs(alta.alto / alta.ancho - 5) < 0.01)
    // Una angostísima no queda en 0.
    assert.deepEqual(medidasAchicadas(50_000, 3), { ancho: 2400, alto: 1 })
  })

  test('el formato: PNG solo con transparencia; si no, JPEG 0,92', () => {
    assert.deepEqual(formatoDeSalida({ conTransparencia: true }), { tipo: 'image/png' })
    assert.deepEqual(formatoDeSalida({ conTransparencia: false }), { tipo: 'image/jpeg', calidad: 0.92 })
    assert.equal(tieneTransparencia(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255])), false)
    assert.equal(tieneTransparencia(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 254])), true)
  })

  test('qué se manda: la achicada, salvo que pese más y el original ya entrara', () => {
    assert.equal(elegirEnvio({ original: { bytes: 9_000_000, ancho: 6000 }, achicada: { bytes: 900_000 } }), 'achicada')
    // 2400 de ancho y 5 MB: achicada pesa más (raro) -> el original, que entra.
    assert.equal(elegirEnvio({ original: { bytes: 5_000_000, ancho: 2400 }, achicada: { bytes: 5_500_000 } }), 'original')
    // Más ancha que 2400: siempre la achicada, aunque pese más.
    assert.equal(elegirEnvio({ original: { bytes: 900_000, ancho: 3000 }, achicada: { bytes: 1_000_000 } }), 'achicada')
    // El original pasa los 20 MB: la achicada.
    assert.equal(elegirEnvio({ original: { bytes: 21 * 1024 * 1024, ancho: 2000 }, achicada: { bytes: 22 * 1024 * 1024 } }), 'achicada')
  })

  test('el nombre de lo achicado lleva la extensión nueva', () => {
    assert.equal(nombreConExtension('IMG_1234.HEIC', 'image/jpeg'), 'IMG_1234.jpg')
    assert.equal(nombreConExtension('logo.webp', 'image/png'), 'logo.png')
    assert.equal(nombreConExtension('foto sin extension', 'image/jpeg'), 'foto sin extension.jpg')
    assert.equal(nombreConExtension('', 'image/jpeg'), 'foto.jpg')
  })
})

// --- Con base ---

describe('fotos con base', { skip: base.motivo ?? false }, () => {
  let s
  let editor
  let almacen
  before(async () => {
    almacen = crearAlmacen(base.sequelize)
    s = await levantar({}, { almacen })
    editor = await s.cookiePara('editor')
  })
  after(() => s?.cerrar())

  /** POST /fotos con un archivo y los campos. */
  const subir = (quien, datos, campos = { alt: 'Una foto de prueba' }, extra = {}) =>
    s.pedir('POST', 'api:/fotos', {
      cookie: quien?.cookie,
      ...multipart({ campos, archivos: datos ? [{ datos, nombre: extra.nombre, tipo: extra.tipo }] : [] }),
      ...extra.opciones,
    })

  /** GET (o HEAD) de un archivo de una foto, con los bytes. */
  const archivo = (clave, nombre, cabeceras = {}, metodo = 'GET', host = 'mupa.ar') =>
    pedirA(s.puerto, metodo, `/fotos/${clave}/${nombre}`, { host, ...cabeceras })

  test('POST /fotos de punta a punta: 201, la fila, los cinco archivos y lo que se sirve, sin EXIF ni GPS', async () => {
    const r = await subir(editor, await conGps(), { alt: 'Cráneo de Herrerasaurus en la vitrina', epigrafe: 'Sala 2', credito: 'Foto: MuPa' })
    assert.equal(r.status, 201, r.texto)
    const foto = r.json.data
    assert.match(foto.clave, /^[0-9a-f]{16}$/)
    assert.deepEqual(
      { ...foto, id: 0, clave: '', bytes: 0 },
      {
        id: 0,
        clave: '',
        ancho: 2400,
        alto: 1477,
        variantes: [480, 960, 1600, 2400],
        bytes: 0,
        alt: 'Cráneo de Herrerasaurus en la vitrina',
        decorativa: false,
        epigrafe: 'Sala 2',
        credito: 'Foto: MuPa',
      },
    )
    const [fila] = await sql('SELECT subida_por, bytes FROM fotos WHERE id = :id', { id: foto.id })
    assert.equal(fila.subida_por, editor.usuario.id)
    const archivos = await sql(
      'SELECT variante, bytes, octet_length(datos) AS largo FROM fotos_archivos WHERE foto_id = :id ORDER BY variante',
      { id: foto.id },
    )
    assert.deepEqual(archivos.map((a) => a.variante), ['1600', '2400', '480', '960', 'og'])
    for (const a of archivos) assert.equal(a.bytes, a.largo)
    assert.equal(fila.bytes, archivos.reduce((t, a) => t + a.bytes, 0))
    assert.equal(foto.bytes, fila.bytes)

    for (const [nombre, formato, ancho] of [
      ['480.webp', 'webp', 480],
      ['960.webp', 'webp', 960],
      ['1600.webp', 'webp', 1600],
      ['og.jpg', 'jpeg', 1200],
    ]) {
      const g = await archivo(foto.clave, nombre)
      assert.equal(g.status, 200, nombre)
      assert.equal(g.h['content-type'], formato === 'jpeg' ? 'image/jpeg' : 'image/webp')
      assert.equal(g.h['cache-control'], 'public, max-age=31536000, immutable')
      assert.equal(g.h.etag, `"${foto.clave}-${nombre.split('.')[0]}"`)
      assert.equal(g.h['x-content-type-options'], 'nosniff')
      assert.equal(Number(g.h['content-length']), g.cuerpo.length)
      assert.equal(g.h['set-cookie'], undefined)
      const m = await sharp(g.cuerpo).metadata()
      assert.equal(m.format, formato)
      assert.equal(m.width, ancho)
      assert.equal(m.exif, undefined, `${nombre} sin EXIF`)
      assert.ok(!g.cuerpo.includes(Buffer.from('TelefonoDePrueba')))
    }
    // La maestra se guarda pero no se publica.
    const maestra = await archivo(foto.clave, '2400.webp')
    assert.equal(maestra.status, 404)
    assert.equal(maestra.h['cache-control'], 'no-store')
    const [{ largo }] = await sql(`SELECT octet_length(datos) AS largo FROM fotos_archivos WHERE foto_id = :id AND variante = '2400'`, { id: foto.id })
    assert.ok(largo > 0)
  })

  test('HEAD, 304 con If-None-Match, cualquier host y la cookie de sesión no cambian nada; 404 con no-store', async () => {
    const r = await subir(editor, await lisa({ ancho: 1000, alto: 800 }))
    const { clave } = r.json.data
    const get = await archivo(clave, '960.webp')
    const head = await archivo(clave, '960.webp', {}, 'HEAD')
    assert.equal(head.status, 200)
    assert.equal(head.cuerpo.length, 0)
    assert.equal(head.h['content-length'], get.h['content-length'])
    assert.equal(head.h.etag, get.h.etag)
    assert.equal(head.h['content-type'], 'image/webp')

    for (const condicion of [get.h.etag, `W/${get.h.etag}`, `"otro", ${get.h.etag}`]) {
      const no = await archivo(clave, '960.webp', { 'if-none-match': condicion })
      assert.equal(no.status, 304, condicion)
      assert.equal(no.cuerpo.length, 0)
      assert.equal(no.h.etag, get.h.etag)
      assert.equal(no.h['cache-control'], 'public, max-age=31536000, immutable')
    }
    // El ETag de otra variante no sirve para esta.
    const otra = await archivo(clave, '480.webp', { 'if-none-match': get.h.etag })
    assert.equal(otra.status, 200)
    assert.notEqual(otra.h.etag, get.h.etag)

    // Antes del control de host: también desde Render o desde cualquier otro, con noindex como el resto del sitio
    // fuera del host público (mupa.ar en estas pruebas, en producción).
    for (const host of ['mupa-web.onrender.com', 'otro.example']) {
      const otroHost = await archivo(clave, 'og.jpg', {}, 'GET', host)
      assert.equal(otroHost.status, 200, host)
      assert.equal(otroHost.h['x-robots-tag'], 'noindex, nofollow', host)
    }
    assert.equal(get.h['x-robots-tag'], undefined, 'en mupa.ar se pueden indexar')
    const conCookie = await archivo(clave, '960.webp', { cookie: editor.cookie })
    assert.equal(conCookie.status, 200)
    assert.equal(conCookie.h['set-cookie'], undefined)

    for (const ruta of [
      `/fotos/${'f'.repeat(16)}/960.webp`, // clave que no existe
      `/fotos/${clave.toUpperCase()}/960.webp`, // las claves van en minúsculas
      `/fotos/${clave.slice(1)}/960.webp`,
      `/fotos/${clave}/2400.webp`,
      `/fotos/${clave}/960.jpg`,
      `/fotos/${clave}/constructor`,
      `/fotos/${clave}/..%2F..%2Fpackage.json`,
    ]) {
      const contador = contarConsultas()
      let r404
      try {
        r404 = await pedirA(s.puerto, 'GET', ruta)
      } finally {
        contador.detener()
      }
      assert.equal(r404.status, 404, ruta)
      assert.equal(r404.h['cache-control'], 'no-store', ruta)
      assert.equal(r404.h['set-cookie'], undefined)
      // Con la clave o el archivo inválidos, ni se consulta la base.
      if (!ruta.includes('ffffffffffffffff')) assert.equal(contador.consultas.length, 0, ruta)
    }
  })

  test('PNG y WebP entran por la API; SVG, HEIC, texto .jpg -> 415; más de 20 MB o de 50 megapíxeles -> 413', async () => {
    assert.equal((await subir(editor, await lisa({ ancho: 600, alto: 400, formato: 'png', alfa: true }), undefined, { nombre: 'logo.png', tipo: 'image/png' })).status, 201)
    assert.equal((await subir(editor, await lisa({ ancho: 600, alto: 400, formato: 'webp' }), undefined, { nombre: 'a.webp', tipo: 'image/webp' })).status, 201)
    const antes = (await sql('SELECT count(*)::int AS n FROM fotos'))[0].n
    for (const [datos, mensaje, nombre] of [
      [SVG, MENSAJE_SVG, 'dibujo.svg'],
      [HEIC_FALSO, MENSAJE_HEIC, 'IMG_0001.HEIC'],
      [TEXTO, MENSAJE_TIPO, 'foto.jpg'],
    ]) {
      const r = await subir(editor, datos, undefined, { nombre })
      assert.equal(r.status, 415, nombre)
      assert.deepEqual(r.json, { error: mensaje, campos: { foto: mensaje } })
    }
    const grande = Buffer.concat([await lisa({ ancho: 200, alto: 200 }), Buffer.alloc(FOTO_BYTES_MAX + 1024 * 1024, 1)])
    const r413 = await subir(editor, grande)
    assert.equal(r413.status, 413)
    assert.match(r413.json.error, /^La foto pesa 21(,\d)? MB; el máximo es 20 MB\.$/)
    const mp = await subir(editor, await encabezadoDe(10_000, 6_000))
    assert.equal(mp.status, 413)
    assert.match(mp.json.error, /60 megapíxeles/)
    assert.equal((await sql('SELECT count(*)::int AS n FROM fotos'))[0].n, antes, 'nada rechazado quedó guardado')
  })

  test('los campos: alt obligatorio salvo decorativa (que se guarda sin alt), largos, sin foto, dos fotos', async () => {
    const jpg = await lisa({ ancho: 300, alto: 200 })
    const sinAlt = await subir(editor, jpg, { alt: '  ' })
    assert.equal(sinAlt.status, 400)
    assert.deepEqual(sinAlt.json.campos, { alt: 'Describí lo que se ve en la foto, o marcala como decorativa.' })
    const decorativa = await subir(editor, jpg, { alt: 'se descarta', decorativa: 'true' })
    assert.equal(decorativa.status, 201, decorativa.texto)
    assert.equal(decorativa.json.data.alt, '')
    assert.equal(decorativa.json.data.decorativa, true)
    const largo = await subir(editor, jpg, { alt: 'x'.repeat(251) })
    assert.equal(largo.status, 400)
    assert.ok(largo.json.campos.alt)
    const malDecorativa = await subir(editor, jpg, { alt: 'Algo', decorativa: 'sí' })
    assert.equal(malDecorativa.status, 400)
    assert.ok(malDecorativa.json.campos.decorativa)
    const sinFoto = await subir(editor, null)
    assert.equal(sinFoto.status, 400)
    assert.deepEqual(sinFoto.json, { error: 'Elegí una foto para subir.', campos: { foto: 'Elegí una foto para subir.' } })
    const dos = await s.pedir('POST', 'api:/fotos', {
      cookie: editor.cookie,
      ...multipart({ campos: { alt: 'Dos' }, archivos: [{ datos: jpg }, { datos: jpg }] }),
    })
    assert.equal(dos.status, 400)
    const otroCampo = await s.pedir('POST', 'api:/fotos', {
      cookie: editor.cookie,
      ...multipart({ campos: { alt: 'Otra' }, archivos: [{ campo: 'imagen', datos: jpg }] }),
    })
    assert.equal(otroCampo.status, 400)
    const anidado = await s.pedir('POST', 'api:/fotos', {
      cookie: editor.cookie,
      ...multipart({ campos: { 'alt[0]': 'x' }, archivos: [{ datos: jpg }] }),
    })
    assert.equal(anidado.status, 400)
    const roto = await s.pedir('POST', 'api:/fotos', { cookie: editor.cookie, cuerpo: '--x\r\nbasura', tipo: 'multipart/form-data; boundary=x' })
    assert.equal(roto.status, 400)
  })

  test('multer no corre sin sesión, con la temporal sin cambiar, con un origen ajeno ni pasado el límite', async () => {
    // 21 MB: si multer corriera antes, sería un 413 (o un 400 con dos fotos).
    const grande = Buffer.alloc(FOTO_BYTES_MAX + 1024 * 1024, 1)
    const sinSesion = await subir(null, grande)
    assert.equal(sinSesion.status, 401)
    const temporal = await s.cookiePara('editor', { temporal: true })
    const conTemporal = await subir(temporal, grande)
    assert.equal(conTemporal.status, 403)
    assert.equal(conTemporal.json.debeCambiarClave, true)
    const ajeno = await subir(editor, grande, undefined, { opciones: { sitio: 'cross-site' } })
    assert.equal(ajeno.status, 403)
    assert.deepEqual(ajeno.json, { error: 'Origen no permitido.' })

    // 60 por hora por usuario: las rechazadas cuentan; la 61 da 429 aunque traiga dos fotos (multer no llega a verlas).
    const apurada = await s.cookiePara('editor')
    for (let i = 0; i < 60; i++) assert.equal((await subir(apurada, null)).status, 400, `pedido ${i + 1}`)
    const dos = await s.pedir('POST', 'api:/fotos', {
      cookie: apurada.cookie,
      ...multipart({ campos: { alt: 'x' }, archivos: [{ datos: TEXTO }, { datos: TEXTO }] }),
    })
    assert.equal(dos.status, 429)
    assert.match(dos.json.error, /60 fotos/)
    // Las demás rutas siguen para esa persona, y otra persona sube igual.
    assert.equal((await s.pedir('GET', 'api:/estado', { cookie: apurada.cookie })).status, 200)
    assert.equal((await subir(editor, null)).status, 400)
  })

  test('una falla en medio de la transacción no deja nada: ni la foto ni sus archivos', async () => {
    const antes = await sql('SELECT (SELECT count(*) FROM fotos)::int AS fotos, (SELECT count(*) FROM fotos_archivos)::int AS archivos')
    // El último de los cinco archivos (og) falla al insertarse: la foto ya se había insertado en la misma transacción.
    await sql(`CREATE FUNCTION prueba_falla_og() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN
      IF NEW.variante = ''og'' THEN RAISE EXCEPTION ''falla de prueba''; END IF; RETURN NEW; END'`)
    await sql('CREATE TRIGGER prueba_falla_og BEFORE INSERT ON fotos_archivos FOR EACH ROW EXECUTE FUNCTION prueba_falla_og()')
    const logs = escucharLogs()
    let r
    try {
      r = await subir(editor, await lisa({ ancho: 500, alto: 400 }))
    } finally {
      logs.detener()
      await sql('DROP TRIGGER prueba_falla_og ON fotos_archivos')
      await sql('DROP FUNCTION prueba_falla_og()')
    }
    assert.equal(r.status, 500)
    assert.deepEqual(r.json, { error: 'Algo salió mal. Probá de nuevo en unos minutos.' })
    assert.ok(logs.eventos().some((e) => e.evento === 'error_500'))
    const despues = await sql('SELECT (SELECT count(*) FROM fotos)::int AS fotos, (SELECT count(*) FROM fotos_archivos)::int AS archivos')
    assert.deepEqual(despues, antes)
    // Y después de la falla, sube normalmente.
    assert.equal((await subir(editor, await lisa({ ancho: 500, alto: 400 }))).status, 201)
  })

  test('PATCH /fotos/:id: cambia lo que trae; decorativa deja el alt vacío; sin alt y no decorativa, 400', async () => {
    const { id } = (await subir(editor, await lisa({ ancho: 400, alto: 300 }), { alt: 'Primera descripción', credito: 'Alguien' })).json.data
    const patch = (cuerpo) => s.pedir('PATCH', `api:/fotos/${id}`, { cookie: editor.cookie, cuerpo })
    const epigrafe = await patch({ epigrafe: 'Un epígrafe' })
    assert.equal(epigrafe.status, 200, epigrafe.texto)
    assert.deepEqual(
      [epigrafe.json.data.alt, epigrafe.json.data.epigrafe, epigrafe.json.data.credito],
      ['Primera descripción', 'Un epígrafe', 'Alguien'],
    )
    assert.equal((await patch({ credito: '' })).json.data.credito, null)
    const deco = await patch({ decorativa: true })
    assert.deepEqual([deco.json.data.decorativa, deco.json.data.alt], [true, ''])
    const sinAlt = await patch({ decorativa: false })
    assert.equal(sinAlt.status, 400)
    assert.deepEqual(sinAlt.json.campos, { alt: 'Describí lo que se ve en la foto, o marcala como decorativa.' })
    const conAlt = await patch({ decorativa: false, alt: 'Ahora con descripción' })
    assert.deepEqual([conAlt.json.data.decorativa, conAlt.json.data.alt], [false, 'Ahora con descripción'])
    assert.equal((await patch({ alt: '' })).status, 400)
    // Lo que no es de la foto se descarta: ni la clave ni las medidas cambian.
    const intento = await patch({ alt: 'Otra', clave: '0000000000000000', ancho: 1, bytes: 1 })
    assert.equal(intento.status, 200)
    const [fila] = await sql('SELECT clave, ancho, bytes FROM fotos WHERE id = :id', { id })
    assert.notEqual(fila.clave, '0000000000000000')
    assert.equal(fila.ancho, 400)
    assert.ok(fila.bytes > 1)
  })

  test('liberarFotos: borra solo las que nadie usa, con sus archivos, y las saca de la caché después del commit', async () => {
    const subidas = []
    for (let i = 0; i < 4; i++) subidas.push((await subir(editor, await lisa({ ancho: 300, alto: 200 }))).json.data)
    const [usada, libre, otraLibre, enRollback] = subidas
    // Servidas antes de liberarlas: quedan en la caché del almacén de la app.
    for (const f of [libre, enRollback]) assert.equal((await archivo(f.clave, '960.webp')).status, 200)

    // En una transacción que se deshace: no se borra nada y la caché sigue (la limpieza va después del commit).
    await assert.rejects(
      base.sequelize.transaction(async (t) => {
        assert.deepEqual(await almacen.liberar([enRollback.id], t), [enRollback.clave])
        throw new Error('deshacer')
      }),
      /deshacer/,
    )
    assert.equal((await sql('SELECT count(*)::int AS n FROM fotos WHERE id = :id', { id: enRollback.id }))[0].n, 1)
    assert.equal((await archivo(enRollback.clave, '960.webp')).status, 200)

    // Con el commit: borradas con sus archivos y fuera de la caché (lo repetido y lo que no es un id se ignora).
    const claves = await base.sequelize.transaction((t) => almacen.liberar([libre.id, libre.id, otraLibre.id, 0, 'x'], t))
    assert.deepEqual(claves.sort(), [libre.clave, otraLibre.clave].sort())
    assert.deepEqual(await sql('SELECT foto_id FROM fotos_archivos WHERE foto_id IN (:ids)', { ids: [libre.id, otraLibre.id] }), [])
    assert.equal((await archivo(libre.clave, '960.webp')).status, 404)
    assert.deepEqual(await almacen.liberar([]), [])

    // Una que se usa (una tabla con una clave foránea a fotos, como las de E3.3 y E3.4) no se borra.
    await sql('CREATE TABLE prueba_usos (foto_id int REFERENCES fotos ON DELETE RESTRICT)')
    try {
      await sql('INSERT INTO prueba_usos (foto_id) VALUES (:id)', { id: usada.id })
      const conUsos = crearAlmacen(base.sequelize, { usos: [{ tabla: 'prueba_usos', columna: 'foto_id' }] })
      assert.deepEqual(await conUsos.liberar([usada.id]), [])
      assert.equal((await sql('SELECT count(*)::int AS n FROM fotos WHERE id = :id', { id: usada.id }))[0].n, 1)
      await sql('DELETE FROM prueba_usos')
      assert.deepEqual(await conUsos.liberar([usada.id]), [usada.clave])
    } finally {
      await sql('DROP TABLE prueba_usos')
    }
  })

  test('la caché: el segundo pedido no va a la base; varios a la vez por el mismo archivo, una sola lectura', async () => {
    const { clave } = (await subir(editor, await lisa({ ancho: 900, alto: 600 }))).json.data
    const propio = crearAlmacen(base.sequelize)
    const contador = contarConsultas()
    try {
      const juntos = await Promise.all(Array.from({ length: 8 }, () => propio.abrir(clave, '960')))
      assert.ok(juntos.every((d) => d.equals(juntos[0])))
      assert.equal(contador.consultas.filter((q) => q.includes('fotos_archivos')).length, 1, 'una sola lectura')
      await propio.abrir(clave, '960')
      assert.equal(contador.consultas.filter((q) => q.includes('fotos_archivos')).length, 1, 'la segunda vez, de la caché')
    } finally {
      contador.detener()
    }
    assert.equal(propio.estadisticas().enCache, 1)
    assert.ok(await propio.abrir(clave, '2400'), 'el almacén sí lee la maestra (la ruta no la publica)')
    assert.equal(await propio.abrir('f'.repeat(16), '960'), null)
  })

  test('como mucho 2 lecturas a la base a la vez, también con muchos pedidos juntos por HTTP', async () => {
    const claves = []
    for (let i = 0; i < 4; i++) claves.push((await subir(editor, await lisa({ ancho: 700, alto: 500 }))).json.data.clave)
    const propio = crearAlmacen(base.sequelize)
    const otra = await levantar({}, { almacen: propio })
    try {
      const pedidos = claves.flatMap((clave) => ['480.webp', '960.webp', '1600.webp', 'og.jpg'].map((n) => pedirA(otra.puerto, 'GET', `/fotos/${clave}/${n}`)))
      const respuestas = await Promise.all(pedidos)
      assert.ok(respuestas.every((r) => r.status === 200), respuestas.map((r) => r.status).join(','))
      assert.equal(propio.estadisticas().lecturasMaximas, 2)
      // Mientras tanto, la API sigue respondiendo (las páginas y el panel tienen conexiones).
      assert.equal((await otra.pedir('GET', 'api:/estado', { cookie: editor.cookie })).status, 200)
    } finally {
      await otra.cerrar()
    }
  })

  test('como mucho 3 subidas en curso: la cuarta da 503 antes de que llegue su archivo; al cortarse, se liberan', async () => {
    const quien = await s.cookiePara('editor')
    const { tipo } = multipart({ campos: {}, archivos: [] })
    const boundary = tipo.split('boundary=')[1]
    const inicio = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="alt"\r\n\r\nUna\r\n` +
        `--${boundary}\r\nContent-Disposition: form-data; name="foto"; filename="a.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
    )
    /** Un POST /fotos que anuncia 10 MB y manda solo el principio: queda recibiendo. */
    function abrir() {
      const p = request({
        host: '127.0.0.1',
        port: s.puerto,
        path: '/administracion/api/fotos',
        method: 'POST',
        headers: {
          host: 'mupa.ar',
          'x-forwarded-for': '198.51.100.7',
          'sec-fetch-site': 'same-origin',
          cookie: quien.cookie,
          'content-type': tipo,
          'content-length': String(10 * 1024 * 1024),
        },
      })
      const respuesta = new Promise((resolver) => {
        p.on('response', (res) => {
          const trozos = []
          res.on('data', (d) => trozos.push(d))
          res.on('end', () => resolver({ status: res.statusCode, h: res.headers, cuerpo: Buffer.concat(trozos).toString() }))
        })
        p.on('error', () => resolver({ status: 0 }))
      })
      p.write(inicio)
      p.write(Buffer.alloc(64 * 1024, 7))
      return { p, respuesta }
    }
    const tres = [abrir(), abrir(), abrir()]
    await new Promise((r) => setTimeout(r, 300))
    const cuarta = abrir()
    const r = await Promise.race([cuarta.respuesta, new Promise((x) => setTimeout(() => x({ status: 'sin respuesta' }), 5000))])
    // Llegó la respuesta con el cuerpo a medio mandar: el servidor no esperó (ni guardó) el archivo.
    assert.equal(r.status, 503)
    assert.equal(r.h['retry-after'], '30')
    assert.deepEqual(JSON.parse(r.cuerpo), { error: MENSAJE_COLA_LLENA, campos: { foto: MENSAJE_COLA_LLENA } })
    for (const { p } of [...tres, cuarta]) p.destroy()
    await Promise.all(tres.map((t) => t.respuesta))
    // Los lugares se soltaron al cortarse las conexiones: otra sube bien.
    let otra
    for (let i = 0; i < 20; i++) {
      otra = await subir(editor, await lisa({ ancho: 300, alto: 200 }))
      if (otra.status !== 503) break
      await new Promise((x) => setTimeout(x, 100))
    }
    assert.equal(otra.status, 201, otra.texto)
  })

  test('la fila de lecturas espera en vez de dar 503 en el momento; lo que no existe no vuelve a la base', async () => {
    // 40 fotos guardadas directo (unos bytes por archivo: acá importa la fila, no las imágenes).
    const claves = []
    for (let i = 0; i < 40; i++) {
      const archivos = ['480', '960', '1600', '2400', 'og'].map((variante) => ({ variante, datos: Buffer.from([i, 1, 2]) }))
      const f = await almacen.guardar(
        { alt: 'Para la fila', decorativa: false, epigrafe: null, credito: null, subidaPor: null },
        { ancho: 10, alto: 10, variantes: [480, 960, 1600, 2400], bytes: 15, archivos },
      )
      claves.push(f.clave)
    }
    // 160 lecturas distintas a la vez con la caché vacía y 2 lecturas a la vez (antes, con 100 en fila, 58 daban
    // FOTOS_OCUPADO: fotos rotas en la página).
    const propio = crearAlmacen(base.sequelize)
    const pedidos = []
    for (const clave of claves) for (const v of ['480', '960', '1600', 'og']) pedidos.push(propio.abrir(clave, v).then(Boolean))
    pedidos.push(...Array.from({ length: 30 }, (_, i) => propio.abrir(`${String(i).padStart(2, '0')}${'e'.repeat(14)}`, '960')))
    const resultados = await Promise.all(pedidos)
    assert.equal(resultados.slice(0, 160).filter(Boolean).length, 160)
    assert.ok(resultados.slice(160).every((d) => d === null))
    assert.equal(propio.estadisticas().lecturasMaximas, 2)
    // Una clave que no existe se recuerda: la segunda vez no va a la base.
    const contador = contarConsultas()
    try {
      assert.equal(await propio.abrir('00eeeeeeeeeeeeee', '960'), null)
      assert.equal(contador.consultas.filter((q) => q.includes('fotos_archivos')).length, 0)
    } finally {
      contador.detener()
    }
    assert.ok(propio.estadisticas().noExisten >= 30)
  })

  test('la tarea diaria: borra las huérfanas de más de 24 h (no las nuevas ni las que se usan) y queda en el registro', async () => {
    const subidas = []
    for (let i = 0; i < 3; i++) subidas.push((await subir(editor, await lisa({ ancho: 300, alto: 200 }))).json.data)
    const [vieja, nueva, viejaUsada] = subidas
    await sql(`UPDATE fotos SET created_at = now() - interval '25 hours' WHERE id IN (:ids)`, { ids: [vieja.id, viejaUsada.id] })
    await sql('CREATE TABLE prueba_usos (foto_id int REFERENCES fotos ON DELETE RESTRICT)')
    try {
      await sql('INSERT INTO prueba_usos (foto_id) VALUES (:id)', { id: viejaUsada.id })
      const conUsos = crearAlmacen(base.sequelize, { usos: [{ tabla: 'prueba_usos', columna: 'foto_id' }] })
      const registro = crearRegistroDeTareas()
      const logs = escucharLogs()
      try {
        const tareas = programarTareas({ sequelize: base.sequelize, registro, almacen: conUsos })
        await tareas.listas
        tareas.detener()
      } finally {
        logs.detener()
      }
      assert.deepEqual(registro.fallidas(), [])
      const linea = logs.eventos().find((e) => e.evento === 'fotos_huerfanas')
      assert.equal(linea.borradas, 1, JSON.stringify(linea))
      const quedan = (await sql('SELECT id FROM fotos WHERE id IN (:ids)', { ids: subidas.map((f) => f.id) })).map((f) => f.id).sort((a, b) => a - b)
      assert.deepEqual(quedan, [nueva.id, viejaUsada.id].sort((a, b) => a - b))
      assert.equal((await sql('SELECT count(*)::int AS n FROM fotos_archivos WHERE foto_id = :id', { id: vieja.id }))[0].n, 0)
    } finally {
      await sql('DROP TABLE prueba_usos')
    }
  })

  test('USOS_DE_FOTOS coincide con las claves foráneas de la base que apuntan a fotos (si no, la tarea borraría fotos en uso)', async () => {
    const enLaBase = await sql(`
      SELECT cl.relname AS tabla, a.attname AS columna
        FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = cl.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
       WHERE c.contype = 'f' AND c.confrelid = 'fotos'::regclass AND n.nspname = 'public' AND cl.relname <> 'fotos_archivos'
       ORDER BY 1, 2`)
    const enElCodigo = [...USOS_DE_FOTOS]
      .map(({ tabla, columna }) => ({ tabla, columna }))
      .sort((a, b) => `${a.tabla}.${a.columna}`.localeCompare(`${b.tabla}.${b.columna}`))
    assert.deepEqual(enLaBase, enElCodigo)
  })
})
