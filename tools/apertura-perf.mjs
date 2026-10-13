// Mide el costo de abrir un panel de Áreas en un celular emulado con la CPU limitada (un iPhone no se puede medir acá:
// esto compara una versión con otra en la misma máquina). Abre la banda `--banda` con un clic (o con un arrastre de dedo
// que la lleve a la línea de apertura, --por-scroll) y durante `--ms` registra cuadro a cuadro el intervalo entre
// requestAnimationFrame, y con Performance.getMetrics cuántos layouts y recálculos de estilo hubo y cuánto tardaron.
// Uso: node tools/apertura-perf.mjs [--url http://127.0.0.1:5183/] [--ancho 390] [--alto 664] [--cpu 4] [--banda 1]
//        [--ms 1400] [--veces 3] [--por-scroll | --nada]
//   --nada: no abre nada; da la línea de base del mismo intervalo (lo que cuesta la página quieta).
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
const url = opt('--url', 'http://127.0.0.1:5183/')
const ancho = Number(opt('--ancho', 390))
const alto = Number(opt('--alto', 664))
const cpu = Number(opt('--cpu', 4))
const banda = Number(opt('--banda', 1))
const ms = Number(opt('--ms', 1400))
const veces = Number(opt('--veces', 3))
const porScroll = bandera('--por-scroll')
const nada = bandera('--nada')
const sleep = (t) => new Promise((r) => setTimeout(r, t))
const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

async function medir() {
  // Puerto 0: Chrome elige uno libre y lo anota en DevToolsActivePort, dentro de su perfil (un puerto al azar podía
  // chocar con otra corrida en paralelo).
  const profile = mkdtempSync(join(tmpdir(), 'cdp-'))
  const chrome = spawn(
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--enable-automation', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    { stdio: 'ignore' },
  )
  try {
    let wsUrl
    for (let i = 0; i < 60 && !wsUrl; i++) {
      try {
        const port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim()
        const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
        wsUrl = l.find((t) => t.type === 'page')?.webSocketDebuggerUrl
      } catch {
        await sleep(200)
      }
    }
    if (!wsUrl) throw new Error('Chrome no respondió por CDP')
    const s = new WebSocket(wsUrl)
    await new Promise((r) => (s.onopen = r))
    let id = 0
    const pend = new Map()
    s.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pend.has(m.id)) {
        pend.get(m.id)(m)
        pend.delete(m.id)
      }
    }
    const send = (method, params = {}) =>
      new Promise((r) => {
        const i = ++id
        pend.set(i, r)
        s.send(JSON.stringify({ id: i, method, params }))
      })
    const ev = async (e) => {
      const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'error')
      return r.result?.result?.value
    }
    const metricas = async () => Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]))
    await send('Page.enable')
    await send('Performance.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 3, mobile: true })
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
    await send('Page.navigate', { url })
    await sleep(2500)
    // Todas las imágenes cargadas y decodificadas antes de medir: se mide la apertura, no la red.
    await ev(`(async () => {
      await document.fonts.ready
      document.querySelectorAll('img').forEach((i) => (i.loading = 'eager'))
      const lista = document.querySelector('#areas [data-panel]').closest('ul')
      lista.scrollIntoView({ block: 'start', behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 400))
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
    })()`)
    // Se pone la banda anterior a la medida justo debajo de la línea de apertura, con todas cerradas.
    await ev(`(async () => {
      const lista = document.querySelector('#areas [data-panel]').closest('ul')
      const lis = [...lista.children]
      const objetivo = lis[${banda}]
      const y = objetivo.getBoundingClientRect().top + scrollY - innerHeight * 0.72
      scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 1500))
    })()`)
    await send('Emulation.setCPUThrottlingRate', { rate: cpu })
    await sleep(300)
    const antes = await metricas()
    // Registro de cuadros durante `ms`, arrancando con la acción.
    await ev(`(() => {
      window.__cuadros = []
      const t0 = performance.now()
      const f = (t) => { window.__cuadros.push(t); if (t - t0 < ${ms}) requestAnimationFrame(f) }
      requestAnimationFrame(f)
    })()`)
    if (porScroll) {
      // Un arrastre de dedo de 200 px en 300 ms: la cabecera cruza la línea del 60 % y la banda se abre en pleno gesto.
      const x = Math.round(ancho / 2)
      let y = Math.round(alto * 0.8)
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      for (let k = 0; k < 18; k++) {
        y -= 11
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
        await sleep(16)
      }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } else if (!nada) {
      await ev(`document.querySelectorAll('#areas [data-panel]')[${banda}].closest('li').querySelector('button').click()`)
    }
    await sleep(ms + 300)
    const despues = await metricas()
    await send('Emulation.setCPUThrottlingRate', { rate: 1 })
    const cuadros = await ev('window.__cuadros')
    const abierta = await ev(`document.querySelectorAll('#areas [data-panel]')[${banda}].closest('li').querySelector('button').getAttribute('aria-expanded')`)
    s.close()
    const intervalos = cuadros.slice(1).map((t, i) => t - cuadros[i])
    const d = (k) => despues[k] - antes[k]
    return {
      abierta,
      cuadros: intervalos.length,
      intervaloMedio: Math.round((intervalos.reduce((a, b) => a + b, 0) / intervalos.length) * 10) / 10,
      intervaloMaximo: Math.round(Math.max(...intervalos)),
      cuadrosLentos: intervalos.filter((x) => x > 25).length,
      layouts: d('LayoutCount'),
      layoutMs: Math.round(d('LayoutDuration') * 1000),
      estilosMs: Math.round(d('RecalcStyleDuration') * 1000),
      tareasMs: Math.round(d('TaskDuration') * 1000),
      scriptMs: Math.round(d('ScriptDuration') * 1000),
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
  for (let intento = 0; intento < 3 && !r; intento++) {
    try {
      r = await medir()
    } catch (e) {
      if (intento === 2) throw e
    }
  }
  corridas.push(r)
}
const campos = ['cuadros', 'intervaloMedio', 'intervaloMaximo', 'cuadrosLentos', 'layouts', 'layoutMs', 'estilosMs', 'scriptMs', 'tareasMs']
const salida = { url, tamano: `${ancho}x${alto}`, cpu, banda, accion: nada ? 'nada' : porScroll ? 'scroll' : 'clic', abierta: corridas.map((c) => c.abierta).join(',') }
for (const c of campos) salida[c] = mediana(corridas.map((r) => r[c]))
salida.corridas = corridas.map((r) => `${r.cuadros} cuadros, máx ${r.intervaloMaximo} ms, ${r.cuadrosLentos} lentos, ${r.layouts} layouts (${r.layoutMs} ms)`)
console.log(JSON.stringify(salida, null, 2))
