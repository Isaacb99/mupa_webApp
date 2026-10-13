// Tabla de rutas del sitio público (plan 6.1): ruta -> { pagina, cargar }. Cada página se arma en el servidor en cada
// pedido (server/ssr.js) y se hidrata en el navegador (src/Raiz.jsx elige el componente por estado.pagina).
//
// cargar(params, req) devuelve los datos de la página como objetos planos (fechas, precios y estados ya como texto,
// plan 6.2), o null si no existe (404 real). Lo que no está en la tabla da 404 con la página NoEncontrada.
// Con E4 se suman /exposiciones, /exposiciones/:slug, /visitas, /novedades, /novedades/:slug y /contacto.

export const RUTAS = [
  // La Home no consulta nada: sus textos están en src/content.js y el museo (para el pie) va aparte en el estado.
  { patron: '/', pagina: 'home', cargar: async () => ({}) },
]

// Un parámetro de ruta (":slug") es un slug: minúsculas, números y guiones (plan 3.1).
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

const segmentos = (ruta) => ruta.split('/').filter(Boolean)
const compiladas = (rutas) => rutas.map((ruta) => ({ ruta, partes: segmentos(ruta.patron) }))
const TABLA = compiladas(RUTAS)

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
