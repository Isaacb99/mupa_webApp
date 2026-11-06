// Tabla de rutas del sitio público (plan 6.1): ruta -> { pagina, cargar }. Cada página se arma en el servidor en cada
// pedido (server/ssr.js) y se hidrata en el navegador (src/Raiz.jsx elige el componente por estado.pagina).
//
// cargar(ctx) devuelve los datos de la página como objetos planos (fechas y estados ya como texto, plan 6.2),
// null si no existe (404 real) o redirigir(destino) (301). Qué recibe en ctx y cómo arma cada página: server/paginas.js.
// Lo que no está en la tabla da 404 con la página NoEncontrada. Las rutas sin parámetros entran solas en el sitemap
// (server/ssr.js). Desde E4.5, /contacto (su POST, el formulario, va aparte: server/contacto.js, montado en server/app.js).
import {
  cargarContacto,
  cargarDivulgacion,
  cargarExposiciones,
  cargarFija,
  cargarHome,
  cargarMuestra,
  cargarNovedad,
  cargarNovedades,
  cargarVisitas,
} from './paginas.js'

export const RUTAS = [
  // La Home (tablero "Web", 02/11/2026) lee las últimas novedades para su carrusel; si la base falla, sale sin ellas
  // (nunca la 503: cargarHome). Sus textos están en src/content.js y el museo (la compra, el pie) va aparte en el estado.
  { patron: '/', pagina: 'home', cargar: cargarHome },
  // El Museo (tablero "Web", 06/11/2026, IN1 a IN10): todo su texto y sus fotos están en src/content.js y no lee la
  // base, así que sale igual con la base caída (cargarFija). Va primera, como en el menú (es también el orden del sitemap).
  { patron: '/el-museo', pagina: 'el-museo', cargar: cargarFija },
  { patron: '/exposiciones', pagina: 'exposiciones', cargar: cargarExposiciones },
  { patron: '/exposiciones/:slug', pagina: 'muestra', cargar: cargarMuestra },
  { patron: '/visitas', pagina: 'visitas', cargar: cargarVisitas },
  // Divulgación (tablero "Web", 06/11/2026, DV1 a DV10): como la Home, lee las últimas novedades para "Últimas
  // noticias" y, si la base falla, sale sin ellas (nunca la 503: cargarDivulgacion). Sus textos están en src/content.js.
  { patron: '/divulgacion', pagina: 'divulgacion', cargar: cargarDivulgacion },
  // Educación (tablero "Web", 06/11/2026, IN1 a IN10): todo su texto y sus fotos están en src/content.js y no lee la
  // base, así que sale igual con la base caída (cargarFija).
  { patron: '/educacion', pagina: 'educacion', cargar: cargarFija },
  // Circuitos (tablero "Web", 06/11/2026, IN1 a IN10): igual, todo en src/content.js y sin leer la base (cargarFija).
  { patron: '/circuitos', pagina: 'circuitos', cargar: cargarFija },
  { patron: '/novedades', pagina: 'novedades', cargar: cargarNovedades },
  { patron: '/novedades/:slug', pagina: 'novedad', cargar: cargarNovedad },
  { patron: '/contacto', pagina: 'contacto', cargar: cargarContacto },
]

// Un parámetro de ruta (":slug") es un slug: minúsculas, números y guiones (plan 3.1).
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const segmentos = (ruta) => ruta.split('/').filter(Boolean)
const compiladas = (rutas) => rutas.map((ruta) => ({ ruta, partes: segmentos(ruta.patron) }))
const TABLA = compiladas(RUTAS)

/** Las rutas sin parámetros (las páginas fijas: van al sitemap). */
export const RUTAS_FIJAS = RUTAS.filter((r) => !r.patron.includes(':'))

/** Busca la ruta de un path ya normalizado (sin barras repetidas ni finales). */
export function buscarRuta(path, tabla = TABLA) {
  const pedidas = segmentos(path)
  for (const { ruta, partes } of tabla) {
    if (partes.length !== pedidas.length) continue
    const params = {}
    const coincide = partes.every((parte, i) => {
      if (!parte.startsWith(':')) return parte === pedidas[i]
      if (!SLUG.test(pedidas[i])) return false
      params[parte.slice(1)] = pedidas[i]
      return true
    })
    if (coincide) return { ruta, params }
  }
  return null
}

/** Último middleware del sitio público: la página de la tabla o la 404. */
export function crearRutasPublicas({ ssr }) {
  return async function rutasPublicas(req, res) {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const encontrada = buscarRuta(req.path)
      if (encontrada) return ssr.responder(req, res, encontrada.ruta, encontrada.params)
    }
    return ssr.noEncontrada(req, res)
  }
}
