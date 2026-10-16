// /administracion/api/tarifas (plan 3.2, 4.3 y 5.3): las tarifas, para cualquier rol.
// - GET /tarifas: todas (también las ocultas), en su orden.
// - POST /tarifas { nombre, gratuita, precio, condicion, visible }: la crea al final (201). Hasta TARIFAS_MAX.
// - PUT /tarifas/orden { ids }: el orden nuevo, con TODAS las tarifas (las bloquea mientras tanto); si la lista no
//   coincide con las que hay (alguien agregó o borró una mientras tanto), 409. Responde la lista. Va ANTES de
//   /tarifas/:id en la tabla: si no, "orden" se tomaría como un :id.
// - PUT /tarifas/:id: la tarifa COMPLETA (esquemaTarifaCompleta, sin valores por defecto): un campo que falta da 400,
//   así un cambio nunca vuelve a publicar una oculta ni borra la condición sin querer.
// - DELETE /tarifas/:id: la borra de verdad. El id es estable porque lo va a referenciar la venta de entradas (plan
//   3.6): el panel recomienda ocultarla (visible = false) en vez de borrarla.
// Precio en pesos, sin centavos; una gratuita va sin precio (lo resuelve el esquema).
// Las altas y los cambios de orden van de a uno (LOCK TABLE ... SHARE ROW EXCLUSIVE, que choca consigo mismo y con
// cualquier escritura, pero no con las lecturas del sitio): si no, dos altas a la vez pasaban el tope de TARIFAS_MAX o
// quedaban en el mismo lugar.
// El orden queda siempre 1..n: borrar no renumera, así que el alta, si encuentra huecos (o lugares repetidos), primero
// renumera las que hay, en el mismo orden, y la nueva va en n + 1. Si no, cada alta después de borrar otra sumaba 1 al
// máximo y la columna (smallint) se terminaba llenando: el alta daba 500.
import { QueryTypes } from 'sequelize'
import {
  esquemaOrdenTarifas,
  esquemaTarifa,
  esquemaTarifaCompleta,
  TARIFAS_MAX,
} from '../../compartido/esquemas/tarifas.js'
import { httpError } from '../errores.js'
import { log } from '../log.js'

const NO_EXISTE = 'No existe esa tarifa.'
const CAMPOS = ['nombre', 'gratuita', 'precio', 'condicion', 'visible']
const DE_A_UNO = 'LOCK TABLE tarifas IN SHARE ROW EXCLUSIVE MODE'

export const tarifaDelPanel = (t) => ({
  id: t.id,
  nombre: t.nombre,
  gratuita: t.gratuita,
  precio: t.precio,
  condicion: t.condicion,
  visible: t.visible,
  orden: t.orden,
})

const listarTodas = (Tarifa, opciones = {}) =>
  Tarifa.findAll({
    order: [
      ['orden', 'ASC'],
      ['id', 'ASC'],
    ],
    ...opciones,
  })

async function listar(req, res, { sequelize }) {
  const tarifas = await listarTodas(sequelize.models.Tarifa)
  res.json({ data: tarifas.map(tarifaDelPanel) })
}

async function crear(req, res, { sequelize }) {
  const { Tarifa } = sequelize.models
  const tarifa = await sequelize.transaction(async (transaction) => {
    await sequelize.query(DE_A_UNO, { transaction })
    const [{ cuantas, ultimo }] = await sequelize.query(
      'SELECT count(*)::int AS cuantas, coalesce(max(orden), 0)::int AS ultimo FROM tarifas',
      { type: QueryTypes.SELECT, transaction },
    )
    if (cuantas >= TARIFAS_MAX) {
      throw httpError(409, `Ya hay ${TARIFAS_MAX} tarifas: borrá u ocultá alguna antes de agregar otra.`)
    }
    if (ultimo !== cuantas) {
      await sequelize.query(
        `UPDATE tarifas SET orden = n.lugar
         FROM (SELECT id, row_number() OVER (ORDER BY orden, id) AS lugar FROM tarifas) AS n
         WHERE tarifas.id = n.id AND tarifas.orden <> n.lugar`,
        { transaction },
      )
    }
    return Tarifa.create({ ...req.datos, orden: cuantas + 1 }, { fields: [...CAMPOS, 'orden'], transaction })
  })
  log('info', 'tarifa_creada', { tarifa_id: tarifa.id, por: req.usuario.id })
  res.status(201).json({ data: tarifaDelPanel(tarifa) })
}

async function modificar(req, res, { sequelize }) {
  const { Tarifa } = sequelize.models
  const [cuantas, [guardada]] = await Tarifa.update(req.datos, {
    where: { id: req.idRuta },
    fields: CAMPOS,
    returning: true,
  })
  if (!cuantas) throw httpError(404, NO_EXISTE)
  log('info', 'tarifa_modificada', { tarifa_id: req.idRuta, por: req.usuario.id })
  res.json({ data: tarifaDelPanel(guardada) })
}

async function eliminar(req, res, { sequelize }) {
  const borradas = await sequelize.models.Tarifa.destroy({ where: { id: req.idRuta } })
  if (!borradas) throw httpError(404, NO_EXISTE)
  log('info', 'tarifa_eliminada', { tarifa_id: req.idRuta, por: req.usuario.id })
  res.json({ data: { id: req.idRuta } })
}

async function ordenar(req, res, { sequelize }) {
  const { Tarifa } = sequelize.models
  const { ids } = req.datos
  const tarifas = await sequelize.transaction(async (transaction) => {
    await sequelize.query(DE_A_UNO, { transaction })
    const actuales = await Tarifa.findAll({
      attributes: ['id'],
      order: [['id', 'ASC']],
      lock: transaction.LOCK.UPDATE,
      transaction,
    })
    const hay = new Set(actuales.map((t) => t.id))
    if (hay.size !== ids.length || ids.some((id) => !hay.has(id))) {
      throw httpError(
        409,
        'Las tarifas cambiaron mientras tanto (alguien agregó o borró una). Recargá la pantalla y probá de nuevo.',
      )
    }
    // El lugar de cada una es su posición en la lista (1, 2, 3…), en una sola sentencia.
    await sequelize.query(
      `UPDATE tarifas SET orden = n.lugar, updated_at = now()
       FROM unnest(ARRAY[:ids]::int[]) WITH ORDINALITY AS n(id, lugar)
       WHERE tarifas.id = n.id`,
      { replacements: { ids }, transaction },
    )
    return listarTodas(Tarifa, { transaction })
  })
  log('info', 'tarifas_ordenadas', { cuantas: ids.length, por: req.usuario.id })
  res.json({ data: tarifas.map(tarifaDelPanel) })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeTarifas = [
  { metodo: 'GET', ruta: '/tarifas', rol: 'editor', manejador: listar },
  { metodo: 'POST', ruta: '/tarifas', rol: 'editor', cuerpo: esquemaTarifa, manejador: crear },
  { metodo: 'PUT', ruta: '/tarifas/orden', rol: 'editor', cuerpo: esquemaOrdenTarifas, manejador: ordenar },
  { metodo: 'PUT', ruta: '/tarifas/:id', rol: 'editor', cuerpo: esquemaTarifaCompleta, manejador: modificar },
  { metodo: 'DELETE', ruta: '/tarifas/:id', rol: 'editor', manejador: eliminar },
]
