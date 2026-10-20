import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
// Estilos que Lenis necesita para el scroll suave (useScrollSuave): alto auto en html/body, iframes sin puntero, etc.
import 'lenis/dist/lenis.css'
import Raiz, { cargarPagina } from './Raiz.jsx'
import iniciarAnalitica from './analitica.js'
import iniciarUserWay from './userway.js'

const raiz = document.getElementById('root')
const nodo = document.getElementById('estado')

// El servidor (server/ssr.js) manda la página ya renderizada dentro de #root y su estado en #estado: React la adopta
// con el mismo estado con que la dibujó el servidor, en vez de volver a crearla. Desde E4 cada página va en su archivo
// (src/Raiz.jsx): primero se baja la de este estado (el servidor ya la pidió con modulepreload) y recién ahí se hidrata,
// así el árbol es el mismo que dibujó el servidor.
if (nodo) {
  const estado = JSON.parse(nodo.textContent)
  cargarPagina(estado.pagina).then((Pagina) => {
    hydrateRoot(
      raiz,
      <StrictMode>
        <Raiz estado={estado} Pagina={Pagina} />
      </StrictMode>,
    )
    iniciarAnalitica(estado)
    // El widget de UserWay, solo si el servidor manda el ID (E4.7).
    iniciarUserWay(estado)
  })
} else if (import.meta.env.DEV) {
  // Solo con Vite suelto (npm run dev:vite, para retocar efectos de la Home): no hay servidor ni estado, se monta la
  // Home desde cero. En el build esta rama no existe.
  const estado = { pagina: 'home', ruta: '/', datos: {}, museo: {}, hoy: '', medir: false, userway: null }
  cargarPagina('home').then((Pagina) =>
    createRoot(raiz).render(
      <StrictMode>
        <Raiz estado={estado} Pagina={Pagina} />
      </StrictMode>,
    ),
  )
}

// Diagnóstico en pantalla para probar en un teléfono (https://mupa.ar/?diag): se carga aparte y solo con ese parámetro.
if (/[?&]diag\b/.test(location.search)) import('./diagnostico.js').then((m) => m.default())
