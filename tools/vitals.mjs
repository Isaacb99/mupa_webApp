// Mide la carga de la página como la mediría un teléfono de gama media con 4G lento (los números que Google usa para
// las Core Web Vitals): primer pintado con contenido (FCP), pintado del elemento más grande (LCP) y qué elemento es,
// corrimientos de layout (CLS), tiempo de bloqueo del hilo principal (TBT) y lo que se transfiere por tipo.
// Chrome headless por DevTools Protocol, sin caché, con la red y la CPU limitadas como en el perfil móvil de Lighthouse
// (1,6 Mbps de bajada, 150 ms de latencia, CPU x4). Son medidas de laboratorio: sirven para comparar un build con otro
// en la misma máquina, no como valor absoluto.
// Uso: node tools/vitals.mjs [--url http://127.0.0.1:5181/] [--perfil movil|escritorio] [--veces 3] [--consola]
//   --consola agrega:
//   - consola: los errores y avisos de la consola (p. ej. los de hidratación de React) y los del navegador que no
//     pasan por console (dominio Log de CDP: los de seguridad, como las violaciones de CSP, y los de JavaScript);
//     los de red no, que ya están en fallidos;
//   - csp: las violaciones de la Content-Security-Policy (evento securitypolicyviolation, desde antes de que cargue
//     la página).
//   Las dos listas tienen que venir vacías. Si el documento respondió 500 o más, sale con código 1: no se hidrató
//   nada y una consola vacía no prueba nada. documento: el estado HTTP de la página (una 404 a propósito da 404).
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const opt = (k, d) => {
  const i = argv.indexOf(k)
  return i >= 0 ? argv.splice(i, 2)[1] : d
}
const bandera = (k) => {
  const i = argv.indexOf(k)
  if (i >= 0) argv.splice(i, 1)
  return i >= 0
}
const url = opt('--url', 'http://127.0.0.1:5181/')
const perfil = opt('--perfil', 'movil')
const veces = Number(opt('--veces', 3))
const conConsola = bandera('--consola')

const PERFILES = {
  // Moto G Power de Lighthouse: 412x823 a 2,625x; red "Slow 4G" y CPU x4.
  movil: { ancho: 412, alto: 823, dpr: 2.625, movil: true, latencia: 150, bajada: 1.6 * 1024, subida: 750, cpu: 4 },
  // Escritorio de Lighthouse: 1350x940, red de 10 Mbps con 40 ms y CPU sin limitar.
  escritorio: { ancho: 1350, alto: 940, dpr: 1, movil: false, latencia: 40, bajada: 10 * 1024, subida: 10 * 1024, cpu: 1 },
}
const p = PERFILES[perfil]
if (!p) throw new Error(`perfil desconocido: ${perfil}`)

// Se instala antes de que cargue la página: junta las entradas de rendimiento a medida que ocurren.
const OBSERVADORES = `(() => {
  const v = (window.__vitals = { lcp: null, cls: 0, tbt: 0, tareasLargas: 0, csp: [] })
  document.addEventListener('securitypolicyviolation', (e) => {
    v.csp.push((e.effectiveDirective || e.violatedDirective) + ' ' + (e.blockedURI || '') + (e.sourceFile ? ' (' + (e.sourceFile.split('/').pop() || 'documento') + ':' + e.lineNumber + ')' : ''))
  })
  const describir = (el) => {
    if (!el) return null
    const clase = typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (clase ? '.' + clase : '')
  }
  const ver = (tipo, alEntrar) => {
    try { new PerformanceObserver((l) => l.getEntries().forEach(alEntrar)).observe({ type: tipo, buffered: true }) } catch {}
  }
  ver('largest-contentful-paint', (e) => {
    v.lcp = { ms: Math.round(e.startTime), elemento: describir(e.element), url: e.url ? e.url.split('/').pop() : null, area: e.size }
  })
  ver('layout-shift', (e) => { if (!e.hadRecentInput) v.cls += e.value })
  ver('longtask', (e) => { v.tareasLargas++; v.tbt += Math.max(0, e.duration - 50) })
})()`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const mediana = (xs) => {
  const o = xs.filter((x) => x != null).sort((a, b) => a - b)
  return o.length ? o[Math.floor(o.length / 2)] : null
}

async function medir() {
  const profile = mkdtempSync(join(tmpdir(), 'cdp-'))
  // Puerto 0: Chrome elige uno libre y lo anota en DevToolsActivePort (un puerto al azar podía chocar con otra corrida).
  const chrome = spawn(
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--enable-automation', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1280,900', 'about:blank'],
    { stdio: 'ignore' },
  )
  try {
    let wsUrl
    for (let i = 0; i < 50 && !wsUrl; i++) {
      try {
        const port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim()
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
    const pedidos = new Map()
    const consola = []
    const enCurso = new Set()
    let ultimaActividad = Date.now()
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pend.has(m.id)) {
        pend.get(m.id)(m)
        pend.delete(m.id)
        return
      }
      if (!m.method) return
      eventos.push(m.method)
      const d = m.params
      if (m.method.startsWith('Network.')) ultimaActividad = Date.now()
      if (m.method === 'Network.requestWillBeSent') enCurso.add(d.requestId)
      if (m.method === 'Network.loadingFinished' || m.method === 'Network.loadingFailed') enCurso.delete(d.requestId)
      if (m.method === 'Network.responseReceived') pedidos.set(d.requestId, { tipo: d.type, estado: d.response.status, url: d.response.url, bytes: 0 })
      if (m.method === 'Network.loadingFinished' && pedidos.has(d.requestId)) pedidos.get(d.requestId).bytes = d.encodedDataLength
      if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(d.type)) {
        consola.push(`${d.type}: ${d.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 600)}`)
      }
      if (m.method === 'Runtime.exceptionThrown') {
        consola.push(`excepción: ${(d.exceptionDetails.exception?.description ?? d.exceptionDetails.text).slice(0, 600)}`)
      }
      // Lo que el navegador informa sin pasar por console: violaciones de CSP (source security), errores de
      // JavaScript, intervenciones. Los de red (404 de un recurso) ya están en fallidos.
      if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(d.entry.level) && d.entry.source !== 'network') {
        consola.push(`${d.entry.level} ${d.entry.source}: ${d.entry.text.slice(0, 600)}`)
      }
    }
    const send = (method, params = {}) =>
      new Promise((r) => {
        const i = ++id
        pend.set(i, r)
        ws.send(JSON.stringify({ id: i, method, params }))
      })
    const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value

    await send('Page.enable')
    await send('Network.enable')
    await send('Runtime.enable')
    if (conConsola) await send('Log.enable')
    await send('Network.setCacheDisabled', { cacheDisabled: true })
    await send('Emulation.setDeviceMetricsOverride', { width: p.ancho, height: p.alto, deviceScaleFactor: p.dpr, mobile: p.movil })
    if (p.movil) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
    await send('Network.emulateNetworkConditions', {
      offline: false,
      latency: p.latencia,
      downloadThroughput: (p.bajada * 1024) / 8,
      uploadThroughput: (p.subida * 1024) / 8,
    })
    await send('Emulation.setCPUThrottlingRate', { rate: p.cpu })
    await send('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVADORES })
    await send('Page.navigate', { url })
    for (let i = 0; i < 600 && !eventos.includes('Page.loadEventFired'); i++) await sleep(100)
    // El LCP y el CLS se cierran con la página en reposo: espera a que no quede ningún pedido en curso (con la red
    // lenta la foto del hero llega varios segundos después del load) y un rato más.
    for (let i = 0; i < 600 && (enCurso.size > 0 || Date.now() - ultimaActividad < 1500); i++) await sleep(100)
    await sleep(1500)
    const r = await evalJs(`(() => {
      const nav = performance.getEntriesByType('navigation')[0]
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]
      return {
        ttfb: Math.round(nav.responseStart),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        dcl: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd),
        ...window.__vitals,
      }
    })()`)
    const documento = [...pedidos.values()].find((q) => q.tipo === 'Document')?.estado ?? null
    const porTipo = {}
    let total = 0
    for (const q of pedidos.values()) {
      const t = (porTipo[q.tipo] ??= { pedidos: 0, kB: 0 })
      t.pedidos++
      t.kB += q.bytes / 1024
      total += q.bytes / 1024
    }
    for (const t of Object.values(porTipo)) t.kB = Math.round(t.kB)
    ws.close()
    return {
      ...r,
      documento,
      cls: Math.round(r.cls * 1000) / 1000,
      tbt: Math.round(r.tbt),
      pedidos: pedidos.size,
      kB: Math.round(total),
      porTipo,
      fallidos: [...pedidos.values()].filter((q) => q.estado >= 400).map((q) => `${q.estado} ${q.url}`),
      consola,
    }
  } finally {
    chrome.kill()
    await sleep(300)
    try {
      rmSync(profile, { recursive: true, force: true })
    } catch {}
  }
}

const corridas = []
for (let i = 0; i < veces; i++) {
  let r = null
  for (let intento = 0; intento < 4 && !r; intento++) {
    try {
      r = await medir()
    } catch (e) {
      if (intento === 3) throw e
    }
  }
  corridas.push(r)
}
const ultima = corridas.at(-1)
const salida = {
  url,
  perfil,
  documento: ultima.documento,
  corridas: corridas.length,
  ttfb: mediana(corridas.map((c) => c.ttfb)),
  fcp: mediana(corridas.map((c) => c.fcp)),
  lcp: mediana(corridas.map((c) => c.lcp?.ms)),
  lcpElemento: ultima.lcp?.elemento ?? null,
  lcpRecurso: ultima.lcp?.url ?? null,
  cls: mediana(corridas.map((c) => c.cls)),
  tbt: mediana(corridas.map((c) => c.tbt)),
  dcl: mediana(corridas.map((c) => c.dcl)),
  load: mediana(corridas.map((c) => c.load)),
  pedidos: ultima.pedidos,
  kB: ultima.kB,
  porTipo: ultima.porTipo,
  fallidos: ultima.fallidos,
  cadaCorrida: corridas.map((c) => ({ fcp: c.fcp, lcp: c.lcp?.ms, cls: c.cls, tbt: c.tbt })),
}
if (conConsola) {
  salida.consola = [...new Set(corridas.flatMap((c) => c.consola))]
  salida.csp = [...new Set(corridas.flatMap((c) => c.csp ?? []))]
}
console.log(JSON.stringify(salida, null, 2))
if (conConsola && corridas.some((c) => c.documento >= 500)) {
  console.error(`El documento respondió ${corridas.find((c) => c.documento >= 500).documento}: la consola vacía no prueba nada.`)
  process.exitCode = 1
}
