// Comprueba la medición de visitas (src/analitica.js) sin mandarle nada a Google: abre la página en Chrome headless
// con los pedidos a los dominios de Google Analytics bloqueados, recorre la página, abre una banda de Áreas con un
// clic y lee lo que la página dejó en la cola de gtag (window.dataLayer).
// Tiene que dar ok: true: la configuración con el ID, las secciones en orden (ver_identidad, ver_obra, ver_areas,
// ver_pie), las bandas que abrió el scroll y la que abrió el clic, cada evento una sola vez.
// A diferencia de measure.mjs, abre Chrome sin --enable-automation: con esa marca la página no mide (así las recetas
// no cuentan como visitas). Si el build no mide (ID vacío, vista previa o desarrollo) lo dice y termina con ok: false.
// Con --ver-envios deja cargar la etiqueta real de Google (gtag.js) y frena los envíos a Analytics (los pedidos
// "collect") justo antes de que salgan, leyendo qué mandarían: con qué ID, qué eventos y desde qué página. Así se
// comprueba la cadena entera contra el sitio publicado sin que la prueba cuente como visita.
// Uso: node tools/analitica-check.mjs [--url http://127.0.0.1:5183/] [--ancho 1440] [--alto 900] [--ver-envios]
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
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
const BLOQUEADOS = ['*googletagmanager.com*', '*google-analytics.com*', '*analytics.google.com*', '*doubleclick.net*']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Recorre la página de a media pantalla, abre con un clic la primera banda cerrada y devuelve la cola de gtag.
const RECORRIDO = `(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms))
  if (!Array.isArray(window.dataLayer)) return { activa: false }
  const total = () => document.documentElement.scrollHeight - innerHeight
  // Hasta Áreas, de a media pantalla; desde ahí, de a 60 px cada 50 ms, como un scroll continuo: las bandas se abren
  // de a una a medida que llegan (con saltos grandes solo se abriría la última).
  const areas = document.getElementById('areas')
  const inicioAreas = areas ? areas.getBoundingClientRect().top + scrollY - innerHeight : total()
  let y = 0
  for (; y < inicioAreas; y += Math.round(innerHeight / 2)) {
    scrollTo({ top: y, behavior: 'instant' })
    await espera(140)
  }
  for (y = Math.max(0, inicioAreas); y < total(); y += 60) {
    scrollTo({ top: y, behavior: 'instant' })
    await espera(50)
  }
  scrollTo({ top: total(), behavior: 'instant' })
  await espera(1200)
  // El clic: la cabecera se lleva al 85 % de la pantalla, por debajo de las líneas del acordeón (60/70 %), para que el
  // scroll no la abra solo antes del clic (centrada, en celular se abría con el scroll y el clic la cerraba). Si aun así
  // quedó abierta, se elige otra cerrada.
  let clicEn = null
  for (const boton of document.querySelectorAll('#areas button[aria-expanded="false"]')) {
    const li = boton.closest('li')
    scrollTo({ top: li.getBoundingClientRect().top + scrollY - innerHeight * 0.85, behavior: 'instant' })
    await espera(1500)
    if (boton.getAttribute('aria-expanded') !== 'false') continue
    clicEn = boton.getAttribute('aria-controls').replace('panel-', '')
    boton.click()
    await espera(1500)
    break
  }
  const cola = window.dataLayer.map((a) => Array.from(a))
  return {
    activa: true,
    clicEn,
    config: cola.filter((a) => a[0] === 'config').map((a) => ({ id: a[1], opciones: a[2] })),
    eventos: cola.filter((a) => a[0] === 'event').map((a) => ({ nombre: a[1], datos: a[2] })),
    scripts: [...document.scripts].map((s) => s.src).filter((s) => s.includes('googletagmanager')),
  }
})()`

async function probar() {
  const port = 9300 + Math.floor(Math.random() * 900)
  const profile = mkdtempSync(join(tmpdir(), 'cdp-'))
  const chrome = spawn(
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,900', 'about:blank'],
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
      // Modo --ver-envios: todo pasa salvo los envíos a Analytics, que se leen y se frenan.
      if (m.method === 'Fetch.requestPaused') {
        const q = m.params.request
        const u = new URL(q.url)
        const esEnvio = /google-analytics\.com|analytics\.google\.com|google\.com|doubleclick\.net/.test(u.hostname) && /collect/.test(u.pathname)
        if (esEnvio) {
          envios.push({ host: u.hostname, ruta: u.pathname, consulta: u.search, cuerpo: q.postData ?? '' })
          send('Fetch.failRequest', { requestId: m.params.requestId, errorReason: 'BlockedByClient' })
        } else {
          send('Fetch.continueRequest', { requestId: m.params.requestId })
        }
        return
      }
      if (m.method === 'Network.requestWillBeSent' && /google|doubleclick/.test(new URL(m.params.request.url).host)) {
        aGoogle.push({ id: m.params.requestId, url: m.params.request.url.split('?')[0], bloqueado: false })
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
    await send('Page.navigate', { url })
    for (let i = 0; i < 300 && !eventos.includes('Page.loadEventFired'); i++) await sleep(100)
    // La medición arranca con la página cargada y el navegador en reposo (hasta 4 s después del load).
    await sleep(5000)
    const r = await send('Runtime.evaluate', { expression: RECORRIDO, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'error en el recorrido')
    // gtag junta los eventos y los manda cada tanto: un rato más para que salgan los últimos.
    if (verEnvios) await sleep(6000)
    ws.close()
    return { ...r.result.result.value, aGoogle, envios }
  } finally {
    chrome.kill()
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
const porScroll = r.eventos.filter((e) => e.nombre.startsWith('abrir_') && e.datos?.origen === 'scroll').map((e) => e.datos.area)
const porClic = r.eventos.filter((e) => e.nombre.startsWith('abrir_') && e.datos?.origen === 'clic').map((e) => e.datos.area)
const fallas = []
if (r.config.length !== 1 || !/^G-/.test(r.config[0]?.id ?? '')) fallas.push('falta la configuración con el ID de GA4')
if (r.config[0]?.opciones?.allow_google_signals !== false) fallas.push('la configuración no apaga las señales de Google')
if (secciones.join() !== 'ver_identidad,ver_obra,ver_areas,ver_pie') fallas.push(`secciones: ${secciones.join()}`)
if (new Set(nombres.map((n, i) => `${n}:${r.eventos[i].datos?.origen ?? ''}`)).size !== nombres.length) fallas.push('hay eventos repetidos')
if (!porScroll.length) fallas.push('el scroll no registró ninguna banda')
if (r.clicEn && !porClic.includes(r.clicEn)) fallas.push(`el clic en ${r.clicEn} no se registró`)
if (r.scripts.length !== 1) fallas.push(`scripts de gtag en la página: ${r.scripts.length}`)
if (!verEnvios && r.aGoogle.some((p) => !p.bloqueado)) fallas.push('algún pedido a Google no quedó bloqueado')
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
      return { tid: p.get('tid') ?? base.get('tid'), en: p.get('en'), dl: p.get('dl'), destino: e.host + e.ruta, claves: [...p.keys()] }
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
  for (const n of ['ver_identidad', 'ver_obra', 'ver_areas']) if (!nombresEnviados.includes(n)) fallas.push(`no se envió ${n}`)
}

console.log(
  JSON.stringify(
    { ok: fallas.length === 0, url, tamano: `${ancho}x${alto}`, fallas, id: r.config[0]?.id, secciones, porScroll, porClic, pedidosAGoogle: r.aGoogle, envios: resumenEnvios },
    null,
    2,
  ),
)
process.exit(fallas.length ? 1 : 0)
