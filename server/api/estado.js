// /administracion/api/estado (plan 4.3, 5.2 y 8): lo que muestra el Inicio del panel, para cualquier rol.
// {
//   paraCompletar: ['direccion', 'telefono', 'emailPublico', 'emailDestinoContacto', 'horario', 'tarifas'],
//     solo lo que falta, en ese orden: los datos del museo vacíos (dirección, teléfono, correo público y, SOLO para un
//     admin, el correo de destino del formulario: un editor no lo puede ver ni cambiar, plan 4.5), el horario sin
//     ningún día abierto y ninguna tarifa visible. Un texto que solo tiene espacios cuenta como vacío;
//   unSoloAdmin: true si hay un administrador activo (o ninguno): lo recomendado son dos (plan 4.4);
//   correo: el formulario de contacto y su envío por correo (E4.5 y E4.9; plan 8, punto 4), para los dos roles:
//     { estado: 'sin_configurar' | 'ok' | 'falla', formulario, desde, codigo, sinEnviar }
//     - sin_configurar: no hay casilla de envío (SMTP_USUARIO, server/correo.js): no hay formulario;
//     - falla: la casilla falló en su última prueba o envío (el estado del correo, en memoria) o hay mensajes que no
//       se pudieron mandar después del último que sí (los "fallido" posteriores al último "enviado"); desde: el primero
//       de los dos (ISO), codigo: el del último fallo (EAUTH, ETIMEDOUT…), sinEnviar: cuántos mensajes no salieron;
//     - ok: lo demás;
//     formulario: si el sitio lo dibuja (casilla y dirección de destino; sin destino, el admin lo ve también en
//     "Para completar"). Nunca las direcciones: solo códigos, fechas y cantidades;
//   tareasFallidas: [{ tarea, desde, ultima, codigo }], las tareas diarias cuya última vuelta falló (server/tareas.js);
//   espacio: { usadoMb, totalMb } (E3.1), lo que ocupa la base (pg_database_size, redondeado a MB) y su tamaño
//     contratado (ESPACIO_BASE_MB, server/config.js). Las fotos van en la base: el Inicio avisa desde el 80 %. Va a los
//     dos roles (cualquiera puede subir fotos).
// }
// Los códigos, no los textos: los textos y los enlaces a cada pantalla los pone el panel (panel/src/pantallas/Inicio.jsx).
// Con las fotos en la base (plan 16.1) no hay "fotos faltantes" (era del disco, E3.6): lo reemplaza el espacio.
import { QueryTypes } from 'sequelize'

// Una sola consulta: la fila del museo, los tres conteos, el tamaño de la base y los mensajes del formulario que no
// salieron por correo después del último que sí (E4.9). Sin datos de la persona: no lleva replacements.
const CONSULTA = `
WITH ultimo AS (SELECT max(created_at) AS en FROM mensajes_contacto WHERE envio = 'enviado'),
     sin_enviar AS (
       SELECT count(*)::int AS cantidad, min(created_at) AS desde, (array_agg(error ORDER BY created_at DESC))[1] AS codigo
       FROM mensajes_contacto, ultimo
       WHERE envio = 'fallido' AND (ultimo.en IS NULL OR created_at > ultimo.en))
SELECT m.direccion, m.telefono, m.email_publico, m.email_destino_contacto,
       (SELECT count(*) FROM horario_semanal WHERE abierto)::int AS dias_abiertos,
       (SELECT count(*) FROM tarifas WHERE visible)::int AS tarifas_visibles,
       (SELECT count(*) FROM usuarios WHERE rol = 'admin' AND activo)::int AS admins_activos,
       pg_database_size(current_database())::bigint AS bytes_base,
       sin_enviar.cantidad AS sin_enviar, sin_enviar.desde AS sin_enviar_desde, sin_enviar.codigo AS sin_enviar_codigo
FROM (SELECT 1) AS uno
LEFT JOIN museo m ON m.id = 1
CROSS JOIN sin_enviar
`

const MB = 1024 * 1024
const vacio = (texto) => texto == null || String(texto).trim() === ''
const iso = (fecha) => (fecha == null ? null : new Date(fecha).toISOString())

/**
 * El estado del formulario de contacto y de su envío (plan 8, punto 4).
 * @param {ReturnType<typeof import('../correo.js').crearCorreo> | null} correo
 * @param {{ email_destino_contacto: string | null, sin_enviar: number, sin_enviar_desde: Date | null,
 *   sin_enviar_codigo: string | null }} fila
 */
export function estadoDelCorreo(correo, fila) {
  const sinEnviar = fila.sin_enviar ?? 0
  if (!correo?.configurado) {
    return { estado: 'sin_configurar', formulario: false, desde: null, codigo: null, sinEnviar }
  }
  const formulario = !vacio(fila.email_destino_contacto)
  const actual = correo.estado()
  const fallando = actual.ok === false
  if (!fallando && sinEnviar === 0) return { estado: 'ok', formulario, desde: null, codigo: null, sinEnviar: 0 }
  const fechas = [fallando ? actual.desde : null, fila.sin_enviar_desde].filter(Boolean).map((f) => new Date(f).getTime())
  return {
    estado: 'falla',
    formulario,
    desde: fechas.length ? iso(Math.min(...fechas)) : null,
    codigo: (fallando ? actual.codigo : null) ?? fila.sin_enviar_codigo ?? null,
    sinEnviar,
  }
}

async function verEstado(req, res, { config, sequelize, registroTareas, correo }) {
  const [fila] = await sequelize.query(CONSULTA, { type: QueryTypes.SELECT })
  const esAdmin = req.usuario.rol === 'admin'
  const paraCompletar = []
  if (vacio(fila.direccion)) paraCompletar.push('direccion')
  if (vacio(fila.telefono)) paraCompletar.push('telefono')
  if (vacio(fila.email_publico)) paraCompletar.push('emailPublico')
  if (esAdmin && vacio(fila.email_destino_contacto)) paraCompletar.push('emailDestinoContacto')
  if (fila.dias_abiertos === 0) paraCompletar.push('horario')
  if (fila.tarifas_visibles === 0) paraCompletar.push('tarifas')
  res.json({
    data: {
      paraCompletar,
      unSoloAdmin: fila.admins_activos <= 1,
      correo: estadoDelCorreo(correo, fila),
      tareasFallidas: registroTareas?.fallidas() ?? [],
      // bigint llega como texto.
      espacio: { usadoMb: Math.round(Number(fila.bytes_base) / MB), totalMb: config.ESPACIO_BASE_MB },
    },
  })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeEstado = [{ metodo: 'GET', ruta: '/estado', rol: 'editor', manejador: verEstado }]
