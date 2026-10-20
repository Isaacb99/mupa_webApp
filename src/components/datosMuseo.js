// Los datos de contacto del museo (estado.museo, server/museo.js) listos para dibujar, para el pie (Pie.jsx) y las
// páginas que los muestran (Contacto, Visitas). Código puro: nada de React, del DOM ni de zod (plan 6.2). Lo que no
// está cargado da vacío o null, y no se dibuja (plan 6.1).
import { completarEnlace, esEnlacePermitido } from '../../compartido/enlaces.js'
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
 * filtra al leerlas de la base; se vuelven a mirar acá, como TextoRico.jsx con los enlaces).
 * @param {{ red: string, url: string }[] | undefined} redes
 */
export function redesConocidas(redes) {
  return (Array.isArray(redes) ? redes : [])
    .filter((r) => r && Object.hasOwn(REDES, r.red) && typeof r.url === 'string' && r.url.startsWith('https://'))
    .filter((r) => esEnlacePermitido(r.url))
    .map((r) => ({ red: r.red, url: r.url, nombre: REDES[r.red] }))
}
