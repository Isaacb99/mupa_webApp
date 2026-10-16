// El cliente de la API del panel (panel/src/api.js), las rutas de vuelta (panel/src/navegacion.js) y qué hacer después
// de un reingreso (panel/src/reingreso.js), que son código sin React ni DOM: se prueban acá con un fetch falso (plan
// 5.1). Sin base y sin navegador.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  crearApi,
  ErrorApi,
  esTemporalVencida,
  PREFIJO_API,
  quizasGuardo,
  repartirError,
  SESION_TERMINADA,
  SIN_CONEXION,
} from '../../panel/src/api.js'
import { rutaSinBase, SECCIONES, seccionesPara, volverSeguro } from '../../panel/src/navegacion.js'
import { queHacerAlReingresar } from '../../panel/src/reingreso.js'

/** Un fetch falso que responde lo que se le pide, en orden, y anota cada pedido. */
function fetchFalso(...respuestas) {
  const pedidos = []
  const fn = async (url, opciones) => {
    pedidos.push({ url, ...opciones })
    const r = respuestas.shift()
    if (typeof r === 'function') return r()
    if (r instanceof Error) throw r
    return r
  }
  return Object.assign(fn, { pedidos })
}

const json = (status, cuerpo) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

describe('api.js', () => {
  test('GET: la ruta bajo /administracion/api, con la cookie (same-origin), sin cuerpo; devuelve el data', async () => {
    const f = fetchFalso(json(200, { data: { hola: 1 } }))
    const api = crearApi({ fetch: f })
    assert.deepEqual(await api.get('/estado'), { hola: 1 })
    const [p] = f.pedidos
    assert.equal(p.url, `${PREFIJO_API}/estado`)
    assert.equal(PREFIJO_API, '/administracion/api')
    assert.equal(p.method, 'GET')
    assert.equal(p.credentials, 'same-origin')
    assert.equal(p.body, undefined)
    assert.equal(p.headers['Content-Type'], undefined)
    assert.equal(p.headers.Accept, 'application/json')
  })

  test("POST, PUT y PATCH: siempre Content-Type JSON y un cuerpo, '{}' si no lleva datos; DELETE solo con cuerpo", async () => {
    const f = fetchFalso(...Array.from({ length: 6 }, () => json(200, { data: null })))
    const api = crearApi({ fetch: f })
    await api.post('/usuarios/3/clave-temporal')
    await api.put('/cuenta', { nombre: 'Ana' })
    await api.patch('/usuarios/3', { activo: false })
    await api.delete('/sesion')
    await api.delete('/algo', { ids: [1] })
    await api.post('/x', null)
    const [post, put, patch, del, delConCuerpo, postNull] = f.pedidos
    assert.equal(post.headers['Content-Type'], 'application/json')
    assert.equal(post.body, '{}')
    assert.equal(put.body, '{"nombre":"Ana"}')
    assert.equal(patch.method, 'PATCH')
    assert.equal(patch.headers['Content-Type'], 'application/json')
    assert.equal(del.body, undefined)
    assert.equal(del.headers['Content-Type'], undefined)
    assert.equal(delConCuerpo.body, '{"ids":[1]}')
    assert.equal(delConCuerpo.headers['Content-Type'], 'application/json')
    assert.equal(postNull.body, '{}')
  })

  test('400: ErrorApi con el mensaje y los campos de la API', async () => {
    const api = crearApi({ fetch: fetchFalso(json(400, { error: 'Revisá los datos.', campos: { nombre: 'Escribí el nombre.' } })) })
    const err = await api.put('/cuenta', { nombre: '' }).catch((e) => e)
    assert.ok(err instanceof ErrorApi)
    assert.equal(err.status, 400)
    assert.equal(err.message, 'Revisá los datos.')
    assert.deepEqual(err.campos, { nombre: 'Escribí el nombre.' })
    assert.equal(err.debeCambiarClave, false)
  })

  test('401: abre el reingreso y, si la persona vuelve a entrar, repite el mismo pedido', async () => {
    const f = fetchFalso(json(401, { error: 'Tenés que iniciar sesión.' }), json(200, { data: { guardado: true } }))
    const motivos = []
    const api = crearApi({
      fetch: f,
      reingresar: async (err) => {
        motivos.push(err.message)
        return true
      },
    })
    assert.deepEqual(await api.put('/museo', { telefono: '1' }), { guardado: true })
    assert.deepEqual(motivos, ['Tenés que iniciar sesión.'])
    assert.equal(f.pedidos.length, 2)
    assert.equal(f.pedidos[1].body, '{"telefono":"1"}')
    assert.equal(f.pedidos[1].method, 'PUT')
  })

  test('401: si la persona cierra el diálogo, el pedido termina con el 401 (y el mensaje de la temporal vencida llega)', async () => {
    const vencida = 'La contraseña temporal venció. Pedile otra a un administrador.'
    const recibidos = []
    const api = crearApi({
      fetch: fetchFalso(json(401, { error: vencida })),
      reingresar: async (err) => {
        recibidos.push(err.message)
        return false
      },
    })
    const err = await api.get('/estado').catch((e) => e)
    assert.equal(err.status, 401)
    assert.equal(err.message, vencida)
    assert.deepEqual(recibidos, [vencida])
    assert.ok(esTemporalVencida(err))
    assert.ok(!esTemporalVencida(new ErrorApi(401, 'Tenés que iniciar sesión.')))
    assert.ok(!esTemporalVencida(new ErrorApi(400, vencida)))
  })

  test('401 en un pedido que guarda, si la persona no vuelve a entrar: dice qué pasó y qué hacer', async () => {
    const reingresar = async () => false
    const terminada = crearApi({ fetch: fetchFalso(json(401, { error: 'Tenés que iniciar sesión.' })), reingresar })
    const err = await terminada.put('/museo', { telefono: '1' }).catch((e) => e)
    assert.equal(err.status, 401)
    assert.equal(err.message, SESION_TERMINADA)
    assert.match(SESION_TERMINADA, /no se hizo/)
    assert.deepEqual(repartirError(err, ['telefono']), { errores: {}, mensaje: SESION_TERMINADA })
    // La temporal vencida sale tal cual (el diálogo ya dijo qué hacer).
    const vencida = 'La contraseña temporal venció. Pedile otra a un administrador.'
    const conVencida = crearApi({ fetch: fetchFalso(json(401, { error: vencida })), reingresar })
    assert.equal((await conVencida.put('/cuenta/clave', {}).catch((e) => e)).message, vencida)
  })

  test('401 con sinReingreso (ingresar, la sesión al arrancar): no abre el diálogo', async () => {
    let llamado = false
    const api = crearApi({
      fetch: fetchFalso(json(401, { error: 'Correo o contraseña incorrectos.' })),
      reingresar: async () => {
        llamado = true
        return true
      },
    })
    const err = await api.post('/sesion', { email: 'a@b.c', clave: 'x' }, { sinReingreso: true }).catch((e) => e)
    assert.equal(err.status, 401)
    assert.equal(err.message, 'Correo o contraseña incorrectos.')
    assert.equal(llamado, false)
  })

  test('403 con debeCambiarClave: avisa (lleva a Cambiar la contraseña) y tira el error; un 403 de rol, no', async () => {
    const avisos = []
    const api = crearApi({
      fetch: fetchFalso(
        json(403, { error: 'Tenés que cambiar la contraseña temporal antes de seguir.', debeCambiarClave: true }),
        json(403, { error: 'No tenés permiso para esto.' }),
      ),
      alDebeCambiarClave: (err) => avisos.push(err.status),
    })
    const temporal = await api.get('/estado').catch((e) => e)
    assert.equal(temporal.debeCambiarClave, true)
    const rol = await api.get('/usuarios').catch((e) => e)
    assert.equal(rol.status, 403)
    assert.equal(rol.debeCambiarClave, false)
    assert.deepEqual(avisos, [403])
  })

  test('sin conexión: ErrorApi con status 0 y "Sin conexión, reintentá."; un AbortError sale tal cual', async () => {
    const api = crearApi({ fetch: fetchFalso(new TypeError('Failed to fetch')) })
    const err = await api.put('/museo', {}).catch((e) => e)
    assert.ok(err instanceof ErrorApi)
    assert.equal(err.status, 0)
    assert.equal(err.sinConexion, true)
    assert.equal(err.message, SIN_CONEXION)

    const cancelado = Object.assign(new Error('cancelado'), { name: 'AbortError' })
    const otra = crearApi({ fetch: fetchFalso(cancelado) })
    assert.equal(await otra.get('/estado').catch((e) => e), cancelado)
  })

  test('una respuesta que no es JSON (un 502 del proxy): un texto según el código, sin campos', async () => {
    const api = crearApi({
      fetch: fetchFalso(
        new Response('<html>Bad Gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }),
        new Response('Too many', { status: 429, headers: { 'Content-Type': 'text/plain' } }),
        new Response('{roto', { status: 500, headers: { 'Content-Type': 'application/json' } }),
      ),
    })
    const e502 = await api.get('/estado').catch((e) => e)
    assert.equal(e502.status, 502)
    assert.match(e502.message, /no está disponible/)
    assert.equal(e502.campos, null)
    assert.equal((await api.get('/estado').catch((e) => e)).message, 'Demasiados intentos. Esperá 15 minutos.')
    assert.match((await api.get('/estado').catch((e) => e)).message, /Algo salió mal/)
  })

  test('quizasGuardo: sin conexión o un 5xx (no se sabe si se guardó); un 4xx o un 409, no', () => {
    for (const status of [0, 500, 502, 503, 504]) assert.equal(quizasGuardo(new ErrorApi(status, 'x')), true, status)
    for (const status of [400, 401, 403, 404, 409, 429]) assert.equal(quizasGuardo(new ErrorApi(status, 'x')), false, status)
    assert.equal(quizasGuardo(new Error('de programación')), false)
    assert.equal(quizasGuardo(null), false)
  })

  test('configurar() cambia los ganchos después de creada (main.jsx los pone cuando ya hay router)', async () => {
    const api = crearApi({ fetch: fetchFalso(json(401, { error: 'x' }), json(200, { data: 1 })) })
    api.configurar({ reingresar: async () => true })
    assert.equal(await api.get('/estado'), 1)
  })
})

describe('repartirError', () => {
  test('los campos van a su campo; el 400 genérico no se repite arriba', () => {
    const err = new ErrorApi(400, 'Revisá los datos.', { campos: { nombre: 'Escribí el nombre.', email: 'Correo inválido.' } })
    assert.deepEqual(repartirError(err, ['nombre', 'email']), {
      errores: { nombre: 'Escribí el nombre.', email: 'Correo inválido.' },
      mensaje: null,
    })
  })

  test('un campo que el formulario no tiene (o el "_" de zod) va al mensaje general', () => {
    const err = new ErrorApi(400, 'Revisá los datos.', { campos: { nombre: 'Muy largo.', _: 'No hay nada para cambiar.' } })
    assert.deepEqual(repartirError(err, ['nombre']), { errores: { nombre: 'Muy largo.' }, mensaje: 'No hay nada para cambiar.' })
    // Sin lista de campos: todos a su campo.
    assert.deepEqual(repartirError(err).errores, { nombre: 'Muy largo.', _: 'No hay nada para cambiar.' })
  })

  test('409 de un repetido: junto al campo; 409 del último admin, 429, 401 y sin conexión: arriba', () => {
    const repetido = new ErrorApi(409, 'Ya hay una cuenta con ese correo.', { campos: { email: 'Ya hay una cuenta con ese correo.' } })
    assert.deepEqual(repartirError(repetido, ['email']), { errores: { email: 'Ya hay una cuenta con ese correo.' }, mensaje: null })
    for (const err of [
      new ErrorApi(409, 'No se puede: es el único administrador activo.'),
      new ErrorApi(429, 'Demasiados intentos. Esperá 15 minutos.'),
      new ErrorApi(401, 'Correo o contraseña incorrectos.'),
      new ErrorApi(0, SIN_CONEXION),
    ]) {
      assert.deepEqual(repartirError(err, ['email']), { errores: {}, mensaje: err.message })
    }
  })

  test('un error que no es de la API (un error de programación): un mensaje genérico, sin el detalle', () => {
    const r = repartirError(new TypeError("Cannot read properties of undefined (reading 'x')"))
    assert.deepEqual(r.errores, {})
    assert.match(r.mensaje, /Algo salió mal/)
  })
})

describe('navegacion.js', () => {
  test('volverSeguro: solo rutas del panel', () => {
    for (const ok of ['/', '/museo', '/usuarios?pagina=2', '/novedades/3#galeria']) assert.equal(volverSeguro(ok), ok)
    for (const mal of [
      null,
      undefined,
      '',
      'museo',
      '//evil.example',
      '/\\evil.example',
      'https://evil.example/',
      '/museo\nSet-Cookie: x',
      '/ingresar',
      '/ingresar?volver=/x',
      '/salir',
      '/cambiar-clave',
      `/${'a'.repeat(2001)}`,
    ]) {
      assert.equal(volverSeguro(mal), null, JSON.stringify(mal))
    }
  })

  test('rutaSinBase: saca /administracion de la URL de un loader', () => {
    assert.equal(rutaSinBase('http://localhost:5300/administracion/museo?x=1', '/administracion'), '/museo?x=1')
    assert.equal(rutaSinBase('http://localhost:5300/administracion', '/administracion'), '/')
    assert.equal(rutaSinBase('http://localhost:5300/administracion/', '/administracion'), '/')
    assert.equal(rutaSinBase('http://localhost:5300/administracionx', '/administracion'), '/administracionx')
  })

  test('la barra: Usuarios solo para admin, en el mismo lugar para todos', () => {
    assert.deepEqual(seccionesPara('editor').map((s) => s.texto), ['Inicio', 'Visitas', 'Datos del museo'])
    assert.deepEqual(seccionesPara('admin').map((s) => s.texto), ['Inicio', 'Visitas', 'Datos del museo', 'Usuarios'])
    assert.equal(SECCIONES[0].a, '/')
  })
})

describe('reingreso.js', () => {
  const sesion = (id, rol) => ({ usuario: { id, nombre: `Persona ${id}`, email: `p${id}@example.com`, rol } })

  test('otra cuenta: el panel vuelve a empezar (lo de la pantalla era de la anterior, también después de "Ahora no")', () => {
    assert.equal(queHacerAlReingresar(sesion(1, 'admin'), sesion(2, 'editor')), 'otra-cuenta')
    // Mismo rol, otra persona: lo escrito por la primera no se guarda a nombre de la segunda.
    assert.equal(queHacerAlReingresar(sesion(1, 'editor'), sesion(2, 'editor')), 'otra-cuenta')
  })

  test('la misma persona con otro rol: se repite el pedido y la pantalla se vuelve a cargar', () => {
    assert.equal(queHacerAlReingresar(sesion(1, 'admin'), sesion(1, 'editor')), 'otro-rol')
    assert.equal(queHacerAlReingresar(sesion(1, 'editor'), sesion(1, 'admin')), 'otro-rol')
  })

  test('la misma persona y el mismo rol (o ninguna sesión conocida): se repite el pedido y nada más', () => {
    assert.equal(queHacerAlReingresar(sesion(1, 'admin'), sesion(1, 'admin')), 'igual')
    assert.equal(queHacerAlReingresar(null, sesion(1, 'admin')), 'igual')
  })
})
