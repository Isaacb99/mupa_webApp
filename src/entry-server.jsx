import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import Raiz from './Raiz.jsx'

// Entrada del SSR (server/ssr.js): devuelve el HTML de la página que pide el estado, el mismo árbol que hidrata
// src/main.jsx. Corre en Node en cada pedido, no en el navegador: nada de lo que se ejecuta al renderizar puede tocar
// window ni document (los efectos no corren acá) ni depender de algo que cambie entre el servidor y el navegador
// (la fecha y la hora, el azar, las medidas de la pantalla): lo que haga falta de eso viaja en el estado (p. ej. hoy).
// El servidor le pasa JSON.parse del mismo JSON que va en #estado (plan 2.3).
export function render(estado) {
  return renderToString(
    <StrictMode>
      <Raiz estado={estado} />
    </StrictMode>,
  )
}
