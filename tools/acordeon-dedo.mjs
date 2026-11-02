// Gestos de dedo reales (touch por DevTools Protocol, con la inercia que les da Chrome) sobre el acordeón de Áreas en un
// celular emulado, midiendo cuadro a cuadro si la banda activa se mueve de golpe mientras las de arriba se cierran y si
// las bandas se abren en orden. Con --sin-anclaje apaga el anclaje de scroll del navegador (overflow-anchor: none en
// todo el documento), que es lo que le falta a Safari en iOS: ahí la corrección del scroll al cerrar una banda de arriba
// la tiene que hacer el hook (mantenerEnPantalla), y este arnés muestra si eso se ve.
// Mide, cuadro a cuadro, cuánto se movió en pantalla la cabecera de la banda activa (salto) y cuánto el scroll (dy).
// Scrolleando, la cabecera se mueve lo mismo que el scroll (salto = -dy, hasta ~110 px por cuadro en un flick). Cuando
// se cierra una banda de arriba, el documento se achica ~1000 px por encima y el hook corrige el scroll en el mismo
// cuadro: dy ≈ -1000 y la cabecera no se mueve (corrección compensada, se informa). Un tirón es un cuadro en que la
// cabecera se mueve en pantalla más de UMBRAL px que no se explican por el scroll (salto + dy lejos de 0 y salto
// grande): la corrección llegó tarde, no llegó, o llegó sola sin el cambio de layout. No es un tirón el cuadro de un
// cierre bien compensado (HOME-02 de la verificación de E4): con un cuadro que dura dos (la CPU cargada) o un flick
// rápido, el scroll del cuadro pasaba de UMBRAL y se contaba como tirón. Se informan aparte (cierresCompensados).
// Cómo se distingue (LIM-03 de la verificación de la limpieza, 27/10/2026): en el cuadro de un cierre de P px por
// encima, con s px de scroll de la persona, salto + dy = -P SIEMPRE, se haya corregido o no (por eso esa cuenta no
// sirve para decidir). Lo que cambia es el salto: compensado (el scroll corregido -P en el mismo momento), la cabecera
// se mueve lo que el scroll de la persona (|salto| = |s|, en la escala del scroll); sin corregir, o con la corrección
// deshecha (--pisada), lo que se plegó más eso (|salto| = P + s, en la escala del plegado). Es compensado si el hook
// informó en ese cuadro una corrección igual a lo plegado (corregido = -plegado), la cabecera se movió menos de la
// mitad de lo plegado y lo que se movió es lo que explica el scroll que venía (s, estimado con la velocidad de los
// cuadros vecinos por lo que duró el cuadro: al final de la página una corrección deshecha queda recortada y puede
// medir menos de la mitad de lo plegado, pero con el scroll quieto). Un cierre sin corregir, corregido tarde (--tarde)
// o corregido y deshecho (--pisada) sigue siendo un tirón.
// Da ok: true si no hay tirones y las bandas se abren de arriba hacia abajo sin reabrirse. Informa cuántas quedan
// abiertas al final (con el dedo, al final de la página pueden quedar dos: la de arriba nunca sale de la pantalla).
// Con --como-safari, además, la página cree que el navegador no tiene anclaje (CSS.supports('overflow-anchor') da
// false antes de que cargue el código): es el camino que sigue el hook en Safari, donde las bandas de arriba se cierran
// recién con el scroll quieto y el dedo levantado.
// Uso: node tools/acordeon-dedo.mjs [--url http://127.0.0.1:5183/] [--ancho 375] [--alto 812] [--modo flick|apoyado|lectura]
//        [--sin-anclaje | --como-safari] [--dist 650] [--ms 90] [--veces 4] [--espera 1800] [--umbral 60] [--tarde] [--subir]
//        [--cpu 4] [--cuadro-lento 50] [--pisada]
//   --tarde: control del propio arnés: la corrección del hook se aplica dos cuadros tarde (como si iOS la pisara) y
//   entonces TIENE que informar tirones; si da 0, la medición no sirve.
//   --pisada: otro control: algo deshace la corrección del hook en la misma tarea, después de que el hook la midió y la
//   informó (como si el navegador la pisara): la cabecera salta de verdad, aunque el hook diga que corrigió. TIENE que
//   informar tirones (la verificación del 27/10/2026, a 390x664: con el criterio anterior daba 0 y la cabecera saltaba
//   1002 px).
//   flick: `veces` flicks de `dist` px en `ms` ms, con `espera` ms entre uno y otro (la inercia corre sola).
//   apoyado: un solo arrastre largo sin levantar el dedo (18 px por cuadro).
//   lectura: como alguien que lee: arrastres cortos (`dist` px en `ms` ms) con el dedo que se levanta y `espera` ms de
//   pausa, `veces` veces; con --subir, al final vuelve a subir igual hasta el principio de la sección.
//   --cpu: la CPU limitada esas veces (Emulation.setCPUThrottlingRate; con 4 a 412x780 aparecían los cierres
//   compensados que se contaban como tirones).
//   --cuadro-lento: otro control del arnés: el cuadro de cada cierre dura esos ms más (como con la CPU cargada), así el
//   scroll de ese cuadro pasa de UMBRAL. Tiene que dar cierresCompensados y 0 tirones (la limpieza del 27/10/2026, a
//   412x780 y a 390x664 con --sin-anclaje: 1 y 2). Junto con --tarde no sirve: la corrección atrasada llega dentro del
//   mismo cuadro largo; --tarde se usa solo.
// Con una URL local (127.0.0.1 o localhost), Chrome no resuelve ningún otro nombre: nada sale de esta máquina (ni
// Google ni UserWay).
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
const ancho = Number(opt('--ancho', 375))
const alto = Number(opt('--alto', 812))
const modo = opt('--modo', 'flick')
const dist = Number(opt('--dist', 650))
const ms = Number(opt('--ms', 90))
const veces = Number(opt('--veces', 4))
const espera = Number(opt('--espera', 1800))
const umbral = Number(opt('--umbral', 60))
const comoSafari = bandera('--como-safari')
const tarde = bandera('--tarde')
const subir = bandera('--subir')
const sinAnclaje = bandera('--sin-anclaje') || comoSafari
const cpu = Number(opt('--cpu', 1))
const cuadroLento = Number(opt('--cuadro-lento', 0))
const pisada = bandera('--pisada')
const local = ['127.0.0.1', 'localhost'].includes(new URL(url).hostname)

const sleep = (t) => new Promise((r) => setTimeout(r, t))
// Puerto 0: Chrome elige uno libre y lo anota en DevToolsActivePort, dentro de su perfil (un puerto al azar podía
// chocar con otra corrida en paralelo).
const profile = mkdtempSync(join(tmpdir(), 'cdp-'))
const chrome = spawn(
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--enable-automation',
    ...(local ? ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'] : []),
    '--disable-gpu',
    '--hide-scrollbars',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)
let salida = null
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
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'error en la expresión')
    return r.result?.result?.value
  }
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 2, mobile: true })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  if (cpu > 1) await send('Emulation.setCPUThrottlingRate', { rate: cpu })
  // Registro de las decisiones del hook (window.__acordeonDiag, el mismo gancho que usa ?diag).
  await send('Page.addScriptToEvaluateOnNewDocument', {
    // tf: el momento sin redondear, para saber en qué cuadro se vio cada evento.
    source:
      `window.__eventos = []; window.__acordeonDiag = (tipo, datos) => { const tf = performance.now(); ` +
      `window.__eventos.push({ t: Math.round(tf), tf, tipo, ...datos }); ` +
      // --cuadro-lento: el hilo principal ocupado después del cierre (y de su corrección), en el mismo cuadro.
      `if (tipo === 'cierra' && ${cuadroLento} > 0) { const fin = performance.now() + ${cuadroLento}; while (performance.now() < fin); } ` +
      // --pisada: la corrección del hook, deshecha en la misma tarea (la cabecera salta de verdad).
      `if (tipo === 'cierra' && ${pisada} && datos.corregido) window.scrollBy({ top: -datos.corregido, behavior: 'instant' }) }`,
  })
  if (comoSafari) {
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => { const original = CSS.supports.bind(CSS); CSS.supports = (...a) => (String(a[0]).includes('overflow-anchor') ? false : original(...a)) })()`,
    })
  }
  await send('Page.navigate', { url })
  await sleep(2500)
  await ev('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 400)))')
  if (sinAnclaje) {
    await ev(`(() => { const st = document.createElement('style'); st.textContent = '* { overflow-anchor: none !important }'; document.head.append(st) })()`)
  }
  if (tarde) {
    await ev(`(() => { for (const m of ['scrollBy', 'scrollTo']) { const original = window[m]; window[m] = function (...a) { setTimeout(() => original.apply(window, a), 34) } } })()`)
  }
  // Deja la lista una pantalla y pico por debajo y muestrea cuadro a cuadro: estado de las bandas, cabecera activa y
  // cuánto se movió respecto del cuadro anterior (solo mientras la activa es la misma).
  await ev(`(() => {
    // La lista de las bandas (la primera ul de la sección es la de las etiquetas).
    const ul = document.querySelector('#areas [data-panel]').closest('ul')
    const base = ul.getBoundingClientRect().top + scrollY
    scrollTo({ top: base - innerHeight * 1.2, behavior: 'instant' })
    window.__t = []
    const lis = [...ul.children]
    let prev = null
    const f = () => {
      const ab = lis.map((li) => li.querySelector('button').getAttribute('aria-expanded') === 'true')
      const tops = lis.map((li) => li.getBoundingClientRect().top)
      // Cuánto le falta crecer a cada panel abierto (0 = alto completo).
      const falta = lis.map((li) => { const p = li.querySelector('[data-panel]'); return ab[lis.indexOf(li)] ? Math.round(p.firstElementChild.scrollHeight - p.getBoundingClientRect().height) : 0 })
      const act = ab.lastIndexOf(true)
      const y = scrollY
      const tf = performance.now()
      window.__t.push({
        t: Math.round(tf), tf, y: Math.round(y), est: ab.map((v) => (v ? 'A' : 'c')).join(''), act,
        top: act >= 0 ? Math.round(tops[act]) : null,
        salto: prev && prev.act === act && act >= 0 ? Math.round(tops[act] - prev.top) : null,
        dy: prev ? Math.round(y - prev.y) : 0,
        falta,
      })
      prev = { act, top: act >= 0 ? tops[act] : null, y }
      requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  })()`)
  await sleep(1200)
  const x = Math.round(ancho / 2)
  const toque = (type, puntos) => send('Input.dispatchTouchEvent', { type, touchPoints: puntos })
  if (modo === 'flick') {
    const y0 = Math.round(alto * 0.86)
    for (let i = 0; i < veces; i++) {
      const pasos = Math.max(2, Math.round(ms / 16))
      await toque('touchStart', [{ x, y: y0 }])
      for (let k = 1; k <= pasos; k++) {
        await toque('touchMove', [{ x, y: y0 - (dist * k) / pasos }])
        await sleep(16)
      }
      await toque('touchEnd', [])
      await sleep(espera)
    }
  } else if (modo === 'lectura') {
    const arrastre = async (d) => {
      const pasos = Math.max(2, Math.round(ms / 16))
      const y0 = d > 0 ? Math.round(alto * 0.8) : Math.round(alto * 0.2)
      await toque('touchStart', [{ x, y: y0 }])
      for (let k = 1; k <= pasos; k++) {
        await toque('touchMove', [{ x, y: y0 - (d * k) / pasos }])
        await sleep(16)
      }
      await toque('touchEnd', [])
      await sleep(espera)
    }
    for (let i = 0; i < veces; i++) await arrastre(dist)
    if (subir) {
      for (let i = 0; i < veces * 2; i++) {
        const arriba = await ev("document.querySelector('#areas').getBoundingClientRect().top > 0")
        if (arriba) break
        await arrastre(-dist)
      }
    }
  } else {
    // Un dedo que baja sin soltarse; cuando llega arriba de la pantalla se suelta y vuelve a apoyar abajo.
    let y = Math.round(alto * 0.94)
    await toque('touchStart', [{ x, y }])
    for (let k = 0; k < 220; k++) {
      y -= 18
      if (y < 60) {
        await toque('touchEnd', [])
        y = Math.round(alto * 0.94)
        await toque('touchStart', [{ x, y }])
      }
      await toque('touchMove', [{ x, y }])
      await sleep(16)
    }
    await toque('touchEnd', [])
  }
  await sleep(2500)
  const t = await ev('window.__t')
  const eventos = await ev('window.__eventos')
  const anclajeSegunLaPagina = await ev("CSS.supports('overflow-anchor', 'auto')")
  s.close()
  // Los cierres del hook, por el cuadro en que se ven (el primero muestreado después del evento), con lo que se plegó y
  // lo que se corrigió el scroll en el mismo momento (corregido: negativo, la página sube lo que se plegó arriba).
  const cierresPorCuadro = new Map()
  for (const e of eventos.filter((e) => e.tipo === 'cierra')) {
    const k = t.findIndex((v) => v.tf >= e.tf)
    if (k < 0) continue
    const c = cierresPorCuadro.get(k) ?? { plegado: 0, corregido: 0 }
    c.plegado += e.plegado ?? 0
    c.corregido += e.corregido ?? 0
    cierresPorCuadro.set(k, c)
  }
  // La velocidad del scroll (px/ms) en el cuadro k, si no es un cuadro de cierre; y el scroll que se espera en el cuadro
  // k según los cuadros vecinos, escalado por lo que duró (con la CPU cargada un cuadro dura dos o más).
  const velocidad = (k) => {
    if (k < 1 || k >= t.length || cierresPorCuadro.has(k)) return null
    const dt = t[k].tf - t[k - 1].tf
    return dt > 0 ? t[k].dy / dt : null
  }
  const scrollEsperado = (k) => {
    const vs = [velocidad(k - 1), velocidad(k + 1)].filter((v) => v != null)
    return vs.length ? (vs.reduce((a, b) => a + b, 0) / vs.length) * (t[k].tf - t[k - 1].tf) : 0
  }
  // ¿El cuadro k es un cierre bien compensado? (ver el encabezado: HOME-02 y LIM-03) El hook informó una corrección
  // igual a lo plegado, la cabecera se movió en la escala del scroll y no en la de lo plegado, y lo que se movió es lo
  // que explica el scroll que venía (salto ≈ -scrollEsperado, con margen: UMBRAL o la mitad de ese scroll). Lo último
  // separa una corrección deshecha que el final de la página recortó (salto de 414 px con el scroll quieto, --pisada
  // en el camino de Safari) de un cierre compensado en un cuadro largo en pleno flick (salto de 456 px con el scroll a
  // ~5 px/ms).
  const compensado = (v, k) => {
    const c = cierresPorCuadro.get(k)
    if (!c || c.plegado <= 0 || Math.abs(c.corregido + c.plegado) > 2) return false
    const esperado = scrollEsperado(k)
    return Math.abs(v.salto) < c.plegado / 2 && Math.abs(v.salto + esperado) <= Math.max(umbral, Math.abs(esperado) / 2)
  }
  const candidatos = t.flatMap((v, k) =>
    v.salto != null && Math.abs(v.salto + v.dy) > umbral && Math.abs(v.salto) > umbral ? [[v, k]] : [],
  )
  const saltos = candidatos.filter(([v, k]) => !compensado(v, k)).map(([v]) => v)
  const cierresCompensados = candidatos.filter(([v, k]) => compensado(v, k)).map(([v, k]) => ({ v, c: cierresPorCuadro.get(k), esperado: Math.round(scrollEsperado(k)) }))
  const correcciones = t.filter((v) => v.salto != null && Math.abs(v.salto + v.dy) > 250)
  // Velocidad máxima del scroll por cuadro, sin contar los cuadros de corrección.
  const velocidadMaxima = Math.max(0, ...t.filter((v) => !correcciones.includes(v)).map((v) => Math.abs(v.dy)))
  const estados = t.map((v) => v.est).filter((v, i, a) => v !== a[i - 1])
  // Cuándo cambió cada estado y a qué velocidad iba el scroll en ese cuadro.
  const cambios = t.filter((v, i) => i > 0 && v.est !== t[i - 1].est).map((v) => `t${v.t} ${v.est} (dy ${v.dy})`)
  // Orden: la activa (última A) nunca retrocede, y ninguna banda que se cerró vuelve a abrirse.
  let desorden = false
  let maxAct = -1
  const cerradas = new Set()
  let previo = null
  for (const e of estados) {
    const act = e.lastIndexOf('A')
    if (act < maxAct && act >= 0) desorden = true
    maxAct = Math.max(maxAct, act)
    if (previo) for (let i = 0; i < e.length; i++) {
      if (previo[i] === 'A' && e[i] === 'c') cerradas.add(i)
      if (e[i] === 'A' && cerradas.has(i)) desorden = true
    }
    previo = e
  }
  const final = t[t.length - 1]
  if (!final) throw new Error('no se registró ningún cuadro: ¿la página tiene #areas con [data-panel]?')
  const abiertasAlFinal = (final.est.match(/A/g) || []).length
  // Bandas salteadas: entre la primera y la última que fueron activas, alguna que nunca se abrió.
  const abiertasAlgunaVez = new Set(t.flatMap((v) => [...v.est].flatMap((c, i) => (c === 'A' ? [i] : []))))
  const activas = t.map((v) => v.act).filter((a) => a >= 0)
  const salteadas = activas.length ? Array.from({ length: Math.max(...activas) - Math.min(...activas) + 1 }, (_, k) => Math.min(...activas) + k).filter((i) => !abiertasAlgunaVez.has(i)) : []
  // Cada apertura por scroll: en qué modo (aparición o alto) y cuántos ms tardó el panel en tener su alto completo.
  const aperturas = eventos.filter((e) => e.tipo === 'abre').map((e) => {
    const desde = t.findIndex((v) => v.t >= e.t && v.est[e.banda] === 'A')
    const completo = desde < 0 ? -1 : t.findIndex((v, k) => k >= desde && v.falta[e.banda] <= 1)
    return `banda ${e.banda} ${e.modo}: alto completo a los ${desde < 0 || completo < 0 ? '?' : t[completo].t - t[desde].t} ms`
  })
  const cierres = eventos.filter((e) => e.tipo === 'cierra').map((e) => `${e.bandas.join(',')} (${e.motivo})`)
  salida = {
    ok: saltos.length === 0 && !desorden && salteadas.length === 0,
    url, tamano: `${ancho}x${alto}`, modo, sinAnclaje, comoSafari, cpu, tarde, cuadroLento, pisada, cuadros: t.length, scroll: `${t[0].y} -> ${final.y}`,
    velocidadMaximaPorCuadro: velocidadMaxima,
    tirones: saltos.length,
    detalleTirones: saltos.slice(0, 6).map((v) => `t${v.t} y${v.y} ${v.est} la cabecera se movió ${v.salto}px con dy ${v.dy}`),
    cierresCompensados: cierresCompensados.length,
    detalleCierresCompensados: cierresCompensados
      .slice(0, 6)
      .map(({ v, c, esperado }) => `t${v.t} y${v.y} ${v.est} salto ${v.salto} dy ${v.dy}: se plegaron ${c.plegado} y se corrigió ${c.corregido}; el scroll que venía, ${esperado}`),
    correccionesCompensadas: correcciones.length,
    detalleCorrecciones: correcciones.slice(0, 6).map((v) => `t${v.t} dy ${v.dy} -> la activa se movió ${v.salto ?? 'n/a'} px`),
    estados: estados.join(' -> '),
    aperturas,
    cierres,
    eventos: eventos.map((e) => { const { t: tt, tf: _tf, tipo, ...resto } = e; return `t${tt} ${tipo} ${JSON.stringify(resto)}` }),
    cambios,
    anclajeSegunLaPagina,
    desorden, salteadas, abiertasAlFinal,
  }
} finally {
  chrome.kill()
  await sleep(300)
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {}
}
console.log(JSON.stringify(salida, null, 2))
process.exit(salida?.ok ? 0 : 1)
