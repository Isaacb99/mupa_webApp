// Los datos de contacto del museo (estado.museo, server/museo.js) listos para dibujar, para Contacto
// (DatosDeContacto.jsx), Visitas (las tarjetas Dirección y Contacto y el mapa, desde el tablero "Web", 03/11/2026) y,
// solo las redes, el pie (Pie.jsx). Código puro: nada de React, del DOM ni de zod (plan 6.2). Lo que no
// está cargado da vacío o null, y no se dibuja (plan 6.1).
import { completarEnlace, esDireccionDelMuseo, esEnlacePermitido } from '../../compartido/enlaces.js'
import { REDES } from '../../compartido/redes.js'

/**
 * La dirección en renglones: la calle, y "5400 Ciudad, Provincia" con lo que haya. Sin nada cargado, [].
 * @param {{ direccion?: string | null, codigoPostal?: string | null, localidad?: string | null, provincia?: string | null }} museo
 */
export function renglonesDireccion(museo) {
  const lugar = [museo?.codigoPostal, museo?.localidad].filter(Boolean).join(' ')
  const segundo = [lugar, museo?.provincia].filter(Boolean).join(', ')
  return [museo?.direccion, segundo].filter(Boolean)
}

/**
 * El teléfono como { texto, href }: href es un tel: si el texto es un solo número ("+54 264 000-0000" ->
 * tel:+542640000000); si no ("4200000 / 4200001", "interno 12"), null y va solo el texto. Sin teléfono, null.
 * @param {string | null | undefined} telefono
 */
export function enlaceTelefono(telefono) {
  if (typeof telefono !== 'string' || telefono.trim() === '') return null
  const href = completarEnlace(telefono)
  return { texto: telefono, href: typeof href === 'string' && href.startsWith('tel:') && esEnlacePermitido(href) ? href : null }
}

/** El correo público si sirve para un mailto:; si no, null. */
export const correoPublico = (email) => (typeof email === 'string' && esEnlacePermitido(`mailto:${email}`) ? email : null)

/**
 * Las redes que el sitio sabe nombrar, con una dirección https, como { red, url, nombre } (server/museo.js ya las
 * filtra al leerlas de la base; se vuelven a mirar acá, como TextoRico.jsx con los enlaces). La dirección, con el mismo
 * tope que el panel (esDireccionDelMuseo: hasta URL_MAX, no el de los enlaces de un texto; PAN-02).
 * @param {{ red: string, url: string }[] | undefined} redes
 */
export function redesConocidas(redes) {
  return (Array.isArray(redes) ? redes : [])
    .filter((r) => r && Object.hasOwn(REDES, r.red) && esDireccionDelMuseo(r.url))
    .map((r) => ({ red: r.red, url: r.url, nombre: REDES[r.red] }))
}

// El src del mapa: solo el de "Insertar mapa" de Google Maps (lo mismo que acepta la base, museo_mapa_embed_google; la
// CSP pública deja www.google.com en frame-src: server/seguridad.js).
const MAPA = /^https:\/\/www\.google\.com\/maps\/embed\?[^\s"'<>\\`]*$/

/** El src del <iframe> del mapa ("Insertar mapa" de Datos del museo) si es el de Google Maps; si no, null. */
export const mapaInsertado = (museo) =>
  typeof museo?.mapaEmbedUrl === 'string' && MAPA.test(museo.mapaEmbedUrl) ? museo.mapaEmbedUrl : null

/**
 * "Abrir en Google Maps" (mapaUrl de Datos del museo) si es una dirección https que el sitio deja enlazar, con el tope
 * del panel (esDireccionDelMuseo: la que se copia de la barra después de buscar el museo en Google Maps pasa de 500
 * caracteres; PAN-02); si no, null.
 */
export const enlaceDelMapa = (museo) => (esDireccionDelMuseo(museo?.mapaUrl) ? museo.mapaUrl : null)
