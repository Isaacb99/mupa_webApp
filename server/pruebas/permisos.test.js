// Permisos de la API del panel (plan 13.1, permisos.test.js): recorre la tabla de server/api/indice.js bajo
// /administracion/api. Sin cookie: 401; editor en ruta de admin: 403; Sec-Fetch-Site cross-site o same-site, Origin
// ajeno o ninguno: 403; cuerpo inválido: 400 antes de tocar la base; Content-Type que no es JSON: 415. Y, por ruta:
// lo que no está en la tabla da 404 en JSON, /api fuera de /administracion es la 404 del sitio, y toda respuesta de
// la API trae la CSP del panel, noindex (también con el host mupa.ar) y no-store.
// Sin base (sin DATABASE_URL_TEST, o si no responde) se saltean con un aviso; lo que no necesita base está en
// api-sin-base.test.js.
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { RUTAS } from '../api/indice.js'
import { CSP_PANEL } from '../seguridad.js'
import { cerrarBase, contarConsultas, levantar, prepararBase, salteoVisible } from './ayudas.js'

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

// Un cuerpo que ningún esquema acepta: cada campo con el tipo equivocado.
const CUERPO_INVALIDO = { email: 5, clave: 5, nombre: 5, rol: 'jefe', activo: 'si', actual: 5, nueva: 5 }
const SEGUROS = new Set(['GET', 'HEAD'])

describe('permisos de la API', { skip: base.motivo ?? false }, () => {
  let s
  let admin
  let editor
  let otro
  before(async () => {
    s = await levantar()
    admin = await s.cookiePara('admin')
    editor = await s.cookiePara('editor')
    otro = await s.crearUsuario('editor')
  })
  after(() => s?.cerrar())

  const camino = (ruta, id = otro.usuario.id) => `api:${ruta.replace(':id', String(id))}`
  const opcionesDe = (metodo, o = {}) => (SEGUROS.has(metodo) ? o : { cuerpo: {}, ...o })

  function cabecerasDelPanel(r, quien) {
    assert.match(r.h['content-type'], /application\/json/, quien)
    assert.equal(r.h['content-security-policy'], CSP_PANEL, quien)
    assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', quien)
    assert.equal(r.h['cache-control'], 'no-store', quien)
    assert.equal(typeof r.json.error, 'string', quien)
  }

  test('la tabla: las rutas de E1, cada una con su rol', () => {
    const tabla = RUTAS.map(({ metodo, ruta, rol }) => `${metodo} ${ruta} ${rol}`).sort()
    assert.deepEqual(tabla, [
      'DELETE /cuenta/sesiones editor',
      'DELETE /sesion null',
      'DELETE /usuarios/:id/sesiones admin',
      'GET /sesion editor',
      'GET /usuarios admin',
      'PATCH /usuarios/:id admin',
      'POST /sesion null',
      'POST /usuarios admin',
      'POST /usuarios/:id/clave-temporal admin',
      'PUT /cuenta editor',
      'PUT /cuenta/clave editor',
    ])
  })

  test('sin cookie (o con una que no es una sesión): 401 en toda ruta con rol', async () => {
    for (const { metodo, ruta, rol } of RUTAS) {
      if (!rol) continue
      for (const cookie of [undefined, `${s.nombreCookie}=${'a'.repeat(43)}`, `${s.nombreCookie}=basura`, 'otra=cosa']) {
        const r = await s.pedir(metodo, camino(ruta), opcionesDe(metodo, { cookie }))
        assert.equal(r.status, 401, `${metodo} ${ruta} con ${cookie}`)
        cabecerasDelPanel(r, `${metodo} ${ruta}`)
      }
    }
  })

  test('un editor en una ruta de admin: 403', async () => {
    let rutasDeAdmin = 0
    for (const { metodo, ruta, rol } of RUTAS) {
      if (rol !== 'admin') continue
      rutasDeAdmin += 1
      const r = await s.pedir(metodo, camino(ruta), opcionesDe(metodo, { cookie: editor.cookie }))
      assert.equal(r.status, 403, `${metodo} ${ruta}`)
      assert.deepEqual(r.json, { error: 'No tenés permiso para esto.' })
      cabecerasDelPanel(r, `${metodo} ${ruta}`)
    }
    assert.equal(rutasDeAdmin, 5)
  })

  test('CSRF: Sec-Fetch-Site cross-site, same-site o none, Origin ajeno o ninguno: 403 sin hacer nada', async () => {
    const intentos = [
      { sitio: 'cross-site' },
      { sitio: 'same-site' },
      { sitio: 'none' },
      { sitio: 'cross-site', origen: 'https://mupa.ar' },
      { sitio: null, origen: 'https://evil.example' },
      { sitio: null, origen: 'https://mupa.ar.evil.example' },
      { sitio: null, origen: 'http://mupa.ar' },
      { sitio: null, origen: 'null' },
      { sitio: null, origen: 'http://localhost:5301' },
      { sitio: null, origen: null },
    ]
    for (const { metodo, ruta } of RUTAS) {
      if (SEGUROS.has(metodo)) continue
      for (const { sitio, origen } of intentos) {
        const r = await s.pedir(metodo, camino(ruta), opcionesDe(metodo, { cookie: admin.cookie, sitio, origen }))
        assert.equal(r.status, 403, `${metodo} ${ruta} con ${sitio} / ${origen}`)
        assert.deepEqual(r.json, { error: 'Origen no permitido.' })
        cabecerasDelPanel(r, `${metodo} ${ruta}`)
      }
    }
    // Nada corrió: la sesión del admin sigue (DELETE /cuenta/sesiones la habría cerrado) y "otro" sigue activo.
    assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: admin.cookie })).status, 200)
    const lista = await s.pedir('GET', 'api:/usuarios', { cookie: admin.cookie })
    assert.equal(lista.json.data.find((u) => u.id === otro.usuario.id).activo, true)
  })

  test('CSRF: sin Sec-Fetch-Site, el Origin del sitio o el de Render pasan', async () => {
    for (const origen of ['https://mupa.ar', 'https://mupa-web.onrender.com']) {
      const r = await s.pedir('PUT', 'api:/cuenta', { cookie: editor.cookie, sitio: null, origen, cuerpo: { nombre: 'Editora' } })
      assert.equal(r.status, 200, origen)
    }
    // GET no pasa por el control (y Sec-Fetch-Site cross-site en un GET no cambia nada).
    assert.equal((await s.pedir('GET', 'api:/sesion', { cookie: editor.cookie, sitio: 'cross-site' })).status, 200)
  })

  test('CSRF fuera de producción: también un origen local (el Vite del panel)', async () => {
    const dev = await levantar({ NODE_ENV: 'development', URL_PUBLICA: 'http://localhost:5300/', RENDER_EXTERNAL_URL: undefined })
    try {
      const yo = await dev.cookiePara('editor')
      const ok = await dev.pedir('PUT', 'api:/cuenta', { cookie: yo.cookie, sitio: null, origen: 'http://localhost:5301', cuerpo: { nombre: 'Local' } })
      assert.equal(ok.status, 200, ok.texto)
      const ajeno = await dev.pedir('PUT', 'api:/cuenta', { cookie: yo.cookie, sitio: null, origen: 'http://evil.localhost:5301', cuerpo: { nombre: 'x' } })
      assert.equal(ajeno.status, 403)
    } finally {
      await dev.cerrar()
    }
  })

  test('cuerpo inválido: 400 con los campos, antes de que la ruta toque la base', async () => {
    const conCuerpo = RUTAS.filter((r) => r.conCuerpo)
    assert.equal(conCuerpo.length, 5)
    for (const { metodo, ruta, rol } of conCuerpo) {
      for (const cuerpo of [CUERPO_INVALIDO, [], {}]) {
        const contador = contarConsultas()
        let r
        try {
          r = await s.pedir(metodo, camino(ruta), { cookie: rol ? admin.cookie : undefined, cuerpo })
        } finally {
          contador.detener()
        }
        const quien = `${metodo} ${ruta} con ${JSON.stringify(cuerpo)}`
        assert.equal(r.status, 400, `${quien}: ${r.texto}`)
        cabecerasDelPanel(r, quien)
        // Solo la búsqueda de la sesión (en las rutas con rol); ninguna escritura.
        const ajenas = contador.consultas.filter((q) => !/FROM sesiones s JOIN usuarios u/.test(q))
        assert.deepEqual(ajenas, [], quien)
        assert.ok(contador.consultas.length <= (rol ? 1 : 0), quien)
      }
    }
    const conCampos = await s.pedir('POST', 'api:/usuarios', { cookie: admin.cookie, cuerpo: { nombre: '', email: 'x', rol: 'jefe' } })
    assert.deepEqual(Object.keys(conCampos.json.campos).sort(), ['email', 'nombre', 'rol'])
    // Las claves de más se descartan: PATCH con solo campos desconocidos no tiene nada para cambiar.
    const deMas = await s.pedir('PATCH', camino('/usuarios/:id'), { cookie: admin.cookie, cuerpo: { passwordHash: 'x', email: 'a@b.c' } })
    assert.equal(deMas.status, 400)
  })

  test('JSON roto: 400; demasiado grande: 413; en JSON y sin el detalle del error', async () => {
    const roto = await s.pedir('PUT', 'api:/cuenta', { cookie: editor.cookie, cuerpo: '{"nombre":' })
    assert.equal(roto.status, 400)
    assert.deepEqual(roto.json, { error: 'El pedido no es válido.' })
    const grande = await s.pedir('PUT', 'api:/cuenta', { cookie: editor.cookie, cuerpo: { nombre: 'x'.repeat(120_000) } })
    assert.equal(grande.status, 413)
    assert.deepEqual(grande.json, { error: 'El pedido es demasiado grande.' })
  })

  test('Content-Type que no es JSON: 415', async () => {
    for (const { metodo, ruta, rol } of RUTAS) {
      if (SEGUROS.has(metodo)) continue
      for (const tipo of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', null]) {
        if (metodo === 'DELETE' && tipo === null) continue // un DELETE sin Content-Type pero con cuerpo: abajo
        const r = await s.pedir(metodo, camino(ruta), { cookie: rol ? admin.cookie : undefined, cuerpo: 'email=a&clave=b', tipo })
        assert.equal(r.status, 415, `${metodo} ${ruta} con ${tipo}`)
        cabecerasDelPanel(r, `${metodo} ${ruta}`)
      }
    }
    // application/json con charset sí.
    const ok = await s.pedir('PUT', 'api:/cuenta', { cookie: editor.cookie, cuerpo: { nombre: 'Con charset' }, tipo: 'application/json; charset=utf-8' })
    assert.equal(ok.status, 200)
  })

  test('ids: inválidos 400, inexistentes 404', async () => {
    for (const { metodo, ruta } of RUTAS) {
      if (!ruta.includes(':id')) continue
      const cuerpo = metodo === 'PATCH' ? { nombre: 'Alguien' } : {}
      for (const id of ['abc', '0', '-1', '1.5', '2147483648', '99999999999']) {
        const r = await s.pedir(metodo, camino(ruta, id), { cookie: admin.cookie, cuerpo })
        assert.equal(r.status, 400, `${metodo} ${ruta} con ${id}`)
      }
      const r = await s.pedir(metodo, camino(ruta, '2147483647'), { cookie: admin.cookie, cuerpo })
      assert.equal(r.status, 404, `${metodo} ${ruta}`)
      assert.deepEqual(r.json, { error: 'No existe ese usuario.' })
    }
  })

  test('lo que no está en la tabla: 404 en JSON, con o sin sesión; /api fuera de /administracion: la 404 del sitio', async () => {
    for (const [metodo, ruta] of [
      ['GET', 'api:/museo'],
      ['GET', 'api:/mensajes'],
      ['POST', 'api:/no-existe'],
      ['PATCH', 'api:/cuenta'],
      ['GET', 'api:/usuarios/1/otra-cosa'],
      ['GET', '/administracion/api'],
    ]) {
      for (const cookie of [undefined, admin.cookie]) {
        const r = await s.pedir(metodo, ruta, opcionesDe(metodo, { cookie }))
        assert.equal(r.status, 404, `${metodo} ${ruta}`)
        assert.deepEqual(r.json, { error: 'No existe esa ruta de la API.' })
        cabecerasDelPanel(r, `${metodo} ${ruta}`)
      }
    }
    for (const metodo of ['GET', 'POST']) {
      const r = await s.pedir(metodo, '/api/sesion', opcionesDe(metodo, { cookie: admin.cookie }))
      assert.equal(r.status, 404)
      assert.notEqual(r.h['content-security-policy'], CSP_PANEL)
      assert.equal(r.h['set-cookie'], undefined)
    }
  })

  test('un 429 del inicio de sesión también lleva la CSP del panel, noindex y no-store', async () => {
    // Una IP propia, así no toca los contadores de las demás pruebas de este archivo.
    const ip = '203.0.113.201'
    let r
    for (let i = 0; i < 11; i++) {
      r = await s.pedir('POST', 'api:/sesion', { ip, cuerpo: { email: `nadie-${i}@example.com`, clave: 'lo que sea' } })
      if (i < 10) assert.equal(r.status, 401, `intento ${i + 1}`)
    }
    assert.equal(r.status, 429)
    assert.deepEqual(r.json, { error: 'Demasiados intentos. Esperá 15 minutos.' })
    assert.ok(Number(r.h['retry-after']) > 0)
    cabecerasDelPanel(r, '429 del ingreso')
  })

  test('las respuestas correctas de la API también llevan la CSP del panel, noindex y no-store, con el host mupa.ar', async () => {
    const r = await s.pedir('GET', 'api:/usuarios', { cookie: admin.cookie, host: 'mupa.ar' })
    assert.equal(r.status, 200)
    assert.equal(r.h['content-security-policy'], CSP_PANEL)
    assert.equal(r.h['x-robots-tag'], 'noindex, nofollow')
    assert.equal(r.h['cache-control'], 'no-store')
    assert.equal(r.h['x-frame-options'], 'DENY')
    assert.ok(Array.isArray(r.json.data))
  })

  test('cada ruta de la tabla existe: con un admin, ninguna da 404 de ruta', async () => {
    const yo = await s.cookiePara('admin')
    const victima = await s.crearUsuario('editor')
    // Al final, las que cierran la sesión propia.
    const orden = [...RUTAS].sort((a, b) => Number(/sesion/.test(a.ruta) && a.metodo === 'DELETE') - Number(/sesion/.test(b.ruta) && b.metodo === 'DELETE'))
    for (const { metodo, ruta } of orden) {
      const r = await s.pedir(metodo, camino(ruta, victima.usuario.id), opcionesDe(metodo, { cookie: yo.cookie }))
      assert.notEqual(r.json?.error, 'No existe esa ruta de la API.', `${metodo} ${ruta}`)
      assert.ok(r.status < 500, `${metodo} ${ruta}: ${r.status}`)
    }
  })
})
