// Permisos de la API del panel (plan 13.1, permisos.test.js): recorre la tabla de server/api/indice.js bajo
// /administracion/api. Sin cookie: 401; editor en ruta de admin: 403; Sec-Fetch-Site cross-site o same-site, Origin
// ajeno o ninguno: 403; cuerpo inválido: 400 antes de tocar la base; Content-Type que no es JSON: 415. Y, por ruta:
// lo que no está en la tabla da 404 en JSON, /api fuera de /administracion es la 404 del sitio, y toda respuesta de
// la API trae la CSP del panel, noindex (también con el host mupa.ar) y no-store. Y el permiso por campo de la matriz
// (plan 4.5): el correo de destino del formulario (GET y PUT /museo) es solo de los admins.
// Las de los contenidos (E3.3 y E3.4) entran solas, con la tabla.
// Las rutas multipart (POST /fotos, E3.1) reciben un formulario multipart en vez de JSON: en ellas el 415 es para todo
// lo que no sea multipart/form-data con su boundary, y el "cuerpo inválido" es un formulario sin foto, con campos
// inválidos o con dos fotos (que la sesión y el límite van antes que multer lo prueba fotos.test.js).
// Sin base (sin DATABASE_URL_TEST, o si no responde) se saltean con un aviso; lo que no necesita base está en
// api-sin-base.test.js.
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { RUTAS } from '../api/indice.js'
import { CSP_PANEL, MULTIPART } from '../seguridad.js'
import { cerrarBase, contarConsultas, levantar, multipart, prepararBase, salteoVisible } from './ayudas.js'

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

// Un cuerpo que ningún esquema acepta: cada campo con el tipo equivocado.
const CUERPO_INVALIDO = { email: 5, clave: 5, nombre: 5, rol: 'jefe', activo: 'si', actual: 5, nueva: 5 }
const SEGUROS = new Set(['GET', 'HEAD'])
// Un formulario multipart sin foto (lo que manda una ruta multipart cuando la prueba no mira el cuerpo).
const FORMULARIO_SIN_FOTO = multipart({ campos: { alt: 'Una foto' } })
// Unos bytes cualquiera como archivo: no llegan a procesarse (el 400 de los campos va antes).
const ARCHIVO = { datos: Buffer.from('no se procesa') }
const FORMULARIOS_INVALIDOS = [
  multipart({ campos: {} }),
  multipart({ campos: { decorativa: 'si', alt: '' }, archivos: [ARCHIVO] }),
  multipart({ campos: { alt: 'Dos fotos' }, archivos: [ARCHIVO, ARCHIVO] }),
]

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
  /** Un cuerpo cualquiera según el método y la ruta: nada en GET, un formulario en una multipart, {} en las demás. */
  const opcionesDe = (metodo, o = {}, def = null) =>
    SEGUROS.has(metodo) ? o : def?.multipart ? { ...FORMULARIO_SIN_FOTO, ...o } : { cuerpo: {}, ...o }

  function cabecerasDelPanel(r, quien) {
    assert.match(r.h['content-type'], /application\/json/, quien)
    assert.equal(r.h['content-security-policy'], CSP_PANEL, quien)
    assert.equal(r.h['x-robots-tag'], 'noindex, nofollow', quien)
    assert.equal(r.h['cache-control'], 'no-store', quien)
    assert.equal(typeof r.json.error, 'string', quien)
  }

  test('la tabla: las rutas de E1 a E4.9, cada una con su rol', () => {
    const tabla = RUTAS.map(({ metodo, ruta, rol }) => `${metodo} ${ruta} ${rol}`).sort()
    // Las de cada contenido (E3.3 y E3.4, server/api/contenido.js): listado, alta, ficha, cambio, eliminar, publicar y
    // despublicar; la galería en muestras y novedades; el orden en salas y muestras.
    const contenido = (tipo, { galeria = false, orden = false } = {}) => [
      `DELETE /${tipo}/:id editor`,
      `GET /${tipo} editor`,
      `GET /${tipo}/:id editor`,
      `POST /${tipo} editor`,
      `POST /${tipo}/:id/despublicar editor`,
      `POST /${tipo}/:id/publicar editor`,
      `PUT /${tipo}/:id editor`,
      ...(galeria ? [`PUT /${tipo}/:id/galeria editor`] : []),
      ...(orden ? [`PUT /${tipo}/orden editor`] : []),
    ]
    assert.deepEqual(
      tabla,
      [
        'DELETE /cuenta/sesiones editor',
        'DELETE /sesion null',
        'DELETE /tarifas/:id editor',
        'DELETE /usuarios/:id/sesiones admin',
        'GET /estado editor',
        'GET /horarios editor',
        'GET /mensajes admin',
        'GET /museo editor',
        'GET /sesion editor',
        'GET /tarifas editor',
        'GET /usuarios admin',
        'PATCH /fotos/:id editor',
        'PATCH /usuarios/:id admin',
        'POST /fotos editor',
        'POST /sesion null',
        'POST /tarifas editor',
        'POST /usuarios admin',
        'POST /usuarios/:id/clave-temporal admin',
        'PUT /cuenta editor',
        'PUT /cuenta/clave editor',
        'PUT /horarios editor',
        'PUT /museo editor',
        'PUT /tarifas/:id editor',
        'PUT /tarifas/orden editor',
        ...contenido('novedades', { galeria: true }),
        ...contenido('muestras', { galeria: true, orden: true }),
        ...contenido('salas', { orden: true }),
      ].sort(),
    )
    // Las fijas (/orden) antes que las de su :id: si no, "orden" sería un id (400).
    const lugar = (ruta) => RUTAS.findIndex((r) => r.metodo === 'PUT' && r.ruta === ruta)
    for (const tipo of ['tarifas', 'salas', 'muestras']) assert.ok(lugar(`/${tipo}/orden`) < lugar(`/${tipo}/:id`), tipo)
  })

  test('el tope de 300 kB (plan 2.4) va solo en lo que guarda textos con formato; lo demás, 100 kB', () => {
    const conTope = RUTAS.filter((r) => r.limiteJson).map((r) => `${r.metodo} ${r.ruta} ${r.limiteJson}`)
    assert.deepEqual(conTope.sort(), [
      'PUT /muestras/:id 300kb',
      'PUT /museo 300kb',
      'PUT /novedades/:id 300kb',
      'PUT /salas/:id 300kb',
    ])
  })

  test('las rutas multipart de la tabla son exactamente las que exigirJson deja pasar como multipart', () => {
    const deLaTabla = RUTAS.filter((r) => r.multipart).map((r) => `${r.metodo} ${r.ruta}`)
    assert.deepEqual(deLaTabla, ['POST /fotos'])
    for (const { metodo, ruta, multipart: esMultipart } of RUTAS) {
      const enSeguridad = MULTIPART.some((m) => m.metodo === metodo && m.ruta.test(ruta.replace(':id', '1')))
      assert.equal(enSeguridad, esMultipart, `${metodo} ${ruta}`)
    }
  })

  test('sin cookie (o con una que no es una sesión): 401 en toda ruta con rol', async () => {
    for (const def of RUTAS) {
      const { metodo, ruta, rol } = def
      if (!rol) continue
      for (const cookie of [undefined, `${s.nombreCookie}=${'a'.repeat(43)}`, `${s.nombreCookie}=basura`, 'otra=cosa']) {
        const r = await s.pedir(metodo, camino(ruta), opcionesDe(metodo, { cookie }, def))
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
    // Usuarios (5) y, desde E4.9, GET /mensajes.
    assert.equal(rutasDeAdmin, 6)
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
    for (const def of RUTAS) {
      const { metodo, ruta } = def
      if (SEGUROS.has(metodo)) continue
      for (const { sitio, origen } of intentos) {
        const r = await s.pedir(metodo, camino(ruta), opcionesDe(metodo, { cookie: admin.cookie, sitio, origen }, def))
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
    // 12 hasta E3.1; desde E3.3 y E3.4, el alta y el cambio de los tres contenidos, las dos galerías y los dos órdenes.
    assert.equal(conCuerpo.length, 22)
    for (const { metodo, ruta, rol, multipart: esMultipart } of conCuerpo) {
      const cuerpos = esMultipart ? FORMULARIOS_INVALIDOS : [CUERPO_INVALIDO, [], {}].map((cuerpo) => ({ cuerpo }))
      for (const { cuerpo, tipo } of cuerpos) {
        const contador = contarConsultas()
        let r
        try {
          r = await s.pedir(metodo, camino(ruta), { cookie: rol ? admin.cookie : undefined, cuerpo, tipo })
        } finally {
          contador.detener()
        }
        const quien = `${metodo} ${ruta} con ${esMultipart ? cuerpo.toString('latin1') : JSON.stringify(cuerpo)}`
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

  test('Content-Type que no es JSON (o multipart, en POST /fotos): 415', async () => {
    for (const { metodo, ruta, rol, multipart: esMultipart } of RUTAS) {
      if (SEGUROS.has(metodo)) continue
      const tipos = esMultipart
        ? ['text/plain', 'application/x-www-form-urlencoded', 'application/json', 'multipart/form-data', null]
        : ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', null]
      for (const tipo of tipos) {
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
    // Un cuerpo válido para las rutas con :id que lo validan (si no, el 400 del cuerpo llegaría antes que el 404).
    const CUERPOS = {
      'PATCH /usuarios/:id': { nombre: 'Alguien' },
      // El PUT de una tarifa lleva la tarifa completa.
      'PUT /tarifas/:id': { nombre: 'General', gratuita: true, precio: null, condicion: null, visible: true },
      'PATCH /fotos/:id': { alt: 'Una foto' },
      // Los contenidos llevan el esquema completo (lo opcional, en null); la galería, la lista de fotos.
      'PUT /novedades/:id': {
        tipo: 'noticia',
        titulo: 'Una novedad',
        slug: null,
        resumen: null,
        cuerpo: null,
        portadaId: null,
        eventoInicio: null,
        eventoFin: null,
        lugar: null,
        costo: null,
        enlaceInscripcion: null,
      },
      'PUT /muestras/:id': {
        tipo: 'temporal',
        titulo: 'Una muestra',
        slug: null,
        resumen: null,
        descripcion: null,
        portadaId: null,
        fechaInicio: null,
        fechaFin: null,
        salaId: null,
      },
      'PUT /salas/:id': { nombre: 'Una sala', slug: null, resumen: null, descripcion: null, portadaId: null },
      'PUT /novedades/:id/galeria': { fotos: [] },
      'PUT /muestras/:id/galeria': { fotos: [] },
    }
    const NO_EXISTE = {
      usuarios: 'No existe ese usuario.',
      tarifas: 'No existe esa tarifa.',
      fotos: 'No existe esa foto.',
      novedades: 'No existe esa novedad.',
      muestras: 'No existe esa muestra.',
      salas: 'No existe esa sala.',
    }
    let conId = 0
    for (const { metodo, ruta } of RUTAS) {
      if (!ruta.includes(':id')) continue
      conId += 1
      const cuerpo = CUERPOS[`${metodo} ${ruta}`] ?? {}
      for (const id of ['abc', '0', '-1', '1.5', '2147483648', '99999999999']) {
        const r = await s.pedir(metodo, camino(ruta, id), { cookie: admin.cookie, cuerpo })
        assert.equal(r.status, 400, `${metodo} ${ruta} con ${id}`)
      }
      const r = await s.pedir(metodo, camino(ruta, '2147483647'), { cookie: admin.cookie, cuerpo })
      assert.equal(r.status, 404, `${metodo} ${ruta}`)
      assert.deepEqual(r.json, { error: NO_EXISTE[ruta.split('/')[1]] }, `${metodo} ${ruta}`)
    }
    // 6 hasta E3.1; desde E3.3 y E3.4, 5 por contenido más las dos galerías.
    assert.equal(conId, 23)
  })

  test('lo que no está en la tabla: 404 en JSON, con o sin sesión; /api fuera de /administracion: la 404 del sitio', async () => {
    for (const [metodo, ruta] of [
      ['GET', 'api:/mensajes/1'],
      ['DELETE', 'api:/mensajes'],
      ['GET', 'api:/horarios/1'],
      ['DELETE', 'api:/tarifas'],
      ['GET', 'api:/fotos'],
      ['GET', 'api:/fotos/1'],
      ['DELETE', 'api:/fotos/1'],
      ['POST', 'api:/fotos/1'],
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

  test('el correo de destino del formulario: un editor no lo recibe y no lo puede mandar (403); un admin sí', async () => {
    const destino = 'destino-de-prueba@example.com'
    const deAdmin = await s.pedir('PUT', 'api:/museo', { cookie: admin.cookie, cuerpo: { emailDestinoContacto: destino } })
    assert.equal(deAdmin.status, 200, deAdmin.texto)
    assert.equal(deAdmin.json.data.emailDestinoContacto, destino)
    const verAdmin = await s.pedir('GET', 'api:/museo', { cookie: admin.cookie })
    assert.equal(verAdmin.status, 200)
    assert.equal(verAdmin.json.data.emailDestinoContacto, destino)

    const verEditor = await s.pedir('GET', 'api:/museo', { cookie: editor.cookie })
    assert.equal(verEditor.status, 200)
    assert.ok(!('emailDestinoContacto' in verEditor.json.data), 'el editor no recibe la clave')
    assert.ok(!verEditor.texto.includes(destino))
    // Con cualquier valor (el mismo, null, uno inválido) y con el nombre de la columna: 403 antes de validar y sin
    // cambiar nada, aunque traiga otros campos válidos.
    for (const cuerpo of [
      { emailDestinoContacto: 'otro@example.com' },
      { emailDestinoContacto: destino },
      { emailDestinoContacto: null },
      { emailDestinoContacto: 'no es un correo' },
      { email_destino_contacto: 'otro@example.com' },
      { direccion: 'Calle del editor 1', emailDestinoContacto: 'otro@example.com' },
    ]) {
      const r = await s.pedir('PUT', 'api:/museo', { cookie: editor.cookie, cuerpo })
      assert.equal(r.status, 403, JSON.stringify(cuerpo))
      assert.deepEqual(r.json, { error: 'Solo un administrador puede ver y cambiar el correo de destino del formulario.' })
      cabecerasDelPanel(r, 'PUT /museo de editor')
    }
    const despues = await s.pedir('GET', 'api:/museo', { cookie: admin.cookie })
    assert.equal(despues.json.data.emailDestinoContacto, destino)
    assert.notEqual(despues.json.data.direccion, 'Calle del editor 1')
    // El resto del museo, un editor sí lo cambia (y la respuesta tampoco trae el correo de destino).
    const otroCampo = await s.pedir('PUT', 'api:/museo', { cookie: editor.cookie, cuerpo: { telefono: '+54 264 000-0001' } })
    assert.equal(otroCampo.status, 200, otroCampo.texto)
    assert.equal(otroCampo.json.data.telefono, '+54 264 000-0001')
    assert.ok(!otroCampo.texto.includes(destino))
  })

  test('cada ruta de la tabla existe: con un admin, ninguna da 404 de ruta', async () => {
    const yo = await s.cookiePara('admin')
    const victima = await s.crearUsuario('editor')
    // Al final, las que cierran la sesión propia.
    const orden = [...RUTAS].sort((a, b) => Number(/sesion/.test(a.ruta) && a.metodo === 'DELETE') - Number(/sesion/.test(b.ruta) && b.metodo === 'DELETE'))
    for (const def of orden) {
      const { metodo, ruta } = def
      const r = await s.pedir(metodo, camino(ruta, victima.usuario.id), opcionesDe(metodo, { cookie: yo.cookie }, def))
      assert.notEqual(r.json?.error, 'No existe esa ruta de la API.', `${metodo} ${ruta}`)
      assert.ok(r.status < 500, `${metodo} ${ruta}: ${r.status}`)
    }
  })
})
