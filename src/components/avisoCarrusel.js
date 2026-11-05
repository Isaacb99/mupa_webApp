// Qué dice y cuándo la región viva del carrusel de Novedades (CarruselNovedades.jsx), sin React ni DOM: lo prueba
// server/pruebas/layout.test.js con un reloj falso.
// - Avisa en qué tarjeta quedó la fila solo después de Anterior o Siguiente, cuando quedó quieta (A11Y-03 de la
//   verificación, 02/11/2026): con el trackpad, el dedo o el foco no avisa (el enlace enfocado ya dice cuál es).
// - Cada botón vacía la región y el aviso se escribe después, así suena aunque diga lo mismo que el anterior (R1-01 de
//   la re-verificación: Siguiente, la fila a mano al principio y Siguiente otra vez escribían el mismo texto, React no
//   tocaba el DOM y el lector no decía nada). Entre vaciarla y escribirla pasan al menos ESPERA_MS: si no, con
//   reduced-motion (la fila llega en el cuadro siguiente) el navegador podía juntar los dos cambios en uno y el lector
//   no veía ninguno.
// - Si la fila se mueve por otra causa (la mano, el foco), la región se vacía: no queda diciendo una tarjeta vieja para
//   quien la lea con el cursor del lector.

/** ms como mínimo entre vaciar la región y escribir el aviso siguiente. */
export const ESPERA_MS = 100

/**
 * @param {{ escribir: (texto: string) => void, ahora?: () => number,
 *   programar?: (fn: () => void, ms: number) => unknown, cancelar?: (id: unknown) => void }} opciones
 *   escribir: pone el texto en la región (el setState del componente)
 */
export function crearAvisador({
  escribir,
  ahora = () => performance.now(),
  programar = (fn, ms) => setTimeout(fn, ms),
  cancelar = (id) => clearTimeout(id),
}) {
  let texto = ''
  let vaciadaEn = Number.NEGATIVE_INFINITY
  let pendiente = null
  // Dónde estaba la fila (scrollLeft) cuando se escribió el aviso que muestra la región; null si no muestra ninguno.
  let posicion = null

  const poner = (nuevo) => {
    texto = nuevo
    escribir(nuevo)
  }
  const cortar = () => {
    if (pendiente !== null) cancelar(pendiente)
    pendiente = null
  }
  const vaciar = () => {
    cortar()
    posicion = null
    if (texto) {
      poner('')
      vaciadaEn = ahora()
    }
  }

  return {
    /** Anterior o Siguiente mandaron la fila a otra tarjeta: lo que decía la región ya no vale. */
    pedido() {
      vaciar()
    },
    /** La fila quedó quieta donde la mandó el botón (en `x`): la región dice `aviso`. */
    llegada(aviso, x) {
      cortar()
      const hacer = () => {
        pendiente = null
        poner(aviso)
        posicion = x
      }
      const falta = vaciadaEn + ESPERA_MS - ahora()
      if (falta > 0) pendiente = programar(hacer, falta)
      else hacer()
    },
    /** La fila se movió por otra causa (está en `x`): si se alejó de donde se escribió el aviso, la región se vacía. */
    movida(x) {
      if (posicion !== null && Math.abs(x - posicion) > 2) vaciar()
    },
    /** Al desmontar: nada pendiente. */
    cerrar() {
      cortar()
    },
  }
}
