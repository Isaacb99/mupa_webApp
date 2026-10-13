// Render de las páginas públicas en cada pedido, sin caché de HTML (plan 2.3, 6.2 y 6.3).
//
// - La plantilla es el index.html de la raíz (plan 2.2), ya procesado por Vite (que le agrega el JS y el CSS):
//   <!--head--> en el <head> (server/seo.js: título, descripción, canonical, Open Graph, íconos, JSON-LD),
//   <div id="root"><!--app--></div> (la página renderizada por React) y <!--estado--> (el estado como JSON, que
//   src/main.jsx lee para hidratar). No lleva otros comentarios: saldrían en cada página.
// - Se parte UNA vez en sus marcas y el HTML se arma concatenando: nunca .replace() con texto, porque un "$'" o un
//   "$&" del contenido se tomaría como patrón.
// - Se renderiza JSON.parse(json), lo mismo que el navegador lee de #estado: el servidor dibuja exactamente lo que el
//   cliente hidrata (sin Date, sin getters de Sequelize).
// - HTML con Cache-Control: no-cache; Express agrega el ETag y responde 304 si no cambió.
// - Las respuestas públicas nunca ponen cookies.
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { hoyEnSanJuan } from '../compartido/fechas.js'
import { esHostPublico } from './hosts.js'
import { armarHead, jsonEnScript } from './seo.js'

export const MARCAS = ['<!--head-->', '<!--app-->', '<!--estado-->']

/** Parte la plantilla en sus marcas, que tienen que estar una vez cada una y en orden. */
export function partir(plantilla, marcas = MARCAS) {
  const partes = []
  let desde = 0
  for (const marca of marcas) {
    const i = plantilla.indexOf(marca, desde)
    // Ni antes (fuera de orden) ni después (repetida).
    if (i < 0 || plantilla.indexOf(marca) !== i || plantilla.indexOf(marca, i + marca.length) >= 0) {
      throw new Error(`La plantilla tiene que tener ${marca} una sola vez y en orden (${marcas.join(', ')})`)
    }
    partes.push(plantilla.slice(desde, i))
    desde = i + marca.length
  }
  partes.push(plantilla.slice(desde))
  return partes
}

/**
 * Producción: la plantilla y el render del build se leen una sola vez, al arrancar (plan 2.3, paso 3).
 * fecha: la del build, para el lastmod de la Home en el sitemap.
 */
export async function cargarBuild(dirBuild) {
  const archivo = resolve(dirBuild, 'client', 'index.html')
  const plantilla = await readFile(archivo, 'utf8')
  const { render } = await import(pathToFileURL(resolve(dirBuild, 'server', 'entry-server.js')).href)
  if (typeof render !== 'function') throw new Error(`${dirBuild}/server/entry-server.js no exporta render()`)
  const pagina = { partes: partir(plantilla), render }
  return { obtener: async () => pagina, fecha: (await stat(archivo)).mtime }
}

/**
 * @param {object} opciones
 * @param {ReturnType<import('./config.js').leerConfig>} opciones.config
 * @param {(req) => Promise<{ partes: string[], render: (estado) => string }>} opciones.obtener  plantilla y render
 * @param {() => Promise<object>} opciones.museoPublico  server/museo.js
 */
export function crearSsr({ config, obtener, museoPublico }) {
  async function dibujar(req, res, { status, pagina, datos }) {
    const [{ partes, render }, museo] = await Promise.all([obtener(req), museoPublico()])
    const publico = esHostPublico(config, req)
    // El estado de la página (plan 6.2): todo lo que el navegador necesita para hidratar, en objetos planos.
    // medir: GA4 solo en producción y con el host público. userway: el ID, cuando se integre (E4.7).
    const estado = {
      pagina,
      ruta: req.path,
      datos,
      museo,
      hoy: hoyEnSanJuan(),
      medir: publico,
      userway: config.USERWAY_ID ?? null,
    }
    const json = jsonEnScript(estado)
    const [antesHead, antesApp, antesEstado, final] = partes
    const html =
      antesHead +
      armarHead(estado, { urlPublica: config.urlPublica, indexar: publico }) +
      antesApp +
      render(JSON.parse(json)) +
      antesEstado +
      `<script id="estado" type="application/json">${json}</script>` +
      final
    res.status(status).set('Cache-Control', 'no-cache').type('html').send(html)
  }

  /** Una página de la tabla de rutas (server/rutas-publicas.js). cargar() devuelve null si no existe: 404 real. */
  async function responder(req, res, ruta, params) {
    const datos = await ruta.cargar(params, req)
    if (datos == null) return noEncontrada(req, res)
    return dibujar(req, res, { status: 200, pagina: ruta.pagina, datos })
  }

  /** 404 real, con la página NoEncontrada (src/paginas/NoEncontrada.jsx). */
  function noEncontrada(req, res) {
    return dibujar(req, res, { status: 404, pagina: 'no-encontrada', datos: {} })
  }

  return { responder, noEncontrada }
}
