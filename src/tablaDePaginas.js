// Las páginas del sitio por estado.pagina (las nombra la tabla de rutas del servidor, server/rutas-publicas.js).
//
// Cada página va en su propio archivo JS (plan 6.2: con las páginas internas de E4 el JS de la Home pasaba de 337 kB y
// el tope es 342): import() dinámico, y el servidor y el navegador esperan la página ANTES de dibujar o hidratar
// (cargarPagina de src/Raiz.jsx, en src/entry-server.jsx y src/main.jsx). Nunca React.lazy: con lazy, el render del
// servidor saldría con el "cargando" en vez de la página y se perdería el contenido. Así la Home no baja el código de
// las internas ni las internas el de la Home; el servidor pide de antemano el archivo de la página con
// <link rel="modulepreload"> (server/ssr.js, con el manifiesto del build). La 404 va en el bundle principal (src/Raiz.jsx).
// Una página nueva va acá (en PAGINAS y en ARCHIVOS_DE_PAGINAS) y en la tabla de rutas del servidor; ssr.test.js falla
// si falta en alguna.
//
// Desde el diseño del tablero "Web" (02/11/2026) esta tabla es también la que decide qué secciones van en el menú y en el
// pie (src/components/navegacion.js): cada sección de navegacion en src/content.js nombra su página y se dibuja solo si
// la página está acá. Así El Museo, Divulgación, Educación y Circuitos aparecen solos en el menú el día que se agrega su
// página, sin tocar el header (desde el 06/11/2026 están las cinco: El Museo, Visitas, Divulgación, Educación y
// Circuitos). Este archivo no importa nada de React ni del Layout: lo pueden leer el menú y el pie sin que el import sea
// circular (Raiz.jsx importa el Layout, y el Layout el header).
export const PAGINAS = {
  home: () => import('./paginas/Home.jsx'),
  'el-museo': () => import('./paginas/ElMuseo.jsx'),
  exposiciones: () => import('./paginas/Exposiciones.jsx'),
  muestra: () => import('./paginas/Muestra.jsx'),
  visitas: () => import('./paginas/Visitas.jsx'),
  divulgacion: () => import('./paginas/Divulgacion.jsx'),
  educacion: () => import('./paginas/Educacion.jsx'),
  circuitos: () => import('./paginas/Circuitos.jsx'),
  novedades: () => import('./paginas/Novedades.jsx'),
  novedad: () => import('./paginas/Novedad.jsx'),
  contacto: () => import('./paginas/Contacto.jsx'),
}

/**
 * El archivo de cada página, como lo nombra el manifiesto del build (dist/client/.vite/manifest.json): con él el
 * servidor sabe qué precargar (server/ssr.js). Las claves son las mismas que las de PAGINAS (lo comprueba ssr.test.js).
 */
export const ARCHIVOS_DE_PAGINAS = {
  home: 'src/paginas/Home.jsx',
  'el-museo': 'src/paginas/ElMuseo.jsx',
  exposiciones: 'src/paginas/Exposiciones.jsx',
  muestra: 'src/paginas/Muestra.jsx',
  visitas: 'src/paginas/Visitas.jsx',
  divulgacion: 'src/paginas/Divulgacion.jsx',
  educacion: 'src/paginas/Educacion.jsx',
  circuitos: 'src/paginas/Circuitos.jsx',
  novedades: 'src/paginas/Novedades.jsx',
  novedad: 'src/paginas/Novedad.jsx',
  contacto: 'src/paginas/Contacto.jsx',
}

/** ¿El sitio tiene esta página? (la misma respuesta en el servidor y en el navegador: es una tabla fija). */
export const existePagina = (nombre) => typeof nombre === 'string' && Object.hasOwn(PAGINAS, nombre)
