// Lo de la autenticación y la API del panel que se prueba sin base (corre siempre, también sin DATABASE_URL_TEST):
// contraseñas y temporales (server/auth/claves.js), reglas de las contraseñas y esquemas (compartido/esquemas/), ids,
// traducción de errores (server/errores.js), avisos de la configuración y, con la app sin base, el orden CSRF ->
// Content-Type -> 503.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, before, describe, mock, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import argon2 from 'argon2'
import express from 'express'
import { esquemaCambioClave, problemaDeClave } from '../../compartido/esquemas/cuenta.js'
import { esquemaIngreso } from '../../compartido/esquemas/sesion.js'
import { esquemaAltaUsuario, esquemaCambioUsuario } from '../../compartido/esquemas/usuarios.js'
import { parseId } from '../api/entrada.js'
import { crearApi } from '../api/indice.js'
import { formaDeTemporal, generarTemporal, hashClave, hashDeRelleno, verificarClave } from '../auth/claves.js'
import { hashDeToken, leerToken, nombreCookie } from '../auth/sesiones.js'
import { avisosDeConfig, leerConfig } from '../config.js'
import { httpError, manejadorDeErrores } from '../errores.js'

/** Lo que el código escribe en el log (console.log / console.error) mientras corre fn, como objetos. */
async function conLog(fn) {
  const lineas = []
  const original = { log: console.log, error: console.error }
  console.log = (texto) => lineas.push(texto)
  console.error = (texto) => lineas.push(texto)
  try {
    const valor = await fn()
    return { valor, eventos: lineas.flatMap((l) => (String(l).startsWith('{') ? [JSON.parse(l)] : [])) }
  } finally {
    console.log = original.log
    console.error = original.error
  }
}

// Primero de todo, antes de que otra prueba de este archivo calcule el hash de relleno (se calcula una vez por proceso).
test('hash de relleno: si el primer cálculo falla, el siguiente pedido lo vuelve a intentar', async () => {
  const falla = mock.method(argon2, 'hash', async () => {
    throw new Error('sin memoria (simulado)')
  })
  try {
    await assert.rejects(hashDeRelleno(), /sin memoria/)
  } finally {
    falla.mock.restore()
  }
  assert.match(await hashDeRelleno(), /^\$argon2id\$/)
})

describe('contraseñas', () => {
  test('argon2id con los parámetros de OWASP; NFKC: la misma frase con la tilde compuesta o precompuesta', async () => {
    const clave = 'canción de cuna larga'
    const hash = await hashClave(clave)
    assert.match(hash, /^\$argon2id\$v=19\$m=19456,p=1,t=2\$/)
    assert.equal(await verificarClave(hash, clave), true)
    assert.equal(await verificarClave(hash, clave.normalize('NFD')), true)
    assert.equal(await verificarClave(hash, 'cancion de cuna larga'), false)
    // Un hash roto cuenta como incorrecto, no como error, con un aviso en el log (el id, si se pasa; nunca la clave).
    const roto = await conLog(() => verificarClave('no es un hash', clave, { usuarioId: 7 }))
    assert.equal(roto.valor, false)
    assert.deepEqual(roto.eventos.map(({ evento, usuario_id }) => ({ evento, usuario_id })), [{ evento: 'hash_invalido', usuario_id: 7 }])
    assert.match(await hashDeRelleno(), /^\$argon2id\$/)
    assert.equal(hashDeRelleno(), hashDeRelleno(), 'se calcula una vez')
  })

  test('temporal: 16 caracteres sin confusiones, en grupos de 4, al azar', () => {
    const vistas = new Set()
    for (let i = 0; i < 200; i++) {
      const t = generarTemporal()
      assert.match(t, /^[a-km-np-z2-9]{4}(-[a-km-np-z2-9]{4}){3}$/)
      assert.doesNotMatch(t, /[01loI]/)
      vistas.add(t)
    }
    assert.equal(vistas.size, 200)
  })

  test('temporal escrita a mano: mayúsculas, sin guiones o con espacios vuelven a su forma; lo demás, null', () => {
    const t = generarTemporal()
    for (const escrita of [t, t.toUpperCase(), t.replaceAll('-', ''), t.replaceAll('-', ' '), ` ${t.toUpperCase().replaceAll('-', ' – ')} `]) {
      assert.equal(formaDeTemporal(escrita), t, escrita)
    }
    for (const otra of ['una frase cualquiera larga', 'k7mq-x3tf-9wrd-hp2', 'k7mq-x3tf-9wrd-hp2c-a', 'k7mq-x3tf-9wrd-hp0c', 'k7mq-x3tf-9wrd-hplc']) {
      assert.equal(formaDeTemporal(otra), null, otra)
    }
  })

  test('reglas: de 15 a 128, sin palabras del museo, sin el correo, sin repetir, distinta de la actual', () => {
    assert.match(problemaDeClave('corta'), /al menos 15/)
    assert.equal(problemaDeClave('quince letras!!'), null)
    assert.equal(problemaDeClave('á'.repeat(14) + 'b'), null, 'se cuentan caracteres, no bytes')
    assert.match(problemaDeClave('a'.repeat(129)), /hasta 128/)
    assert.match(problemaDeClave('🦖'.repeat(20)), /mismo carácter/)
    assert.match(problemaDeClave('el MUSEO de noche es lindo'), /"museo"/)
    assert.match(problemaDeClave('Paleontológico y algo más'), /"paleontológico"/)
    assert.match(problemaDeClave('voy al mupa los sábados'), /"mupa"/)
    assert.match(problemaDeClave('soy juan.perez y nada más', { email: 'juan.perez@example.com' }), /tu correo/)
    // Una parte local corta (menos de 4) no se busca.
    assert.equal(problemaDeClave('ana banana manzana pera', { email: 'ana@example.com' }), null)
    assert.match(problemaDeClave('una frase cualquiera', { actual: 'una frase cualquiera' }), /distinta/)
    // La temporal en mayúsculas, sin guiones o con espacios sigue siendo la misma: la conoce quien la dio.
    const t = generarTemporal()
    for (const nueva of [t.toUpperCase(), t.replaceAll('-', ''), t.replaceAll('-', ' '), `${t.toUpperCase()}!`]) {
      assert.match(problemaDeClave(nueva, { actual: t }) ?? '', /distinta/, nueva)
    }
    assert.match(problemaDeClave('Una Frase-Cualquiera', { actual: 'una frase cualquiera' }), /distinta/)
    assert.equal(problemaDeClave('otra frase cualquiera', { actual: 'una frase cualquiera' }), null)
    // Sin letras ni números en la actual no hay esqueleto que comparar: no se confunde con otra sin letras.
    assert.equal(problemaDeClave('?'.repeat(7) + '!'.repeat(8), { actual: '#'.repeat(15) }), null)
    // Tal como llega, hasta 256 unidades (el tope del ingreso): 100 letras con dos tildes separadas (NFD: ệ, ậ, ộ como
    // letra + punto abajo + circunflejo) y sus espacios son 320 unidades y 120 caracteres, y no se aceptan (después no
    // dejarían entrar); 80 (256 unidades) sí.
    const letra = (i) => ['e', 'a', 'o'][i % 3] + String.fromCodePoint(0x0323, 0x0302)
    const frase = (n) => Array.from({ length: n }, (_, i) => letra(i) + (i % 5 === 4 ? ' ' : '')).join('')
    assert.ok(frase(100).length > 256 && [...frase(100).normalize('NFKC')].length <= 128)
    assert.match(problemaDeClave(frase(100)), /hasta 128/)
    assert.ok(frase(80).length <= 256)
    assert.equal(problemaDeClave(frase(80)), null)
    assert.equal(esquemaIngreso.safeParse({ email: 'a@b.c', clave: frase(80) }).success, true)
    assert.equal(esquemaCambioClave.safeParse({ actual: frase(80), nueva: 'otra frase cualquiera' }).success, true)
  })

  test('el token de la cookie: solo el que tiene la forma de los que generamos; en la base, su SHA-256', () => {
    const config = leerConfig({ URL_PUBLICA: 'https://mupa.ar/' })
    assert.equal(nombreCookie(config), '__Secure-mupa_sesion')
    assert.equal(nombreCookie(leerConfig({ URL_PUBLICA: 'http://127.0.0.1:5190/' })), 'mupa_sesion')
    const token = 'A'.repeat(43)
    const req = (cookie) => ({ get: (n) => (n === 'cookie' ? cookie : undefined) })
    assert.equal(leerToken(req(`otra=1; __Secure-mupa_sesion=${token}; x=y`), config), token)
    assert.equal(leerToken(req(`mupa_sesion=${token}`), config), null)
    assert.equal(leerToken(req('__Secure-mupa_sesion=corto'), config), null)
    assert.equal(leerToken(req(undefined), config), null)
    assert.match(hashDeToken(token), /^[0-9a-f]{64}$/)
  })
})

describe('esquemas y entrada', () => {
  test('el correo va a minúsculas y sin espacios; las claves de más se descartan', () => {
    assert.deepEqual(esquemaIngreso.parse({ email: ' A@B.COM ', clave: 'x', extra: 1 }), { email: 'a@b.com', clave: 'x' })
    assert.deepEqual(esquemaAltaUsuario.parse({ nombre: ' Ana ', email: 'Ana@Example.com', rol: 'editor', passwordHash: 'x' }), {
      nombre: 'Ana',
      email: 'ana@example.com',
      rol: 'editor',
    })
    assert.throws(() => esquemaAltaUsuario.parse({ nombre: 'Ana\nB', email: 'ana@example.com', rol: 'editor' }))
    assert.throws(() => esquemaAltaUsuario.parse({ nombre: 'Ana', email: 'ana@example.com', rol: 'jefe' }))
    // Un surrogate suelto (Postgres lo guardaría como U+FFFD) o U+FFFD (bytes que no eran UTF-8): 400 con su mensaje.
    for (const nombre of ['Ana \ud800', 'Ana \udc00 B', 'Ana �']) {
      const r = esquemaCambioUsuario.safeParse({ nombre })
      assert.equal(r.success, false, JSON.stringify(nombre))
      assert.equal(r.error.issues[0].message, 'El nombre tiene caracteres que no se pudieron leer. Escribilo de nuevo.')
    }
    // Un emoji (un par de surrogates bien formado) y las tildes, sí.
    assert.deepEqual(esquemaCambioUsuario.parse({ nombre: ' Ñandú 🦖 Pérez ' }), { nombre: 'Ñandú 🦖 Pérez' })
    assert.throws(() => esquemaCambioUsuario.parse({}), /nada para cambiar/)
    assert.deepEqual(esquemaCambioUsuario.parse({ activo: false, id: 3 }), { activo: false })
    assert.throws(() => esquemaIngreso.parse({ email: 'a@b.c', clave: 'x'.repeat(257) }))
    const r = esquemaCambioClave.safeParse({ actual: 'x', nueva: 'corta' })
    assert.deepEqual(r.error.issues.map((i) => i.path.join('.')), ['nueva'])
  })

  test('parseId: enteros positivos de int4', () => {
    assert.equal(parseId('1'), 1)
    assert.equal(parseId('2147483647'), 2147483647)
    for (const malo of ['0', '-1', '1.5', '1e3', ' 1', '2147483648', 'abc', '', undefined]) assert.equal(parseId(malo), null, String(malo))
  })
})

test('avisos del arranque: TRUST_PROXY=0 en producción detrás del proxy de Render', () => {
  const base = { NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', SIN_BASE: '0', DATABASE_URL: 'postgres://u:p@127.0.0.1/x' }
  const evento = (env) => avisosDeConfig(leerConfig(env)).map(([e]) => e)
  assert.deepEqual(evento({ ...base, RENDER_EXTERNAL_URL: 'https://mupa-web.onrender.com' }), ['trust_proxy_cero'])
  assert.deepEqual(evento({ ...base, RENDER: 'true' }), ['trust_proxy_cero'])
  assert.deepEqual(evento({ ...base, RENDER: 'true', TRUST_PROXY: '1' }), [])
  // En esta PC (sin Render) o fuera de producción, nada.
  assert.deepEqual(evento(base), [])
  assert.deepEqual(evento({ RENDER_EXTERNAL_URL: 'https://mupa-web.onrender.com' }), [])
})

describe('la API sin base', () => {
  let servidor
  let puerto
  before(async () => {
    const config = leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_se_usa' })
    const app = express()
    app.use('/administracion/api', crearApi({ config, sequelize: null }))
    app.use(manejadorDeErrores())
    servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    puerto = servidor.address().port
  })
  after(() => new Promise((r) => servidor.close(r)))

  function pedir(metodo, ruta, cabeceras = {}, cuerpo) {
    return new Promise((resolver, rechazar) => {
      const p = request({ host: '127.0.0.1', port: puerto, path: ruta, method: metodo, headers: { host: 'mupa.ar', ...cabeceras } }, (res) => {
        let texto = ''
        res.setEncoding('utf8')
        res.on('data', (d) => (texto += d))
        res.on('end', () => resolver({ status: res.statusCode, json: texto ? JSON.parse(texto) : null, texto }))
      })
      p.on('error', rechazar)
      p.end(cuerpo)
    })
  }

  test('primero el origen (403), después el Content-Type (415) y recién ahí la base (503)', async () => {
    const json = { 'content-type': 'application/json' }
    assert.equal((await pedir('POST', '/administracion/api/sesion', { ...json, 'sec-fetch-site': 'cross-site' }, '{}')).status, 403)
    assert.equal((await pedir('POST', '/administracion/api/sesion', { ...json, origin: 'https://evil.example' }, '{}')).status, 403)
    assert.equal((await pedir('POST', '/administracion/api/sesion', { 'sec-fetch-site': 'same-origin', 'content-type': 'text/plain' }, 'x')).status, 415)
    const sinBase = await pedir('POST', '/administracion/api/sesion', { ...json, 'sec-fetch-site': 'same-origin' }, '{}')
    assert.equal(sinBase.status, 503)
    assert.match(sinBase.json.error, /sin base/)
    assert.equal((await pedir('POST', '/administracion/api/sesion', { ...json, origin: 'https://mupa.ar' }, '{}')).status, 503)
    assert.equal((await pedir('GET', '/administracion/api/usuarios')).status, 503)
  })
})

describe('traducción de errores en la API', () => {
  let servidor
  let puerto
  before(async () => {
    const app = express()
    app.get('/administracion/api/zod', () => esquemaAltaUsuario.parse({ nombre: '', email: 'x', rol: 'x' }))
    app.get('/administracion/api/unico', () => {
      throw Object.assign(new Error('Validation error'), {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email', value: 'secreto@example.com' }],
      })
    })
    app.get('/administracion/api/deadlock', () => {
      throw Object.assign(new Error('deadlock detected'), { parent: { code: '40P01' } })
    })
    app.get('/administracion/api/propio', () => {
      throw httpError(409, 'Mensaje para la persona.', { campos: { a: 'b' } })
    })
    app.get('/administracion/api/interno', () => {
      throw new Error('detalle interno /ruta/secreta')
    })
    // Fuera de la API, lo mismo es un error del servidor (p. ej. un dato de la base que no pasa su esquema en el SSR).
    app.get('/fuera/zod', () => esquemaAltaUsuario.parse({}))
    app.get('/fuera/unico', () => {
      throw Object.assign(new Error('Validation error'), { name: 'SequelizeUniqueConstraintError', errors: [{ path: 'email' }] })
    })
    app.get('/fuera/deadlock', () => {
      throw Object.assign(new Error('deadlock detected'), { parent: { code: '40P01' } })
    })
    app.get('/fuera/propio', () => {
      throw httpError(404, 'No existe.')
    })
    app.use(manejadorDeErrores())
    servidor = app.listen(0, '127.0.0.1')
    await new Promise((r) => servidor.once('listening', r))
    puerto = servidor.address().port
  })
  after(() => new Promise((r) => servidor.close(r)))

  const pedir = (ruta) =>
    new Promise((resolver, rechazar) => {
      request({ host: '127.0.0.1', port: puerto, path: ruta }, (res) => {
        let texto = ''
        res.setEncoding('utf8')
        res.on('data', (d) => (texto += d))
        res.on('end', () => resolver({ status: res.statusCode, texto, tipo: res.headers['content-type'] }))
      })
        .on('error', rechazar)
        .end()
    })

  test('zod 400 con campos; unique 409 sin el valor; 40P01 409; propio tal cual; interno 500 genérico', async () => {
    const zod = await pedir('/administracion/api/zod')
    assert.equal(zod.status, 400)
    const cuerpo = JSON.parse(zod.texto)
    assert.equal(cuerpo.error, 'Revisá los datos.')
    assert.deepEqual(Object.keys(cuerpo.campos).sort(), ['email', 'nombre', 'rol'])

    const unico = await pedir('/administracion/api/unico')
    assert.equal(unico.status, 409)
    assert.deepEqual(JSON.parse(unico.texto), { error: 'Ya hay una cuenta con ese correo.', campos: { email: 'Ya hay una cuenta con ese correo.' } })
    assert.ok(!unico.texto.includes('secreto'))

    const deadlock = await pedir('/administracion/api/deadlock')
    assert.equal(deadlock.status, 409)
    assert.match(JSON.parse(deadlock.texto).error, /Probá de nuevo/)

    const propio = await pedir('/administracion/api/propio')
    assert.equal(propio.status, 409)
    assert.deepEqual(JSON.parse(propio.texto), { error: 'Mensaje para la persona.', campos: { a: 'b' } })

    const errorOriginal = console.error
    console.error = () => {}
    try {
      const interno = await pedir('/administracion/api/interno')
      assert.equal(interno.status, 500)
      assert.deepEqual(JSON.parse(interno.texto), { error: 'Algo salió mal. Probá de nuevo en unos minutos.' })
    } finally {
      console.error = errorOriginal
    }

  })

  test('fuera de la API, zod, unique y 40P01 son un 500 con su línea en el log (no un 400 o 409 del visitante)', async () => {
    for (const ruta of ['/fuera/zod', '/fuera/unico', '/fuera/deadlock']) {
      const { valor: r, eventos } = await conLog(() => pedir(ruta))
      assert.equal(r.status, 500, ruta)
      assert.match(r.tipo, /text\/html/, ruta)
      assert.ok(!r.texto.includes('Validation') && !r.texto.includes('deadlock'), ruta)
      assert.deepEqual(eventos.map((e) => e.evento), ['error_500'], ruta)
    }
    // Un httpError sí vale en cualquier ruta (status y, fuera de la API, el texto corto de siempre).
    const propio = await pedir('/fuera/propio')
    assert.equal(propio.status, 404)
    assert.match(propio.tipo, /text\/plain/)
  })
})

// Sin argon2 (el binario nativo no carga): en un proceso aparte, con un hook de resolución que hace fallar
// import('argon2'), se arma la app entera como servidor.js (sobre un build falso y una base falsa en la que ningún
// correo existe) y se le pide la Home y dos ingresos.
const PROCESO_SIN_ARGON2 = `
import { registerHooks } from 'node:module'
registerHooks({
  resolve(especificador, contexto, siguiente) {
    if (especificador === 'argon2') {
      throw Object.assign(new Error('argon2: no se pudo cargar el binario (simulado)'), { code: 'ERR_DLOPEN_FAILED' })
    }
    return siguiente(especificador, contexto)
  },
})
const { mkdirSync, writeFileSync } = await import('node:fs')
const { request } = await import('node:http')
const { join } = await import('node:path')
const [server, dir] = process.argv.slice(2)
mkdirSync(join(dir, 'client', 'assets'), { recursive: true })
mkdirSync(join(dir, 'server'))
writeFileSync(join(dir, 'client', 'index.html'), '<!doctype html><html lang="es"><head><!--head--></head><body><div id="root"><!--app--></div><!--estado--></body></html>')
writeFileSync(join(dir, 'server', 'entry-server.js'), "export function render() { return '<main>Home</main>' }")
const { crearApp, estaticosDelBuild } = await import(server + 'app.js')
const { leerConfig } = await import(server + 'config.js')
const { crearMuseoPublico } = await import(server + 'museo.js')
const { cargarBuild, crearSsr } = await import(server + 'ssr.js')
const config = leerConfig({ NODE_ENV: 'production', URL_PUBLICA: 'https://mupa.ar/', DATABASE_URL: 'postgres://nadie:nada@127.0.0.1:1/no_se_usa', DIR_BUILD: dir })
const build = await cargarBuild(dir)
const ssr = crearSsr({ config, obtener: build.obtener, museoPublico: crearMuseoPublico(config) })
const sequelize = { models: { Usuario: { findOne: async () => null } } }
const app = crearApp({ config, ssr, sequelize, estaticos: estaticosDelBuild(dir), fechaHome: build.fecha })
const servidor = app.listen(0, '127.0.0.1')
await new Promise((r) => servidor.once('listening', r))
const pedir = (metodo, ruta, cuerpo) =>
  new Promise((resolver, rechazar) => {
    const cabeceras = { host: 'mupa.ar' }
    if (cuerpo) Object.assign(cabeceras, { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' })
    const p = request({ host: '127.0.0.1', port: servidor.address().port, path: ruta, method: metodo, headers: cabeceras }, (res) => {
      let texto = ''
      res.setEncoding('utf8')
      res.on('data', (d) => (texto += d))
      res.on('end', () => resolver({ status: res.statusCode, tipo: res.headers['content-type'], texto }))
    })
    p.on('error', rechazar)
    p.end(cuerpo)
  })
const ingreso = JSON.stringify({ email: 'nadie@example.com', clave: 'una clave cualquiera' })
const resultado = { home: await pedir('GET', '/'), ingresos: [await pedir('POST', '/administracion/api/sesion', ingreso), await pedir('POST', '/administracion/api/sesion', ingreso)] }
servidor.close()
console.log('RESULTADO ' + JSON.stringify(resultado))
`

test('sin argon2, el sitio arranca y sirve la Home; entrar al panel da 503 en JSON y el log lo dice una vez', () => {
  const carpeta = mkdtempSync(join(tmpdir(), 'mupa-sin-argon2-'))
  try {
    const archivo = join(carpeta, 'proceso.mjs')
    writeFileSync(archivo, PROCESO_SIN_ARGON2)
    const server = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..')).href + '/'
    const r = spawnSync(process.execPath, [archivo, server, join(carpeta, 'build')], { encoding: 'utf8', timeout: 60_000 })
    assert.equal(r.status, 0, r.stderr)
    const lineas = `${r.stdout}\n${r.stderr}`.split('\n')
    const resultado = JSON.parse(lineas.find((l) => l.startsWith('RESULTADO ')).slice('RESULTADO '.length))
    assert.equal(resultado.home.status, 200)
    assert.match(resultado.home.texto, /<main>Home<\/main>/)
    for (const ingreso of resultado.ingresos) {
      assert.equal(ingreso.status, 503)
      assert.match(ingreso.tipo, /application\/json/)
      assert.deepEqual(JSON.parse(ingreso.texto), {
        error: 'El panel no está disponible en este momento. Probá más tarde o avisale a quien mantiene el sitio.',
      })
    }
    const eventos = lineas.flatMap((l) => (l.startsWith('{') ? [JSON.parse(l)] : []))
    const avisos = eventos.filter((e) => e.evento === 'argon2_no_disponible')
    assert.equal(avisos.length, 1, 'una sola vez, aunque se intentó al arrancar y en cada ingreso')
    assert.equal(avisos[0].nivel, 'error')
    assert.match(avisos[0].mensaje, /argon2: no se pudo cargar el binario \(simulado\)/)
    assert.equal(avisos[0].codigo, 'ERR_DLOPEN_FAILED')
  } finally {
    rmSync(carpeta, { recursive: true, force: true })
  }
})
