// La barra superior del panel y las rutas de vuelta. Código sin React ni DOM (lo prueban las pruebas del servidor).
//
// La barra va siempre en el mismo lugar y en el mismo orden (WCAG 3.2.6, plan 5.2): Inicio, Novedades,
// Exposiciones, Visitas y Datos del museo para todos; Mensajes y Usuarios para admin. Una sección nueva (Novedades y
// Exposiciones en E3, Mensajes en E4.9) se suma acá, en su lugar, y su ruta en rutas.jsx. "Ayuda" (el manual,
// /administracion/manual.pdf) se suma con E6.2.

/**
 * @typedef {object} Seccion
 * @property {string} a  ruta relativa al panel
 * @property {string} texto
 * @property {'admin'} [rol]  solo para admins
 * @property {boolean} [exacta]  activa solo en esa ruta (Inicio), no en las de abajo
 */

/** @type {readonly Seccion[]} */
export const SECCIONES = Object.freeze([
  { a: '/', texto: 'Inicio', exacta: true },
  { a: '/visitas', texto: 'Visitas' },
  { a: '/museo', texto: 'Datos del museo' },
  { a: '/usuarios', texto: 'Usuarios', rol: 'admin' },
])

/** Las secciones que ve alguien con ese rol. */
export const seccionesPara = (rol) => SECCIONES.filter((s) => !s.rol || s.rol === rol)

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
