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
// - Desde E4 (plan 6.1 a 6.3): cada pedido calcula "hoy" y "ahora" una vez; el museo y los datos de la página se leen
//   a la vez (cargar() recibe la lectura del museo, que solo espera Visitas). El estado común lleva el museo sin sus
//   tres textos con formato (museoComun: van solo en los datos de /visitas). Si la base falla, la Home sale como
//   siempre (con el último museo bueno) y las demás rutas, con la 503 simple (paginaDeError, sin el bundle); un
//   cargar() que devuelve redirigir() responde un 301.
// - Cada página va en su archivo JS (src/Raiz.jsx, plan 6.2): render() es async (espera la página) y el <head> pide de
//   antemano el archivo de la página y lo que comparte con otras (<link rel="modulepreload">, con el manifiesto del
//   build: precargasDePaginas), así el navegador lo baja junto con el principal y no después.
// - Desde E4.5, el formulario de contacto (server/contacto.js): cargar() recibe además contacto (¿se dibuja el
//   formulario?), y POST /contacto vuelve a dibujar la página con dibujarPagina() (con lo escrito, los errores y
//   no-store). El servicio va en ssr.contacto, para que la app use el mismo (server/app.js).
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { hoyEnSanJuan } from '../compartido/fechas.js'
import { crearContacto } from './contacto.js'
import { crearLectorPublico, esBaseNoDisponible } from './contenido-publico.js'
import { paginaDeError } from './errores.js'
import { esHostPublico } from './hosts.js'
import { codigoDeError, log } from './log.js'
import { museoComun } from './museo.js'
import { Redireccion } from './paginas.js'
import { RUTAS_FIJAS } from './rutas-publicas.js'
import { armarHead, entradasDelSitemap, escaparHtml, jsonEnScript } from './seo.js'

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
 * Qué archivos JS precargar para cada página, a partir del manifiesto del build del navegador
 * (dist/client/.vite/manifest.json): el de la página y los que importa (las partes que comparte con otras páginas),
 * menos los que ya trae el principal (index.html, que Vite ya pide en la plantilla). Las direcciones, con la base "/".
 * @param {Record<string, { file: string, imports?: string[], isEntry?: boolean }>} manifiesto
 * @param {Record<string, string>} archivosDePaginas  página -> su archivo en el manifiesto (src/Raiz.jsx)
 * @returns {Record<string, string[]>}
 */
export function precargasDePaginas(manifiesto, archivosDePaginas) {
  const delPrincipal = new Set()
  const juntar = (clave, destino) => {
    const parte = manifiesto[clave]
    if (!parte || destino.has(clave)) return
    destino.add(clave)
    for (const otra of parte.imports ?? []) juntar(otra, destino)
  }
  for (const [clave, parte] of Object.entries(manifiesto)) if (parte.isEntry) juntar(clave, delPrincipal)
  const precargas = {}
  for (const [pagina, archivo] of Object.entries(archivosDePaginas ?? {})) {
    const claves = new Set()
    juntar(archivo, claves)
    precargas[pagina] = [...claves].filter((c) => !delPrincipal.has(c)).map((c) => `/${manifiesto[c].file}`)
  }
  return precargas
}

/**
 * Producción: la plantilla, el render y el manifiesto del build se leen una sola vez, al arrancar (plan 2.3, paso 3).
 * fecha: la del build, para el lastmod de la Home en el sitemap. Sin manifiesto (un build viejo o el de las pruebas),
 * ninguna precarga.
 */
export async function cargarBuild(dirBuild) {
  const archivo = resolve(dirBuild, 'client', 'index.html')
  const plantilla = await readFile(archivo, 'utf8')
  const { render, ARCHIVOS_DE_PAGINAS } = await import(
    pathToFileURL(resolve(dirBuild, 'server', 'entry-server.js')).href
  )
  if (typeof render !== 'function') throw new Error(`${dirBuild}/server/entry-server.js no exporta render()`)
  let manifiesto = null
  try {
    manifiesto = JSON.parse(await readFile(resolve(dirBuild, 'client', '.vite', 'manifest.json'), 'utf8'))
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  const precargas = manifiesto ? precargasDePaginas(manifiesto, ARCHIVOS_DE_PAGINAS) : {}
  const pagina = { partes: partir(plantilla), render, precargas }
  return { obtener: async () => pagina, fecha: (await stat(archivo)).mtime }
}

/**
 * @param {object} opciones
 * @param {ReturnType<import('./config.js').leerConfig>} opciones.config
 * @param {(req) => Promise<{ partes: string[], render: (estado) => string | Promise<string>,
 *   precargas?: Record<string, string[]> }>} opciones.obtener  plantilla, render y qué precargar de cada página
 * @param {(() => Promise<object>) & { conEstado?: () => Promise<{ museo: object, alDia: boolean }> }} opciones.museoPublico
 *   server/museo.js (sin conEstado, como las pruebas que pasan uno a mano, se toma como al día)
 * @param {import('sequelize').Sequelize | null} [opciones.sequelize]  los contenidos publicados (null: sin base)
 * @param {ReturnType<typeof crearLectorPublico>} [opciones.lector]  otro lector (las pruebas)
 * @param {ReturnType<typeof crearContacto>} [opciones.contacto]  el formulario de contacto, con el correo de la app
 *   (servidor.js y dev.js lo crean para compartir el correo con las tareas diarias); sin él, uno con la configuración
 */
export function crearSsr({
  config,
  obtener,
  museoPublico,
  sequelize = null,
  lector = crearLectorPublico(sequelize),
  contacto = crearContacto({ config, sequelize }),
}) {
  const leerMuseo = async () => (museoPublico.conEstado ? museoPublico.conEstado() : { museo: await museoPublico(), alDia: true })

  /** Arma y manda la página. lectura: la del museo de este pedido (ya empezada). */
  async function dibujar(req, res, { status, pagina, datos, lectura, hoy, cache = 'no-cache' }) {
    const [{ partes, render, precargas }, { museo }] = await Promise.all([obtener(req), lectura])
    const publico = esHostPublico(config, req)
    // El estado de la página (plan 6.2): todo lo que el navegador necesita para hidratar, en objetos planos.
    // medir: GA4 solo en producción y con el host público. userway: el ID de UserWay o null (src/userway.js, E4.7).
    const estado = {
      pagina,
      ruta: req.path,
      datos,
      museo: museoComun(museo),
      hoy,
      medir: publico,
      userway: config.USERWAY_ID ?? null,
    }
    const json = jsonEnScript(estado)
    const [antesHead, antesApp, antesEstado, final] = partes
    const precarga = (precargas?.[pagina] ?? [])
      .map((url) => `
    <link rel="modulepreload" crossorigin href="${escaparHtml(url)}" />`)
      .join('')
    const app = await render(JSON.parse(json))
    const html =
      antesHead +
      armarHead(estado, { urlPublica: config.urlPublica, indexar: publico }) +
      precarga +
      antesApp +
      app +
      antesEstado +
      `<script id="estado" type="application/json">${json}</script>` +
      final
    res.status(status).set('Cache-Control', cache).type('html').send(html)
  }

  /** La 503 simple de una página interna cuando la base no responde (plan 6.3): sin el bundle, no-store, sin cookies. */
  function noDisponible(req, res, pagina, err) {
    log('aviso', 'pagina_sin_base', { pagina, codigo: err?.causa ?? codigoDeError(err) })
    res.status(503).set({ 'Cache-Control': 'no-store', 'Retry-After': '60' }).type('html').send(paginaDeError(503))
  }

  /**
   * Una página de la tabla de rutas (server/rutas-publicas.js). cargar() devuelve los datos, null si no existe (404
   * real) o redirigir() (301).
   */
  async function responder(req, res, ruta, params) {
    const ahora = new Date()
    const hoy = hoyEnSanJuan(ahora)
    const lectura = leerMuseo()
    let datos
    try {
      datos = await ruta.cargar({ params, consulta: req.query, hoy, ahora, lector, museo: () => lectura, contacto })
    } catch (err) {
      if (esBaseNoDisponible(err)) return noDisponible(req, res, ruta.pagina, err)
      throw err
    }
    if (datos instanceof Redireccion) return res.redirect(301, datos.destino)
    if (datos == null) return dibujar(req, res, { status: 404, pagina: 'no-encontrada', datos: {}, lectura, hoy })
    return dibujar(req, res, { status: 200, pagina: ruta.pagina, datos, lectura, hoy })
  }

  /**
   * Una página con los datos que se le pasan, sin su cargar() (POST /contacto vuelve a dibujar Contacto con lo escrito
   * y los errores). cache: 'no-store' en las respuestas de un formulario.
   * @param {{ status: number, pagina: string, datos: object, cache?: string }} opciones
   */
  function dibujarPagina(req, res, { status, pagina, datos, cache = 'no-cache' }) {
    return dibujar(req, res, { status, pagina, datos, lectura: leerMuseo(), hoy: hoyEnSanJuan(), cache })
  }

  /** 404 real, con la página NoEncontrada (src/paginas/NoEncontrada.jsx). */
  function noEncontrada(req, res) {
    return dibujar(req, res, { status: 404, pagina: 'no-encontrada', datos: {}, lectura: leerMuseo(), hoy: hoyEnSanJuan() })
  }

  /**
   * Las entradas del sitemap (plan 6.5): las páginas fijas y lo publicado. Si la base falla, tira BASE_NO_DISPONIBLE
   * (el sitemap responde 503: mejor que uno sin las páginas de los contenidos).
   * @param {Date} fechaHome  la última modificación de la Home (la fecha del build)
   */
  async function sitemap(fechaHome) {
    return entradasDelSitemap({
      urlPublica: config.urlPublica,
      fijas: RUTAS_FIJAS.map((r) => r.patron),
      contenidos: await lector.sitemap(),
      fechaHome,
    })
  }

  return { responder, noEncontrada, sitemap, dibujarPagina, contacto }
}
