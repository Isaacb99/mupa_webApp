// <head> de cada página, JSON-LD, robots.txt y sitemap.xml (plan 6.4 y 6.5).
// El <head> lo arma el servidor (no se usa el <title> de React 19). Lo de la Home es idéntico en contenido a lo que
// publicaba el index.html de la landing (tools/salida/home-publicada.html): mismo título, descripción, Open Graph,
// tarjeta de Twitter, íconos, color y datos estructurados; cambian solo los comentarios, los espacios del JSON y que
// los íconos van con ruta absoluta (/favicon.svg), porque ahora hay más de una página.
//
// Reglas:
// - canonical, og:url, og:image y los @id del JSON-LD, siempre con URL_PUBLICA (https://mupa.ar/ en producción),
//   aunque el pedido llegue por mupa-web.onrender.com;
// - <meta name="robots" content="noindex"> si el host no es el público de producción (la cabecera X-Robots-Tag la
//   pone server/seguridad.js);
// - todo valor va escapado como HTML, y el JSON-LD con jsonEnScript(), el mismo escape que el estado.
// Desde E4.6 (plan 6.4 y 6.5), las páginas internas: título "<Título> · MuPa"; la descripción, el resumen de la muestra
// o la novedad (hasta 160 caracteres, cortado en una palabra) o una línea neutra para las páginas fijas; og:image con el
// og.jpg de la portada y sus medidas (o /og.jpg); el JSON-LD con un @graph: Museum en todas (con dirección, teléfono,
// correo, redes y horario si están cargados: nunca se inventan) y NewsArticle en las novedades. El sitemap suma las
// páginas fijas y las muestras y novedades publicadas (también las finalizadas o realizadas), con su lastmod.

import { urlPublica as rutaDeContenido } from '../compartido/contenidos.js'
import { hoyEnSanJuan } from '../compartido/fechas.js'
import { urlFoto } from '../compartido/fotos.js'

/** Escapa texto para meterlo en HTML (contenido o atributo entre comillas dobles). */
export function escaparHtml(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
}

// Lo que no puede quedar literal dentro de un script: "<" y los separadores U+2028 y U+2029. Se arman con sus códigos
// (escritos tal cual en el código fuente, un U+2028 dentro de una expresión regular sería un salto de línea).
const BARRA = String.fromCharCode(92)
const SEP_LINEA = String.fromCharCode(0x2028)
const SEP_PARRAFO = String.fromCharCode(0x2029)
const PELIGROSOS = new RegExp(`[<${SEP_LINEA}${SEP_PARRAFO}]`, 'g')
const ESCAPES = { '<': `${BARRA}u003c`, [SEP_LINEA]: `${BARRA}u2028`, [SEP_PARRAFO]: `${BARRA}u2029` }

/**
 * JSON para un <script type="application/json"> o "application/ld+json": sin "<" (nada puede cerrar el script ni
 * abrir un comentario) ni U+2028/U+2029 (separadores de línea que algunos analizadores de JS no aceptan en textos).
 * Quedan como escapes de JSON: JSON.parse devuelve el mismo texto.
 */
export function jsonEnScript(valor) {
  return JSON.stringify(valor).replace(PELIGROSOS, (c) => ESCAPES[c])
}

// Textos de la Home: los del index.html publicado. La descripción está armada con las palabras del museo (el texto
// del eje narrativo de Identidad), en 160 caracteres, que es lo que Google llega a mostrar. A validar con el museo.
const NOMBRE_SITIO = 'MuPa - Museo Paleontológico de San Juan'
const HOME = {
  titulo: NOMBRE_SITIO,
  descripcion:
    'Museo Paleontológico de San Juan: divulgación, educación y preservación del patrimonio del Período Triásico, ' +
    'principalmente del Parque Provincial Ischigualasto.',
  // La tarjeta al compartir el link lleva el lema y no la descripción (como en la landing).
  ogDescripcion: 'Un museo de sanjuaninos, hecho por sanjuaninos.',
}
// Tarjeta al compartir el link (WhatsApp, Instagram, X): foto del hero con el logo, 1200x630 (public/og.jpg).
const OG_IMAGEN = {
  archivo: 'og.jpg',
  ancho: 1200,
  alto: 630,
  alt: 'Fachada del Museo Paleontológico de San Juan con el logo MuPa',
}

// El museo para los datos estructurados: lo de siempre (nombre, logo, imagen, descripción, provincia y país) y, desde
// E4.6, lo que el museo cargue en el panel (estado.museo): la dirección, el teléfono, el correo, las redes y el horario
// por franja. Lo vacío se omite: no se inventa ningún dato. El logo es el ícono de 180 px: Google lo pide de 112 px o
// más y que se vea bien sobre blanco.
const NOMBRE_MUSEO = 'Museo Paleontológico de San Juan'
const DESCRIPCION_MUSEO =
  'Institución dedicada en exclusividad a la divulgación, educación y preservación del patrimonio del Período ' +
  'Triásico, principalmente proveniente del Parque Provincial Ischigualasto (Patrimonio de la Humanidad por la ' +
  'UNESCO).'
const DIAS_SCHEMA = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

const lleno = (v) => typeof v === 'string' && v.trim() !== ''
/** Un objeto sin las claves vacías (undefined, null, "" o una lista vacía). */
const sinVacios = (objeto) =>
  Object.fromEntries(
    Object.entries(objeto).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)),
  )

/**
 * El horario como OpeningHoursSpecification (plan 6.4): una por franja, con los días que la comparten. Sin ningún día
 * abierto (el horario sin cargar), ninguna.
 * @param {{ dia: number, abierto: boolean, franjas: { abre: string, cierra: string }[] }[]} horarios
 */
export function horarioSchema(horarios) {
  const porFranja = new Map()
  for (const h of Array.isArray(horarios) ? horarios : []) {
    if (!h?.abierto || !Number.isInteger(h.dia) || h.dia < 1 || h.dia > 7) continue
    for (const f of Array.isArray(h.franjas) ? h.franjas : []) {
      if (!HORA.test(f?.abre) || !HORA.test(f?.cierra)) continue
      const clave = `${f.abre}-${f.cierra}`
      if (!porFranja.has(clave)) porFranja.set(clave, { abre: f.abre, cierra: f.cierra, dias: [] })
      porFranja.get(clave).dias.push(h.dia)
    }
  }
  return [...porFranja.values()]
    .sort((a, b) => (a.abre < b.abre ? -1 : a.abre > b.abre ? 1 : 0))
    .map(({ abre, cierra, dias }) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [...new Set(dias)].sort((a, b) => a - b).map((d) => `https://schema.org/${DIAS_SCHEMA[d - 1]}`),
      opens: abre,
      closes: cierra,
    }))
}

/** El nodo Museum (en todas las páginas, plan 6.4), con @id absoluto. */
export function museoSchema(url, museo) {
  const m = museo ?? {}
  return sinVacios({
    '@type': 'Museum',
    '@id': `${url}#museo`,
    name: NOMBRE_MUSEO,
    alternateName: 'MuPa',
    url,
    logo: `${url}apple-touch-icon.png`,
    image: `${url}${OG_IMAGEN.archivo}`,
    description: DESCRIPCION_MUSEO,
    address: sinVacios({
      '@type': 'PostalAddress',
      streetAddress: lleno(m.direccion) ? m.direccion : null,
      addressLocality: lleno(m.localidad) ? m.localidad : null,
      postalCode: lleno(m.codigoPostal) ? m.codigoPostal : null,
      addressRegion: lleno(m.provincia) ? m.provincia : 'San Juan',
      addressCountry: 'AR',
    }),
    telephone: lleno(m.telefono) ? m.telefono : null,
    email: lleno(m.emailPublico) ? m.emailPublico : null,
    sameAs: (Array.isArray(m.redes) ? m.redes : [])
      .map((r) => r?.url)
      .filter((u) => lleno(u) && u.startsWith('https://')),
    openingHoursSpecification: horarioSchema(m.horarios),
  })
}

/**
 * Datos estructurados de la Home (schema.org): el nombre del sitio que Google muestra arriba del resultado (WebSite) y
 * la ficha del museo (Museum).
 */
function grafoHome(url, museo) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}#sitio`,
        url,
        name: 'MuPa',
        alternateName: [NOMBRE_MUSEO, NOMBRE_SITIO],
        inLanguage: 'es-AR',
        publisher: { '@id': `${url}#museo` },
      },
      museoSchema(url, museo),
    ],
  }
}

/** Las páginas internas llevan el museo (plan 6.4). */
const grafoMuseo = (url, museo) => ({ '@context': 'https://schema.org', '@graph': [museoSchema(url, museo)] })

/**
 * Una novedad como NewsArticle (plan 6.4): el título (hasta 110), las fechas, la imagen y el museo como autor y editor.
 * El autor va como Organization con el nombre y la dirección del sitio, y no como una referencia al nodo Museum: en
 * schema.org Museum no es una Organization (es un lugar) y author y publisher piden Person u Organization.
 */
function articuloSchema(url, datos, canonica, imagen) {
  const museo = { '@type': 'Organization', name: NOMBRE_MUSEO, url, logo: `${url}apple-touch-icon.png` }
  return sinVacios({
    '@type': 'NewsArticle',
    '@id': `${canonica}#articulo`,
    mainEntityOfPage: canonica,
    headline: cortarEnPalabra(datos.titulo, 110),
    description: datos.resumen ?? null,
    image: [imagen],
    datePublished: datos.publicadaEn,
    dateModified: datos.actualizadaEn ?? datos.publicadaEn,
    inLanguage: 'es-AR',
    author: museo,
    publisher: museo,
  })
}

/**
 * Corta un texto en max caracteres, en una palabra y con "…" al final si hacía falta cortarlo (la descripción, plan
 * 6.4: hasta 160).
 */
export function cortarEnPalabra(texto, max = 160) {
  const limpio = String(texto ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  if (limpio.length <= max) return limpio
  const corte = limpio.slice(0, max - 1)
  const espacio = corte.lastIndexOf(' ')
  return `${(espacio > max / 2 ? corte.slice(0, espacio) : corte).replace(/[\s,;:.\-–—]+$/, '')}…`
}

/**
 * Las medidas del og.jpg de una foto (server/fotos/procesar.js: 1200 de ancho con su proporción, sin agrandar y con el
 * alto hasta 16383).
 */
export function medidasOg(ancho, alto) {
  const escala = Math.min(1, 1200 / ancho, 16383 / alto)
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) }
}

/** La tarjeta al compartir una página con portada: su og.jpg con sus medidas (o la del sitio, si no tiene). */
function imagenDe(portada) {
  if (!portada?.clave || !(portada.ancho > 0) || !(portada.alto > 0)) return OG_IMAGEN
  return {
    archivo: urlFoto(portada.clave, 'og.jpg').slice(1),
    ...medidasOg(portada.ancho, portada.alto),
    alt: portada.alt || null,
  }
}

// Las páginas fijas: los mismos títulos que el menú (src/content.js) y una línea neutra que dice qué hay en cada una,
// sin datos del museo. A validar con el museo, como la de la Home.
const FIJAS = {
  exposiciones: {
    titulo: 'Exposiciones',
    descripcion: 'Las muestras actuales, próximas y permanentes del Museo Paleontológico de San Juan, y sus salas.',
  },
  visitas: {
    titulo: 'Visitas',
    descripcion: 'Horario, tarifas y lo que hay que saber para visitar el Museo Paleontológico de San Juan.',
  },
  novedades: {
    titulo: 'Novedades',
    descripcion: 'Noticias y próximas actividades del Museo Paleontológico de San Juan.',
  },
  contacto: {
    titulo: 'Contacto',
    descripcion: 'Cómo comunicarse con el Museo Paleontológico de San Juan.',
  },
}

const conMarca = (titulo) => `${titulo} · MuPa`

/**
 * Qué lleva el <head> de cada página: { titulo, descripcion, ogTitulo, ogDescripcion, ruta, imagen, tipoOg, jsonld,
 * indexable, publicada, actualizada }. ruta: la del canonical (null = sin canonical); jsonld: función de la URL
 * pública; publicada y actualizada: las fechas de una novedad (article:published_time y modified_time).
 */
export function seoDe(estado) {
  const { pagina, museo } = estado
  const datos = estado.datos ?? {}
  if (pagina === 'home') {
    return {
      ...HOME,
      ruta: '/',
      imagen: OG_IMAGEN,
      tipoOg: 'website',
      jsonld: (url) => grafoHome(url, museo),
      indexable: true,
    }
  }
  if (Object.hasOwn(FIJAS, pagina)) {
    const { titulo, descripcion } = FIJAS[pagina]
    // Las páginas 2 en adelante de /novedades: con su número en el título y en el canonical.
    const n = pagina === 'novedades' && Number.isInteger(datos.pagina) && datos.pagina > 1 ? datos.pagina : null
    return {
      titulo: conMarca(n ? `${titulo}, página ${n}` : titulo),
      descripcion,
      ruta: n ? `/novedades?pagina=${n}` : `/${pagina}`,
      imagen: OG_IMAGEN,
      tipoOg: 'website',
      jsonld: (url) => grafoMuseo(url, museo),
      indexable: true,
    }
  }
  if ((pagina === 'muestra' || pagina === 'novedad') && typeof datos.slug === 'string') {
    const ruta = rutaDeContenido(pagina === 'muestra' ? 'muestras' : 'novedades', datos.slug)
    const imagen = imagenDe(datos.portada)
    const esNovedad = pagina === 'novedad'
    return {
      titulo: conMarca(datos.titulo),
      ogTitulo: datos.titulo,
      descripcion: datos.resumen ? cortarEnPalabra(datos.resumen) : null,
      ruta,
      imagen,
      tipoOg: esNovedad ? 'article' : 'website',
      publicada: esNovedad ? datos.publicadaEn : null,
      actualizada: esNovedad ? datos.actualizadaEn : null,
      jsonld: (url) => {
        const grafo = grafoMuseo(url, museo)
        if (esNovedad) grafo['@graph'].push(articuloSchema(url, datos, url + ruta.slice(1), url + imagen.archivo))
        return grafo
      },
      indexable: true,
    }
  }
  // NoEncontrada (estado 404): sin canonical ni tarjeta, y nunca indexable.
  return { titulo: 'Página no encontrada · MuPa', ruta: null, indexable: false }
}

/**
 * El <head> de la página (lo que va en lugar de <!--head--> en la plantilla).
 * @param {object} estado  el estado de la página (server/ssr.js)
 * @param {{ urlPublica: string, indexar: boolean }} opciones  indexar: el host es el público de producción
 */
export function armarHead(estado, { urlPublica, indexar }) {
  const seo = seoDe(estado)
  const e = escaparHtml
  const lineas = [`<title>${e(seo.titulo)}</title>`]
  if (seo.descripcion) lineas.push(`<meta name="description" content="${e(seo.descripcion)}" />`)
  if (!indexar || !seo.indexable) lineas.push('<meta name="robots" content="noindex, nofollow" />')
  const canonica = seo.ruta ? urlPublica + seo.ruta.slice(1) : null
  if (canonica) lineas.push(`<link rel="canonical" href="${e(canonica)}" />`)
  // Íconos (public/): la marca MuPa en crema sobre el fondo del sitio. SVG para los navegadores modernos, ICO de 32 px
  // para los viejos y PNG de 180 para la pantalla de inicio de iOS.
  lineas.push(
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    '<link rel="icon" href="/favicon.ico" sizes="32x32" />',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    '<meta name="theme-color" content="#0e100d" />',
  )
  if (seo.tipoOg && canonica) {
    const og = (propiedad, valor) => `<meta property="og:${propiedad}" content="${e(valor)}" />`
    const descripcionOg = seo.ogDescripcion ?? seo.descripcion
    lineas.push(
      og('type', seo.tipoOg),
      og('site_name', NOMBRE_SITIO),
      og('title', seo.ogTitulo ?? seo.titulo),
      ...(descripcionOg ? [og('description', descripcionOg)] : []),
      og('url', canonica),
      og('image', urlPublica + seo.imagen.archivo),
      og('image:width', String(seo.imagen.ancho)),
      og('image:height', String(seo.imagen.alto)),
      ...(seo.imagen.alt ? [og('image:alt', seo.imagen.alt)] : []),
      og('locale', 'es_AR'),
      '<meta name="twitter:card" content="summary_large_image" />',
    )
    const articulo = (propiedad, valor) => `<meta property="article:${propiedad}" content="${e(valor)}" />`
    if (seo.publicada) lineas.push(articulo('published_time', seo.publicada))
    if (seo.actualizada) lineas.push(articulo('modified_time', seo.actualizada))
  }
  if (seo.jsonld) lineas.push(`<script type="application/ld+json">${jsonEnScript(seo.jsonld(urlPublica))}</script>`)
  return lineas.join('\n    ')
}

/**
 * robots.txt (uno solo, para todo el host). /administracion no se bloquea a propósito: todas sus respuestas llevan
 * X-Robots-Tag: noindex, y si se bloqueara el rastreo Google no vería ese noindex (plan 6.5).
 */
export function robotsTxt(urlPublica) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${urlPublica}sitemap.xml\n`
}

/**
 * Las entradas del sitemap (plan 6.5): las páginas fijas (la Home con la fecha del build; Exposiciones y Novedades con
 * la última modificación de lo que publican; las demás sin fecha) y las muestras y novedades publicadas (también las
 * finalizadas o realizadas), con lastmod = updated_at (el día, en San Juan). Nunca /administracion.
 * @param {{ urlPublica: string, fijas: string[], fechaHome: Date,
 *   contenidos: { tipo: 'muestras' | 'novedades' | 'salas', slug: string, actualizadoEn: Date | null }[] }} opciones
 * @returns {{ loc: string, lastmod?: string }[]}
 */
export function entradasDelSitemap({ urlPublica, fijas, contenidos, fechaHome }) {
  const dia = (fecha) => (fecha instanceof Date && !Number.isNaN(fecha.getTime()) ? hoyEnSanJuan(fecha) : undefined)
  const ultima = (tipos) => {
    const fechas = contenidos.filter((c) => tipos.includes(c.tipo) && c.actualizadoEn).map((c) => c.actualizadoEn.getTime())
    return fechas.length ? dia(new Date(Math.max(...fechas))) : undefined
  }
  const fechaDeFija = {
    '/': dia(fechaHome),
    '/exposiciones': ultima(['muestras', 'salas']),
    '/novedades': ultima(['novedades']),
  }
  return [
    ...fijas.map((ruta) => ({ loc: urlPublica + ruta.slice(1), lastmod: fechaDeFija[ruta] })),
    ...contenidos
      .filter((c) => c.tipo !== 'salas')
      .map((c) => ({ loc: urlPublica + rutaDeContenido(c.tipo, c.slug).slice(1), lastmod: dia(c.actualizadoEn) })),
  ]
}

/**
 * sitemap.xml, con las entradas de entradasDelSitemap().
 * @param {{ loc: string, lastmod?: string }[]} entradas
 */
export function sitemapXml(entradas) {
  const urls = entradas
    .map(({ loc, lastmod }) => {
      const fecha = lastmod ? `\n    <lastmod>${escaparHtml(lastmod)}</lastmod>` : ''
      return `  <url>\n    <loc>${escaparHtml(loc)}</loc>${fecha}\n  </url>\n`
    })
    .join('')
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls +
    '</urlset>\n'
  )
}
