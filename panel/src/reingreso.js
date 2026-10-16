// Qué hacer cuando alguien vuelve a entrar desde el diálogo de reingreso (componentes/ReingresoDialogo.jsx). Código sin
// React ni DOM: lo prueban las pruebas del servidor (server/pruebas/panel-api.test.js).
// - 'otra-cuenta': entró otra persona (una computadora compartida). Lo que hay en la pantalla (lo escrito, los datos,
//   el nombre de la barra) es de la anterior y nada de eso se guarda a nombre de la nueva: el panel vuelve a empezar
//   desde el Inicio, sin preguntar por los cambios sin guardar (el aviso del navegador confundía, y si la persona se
//   quedaba, lo escrito por la primera se guardaba a nombre de la segunda).
// - 'otro-rol': la misma persona, pero mientras tanto le cambiaron el rol (un admin la pasó a editor): el pedido se
//   repite y la pantalla se vuelve a cargar (si ya no es para su rol, dice "No tenés permiso" en vez de mostrar datos
//   y botones de admin).
// - 'igual': se repite el pedido y todo sigue como estaba.
// conocida: la sesión que mostraba el panel (sesionConocida(): también después de "Ahora no"); nueva: la del ingreso.

/**
 * @param {{ usuario: { id: number, rol: string } } | null} conocida
 * @param {{ usuario: { id: number, rol: string } }} nueva
 * @returns {'otra-cuenta' | 'otro-rol' | 'igual'}
 */
export function queHacerAlReingresar(conocida, nueva) {
  if (!conocida) return 'igual'
  if (conocida.usuario.id !== nueva.usuario.id) return 'otra-cuenta'
  if (conocida.usuario.rol !== nueva.usuario.rol) return 'otro-rol'
  return 'igual'
}
