// Tareas diarias del servicio (plan 2.3, "Arranque", paso 5): corren al arrancar y una vez por día, en el mismo
// proceso (hay una sola instancia). Un fallo se avisa en el log y no tumba el servicio; la próxima vuelta reintenta.
// Hoy: borrar las sesiones vencidas (12 h de máximo o 2 h sin uso). Desde E4.9, borrar los mensajes del formulario de
// más de 180 días; desde E4.5, verificar la casilla de envío.
import { borrarSesionesVencidas } from './auth/sesiones.js'
import { codigoDeError, log } from './log.js'

const UN_DIA = 24 * 3_600_000

/**
 * @param {{ sequelize: import('sequelize').Sequelize | null }} deps
 * @returns {{ listas: Promise<void>, detener: () => void }}  listas: la primera vuelta terminada (las pruebas)
 */
export function programarTareas({ sequelize }) {
  if (!sequelize) return { listas: Promise.resolve(), detener: () => {} }
  async function vuelta() {
    try {
      const borradas = await borrarSesionesVencidas(sequelize)
      log('info', 'sesiones_vencidas', { borradas })
    } catch (err) {
      log('aviso', 'tarea_fallida', { tarea: 'sesiones_vencidas', mensaje: err.message, codigo: codigoDeError(err) })
    }
  }
  const listas = vuelta()
  const reloj = setInterval(vuelta, UN_DIA)
  // Que el reloj no mantenga vivo el proceso: el apagado ordenado sale igual.
  reloj.unref()
  return { listas, detener: () => clearInterval(reloj) }
}
