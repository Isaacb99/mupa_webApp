// El manual del panel (E6.2; plan 5.2 y 12.1): regenera las capturas de docs/manual/img/ y el PDF que abre "Ayuda" en
// la barra del panel (panel/public/manual.pdf, que Vite copia a dist/panel y server/panel.js sirve en
// /administracion/manual.pdf).
//
// Uso, desde la raíz de mupa-web:
//   npm run build
//   node --env-file-if-exists=.env tools/manual.mjs            capturas y PDF (unos 2 minutos)
//   node tools/manual.mjs --solo-pdf                           solo el PDF, con las capturas que ya están
//   después: npm run build otra vez, para que el PDF nuevo quede en dist/panel.
// Opciones: --build <carpeta> (el build que se sirve para las capturas: dist), --puerto <n> (5560), --salida <archivo>
//   (panel/public/manual.pdf), --conservar (no borra el esquema ni las cuentas al terminar, para mirar algo a mano en
//   el mismo puerto: el servidor queda andando hasta Ctrl+C).
//
// Qué hace para las capturas, sin tocar nada de lo que ya hay:
// - Arma un esquema aislado ("manual_capturas") dentro de la base de DATABASE_URL, que tiene que ser local
//   (localhost): lo migra, y al terminar lo borra entero (DROP SCHEMA … CASCADE), con las cuentas y las fotos.
// - Levanta la producción local (server/servidor.js con NODE_ENV=production) en 127.0.0.1, con el correo contra el
//   SMTP falso de las pruebas (server/pruebas/smtpFalso.js, en este mismo proceso): ningún mail sale de la máquina.
//   Sin UserWay ni IndexNow, y Chrome no llega a Google ni a UserWay (no se carga ninguna página pública).
// - Crea una administradora con el comando de la llave de emergencia (crear-admin) y hace el primer ingreso en Chrome
//   headless, como lo haría una persona: la contraseña temporal y la nueva quedan solo en memoria (nunca en archivos,
//   logs ni capturas; la temporal del diálogo de Usuarios se tapa antes de capturar).
// - Carga contenido de ejemplo por la API, todo marcado "EJEMPLO ·" (como la semilla de ejemplo): no son datos del
//   museo. Las fotos son las del sitio (src/assets), con descripciones de lo que se ve.
// - Captura cada pantalla a 1440x900 (Ingresar y Cambiar la contraseña a 900 de ancho, para que entre su barra entera;
//   y tres a 390, el celular) con el doble de densidad, recortada a lo que importa, y la guarda en
//   docs/manual/img/<nombre>.webp (sin pérdida; con pérdida las que tienen fotos). A algunos botones o campos les pone
//   un recuadro naranja para señalarlos (no es del panel: está solo en la captura).
// El PDF: abre docs/manual/manual.html en Chrome headless, ajusta el tamaño de cada captura (todas a la misma escala,
// así la letra del panel se ve igual en todas), lo imprime en A4 (Page.printToPDF, con el PDF etiquetado y los
// marcadores de los títulos) y completa el índice con el número de página de cada título: imprime, busca cada título
// en el texto del PDF (pdfjs-dist) y vuelve a imprimir con los números, hasta que coinciden. Al final deja una sola vez
// el título de los marcadores que Chrome repite (arreglarMarcadores) y comprueba que cada marcador sea un título.
// Chrome siempre headless (--headless=new); nunca una ventana.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR_MANUAL = join(REPO, 'docs', 'manual')
const DIR_IMG = join(DIR_MANUAL, 'img')
const HTML = join(DIR_MANUAL, 'manual.html')
// Lo de trabajo (el log del servidor, las fotos de ejemplo en JPG, una captura si algo falla): no se versiona.
const DIR_TRABAJO = join(REPO, 'tools', 'salida', 'manual')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

// --- Opciones ---

const argv = process.argv.slice(2)
const opcion = (nombre, porDefecto) => {
  const i = argv.indexOf(nombre)
  return i >= 0 ? argv[i + 1] : porDefecto
}
const SOLO_PDF = argv.includes('--solo-pdf')
const CONSERVAR = argv.includes('--conservar')
const DIR_BUILD = resolve(REPO, opcion('--build', 'dist'))
const PUERTO = Number(opcion('--puerto', 5560))
const SALIDA_PDF = resolve(REPO, opcion('--salida', join('panel', 'public', 'manual.pdf')))
const BASE = `http://127.0.0.1:${PUERTO}`
const PANEL = `${BASE}/administracion`

// Las capturas: el doble de densidad (la letra se ve nítida) y, en el PDF, todas a la misma escala: un píxel del panel
// ocupa ESCALA_PDF píxeles de la página (la columna del A4 mide ~665 px): la letra del panel queda en ~7,5 pt.
const DENSIDAD = 2
const ESCALA_PDF = 0.66
// Chrome guarda en el PDF las imágenes que no son JPEG sin pérdida (con las capturas en WebP, el PDF pasaba de 7 MB):
// para el PDF se usan copias en JPEG (que Chrome guarda tal cual) a PPP_PDF puntos por pulgada de la página impresa.
const PPP_PDF = 170
const CALIDAD_PDF = 86
// El naranja del sitio (#eb622d), para señalar un botón en una captura.
const NARANJA = '#eb622d'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...partes) => console.log(...partes)

// =====================================================================================================================
// Chrome por CDP (solo headless)
// =====================================================================================================================

/**
 * Abre un Chrome headless con su perfil temporal y devuelve el cliente de la primera pestaña.
 * @param {{ ancho?: number, alto?: number, movil?: boolean }} [opciones]
 */
async function abrirChrome({ ancho = 1440, alto = 900, movil = false } = {}) {
  if (!existsSync(CHROME)) throw new Error(`No está Chrome en ${CHROME} (definí CHROME_PATH).`)
  const perfil = mkdtempSync(join(tmpdir(), 'mupa-manual-'))
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--lang=es-AR',
      '--accept-lang=es-AR,es',
      // Las páginas del panel no cargan nada de afuera; por las dudas, Google y UserWay no resuelven.
      '--host-resolver-rules=MAP *.google.com 127.0.0.1:9, MAP *.google-analytics.com 127.0.0.1:9, ' +
        'MAP *.googletagmanager.com 127.0.0.1:9, MAP *.userway.org 127.0.0.1:9, MAP userway.org 127.0.0.1:9',
      '--remote-debugging-port=0',
      `--user-data-dir=${perfil}`,
      `--window-size=${ancho},${alto}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )
  let wsUrl
  for (let i = 0; i < 100 && !wsUrl; i++) {
    try {
      const puerto = readFileSync(join(perfil, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim()
      const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json()
      wsUrl = lista.find((t) => t.type === 'page')?.webSocketDebuggerUrl
    } catch {
      await sleep(150)
    }
  }
  if (!wsUrl) {
    chrome.kill()
    throw new Error('Chrome no respondió por CDP.')
  }
  const ws = new WebSocket(wsUrl)
  await new Promise((r, rej) => {
    ws.onopen = r
    ws.onerror = rej
  })
  let id = 0
  const pendientes = new Map()
  const eventos = []
  const problemas = []
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pendientes.has(m.id)) {
      pendientes.get(m.id)(m)
      pendientes.delete(m.id)
      return
    }
    if (!m.method) return
    eventos.push(m.method)
    if (m.method === 'Runtime.exceptionThrown') problemas.push(m.params.exceptionDetails?.exception?.description ?? 'excepción')
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && m.params.entry.source !== 'network') {
      problemas.push(m.params.entry.text)
    }
  }
  const send = (method, params = {}) =>
    new Promise((ok, mal) => {
      const i = ++id
      pendientes.set(i, (m) => (m.error ? mal(new Error(`${method}: ${m.error.message}`)) : ok(m.result)))
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  await send('Network.setBlockedURLs', { urls: ['*google*', '*userway*', '*bing.com*', '*indexnow*'] })
  await send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: DENSIDAD, mobile: movil })
  if (movil) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  // Sin animaciones ni el cursor que titila en las capturas.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })

  /** Evalúa una expresión en la página (con await) y devuelve el valor. */
  async function evaluar(expresion) {
    const r = await send('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    return r.result?.value
  }

  /** Espera a que la expresión dé algo verdadero. */
  async function esperar(expresion, { tiempo = 20_000, que = expresion } = {}) {
    const fin = Date.now() + tiempo
    for (;;) {
      let valor = null
      try {
        valor = await evaluar(expresion)
      } catch {}
      if (valor) return valor
      if (Date.now() > fin) throw new Error(`Se esperó y no pasó: ${que}`)
      await sleep(120)
    }
  }

  async function cerrar() {
    try {
      ws.close()
    } catch {}
    chrome.kill()
    await sleep(400)
    try {
      rmSync(perfil, { recursive: true, force: true })
    } catch {}
  }

  return { send, evaluar, esperar, cerrar, eventos, problemas, ancho, alto }
}

// Lo que se inyecta en cada página del panel para manejarla como una persona: escribir en un campo controlado por
// React (el setter nativo y el evento input, que React escucha), hacer clic en un botón por su texto, etc.
const AYUDAS_EN_LA_PAGINA = String.raw`
window.__m = {
  el(sel) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel
    if (!el) throw new Error('No está: ' + sel)
    return el
  },
  poner(sel, valor) {
    const el = this.el(sel)
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    el.focus()
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, valor)
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
    el.blur()
  },
  texto(el) {
    return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
  },
  // El primer botón o enlace visible cuyo texto empieza con lo pedido (los botones del panel suman texto para el lector
  // al final, con sr-only), dentro de 'dentro' si se pasa.
  boton(texto, dentro) {
    const raiz = dentro ? this.el(dentro) : document
    const todos = [...raiz.querySelectorAll('button, a, [role=tab]')]
    const visible = (b) => b.getClientRects().length > 0 && getComputedStyle(b).visibility !== 'hidden'
    const b = todos.find((x) => visible(x) && this.texto(x).startsWith(texto))
    if (!b) throw new Error('No está el botón: ' + texto)
    return b
  },
  clic(texto, dentro) {
    this.boton(texto, dentro).click()
    return true
  },
  dialogoAbierto() {
    return [...document.querySelectorAll('dialog')].find((d) => d.open) ?? null
  },
}
true
`

/** Cambia el tamaño de la ventana emulada (escritorio). */
async function tamano(c, ancho, alto) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: DENSIDAD, mobile: false })
  c.ancho = ancho
  c.alto = alto
}

/** Navega a una ruta del panel y espera a que su título (h1) esté. */
async function ir(c, ruta, titulo) {
  await c.send('Page.navigate', { url: `${PANEL}${ruta}` })
  await c.esperar(`document.readyState === 'complete'`)
  await esperarPantalla(c, titulo)
}

/** Espera a que la pantalla tenga ese h1 (o que empiece así), sin "Cargando", y deja las ayudas listas. */
async function esperarPantalla(c, titulo) {
  await c.esperar(
    `(() => { const h = document.querySelector('main h1'); return h && h.textContent.trim().startsWith(${JSON.stringify(titulo)}) && !document.querySelector('main[aria-busy]') })()`,
    { que: `la pantalla «${titulo}»` },
  )
  await c.evaluar(AYUDAS_EN_LA_PAGINA)
  await c.evaluar('document.fonts.ready.then(() => true)')
  await sleep(250)
}

/** Clic en el botón o enlace con ese texto. */
const clic = (c, texto, dentro) => c.evaluar(`__m.clic(${JSON.stringify(texto)}, ${JSON.stringify(dentro ?? null)})`)
/** Escribe en un campo (input, textarea o select) controlado por React. */
const poner = (c, selector, valor) => c.evaluar(`__m.poner(${JSON.stringify(selector)}, ${JSON.stringify(valor)})`)

/** Elige archivos en un <input type="file"> (como si la persona los hubiera elegido). */
async function elegirArchivos(c, selector, archivos) {
  const { root } = await c.send('DOM.getDocument', { depth: 0 })
  const { nodeId } = await c.send('DOM.querySelector', { nodeId: root.nodeId, selector })
  if (!nodeId) throw new Error(`No está ${selector}`)
  await c.send('DOM.setFileInputFiles', { nodeId, files: archivos })
}

/** Escribe en el área de texto que tiene el foco (el editor). */
const tipear = (c, texto) => c.send('Input.insertText', { text: texto })
async function tecla(c, tecla, codigo) {
  await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: tecla, code: tecla, windowsVirtualKeyCode: codigo })
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: tecla, code: tecla, windowsVirtualKeyCode: codigo })
}

// =====================================================================================================================
// Capturas
// =====================================================================================================================

/**
 * Captura una parte de la pantalla y la guarda en docs/manual/img/<nombre>.webp.
 * @param {object} c  el cliente de abrirChrome
 * @param {string} nombre
 * @param {object} opciones
 * @param {string[]} [opciones.de]  selectores CSS: se captura la caja que los contiene a todos (más el margen). Sin
 *   esto, la pantalla entera (lo que se ve).
 * @param {string} [opciones.desde]  selector: la captura arranca arriba de este elemento (en vez de en el primero de "de")
 * @param {string} [opciones.hasta]  selector: la captura termina abajo de este elemento
 * @param {[number, number]} [opciones.x]  el ancho de la captura en píxeles del panel (desde, hasta), en vez del de la caja
 * @param {number} [opciones.margen]  alrededor de la caja (16)
 * @param {number} [opciones.altoMax]  corta la captura en ese alto
 * @param {string[]} [opciones.resaltar]  selectores (o "texto:Publicar") a los que se les pone el recuadro naranja
 * @param {boolean} [opciones.vista]  la pantalla tal como se ve (para los diálogos), recortada con "de" si se pasa
 * @param {boolean} [opciones.fotos]  la captura tiene fotos: WebP con pérdida (sin pérdida, una foto pesa 5 veces más)
 */
async function capturar(c, nombre, opciones = {}) {
  const { de = null, desde = null, hasta = null, x = null, margen = 16, altoMax = null, resaltar = [], vista = false, fotos = false } =
    opciones
  // Sin foco (ni el anillo ni el cursor del texto) y, salvo la pantalla tal como se ve, desde arriba de la página.
  await c.evaluar(`(() => { document.activeElement?.blur?.(); return true })()`)
  if (!vista) await c.evaluar(`window.scrollTo({ top: 0, behavior: 'instant' }) || true`)
  const caja = await c.evaluar(`(() => {
    const abs = (r) => ({ x0: r.left + scrollX, y0: r.top + scrollY, x1: r.right + scrollX, y1: r.bottom + scrollY })
    const de = ${JSON.stringify(de)}
    const cajas = []
    for (const sel of de ?? []) {
      const nodos = [...document.querySelectorAll(sel)].filter((n) => n.getClientRects().length)
      if (!nodos.length) throw new Error('No está para capturar: ' + sel)
      for (const n of nodos) cajas.push(abs(n.getBoundingClientRect()))
    }
    if (!cajas.length) return { x0: scrollX, y0: scrollY, x1: scrollX + innerWidth, y1: scrollY + innerHeight, minimo: 0 }
    const caja = {
      x0: Math.min(...cajas.map((k) => k.x0)), y0: Math.min(...cajas.map((k) => k.y0)),
      x1: Math.max(...cajas.map((k) => k.x1)), y1: Math.max(...cajas.map((k) => k.y1)),
    }
    const desde = ${JSON.stringify(desde)}, hasta = ${JSON.stringify(hasta)}
    if (desde) caja.y0 = abs(document.querySelector(desde).getBoundingClientRect()).y0
    if (hasta) caja.y1 = abs(document.querySelector(hasta).getBoundingClientRect()).y1
    // Lo de la barra no entra en una captura que no la pide (el margen de arriba la tocaría).
    const barra = document.querySelector('header')
    caja.minimo = barra && !(de ?? []).includes('header') ? abs(barra.getBoundingClientRect()).y1 : 0
    return caja
  })()`)
  const m = de ? margen : 0
  let x0 = Math.max(0, (x ? x[0] : caja.x0) - (x ? 0 : m))
  let x1 = Math.min(c.ancho, (x ? x[1] : caja.x1) + (x ? 0 : m))
  let y0 = vista ? Math.max(0, caja.y0 - m) : Math.max(caja.minimo, caja.y0 - m)
  let y1 = caja.y1 + m
  if (altoMax) y1 = Math.min(y1, y0 + altoMax)
  // Los recuadros naranjas: divs encima de todo, en coordenadas del documento (o fijos, en un diálogo).
  if (resaltar.length) {
    await c.evaluar(`(() => {
      const fijos = ${vista}
      for (const sel of ${JSON.stringify(resaltar)}) {
        const el = sel.startsWith('texto:') ? __m.boton(sel.slice(6), __m.dialogoAbierto()) : document.querySelector(sel)
        if (!el) throw new Error('No está para resaltar: ' + sel)
        const r = el.getBoundingClientRect()
        const d = document.createElement('div')
        d.dataset.resaltado = ''
        Object.assign(d.style, {
          position: fijos ? 'fixed' : 'absolute', zIndex: 2147483647, pointerEvents: 'none', boxSizing: 'border-box',
          left: (r.left + (fijos ? 0 : scrollX) - 6) + 'px', top: (r.top + (fijos ? 0 : scrollY) - 6) + 'px',
          width: (r.width + 12) + 'px', height: (r.height + 12) + 'px',
          border: '4px solid ${NARANJA}', borderRadius: '10px',
        })
        // En un diálogo modal, adentro del diálogo (la capa de arriba de todo).
        ;(fijos && __m.dialogoAbierto() ? __m.dialogoAbierto() : document.body).appendChild(d)
      }
      return true
    })()`)
    await sleep(100)
  }
  const ancho = Math.round(x1 - x0)
  const alto = Math.round(y1 - y0)
  const r = await c.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: !vista,
    clip: { x: Math.round(x0), y: Math.round(y0), width: ancho, height: alto, scale: 1 },
  })
  if (resaltar.length) await c.evaluar(`document.querySelectorAll('[data-resaltado]').forEach((d) => d.remove()) || true`)
  const sharp = (await import('sharp')).default
  const destino = join(DIR_IMG, `${nombre}.webp`)
  // Sin pérdida: son pantallas con texto. Con fotos, con pérdida y buena calidad (el texto se sigue leyendo bien).
  const imagen = sharp(Buffer.from(r.data, 'base64'))
  await (fotos ? imagen.webp({ quality: 86, smartSubsample: true, effort: 6 }) : imagen.webp({ lossless: true, effort: 6 })).toFile(destino)
  log(`  captura ${nombre} (${ancho}x${alto})`)
}

// =====================================================================================================================
// Base aislada, servidor y correo falso
// =====================================================================================================================

const ESQUEMA = 'manual_capturas'

function urlDeLaBase() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL: corré la herramienta con node --env-file-if-exists=.env tools/manual.mjs')
  const u = new URL(url)
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(u.hostname)) {
    throw new Error('DATABASE_URL no es local: las capturas se hacen solo contra una base de esta máquina.')
  }
  if (u.search) throw new Error('DATABASE_URL no puede traer parámetros (la herramienta suma el search_path).')
  if (process.env.NODE_ENV === 'production') throw new Error('No con NODE_ENV=production.')
  return url
}

const urlAislada = (url) => `${url}?options=${encodeURIComponent(`-c search_path=${ESQUEMA}`)}`

async function conBase(url, fn) {
  const pg = (await import('pg')).default
  const cliente = new pg.Client({ connectionString: url })
  await cliente.connect()
  try {
    return await fn(cliente)
  } finally {
    await cliente.end()
  }
}

/** Corre un comando de node del repo y devuelve su salida (sin mostrarla: puede traer una temporal). */
function correr(args, env) {
  return new Promise((ok) => {
    const hijo = spawn(process.execPath, args, { cwd: REPO, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let salida = ''
    let error = ''
    hijo.stdout.on('data', (d) => (salida += d))
    hijo.stderr.on('data', (d) => (error += d))
    hijo.on('close', (codigo) => ok({ codigo, salida, error }))
  })
}

/** El entorno de los procesos hijos: el de acá, sin lo que no tiene que llegar (UserWay, IndexNow, la base de pruebas). */
function entornoBase(extra) {
  const env = { ...process.env }
  for (const quitar of ['USERWAY_ID', 'INDEXNOW_CLAVE', 'DATABASE_URL_TEST', 'RENDER', 'RENDER_EXTERNAL_URL', 'SIN_BASE', 'CORREO_MODO']) {
    delete env[quitar]
  }
  for (const clave of Object.keys(env)) if (clave.startsWith('SMTP_')) delete env[clave]
  return { ...env, ...extra }
}

async function prepararEsquema(url) {
  await conBase(url, async (c) => {
    await c.query(`DROP SCHEMA IF EXISTS ${ESQUEMA} CASCADE`)
    await c.query(`CREATE SCHEMA ${ESQUEMA}`)
    // umzug ve la de public y no crearía la del esquema.
    await c.query(`CREATE TABLE ${ESQUEMA}."SequelizeMeta" (name varchar(255) NOT NULL PRIMARY KEY)`)
  })
  const r = await correr(['server/db/migrar.js', 'up'], entornoBase({ DATABASE_URL: urlAislada(url), DB_SSL: '0' }))
  if (r.codigo !== 0) throw new Error(`Las migraciones fallaron: ${r.error.slice(0, 400)}`)
}

const borrarEsquema = (url) => conBase(url, (c) => c.query(`DROP SCHEMA IF EXISTS ${ESQUEMA} CASCADE`))

/** crear-admin: devuelve la temporal, que queda solo en memoria. */
async function crearAdmin(url, email, nombre) {
  const r = await correr(
    ['server/scripts/admin.js', 'crear', '--email', email, '--nombre', nombre],
    entornoBase({ DATABASE_URL: urlAislada(url), DB_SSL: '0' }),
  )
  const temporal = r.salida
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => /^[a-z0-9]{4}(-[a-z0-9]{4}){3}$/.test(l))
  if (r.codigo !== 0 || !temporal) throw new Error(`crear-admin falló (código ${r.codigo}).`)
  return temporal
}

async function levantarServidor(url, smtp) {
  mkdirSync(DIR_TRABAJO, { recursive: true })
  const registro = join(DIR_TRABAJO, 'servidor.log')
  writeFileSync(registro, '')
  const env = entornoBase({
    NODE_ENV: 'production',
    PORT: String(PUERTO),
    URL_PUBLICA: `${BASE}/`,
    DATABASE_URL: urlAislada(url),
    DB_SSL: '0',
    DIR_BUILD,
    CORREO_MODO: 'smtp',
    SMTP_HOST: '127.0.0.1',
    SMTP_PUERTO: String(smtp.puerto),
    SMTP_USUARIO: 'web@example.com',
    SMTP_CLAVE: randomBytes(12).toString('hex'),
  })
  const servidor = spawn(process.execPath, ['server/servidor.js'], { cwd: REPO, env, stdio: ['ignore', 'pipe', 'pipe'] })
  const { createWriteStream } = await import('node:fs')
  const archivo = createWriteStream(registro)
  servidor.stdout.pipe(archivo)
  servidor.stderr.pipe(archivo)
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(`${BASE}/salud`)).ok) return servidor
    } catch {}
    if (servidor.exitCode !== null) break
    await sleep(150)
  }
  servidor.kill()
  throw new Error(`El servidor no arrancó en ${BASE}: mirá ${relative(REPO, registro)}`)
}

async function apagarServidor(servidor) {
  if (!servidor || servidor.exitCode !== null) return
  servidor.kill('SIGTERM')
  for (let i = 0; i < 50 && servidor.exitCode === null; i++) await sleep(100)
  if (servidor.exitCode === null) servidor.kill('SIGKILL')
}

/** La API del panel desde acá, con su cookie (como el navegador: mismo origen). */
function clienteApi() {
  let cookie = ''
  async function pedir(metodo, ruta, cuerpo, { multipart = null } = {}) {
    const cabeceras = { Accept: 'application/json', Origin: BASE, 'Sec-Fetch-Site': 'same-origin' }
    if (cookie) cabeceras.Cookie = cookie
    let body
    if (multipart) body = multipart
    else if (metodo !== 'GET' && metodo !== 'DELETE') {
      cabeceras['Content-Type'] = 'application/json'
      body = JSON.stringify(cuerpo ?? {})
    }
    const r = await fetch(`${PANEL}/api${ruta}`, { method: metodo, headers: cabeceras, body })
    const nueva = r.headers.getSetCookie().find((x) => x.startsWith('mupa_sesion='))
    if (nueva) cookie = nueva.split(';')[0]
    const datos = await r.json().catch(() => null)
    if (!r.ok) throw new Error(`${metodo} ${ruta}: ${r.status} ${JSON.stringify(datos)?.slice(0, 300)}`)
    return datos?.data ?? datos
  }
  return {
    get: (ruta) => pedir('GET', ruta),
    post: (ruta, cuerpo) => pedir('POST', ruta, cuerpo),
    put: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
    patch: (ruta, cuerpo) => pedir('PATCH', ruta, cuerpo),
    subir: (formulario) => pedir('POST', '/fotos', null, { multipart: formulario }),
  }
}

// =====================================================================================================================
// El contenido de ejemplo (todo "EJEMPLO ·": no son datos del museo)
// =====================================================================================================================

const EJEMPLO = 'EJEMPLO · '

// Las fotos: las del sitio (src/assets), pasadas a JPG como las de una cámara, con la descripción de lo que se ve.
const FOTOS = {
  pincel: { de: 'carrusel-pincel-1400.webp', archivo: 'pincel-sobre-fosil.jpg', alt: 'Mano que limpia con un pincel un fósil apoyado sobre la mesa de trabajo.' },
  restaurador: { de: 'carrusel-restaurador-1400.webp', archivo: 'restaurador-esqueleto.jpg', alt: 'Restaurador con guantes trabajando entre los huesos de un esqueleto armado.' },
  dremel: { de: 'carrusel-dremel-1400.webp', archivo: 'garra-en-el-taller.jpg', alt: 'Manos que pulen con una herramienta rotativa la réplica de una garra.' },
  craneo: { de: 'eje-narrativo-1400.webp', archivo: 'esqueleto-carnivoro.jpg', alt: 'Esqueleto de un dinosaurio carnívoro con la boca abierta, en el hall del museo.' },
  fachada: { de: 'eje-vision-1400.webp', archivo: 'fachada-cartel.jpg', alt: 'Fachada curva del museo con el cartel «Museo Paleontológico» bajo el cielo azul.' },
  montaje: { de: 'obra-montaje-sala-1000.webp', archivo: 'montaje-de-sala.jpg', alt: 'Técnicos trabajando en el montaje de una sala, debajo del esqueleto de un dinosaurio.' },
  chicos: { de: 'area-educacion-1140.webp', archivo: 'visita-escolar.jpg', alt: 'Chicos con guardapolvo blanco miran desde una baranda de vidrio.' },
  taller: { de: 'area-formalab-1140.webp', archivo: 'taller-fresadora.jpg', alt: 'Dos personas trabajan junto a una máquina grande que talla un bloque blanco.' },
  patio: { de: 'carrusel-patio-1400.webp', archivo: 'patio-del-museo.jpg', alt: 'Patio del museo con el edificio circular vidriado al fondo.' },
}

async function prepararFotos() {
  const sharp = (await import('sharp')).default
  const dir = join(DIR_TRABAJO, 'fotos')
  mkdirSync(dir, { recursive: true })
  for (const foto of Object.values(FOTOS)) {
    foto.ruta = join(dir, foto.archivo)
    if (!existsSync(foto.ruta)) await sharp(join(REPO, 'src', 'assets', foto.de)).jpeg({ quality: 88 }).toFile(foto.ruta)
  }
}

/** Sube una foto por la API y devuelve su id. */
async function subirFoto(api, foto, { credito = null } = {}) {
  const formulario = new FormData()
  formulario.append('foto', new Blob([readFileSync(foto.ruta)], { type: 'image/jpeg' }), foto.archivo)
  formulario.append('alt', foto.alt)
  formulario.append('decorativa', 'false')
  if (credito) formulario.append('credito', credito)
  return (await api.subir(formulario)).id
}

const parrafos = (...textos) => ({
  type: 'doc',
  content: textos.map((t) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] })),
})

/** Un día "AAAA-MM-DD" a n días de hoy (en San Juan). */
function dia(n, hoy) {
  const f = new Date(`${hoy}T12:00:00Z`)
  f.setUTCDate(f.getUTCDate() + n)
  return f.toISOString().slice(0, 10)
}

/** Crea un contenido (novedad, muestra o sala), lo completa y, si corresponde, lo publica. */
async function crearContenido(api, tipo, alta, datos, { publicar = true } = {}) {
  const creado = await api.post(`/${tipo}`, alta)
  const ficha = await api.put(`/${tipo}/${creado.id}`, { slug: null, ...datos })
  if (datos.fotos) await api.put(`/${tipo}/${creado.id}/galeria`, { fotos: datos.fotos, antes: [] })
  if (publicar) await api.post(`/${tipo}/${creado.id}/publicar`)
  return ficha
}

async function cargarEjemplos(api) {
  const { hoyEnSanJuan } = await import(pathToFileURL(join(REPO, 'compartido', 'fechas.js')).href)
  const hoy = hoyEnSanJuan()

  // Datos del museo (con el correo de destino: así el formulario de contacto está en el sitio).
  await api.put('/museo', {
    direccion: `${EJEMPLO}Avenida de ejemplo 1234 (Oeste)`,
    localidad: `${EJEMPLO}Ciudad de San Juan`,
    provincia: 'San Juan',
    codigoPostal: '5400',
    telefono: '+54 264 000-0000',
    emailPublico: 'museo@example.com',
    emailDestinoContacto: 'destino@example.com',
    redes: [
      { red: 'instagram', url: 'https://example.com/instagram' },
      { red: 'facebook', url: 'https://example.com/facebook' },
    ],
    mapaEmbedUrl: 'https://www.google.com/maps/embed?pb=EJEMPLO',
    mapaUrl: 'https://example.com/mapa',
    comoLlegar: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `${EJEMPLO}En colectivo` }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: `${EJEMPLO}Texto de prueba: ` },
            { type: 'text', text: 'no son los recorridos del museo', marks: [{ type: 'bold' }] },
            { type: 'text', text: '. Con un enlace a un ' },
            { type: 'text', text: 'mapa de ejemplo', marks: [{ type: 'link', attrs: { href: 'https://example.com/mapa' } }] },
            { type: 'text', text: '.' },
          ],
        },
      ],
    },
    normas: {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [`${EJEMPLO}Norma de prueba uno`, `${EJEMPLO}Norma de prueba dos`].map((text) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
          })),
        },
      ],
    },
    notaHorarios: `${EJEMPLO}Horarios de prueba: no son los del museo.`,
    notaTarifas: `${EJEMPLO}Precios de prueba: no son los del museo.`,
    avisoTexto: `${EJEMPLO}El lunes feriado el museo permanece cerrado.`,
    avisoHasta: dia(10, hoy),
    compraActiva: true,
    compraUrl: 'https://example.com/entradas',
    compraTexto: 'Comprar entradas',
  })

  const manianaYTarde = [
    { abre: '09:00', cierra: '13:00' },
    { abre: '16:00', cierra: '20:00' },
  ]
  await api.put('/horarios', {
    dias: [
      { dia: 1, abierto: false, franjas: [], nota: null },
      { dia: 2, abierto: true, franjas: manianaYTarde, nota: null },
      { dia: 3, abierto: true, franjas: manianaYTarde, nota: null },
      { dia: 4, abierto: true, franjas: manianaYTarde, nota: null },
      { dia: 5, abierto: true, franjas: manianaYTarde, nota: null },
      { dia: 6, abierto: true, franjas: [{ abre: '10:00', cierra: '19:00' }], nota: null },
      { dia: 7, abierto: true, franjas: [{ abre: '10:00', cierra: '19:00' }], nota: `${EJEMPLO}Visitas guiadas a las 11` },
    ],
  })
  for (const t of [
    { nombre: `${EJEMPLO}General`, gratuita: false, precio: 3000, condicion: null, visible: true },
    { nombre: `${EJEMPLO}Estudiantes y jubilados`, gratuita: false, precio: 1500, condicion: `${EJEMPLO}Con credencial`, visible: true },
    { nombre: `${EJEMPLO}Menores de 6 años`, gratuita: true, precio: null, condicion: null, visible: true },
    { nombre: `${EJEMPLO}Tarifa de temporada`, gratuita: false, precio: 2500, condicion: null, visible: false },
  ]) {
    await api.post('/tarifas', t)
  }

  // Fotos y contenidos.
  const id = {}
  for (const [clave, foto] of Object.entries(FOTOS)) id[clave] = await subirFoto(api, foto, { credito: `${EJEMPLO}Archivo del museo` })

  const salaA = await crearContenido(api, 'salas', { nombre: `${EJEMPLO}Sala de los grandes esqueletos` }, {
    nombre: `${EJEMPLO}Sala de los grandes esqueletos`,
    resumen: `${EJEMPLO}Resumen de prueba de una sala.`,
    descripcion: parrafos(`${EJEMPLO}Texto de prueba: acá va la descripción de la sala.`),
    portadaId: id.craneo,
  })
  await crearContenido(api, 'salas', { nombre: `${EJEMPLO}Sala del taller` }, {
    nombre: `${EJEMPLO}Sala del taller`,
    resumen: `${EJEMPLO}Resumen de prueba de otra sala.`,
    descripcion: null,
    portadaId: id.taller,
  })
  await crearContenido(api, 'muestras', { tipo: 'temporal', titulo: `${EJEMPLO}Muestra temporal` }, {
    tipo: 'temporal',
    titulo: `${EJEMPLO}Muestra temporal`,
    resumen: `${EJEMPLO}Resumen de prueba de una muestra que se puede ver ahora.`,
    descripcion: parrafos(`${EJEMPLO}Texto de prueba: acá va la descripción de la muestra.`),
    portadaId: id.montaje,
    fechaInicio: dia(-20, hoy),
    fechaFin: dia(70, hoy),
    salaId: salaA.id,
  })
  await crearContenido(api, 'muestras', { tipo: 'temporal', titulo: `${EJEMPLO}Muestra que todavía no empezó` }, {
    tipo: 'temporal',
    titulo: `${EJEMPLO}Muestra que todavía no empezó`,
    resumen: `${EJEMPLO}Resumen de prueba de una muestra próxima.`,
    descripcion: parrafos(`${EJEMPLO}Texto de prueba.`),
    portadaId: id.dremel,
    fechaInicio: dia(25, hoy),
    fechaFin: null,
    salaId: null,
  })
  await crearContenido(api, 'muestras', { tipo: 'permanente', titulo: `${EJEMPLO}Muestra permanente` }, {
    tipo: 'permanente',
    titulo: `${EJEMPLO}Muestra permanente`,
    resumen: `${EJEMPLO}Resumen de prueba de la muestra de siempre.`,
    descripcion: parrafos(`${EJEMPLO}Texto de prueba.`),
    portadaId: id.fachada,
    fechaInicio: null,
    fechaFin: null,
    salaId: salaA.id,
  })

  const novedad = (tipo, titulo, resumen, portadaId, extra = {}) => ({
    tipo,
    titulo,
    resumen,
    cuerpo: parrafos(`${EJEMPLO}Texto de prueba de la novedad.`),
    portadaId,
    eventoInicio: null,
    eventoFin: null,
    lugar: null,
    costo: null,
    enlaceInscripcion: null,
    ...extra,
  })
  const charla = `${EJEMPLO}Charla sobre restauración de fósiles`
  await crearContenido(api, 'novedades', { tipo: 'actividad', titulo: charla }, novedad('actividad', charla, `${EJEMPLO}Una actividad que ya pasó.`, id.restaurador, {
    eventoInicio: `${dia(-9, hoy)}T18:30`,
    lugar: null,
    costo: 'Gratis',
  }))
  const visita = `${EJEMPLO}El museo recibió una visita escolar`
  await crearContenido(api, 'novedades', { tipo: 'noticia', titulo: visita }, novedad('noticia', visita, `${EJEMPLO}Una noticia de prueba.`, id.chicos, { fotos: [id.patio] }))
  const taller = `${EJEMPLO}Taller de paleontología para chicos`
  await crearContenido(api, 'novedades', { tipo: 'actividad', titulo: taller }, novedad('actividad', taller, `${EJEMPLO}Una actividad que va a pasar.`, id.taller, {
    eventoInicio: `${dia(12, hoy)}T10:00`,
    eventoFin: `${dia(12, hoy)}T12:00`,
    lugar: `${EJEMPLO}Sala del taller`,
    costo: `${EJEMPLO}Con la entrada al museo`,
    enlaceInscripcion: 'https://example.com/inscripcion',
  }))
  // Sin resumen, portada ni texto: es la de la captura de lo que falta para publicar (ficha-faltan).
  const borrador = `${EJEMPLO}Noticia que todavía es un borrador`
  await crearContenido(api, 'novedades', { tipo: 'noticia', titulo: borrador }, novedad('noticia', borrador, null, null, { cuerpo: null }), { publicar: false })
}

/** Un mensaje por el formulario de contacto del sitio (POST /contacto, sin JavaScript). */
async function mandarMensaje(nombre, email, mensaje) {
  const cuerpo = new URLSearchParams({ nombre, email, mensaje, sitio_web: '' })
  const r = await fetch(`${BASE}/contacto`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: BASE },
    body: cuerpo,
  })
  if (r.status !== 303) throw new Error(`El formulario de contacto respondió ${r.status}`)
}

// =====================================================================================================================
// El recorrido: cada captura del manual
// =====================================================================================================================

const ANA = { email: 'ana.ejemplo@example.com', nombre: 'Ana Ejemplo' }
const BRUNO = { email: 'bruno.ejemplo@example.com', nombre: 'Bruno Ejemplo' }
const CARLA = { email: 'carla.ejemplo@example.com', nombre: 'Carla Ejemplo' }
// Lo que ocupa el contenido del panel a 1440 (max-w-panel, 72 rem, centrado): para recortar las capturas a lo útil.
const MAIN = '#contenido'

/** Una contraseña al azar para la cuenta de ejemplo (solo en memoria). */
const claveAlAzar = () => `una frase de ejemplo ${randomBytes(6).toString('hex')} para el manual`

async function recorrido({ url, smtp }) {
  const temporalAna = await crearAdmin(url, ANA.email, ANA.nombre)
  const claveAna = claveAlAzar()
  await prepararFotos()

  const c = await abrirChrome({ ancho: 1440, alto: 900 })
  try {
    // --- Entrar por primera vez ---
    log('Entrar por primera vez')
    await tamano(c, 900, 760)
    await c.send('Page.navigate', { url: `${PANEL}/` })
    await c.esperar(`location.pathname.endsWith('/ingresar') && !!document.querySelector('#email')`)
    await esperarPantalla(c, 'Ingresar')
    await poner(c, '#email', ANA.email)
    await poner(c, '#clave', temporalAna)
    await capturar(c, 'ingresar', { de: ['header', MAIN], x: [0, 900], margen: 8, resaltar: ['button[type=submit]'] })
    await c.evaluar(`__m.el('button[type=submit]').click() || true`)
    await esperarPantalla(c, 'Cambiar la contraseña')
    await poner(c, '#actual', temporalAna)
    await poner(c, '#nueva', claveAna)
    await capturar(c, 'cambiar-clave', { de: ['header', MAIN], x: [0, 900], margen: 8, resaltar: ['button[type=submit]'] })
    await c.evaluar(`__m.el('button[type=submit]').click() || true`)
    await esperarPantalla(c, 'Inicio')
    await tamano(c, 1440, 900)
    await capturar(c, 'inicio-primera-vez', { de: ['header', MAIN], x: [0, 1440], altoMax: 1500 })
    await capturar(c, 'barra', { de: ['header'], margen: 0, x: [128, 1312] })

    // --- El contenido de ejemplo, por la API ---
    log('Contenido de ejemplo')
    const api = clienteApi()
    await api.post('/sesion', { email: ANA.email, clave: claveAna })
    await cargarEjemplos(api)
    await mandarMensaje(`${EJEMPLO}Persona de prueba uno`, 'visitante.uno@example.com', `${EJEMPLO}Mensaje de prueba: no lo escribió nadie.\nQuería saber si se pueden hacer visitas guiadas para un grupo.`)
    await mandarMensaje(`${EJEMPLO}Persona de prueba dos`, 'visitante.dos@example.com', `${EJEMPLO}Otro mensaje de prueba, que salió por correo.`)

    // --- Datos del museo ---
    log('Datos del museo')
    await ir(c, '/museo', 'Datos del museo')
    await capturar(c, 'museo-ubicacion', { de: [`${MAIN} h1`, `${MAIN} form > fieldset:nth-of-type(2)`], x: [128, 960] })
    await capturar(c, 'museo-redes-mapa', { de: [`${MAIN} form > fieldset:nth-of-type(3)`, `${MAIN} form > fieldset:nth-of-type(4)`], x: [128, 960] })
    // La pregunta por los cambios sin guardar: se cambia el teléfono y se quiere ir a otra pantalla.
    await poner(c, '#telefono', '+54 264 000-0001')
    await clic(c, 'Inicio', 'nav')
    await c.esperar(`!!__m.dialogoAbierto()`)
    await sleep(200)
    await capturar(c, 'cambios-sin-guardar', { vista: true, de: ['dialog[open]'], margen: 12 })
    await clic(c, 'Seguir editando', 'dialog[open]')
    await poner(c, '#telefono', '+54 264 000-0000')

    // --- Visitas ---
    log('Visitas')
    await ir(c, '/visitas', 'Visitas')
    await capturar(c, 'visitas-horario', { de: ['#visitas-horario'], desde: `${MAIN} h1`, hasta: '[id="h-dias.1.nota"]', margen: 32, x: [128, 960] })
    await capturar(c, 'visitas-tarifas', { de: ['#visitas-tarifas', '#t-agregar'], desde: '#visitas-tarifas', x: [128, 960] })
    await clic(c, 'Agregar una tarifa')
    await c.esperar(`!!document.querySelector('dialog[open] #t-nombre')`)
    await poner(c, '#t-nombre', `${EJEMPLO}Grupos escolares`)
    await c.evaluar(`__m.el('#t-gratuita').click() || true`)
    await poner(c, '#t-condicion', `${EJEMPLO}Con reserva previa`)
    await sleep(200)
    await capturar(c, 'visitas-tarifa-nueva', { vista: true, de: ['dialog[open]'], margen: 12, resaltar: ['texto:Guardar la tarifa'] })
    await clic(c, 'Guardar la tarifa', 'dialog[open]')
    await c.esperar(`!__m.dialogoAbierto() && document.body.innerText.includes('Grupos escolares')`)
    await capturar(c, 'visitas-textos', { de: ['#visitas-textos'], hasta: '#tx-comoLlegar', x: [128, 960], margen: 24 })
    await capturar(c, 'visitas-aviso', { de: ['section[aria-labelledby="visitas-aviso"]'], x: [128, 960] })
    await capturar(c, 'visitas-compra', { de: ['section[aria-labelledby="visitas-compra"]'], x: [128, 960] })

    // --- Novedades: la lista y una noticia de punta a punta ---
    log('Novedades')
    await ir(c, '/novedades', 'Novedades')
    await capturar(c, 'novedades-lista', { de: [MAIN], x: [128, 1312], altoMax: 900 })
    await clic(c, `${EJEMPLO}Noticia que todavía`, MAIN)
    await esperarPantalla(c, 'Novedad:')
    await clic(c, 'Publicar', 'form')
    await c.esperar(`document.body.innerText.includes('falta completar')`)
    await sleep(200)
    await capturar(c, 'ficha-faltan', { de: [`${MAIN} form > div:first-child`], x: [128, 960] })
    await ir(c, '/novedades', 'Novedades')
    await clic(c, 'Nueva novedad')
    await esperarPantalla(c, 'Nueva novedad')
    await poner(c, '#titulo', `${EJEMPLO}Una pieza nueva en el taller`)
    await capturar(c, 'novedad-nueva', { de: [MAIN], x: [128, 960], resaltar: ['button[type=submit]'] })
    await c.evaluar(`__m.el('button[type=submit]').click() || true`)
    await esperarPantalla(c, 'Novedad:')
    // Lo de arriba de la ficha: el título, la última edición, el estado y el aviso de que se creó (los campos de abajo
    // ya se ven en la captura anterior).
    await capturar(c, 'ficha-borrador', { de: [`${MAIN} > p:first-child`], hasta: `${MAIN} > div[aria-hidden="true"]`, x: [128, 960] })
    await poner(c, '#resumen', `${EJEMPLO}Una pieza nueva llegó al taller y el equipo empezó a limpiarla.`)
    // La portada: elegir, describir y subir.
    await elegirArchivos(c, '#portadaId-subir-archivo', [FOTOS.pincel.ruta])
    await c.esperar(`!!document.querySelector('[id^="portadaId-subir-"][id$="-alt"]')`)
    await poner(c, '[id^="portadaId-subir-"][id$="-alt"]', FOTOS.pincel.alt)
    // Sin «Foto:»: el sitio se lo agrega adelante (src/content.js, paginas.credito).
    await poner(c, '[id^="portadaId-subir-"][id$="-credito"]', `${EJEMPLO}Archivo del museo`)
    await c.esperar(`[...document.querySelectorAll('#portadaId img')].every((i) => i.complete)`)
    await capturar(c, 'portada-elegir', { fotos: true, de: ['#portadaId'], x: [128, 960], resaltar: ['[id^="portadaId-subir-"][id$="-alt"]', '#portadaId-subir-subir'] })
    await c.evaluar(`__m.el('#portadaId-subir-subir').click() || true`)
    await c.esperar(`!!document.querySelector('#portadaId-reemplazar')`, { tiempo: 60_000, que: 'la portada subida' })
    await c.esperar(`[...document.querySelectorAll('#portadaId img')].every((i) => i.complete && i.naturalWidth > 0)`)
    await capturar(c, 'portada-subida', { fotos: true, de: ['#portadaId'], x: [128, 960] })
    // El texto, con el editor: un párrafo con negrita, un subtítulo y una lista.
    await c.evaluar(`__m.el('#cuerpo').focus() || true`)
    await tipear(c, `${EJEMPLO}Esta semana llegó al taller una pieza nueva. `)
    await clic(c, 'Negrita', '[role=toolbar]')
    await tipear(c, 'El equipo de restauración ya empezó a trabajar')
    await clic(c, 'Negrita', '[role=toolbar]')
    await tipear(c, ' y va a contar cómo sigue.')
    await tecla(c, 'Enter', 13)
    await clic(c, 'Subtítulo', '[role=toolbar]')
    await tipear(c, 'Qué se hace primero')
    await tecla(c, 'Enter', 13)
    await clic(c, 'Lista', '[role=toolbar]')
    await tipear(c, 'Se limpia con pinceles y herramientas finas.')
    await tecla(c, 'Enter', 13)
    await tipear(c, 'Se consolida para que no se rompa.')
    await sleep(300)
    await capturar(c, 'editor', { de: ['#cuerpo-etiqueta', '#cuerpo'], x: [128, 960], resaltar: ['[role=toolbar]'] })
    // La galería: dos fotos.
    await elegirArchivos(c, '#fotos-subir-archivo', [FOTOS.restaurador.ruta, FOTOS.dremel.ruta])
    await c.esperar(`document.querySelectorAll('[id^="fotos-subir-"][id$="-alt"]').length === 2`)
    const alts = [FOTOS.restaurador.alt, FOTOS.dremel.alt]
    for (let i = 0; i < 2; i++) {
      await c.evaluar(`__m.poner(document.querySelectorAll('[id^="fotos-subir-"][id$="-alt"]')[${i}], ${JSON.stringify(alts[i])}) || true`)
    }
    await c.esperar(`[...document.querySelectorAll('#fotos img')].every((i) => i.complete)`)
    // Las dos fotos elegidas no entran en una página: la captura va desde la segunda (con su descripción) hasta el
    // botón «Subir las 2 fotos».
    await capturar(c, 'galeria-elegir', { fotos: true, de: ['#fotos'], desde: '#fotos ol > li:nth-of-type(2)', hasta: '#fotos-subir-subir', x: [128, 960], resaltar: ['#fotos-subir-subir'] })
    await c.evaluar(`__m.el('#fotos-subir-subir').click() || true`)
    await c.esperar(`!document.querySelector('[id^="fotos-subir-"][id$="-alt"]') && document.querySelectorAll('#fotos li img').length === 2`, { tiempo: 90_000, que: 'las fotos de la galería subidas' })
    await c.esperar(`[...document.querySelectorAll('#fotos img')].every((i) => i.complete && i.naturalWidth > 0)`)
    await capturar(c, 'galeria', { fotos: true, de: ['#fotos'], x: [128, 960] })
    // Guardar y publicar.
    await c.evaluar(`__m.el('form button[type=submit]').click() || true`)
    await c.esperar(`document.body.innerText.includes('Guardado.')`, { que: 'Guardado.' })
    await clic(c, 'Publicar', 'form')
    await c.esperar(`!!document.querySelector('#ficha-despublicar') && document.body.innerText.includes('ya está en el sitio')`, { que: 'publicada' })
    await sleep(300)
    await capturar(c, 'ficha-publicada', { de: ['form > div.border-t-2', `${MAIN} > section`], x: [128, 960], resaltar: ['#ficha-despublicar', 'texto:Ver en el sitio'] })
    await clic(c, 'Despublicar', 'form')
    await c.esperar(`!!__m.dialogoAbierto()`)
    await sleep(200)
    await capturar(c, 'despublicar', { vista: true, de: ['dialog[open]'], margen: 12 })
    await clic(c, 'Cancelar', 'dialog[open]')
    await c.esperar(`!__m.dialogoAbierto()`)
    await clic(c, 'Eliminar la novedad', `${MAIN} > section`)
    await c.esperar(`!!__m.dialogoAbierto()`)
    await sleep(200)
    await capturar(c, 'eliminar', { vista: true, de: ['dialog[open]'], margen: 12 })
    await clic(c, 'Cancelar', 'dialog[open]')

    // Una actividad: su grupo de datos.
    await ir(c, '/novedades?tipo=actividad', 'Novedades')
    await clic(c, `${EJEMPLO}Taller de paleontología`, MAIN)
    await esperarPantalla(c, 'Novedad:')
    await capturar(c, 'actividad', { de: ['fieldset:has(#eventoInicio)'], x: [128, 960] })

    // --- Exposiciones ---
    log('Exposiciones')
    await ir(c, '/exposiciones', 'Exposiciones')
    await capturar(c, 'exposiciones-muestras', { de: [MAIN], x: [128, 1312] })
    await clic(c, 'Salas', '[role=tablist]')
    await c.esperar(`location.search.includes('pestana=salas')`)
    await sleep(200)
    await capturar(c, 'exposiciones-salas', { de: [MAIN], x: [128, 1312] })
    await clic(c, 'Muestras', '[role=tablist]')
    await sleep(200)
    await clic(c, `${EJEMPLO}Muestra temporal`, MAIN)
    await esperarPantalla(c, 'Muestra:')
    await capturar(c, 'muestra-fechas', { de: ['#tipo', '#fechaInicio', '#salaId'], x: [128, 960] })

    // --- Mensajes y el aviso del correo en el Inicio ---
    log('Mensajes')
    smtp.modo = 'rechaza'
    await mandarMensaje(`${EJEMPLO}Persona de prueba tres`, 'visitante.tres@example.com', `${EJEMPLO}Un mensaje de prueba que no se pudo mandar por correo: quedó guardado acá.`)
    await ir(c, '/', 'Inicio')
    await capturar(c, 'inicio-correo', { de: [`${MAIN} .grid > [role=alert], ${MAIN} .grid > div`], x: [128, 1312], altoMax: 600 })
    smtp.modo = 'acepta'
    await mandarMensaje(`${EJEMPLO}Persona de prueba cuatro`, 'visitante.cuatro@example.com', `${EJEMPLO}El último mensaje de prueba. Volvió a salir por correo.`)
    await ir(c, '/mensajes', 'Mensajes')
    await capturar(c, 'mensajes', { de: [MAIN], x: [128, 1312], altoMax: 1100 })

    // --- Usuarios ---
    log('Usuarios')
    await ir(c, '/usuarios', 'Usuarios')
    await poner(c, '#alta-nombre', BRUNO.nombre)
    await poner(c, '#alta-email', BRUNO.email)
    await capturar(c, 'usuarios-alta', { de: ['section[aria-labelledby="usuarios-alta"] h2', 'section[aria-labelledby="usuarios-alta"] button[type=submit]'], x: [128, 960], resaltar: ['section[aria-labelledby="usuarios-alta"] button[type=submit]'] })
    await c.evaluar(`__m.el('form button[type=submit]').click() || true`)
    await c.esperar(`!!document.querySelector('dialog[open] .font-mono')`, { que: 'el diálogo de la temporal' })
    // La temporal se tapa antes de capturar (y se comprueba que no quede en ningún lado de la página).
    await c.evaluar(`(() => {
      const p = document.querySelector('dialog[open] .font-mono')
      p.textContent = '••••-••••-••••-••••'
      const marca = document.createElement('span')
      marca.textContent = ' (tapada en el manual)'
      Object.assign(marca.style, { fontFamily: 'system-ui', fontSize: '0.85rem', letterSpacing: 'normal', color: '#4b5563' })
      p.appendChild(marca)
      return true
    })()`)
    const quedo = await c.evaluar(`document.documentElement.outerHTML`)
    if (/[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/.test(quedo)) throw new Error('La temporal sigue en la página: no se captura.')
    await sleep(200)
    await capturar(c, 'usuarios-temporal', { vista: true, de: ['dialog[open]'], margen: 12 })
    await clic(c, 'Listo, ya la anoté', 'dialog[open]')
    await c.esperar(`!__m.dialogoAbierto()`)
    // Una segunda administradora (por la API: su temporal no se usa).
    await api.post('/usuarios', { nombre: CARLA.nombre, email: CARLA.email, rol: 'admin' })
    await ir(c, '/usuarios', 'Usuarios')
    await capturar(c, 'usuarios-cuentas', { de: ['#usuarios-cuentas', `${MAIN} section:first-of-type ul`], desde: `${MAIN} h1`, x: [128, 1312] })
    await clic(c, 'Dar contraseña temporal', `${MAIN} section:first-of-type ul`)
    await c.esperar(`!!__m.dialogoAbierto()`)
    await sleep(200)
    await capturar(c, 'usuarios-dar-temporal', { vista: true, de: ['dialog[open]'], margen: 12 })
    await clic(c, 'Cancelar', 'dialog[open]')

    // --- Mi cuenta y el reingreso ---
    log('Mi cuenta')
    await ir(c, '/cuenta', 'Mi cuenta')
    await capturar(c, 'cuenta', { de: [`${MAIN} h1`, 'section[aria-labelledby="cuenta-titulo-cerrar"]'], x: [128, 960] })
    // La sesión termina (como a las dos horas sin usar el panel) y la persona guarda algo: el panel pide volver a entrar.
    await conBase(urlAislada(url), (b) => b.query('DELETE FROM sesiones'))
    await c.evaluar(`__m.el('#cuenta-nombre').closest('form').querySelector('button[type=submit]').click() || true`)
    await c.esperar(`!!document.querySelector('dialog[open] #reingreso-email')`, { que: 'el diálogo de reingreso' })
    await poner(c, '#reingreso-email', ANA.email)
    await poner(c, '#reingreso-clave', claveAna)
    await sleep(200)
    await capturar(c, 'reingreso', { vista: true, de: ['dialog[open]'], margen: 12 })
    await c.evaluar(`__m.el('dialog[open] button[type=submit]').click() || true`)
    await c.esperar(`!__m.dialogoAbierto() && document.body.innerText.includes('Guardado: así te ven')`, { que: 'el nombre guardado después del reingreso' })
  } catch (err) {
    try {
      const r = await c.send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(join(DIR_TRABAJO, 'error.png'), Buffer.from(r.data, 'base64'))
      log(`  (captura del error en ${relative(REPO, join(DIR_TRABAJO, 'error.png'))})`)
    } catch {}
    throw err
  } finally {
    if (c.problemas.length) log('  la consola dijo:', c.problemas.slice(0, 5))
    await c.cerrar()
  }

  // --- En el celular ---
  log('En el celular')
  const m = await abrirChrome({ ancho: 390, alto: 844, movil: true })
  try {
    await m.send('Page.navigate', { url: `${PANEL}/ingresar` })
    await m.esperar(`!!document.querySelector('#email')`)
    await esperarPantalla(m, 'Ingresar')
    await poner(m, '#email', ANA.email)
    await poner(m, '#clave', claveAna)
    await m.evaluar(`__m.el('button[type=submit]').click() || true`)
    await esperarPantalla(m, 'Inicio')
    await capturar(m, 'celular-inicio', {})
    await ir(m, '/novedades', 'Novedades')
    await m.evaluar(`(() => {
      const cuenta = [...document.querySelectorAll('#contenido p')].find((p) => /^\\d+ novedad/.test(p.textContent.trim()))
      window.scrollTo({ top: cuenta.getBoundingClientRect().top + scrollY - 16, behavior: 'instant' })
      return true
    })()`)
    await sleep(200)
    await capturar(m, 'celular-novedades', { vista: true })
    await clic(m, `${EJEMPLO}Noticia que todavía`, MAIN)
    await esperarPantalla(m, 'Novedad:')
    await elegirArchivos(m, '#portadaId-subir-archivo', [FOTOS.patio.ruta])
    await m.esperar(`!!document.querySelector('[id^="portadaId-subir-"][id$="-alt"]')`)
    await poner(m, '[id^="portadaId-subir-"][id$="-alt"]', FOTOS.patio.alt)
    await m.esperar(`[...document.querySelectorAll('#portadaId img')].every((i) => i.complete)`)
    await m.evaluar(`(() => { const r = document.querySelector('#portadaId').getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY - 12, behavior: 'instant' }); return true })()`)
    await sleep(200)
    await capturar(m, 'celular-foto', { vista: true, fotos: true })
  } finally {
    if (m.problemas.length) log('  la consola dijo:', m.problemas.slice(0, 5))
    await m.cerrar()
  }
}

async function capturas() {
  const url = urlDeLaBase()
  for (const archivo of ['client/index.html', 'server/entry-server.js', 'panel/index.html']) {
    if (!existsSync(join(DIR_BUILD, archivo))) throw new Error(`Falta ${archivo} en ${DIR_BUILD}: corré npm run build.`)
  }
  mkdirSync(DIR_IMG, { recursive: true })
  mkdirSync(DIR_TRABAJO, { recursive: true })
  const { smtpFalso } = await import(pathToFileURL(join(REPO, 'server', 'pruebas', 'smtpFalso.js')).href)
  log(`Esquema aislado ${ESQUEMA} y servidor en ${BASE}`)
  await prepararEsquema(url)
  const smtp = await smtpFalso()
  let servidor = null
  try {
    servidor = await levantarServidor(url, smtp)
    await recorrido({ url, smtp })
    log(`Mails que llegaron al SMTP falso (no salieron de la máquina): ${smtp.mensajes.length}`)
    if (CONSERVAR) {
      log(`--conservar: el servidor sigue en ${PANEL}/ (Ctrl+C para terminar; después borrá el esquema ${ESQUEMA}).`)
      await new Promise(() => {})
    }
  } finally {
    await apagarServidor(servidor)
    await smtp.cerrar?.()
    if (!CONSERVAR) await borrarEsquema(url)
  }
}

// =====================================================================================================================
// El PDF
// =====================================================================================================================

/** El texto de cada página del PDF, normalizado (espacios simples). */
async function textoPorPagina(pdf) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await getDocument({ data: new Uint8Array(pdf), verbosity: 0 }).promise
  const paginas = []
  for (let i = 1; i <= doc.numPages; i++) {
    const contenido = await (await doc.getPage(i)).getTextContent()
    paginas.push(normalizar(contenido.items.map((it) => it.str + (it.hasEOL ? ' ' : '')).join('')))
  }
  await doc.destroy()
  return paginas
}
const normalizar = (texto) => texto.replace(/\s+/g, ' ').replace(/[‐-―]/g, '-').trim()

/**
 * Chrome repite en los marcadores del PDF el título de los encabezados que empiezan una página («ÍndiceÍndice»,
 * «1. Antes de empezar1. Antes de empezar»). Acá cada título repetido queda una sola vez, con espacios después del
 * string hasta el largo que tenía (entre dos elementos de un diccionario del PDF los espacios no cuentan): el archivo
 * mide lo mismo y la tabla de referencias (dónde empieza cada objeto) sigue valiendo. Los títulos van como string
 * literal, «(…)», o en UTF-16 en hexadecimal, «<FEFF…>». Devuelve el PDF arreglado y cuántos arregló.
 */
function arreglarMarcadores(pdf) {
  const s = pdf.toString('latin1')
  const partes = []
  let desde = 0
  let arreglados = 0
  const re = /\/Title\s*/g
  let m
  while ((m = re.exec(s))) {
    const i = m.index + m[0].length
    let fin = -1
    let nuevo = null
    if (s[i] === '(') {
      // Hasta el paréntesis que lo cierra: con «\» de escape y paréntesis balanceados, como dice el formato.
      let j = i + 1
      let nivel = 1
      while (j < s.length && nivel > 0) {
        if (s[j] === '\\') j += 2
        else {
          if (s[j] === '(') nivel++
          else if (s[j] === ')') nivel--
          j++
        }
      }
      fin = j
      const contenido = s.slice(i + 1, fin - 1)
      const mitad = contenido.length / 2
      if (contenido && Number.isInteger(mitad) && contenido.slice(0, mitad) === contenido.slice(mitad)) {
        nuevo = `(${contenido.slice(0, mitad)})`
      }
    } else if (s[i] === '<' && s[i + 1] !== '<') {
      fin = s.indexOf('>', i) + 1
      const contenido = s.slice(i + 1, fin - 1)
      const resto = contenido.slice(4)
      // Cada carácter en UTF-16 son 4 dígitos: las dos mitades tienen que tener caracteres enteros.
      if (/^feff/i.test(contenido) && resto && resto.length % 8 === 0 && resto.slice(0, resto.length / 2) === resto.slice(resto.length / 2)) {
        nuevo = `<${contenido.slice(0, 4)}${resto.slice(0, resto.length / 2)}>`
      }
    }
    if (nuevo == null) continue
    partes.push(s.slice(desde, i), nuevo.padEnd(fin - i, ' '))
    desde = fin
    re.lastIndex = fin
    arreglados++
  }
  partes.push(s.slice(desde))
  const arreglado = Buffer.from(partes.join(''), 'latin1')
  if (arreglado.length !== pdf.length) throw new Error('Al arreglar los marcadores cambió el largo del PDF.')
  return { pdf: arreglado, arreglados }
}

/** Los títulos de los marcadores del PDF, todos los niveles. */
async function marcadores(pdf) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await getDocument({ data: new Uint8Array(pdf), verbosity: 0 }).promise
  const plano = (items) => (items ?? []).flatMap((i) => [i.title, ...plano(i.items)])
  const titulos = plano(await doc.getOutline())
  await doc.destroy()
  return titulos
}

async function pdf() {
  if (!existsSync(HTML)) throw new Error(`No está ${relative(REPO, HTML)}.`)
  const faltan = [...readFileSync(HTML, 'utf8').matchAll(/src="img\/([^"]+)"/g)].map((m) => m[1]).filter((f) => !existsSync(join(DIR_IMG, f)))
  if (faltan.length) throw new Error(`Faltan capturas: ${faltan.join(', ')} (corré la herramienta sin --solo-pdf).`)
  const c = await abrirChrome({ ancho: 900, alto: 1200 })
  let temporal = null
  try {
    await c.send('Emulation.clearDeviceMetricsOverride')
    await c.send('Emulation.setEmulatedMedia', { media: 'print' })
    await c.send('Page.navigate', { url: pathToFileURL(HTML).href })
    await c.esperar(`document.readyState === 'complete' && [...document.images].every((i) => i.complete)`)
    await c.evaluar('document.fonts.ready.then(() => true)')
    // Cada captura a la misma escala: el ancho en píxeles del panel (la imagen tiene DENSIDAD por cada uno) por
    // ESCALA_PDF, sin pasar el de la columna. Las pocas que llevan data-escala en el HTML van un poco más chicas: son
    // las altas que, a la escala de todas, dejaban una página casi vacía (unos renglones del final de una sección, o
    // la captura que no entraba y pasaba a la página siguiente). Después, cada una se cambia por su copia en JPEG del
    // tamaño justo.
    const capturas = await c.evaluar(`(() => {
      const lista = []
      for (const img of document.querySelectorAll('img[src^="img/"]')) {
        const escala = Number(img.dataset.escala) || ${ESCALA_PDF}
        img.style.width = (img.naturalWidth / ${DENSIDAD} * escala) + 'px'
        lista.push({ src: img.getAttribute('src'), natural: img.naturalWidth, ancho: img.getBoundingClientRect().width })
      }
      return lista
    })()`)
    const rotas = capturas.filter((x) => !x.natural).map((x) => x.src)
    if (rotas.length) throw new Error(`No cargaron: ${rotas.join(', ')}`)
    const sharp = (await import('sharp')).default
    temporal = mkdtempSync(join(tmpdir(), 'mupa-manual-pdf-'))
    const copias = {}
    for (const { src, natural, ancho } of capturas) {
      if (copias[src]) continue
      const destino = join(temporal, src.replace(/^img\//, '').replace(/\.webp$/, '.jpg'))
      const pixeles = Math.min(natural, Math.round((ancho * PPP_PDF) / 96))
      await sharp(join(DIR_MANUAL, src))
        .resize({ width: pixeles })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: CALIDAD_PDF, chromaSubsampling: '4:4:4', mozjpeg: true })
        .toFile(destino)
      copias[src] = pathToFileURL(destino).href
    }
    await c.evaluar(`Promise.all([...document.querySelectorAll('img[src^="img/"]')].map((img) => {
      const copia = ${JSON.stringify(copias)}[img.getAttribute('src')]
      img.src = copia
      return img.decode()
    })).then(() => true)`)
    const titulos = await c.evaluar(`[...document.querySelectorAll('[data-indice]')].map((a) => {
      const destino = document.getElementById(a.getAttribute('href').slice(1))
      return { id: destino.id, texto: destino.textContent.replace(/\\s+/g, ' ').trim() }
    })`)
    const imprimir = async () =>
      Buffer.from(
        (
          await c.send('Page.printToPDF', {
            printBackground: true,
            preferCSSPageSize: true,
            generateTaggedPDF: true,
            generateDocumentOutline: true,
            transferMode: 'ReturnAsBase64',
          })
        ).data,
        'base64',
      )
    let salida = null
    let numeros = null
    for (let vuelta = 1; vuelta <= 4; vuelta++) {
      salida = await imprimir()
      const paginas = await textoPorPagina(salida)
      // El índice está antes que todo: cada título se busca después de la página donde termina el índice (la que tiene
      // la primera aparición del último título).
      const ultimo = normalizar(titulos.at(-1).texto)
      const finIndice = paginas.findIndex((p) => p.includes(ultimo))
      const encontrados = titulos.map(({ id, texto }) => {
        const t = normalizar(texto)
        const i = paginas.findIndex((p, n) => n > finIndice && p.includes(t))
        if (i < 0) throw new Error(`No encontré «${texto}» en el PDF.`)
        return { id, pagina: i + 1 }
      })
      const iguales = numeros && encontrados.every((e, i) => e.pagina === numeros[i].pagina)
      numeros = encontrados
      if (iguales) break
      await c.evaluar(`(() => {
        for (const { id, pagina } of ${JSON.stringify(encontrados)}) {
          document.querySelector('[data-indice][href="#' + id + '"]').closest('li').querySelector('.pagina').textContent = pagina
        }
        return true
      })()`)
      if (vuelta === 4) throw new Error('Los números del índice no se acomodaron en 4 vueltas.')
    }
    // Los marcadores: sin los títulos repetidos de Chrome, y cada uno igual a un título del manual.
    const arreglo = arreglarMarcadores(salida)
    salida = arreglo.pdf
    const encabezados = new Set(
      (await c.evaluar(`[...document.querySelectorAll('h1, h2, h3, h4')].map((h) => h.textContent)`)).map(normalizar),
    )
    const enElPdf = (await marcadores(salida)).map(normalizar)
    const raros = enElPdf.filter((t) => !encabezados.has(t))
    if (!enElPdf.length || raros.length) {
      throw new Error(`Marcadores que no son un título del manual: ${raros.slice(0, 5).join(' | ') || '(no hay marcadores)'}`)
    }
    log(`Marcadores: ${enElPdf.length} (${arreglo.arreglados} con el título repetido por Chrome, arreglados)`)
    mkdirSync(dirname(SALIDA_PDF), { recursive: true })
    writeFileSync(SALIDA_PDF, salida)
    const paginas = (await textoPorPagina(salida)).length
    log(`PDF: ${relative(REPO, SALIDA_PDF)}, ${paginas} páginas, ${(salida.length / 1024 / 1024).toFixed(2)} MB`)
    if (c.problemas.length) log('  la consola dijo:', c.problemas.slice(0, 5))
  } finally {
    await c.cerrar()
    if (temporal) rmSync(temporal, { recursive: true, force: true })
  }
}

// =====================================================================================================================

try {
  if (!SOLO_PDF) await capturas()
  await pdf()
  const imgs = readdirSync(DIR_IMG).filter((f) => f.endsWith('.webp'))
  const peso = imgs.reduce((t, f) => t + statSync(join(DIR_IMG, f)).size, 0)
  log(`Capturas: ${imgs.length} en ${relative(REPO, DIR_IMG)} (${(peso / 1024 / 1024).toFixed(2)} MB)`)
} catch (err) {
  console.error(`No se pudo: ${err.message}`)
  process.exitCode = 1
}
