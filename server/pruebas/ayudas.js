// Ayudas de las pruebas con base (plan 13.1). No es un archivo de pruebas (npm test corre solo *.test.js).
//
// - prepararBase(): contra DATABASE_URL_TEST, que tiene que ser localhost y terminar en _test (exigirBaseDePrueba:
//   si no, tira y la prueba FALLA; nunca toca otra base). Si la variable no está (o está vacía) o no se llega a la
//   base (Postgres apagado: ECONNREFUSED, ENOTFOUND, ETIMEDOUT, EHOSTUNREACH o sin respuesta en 3 s), devuelve
//   { motivo } y las pruebas con base se saltean con ese aviso; las que no la necesitan siguen corriendo. Cualquier
//   otro error es una DATABASE_URL_TEST mal escrita (contraseña equivocada 28P01, base que no existe 3D000…) y la
//   prueba FALLA con un mensaje que lo dice: si se salteara, npm test daría verde sin haber probado nada. Si
//   responde: toma un candado de la base (pg_advisory_lock, en una conexión propia, hasta cerrarBase) y recién ahí
//   DROP SCHEMA public CASCADE, CREATE SCHEMA public y todas las migraciones. Con el candado, dos archivos nunca usan
//   mupa_test a la vez aunque se corran en paralelo (node --test sin --test-concurrency=1, un IDE): el segundo espera.
// - salteoVisible(base): sin base, una prueba salteada más, así el resumen final dice "skipped" (el describe salteado
//   no registra sus pruebas y el total parecía un verde completo).
// - levantar(env): la app entera (como en producción, con URL_PUBLICA https://mupa.ar/ y TRUST_PROXY=1, así cada
//   prueba elige la IP con X-Forwarded-For) sobre un build falso, en un puerto libre y con los límites en cero.
//   Devuelve pedir(), crearUsuario(rol), cookiePara(rol) y cerrar(). levantar(env, { registroTareas }) le pasa a la
//   app un registro de tareas diarias (server/tareas.js) para GET /estado; { almacen } le pasa el de las fotos.
// - multipart(): un cuerpo multipart/form-data para POST /fotos (E3.1).
// - escucharLogs() y contarConsultas(): lo que el servicio escribe en el log y las consultas a la base.
// Las contraseñas de las cuentas de prueba se generan al azar y viven solo en memoria.
import { randomBytes } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import pg from 'pg'
import { crearApp, estaticosDelBuild } from '../app.js'
import { hashClave, vencimientoTemporal } from '../auth/claves.js'
import { crearSesion, nombreCookie } from '../auth/sesiones.js'
import { leerConfig } from '../config.js'
import { crearConexion, probarBase } from '../db/conexion.js'
import { exigirBaseDePrueba } from '../db/guardas.js'
import { crearMigrador } from '../db/migrar.js'
import { codigoDeError } from '../log.js'
import { crearMuseoPublico } from '../museo.js'
import { cargarBuild, crearSsr } from '../ssr.js'

export const PREFIJO_API = '/administracion/api'
const URL_PRUEBA = process.env.DATABASE_URL_TEST

/** @type {import('sequelize').Sequelize | null} */
let sequelize = null
/** La conexión que tiene el candado de mupa_test mientras corre el archivo. @type {pg.Client | null} */
let candado = null
// Un número cualquiera, siempre el mismo: identifica el candado de las pruebas con base.
const CANDADO_PRUEBAS = 7_314_001
// No se llega a la base: las pruebas con base se saltean. TOPE es el de probarBase (no contestó en 3 s).
const SIN_CONEXION = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'TOPE'])
// Se llega pero la URL está mal: la prueba falla con esto.
const MAL_CONFIGURADA = {
  '28P01': 'el usuario o la contraseña no son correctos',
  '3D000': 'esa base no existe en el servidor (creala o corregí el nombre)',
  '28000': 'Postgres no deja entrar a ese usuario (pg_hba.conf)',
}

/**
 * Deja la base de prueba vacía y migrada. Devuelve { sequelize } o { motivo } (sin base: se saltean).
 * @returns {Promise<{ sequelize: import('sequelize').Sequelize, motivo?: undefined } | { motivo: string, sequelize?: undefined }>}
 */
export async function prepararBase() {
  if (!URL_PRUEBA) return saltear('no está DATABASE_URL_TEST (en .env, ver .env.example)')
  // Antes de abrir la conexión: si no es local o no termina en _test, tira y la prueba falla.
  exigirBaseDePrueba(URL_PRUEBA)
  sequelize = crearConexion(leerConfig({}), { url: URL_PRUEBA })
  try {
    await probarBase(sequelize, 3_000)
  } catch (err) {
    await sequelize.close().catch(() => {})
    sequelize = null
    const codigo = codigoDeError(err)
    if (SIN_CONEXION.has(codigo)) return saltear(`la base de prueba no responde (${codigo})`)
    // El mensaje de Postgres o del driver nunca trae la URL ni la contraseña.
    throw new Error(
      `DATABASE_URL_TEST está mal configurada: ${MAL_CONFIGURADA[codigo] ?? err.message}${codigo ? ` (${codigo})` : ''}. ` +
        'Corregila en .env o dejala vacía para saltear las pruebas con base.',
    )
  }
  // Espera a que ningún otro archivo de pruebas esté usando la base. Si este proceso termina de golpe, la conexión se
  // cierra y Postgres suelta el candado solo.
  candado = new pg.Client({ connectionString: URL_PRUEBA })
  await candado.connect()
  await candado.query('SELECT pg_advisory_lock($1::bigint)', [CANDADO_PRUEBAS])
  await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  await crearMigrador(sequelize).up()
  return { sequelize }
}

function saltear(motivo) {
  const texto = `sin base: ${motivo}. Las pruebas con base se saltean; las demás corren igual.`
  console.warn(`AVISO: ${texto}`)
  return { motivo: texto }
}

export async function cerrarBase() {
  await sequelize?.close()
  sequelize = null
  // Al cerrar la conexión, Postgres suelta el candado.
  await candado?.end().catch(() => {})
  candado = null
}

/** Sin base, registra una prueba salteada con el motivo: el resumen de node:test la cuenta en "skipped". */
export function salteoVisible(base) {
  if (base.motivo) test('pruebas con base', { skip: base.motivo }, () => {})
}

// Un build falso, como el de esqueleto.test.js: la plantilla con sus marcas y un render que no es React.
let carpetaBuild = null
function buildFalso() {
  if (carpetaBuild) return carpetaBuild
  carpetaBuild = mkdtempSync(join(tmpdir(), 'mupa-pruebas-'))
  mkdirSync(join(carpetaBuild, 'client', 'assets'), { recursive: true })
  mkdirSync(join(carpetaBuild, 'server'))
  writeFileSync(
    join(carpetaBuild, 'client', 'index.html'),
    '<!doctype html><html lang="es"><head><!--head--></head><body><div id="root"><!--app--></div><!--estado--></body></html>\n',
  )
  writeFileSync(join(carpetaBuild, 'client', 'assets', 'app-abc123.js'), 'console.log(1)\n')
  writeFileSync(join(carpetaBuild, 'client', 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>\n')
  // La página del panel (dist/panel/index.html): sin ella, el panel avisaría "panel_sin_build" en cada levantar().
  mkdirSync(join(carpetaBuild, 'panel', 'assets'), { recursive: true })
  writeFileSync(join(carpetaBuild, 'panel', 'index.html'), '<!doctype html><title>Panel del MuPa</title><div id="raiz"></div>\n')
  writeFileSync(
    join(carpetaBuild, 'server', 'entry-server.js'),
    "export function render(estado) { return '<main data-pagina=\"' + estado.pagina + '\"></main>' }\n",
  )
  process.once('exit', () => rmSync(carpetaBuild, { recursive: true, force: true }))
  return carpetaBuild
}

let contador = 0
/** Una contraseña al azar que cumple las reglas (y no se escribe en ningún lado). */
export const claveAlAzar = () => `frase de prueba ${randomBytes(12).toString('base64url')}`

/**
 * Crea una cuenta directamente en la base.
 * @param {'admin' | 'editor'} [rol]
 * @param {{ activo?: boolean, temporal?: boolean, email?: string, nombre?: string }} [opciones]
 *   temporal: con debe_cambiar_clave y vencimiento a 72 h (la clave es la "temporal")
 */
export async function crearUsuario(rol = 'editor', { activo = true, temporal = false, email, nombre } = {}) {
  contador += 1
  const clave = claveAlAzar()
  const usuario = await sequelize.models.Usuario.create({
    email: email ?? `${rol}-${contador}-${randomBytes(3).toString('hex')}@example.com`,
    nombre: nombre ?? `Persona de prueba ${contador}`,
    rol,
    activo,
    passwordHash: await hashClave(clave),
    debeCambiarClave: temporal,
    claveTemporalVence: temporal ? vencimientoTemporal() : null,
  })
  return { usuario, clave, email: usuario.email }
}

/**
 * Pedido HTTP crudo (fetch no deja poner el Host ni Sec-Fetch-Site).
 * @param {number} puerto
 * @param {string} metodo
 * @param {string} ruta  absoluta (/administracion/api/…) o relativa a la API si empieza con "api:"
 * @param {object} [o]
 * @param {string} [o.host]
 * @param {string} [o.cookie]
 * @param {string | null} [o.origen]  cabecera Origin
 * @param {string | null} [o.sitio]  Sec-Fetch-Site; por defecto same-origin en lo que no es GET/HEAD (como un
 *   navegador desde el panel); null para no mandarla
 * @param {unknown} [o.cuerpo]  objeto (va como JSON), texto o Buffer (bytes tal cual: p. ej. UTF-8 inválido)
 * @param {string | null} [o.tipo]  Content-Type; por defecto application/json si hay cuerpo
 * @param {string} [o.ip]  X-Forwarded-For (la app de prueba confía en un salto)
 */
export function pedir(puerto, metodo, ruta, o = {}) {
  const seguro = metodo === 'GET' || metodo === 'HEAD'
  const cabeceras = { host: o.host ?? 'mupa.ar', 'x-forwarded-for': o.ip ?? '198.51.100.1', ...o.cabeceras }
  const sitio = o.sitio === undefined ? (seguro ? undefined : 'same-origin') : o.sitio
  if (sitio != null) cabeceras['sec-fetch-site'] = sitio
  if (o.origen != null) cabeceras.origin = o.origen
  if (o.cookie) cabeceras.cookie = o.cookie
  let cuerpo = null
  if (o.cuerpo !== undefined) {
    cuerpo = Buffer.isBuffer(o.cuerpo)
      ? o.cuerpo
      : Buffer.from(typeof o.cuerpo === 'string' ? o.cuerpo : JSON.stringify(o.cuerpo))
    const tipo = o.tipo === undefined ? 'application/json' : o.tipo
    if (tipo) cabeceras['content-type'] = tipo
    cabeceras['content-length'] = String(cuerpo.length)
  }
  const camino = ruta.startsWith('api:') ? PREFIJO_API + ruta.slice(4) : ruta
  return new Promise((resolver, rechazar) => {
    const pedido = request({ host: '127.0.0.1', port: puerto, path: camino, method: metodo, headers: cabeceras }, (res) => {
      let texto = ''
      res.setEncoding('utf8')
      res.on('data', (parte) => (texto += parte))
      res.on('end', () => {
        let json
        if (/application\/json/.test(res.headers['content-type'] ?? '')) json = JSON.parse(texto)
        resolver({ status: res.statusCode, h: res.headers, texto, json })
      })
    })
    pedido.on('error', rechazar)
    pedido.end(cuerpo ?? undefined)
  })
}

/**
 * Un cuerpo multipart/form-data armado a mano (como lo manda un navegador), para pedir() con { cuerpo, tipo }.
 * @param {{ campos?: Record<string, string>, archivos?: { campo?: string, nombre?: string, tipo?: string, datos: Buffer }[],
 *   boundary?: string }} [partes]
 * @returns {{ cuerpo: Buffer, tipo: string }}
 */
export function multipart({ campos = {}, archivos = [], boundary = `----mupa${randomBytes(8).toString('hex')}` } = {}) {
  const trozos = []
  for (const [nombre, valor] of Object.entries(campos)) {
    trozos.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${nombre}"\r\n\r\n${valor}\r\n`))
  }
  for (const { campo = 'foto', nombre = 'foto.jpg', tipo = 'image/jpeg', datos } of archivos) {
    trozos.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${campo}"; filename="${nombre}"\r\n` +
          `Content-Type: ${tipo}\r\n\r\n`,
      ),
      datos,
      Buffer.from('\r\n'),
    )
  }
  trozos.push(Buffer.from(`--${boundary}--\r\n`))
  return { cuerpo: Buffer.concat(trozos), tipo: `multipart/form-data; boundary=${boundary}` }
}

/** "nombre=valor" de la cookie de sesión de una respuesta (para mandarla en el pedido siguiente), o null. */
export function cookieDe(respuesta, nombre) {
  const lista = respuesta.h['set-cookie'] ?? []
  const linea = lista.find((c) => c.startsWith(`${nombre}=`))
  return linea ? linea.split(';')[0] : null
}

/**
 * La app entera en un puerto libre, con la base de prueba.
 * @param {Record<string, string | undefined>} [env]  pisa la configuración de prueba (undefined: la saca)
 * @param {{ registroTareas?: ReturnType<typeof import('../tareas.js').crearRegistroDeTareas>,
 *   almacen?: ReturnType<typeof import('../fotos/almacen.js').crearAlmacen> }} [opciones]
 *   registroTareas: el registro de las tareas diarias que lee GET /estado (sin él, ninguna falló); almacen: el de las
 *   fotos (sin él, la app arma uno)
 */
export async function levantar(env = {}, { registroTareas = null, almacen = null } = {}) {
  const dir = buildFalso()
  const variables = {
    NODE_ENV: 'production',
    URL_PUBLICA: 'https://mupa.ar/',
    RENDER_EXTERNAL_URL: 'https://mupa-web.onrender.com',
    DATABASE_URL: URL_PRUEBA,
    DIR_BUILD: dir,
    TRUST_PROXY: '1',
    ...env,
  }
  const config = leerConfig(Object.fromEntries(Object.entries(variables).filter(([, v]) => v !== undefined)))
  const build = await cargarBuild(dir)
  const ssr = crearSsr({ config, obtener: build.obtener, museoPublico: crearMuseoPublico(config, { sequelize }) })
  const app = crearApp({
    config,
    ssr,
    sequelize,
    estaticos: estaticosDelBuild(dir),
    fechaHome: build.fecha,
    registroTareas,
    almacen,
  })
  const servidor = app.listen(0, '127.0.0.1')
  await new Promise((r) => servidor.once('listening', r))
  const puerto = servidor.address().port
  const cookie = nombreCookie(config)
  return {
    config,
    puerto,
    /** Nombre de la cookie de sesión de esta app (__Secure-mupa_sesion con https). */
    nombreCookie: cookie,
    pedir: (metodo, ruta, o = {}) => pedir(puerto, metodo, ruta, { host: config.hostPublico, ...o }),
    crearUsuario,
    /** Una cuenta con una sesión abierta (creada directo en la base): { usuario, clave, email, cookie, token }. */
    async cookiePara(rol = 'editor', opciones = {}) {
      const datos = await crearUsuario(rol, opciones)
      const token = await crearSesion(sequelize, { usuarioId: datos.usuario.id, userAgent: 'prueba' })
      return { ...datos, token, cookie: `${cookie}=${token}` }
    },
    /** Otra sesión para una cuenta que ya existe. */
    async otraSesion(usuarioId) {
      const token = await crearSesion(sequelize, { usuarioId, userAgent: 'prueba' })
      return { token, cookie: `${cookie}=${token}` }
    },
    cerrar: () => new Promise((r) => servidor.close(r)),
  }
}

/** Junta lo que el servicio escribe con console.log / console.error (el log de server/log.js) hasta detener(). */
export function escucharLogs() {
  const lineas = []
  const original = { log: console.log, error: console.error }
  console.log = (...args) => lineas.push(args.join(' '))
  console.error = (...args) => lineas.push(args.join(' '))
  return {
    lineas,
    eventos: () => lineas.flatMap((l) => (l.startsWith('{') ? [JSON.parse(l)] : [])),
    detener() {
      console.log = original.log
      console.error = original.error
    },
  }
}

/** Anota cada consulta SQL que se manda a la base hasta detener(). */
export function contarConsultas() {
  const consultas = []
  const antes = sequelize.options.logging
  sequelize.options.logging = (sql) => consultas.push(sql)
  return {
    consultas,
    detener() {
      sequelize.options.logging = antes
    },
  }
}

/** Una consulta SQL suelta contra la base de prueba (para mover relojes y mirar filas). */
export async function sql(texto, replacements) {
  const [filas] = await sequelize.query(texto, { replacements })
  return filas
}
