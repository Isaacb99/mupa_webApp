import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import Raiz, { ARCHIVOS_DE_PAGINAS, cargarPagina } from './Raiz.jsx'

// Entrada del SSR (server/ssr.js): devuelve el HTML de la página que pide el estado, el mismo árbol que hidrata
// src/main.jsx. Corre en Node en cada pedido, no en el navegador: nada de lo que se ejecuta al renderizar puede tocar
// window ni document (los efectos no corren acá) ni depender de algo que cambie entre el servidor y el navegador
// (la fecha y la hora, el azar, las medidas de la pantalla): lo que haga falta de eso viaja en el estado (p. ej. hoy).
// El servidor le pasa JSON.parse del mismo JSON que va en #estado (plan 2.3).
// Desde E4 cada página va en su archivo (src/Raiz.jsx): render es async y espera la página antes de renderizar.
export async function render(estado) {
  const Pagina = await cargarPagina(estado.pagina)
  return renderToString(
    <StrictMode>
      <Raiz estado={estado} Pagina={Pagina} />
    </StrictMode>,
  )
}

// Para que el servidor sepa qué archivo precargar de cada página (server/ssr.js, cargarBuild).
export { ARCHIVOS_DE_PAGINAS }
