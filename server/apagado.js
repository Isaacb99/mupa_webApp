// Apagado ordenado del servidor HTTP (plan 2.3, "Arranque", paso 6). Render manda SIGTERM en cada deploy y SIGKILL a
// los 30 s; su proxy mantiene conexiones persistentes (keep-alive) con la instancia.
//
// server.close() deja de aceptar conexiones y espera a que se cierren las abiertas, pero una conexión keep-alive con un
// pedido en curso responde "Connection: keep-alive" y queda abierta hasta el keepAliveTimeout (65 s): el apagado
// vencía siempre. Por eso, desde que empieza el apagado:
// - toda respuesta nueva sale con "Connection: close" (Node cierra la conexión al terminarla);
// - cada barridoMs se cierran las conexiones que quedaron ociosas (las que tenían un pedido en curso al llegar la
//   señal y ya respondieron);
// - si a los limiteMs sigue habiendo conexiones, se cortan todas y se informa que venció.
// Lo usa server/servidor.js; la prueba está en server/pruebas/apagado.test.js.

/**
 * @param {import('node:http').Server} servidor
 * @param {{ limiteMs?: number, barridoMs?: number }} [opciones]
 */
export function crearApagado(servidor, { limiteMs = 25_000, barridoMs = 200 } = {}) {
  let apagando = false
  let terminado = null

  /** Envuelve el manejador de pedidos (la app de Express). */
  function manejador(app) {
    return function pedido(req, res) {
      if (apagando) res.setHeader('Connection', 'close')
      app(req, res)
    }
  }

  /** Empieza el apagado. Resuelve true si se cerraron todas las conexiones a tiempo, false si venció el límite. */
  function apagar() {
    if (terminado) return terminado
    apagando = true
    terminado = new Promise((resolver) => {
      const barrido = setInterval(() => servidor.closeIdleConnections(), barridoMs)
      barrido.unref()
      const limite = setTimeout(() => {
        clearInterval(barrido)
        servidor.closeAllConnections()
        resolver(false)
      }, limiteMs)
      limite.unref()
      servidor.close(() => {
        clearInterval(barrido)
        clearTimeout(limite)
        resolver(true)
      })
      servidor.closeIdleConnections()
    })
    return terminado
  }

  return {
    manejador,
    apagar,
    get apagando() {
      return apagando
    },
  }
}
