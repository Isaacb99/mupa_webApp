import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Estilos que Lenis necesita para el scroll suave (useScrollSuave): alto auto en html/body, iframes sin puntero, etc.
import 'lenis/dist/lenis.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
