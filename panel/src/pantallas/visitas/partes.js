// Lo que sabe la pantalla Visitas (Visitas.jsx) sin React: lo prueba server/pruebas/panel-api.test.js. Desde la Visitas
// del tablero "Web" de la diseñadora (03/11/2026; V1 y V2 del desarrollador) la pantalla tiene tres partes, las que el
// sitio usa: el horario semanal (la tarjeta "Horarios" de la página de Visitas), el texto de accesibilidad ("Museo
// accesible", en la misma página) y la compra de entradas (el botón "Tickets" del menú y de la página principal).
// - PARTES: la clave con que avisa cada formulario si tiene cambios sin guardar (alCambiarSucio) y cómo se llama en la
//   pregunta antes de irse, en el orden de la pantalla. faltaGuardar(sucios) arma esa pregunta.
// - CAMPOS_COMPRA: los campos del museo que guarda la compra (FormularioMuseo.jsx). PUT /museo es parcial: el texto del
//   botón (compraTexto), que el sitio ya no muestra, no se manda y queda como estaba.
import { PREFIJO_TEXTOS, TEXTOS } from './cuerpoTextos.js'

/** El prefijo de los ids de la compra (co-compraUrl) y su clave en alCambiarSucio. */
export const PREFIJO_COMPRA = 'co-'
export const CAMPOS_COMPRA = Object.freeze(['compraActiva', 'compraUrl'])

/** [clave, nombre] de cada parte, en el orden de la pantalla. */
export const PARTES = Object.freeze([
  ['horario', 'Horario semanal'],
  ...TEXTOS.map(({ campo, etiqueta }) => [`${PREFIJO_TEXTOS}${campo}`, etiqueta]),
  [PREFIJO_COMPRA, 'Compra de entradas'],
])

const lista = new Intl.ListFormat('es', { type: 'conjunction' })

/**
 * "Falta guardar: Horario semanal y Accesibilidad." (null si no falta nada).
 * @param {Record<string, boolean>} sucios  por clave de PARTES
 */
export function faltaGuardar(sucios) {
  const nombres = PARTES.filter(([clave]) => sucios[clave]).map(([, nombre]) => nombre)
  return nombres.length ? `Falta guardar: ${lista.format(nombres)}.` : null
}
