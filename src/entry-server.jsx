import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'

// Entrada del prerenderizado (tools/prerender.mjs): devuelve el HTML de la página entera, el mismo árbol que monta
// main.jsx. Corre en Node al construir, no en el navegador: nada de lo que se ejecuta al renderizar puede tocar
// window ni document (los efectos no corren acá).
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
