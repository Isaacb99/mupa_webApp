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

/**
 * Datos estructurados (schema.org): el nombre del sitio que Google muestra arriba del resultado (WebSite) y la ficha
 * del museo (Museum). Solo datos que el museo ya publicó: la dirección, los horarios, el teléfono, el mail y las
 * redes salen de la tabla museo cuando estén cargados (E4.6: address.streetAddress, openingHoursSpecification,
 * telephone, email, sameAs). No se inventa ningún dato. El logo es el ícono de 180 px: Google lo pide de 112 px o
 * más y que se vea bien sobre blanco.
 */
function grafoHome(url) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}#sitio`,
        url,
        name: 'MuPa',
        alternateName: ['Museo Paleontológico de San Juan', NOMBRE_SITIO],
        inLanguage: 'es-AR',
        publisher: { '@id': `${url}#museo` },
      },
      {
        '@type': 'Museum',
        '@id': `${url}#museo`,
        name: 'Museo Paleontológico de San Juan',
        alternateName: 'MuPa',
        url,
        logo: `${url}apple-touch-icon.png`,
        image: `${url}${OG_IMAGEN.archivo}`,
        description:
          'Institución dedicada en exclusividad a la divulgación, educación y preservación del patrimonio del Período ' +
          'Triásico, principalmente proveniente del Parque Provincial Ischigualasto (Patrimonio de la Humanidad por la ' +
          'UNESCO).',
        address: { '@type': 'PostalAddress', addressRegion: 'San Juan', addressCountry: 'AR' },
      },
    ],
  }
}

/**
 * Qué lleva el <head> de cada página: { titulo, descripcion, ogDescripcion, ruta, imagen, tipoOg, jsonld, indexable }.
 * ruta: la del canonical (null = sin canonical); jsonld: función de la URL pública.
 */
export function seoDe(estado) {
  if (estado.pagina === 'home') {
    return { ...HOME, ruta: '/', imagen: OG_IMAGEN, tipoOg: 'website', jsonld: grafoHome, indexable: true }
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
    lineas.push(
      og('type', seo.tipoOg),
      og('site_name', NOMBRE_SITIO),
      og('title', seo.titulo),
      og('description', seo.ogDescripcion ?? seo.descripcion),
      og('url', canonica),
      og('image', urlPublica + seo.imagen.archivo),
      og('image:width', String(seo.imagen.ancho)),
      og('image:height', String(seo.imagen.alto)),
      og('image:alt', seo.imagen.alt),
      og('locale', 'es_AR'),
      '<meta name="twitter:card" content="summary_large_image" />',
    )
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
 * sitemap.xml. Por ahora solo la Home; con E4 suma las rutas fijas y las muestras y novedades publicadas (también
 * las finalizadas), con lastmod = updated_at. Nunca /administracion.
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
