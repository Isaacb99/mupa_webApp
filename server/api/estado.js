// /administracion/api/estado (plan 4.3, 5.2 y 8): lo que muestra el Inicio del panel, para cualquier rol.
// {
//   paraCompletar: ['direccion', 'telefono', 'emailPublico', 'emailDestinoContacto', 'horario', 'tarifas'],
//     solo lo que falta, en ese orden: los datos del museo vacíos (dirección, teléfono, correo público y, SOLO para un
//     admin, el correo de destino del formulario: un editor no lo puede ver ni cambiar, plan 4.5), el horario sin
//     ningún día abierto y ninguna tarifa visible. Un texto que solo tiene espacios cuenta como vacío;
//   unSoloAdmin: true si hay un administrador activo (o ninguno): lo recomendado son dos (plan 4.4);
//   correo: { estado: 'sin_configurar' }, el envío del formulario de contacto. Hasta E4.5 no hay casilla de envío;
//     desde E4.5/E4.9 suma 'ok' | 'falla', desde cuándo y cuántos mensajes quedaron sin enviar (plan 8, punto 4);
//   tareasFallidas: [{ tarea, desde, ultima, codigo }], las tareas diarias cuya última vuelta falló (server/tareas.js);
// }
// Los códigos, no los textos: los textos y los enlaces a cada pantalla los pone el panel (panel/src/pantallas/Inicio.jsx).
// Las fotos faltantes (solo con disco) se suman con E3.6.
import { QueryTypes } from 'sequelize'

// Una sola consulta: la fila del museo y los tres conteos. Sin datos de la persona: no lleva replacements.
const CONSULTA = `
SELECT m.direccion, m.telefono, m.email_publico, m.email_destino_contacto,
       (SELECT count(*) FROM horario_semanal WHERE abierto)::int AS dias_abiertos,
       (SELECT count(*) FROM tarifas WHERE visible)::int AS tarifas_visibles,
       (SELECT count(*) FROM usuarios WHERE rol = 'admin' AND activo)::int AS admins_activos
FROM (SELECT 1) AS uno
LEFT JOIN museo m ON m.id = 1
`

const vacio = (texto) => texto == null || String(texto).trim() === ''

async function verEstado(req, res, { sequelize, registroTareas }) {
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
      correo: { estado: 'sin_configurar' },
      tareasFallidas: registroTareas?.fallidas() ?? [],
    },
  })
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeEstado = [{ metodo: 'GET', ruta: '/estado', rol: 'editor', manejador: verEstado }]
