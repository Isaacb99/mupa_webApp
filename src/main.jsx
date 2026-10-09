import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
// Estilos que Lenis necesita para el scroll suave (useScrollSuave): alto auto en html/body, iframes sin puntero, etc.
import 'lenis/dist/lenis.css'
import App from './App.jsx'
import iniciarAnalitica from './analitica.js'

const raiz = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// El build trae la página ya renderizada dentro de #root (tools/prerender.mjs): React la adopta en vez de volver a
// crearla. En desarrollo #root llega vacío y se monta desde cero.
if (raiz.hasChildNodes()) hydrateRoot(raiz, app)
else createRoot(raiz).render(app)

iniciarAnalitica()

// Diagnóstico en pantalla para probar en un teléfono (https://mupa.ar/?diag): se carga aparte y solo con ese parámetro.
if (/[?&]diag\b/.test(location.search)) import('./diagnostico.js').then((m) => m.default())
