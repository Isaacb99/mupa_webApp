import Layout from './components/Layout.jsx'
import NoEncontrada from './paginas/NoEncontrada.jsx'

// Las páginas del sitio por estado.pagina (las nombra la tabla de rutas del servidor, server/rutas-publicas.js).
//
// Cada página va en su propio archivo JS (plan 6.2: con las páginas internas de E4 el JS de la Home pasaba de 337 kB y
// el tope es 342): import() dinámico, y el servidor y el navegador esperan la página ANTES de dibujar o hidratar
// (cargarPagina, en src/entry-server.jsx y src/main.jsx). Nunca React.lazy: con lazy, el render del servidor saldría
// con el "cargando" en vez de la página y se perdería el contenido. Así la Home no baja el código de las internas ni
// las internas el de la Home; el servidor pide de antemano el archivo de la página con <link rel="modulepreload">
// (server/ssr.js, con el manifiesto del build). La 404 va en el bundle principal: es chica y es la de respaldo.
// Contacto (E4.5) también: una página nueva va acá y en ARCHIVOS_DE_PAGINAS (y en la tabla de rutas del servidor).
const PAGINAS = {
  home: () => import('./paginas/Home.jsx'),
  exposiciones: () => import('./paginas/Exposiciones.jsx'),
  muestra: () => import('./paginas/Muestra.jsx'),
  visitas: () => import('./paginas/Visitas.jsx'),
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
  exposiciones: 'src/paginas/Exposiciones.jsx',
  muestra: 'src/paginas/Muestra.jsx',
  visitas: 'src/paginas/Visitas.jsx',
  novedades: 'src/paginas/Novedades.jsx',
  novedad: 'src/paginas/Novedad.jsx',
  contacto: 'src/paginas/Contacto.jsx',
}

/** El componente de la página (lo baja si hace falta); una que no está en la tabla, la 404. */
export async function cargarPagina(nombre) {
  if (!Object.hasOwn(PAGINAS, nombre)) return NoEncontrada
  return (await PAGINAS[nombre]()).default
}

// Raíz de la página, la misma en el servidor (src/entry-server.jsx) y en el navegador (src/main.jsx): las dos reciben
// el mismo estado (el JSON de #estado) y la misma página ya cargada, así lo que se hidrata es exactamente lo que dibujó
// el servidor.
// Desde E4.1 toda página va dentro de Layout (header con el menú, <main id="main">, pie y la única instancia de Lenis):
// una página dibuja solo lo de adentro del <main>.
export default function Raiz({ estado, Pagina = NoEncontrada }) {
  return (
    <Layout estado={estado}>
      <Pagina estado={estado} />
    </Layout>
  )
}
