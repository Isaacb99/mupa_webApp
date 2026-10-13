import Home from './paginas/Home.jsx'
import NoEncontrada from './paginas/NoEncontrada.jsx'

// Páginas del sitio por estado.pagina (las nombra la tabla de rutas del servidor, server/rutas-publicas.js). Con E4
// se suman Exposiciones, Muestra, Visitas, Novedades, Novedad y Contacto, y todas pasan a ir dentro de Layout (menú,
// pie y la única instancia de Lenis).
const PAGINAS = {
  home: Home,
  'no-encontrada': NoEncontrada,
}

// Raíz de la página, la misma en el servidor (src/entry-server.jsx) y en el navegador (src/main.jsx): las dos reciben
// el mismo estado (el JSON de #estado), así lo que se hidrata es exactamente lo que dibujó el servidor.
export default function Raiz({ estado }) {
  const Pagina = PAGINAS[estado.pagina] ?? NoEncontrada
  return <Pagina estado={estado} />
}
