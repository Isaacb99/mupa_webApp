// Visitas (E2.4; plan 3.2, 4.3 y 5.3): el horario semanal (GET y PUT /horarios) y las tarifas (GET y POST /tarifas,
// PUT y DELETE /tarifas/:id, PUT /tarifas/orden). Las notas, el aviso y la compra externa son del museo
// (museo.test.js). Sin base: los esquemas y los precios. Con base: la API.
// Que estas rutas piden sesión, CSRF y JSON, y sus 400 antes de tocar la base, lo recorre permisos.test.js.
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { esquemaHorarios } from '../../compartido/esquemas/horarios.js'
import { esquemaOrdenTarifas, esquemaTarifa, TARIFAS_MAX } from '../../compartido/esquemas/tarifas.js'
import { leerPrecio, textoPrecio } from '../../compartido/precios.js'
import { cerrarBase, levantar, prepararBase, salteoVisible, sql } from './ayudas.js'

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

function campos(esquema, cuerpo) {
  const r = esquema.safeParse(cuerpo)
  if (r.success) return null
  const salida = {}
  for (const i of r.error.issues) salida[i.path.join('.') || '_'] ??= i.message
  return salida
}

const CERRADO = { abierto: false, franjas: [], nota: null }
/** Una semana: el martes (dia 2) con las franjas que se pasan, el resto cerrado. */
const semana = (franjasMartes, extra = {}) => ({
  dias: [1, 2, 3, 4, 5, 6, 7].map((dia) =>
    dia === 2 ? { dia, abierto: true, franjas: franjasMartes, nota: null, ...extra } : { dia, ...CERRADO },
  ),
})
const franja = (abre, cierra) => ({ abre, cierra })

/** Espera (hasta 5 s) a que n pedidos queden esperando un bloqueo de la base (no el candado de las pruebas). */
async function esperarTrabados(n) {
  for (let i = 0; i < 100; i++) {
    const [{ cuantos }] = await sql(
      `SELECT count(*)::int AS cuantos FROM pg_stat_activity
       WHERE datname = current_database() AND wait_event_type = 'Lock' AND wait_event <> 'advisory'`,
    )
    if (cuantos >= n) return
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error(`no quedaron ${n} pedidos esperando el bloqueo`)
}

describe('los esquemas del horario y de las tarifas (sin base)', () => {
  test('horario: franjas válidas, ordenadas por la apertura; un día cerrado se guarda sin franjas', () => {
    const r = esquemaHorarios.parse(semana([franja('17:00', '21:00'), franja('09:00', '13:00')]))
    assert.deepEqual(r.dias[1].franjas, [franja('09:00', '13:00'), franja('17:00', '21:00')])
    // Contiguas no se superponen.
    assert.equal(campos(esquemaHorarios, semana([franja('09:00', '13:00'), franja('13:00', '17:00')])), null)
    // Cerrado: lo que quedó escrito no se valida y no se guarda.
    const cerrado = semana([])
    cerrado.dias[0] = {
      dia: 1,
      abierto: false,
      franjas: [franja('x', 'y'), franja('a', 'b'), franja('c', 'd')],
      nota: '',
    }
    cerrado.dias[1] = { dia: 2, ...CERRADO }
    assert.deepEqual(esquemaHorarios.parse(cerrado).dias[0], { dia: 1, ...CERRADO })
    // Los días llegan en cualquier orden y salen del 1 al 7.
    const desordenados = semana([franja('09:00', '13:00')])
    desordenados.dias.reverse()
    assert.deepEqual(
      esquemaHorarios.parse(desordenados).dias.map((d) => d.dia),
      [1, 2, 3, 4, 5, 6, 7],
    )
  })

  test('horario: franjas inválidas, superpuestas o más de 2; abierto sin franjas; días que faltan o se repiten', () => {
    assert.deepEqual(campos(esquemaHorarios, semana([franja('13:00', '09:00')])), {
      'dias.1.franjas.0.cierra': 'Tiene que ser más tarde que la apertura.',
    })
    assert.ok(campos(esquemaHorarios, semana([franja('10:00', '10:00')]))['dias.1.franjas.0.cierra'])
    for (const mala of ['9:00', '24:00', '10:60', '10.30', '', 'mañana', 930]) {
      assert.ok(campos(esquemaHorarios, semana([franja(mala, '18:00')]))?.['dias.1.franjas.0.abre'], String(mala))
    }
    assert.deepEqual(campos(esquemaHorarios, semana([franja('09:00', '13:00'), franja('12:00', '18:00')])), {
      'dias.1.franjas.1.abre': 'Las dos franjas se superponen.',
    })
    assert.ok(
      campos(esquemaHorarios, semana([franja('09:00', '18:00'), franja('10:00', '11:00')]))['dias.1.franjas.1.abre'],
    )
    assert.deepEqual(
      campos(esquemaHorarios, semana([franja('09:00', '10:00'), franja('11:00', '12:00'), franja('13:00', '14:00')])),
      {
        'dias.1.franjas': 'Pueden ser hasta 2 franjas por día.',
      },
    )
    assert.deepEqual(campos(esquemaHorarios, semana([])), {
      'dias.1.franjas': 'Cargá al menos una franja horaria, o marcá el día como cerrado.',
    })
    assert.ok(campos(esquemaHorarios, semana([franja('09:00', '13:00')], { nota: 'x'.repeat(121) }))['dias.1.nota'])
    const seis = semana([franja('09:00', '13:00')])
    seis.dias.pop()
    assert.ok(campos(esquemaHorarios, seis).dias)
    const repetido = semana([franja('09:00', '13:00')])
    repetido.dias[6] = { dia: 1, ...CERRADO }
    assert.ok(campos(esquemaHorarios, repetido).dias)
    assert.ok(campos(esquemaHorarios, {}).dias)
  })

  test('horario: una hora vacía dice cuál falta; una mal escrita, cómo se escribe (y no se compara con la otra)', () => {
    assert.deepEqual(campos(esquemaHorarios, semana([franja('09:00', '')])), {
      'dias.1.franjas.0.cierra': 'Completá la hora de cierre.',
    })
    assert.deepEqual(campos(esquemaHorarios, semana([franja('  ', '')])), {
      'dias.1.franjas.0.abre': 'Completá la hora de apertura.',
      'dias.1.franjas.0.cierra': 'Completá la hora de cierre.',
    })
    // "9:00" contra "10:00" como texto daba además "Tiene que ser más tarde que la apertura." en el cierre.
    assert.deepEqual(campos(esquemaHorarios, semana([franja('9:00', '10:00')])), {
      'dias.1.franjas.0.abre': 'Escribí la hora como 09:30.',
    })
    assert.deepEqual(campos(esquemaHorarios, semana([franja('09:00', '13:00'), franja('12:00', '')])), {
      'dias.1.franjas.1.cierra': 'Completá la hora de cierre.',
    })
  })

  test('tarifas: precio entero en pesos, obligatorio si no es gratuita; una gratuita va sin precio', () => {
    assert.deepEqual(esquemaTarifa.parse({ nombre: ' General ', precio: 3000 }), {
      nombre: 'General',
      gratuita: false,
      precio: 3000,
      condicion: null,
      visible: true,
    })
    assert.equal(esquemaTarifa.parse({ nombre: 'Menores', gratuita: true, precio: 500 }).precio, null)
    assert.equal(esquemaTarifa.parse({ nombre: 'Menores', gratuita: true }).precio, null)
    assert.deepEqual(campos(esquemaTarifa, { nombre: 'General' }), {
      precio: 'Escribí el precio, o marcá la tarifa como gratuita.',
    })
    assert.deepEqual(campos(esquemaTarifa, { nombre: 'General', precio: null }), {
      precio: 'Escribí el precio, o marcá la tarifa como gratuita.',
    })
    for (const malo of [10.5, -1, '3000', 1e12])
      assert.ok(campos(esquemaTarifa, { nombre: 'X', precio: malo })?.precio, String(malo))
    assert.ok(campos(esquemaTarifa, { nombre: '  ', precio: 1 }).nombre)
    assert.ok(campos(esquemaTarifa, { nombre: 'x'.repeat(81), precio: 1 }).nombre)
    assert.ok(campos(esquemaTarifa, { nombre: 'X', precio: 1, condicion: 'x'.repeat(161) }).condicion)
    assert.ok(campos(esquemaOrdenTarifas, { ids: [1, 2, 2] }).ids)
    assert.ok(campos(esquemaOrdenTarifas, { ids: [] }).ids)
    assert.ok(campos(esquemaOrdenTarifas, { ids: [1, 'dos'] })['ids.1'])
  })

  test('el precio como lo escribe una persona y como se muestra', () => {
    assert.equal(leerPrecio('3000'), 3000)
    assert.equal(leerPrecio('3.000'), 3000)
    assert.equal(leerPrecio(' $ 12.500 '), 12500)
    assert.equal(leerPrecio(''), null)
    for (const malo of ['3,50', '3.5', '30.00', 'mil', '-5']) assert.ok(Number.isNaN(leerPrecio(malo)), malo)
    assert.equal(textoPrecio(3000), '$ 3.000')
    assert.equal(textoPrecio(1234567), '$ 1.234.567')
    assert.equal(textoPrecio(500), '$ 500')
  })
})

describe('GET y PUT /horarios', { skip: base.motivo ?? false }, () => {
  let s
  let editor
  before(async () => {
    s = await levantar()
    editor = await s.cookiePara('editor')
  })
  after(() => s?.cerrar())

  const put = (cuerpo) => s.pedir('PUT', 'api:/horarios', { cookie: editor.cookie, cuerpo })

  test('recién migrado: los 7 días cerrados', async () => {
    const r = await s.pedir('GET', 'api:/horarios', { cookie: editor.cookie })
    assert.equal(r.status, 200)
    assert.deepEqual(
      r.json.data.dias,
      [1, 2, 3, 4, 5, 6, 7].map((dia) => ({ dia, ...CERRADO })),
    )
  })

  test('guardar los 7 días: franjas ordenadas, notas vacías a null; la respuesta es como el GET', async () => {
    const cuerpo = semana([franja('16:00', '20:00'), franja('09:00', '13:00')], { nota: '  Visitas guiadas a las 11 ' })
    cuerpo.dias[6] = { dia: 7, abierto: true, franjas: [franja('10:00', '19:00')], nota: '' }
    const r = await put(cuerpo)
    assert.equal(r.status, 200, r.texto)
    assert.deepEqual(r.json.data.dias[1], {
      dia: 2,
      abierto: true,
      franjas: [franja('09:00', '13:00'), franja('16:00', '20:00')],
      nota: 'Visitas guiadas a las 11',
    })
    assert.deepEqual(r.json.data.dias[6], { dia: 7, abierto: true, franjas: [franja('10:00', '19:00')], nota: null })
    assert.deepEqual((await s.pedir('GET', 'api:/horarios', { cookie: editor.cookie })).json.data, r.json.data)
    const filas = await sql('SELECT dia, abierto, franjas, nota FROM horario_semanal ORDER BY dia')
    assert.equal(filas.length, 7)
    assert.deepEqual(filas[1].franjas, [franja('09:00', '13:00'), franja('16:00', '20:00')])
  })

  test('franjas inválidas, superpuestas o más de 2: 400 con el campo exacto, y no cambia nada', async () => {
    const antes = await sql('SELECT * FROM horario_semanal ORDER BY dia')
    for (const [cuerpo, campo] of [
      [semana([franja('13:00', '09:00')]), 'dias.1.franjas.0.cierra'],
      [semana([franja('09:00', '13:00'), franja('12:30', '18:00')]), 'dias.1.franjas.1.abre'],
      [semana([franja('09:00', '10:00'), franja('11:00', '12:00'), franja('13:00', '14:00')]), 'dias.1.franjas'],
      [semana([franja('9:00', '13:00')]), 'dias.1.franjas.0.abre'],
      [semana([]), 'dias.1.franjas'],
      [{ dias: semana([franja('09:00', '13:00')]).dias.slice(0, 6) }, 'dias'],
    ]) {
      const r = await put(cuerpo)
      assert.equal(r.status, 400, campo)
      assert.ok(r.json.campos[campo], `${campo}: ${JSON.stringify(r.json.campos)}`)
    }
    assert.deepEqual(await sql('SELECT * FROM horario_semanal ORDER BY dia'), antes)
  })

  test('si faltaba la fila de un día, el GET lo muestra cerrado y el PUT la vuelve a crear', async () => {
    await sql('DELETE FROM horario_semanal WHERE dia = 4')
    const r = await s.pedir('GET', 'api:/horarios', { cookie: editor.cookie })
    assert.deepEqual(r.json.data.dias[3], { dia: 4, ...CERRADO })
    assert.equal((await put(semana([franja('09:00', '13:00')]))).status, 200)
    assert.equal((await sql('SELECT count(*)::int AS n FROM horario_semanal'))[0].n, 7)
  })
})

describe('tarifas', { skip: base.motivo ?? false }, () => {
  let s
  let editor
  before(async () => {
    s = await levantar()
    editor = await s.cookiePara('editor')
  })
  after(() => s?.cerrar())

  const pedir = (metodo, ruta, cuerpo) =>
    s.pedir(metodo, `api:${ruta}`, { cookie: editor.cookie, ...(cuerpo ? { cuerpo } : {}) })
  const lista = async () => (await pedir('GET', '/tarifas')).json.data

  test('alta: al final, con el precio entero; gratuita sin precio; sin precio y no gratuita, 400', async () => {
    const general = await pedir('POST', '/tarifas', { nombre: 'General', precio: 3000, condicion: '' })
    assert.equal(general.status, 201, general.texto)
    assert.deepEqual(general.json.data, {
      id: general.json.data.id,
      nombre: 'General',
      gratuita: false,
      precio: 3000,
      condicion: null,
      visible: true,
      orden: 1,
    })
    const menores = await pedir('POST', '/tarifas', { nombre: 'Menores de 6 años', gratuita: true, precio: 100 })
    assert.equal(menores.status, 201)
    assert.equal(menores.json.data.precio, null)
    assert.equal(menores.json.data.orden, 2)
    const sinPrecio = await pedir('POST', '/tarifas', { nombre: 'Jubilados' })
    assert.equal(sinPrecio.status, 400)
    assert.deepEqual(sinPrecio.json.campos, { precio: 'Escribí el precio, o marcá la tarifa como gratuita.' })
    // Las claves de más (orden, id) se descartan.
    const conOrden = await pedir('POST', '/tarifas', {
      nombre: 'Estudiantes',
      precio: 1500,
      orden: 99,
      id: 1,
      condicion: 'Con credencial',
      visible: false,
    })
    assert.equal(conOrden.status, 201)
    assert.equal(conOrden.json.data.orden, 3)
    assert.notEqual(conOrden.json.data.id, 1)
    assert.equal(conOrden.json.data.visible, false)
    assert.deepEqual(
      (await lista()).map((t) => t.nombre),
      ['General', 'Menores de 6 años', 'Estudiantes'],
    )
  })

  test('cambiar: el esquema completo; pasar a gratuita borra el precio; 404 si no existe', async () => {
    const [general] = await lista()
    const completa = { nombre: 'General', gratuita: false, precio: 3500, condicion: null, visible: true }
    const r = await pedir('PUT', `/tarifas/${general.id}`, completa)
    assert.equal(r.status, 200, r.texto)
    assert.equal(r.json.data.precio, 3500)
    assert.equal(r.json.data.orden, 1)
    const gratis = await pedir('PUT', `/tarifas/${general.id}`, { ...completa, gratuita: true })
    assert.equal(gratis.status, 200, gratis.texto)
    assert.equal(gratis.json.data.precio, null)
    const sinPrecio = await pedir('PUT', `/tarifas/${general.id}`, { ...completa, precio: null })
    assert.equal(sinPrecio.status, 400)
    assert.ok(sinPrecio.json.campos.precio)
    const [{ precio }] = await sql('SELECT precio FROM tarifas WHERE id = :id', { id: general.id })
    assert.equal(precio, null)
    assert.equal((await pedir('PUT', '/tarifas/2147483647', { ...completa, nombre: 'X', precio: 1 })).status, 404)
    await pedir('PUT', `/tarifas/${general.id}`, { ...completa, precio: 3000 })
  })

  test('cambiar: un campo que falta da 400 (no vuelve a su valor por defecto) y la tarifa queda como estaba', async () => {
    const [, , estudiantes] = await lista()
    assert.equal(estudiantes.visible, false, 'la del alta, oculta')
    assert.equal(estudiantes.condicion, 'Con credencial')
    const { id, orden: _orden, ...completa } = estudiantes
    for (const falta of ['nombre', 'gratuita', 'precio', 'condicion', 'visible']) {
      const { [falta]: _, ...sinUno } = completa
      const r = await pedir('PUT', `/tarifas/${id}`, sinUno)
      assert.equal(r.status, 400, `sin ${falta}: ${r.texto}`)
      assert.ok(r.json.campos[falta], `sin ${falta}: ${JSON.stringify(r.json.campos)}`)
    }
    const [igual] = await sql('SELECT visible, condicion FROM tarifas WHERE id = :id', { id })
    assert.deepEqual(igual, { visible: false, condicion: 'Con credencial' })
    // Con todo, pasa (y el panel siempre manda todo).
    assert.equal((await pedir('PUT', `/tarifas/${id}`, completa)).status, 200)
  })

  test('orden: la lista entera en el orden nuevo; si no coincide con las que hay, 409; con repetidas, 400', async () => {
    const [a, b, c] = await lista()
    const r = await pedir('PUT', '/tarifas/orden', { ids: [c.id, a.id, b.id] })
    assert.equal(r.status, 200, r.texto)
    assert.deepEqual(
      r.json.data.map((t) => [t.id, t.orden]),
      [
        [c.id, 1],
        [a.id, 2],
        [b.id, 3],
      ],
    )
    assert.deepEqual(
      (await lista()).map((t) => t.id),
      [c.id, a.id, b.id],
    )
    for (const ids of [
      [c.id, a.id],
      [c.id, a.id, b.id, 2147483647],
    ]) {
      const mal = await pedir('PUT', '/tarifas/orden', { ids })
      assert.equal(mal.status, 409, JSON.stringify(ids))
      assert.match(mal.json.error, /cambiaron mientras tanto/)
    }
    const repetidas = await pedir('PUT', '/tarifas/orden', { ids: [c.id, c.id, a.id] })
    assert.equal(repetidas.status, 400)
    assert.ok(repetidas.json.campos.ids)
    assert.deepEqual(
      (await lista()).map((t) => t.id),
      [c.id, a.id, b.id],
    )
  })

  test('eliminar: de verdad; la segunda vez, 404', async () => {
    const [, , ultima] = await lista()
    const r = await pedir('DELETE', `/tarifas/${ultima.id}`)
    assert.equal(r.status, 200)
    assert.deepEqual(r.json.data, { id: ultima.id })
    assert.equal((await pedir('DELETE', `/tarifas/${ultima.id}`)).status, 404)
    assert.equal((await lista()).length, 2)
  })

  test('el orden queda 1..n: un alta después de huecos renumera y va al final (la columna no se llena)', async () => {
    const antes = await lista()
    // Como si se hubieran agregado y borrado tarifas miles de veces: el último lugar en el máximo de smallint. Antes,
    // el alta siguiente daba 500.
    await sql('UPDATE tarifas SET orden = 32767 WHERE id = :id', { id: antes.at(-1).id })
    const r = await pedir('POST', '/tarifas', { nombre: 'Después del hueco', precio: 1 })
    assert.equal(r.status, 201, r.texto)
    assert.equal(r.json.data.orden, antes.length + 1)
    const despues = await lista()
    assert.deepEqual(
      despues.map((t) => t.id),
      [...antes.map((t) => t.id), r.json.data.id],
    )
    assert.deepEqual(
      despues.map((t) => t.orden),
      despues.map((_, i) => i + 1),
    )
    // Altas y bajas de otra que no es la última: el último lugar es siempre la cantidad.
    let anterior = r.json.data.id
    for (let i = 0; i < 3; i++) {
      const nueva = await pedir('POST', '/tarifas', { nombre: `Ciclo ${i}`, precio: 1 })
      assert.equal(nueva.status, 201, nueva.texto)
      assert.equal((await pedir('DELETE', `/tarifas/${anterior}`)).status, 200)
      anterior = nueva.json.data.id
    }
    const ultima = await pedir('POST', '/tarifas', { nombre: 'Ciclo final', precio: 1 })
    assert.equal(ultima.json.data.orden, antes.length + 2)
    const [{ cuantas, maximo }] = await sql('SELECT count(*)::int AS cuantas, max(orden)::int AS maximo FROM tarifas')
    assert.equal(maximo, cuantas)
    await sql(`DELETE FROM tarifas WHERE nombre LIKE 'Ciclo %'`)
  })

  test(`hasta ${TARIFAS_MAX} tarifas: la siguiente da 409`, async () => {
    const hay = (await lista()).length
    await sql(
      `INSERT INTO tarifas (nombre, gratuita, precio, orden, created_at, updated_at)
       SELECT 'Relleno ' || n, false, 1, 100 + n, now(), now() FROM generate_series(1, :cuantas) AS n`,
      { cuantas: TARIFAS_MAX - hay },
    )
    const r = await pedir('POST', '/tarifas', { nombre: 'Una más', precio: 1 })
    assert.equal(r.status, 409)
    assert.match(r.json.error, new RegExp(`Ya hay ${TARIFAS_MAX} tarifas`))
    await sql(`DELETE FROM tarifas WHERE nombre LIKE 'Relleno %'`)
  })

  test(`altas a la vez cerca del tope: nunca más de ${TARIFAS_MAX} y sin dos en el mismo lugar`, async () => {
    const hay = (await lista()).length
    await sql(
      `INSERT INTO tarifas (nombre, gratuita, precio, orden, created_at, updated_at)
       SELECT 'Relleno ' || n, false, 1, 100 + n, now(), now() FROM generate_series(1, :cuantas) AS n`,
      { cuantas: TARIFAS_MAX - 2 - hay },
    )
    // La carrera, sin azar: una transacción de la prueba toma la tabla entera (ni se puede leer), tres altas (cada una
    // con su sesión) quedan esperándola y, al soltarla, arrancan juntas. Sin el candado de crear(), las tres contaban
    // 48 y entraban todas. Tres: la app y la prueba comparten el pool de cinco conexiones (una es de esta transacción y
    // otra, de esperarTrabados).
    const otros = []
    for (let i = 0; i < 3; i++) otros.push(await s.cookiePara('editor'))
    const t = await base.sequelize.transaction()
    let respuestas
    try {
      await base.sequelize.query('LOCK TABLE tarifas IN ACCESS EXCLUSIVE MODE', { transaction: t })
      respuestas = Promise.all(
        otros.map((o, i) =>
          s.pedir('POST', 'api:/tarifas', { cookie: o.cookie, cuerpo: { nombre: `A la vez ${i}`, precio: 1 } }),
        ),
      )
      await esperarTrabados(otros.length)
    } finally {
      await t.commit()
    }
    const estados = (await respuestas).map((r) => r.status)
    assert.deepEqual([...estados].sort(), [201, 201, 409], JSON.stringify(estados))
    const [{ cuantas, lugares }] = await sql(
      'SELECT count(*)::int AS cuantas, count(DISTINCT orden)::int AS lugares FROM tarifas',
    )
    assert.equal(cuantas, TARIFAS_MAX)
    assert.equal(lugares, TARIFAS_MAX)
    await sql(`DELETE FROM tarifas WHERE nombre LIKE 'Relleno %' OR nombre LIKE 'A la vez %'`)
  })
})
