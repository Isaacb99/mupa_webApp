// Lo que sabe y manda Visitas de sus textos con formato (Textos.jsx), sin React: lo prueba server/pruebas/panel-api.test.js.
// - TEXTOS: los textos que muestra la pantalla, con su campo de la API, su nombre y su ayuda. Hasta el 03/11/2026 eran
//   tres: Cómo llegar (comoLlegar), Normas del museo (normas) y Accesibilidad del edificio (accesibilidad). Desde la
//   Visitas del tablero "Web" de la diseñadora el sitio muestra solo el de accesibilidad, en "Museo accesible" (V1, V2 y
//   V4 del desarrollador): los otros dos siguen en la API y en la base (se decide al cierre, como D1) y lo que el museo
//   cargó no se pierde, porque Textos.jsx manda solo los textos de esta lista (PUT /museo es parcial).
// - canonico(valor): la forma canónica de un texto (compartido/esquemas/textoRico.js), con los enlaces completados; la
//   que se guarda y la que se compara para saber si hay cambios sin guardar.
// - cuerpoDeTextos(valores, campos): el cuerpo de PUT /museo con esos textos, validado con el mismo esquema que el
//   servidor. Lo que se manda es lo que devuelve el esquema, o sea la FORMA CANÓNICA, no el JSON del editor (que lleva
//   target, rel y class en cada enlace: unos 70 bytes más por enlace). Así los textos en su tope (BYTES_MAX cada uno,
//   medido en la forma canónica) entran juntos en los 300 kB del pedido y nunca dan el 413 genérico (COD-09 de la
//   verificación de E3: Textos.jsx ya mandaba lo validado; desde la limpieza del 27/10/2026 está acá, con su prueba).
import { esquemaCambioMuseo } from '../../../../compartido/esquemas/museo.js'
import { completarEnlaces, textoRico } from '../../../../compartido/esquemas/textoRico.js'
import { validarCon } from '../../formato.js'

/** El prefijo de los ids de los textos en la pantalla (tx-accesibilidad), el que enlaza ResumenErrores. */
export const PREFIJO_TEXTOS = 'tx-'

/**
 * Los textos que muestra la pantalla, en su orden: el campo de la API, su nombre (la etiqueta, y en la pregunta por los
 * cambios sin guardar) y su ayuda, con lo que pasa si queda vacío (Textos.jsx le suma los caracteres que quedan).
 * Accesibilidad: vacío, el sitio muestra los dos párrafos del tablero (src/content.js, visitas.accesible.parrafos;
 * V2 y V4 del desarrollador).
 */
export const TEXTOS = Object.freeze([
  {
    campo: 'accesibilidad',
    etiqueta: 'Accesibilidad',
    ayuda:
      'Lo que ofrece el museo para que todas las personas puedan recorrerlo: rampas, ascensor, recursos táctiles, ' +
      'audiodescripciones… Opcional: si lo dejás vacío, el sitio muestra el texto que vino con el diseño (dos párrafos ' +
      'sobre los recursos de accesibilidad del museo).',
  },
])

/** La forma canónica de un texto (la que se guarda), o el mismo valor si todavía no es válido. */
export function canonico(valor) {
  const r = textoRico.safeParse(completarEnlaces(valor ?? null))
  return r.success ? r.data : valor
}

/**
 * El cuerpo de PUT /museo con esos textos: { ok: true, datos } (en la forma canónica) o los errores de validarCon.
 * @param {Record<string, unknown>} valores  lo que da cada editor (su JSON)
 * @param {string[]} campos  los que se mandan
 */
export function cuerpoDeTextos(valores, campos) {
  const cuerpo = Object.fromEntries(campos.map((c) => [c, completarEnlaces(valores[c] ?? null)]))
  return validarCon(esquemaCambioMuseo, cuerpo)
}
