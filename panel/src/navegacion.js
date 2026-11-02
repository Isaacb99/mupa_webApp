// La barra superior del panel y las rutas de vuelta. Código sin React ni DOM (lo prueban las pruebas del servidor).
//
// La barra va siempre en el mismo lugar y en el mismo orden (WCAG 3.2.6, plan 5.2): Inicio, Novedades,
// Exposiciones, Visitas y Datos del museo para todos; Mensajes y Usuarios para admin. Una sección nueva se suma acá, en
// su lugar, y su ruta en rutas.jsx (Mensajes entró con E4.9). Novedades y Exposiciones entraron con E3.3 y E3.4; las
// fichas de una muestra o una sala (/muestras/12, /salas/3) son de Exposiciones (tambien), así la barra marca dónde se
// está. "Ayuda" (AYUDA, E6.2) no es una sección: abre el manual en PDF en otra pestaña.

import { RUTA_PANEL } from '../../compartido/panel.js'

/**
 * "Ayuda" de la barra (plan 5.2, E6.2): el manual del panel en PDF (docs/manual/manual.html, que tools/manual.mjs pasa
 * a panel/public/manual.pdf; Vite lo copia a dist/panel y server/panel.js lo sirve). Es un enlace común, no del router
 * (no es una pantalla del panel), y se abre en otra pestaña: así lo que se está escribiendo queda donde estaba. Va en
 * las dos barras (Marco y MarcoSimple), en el mismo lugar (WCAG 3.2.6, ayuda consistente): también en Ingresar, donde
 * todavía no hay sesión. El nombre accesible empieza con el texto visible (2.5.3) y dice que es un PDF y que se abre
 * aparte.
 */
export const AYUDA = Object.freeze({
  href: `${RUTA_PANEL}/manual.pdf`,
  texto: 'Ayuda',
  aclaracion: ': el manual del panel, en PDF (se abre en otra pestaña)',
})

/**
 * @typedef {object} Seccion
 * @property {string} a  ruta relativa al panel
 * @property {string} texto
 * @property {'admin'} [rol]  solo para admins
 * @property {boolean} [exacta]  activa solo en esa ruta (Inicio), no en las de abajo
 * @property {string[]} [tambien]  otras rutas (y las de abajo) que son de esta sección
 */

/** @type {readonly Seccion[]} */
export const SECCIONES = Object.freeze([
  { a: '/', texto: 'Inicio', exacta: true },
  { a: '/novedades', texto: 'Novedades' },
  { a: '/exposiciones', texto: 'Exposiciones', tambien: ['/muestras', '/salas'] },
  { a: '/visitas', texto: 'Visitas' },
  { a: '/museo', texto: 'Datos del museo' },
  { a: '/mensajes', texto: 'Mensajes', rol: 'admin' },
  { a: '/usuarios', texto: 'Usuarios', rol: 'admin' },
])

/** Las secciones que ve alguien con ese rol. */
export const seccionesPara = (rol) => SECCIONES.filter((s) => !s.rol || s.rol === rol)

/** ¿La ruta es de la sección por una de sus otras rutas (tambien)? (/muestras/12 es de Exposiciones) */
export const esDeLaSeccion = (seccion, ruta) =>
  Boolean(seccion.tambien?.some((otra) => ruta === otra || ruta.startsWith(`${otra}/`)))

// Pantallas a las que no tiene sentido volver después de ingresar.
const SIN_VUELTA = /^\/(ingresar|salir|cambiar-clave)([/?#]|$)/

/**
 * La ruta a la que volver después de ingresar (?volver=), solo si es del panel: empieza con una sola barra, sin
 * esquema ni host ("//otro.sitio", "/\otro.sitio", "https:…" no), sin caracteres de control y no es la de ingresar,
 * salir ni cambiar la contraseña. Si no sirve, null (y se va al Inicio).
 * @param {string | null | undefined} texto
 */
export function volverSeguro(texto) {
  if (typeof texto !== 'string' || texto.length > 2000) return null
  if (!/^\/(?![/\\])/.test(texto) || /[\u0000-\u001f\u007f\\]/.test(texto)) return null
  if (SIN_VUELTA.test(texto)) return null
  return texto
}

/** La ruta del pedido de un loader, sin la base del panel (para ?volver=). */
export function rutaSinBase(url, base) {
  const { pathname, search } = new URL(url)
  const ruta = pathname === base || pathname.startsWith(`${base}/`) ? pathname.slice(base.length) || '/' : pathname
  return ruta + search
}
