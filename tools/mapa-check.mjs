// Comprueba lo que HACE el mapa del celular de la Home (decisión M6 del desarrollador, 17/11/2026:
// src/components/MapaMuseo.jsx): debajo de md, tocar una sala la pinta de bordó y muestra su nombre; tocar otra la
// cambia; tocar la misma, o fuera de las salas, la apaga; y desde md no pasa nada. Con toques de verdad (y, en
// escritorio, clics del mouse) en Chrome headless por CDP. npm test mira la fuente (server/pruebas/layout.test.js);
// lo que pasa en la pantalla solo se ve en un navegador (salió de la tanda 1: la receta candidata de
// tools/salida/tanda-1/corr-2/herr/mapa-check.mjs y R2-01 de su re-verificación, no versionados). Tiene que dar ok: true.
// Uso: node tools/mapa-check.mjs [--url http://127.0.0.1:5183/] [--tamanos 402x874,1440x900] [--reduce] [--cpu 4]
//   [--json archivo] [--con-externos]
//   --tamanos: por defecto los de debajo de md de siempre (320x568, 360x740, 375x635, 390x664, 402x874, 412x780,
//     430x932, 740x360 —un teléfono apaisado— y 767x1024) y dos desde md (768x1024 y 1440x900). Debajo de 1024 emula
//     un teléfono o una tablet táctil (toca con el dedo); desde 1024, una ventana de escritorio (hace clic con el
//     mouse). Si un tamaño es «debajo de md» o «desde md» lo decide la propia página (matchMedia('(min-width: 48rem)'),
//     el corte de MapaMuseo.jsx), no el número: con la letra del navegador agrandada, el corte se corre con ella.
//   --reduce: con prefers-reduced-motion (sin el fundido de 200 ms).
//   --cpu: la CPU limitada N veces (Emulation.setCPUThrottlingRate), para ver que no dé falsas fallas con la PC lenta.
//   --json: guarda ahí el resultado (el mismo JSON que escribe en la salida).
//   --con-externos: con una URL local, deja que Chrome resuelva otros nombres (por defecto, nada sale de esta máquina).
// Qué espera lo lee de la página, no de valores fijos: las 14 salas y su trazado, de los <clipPath id="mapa-<sala>">
// que el servidor ya escribe para el hover de escritorio (D15), y el nombre de cada una, de la lista oculta de
// home.mapa.espacios que va después del plano (el nombre de una sala es el que, sin tildes, en minúsculas y con
// guiones, da su id: así la etiqueta se compara contra la geometría y no contra el orden de content.js, y «Sala 3» y
// «Sala 4» cambiadas de lugar en content.js fallan).
// Qué comprueba. Debajo de md (en cada tamaño):
// - con el plano lejos (más de dos pantallas abajo), ni las capas ni el pedido de mapa-museo-movil-tocada.svg (lo que
//   no se ve no le baja bytes al celular); con el plano a la vista, las 14 capas y las 14 etiquetas armadas y el plano
//   tocado pedido; y cada sala del plano con su nombre en la lista;
// - tocar el centro de cada una de las 14 salas (el punto más lejos de su borde), una detrás de la otra (así «otra la
//   cambia»): se enciende ESA sala sola, su capa con data-activa Y a la vista (opacidad > 0,95: R2-03 de la
//   re-verificación de la ronda 2, 17/11/2026; con data-activa sola, una capa encendida e invisible pasaba) y la sala
//   pintada de bordó en la pantalla (en una grilla de puntos de adentro de la sala, a 4 px o más de su borde, la
//   mitad o más a menos de 60 de #8A1812: una capa con otro dibujo pasaba; no en el centro, donde las salas redondas
//   tienen la roseta), y una sola etiqueta a la vista, la suya, que dice SU nombre, queda adentro del plano, no tapa
//   su sala y va al lado de ella: a 8 px (de 6 a 10) arriba o abajo de su caja y alineada con ella, con algo de la
//   etiqueta encima o debajo de la sala (R3M-01 de la re-verificación de la ronda 3, 18/11/2026: con la etiqueta
//   siempre contra el borde izquierdo del plano, a ~290 px de la Sala 6, la receta daba ok);
// - tocar la misma la apaga; un toque largo (700 ms) no enciende nada; con ninguna encendida, tocar el plano fuera de
//   las salas no enciende nada (R3M-01: con un respaldo a la primera sala, salaEnElPunto(…) ?? la Confitería, esos
//   toques la encendían y la receta daba ok, porque los casos de «tocar afuera» empezaban con ella encendida y el
//   respaldo la apagaba por casualidad); con una encendida (una del medio de la lista, no la primera, por lo mismo),
//   tocar el plano fuera de las salas (a más de 12 px de todas: la tolerancia del dedo es de 6), el título, debajo del
//   plano y el margen de la izquierda la apagan; y deslizar el dedo sobre una sala no enciende nada y la página se
//   desplaza;
// - nada en la consola y ninguna violación de la CSP.
// Desde md: tocar o hacer clic en tres salas no arma ninguna capa ni etiqueta, nunca se pide el plano tocado, y nada
// en la consola ni en la CSP.
// Sale con 0 si todo dio bien y con 1 si algo falló (o la Home no respondió); escribe un JSON con ok, la cantidad de
// comprobaciones, las de cada tamaño y las fallas. Los controles (cada rotura tiene que dar ok: false y el sitio
// sano, ok: true; también con la CPU x4), en tools/salida/tanda-1/corr-3/herr/C-mapa.mjs y, con la etiqueta lejos de
// su sala y el toque afuera que enciende la primera (R3M-01), corr-4/herr/C-mapa.mjs (no versionados).
// Un Chrome nuevo por tamaño (perfil temporal y puerto libre, como measure.mjs; CHROME_PATH para otra ruta), que se
// cierra al terminar con todos sus procesos y borra su perfil, también cortada con Ctrl+C; un perfil que queda de una
// corrida matada de golpe lo borra la siguiente si tiene más de una hora (como tools/menu-check.mjs, RT-03). Abre
// Chrome con --enable-automation: la página no mide la visita. Con una URL local (127.0.0.1, localhost o [::1]) nada
// sale de esta máquina: Chrome no resuelve ningún otro nombre.
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PREFIJO_PERFIL = 'cdp-mapa-'
/** Termina un Chrome y todos sus procesos, sin esperar a nada (sirve en el oyente de SIGINT). */
function terminarArbol(pid) {
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', timeout: 10000 })
    else process.kill(pid, 'SIGKILL')
  } catch {}
}
/** Borra un perfil, reintentando hasta unos 10 s (los procesos de ese Chrome sueltan los archivos un momento después). */
function borrarPerfil(perfil) {
  const pausa = new Int32Array(new SharedArrayBuffer(4))
  for (let i = 0; i < 50; i++) {
    try {
      rmSync(perfil, { recursive: true, force: true })
      return true
    } catch {
      Atomics.wait(pausa, 0, 0, 200)
    }
  }
  return false
}
/** Al arrancar: los perfiles de esta herramienta que quedaron de corridas de hace más de una hora. */
function borrarPerfilesViejos() {
  for (const nombre of readdirSync(tmpdir())) {
    if (!nombre.startsWith(PREFIJO_PERFIL)) continue
    const ruta = join(tmpdir(), nombre)
    try {
      if (Date.now() - statSync(ruta).mtimeMs > 3600000) rmSync(ruta, { recursive: true, force: true })
    } catch {}
  }
}

const AYUDA = `Uso: node tools/mapa-check.mjs [--url http://127.0.0.1:5183/] [--tamanos 402x874,1440x900] [--reduce] [--cpu 4]
  [--json archivo] [--con-externos]
(el detalle, en el encabezado de tools/mapa-check.mjs)`
const argv = process.argv.slice(2)
if (argv.includes('--ayuda') || argv.includes('-h')) {
  console.log(AYUDA)
  process.exit(0)
}
const opt = (k, d) => {
  const i = argv.indexOf(k)
  if (i < 0) return d
  const v = argv.splice(i, 2)[1]
  if (v === undefined || v.startsWith('--')) {
    console.error(`${k} necesita un valor.\n${AYUDA}`)
    process.exit(1)
  }
  return v
}
const bandera = (k) => {
  const i = argv.indexOf(k)
  if (i >= 0) argv.splice(i, 1)
  return i >= 0
}
const url = opt('--url', 'http://127.0.0.1:5183/')
const TAMANOS = '320x568,360x740,375x635,390x664,402x874,412x780,430x932,740x360,767x1024,768x1024,1440x900'
const tamanos = opt('--tamanos', TAMANOS).split(',').map((t) => t.trim().split('x').map(Number))
const archivoJson = opt('--json', null)
const cpu = Number(opt('--cpu', 1))
const reducir = bandera('--reduce')
const conExternos = bandera('--con-externos')
// Lo que queda es una opción desconocida (también «—reduce», con una raya pegada de un documento): corta, no la ignora.
if (argv.length) {
  console.error(`Opción desconocida: ${argv.join(' ')}\n${AYUDA}`)
  process.exit(1)
}
if (tamanos.some(([w, h]) => !(w >= 200 && h >= 200))) {
  console.error('--tamanos: una lista de <ancho>x<alto>, p. ej. 402x874,1440x900')
  process.exit(1)
}
if (!(cpu >= 1)) {
  console.error('--cpu: cuántas veces más lenta, 1 o más (p. ej. 4)')
  process.exit(1)
}
let soloLocal
try {
  soloLocal = !conExternos && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)
} catch {
  console.error(`--url: no es una dirección: ${url}`)
  process.exit(1)
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))
// Con la CPU limitada todo tarda más: las esperas de lo que NO tiene que pasar crecen con ella.
const ESPERA_NADA = 500 + 150 * (cpu - 1)
const ESPERA_ALGO = 3000 + 1000 * (cpu - 1)
// Cuánto se espera la Home: 30 s; y 5 s en los tamaños que siguen a uno que no contestó, mientras ninguno haya contestado
// (un sitio colgado: si no, 11 tamaños por 30 s; como tools/menu-check.mjs).
const TOPE_RESPUESTA = 30000
const TOPE_RESPUESTA_CORTO = 5000
let contestoAlguna = false
let esperoAlguna = false
// Los Chrome abiertos (PID y perfil): lo que limpia el Ctrl+C.
const enCurso = new Set()

// Corre en la página, antes que sus scripts: lo que la herramienta le pregunta al DOM. No toca la página (salvo un
// <svg> que agrega y saca enseguida para medir la caja de una sala, después de hidratar, fuera de #root).
function enLaPagina() {
  if (window !== window.top || window.__mapaCheck) return
  const clicks = []
  const csp = []
  document.addEventListener('click', () => clicks.push(performance.now()), true)
  addEventListener('securitypolicyviolation', (e) => csp.push(`${e.violatedDirective} ${e.blockedURI}`))
  const SECCION = 'section[aria-labelledby="mapa-titulo"]'
  const plano = () => document.querySelector(`${SECCION} img`)?.closest('div') ?? null
  let salas = null
  let caja = null
  // El viewBox del plano: el de las capas del toque (si están) o el del recorte del hover (scale(1/ancho 1/alto)).
  const viewBox = () => {
    const vb = document.querySelector(`${SECCION} svg[viewBox]`)?.getAttribute('viewBox')?.split(/\s+/).map(Number)
    if (vb?.length === 4) return { ancho: vb[2], alto: vb[3] }
    const t = /scale\(([\d.]+)[ ,]+([\d.]+)\)/.exec(document.querySelector(`${SECCION} clipPath[id^="mapa-"]`)?.getAttribute('transform') ?? '')
    return t ? { ancho: 1 / Number(t[1]), alto: 1 / Number(t[2]) } : { ancho: 882.765, alto: 811.848 }
  }
  const ctx = document.createElement('canvas').getContext('2d')
  // La caja de un trazado, en unidades (getBBox de un <svg> que se agrega y se saca enseguida, fuera de #root).
  const cajaDe = (d) => {
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('style', 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden')
    const camino = document.createElementNS(ns, 'path')
    camino.setAttribute('d', d)
    svg.append(camino)
    document.body.append(svg)
    const b = camino.getBBox()
    svg.remove()
    return b
  }
  const cajasDeSalas = new Map()
  const cajaDeSala = (s) => {
    if (!cajasDeSalas.has(s.id)) cajasDeSalas.set(s.id, cajaDe(s.d))
    return cajasDeSalas.get(s.id)
  }
  const seVe = (e) => Boolean(e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && Number(getComputedStyle(e).opacity) > 0.95)
  const r1 = (n) => Math.round(n * 10) / 10
  window.__mapaCheck = {
    clicks,
    csp,
    /** Lo que trae el HTML: las salas (id y trazado, de los clipPath del hover) y los nombres de la lista oculta. */
    leer() {
      const p = plano()
      salas = [...document.querySelectorAll(`${SECCION} clipPath[id^="mapa-"]`)].map((c) => ({ id: c.id.slice(5), d: c.querySelector('path')?.getAttribute('d') ?? '' }))
      const nombres = [...document.querySelectorAll(`${SECCION} ul li`)].map((l) => l.textContent.trim())
      return { hayPlano: Boolean(p), salas: salas.map((s) => s.id), nombres, desdeMd: matchMedia('(min-width: 48rem)').matches }
    },
    /** El plano: su caja en la pantalla, la del título y el alto de la pantalla. */
    cajas() {
      const r = plano().getBoundingClientRect()
      const t = document.getElementById('mapa-titulo').getBoundingClientRect()
      return { x: r.left, y: r.top, w: r.width, h: r.height, titulo: { x: t.left + t.width / 2, y: t.top + t.height / 2 }, vh: document.documentElement.clientHeight, scrollY }
    },
    /** El punto de una sala más lejos de su borde, en unidades del viewBox. */
    centro(id) {
      const s = salas.find((q) => q.id === id)
      if (!s?.d) return null
      const b = cajaDe(s.d)
      const p = new Path2D(s.d)
      let mejor = null
      for (let u = b.x; u <= b.x + b.width; u += 2.5)
        for (let v = b.y; v <= b.y + b.height; v += 2.5) {
          if (!ctx.isPointInPath(p, u, v)) continue
          // La distancia al borde, con un trazo redondo que crece (isPointInStroke), en unidades del viewBox.
          let a = 0
          let z = 250
          for (let i = 0; i < 12; i++) {
            const m = (a + z) / 2
            ctx.lineWidth = 2 * m
            if (ctx.isPointInStroke(p, u, v)) z = m
            else a = m
          }
          if (!mejor || a > mejor.d) mejor = { u, v, d: a }
        }
      return mejor
    },
    /** Un punto del plano a más de `px` píxeles de todas las salas y a 8 de sus bordes, cerca del centro (unidades). */
    vacio(px) {
      const r = plano().getBoundingClientRect()
      const { ancho, alto } = viewBox()
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      const lienzo = document.createElement('canvas')
      lienzo.width = w
      lienzo.height = h
      const c = lienzo.getContext('2d')
      c.setTransform(w / ancho, 0, 0, h / alto, 0, 0)
      c.lineWidth = (2 * px * ancho) / w
      c.lineJoin = 'round'
      for (const s of salas) {
        const p = new Path2D(s.d)
        c.fill(p)
        c.stroke(p)
      }
      const datos = c.getImageData(0, 0, w, h).data
      let mejor = null
      for (let y = 8; y < h - 8; y++)
        for (let x = 8; x < w - 8; x++) {
          if (datos[(y * w + x) * 4 + 3]) continue
          const dist = Math.hypot(x - w / 2, y - h / 2)
          if (!mejor || dist < mejor.dist) mejor = { x, y, dist }
        }
      return mejor && { u: (mejor.x * ancho) / w, v: (mejor.y * alto) / h }
    },
    /**
     * Una grilla de puntos de adentro de la sala, a `px` o más de su borde y dentro de la pantalla (en la ventana), para
     * ver de qué color quedó: unos 16 por lado de su caja.
     */
    muestras(id, px) {
      const s = salas.find((q) => q.id === id)
      const r = plano().getBoundingClientRect()
      const { ancho, alto } = viewBox()
      const k = r.width / ancho
      const p = new Path2D(s.d)
      const b = cajaDe(s.d)
      const [x0, x1, y0, y1] = [b.x, b.x + b.width, b.y, b.y + b.height]
      const paso = Math.max(x1 - x0, y1 - y0) / 16
      const vw = document.documentElement.clientWidth
      const vh = document.documentElement.clientHeight
      const puntos = []
      ctx.lineWidth = (2 * px) / k
      for (let u = x0 + paso / 2; u < x1; u += paso)
        for (let v = y0 + paso / 2; v < y1; v += paso) {
          if (!ctx.isPointInPath(p, u, v) || ctx.isPointInStroke(p, u, v)) continue
          const x = r.left + u * k
          const y = r.top + (v * r.height) / alto
          if (x > 1 && y > 1 && x < vw - 1 && y < vh - 1) puntos.push([x, y])
        }
      return puntos
    },
    /** De unidades del viewBox a la pantalla. */
    aPantalla(u, v) {
      const r = plano().getBoundingClientRect()
      const { ancho, alto } = viewBox()
      return { x: r.left + (u * r.width) / ancho, y: r.top + (v * r.height) / alto }
    },
    /** Las capas y las etiquetas: cuántas hay, cuáles están encendidas (data-activa) y cuáles se ven. */
    estado() {
      const capas = [...document.querySelectorAll('[data-sala-tocada]')]
      const etiquetas = [...document.querySelectorAll('[data-etiqueta-sala]')]
      const r = plano()?.getBoundingClientRect()
      const { ancho, alto } = viewBox()
      const detalle = (e) => {
        const id = e.getAttribute('data-etiqueta-sala')
        const c = e.getBoundingClientRect()
        const s = salas?.find((q) => q.id === id)
        // Cuánto de la etiqueta cae sobre el relleno de su sala (puntos cada 2 px).
        let solape = 0
        // Y si va al lado de su sala (R3M-01, 18/11/2026): la caja de la sala en la pantalla; la etiqueta, alineada con
        // ella (algo de la etiqueta encima o debajo de la sala) y a cuántos px de su borde de arriba (si va encima) o de
        // abajo (si va debajo); null si no va ni encima ni debajo.
        let alineada = false
        let aire = null
        if (s && r) {
          const b = cajaDeSala(s)
          const sx0 = r.left + (b.x * r.width) / ancho
          const sx1 = r.left + ((b.x + b.width) * r.width) / ancho
          const sy0 = r.top + (b.y * r.height) / alto
          const sy1 = r.top + ((b.y + b.height) * r.height) / alto
          alineada = c.right > sx0 && c.left < sx1
          aire = c.bottom <= sy0 + 0.5 ? r1(sy0 - c.bottom) : c.top >= sy1 - 0.5 ? r1(c.top - sy1) : null
        }
        if (s && r) {
          const p = new Path2D(s.d)
          for (let y = c.top + 1; y < c.bottom; y += 2)
            for (let x = c.left + 1; x < c.right; x += 2) {
              if (ctx.isPointInPath(p, ((x - r.left) * ancho) / r.width, ((y - r.top) * alto) / r.height)) solape++
            }
        }
        return {
          id,
          texto: e.textContent.trim(),
          opacidad: r1(Number(getComputedStyle(e).opacity)),
          adentro: Boolean(r) && c.left >= r.left - 0.5 && c.right <= r.right + 0.5 && c.top >= r.top - 0.5 && c.bottom <= r.bottom + 0.5,
          solape,
          alineada,
          aire,
        }
      }
      return {
        capas: capas.length,
        etiquetas: etiquetas.length,
        capasActivas: capas.filter((e) => e.hasAttribute('data-activa')).map((e) => e.getAttribute('data-sala-tocada')),
        capasVisibles: capas.filter(seVe).map((e) => e.getAttribute('data-sala-tocada')),
        etiquetasActivas: etiquetas.filter((e) => e.hasAttribute('data-activa')).map((e) => e.getAttribute('data-etiqueta-sala')),
        etiquetasVisibles: etiquetas.filter(seVe).map(detalle),
        scrollY,
      }
    },
    /** Espera (hasta `ms`) a que la sala `id` esté encendida y a la vista, o (id null) a que no haya ninguna. */
    async esperar(id, ms) {
      const t0 = performance.now()
      for (;;) {
        const e = this.estado()
        const listo = id
          ? e.capasActivas.join() === id && e.capasVisibles.join() === id && e.etiquetasVisibles.map((x) => x.id).join() === id
          : !e.capasActivas.length && !e.capasVisibles.length && !e.etiquetasActivas.length && !e.etiquetasVisibles.length
        if (listo || performance.now() - t0 > ms) return e
        await new Promise((ok) => setTimeout(ok, 20))
      }
    },
    async esperarClick(n, ms) {
      const t0 = performance.now()
      while (clicks.length <= n && performance.now() - t0 < ms) await new Promise((ok) => setTimeout(ok, 10))
      return clicks.length > n
    },
  }
}

/** Abre un Chrome headless nuevo y devuelve cómo hablarle por CDP. */
async function abrirChrome() {
  const perfil = mkdtempSync(join(tmpdir(), PREFIJO_PERFIL))
  // Puerto 0: Chrome elige uno libre y lo anota en DevToolsActivePort, dentro de su perfil (como measure.mjs).
  const chrome = spawn(
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    [
      '--headless=new',
      '--enable-automation',
      ...(soloLocal ? ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE ::1, EXCLUDE localhost'] : []),
      '--disable-gpu',
      '--hide-scrollbars',
      '--remote-debugging-port=0',
      `--user-data-dir=${perfil}`,
      '--window-size=1280,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  let salio = false
  chrome.once('exit', () => {
    salio = true
  })
  const registro = { pid: chrome.pid, perfil }
  enCurso.add(registro)
  const matar = async () => {
    if (!salio) terminarArbol(chrome.pid)
    for (let i = 0; i < 30 && !salio; i++) await dormir(100)
    for (let i = 0; i < 50; i++) {
      try {
        rmSync(perfil, { recursive: true, force: true })
        break
      } catch {
        await dormir(200)
      }
    }
    enCurso.delete(registro)
  }
  try {
    let wsUrl
    for (let i = 0; i < 75 && !wsUrl && !salio; i++) {
      try {
        const puerto = readFileSync(join(perfil, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim()
        const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json()
        wsUrl = lista.find((t) => t.type === 'page')?.webSocketDebuggerUrl
      } catch {
        await dormir(200)
      }
    }
    if (!wsUrl) throw new Error('Chrome no respondió por CDP')
    const ws = new WebSocket(wsUrl)
    await new Promise((ok, mal) => {
      ws.onopen = ok
      ws.onerror = () => mal(new Error('no se pudo conectar con Chrome por CDP'))
    })
    let id = 0
    const pendientes = new Map()
    const visto = { consola: [], tocada: 0, documento: null }
    let cargas = 0
    let marco = null
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pendientes.has(m.id)) {
        pendientes.get(m.id)(m)
        pendientes.delete(m.id)
        return
      }
      const d = m.params
      switch (m.method) {
        case 'Page.loadEventFired':
          cargas++
          break
        case 'Network.requestWillBeSent':
          if (/mapa-museo-movil-tocada/.test(d.request.url)) visto.tocada++
          break
        case 'Network.responseReceived':
          if (d.type === 'Document' && d.frameId === marco) visto.documento = d.response.status
          break
        case 'Runtime.exceptionThrown':
          visto.consola.push(`excepción: ${(d.exceptionDetails.exception?.description ?? d.exceptionDetails.text ?? '').slice(0, 200)}`)
          break
        case 'Runtime.consoleAPICalled':
          if (['error', 'warning', 'assert'].includes(d.type)) visto.consola.push(`${d.type}: ${d.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)}`)
          break
        case 'Log.entryAdded':
          if (['error', 'warning'].includes(d.entry.level)) visto.consola.push(`${d.entry.level}: ${d.entry.text.slice(0, 200)}`)
          break
      }
    }
    // Cada pedido con su tope (Chrome puede no contestar: Page.navigate, con el sitio mudo, contesta recién cuando
    // llega la respuesta).
    const send = (method, params = {}, ms = 60000) =>
      new Promise((ok, mal) => {
        if (ws.readyState !== 1) return mal(new Error('se cortó la conexión con Chrome'))
        const i = ++id
        const reloj = setTimeout(() => {
          pendientes.delete(i)
          mal(new Error(`Chrome no contestó ${method}`))
        }, ms)
        pendientes.set(i, (m) => {
          clearTimeout(reloj)
          ok(m)
        })
        ws.send(JSON.stringify({ id: i, method, params }))
      })
    const evaluar = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description?.slice(0, 300) || r.result.exceptionDetails.text)
      return r.result?.result?.value
    }
    for (const dominio of ['Page', 'Runtime', 'Log', 'Network']) await send(`${dominio}.enable`)
    marco = (await send('Page.getFrameTree')).result?.frameTree?.frame?.id ?? null
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `(${enLaPagina})()` })
    return {
      visto,
      evaluar,
      send,
      /**
       * La parte de unos puntos de la pantalla (en la ventana, en px CSS) cuyo píxel está cerca de un color. Captura el
       * recuadro que los contiene; el recorte de Page.captureScreenshot va en coordenadas de la PÁGINA: se le suma el
       * scroll (sin él, con la página corrida, capturaba otra parte).
       */
      async cercaDe(puntos, [r, g, b], tope = 60) {
        if (!puntos.length) return null
        const x0 = Math.floor(Math.min(...puntos.map((p) => p[0])))
        const y0 = Math.floor(Math.min(...puntos.map((p) => p[1])))
        const x1 = Math.ceil(Math.max(...puntos.map((p) => p[0]))) + 1
        const y1 = Math.ceil(Math.max(...puntos.map((p) => p[1]))) + 1
        const arriba = await evaluar('scrollY')
        const dpr = await evaluar('devicePixelRatio')
        const res = await send('Page.captureScreenshot', { format: 'png', clip: { x: x0, y: arriba + y0, width: x1 - x0, height: y1 - y0, scale: 1 } })
        if (!res.result?.data) return null
        const { default: sharp } = await import('sharp')
        const { data, info } = await sharp(Buffer.from(res.result.data, 'base64')).removeAlpha().raw().toBuffer({ resolveWithObject: true })
        let cerca = 0
        for (const [x, y] of puntos) {
          const i = (Math.min(info.height - 1, Math.round((y - y0) * dpr)) * info.width + Math.min(info.width - 1, Math.round((x - x0) * dpr))) * info.channels
          if (Math.hypot(data[i] - r, data[i + 1] - g, data[i + 2] - b) < tope) cerca++
        }
        return Math.round((100 * cerca) / puntos.length) / 100
      },
      async preparar(ancho, alto, tactil) {
        await send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 2, mobile: tactil })
        await send('Emulation.setTouchEmulationEnabled', { enabled: tactil, maxTouchPoints: tactil ? 5 : 1 })
        await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reducir ? 'reduce' : 'no-preference' }] })
        if (cpu > 1) await send('Emulation.setCPUThrottlingRate', { rate: cpu })
      },
      /** Navega y espera el load, las fuentes y un momento (la hidratación). Devuelve el status del documento. */
      async ir(destino) {
        const antes = cargas
        visto.documento = null
        const t0 = Date.now()
        const tope = esperoAlguna && !contestoAlguna ? TOPE_RESPUESTA_CORTO : TOPE_RESPUESTA
        esperoAlguna = true
        try {
          await send('Page.navigate', { url: destino }, tope)
        } catch {
          // Con la navegación pendiente, Chrome tampoco contesta lo que sigue: se la corta (como tools/menu-check.mjs).
          await send('Page.stopLoading', {}, 3000).catch(() => {})
          return null
        }
        while (cargas === antes && Date.now() - t0 < tope) await dormir(100)
        if (cargas === antes) return null
        contestoAlguna = true
        for (let i = 0; i < 50 && (await evaluar('document.fonts.status')) !== 'loaded'; i++) await dormir(100)
        await dormir(600 + 200 * (cpu - 1))
        return visto.documento
      },
      cerrar: async () => {
        try {
          ws.close()
        } catch {}
        await matar()
      },
    }
  } catch (e) {
    await matar()
    throw e
  }
}

// El bordó de la sala tocada (MUPA/Bordo, D15 y M6).
const BORDO = [0x8a, 0x18, 0x12]
const slug = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-')
const fallas = []
let total = 0
const porTamano = {}
const anotar = (tamano, que, ok, esperado, encontrado) => {
  total++
  porTamano[tamano].comprobaciones++
  if (!ok) {
    fallas.push({ tamano, que, esperado, encontrado })
    porTamano[tamano].fallas++
  }
  return ok
}

async function revisarTamano(ancho, alto) {
  const t = `${ancho}x${alto}`
  porTamano[t] = { comprobaciones: 0, fallas: 0 }
  const tactil = ancho < 1024
  const c = await abrirChrome()
  try {
    await c.preparar(ancho, alto, tactil)
    const status = await c.ir(url)
    if (!anotar(t, 'la Home responde 200', status === 200, 200, status)) return
    const ev = (codigo) => c.evaluar(`__mapaCheck.${codigo}`)
    const info = await ev('leer()')
    porTamano[t].debajoDeMd = !info.desdeMd
    if (!anotar(t, 'el plano y las 14 salas en el HTML', info.hayPlano && info.salas.length === 14, '14 salas', info.salas)) return
    const scrollA = async (yPagina) => c.evaluar(`scrollTo({ top: ${Math.max(0, Math.round(yPagina))}, behavior: 'instant' })`)
    // Lleva un punto del plano (en unidades) al `donde` (0 a 1) del alto de la pantalla y devuelve dónde quedó.
    const llevar = async (u, v, donde = 0.45) => {
      const p = await ev(`aPantalla(${u}, ${v})`)
      const k = await ev('cajas()')
      await scrollA(k.scrollY + p.y - k.vh * donde)
      await dormir(120)
      return ev(`aPantalla(${u}, ${v})`)
    }
    const tocar = async (x, y, apoyo = 40) => {
      const n = await ev('clicks.length')
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 1, radiusY: 1 }] })
      await dormir(apoyo)
      await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      return ev(`esperarClick(${n}, ${ESPERA_ALGO})`)
    }
    const clic = async (x, y) => {
      const n = await ev('clicks.length')
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 })
      return ev(`esperarClick(${n}, ${ESPERA_ALGO})`)
    }
    const centros = {}
    for (const id of info.salas) centros[id] = await ev(`centro(${JSON.stringify(id)})`)

    if (info.desdeMd) {
      // Desde md: nada. Con el plano a la vista (el IntersectionObserver lo arma si está mal el corte).
      const k = await ev('cajas()')
      await scrollA(k.scrollY + k.y - 60)
      await dormir(ESPERA_NADA + 300)
      for (const id of [info.salas[0], info.salas[Math.floor(info.salas.length / 2)], info.salas.at(-1)]) {
        const cen = centros[id]
        const p = await llevar(cen.u, cen.v)
        if (tactil) await tocar(p.x, p.y)
        else await clic(p.x, p.y)
        await dormir(ESPERA_NADA)
        const e = await ev('estado()')
        anotar(t, `${id}: ${tactil ? 'tocarla' : 'el clic'} no arma capas ni etiquetas (desde md)`, e.capas === 0 && e.etiquetas === 0, '0 y 0', `${e.capas} y ${e.etiquetas}`)
      }
      anotar(t, 'nunca pide el plano tocado (desde md)', c.visto.tocada === 0, 0, c.visto.tocada)
    } else {
      // Con el plano lejos, nada armado ni pedido.
      const k0 = await ev('cajas()')
      if (k0.y > 2 * k0.vh) {
        const e = await ev('estado()')
        anotar(t, 'con el plano lejos, ni las capas ni el pedido del plano tocado', e.capas === 0 && c.visto.tocada === 0, 'ninguna y sin pedirlo', { capas: e.capas, pedidos: c.visto.tocada })
      }
      await scrollA(k0.scrollY + k0.y - 60)
      const t0 = Date.now()
      let e = await ev('estado()')
      while ((e.capas !== 14 || e.etiquetas !== 14 || !c.visto.tocada) && Date.now() - t0 < ESPERA_ALGO) {
        await dormir(100)
        e = await ev('estado()')
      }
      anotar(t, 'con el plano a la vista, las 14 capas y las 14 etiquetas armadas', e.capas === 14 && e.etiquetas === 14, '14 y 14', `${e.capas} y ${e.etiquetas}`)
      anotar(t, 'con el plano a la vista, se pide el plano tocado', c.visto.tocada >= 1, 'pedido', c.visto.tocada)
      const nombreDe = Object.fromEntries(info.salas.map((id) => [id, info.nombres.filter((n) => slug(n) === id)]))
      const sinNombre = info.salas.filter((id) => nombreDe[id].length !== 1)
      anotar(t, 'cada sala del plano tiene un nombre en la lista (home.mapa.espacios)', info.nombres.length === 14 && !sinNombre.length, '14 nombres, uno por sala', { nombres: info.nombres.length, sinNombre })

      // Enciende una sala; si ya está encendida y a la vista, la deja (así un caso no depende de cómo terminó el anterior).
      const encender = async (id) => {
        const ya = await ev('estado()')
        if (ya.capasActivas.join() === id && ya.capasVisibles.join() === id) return ya
        const cen = centros[id]
        const p = await llevar(cen.u, cen.v)
        await tocar(p.x, p.y)
        return ev(`esperar(${JSON.stringify(id)}, ${ESPERA_ALGO})`)
      }
      let anterior = null
      for (const id of info.salas) {
        if (!anotar(t, `${id}: tiene un punto adentro`, centros[id] && centros[id].d > 0, 'un punto adentro', centros[id])) continue
        e = await encender(id)
        const muestras = await ev(`muestras(${JSON.stringify(id)}, 4)`)
        const bordo = await c.cercaDe(muestras, BORDO)
        const prefijo = anterior ? `${id} (con ${anterior} encendida)` : id
        anotar(t, `${prefijo}: tocarla enciende esa sala sola (su capa con data-activa y a la vista)`, e.capasActivas.join() === id && e.capasVisibles.join() === id, { activas: [id], aLaVista: [id] }, { activas: e.capasActivas, aLaVista: e.capasVisibles })
        anotar(t, `${id}: en la pantalla, la sala se pinta de bordó`, bordo >= 0.5, `la mitad o más de ${muestras.length} puntos de adentro, bordó`, bordo)
        const et = e.etiquetasVisibles.length === 1 ? e.etiquetasVisibles[0] : null
        anotar(t, `${id}: una sola etiqueta a la vista, la de esa sala`, e.etiquetasActivas.join() === id && et?.id === id, id, { activas: e.etiquetasActivas, aLaVista: e.etiquetasVisibles.map((x) => x.id) })
        anotar(t, `${id}: la etiqueta dice SU nombre`, Boolean(et) && nombreDe[id].length === 1 && et.texto === nombreDe[id][0], nombreDe[id][0] ?? '(sin nombre en la lista)', et?.texto ?? 'sin etiqueta')
        anotar(t, `${id}: la etiqueta queda adentro del plano y no tapa su sala`, Boolean(et) && et.adentro && et.solape === 0, 'adentro, sin solape', et ? { adentro: et.adentro, solape: et.solape } : null)
        // Al lado de SU sala (R3M-01): a los 8 px de MapaMuseo.jsx (AIRE_PX; medido de 7,96 a 8,00 en los 9 tamaños por
        // defecto y al girar), arriba o abajo, y alineada con ella.
        anotar(
          t,
          `${id}: la etiqueta queda a 8 px de su sala, arriba o abajo, y alineada con ella`,
          Boolean(et) && et.alineada && et.aire !== null && et.aire >= 6 && et.aire <= 10,
          'alineada, a 6-10 px arriba o abajo',
          et ? { alineada: et.alineada, aire: et.aire } : null,
        )
        anterior = id
      }
      // La misma la apaga (la última que quedó encendida).
      const ultima = info.salas.at(-1)
      let p = await llevar(centros[ultima].u, centros[ultima].v)
      await tocar(p.x, p.y)
      e = await ev(`esperar(null, ${ESPERA_ALGO})`)
      anotar(t, 'tocar la misma la apaga', !e.capasActivas.length && !e.capasVisibles.length && !e.etiquetasVisibles.length, 'ninguna', { activas: e.capasActivas, aLaVista: e.capasVisibles })
      // Un toque largo no enciende nada.
      const primera = info.salas[0]
      p = await llevar(centros[primera].u, centros[primera].v)
      await tocar(p.x, p.y, 700)
      await dormir(ESPERA_NADA)
      e = await ev('estado()')
      anotar(t, 'un toque largo (700 ms) no enciende nada', !e.capasActivas.length && !e.capasVisibles.length && !e.etiquetasVisibles.length, 'ninguna', e.capasActivas)
      // Con ninguna encendida, tocar el plano fuera de las salas no enciende nada (R3M-01, 18/11/2026: con un respaldo a
      // la primera sala, la encendía, y la receta no lo veía). El toque tiene que llegar (el click).
      const vacio = await ev('vacio(12)')
      const sinNada = 'con ninguna encendida, tocar el plano fuera de las salas no enciende nada'
      if (vacio) {
        p = await llevar(vacio.u, vacio.v)
        const llego = await tocar(p.x, p.y)
        await dormir(ESPERA_NADA)
        e = await ev('estado()')
        const ninguna = !e.capasActivas.length && !e.capasVisibles.length && !e.etiquetasActivas.length && !e.etiquetasVisibles.length
        anotar(t, sinNada, llego && ninguna, 'el toque llega y ninguna', { llego, activas: e.capasActivas, aLaVista: e.capasVisibles, etiquetas: e.etiquetasActivas })
      } else anotar(t, sinNada, false, 'un punto para tocar', 'no hay (el plano sin lugar libre)')
      // Con una encendida, tocar fuera de las salas la apaga: el plano fuera de las salas, el título, debajo del plano
      // y el margen de la izquierda. La encendida es una del medio de la lista y no la primera (R3M-01: con un respaldo
      // a la primera sala, tocar afuera con ella encendida la apagaba por casualidad).
      const otra = info.salas[7]
      const afuera = [
        ['el plano fuera de las salas (a más de 12 px de todas)', async () => (vacio ? llevar(vacio.u, vacio.v) : null)],
        ['el título', async () => {
          const k = await ev('cajas()')
          await scrollA(k.scrollY + k.titulo.y - k.vh * 0.45)
          await dormir(120)
          return (await ev('cajas()')).titulo
        }],
        ['debajo del plano', async () => {
          const k = await ev('cajas()')
          await scrollA(k.scrollY + k.y + k.h + 16 - k.vh * 0.6)
          await dormir(120)
          const k2 = await ev('cajas()')
          return { x: k2.x + k2.w / 2, y: k2.y + k2.h + 16 }
        }],
        ['el margen de la izquierda del plano', async () => {
          const k = await ev('cajas()')
          if (k.x < 10) return null
          await scrollA(k.scrollY + k.y + k.h / 2 - k.vh * 0.5)
          await dormir(120)
          const k2 = await ev('cajas()')
          return { x: Math.max(2, k2.x - Math.min(12, k2.x / 2)), y: k2.y + k2.h / 2 }
        }],
      ]
      for (const [que, donde] of afuera) {
        const antes = await encender(otra)
        const punto = await donde()
        if (!punto) {
          anotar(t, `tocar ${que} la apaga`, false, 'un punto para tocar', 'no hay (el plano sin lugar libre o sin margen)')
          continue
        }
        await tocar(punto.x, punto.y)
        e = await ev(`esperar(null, ${ESPERA_ALGO})`)
        const apagada = !e.capasActivas.length && !e.capasVisibles.length && !e.etiquetasVisibles.length
        anotar(t, `tocar ${que} la apaga`, antes.capasActivas.join() === otra && apagada, `${otra} encendida y después ninguna`, { antes: antes.capasActivas, despues: e.capasActivas, aLaVista: e.capasVisibles })
      }
      // Deslizar el dedo sobre una sala no enciende nada, y la página se desplaza.
      p = await llevar(centros[primera].u, centros[primera].v, 0.6)
      const y0 = (await ev('estado()')).scrollY
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, radiusX: 1, radiusY: 1 }] })
      for (let i = 1; i <= 12; i++) {
        await dormir(16)
        await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: p.y - 15 * i, radiusX: 1, radiusY: 1 }] })
      }
      await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await dormir(ESPERA_NADA + 300)
      e = await ev('estado()')
      anotar(t, 'deslizar el dedo sobre una sala no enciende nada', !e.capasActivas.length && !e.capasVisibles.length && !e.etiquetasVisibles.length, 'ninguna', e.capasActivas)
      anotar(t, 'deslizar el dedo desplaza la página', e.scrollY - y0 >= 40, 'al menos 40 px', Math.round(e.scrollY - y0))
    }
    anotar(t, 'nada en la consola', c.visto.consola.length === 0, 'nada', c.visto.consola.slice(0, 3))
    const csp = await ev('csp')
    anotar(t, 'ninguna violación de la CSP', csp.length === 0, 0, csp.slice(0, 3))
  } finally {
    await c.cerrar()
  }
}

process.on('SIGINT', () => {
  // Cortada con Ctrl+C: termina a SU Chrome con todos sus procesos y borra su perfil (todo sincrónico, hasta ~10 s).
  for (const { pid } of enCurso) terminarArbol(pid)
  for (const { perfil } of enCurso) borrarPerfil(perfil)
  process.exit(130)
})
borrarPerfilesViejos()
const inicio = Date.now()
for (const [ancho, alto] of tamanos) {
  const t = `${ancho}x${alto}`
  try {
    await revisarTamano(ancho, alto)
  } catch (e) {
    porTamano[t] ??= { comprobaciones: 0, fallas: 0 }
    anotar(t, 'la corrida en este tamaño terminó', false, 'sin errores', String(e?.message ?? e).slice(0, 300))
  }
}
const resultado = { ok: fallas.length === 0, url, reduce: reducir, cpu, comprobaciones: total, segundos: Math.round((Date.now() - inicio) / 1000), porTamano, fallas }
const texto = JSON.stringify(resultado, null, 1)
if (archivoJson) writeFileSync(archivoJson, texto)
console.log(texto)
process.exit(fallas.length ? 1 : 0)
