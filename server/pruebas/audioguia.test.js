// El módulo de audioguías (especificación de las audioguías, versión 2, secciones 1.2 a 4 y 9.1), sin base y sin
// Chrome: las firmas (server/audioguia/firma.js), las cookies y lo que decide cada pedido (acceso.js), el validador de
// MP3 (mp3.js), el esquema del manifiesto (compartido/esquemas/audioguias.js) y su lectura con los archivos
// (pistas.js); y, desde la etapa del servidor (20/11/2026), la configuración (server/config.js), las rutas
// (rutas.js: el 303 del QR, el audio con su token y su límite, y la página, que todavía no existe en
// src/tablaDePaginas.js y se prueba con el router suelto y conPagina), el montaje en server/app.js (apagado, el sitio
// responde igual: las mismas cabeceras, la 404 en /audioguia/… y ninguna cookie) y el script de las URL de los QR
// (server/scripts/audioguia-urls.js). La app va armada a mano, sin base (SIN_BASE=maximo) y con un build falso
// (levantar() de ayudas.js, que desde el 24/11/2026 recibe el reloj, necesita la base de prueba). Desde la etapa de los QR (23/11/2026), también la parte de
// tools/audioguia-qr.mjs que valida las URL y arma los símbolos (la versión 6 con mupa.ar, la 7 con el host de prueba,
// la misma para los 13), importada y sin Chrome: los PDF los comprueba la propia herramienta al correr. Desde la
// corrección de la verificación (23/11/2026): que un pedido de audio rechazado no gaste el límite (AG-SEG-01), el
// error audioguia_limite_global en Render con TRUST_PROXY=0, que la herramienta nunca borre un archivo ajeno en la
// carpeta de salida (AG-QR-01) y la hoja de prueba con un código por intento (AG-QR-02); y el fs.deny de los dos Vite de
// npm run dev (server/denegados-dev.js: AG-SEG-04 y AG-COD-02), comparado con la lista que trae el Vite instalado y
// probado con un Vite de verdad sobre una carpeta temporal. Desde la etapa de la página (24/11/2026,
// src/paginas/Audioguia.jsx en src/tablaDePaginas.js): el router la prende solo (y sin ella, conPagina: false, la 404),
// la app prendida la sirve, y con el render de verdad (src/entry-server.jsx con el Vite del proyecto) el h1 de cada
// versión, los src, la frase y el enlace de versión y las anclas; el HTML entero de la página lo prueba layout.test.js.
// Desde la etapa de las recetas (24/11/2026): la carpeta real, audioguias/ (9.2: el manifiesto contra el esquema y
// contra TEXTOS_DEL_GUION, los cuatro archivos de cada estación grabada, ningún archivo de más, cada MP3 y cada
// transcripción, y los avisos de lo provisorio y lo sin grabar), y las estaciones «sin grabar» de pistas.js (ninguno de
// sus cuatro archivos: se saltean sin un error, con un solo aviso) con hayGrabaciones (el aviso de server/app.js sin la
// clave, solo con algún MP3).
//
// Los MP3 se arman acá, en memoria: cuadros MPEG-1 Layer III con la cabecera FF FB 50 C4 (64 kbps, 44,1 kHz, mono, 208
// bytes) y el resto en ceros, que es silencio; con otros bytes de cabecera, los de 80 kbps, estéreo o 48 kHz. Nunca un
// archivo binario en el repo: los que necesita pistas.js van a una carpeta temporal que se borra al terminar.
// El reloj va fijo (la medianoche de San Juan, 03:00 UTC: San Juan no tiene horario de verano).
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, sep } from 'node:path'
import { after, describe, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import express from 'express'
import { SALAS_DEL_PLANO } from '../../src/components/mapaSalas.js'
import {
  accesoDeLaPagina,
  COOKIE_VERSION,
  cookieDeDia,
  cookieDeVersion,
  DESTINO_CODIGO_INVALIDO,
  destinoDelQr,
  leerCookies,
  nombreCookieDeDia,
  permisoDeDia,
  versionDeLaPagina,
} from '../audioguia/acceso.js'
import {
  ESPACIOS_DE_LA_AUDIOGUIA,
  ESPACIOS_FUERA_DEL_PLANO,
  IDS_DEL_PLANO,
  numeroEnDosCifras,
  validarManifiesto,
} from '../../compartido/esquemas/audioguias.js'
import { codigoDeQr, crearClaves, firmar, leerCodigoDeQr, leerTokenDeDia, tokenDeDia } from '../audioguia/firma.js'
import { BYTES_MAX, leerMp3, leerMp3DeArchivo, lectorDeBuffer } from '../audioguia/mp3.js'
import { archivosDeLaEstacion, cargarPistas, duracionCorta, duracionLarga, hayGrabaciones, parrafosDe, SUFIJOS } from '../audioguia/pistas.js'
import { crearRutasDeAudioguia, LIMITE_PISTAS, VENTANA_PISTAS_MS } from '../audioguia/rutas.js'
import { audioguiaDeLaApp, crearApp, estaticosDelBuild } from '../app.js'
import { DENEGADOS_EN_DESARROLLO } from '../denegados-dev.js'
import { leerConfig } from '../config.js'
import { manejadorDeErrores } from '../errores.js'
import { crearMuseoPublico } from '../museo.js'
import { crearRutasPublicas } from '../rutas-publicas.js'
import { leerArgumentos, origenDe, renglones } from '../scripts/audioguia-urls.js'
import { cargarBuild, crearSsr, partir } from '../ssr.js'
import * as qr from '../../tools/audioguia-qr.mjs'
import { escucharLogs, pedir } from './ayudas.js'

// Una clave de prueba (no es la de ningún entorno) y otra para comprobar que la firma depende de la clave.
const CLAVE = 'clave-de-prueba-de-la-audioguia_0123456789'
const OTRA_CLAVE = 'otra-clave-de-prueba-de-la-audioguia_98765'
const claves = crearClaves(CLAVE)
const HTTPS = 'https://mupa.ar/'
const HTTP = 'http://127.0.0.1:5183/'

// Las 12:00 del 20/11/2026 en San Juan, y el último medio segundo antes de la medianoche y la medianoche misma.
const MEDIODIA = new Date('2026-11-20T15:00:00Z')
const CASI_MEDIANOCHE = new Date('2026-11-21T02:59:59.500Z')
const MEDIANOCHE = new Date('2026-11-21T03:00:00Z')
const relojEn = (fecha) => () => fecha

// ——— Los MP3 armados a mano ———

const BITRATES = { 32: 1, 40: 2, 48: 3, 56: 4, 64: 5, 80: 6, 96: 7, 128: 9 }
const FRECUENCIAS = { 44_100: 0, 48_000: 1, 32_000: 2 }

/** La cabecera de un cuadro MPEG-1 Layer III, sin CRC (0xFB). */
function cabecera({ kbps = 64, hz = 44_100, mono = true, relleno = 0 } = {}) {
  return Buffer.from([0xff, 0xfb, (BITRATES[kbps] << 4) | (FRECUENCIAS[hz] << 2) | (relleno << 1), mono ? 0xc4 : 0x04])
}
const largoDeCuadro = (kbps, hz) => Math.floor((144 * kbps * 1000) / hz)

/** Un cuadro entero: la cabecera y el resto en ceros, con una marca opcional en una posición. */
function cuadro(opciones = {}, marca = null) {
  const { kbps = 64, hz = 44_100 } = opciones
  const buf = Buffer.alloc(largoDeCuadro(kbps, hz))
  cabecera(opciones).copy(buf, 0)
  if (marca) Buffer.from(marca.texto, 'latin1').copy(buf, marca.posicion)
  return buf
}

/**
 * Un MP3 de tantos segundos (redondeados a cuadros enteros).
 * @param {{ segundos?: number, kbps?: number, hz?: number, mono?: boolean, id3?: Buffer | null, tag?: boolean,
 *   lame?: 'Xing' | 'Info' | 'VBRI' | null, cuadros?: number, antes?: Buffer }} [opciones]
 */
function armarMp3({ segundos = 30, kbps = 64, hz = 44_100, mono = true, id3 = null, tag = false, lame = null, cuadros, antes } = {}) {
  const largo = largoDeCuadro(kbps, hz)
  const n = cuadros ?? Math.round((segundos * kbps * 1000) / 8 / largo)
  const partes = []
  if (id3) partes.push(id3)
  if (antes) partes.push(antes)
  // El encabezado de LAME va después de la información lateral: 17 bytes en mono y 32 en estéreo; VBRI, a 36 bytes.
  const posicion = lame === 'VBRI' ? 36 : 4 + (mono ? 17 : 32)
  if (lame) partes.push(cuadro({ kbps, hz, mono }, { texto: lame, posicion }))
  for (let i = lame ? 1 : 0; i < n; i++) partes.push(cuadro({ kbps, hz, mono }))
  if (tag) partes.push(Buffer.concat([Buffer.from('TAG', 'latin1'), Buffer.alloc(125)]))
  return Buffer.concat(partes)
}

/** Una etiqueta ID3v2 de tantos bytes de contenido (el tamaño, en syncsafe), con pie si se pide. */
function armarId3(contenido, { pie = false } = {}) {
  const n = contenido.length
  const encabezado = Buffer.from([0x49, 0x44, 0x33, 4, 0, pie ? 0x10 : 0, (n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f])
  return Buffer.concat([encabezado, contenido, pie ? Buffer.concat([Buffer.from('3DI', 'latin1'), Buffer.alloc(7)]) : Buffer.alloc(0)])
}

const leer = (buffer) => leerMp3(lectorDeBuffer(buffer))

// ——— Las carpetas temporales de pistas.js ———

const carpetas = []
after(() => {
  for (const dir of carpetas) rmSync(dir, { recursive: true, force: true })
})

/**
 * Una carpeta con un manifiesto y sus archivos.
 * @param {object | string} manifiesto  el objeto (se escribe con JSON.stringify) o el texto tal cual
 * @param {Record<string, Buffer | string>} archivos
 */
function carpeta(manifiesto, archivos = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'mupa-audioguia-'))
  carpetas.push(dir)
  if (manifiesto !== null) writeFileSync(join(dir, 'pistas.json'), typeof manifiesto === 'string' ? manifiesto : JSON.stringify(manifiesto))
  for (const [nombre, contenido] of Object.entries(archivos)) writeFileSync(join(dir, nombre), contenido)
  return dir
}

/** Los cuatro archivos de una estación: los dos MP3 (de distinto largo, así se distinguen) y las dos transcripciones. */
function archivosDe(numero, { comun = {}, ad = {} } = {}) {
  const nn = numeroEnDosCifras(numero)
  return {
    [`${nn}.mp3`]: armarMp3({ segundos: 30, ...comun }),
    [`${nn}-ad.mp3`]: armarMp3({ segundos: 45, ...ad }),
    [`${nn}.txt`]: `Estación ${numero}.\n`,
    [`${nn}-ad.txt`]: `Estación ${numero}, con audiodescripción.\n`,
  }
}

/** El recorrido de la prueba: Recepción al principio y al final, dos espacios, cuatro estaciones. */
const RECORRIDO = Object.freeze({
  version: 1,
  recorrido: [
    { espacio: 'recepcion', nombre: 'Recepción', nombreGuion: 'RECEPCIÓN', estaciones: [{ numero: 1, titulo: 'Bienvenida al MUPA' }] },
    {
      espacio: 'sala-1',
      nombre: 'Sala 1',
      nombreGuion: 'SALA 1',
      titulo: 'EL CICLO DE LA VIDA',
      lema: 'Empecemos desde cero',
      estaciones: [{ numero: 2, titulo: 'Empecemos desde cero' }],
    },
    {
      espacio: 'sala-3',
      nombre: 'Sala 3',
      nombreGuion: 'SALA 3',
      titulo: 'EL LABORATORIO',
      estaciones: [{ numero: 3, titulo: 'EL LABORATORIO', tituloProvisorio: true }],
    },
    { espacio: 'recepcion', nombre: 'Recepción', nombreGuion: 'RECEPCIÓN', estaciones: [{ numero: 4, titulo: 'Despedida MUPA' }] },
  ],
})

/** Un log que anota en vez de escribir. */
function anotador() {
  const lineas = []
  const log = (nivel, evento, datos) => lineas.push({ nivel, evento, ...datos })
  return { log, lineas }
}

// Una copia del recorrido con un cambio, sin tocar el original.
const copia = () => structuredClone(RECORRIDO)

// Los nombres del plano, como los da home.mapa.espacios de src/content.js (que no se puede cargar en Node sin Vite: la
// comparación con el archivo de verdad va en layout.test.js, en la etapa siguiente).
const NOMBRES_DEL_PLANO = {
  'sala-inmersiva': 'Sala Inmersiva',
  'sala-8': 'Sala 8',
  'sala-1': 'Sala 1',
  'sala-educativa': 'Sala Educativa',
  'sala-2': 'Sala 2',
  'sala-3': 'Sala 3',
  'sala-4': 'Sala 4',
  'sala-5': 'Sala 5',
  'jardin-triasico': 'Jardín Triásico',
  'sala-6': 'Sala 6',
  'sala-7': 'Sala 7',
}

describe('las firmas (firma.js)', () => {
  test('la clave tiene que tener la forma de AUDIOGUIA_CLAVE', () => {
    assert.throws(() => crearClaves('corta'), /de 32 a 128/)
    assert.throws(() => crearClaves(`${'a'.repeat(40)}!`), /base64url/)
    assert.throws(() => crearClaves(undefined), /AUDIOGUIA_CLAVE/)
    assert.ok(crearClaves('a'.repeat(32)))
  })

  test('el código de un QR: la forma, la firma de 22 caracteres y que dependa de la clave', () => {
    const codigo = codigoDeQr(claves, 'sala-2', 1)
    assert.match(codigo, /^sala-2\.1\.[A-Za-z0-9_-]{22}$/)
    assert.equal(codigoDeQr(claves, 'sala-2', 1), codigo, 'el mismo código siempre')
    assert.notEqual(codigoDeQr(crearClaves(OTRA_CLAVE), 'sala-2', 1), codigo)
    assert.notEqual(codigoDeQr(claves, 'sala-2', 2), codigo)
    assert.throws(() => codigoDeQr(claves, 'Sala-2', 1), /forma/)
    assert.throws(() => codigoDeQr(claves, 'sala-2', 0), /de 1 a 999/)
    assert.throws(() => codigoDeQr(claves, 'sala-2', 1000), /de 1 a 999/)
  })

  test('el largo de la URL de un QR definitivo: como mucho 68 con una cifra y 70 con tres (3.2)', () => {
    const base = 'https://mupa.ar/audioguia/q/'
    assert.equal(`${base}${codigoDeQr(claves, 'jardin-triasico', 1)}`.length, 68)
    assert.equal(`${base}${codigoDeQr(claves, 'jardin-triasico', 999)}`.length, 70)
    assert.equal(`${base}${codigoDeQr(claves, 'recepcion', 1)}?v=ad`.length, 67)
  })

  test('leerCodigoDeQr: válido, y los motivos forma, firma, version y espacio, en ese orden', () => {
    const espacios = new Set(['recepcion', 'sala-1', 'sala-2'])
    const esperado = { version: 1, espacios }
    assert.deepEqual(leerCodigoDeQr(claves, codigoDeQr(claves, 'sala-2', 1), esperado), { ok: true, espacio: 'sala-2' })
    assert.deepEqual(leerCodigoDeQr(claves, codigoDeQr(claves, 'sala-2', 1), { version: 1, espacios: ['sala-2'] }), { ok: true, espacio: 'sala-2' })

    for (const malo of [undefined, null, 7, ['a', 'b'], '', 'sala-2', 'sala-2.1', 'SALA-2.1.AAAAAAAAAAAAAAAAAAAAAA',
      'sala-2.01.AAAAAAAAAAAAAAAAAAAAAA', 'sala-2.1.AAAAAAAAAAAAAAAAAAAAA', `${codigoDeQr(claves, 'sala-2', 1)}x`,
      `${codigoDeQr(claves, 'sala-2', 1)}.x`, 'sala-2.1.AAAAAAAAAAAAAAAAAAAA+A', 'x'.repeat(200)]) {
      assert.deepEqual(leerCodigoDeQr(claves, malo, esperado), { ok: false, motivo: 'forma' }, String(malo))
    }

    const bueno = codigoDeQr(claves, 'sala-2', 1)
    const ultima = bueno.at(-1) === 'A' ? 'B' : 'A'
    assert.deepEqual(leerCodigoDeQr(claves, `${bueno.slice(0, -1)}${ultima}`, esperado), { ok: false, motivo: 'firma' })
    assert.deepEqual(leerCodigoDeQr(claves, 'sala-2.1.AAAAAAAAAAAAAAAAAAAAAA', esperado), { ok: false, motivo: 'firma' })
    // Otra clave, o el código de otro espacio con la firma de este: firma.
    assert.deepEqual(leerCodigoDeQr(claves, codigoDeQr(crearClaves(OTRA_CLAVE), 'sala-2', 1), esperado), { ok: false, motivo: 'firma' })
    assert.deepEqual(leerCodigoDeQr(claves, bueno.replace('sala-2', 'sala-1'), esperado), { ok: false, motivo: 'firma' })
    // El de otra versión bien firmado es un QR viejo; con la firma mala, sigue siendo firma.
    assert.deepEqual(leerCodigoDeQr(claves, codigoDeQr(claves, 'sala-2', 1), { version: 2, espacios }), { ok: false, motivo: 'version' })
    assert.deepEqual(leerCodigoDeQr(claves, bueno.replace('.1.', '.2.'), { version: 2, espacios }), { ok: false, motivo: 'firma' })
    // Bien firmado, de esta versión, pero el espacio no está en el recorrido.
    assert.deepEqual(leerCodigoDeQr(claves, codigoDeQr(claves, 'sala-7', 1), esperado), { ok: false, motivo: 'espacio' })
  })

  test('las claves van separadas por uso: la firma de un QR no sirve de token de día ni al revés', () => {
    const dia = '2026-11-20'
    const conLaDelQr = `1.${dia}.${firmar(claves.kQR, `dia|1|${dia}`)}`
    assert.deepEqual(leerTokenDeDia(claves, conLaDelQr, { version: 1, hoy: dia }), { ok: false, motivo: 'firma' })
    const conLaDelDia = `sala-2.1.${firmar(claves.kDia, 'qr|1|sala-2')}`
    assert.deepEqual(leerCodigoDeQr(claves, conLaDelDia, { version: 1, espacios: ['sala-2'] }), { ok: false, motivo: 'firma' })
    assert.notDeepEqual(claves.kQR, claves.kDia)
  })

  test('el token de día: vale hoy y con esta versión; de ayer o de otra versión, no; ?t=a&t=b no es un string', () => {
    const hoy = '2026-11-20'
    const token = tokenDeDia(claves, 1, hoy)
    assert.match(token, /^1\.2026-11-20\.[A-Za-z0-9_-]{22}$/)
    assert.deepEqual(leerTokenDeDia(claves, token, { version: 1, hoy }), { ok: true })
    assert.deepEqual(leerTokenDeDia(claves, tokenDeDia(claves, 1, '2026-11-19'), { version: 1, hoy }), { ok: false, motivo: 'dia' })
    assert.deepEqual(leerTokenDeDia(claves, token, { version: 2, hoy }), { ok: false, motivo: 'version' })
    assert.deepEqual(leerTokenDeDia(claves, token.replace('-20.', '-21.'), { version: 1, hoy: '2026-11-21' }), { ok: false, motivo: 'firma' })
    assert.deepEqual(leerTokenDeDia(claves, tokenDeDia(crearClaves(OTRA_CLAVE), 1, hoy), { version: 1, hoy }), { ok: false, motivo: 'firma' })
    for (const malo of [undefined, null, 1, [token, token], [token], '', `${token} `, `${token}.`, token.slice(0, -1), 'x'.repeat(100)]) {
      assert.deepEqual(leerTokenDeDia(claves, malo, { version: 1, hoy }), { ok: false, motivo: 'forma' }, String(malo))
    }
    assert.throws(() => tokenDeDia(claves, 1, '20/11/2026'), /AAAA-MM-DD/)
  })
})

describe('las cookies y el acceso (acceso.js)', () => {
  test('el nombre de la cookie de día, según https o http (como nombreCookie de sesiones.js)', () => {
    assert.equal(nombreCookieDeDia(HTTPS), '__Secure-mupa_audioguia')
    assert.equal(nombreCookieDeDia(HTTP), 'mupa_audioguia')
    assert.equal(nombreCookieDeDia('http://192.168.0.10:5183/'), 'mupa_audioguia')
  })

  test('la cookie de día, exacta: Path=/audioguia, HttpOnly, SameSite=Lax, Secure solo en https, sin Domain ni Expires', () => {
    const token = tokenDeDia(claves, 1, '2026-11-20')
    assert.equal(
      cookieDeDia({ urlPublica: HTTPS, token, reloj: relojEn(MEDIODIA) }),
      `__Secure-mupa_audioguia=${token}; Path=/audioguia; Max-Age=43200; HttpOnly; Secure; SameSite=Lax`,
    )
    assert.equal(
      cookieDeDia({ urlPublica: HTTP, token, reloj: relojEn(MEDIODIA) }),
      `mupa_audioguia=${token}; Path=/audioguia; Max-Age=43200; HttpOnly; SameSite=Lax`,
    )
  })

  test('vence a la medianoche de San Juan: medio segundo antes, Max-Age=1; justo a la medianoche, un día entero', () => {
    const maxAge = (fecha) => /Max-Age=(\d+)/.exec(cookieDeDia({ urlPublica: HTTPS, token: 'x', reloj: relojEn(fecha) }))[1]
    assert.equal(maxAge(CASI_MEDIANOCHE), '1')
    assert.equal(maxAge(MEDIANOCHE), String(24 * 3600))
    assert.equal(maxAge(new Date('2026-12-31T23:30:00Z')), String(3.5 * 3600), 'fin de año, a las 20:30 de San Juan')
  })

  test('el permiso de hoy deja de valer a la medianoche de San Juan', () => {
    const cabecera = `mupa_audioguia=${tokenDeDia(claves, 1, '2026-11-20')}`
    const pedido = { cabeceraCookie: cabecera, urlPublica: HTTP, claves, version: 1 }
    assert.deepEqual(accesoDeLaPagina({ ...pedido, reloj: relojEn(MEDIODIA) }), { acceso: true })
    assert.deepEqual(accesoDeLaPagina({ ...pedido, reloj: relojEn(CASI_MEDIANOCHE) }), { acceso: true })
    assert.deepEqual(accesoDeLaPagina({ ...pedido, reloj: relojEn(MEDIANOCHE) }), { acceso: false, motivo: 'vencido' })
  })

  test('la medianoche de San Juan no depende de la zona horaria del proceso (TZ)', () => {
    const acceso = pathToFileURL(join(import.meta.dirname, '../audioguia/acceso.js')).href
    const firma = pathToFileURL(join(import.meta.dirname, '../audioguia/firma.js')).href
    const codigo = `
      const { cookieDeDia, accesoDeLaPagina } = await import(${JSON.stringify(acceso)})
      const { crearClaves, tokenDeDia } = await import(${JSON.stringify(firma)})
      const claves = crearClaves(${JSON.stringify(CLAVE)})
      const cabeceraCookie = 'mupa_audioguia=' + tokenDeDia(claves, 1, '2026-11-20')
      const casi = () => new Date('2026-11-21T02:59:59.500Z')
      const ya = () => new Date('2026-11-21T03:00:00Z')
      console.log(JSON.stringify([
        cookieDeDia({ urlPublica: 'http://x/', token: 't', reloj: casi }),
        accesoDeLaPagina({ cabeceraCookie, urlPublica: 'http://x/', claves, version: 1, reloj: casi }),
        accesoDeLaPagina({ cabeceraCookie, urlPublica: 'http://x/', claves, version: 1, reloj: ya }),
      ]))`
    for (const TZ of ['Pacific/Kiritimati', 'UTC', 'America/Los_Angeles']) {
      const r = spawnSync(process.execPath, ['--input-type=module', '-e', codigo], { env: { ...process.env, TZ }, encoding: 'utf8' })
      assert.equal(r.status, 0, r.stderr)
      const [cookie, antes, despues] = JSON.parse(r.stdout)
      assert.match(cookie, /Max-Age=1;/, TZ)
      assert.deepEqual(antes, { acceso: true }, TZ)
      assert.deepEqual(despues, { acceso: false, motivo: 'vencido' }, TZ)
    }
  })

  test('leerCookies da todas las del mismo nombre, en orden, y nada más', () => {
    assert.deepEqual(leerCookies(undefined, 'mupa_audioguia'), [])
    assert.deepEqual(leerCookies('', 'mupa_audioguia'), [])
    assert.deepEqual(leerCookies(['a=b'], 'a'), [])
    assert.deepEqual(
      leerCookies('mupa_audioguia=uno; otra=x; __Secure-mupa_audioguia=dos;mupa_audioguia=tres ; mupa_audioguia_version=ad; sinvalor', 'mupa_audioguia'),
      ['uno', 'tres'],
    )
    assert.deepEqual(leerCookies('a=1=2', 'a'), ['1=2'])
  })

  test('el acceso de la página: vale si alguna cookie vale, aunque haya otra vieja con el mismo nombre', () => {
    const hoy = tokenDeDia(claves, 1, '2026-11-20')
    const ayer = tokenDeDia(claves, 1, '2026-11-19')
    const base = { urlPublica: HTTPS, claves, version: 1, reloj: relojEn(MEDIODIA) }
    assert.deepEqual(accesoDeLaPagina({ ...base, cabeceraCookie: `__Secure-mupa_audioguia=${ayer}; __Secure-mupa_audioguia=${hoy}` }), { acceso: true })
    assert.deepEqual(accesoDeLaPagina({ ...base, cabeceraCookie: `__Secure-mupa_audioguia=${hoy}; __Secure-mupa_audioguia=basura` }), { acceso: true })
    // Con la cookie que vale, la consulta no importa.
    assert.deepEqual(accesoDeLaPagina({ ...base, cabeceraCookie: `__Secure-mupa_audioguia=${hoy}`, consulta: { motivo: 'codigo' } }), { acceso: true })
    // En https se lee solo la de nombre __Secure-: la de http no cuenta.
    assert.deepEqual(accesoDeLaPagina({ ...base, cabeceraCookie: `mupa_audioguia=${hoy}` }), { acceso: false, motivo: 'sin-codigo' })
    // El token de día en la consulta no da acceso (la página lee solo la cookie, A5).
    assert.deepEqual(accesoDeLaPagina({ ...base, consulta: { t: hoy } }), { acceso: false, motivo: 'sin-codigo' })
  })

  test('los cuatro motivos, en su orden: codigo, vencido, sin-cookie y sin-codigo', () => {
    const ayer = `__Secure-mupa_audioguia=${tokenDeDia(claves, 1, '2026-11-19')}`
    const deOtraVersion = `__Secure-mupa_audioguia=${tokenDeDia(claves, 2, '2026-11-20')}`
    const base = { urlPublica: HTTPS, claves, version: 1, reloj: relojEn(MEDIODIA) }
    const motivo = (pedido) => accesoDeLaPagina({ ...base, ...pedido }).motivo
    assert.equal(motivo({ consulta: { motivo: 'codigo' } }), 'codigo')
    assert.equal(motivo({ consulta: { motivo: 'codigo' }, cabeceraCookie: ayer }), 'codigo')
    assert.equal(motivo({ cabeceraCookie: ayer }), 'vencido')
    assert.equal(motivo({ cabeceraCookie: deOtraVersion }), 'vencido')
    assert.equal(motivo({ cabeceraCookie: ayer, consulta: { r: '1' } }), 'vencido')
    assert.equal(motivo({ consulta: { r: '1' } }), 'sin-cookie')
    assert.equal(motivo({}), 'sin-codigo')
    assert.equal(motivo({ consulta: { motivo: 'otra' } }), 'sin-codigo')
    assert.equal(motivo({ consulta: { motivo: ['codigo', 'codigo'] } }), 'sin-codigo')
    assert.equal(motivo({ consulta: { r: '2' } }), 'sin-codigo')
  })

  test('la versión: v por lista blanca, si no la cookie de preferencia, si no la común', () => {
    assert.deepEqual(versionDeLaPagina({ consulta: { v: 'ad' } }), { version: 'ad', guardar: 'ad' })
    assert.deepEqual(versionDeLaPagina({ consulta: { v: 'comun' }, cabeceraCookie: `${COOKIE_VERSION}=ad` }), { version: 'comun', guardar: 'comun' })
    assert.deepEqual(versionDeLaPagina({ cabeceraCookie: `${COOKIE_VERSION}=ad` }), { version: 'ad', guardar: null })
    assert.deepEqual(versionDeLaPagina({ consulta: { v: 'basura' } }), { version: 'comun', guardar: null })
    assert.deepEqual(versionDeLaPagina({ consulta: { v: 'basura' }, cabeceraCookie: `${COOKIE_VERSION}=ad` }), { version: 'ad', guardar: null })
    assert.deepEqual(versionDeLaPagina({ consulta: { v: ['ad', 'ad'] } }), { version: 'comun', guardar: null })
    assert.deepEqual(versionDeLaPagina({ cabeceraCookie: `${COOKIE_VERSION}=AD; ${COOKIE_VERSION}=ad` }), { version: 'ad', guardar: null })
    assert.deepEqual(versionDeLaPagina({}), { version: 'comun', guardar: null })
  })

  test('la cookie de preferencia, exacta: 180 días, Path=/audioguia, HttpOnly, SameSite=Lax', () => {
    assert.equal(cookieDeVersion({ urlPublica: HTTPS, version: 'ad' }), 'mupa_audioguia_version=ad; Path=/audioguia; Max-Age=15552000; HttpOnly; Secure; SameSite=Lax')
    assert.equal(cookieDeVersion({ urlPublica: HTTP, version: 'comun' }), 'mupa_audioguia_version=comun; Path=/audioguia; Max-Age=15552000; HttpOnly; SameSite=Lax')
    assert.throws(() => cookieDeVersion({ urlPublica: HTTPS, version: 'basura' }), /comun o ad/)
  })

  test('el Location del 303 de un QR, exacto: Recepción sin fragmento y v solo si es ad', () => {
    assert.equal(destinoDelQr('sala-1'), '/audioguia/sala-1?r=1#espacio-sala-1')
    assert.equal(destinoDelQr('sala-1', { v: 'ad' }), '/audioguia/sala-1?r=1&v=ad#espacio-sala-1')
    assert.equal(destinoDelQr('sala-1', { v: 'comun' }), '/audioguia/sala-1?r=1#espacio-sala-1')
    assert.equal(destinoDelQr('sala-1', { v: 'otra' }), '/audioguia/sala-1?r=1#espacio-sala-1')
    assert.equal(destinoDelQr('sala-1', { v: ['ad', 'ad'] }), '/audioguia/sala-1?r=1#espacio-sala-1')
    assert.equal(destinoDelQr('recepcion'), '/audioguia/recepcion?r=1')
    assert.equal(destinoDelQr('recepcion', { v: 'ad' }), '/audioguia/recepcion?r=1&v=ad')
    assert.equal(DESTINO_CODIGO_INVALIDO, '/audioguia?motivo=codigo')
  })
})

describe('el validador de MP3 (mp3.js)', () => {
  test('un CBR de 64 kbps, mono, 44,1 kHz: la duración, el bitrate, la frecuencia y los canales', () => {
    assert.deepEqual(leer(armarMp3({ segundos: 30 })), { duracionS: 30, kbps: 64, hz: 44_100, canales: 1 })
    assert.deepEqual(leer(armarMp3({ segundos: 72 })), { duracionS: 72, kbps: 64, hz: 44_100, canales: 1 })
    assert.equal(leer(armarMp3({ segundos: 40, kbps: 80 })).kbps, 80)
  })

  test('con ID3v2 adelante (con y sin pie, y con un FF FB suelto adentro) y un TAG atrás: la misma duración', () => {
    const suelto = Buffer.concat([Buffer.alloc(30), cabecera(), Buffer.alloc(60)])
    const base = leer(armarMp3({ segundos: 30 }))
    assert.deepEqual(leer(armarMp3({ segundos: 30, id3: armarId3(suelto), tag: true })), base)
    assert.deepEqual(leer(armarMp3({ segundos: 30, id3: armarId3(Buffer.alloc(3000), { pie: true }) })), base)
    // El tamaño syncsafe de más de 127 bytes usa más de un byte.
    assert.deepEqual(leer(armarMp3({ segundos: 30, id3: armarId3(Buffer.alloc(1000)) })), base)
  })

  test('una sincronía suelta (sin otro cuadro donde termina) no engaña: se sigue buscando', () => {
    const basura = Buffer.concat([cabecera(), Buffer.alloc(296, 0x11)])
    assert.equal(leer(armarMp3({ segundos: 30, antes: basura })).duracionS, 30)
  })

  test('Info (LAME en CBR) se acepta y no cuenta como audio; Xing y VBRI son un VBR', () => {
    assert.equal(leer(armarMp3({ segundos: 30, lame: 'Info' })).duracionS, 30)
    assert.throws(() => leer(armarMp3({ lame: 'Xing' })), /bitrate variable: exportá en CBR/)
    assert.throws(() => leer(armarMp3({ lame: 'VBRI' })), /bitrate variable: exportá en CBR/)
  })

  test('estéreo, 48 kHz o 32 kHz: rechazados con el mensaje que dice qué exportar', () => {
    assert.throws(() => leer(armarMp3({ mono: false })), /^Error: estéreo: exportá en mono$/)
    assert.throws(() => leer(armarMp3({ hz: 48_000 })), /^Error: 48 kHz: exportá a 44,1 kHz$/)
    assert.throws(() => leer(armarMp3({ hz: 32_000 })), /^Error: 32 kHz: exportá a 44,1 kHz$/)
  })

  test('lo que no es un MP3: un WAV, un FLAC, un M4A, ceros, un MPEG-2 o un Layer II', () => {
    const wav = Buffer.concat([Buffer.from('RIFF\0\0\0\0WAVEfmt ', 'latin1'), Buffer.alloc(200_000)])
    assert.throws(() => leer(wav), /no es MP3 \(empieza con RIFF: es un WAV\)/)
    assert.throws(() => leer(Buffer.concat([Buffer.from('fLaC', 'latin1'), Buffer.alloc(9000)])), /es un FLAC/)
    assert.throws(() => leer(Buffer.concat([Buffer.from('\0\0\0\x20ftypM4A ', 'latin1'), Buffer.alloc(9000)])), /M4A/)
    assert.throws(() => leer(Buffer.alloc(200_000)), /no se encontraron dos cuadros MPEG-1 Layer III/)
    const mpeg2 = Buffer.alloc(200_000)
    for (let i = 0; i + 4 < mpeg2.length; i += 144) Buffer.from([0xff, 0xf3, 0x50, 0xc4]).copy(mpeg2, i)
    assert.throws(() => leer(mpeg2), /no se encontraron dos cuadros MPEG-1 Layer III/)
    const layer2 = Buffer.alloc(200_000)
    for (let i = 0; i + 4 < layer2.length; i += 208) Buffer.from([0xff, 0xfd, 0x50, 0xc4]).copy(layer2, i)
    assert.throws(() => leer(layer2), /no se encontraron dos cuadros MPEG-1 Layer III/)
    assert.throws(() => leerMp3({ leer: () => Buffer.alloc(0), bytes: 0 }), /está vacío/)
  })

  test('cortado: un solo cuadro, o una etiqueta ID3 que dice más bytes de los que hay', () => {
    assert.throws(() => leer(armarMp3({ cuadros: 1 })), /está cortado: termina antes del segundo cuadro/)
    const id3 = armarId3(Buffer.alloc(10))
    id3[9] = 0x7f
    id3[8] = 0x7f
    assert.throws(() => leer(Buffer.concat([id3, Buffer.alloc(100)])), /termina adentro de la etiqueta ID3/)
  })

  test('los topes: de 20 s a 5 minutos y 3 MB', () => {
    assert.throws(() => leer(armarMp3({ segundos: 10 })), /dura 10 s: menos de 20 s/)
    assert.equal(leer(armarMp3({ segundos: 20 })).duracionS, 20)
    assert.equal(leer(armarMp3({ segundos: 300 })).duracionS, 300)
    assert.throws(() => leer(armarMp3({ segundos: 330 })), /dura 330 s: más de 5 minutos/)
    // Sin armar 3 MB: un lector que solo deja leer el principio (para ver si es un WAV), nada más.
    const principio = armarMp3({ cuadros: 2 }).subarray(0, 10)
    const lector = (p, l) => (p === 0 && l <= 10 ? principio.subarray(0, l) : assert.fail('no tenía que leer más que el principio'))
    assert.throws(() => leerMp3({ leer: lector, bytes: BYTES_MAX + 1 }), /pesa más de 3 MB/)
  })

  test('del disco, leyendo por posiciones: lo mismo, más los bytes', () => {
    const buf = armarMp3({ segundos: 30, tag: true })
    const dir = carpeta(null, { 'suelto.mp3': buf })
    assert.deepEqual(leerMp3DeArchivo(join(dir, 'suelto.mp3')), { duracionS: 30, kbps: 64, hz: 44_100, canales: 1, bytes: buf.length })
    assert.throws(() => leerMp3DeArchivo(join(dir, 'no-esta.mp3')), { code: 'ENOENT' })
  })

  test('lee pocos bytes, no el archivo entero', () => {
    const buf = armarMp3({ segundos: 120 })
    const lector = lectorDeBuffer(buf)
    let leidos = 0
    leerMp3({ bytes: lector.bytes, leer: (p, l) => { const b = lector.leer(p, l); leidos += b.length; return b } })
    assert.ok(leidos < 8 * 1024, `leyó ${leidos} bytes de ${buf.length}`)
  })
})

describe('el esquema del manifiesto (compartido/esquemas/audioguias.js)', () => {
  const valida = (datos, opciones) => validarManifiesto(datos, opciones)
  const problemas = (datos, opciones) => {
    const r = valida(datos, opciones)
    assert.equal(r.ok, false, 'tenía que no pasar')
    return r.problemas.join('\n')
  }

  test('el vocabulario: los 11 espacios del plano con pistas y Recepción; q, pista, la Confitería, la Tienda y el Microcine no', () => {
    assert.equal(ESPACIOS_DE_LA_AUDIOGUIA.length, 12)
    assert.ok(ESPACIOS_DE_LA_AUDIOGUIA.includes('recepcion'))
    for (const id of ['q', 'pista', 'confiteria', 'tienda', 'microcine']) assert.ok(!ESPACIOS_DE_LA_AUDIOGUIA.includes(id), id)
    const delPlano = SALAS_DEL_PLANO.map((s) => s.id)
    assert.ok(!delPlano.includes('recepcion'), 'recepcion no es un id del plano')
    for (const id of ESPACIOS_DE_LA_AUDIOGUIA) assert.ok(delPlano.includes(id) || id in ESPACIOS_FUERA_DEL_PLANO, id)
    assert.deepEqual(Object.keys(NOMBRES_DEL_PLANO).sort(), ESPACIOS_DE_LA_AUDIOGUIA.filter((id) => id !== 'recepcion').sort())
  })

  test('Recepción al principio y al final pasa, también con los nombres del plano', () => {
    assert.equal(valida(RECORRIDO).ok, true)
    assert.equal(valida(RECORRIDO, { nombresDelPlano: NOMBRES_DEL_PLANO }).ok, true)
    const solo = { version: 1, recorrido: [RECORRIDO.recorrido[1]] }
    assert.equal(valida(solo).ok, true, 'sin Recepción también')
  })

  test('Recepción tres veces o en el medio, un espacio repetido, la Tienda o un id inventado: no pasan', () => {
    const tres = copia()
    tres.recorrido.splice(2, 0, { ...structuredClone(RECORRIDO.recorrido[0]), estaciones: [{ numero: 2, titulo: 'x' }] })
    tres.recorrido[1].estaciones[0].numero = 2
    tres.recorrido[2].estaciones[0].numero = 3
    tres.recorrido[3].estaciones[0].numero = 4
    tres.recorrido[4].estaciones[0].numero = 5
    assert.match(problemas(tres), /Recepción va solo al principio o al final/)

    const enElMedio = copia()
    enElMedio.recorrido.pop()
    enElMedio.recorrido.splice(1, 0, { espacio: 'recepcion', nombre: 'Recepción', nombreGuion: 'RECEPCIÓN', estaciones: [{ numero: 2, titulo: 'x' }] })
    enElMedio.recorrido[2].estaciones[0].numero = 3
    enElMedio.recorrido[3].estaciones[0].numero = 4
    assert.match(problemas(enElMedio), /recorrido\.1\.espacio: Recepción va solo al principio o al final/)

    const repetido = copia()
    repetido.recorrido[2] = { ...repetido.recorrido[1], estaciones: [{ numero: 3, titulo: 'x' }] }
    assert.match(problemas(repetido), /sala-1 está dos veces: solo Recepción se repite/)

    const tienda = copia()
    tienda.recorrido[1].espacio = 'tienda'
    assert.match(problemas(tienda), /tienda no lleva pistas/)
    for (const id of ['q', 'pista', 'Sala-1', 'sala-9']) {
      const otro = copia()
      otro.recorrido[1].espacio = id
      assert.match(problemas(otro), /no es un espacio de la audioguía/, id)
    }
  })

  test('los números: repetidos o para atrás no pasan; de 1 a 99', () => {
    const repetido = copia()
    repetido.recorrido[2].estaciones[0].numero = 2
    assert.match(problemas(repetido), /La estación 2 va después de la 2/)
    const atras = copia()
    atras.recorrido[1].estaciones = [{ numero: 3, titulo: 'a' }, { numero: 2, titulo: 'b' }]
    atras.recorrido[2].estaciones[0].numero = 4
    atras.recorrido[3].estaciones[0].numero = 5
    assert.match(problemas(atras), /La estación 2 va después de la 3/)
    const cien = copia()
    cien.recorrido[3].estaciones[0].numero = 100
    assert.match(problemas(cien), /de 1 a 99/)
    const decimal = copia()
    decimal.recorrido[3].estaciones[0].numero = 4.5
    assert.match(problemas(decimal), /entero/)
  })

  test('el nombre: el del plano (si se dan los nombres) y «Recepción» siempre', () => {
    const otro = copia()
    otro.recorrido[1].nombre = 'Sala Uno'
    assert.equal(valida(otro).ok, true, 'sin los nombres del plano no se compara')
    assert.match(problemas(otro, { nombresDelPlano: NOMBRES_DEL_PLANO }), /El nombre de sala-1 es «Sala 1», como en el plano/)
    const recepcion = copia()
    recepcion.recorrido[0].nombre = 'RECEPCIÓN'
    assert.match(problemas(recepcion), /El nombre de recepcion es «Recepción»/)
  })

  test('los campos: obligatorios, sin claves de más, kbps solo 80, tituloProvisorio solo true, la voz y los largos', () => {
    const casos = [
      [(m) => { delete m.recorrido[1].nombreGuion }, /rótulo del espacio en el guion/],
      [(m) => { m.recorrido[1].estaciones[0].kpbs = 80 }, /kpbs/],
      [(m) => { m.recorrido[1].estaciones[0].kbps = 64 }, /kbps solo puede ser 80/],
      [(m) => { m.recorrido[1].estaciones[0].kbpsAd = 96 }, /kbps solo puede ser 80/],
      [(m) => { m.recorrido[2].estaciones[0].tituloProvisorio = false }, /tituloProvisorio solo puede ser true/],
      [(m) => { m.recorrido[1].estaciones[0].voz = '<la del guion>' }, /masculina o femenina/],
      [(m) => { m.recorrido[1].estaciones[0].titulo = '' }, /Falta el título de la estación/],
      [(m) => { m.recorrido[1].estaciones[0].titulo = ' Empecemos' }, /sin espacios en las puntas/],
      [(m) => { m.recorrido[1].estaciones[0].titulo = 'x'.repeat(121) }, /como mucho 120/],
      [(m) => { m.recorrido[1].estaciones = [] }, /al menos una estación/],
      [(m) => { m.recorrido = [] }, /al menos un espacio/],
      [(m) => { m.version = 0 }, /de 1 a 999/],
      [(m) => { m.version = '1' }, /entero/],
      [(m) => { m.extra = true }, /extra/],
    ]
    for (const [cambio, mensaje] of casos) {
      const m = copia()
      cambio(m)
      assert.match(problemas(m), mensaje)
    }
    const conTodo = copia()
    Object.assign(conTodo.recorrido[1].estaciones[0], { voz: 'femenina', vozAd: 'masculina', kbps: 80, kbpsAd: 80 })
    assert.equal(valida(conTodo).ok, true)
  })
})

describe('la lectura de la carpeta (pistas.js)', () => {
  test('los párrafos de una transcripción: BOM, CRLF, líneas en blanco con espacios y corchetes', () => {
    assert.deepEqual(parrafosDe('﻿Uno,\r\ndos.\r\n\r\n[Suena una tormenta] Tres.\r\n \t \r\n\r\nCuatro\n\n\n'), [
      'Uno, dos.',
      '[Suena una tormenta] Tres.',
      'Cuatro',
    ])
    assert.deepEqual(parrafosDe('\n\n  \n'), [])
  })

  test('las duraciones, a la vista y para el lector', () => {
    assert.equal(duracionCorta(72), '1:12')
    assert.equal(duracionCorta(30), '0:30')
    assert.equal(duracionCorta(300), '5:00')
    assert.equal(duracionLarga(60), '1 minuto')
    assert.equal(duracionLarga(72), '1 minuto 12 segundos')
    assert.equal(duracionLarga(125), '2 minutos 5 segundos')
    assert.equal(duracionLarga(61), '1 minuto 1 segundo')
    assert.equal(duracionLarga(45), '45 segundos')
  })

  test('el recorrido entero: los grupos con sus anclas, las 8 versiones y las transcripciones (con BOM y CRLF)', () => {
    const archivos = { ...archivosDe(1), ...archivosDe(2), ...archivosDe(3), ...archivosDe(4) }
    archivos['02.txt'] = '﻿Primer párrafo,\r\nque sigue.\r\n\r\n[Suena una tormenta]\r\n'
    const manifiesto = `﻿${JSON.stringify(RECORRIDO, null, 2).replaceAll('\n', '\r\n')}\r\n`
    const { log, lineas } = anotador()
    const dir = carpeta(manifiesto, archivos)
    const r = cargarPistas(dir, { log, nombresDelPlano: NOMBRES_DEL_PLANO })

    assert.deepEqual(lineas, [])
    assert.deepEqual(r.problemas, [])
    assert.equal(r.dir, dir)
    assert.equal(r.version, 1)
    assert.deepEqual(r.grupos.map((g) => [g.espacio, g.ancla, g.alFinal]), [
      ['recepcion', 'espacio-recepcion', false],
      ['sala-1', 'espacio-sala-1', false],
      ['sala-3', 'espacio-sala-3', false],
      ['recepcion', 'espacio-recepcion-fin', true],
    ])
    assert.deepEqual([...r.espacios].sort(), ['recepcion', 'sala-1', 'sala-3'])
    assert.deepEqual(r.grupos[1], {
      espacio: 'sala-1',
      nombre: 'Sala 1',
      nombreGuion: 'SALA 1',
      titulo: 'EL CICLO DE LA VIDA',
      lema: 'Empecemos desde cero',
      ancla: 'espacio-sala-1',
      alFinal: false,
      estaciones: [{ id: '02', numero: 2, titulo: 'Empecemos desde cero', tituloProvisorio: false }],
    })
    assert.equal(r.grupos[0].lema, null)
    assert.deepEqual(r.provisorias, ['03'])

    assert.deepEqual([...r.estaciones.keys()], ['01', '01-ad', '02', '02-ad', '03', '03-ad', '04', '04-ad'])
    assert.deepEqual(r.estaciones.get('02'), {
      numero: 2,
      version: 'comun',
      nombreArchivo: '02.mp3',
      bytes: archivos['02.mp3'].length,
      kbps: 64,
      duracionS: 30,
      duracion: '0:30',
      duracionLarga: '30 segundos',
      parrafos: ['Primer párrafo, que sigue.', '[Suena una tormenta]'],
      espacio: 'sala-1',
    })
    const ad = r.estaciones.get('02-ad')
    assert.equal(ad.version, 'ad')
    assert.equal(ad.nombreArchivo, '02-ad.mp3')
    assert.equal(ad.duracionS, 45)
    assert.notEqual(ad.bytes, r.estaciones.get('02').bytes, '07 y 07-ad son archivos distintos')
    assert.deepEqual(ad.parrafos, ['Estación 2, con audiodescripción.'])
  })

  test('una versión rota saltea la estación entera, con audioguia_pista_invalida y sin títulos en el log', () => {
    const archivos = { ...archivosDe(1), ...archivosDe(2, { ad: { mono: false } }), ...archivosDe(3), ...archivosDe(4) }
    const { log, lineas } = anotador()
    const r = cargarPistas(carpeta(RECORRIDO, archivos), { log })
    assert.deepEqual(lineas, [{ nivel: 'error', evento: 'audioguia_pista_invalida', estacion: '02-ad', motivo: '02-ad.mp3: estéreo: exportá en mono' }])
    assert.deepEqual(r.problemas, ['02-ad: 02-ad.mp3: estéreo: exportá en mono'])
    assert.ok(!r.estaciones.has('02') && !r.estaciones.has('02-ad'), 'ni la común queda')
    assert.deepEqual(r.grupos.map((g) => g.espacio), ['recepcion', 'sala-3', 'recepcion'], 'el grupo sin estaciones se saltea')
    assert.ok(!r.espacios.has('sala-1'))
    assert.equal(r.estaciones.size, 6)
  })

  test('lo que falta o no tiene texto: el MP3, el .txt, una transcripción vacía o demasiado larga', () => {
    const casos = [
      [(a) => { delete a['03.mp3'] }, '03', 'falta 03.mp3'],
      [(a) => { delete a['03-ad.txt'] }, '03-ad', 'falta 03-ad.txt'],
      [(a) => { a['03.txt'] = '﻿\r\n\r\n' }, '03', '03.txt: está vacío'],
      [(a) => { a['03-ad.txt'] = 'x'.repeat(20_001) }, '03-ad', '03-ad.txt: más de 20000 caracteres'],
      [(a) => { a['03.mp3'] = Buffer.concat([Buffer.from('RIFF', 'latin1'), Buffer.alloc(100)]) }, '03', '03.mp3: no es MP3 (empieza con RIFF: es un WAV)'],
    ]
    for (const [cambio, estacion, motivo] of casos) {
      const archivos = { ...archivosDe(1), ...archivosDe(2), ...archivosDe(3), ...archivosDe(4) }
      cambio(archivos)
      const { log, lineas } = anotador()
      const r = cargarPistas(carpeta(RECORRIDO, archivos), { log })
      assert.deepEqual(lineas, [{ nivel: 'error', evento: 'audioguia_pista_invalida', estacion, motivo }], motivo)
      assert.ok(!r.estaciones.has('03') && !r.estaciones.has('03-ad'))
      assert.deepEqual(r.provisorias, [], 'la estación salteada no cuenta como provisoria')
    }
  })

  test('el bitrate declarado: 80 sin declarar no pasa; declarado, sí; declarado a 80 y llega a 64, tampoco', () => {
    const sinDeclarar = { ...archivosDe(1), ...archivosDe(2, { comun: { kbps: 80 } }) }
    const manifiesto = { version: 1, recorrido: [RECORRIDO.recorrido[0], RECORRIDO.recorrido[1]] }
    let anotado = anotador()
    let r = cargarPistas(carpeta(manifiesto, sinDeclarar), { log: anotado.log })
    assert.equal(anotado.lineas[0]?.motivo, '02.mp3: 80 kbps sin declarar (se esperaba 64)')
    assert.ok(!r.estaciones.has('02'))

    const declarado = structuredClone(manifiesto)
    declarado.recorrido[1].estaciones[0].kbps = 80
    anotado = anotador()
    r = cargarPistas(carpeta(declarado, sinDeclarar), { log: anotado.log })
    assert.deepEqual(anotado.lineas, [])
    assert.equal(r.estaciones.get('02').kbps, 80)
    assert.equal(r.estaciones.get('02-ad').kbps, 64, 'kbps vale solo para la común')

    const adDeclarada = structuredClone(manifiesto)
    adDeclarada.recorrido[1].estaciones[0].kbpsAd = 80
    anotado = anotador()
    r = cargarPistas(carpeta(adDeclarada, { ...archivosDe(1), ...archivosDe(2) }), { log: anotado.log })
    assert.deepEqual(anotado.lineas.map((l) => [l.estacion, l.motivo]), [['02-ad', '02-ad.mp3: 64 kbps y la estación declara 80']])
    assert.ok(!r.estaciones.has('02'))
  })

  test('sin manifiesto, con uno que no se lee o que no pasa el esquema, o sin ninguna estación: apagado, con un aviso', () => {
    let anotado = anotador()
    let r = cargarPistas(carpeta(null), { log: anotado.log })
    assert.deepEqual(anotado.lineas, [{ nivel: 'aviso', evento: 'audioguia_sin_pistas', motivo: 'sin manifiesto' }])
    assert.equal(r.version, null)
    assert.equal(r.estaciones.size, 0)
    assert.deepEqual(r.grupos, [])

    anotado = anotador()
    r = cargarPistas(carpeta('{ "version": 1, '), { log: anotado.log })
    assert.equal(anotado.lineas[0].evento, 'audioguia_sin_pistas')
    assert.match(anotado.lineas[0].motivo, /^pistas\.json no se puede leer/)
    assert.equal(r.estaciones.size, 0)

    anotado = anotador()
    const tienda = copia()
    tienda.recorrido[1].espacio = 'tienda'
    r = cargarPistas(carpeta(tienda, archivosDe(2)), { log: anotado.log })
    assert.equal(anotado.lineas[0].motivo, 'manifiesto inválido')
    assert.match(anotado.lineas[0].problemas.join('\n'), /tienda no lleva pistas/)
    assert.equal(r.estaciones.size, 0)

    // El manifiesto solo, sin ningún archivo: las cuatro están sin grabar (sin errores) y no queda ninguna.
    anotado = anotador()
    r = cargarPistas(carpeta(RECORRIDO), { log: anotado.log })
    assert.deepEqual(anotado.lineas, [
      { nivel: 'aviso', evento: 'audioguia_sin_grabar', estaciones: 4 },
      { nivel: 'aviso', evento: 'audioguia_sin_pistas', motivo: 'ninguna estación válida' },
    ])
    assert.equal(r.version, 1)
    assert.equal(r.estaciones.size, 0)
    assert.deepEqual(r.problemas, [])
    assert.deepEqual(r.sinGrabar, ['01', '02', '03', '04'])

    // Con un solo archivo por estación (la transcripción), ya no están sin grabar: falta el MP3, un error por estación.
    anotado = anotador()
    r = cargarPistas(carpeta(RECORRIDO, { '01.txt': 'a', '02.txt': 'b', '03-ad.txt': 'c', '04.txt': 'd' }), { log: anotado.log })
    assert.equal(anotado.lineas.filter((l) => l.evento === 'audioguia_pista_invalida').length, 4)
    assert.deepEqual(anotado.lineas.at(-1), { nivel: 'aviso', evento: 'audioguia_sin_pistas', motivo: 'ninguna estación válida' })
    assert.equal(r.estaciones.size, 0)
    assert.equal(r.problemas.length, 4)
    assert.deepEqual(r.sinGrabar, [])
  })

  test('sin grabar (24/11/2026): una estación sin ninguno de sus cuatro archivos se saltea sin error, con un solo aviso', () => {
    // La 02 y la 04 sin ningún archivo; la 01 y la 03, enteras; la 03-ad sin su .txt sería un error (abajo).
    const archivos = { ...archivosDe(1), ...archivosDe(3) }
    const { log, lineas } = anotador()
    const r = cargarPistas(carpeta(RECORRIDO, archivos), { log })
    assert.deepEqual(lineas, [{ nivel: 'aviso', evento: 'audioguia_sin_grabar', estaciones: 2 }])
    assert.deepEqual(r.sinGrabar, ['02', '04'])
    assert.deepEqual(r.problemas, [])
    assert.deepEqual([...r.estaciones.keys()].sort(), ['01', '01-ad', '03', '03-ad'])
    // El grupo que se queda sin estaciones (la Sala 1, la segunda Recepción) no va: ni su h2 ni su QR.
    assert.deepEqual(r.grupos.map((g) => g.ancla), ['espacio-recepcion', 'espacio-sala-3'])
    assert.deepEqual(r.provisorias, ['03'])
    // Uno solo de los cuatro (el 02-ad.mp3) ya es una estación a medias: un error, no un aviso.
    const aMedias = { ...archivos, '02-ad.mp3': armarMp3({ segundos: 45 }) }
    const otro = anotador()
    const r2 = cargarPistas(carpeta(RECORRIDO, aMedias), { log: otro.log })
    assert.deepEqual(otro.lineas, [
      { nivel: 'error', evento: 'audioguia_pista_invalida', estacion: '02', motivo: 'falta 02.mp3' },
      { nivel: 'aviso', evento: 'audioguia_sin_grabar', estaciones: 1 },
    ])
    assert.deepEqual(r2.sinGrabar, ['04'])
    // hayGrabaciones: algún MP3 en la carpeta (el aviso de server/app.js sin la clave), no el manifiesto solo.
    assert.equal(hayGrabaciones(carpeta(RECORRIDO)), false)
    assert.equal(hayGrabaciones(carpeta(RECORRIDO, { '01.txt': 'a' })), false)
    assert.equal(hayGrabaciones(carpeta(RECORRIDO, { '07.MP3': armarMp3() })), true)
    assert.equal(hayGrabaciones(join(tmpdir(), 'mupa-audioguia-no-existe-')), false)
    assert.deepEqual(archivosDeLaEstacion(7), ['07.mp3', '07.txt', '07-ad.mp3', '07-ad.txt'])
  })
})

// ——— La revisión adversarial del 20/11/2026 ———
// Lo que la primera versión dejaba pasar: un MP3 cortado a la mitad de un cuadro (o más allá de los 20 s), uno con
// algo pegado atrás, un VBR sin encabezado Xing, un WAV de verdad (que pesa más de 3 MB y decía solo eso), el relleno
// de los cuadros de un CBR real (208 y 209 bytes alternados), un id heredado de Object en el manifiesto y la cookie de
// día armada con dos lecturas del reloj justo a la medianoche.

/** Un CBR como los de LAME a 64 kbps y 44,1 kHz: cuadros de 209 bytes (con relleno) y, cada tanto, uno de 208. */
function armarMp3ConRelleno(cuadros) {
  const partes = []
  for (let i = 0; i < cuadros; i++) {
    const relleno = i % 50 === 49 ? 0 : 1
    const buf = Buffer.alloc(208 + relleno)
    cabecera({ relleno }).copy(buf, 0)
    partes.push(buf)
  }
  return Buffer.concat(partes)
}

describe('la revisión adversarial', () => {
  test('mp3: un CBR con relleno (208 y 209 bytes) pasa, con su duración, también con ID3 y TAG', () => {
    const buf = armarMp3ConRelleno(1200)
    const esperado = Math.round((buf.length * 8) / 64_000)
    assert.deepEqual(leer(buf), { duracionS: esperado, kbps: 64, hz: 44_100, canales: 1 })
    const conTodo = Buffer.concat([armarId3(Buffer.alloc(500)), buf, Buffer.concat([Buffer.from('TAG', 'latin1'), Buffer.alloc(125)])])
    assert.equal(leer(conTodo).duracionS, esperado)
  })

  test('mp3: cortado a la mitad de un cuadro, o del archivo, no pasa; cortado justo entre dos cuadros no se puede ver', () => {
    const buf = armarMp3({ segundos: 60 })
    assert.throws(() => leer(buf.subarray(0, buf.length - 100)), /está cortado o no es CBR/)
    assert.throws(() => leer(buf.subarray(0, Math.floor(buf.length * 0.6) + 37)), /está cortado o no es CBR/)
    const conRelleno = armarMp3ConRelleno(1200)
    assert.throws(() => leer(conRelleno.subarray(0, conRelleno.length - 1)), /está cortado o no es CBR/)
    assert.throws(() => leer(Buffer.concat([buf.subarray(0, buf.length - 50), Buffer.concat([Buffer.from('TAG', 'latin1'), Buffer.alloc(125)])])), /está cortado/)
    // Entre dos cuadros es un MP3 entero más corto: lo atajan la escucha y la duración.
    assert.equal(leer(buf.subarray(0, 208 * 1000)).duracionS, Math.round((208 * 1000 * 8) / 64_000))
  })

  test('mp3: algo pegado atrás, o un VBR sin encabezado Xing, no pasan', () => {
    assert.throws(() => leer(Buffer.concat([armarMp3({ segundos: 30 }), Buffer.alloc(5000, 0x41)])), /no termina donde termina el archivo/)
    const vbr = Buffer.concat([armarMp3({ cuadros: 2 }), armarMp3({ segundos: 30, kbps: 128 })])
    assert.throws(() => leer(vbr), /no es CBR/)
  })

  test('mp3: un WAV de más de 3 MB dice que es un WAV, sin leerlo entero', () => {
    const wav = Buffer.concat([Buffer.from('RIFF\0\0\0\0WAVEfmt ', 'latin1'), Buffer.alloc(16)])
    const lector = { bytes: 6_600_000, leer: (p, l) => wav.subarray(p, p + l) }
    assert.throws(() => leerMp3(lector), /no es MP3 \(empieza con RIFF: es un WAV\)/)
  })

  test('mp3: sigue leyendo pocos bytes (el principio y los últimos tres cuadros)', () => {
    const buf = armarMp3ConRelleno(4000)
    const lector = lectorDeBuffer(buf)
    let leidos = 0
    leerMp3({ bytes: lector.bytes, leer: (p, l) => { const b = lector.leer(p, l); leidos += b.length; return b } })
    assert.ok(leidos < 8 * 1024, `leyó ${leidos} bytes de ${buf.length}`)
  })

  test('el esquema: un id heredado de Object no trae un nombre (constructor, __proto__, toString)', () => {
    for (const id of ['constructor', 'toString', 'hasOwnProperty']) {
      const m = copia()
      m.recorrido[1].espacio = id
      const r = validarManifiesto(m, { nombresDelPlano: NOMBRES_DEL_PLANO })
      assert.equal(r.ok, false)
      assert.deepEqual(r.problemas, [`recorrido.1.espacio: ${id} no es un espacio de la audioguía.`], id)
    }
  })

  test('permisoDeDia: el token y el Max-Age salen del mismo instante, también justo a la medianoche', () => {
    const en = (fecha) => permisoDeDia({ urlPublica: HTTPS, claves, version: 1, reloj: relojEn(fecha) })
    const casi = en(CASI_MEDIANOCHE)
    assert.equal(casi.token, tokenDeDia(claves, 1, '2026-11-20'))
    assert.equal(casi.cookie, `__Secure-mupa_audioguia=${casi.token}; Path=/audioguia; Max-Age=1; HttpOnly; Secure; SameSite=Lax`)
    const ya = en(MEDIANOCHE)
    assert.equal(ya.token, tokenDeDia(claves, 1, '2026-11-21'))
    assert.match(ya.cookie, /; Max-Age=86400;/)
    // Un reloj que cruza la medianoche entre una lectura y la otra: se lee una sola vez.
    const lecturas = [CASI_MEDIANOCHE, MEDIANOCHE]
    let n = 0
    const cruza = permisoDeDia({ urlPublica: HTTP, claves, version: 1, reloj: () => lecturas[n++] })
    assert.equal(n, 1, 'una sola lectura del reloj')
    assert.equal(cruza.token, tokenDeDia(claves, 1, '2026-11-20'))
    assert.match(cruza.cookie, /; Max-Age=1;/)
    // Y la cookie que da vale en la página en ese mismo instante.
    const cabeceraCookie = casi.cookie.split(';')[0]
    assert.deepEqual(accesoDeLaPagina({ cabeceraCookie, urlPublica: HTTPS, claves, version: 1, reloj: relojEn(CASI_MEDIANOCHE) }), { acceso: true })
  })

  test('cookieDeDia con ahora: manda sobre el reloj', () => {
    const cookie = cookieDeDia({ urlPublica: HTTP, token: 't', reloj: () => assert.fail('no tenía que leer el reloj'), ahora: MEDIODIA })
    assert.match(cookie, /; Max-Age=43200;/)
  })
})

describe('la revisión adversarial: lo que llega como arreglo', () => {
  // Express arma un arreglo con ?x=a&x=b; uno de un solo elemento, convertido a texto, sería el valor bueno.
  test('un código de QR o un token de día dentro de un arreglo de uno no valen', () => {
    const codigo = codigoDeQr(claves, 'sala-2', 1)
    assert.deepEqual(leerCodigoDeQr(claves, [codigo], { version: 1, espacios: ['sala-2'] }), { ok: false, motivo: 'forma' })
    const token = tokenDeDia(claves, 1, '2026-11-20')
    assert.deepEqual(leerTokenDeDia(claves, [token], { version: 1, hoy: '2026-11-20' }), { ok: false, motivo: 'forma' })
  })

  test('motivo, r y v dentro de un arreglo de uno no cuentan', () => {
    const base = { urlPublica: HTTPS, claves, version: 1, reloj: relojEn(MEDIODIA) }
    assert.equal(accesoDeLaPagina({ ...base, consulta: { motivo: ['codigo'] } }).motivo, 'sin-codigo')
    assert.equal(accesoDeLaPagina({ ...base, consulta: { r: ['1'] } }).motivo, 'sin-codigo')
    assert.deepEqual(versionDeLaPagina({ consulta: { v: ['ad'] } }), { version: 'comun', guardar: null })
    assert.equal(destinoDelQr('sala-1', { v: ['ad'] }), '/audioguia/sala-1?r=1#espacio-sala-1')
  })
})

describe('los ids del plano (compartido/esquemas/audioguias.js)', () => {
  // El esquema no importa src/components/mapaSalas.js (compartido/ no depende de src/): los ids van escritos ahí y esta
  // prueba los ata a los del plano, en el mismo orden.
  test('IDS_DEL_PLANO son los de SALAS_DEL_PLANO, en el mismo orden', () => {
    assert.deepEqual([...IDS_DEL_PLANO], SALAS_DEL_PLANO.map((s) => s.id))
  })
})

// ——— El servidor (especificación de las audioguías, 2.2, 3 y 4; 9.1): la app entera sin base, sobre un build falso ———

const CLAVE_SERVIDOR = 'clave-de-prueba-del-servidor-de-la-audioguia_42'
const clavesServidor = crearClaves(CLAVE_SERVIDOR)
const URL_HTTPS = 'https://mupa-web.onrender.com/'
const URL_HTTP = 'http://127.0.0.1:5183/'
const MANANA = new Date('2026-11-21T15:00:00Z')
const DIA = '2026-11-20'

/** Un build falso (como el de ayudas.js): la plantilla con sus marcas y un render que dibuja solo el nombre de la página. */
function buildFalsoDeLaAudioguia() {
  const dir = mkdtempSync(join(tmpdir(), 'mupa-audioguia-build-'))
  carpetas.push(dir)
  mkdirSync(join(dir, 'client', 'assets'), { recursive: true })
  mkdirSync(join(dir, 'server'))
  mkdirSync(join(dir, 'panel', 'assets'), { recursive: true })
  writeFileSync(
    join(dir, 'client', 'index.html'),
    '<!doctype html><html lang="es"><head><!--head--></head><body><div id="root"><!--app--></div><!--estado--></body></html>\n',
  )
  writeFileSync(join(dir, 'client', 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>\n')
  writeFileSync(join(dir, 'panel', 'index.html'), '<!doctype html><title>Panel</title>\n')
  writeFileSync(
    join(dir, 'server', 'entry-server.js'),
    "export function render(estado) { return '<main data-pagina=\"' + estado.pagina + '\"></main>' }\n",
  )
  return dir
}
const DIR_BUILD_AUDIOGUIA = buildFalsoDeLaAudioguia()

/** La carpeta de la audioguía del servidor: el recorrido de arriba sin la estación provisoria, con sus 8 MP3. */
const RECORRIDO_DEL_SERVIDOR = (() => {
  const r = structuredClone(RECORRIDO)
  delete r.recorrido[2].estaciones[0].tituloProvisorio
  return r
})()
const ARCHIVOS_DEL_SERVIDOR = {
  ...archivosDe(1),
  ...archivosDe(2),
  ...archivosDe(3),
  ...archivosDe(4),
  '02.txt': 'Primer párrafo de la estación 2.\n\n[Suena una tormenta]\n',
}
const DIR_AUDIOGUIA = carpeta(RECORRIDO_DEL_SERVIDOR, ARCHIVOS_DEL_SERVIDOR)
const tamano = (ad = false) => armarMp3({ segundos: ad ? 45 : 30 }).length

/**
 * La app entera (crearApp), sin base, en un puerto libre. reloj: un objeto con la hora (las pruebas la mueven).
 * @param {Record<string, string | undefined>} [env]  undefined saca la variable
 * @param {{ ahora: Date }} [reloj]
 */
async function levantarAudioguia(env = {}, reloj = { ahora: MEDIODIA }) {
  const variables = {
    NODE_ENV: 'production',
    URL_PUBLICA: URL_HTTPS,
    SIN_BASE: 'maximo',
    DIR_BUILD: DIR_BUILD_AUDIOGUIA,
    TRUST_PROXY: '1',
    AUDIOGUIA_CLAVE: CLAVE_SERVIDOR,
    DIR_AUDIOGUIAS: DIR_AUDIOGUIA,
    ...env,
  }
  const config = leerConfig(Object.fromEntries(Object.entries(variables).filter(([, v]) => v !== undefined)))
  const build = await cargarBuild(config.DIR_BUILD)
  const ssr = crearSsr({ config, obtener: build.obtener, museoPublico: crearMuseoPublico(config), reloj: () => reloj.ahora })
  const app = crearApp({ config, ssr, estaticos: estaticosDelBuild(config.DIR_BUILD), fechaHome: build.fecha })
  return escuchar(app, config)
}

/** Escucha una app en un puerto libre de 127.0.0.1 y devuelve pedir() con el host de la app. */
async function escuchar(app, config) {
  const servidor = app.listen(0, '127.0.0.1')
  await new Promise((r) => servidor.once('listening', r))
  const puerto = servidor.address().port
  return {
    pedir: (metodo, ruta, o = {}) => pedir(puerto, metodo, ruta, { host: config.hostPublico, ...o }),
    cerrar: () => new Promise((r) => servidor.close(r)),
  }
}

/**
 * Solo el router de la audioguía, con otro límite si se pide, con las páginas del sitio y el manejador de errores
 * detrás, como en server/app.js. La página la prende sola (existePagina('audioguia'): desde el 24/11/2026 está en
 * src/tablaDePaginas.js); conPagina: false prueba el router sin ella.
 */
async function levantarRouter({ limitePistas, reloj = { ahora: MEDIODIA }, log, urlPublica = URL_HTTPS, conPagina, obtener } = {}) {
  const config = leerConfig({
    NODE_ENV: 'production',
    URL_PUBLICA: urlPublica,
    SIN_BASE: 'maximo',
    DIR_BUILD: DIR_BUILD_AUDIOGUIA,
    AUDIOGUIA_CLAVE: CLAVE_SERVIDOR,
    DIR_AUDIOGUIAS: DIR_AUDIOGUIA,
  })
  const build = await cargarBuild(config.DIR_BUILD)
  const ssr = crearSsr({ config, obtener: obtener ?? build.obtener, museoPublico: crearMuseoPublico(config), reloj: () => reloj.ahora })
  const audioguia = cargarPistas(config.dirAudioguias, { log: () => {} })
  const app = express()
  app.set('trust proxy', 1)
  app.use(
    crearRutasDeAudioguia({ config, ssr, audioguia, limitePistas, ...(log ? { log } : {}), ...(conPagina === undefined ? {} : { conPagina }) }),
  )
  app.use(crearRutasPublicas({ ssr }))
  app.use(manejadorDeErrores())
  return escuchar(app, config)
}

const codigoDe = (espacio, version = 1, k = clavesServidor) => codigoDeQr(k, espacio, version)
const tokenDe = (dia = DIA, version = 1, k = clavesServidor) => tokenDeDia(k, version, dia)
const cookieDiaHttps = (token = tokenDe()) => `__Secure-mupa_audioguia=${token}`
/** El estado de una página dibujada (el JSON de #estado). */
const estadoDe = (html) => JSON.parse(/<script id="estado" type="application\/json">(.*?)<\/script>/s.exec(html)[1])
const escaparRegExp = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('el servidor: el QR (GET /audioguia/q/:codigo)', () => {
  let s
  const reloj = { ahora: MEDIODIA }
  test('arranca', async () => {
    s = await levantarAudioguia({}, reloj)
  })
  after(() => s?.cerrar())

  test('válido: 303 con no-store, la cookie de día exacta y el Location sin el código', async () => {
    const r = await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
    assert.equal(r.status, 303)
    assert.equal(r.h.location, '/audioguia/sala-1?r=1#espacio-sala-1')
    assert.equal(r.h['cache-control'], 'no-store')
    assert.equal(r.h['x-robots-tag'], 'noindex, nofollow')
    assert.equal(r.h['referrer-policy'], 'no-referrer')
    assert.deepEqual(r.h['set-cookie'], [
      `__Secure-mupa_audioguia=${tokenDe()}; Path=/audioguia; Max-Age=${12 * 3600}; HttpOnly; Secure; SameSite=Lax`,
    ])
    assert.doesNotMatch(r.h['set-cookie'][0], /Domain|Expires/i)
  })

  test('con ?v=ad: &v=ad en el Location; Recepción, sin fragmento; v=comun, otro o repetido, nada', async () => {
    const ad = await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}?v=ad`)
    assert.equal(ad.h.location, '/audioguia/sala-1?r=1&v=ad#espacio-sala-1')
    assert.equal((await s.pedir('GET', `/audioguia/q/${codigoDe('recepcion')}`)).h.location, '/audioguia/recepcion?r=1')
    assert.equal((await s.pedir('GET', `/audioguia/q/${codigoDe('recepcion')}?v=ad`)).h.location, '/audioguia/recepcion?r=1&v=ad')
    for (const v of ['v=comun', 'v=otra', 'v=AD', 'v=ad&v=ad']) {
      const r = await s.pedir('GET', `/audioguia/q/${codigoDe('sala-3')}?${v}`)
      assert.equal(r.h.location, '/audioguia/sala-3?r=1#espacio-sala-3', v)
    }
  })

  test('HEAD también da 303 con la cookie', async () => {
    const r = await s.pedir('HEAD', `/audioguia/q/${codigoDe('sala-1')}`)
    assert.equal(r.status, 303)
    assert.equal(r.h['set-cookie'].length, 1)
  })

  test('la cookie vence a la medianoche de San Juan, con el reloj del servidor', async () => {
    reloj.ahora = CASI_MEDIANOCHE
    try {
      const antes = await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
      assert.match(antes.h['set-cookie'][0], new RegExp(`^__Secure-mupa_audioguia=${escaparRegExp(tokenDe('2026-11-20'))}; Path=/audioguia; Max-Age=1;`))
      reloj.ahora = MEDIANOCHE
      const despues = await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
      assert.match(despues.h['set-cookie'][0], new RegExp(`^__Secure-mupa_audioguia=${escaparRegExp(tokenDe('2026-11-21'))}; Path=/audioguia; Max-Age=86400;`))
    } finally {
      reloj.ahora = MEDIODIA
    }
  })

  test('inválido (forma, firma, otra versión, otra clave, un espacio fuera del recorrido, mal codificado): 303 a ?motivo=codigo, sin cookie', async () => {
    const bueno = codigoDe('sala-1')
    const malos = [
      'basura',
      'recepcion.1.AAAAAAAAAAAAAAAAAAAAAA',
      bueno.slice(0, -1) + (bueno.endsWith('A') ? 'B' : 'A'),
      codigoDe('sala-1', 2),
      codigoDe('sala-1', 1, crearClaves(OTRA_CLAVE)),
      codigoDe('sala-5'),
      codigoDe('tienda'),
      '%zz',
      `${bueno}%00`,
      bueno.replace('sala-1', 'SALA-1'),
      'a'.repeat(200),
    ]
    for (const malo of malos) {
      for (const consulta of ['', '?v=ad']) {
        const r = await s.pedir('GET', `/audioguia/q/${malo}${consulta}`)
        assert.equal(r.status, 303, malo)
        assert.equal(r.h.location, '/audioguia?motivo=codigo', malo)
        assert.equal(r.h['cache-control'], 'no-store', malo)
        assert.equal(r.h['set-cookie'], undefined, malo)
        assert.equal(r.h['referrer-policy'], 'no-referrer', malo)
        assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', malo)
      }
    }
  })

  test('distingue mayúsculas: /Audioguia, /audioguia/q y /audioguia/pista sin nada después son la 404 del sitio', async () => {
    for (const ruta of ['/Audioguia', '/Audioguia/sala-1', '/audioguia/q', '/audioguia/pista']) {
      const r = await s.pedir('GET', ruta)
      assert.equal(r.status, 404, ruta)
      assert.equal(r.h['set-cookie'], undefined, ruta)
      assert.match(r.texto, /data-pagina="no-encontrada"/, ruta)
    }
  })

  // AG-SEG-02, AG-SEG-03 y AG-COD-03 de la verificación del servidor: una ruta con un secreto en una forma que no es la
  // exacta no llega al 301 de las barras (con el código o el token en el Location y sin no-store) ni a la 404 del sitio
  // (que GA4 mide con el código en page_location): el QR responde el 303 de un código que no vale, el audio un 404 en
  // texto, los dos con no-store y las cabeceras de la audioguía, y nunca con el código ni el token en el cuerpo.
  test('las formas raras de las rutas con un secreto: el QR, 303 de código inválido; el audio, 404 en texto', async () => {
    const codigo = codigoDe('sala-1')
    const t = tokenDe()
    const qrs = [
      `/Audioguia/q/${codigo}`,
      `/audioguia/Q/${codigo}`,
      `/AUDIOGUIA/Q/${codigo}?v=ad`,
      `/audioguia/q/${codigo}/`,
      `/audioguia/q/${codigo}/?v=ad`,
      `//audioguia/q/${codigo}`,
      `/audioguia//q/${codigo}`,
      `/audioguia/q//${codigo}`,
      `/audioguia\\q\\${codigo}`,
      `/audioguia/q/${codigo}/algo`,
      `/audioguia/%71/${codigo}`,
      `http://evil.com//audioguia/q/${codigo}`,
    ]
    for (const ruta of qrs) {
      for (const metodo of ['GET', 'HEAD']) {
        const r = await s.pedir(metodo, ruta)
        assert.equal(r.status, 303, `${metodo} ${ruta}`)
        assert.equal(r.h.location, '/audioguia?motivo=codigo', ruta)
        assert.equal(r.h['cache-control'], 'no-store', ruta)
        assert.equal(r.h['set-cookie'], undefined, ruta)
        assert.equal(r.h['referrer-policy'], 'no-referrer', ruta)
        assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', ruta)
        assert.ok(!r.texto.includes(codigo.split('.')[2]) && !r.texto.includes('"medir":true'), ruta)
      }
    }
    const audios = [
      `/audioguia/pista/02/?t=${t}`,
      `/audioguia/pista//02?t=${t}`,
      `/audioguia//pista/02?t=${t}`,
      `/AUDIOGUIA/pista/02?t=${t}`,
      `/audioguia/Pista/02?t=${t}`,
      `/audioguia/pista/02/algo?t=${t}`,
      `/audioguia\\pista\\02?t=${t}`,
      `http://evil.com//audioguia/pista/02?t=${t}`,
    ]
    for (const ruta of audios) {
      for (const metodo of ['GET', 'HEAD']) {
        const r = await s.pedir(metodo, ruta)
        assert.equal(r.status, 404, `${metodo} ${ruta}`)
        assert.equal(r.h['cache-control'], 'no-store', ruta)
        assert.equal(r.h.location, undefined, ruta)
        assert.match(r.h['content-type'], /^text\/plain/, ruta)
        assert.equal(r.h['referrer-policy'], 'no-referrer', ruta)
        assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', ruta)
        assert.ok(!r.texto.includes(t.split('.')[2]), ruta)
      }
    }
    // La forma exacta sigue andando, también un audio mal codificado (el 404 en texto del router: AG-COD-04).
    assert.equal((await s.pedir('GET', `/audioguia/q/${codigo}`)).status, 303)
    assert.equal((await s.pedir('GET', `/audioguia/pista/02?t=${t}`)).status, 200)
    const malCodificado = await s.pedir('GET', `/audioguia/pista/%zz?t=${t}`)
    assert.equal(malCodificado.status, 404)
    assert.equal(malCodificado.h['cache-control'], 'no-store')
    assert.equal(malCodificado.h['x-robots-tag'], 'noindex, nofollow')
    assert.equal(malCodificado.h['referrer-policy'], 'no-referrer')
  })

  test('lo demás de /audioguia que el sitio redirige por las barras: el 301 de siempre, con no-store y las cabeceras de acá', async () => {
    for (const [ruta, destino] of [
      ['/audioguia/', '/audioguia'],
      ['/audioguia/sala-1/?v=ad', '/audioguia/sala-1?v=ad'],
      ['//audioguia/sala-1', '/audioguia/sala-1'],
    ]) {
      const r = await s.pedir('GET', ruta)
      assert.equal(r.status, 301, ruta)
      assert.equal(r.h.location, destino, ruta)
      assert.equal(r.h['cache-control'], 'no-store', ruta)
      assert.equal(r.h['referrer-policy'], 'no-referrer', ruta)
      assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', ruta)
      assert.equal(r.h['set-cookie'], undefined, ruta)
    }
  })

  // Hasta la etapa de la página, en la app entera estas rutas daban la 404 del sitio; desde que la página está en
  // src/tablaDePaginas.js (24/11/2026), la app prendida la sirve: el destino del 303 se abre con la cookie que puso.
  test('la app prendida sirve la página: el destino del 303 se abre con la cookie del QR (y la de preferencia con v=ad)', async () => {
    for (const [espacio, v] of [['sala-1', ''], ['recepcion', '?v=ad']]) {
      const qr = await s.pedir('GET', `/audioguia/q/${codigoDe(espacio)}${v}`)
      assert.equal(qr.status, 303)
      const cookie = qr.h['set-cookie'][0].split(';')[0]
      const r = await s.pedir('GET', qr.h.location.replace(/#.*$/, ''), { cookie })
      assert.equal(r.status, 200, qr.h.location)
      assert.match(r.texto, /data-pagina="audioguia"/)
      assert.equal(estadoDe(r.texto).datos.espacioActual, espacio)
      assert.equal(estadoDe(r.texto).datos.version, v ? 'ad' : 'comun')
      if (v) assert.match(r.h['set-cookie'][0], /^mupa_audioguia_version=ad;/)
      else assert.equal(r.h['set-cookie'], undefined)
    }
  })
})

describe('el servidor: el log del código inválido', () => {
  test('con tope (uno por minuto) y solo con el motivo: nunca el código, la firma, el token ni la clave', async () => {
    const reloj = { ahora: MEDIODIA }
    const s = await levantarAudioguia({}, reloj)
    const logs = escucharLogs()
    try {
      const viejo = codigoDe('sala-1', 2)
      await s.pedir('GET', `/audioguia/q/${viejo}`)
      await s.pedir('GET', '/audioguia/q/basura')
      reloj.ahora = new Date(MEDIODIA.getTime() + 59_000)
      await s.pedir('GET', '/audioguia/q/otra-basura')
      reloj.ahora = new Date(MEDIODIA.getTime() + 60_000)
      await s.pedir('GET', '/audioguia/q/basura')
      await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
      await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`)
      await s.pedir('GET', '/audioguia/pista/02?t=mal')
      const eventos = logs.eventos().filter((e) => e.evento.startsWith('audioguia'))
      assert.deepEqual(eventos.map(({ nivel, evento, motivo }) => ({ nivel, evento, motivo })), [
        { nivel: 'aviso', evento: 'audioguia_codigo_invalido', motivo: 'version' },
        { nivel: 'aviso', evento: 'audioguia_codigo_invalido', motivo: 'forma' },
      ])
      for (const e of eventos) assert.deepEqual(Object.keys(e).sort(), ['evento', 'motivo', 'nivel', 't'])
      const todo = logs.lineas.join('\n')
      for (const secreto of [CLAVE_SERVIDOR, viejo, viejo.split('.')[2], codigoDe('sala-1'), tokenDe(), '198.51.100.1']) {
        assert.ok(!todo.includes(secreto), 'un secreto o la IP en el log')
      }
    } finally {
      logs.detener()
      await s.cerrar()
    }
  })
})

describe('el servidor: el audio (GET y HEAD /audioguia/pista/:estacion)', () => {
  let s
  const reloj = { ahora: MEDIODIA }
  test('arranca', async () => {
    s = await levantarAudioguia({}, reloj)
  })
  after(() => s?.cerrar())
  const pista = (estacion, t = tokenDe(), o) => s.pedir('GET', `/audioguia/pista/${estacion}${t === null ? '' : `?t=${t}`}`, o)

  test('con el token de hoy: el MP3 entero, con sus cabeceras', async () => {
    const r = await pista('02')
    assert.equal(r.status, 200)
    assert.equal(r.h['content-type'], 'audio/mpeg')
    assert.equal(Number(r.h['content-length']), tamano())
    assert.equal(r.h['accept-ranges'], 'bytes')
    assert.equal(r.h['cache-control'], 'private, max-age=3600')
    assert.equal(r.h['cross-origin-resource-policy'], 'same-origin')
    assert.equal(r.h['referrer-policy'], 'no-referrer')
    assert.equal(r.h['x-robots-tag'], 'noindex, nofollow')
    assert.equal(r.h['content-encoding'], undefined)
    assert.equal(r.h['set-cookie'], undefined)
    assert.ok(r.h['last-modified'])
  })

  test('02 y 02-ad son archivos distintos', async () => {
    const ad = await pista('02-ad')
    assert.equal(ad.status, 200)
    assert.equal(Number(ad.h['content-length']), tamano(true))
    assert.notEqual(ad.h['content-length'], (await pista('02')).h['content-length'])
  })

  test('sin t, de ayer, de mañana, de otra versión, de otra clave, dos veces o tocado: 403 en texto con no-store', async () => {
    const malos = [
      null,
      '',
      tokenDe('2026-11-19'),
      tokenDe('2026-11-21'),
      tokenDe(DIA, 2),
      tokenDe(DIA, 1, crearClaves(OTRA_CLAVE)),
      `${tokenDe()}&t=${tokenDe()}`,
      tokenDe().slice(0, -1) + (tokenDe().endsWith('x') ? 'y' : 'x'),
      codigoDe('sala-1'),
    ]
    for (const t of malos) {
      const r = await pista('02', t)
      assert.equal(r.status, 403, String(t))
      assert.equal(r.texto, 'La audioguía se escucha en el museo.')
      assert.equal(r.h['cache-control'], 'no-store')
      assert.match(r.h['content-type'], /^text\/plain/)
      assert.equal(r.h['referrer-policy'], 'no-referrer')
    }
    // La cookie de día no sirve para el audio (A5): solo t.
    assert.equal((await pista('02', null, { cookie: cookieDiaHttps() })).status, 403)
  })

  test('el token de hoy deja de valer a la medianoche', async () => {
    reloj.ahora = MANANA
    try {
      assert.equal((await pista('02')).status, 403)
      assert.equal((await pista('02', tokenDe('2026-11-21'))).status, 200)
    } finally {
      reloj.ahora = MEDIODIA
    }
  })

  test('Range: 206 con Content-Range; fuera del archivo, 416 con el Content-Range de send', async () => {
    const r = await pista('02', tokenDe(), { cabeceras: { range: 'bytes=0-99' } })
    assert.equal(r.status, 206)
    assert.equal(r.h['content-range'], `bytes 0-99/${tamano()}`)
    assert.equal(r.h['content-length'], '100')
    assert.equal(r.h['cache-control'], 'private, max-age=3600')
    const fuera = await pista('02', tokenDe(), { cabeceras: { range: `bytes=${tamano() + 10}-` } })
    assert.equal(fuera.status, 416)
    assert.equal(fuera.h['content-range'], `bytes */${tamano()}`)
    assert.equal(fuera.h['cache-control'], 'no-store')
    // Sin token, el Range no llega a send.
    assert.equal((await pista('02', null, { cabeceras: { range: 'bytes=0-99' } })).status, 403)
  })

  test('HEAD: las mismas cabeceras, sin el cuerpo', async () => {
    const r = await s.pedir('HEAD', `/audioguia/pista/02-ad?t=${tokenDe()}`)
    assert.equal(r.status, 200)
    assert.equal(Number(r.h['content-length']), tamano(true))
    assert.equal(r.texto, '')
    assert.equal((await s.pedir('HEAD', '/audioguia/pista/02-ad')).status, 403)
  })

  test('nombres raros y ../: nunca un archivo (no se arma una ruta con lo que llega), con token y sin él', async () => {
    const raros = ['2', '002', '02-AD', '02-ad.mp3', '02.mp3', '02.txt', '02-xx', '99', '05', '..', '..%2Fpistas.json', '%2e%2e%2fpistas.json', 'pistas.json', '02%00', '02-ad%20', '%zz']
    for (const raro of raros) {
      for (const t of [tokenDe(), null]) {
        const r = await pista(raro, t)
        assert.ok(r.status === 404 || r.status === 400, `${raro}: ${r.status}`)
        assert.ok(!r.h['content-type']?.startsWith('audio/') && !/"recorrido"|Estación 2/.test(r.texto), raro)
        assert.equal(r.h['cache-control'], 'no-store', raro)
      }
    }
    for (const ruta of [`/audioguia/pista/../pistas.json?t=${tokenDe()}`, `/audioguia/pista/02/..%2F..%2Fpistas.json?t=${tokenDe()}`]) {
      const r = await s.pedir('GET', ruta)
      assert.ok(!r.h['content-type']?.startsWith('audio/') && !/"recorrido"/.test(r.texto), ruta)
    }
  })
})

describe('el servidor: un MP3 que desaparece después de arrancar', () => {
  test('404 en texto con no-store y una línea de log con la estación, sin el stack ni la ruta del disco', async () => {
    const dir = carpeta(RECORRIDO_DEL_SERVIDOR, ARCHIVOS_DEL_SERVIDOR)
    const s = await levantarAudioguia({ DIR_AUDIOGUIAS: dir })
    const logs = escucharLogs()
    try {
      rmSync(join(dir, '02-ad.mp3'))
      const r = await s.pedir('GET', `/audioguia/pista/02-ad?t=${tokenDe()}`)
      assert.equal(r.status, 404)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.match(r.h['content-type'], /^text\/plain/)
      const eventos = logs.eventos().filter((e) => e.evento.startsWith('audioguia'))
      assert.deepEqual(eventos.map(({ nivel, evento, estacion }) => ({ nivel, evento, estacion })), [
        { nivel: 'error', evento: 'audioguia_pista_sin_archivo', estacion: '02-ad' },
      ])
      assert.ok(!logs.lineas.join('\n').includes(dir) && !logs.lineas.join('\n').includes('stack'))
      // Las demás siguen.
      assert.equal((await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`)).status, 200)
    } finally {
      logs.detener()
      await s.cerrar()
    }
  })
})

describe('el servidor: el límite del audio', () => {
  test('el tope por defecto es el de la especificación: 3.000 cada 15 minutos', () => {
    assert.equal(LIMITE_PISTAS, 3000)
    assert.equal(VENTANA_PISTAS_MS, 15 * 60_000)
  })

  test('pasado el tope, 429 en texto con no-store y Retry-After, una sola línea de log, y por IP', async () => {
    const lineas = []
    const s = await levantarRouter({ limitePistas: 3, log: (nivel, evento, datos) => lineas.push({ nivel, evento, ...datos }) })
    try {
      const ip = '203.0.113.7'
      for (let i = 0; i < 3; i++) assert.equal((await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`, { ip })).status, 200)
      const r = await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`, { ip })
      assert.equal(r.status, 429)
      assert.match(r.h['content-type'], /^text\/plain/)
      assert.equal(r.h['cache-control'], 'no-store')
      assert.ok(Number(r.h['retry-after']) > 0)
      assert.equal(r.h['referrer-policy'], 'no-referrer')
      assert.equal((await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`, { ip })).status, 429)
      assert.deepEqual(lineas, [{ nivel: 'aviso', evento: 'audioguia_limite' }])
      // Otra IP sigue, y el QR no cuenta para el límite del audio.
      assert.equal((await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`, { ip: '203.0.113.8' })).status, 200)
      assert.equal((await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`, { ip })).status, 303)
    } finally {
      await s.cerrar()
    }
  })

  test('los rechazados (sin t, con un t que no vale o una estación que no existe) no gastan el cupo (AG-SEG-01)', async () => {
    const s = await levantarRouter({ limitePistas: 3, log: () => {} })
    try {
      const ip = '203.0.113.9'
      const rechazados = [
        ['GET', '/audioguia/pista/02', 403],
        ['HEAD', '/audioguia/pista/02', 403],
        ['GET', '/audioguia/pista/02?t=basura', 403],
        ['GET', `/audioguia/pista/02?t=${tokenDe('2026-11-19')}`, 403],
        ['GET', `/audioguia/pista/02?t=${tokenDe(DIA, 2)}`, 403],
        ['GET', `/audioguia/pista/99?t=${tokenDe()}`, 404],
        ['GET', '/audioguia/pista/xx', 404],
      ]
      // Tres veces más que el tope, de la misma IP: ninguno da 429.
      for (let vuelta = 0; vuelta < 3; vuelta++) {
        for (const [metodo, ruta, status] of rechazados) {
          assert.equal((await s.pedir(metodo, ruta, { ip })).status, status, `${metodo} ${ruta}`)
        }
      }
      // El cupo de los que tienen permiso sigue entero: pasan 3 y el cuarto da 429.
      for (let i = 0; i < 3; i++) assert.equal((await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`, { ip })).status, 200)
      assert.equal((await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`, { ip })).status, 429)
      // Pasado el tope, un rechazado sigue siendo un 403.
      assert.equal((await s.pedir('GET', '/audioguia/pista/02', { ip })).status, 403)
    } finally {
      await s.cerrar()
    }
  })

  test('en Render con TRUST_PROXY=0 y la audioguía prendida, un error en el log (audioguia_limite_global)', () => {
    const prendida = { AUDIOGUIA_CLAVE: CLAVE_SERVIDOR, dirAudioguias: DIR_AUDIOGUIA }
    const casos = [
      [{ ...prendida, produccion: true, RENDER: 'true', TRUST_PROXY: 0 }, 1],
      [{ ...prendida, produccion: true, RENDER_EXTERNAL_URL: 'https://mupa-web.onrender.com', TRUST_PROXY: 0 }, 1],
      [{ ...prendida, produccion: true, RENDER: 'true', TRUST_PROXY: 1 }, 0],
      [{ ...prendida, produccion: true, TRUST_PROXY: 0 }, 0],
      [{ ...prendida, produccion: false, RENDER: 'true', TRUST_PROXY: 0 }, 0],
      // Apagada (sin la clave), nada.
      [{ dirAudioguias: DIR_AUDIOGUIA, produccion: true, RENDER: 'true', TRUST_PROXY: 0 }, 0],
    ]
    for (const [config, cuantas] of casos) {
      const logs = escucharLogs()
      try {
        audioguiaDeLaApp(config)
        const lineas = logs.eventos().filter((e) => e.evento === 'audioguia_limite_global')
        assert.equal(lineas.length, cuantas, JSON.stringify({ ...config, AUDIOGUIA_CLAVE: undefined }))
        if (cuantas) assert.equal(lineas[0].nivel, 'error')
      } finally {
        logs.detener()
      }
    }
  })
})

describe('el servidor: la página', () => {
  let s
  test('arranca', async () => {
    s = await levantarRouter()
  })
  after(() => s?.cerrar())

  const sinAcceso = async (ruta, motivo, o) => {
    const r = await s.pedir('GET', ruta, o)
    assert.equal(r.status, 403, ruta)
    assert.equal(r.h['cache-control'], 'private, no-store', ruta)
    assert.match(r.h.vary ?? '', /Cookie/, ruta)
    assert.equal(r.h['set-cookie'], undefined, ruta)
    assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', ruta)
    assert.equal(r.h['referrer-policy'], 'no-referrer', ruta)
    const estado = estadoDe(r.texto)
    assert.equal(estado.pagina, 'audioguia')
    assert.deepEqual(estado.datos, { acceso: false, motivo }, ruta)
    assert.ok(!r.texto.includes('/audioguia/pista/'), `${ruta}: ni una dirección de audio sin acceso`)
    assert.ok(!r.texto.includes('Estación 2'), `${ruta}: ni una transcripción sin acceso`)
    return r
  }

  test('sin permiso: 403 con los cuatro motivos, sin ninguna cookie (tampoco la de preferencia con ?v=ad)', async () => {
    await sinAcceso('/audioguia', 'sin-codigo')
    await sinAcceso('/audioguia?v=ad', 'sin-codigo')
    await sinAcceso('/audioguia?motivo=codigo', 'codigo')
    await sinAcceso('/audioguia/sala-1?r=1&v=ad', 'sin-cookie')
    await sinAcceso('/audioguia/sala-1', 'vencido', { cookie: cookieDiaHttps(tokenDe('2026-11-19')) })
    await sinAcceso('/audioguia/sala-1?v=ad', 'vencido', { cookie: `${cookieDiaHttps('x')}; mupa_audioguia=${tokenDe()}` })
    // El token en la consulta no sirve para la página (A5): solo la cookie.
    await sinAcceso(`/audioguia/sala-1?t=${tokenDe()}`, 'sin-codigo')
  })

  test('el <head>: «Audioguía · MuPa», noindex y sin canonical, Open Graph ni JSON-LD', async () => {
    const r = await sinAcceso('/audioguia', 'sin-codigo')
    assert.match(r.texto, /<title>Audioguía · MuPa<\/title>/)
    assert.match(r.texto, /<meta name="robots" content="noindex, nofollow" \/>/)
    assert.doesNotMatch(r.texto, /rel="canonical"|og:|application\/ld\+json/)
  })

  test('con la cookie del QR: 200 con los datos de la versión común y el espacio actual (5.1)', async () => {
    const qr = await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
    const cookie = qr.h['set-cookie'][0].split(';')[0]
    const r = await s.pedir('GET', '/audioguia/sala-1?r=1', { cookie })
    assert.equal(r.status, 200)
    assert.equal(r.h['cache-control'], 'private, no-store')
    assert.match(r.h.vary ?? '', /Cookie/)
    assert.equal(r.h['set-cookie'], undefined)
    assert.match(r.texto, /<title>Audioguía · MuPa<\/title>/)
    const { datos } = estadoDe(r.texto)
    assert.equal(datos.acceso, true)
    assert.equal(datos.version, 'comun')
    assert.equal(datos.espacioActual, 'sala-1')
    assert.equal(datos.enlaceVersion, '/audioguia/sala-1?v=ad#audioguia-version')
    assert.deepEqual(datos.grupos.map((g) => [g.espacio, g.ancla, g.nombreGuion, g.alFinal, g.actual]), [
      ['recepcion', 'espacio-recepcion', 'RECEPCIÓN', false, false],
      ['sala-1', 'espacio-sala-1', 'SALA 1', false, true],
      ['sala-3', 'espacio-sala-3', 'SALA 3', false, false],
      ['recepcion', 'espacio-recepcion-fin', 'RECEPCIÓN', true, false],
    ])
    assert.deepEqual([datos.grupos[1].titulo, datos.grupos[1].lema], ['EL CICLO DE LA VIDA', 'Empecemos desde cero'])
    const [estacion] = datos.grupos[1].estaciones
    assert.deepEqual(
      { ...estacion, src: estacion.src.replace(/\?t=.*$/, '') },
      {
        id: '02',
        numero: 2,
        titulo: 'Empecemos desde cero',
        duracion: '0:30',
        duracionLarga: '30 segundos',
        src: '/audioguia/pista/02',
        parrafos: ['Primer párrafo de la estación 2.', '[Suena una tormenta]'],
      },
    )
    // El src lleva el token de hoy, y sirve para el audio.
    assert.equal((await s.pedir('GET', estacion.src)).status, 200)
  })

  test('la versión: ?v=ad la elige y la guarda; la cookie de preferencia la recuerda; ?v=basura, la común', async () => {
    const cookie = cookieDiaHttps()
    const ad = await s.pedir('GET', '/audioguia/sala-1?v=ad', { cookie })
    assert.equal(ad.status, 200)
    assert.deepEqual(ad.h['set-cookie'], ['mupa_audioguia_version=ad; Path=/audioguia; Max-Age=15552000; HttpOnly; Secure; SameSite=Lax'])
    const datos = estadoDe(ad.texto).datos
    assert.equal(datos.version, 'ad')
    assert.equal(datos.enlaceVersion, '/audioguia/sala-1?v=comun#audioguia-version')
    const srcs = datos.grupos.flatMap((g) => g.estaciones.map((e) => e.src))
    assert.equal(srcs.length, 4)
    for (const src of srcs) assert.match(src, /^\/audioguia\/pista\/\d{2}-ad\?t=/)
    assert.deepEqual(datos.grupos[1].estaciones[0].parrafos, ['Estación 2, con audiodescripción.'])
    assert.equal(datos.grupos[1].estaciones[0].id, '02', 'el id no cambia con la versión')
    assert.equal(datos.grupos[1].estaciones[0].duracion, '0:45')
    assert.ok(!ad.texto.includes('Primer párrafo de la estación 2'), 'solo viaja la versión elegida')
    assert.match(ad.texto, /<title>Audioguía · MuPa<\/title>/, 'el mismo título en las dos versiones')

    const recordada = await s.pedir('GET', '/audioguia/sala-1', { cookie: `${cookie}; mupa_audioguia_version=ad` })
    assert.equal(estadoDe(recordada.texto).datos.version, 'ad')
    assert.equal(recordada.h['set-cookie'], undefined)
    const basura = await s.pedir('GET', '/audioguia/sala-1?v=basura', { cookie })
    assert.equal(estadoDe(basura.texto).datos.version, 'comun')
    assert.equal(basura.h['set-cookie'], undefined)
    const comun = await s.pedir('GET', '/audioguia/sala-1?v=comun', { cookie: `${cookie}; mupa_audioguia_version=ad` })
    assert.equal(estadoDe(comun.texto).datos.version, 'comun')
    assert.match(comun.h['set-cookie'][0], /^mupa_audioguia_version=comun;/)
  })

  test('sin espacio, ninguno actual; Recepción, solo la primera; un espacio fuera del recorrido, la 404 del sitio', async () => {
    const cookie = cookieDiaHttps()
    const sinEspacio = estadoDe((await s.pedir('GET', '/audioguia', { cookie })).texto).datos
    assert.equal(sinEspacio.espacioActual, null)
    assert.equal(sinEspacio.enlaceVersion, '/audioguia?v=ad#audioguia-version')
    assert.ok(sinEspacio.grupos.every((g) => !g.actual))
    const recepcion = estadoDe((await s.pedir('GET', '/audioguia/recepcion', { cookie })).texto).datos
    assert.deepEqual(recepcion.grupos.map((g) => g.actual), [true, false, false, false])
    for (const ruta of ['/audioguia/sala-5', '/audioguia/tienda', '/audioguia/q', '/audioguia/pista', '/audioguia/Sala-1', '/Audioguia']) {
      const r = await s.pedir('GET', ruta, { cookie })
      assert.equal(r.status, 404, ruta)
      assert.equal(r.h['set-cookie'], undefined, ruta)
    }
  })

  test('la página se prende sola (existePagina); sin ella (conPagina: false), la 404 del sitio, sin cookies', async () => {
    const { existePagina } = await import('../../src/tablaDePaginas.js')
    assert.equal(existePagina('audioguia'), true)
    // La página prendida va atada a la analítica (AG-COD-07): con ella en la tabla, GA4 no recibe ?v= ni el fragmento
    // (especificación de las audioguías, 6). Si alguien la suma a la tabla sin eso, falla acá.
    const { paginaParaGa4, TITULO_AUDIOGUIA } = await import('../../src/analitica.js')
    const lugar = { origin: 'https://mupa.ar', pathname: '/audioguia/sala-2', search: '?v=ad', hash: '#espacio-sala-2' }
    assert.deepEqual(paginaParaGa4({ pagina: 'audioguia' }, lugar), { page_location: 'https://mupa.ar/audioguia/sala-2', page_title: TITULO_AUDIOGUIA })
    assert.equal(TITULO_AUDIOGUIA, 'Audioguía · MuPa')
    const sinPagina = await levantarRouter({ conPagina: false })
    try {
      for (const ruta of ['/audioguia', '/audioguia/sala-1', '/audioguia/sala-1?v=ad']) {
        const r = await sinPagina.pedir('GET', ruta, { cookie: cookieDiaHttps() })
        assert.equal(r.status, 404, ruta)
        assert.match(r.texto, /data-pagina="no-encontrada"/, ruta)
        assert.equal(r.h['set-cookie'], undefined, ruta)
        // Con la página, la misma ruta es la audioguía.
        assert.equal((await s.pedir('GET', ruta, { cookie: cookieDiaHttps() })).status, 200, ruta)
      }
      // El QR válido sin la página: el 303 de siempre, pero sin la cookie de día y no a la página del espacio (que sería
      // una 404 con un permiso: AG-SEG-07). El audio no depende de la página.
      const qr = await sinPagina.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
      assert.equal(qr.status, 303)
      assert.equal(qr.h.location, '/audioguia?motivo=codigo')
      assert.equal(qr.h['cache-control'], 'no-store')
      assert.equal(qr.h['set-cookie'], undefined)
      assert.equal((await sinPagina.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`)).status, 200)
    } finally {
      await sinPagina.cerrar()
    }
  })

  test('con URL_PUBLICA en http (la red local): las cookies sin Secure, y la de día sin __Secure-', async () => {
    const local = await levantarRouter({ urlPublica: URL_HTTP })
    try {
      const qr = await local.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
      assert.deepEqual(qr.h['set-cookie'], [`mupa_audioguia=${tokenDe()}; Path=/audioguia; Max-Age=${12 * 3600}; HttpOnly; SameSite=Lax`])
      const r = await local.pedir('GET', '/audioguia/sala-1?v=ad', { cookie: `mupa_audioguia=${tokenDe()}` })
      assert.equal(r.status, 200)
      assert.deepEqual(r.h['set-cookie'], ['mupa_audioguia_version=ad; Path=/audioguia; Max-Age=15552000; HttpOnly; SameSite=Lax'])
      // La de https tiene otro nombre: en http no vale.
      assert.equal((await local.pedir('GET', '/audioguia/sala-1', { cookie: cookieDiaHttps() })).status, 403)
    } finally {
      await local.cerrar()
    }
  })
})

describe('el servidor: la página con el render de verdad (src/entry-server.jsx, 9.1)', () => {
  // El render de verdad, con el Vite del proyecto (su propia caché, en el temporal del sistema), como ssr.test.js.
  let vite
  let s
  const PLANTILLA =
    '<!doctype html><html lang="es"><head><meta charset="UTF-8" /><!--head--></head>' +
    '<body><div id="root"><!--app--></div><!--estado--></body></html>\n'
  test('arranca', async () => {
    const { createServer } = await import('vite')
    vite = await createServer({
      root: join(import.meta.dirname, '..', '..'),
      configFile: false,
      cacheDir: join(tmpdir(), 'mupa-vite-pruebas-audioguia'),
      logLevel: 'silent',
      appType: 'custom',
      server: { middlewareMode: true, hmr: false, ws: false, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
    })
    const entrada = await vite.ssrLoadModule('/src/entry-server.jsx')
    s = await levantarRouter({ obtener: async () => ({ partes: partir(PLANTILLA), render: entrada.render }) })
  })
  after(async () => {
    await s?.cerrar()
    await vite?.close()
  })
  const cuantas = (html, texto) => html.split(texto).length - 1
  const delMain = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>') + 7)

  test('sin la cookie de día: 403 con el h1, el motivo y el enlace a Visitas, sin ningún <audio>', async () => {
    for (const [ruta, motivo] of [['/audioguia', 'sin-codigo'], ['/audioguia/sala-1?r=1&v=ad', 'sin-cookie'], ['/audioguia?motivo=codigo', 'codigo']]) {
      const r = await s.pedir('GET', ruta)
      assert.equal(r.status, 403, ruta)
      assert.equal(r.h['set-cookie'], undefined, ruta)
      const main = delMain(r.texto)
      assert.match(main, /<h1 class="[^"]*">Audioguía<\/h1>/, ruta)
      assert.ok(main.includes('href="/visitas"'), ruta)
      assert.equal(cuantas(r.texto, '<audio'), 0, ruta)
      assert.equal(cuantas(r.texto, '/audioguia/pista/'), 0, ruta)
      assert.equal(estadoDe(r.texto).datos.motivo, motivo, ruta)
    }
  })

  test('con ?v=ad: el h1 con el guion blando, los src y las transcripciones de -ad, la frase y un solo enlace de versión', async () => {
    const r = await s.pedir('GET', '/audioguia/sala-1?v=ad', { cookie: cookieDiaHttps() })
    assert.equal(r.status, 200)
    assert.match(r.h['set-cookie'][0], /^mupa_audioguia_version=ad; Path=\/audioguia; Max-Age=15552000; HttpOnly; Secure; SameSite=Lax$/)
    assert.match(r.texto, /<title>Audioguía · MuPa<\/title>/)
    const main = delMain(r.texto)
    assert.match(main, /<h1 class="[^"]*">Audioguía con audio­descripción<\/h1>/)
    const bloque = main.slice(main.indexOf('<div id="audioguia-version"'), main.indexOf('</div>', main.indexOf('<div id="audioguia-version"')))
    assert.ok(bloque.includes('>Estás escuchando la versión con audiodescripción.</p>'))
    assert.deepEqual([...bloque.matchAll(/<a href="([^"]*)"/g)].map((m) => m[1]), ['/audioguia/sala-1?v=comun#audioguia-version'])
    assert.equal(cuantas(bloque, 'aria-current'), 0)
    const srcs = [...main.matchAll(/<audio [^>]*src="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))
    assert.equal(srcs.length, 4)
    for (const src of srcs) assert.match(src, /^\/audioguia\/pista\/\d{2}-ad\?t=/)
    assert.ok(main.includes('<p>Estación 2, con audiodescripción.</p>'))
    assert.equal(cuantas(main, 'preload="none"'), 4)
    // El mismo src del HTML trae el audio (el token de hoy).
    assert.equal((await s.pedir('GET', srcs[0])).status, 200)
  })

  test('la común: las anclas de Recepción una vez cada una en los h2, y los corchetes de la transcripción como texto', async () => {
    const r = await s.pedir('GET', '/audioguia/sala-1', { cookie: cookieDiaHttps() })
    assert.equal(r.status, 200)
    const main = delMain(r.texto)
    assert.match(main, /<h1 class="[^"]*">Audioguía<\/h1>/)
    assert.ok(main.includes('>Estás escuchando la versión sin audiodescripción.</p>'))
    assert.equal(cuantas(main, 'id="espacio-recepcion"'), 1)
    assert.equal(cuantas(main, 'id="espacio-recepcion-fin"'), 1)
    assert.match(main, /<h2 id="espacio-recepcion" tabindex="-1"/)
    assert.match(main, /<h2 id="espacio-recepcion-fin" tabindex="-1" [^>]*>RECEPCIÓN, al final del recorrido<\/h2>/)
    assert.match(main, /<h2 id="espacio-sala-1" tabindex="-1" [^>]*>SALA 1<span class="sr-only">, estás en este espacio<\/span><\/h2>/)
    assert.ok(main.includes('<p>Primer párrafo de la estación 2.</p><p>[Suena una tormenta]</p>'))
    assert.ok(main.includes('href="#espacio-sala-1"'))
    // Ninguna dirección de la otra versión.
    assert.equal(cuantas(main, '-ad?t='), 0)
  })
})

describe('el servidor: apagado, el sitio no cambia', () => {
  // Las cabeceras de una respuesta, sin la hora.
  const cabeceras = (r) => Object.fromEntries(Object.entries(r.h).filter(([k]) => k !== 'date'))
  const RUTAS_DEL_SITIO = ['/', '/visitas', '/el-museo', '/no-existe', '/robots.txt', '/sitemap.xml', '/favicon.svg', '/salud']

  test('sin AUDIOGUIA_CLAVE (con la carpeta llena): /audioguia/… es la 404 del sitio, sin cookies, y solo un aviso', async () => {
    const logs = escucharLogs()
    let s
    try {
      s = await levantarAudioguia({ AUDIOGUIA_CLAVE: undefined })
      const rutas = [
        `/audioguia/q/${codigoDe('sala-1')}`,
        `/audioguia/q/${codigoDe('sala-1')}?v=ad`,
        '/audioguia/q/basura',
        '/audioguia',
        '/audioguia/sala-1',
        `/audioguia/pista/02?t=${tokenDe()}`,
        '/audioguia/pista/02',
        '/audioguias/02.mp3',
        '/audioguias/pistas.json',
      ]
      for (const ruta of rutas) {
        const r = await s.pedir('GET', ruta, { cookie: cookieDiaHttps() })
        assert.equal(r.status, 404, ruta)
        assert.match(r.texto, /data-pagina="no-encontrada"/, ruta)
        assert.equal(r.h['set-cookie'], undefined, ruta)
        assert.equal(r.h['referrer-policy'], 'strict-origin-when-cross-origin', ruta)
      }
      // En producción, con pistas y sin la clave, un aviso (y nada más de la audioguía).
      assert.deepEqual(logs.eventos().filter((e) => e.evento.startsWith('audioguia')).map((e) => e.evento), ['audioguia_apagada'])
    } finally {
      logs.detener()
      await s?.cerrar()
    }
  })

  test('sin AUDIOGUIA_CLAVE y con el manifiesto solo (sin grabaciones, como la carpeta real hoy): ningún aviso', async () => {
    const logs = escucharLogs()
    let s
    try {
      s = await levantarAudioguia({ AUDIOGUIA_CLAVE: undefined, DIR_AUDIOGUIAS: carpeta(RECORRIDO_DEL_SERVIDOR) })
      assert.equal((await s.pedir('GET', '/audioguia')).status, 404)
      assert.deepEqual(logs.eventos().filter((e) => e.evento.startsWith('audioguia')), [])
    } finally {
      logs.detener()
      await s?.cerrar()
    }
  })

  test('con la clave y sin pistas (sin manifiesto o sin ninguna estación válida): apagada, con su aviso', async () => {
    for (const dir of [carpeta(null), carpeta(RECORRIDO_DEL_SERVIDOR)]) {
      const logs = escucharLogs()
      let s
      try {
        s = await levantarAudioguia({ DIR_AUDIOGUIAS: dir })
        const r = await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
        assert.equal(r.status, 404)
        assert.equal(r.h['set-cookie'], undefined)
        assert.ok(logs.eventos().some((e) => e.evento === 'audioguia_sin_pistas'))
      } finally {
        logs.detener()
        await s?.cerrar()
      }
    }
  })

  test('prendida, el resto del sitio responde igual que apagada: las mismas cabeceras y el mismo cuerpo', async () => {
    const logs = escucharLogs()
    const apps = []
    try {
      apps.push(await levantarAudioguia({ AUDIOGUIA_CLAVE: undefined, DIR_AUDIOGUIAS: carpeta(null) }))
      apps.push(await levantarAudioguia({ AUDIOGUIA_CLAVE: undefined }))
      apps.push(await levantarAudioguia())
      assert.ok(logs.eventos().some((e) => e.evento === 'audioguia_prendida' && e.estaciones === 4 && e.espacios === 3))
      for (const ruta of [...RUTAS_DEL_SITIO, '/audioguia/pista', '/audioguia/sala-5', '/Audioguia']) {
        const [sinNada, apagada, prendida] = await Promise.all(apps.map((s) => s.pedir('GET', ruta, { cookie: cookieDiaHttps() })))
        assert.deepEqual(cabeceras(apagada), cabeceras(sinNada), ruta)
        assert.deepEqual(cabeceras(prendida), cabeceras(sinNada), ruta)
        assert.equal(prendida.status, sinNada.status, ruta)
        assert.equal(prendida.texto, sinNada.texto, ruta)
      }
      // La página de la audioguía: desde que existe (src/tablaDePaginas.js, 24/11/2026), prendida es la página (403 sin
      // el permiso de hoy, 200 con él); apagada, la 404 del sitio, igual que sin nada.
      for (const ruta of ['/audioguia', '/audioguia/sala-1']) {
        const [sinNada, apagada, prendida] = await Promise.all(apps.map((s) => s.pedir('GET', ruta, { cookie: cookieDiaHttps(tokenDe('2026-11-19')) })))
        assert.equal(sinNada.status, 404, ruta)
        assert.deepEqual(cabeceras(apagada), cabeceras(sinNada), ruta)
        assert.equal(apagada.texto, sinNada.texto, ruta)
        assert.equal(prendida.status, 403, ruta)
        assert.match(prendida.texto, /data-pagina="audioguia"/, ruta)
        assert.equal((await apps[2].pedir('GET', ruta, { cookie: cookieDiaHttps() })).status, 200, ruta)
      }
    } finally {
      logs.detener()
      await Promise.all(apps.map((s) => s.cerrar()))
    }
  })

  // AG-SEG-05 y AG-COD-08: el sitio nunca deja de arrancar por la audioguía (1.4). Hasta el 24/11/2026 una clave mal
  // formada tiraba en leerConfig y el sitio entero no arrancaba; ahora la audioguía queda apagada y lo dice el log.
  test('una clave mal formada deja la audioguía apagada (sin tirar y sin mostrar el valor); con espacios en los bordes, vale; vacía, apagada', () => {
    for (const mala of ['corta', 'con espacios de más en el medio de la clave larga', 'ñ'.repeat(40), 'a'.repeat(129), `"${CLAVE_SERVIDOR}"`]) {
      const config = leerConfig({ NODE_ENV: 'test', AUDIOGUIA_CLAVE: mala })
      assert.equal(config.AUDIOGUIA_CLAVE, undefined, mala)
      assert.equal(config.audioguiaClaveInvalida, true, mala)
      assert.ok(!JSON.stringify(config).includes(mala), mala)
    }
    for (const pegada of [`${CLAVE_SERVIDOR}\n`, `${CLAVE_SERVIDOR}\r\n`, ` ${CLAVE_SERVIDOR}`, `\t${CLAVE_SERVIDOR} `]) {
      const config = leerConfig({ NODE_ENV: 'test', AUDIOGUIA_CLAVE: pegada })
      assert.equal(config.AUDIOGUIA_CLAVE, CLAVE_SERVIDOR, JSON.stringify(pegada))
      assert.equal(config.audioguiaClaveInvalida, false)
    }
    for (const vacia of ['', '   ']) {
      assert.equal(leerConfig({ NODE_ENV: 'test', AUDIOGUIA_CLAVE: vacia }).AUDIOGUIA_CLAVE, undefined)
      assert.equal(leerConfig({ NODE_ENV: 'test', AUDIOGUIA_CLAVE: vacia }).audioguiaClaveInvalida, false)
    }
    assert.equal(leerConfig({ NODE_ENV: 'test' }).audioguiaClaveInvalida, false)
    const raiz = join(import.meta.dirname, '..', '..')
    assert.equal(leerConfig({ NODE_ENV: 'test' }).dirAudioguias, join(raiz, 'audioguias'))
    assert.equal(leerConfig({ NODE_ENV: 'test', DIR_AUDIOGUIAS: 'otra' }).dirAudioguias, join(raiz, 'otra'))
    assert.equal(leerConfig({ NODE_ENV: 'test', DIR_AUDIOGUIAS: DIR_AUDIOGUIA }).dirAudioguias, DIR_AUDIOGUIA)
  })

  test('con una clave mal formada el sitio arranca, la audioguía queda apagada y el log lo dice sin el valor', async () => {
    const mala = 'una clave mal pegada con espacios en el medio'
    const logs = escucharLogs()
    let s
    try {
      s = await levantarAudioguia({ AUDIOGUIA_CLAVE: mala })
      assert.equal((await s.pedir('GET', '/')).status, 200)
      const qr = await s.pedir('GET', `/audioguia/q/${codigoDe('sala-1')}`)
      assert.equal(qr.status, 404)
      assert.equal(qr.h['set-cookie'], undefined)
      assert.equal((await s.pedir('GET', `/audioguia/pista/02?t=${tokenDe()}`)).status, 404)
      const eventos = logs.eventos()
      assert.equal(eventos.filter((e) => e.evento === 'audioguia_clave_invalida' && e.nivel === 'error').length, 1)
      assert.ok(!eventos.some((e) => e.evento === 'audioguia_prendida'))
      assert.ok(!logs.lineas.join(' ').includes(mala))
    } finally {
      logs.detener()
      await s?.cerrar()
    }
  })
})

describe('el script de las URL de los QR (server/scripts/audioguia-urls.js)', () => {
  test('los argumentos y el origen', () => {
    assert.deepEqual(leerArgumentos(['--url', 'https://mupa.ar/']), { ok: true, url: 'https://mupa.ar/', prueba: false })
    assert.deepEqual(leerArgumentos(['--prueba', '--host', 'http://192.168.0.10:5183']), { ok: true, url: 'http://192.168.0.10:5183', prueba: true })
    assert.equal(leerArgumentos(['--url']).ok, false)
    assert.equal(leerArgumentos(['--url', '--prueba']).ok, false)
    assert.equal(leerArgumentos(['--clave', 'x']).ok, false)
    assert.equal(leerArgumentos(['--url', 'https://mupa.ar/', '--host', 'https://otro/']).ok, false)
    assert.deepEqual(origenDe('https://mupa.ar', false), { ok: true, origen: 'https://mupa.ar/' })
    assert.equal(origenDe('https://mupa-web.onrender.com/', false).ok, false, 'sin --prueba, solo mupa.ar')
    assert.equal(origenDe('http://mupa.ar/', false).ok, false)
    assert.equal(origenDe('https://mupa.ar/', true).ok, false, '--prueba no es para mupa.ar')
    assert.deepEqual(origenDe('http://192.168.0.10:5183', true), { ok: true, origen: 'http://192.168.0.10:5183/' })
    for (const malo of ['mupa.ar', 'https://mupa.ar/audioguia', 'https://mupa.ar/?x=1', 'ftp://mupa.ar/', 'https://u:p@mupa.ar/', 'https://mupa.ar:8443/']) {
      assert.equal(origenDe(malo, false).ok, false, malo)
    }
  })

  test('un renglón por espacio, en orden, con Recepción una sola vez, y cada código vale', () => {
    const audioguia = cargarPistas(DIR_AUDIOGUIA, { log: () => {} })
    const lista = renglones(clavesServidor, audioguia, 'https://mupa.ar/', codigoDeQr)
    assert.deepEqual(lista.map((r) => r.split('\t')[0]), ['recepcion', 'sala-1', 'sala-3'])
    for (const renglon of lista) {
      const [espacio, url] = renglon.split('\t')
      assert.ok(url.startsWith('https://mupa.ar/audioguia/q/'))
      assert.ok(url.length <= 70, `${url.length} caracteres`)
      const codigo = url.slice('https://mupa.ar/audioguia/q/'.length)
      assert.deepEqual(leerCodigoDeQr(clavesServidor, codigo, audioguia), { ok: true, espacio })
    }
  })

  const correr = (args, env) =>
    spawnSync(process.execPath, [join(import.meta.dirname, '../scripts/audioguia-urls.js'), ...args], {
      encoding: 'utf8',
      env: { SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, NODE_ENV: 'test', ...env },
    })

  test('de punta a punta: sin clave, 1; los definitivos con un título provisorio, 1; los de prueba, 0; nunca la clave', () => {
    const conProvisoria = carpeta(RECORRIDO, { ...archivosDe(1), ...archivosDe(2), ...archivosDe(3), ...archivosDe(4) })
    const conClave = (dir) => ({ AUDIOGUIA_CLAVE: CLAVE_SERVIDOR, DIR_AUDIOGUIAS: dir })

    const sinClave = correr(['--url', 'https://mupa.ar/'], { DIR_AUDIOGUIAS: DIR_AUDIOGUIA })
    assert.equal(sinClave.status, 1)
    assert.match(sinClave.stderr, /AUDIOGUIA_CLAVE/)

    // Mal formada: server/config.js la deja apagada sin tirar; el script dice que está mal formada, sin el valor.
    const malPegada = 'una clave con espacios en el medio que no vale'
    const mala = correr(['--prueba', '--host', 'http://192.168.0.10:5183'], { AUDIOGUIA_CLAVE: malPegada, DIR_AUDIOGUIAS: DIR_AUDIOGUIA })
    assert.equal(mala.status, 1)
    assert.equal(mala.stdout, '')
    assert.match(mala.stderr, /AUDIOGUIA_CLAVE está mal formada/)
    assert.ok(!mala.stderr.includes(malPegada))
    // Con un salto de línea al final (pegada de la terminal) vale: los mismos renglones que sin él.
    const conSalto = correr(['--url', 'https://mupa.ar/'], { AUDIOGUIA_CLAVE: `${CLAVE_SERVIDOR}\n`, DIR_AUDIOGUIAS: DIR_AUDIOGUIA })
    assert.equal(conSalto.status, 0, conSalto.stderr)
    assert.deepEqual(conSalto.stdout.trim().split(/\r?\n/), renglones(clavesServidor, cargarPistas(DIR_AUDIOGUIA, { log: () => {} }), 'https://mupa.ar/', codigoDeQr))

    const provisoria = correr(['--url', 'https://mupa.ar/'], conClave(conProvisoria))
    assert.equal(provisoria.status, 1)
    assert.equal(provisoria.stdout, '')
    assert.match(provisoria.stderr, /tituloProvisorio: 03/)

    const prueba = correr(['--prueba', '--host', 'http://192.168.0.10:5183'], conClave(conProvisoria))
    assert.equal(prueba.status, 0, prueba.stderr)
    assert.equal(prueba.stdout.trim().split('\n').length, 3)
    assert.match(prueba.stdout, /^recepcion\thttp:\/\/192\.168\.0\.10:5183\/audioguia\/q\/recepcion\.1\./)
    assert.match(prueba.stderr, /aviso: estaciones con tituloProvisorio: 03/)

    const definitivos = correr(['--url', 'https://mupa.ar/'], conClave(DIR_AUDIOGUIA))
    assert.equal(definitivos.status, 0, definitivos.stderr)
    const esperados = renglones(clavesServidor, cargarPistas(DIR_AUDIOGUIA, { log: () => {} }), 'https://mupa.ar/', codigoDeQr)
    assert.deepEqual(definitivos.stdout.trim().split(/\r?\n/), esperados)

    const otroHost = correr(['--url', 'https://mupa-web.onrender.com/'], conClave(DIR_AUDIOGUIA))
    assert.equal(otroHost.status, 1)
    const sinEstaciones = correr(['--prueba', '--host', 'http://127.0.0.1:5183/'], conClave(carpeta(null)))
    assert.equal(sinEstaciones.status, 1)
    const opcionRara = correr(['--clave', CLAVE_SERVIDOR], conClave(DIR_AUDIOGUIA))
    assert.equal(opcionRara.status, 1)
    // Con alguna estación sin grabar (24/11/2026: sin ninguno de sus cuatro archivos), los definitivos no salen (el
    // espacio que se queda sin estaciones no tendría su QR); los de prueba, sí, con el aviso.
    const aMedio = carpeta(RECORRIDO_DEL_SERVIDOR, { ...archivosDe(1), ...archivosDe(2), ...archivosDe(3) })
    const sinGrabar = correr(['--url', 'https://mupa.ar/'], conClave(aMedio))
    assert.equal(sinGrabar.status, 1)
    assert.equal(sinGrabar.stdout, '')
    assert.match(sinGrabar.stderr, /estaciones sin grabar: 04/)
    const sinGrabarPrueba = correr(['--prueba', '--host', 'http://127.0.0.1:5183/'], conClave(aMedio))
    assert.equal(sinGrabarPrueba.status, 0, sinGrabarPrueba.stderr)
    assert.match(sinGrabarPrueba.stderr, /aviso: estaciones sin grabar: 04/)

    for (const r of [sinClave, provisoria, prueba, definitivos, otroHost, sinEstaciones, opcionRara, sinGrabar, sinGrabarPrueba]) {
      assert.ok(!(r.stdout + r.stderr).includes(CLAVE_SERVIDOR), 'la clave en la salida')
    }
  })
})

// ——— La herramienta de los QR (tools/audioguia-qr.mjs, 8.1 y 9.1): su parte que valida las URL y arma los símbolos,
// importada, sin Chrome (los PDF y su comprobación con pdfjs-dist los hace la herramienta al correr: necesitan Chrome).

describe('la herramienta de los QR (tools/audioguia-qr.mjs)', () => {
  // El recorrido entero del guion (1.2.1): 12 espacios, Recepción al principio y al final.
  const ESPACIOS = ['recepcion', 'sala-1', 'sala-2', 'sala-3', 'sala-4', 'sala-5', 'sala-6', 'sala-7', 'jardin-triasico', 'sala-educativa', 'sala-8', 'sala-inmersiva']
  const manifiesto = (version) => ({
    version,
    recorrido: [...ESPACIOS, 'recepcion'].map((espacio, i) => ({
      espacio,
      nombre: espacio === 'recepcion' ? 'Recepción' : `Nombre ${espacio}`,
      nombreGuion: espacio.toUpperCase(),
      estaciones: [{ numero: i + 1, titulo: `Estación ${i + 1}` }],
    })),
  })
  const urls = (version, origen) => ESPACIOS.map((e) => `${e}\t${origen}audioguia/q/${codigoDeQr(claves, e, version)}`).join('\n')
  const preparar = (version, origen, opciones) => {
    const { renglones: leidos, problemas } = qr.leerUrls(urls(version, origen))
    assert.deepEqual(problemas, [])
    return qr.validarCarteles(leidos, manifiesto(version), opciones)
  }

  test('leerUrls: el tabulador o espacios, CRLF, el BOM y los renglones vacíos; un renglón con más cosas es un problema', () => {
    const r = qr.leerUrls('﻿recepcion\thttps://mupa.ar/audioguia/q/a\r\n\r\nsala-1    https://mupa.ar/audioguia/q/b  \n')
    assert.deepEqual(r.renglones.map(({ espacio, url }) => [espacio, url]), [['recepcion', 'https://mupa.ar/audioguia/q/a'], ['sala-1', 'https://mupa.ar/audioguia/q/b']])
    assert.deepEqual(r.problemas, [])
    assert.match(qr.leerUrls('sala-1 https://x y').problemas[0], /renglón 1/)
    assert.match(qr.leerUrls('\n\n').problemas[0], /vacío/)
  })

  test('hostDe: host, host:puerto o el origen entero; con ruta o consulta, no', () => {
    assert.equal(qr.hostDe('mupa-web.onrender.com'), 'mupa-web.onrender.com')
    assert.equal(qr.hostDe('192.168.0.10:5183'), '192.168.0.10:5183')
    assert.equal(qr.hostDe('http://192.168.0.10:5183/'), '192.168.0.10:5183')
    assert.equal(qr.hostDe('HTTPS://Mupa-Web.onrender.com'), 'mupa-web.onrender.com')
    assert.equal(qr.hostDe('https://mupa.ar/audioguia'), null)
    assert.equal(qr.hostDe('https://mupa.ar/?a=1'), null)
    assert.equal(qr.hostDe(''), null)
  })

  test('con mupa.ar: los 13 (la 13.ª, Recepción con ?v=ad, después de Recepción) en la versión 6 con corrección Q', () => {
    const { carteles, problemas, avisos } = preparar(2, 'https://mupa.ar/')
    assert.deepEqual(problemas, [])
    assert.deepEqual(avisos, [])
    assert.equal(carteles.length, 13)
    assert.deepEqual(carteles.map((c) => c.id), ['recepcion', qr.ID_AD, ...ESPACIOS.slice(1)])
    assert.equal(carteles[1].url, `${carteles[0].url}?v=ad`)
    assert.equal(carteles[1].ad, true)
    const armados = qr.armarSimbolos(carteles)
    assert.equal(armados.ok, true)
    assert.equal(armados.version, qr.VERSION_DEFINITIVA)
    for (const s of armados.simbolos) {
      assert.equal(s.version, 6)
      assert.equal(s.modulos, 41)
      assert.equal(s.correccion, 'Q')
    }
  })

  test('con mupa.ar y la versión 999 de los códigos (el largo máximo, 70 con jardin-triasico) también entra en la 6', () => {
    const { carteles, problemas } = preparar(999, 'https://mupa.ar/')
    assert.deepEqual(problemas, [])
    assert.equal(Math.max(...carteles.map((c) => c.url.length)), 70)
    const armados = qr.armarSimbolos(carteles)
    assert.equal(armados.ok, true)
    assert.ok(armados.simbolos.every((s) => s.version === 6))
  })

  test('--prueba con mupa-web.onrender.com: la 7 por jardin-triasico, y la misma para los 13', () => {
    const { carteles, problemas } = preparar(1, 'https://mupa-web.onrender.com/', { prueba: true, host: 'mupa-web.onrender.com' })
    assert.deepEqual(problemas, [])
    const jardin = carteles.find((c) => c.id === 'jardin-triasico')
    assert.equal(jardin.url.length, 82)
    const armados = qr.armarSimbolos(carteles, { prueba: true })
    assert.equal(armados.ok, true)
    assert.equal(armados.version, 7)
    assert.ok(armados.simbolos.every((s) => s.version === 7 && s.modulos === 45))
    // Sola, la de sala-1 (73 caracteres) entraría en la 6: la versión es la de la más larga, para todas.
    const sala1 = carteles.find((c) => c.id === 'sala-1')
    assert.equal(sala1.url.length, 73)
    assert.equal(qr.armarSimbolos([sala1], { prueba: true }).version, 6)
  })

  test('con mupa.ar, una URL que no entra en la 6 no se arma (la herramienta sale con 1)', () => {
    const url = `https://mupa.ar/audioguia/q/${'x'.repeat(40)}.1.${'A'.repeat(22)}`
    const r = qr.armarSimbolos([{ id: 'larga', url }])
    assert.equal(r.ok, false)
    assert.match(r.problema, /no entra en la versión 6 con corrección Q/)
  })

  test('las URL que no pasan: el host, --prueba con mupa.ar, la consulta, la versión, repetidas, de otro espacio o que faltan', () => {
    const render = 'https://mupa-web.onrender.com/'
    assert.match(preparar(1, render).problemas.join('\n'), /los definitivos son https:\/\/mupa\.ar/)
    assert.match(preparar(1, 'https://mupa.ar/', { prueba: true, host: 'mupa.ar' }).problemas.join('\n'), /no mupa\.ar/)
    assert.match(preparar(1, render, { prueba: true }).problemas.join('\n'), /--host/)
    assert.match(preparar(1, render, { prueba: true, host: 'otro.onrender.com' }).problemas.join('\n'), /se esperaba otro\.onrender\.com/)

    const base = qr.leerUrls(urls(2, 'https://mupa.ar/')).renglones
    const con = (cambio) => qr.validarCarteles(cambio(base.map((r) => ({ ...r }))), manifiesto(2)).problemas.join('\n')
    assert.match(con((l) => ((l[0].url += '?v=ad'), l)), /sin consulta ni fragmento/)
    assert.match(con((l) => ((l[0].url += '#x'), l)), /sin consulta ni fragmento/)
    assert.match(qr.validarCarteles(base, manifiesto(3)).problemas.join('\n'), /versión 2 y el manifiesto está en la 3/)
    assert.match(con((l) => [...l, { ...l[1], renglon: 99 }]), /sala-1 está dos veces/)
    assert.match(con((l) => ((l[1].espacio = 'sala-2'), l)), /el código es de sala-1/)
    assert.match(con((l) => ((l[1].url = 'https://mupa.ar/audioguia/q/sala-1.2.corto'), l)), /\/audioguia\/q\/<espacio>/)
    assert.match(con((l) => l.slice(0, -1)), /faltan las URL de sala-inmersiva/)
    // Con --prueba, lo que falta es un aviso (el servidor de prueba puede tener una parte del recorrido).
    const enPrueba = qr.validarCarteles(qr.leerUrls(urls(1, render)).renglones.slice(0, -1), manifiesto(1), { prueba: true, host: 'mupa-web.onrender.com' })
    assert.deepEqual(enPrueba.problemas, [])
    assert.match(enPrueba.avisos.join('\n'), /faltan las URL de sala-inmersiva/)
  })

  test('el SVG: su viewBox con los 4 módulos de silencio, un solo trazado negro sobre el fondo blanco y el ancho en mm', () => {
    const { simbolos } = qr.armarSimbolos(preparar(2, 'https://mupa.ar/').carteles)
    const svg = qr.svgDe(simbolos[0])
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 49 49" shape-rendering="crispEdges">/)
    assert.equal((svg.match(/<path /g) ?? []).length, 2)
    assert.match(svg, /<path fill="#ffffff" d="M0 0h49v49H0z"\/>/)
    assert.match(svg, /<path stroke="#000000" d="M4 4\.5h7/)
    // 10 cm de código son 41 módulos de 2,439 mm; con el silencio, 49 módulos: 119,5122 mm.
    assert.match(qr.svgEnMm(svg, 10, 41), /^<svg width="119\.5122mm" height="119\.5122mm" /)
    assert.equal(Number(qr.ladoConSilencioMm(7, 45).toFixed(4)), 82.4444)
  })

  test('los argumentos y la carpeta de salida', () => {
    assert.equal(qr.leerArgumentos([]).ok, false)
    assert.match(qr.leerArgumentos(['--urls', 'u.txt', '--host', 'x.onrender.com']).error, /--prueba/)
    assert.match(qr.leerArgumentos(['--urls', 'u.txt', '--cm', '13']).error, /--cm va de 4 a 12/)
    assert.match(qr.leerArgumentos(['--urls', 'u.txt', '--clave', 'x']).error, /no conozco la opción --clave/)
    const r = qr.leerArgumentos(['--urls', 'u.txt', '--prueba', '--host', 'http://192.168.0.10:5183/', '--cm', '12'])
    assert.equal(r.ok, true)
    assert.equal(r.host, '192.168.0.10:5183')
    assert.equal(r.cm, 12)
    const raiz = join(import.meta.dirname, '..', '..')
    assert.equal(qr.salidaVersionable(join(raiz, 'tools', 'salida', 'audioguias', 'qr')), false)
    assert.equal(qr.salidaVersionable(join(raiz, 'public', 'qr')), true)
    assert.equal(qr.salidaVersionable(join(raiz, 'audioguias')), true)
    assert.equal(qr.salidaVersionable(join(raiz, '..', 'qr-afuera')), false)
    assert.equal(r.reemplazar, false)
    assert.equal(qr.leerArgumentos(['--urls', 'u.txt', '--reemplazar']).reemplazar, true)
  })

  test('la carpeta de salida: nunca borra un archivo ajeno; solo lo que dejó la corrida anterior y esta no repite (AG-QR-01)', () => {
    const nuevos = new Set(['recepcion.svg', 'recepcion.pdf', 'todos.pdf', 'prueba.pdf', 'resumen.json'])
    const ajenos = ['factura-2026.pdf', 'plano-del-museo.svg', 'logo.svg', 'Informe.pdf', 'notas.txt']
    const archivo = (nombre) => ({ nombre, archivo: true })
    // Vacía o nueva: se escribe, sin borrar nada.
    assert.deepEqual(qr.planDeLaSalida([], { nuevos }), { ok: true, borrar: [] })
    // Con archivos ajenos y sin un resumen.json de la herramienta: se niega (Descargas, el Escritorio).
    const ajena = qr.planDeLaSalida(ajenos.map(archivo), { nuevos })
    assert.equal(ajena.ok, false)
    assert.match(ajena.error, /no es una salida de esta herramienta/)
    assert.match(ajena.error, /--reemplazar/)
    // Un resumen.json que no es suyo (otro programa, o el de antes de la marca) tampoco la hace suya.
    for (const resumenAnterior of [{ carteles: [] }, { generadoPor: 'otro', archivos: ajenos }, { generadoPor: qr.GENERADO_POR }, 'texto']) {
      assert.equal(qr.planDeLaSalida([...ajenos, 'resumen.json'].map(archivo), { nuevos, resumenAnterior }).ok, false)
    }
    // Con --reemplazar: escribe, sin borrar nada (ni ajeno ni con nombre propio).
    assert.deepEqual(qr.planDeLaSalida([...ajenos, 'sala-1.pdf'].map(archivo), { nuevos, reemplazar: true }), { ok: true, borrar: [] })
    // Una salida suya: borra solo lo que lista su resumen, con nombre propio, que esta corrida no escribe. Un archivo
    // ajeno que el resumen nombre (alguien lo tocó) o un nombre propio que no estaba en la lista, no.
    const resumenAnterior = {
      generadoPor: qr.GENERADO_POR,
      archivos: ['recepcion.svg', 'recepcion.pdf', 'sala-1.svg', 'sala-1.pdf', 'todos.pdf', 'prueba.pdf', 'resumen.json', 'factura-2026.pdf', '../x.pdf'],
    }
    const entradas = [...ajenos, 'recepcion.svg', 'sala-1.svg', 'sala-1.pdf', 'sala-2.pdf', 'resumen.json'].map(archivo)
    entradas.push({ nombre: 'sala-3.pdf', archivo: false })
    assert.deepEqual(qr.planDeLaSalida(entradas, { nuevos, resumenAnterior }), { ok: true, borrar: ['sala-1.pdf', 'sala-1.svg'] })
    // Los nombres propios: los 12 espacios y recepcion-ad, con .svg y .pdf, más todos, prueba y resumen.
    assert.equal(qr.NOMBRES_PROPIOS.size, (ESPACIOS_DE_LA_AUDIOGUIA.length + 1) * 2 + 3)
    for (const nombre of ajenos) assert.equal(qr.NOMBRES_PROPIOS.has(nombre), false, nombre)
  })

  test('la hoja de prueba: el aviso de tapar los otros en las dos páginas y cada código con su silencio entero, salvo 10 y 8 (AG-QR-02)', () => {
    for (const [version, origen, opciones] of [[2, 'https://mupa.ar/', {}], [1, 'https://mupa-web.onrender.com/', { prueba: true, host: 'mupa-web.onrender.com' }]]) {
      const armados = qr.armarSimbolos(preparar(version, origen, opciones).carteles, { prueba: !!opciones.prueba })
      assert.equal(armados.ok, true)
      for (const s of armados.simbolos) s.svg = qr.svgDe(s)
      const { html } = qr.trabajos(armados.simbolos, { cm: 10, prueba: !!opciones.prueba }).find((t) => t.archivo === 'prueba.pdf')
      const paginas = html.split('<section ').slice(1)
      assert.equal(paginas.length, 2)
      const mm = (estilo, prop) => Number(new RegExp(`(?:^|[ ;])${prop}:([\\d.]+)mm`).exec(estilo)[1])
      for (const pagina of paginas) {
        assert.ok(pagina.includes(qr.TAPAR_LOS_OTROS), 'el aviso de tapar los otros')
        const qrs = [...pagina.matchAll(/<div class="qr" data-qr data-cm="([\d.]+)" data-lado-mm="([\d.]+)" data-silencio-mm="([\d.]+)" style="([^"]*)"/g)].map(
          ([, cm, lado, silencio, estilo]) => ({ cm: Number(cm), lado: Number(lado), silencio: Number(silencio), x: mm(estilo, 'left'), y: mm(estilo, 'top') }),
        )
        const cortes = [...pagina.matchAll(/<div class="corte( vertical)?" data-corte style="([^"]*)"/g)].map(([, vertical, estilo]) => ({
          vertical: !!vertical,
          x: mm(estilo, 'left'),
          y: mm(estilo, 'top'),
          largo: mm(estilo, vertical ? 'height' : 'width'),
        }))
        assert.ok(cortes.length >= 1, 'al menos una línea de corte')
        const cruza = (a, b) => a.x < b.x + b.lado && b.x < a.x + a.lado && a.y < b.y + b.lado && b.y < a.y + a.lado
        // Ninguna línea de corte sobre un código ni su silencio.
        for (const c of cortes) {
          const caja = c.vertical ? { x: c.x, y: c.y, ancho: 0.3, alto: c.largo } : { x: c.x, y: c.y, ancho: c.largo, alto: 0.3 }
          for (const q of qrs) {
            const sobre = caja.x < q.x + q.lado && q.x < caja.x + caja.ancho && caja.y < q.y + q.lado && q.y < caja.y + caja.alto
            assert.equal(sobre, false, `un corte cae sobre el código de ${q.cm} cm`)
          }
        }
        // Las zonas (símbolo y silencio) no se pisan, salvo las de 10 y 8 cm, que en un A4 no entran separadas.
        for (let i = 0; i < qrs.length; i++) {
          for (let j = i + 1; j < qrs.length; j++) {
            const par = [qrs[i].cm, qrs[j].cm].sort((a, b) => a - b).join('-')
            if (par === '8-10') continue
            assert.equal(cruza(qrs[i], qrs[j]), false, `los códigos de ${par} cm comparten el silencio`)
          }
        }
      }
      // En la segunda, el de audiodescripción en su propio renglón: debajo del de 4 cm y de su silencio, con un corte
      // en el medio.
      const p2 = paginas[1]
      const de = (cm) => {
        const m = new RegExp(`data-cm="${cm}" data-lado-mm="([\\d.]+)"[^>]*style="left:([\\d.]+)mm; top:([\\d.]+)mm`).exec(p2)
        return { lado: Number(m[1]), x: Number(m[2]), y: Number(m[3]) }
      }
      const [q4, q7] = [de(4), de(qr.CM_TARJETA)]
      assert.ok(q7.y >= q4.y + de(6).lado, 'la tarjeta de 7 cm va debajo del renglón de 6 y 4')
      assert.match(paginas[0], /comparten el margen blanco: para probar uno, tapá el otro/)
    }
  })

  // Los detalles de la verificación de los QR (24/11/2026). Sin Chrome: el HTML de las hojas y revisarPdf con páginas
  // armadas acá (lo que mide leerPdf en un PDF de verdad lo comprueba la herramienta al correr).
  test('las URL, solo en su forma canónica: mayúsculas, :443, barras invertidas o /./ no pasan, y el mensaje no repite la URL (AG-QR-06)', () => {
    const base = qr.leerUrls(urls(2, 'https://mupa.ar/')).renglones
    const codigo = base[1].url.slice('https://mupa.ar/audioguia/q/'.length)
    for (const rara of [
      `HTTPS://MUPA.AR/audioguia/q/${codigo}`,
      `https://Mupa.ar/audioguia/q/${codigo}`,
      `https://mupa.ar:443/audioguia/q/${codigo}`,
      `https://mupa.ar\\audioguia\\q\\${codigo}`,
      `https://mupa.ar/audioguia/./q/${codigo}`,
      `https://mupa.ar/x/../audioguia/q/${codigo}`,
    ]) {
      const lista = base.map((r) => ({ ...r }))
      lista[1].url = rara
      // El renglón no cuenta: además, faltan las URL de sala-1.
      const { problemas } = qr.validarCarteles(lista, manifiesto(2))
      assert.equal(problemas.length, 2, rara)
      assert.match(problemas[0], /^renglón 2 \(sala-1\): la URL no está escrita en su forma canónica/, rara)
      assert.match(problemas[1], /faltan las URL de sala-1/, rara)
      assert.ok(!problemas.join('\n').includes(codigo), rara)
    }
    // Con --prueba también: el host con mayúsculas.
    const render = qr.leerUrls(urls(1, 'https://mupa-web.onrender.com/')).renglones
    render[0].url = render[0].url.replace('mupa-web', 'MUPA-WEB')
    assert.match(qr.validarCarteles(render, manifiesto(1), { prueba: true, host: 'mupa-web.onrender.com' }).problemas.join('\n'), /forma canónica/)
  })

  test('el SVG es el símbolo armado, módulo por módulo, y svgDe tira si no (AG-QR-08)', () => {
    const { simbolos } = qr.armarSimbolos(preparar(2, 'https://mupa.ar/').carteles)
    for (const s of simbolos) {
      assert.deepEqual(qr.matrizDelSvg(qr.svgDe(s), s.modulos), qr.matrizDelSimbolo(s.qr), s.id)
    }
    // Con el símbolo de otro cartel (otra URL, la misma versión), el SVG dibujado desde la URL no coincide.
    assert.throws(() => qr.svgDe({ ...simbolos[2], qr: simbolos[3].qr }), /no es el símbolo armado/)
    // matrizDelSvg entiende el trazado de qrcode: un renglón con dos tramos y un salto.
    const chico = '<svg><path fill="#ffffff" d="M0 0h10v10H0z"/><path stroke="#000000" d="M4 4.5h1m1 0h1M5 5.5h1"/></svg>'
    assert.deepEqual(qr.matrizDelSvg(chico, 3), [[true, false, true], [false, true, false], [false, false, false]])
    assert.throws(() => qr.matrizDelSvg('<svg><path stroke="#000" d="M4 9.5h1"/></svg>', 3), /fuera de los renglones/)
  })

  test('las hojas: el silencio entre el de 10 y el de 8 más un margen, la versión en cada rótulo, el pie arriba del borde, las esquinas y los espacios que no cortan (AG-QR-03, 04, 05 y 10)', () => {
    for (const [version, origen, opciones] of [[2, 'https://mupa.ar/', {}], [1, 'https://mupa-web.onrender.com/', { prueba: true, host: 'mupa-web.onrender.com' }]]) {
      const armados = qr.armarSimbolos(preparar(version, origen, opciones).carteles, { prueba: !!opciones.prueba })
      for (const s of armados.simbolos) s.svg = qr.svgDe(s)
      const lista = qr.trabajos(armados.simbolos, { cm: 10, prueba: !!opciones.prueba })
      const nombre = `QR versión ${armados.version}-Q`
      const [p1, p2] = lista.find((t) => t.archivo === 'prueba.pdf').html.split('<section ').slice(1)
      const mm = (estilo, prop) => Number(new RegExp(`(?:^|[ ;])${prop}:([\\d.]+)mm`).exec(estilo)[1])
      const codigos = (pagina) =>
        [...pagina.matchAll(/<div class="qr" data-qr data-cm="([\d.]+)" data-lado-mm="([\d.]+)" data-silencio-mm="([\d.]+)" style="([^"]*)"/g)].map(
          ([, cm, , silencio, estilo]) => ({ cm: Number(cm), silencio: Number(silencio), x: mm(estilo, 'left') }),
        )
      const [, de10, de8] = codigos(p1)
      const fin10 = de10.x + de10.silencio + 100
      const inicio8 = de8.x + de8.silencio
      assert.ok(inicio8 - fin10 >= Math.max(de10.silencio, de8.silencio) + qr.MARGEN_ENTRE_CODIGOS_MM - 0.001, `entre el de 10 y el de 8: ${inicio8 - fin10} mm`)
      assert.ok(de8.x + 2 * de8.silencio + 80 <= 210, 'el de 8 entra en el A4')
      // Cada rótulo de la hoja de prueba lleva la versión del QR (6 rótulos: 12, 8, 10, 6, 4 y 7 cm).
      const rotulos = (p1 + p2).replace(/ /g, ' ').match(/\d+ cm, módulo de [\d,]+ mm, QR versión \d+-Q/g)
      assert.equal(rotulos?.length, 6, String(rotulos))
      assert.ok(rotulos.every((r) => r.endsWith(nombre)))
      // Los espacios que no cortan: «versión 6», «corrección Q» (también en el pie de los carteles).
      const puerta = lista.find((t) => t.archivo === 'sala-1.pdf').html
      const tarjeta = lista.find((t) => t.archivo === `${qr.ID_AD}.pdf`).html
      for (const html of [puerta, tarjeta, p1]) {
        assert.match(html, /versión \d+, corrección Q/)
        assert.doesNotMatch(html, /corrección Q|versión \d/)
      }
      // El pie y la regla a 18 y 11 mm del borde de abajo (AG-QR-05): en el A5, a 192 y 199; en el A6, a 130 y 137.
      for (const [html, alto] of [[puerta, 210], [tarjeta, 148], [p1, 297]]) {
        const pie = /<div class="texto chico" style="left:6mm; top:([\d.]+)mm[^"]*">Imprimir al 100/.exec(html)
        const regla = /<div class="regla" style="left:6mm; top:([\d.]+)mm/.exec(html)
        assert.equal(Number(pie[1]), alto - 18)
        assert.equal(Number(regla[1]), alto - 11)
      }
      // Las marcas de las esquinas, en el A5 y en el A6 (no en la hoja de prueba), y la indicación balanceada.
      assert.equal((puerta.match(/data-esquina/g) ?? []).length, 8)
      assert.equal((tarjeta.match(/data-esquina/g) ?? []).length, 8)
      assert.equal((p1 + p2).includes('data-esquina'), false)
      assert.match(puerta, /\.indicacion \{[^}]*text-wrap: balance/)
      // Las páginas de cada PDF llevan las matrices de sus símbolos, en el orden de sus códigos.
      const pruebaPdf = lista.find((t) => t.archivo === 'prueba.pdf')
      assert.equal(pruebaPdf.paginas[0].matrices.length, 3)
      assert.deepEqual(pruebaPdf.paginas[1].matrices[2], qr.matrizDelSimbolo(armados.simbolos.find((s) => s.ad).qr))
      assert.equal(lista.find((t) => t.archivo === 'todos.pdf').paginas.length, 13)
    }
  })

  test('revisarPdf: el trazo (un módulo, a tope, negro), los módulos contra el símbolo y el silencio entre dos códigos (AG-QR-03 y AG-QR-07)', () => {
    const { simbolos } = qr.armarSimbolos(preparar(2, 'https://mupa.ar/').carteles)
    const comun = simbolos[0]
    const n = comun.modulos
    const MATRIZ = qr.matrizDelSimbolo(comun.qr)
    // Un código como lo deja leerPdf: los tramos horizontales por el centro de cada renglón, en mm de la página.
    const codigoEn = (cm, x, y, matriz = MATRIZ) => {
      const m = (cm * 10) / n
      const tramos = []
      matriz.forEach((fila, f) => {
        for (let c = 0; c < n; ) {
          if (!fila[c]) {
            c++
            continue
          }
          let fin = c
          while (fin < n && fila[fin]) fin++
          tramos.push([[x + c * m, y + (f + 0.5) * m], [x + fin * m, y + (f + 0.5) * m]])
          c = fin
        }
      })
      const xs = tramos.flatMap(([a, b]) => [a[0], b[0]])
      const ys = tramos.flatMap(([a, b]) => [a[1], b[1]])
      return {
        anchoMm: Math.max(...xs) - Math.min(...xs),
        izquierdaMm: Math.min(...xs),
        arribaMm: Math.min(...ys),
        tramos,
        trazado: true,
        trazoMm: m,
        extremo: 0,
        color: '#000000',
      }
    }
    const silencio10 = (100 * qr.SILENCIO) / n
    const pagina = (codigos) => [{ anchoMm: 210, altoMm: 297, imagenes: 0, codigos }]
    const trabajo = (conMatrices = true) => ({
      archivo: 'prueba.pdf',
      modulos: n,
      paginas: [{ hoja: [210, 297], codigos: [10, 8], ...(conMatrices ? { matrices: [MATRIZ, MATRIZ] } : {}) }],
    })
    const conSeparacion = (mm, cambio = {}) => pagina([codigoEn(10, 10, 20), { ...codigoEn(8, 10 + 100 + mm, 20), ...cambio }])
    assert.deepEqual(qr.revisarPdf(conSeparacion(silencio10 + 1.5), trabajo()), [])
    // Justo el silencio, sin margen (lo de AG-QR-03): un problema.
    const justo = qr.revisarPdf(conSeparacion(silencio10 - 0.05), trabajo())
    assert.equal(justo.length, 1)
    assert.match(justo[0], /entre los códigos de 10 y 8 cm hay 9,71 mm y tenía que haber al menos 10,26/)
    // Lo que tiene que dar un problema cada uno (en el de 8 cm).
    const casos = [
      [{ trazoMm: ((80 / n) * 1.02) }, /el trazo mide/],
      [{ extremo: 2 }, /no son a tope/],
      [{ color: '#333333' }, /no es negro/],
      [{ trazado: false }, /no es un trazo/],
    ]
    for (const [cambio, esperado] of casos) {
      const r = qr.revisarPdf(conSeparacion(silencio10 + 1.5, cambio), trabajo())
      assert.equal(r.length, 1, JSON.stringify(cambio))
      assert.match(r[0], esperado)
    }
    // Un módulo cambiado en el de 8 cm: sus módulos no son los del símbolo. Sin las matrices, no se compara.
    const otra = MATRIZ.map((f) => [...f])
    otra[20][20] = !otra[20][20]
    const cambiada = pagina([codigoEn(10, 10, 20), codigoEn(8, 10 + 100 + silencio10 + 1.5, 20, otra)])
    const r = qr.revisarPdf(cambiada, trabajo())
    assert.equal(r.length, 1)
    assert.match(r[0], /el código de 8 cm: sus módulos en el PDF no son los del símbolo/)
    assert.deepEqual(qr.revisarPdf(cambiada, trabajo(false)), [])
    // matrizDelPdf lee de vuelta la matriz de los tramos.
    assert.deepEqual(qr.matrizDelPdf(codigoEn(10, 3, 4), n), MATRIZ)
    // Sin trabajo.modulos (como lo llama la herramienta de medidas de las pruebas), solo los anchos.
    assert.deepEqual(qr.revisarPdf(conSeparacion(1, { extremo: 2 }), { ...trabajo(), modulos: undefined }), [])
  })
})

describe('npm run dev no sirve la audioguía (server/denegados-dev.js: AG-SEG-04 y AG-COD-02)', () => {
  test('la lista lleva entera la que Vite trae por defecto, más **/audioguias/**', async () => {
    const { resolveConfig } = await import('vite')
    const porDefecto = (await resolveConfig({ configFile: false, root: tmpdir(), logLevel: 'silent' }, 'serve')).server
      .fs.deny
    for (const regla of porDefecto) assert.ok(DENEGADOS_EN_DESARROLLO.includes(regla), `falta ${regla} de Vite`)
    assert.ok(DENEGADOS_EN_DESARROLLO.includes('**/audioguias/**'))
  })

  test('un Vite con esa lista da 403 a los MP3 y al manifiesto, y sigue sirviendo lo demás', async () => {
    const raiz = mkdtempSync(join(tmpdir(), 'ag-vite-'))
    const { createServer } = await import('node:http')
    let vite
    let servidor
    try {
      mkdirSync(join(raiz, 'audioguias'))
      mkdirSync(join(raiz, 'otra'))
      writeFileSync(join(raiz, 'audioguias', '07.mp3'), Buffer.alloc(16))
      writeFileSync(join(raiz, 'audioguias', 'pistas.json'), '{}')
      writeFileSync(join(raiz, 'otra', 'a.txt'), 'hola')
      writeFileSync(join(raiz, 'package.json'), '{}')
      const { createServer: crearVite } = await import('vite')
      vite = await crearVite({
        root: raiz,
        configFile: false,
        logLevel: 'silent',
        appType: 'custom',
        cacheDir: join(raiz, '.vite'),
        server: { middlewareMode: true, hmr: false, watch: null, fs: { deny: DENEGADOS_EN_DESARROLLO } },
      })
      servidor = createServer((req, res) =>
        vite.middlewares(req, res, () => {
          res.statusCode = 404
          res.end()
        }),
      )
      await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
      const base = `http://127.0.0.1:${servidor.address().port}`
      const estado = async (ruta) => (await fetch(base + ruta)).status
      assert.notEqual(await estado('/audioguias/07.mp3'), 200)
      assert.notEqual(await estado('/audioguias/pistas.json'), 200)
      const fsRuta = '/@fs/' + join(raiz, 'audioguias', '07.mp3').split(sep).join('/')
      assert.notEqual(await estado(fsRuta), 200)
      assert.equal(await estado('/otra/a.txt'), 200, 'el control: lo demás sale')
    } finally {
      await new Promise((r) => (servidor ? servidor.close(r) : r()))
      await vite?.close()
      rmSync(raiz, { recursive: true, force: true })
    }
  })
})

// ——— La carpeta real, audioguias/ (especificación de las audioguías, 9.2; desde el 24/11/2026) ———
// Recorre la carpeta del repo de verdad, sin servidor. El manifiesto (audioguias/pistas.json) tiene las 35 estaciones
// del guion desde antes de que lleguen las grabaciones: una estación sin ninguno de sus cuatro archivos está «sin
// grabar» y es un AVISO (como el relleno), no una falla; con uno, dos o tres, una falla (está a medias). Sin el
// manifiesto, un aviso («0 estaciones»): el módulo se puede deployar antes de las grabaciones.

/**
 * Los textos del guion, copiados del documento del museo, «EXPERIENCIA MUPA 2026» (exportado de Google Docs el
 * 25/11/2026), tal cual y con su caja (D13: «MUPA» y «Quetzacoatlus» se le preguntan al museo, 14.8 y 14.10): el título
 * de cada estación, el de su renglón del «DESGLOSE DE PISTAS - LISTA DE REPRODUCCIÓN», sin la anotación «(Referencial de
 * sala)» ni los espacios de las puntas (donde el encabezado de su texto difiere, manda el desglose: la 27 termina ahí
 * con un punto); los de los espacios, de sus encabezados («SALA 1 “EL CICLO DE LA VIDA. Empecemos desde cero”»: el
 * rótulo, y entre comillas el título y el lema), iguales en el desglose y en los textos. Desde el 25/11/2026 ninguna
 * estación es provisoria: las nueve referenciales (14, 15, 16, 19, 24, 28, 29, 30 y 34) tienen su título en el
 * documento. Si el documento cambia, o se aprueba la propuesta de 14.8, se corrigen acá y en audioguias/pistas.json en
 * el mismo commit.
 * Por grupo: [espacio, nombreGuion, titulo, lema, estaciones]; cada estación, [numero, titulo]. Un título null sería
 * una estación que el guion trae sin título: en el manifiesto llevaría tituloProvisorio y, de título, el del espacio o,
 * si no tiene, su lema (1.2; hoy, ninguna).
 */
const TEXTOS_DEL_GUION = Object.freeze([
  ['recepcion', 'RECEPCIÓN', null, null, [[1, 'Bienvenida al MUPA']]],
  ['sala-1', 'SALA 1', 'EL CICLO DE LA VIDA', 'Empecemos desde cero', [
    [2, 'Empecemos desde cero'],
    [3, 'Geología: una historia escrita en las rocas'],
    [4, 'Paleontología: tras las huellas del tiempo'],
    [5, 'Biología: los secretos de la vida'],
  ]],
  ['sala-2', 'SALA 2', 'ISCHIGUALASTO', 'El origen de los dinosaurios', [
    [6, 'Ischigualasto: Ecos de un mundo diverso'],
    [7, 'El origen de los dinosaurios'],
    [8, 'Taytalura: el antepasado de los lagartos'],
    [9, 'Sinápsidos: los ancestros de los mamíferos'],
    [10, 'Pterosaurios: los voladores del Triásico'],
    [11, 'Rincosaurios: los reptiles más abundantes de Ischigualasto'],
    [12, 'Crurotarsi: los antecesores de los cocodrilos'],
    [13, 'Fósiles icónicos de Ischigualasto'],
  ]],
  ['sala-3', 'SALA 3', 'EL LABORATORIO', 'Donde los fósiles se transforman en conocimiento', [[14, 'Los fósiles se transforman en conocimiento']]],
  ['sala-4', 'SALA 4', 'LA CAMPAÑA', 'Tras las huellas del pasado', [[15, 'Tras las huellas del pasado']]],
  ['sala-5', 'SALA 5', 'GEOLOGÍA', 'La historia escrita en rocas', [
    [16, 'La historia escrita en rocas'],
    [17, 'Ciclo de las rocas: una historia sin fin'],
    [18, 'Estratigrafía: aprender a leer los paisajes'],
  ]],
  ['sala-6', 'SALA 6', 'PALEOBOTÁNICA', 'Las plantas nos cuentan el pasado', [
    [19, 'Las plantas nos cuentan el pasado'],
    [20, 'Plantas primitivas, las primeras en conquistar la Tierra'],
    [21, 'Los bosques gigantes del Carbonífero'],
    [22, 'La flora triásica'],
    [23, 'La llegada de las flores'],
  ]],
  ['sala-7', 'SALA 7', 'UN VIAJE AL TRIÁSICO', 'El fin de un mundo, el inicio de otro', [
    [24, 'El fin de un mundo, el inicio de otro'],
    [25, 'Ischigualasto en tiempos del Triásico'],
    [26, 'Quebrada del Barro: nuevos protagonistas del Triásico'],
    [27, 'Extinción Triásica: una crisis que transformó la vida'],
  ]],
  ['jardin-triasico', 'JARDÍN TRIÁSICO', null, 'Paisaje vivo', [[28, 'Paisaje vivo']]],
  ['sala-educativa', 'PLAZA INTERACTIVA', null, 'Aprender jugando', [[29, 'Aprender jugando']]],
  ['sala-8', 'SALA GIGANTISMO', 'GIGANTISMO', 'La grandeza del pasado', [
    [30, 'La grandeza del pasado'],
    [31, 'Patagotitán, la grúa viviente'],
    [32, 'Mapusaurus, el cazador en equipo'],
    [33, 'Quetzacoatlus, el rey de los cielos'],
  ]],
  ['sala-inmersiva', 'SALA INMERSIVA', null, 'La memoria del tiempo', [[34, 'La memoria del tiempo']]],
  ['recepcion', 'RECEPCIÓN', null, null, [[35, 'Despedida MUPA']]],
])

const DIR_REAL = fileURLToPath(new URL('../../audioguias/', import.meta.url))
const MANIFIESTO_REAL = join(DIR_REAL, 'pistas.json')

/** El manifiesto real ya validado (con los nombres del plano), o null si no está. Tira si no pasa el esquema. */
function manifiestoReal() {
  if (!existsSync(MANIFIESTO_REAL)) return null
  const texto = readFileSync(MANIFIESTO_REAL, 'utf8')
  const r = validarManifiesto(JSON.parse(texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto), { nombresDelPlano: NOMBRES_DEL_PLANO })
  assert.ok(r.ok, `audioguias/pistas.json no pasa el esquema:\n- ${r.problemas?.join('\n- ')}`)
  return r.manifiesto
}

/** Cuáles de los cuatro archivos de una estación están en la carpeta real. */
const presentes = (numero) => archivosDeLaEstacion(numero).filter((nombre) => existsSync(join(DIR_REAL, nombre)))

describe('la carpeta real (audioguias/, 9.2)', () => {
  test('el manifiesto pasa el esquema: los ids, los nombres del plano, Recepción solo primera y última, los números', (t) => {
    const m = manifiestoReal()
    if (!m) {
      t.diagnostic('AVISO audioguias: sin audioguias/pistas.json (0 estaciones): el módulo queda apagado')
      return
    }
    const recorrido = m.recorrido
    assert.equal(recorrido[0].espacio, 'recepcion')
    assert.equal(recorrido.at(-1).espacio, 'recepcion')
    assert.equal(recorrido.filter((g) => g.espacio === 'recepcion').length, 2)
    for (const g of recorrido) assert.equal(g.nombre, g.espacio === 'recepcion' ? 'Recepción' : NOMBRES_DEL_PLANO[g.espacio], g.espacio)
  })

  test('los textos, contra el guion (TEXTOS_DEL_GUION), carácter por carácter; un aviso por cada título provisorio', (t) => {
    const m = manifiestoReal()
    if (!m) return
    const delManifiesto = m.recorrido.map((g) => [
      g.espacio,
      g.nombreGuion,
      g.titulo ?? null,
      g.lema ?? null,
      g.estaciones.map((e) => [e.numero, e.tituloProvisorio ? null : e.titulo]),
    ])
    assert.deepEqual(delManifiesto, TEXTOS_DEL_GUION.map((g) => structuredClone(g)))
    // Las provisorias: el título del espacio o, si no tiene, su lema (1.2).
    const provisorias = []
    for (const g of m.recorrido) {
      for (const e of g.estaciones) {
        if (!e.tituloProvisorio) continue
        assert.equal(e.titulo, g.titulo ?? g.lema, `la ${e.numero}: el título provisorio es el del espacio o su lema`)
        provisorias.push(numeroEnDosCifras(e.numero))
      }
    }
    if (provisorias.length) {
      t.diagnostic(
        `AVISO audioguias: ${provisorias.length} estaciones con tituloProvisorio (${provisorias.join(', ')}): ` +
          'pedirle el título al museo; con alguna, npm run audioguia-urls -- --url https://mupa.ar/ se niega',
      )
    }
  })

  test('cada estación tiene sus cuatro archivos (o ninguno: sin grabar, un aviso), y no hay ningún archivo más', (t) => {
    const m = manifiestoReal()
    if (!existsSync(DIR_REAL)) return
    const esperados = new Set(['pistas.json'])
    for (const e of m?.recorrido.flatMap((g) => g.estaciones) ?? []) for (const nombre of archivosDeLaEstacion(e.numero)) esperados.add(nombre)
    const demas = readdirSync(DIR_REAL, { withFileTypes: true })
      .filter((d) => !d.isFile() || !esperados.has(d.name))
      .map((d) => (d.isFile() ? d.name : `${d.name}/`))
    assert.deepEqual(demas, [], 'archivos que el manifiesto no explica (un WAV, un 07-v2.mp3 olvidado, un .DS_Store, una carpeta)')
    if (!m) return
    const sinGrabar = []
    const aMedias = []
    for (const e of m.recorrido.flatMap((g) => g.estaciones)) {
      const hay = presentes(e.numero)
      if (!hay.length) sinGrabar.push(numeroEnDosCifras(e.numero))
      else if (hay.length < 4) aMedias.push(`${numeroEnDosCifras(e.numero)}: faltan ${archivosDeLaEstacion(e.numero).filter((n) => !hay.includes(n)).join(', ')}`)
    }
    assert.deepEqual(aMedias, [], 'estaciones a medias (las dos versiones, con sus transcripciones, van juntas)')
    if (sinGrabar.length) {
      t.diagnostic(`AVISO audioguias: ${sinGrabar.length} estaciones sin grabar (${sinGrabar.join(', ')}): no salen en la página ni tienen QR`)
    }
  })

  test('cada MP3 pasa el validador (CBR, mono, 44,1 kHz, hasta 3 MB, de 20 s a 5 min) con el bitrate que declara su estación; cada transcripción tiene texto, sin BOM ni retornos de carro', (t) => {
    const m = manifiestoReal()
    if (!m) return
    const resumen = { estaciones: 0, bytes: 0, comun: 0, ad: 0 }
    for (const e of m.recorrido.flatMap((g) => g.estaciones)) {
      if (presentes(e.numero).length !== 4) continue
      resumen.estaciones++
      for (const [version, sufijo] of Object.entries(SUFIJOS)) {
        const id = `${numeroEnDosCifras(e.numero)}${sufijo}`
        const mp3 = leerMp3DeArchivo(join(DIR_REAL, `${id}.mp3`))
        assert.equal(mp3.kbps, (version === 'ad' ? e.kbpsAd : e.kbps) ?? 64, `${id}.mp3: el bitrate que declara la estación`)
        resumen.bytes += mp3.bytes
        resumen[version] += mp3.duracionS
        const texto = readFileSync(join(DIR_REAL, `${id}.txt`), 'utf8')
        assert.ok(!texto.includes(String.fromCharCode(0xfeff)), `${id}.txt: sin BOM`)
        assert.ok(!texto.includes('\r'), `${id}.txt: sin \\r (en git va con eol=lf: .gitattributes)`)
        assert.ok(texto.length <= 20_000, `${id}.txt: hasta 20.000 caracteres`)
        assert.ok(parrafosDe(texto).length > 0, `${id}.txt: tiene texto`)
      }
    }
    // Lo mismo que va a leer el servidor al arrancar: nada salteado por un error.
    const leida = cargarPistas(DIR_REAL, { log: () => {}, nombresDelPlano: NOMBRES_DEL_PLANO })
    assert.deepEqual(leida.problemas, [])
    assert.equal(leida.estaciones.size, resumen.estaciones * 2)
    const minutos = (s) => `${Math.floor(s / 60)} min ${s % 60} s`
    t.diagnostic(
      `audioguias: ${resumen.estaciones} estaciones grabadas de ${m.recorrido.flatMap((g) => g.estaciones).length}, ` +
        `${(resumen.bytes / 1e6).toFixed(1)} MB; la común, ${minutos(resumen.comun)}; con audiodescripción, ${minutos(resumen.ad)}`,
    )
  })

  test('las 35 del guion: del 1 al 35, sin huecos (mientras el manifiesto esté a medias, un aviso)', (t) => {
    const m = manifiestoReal()
    if (!m) return
    const numeros = m.recorrido.flatMap((g) => g.estaciones.map((e) => e.numero))
    if (numeros.length === 35) assert.deepEqual(numeros, Array.from({ length: 35 }, (_, i) => i + 1))
    else t.diagnostic(`AVISO audioguias: el manifiesto tiene ${numeros.length} estaciones de las 35 del guion`)
  })

  test('el control: un archivo de más o una estación a medias hacen fallar la comprobación de la carpeta', () => {
    // La misma regla de arriba, sobre una copia del manifiesto real con un WAV y un 07-v2.mp3 de más y la 02 a medias.
    const m = manifiestoReal() ?? RECORRIDO
    const dir = carpeta(m, { '01-bienvenida.wav': 'RIFF', '07-v2.mp3': armarMp3(), '02.mp3': armarMp3() })
    const esperados = new Set(['pistas.json', ...m.recorrido.flatMap((g) => g.estaciones).flatMap((e) => archivosDeLaEstacion(e.numero))])
    const demas = readdirSync(dir).filter((n) => !esperados.has(n)).sort()
    assert.deepEqual(demas, ['01-bienvenida.wav', '07-v2.mp3'])
    const r = cargarPistas(dir, { log: () => {} })
    assert.deepEqual(r.problemas, ['02: falta 02.txt'])
  })
})
