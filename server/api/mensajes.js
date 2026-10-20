// /administracion/api/mensajes (E4.9; plan 4.3 y 8): los mensajes del formulario de contacto del sitio, solo para
// admins (son datos personales: plan 9, "Privacidad"). Solo lectura, de la más nueva a la más vieja, 50 por página
// (?pagina=; la consulta se valida con zod: algo malo da 400 con el campo). Sin borrar, responder ni reintentar (el
// reintento está en la fase 2); la tarea diaria borra los de más de 180 días (server/tareas.js).
// Cada uno: { id, fecha (ISO), nombre, email, mensaje, envio: 'pendiente' | 'enviado' | 'fallido', error } (error: el
// código de nodemailer de un fallido, o null).
import { z } from '../../compartido/esquemas/zod.js'

/** Los mensajes de cada página del panel. */
export const MENSAJES_POR_PAGINA = 50

const sinNada = (v) => (v === '' ? undefined : v)
const consulta = z.object({
  pagina: z.preprocess(
    sinNada,
    z.coerce
      .number({ error: 'La página no es válida.' })
      .int({ error: 'La página no es válida.' })
      .min(1, { error: 'La página no es válida.' })
      .max(100_000, { error: 'La página no es válida.' })
      .default(1),
  ),
})

async function listar(req, res, { sequelize }) {
  // Un ZodError va a server/errores.js: 400 con el campo.
  const { pagina } = consulta.parse(req.query ?? {})
  const { rows, count } = await sequelize.models.MensajeContacto.findAndCountAll({
    attributes: ['id', 'nombre', 'email', 'mensaje', 'envio', 'error', 'createdAt'],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: MENSAJES_POR_PAGINA,
    offset: (pagina - 1) * MENSAJES_POR_PAGINA,
  })
  res.json({
    data: {
      items: rows.map((m) => ({
        id: m.id,
        fecha: m.createdAt.toISOString(),
        nombre: m.nombre,
        email: m.email,
        mensaje: m.mensaje,
        envio: m.envio,
        error: m.error ?? null,
      })),
      total: count,
      pagina,
      por: MENSAJES_POR_PAGINA,
      paginas: Math.max(1, Math.ceil(count / MENSAJES_POR_PAGINA)),
    },
  })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeMensajes = [{ metodo: 'GET', ruta: '/mensajes', rol: 'admin', manejador: listar }]
