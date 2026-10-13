// Manejo de errores (plan 2.4, punto 9). Express 5 manda acá también los rechazos de los handlers async.
// - Se respeta err.status (o err.statusCode): 404 de un estático que falta, 400 de una URL mal codificada, 413…
// - En /administracion/api/…: { error } en JSON.
// - Un 4xx en el resto (p. ej. un estático que falta): texto corto, nunca 500.
// - Un 5xx: una página simple, sin el bundle del sitio, con no-store.
// - Nunca el stack ni el mensaje del error en la respuesta: van al log (server/log.js).
import { RUTA_PANEL } from '../compartido/panel.js'
import { log } from './log.js'

const TEXTOS = {
  400: 'El pedido no es válido.',
  403: 'No se puede acceder a esto.',
  404: 'No encontrado.',
  405: 'Método no permitido.',
  413: 'El pedido es demasiado grande.',
  429: 'Demasiados pedidos. Probá de nuevo en unos minutos.',
  500: 'Algo salió mal. Probá de nuevo en unos minutos.',
  503: 'El sitio no está disponible en este momento. Probá de nuevo en unos minutos.',
}
const texto = (status) => TEXTOS[status] ?? (status >= 500 ? TEXTOS[500] : TEXTOS[400])

const API_PANEL = new RegExp(`^${RUTA_PANEL}/api(/|\\?|$)`, 'i')

/** Página simple para los 5xx (y las 503 de las páginas internas cuando la base falle, E4): sin JS ni CSS externo. */
export function paginaDeError(status) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>MuPa - Museo Paleontológico de San Juan</title>
    <style>
      body { margin: 0; min-height: 100svh; display: grid; place-content: center; gap: 0.75rem; padding: 1.5rem;
             background: #0e100d; color: #eae2df; font: 1rem/1.5 system-ui, sans-serif; text-align: center; }
      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <h1>Museo Paleontológico de San Juan</h1>
    <p>${texto(status)}</p>
    <p><a href="/">Volver al inicio</a></p>
  </body>
</html>
`
}

export function manejadorDeErrores() {
  // eslint-disable-next-line no-unused-vars -- Express reconoce el manejador de errores por sus cuatro parámetros.
  return function errores(err, req, res, next) {
    let status = Number(err?.status ?? err?.statusCode)
    if (!(status >= 400 && status < 600)) status = 500
    if (status >= 500) log('error', `error_${status}`, err instanceof Error ? err : new Error(String(err)))
    // Con la respuesta a medio mandar no hay nada que hacer: Express corta la conexión.
    if (res.headersSent) return next(err)
    res.status(status).set('Cache-Control', 'no-store')
    if (API_PANEL.test(req.originalUrl)) return res.json({ error: texto(status) })
    if (status < 500) return res.type('text').send(texto(status))
    res.type('html').send(paginaDeError(status))
  }
}
