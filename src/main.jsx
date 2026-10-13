import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
// Estilos que Lenis necesita para el scroll suave (useScrollSuave): alto auto en html/body, iframes sin puntero, etc.
import 'lenis/dist/lenis.css'
import Raiz from './Raiz.jsx'
import iniciarAnalitica from './analitica.js'

const raiz = document.getElementById('root')
const nodo = document.getElementById('estado')

// El servidor (server/ssr.js) manda la página ya renderizada dentro de #root y su estado en #estado: React la adopta
// con el mismo estado con que la dibujó el servidor, en vez de volver a crearla.
if (nodo) {
  const estado = JSON.parse(nodo.textContent)
  hydrateRoot(
    raiz,
    <StrictMode>
      <Raiz estado={estado} />
    </StrictMode>,
  )
  iniciarAnalitica(estado)
} else if (import.meta.env.DEV) {
  // Solo con Vite suelto (npm run dev:vite, para retocar efectos de la Home): no hay servidor ni estado, se monta la
  // Home desde cero. En el build esta rama no existe.
  const estado = { pagina: 'home', ruta: '/', datos: {}, museo: {}, hoy: '', medir: false, userway: null }
  createRoot(raiz).render(
    <StrictMode>
      <Raiz estado={estado} />
    </StrictMode>,
  )
}

// Diagnóstico en pantalla para probar en un teléfono (https://mupa.ar/?diag): se carga aparte y solo con ese parámetro.
if (/[?&]diag\b/.test(location.search)) import('./diagnostico.js').then((m) => m.default())
