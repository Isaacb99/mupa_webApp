import Layout from './components/Layout.jsx'
import NoEncontrada from './paginas/NoEncontrada.jsx'
import { ARCHIVOS_DE_PAGINAS, PAGINAS, existePagina } from './tablaDePaginas.js'

// Las páginas del sitio por estado.pagina: la tabla (PAGINAS y ARCHIVOS_DE_PAGINAS) está en src/tablaDePaginas.js desde
// el diseño del tablero "Web" (02/11/2026), porque también la lee el menú (qué secciones existen). La 404 va en el
// bundle principal: es chica y es la de respaldo; las demás, Contacto incluida, van cada una en su archivo.

/** Para que el servidor sepa qué archivo precargar de cada página (src/entry-server.jsx, server/ssr.js). */
export { ARCHIVOS_DE_PAGINAS }

/** El componente de la página (lo baja si hace falta); una que no está en la tabla, la 404. */
export async function cargarPagina(nombre) {
  if (!existePagina(nombre)) return NoEncontrada
  return (await PAGINAS[nombre]()).default
}

// Raíz de la página, la misma en el servidor (src/entry-server.jsx) y en el navegador (src/main.jsx): las dos reciben
// el mismo estado (el JSON de #estado) y la misma página ya cargada, así lo que se hidrata es exactamente lo que dibujó
// el servidor.
// Desde E4.1 toda página va dentro de Layout (header con el menú, <main id="main">, pie y la única instancia de Lenis):
// una página dibuja solo lo de adentro del <main>.
// sobreFoto: la página empieza con una foto debajo del header (la declara la página: Home.sobreFoto = true, y desde el
// 03/11/2026 Visitas, con el hero de las páginas internas, HeroPagina.jsx). El header va siempre absolute arriba
// (tablero "Web", 02/11/2026); sobre una foto, el logo no se invierte con colores forzados en un tema claro (Logo.jsx,
// A11Y-08).
export default function Raiz({ estado, Pagina = NoEncontrada }) {
  return (
    <Layout estado={estado} sobreFoto={Pagina.sobreFoto === true}>
      <Pagina estado={estado} />
    </Layout>
  )
}
