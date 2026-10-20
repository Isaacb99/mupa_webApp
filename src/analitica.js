// Medición de visitas con Google Analytics 4 (elección del desarrollador, 29/09/2026; las alternativas eran un servicio
// sin cookies o quedarse solo con Search Console).
//
// ID de medición de la propiedad de GA4 (Administrar > Flujos de datos > Web: empieza con "G-"). Es público: viaja en
// cada página que mide. Vacío = no se mide nada y no se carga ningún script de Google. Cargado el 01/10/2026 (flujo
// "Sitio MuPa", propiedad mupa.ar, creada por el desarrollador).
const GA4_ID = 'G-KX4G76DL91'

// No mide:
// - si el servidor no lo pide (estado.medir): solo se mide en producción y con el host público (mupa.ar). En
//   desarrollo, en la prueba local sin NODE_ENV=production y en mupa-web.onrender.com antes del corte, no (plan 6.6);
// - en las pruebas automáticas (tools/measure.mjs y tools/vitals.mjs abren Chrome con --enable-automation, igual que
//   Lighthouse y compañía): las recetas contra mupa.ar no cuentan como visitas;
// - si la persona pidió que no la rastreen (Do Not Track o Global Privacy Control del navegador).
const activa = (estado) =>
  Boolean(GA4_ID) &&
  estado?.medir === true &&
  !navigator.webdriver &&
  navigator.doNotTrack !== '1' &&
  !navigator.globalPrivacyControl

// Secciones cuya llegada se registra, una vez por carga: cuentan hasta dónde baja la gente.
const SECCIONES = { identidad: 'ver_identidad', obra: 'ver_obra', areas: 'ver_areas' }
const PIE = 'ver_pie'
// ms después de un clic en que la apertura de una banda se toma como hecha con ese clic (si no, la abrió el scroll).
const VENTANA_CLIC = 1000
// Los umbrales con que se mira el pie: de 5 en 5 % hasta la mitad (ver pieVisto).
const UMBRALES_PIE = Array.from({ length: 10 }, (_, i) => (i + 1) / 20)

/**
 * ¿Se vio el pie? Cuando se ve la mitad de él o, si es más alto que la pantalla, cuando ocupa media pantalla. Con un
 * umbral fijo de 0,5, un pie de más de dos pantallas no contaba nunca: el pie crece con los datos del museo y, con todo
 * lo que admite el panel, en el celular mide 1400 px o más (HOME-01 de la verificación de E4).
 * @param {IntersectionObserverEntry} entrada
 */
export function pieVisto({ isIntersecting, intersectionRect, boundingClientRect, rootBounds }) {
  if (!isIntersecting) return false
  const pantalla = rootBounds?.height ?? window.innerHeight
  // Medio píxel de tolerancia: las medidas del observador vienen redondeadas.
  return intersectionRect.height >= Math.min(boundingClientRect.height, pantalla) / 2 - 0.5
}

function gtag() {
  // gtag.js espera el objeto arguments tal cual, no un array.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
}

// El nombre del evento ya dice qué pasó (ver_obra, abrir_ciencia): así aparece en los informes de GA4 sin tener que
// registrar dimensiones personalizadas. Los datos van igual, por si más adelante se registran.
function registrar(evento, datos) {
  gtag('event', evento, datos)
}

function medirSecciones() {
  const vistas = new Set()
  // Cuenta cuando la sección cruza la franja central de la pantalla (del 40 % al 60 % del alto): pasar de largo con
  // Fin o con un ancla no la da por vista.
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const { isIntersecting, target } of entradas) {
        if (!isIntersecting) continue
        const evento = SECCIONES[target.id]
        observador.unobserve(target)
        if (!evento || vistas.has(evento)) continue
        vistas.add(evento)
        registrar(evento, { seccion: target.id })
      }
    },
    { rootMargin: '-40% 0px -40% 0px' },
  )
  for (const id of Object.keys(SECCIONES)) {
    const seccion = document.getElementById(id)
    if (seccion) observador.observe(seccion)
  }
  // El pie está al final y puede no llegar nunca al centro de la pantalla: cuenta cuando se ve la mitad de él (o media
  // pantalla, si es más alto: pieVisto).
  const pie = document.querySelector('footer')
  if (!pie) return
  const alFinal = new IntersectionObserver(
    ([entrada]) => {
      if (!pieVisto(entrada)) return
      alFinal.disconnect()
      registrar(PIE, { seccion: 'pie' })
    },
    { threshold: UMBRALES_PIE },
  )
  alFinal.observe(pie)
}

// Bandas de Áreas: registra la primera vez que se abre cada una y si fue con un clic o porque el scroll llegó a ella
// (useAcordeonScroll). Se lee del aria-expanded del botón, sin tocar los componentes.
function medirAreas() {
  const areas = document.getElementById('areas')
  if (!areas) return
  let clic = { boton: null, momento: 0 }
  areas.addEventListener(
    'click',
    (e) => {
      const boton = e.target.closest?.('button[aria-expanded]')
      if (boton) clic = { boton, momento: performance.now() }
    },
    true,
  )
  const registradas = new Set()
  const observador = new MutationObserver((cambios) => {
    for (const { target: boton } of cambios) {
      if (boton.getAttribute('aria-expanded') !== 'true') continue
      const area = (boton.getAttribute('aria-controls') ?? '').replace('panel-', '')
      const origen = clic.boton === boton && performance.now() - clic.momento < VENTANA_CLIC ? 'clic' : 'scroll'
      const clave = `${area}:${origen}`
      if (!area || registradas.has(clave)) continue
      registradas.add(clave)
      registrar(`abrir_${area}`, { area, origen })
    }
  })
  for (const boton of areas.querySelectorAll('button[aria-expanded]')) {
    observador.observe(boton, { attributes: true, attributeFilter: ['aria-expanded'] })
  }
}

// "Comprar entradas" (E4.7, plan 6.6): el clic en cualquier enlace de compra (los que llevan data-entradas: el del
// menú, el del menú del celular y el de Visitas), en todas las páginas. El enlace lleva a otro sitio y la página se va
// enseguida: GA4 manda sus eventos con sendBeacon, que sale aunque la página se cierre (no hace falta pedirlo).
// origen: menu (el del header) o pagina (el de adentro de la página).
function medirEntradas(estado) {
  document.addEventListener(
    'click',
    (e) => {
      const enlace = e.target.closest?.('a[data-entradas]')
      if (!enlace) return
      registrar('clic_entradas', { origen: enlace.closest('main') ? 'pagina' : 'menu', pagina: estado.pagina })
    },
    true,
  )
}

// Un mensaje del formulario de contacto (E4.5, plan 6.6): se llega a /contacto?enviado=<marca> con el 303 de POST
// /contacto, y estado.datos.enviado es true solo si la marca la firmó el servidor hace menos de 10 minutos
// (server/paginas.js): abrir una dirección con ?enviado= guardada o compartida no cuenta (CON-04 de la verificación de
// E4). Solo en una navegación nueva: si la persona recarga esa página o vuelve a ella con Atrás, no se cuenta otra vez.
function medirContacto(estado) {
  if (estado.pagina !== 'contacto' || estado.datos?.enviado !== true) return
  const navegacion = performance.getEntriesByType?.('navigation')?.[0]
  if (navegacion && navegacion.type !== 'navigate') return
  registrar('enviar_contacto', { formulario: 'contacto' })
}

function arrancar(estado) {
  window.dataLayer = window.dataLayer || []
  gtag('js', new Date())
  gtag('config', GA4_ID, {
    // Solo medición: sin cruce con cuentas de Google ni datos para publicidad, y la cookie dura 13 meses en vez de 2 años.
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 60 * 60 * 24 * 395,
  })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
  document.head.append(script)
  // En todas las páginas: el clic en "Comprar entradas" y, en /contacto, el mensaje enviado (E4.7, plan 6.6).
  medirEntradas(estado)
  medirContacto(estado)
  // Las secciones y las bandas son de la Home: en otra página (la 404, y desde E4 las internas, que son cortas)
  // cualquier <footer> dispararía ver_pie (plan 6.6). page_view sale en todas.
  if (estado.pagina !== 'home') return
  medirSecciones()
  medirAreas()
}

// Arranca con la página ya cargada y el navegador en reposo: el script de Google (~150 kB) no compite con la foto del
// hero ni con el arranque de los efectos. Recibe el estado de la página (src/main.jsx).
export default function iniciarAnalitica(estado) {
  if (!activa(estado)) return
  const enReposo = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => arrancar(estado), { timeout: 4000 })
    else setTimeout(() => arrancar(estado), 1500)
  }
  if (document.readyState === 'complete') enReposo()
  else window.addEventListener('load', enReposo, { once: true })
}
