// Lo que manda Visitas al guardar los textos (Textos.jsx), sin React: lo prueba server/pruebas/panel-api.test.js.
// - canonico(valor): la forma canónica de un texto (compartido/esquemas/textoRico.js), con los enlaces completados; la
//   que se guarda y la que se compara para saber si hay cambios sin guardar.
// - cuerpoDeTextos(valores, campos): el cuerpo de PUT /museo con esos textos, validado con el mismo esquema que el
//   servidor. Lo que se manda es lo que devuelve el esquema, o sea la FORMA CANÓNICA, no el JSON del editor (que lleva
//   target, rel y class en cada enlace: unos 70 bytes más por enlace). Así los tres textos en su tope (BYTES_MAX cada
//   uno, medido en la forma canónica) entran juntos en los 300 kB del pedido y nunca dan el 413 genérico (COD-09 de la
//   verificación de E3: Textos.jsx ya mandaba lo validado; desde la limpieza del 27/10/2026 está acá, con su prueba).
import { esquemaCambioMuseo } from '../../../../compartido/esquemas/museo.js'
import { completarEnlaces, textoRico } from '../../../../compartido/esquemas/textoRico.js'
import { validarCon } from '../../formato.js'

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
