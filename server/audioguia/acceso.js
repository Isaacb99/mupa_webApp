// El permiso de la audioguía en el navegador (especificación de las audioguías, versión 2, secciones 3.3, 3.6, 4 y
// 5.3): las dos cookies, cómo se leen y qué decide cada pedido. Código puro, sin Express: recibe la cabecera Cookie, la
// consulta, URL_PUBLICA, las claves, la versión y el reloj como argumentos; las rutas (server/audioguia/rutas.js) y el
// montaje en server/app.js son de la etapa siguiente.
//
// - La cookie de día (3.3): __Secure-mupa_audioguia, o mupa_audioguia con URL_PUBLICA en http (esta PC y la red local),
//   como nombreCookie de server/auth/sesiones.js: el navegador no guarda una cookie Secure ni una __Secure- que llega
//   por http. Path=/audioguia; HttpOnly; Secure (solo https); SameSite=Lax (nace en una navegación desde la cámara
//   seguida de un 303: con Strict no viajaría); Max-Age hasta la medianoche de San Juan con el reloj del servidor. Sin
//   Domain ni Expires (el Expires de Express usaría el reloj real, no el inyectado), escrita a mano para res.append.
// - Se leen TODAS las cookies con ese nombre (puede haber una vieja con otro Path, o una de ayer junto a la de hoy) y
//   vale si alguna vale.
// - La página lee el permiso solo de la cookie; el audio, solo de ?t= (A5). Este módulo hace la parte de la página.
// - La cookie de preferencia de la versión (3.6): mupa_audioguia_version, 'ad' o 'comun', 180 días. No es un permiso:
//   dice qué versión quiere ver la persona. Se pone en el 200 de la página cuando la consulta trae v=ad o v=comun (lista
//   blanca) y se lee cuando no trae v.
import { segundosHastaMedianoche } from '../limites.js'
import { hoyEnSanJuan } from '../../compartido/fechas.js'
import { leerTokenDeDia, tokenDeDia } from './firma.js'

/** El Path de las dos cookies y la raíz de las rutas de la audioguía. */
export const RUTA_AUDIOGUIA = '/audioguia'
/** El nombre de la cookie de preferencia (sin __Secure-: no es un permiso, y así se lee igual en http). */
export const COOKIE_VERSION = 'mupa_audioguia_version'
/** 180 días, en segundos. */
export const VIDA_COOKIE_VERSION_S = 180 * 24 * 3600
/** Las versiones del audio: la común y la de audiodescripción (A10). */
export const VERSIONES = Object.freeze(['comun', 'ad'])
/** Los motivos de la página sin acceso, en el orden en que se deciden (4; los textos, en src/content.js). */
export const MOTIVOS = Object.freeze(['codigo', 'vencido', 'sin-cookie', 'sin-codigo'])

const esHttps = (urlPublica) => String(urlPublica).startsWith('https:')

/**
 * El nombre de la cookie de día según el esquema de URL_PUBLICA.
 * @param {string} urlPublica
 */
export const nombreCookieDeDia = (urlPublica) => (esHttps(urlPublica) ? '__Secure-mupa_audioguia' : 'mupa_audioguia')

/** Los atributos comunes de las dos cookies, en el orden en que se escriben. */
const atributos = (urlPublica, maxAge) =>
  [`Path=${RUTA_AUDIOGUIA}`, `Max-Age=${maxAge}`, 'HttpOnly', ...(esHttps(urlPublica) ? ['Secure'] : []), 'SameSite=Lax']

/**
 * El Set-Cookie de la cookie de día, que vence a la medianoche de San Juan (para res.append('Set-Cookie', …)). El token
 * tiene que ser el del mismo instante: para el 303 del QR, mejor permisoDeDia, que arma los dos con una sola lectura
 * del reloj.
 * @param {{ urlPublica: string, token: string, reloj?: () => Date, ahora?: Date }} opciones  ahora, si viene, manda
 *   sobre reloj
 */
export function cookieDeDia({ urlPublica, token, reloj = () => new Date(), ahora = reloj() }) {
  return [`${nombreCookieDeDia(urlPublica)}=${token}`, ...atributos(urlPublica, segundosHastaMedianoche(ahora))].join('; ')
}

/**
 * El permiso de hoy para el 303 de un QR válido: el token de día y su Set-Cookie, con UNA lectura del reloj. Con dos
 * (el token con una y el Max-Age con otra), un escaneo justo a la medianoche podía llevarse el token de ayer con un
 * Max-Age de un día entero, y la página decía «vencido» recién escaneado (revisión adversarial del 20/11/2026).
 * @param {{ urlPublica: string, claves: { kDia: Buffer }, version: number, reloj?: () => Date }} opciones
 * @returns {{ token: string, cookie: string }}
 */
export function permisoDeDia({ urlPublica, claves, version, reloj = () => new Date() }) {
  const ahora = reloj()
  const token = tokenDeDia(claves, version, hoyEnSanJuan(ahora))
  return { token, cookie: cookieDeDia({ urlPublica, token, ahora }) }
}

/**
 * El Set-Cookie de la preferencia de la versión (180 días).
 * @param {{ urlPublica: string, version: 'comun' | 'ad' }} opciones
 */
export function cookieDeVersion({ urlPublica, version }) {
  if (!VERSIONES.includes(version)) throw new Error('la versión tiene que ser comun o ad')
  return [`${COOKIE_VERSION}=${version}`, ...atributos(urlPublica, VIDA_COOKIE_VERSION_S)].join('; ')
}

/**
 * Todos los valores de las cookies con ese nombre en la cabecera Cookie, en orden (sin decodificar: los valores que
 * nos importan son base64url o una palabra). Sin cabecera, ninguno.
 * @param {unknown} cabecera  req.get('cookie')
 * @param {string} nombre
 * @returns {string[]}
 */
export function leerCookies(cabecera, nombre) {
  if (typeof cabecera !== 'string' || !cabecera) return []
  const valores = []
  for (const parte of cabecera.split(';')) {
    const i = parte.indexOf('=')
    if (i < 0 || parte.slice(0, i).trim() !== nombre) continue
    valores.push(parte.slice(i + 1).trim())
  }
  return valores
}

/** Un valor de la consulta como texto, solo si llegó una vez (?v=ad&v=comun llega como arreglo: no cuenta). */
const unaVez = (valor) => (typeof valor === 'string' ? valor : undefined)

/**
 * ¿El pedido de la página trae un permiso de día que vale hoy? Si no, por qué (el motivo de la página, 4):
 * - 'codigo': la consulta trae motivo=codigo (el 303 de un QR que no vale; la única clave de motivo que se lee, por
 *   lista blanca);
 * - 'vencido': llegó una cookie con ese nombre y ninguna vale (de ayer, de otra versión, tocada);
 * - 'sin-cookie': la consulta trae r=1 (vino del 303 de un QR válido) y la cookie no llegó: el navegador no la guardó;
 * - 'sin-codigo': nada de lo anterior (alguien abrió /audioguia sin escanear).
 * Con una cookie que vale, la consulta no importa.
 * @param {{ cabeceraCookie?: unknown, consulta?: Record<string, unknown>, urlPublica: string,
 *   claves: { kDia: Buffer }, version: number, reloj?: () => Date }} pedido
 * @returns {{ acceso: true } | { acceso: false, motivo: 'codigo' | 'vencido' | 'sin-cookie' | 'sin-codigo' }}
 */
export function accesoDeLaPagina({ cabeceraCookie, consulta = {}, urlPublica, claves, version, reloj = () => new Date() }) {
  const valores = leerCookies(cabeceraCookie, nombreCookieDeDia(urlPublica))
  const hoy = hoyEnSanJuan(reloj())
  if (valores.some((valor) => leerTokenDeDia(claves, valor, { version, hoy }).ok)) return { acceso: true }
  if (unaVez(consulta.motivo) === 'codigo') return { acceso: false, motivo: 'codigo' }
  if (valores.length) return { acceso: false, motivo: 'vencido' }
  if (unaVez(consulta.r) === '1') return { acceso: false, motivo: 'sin-cookie' }
  return { acceso: false, motivo: 'sin-codigo' }
}

/**
 * La versión de la página (3.6): la que pide la consulta (v=ad o v=comun, lista blanca) y, si no pide ninguna, la de
 * la cookie de preferencia; sin las dos, la común. guardar es la que hay que poner en la cookie de preferencia (solo
 * cuando la consulta la pidió; quien llama la pone solo en el 200, nunca en un 403 ni en el 303 del QR).
 * @param {{ consulta?: Record<string, unknown>, cabeceraCookie?: unknown }} pedido
 * @returns {{ version: 'comun' | 'ad', guardar: 'comun' | 'ad' | null }}
 */
export function versionDeLaPagina({ consulta = {}, cabeceraCookie }) {
  const pedida = unaVez(consulta.v)
  if (VERSIONES.includes(pedida)) return { version: pedida, guardar: pedida }
  const guardada = leerCookies(cabeceraCookie, COOKIE_VERSION).find((valor) => VERSIONES.includes(valor))
  return { version: guardada ?? 'comun', guardar: null }
}

/**
 * El Location del 303 de un QR válido (4): /audioguia/<espacio>?r=1#espacio-<espacio>, con &v=ad si el pedido traía
 * v=ad (lista blanca: solo ad; v=comun o cualquier otro, nada). Recepción va sin fragmento: es el primer grupo, y
 * arriba están la versión y el índice (L2-1 de la verificación de la versión 2).
 * @param {string} espacio  el de leerCodigoDeQr
 * @param {Record<string, unknown>} [consulta]
 */
export function destinoDelQr(espacio, consulta = {}) {
  const ad = unaVez(consulta.v) === 'ad' ? '&v=ad' : ''
  const fragmento = espacio === 'recepcion' ? '' : `#espacio-${espacio}`
  return `${RUTA_AUDIOGUIA}/${espacio}?r=1${ad}${fragmento}`
}

/** El Location del 303 de un QR que no vale (sin v: la versión no se arrastra a la página sin acceso). */
export const DESTINO_CODIGO_INVALIDO = `${RUTA_AUDIOGUIA}?motivo=codigo`
