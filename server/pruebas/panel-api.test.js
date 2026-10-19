// El cliente de la API del panel (panel/src/api.js), las rutas de vuelta (panel/src/navegacion.js) y qué hacer después
// de un reingreso (panel/src/reingreso.js), que son código sin React ni DOM: se prueban acá con un fetch falso (plan
// 5.1) y, la subida de fotos (api.subir, E3.1), con un XMLHttpRequest falso. Sin base y sin navegador. La lógica del
// achique de fotos (panel/src/achicarFoto.js) está en fotos.test.js. Desde E3.3 y E3.4, también lo que el panel sabe
// de los contenidos (panel/src/contenidos.js) y lo que manda una ficha (panel/src/pantallas/contenido/valores.js).
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
import { TIPOS_NOVEDAD } from '../../compartido/esquemas/contenido.js'
import {
  CONTENIDOS,
  consultaDe,
  leerFiltros,
  SIN_PAGINAS_TODAVIA,
  textosDelSitio,
  traerTodas,
} from '../../panel/src/contenidos.js'
import { esDeLaSeccion, rutaSinBase, SECCIONES, seccionesPara, volverSeguro } from '../../panel/src/navegacion.js'
import {
  CAMPOS_FICHA,
  comparable,
  cuerpoDe,
  fusionarGuardado,
  valoresDe,
} from '../../panel/src/pantallas/contenido/valores.js'
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

  test('409 con faltan (fotos que ya no están): el ErrorApi trae los ids; sin faltan, null', async () => {
    const api = crearApi({
      fetch: fetchFalso(
        json(409, { error: 'Una de las fotos ya no está guardada.', campos: { fotos: 'x' }, faltan: [12, 'no', 40] }),
        json(409, { error: 'Otra cosa.' }),
      ),
    })
    await assert.rejects(api.put('/novedades/1/galeria', { fotos: [12] }), (err) => err.status === 409 && err.faltan.join() === '12,40')
    await assert.rejects(api.put('/novedades/1', {}), (err) => err.faltan === null)
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

/**
 * Un XMLHttpRequest falso: cada instancia toma la próxima respuesta de la lista ({ status, json, progreso } o 'red'
 * para un error de red) y anota lo que se le pidió. Responde en un microtask, después de avisar el progreso.
 */
function xhrFalso(...respuestas) {
  const pedidos = []
  class Xhr {
    constructor() {
      this.upload = {}
      this.cabeceras = {}
      this.status = 0
      this.responseText = ''
      this.respuesta = respuestas.shift()
      pedidos.push(this)
    }
    open(metodo, url) {
      Object.assign(this, { metodo, url })
    }
    setRequestHeader(nombre, valor) {
      this.cabeceras[nombre] = valor
    }
    getResponseHeader(nombre) {
      return nombre.toLowerCase() === 'content-type' && this.respuesta?.json !== undefined ? 'application/json; charset=utf-8' : null
    }
    abort() {
      this.abortado = true
      queueMicrotask(() => this.onabort?.())
    }
    send(cuerpo) {
      this.cuerpo = cuerpo
      queueMicrotask(() => {
        if (this.abortado) return
        const r = this.respuesta
        if (r === 'red') return this.onerror?.()
        for (const loaded of r.progreso ?? []) this.upload.onprogress?.({ lengthComputable: true, loaded, total: 100 })
        this.upload.onload?.()
        this.status = r.status
        this.responseText = r.json === undefined ? 'no es json' : JSON.stringify(r.json)
        this.onload?.()
      })
    }
  }
  return Object.assign(Xhr, { pedidos })
}

describe('api.subir (la subida de fotos, con XMLHttpRequest)', () => {
  test('POST del formulario tal cual, a /administracion/api/fotos, con Accept JSON; progreso, "procesando" y el data', async () => {
    const Xhr = xhrFalso({ status: 201, json: { data: { id: 7 } }, progreso: [10, 45, 100] })
    const api = crearApi({ xhr: Xhr })
    const formulario = { soy: 'un FormData' }
    const progreso = []
    let procesando = 0
    const foto = await api.subir('/fotos', formulario, { alProgreso: (f) => progreso.push(f), alProcesar: () => procesando++ })
    assert.deepEqual(foto, { id: 7 })
    const [p] = Xhr.pedidos
    assert.deepEqual([p.metodo, p.url], ['POST', '/administracion/api/fotos'])
    assert.equal(p.cuerpo, formulario)
    assert.deepEqual(p.cabeceras, { Accept: 'application/json' }, 'sin Content-Type: lo pone el navegador (multipart)')
    assert.deepEqual(progreso, [0.1, 0.45, 1, 1])
    assert.equal(procesando, 1)
  })

  test('401: reingreso y la subida se repite entera; si no vuelve, SESION_TERMINADA', async () => {
    const Xhr = xhrFalso({ status: 401, json: { error: 'Tenés que iniciar sesión.' } }, { status: 201, json: { data: { id: 8 } } })
    let reingresos = 0
    const api = crearApi({ xhr: Xhr, reingresar: async () => ++reingresos > 0 })
    assert.deepEqual(await api.subir('/fotos', {}), { id: 8 })
    assert.equal(Xhr.pedidos.length, 2)
    assert.equal(reingresos, 1)

    const sinVolver = crearApi({ xhr: xhrFalso({ status: 401, json: { error: 'Tenés que iniciar sesión.' } }), reingresar: async () => false })
    await assert.rejects(sinVolver.subir('/fotos', {}), (err) => err.status === 401 && err.message === SESION_TERMINADA)
  })

  test('403 con debeCambiarClave avisa; 413 y 415 con su mensaje y sus campos; sin red, status 0; abortar sale tal cual', async () => {
    let avisos = 0
    const api = crearApi({
      xhr: xhrFalso(
        { status: 403, json: { error: 'Cambiala.', debeCambiarClave: true } },
        { status: 413, json: { error: 'La foto pesa 25 MB; el máximo es 20 MB.', campos: { foto: 'La foto pesa 25 MB; el máximo es 20 MB.' } } },
        { status: 415, json: { error: 'HEIC', campos: { foto: 'HEIC' } } },
        'red',
        { status: 502 },
        { status: 201, json: { data: {} } },
      ),
      alDebeCambiarClave: () => avisos++,
    })
    await assert.rejects(api.subir('/fotos', {}), (err) => err.status === 403 && err.debeCambiarClave)
    assert.equal(avisos, 1)
    await assert.rejects(api.subir('/fotos', {}), (err) => err.status === 413 && err.campos.foto === 'La foto pesa 25 MB; el máximo es 20 MB.')
    await assert.rejects(api.subir('/fotos', {}), (err) => err.status === 415 && err.message === 'HEIC')
    await assert.rejects(api.subir('/fotos', {}), (err) => err.status === 0 && err.message === SIN_CONEXION)
    await assert.rejects(api.subir('/fotos', {}), (err) => err.status === 502 && err.campos === null)
    const control = new AbortController()
    const enCurso = api.subir('/fotos', {}, { signal: control.signal })
    control.abort()
    await assert.rejects(enCurso, (err) => err.name === 'AbortError')
    // Con la señal ya abortada, ni se arma el pedido.
    await assert.rejects(api.subir('/fotos', {}, { signal: control.signal }), (err) => err.name === 'AbortError')
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
    assert.deepEqual(seccionesPara('editor').map((s) => s.texto), [
      'Inicio',
      'Novedades',
      'Exposiciones',
      'Visitas',
      'Datos del museo',
    ])
    assert.deepEqual(seccionesPara('admin').map((s) => s.texto), [
      'Inicio',
      'Novedades',
      'Exposiciones',
      'Visitas',
      'Datos del museo',
      'Usuarios',
    ])
    // Las fichas de muestras y salas son de Exposiciones.
    const exposiciones = SECCIONES.find((s) => s.a === '/exposiciones')
    assert.ok(esDeLaSeccion(exposiciones, '/muestras/12'))
    assert.ok(esDeLaSeccion(exposiciones, '/salas/nueva'))
    assert.ok(!esDeLaSeccion(exposiciones, '/muestrasx'))
    assert.ok(!esDeLaSeccion(SECCIONES.find((s) => s.a === '/novedades'), '/muestras/12'))
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

describe('contenidos.js y la ficha (E3.3 y E3.4)', () => {
  test('leerFiltros: lo que no sirve en la dirección queda vacío y la página en 1; consultaDe saca lo vacío', () => {
    const p = (texto) => new URLSearchParams(texto)
    assert.deepEqual(leerFiltros(p('estado=publicado&tipo=actividad&q=%20taller%20&pagina=3'), TIPOS_NOVEDAD), {
      estado: 'publicado',
      tipo: 'actividad',
      q: 'taller',
      pagina: 3,
    })
    assert.deepEqual(leerFiltros(p('estado=otro&tipo=evento&pagina=-2'), TIPOS_NOVEDAD), { estado: '', tipo: '', q: '', pagina: 1 })
    assert.deepEqual(leerFiltros(p('tipo=noticia&pagina=x'), null), { estado: '', tipo: '', q: '', pagina: 1 })
    assert.equal(leerFiltros(p(`q=${'a'.repeat(300)}`), null).q.length, 100)
    assert.equal(consultaDe({ estado: '', tipo: 'noticia', q: 'año 2026', pagina: 1 }), '?tipo=noticia&q=a%C3%B1o+2026')
    assert.equal(consultaDe({ estado: '', q: '', pagina: 2 }), '?pagina=2')
    assert.equal(consultaDe({}), '')
  })

  test('traerTodas: página por página, de a 100, hasta la última', async () => {
    const pedidos = []
    const api = {
      get: async (ruta) => {
        pedidos.push(ruta)
        const pagina = Number(new URLSearchParams(ruta.split('?')[1]).get('pagina'))
        return { items: [pagina], paginas: 3 }
      },
    }
    assert.deepEqual(await traerTodas(api, '/salas'), [1, 2, 3])
    assert.deepEqual(pedidos, ['/salas?por=100&pagina=1', '/salas?por=100&pagina=2', '/salas?por=100&pagina=3'])
  })

  test('cuerpoDe: lo que no es del tipo va vacío, la inscripción con https, la dirección vacía en null', () => {
    const ficha = {
      tipo: 'actividad',
      titulo: 'Taller',
      slug: 'taller',
      resumen: null,
      cuerpo: null,
      eventoInicio: '2026-11-20T18:30',
      eventoFin: null,
      lugar: 'Patio',
      costo: null,
      enlaceInscripcion: null,
    }
    const valores = { ...valoresDe('novedades', ficha), enlaceInscripcion: 'forms.gle/abc', slug: '  ' }
    const cuerpo = cuerpoDe('novedades', valores, { id: 7 })
    assert.deepEqual(cuerpo, {
      tipo: 'actividad',
      titulo: 'Taller',
      slug: null,
      resumen: '',
      portadaId: 7,
      cuerpo: null,
      eventoInicio: '2026-11-20T18:30',
      eventoFin: null,
      lugar: 'Patio',
      costo: '',
      enlaceInscripcion: 'https://forms.gle/abc',
    })
    const noticia = cuerpoDe('novedades', { ...valores, tipo: 'noticia' }, null)
    assert.deepEqual([noticia.eventoInicio, noticia.lugar, noticia.enlaceInscripcion, noticia.portadaId], [null, null, null, null])
    const muestra = cuerpoDe(
      'muestras',
      { ...valoresDe('muestras', { tipo: 'permanente', titulo: 'M', fechaInicio: '2026-01-01', salaId: 4 }), slug: 'm' },
      null,
    )
    assert.deepEqual([muestra.fechaInicio, muestra.salaId, muestra.descripcion], [null, 4, null])
    assert.deepEqual(Object.keys(cuerpoDe('salas', valoresDe('salas', { nombre: 'Sala' }), null)).sort(), [
      'descripcion',
      'nombre',
      'portadaId',
      'resumen',
      'slug',
    ])
  })

  test('comparable: espacios, el párrafo vacío del editor y las claves en otro orden no son cambios', () => {
    const guardada = {
      nombre: 'Sala 1',
      slug: 'sala-1',
      resumen: 'Resumen',
      descripcion: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hola' }] }] },
    }
    const base = comparable('salas', cuerpoDe('salas', valoresDe('salas', guardada), null))
    // Como lo da el editor: con un párrafo vacío al final y las claves en otro orden.
    const delEditor = {
      content: [{ content: [{ text: 'Hola', type: 'text' }], type: 'paragraph' }, { type: 'paragraph' }],
      type: 'doc',
    }
    const v = { ...valoresDe('salas', guardada), nombre: ' Sala 1 ', resumen: 'Resumen ', texto: delEditor }
    assert.equal(JSON.stringify(comparable('salas', cuerpoDe('salas', v, null))), JSON.stringify(base))
    const cambiado = { ...v, resumen: 'Otro' }
    assert.notEqual(JSON.stringify(comparable('salas', cuerpoDe('salas', cambiado, null))), JSON.stringify(base))
    // Un valor todavía inválido (una fecha a medio escribir) se compara tal cual.
    const m = valoresDe('muestras', { tipo: 'temporal', titulo: 'M', slug: 'm' })
    assert.equal(comparable('muestras', cuerpoDe('muestras', { ...m, fechaInicio: '2026-13-01' }, null)).fechaInicio, '2026-13-01')
  })

  test('CONTENIDOS: rutas del panel y de la API, coherentes con los campos de la ficha', () => {
    assert.equal(CONTENIDOS.novedades.ficha(3), '/novedades/3')
    assert.equal(CONTENIDOS.salas.lista, '/exposiciones?pestana=salas')
    for (const [tipo, c] of Object.entries(CONTENIDOS)) {
      assert.equal(c.tipo, tipo)
      assert.ok(CAMPOS_FICHA[tipo].includes(c.campoTitulo), tipo)
      assert.ok(CAMPOS_FICHA[tipo].includes(c.campoTexto), tipo)
      assert.equal(CAMPOS_FICHA[tipo].includes('fotos'), c.conGaleria, tipo)
    }
  })

  test('fusionarGuardado: lo del servidor solo en lo que no se tocó mientras se guardaba (COD-02)', () => {
    const ficha = {
      id: 1,
      tipo: 'noticia',
      titulo: 'Título arreglado',
      resumen: 'Resumen',
      slug: 'titulo-arreglado',
      cuerpo: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Guardado.' }] }] },
    }
    const enviados = { ...valoresDe('novedades', { ...ficha, titulo: ' Título arreglado ', slug: null }), texto: { mandado: true } }
    // Nada se tocó: todo lo del servidor, también el texto (la forma canónica) y la dirección que armó.
    const sinTocar = fusionarGuardado('novedades', enviados, enviados, ficha)
    assert.equal(sinTocar.titulo, 'Título arreglado')
    assert.equal(sinTocar.slug, 'titulo-arreglado')
    assert.deepEqual(sinTocar.texto, ficha.cuerpo)
    // Mientras se guardaba se escribió en el texto y en el resumen: eso queda; lo demás, del servidor.
    const escrito = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Guardado. Y más.' }] }] }
    const durante = { ...enviados, resumen: 'Otro resumen', texto: escrito }
    const fusion = fusionarGuardado('novedades', durante, enviados, ficha)
    assert.equal(fusion.texto, escrito)
    assert.equal(fusion.resumen, 'Otro resumen')
    assert.equal(fusion.titulo, 'Título arreglado')
    // Si ya es igual a lo del servidor, devuelve el mismo objeto (no vuelve a dibujar).
    assert.equal(fusionarGuardado('novedades', sinTocar, sinTocar, ficha), sinTocar)
  })

  test('textosDelSitio: hasta que estén las páginas (E4) no dice que ya está en el sitio (FLU-04)', () => {
    const sin = textosDelSitio(CONTENIDOS.novedades, false)
    for (const texto of Object.values(sin)) assert.doesNotMatch(texto, /ya está en el sitio|salen al sitio|ya no está en el sitio/)
    assert.equal(sin.publicada, `Publicada. ${SIN_PAGINAS_TODAVIA}`)
    assert.equal(sin.guardadaPublicada, 'Guardado.')
    const con = textosDelSitio(CONTENIDOS.muestras, true)
    assert.equal(con.publicada, 'Publicada: la muestra ya está en el sitio.')
    // Por defecto, la constante de compartido/contenidos.js (hoy apagada).
    assert.deepEqual(textosDelSitio(CONTENIDOS.salas), textosDelSitio(CONTENIDOS.salas, false))
  })
})
