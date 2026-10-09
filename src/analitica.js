// Medición de visitas con Google Analytics 4 (elección del desarrollador, 29/09/2026; las alternativas eran un servicio
// sin cookies o quedarse solo con Search Console).
//
// ID de medición de la propiedad de GA4 (Administrar > Flujos de datos > Web: empieza con "G-"). Es público: viaja en
// cada página que mide. Vacío = no se mide nada y no se carga ningún script de Google. Cargado el 01/10/2026 (flujo
// "Sitio MuPa", propiedad mupa.ar, creada por el desarrollador).
const GA4_ID = 'G-KX4G76DL91'

// No mide:
// - en desarrollo ni en la vista previa del museo (solo en el build de producción);
// - en las pruebas automáticas (tools/measure.mjs y tools/vitals.mjs abren Chrome con --enable-automation, igual que
//   Lighthouse y compañía): las recetas contra mupa.ar no cuentan como visitas;
// - si la persona pidió que no la rastreen (Do Not Track o Global Privacy Control del navegador).
const activa = () =>
  Boolean(GA4_ID) &&
  import.meta.env.MODE === 'production' &&
  !navigator.webdriver &&
  navigator.doNotTrack !== '1' &&
  !navigator.globalPrivacyControl

// Secciones cuya llegada se registra, una vez por carga: cuentan hasta dónde baja la gente.
const SECCIONES = { identidad: 'ver_identidad', obra: 'ver_obra', areas: 'ver_areas' }
const PIE = 'ver_pie'
// ms después de un clic en que la apertura de una banda se toma como hecha con ese clic (si no, la abrió el scroll).
const VENTANA_CLIC = 1000

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
  // El pie es bajo y está al final: nunca llega al centro de la pantalla. Cuenta cuando se ve la mitad.
  const pie = document.querySelector('footer')
  if (!pie) return
  const alFinal = new IntersectionObserver(
    ([entrada]) => {
      if (!entrada.isIntersecting) return
      alFinal.disconnect()
      registrar(PIE, { seccion: 'pie' })
    },
    { threshold: 0.5 },
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

function arrancar() {
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
  medirSecciones()
  medirAreas()
}

// Arranca con la página ya cargada y el navegador en reposo: el script de Google (~150 kB) no compite con la foto del
// hero ni con el arranque de los efectos.
export default function iniciarAnalitica() {
  if (!activa()) return
  const enReposo = () => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(arrancar, { timeout: 4000 })
    else setTimeout(arrancar, 1500)
  }
  if (document.readyState === 'complete') enReposo()
  else window.addEventListener('load', enReposo, { once: true })
}
