#!/usr/bin/env node
// Revisa las rutas del sitio publicado: códigos, tipos, cabeceras de seguridad, noindex, canonical, cookies y
// compresión (plan 13.4 y 10.1, paso 8). Solo hace pedidos GET y HEAD, sin sesión: no escribe nada en el sitio.
// Se corre después de cada deploy, en la revisión mensual y el día del corte del dominio (plan 11.2).
//
//   node tools/rutas-check.mjs --url https://mupa-web.onrender.com/     antes del corte: espera noindex en todo
//   node tools/rutas-check.mjs --url https://mupa.ar/                   después del corte: sin noindex, y los otros
//                                                                       hosts (http, www, onrender.com) con 301
//   node tools/rutas-check.mjs --url http://127.0.0.1:5183/ --canonica http://127.0.0.1:5183/   la producción local
//
// Qué recorre: las rutas fijas de la tabla de server/rutas-publicas.js y todas las URL del sitemap (las de las muestras
// y novedades publicadas), la página 2 de /novedades si existe, la 404 real, las redirecciones (paginación, barras,
// /index.html, /preview), robots.txt, sitemap.xml, /salud y /salud/base, el archivo de Search Console, los íconos, el
// JS y el CSS públicos (con hash, un año e immutable; sin zod ni el editor; el JS de la Home contra el tope del plan
// 6.2), /administracion/ (no-store, noindex y su CSP), la API del panel sin sesión (401), una foto inexistente (404 y
// no-store) y una real si alguna página la usa (immutable, ETag, 304, la maestra 404).
//
// Qué espera:
// - noindex (cabecera X-Robots-Tag y <meta name="robots">) en todo, salvo cuando el host del pedido es el de la URL
//   canónica (mupa.ar): ahí, en ninguna página (la 404 lleva el meta igual: nunca se indexa). El panel, siempre.
//   --esperar-noindex o --esperar-indexable lo fuerzan.
// - canonical (y og:url) de cada página = la URL canónica + la ruta: https://mupa.ar/… (--canonica para otra).
// - ninguna respuesta con Set-Cookie (ni las públicas ni el panel sin sesión) y ninguna con X-Powered-By.
// - CSP pública en el sitio y la del panel en /administracion; nosniff; Referrer-Policy; HSTS si es https (de al
//   menos un día y sin includeSubDomains, plan 9).
// - compresión (Brotli o gzip) en el HTML, el JS y el CSS: la pone el borde de Render (Express no comprime). Contra
//   127.0.0.1 o localhost falta y es solo un aviso; para probarla en local, tools/servir.mjs --proxy delante.
//
// Opciones:
//   --url URL                  el sitio a revisar (obligatoria)
//   --canonica URL             la URL pública del sitio (URL_PUBLICA); por defecto https://mupa.ar/
//   --host HOST                el Host que se manda (por defecto, el de --url): para probar en local cómo responde
//                              a mupa.ar sin tocar el DNS (con URL_PUBLICA=https://mupa.ar/ en el servidor)
//   --esperar-noindex | --esperar-indexable
//   --sin-base                 el servidor corre con SIN_BASE: /salud/base y la API del panel dan 503
//   --redirige URL             (repetible) una URL de otro host que tiene que dar 301/308 a la misma ruta en --url.
//                              Si --url es la canónica en https://mupa.ar/ y no se pasa ninguna, se revisan
//                              http://mupa.ar/, https://www.mupa.ar/ y https://mupa-web.onrender.com/ (con su
//                              /administracion/); si el servicio de Render tiene otro nombre, pasar su URL
//   --sin-otros-hosts          no revisar esas redirecciones
//   --tope-js BYTES            el JS de la Home, sin comprimir (por defecto 342000, plan 6.2)
//   --max-paginas N            revisar solo las primeras N URL del sitemap
//   --detalle                  mostrar también lo que dio bien
//   --json ARCHIVO             guardar el resultado completo
// Sale con 0 si todo dio bien (los avisos no cuentan) y con 1 si algo falló o el sitio no respondió.
import { readFileSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

// --- Opciones ---
const argv = process.argv.slice(2)
const tiene = (n) => argv.includes(n)
const opcion = (n, porDefecto = null) => {
  const i = argv.indexOf(n)
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : porDefecto
}
const opciones = (n) => argv.flatMap((a, i) => (a === n && i + 1 < argv.length ? [argv[i + 1]] : []))
const conBarra = (u) => (u.endsWith('/') ? u : u + '/')

if (!opcion('--url') || tiene('--ayuda') || tiene('-h')) {
  console.log('Uso: node tools/rutas-check.mjs --url https://mupa-web.onrender.com/ [--canonica https://mupa.ar/]')
  console.log('     [--host HOST] [--esperar-noindex|--esperar-indexable] [--sin-base] [--redirige URL]…')
  console.log('     [--sin-otros-hosts] [--tope-js 342000] [--max-paginas N] [--detalle] [--json archivo]')
  process.exit(opcion('--url') ? 0 : 1)
}
const BASE = conBarra(new URL(opcion('--url')).href)
const ORIGEN = new URL(BASE).origin
const CANONICA = conBarra(new URL(opcion('--canonica', 'https://mupa.ar/')).href)
const HOST = (opcion('--host') ?? new URL(BASE).host).toLowerCase()
const ES_HTTPS = new URL(BASE).protocol === 'https:'
const ES_LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/i.test(new URL(BASE).hostname)
const ESPERA_NOINDEX = tiene('--esperar-noindex') ? true : tiene('--esperar-indexable') ? false : HOST !== new URL(CANONICA).host
const SIN_BASE = tiene('--sin-base')
const TOPE_JS = Number(opcion('--tope-js', '342000'))
const MAX_PAGINAS = opcion('--max-paginas') ? Number(opcion('--max-paginas')) : Infinity
const DETALLE = tiene('--detalle')
const UA = 'mupa-rutas-check/1.0'

// Las rutas de la tabla del sitio (server/rutas-publicas.js), leídas como texto: así la herramienta no carga el
// servidor ni sus dependencias. Las fijas se revisan siempre; las de parámetros, con las URL del sitemap.
const AQUI = dirname(fileURLToPath(import.meta.url))
const TABLA = [...readFileSync(resolve(AQUI, '..', 'server', 'rutas-publicas.js'), 'utf8').matchAll(/patron:\s*'([^']+)'/g)].map(
  (m) => m[1],
)
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const FIJAS = TABLA.filter((p) => !p.includes(':'))
function rutaDeLaTabla(ruta) {
  const pedidas = ruta.split('/').filter(Boolean)
  return TABLA.find((patron) => {
    const partes = patron.split('/').filter(Boolean)
    return partes.length === pedidas.length && partes.every((p, i) => (p.startsWith(':') ? SLUG.test(pedidas[i]) : p === pedidas[i]))
  })
}

// --- Pedidos ---
const agentes = { 'http:': new http.Agent({ keepAlive: true }), 'https:': new https.Agent({ keepAlive: true }) }
const conCookie = [] // las respuestas que pusieron Set-Cookie
const conPoweredBy = []
const sinCompresion = []

/**
 * Un pedido sin seguir redirecciones, con Accept-Encoding: br, gzip (como un navegador). Devuelve el estado, las
 * cabeceras (en minúsculas), el cuerpo ya descomprimido y lo que ocupaba por la red.
 */
function pedir(url, { metodo = 'GET', cabeceras = {}, host = null } = {}) {
  const u = new URL(url)
  const mod = u.protocol === 'https:' ? https : http
  const propias = { 'User-Agent': UA, 'Accept-Encoding': 'br, gzip', Accept: '*/*', ...cabeceras }
  // El Host forzado vale solo para el sitio que se revisa, no para los otros hosts.
  if (host && u.origin === ORIGEN) propias.Host = host
  return new Promise((ok, mal) => {
    const req = mod.request(u, { method: metodo, headers: propias, agent: agentes[u.protocol], timeout: 20_000 }, (res) => {
      const partes = []
      res.on('data', (c) => partes.push(c))
      res.on('error', mal)
      res.on('end', () => {
        const crudo = Buffer.concat(partes)
        const codificacion = String(res.headers['content-encoding'] ?? '').toLowerCase()
        let cuerpo = crudo
        try {
          if (codificacion === 'br') cuerpo = zlib.brotliDecompressSync(crudo)
          else if (codificacion === 'gzip') cuerpo = zlib.gunzipSync(crudo)
          else if (codificacion === 'deflate') cuerpo = zlib.inflateSync(crudo)
        } catch {
          // Un cuerpo que no se puede descomprimir queda crudo; la comprobación que lo lea va a fallar.
        }
        const r = { url, status: res.statusCode, h: res.headers, cuerpo, texto: cuerpo.toString('utf8'), bytesRed: crudo.length, codificacion }
        if (r.h['set-cookie']) conCookie.push(`${metodo} ${rel(url)}`)
        if (r.h['x-powered-by']) conPoweredBy.push(`${metodo} ${rel(url)}`)
        ok(r)
      })
    })
    req.on('timeout', () => req.destroy(new Error('sin respuesta en 20 s')))
    req.on('error', mal)
    req.end()
  })
}
const rel = (url) => (url.startsWith(ORIGEN) ? url.slice(ORIGEN.length) || '/' : url)
const enBase = (ruta) => BASE + ruta.replace(/^\//, '')

// --- Resultados ---
const resultados = [] // { seccion, nombre, estado: 'ok' | 'mal' | 'aviso', detalle }
let seccion = ''
function comprobar(nombre, condicion, detalle = '') {
  resultados.push({ seccion, nombre, estado: condicion ? 'ok' : 'mal', detalle: condicion ? '' : String(detalle) })
  return Boolean(condicion)
}
const avisar = (nombre, detalle) => resultados.push({ seccion, nombre, estado: 'aviso', detalle: String(detalle) })
const info = []

/** Pide y, si no responde, lo anota como falla y devuelve null. */
async function pedirO(nombre, url, opcionesPedido = {}) {
  try {
    return await pedir(url, { host: HOST, ...opcionesPedido })
  } catch (err) {
    comprobar(`${nombre}: responde`, false, err.message)
    return null
  }
}

// --- Comprobaciones comunes ---
const tipo = (r) => String(r.h['content-type'] ?? '')
const cache = (r) => String(r.h['cache-control'] ?? '')
const decodificar = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function estado(nombre, r, esperado) {
  const lista = [].concat(esperado)
  return comprobar(`${nombre}: estado ${lista.join(' o ')}`, lista.includes(r.status), `llegó ${r.status}`)
}
function tipoEs(nombre, r, patron, texto) {
  return comprobar(`${nombre}: Content-Type ${texto}`, patron.test(tipo(r)), `llegó "${tipo(r) || '(nada)'}"`)
}
function cacheTiene(nombre, r, ...partes) {
  const valor = cache(r).toLowerCase()
  return comprobar(`${nombre}: Cache-Control ${partes.join(', ')}`, partes.every((p) => valor.includes(p)), `llegó "${cache(r) || '(nada)'}"`)
}

/** Lo que llevan todas las respuestas de Express (helmet común): nosniff, Referrer-Policy y HSTS en https. */
function cabecerasComunes(nombre, r) {
  comprobar(`${nombre}: X-Content-Type-Options nosniff`, r.h['x-content-type-options'] === 'nosniff', r.h['x-content-type-options'] ?? '(nada)')
  comprobar(
    `${nombre}: Referrer-Policy strict-origin-when-cross-origin`,
    r.h['referrer-policy'] === 'strict-origin-when-cross-origin',
    r.h['referrer-policy'] ?? '(nada)',
  )
  if (ES_HTTPS) {
    const hsts = String(r.h['strict-transport-security'] ?? '')
    const maxAge = Number(/max-age=(\d+)/i.exec(hsts)?.[1] ?? 0)
    comprobar(`${nombre}: HSTS de al menos un día`, maxAge >= 86_400, hsts || '(nada)')
    comprobar(`${nombre}: HSTS sin includeSubDomains`, !/includesubdomains/i.test(hsts), hsts)
  }
}

/** noindex por cabecera según el host (el panel lo lleva siempre: se revisa aparte). */
function robotsPorCabecera(nombre, r) {
  const valor = String(r.h['x-robots-tag'] ?? '')
  if (ESPERA_NOINDEX) comprobar(`${nombre}: X-Robots-Tag noindex`, /noindex/i.test(valor), valor || '(nada)')
  else comprobar(`${nombre}: sin X-Robots-Tag`, !valor, valor)
}

const directivas = (csp) =>
  Object.fromEntries(
    String(csp ?? '')
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((p) => p[0])
      .map(([n, ...f]) => [n.toLowerCase(), f]),
  )

function cspPublica(nombre, r) {
  const csp = r.h['content-security-policy']
  if (!comprobar(`${nombre}: CSP pública`, csp, '(nada)')) return
  const d = directivas(csp)
  const igual = (dir, valor) => JSON.stringify(d[dir] ?? null) === JSON.stringify(valor)
  comprobar(`${nombre}: CSP default-src 'self'`, igual('default-src', ["'self'"]), (d['default-src'] ?? []).join(' '))
  comprobar(`${nombre}: CSP object-src 'none'`, igual('object-src', ["'none'"]), (d['object-src'] ?? []).join(' '))
  comprobar(`${nombre}: CSP frame-ancestors 'self'`, igual('frame-ancestors', ["'self'"]), (d['frame-ancestors'] ?? []).join(' '))
  comprobar(`${nombre}: CSP base-uri 'self'`, igual('base-uri', ["'self'"]), (d['base-uri'] ?? []).join(' '))
  comprobar(`${nombre}: CSP form-action 'self'`, igual('form-action', ["'self'"]), (d['form-action'] ?? []).join(' '))
  const scripts = d['script-src'] ?? []
  comprobar(
    `${nombre}: CSP script-src sin 'unsafe-inline' ni 'unsafe-eval'`,
    scripts.length && !scripts.some((f) => /unsafe-(inline|eval)/.test(f)),
    scripts.join(' ') || '(sin script-src)',
  )
}

function cspDelPanel(nombre, r) {
  const csp = r.h['content-security-policy']
  if (!comprobar(`${nombre}: CSP del panel`, csp, '(nada)')) return
  const d = directivas(csp)
  comprobar(`${nombre}: CSP del panel default-src 'self'`, (d['default-src'] ?? []).join(' ') === "'self'", (d['default-src'] ?? []).join(' '))
  comprobar(`${nombre}: CSP del panel frame-ancestors 'none'`, (d['frame-ancestors'] ?? []).join(' ') === "'none'", (d['frame-ancestors'] ?? []).join(' '))
  comprobar(`${nombre}: CSP del panel sin terceros`, !/https?:/i.test(csp), csp)
  comprobar(
    `${nombre}: CSP del panel script-src sin 'unsafe-inline'`,
    !(d['script-src'] ?? []).some((f) => /unsafe-(inline|eval)/.test(f)),
    (d['script-src'] ?? []).join(' '),
  )
}

/** Brotli o gzip en lo que vale la pena comprimir (HTML, JS, CSS de más de 1 kB). */
function compresion(r) {
  if (r.cuerpo.length < 1024 || r.codificacion === 'br' || r.codificacion === 'gzip') return
  sinCompresion.push(rel(r.url))
}

// --- Las secciones ---

async function salud() {
  seccion = 'Salud'
  const r = await pedirO('/salud', enBase('/salud'))
  if (!r) return false
  estado('/salud', r, 200)
  tipoEs('/salud', r, /^text\/plain/, 'text/plain')
  comprobar('/salud: dice "ok"', r.texto.trim() === 'ok', r.texto.slice(0, 80))
  cacheTiene('/salud', r, 'no-store')
  cabecerasComunes('/salud', r)
  const b = await pedirO('/salud/base', enBase('/salud/base'))
  if (b) {
    if (SIN_BASE) estado('/salud/base (SIN_BASE)', b, 503)
    else {
      estado('/salud/base', b, 200)
      let base = null
      try {
        base = JSON.parse(b.texto).base
      } catch {}
      comprobar('/salud/base: la base responde', base === 'ok', b.texto.slice(0, 120))
    }
    tipoEs('/salud/base', b, /^application\/json/, 'application/json')
    cacheTiene('/salud/base', b, 'no-store')
  }
  // DEPURAR_IP tiene que quedar apagada después de la prueba de trust proxy (plan 10.1, paso 4).
  const ip = await pedirO('/salud/ip', enBase('/salud/ip'))
  if (ip) comprobar('/salud/ip apagada (DEPURAR_IP=0)', ip.status === 404, `llegó ${ip.status}`)
  return true
}

/** robots.txt y sitemap.xml; devuelve las rutas del sitemap (sin la URL canónica adelante). */
async function buscadores() {
  seccion = 'robots.txt y sitemap.xml'
  const r = await pedirO('/robots.txt', enBase('/robots.txt'))
  if (r) {
    estado('/robots.txt', r, 200)
    tipoEs('/robots.txt', r, /^text\/plain/, 'text/plain')
    comprobar('/robots.txt: User-agent: * y Allow: /', /^User-agent: \*$/m.test(r.texto) && /^Allow: \/$/m.test(r.texto), r.texto)
    comprobar('/robots.txt: sin Disallow (el panel se excluye con su noindex, plan 6.5)', !/^Disallow:\s*\S/im.test(r.texto), r.texto)
    comprobar(
      `/robots.txt: Sitemap: ${CANONICA}sitemap.xml`,
      r.texto.split(/\r?\n/).includes(`Sitemap: ${CANONICA}sitemap.xml`),
      r.texto.split(/\r?\n/).find((l) => /^Sitemap:/i.test(l)) ?? '(sin Sitemap)',
    )
    robotsPorCabecera('/robots.txt', r)
  }
  const s = await pedirO('/sitemap.xml', enBase('/sitemap.xml'))
  if (!s) return []
  if (!estado('/sitemap.xml', s, 200)) return []
  tipoEs('/sitemap.xml', s, /^application\/xml/, 'application/xml')
  cacheTiene('/sitemap.xml', s, 'no-cache')
  compresion(s)
  comprobar('/sitemap.xml: es un urlset', /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/.test(s.texto), s.texto.slice(0, 200))
  const locs = [...s.texto.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => decodificar(m[1]))
  const fuera = locs.filter((l) => !l.startsWith(CANONICA))
  comprobar(`/sitemap.xml: todas las URL empiezan con ${CANONICA}`, !fuera.length, fuera.slice(0, 5).join(', '))
  const rutas = locs.filter((l) => l.startsWith(CANONICA)).map((l) => '/' + l.slice(CANONICA.length))
  comprobar('/sitemap.xml: sin /administracion', !rutas.some((p) => /^\/administracion(\/|$)/i.test(p)), rutas.join(', '))
  const faltan = FIJAS.filter((f) => !rutas.includes(f))
  comprobar(`/sitemap.xml: las ${FIJAS.length} páginas fijas de la tabla`, !faltan.length, `faltan ${faltan.join(', ')}`)
  const ajenas = rutas.filter((p) => !rutaDeLaTabla(p.split('?')[0]))
  comprobar('/sitemap.xml: cada URL es una ruta de la tabla', !ajenas.length, ajenas.slice(0, 5).join(', '))
  comprobar('/sitemap.xml: sin repetidas', new Set(rutas).size === rutas.length, `${rutas.length - new Set(rutas).size} repetidas`)
  info.push(`sitemap: ${locs.length} URL (${rutas.filter((p) => !FIJAS.includes(p)).length} de contenidos)`)
  return rutas
}

const assetsVistos = new Set()
const fotosVistas = new Set()
let jsDeLaHome = null

/** Una página pública: 200, HTML, no-cache, cabeceras, noindex según el host, canonical y lo que lleva adentro. */
async function revisarPagina(ruta, { canonicaEsperada = CANONICA + ruta.slice(1) } = {}) {
  const r = await pedirO(ruta, enBase(ruta), { cabeceras: { Accept: 'text/html' } })
  if (!r) return null
  if (!estado(ruta, r, 200)) return r
  tipoEs(ruta, r, /^text\/html;\s*charset=utf-8/i, 'text/html; charset=utf-8')
  cacheTiene(ruta, r, 'no-cache')
  cabecerasComunes(ruta, r)
  cspPublica(ruta, r)
  robotsPorCabecera(ruta, r)
  compresion(r)
  const html = r.texto
  const meta = /<meta name="robots" content="([^"]*)"/i.exec(html)?.[1] ?? ''
  if (ESPERA_NOINDEX) comprobar(`${ruta}: <meta name="robots"> noindex`, /noindex/i.test(meta), meta || '(nada)')
  else comprobar(`${ruta}: sin <meta name="robots"> noindex`, !/noindex/i.test(meta), meta)
  const canonicas = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => decodificar(m[1]))
  comprobar(`${ruta}: un solo canonical`, canonicas.length === 1, `${canonicas.length}`)
  comprobar(`${ruta}: canonical ${canonicaEsperada}`, canonicas[0] === canonicaEsperada, canonicas[0] ?? '(nada)')
  const ogUrl = /<meta property="og:url" content="([^"]*)"/.exec(html)?.[1]
  if (ogUrl) comprobar(`${ruta}: og:url igual al canonical`, decodificar(ogUrl) === canonicaEsperada, decodificar(ogUrl))
  const ogImagen = /<meta property="og:image" content="([^"]*)"/.exec(html)?.[1]
  if (ogImagen) comprobar(`${ruta}: og:image con la URL canónica`, decodificar(ogImagen).startsWith(CANONICA), decodificar(ogImagen))
  comprobar(`${ruta}: <title>`, /<title>[^<]+<\/title>/.test(html), '(sin título)')
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length
  comprobar(`${ruta}: un solo h1`, h1 === 1, `${h1}`)
  for (const [i, m] of [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].entries()) {
    let valido = true
    try {
      JSON.parse(m[1])
    } catch {
      valido = false
    }
    comprobar(`${ruta}: JSON-LD ${i + 1} es JSON válido`, valido, m[1].slice(0, 120))
  }
  comprobar(`${ruta}: trae el estado del SSR`, /<script id="estado" type="application\/json">/.test(html), '(sin #estado)')
  // El correo de destino del formulario nunca sale del servidor (plan 8).
  comprobar(`${ruta}: sin el correo de destino del formulario`, !/emailDestinoContacto|email_destino_contacto/.test(html), '(aparece)')
  // Las URL relativas de la landing (plan 13.3) no pueden volver.
  comprobar(`${ruta}: sin "./assets" ni href="./"`, !html.includes('"./assets') && !html.includes('href="./"'), '(aparecen)')
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)) assetsVistos.add(m[1])
  for (const m of html.matchAll(/\/fotos\/[0-9a-f]{16}\/(?:480|960|1600)\.webp/g)) fotosVistas.add(m[0])
  if (ruta === '/') {
    const entrada = /<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"/.exec(html)?.[1]
    const precargas = [...html.matchAll(/<link rel="modulepreload"[^>]*href="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
    jsDeLaHome = entrada ? [entrada, ...precargas] : []
    comprobar('/: el JS de la página (script type="module")', entrada, '(no está)')
  }
  return r
}

async function paginas(rutasDelSitemap) {
  seccion = 'Páginas'
  const lista = [...new Set([...FIJAS, ...rutasDelSitemap])].slice(0, FIJAS.length + MAX_PAGINAS)
  if (lista.length < new Set([...FIJAS, ...rutasDelSitemap]).size) avisar('Páginas', `se revisaron ${lista.length} (--max-paginas)`)
  const resultadosPaginas = await enParalelo(lista, 4, (ruta) => revisarPagina(ruta))
  // La página 2 de /novedades, si la hay: con su número en el canonical.
  const novedades = resultadosPaginas[lista.indexOf('/novedades')]
  const segunda = novedades && /href="\/novedades\?pagina=2"/.test(novedades.texto)
  if (segunda) await revisarPagina('/novedades?pagina=2', { canonicaEsperada: `${CANONICA}novedades?pagina=2` })
  info.push(`páginas: ${lista.length + (segunda ? 1 : 0)}`)
  // HEAD (lo usan algunos robots y monitores).
  const h = await pedirO('HEAD /', BASE, { metodo: 'HEAD' })
  if (h) {
    estado('HEAD /', h, 200)
    tipoEs('HEAD /', h, /^text\/html/, 'text/html')
  }
}

async function redireccionesY404() {
  seccion = 'Redirecciones y 404'
  const redirige = async (ruta, destino) => {
    const r = await pedirO(ruta, enBase(ruta))
    if (!r) return
    estado(ruta, r, 301)
    const loc = r.h.location ? new URL(r.h.location, enBase(ruta)) : null
    comprobar(`${ruta}: Location ${destino}`, loc && loc.origin === ORIGEN && loc.pathname + loc.search === destino, r.h.location ?? '(nada)')
  }
  await redirige('/novedades?pagina=1', '/novedades')
  await redirige('/index.html', '/')
  await redirige('/preview/', '/')
  await redirige('/exposiciones/', '/exposiciones')
  await redirige('/exposiciones//', '/exposiciones')
  // Nunca un Location que lleve a otro sitio (plan 11.2): //evil.com/ va a /evil.com o da 404.
  const evil = await pedirO('//evil.com/', `${ORIGEN}//evil.com/`)
  if (evil) {
    const loc = evil.h.location
    comprobar(
      '//evil.com/: no redirige afuera',
      evil.status === 404 || (evil.status === 301 && loc && !loc.startsWith('//') && new URL(loc, BASE).origin === ORIGEN),
      `${evil.status} ${loc ?? ''}`,
    )
  }
  const azar = Math.random().toString(36).slice(2, 8)
  const r404 = await pedirO('404', enBase(`/rutas-check-no-existe-${azar}`), { cabeceras: { Accept: 'text/html' } })
  if (r404) {
    estado('404', r404, 404)
    tipoEs('404', r404, /^text\/html/, 'text/html')
    cspPublica('404', r404)
    cabecerasComunes('404', r404)
    comprobar('404: <meta name="robots"> noindex (nunca se indexa)', /<meta name="robots" content="[^"]*noindex/i.test(r404.texto), '(sin noindex)')
    comprobar('404: sin canonical', !/rel="canonical"/.test(r404.texto), '(tiene canonical)')
    comprobar('404: con la página del sitio (enlaces a las secciones)', /href="\/exposiciones"/.test(r404.texto), '(sin enlaces)')
  }
  for (const ruta of [
    `/exposiciones/rutas-check-${azar}`,
    `/novedades/rutas-check-${azar}`,
    '/novedades?pagina=abc',
    '/novedades?pagina=999999',
    '/api/usuarios',
    '/.vite/manifest.json',
    '/.htaccess',
    '/index.htm',
  ]) {
    const r = await pedirO(ruta, enBase(ruta))
    if (r) estado(ruta, r, 404)
  }
  const falta = await pedirO('/assets/ (falta)', enBase(`/assets/rutas-check-${azar}.js`))
  if (falta) {
    estado('/assets/ que no existe', falta, 404)
    tipoEs('/assets/ que no existe', falta, /^text\/plain/, 'text/plain (no la página del sitio)')
  }
  // public/ (plan 2.4, punto 7, y 6.5): el archivo de Search Console tiene que seguir dando 200.
  for (const [ruta, patron, texto] of [
    ['/google19017c966a32aec2.html', /^text\/html/, 'text/html'],
    ['/favicon.svg', /^image\/svg\+xml/, 'image/svg+xml'],
    ['/favicon.ico', /^image\/(x-icon|vnd\.microsoft\.icon)/, 'image/x-icon'],
    ['/apple-touch-icon.png', /^image\/png/, 'image/png'],
    ['/og.jpg', /^image\/jpeg/, 'image/jpeg'],
  ]) {
    const r = await pedirO(ruta, enBase(ruta))
    if (!r) continue
    estado(ruta, r, 200)
    tipoEs(ruta, r, patron, texto)
    // Un día; los .html sin caché (server/app.js, estaticosDelBuild).
    cacheTiene(ruta, r, ruta.endsWith('.html') ? 'no-cache' : 'max-age=86400')
  }
}

/** El JS y el CSS públicos: un año e immutable, comprimidos, sin zod ni el editor, y el tope del JS de la Home. */
async function assets() {
  seccion = 'JS y CSS públicos'
  const pendientes = [...assetsVistos]
  const vistos = new Map()
  const marcas = [
    ['zod', /ZodError|_zod\b/],
    ['el editor (TipTap y ProseMirror)', /ProseMirror|tiptap/],
    ['rutas del panel', /\/administracion/],
  ]
  while (pendientes.length) {
    const ruta = pendientes.shift()
    if (vistos.has(ruta)) continue
    const r = await pedirO(ruta, enBase(ruta))
    vistos.set(ruta, r)
    if (!r || !estado(ruta, r, 200)) continue
    const esJs = ruta.endsWith('.js')
    tipoEs(ruta, r, esJs ? /^(application|text)\/javascript/ : /^text\/css/, esJs ? 'JavaScript' : 'text/css')
    cacheTiene(ruta, r, 'max-age=31536000', 'immutable')
    compresion(r)
    if (!esJs) continue
    for (const [nombre, patron] of marcas) comprobar(`${ruta}: sin ${nombre}`, !patron.test(r.texto), '(aparece)')
    // Las partes que se piden con import() dinámico (una por página, plan 6.2) y las que lista el precargador de Vite.
    for (const m of r.texto.matchAll(/[`"']\.\/([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.(?:js|css))[`"']/g)) pendientes.push(`/assets/${m[1]}`)
    for (const m of r.texto.matchAll(/["'`]assets\/([A-Za-z0-9_.-]+\.(?:js|css))["'`]/g)) pendientes.push(`/assets/${m[1]}`)
  }
  const bytes = (rutas) => rutas.reduce((s, ruta) => s + (vistos.get(ruta)?.cuerpo.length ?? 0), 0)
  const js = [...vistos.keys()].filter((r) => r.endsWith('.js'))
  const css = [...vistos.keys()].filter((r) => r.endsWith('.css'))
  if (jsDeLaHome?.length) {
    const home = bytes(jsDeLaHome)
    comprobar(`JS de la Home hasta ${TOPE_JS} B sin comprimir (plan 6.2)`, home <= TOPE_JS, `${home} B`)
    const red = jsDeLaHome.reduce((s, ruta) => s + (vistos.get(ruta)?.bytesRed ?? 0), 0)
    info.push(`JS de la Home: ${home} B (${red} B por la red, ${jsDeLaHome.length} archivos)`)
  }
  info.push(`JS público: ${js.length} archivos, ${bytes(js)} B; CSS: ${bytes(css)} B`)
}

async function panel() {
  seccion = 'Panel (/administracion)'
  const r = await pedirO('/administracion/', enBase('/administracion/'), { cabeceras: { Accept: 'text/html' } })
  if (r && estado('/administracion/', r, 200)) {
    tipoEs('/administracion/', r, /^text\/html/, 'text/html')
    cacheTiene('/administracion/', r, 'no-store')
    comprobar('/administracion/: X-Robots-Tag noindex (siempre, también en mupa.ar)', /noindex/i.test(r.h['x-robots-tag'] ?? ''), r.h['x-robots-tag'] ?? '(nada)')
    comprobar('/administracion/: X-Frame-Options DENY', r.h['x-frame-options'] === 'DENY', r.h['x-frame-options'] ?? '(nada)')
    cabecerasComunes('/administracion/', r)
    cspDelPanel('/administracion/', r)
    compresion(r)
    const js = /<script type="module"[^>]*src="(\/administracion\/assets\/[^"]+\.js)"/.exec(r.texto)?.[1]
    if (comprobar('/administracion/: su JS', js, '(no está)')) {
      const a = await pedirO(js, enBase(js))
      if (a && estado(js, a, 200)) {
        cacheTiene(js, a, 'max-age=31536000', 'immutable')
        compresion(a)
      }
    }
  }
  const sinBarra = await pedirO('/administracion', enBase('/administracion'))
  if (sinBarra) estado('/administracion', sinBarra, [200, 301])
  const barras = await pedirO('/administracion//api/estado', enBase('/administracion//api/estado'))
  if (barras) {
    estado('/administracion//api/estado', barras, 301)
    comprobar('/administracion//api/estado: Location a la ruta colapsada', /\/administracion\/api\/estado$/.test(barras.h.location ?? ''), barras.h.location ?? '(nada)')
  }
  // La API sin sesión: 401 en JSON (sin base, 503), no-store y noindex.
  for (const ruta of ['/administracion/api/estado', '/administracion/api/usuarios', '/administracion/api/sesion']) {
    const a = await pedirO(ruta, enBase(ruta), { cabeceras: { Accept: 'application/json' } })
    if (!a) continue
    estado(ruta, a, SIN_BASE ? 503 : 401)
    tipoEs(ruta, a, /^application\/json/, 'application/json')
    cacheTiene(ruta, a, 'no-store')
    comprobar(`${ruta}: X-Robots-Tag noindex`, /noindex/i.test(a.h['x-robots-tag'] ?? ''), a.h['x-robots-tag'] ?? '(nada)')
  }
}

async function fotos() {
  seccion = 'Fotos'
  for (const ruta of ['/fotos/0123456789abcdef/960.webp', '/fotos/no-es-una-clave/960.webp']) {
    const r = await pedirO(ruta, enBase(ruta))
    if (!r) continue
    estado(ruta, r, 404)
    cacheTiene(ruta, r, 'no-store')
    robotsPorCabecera(ruta, r)
  }
  const una = [...fotosVistas][0]
  if (!una) {
    info.push('fotos: ninguna página usa una foto (sin contenido publicado): no se revisó una real')
    return
  }
  const r = await pedirO(una, enBase(una))
  if (!r || !estado(`foto real ${una}`, r, 200)) return
  tipoEs('foto real', r, /^image\/webp$/, 'image/webp')
  cacheTiene('foto real', r, 'public', 'max-age=31536000', 'immutable')
  comprobar('foto real: ETag', r.h.etag, '(nada)')
  comprobar('foto real: nosniff', r.h['x-content-type-options'] === 'nosniff', r.h['x-content-type-options'] ?? '(nada)')
  comprobar('foto real: Content-Length', Number(r.h['content-length'] ?? 0) === r.cuerpo.length && r.cuerpo.length > 0, r.h['content-length'] ?? '(nada)')
  robotsPorCabecera('foto real', r)
  if (r.h.etag) {
    const otra = await pedirO('foto real con If-None-Match', enBase(una), { cabeceras: { 'If-None-Match': r.h.etag } })
    if (otra) estado('foto real con If-None-Match', otra, 304)
  }
  const og = una.replace(/[^/]+$/, 'og.jpg')
  const rOg = await pedirO(og, enBase(og))
  if (rOg) {
    estado('og.jpg de la foto', rOg, 200)
    tipoEs('og.jpg de la foto', rOg, /^image\/jpeg$/, 'image/jpeg')
  }
  const maestra = una.replace(/[^/]+$/, '2400.webp')
  const rM = await pedirO(maestra, enBase(maestra))
  if (rM) {
    estado('la maestra (2400.webp) no se publica', rM, 404)
    cacheTiene('la maestra', rM, 'no-store')
  }
}

/** Los otros hosts (http, www, el de Render) tienen que mandar a la misma ruta en el sitio (plan 11.2). */
async function otrosHosts() {
  if (tiene('--sin-otros-hosts')) return
  let lista = opciones('--redirige')
  if (!lista.length && BASE === CANONICA && CANONICA === 'https://mupa.ar/') {
    lista = ['http://mupa.ar/', 'https://www.mupa.ar/', 'https://mupa-web.onrender.com/', 'https://mupa-web.onrender.com/administracion/']
    info.push('otros hosts: los de siempre (si el servicio de Render tiene otro nombre, --redirige <su URL>)')
  }
  if (!lista.length) return
  seccion = 'Otros hosts'
  for (const url of lista) {
    let r
    try {
      r = await pedir(url)
    } catch (err) {
      comprobar(`${url}: responde`, false, err.message)
      continue
    }
    const u = new URL(url)
    const destino = BASE + u.pathname.slice(1) + u.search
    comprobar(`${url}: 301 o 308`, [301, 308].includes(r.status), `llegó ${r.status}`)
    comprobar(`${url}: Location ${destino}`, r.h.location && new URL(r.h.location, url).href === destino, r.h.location ?? '(nada)')
  }
}

async function enParalelo(items, n, fn) {
  const salida = []
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++
        salida[k] = await fn(items[k], k)
      }
    }),
  )
  return salida
}

// --- Recorrido ---
const inicio = Date.now()
console.log(`rutas-check · ${BASE}${HOST !== new URL(BASE).host ? ` (Host: ${HOST})` : ''}`)
console.log(`  canonical ${CANONICA} · ${ESPERA_NOINDEX ? 'se espera noindex' : 'se espera indexable (host público)'}${SIN_BASE ? ' · sin base' : ''}`)
if (!(await salud())) {
  console.log('\nEl sitio no responde: no se revisó nada más.')
  process.exit(1)
}
const rutasDelSitemap = await buscadores()
await paginas(rutasDelSitemap)
await redireccionesY404()
await assets()
await panel()
await fotos()
await otrosHosts()

seccion = 'En todas las respuestas'
comprobar(`ninguna respuesta pone Set-Cookie (sin sesión)`, !conCookie.length, conCookie.slice(0, 8).join(', '))
comprobar('ninguna respuesta lleva X-Powered-By', !conPoweredBy.length, conPoweredBy.slice(0, 8).join(', '))
if (sinCompresion.length) {
  const detalle = `${sinCompresion.length} sin Brotli ni gzip: ${sinCompresion.slice(0, 6).join(', ')}${sinCompresion.length > 6 ? '…' : ''}`
  if (ES_LOCAL) avisar('compresión (en local, Express no comprime: lo hace el borde de Render; para probarla, tools/servir.mjs --proxy)', detalle)
  else comprobar('compresión en el HTML, el JS y el CSS (plan 10.1, paso 6)', false, detalle)
} else comprobar('compresión en el HTML, el JS y el CSS', true)
for (const a of Object.values(agentes)) a.destroy()

// --- Informe ---
const secciones = [...new Set(resultados.map((r) => r.seccion))]
console.log('')
for (const s of secciones) {
  const de = resultados.filter((r) => r.seccion === s)
  const bien = de.filter((r) => r.estado === 'ok').length
  const malas = de.filter((r) => r.estado === 'mal')
  const avisos = de.filter((r) => r.estado === 'aviso')
  console.log(`  ${s.padEnd(34, '.')} ${malas.length ? 'MAL' : 'ok '} ${bien}/${de.length - avisos.length}`)
  for (const r of de) {
    if (r.estado === 'mal') console.log(`      MAL   ${r.nombre}${r.detalle ? ` — ${r.detalle}` : ''}`)
    else if (r.estado === 'aviso') console.log(`      AVISO ${r.nombre}${r.detalle ? ` — ${r.detalle}` : ''}`)
    else if (DETALLE) console.log(`      ok    ${r.nombre}`)
  }
}
const total = resultados.filter((r) => r.estado !== 'aviso').length
const fallas = resultados.filter((r) => r.estado === 'mal').length
const avisos = resultados.filter((r) => r.estado === 'aviso').length
console.log('')
for (const linea of info) console.log(`  · ${linea}`)
console.log(
  `\nResumen: ${total} comprobaciones, ${fallas} ${fallas === 1 ? 'falla' : 'fallas'}, ${avisos} ${avisos === 1 ? 'aviso' : 'avisos'} (${((Date.now() - inicio) / 1000).toFixed(1)} s). ${fallas ? 'HAY QUE REVISAR.' : 'Todo bien.'}`,
)
const archivo = opcion('--json')
if (archivo) {
  writeFileSync(
    archivo,
    JSON.stringify({ url: BASE, host: HOST, canonica: CANONICA, esperaNoindex: ESPERA_NOINDEX, fecha: new Date().toISOString(), fallas, avisos, total, info, resultados }, null, 2),
  )
}
process.exit(fallas ? 1 : 0)
