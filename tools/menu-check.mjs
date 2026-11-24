// Comprueba lo que HACE el menú de debajo de xl (src/components/MenuMovil.jsx: el botón de tres líneas y su <dialog>,
// el menú abierto del cuadro de celular, O2) y que desde xl esté el menú ancho (Menu.jsx), con toques y clics de
// verdad en Chrome headless por CDP. No tiene prueba en npm test: abrir, Escape, la cruz, un enlace de adentro,
// «Horarios» en Visitas, el paso a xl y la vuelta del bfcache solo se ven en un navegador (salió de la verificación
// del marco de celular, 10-12/11/2026: tools/salida/e6-celular/v-marco/herr2/menu.mjs, enlaces-menu.mjs y bfcache.mjs,
// no versionados). Tiene que dar ok: true.
// Uso: node tools/menu-check.mjs [--url http://127.0.0.1:5183/] [--tamanos 402x874,1280x800] [--paginas /,/visitas]
//   [--tactil 1024] [--capturas carpeta] [--detalle] [--con-externos]
//   --tamanos: por defecto, los de celular y tablet de la versión de celular (320x568, 360x740, 375x635, 390x664,
//     402x874, 412x780, 430x932, 768x1024, 820x1180 y 1023x768), 1024x576, 1024x768 y 1279x800 (de lg a xl: sigue el
//     botón; a 1024x576, un 1280x720 al 125 %, el menú no entra y se desplaza con la rueda) y 1280x800 (xl: ya no hay
//     botón, va el menú ancho). Debajo de 768 px emula un teléfono táctil y abre con un toque (como measure.mjs);
//     desde ahí, una ventana de escritorio, con un clic del mouse (y con Lenis).
//   --paginas: por defecto /, /visitas y /el-museo (la Home, la página adonde lleva «Horarios» y otra con hero).
//     Relativas a --url, con la barra o sin ella (visitas,el-museo; la Home, / o .): en Git Bash un argumento que
//     empieza con una barra llega convertido en una ruta de Windows, y ahí van sin la barra.
//   --tactil: debajo de qué ancho emula un dispositivo táctil (768; con 1024, también las tablets con el dedo).
//   --capturas: guarda en esa carpeta una captura del menú recién abierto, por tamaño y página.
//   --detalle: suma a la salida la lista de todas las comprobaciones con lo que encontró, no solo las fallas.
// Qué espera lo lee de la propia página, no de valores fijos, así sirve con cualquier museo (salvo la frase de la barra
// de hoy, que es un texto de interfaz y sale de src/content.js: ver abajo): la compra activa y si el
// museo abre hoy, del estado (<script id="estado">: museo.compra y abiertoHoy); las secciones, su orden y sus
// destinos, del menú ancho, que está en el HTML en todos los anchos; la sección actual, de la DIRECCIÓN de la página
// (location.pathname: aria-current="page" en la página y "true" dentro de su sección; ninguna en la 404, que se
// reconoce por estado.pagina), y la ruta que manda el servidor (estado.ruta, con la que el menú se dibuja) tiene que
// ser esa dirección. Hasta la corrección del 16/11/2026 (VH-09) lo esperado salía de estado.ruta: si el servidor
// dejaba de mandarla, ninguna sección quedaba marcada y la receta pasaba.
// Qué comprueba, en cada tamaño y en cada página. Debajo de xl:
// - cerrado: el botón se ve, se puede tocar (nada encima), mide 44x44 o más, tiene nombre accesible, dice
//   aria-expanded="false" y controla un <dialog> con nombre, que no se ve; el menú ancho no se ve;
// - al abrir (con la página corrida 20 px): un solo toque o clic lo abre; es modal (showModal); el foco queda adentro;
//   el botón dice aria-expanded="true"; la página de atrás queda bloqueada (overflow hidden en html, el calculado) y
//   donde estaba, también después de arrastrar con el dedo o de girar la rueda sobre el menú; el <dialog> ocupa la
//   pantalla y no desborda a lo ancho; las secciones, en el orden y con los destinos del menú ancho; la sección actual
//   con su aria-current; «Tickets» (a[data-entradas]) solo con la compra activa y con su dirección; la barra de hoy
//   adentro solo debajo de lg y solo si abiertoHoy no es null, con su valor (data-hoy) y con lo que DICE: su texto
//   tiene «abierto» o «cerrado» según el estado, y la barra del header se ve y dice lo mismo (VH-10, 16/11/2026: antes
//   miraba solo data-hoy); y una sola barra adentro del menú y una sola afuera, en el header (ninguna sin horario; en
//   todos los anchos, porque el HTML es el mismo: RT-01, 17/11/2026, la receta leía solo la primera y daba ok con dos
//   iguales a la vista), y su frase se lee una sola vez en cada lugar (debajo de lg y con horario; si no, ninguna: el
//   texto a la vista, no el atributo, así una copia sin data-hoy o la frase repetida dentro de la barra también fallan:
//   R2-02, 17/11/2026), y la barra dice exactamente esa frase. La frase no sale de la página sino de src/content.js
//   (barraHoy.abierto y barraHoy.cerrado, según abiertoHoy), leída al arrancar: hasta el 18/11/2026 se aprendía del
//   primer texto de la barra, y con la frase repetida DENTRO de ese texto en las dos barras (lo que pasaría si
//   content.js la trajera dos veces: «El museo se encuentra abierto hoy El museo se encuentra abierto hoy») aprendía la
//   doble, la contaba una vez en cada lugar y daba ok (R3H-01 de la re-verificación de la ronda 3). Por eso la receta
//   es la del mismo árbol que el sitio que se mide: contra un sitio con otra frase, falla; y si la frase viene repetida
//   en el propio content.js, no arranca (R4-02, 18/11/2026: hasta entonces la receta de ese árbol la aprendía doble y
//   daba ok; lo atajaba solo npm test); el <dialog> lleva
//   data-lenis-prevent (la rueda sobre el menú es de él: CTRL-LENIS, 17/11/2026);
//   ningún control de menos de 44 px; y el menú entero alcanzable: entra en la pantalla o se
//   desplaza por dentro hasta el último control; un toque fuera de los enlaces no lo cierra;
// - Escape y la cruz lo cierran: el <dialog> deja de verse, el botón vuelve a aria-expanded="false" y recibe el
//   foco, la página queda donde estaba y desbloqueada (sin overflow hidden y sin Lenis parado), y el botón se puede
//   volver a tocar;
// - un enlace de adentro (una sección) cierra el menú y desbloquea la página antes de irse, y navega; Atrás vuelve a
//   la página con el menú cerrado y desbloqueada;
// - con el menú ABIERTO, irse a otra página sin pasar por un enlace del menú y volver con Atrás (en la primera página
//   de la lista): si el navegador la trae del bfcache (pageshow persistido), el menú se cierra y la página queda
//   desbloqueada. Si no usó el bfcache (no guarda, por ejemplo, una página que respondió 404) la página se vuelve a
//   cargar y la vuelta no prueba nada: va en avisos, no en fallas;
// - en la página adonde lleva «Horarios» de la barra de hoy (Visitas), tocarlo adentro del menú lo cierra, deja la
//   página desbloqueada, pone el ancla en la dirección y deja la tarjeta Horarios a la vista, arriba;
// - agrandar la ventana hasta xl con el menú abierto lo cierra y deja la página desbloqueada;
// - sin JavaScript (un pase por tamaño, en la primera página que cargó, con los scripts apagados por CDP; VH-08,
//   16/11/2026): el botón del menú no se ve (sin JavaScript no abre nada: noscript:hidden) y las secciones del menú
//   están a la vista en el pie. Si ese Chrome no informa (scripting: none) con los scripts apagados, va en avisos y
//   no se prueba.
// Desde xl: no hay botón, el <dialog> está cerrado y el menú ancho se ve, con sus enlaces enteros y de 44 de alto, la
// sección actual y «Tickets» solo con la compra activa.
// Y en todos: la ruta del estado es la de la dirección; nada en la consola (errores, avisos, excepciones), ninguna
// violación de la CSP y ningún pedido al propio sitio fallido.
// Salida: un JSON con ok, la cantidad de comprobaciones, las fallas (tamaño, página, qué, qué esperaba y qué
// encontró), los avisos, el resumen por tamaño y cuánto tardó (unos dos minutos con lo de por defecto); el avance,
// por stderr. Código de salida 1 si falla algo.
// Si el sitio no responde (VH-13, 16/11/2026): cuando ninguna página del primer tamaño tuvo respuesta, corta ahí con
// ok false y la falla «el sitio responde», sin abrir los demás Chrome. Una página que acepta la conexión y se queda
// muda espera 30 s; las que siguen, mientras ninguna haya contestado, 5 s (antes eran 30 s por página en todos los
// tamaños: unos 20 minutos con lo de por defecto). Un 500 es una respuesta: la corrida sigue.
// Un Chrome nuevo por tamaño (perfil temporal, puerto libre como measure.mjs; CHROME_PATH para otra ruta), que se
// cierra al terminar (por CDP y, si no sale, por el PID del proceso que se lanzó acá, con todos sus procesos) y borra
// su perfil: así ninguna página elige una foto por lo que quedó en la caché de otro ancho. Cortada con Ctrl+C, termina
// a su Chrome y borra también ese perfil (VH-12, 16/11/2026: quedaba en %TEMP%, cdp-menu-XXXXXX; desde RT-03,
// 17/11/2026, el árbol entero con taskkill /T y hasta unos 10 s de reintentos, porque con la PC cargada todavía
// quedaba alguno); matada de golpe, no se entera y el perfil queda, y lo borra la corrida siguiente si tiene más de
// una hora. No apaga la caché de HTTP: con ella apagada el navegador no usa el bfcache. Abre Chrome con
// --enable-automation: la página no mide la visita (navigator.webdriver), así contra mupa.ar no cuenta. Con una URL
// local (127.0.0.1, localhost o [::1]) nada sale de esta máquina, como en measure.mjs: Chrome no resuelve ningún otro
// nombre (el mapa de Visitas, UserWay); --con-externos lo deja salir. «Tickets» no se toca nunca: es un sitio de
// afuera.
// Los controles (que cada cosa rota la hace fallar: la página sin hidratar, sin aria-current, sin «Tickets», sin
// bloquear, sin cerrar…) no están acá: tools/salida/tanda-1/menu-check/ (no versionado), con un proxy que rompe una
// cosa por corrida; los de la verificación y de la corrección del 16/11/2026 (44 roturas, el Ctrl+C de verdad, el
// sitio colgado), en tools/salida/tanda-1/v-herramientas/herr/ y corr-herramientas/herr/ (t5-*.mjs y ctrlc.ps1); los de
// la re-verificación y de la ronda 2 del 17/11/2026 (la barra de hoy duplicada, adentro del menú, en el header o en el
// pie, y una de más sin horario: RT-01), en tools/salida/tanda-1/rv-t17/herr/ y corr-2/herr/ (B-romper.mjs); y los de
// la ronda 3 (la frase de la barra repetida o una copia sin data-hoy: R2-02; el <dialog> sin data-lenis-prevent; el
// Ctrl+C con la PC cargada: RT-03), en tools/salida/tanda-1/corr-3/herr/ (B-romper.mjs y ctrlc-*.mjs).
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Los perfiles temporales de Chrome (RT-03 de la re-verificación, 17/11/2026: con la PC cargada, cortada con Ctrl+C o
// contra el sitio colgado, todavía quedaban carpetas cdp-menu-* en %TEMP% y procesos de Chrome vivos unos segundos,
// porque se terminaba solo el proceso principal y se reintentaba borrar unos 3 s). Ahora se termina el árbol entero
// (en Windows, taskkill /T /F, sincrónico: también los procesos hijos, que eran los que seguían con los archivos
// abiertos), se reintenta borrar hasta unos 10 s y, al arrancar, se borran las que quedaron de corridas de hace más de
// una hora (una corrida dura unos minutos y cada Chrome, uno por tamaño, menos: ninguna de esas está en uso).
const PREFIJO_PERFIL = 'cdp-menu-'
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

const argv = process.argv.slice(2)
const opt = (k, d) => {
  const i = argv.indexOf(k)
  if (i < 0) return d
  const v = argv.splice(i, 2)[1]
  if (v === undefined || v.startsWith('--')) throw new Error(`${k} necesita un valor`)
  return v
}
const bandera = (k) => {
  const i = argv.indexOf(k)
  if (i >= 0) argv.splice(i, 1)
  return i >= 0
}
const url = opt('--url', 'http://127.0.0.1:5183/')
// 1024x576 (un 1280x720 con la escala de Windows al 125 %) es el único donde el menú no entra en una ventana con
// mouse y Lenis: ahí se prueba que la rueda lo desplaza por dentro (data-lenis-prevent en el <dialog>). Sin él, la
// corrida por defecto no lo ejercitaba (VH-11 de la verificación de la tanda 1, 16/11/2026).
const TAMANOS = '320x568,360x740,375x635,390x664,402x874,412x780,430x932,768x1024,820x1180,1023x768,1024x576,1024x768,1279x800,1280x800'
const tamanos = opt('--tamanos', TAMANOS).split(',').map((t) => t.trim().split('x').map(Number))
const paginasPedidas = opt('--paginas', '/,/visitas,/el-museo').split(',').map((p) => p.trim()).filter(Boolean)
// Debajo de este ancho, un teléfono táctil (por defecto 768, como measure.mjs); desde ahí, una ventana de escritorio.
const anchoTactil = Number(opt('--tactil', 768))
const capturas = opt('--capturas', null)
const conDetalle = bandera('--detalle')
const conExternos = bandera('--con-externos')
if (argv.length) throw new Error(`opción desconocida: ${argv.join(' ')}`)
if (tamanos.some(([w, h]) => !(w >= 200 && h >= 200))) throw new Error('--tamanos: una lista de <ancho>x<alto>, p. ej. 402x874,1280x800')
if (!(anchoTactil >= 0)) throw new Error('--tactil: un ancho en px, p. ej. 1024')
const soloLocal = !conExternos && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)
// La frase de la barra de hoy, de src/content.js (R3H-01, 18/11/2026): la que se cuenta en la página y la que la barra
// tiene que decir. Sin ella, la receta no arranca.
const FRASES = (() => {
  let fuente = ''
  try {
    fuente = readFileSync(new URL('../src/content.js', import.meta.url), 'utf8')
  } catch (e) {
    throw new Error(`no pude leer src/content.js para la frase de la barra de hoy (barraHoy): ${e.message}`)
  }
  const m = /export const barraHoy = \{\s*abierto: '([^']+)',\s*cerrado: '([^']+)'/.exec(fuente)
  if (!m) throw new Error('no encontré la frase de la barra de hoy en src/content.js (export const barraHoy = { abierto: …, cerrado: … })')
  // La frase dos veces dentro del mismo texto (R4-02 de la re-verificación de la ronda 4, 18/11/2026): la receta la
  // aprendería doble, la contaría una vez en cada lugar y daría ok. Si las palabras son dos mitades iguales, no arranca.
  for (const [cual, frase] of [['abierto', m[1]], ['cerrado', m[2]]]) {
    const palabras = frase.trim().split(/\s+/)
    const mitad = palabras.length / 2
    if (Number.isInteger(mitad) && palabras.slice(0, mitad).join(' ') === palabras.slice(mitad).join(' ')) {
      throw new Error(`la frase de la barra de hoy (barraHoy.${cual}) de src/content.js está repetida: "${frase}"`)
    }
  }
  return { abierto: m[1], cerrado: m[2] }
})()
const origen = new URL(url).origin
// Las páginas, relativas a --url. Git Bash convierte un argumento que empieza con una barra en una ruta de Windows
// (C:/Program Files/Git/visitas): ahí van sin la barra, o con MSYS_NO_PATHCONV=1.
if (paginasPedidas.some((p) => /^[A-Za-z]:[\\/]/.test(p))) {
  throw new Error('--paginas: Git Bash convirtió la ruta en una de Windows; escribila sin la barra inicial (visitas,el-museo; la Home, .) o con MSYS_NO_PATHCONV=1')
}
const paginas = paginasPedidas.map((p) => {
  const u = new URL(p, url)
  if (u.origin !== origen) throw new Error(`--paginas: ${p} no es una página de ${origen}`)
  return u.pathname + u.search
})
if (!paginas.length) throw new Error('--paginas: al menos una página, p. ej. /,/visitas (la Home, / o .)')

// Cuánto se corre la página antes de abrir el menú, para ver que queda donde estaba (el botón sigue a la vista).
const CORRIDA = 20
// Lo que guarda la página al irse (pagehide), para leerlo desde la página siguiente, y el aviso de la CSP.
const CLAVE_SALIDA = 'menu-check-salida'
const AVISO_CSP = '__menuCheckCsp'
// Un control de 44 px, con el redondeo del navegador.
const MINIMO = 43.5
// Cuánto se espera la respuesta de una página (el tope de Page.navigate): 30 s; y 5 s para las que siguen a una que
// no contestó, mientras ninguna haya contestado (un sitio colgado: VH-13).
const TOPE_RESPUESTA = 30000
const TOPE_RESPUESTA_CORTO = 5000
// Los Chrome que esta corrida tiene abiertos, cada uno con su PID y su perfil temporal: lo que limpia el Ctrl+C.
const enCurso = new Set()

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))
const corto = (v) => {
  const t = typeof v === 'string' ? v : JSON.stringify(v)
  return t === undefined ? String(v) : t.length > 300 ? `${t.slice(0, 300)}…` : t
}
/** aria-current de un enlace del menú según la ruta de la página (la regla de src/components/navegacion.js). */
const actualEsperado = (ruta, destino) =>
  ruta === destino ? 'page' : typeof ruta === 'string' && ruta.startsWith(`${destino}/`) ? 'true' : null

// Corre adentro de cada página, antes que sus scripts: lo que la herramienta le pregunta al DOM. No toca nada de la
// página salvo sessionStorage al irse (CLAVE) y sus oyentes de pageshow, pagehide y securitypolicyviolation.
function enLaPagina(CLAVE, AVISO, FRASES) {
  if (window !== window.top || window.__menuCheck) return
  // El script corre antes de que exista el <html>: se lo busca cada vez.
  const html = () => document.documentElement
  const r1 = (n) => Math.round(n * 10) / 10
  const seVe = (e) => Boolean(e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
  // La caja de un elemento, su centro y si en su centro está él (nada lo tapa y cae dentro de la pantalla).
  const caja = (e) => {
    const c = e.getBoundingClientRect()
    const x = c.left + c.width / 2
    const y = c.top + c.height / 2
    const arriba = document.elementFromPoint(x, y)
    return {
      x: r1(x),
      y: r1(y),
      w: r1(c.width),
      h: r1(c.height),
      izq: r1(c.left),
      der: r1(c.right),
      arriba: r1(c.top),
      abajo: r1(c.bottom),
      seVe: seVe(e),
      alPunto: Boolean(arriba && (arriba === e || e.contains(arriba))),
    }
  }
  const nombre = (e) => {
    const ids = (e.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
    const por = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
    return (por || e.getAttribute('aria-label') || e.innerText || e.querySelector('img[alt]')?.alt || '').trim().replace(/\s+/g, ' ')
  }
  // El botón del menú: el del header que controla un <dialog>. El menú ancho: la navegación del header que no está
  // adentro del <dialog>.
  const boton = () =>
    [...document.querySelectorAll('header button[aria-controls]')].find(
      (b) => document.getElementById(b.getAttribute('aria-controls'))?.localName === 'dialog',
    ) ?? null
  const dialogo = () => {
    const b = boton()
    return b ? document.getElementById(b.getAttribute('aria-controls')) : document.querySelector('header dialog')
  }
  const menuAncho = () => [...document.querySelectorAll('header nav')].find((n) => !n.closest('dialog')) ?? null
  const secciones = (raiz) => (raiz ? [...raiz.querySelectorAll('a[href]:not([data-entradas])')] : [])
  const enlace = (a) => ({
    texto: a.textContent.trim().replace(/\s+/g, ' '),
    href: a.getAttribute('href'),
    actual: a.getAttribute('aria-current'),
    ...caja(a),
  })
  const entradas = (raiz) => (raiz ? [...raiz.querySelectorAll('a[data-entradas]')].map((a) => ({ destino: a.href, ...caja(a) })) : [])
  const bloqueo = () => ({
    overflowY: getComputedStyle(html()).overflowY,
    enLinea: html().style.overflow,
    lenisParado: html().classList.contains('lenis-stopped'),
  })
  const destinoDe = (a) => ({ ...caja(a), ruta: new URL(a.href).pathname, ancla: new URL(a.href).hash })
  // Lo que se lee en un elemento (innerText: sin lo que no se dibuja), en un renglón.
  const textoVisible = (e) => (e.innerText ?? '').trim().replace(/\s+/g, ' ')

  window.__menuCheck = {
    /** Lo que la página dice de sí misma: el estado del servidor y el menú ancho. null si no trae el estado. */
    esperado() {
      let estado = null
      try {
        estado = JSON.parse(document.getElementById('estado').textContent)
      } catch {}
      if (!estado) return null
      const nav = menuAncho()
      const compra = estado.museo?.compra?.url
      return {
        pagina: estado.pagina ?? null,
        // La sección actual que se espera sale de la DIRECCIÓN de la página, no de estado.ruta, que es el mismo dato
        // con que el menú se dibuja: si el servidor dejaba de mandarla, ninguna sección quedaba marcada y eso era
        // justo lo que se esperaba (VH-09, 16/11/2026). En la 404, ninguna. La del estado se compara aparte.
        ruta: estado.pagina === 'no-encontrada' ? null : location.pathname,
        direccion: location.pathname,
        rutaDelEstado: typeof estado.ruta === 'string' ? estado.ruta : null,
        compra: compra ? new URL(compra, location.href).href : null,
        abiertoHoy: typeof estado.abiertoHoy === 'boolean' ? estado.abiertoHoy : null,
        lg: matchMedia('(width >= 64rem)').matches,
        xl: matchMedia('(width >= 80rem)').matches,
        anchoXl: Math.ceil(80 * parseFloat(getComputedStyle(html()).fontSize)),
        ancho: nav ? { seVe: seVe(nav), secciones: secciones(nav).map(enlace), entradas: entradas(nav) } : null,
      }
    },
    /** Cómo está el menú ahora. */
    leer() {
      const b = boton()
      const d = dialogo()
      const abierto = Boolean(d && d.open)
      const cerrar = d ? d.querySelector('button') : null
      const a = document.activeElement
      const barra = d ? d.querySelector('[data-hoy]') : null
      const horarios = barra ? barra.querySelector('a[href]') : null
      const afuera = [...document.querySelectorAll('header [data-hoy]')].find((e) => !e.closest('dialog')) ?? null
      // Todas las barras de la página, no solo la primera de cada lugar (RT-01, 17/11/2026).
      const fuera = [...document.querySelectorAll('[data-hoy]')].filter((e) => !(d && d.contains(e)))
      let foco = `otro elemento (${a?.localName})`
      if (!a || a === document.body) foco = 'el body'
      else if (a === b) foco = 'boton'
      else if (d && d.contains(a)) foco = a === cerrar ? 'cerrar' : 'adentro'
      return {
        ruta: location.pathname,
        hash: location.hash,
        scrollY: Math.round(scrollY),
        alto: innerHeight,
        ancho: html().clientWidth,
        html: bloqueo(),
        foco,
        boton: b ? { ...caja(b), nombre: nombre(b), expandido: b.getAttribute('aria-expanded'), popup: b.getAttribute('aria-haspopup') } : null,
        dialogo: d
          ? {
              abierto,
              modal: abierto && d.matches(':modal'),
              seVe: seVe(d),
              nombre: nombre(d),
              alto: d.clientHeight,
              contenido: d.scrollHeight,
              scrollTop: Math.round(d.scrollTop),
              desbordaAncho: d.scrollWidth - d.clientWidth,
              caja: caja(d),
            }
          : null,
        cerrar: abierto && cerrar ? { ...caja(cerrar), nombre: nombre(cerrar) } : null,
        secciones: d ? secciones(d.querySelector('nav')).map(enlace) : [],
        entradas: entradas(d),
        // De cada barra de hoy, el valor (data-hoy) y lo que DICE: su texto visible (VH-10, 16/11/2026).
        barra: barra
          ? { seVe: seVe(barra), valor: barra.getAttribute('data-hoy'), texto: textoVisible(barra), horarios: horarios ? destinoDe(horarios) : null }
          : null,
        barraAfuera: afuera ? { seVe: seVe(afuera), valor: afuera.getAttribute('data-hoy'), texto: textoVisible(afuera) } : null,
        // Cuántas hay: adentro del menú, afuera de él y, de esas, en el header.
        barras: { adentro: d ? d.querySelectorAll('[data-hoy]').length : 0, afuera: fuera.length, enElHeader: fuera.filter((e) => e.closest('header')).length },
        // Y cuántas veces se LEE su frase (texto a la vista), adentro del menú y en el header afuera de él: contar el
        // atributo no ve una copia de la barra sin data-hoy ni la frase repetida dentro de la barra (R2-02 de la
        // re-verificación de la ronda 2, 17/11/2026). La frase es la de src/content.js (FRASES: la de abierto o la de
        // cerrado, según el estado), no la de la página (R3H-01, 18/11/2026); se cuentan las dos (la otra, ninguna vez)
        // y se lee la que dice la barra (el primer texto de su <span>), que tiene que ser esa misma.
        frases: (() => {
          const fuente = barra ?? afuera
          const leida = [...(fuente?.querySelector('span')?.childNodes ?? [])].find((n) => n.nodeType === 3 && n.textContent.trim())?.textContent.trim() ?? null
          let abiertoHoy = null
          try {
            const v = JSON.parse(document.getElementById('estado').textContent).abiertoHoy
            if (typeof v === 'boolean') abiertoHoy = v
          } catch {}
          const frase = abiertoHoy === null ? null : abiertoHoy ? FRASES.abierto : FRASES.cerrado
          const otra = abiertoHoy === null ? null : abiertoHoy ? FRASES.cerrado : FRASES.abierto
          const cuenta = (raiz, vale, frase) => {
            if (!raiz) return 0
            let n = 0
            const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)
            for (let t = w.nextNode(); t; t = w.nextNode()) {
              if (!vale(t) || !t.parentElement || !seVe(t.parentElement)) continue
              n += t.textContent.split(frase).length - 1
            }
            return n
          }
          const enElHeader = (t) => !(d && d.contains(t))
          const header = document.querySelector('header')
          if (!frase) {
            // Sin horario: ninguna de las dos se tiene que leer.
            const a = cuenta(d, () => true, FRASES.abierto) + cuenta(d, () => true, FRASES.cerrado)
            const h = cuenta(header, enElHeader, FRASES.abierto) + cuenta(header, enElHeader, FRASES.cerrado)
            return { adentro: a, header: h, otraAdentro: 0, otraHeader: 0, frase: null, leida }
          }
          return {
            adentro: cuenta(d, () => true, frase),
            header: cuenta(header, enElHeader, frase),
            otraAdentro: cuenta(d, () => true, otra),
            otraHeader: cuenta(header, enElHeader, otra),
            frase,
            leida,
          }
        })(),
        // El <dialog> deja la rueda y el dedo para él (data-lenis-prevent, en MenuMovil.jsx): si no, con Lenis andando,
        // la rueda sobre un menú que no entra no lo desplaza (lo de 1024x576). La comprobación directa: el atributo en el
        // <dialog> (CTRL-LENIS de la ronda 2, 17/11/2026: ninguna otra lo veía con seguridad).
        lenisPrevent: d ? d.hasAttribute('data-lenis-prevent') : null,
        controles: abierto
          ? [...d.querySelectorAll('a[href], button')].filter(seVe).map((e) => ({ nombre: nombre(e).slice(0, 40), ...caja(e) }))
          : [],
        menuAncho: seVe(menuAncho()),
      }
    },
    abierto: () => Boolean(dialogo()?.open),
    /** React ya adoptó el header (los manejadores están puestos): sus nodos llevan las propiedades internas de React. */
    hidratada() {
      const e = boton() ?? document.querySelector('header')
      return Boolean(e && Object.keys(e).some((k) => k.startsWith('__reactProps$') || k.startsWith('__reactFiber$')))
    },
    /** Deja pasar n cuadros (lo que React y el navegador tengan pendiente de pintar). */
    cuadros: (n = 2) =>
      new Promise((ok) => {
        const paso = () => (n-- > 0 ? requestAnimationFrame(paso) : ok(true))
        paso()
      }),
    /** El centro del botón del menú, si se ve. */
    puntoBoton() {
      const b = boton()
      return b && seVe(b) ? caja(b) : null
    },
    /** Trae a la vista (por dentro del menú) la sección número i y da su caja. */
    seccion(i) {
      const a = secciones(dialogo()?.querySelector('nav'))[i]
      if (!a) return null
      a.scrollIntoView({ block: 'center', behavior: 'instant' })
      return enlace(a)
    },
    /** «Horarios» de la barra de hoy de adentro del menú, con el menú arriba del todo. */
    horarios() {
      const d = dialogo()
      const a = d?.querySelector('[data-hoy] a[href]')
      if (!a || !seVe(a)) return null
      d.scrollTo({ top: 0, behavior: 'instant' })
      return destinoDe(a)
    },
    /** Un punto de adentro del menú abierto que no es un enlace ni un botón. */
    puntoLibre() {
      const d = dialogo()
      if (!d || !d.open) return null
      const nav = d.querySelector('nav')
      const candidatos = []
      if (nav) {
        const c = nav.getBoundingClientRect()
        candidatos.push([c.left + c.width / 2, c.top + 20], [c.left + c.width / 2, c.bottom - 20])
      }
      candidatos.push([html().clientWidth / 2, innerHeight - 12])
      for (const [x, y] of candidatos) {
        if (x < 0 || y < 0 || x >= html().clientWidth || y >= innerHeight) continue
        const e = document.elementFromPoint(x, y)
        if (e && d.contains(e) && !e.closest('a, button')) return { x: r1(x), y: r1(y) }
      }
      return null
    },
    /** Lleva el menú (su scroll de adentro) arriba del todo o abajo del todo. */
    menuA(donde) {
      const d = dialogo()
      if (d) d.scrollTo({ top: donde === 'abajo' ? d.scrollHeight : 0, behavior: 'instant' })
      return true
    },
    /** El destino de un ancla de la página: dónde quedó y dónde tiene que quedar (su scroll-margin-top). */
    destino(ancla) {
      const e = document.getElementById(decodeURIComponent(ancla.slice(1)))
      if (!e) return null
      const c = e.getBoundingClientRect()
      return {
        arriba: r1(c.top),
        abajo: r1(c.bottom),
        margen: parseFloat(getComputedStyle(e).scrollMarginTop) || 0,
        alto: innerHeight,
        alFinal: scrollY >= html().scrollHeight - innerHeight - 1,
      }
    },
    /** Lo que dejó la página anterior al irse (y lo borra). */
    salida() {
      try {
        const t = sessionStorage.getItem(CLAVE)
        sessionStorage.removeItem(CLAVE)
        return t ? JSON.parse(t) : null
      } catch {
        return null
      }
    },
  }
  // Cada vez que la página se muestra: de una carga nueva (persisted false) o del bfcache (true).
  addEventListener('pageshow', (e) => {
    window.__menuCheckShow = { persisted: e.persisted }
  })
  // Al irse: cómo quedó el menú.
  addEventListener('pagehide', () => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({ abierto: Boolean(dialogo()?.open), ...bloqueo() }))
    } catch {}
  })
  document.addEventListener('securitypolicyviolation', (e) => {
    try {
      window[AVISO](`${e.effectiveDirective || e.violatedDirective} ${e.blockedURI || ''}`.trim())
    } catch {}
  })
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
  // Lo que hay que limpiar si cortan la herramienta con Ctrl+C (el oyente de SIGINT, más abajo).
  const registro = { pid: chrome.pid, perfil }
  enCurso.add(registro)
  // Termina este Chrome (el proceso que se lanzó acá, por su PID, con todos sus procesos: terminarArbol) y borra su
  // perfil. Los procesos de ese Chrome sueltan los archivos un momento después de cerrarse: se reintenta hasta unos 10 s
  // (eran 5 intentos de 200 ms y, con la PC cargada, 2 de 96 Chrome dejaban su perfil en %TEMP% aunque la corrida
  // terminara sola: 16/11/2026; después, unos 4 s, y con la PC cargada todavía quedaba alguno: RT-03, 17/11/2026).
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
    // Lo que junta de cada página (se vacía con limpiar()).
    const visto = { consola: [], csp: [], fallidos: [] }
    const pedidos = new Map()
    let cargas = 0
    let documento = null
    let marco = null
    const propio = (u) => {
      try {
        return new URL(u).origin === origen
      } catch {
        return false
      }
    }
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
          pedidos.set(d.requestId, d.request.url)
          break
        case 'Network.responseReceived':
          if (d.type === 'Document' && d.frameId === marco) documento = d.response.status
          else if (d.response.status >= 400 && propio(d.response.url)) {
            visto.fallidos.push(`${d.response.status} ${new URL(d.response.url).pathname}`)
          }
          break
        case 'Network.loadingFailed': {
          // Lo que se corta al irse de la página (canceled) no es una falla; lo de afuera, con una URL local, no
          // resuelve y tampoco cuenta.
          const u = pedidos.get(d.requestId)
          if (!d.canceled && d.errorText !== 'net::ERR_ABORTED' && u && propio(u)) {
            visto.fallidos.push(`${d.errorText} ${new URL(u).pathname}`)
          }
          break
        }
        case 'Runtime.consoleAPICalled':
          if (['error', 'warning', 'assert'].includes(d.type)) {
            visto.consola.push(`${d.type}: ${d.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300)}`)
          }
          break
        case 'Runtime.exceptionThrown':
          visto.consola.push(`excepción: ${(d.exceptionDetails.exception?.description ?? d.exceptionDetails.text).slice(0, 300)}`)
          break
        case 'Runtime.bindingCalled':
          if (d.name === AVISO_CSP) visto.csp.push(String(d.payload).slice(0, 300))
          break
        case 'Log.entryAdded':
          // Lo que el navegador informa sin pasar por console (seguridad, JavaScript). Los de red se miran por Network,
          // y solo los del propio sitio.
          if (['error', 'warning'].includes(d.entry.level) && d.entry.source !== 'network') {
            const texto = `${d.entry.level} ${d.entry.source}: ${d.entry.text.slice(0, 300)}`
            if (/Content Security Policy/i.test(d.entry.text)) visto.csp.push(texto)
            else visto.consola.push(texto)
          }
          break
      }
    }
    const send = (method, params = {}, ms = 30000) =>
      new Promise((ok, mal) => {
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
      if (r.error) throw new Error(r.error.message)
      const mal = r.result?.exceptionDetails
      if (mal) throw new Error(mal.exception?.description || mal.text || 'error en la expresión')
      return r.result?.result?.value
    }
    /** Espera a que la expresión dé algo verdadero y lo devuelve; null si no llegó. Mientras la página navega, reintenta. */
    const esperar = async (expression, ms = 3000) => {
      const fin = Date.now() + ms
      for (;;) {
        let v
        try {
          v = await evaluar(expression)
        } catch {}
        if (v) return v
        if (Date.now() >= fin) return null
        await dormir(25)
      }
    }
    /** Espera a que el valor de la expresión deje de cambiar durante `quieto` ms. */
    const esperarQuieto = async (expression, quieto = 150, ms = 4000) => {
      const fin = Date.now() + ms
      let ultimo
      let desde = Date.now()
      for (;;) {
        let v
        try {
          v = JSON.stringify(await evaluar(expression))
        } catch {}
        if (v !== ultimo) {
          ultimo = v
          desde = Date.now()
        } else if (v !== undefined && Date.now() - desde >= quieto) return true
        if (Date.now() >= fin) return false
        await dormir(25)
      }
    }
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Network.enable')
    await send('Log.enable')
    await send('Runtime.addBinding', { name: AVISO_CSP })
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(${enLaPagina})(${JSON.stringify(CLAVE_SALIDA)}, ${JSON.stringify(AVISO_CSP)}, ${JSON.stringify(FRASES)})`,
    })
    marco = (await send('Page.getFrameTree')).result?.frameTree?.frame?.id ?? null
    const version = (await send('Browser.getVersion')).result?.product ?? null
    return {
      pid: chrome.pid,
      version,
      send,
      evaluar,
      esperar,
      esperarQuieto,
      visto,
      limpiar() {
        visto.consola.length = visto.csp.length = visto.fallidos.length = 0
      },
      async tamano(ancho, alto, tactil) {
        await send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: tactil })
        await send('Emulation.setTouchEmulationEnabled', { enabled: tactil, maxTouchPoints: tactil ? 5 : 1 })
      },
      /**
       * Navega y espera la carga, las fuentes y a React. Devuelve el estado HTTP del documento y si hidrató. Si el
       * sitio no contesta en `tope` ms (acepta la conexión y se queda mudo), suelta la navegación y devuelve
       * { error, sinRespuesta: true }: Page.navigate contesta recién cuando llega la respuesta.
       */
      async ir(direccion, esperaReact, tope = TOPE_RESPUESTA) {
        const antes = cargas
        documento = null
        let r
        try {
          r = await send('Page.navigate', { url: direccion }, tope)
        } catch {
          // Con la navegación pendiente, Chrome tampoco contesta lo que sigue: se la corta.
          await send('Page.stopLoading', {}, 3000).catch(() => {})
          return { error: `la página no contestó en ${Math.round(tope / 1000)} s`, sinRespuesta: true }
        }
        if (r.result?.errorText) return { error: r.result.errorText }
        for (let i = 0; i < 400 && cargas === antes; i++) await dormir(50)
        if (cargas === antes) return { error: 'la página no terminó de cargar en 20 s', status: documento }
        await esperar(`document.fonts.status === 'loaded'`, 4000)
        const hidratada = Boolean(await esperar('window.__menuCheck && __menuCheck.hidratada()', esperaReact))
        return { status: documento, hidratada }
      },
      async cerrar() {
        // Primero por las buenas (Chrome cierra sus procesos y suelta el perfil); si no, por su PID.
        try {
          await send('Browser.close', {}, 3000)
        } catch {}
        for (let i = 0; i < 30 && !salio; i++) await dormir(100)
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

const comprobaciones = []
const avisos = new Set()
// Las vueltas con Atrás, y cuántas trajo el navegador del bfcache (las otras son cargas nuevas).
const bfcache = { conElMenuAbierto: { vueltas: 0, delBfcache: 0 }, desdeUnEnlace: { vueltas: 0, delBfcache: 0 } }
// Cuánto se espera a React en cada carga: si una página no hidrató, las siguientes no esperan tanto.
let esperaReact = 6000
// Las páginas que tuvieron respuesta (con cualquier estado) y las que se quedaron mudas, en toda la corrida: si en el
// primer tamaño ninguna contestó, el sitio no responde y no se revisa nada más (VH-13).
let contestaron = 0
let mudas = 0
// De cada tamaño: si sus páginas están debajo de xl (ahí va el botón del menú; lo dice la propia página) y la
// primera que cargó con su estado, que es donde se hace el pase sin JavaScript.
let debajoDeXl = null
let primeraLeida = null

// Corre adentro de la página con los scripts APAGADOS (no usa nada de enLaPagina): el botón del menú, el menú ancho
// y los enlaces del pie que se ven.
function sinJavaScript() {
  const seVe = (e) => Boolean(e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
  const boton =
    [...document.querySelectorAll('header button[aria-controls]')].find(
      (b) => document.getElementById(b.getAttribute('aria-controls'))?.localName === 'dialog',
    ) ?? null
  const caja = boton ? boton.getBoundingClientRect() : null
  const nav = [...document.querySelectorAll('header nav')].find((n) => !n.closest('dialog')) ?? null
  const secciones = nav ? [...nav.querySelectorAll('a[href]:not([data-entradas])')].map((a) => a.getAttribute('href')) : []
  const pie = [...document.querySelectorAll('footer a[href]')].filter(seVe).map((a) => a.getAttribute('href'))
  return {
    scripting: matchMedia('(scripting: none)').matches ? 'none' : 'enabled',
    xl: matchMedia('(width >= 80rem)').matches,
    boton: boton ? { seVe: seVe(boton), w: Math.round(caja.width), h: Math.round(caja.height) } : null,
    secciones,
    faltanEnElPie: secciones.filter((href) => !pie.includes(href)),
    enlacesDelPie: pie.length,
  }
}

/**
 * El pase sin JavaScript, uno por tamaño de debajo de xl, en la primera página que cargó (VH-08 de la verificación
 * de la tanda 1, 16/11/2026): con los scripts apagados el botón del menú no abre nada, así que no se tiene que ver
 * (noscript:hidden en Header.jsx, que es @media (scripting: none)), y el camino a las secciones es el pie. Hasta
 * entonces la receta corría siempre con JavaScript y un botón que quedara a la vista sin él pasaba.
 */
async function revisarSinJavaScript(chrome, { ancho, alto, tactil, tamano, pagina }) {
  const anotar = (que, ok, esperaba = '', encontro = '') => {
    comprobaciones.push({ tamano, pagina, que, ok: Boolean(ok), esperaba, encontro: corto(encontro) })
    return Boolean(ok)
  }
  await chrome.tamano(ancho, alto, tactil)
  await chrome.send('Emulation.setScriptExecutionDisabled', { value: true })
  try {
    const carga = await chrome.ir(new URL(pagina, url).href, 0)
    if (carga.error || carga.status === null || carga.status >= 500) {
      anotar('sin JavaScript, la página carga', false, 'una respuesta de la página (no un error ni un 5xx)', carga.error ?? `estado ${carga.status}`)
      return
    }
    const r = await chrome.evaluar(`(${sinJavaScript})()`)
    if (r.xl) return
    if (r.scripting !== 'none') {
      // No es una falla del sitio: este navegador no deja probarlo así.
      avisos.add('con los scripts apagados, este Chrome no informa (scripting: none): no se probó que el botón del menú no se vea sin JavaScript')
      return
    }
    anotar('sin JavaScript, el botón del menú no se ve', !r.boton || !r.boton.seVe, 'el botón sin verse: sin JavaScript no abre nada', r.boton ?? 'no hay botón')
    anotar(
      'sin JavaScript, las secciones del menú están en el pie, a la vista',
      r.secciones.length > 0 && r.faltanEnElPie.length === 0,
      r.secciones,
      r.faltanEnElPie.length ? { faltan: r.faltanEnElPie } : `${r.enlacesDelPie} enlaces a la vista en el pie`,
    )
  } finally {
    await chrome.send('Emulation.setScriptExecutionDisabled', { value: false }).catch(() => {})
  }
}

/** Todas las comprobaciones de una página en un tamaño. */
async function revisarPagina(chrome, { ancho, alto, tactil, tamano, pagina, primera }) {
  const { send, evaluar, esperar, esperarQuieto } = chrome
  const anotar = (que, ok, esperaba = '', encontro = '') => {
    comprobaciones.push({ tamano, pagina, que, ok: Boolean(ok), esperaba, encontro: corto(encontro) })
    return Boolean(ok)
  }
  const leer = () => evaluar('__menuCheck.leer()')
  const cuadros = () => evaluar('__menuCheck.cuadros(2)')
  const dondeEsta = () => evaluar('location.pathname').catch(() => 'no se pudo leer')
  const toque = tactil ? 'un toque' : 'un clic'
  const tocar = async (p) => {
    if (tactil) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] })
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y })
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 })
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 })
    }
  }
  // Un gesto de scroll sobre el menú abierto: arrastrar con el dedo hacia arriba, o girar la rueda.
  const desplazar = async () => {
    const x = Math.round(ancho / 2)
    if (tactil) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: alto - 60 }] })
      for (let i = 1; i <= 8; i++) {
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: alto - 60 - i * 30 }] })
        await dormir(16)
      }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y: Math.round(alto / 2), deltaX: 0, deltaY: 300 })
    }
  }
  const tecla = async (key, vk) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: vk })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: vk })
  }
  /** Toca el botón del menú y espera a que se abra. */
  const abrir = async () => {
    const b = await evaluar('__menuCheck.puntoBoton()')
    if (!b) return false
    await tocar(b)
    const abrio = Boolean(await esperar('__menuCheck.abierto()', 2000))
    if (abrio) await cuadros()
    return abrio
  }
  /** Lo mismo, anotado: cada paso vuelve a abrir el menú con el botón. */
  const reabrir = async (para) => {
    const abrio = await abrir()
    return anotar(`${toque} en el botón vuelve a abrir el menú (${para})`, abrio, 'el <dialog> abierto', abrio ? 'se abrió' : 'no se abrió')
  }
  /** Deja el menú cerrado para el paso siguiente, pase lo que pase (no es una comprobación). */
  const asegurarCerrado = async () => {
    const cerrar = `(() => { const d = document.querySelector('header dialog'); if (d && d.open) d.close(); return true })()`
    await evaluar(cerrar).catch(() => {})
    await cuadros().catch(() => {})
  }
  const bloqueada = (s) => s.html.overflowY === 'hidden'
  const cerradoYLibre = (s) => Boolean(s.dialogo) && !s.dialogo.abierto && !s.dialogo.seVe && !bloqueada(s) && !s.html.lenisParado
  const comoQuedo = (s) => ({ abierto: s.dialogo?.abierto, seVe: s.dialogo?.seVe, ...s.html })
  // La consola, la CSP y los pedidos al propio sitio, de todo lo que se hizo en esta página.
  const consolaYRed = async () => {
    await dormir(50)
    const { consola, csp, fallidos } = chrome.visto
    anotar('nada en la consola', consola.length === 0, 'ningún error, aviso ni excepción', [...new Set(consola)])
    anotar('ninguna violación de la CSP', csp.length === 0, 'ninguna', [...new Set(csp)])
    anotar('ningún pedido al propio sitio fallido', fallidos.length === 0, 'ninguno', [...new Set(fallidos)])
  }

  await chrome.tamano(ancho, alto, tactil)
  chrome.limpiar()
  const direccion = new URL(pagina, url).href
  // Mientras ninguna página haya contestado, después de una que se quedó muda no se espera tanto a las que siguen:
  // un sitio colgado se nota en el primer tamaño y no cuesta 30 s por página (VH-13, 16/11/2026).
  const carga = await chrome.ir(direccion, esperaReact, contestaron === 0 && mudas > 0 ? TOPE_RESPUESTA_CORTO : TOPE_RESPUESTA)
  if (carga.sinRespuesta) mudas++
  else if (carga.status !== null && carga.status !== undefined) contestaron++
  if (carga.error || carga.status === null || carga.status >= 500) {
    anotar('la página carga', false, 'una respuesta de la página (no un error ni un 5xx)', carga.error ?? `estado ${carga.status}`)
    return
  }
  if (!carga.hidratada) esperaReact = 1200
  const esp = await evaluar('window.__menuCheck ? __menuCheck.esperado() : null')
  if (esp) {
    debajoDeXl = !esp.xl
    primeraLeida ??= pagina
  }
  if (!anotar('la página trae su estado (<script id="estado">)', esp, 'el estado que escribe el servidor', esp ? 'está' : 'no está o no se pudo leer')) return
  const hayMenuAncho = Boolean(esp.ancho) && esp.ancho.secciones.length + esp.ancho.entradas.length > 0
  const queTrae = hayMenuAncho ? esp.ancho.secciones.map((e) => e.texto) : 'no está o está vacío'
  if (!anotar('el menú ancho está en el HTML (de ahí salen las secciones que se esperan)', hayMenuAncho, 'la navegación del header, con sus secciones', queTrae)) return
  const esperadas = esp.ancho.secciones.map((e) => [e.texto, e.href])
  // La sección actual, por la dirección de la página; y la ruta que manda el servidor tiene que ser esa (VH-09).
  const actuales = esp.ancho.secciones.map((e) => actualEsperado(esp.ruta, e.href))
  anotar('la ruta del estado (estado.ruta) es la de la dirección', esp.rutaDelEstado === esp.direccion, esp.direccion, esp.rutaDelEstado ?? 'no está en el estado')
  let s = await leer()

  // ---------- Desde xl: no hay botón y va el menú ancho
  if (esp.xl) {
    const enlaces = [...esp.ancho.secciones, ...esp.ancho.entradas]
    const mal = enlaces.filter((e) => !e.seVe || !e.alPunto || e.izq < 0 || e.der > s.ancho + 0.5 || e.h < MINIMO)
    const destinos = esp.ancho.entradas.map((e) => e.destino)
    anotar('desde xl no hay botón del menú', !s.boton || !s.boton.seVe, 'el botón sin verse', s.boton?.seVe ?? 'no hay botón')
    anotar('desde xl el <dialog> del menú está cerrado', !s.dialogo || (!s.dialogo.abierto && !s.dialogo.seVe), 'cerrado y sin verse', comoQuedo(s))
    anotar('desde xl el menú ancho se ve', esp.ancho.seVe, 'la navegación del header a la vista', esp.ancho.seVe)
    anotar(
      'los enlaces del menú ancho se ven enteros, se pueden tocar y miden 44 de alto',
      mal.length === 0,
      'todos a la vista, dentro de la pantalla y de 44 px o más',
      mal.length ? mal : `${enlaces.length} enlaces bien`,
    )
    anotar(
      'el menú ancho marca la sección actual (aria-current)',
      esp.ancho.secciones.every((e, i) => e.actual === actuales[i]),
      actuales,
      esp.ancho.secciones.map((e) => e.actual),
    )
    if (esp.compra) {
      anotar('«Tickets» está en el menú ancho, con su dirección (la compra está activa)', destinos.length === 1 && destinos[0] === esp.compra, esp.compra, destinos)
    } else anotar('sin la compra activa no hay «Tickets» en el menú ancho', destinos.length === 0, 'ninguno', destinos)
    anotar('desde lg la barra de hoy no se ve', !s.barraAfuera?.seVe, 'sin barra', s.barraAfuera ?? 'no hay barra')
    await consolaYRed()
    return
  }

  // ---------- Debajo de xl. Cerrado
  const botonBien = s.boton && s.boton.seVe && s.boton.alPunto && s.boton.izq >= 0 && s.boton.der <= s.ancho + 0.5
  if (!anotar('el botón del menú se ve y se puede tocar', botonBien, 'a la vista, dentro de la pantalla y sin nada encima', s.boton ?? 'no hay botón')) {
    await consolaYRed()
    return
  }
  anotar('el botón mide al menos 44x44', s.boton.w >= MINIMO && s.boton.h >= MINIMO, '44x44 o más', `${s.boton.w}x${s.boton.h}`)
  anotar('el botón tiene nombre accesible', s.boton.nombre.length > 0, 'un nombre (aria-label)', s.boton.nombre)
  anotar('cerrado, el botón dice aria-expanded="false"', s.boton.expandido === 'false', 'false', s.boton.expandido)
  anotar(
    'el botón controla un <dialog> con nombre (aria-controls, aria-haspopup="dialog")',
    s.dialogo && s.boton.popup === 'dialog' && s.dialogo.nombre.length > 0,
    'un <dialog> con nombre',
    { popup: s.boton.popup, dialogo: s.dialogo?.nombre ?? null },
  )
  anotar('cerrado, el <dialog> no se ve', s.dialogo && !s.dialogo.abierto && !s.dialogo.seVe, 'cerrado y sin verse', comoQuedo(s))
  anotar('debajo de xl el menú ancho no se ve', !s.menuAncho, 'sin verse', s.menuAncho ? 'se ve' : 'no se ve')
  const antes = s.html

  // ---------- Abrir, con la página corrida unos píxeles (para ver que queda donde estaba)
  await evaluar(`scrollTo({ top: ${CORRIDA}, behavior: 'instant' })`)
  await esperarQuieto('Math.round(scrollY)', 100, 1500)
  const y0 = (await leer()).scrollY
  const abrio = await abrir()
  const noAbrio = carga.hidratada ? 'no se abrió' : 'no se abrió: la página no hidrató (el botón no tiene manejador)'
  if (!anotar(`${toque} en el botón abre el menú`, abrio, 'el <dialog> abierto', abrio ? 'se abrió' : noAbrio)) {
    await consolaYRed()
    return
  }
  s = await leer()
  if (capturas) {
    // El menú recién abierto, como se ve (solo la pantalla: sin recorte, la captura no cambia nada de la página).
    const foto = await send('Page.captureScreenshot', { format: 'png' })
    const nombre = `menu-${tamano}${pagina === '/' ? '-inicio' : pagina.replace(/[^A-Za-z0-9]+/g, '-')}.png`
    if (foto.result?.data) writeFileSync(join(capturas, nombre), Buffer.from(foto.result.data, 'base64'))
  }
  const caja = s.dialogo.caja
  const ocupa = Math.abs(caja.arriba) <= 1 && Math.abs(caja.izq) <= 1 && Math.abs(caja.w - s.ancho) <= 1.5 && Math.abs(caja.h - s.alto) <= 1.5
  anotar('abierto, es modal (showModal)', s.dialogo.modal, ':modal', s.dialogo.modal)
  anotar('abierto, el botón dice aria-expanded="true"', s.boton.expandido === 'true', 'true', s.boton.expandido)
  anotar('abierto, el foco queda adentro del menú', s.foco === 'cerrar' || s.foco === 'adentro', 'el foco adentro del <dialog>', s.foco)
  anotar('abierto, la página de atrás queda bloqueada (overflow hidden en html)', bloqueada(s), 'hidden', s.html)
  anotar('al abrir, la página no se movió', Math.abs(s.scrollY - y0) <= 1, y0, s.scrollY)
  anotar('el <dialog> ocupa la pantalla', ocupa, `${s.ancho}x${s.alto} desde 0,0`, `${caja.w}x${caja.h} desde ${caja.izq},${caja.arriba}`)
  anotar('el menú no desborda a lo ancho', s.dialogo.desbordaAncho <= 0, 'sin scroll horizontal', s.dialogo.desbordaAncho)
  anotar(
    'las secciones, en el orden y con los destinos de la navegación',
    JSON.stringify(s.secciones.map((e) => [e.texto, e.href])) === JSON.stringify(esperadas) && s.secciones.every((e) => e.seVe),
    esperadas,
    s.secciones.map((e) => [e.texto, e.href, e.seVe ? 'se ve' : 'NO se ve']),
  )
  anotar(
    'la sección actual, con su aria-current',
    s.secciones.length === actuales.length && s.secciones.every((e, i) => e.actual === actuales[i]),
    actuales,
    s.secciones.map((e) => e.actual),
  )
  const tickets = s.entradas.map((e) => [e.destino, e.seVe ? 'se ve' : 'NO se ve'])
  if (esp.compra) {
    const esta = s.entradas.length === 1 && s.entradas[0].seVe && s.entradas[0].destino === esp.compra
    anotar('«Tickets» está en el menú, con su dirección (la compra está activa)', esta, esp.compra, tickets)
  } else anotar('sin la compra activa no hay «Tickets» en el menú', s.entradas.length === 0, 'ninguno', tickets)
  const conBarra = !esp.lg && esp.abiertoHoy !== null
  if (conBarra) {
    const valor = esp.abiertoHoy ? 'abierto' : 'cerrado'
    const esta = s.barra && s.barra.seVe && s.barra.valor === valor && s.barra.horarios && s.barra.horarios.seVe
    anotar('la barra de hoy está adentro del menú, con su valor y su enlace', esta, `a la vista, con data-hoy="${valor}" y su enlace`, s.barra ?? 'no hay barra')
    // Lo que DICE cada barra, no solo su data-hoy (VH-10, 16/11/2026): «abierto» o «cerrado», según el estado, y sin
    // la otra palabra; y la del header (la de afuera del menú, que sigue dibujada detrás), igual que la de adentro.
    const otro = esp.abiertoHoy ? 'cerrado' : 'abierto'
    const palabra = (p) => new RegExp(`(^|[^\\p{L}])${p}([^\\p{L}]|$)`, 'iu')
    const dice = (texto) => typeof texto === 'string' && palabra(valor).test(texto) && !palabra(otro).test(texto)
    const comoElEstado = `un texto con «${valor}» y sin «${otro}» (abiertoHoy es ${esp.abiertoHoy})`
    anotar('la barra de hoy de adentro del menú dice lo que dice el estado (abierto o cerrado hoy)', dice(s.barra?.texto), comoElEstado, s.barra?.texto ?? 'no hay barra')
    const afuera = s.barraAfuera
    anotar(
      'la barra de hoy del header se ve y dice lo mismo que la de adentro del menú',
      afuera && afuera.seVe && afuera.valor === valor && dice(afuera.texto) && afuera.texto === s.barra?.texto,
      { valor, texto: s.barra?.texto ?? comoElEstado },
      afuera ?? 'no hay barra en el header',
    )
  } else {
    const que = esp.lg ? 'desde lg la barra de hoy no se ve adentro del menú' : 'sin horario (abiertoHoy null) no hay barra de hoy adentro del menú'
    anotar(que, !s.barra || !s.barra.seVe, 'sin barra', s.barra ? { seVe: s.barra.seVe } : 'no hay barra')
  }
  // Una sola barra de hoy en cada lugar (RT-01 de la re-verificación, 17/11/2026: se leía solo la primera, y con dos
  // iguales a la vista, adentro del menú o en el header, el visitante la veía dos veces y la receta daba ok). El HTML es
  // el mismo en todos los anchos: con horario va una adentro del menú y una en el header (desde lg, sin verse); sin
  // horario (abiertoHoy null), ninguna. Y ninguna en el resto de la página.
  const nBarras = esp.abiertoHoy === null ? 0 : 1
  const barras = s.barras ?? {}
  anotar(nBarras ? 'una sola barra de hoy adentro del menú' : 'ninguna barra de hoy adentro del menú', barras.adentro === nBarras, nBarras, barras.adentro)
  anotar(
    nBarras ? 'una sola barra de hoy afuera del menú, la del header' : 'ninguna barra de hoy afuera del menú',
    barras.afuera === nBarras && barras.enElHeader === nBarras,
    { afuera: nBarras, enElHeader: nBarras },
    { afuera: barras.afuera, enElHeader: barras.enElHeader },
  )
  // Y lo que se LEE (R2-02, 17/11/2026: con una copia sin data-hoy o la frase repetida dentro de la barra, el conteo de
  // arriba daba bien): debajo de lg y con horario, la frase una sola vez adentro del menú y una en el header; si no
  // (desde lg o sin horario), ninguna a la vista.
  // La frase es la de src/content.js (R3H-01, 18/11/2026): con la frase repetida dentro de la barra, la cuenta da 2; y
  // con horario, la barra tiene que decir exactamente esa frase (la que dice, recortada), también desde lg.
  const nFrases = !esp.lg && esp.abiertoHoy !== null ? 1 : 0
  const fr = s.frases ?? {}
  const fraseEsperada = esp.abiertoHoy === null ? null : esp.abiertoHoy ? FRASES.abierto : FRASES.cerrado
  anotar(
    nFrases
      ? 'la frase de la barra de hoy (la de src/content.js) se lee una sola vez adentro del menú y una en el header, y la barra dice esa frase'
      : 'la frase de la barra de hoy no se lee (desde lg o sin horario)',
    fr.adentro === nFrases && fr.header === nFrases && !fr.otraAdentro && !fr.otraHeader && (fraseEsperada === null || fr.leida === fraseEsperada),
    { adentro: nFrases, header: nFrases, otraAdentro: 0, otraHeader: 0, leida: fraseEsperada },
    fr,
  )
  anotar('el menú abierto deja la rueda y el dedo para él (data-lenis-prevent en el <dialog>)', s.lenisPrevent === true, 'data-lenis-prevent', s.lenisPrevent)
  anotar(
    'la cruz se ve, mide 44x44 y tiene nombre',
    s.cerrar && s.cerrar.seVe && s.cerrar.w >= MINIMO && s.cerrar.h >= MINIMO && s.cerrar.nombre.length > 0,
    'un botón de cerrar de 44x44 con nombre',
    s.cerrar ?? 'no hay botón adentro del <dialog>',
  )
  const chicos = s.controles.filter((c) => c.w < MINIMO || c.h < MINIMO).map((c) => `${c.nombre}: ${c.w}x${c.h}`)
  anotar('ningún control del menú de menos de 44 px', chicos.length === 0, 'todos de 44 o más', chicos.length ? chicos : `${s.controles.length} controles bien`)
  // La página de atrás no se mueve con un gesto sobre el menú; y si el menú no entra, se desplaza por dentro.
  const entra = s.dialogo.contenido <= s.dialogo.alto + 1
  await desplazar()
  await dormir(300)
  let s2 = await leer()
  anotar(
    `con el menú abierto, ${tactil ? 'arrastrar con el dedo' : 'la rueda'} no mueve la página de atrás`,
    Math.abs(s2.scrollY - y0) <= 1 && s2.dialogo.abierto,
    y0,
    { scrollY: s2.scrollY, abierto: s2.dialogo.abierto },
  )
  if (entra) {
    const afuera = s.controles.filter((c) => c.arriba < -0.5 || c.abajo > s.alto + 0.5).map((c) => `${c.nombre}: de ${c.arriba} a ${c.abajo}`)
    const entran = `${s.controles.length} controles, el contenido mide ${s.dialogo.contenido}`
    anotar('el menú entra en la pantalla: todos sus controles a la vista', afuera.length === 0, `todos entre 0 y ${s.alto}`, afuera.length ? afuera : entran)
  } else {
    const medidas = { contenido: s.dialogo.contenido, alto: s.dialogo.alto, scrollTop: s2.dialogo.scrollTop }
    anotar('el menú no entra en la pantalla y se desplaza por dentro', s2.dialogo.scrollTop > 0, 'el scroll de adentro del menú mayor que 0', medidas)
    await evaluar(`__menuCheck.menuA('abajo')`)
    await cuadros()
    s2 = await leer()
    const ultimo = s2.controles.at(-1)
    const llega = ultimo && ultimo.abajo <= s2.alto + 0.5 && ultimo.alPunto
    anotar('desplazando el menú se llega al último control', llega, `el último control entero dentro de ${s2.alto} y sin nada encima`, ultimo ?? 'no hay controles')
  }
  await evaluar(`__menuCheck.menuA('arriba')`)
  await cuadros()
  // Lo que no es un enlace no lo cierra.
  const libre = await evaluar('__menuCheck.puntoLibre()')
  if (libre) {
    await tocar(libre)
    await dormir(200)
    s2 = await leer()
    anotar(`${toque} fuera de los enlaces no cierra el menú`, s2.dialogo.abierto, 'sigue abierto', comoQuedo(s2))
  } else avisos.add('no se encontró un punto del menú sin enlaces para probar que un toque ahí no lo cierra')

  // ---------- Escape y la cruz
  const alCerrar = (como, e) => {
    const libreDeNuevo = { overflowY: antes.overflowY, enLinea: antes.enLinea, lenisParado: false }
    anotar(`${como} cierra el menú`, e.dialogo && !e.dialogo.abierto && !e.dialogo.seVe, 'el <dialog> cerrado y sin verse', comoQuedo(e))
    anotar(`${como}: el botón vuelve a decir aria-expanded="false"`, e.boton?.expandido === 'false', 'false', e.boton?.expandido)
    anotar(`${como}: el foco vuelve al botón del menú`, e.foco === 'boton', 'el foco en el botón', e.foco)
    anotar(`${como}: la página queda donde estaba`, Math.abs(e.scrollY - y0) <= 1, y0, e.scrollY)
    anotar(`${como}: la página queda desbloqueada`, !bloqueada(e) && e.html.enLinea === antes.enLinea && !e.html.lenisParado, libreDeNuevo, e.html)
    anotar(`${como}: el botón se puede volver a tocar`, e.boton?.alPunto, 'el botón a la vista, sin nada encima', e.boton ?? 'no hay botón')
  }
  await tecla('Escape', 27)
  await esperar('!__menuCheck.abierto()', 1500)
  await cuadros()
  alCerrar('Escape', await leer())
  await asegurarCerrado()

  if (await reabrir('para cerrarlo con la cruz')) {
    const cruz = (await leer()).cerrar
    if (cruz) await tocar(cruz)
    await esperar('!__menuCheck.abierto()', 1500)
    await cuadros()
    alCerrar('la cruz', await leer())
  }
  await asegurarCerrado()

  // ---------- Un enlace de adentro: cierra, navega, y Atrás vuelve con el menú cerrado
  const aOtra = s.secciones.findIndex((e) => e.href !== s.ruta && e.href.startsWith('/'))
  const otra = aOtra >= 0 ? s.secciones[aOtra].href : null
  const enOtra = `location.pathname === ${JSON.stringify(otra)} && document.readyState === 'complete' && Boolean(window.__menuCheckShow) && Boolean(window.__menuCheck)`
  const deVuelta = `location.pathname === ${JSON.stringify(s.ruta)} && document.readyState === 'complete' && window.__menuCheckShow`
  if (!otra) avisos.add(`${pagina}: el menú no tiene una sección que lleve a otra página; no se probó navegar desde él`)
  else if (await reabrir('para tocar una sección')) {
    const destino = await evaluar(`__menuCheck.seccion(${aOtra})`)
    await evaluar(`(() => { window.__menuCheckShow = null; __menuCheck.salida(); return true })()`)
    await tocar(destino)
    const llego = await esperar(enOtra, 10000)
    if (anotar(`${toque} en una sección del menú navega a su página`, llego, otra, await dondeEsta())) {
      const salida = await evaluar('__menuCheck.salida()')
      const alIrse = salida && salida.abierto === false && salida.overflowY !== 'hidden' && !salida.lenisParado
      const esperaba = { abierto: false, overflowY: antes.overflowY, lenisParado: false }
      anotar('al tocar el enlace, el menú se cerró y la página quedó desbloqueada antes de irse', alIrse, esperaba, salida ?? 'no quedó anotado')
      const nueva = await leer()
      anotar('la página nueva llega con el menú cerrado y desbloqueada', cerradoYLibre(nueva), 'cerrado y sin bloquear', comoQuedo(nueva))
      await evaluar(`setTimeout(() => history.back(), 0)`)
      const volvio = await esperar(deVuelta, 10000)
      if (anotar('Atrás vuelve a la página', volvio, s.ruta, await dondeEsta())) {
        await esperar('__menuCheck.hidratada()', esperaReact)
        await cuadros()
        const e = await leer()
        bfcache.desdeUnEnlace.vueltas++
        if (volvio.persisted) bfcache.desdeUnEnlace.delBfcache++
        anotar(
          'al volver con Atrás, el menú está cerrado y la página desbloqueada',
          cerradoYLibre(e) && e.boton?.expandido === 'false',
          'cerrado y sin bloquear',
          { ...comoQuedo(e), expandido: e.boton?.expandido, delBfcache: volvio.persisted },
        )
      }
    }
    // Si quedó en cualquier lado, vuelve a la página para seguir.
    if ((await dondeEsta()) !== s.ruta) await chrome.ir(direccion, esperaReact)
  }
  await asegurarCerrado()

  // ---------- Con el menú abierto, irse sin pasar por un enlace del menú y volver: del bfcache vuelve cerrado
  if (otra && primera && (await reabrir('para irse con el menú abierto'))) {
    await evaluar(`(() => { window.__menuCheckShow = null; setTimeout(() => location.assign(${JSON.stringify(otra)}), 0); return true })()`)
    const llego = await esperar(enOtra, 10000)
    if (llego) await evaluar(`setTimeout(() => history.back(), 0)`)
    const volvio = llego ? await esperar(deVuelta, 10000) : null
    if (anotar('con el menú abierto, la página se va a otra y Atrás vuelve', volvio, s.ruta, await dondeEsta())) {
      await esperar('__menuCheck.hidratada()', esperaReact)
      await cuadros()
      const e = await leer()
      bfcache.conElMenuAbierto.vueltas++
      if (volvio.persisted) bfcache.conElMenuAbierto.delBfcache++
      anotar(
        volvio.persisted
          ? 'al volver del bfcache con el menú abierto, se cierra y la página queda desbloqueada'
          : 'al volver (sin bfcache: la página se cargó de nuevo), el menú está cerrado y la página desbloqueada',
        cerradoYLibre(e) && e.boton?.expandido === 'false',
        'cerrado y sin bloquear',
        { ...comoQuedo(e), expandido: e.boton?.expandido },
      )
    }
    if ((await dondeEsta()) !== s.ruta) await chrome.ir(direccion, esperaReact)
  }
  await asegurarCerrado()

  // ---------- «Horarios» de la barra de adentro, en la página adonde lleva (Visitas)
  if (conBarra && s.barra?.horarios?.ruta === s.ruta) {
    if (await reabrir('para tocar «Horarios»')) {
      const h = await evaluar('__menuCheck.horarios()')
      const seToca = h && h.alPunto && h.h >= MINIMO && h.w >= MINIMO
      if (anotar('«Horarios» de adentro del menú se puede tocar y mide 44 de alto', seToca, 'a la vista, sin nada encima y de 44 px', h ?? 'no está')) {
        const dondeQuedo = `__menuCheck.destino(${JSON.stringify(h.ancla)})`
        await tocar(h)
        await esperar('!__menuCheck.abierto()', 1500)
        // El scroll al ancla: el del navegador o, con mouse, el de Lenis, que es animado.
        await esperarQuieto(dondeQuedo, 200, 5000)
        const e = await leer()
        const t = await evaluar(dondeQuedo)
        // Arriba, a su scroll-margin-top del borde; o lo más arriba que deja una página corta, que ya llegó al final.
        const aLaVista = t && t.arriba >= -1 && (t.arriba <= t.margen + 2 || (t.alFinal && t.arriba < t.alto - 40))
        anotar('«Horarios» en su propia página cierra el menú y desbloquea la página', cerradoYLibre(e), 'cerrado y sin bloquear', comoQuedo(e))
        anotar('«Horarios» pone el ancla en la dirección', e.ruta === h.ruta && e.hash === h.ancla, h.ruta + h.ancla, e.ruta + e.hash)
        anotar(
          'la tarjeta Horarios queda a la vista, arriba',
          aLaVista,
          t ? `la tarjeta a ${t.margen} px del borde de arriba (su scroll-margin-top)` : `un elemento con el id de ${h.ancla}`,
          t ?? 'no existe',
        )
      }
    }
    await asegurarCerrado()
    await evaluar(`scrollTo({ top: 0, behavior: 'instant' })`)
    await esperarQuieto('Math.round(scrollY)', 100, 1500)
  }

  // ---------- Con el menú abierto, la ventana se agranda hasta xl
  if (await reabrir('para agrandar la ventana')) {
    await send('Emulation.setDeviceMetricsOverride', { width: esp.anchoXl, height: alto, deviceScaleFactor: 1, mobile: tactil })
    await esperar('!__menuCheck.abierto()', 2000)
    await cuadros()
    const e = await leer()
    anotar('al agrandar la ventana hasta xl con el menú abierto, se cierra y la página queda desbloqueada', cerradoYLibre(e), 'cerrado y sin bloquear', comoQuedo(e))
    anotar(
      'a ese ancho ya no se ve el botón y sí el menú ancho',
      e.menuAncho && !e.boton?.seVe,
      'el menú ancho a la vista y el botón no',
      { menuAncho: e.menuAncho, boton: e.boton?.seVe },
    )
  }
  await consolaYRed()
}

borrarPerfilesViejos()
if (capturas) mkdirSync(capturas, { recursive: true })
const inicio = Date.now()
const porTamano = {}
let navegador = null
process.on('SIGINT', () => {
  // Si la cortan con Ctrl+C, no deja su Chrome vivo ni su perfil temporal en %TEMP% (VH-12, 16/11/2026: hasta entonces
  // quedaba la carpeta cdp-menu-XXXXXX del Chrome en curso, de 1 a 12 MB por corte). Todo sincrónico, así nada más
  // corre mientras tanto: se termina a SU Chrome por el PID del proceso que se lanzó acá, con todos sus procesos (en
  // Windows, taskkill /T /F: RT-03, 17/11/2026; hasta entonces solo el principal, y los hijos seguían unos segundos con
  // los archivos abiertos), y se borra su perfil, con reintentos, hasta unos 10 s (eran 3). Si a la herramienta la
  // matan de golpe (sin Ctrl+C), no se entera y la carpeta queda: la borra la corrida siguiente, si tiene más de una
  // hora (borrarPerfilesViejos).
  for (const { pid } of enCurso) terminarArbol(pid)
  for (const { perfil } of enCurso) borrarPerfil(perfil)
  process.exit(130)
})
let noResponde = false
for (const [indice, [ancho, alto]] of tamanos.entries()) {
  const tamano = `${ancho}x${alto}`
  const desde = Date.now()
  const antes = comprobaciones.length
  let chrome = null
  debajoDeXl = null
  primeraLeida = null
  try {
    for (let intento = 0; !chrome; intento++) {
      try {
        chrome = await abrirChrome()
      } catch (e) {
        if (intento === 2) throw e
      }
    }
    navegador = chrome.version
    const tactil = ancho < anchoTactil
    for (const [i, pagina] of paginas.entries()) {
      try {
        await revisarPagina(chrome, { ancho, alto, tactil, tamano, pagina, primera: i === 0 })
      } catch (e) {
        const esperaba = 'sin errores de la herramienta ni del navegador'
        comprobaciones.push({ tamano, pagina, que: 'la revisión de la página termina', ok: false, esperaba, encontro: corto(e.message) })
      }
    }
    if (indice === 0 && contestaron === 0) {
      // Ninguna página del primer tamaño tuvo respuesta: el sitio no responde. Se corta acá, con ok false, en vez de
      // esperar cada página de cada tamaño (con el sitio colgado eran unos 20 minutos: VH-13).
      noResponde = true
      const encontro = `ninguna de las ${paginas.length} páginas del primer tamaño tuvo respuesta: el sitio no responde (no se revisó nada más)`
      comprobaciones.push({ tamano, pagina: null, que: 'el sitio responde', ok: false, esperaba: 'una respuesta de alguna página', encontro })
    } else if (debajoDeXl) {
      try {
        await revisarSinJavaScript(chrome, { ancho, alto, tactil, tamano, pagina: primeraLeida })
      } catch (e) {
        const esperaba = 'sin errores de la herramienta ni del navegador'
        comprobaciones.push({ tamano, pagina: primeraLeida, que: 'el pase sin JavaScript termina', ok: false, esperaba, encontro: corto(e.message) })
      }
    }
  } catch (e) {
    comprobaciones.push({ tamano, pagina: null, que: 'Chrome abre', ok: false, esperaba: 'Chrome headless por CDP', encontro: corto(e.message) })
  } finally {
    if (chrome) await chrome.cerrar()
  }
  const deEste = comprobaciones.slice(antes)
  const malas = deEste.filter((c) => !c.ok).length
  porTamano[tamano] = { comprobaciones: deEste.length, fallas: malas, segundos: Math.round((Date.now() - desde) / 100) / 10 }
  console.error(`${tamano}: ${deEste.length - malas} de ${deEste.length} bien (${porTamano[tamano].segundos} s)`)
  if (noResponde) {
    console.error('El sitio no responde: no se revisaron los demás tamaños.')
    break
  }
}
const sinBfcache = bfcache.conElMenuAbierto.vueltas - bfcache.conElMenuAbierto.delBfcache
if (sinBfcache > 0) {
  avisos.add(
    `el navegador no usó el bfcache en ${sinBfcache} de ${bfcache.conElMenuAbierto.vueltas} vueltas con el menú abierto: ahí la página se cargó de nuevo y la vuelta no prueba el cierre`,
  )
}
const fallas = comprobaciones.filter((c) => !c.ok).map(({ ok, ...c }) => c)
const salida = {
  ok: fallas.length === 0 && comprobaciones.length > 0,
  url,
  navegador,
  externos: soloLocal ? 'bloqueados (URL local)' : 'permitidos',
  tamanos: tamanos.map(([w, h]) => `${w}x${h}`),
  paginas,
  comprobaciones: comprobaciones.length,
  fallas,
  avisos: [...avisos],
  bfcache,
  porTamano,
  segundos: Math.round((Date.now() - inicio) / 100) / 10,
}
if (conDetalle) salida.detalle = comprobaciones
console.log(JSON.stringify(salida, null, 2))
process.exit(salida.ok ? 0 : 1)
