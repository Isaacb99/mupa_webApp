// /administracion/api/museo (plan 4.3, 4.5 y 5.3): los datos del museo, para cualquier rol, salvo el correo de
// destino del formulario de contacto, que es solo de los admins.
// - GET /museo: los campos que se editan en el panel (compartido/esquemas/museo.js, NOMBRES_CAMPOS_MUSEO) y la última
//   edición ({ nombre, fecha }, o null si nadie la cambió desde el panel). A un editor, sin emailDestinoContacto: ni
//   se lee de la base.
// - PUT /museo: PARCIAL, cambia solo los campos que trae (Datos del museo y Visitas mandan cada una los suyos). Un
//   editor que incluya el correo de destino (aunque sea null o el mismo) recibe 403 antes de validar nada. Las reglas
//   de dos campos (compra activa con su dirección, "Mostrar hasta" con su aviso) se comprueban sobre la fila como
//   quedaría, con la fila bloqueada (FOR UPDATE): dos guardados a la vez esperan en vez de dejarla a medias. Quién y
//   cuándo (actualizado_por, updated_at) salen de la sesión y del reloj, nunca del pedido. Responde como el GET.
// Los textos con formato de Visitas (comoLlegar, normas, accesibilidad; desde E3.2) van como cualquier otro campo: el
// GET los da como están en la base (el JSON del editor, o null) y el PUT los guarda en la forma canónica de
// compartido/esquemas/textoRico.js. El log lleva sus nombres, nunca el texto.
import { esquemaCambioMuseo, NOMBRES_CAMPOS_MUSEO, problemasDeMuseo } from '../../compartido/esquemas/museo.js'
import { httpError } from '../errores.js'
import { log } from '../log.js'

const SOLO_ADMIN = 'emailDestinoContacto'
// También el nombre de la columna: un editor no lo puede mandar de ninguna forma.
const SOLO_ADMIN_CLAVES = [SOLO_ADMIN, 'email_destino_contacto']
export const NO_CORREO_DESTINO = 'Solo un administrador puede ver y cambiar el correo de destino del formulario.'

const camposPara = (esAdmin) => NOMBRES_CAMPOS_MUSEO.filter((c) => esAdmin || c !== SOLO_ADMIN)

/** La fila del museo para el panel, con lo que corresponde al rol. */
async function leerParaPanel(sequelize, esAdmin) {
  const { Museo } = sequelize.models
  const fila = await Museo.findByPk(1, {
    attributes: [...camposPara(esAdmin), 'updatedAt', 'actualizadoPor'],
    include: [{ association: 'editor', attributes: ['nombre'] }],
  })
  const datos = {}
  for (const campo of camposPara(esAdmin)) datos[campo] = fila?.[campo] ?? null
  datos.redes ??= []
  datos.compraActiva ??= false
  datos.ultimaEdicion = fila?.actualizadoPor ? { nombre: fila.editor?.nombre ?? null, fecha: fila.updatedAt } : null
  return datos
}

async function ver(req, res, { sequelize }) {
  res.json({ data: await leerParaPanel(sequelize, req.usuario.rol === 'admin') })
}

/** Antes de validar: un editor no puede mandar el correo de destino (403, plan 4.3). */
function correoDestinoSoloAdmin(req, res, next) {
  const cuerpo = req.body
  const loTrae = cuerpo && typeof cuerpo === 'object' && SOLO_ADMIN_CLAVES.some((c) => Object.hasOwn(cuerpo, c))
  if (loTrae && req.usuario.rol !== 'admin') throw httpError(403, NO_CORREO_DESTINO)
  next()
}

async function guardar(req, res, { sequelize }) {
  const { Museo } = sequelize.models
  const cambios = req.datos
  const campos = Object.keys(cambios)
  await sequelize.transaction(async (transaction) => {
    // La migración 02 crea la fila; si alguien la borró a mano, vuelve vacía (como la crea la migración).
    const fila =
      (await Museo.findByPk(1, { lock: transaction.LOCK.UPDATE, transaction })) ??
      (await Museo.create({ id: 1 }, { fields: ['id'], transaction }))
    const problemas = problemasDeMuseo({ ...fila.get({ plain: true }), ...cambios }, campos)
    if (Object.keys(problemas).length) throw httpError(400, 'Revisá los datos.', { campos: problemas })
    // updated_at lo pone Sequelize (timestamps); actualizado_por, la sesión.
    await fila.update(
      { ...cambios, actualizadoPor: req.usuario.id },
      { fields: [...campos, 'actualizadoPor'], transaction },
    )
  })
  // Los nombres de los campos, nunca los valores (pueden ser correos).
  log('info', 'museo_actualizado', { campos, por: req.usuario.id })
  res.json({ data: await leerParaPanel(sequelize, req.usuario.rol === 'admin') })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeMuseo = [
  { metodo: 'GET', ruta: '/museo', rol: 'editor', manejador: ver },
  {
    metodo: 'PUT',
    ruta: '/museo',
    rol: 'editor',
    // Lleva los tres textos con formato de Visitas: 300 kB (plan 2.4), así entran los tres en su tope de bytes
    // (BYTES_MAX de compartido/esquemas/textoRico.js) aunque cambien juntos.
    limiteJson: '300kb',
    antes: () => [correoDestinoSoloAdmin],
    cuerpo: esquemaCambioMuseo,
    manejador: guardar,
  },
]
