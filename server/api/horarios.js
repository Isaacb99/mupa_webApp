// /administracion/api/horarios (plan 4.3 y 5.3): el horario semanal, para cualquier rol.
// - GET /horarios: { dias: [{ dia, abierto, franjas: [{ abre, cierra }], nota }] }, los 7 (ISO: 1 = lunes). Si
//   faltara una fila (la migración 02 crea las 7), ese día sale cerrado.
// - PUT /horarios { dias }: los 7 días juntos (compartido/esquemas/horarios.js: hasta 2 franjas con abre < cierra y
//   sin superponerse; un día cerrado se guarda sin franjas), en una sola sentencia. Responde como el GET.
// La nota general de los horarios es del museo (nota_horarios, PUT /museo).
import { esquemaHorarios } from '../../compartido/esquemas/horarios.js'
import { log } from '../log.js'

const diaDelPanel = (d) => ({ dia: d.dia, abierto: d.abierto, franjas: d.franjas ?? [], nota: d.nota ?? null })

async function leerDias(sequelize, opciones = {}) {
  const filas = await sequelize.models.HorarioSemanal.findAll({ order: [['dia', 'ASC']], ...opciones })
  const porDia = new Map(filas.map((f) => [f.dia, f]))
  return [1, 2, 3, 4, 5, 6, 7].map((dia) => diaDelPanel(porDia.get(dia) ?? { dia, abierto: false }))
}

async function ver(req, res, { sequelize }) {
  res.json({ data: { dias: await leerDias(sequelize) } })
}

async function guardar(req, res, { sequelize }) {
  const { HorarioSemanal } = sequelize.models
  const dias = req.datos.dias.map(({ dia, abierto, franjas, nota }) => ({ dia, abierto, franjas, nota }))
  const guardados = await sequelize.transaction(async (transaction) => {
    // INSERT … ON CONFLICT (dia) DO UPDATE: los 7 de una vez (y si faltaba una fila, la crea).
    await HorarioSemanal.bulkCreate(dias, {
      fields: ['dia', 'abierto', 'franjas', 'nota'],
      updateOnDuplicate: ['abierto', 'franjas', 'nota'],
      transaction,
    })
    return leerDias(sequelize, { transaction })
  })
  log('info', 'horario_actualizado', { abiertos: dias.filter((d) => d.abierto).length, por: req.usuario.id })
  res.json({ data: { dias: guardados } })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeHorarios = [
  { metodo: 'GET', ruta: '/horarios', rol: 'editor', manejador: ver },
  { metodo: 'PUT', ruta: '/horarios', rol: 'editor', cuerpo: esquemaHorarios, manejador: guardar },
]
