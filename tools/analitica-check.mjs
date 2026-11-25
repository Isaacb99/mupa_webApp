// Comprueba la medición de visitas (src/analitica.js) sin mandarle nada a Google: abre la página en Chrome headless
// con los pedidos a los dominios de Google Analytics bloqueados, recorre la página hasta el pie, hace clic en los
// enlaces de compra ("Tickets" del header y de la franja de la Home, sin dejar que naveguen) y lee lo que la página
// dejó en la cola de gtag (window.dataLayer).
// Tiene que dar ok: true: la configuración con el ID, ver_pie una sola vez (en la Home), un clic_entradas por enlace de
// compra con su origen (menu, el del header; home, el de la franja) si la compra está activa, y nada de los eventos de
// la landing (ver_identidad, ver_obra, ver_areas, abrir_*: se fueron con la Home del tablero "Web", 02/11/2026, D14).
// A diferencia de measure.mjs, abre Chrome sin --enable-automation: con esa marca la página no mide (así las recetas
// no cuentan como visitas). Si el build no mide (ID vacío, vista previa o desarrollo) lo dice y termina con ok: false.
// Con --ver-envios deja cargar la etiqueta real de Google (gtag.js) y frena los envíos a Analytics (los pedidos
// "collect") justo antes de que salgan, leyendo qué mandarían: con qué ID, qué eventos y desde qué página. Así se
// comprueba la cadena entera contra el sitio publicado sin que la prueba cuente como visita.
// El mapa de "Insertar mapa" (el <iframe> de www.google.com/maps/embed de Visitas y Contacto) no es de la medición y no
// sale nunca de esta máquina, en los dos modos: Chrome no resuelve www.google.com (--host-resolver-rules). Desde la
// Visitas del tablero (03/11/2026) /visitas tiene el mapa: la herramienta lo contaba como "un pedido a Google que no
// quedó bloqueado" y el pedido salía de verdad, porque Network.setBlockedURLs no frena la navegación de un <iframe> de
// otro sitio (COD-02 de la verificación de Visitas). Ahora lo cuenta aparte (mapa) y falla si alguno llegó a tener
// respuesta. Los envíos de --ver-envios a www.google.com (/g/collect) se leen igual: Fetch los frena antes de resolver
// el nombre.
// La audioguía (24/11/2026, especificación de las audioguías, 6): en una página de la audioguía (estado.pagina
// 'audioguia') la configuración tiene que mandar page_location sin la consulta ni el fragmento (la dirección de --url,
// sin ?v=ad) y page_title fijo, «Audioguía · MuPa», y nada de lo que va a la cola de gtag (ni, con --ver-envios, a los
// envíos: dl y dt) puede decir qué versión se eligió (v=ad, «audiodescripción»): es un dato sobre una discapacidad. Sin
// un QR se prueba la página sin permiso (el 403, que mide igual); con --audioguia-codigo-archivo ARCHIVO (la URL de un QR
// de verdad, en un archivo, como rutas-check: nunca en la línea de comandos), Chrome pasa antes por el QR (la cookie de
// día) y se prueba la página con el permiso. Por ejemplo, --url http://127.0.0.1:5183/audioguia/sala-2?v=ad.
// Con una URL local, Chrome no resuelve ningún otro nombre (MAP * ~NOTFOUND, como measure.mjs): Google, bloqueado por
// Network.setBlockedURLs, ni se resuelve. Por eso --ver-envios necesita la URL del sitio publicado (la etiqueta real).
// Uso: node tools/analitica-check.mjs [--url http://127.0.0.1:5183/] [--ancho 1440] [--alto 900] [--ver-envios]
//        [--audioguia-codigo-archivo ARCHIVO]
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const opt = (k, d) => {
  const i = argv.indexOf(k)
  return i >= 0 ? argv.splice(i, 2)[1] : d
}
const url = opt('--url', 'http://127.0.0.1:5183/')
const ancho = Number(opt('--ancho', 1440))
const alto = Number(opt('--alto', 900))
const verEnvios = argv.includes('--ver-envios')
// El QR de la audioguía, de un archivo (o - por la entrada): la ruta /audioguia/q/<código>, sin el origen.
const archivoQr = opt('--audioguia-codigo-archivo', null)
if (archivoQr && (/^https?:\/\//i.test(archivoQr) || archivoQr.includes('/audioguia/q/'))) {
  console.error('--audioguia-codigo-archivo recibe un ARCHIVO con la URL del QR, nunca la URL (quedaría en el historial).')
  process.exit(1)
}
const rutaDelQr = (() => {
  if (!archivoQr) return null
  const contenido = readFileSync(archivoQr === '-' ? 0 : archivoQr, 'utf8')
  const rutas = [...contenido.matchAll(/\/audioguia\/q\/[^\s?#/]+/g)].map((m) => m[0])
  const ruta = rutas.find((r) => r.includes('/q/recepcion.')) ?? rutas[0]
  if (!ruta) {
    console.error('--audioguia-codigo-archivo: el archivo no trae la URL de un QR de la audioguía.')
    process.exit(1)
  }
  return ruta
})()
const TITULO_AUDIOGUIA = 'Audioguía · MuPa'
const esLocal = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/i.test(new URL(url).hostname)
const BLOQUEADOS = ['*googletagmanager.com*', '*google-analytics.com*', '*analytics.google.com*', '*doubleclick.net*']
// El mapa: el host que Chrome no resuelve y cómo se reconoce un pedido suyo.
// Con una URL local, ningún otro nombre (como measure.mjs); contra el sitio publicado, solo el mapa.
const SIN_RESOLVER = esLocal
  ? '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE ::1, EXCLUDE localhost'
  : '--host-resolver-rules=MAP www.google.com ~NOTFOUND, MAP maps.google.com ~NOTFOUND'
const esDelMapa = (u) => /(^|\.)google\.com$/.test(u.hostname) && u.pathname.startsWith('/maps')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// Un puerto libre que da el sistema, para la depuración de Chrome (un puerto al azar podía chocar con otra corrida en
// paralelo y hablar con el Chrome ajeno). No --remote-debugging-port=0 como measure.mjs: con el puerto 0 Chrome pone
// navigator.webdriver en true y la página no mide.
const puertoLibre = () =>
  new Promise((resolver, rechazar) => {
    const s = createServer()
    s.once('error', rechazar)
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolver(port))
    })
  })

// Recorre la página de a media pantalla hasta el final, hace clic en los enlaces de compra (sin navegar: un oyente en
// window, que va después del de la analítica, cancela la navegación) y devuelve la cola de gtag.
const RECORRIDO = `(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms))
  if (!Array.isArray(window.dataLayer)) return { activa: false }
  const total = () => document.documentElement.scrollHeight - innerHeight
  for (let y = 0; y < total(); y += Math.round(innerHeight / 2)) {
    scrollTo({ top: y, behavior: 'instant' })
    await espera(140)
  }
  scrollTo({ top: total(), behavior: 'instant' })
  await espera(1200)
  window.addEventListener('click', (e) => { if (e.target.closest?.('a[data-entradas]')) e.preventDefault() })
  const estadoDeLaPagina = JSON.parse(document.getElementById('estado')?.textContent ?? '{}')
  const pagina = estadoDeLaPagina.pagina ?? null
  const clics = []
  // El de adentro de la página: "home" en la franja de la Home y "pagina" en las demás (hoy ninguna: desde la Visitas
  // del tablero, 03/11/2026, Visitas ya no tiene su "Comprar entradas", V9).
  for (const [donde, selector] of [['menu', 'header a[data-entradas]'], [pagina === 'home' ? 'home' : 'pagina', 'main a[data-entradas]']]) {
    const enlace = document.querySelector(selector)
    if (!enlace) continue
    enlace.click()
    clics.push(donde)
    await espera(200)
  }
  const cola = window.dataLayer.map((a) => Array.from(a))
  return {
    activa: true,
    pagina,
    // La audioguía: si la página tiene el permiso (con --audioguia-codigo-archivo, tiene que tenerlo).
    acceso: estadoDeLaPagina.datos?.acceso ?? null,
    // Lo que hay en la cola, como texto (para buscar la versión de la audioguía: no puede estar).
    colaComoTexto: JSON.stringify(cola),
    clics,
    config: cola.filter((a) => a[0] === 'config').map((a) => ({ id: a[1], opciones: a[2] })),
    eventos: cola.filter((a) => a[0] === 'event').map((a) => ({ nombre: a[1], datos: a[2] })),
    scripts: [...document.scripts].map((s) => s.src).filter((s) => s.includes('googletagmanager')),
  }
})()`

async function probar() {
  const port = await puertoLibre()
  const profile = mkdtempSync(join(tmpdir(), 'cdp-'))
  const chrome = spawn(
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', SIN_RESOLVER, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,900', 'about:blank'],
    { stdio: 'ignore' },
  )
  try {
    let wsUrl
    for (let i = 0; i < 50 && !wsUrl; i++) {
      try {
        const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
        wsUrl = l.find((t) => t.type === 'page')?.webSocketDebuggerUrl
      } catch {
        await sleep(200)
      }
    }
    if (!wsUrl) throw new Error('Chrome no respondió por CDP')
    const ws = new WebSocket(wsUrl)
    await new Promise((r) => (ws.onopen = r))
    let id = 0
    const pend = new Map()
    const eventos = []
    const aGoogle = []
    const mapa = []
    const envios = []
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pend.has(m.id)) {
        pend.get(m.id)(m)
        pend.delete(m.id)
        return
      }
      if (!m.method) return
      eventos.push(m.method)
      // Modo --ver-envios: todo pasa salvo los envíos a Analytics, que se leen y se frenan, y el mapa, que se frena.
      if (m.method === 'Fetch.requestPaused') {
        const q = m.params.request
        const u = new URL(q.url)
        const esEnvio = /google-analytics\.com|analytics\.google\.com|google\.com|doubleclick\.net/.test(u.hostname) && /collect/.test(u.pathname)
        if (esEnvio) {
          envios.push({ host: u.hostname, ruta: u.pathname, consulta: u.search, cuerpo: q.postData ?? '' })
          send('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' })
        } else if (esDelMapa(u)) {
          send('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' })
        } else {
          send('Fetch.continueRequest', { requestId: m.params.requestId })
        }
        return
      }
      if (m.method === 'Network.requestWillBeSent') {
        const u = new URL(m.params.request.url)
        // El mapa, aparte: no es de la medición (Chrome no resuelve su host: no tiene que tener respuesta).
        if (esDelMapa(u)) mapa.push({ id: m.params.requestId, url: m.params.request.url.split('?')[0], respuesta: false })
        else if (/google|doubleclick/.test(u.host)) aGoogle.push({ id: m.params.requestId, url: m.params.request.url.split('?')[0], bloqueado: false })
      }
      if (m.method === 'Network.responseReceived') {
        const pedido = mapa.find((p) => p.id === m.params.requestId)
        if (pedido) pedido.respuesta = true
      }
      if (m.method === 'Network.loadingFailed' && m.params.blockedReason) {
        const pedido = aGoogle.find((p) => p.id === m.params.requestId)
        if (pedido) pedido.bloqueado = true
      }
    }
    const send = (method, params = {}) =>
      new Promise((r) => {
        const i = ++id
        pend.set(i, r)
        ws.send(JSON.stringify({ id: i, method, params }))
      })
    await send('Page.enable')
    await send('Network.enable')
    if (verEnvios) await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] })
    else await send('Network.setBlockedURLs', { urls: BLOQUEADOS })
    await send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 768 })
    if (ancho < 768) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
    // La audioguía con permiso: primero el QR (303 con la cookie de día a la página de su espacio).
    if (rutaDelQr) {
      await send('Page.navigate', { url: new URL(rutaDelQr, url).href })
      for (let i = 0; i < 300 && !eventos.includes('Page.loadEventFired'); i++) await sleep(100)
      eventos.length = 0
    }
    await send('Page.navigate', { url })
    for (let i = 0; i < 300 && !eventos.includes('Page.loadEventFired'); i++) await sleep(100)
    // La medición arranca con la página cargada y el navegador en reposo (hasta 4 s después del load).
    await sleep(5000)
    const r = await send('Runtime.evaluate', { expression: RECORRIDO, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'error en el recorrido')
    // gtag junta los eventos y los manda cada tanto: un rato más para que salgan los últimos.
    if (verEnvios) await sleep(6000)
    ws.close()
    return { ...r.result.result.value, aGoogle, mapa: mapa.map(({ url, respuesta }) => ({ url, respuesta })), envios }
  } finally {
    // Con sus hijos (el árbol de procesos de Chrome), por su PID: kill() deja vivos los de los renderizadores.
    if (chrome.pid) spawnSync('taskkill', ['/T', '/F', '/PID', String(chrome.pid)], { stdio: 'ignore' })
    else chrome.kill()
    await sleep(300)
    try {
      rmSync(profile, { recursive: true, force: true })
    } catch {}
  }
}

let r = null
for (let intento = 0; intento < 4 && !r; intento++) {
  try {
    r = await probar()
  } catch (e) {
    if (intento === 3) throw e
  }
}

if (!r.activa) {
  console.log(JSON.stringify({ ok: false, url, motivo: 'la página no mide: ID de GA4 vacío, vista previa o desarrollo', pedidosAGoogle: r.aGoogle.length }, null, 2))
  process.exit(1)
}

const nombres = r.eventos.map((e) => e.nombre)
const secciones = nombres.filter((n) => n.startsWith('ver_'))
const entradas = r.eventos.filter((e) => e.nombre === 'clic_entradas').map((e) => e.datos?.origen)
const fallas = []
if (r.config.length !== 1 || !/^G-/.test(r.config[0]?.id ?? '')) fallas.push('falta la configuración con el ID de GA4')
if (r.config[0]?.opciones?.allow_google_signals !== false) fallas.push('la configuración no apaga las señales de Google')
// ver_pie solo en la Home, una vez; los eventos de la landing ya no existen.
if (secciones.join() !== (r.pagina === 'home' ? 'ver_pie' : '')) fallas.push(`secciones: ${secciones.join() || '(ninguna)'}`)
for (const n of nombres) if (/^(ver_identidad|ver_obra|ver_areas|abrir_)/.test(n)) fallas.push(`evento de la landing: ${n}`)
if (new Set(nombres.map((n, i) => `${n}:${r.eventos[i].datos?.origen ?? ''}`)).size !== nombres.length) fallas.push('hay eventos repetidos')
// Un clic_entradas por enlace de compra, con su origen (sin la compra activa no hay enlaces ni eventos).
if (entradas.join() !== r.clics.join()) fallas.push(`clic_entradas: ${entradas.join() || '(ninguno)'} (clics en ${r.clics.join() || 'nada'})`)
if (r.scripts.length !== 1) fallas.push(`scripts de gtag en la página: ${r.scripts.length}`)
if (!verEnvios && r.aGoogle.some((p) => !p.bloqueado)) fallas.push('algún pedido a Google no quedó bloqueado')
if (r.mapa.some((p) => p.respuesta)) fallas.push('el mapa de Google Maps salió de esta máquina (tuvo respuesta)')
// Envíos frenados: cada pedido "collect" lleva el ID (tid) y uno o varios eventos (en), en la consulta o en el cuerpo
// (una línea por evento cuando van juntos).
let resumenEnvios = null
if (verEnvios) {
  const lineas = r.envios.flatMap((e) => {
    const base = new URLSearchParams(e.consulta)
    const cuerpo = e.cuerpo ? e.cuerpo.split('\n').filter(Boolean) : ['']
    return cuerpo.map((l) => {
      const p = new URLSearchParams(e.consulta)
      for (const [k, v] of new URLSearchParams(l)) p.set(k, v)
      return { tid: p.get('tid') ?? base.get('tid'), en: p.get('en'), dl: p.get('dl'), dt: p.get('dt'), destino: e.host + e.ruta, claves: [...p.keys()] }
    })
  })
  const ids = [...new Set(lineas.map((l) => l.tid).filter(Boolean))]
  const nombresEnviados = lineas.map((l) => l.en).filter(Boolean)
  resumenEnvios = {
    pedidos: r.envios.length,
    destino: [...new Set(r.envios.map((e) => e.host + e.ruta))],
    ids,
    // Por destino: gtag puede mandar el mismo evento a más de un servidor de Google.
    porDestino: Object.fromEntries(
      [...new Set(lineas.map((l) => l.destino))].map((d) => {
        const deAca = lineas.filter((l) => l.destino === d)
        return [d, { eventos: deAca.map((l) => l.en).filter(Boolean), parametros: [...new Set(deAca.flatMap((l) => l.claves))].sort() }]
      }),
    ),
    pagina: [...new Set(lineas.map((l) => l.dl).filter(Boolean))],
    etiqueta: r.aGoogle.filter((p) => p.url.includes('googletagmanager')).map((p) => p.url),
  }
  if (!r.envios.length) fallas.push('la etiqueta no intentó mandar nada a Analytics')
  if (ids.length !== 1 || ids[0] !== r.config[0]?.id) fallas.push(`los envíos van con el ID ${ids.join(', ') || '(ninguno)'}`)
  if (!nombresEnviados.includes('page_view')) fallas.push('no se envió la vista de página (page_view)')
  if (r.pagina === 'home' && !nombresEnviados.includes('ver_pie')) fallas.push('no se envió ver_pie')
  if (r.pagina === 'audioguia') {
    for (const l of lineas.filter((l) => l.dl)) {
      if (/[?#]/.test(l.dl)) fallas.push('audioguía: un envío lleva la dirección con la consulta o el fragmento (dl)')
      if (l.dt && l.dt !== TITULO_AUDIOGUIA) fallas.push(`audioguía: un envío lleva otro título (dt): ${l.dt}`)
    }
    if (r.envios.some((e) => /v%3Dad|v=ad|audiodescrip/i.test(e.consulta + e.cuerpo))) fallas.push('audioguía: un envío dice la versión elegida')
  }
}
// La audioguía (especificación de las audioguías, 6): la dirección sin la consulta ni el fragmento, el título fijo y
// ningún rastro de la versión elegida en la cola de gtag.
let audioguia = null
if (r.pagina === 'audioguia') {
  const pedida = new URL(url)
  const esperada = pedida.origin + pedida.pathname
  const opciones = r.config[0]?.opciones ?? {}
  audioguia = { pageLocation: opciones.page_location ?? null, pageTitle: opciones.page_title ?? null, conPermiso: r.acceso === true }
  if (rutaDelQr && r.acceso !== true) fallas.push('audioguía: con el QR, la página no tiene el permiso (¿la cookie de día no llegó?)')
  if (opciones.page_location !== esperada) fallas.push(`audioguía: page_location ${opciones.page_location ?? '(nada)'} (se esperaba ${esperada})`)
  if (opciones.page_title !== TITULO_AUDIOGUIA) fallas.push(`audioguía: page_title ${opciones.page_title ?? '(nada)'}`)
  if (/v=ad|audiodescrip|[?&]r=1|motivo=/i.test(r.colaComoTexto)) fallas.push('audioguía: la cola de gtag dice la versión elegida o la consulta')
} else if (rutaDelQr) {
  fallas.push(`con --audioguia-codigo-archivo, la página no es la audioguía (es ${r.pagina ?? 'otra'})`)
} else if (/^\/audioguia(\/|$)/i.test(new URL(url).pathname)) {
  // Otra página (la 404) en una dirección de la audioguía: con el módulo apagado, un QR escaneado cae ahí. Va como
  // <origen>/audioguia, sin el código, el espacio ni la consulta (AGP-COD-01, 25/11/2026).
  const pedida = new URL(url)
  const opciones = r.config[0]?.opciones ?? {}
  audioguia = { pageLocation: opciones.page_location ?? null, pageTitle: opciones.page_title ?? null, conPermiso: false }
  if (opciones.page_location !== `${pedida.origin}/audioguia`) {
    fallas.push(`dirección de la audioguía (${r.pagina ?? 'otra'}): page_location ${opciones.page_location ?? '(nada)'} (se esperaba ${pedida.origin}/audioguia)`)
  }
  if (/\/audioguia\/q\/|v=ad|[?&]r=1|motivo=/i.test(r.colaComoTexto)) fallas.push('dirección de la audioguía: la cola de gtag lleva el código o la consulta')
  // Con --ver-envios, lo que mandaría la etiqueta: ni el resto de la ruta ni la consulta (con o sin codificar).
  const decodificar = (t) => {
    try {
      return decodeURIComponent(t)
    } catch {
      return t
    }
  }
  const enviado = (r.envios ?? []).map((e) => decodificar(`${e.consulta ?? ''} ${e.cuerpo ?? ''}`)).join(' ')
  if (/\/audioguia\/[^\s&]|\/audioguia\?|v=ad/i.test(enviado)) fallas.push('dirección de la audioguía: un envío lleva la dirección entera')
}

console.log(
  JSON.stringify(
    { ok: fallas.length === 0, url, tamano: `${ancho}x${alto}`, fallas, id: r.config[0]?.id, pagina: r.pagina, secciones, entradas, audioguia, pedidosAGoogle: r.aGoogle, mapa: r.mapa, envios: resumenEnvios },
    null,
    2,
  ),
)
process.exit(fallas.length ? 1 : 0)
