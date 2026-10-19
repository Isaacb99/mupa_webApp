// GET /administracion/api/estado, el Inicio del panel (E2.2; plan 4.3, 5.2 y 8), y el registro de las tareas diarias
// que lee (server/tareas.js). Con base: lo que devuelve para un editor y para un admin ("Para completar", un solo
// admin, el correo, las tareas fallidas). Sin base: el registro de tareas.
// Que /estado pide sesión, que con la temporal da 403 y que un editor puede verlo lo recorren permisos.test.js y
// auth.test.js (la tabla de server/api/indice.js).
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { crearRegistroDeTareas, HORA_TAREAS, msHastaLaProximaVuelta, NOMBRES, programarTareas } from '../tareas.js'
import { cerrarBase, levantar, prepararBase, salteoVisible, sql } from './ayudas.js'

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

const errorCon = (codigo) => Object.assign(new Error('se cayó algo con un dato que no tiene que salir'), { code: codigo })

describe('el registro de las tareas diarias (sin base)', () => {
  test('una falla aparece con su código y desde cuándo; otra falla seguida conserva el "desde"; un éxito la saca', () => {
    const registro = crearRegistroDeTareas()
    assert.deepEqual(registro.fallidas(), [])
    registro.anotar('sesiones_vencidas', null, new Date('2026-10-14T10:00:00Z'))
    assert.deepEqual(registro.fallidas(), [])
    registro.anotar('sesiones_vencidas', errorCon('ECONNREFUSED'), new Date('2026-10-15T10:00:00Z'))
    registro.anotar('sesiones_vencidas', errorCon('ETIMEDOUT'), new Date('2026-10-16T10:00:00Z'))
    assert.deepEqual(registro.fallidas(), [
      { tarea: 'sesiones_vencidas', desde: '2026-10-15T10:00:00.000Z', ultima: '2026-10-16T10:00:00.000Z', codigo: 'ETIMEDOUT' },
    ])
    // Nunca el mensaje del error (puede traer datos).
    assert.doesNotMatch(JSON.stringify(registro.fallidas()), /dato que no tiene que salir/)
    registro.anotar('sesiones_vencidas', null)
    assert.deepEqual(registro.fallidas(), [])
  })

  test('un error sin código: codigo null; varias tareas, en el orden de NOMBRES y después las desconocidas', () => {
    const registro = crearRegistroDeTareas()
    registro.anotar('otra_tarea', new Error('x'))
    registro.anotar(NOMBRES[0], new Error('y'))
    assert.deepEqual(
      registro.fallidas().map((f) => [f.tarea, f.codigo]),
      [
        [NOMBRES[0], null],
        ['otra_tarea', null],
      ],
    )
  })

  test('programarTareas anota en el registro cómo salió la vuelta; una tarea que falla no frena a las demás', async () => {
    const registro = crearRegistroDeTareas()
    // Una base que falla al borrar las sesiones vencidas pero no las fotos huérfanas (el log se calla para no ensuciar
    // la salida).
    const caida = {
      models: { Sesion: { destroy: () => Promise.reject(errorCon('ECONNREFUSED')) } },
      query: async () => [],
      transaction: (hacer) => hacer({}),
    }
    const original = console.log
    console.log = () => {}
    try {
      const tareas = programarTareas({ sequelize: caida, registro })
      await tareas.listas
      tareas.detener()
    } finally {
      console.log = original
    }
    assert.deepEqual(
      registro.fallidas().map((f) => [f.tarea, f.codigo]),
      [['sesiones_vencidas', 'ECONNREFUSED']],
    )
    // Y al revés: fallan las fotos, las sesiones no.
    const otro = crearRegistroDeTareas()
    const fotosCaidas = {
      models: { Sesion: { destroy: async () => 0 } },
      query: () => Promise.reject(errorCon('57014')),
      transaction: (hacer) => hacer({}),
    }
    console.log = () => {}
    try {
      const tareas = programarTareas({ sequelize: fotosCaidas, registro: otro })
      await tareas.listas
      tareas.detener()
    } finally {
      console.log = original
    }
    assert.deepEqual(
      otro.fallidas().map((f) => [f.tarea, f.codigo]),
      [['fotos_huerfanas', '57014']],
    )
  })

  test('las tareas corren a las 04:00 de San Juan (UTC−3): cuánto falta para la próxima vuelta (COD-06)', () => {
    assert.equal(HORA_TAREAS, '04:00')
    const horas = (iso) => msHastaLaProximaVuelta(new Date(iso)) / 3_600_000
    // 02:00 de San Juan (05:00 UTC): faltan 2 h.
    assert.equal(horas('2026-10-16T05:00:00Z'), 2)
    // Justo a las 04:00: la de mañana.
    assert.equal(horas('2026-10-16T07:00:00Z'), 24)
    // 20:30 de San Juan: 7 h 30.
    assert.equal(horas('2026-10-16T23:30:00Z'), 7.5)
    // 23:00 de San Juan del 15 (02:00 UTC del 16): la del 16, en 5 h.
    assert.equal(horas('2026-10-16T02:00:00Z'), 5)
    // Nunca más de un día ni cero.
    for (let h = 0; h < 24; h++) {
      const ms = msHastaLaProximaVuelta(new Date(Date.UTC(2026, 9, 16, h, 17)))
      assert.ok(ms > 0 && ms <= 24 * 3_600_000, `${h} h UTC`)
    }
  })
})

describe('GET /estado', { skip: base.motivo ?? false }, () => {
  let s
  let admin
  let editor
  const registroTareas = crearRegistroDeTareas()
  before(async () => {
    s = await levantar({}, { registroTareas })
    admin = await s.cookiePara('admin')
    editor = await s.cookiePara('editor')
  })
  after(() => s?.cerrar())

  const estadoDe = async (quien) => {
    const r = await s.pedir('GET', 'api:/estado', { cookie: quien.cookie })
    assert.equal(r.status, 200, r.texto)
    assert.equal(r.h['cache-control'], 'no-store')
    return r.json.data
  }

  test('con la base recién migrada: falta todo; el correo de destino solo se le cuenta a un admin', async () => {
    const { espacio, ...deEditor } = await estadoDe(editor)
    assert.deepEqual(deEditor, {
      paraCompletar: ['direccion', 'telefono', 'emailPublico', 'horario', 'tarifas'],
      unSoloAdmin: true,
      correo: { estado: 'sin_configurar' },
      tareasFallidas: [],
    })
    // El espacio: lo que ocupa la base (una recién migrada ocupa unos pocos MB) y el contratado (1024 por defecto).
    assert.equal(espacio.totalMb, 1024)
    assert.ok(Number.isInteger(espacio.usadoMb) && espacio.usadoMb > 0 && espacio.usadoMb < 1024, JSON.stringify(espacio))
    const deAdmin = await estadoDe(admin)
    assert.deepEqual(deAdmin.paraCompletar, ['direccion', 'telefono', 'emailPublico', 'emailDestinoContacto', 'horario', 'tarifas'])
    assert.equal(deAdmin.unSoloAdmin, true)
  })

  test('con los datos cargados no falta nada; un texto con solo espacios cuenta como vacío; los valores no salen', async () => {
    await sql(
      `UPDATE museo SET direccion = :direccion, telefono = '+54 264 000-0000', email_publico = 'museo@example.com',
         email_destino_contacto = 'destino-secreto@example.com', updated_at = now() WHERE id = 1`,
      { direccion: 'Avenida de ejemplo 1234' },
    )
    await sql(`UPDATE horario_semanal SET abierto = true, franjas = '[{"abre":"09:00","cierra":"13:00"}]' WHERE dia = 2`)
    await sql(`INSERT INTO tarifas (nombre, gratuita, precio, created_at, updated_at) VALUES ('General', false, 1000, now(), now())`)
    for (const quien of [editor, admin]) {
      const datos = await estadoDe(quien)
      assert.deepEqual(datos.paraCompletar, [])
      // Solo códigos: ningún dato del museo (y nunca el correo de destino).
      assert.doesNotMatch(JSON.stringify(datos), /example\.com|Avenida|\+54/)
    }

    await sql(`UPDATE museo SET direccion = '   ', email_destino_contacto = '' WHERE id = 1`)
    await sql(`UPDATE tarifas SET visible = false`)
    assert.deepEqual((await estadoDe(editor)).paraCompletar, ['direccion', 'tarifas'])
    assert.deepEqual((await estadoDe(admin)).paraCompletar, ['direccion', 'emailDestinoContacto', 'tarifas'])
  })

  test('un solo admin activo: true; con dos, false; si el segundo se desactiva, otra vez true', async () => {
    assert.equal((await estadoDe(editor)).unSoloAdmin, true)
    const otro = await s.crearUsuario('admin')
    assert.equal((await estadoDe(editor)).unSoloAdmin, false)
    assert.equal((await estadoDe(admin)).unSoloAdmin, false)
    await sql('UPDATE usuarios SET activo = false WHERE id = :id', { id: otro.usuario.id })
    assert.equal((await estadoDe(admin)).unSoloAdmin, true)
  })

  test('las tareas diarias que vienen fallando, para los dos roles; sin el mensaje del error', async () => {
    registroTareas.anotar('sesiones_vencidas', errorCon('ECONNREFUSED'), new Date('2026-10-14T03:00:00Z'))
    for (const quien of [editor, admin]) {
      assert.deepEqual((await estadoDe(quien)).tareasFallidas, [
        { tarea: 'sesiones_vencidas', desde: '2026-10-14T03:00:00.000Z', ultima: '2026-10-14T03:00:00.000Z', codigo: 'ECONNREFUSED' },
      ])
    }
    registroTareas.anotar('sesiones_vencidas', null)
    assert.deepEqual((await estadoDe(editor)).tareasFallidas, [])
  })

  test('el espacio de la base: pg_database_size contra ESPACIO_BASE_MB, para los dos roles', async () => {
    const [{ bytes }] = await sql('SELECT pg_database_size(current_database())::bigint AS bytes')
    const chica = await levantar({ ESPACIO_BASE_MB: '10' })
    try {
      const yo = await chica.cookiePara('editor')
      const r = await chica.pedir('GET', 'api:/estado', { cookie: yo.cookie })
      assert.equal(r.status, 200, r.texto)
      assert.equal(r.json.data.espacio.totalMb, 10)
      // Lo mismo que dice Postgres, redondeado a MB (puede crecer un poco entre las dos consultas).
      assert.ok(Math.abs(r.json.data.espacio.usadoMb - Number(bytes) / 1024 / 1024) < 2, JSON.stringify(r.json.data.espacio))
    } finally {
      await chica.cerrar()
    }
    for (const quien of [editor, admin]) assert.equal((await estadoDe(quien)).espacio.totalMb, 1024)
  })
})
