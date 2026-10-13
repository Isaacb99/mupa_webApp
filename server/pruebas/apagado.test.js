// Apagado ordenado (server/apagado.js): con un pedido en curso sobre una conexión keep-alive (como las del proxy de
// Render), el apagado tiene que terminar en cuanto se responde, no a los 65 s del keepAliveTimeout ni por el límite.
import assert from 'node:assert/strict'
import { Agent, createServer, request } from 'node:http'
import { connect } from 'node:net'
import { test } from 'node:test'
import { crearApagado } from '../apagado.js'

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const FIN = '\r\n'

/** Servidor con /lento (responde a los 400 ms) y lo demás al instante, con el keepAliveTimeout de producción. */
async function levantar({ limiteMs = 5_000, barridoMs = 100 } = {}) {
  const servidor = createServer()
  servidor.keepAliveTimeout = 65_000
  servidor.headersTimeout = 66_000
  const apagado = crearApagado(servidor, { limiteMs, barridoMs })
  servidor.on(
    'request',
    apagado.manejador((req, res) => {
      if (req.url === '/lento') setTimeout(() => res.end('lento'), 400)
      else res.end('ok')
    }),
  )
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r))
  return { servidor, apagado, puerto: servidor.address().port }
}

test('un pedido en curso sobre una conexión keep-alive no frena el apagado', async () => {
  const { apagado, puerto } = await levantar()
  const agente = new Agent({ keepAlive: true })
  try {
    const respuesta = new Promise((resolver, rechazar) => {
      request({ host: '127.0.0.1', port: puerto, path: '/lento', agent: agente }, (res) => {
        let cuerpo = ''
        res.setEncoding('utf8')
        res.on('data', (d) => (cuerpo += d))
        res.on('end', () => resolver({ status: res.statusCode, cuerpo }))
      })
        .on('error', rechazar)
        .end()
    })
    await esperar(100)
    const inicio = performance.now()
    const enOrden = await apagado.apagar()
    const ms = performance.now() - inicio
    assert.deepEqual(await respuesta, { status: 200, cuerpo: 'lento' })
    assert.equal(enOrden, true)
    assert.ok(ms < 1_500, `tardó ${Math.round(ms)} ms`)
  } finally {
    agente.destroy()
  }
})

test('lo que llega durante el apagado por una conexión abierta sale con Connection: close', async () => {
  // Sin barrido (cada 60 s): solo el Connection: close puede cerrar la conexión antes del límite de 3 s.
  const { apagado, puerto } = await levantar({ limiteMs: 3_000, barridoMs: 60_000 })
  const socket = connect(puerto, '127.0.0.1')
  let datos = ''
  let primera
  const llegoLaPrimera = new Promise((r) => (primera = r))
  socket.setEncoding('latin1')
  socket.on('data', (d) => {
    datos += d
    if (datos.includes(FIN + FIN + 'lento')) primera()
  })
  const cerrada = new Promise((r) => socket.on('close', r))
  socket.write(`GET /lento HTTP/1.1${FIN}Host: x${FIN}${FIN}`)
  await esperar(100)
  const inicio = performance.now()
  const enOrden = apagado.apagar()
  // El segundo pedido llega por la misma conexión cuando el apagado ya empezó.
  await llegoLaPrimera
  socket.write(`GET /rapido HTTP/1.1${FIN}Host: x${FIN}${FIN}`)
  await cerrada
  assert.equal(await enOrden, true)
  assert.ok(performance.now() - inicio < 1_500)
  const respuestas = datos.split(/(?=HTTP\/1\.1 )/)
  assert.equal(respuestas.length, 2, datos)
  assert.ok(respuestas[0].toLowerCase().includes(`${FIN}connection: keep-alive${FIN}`), respuestas[0])
  assert.ok(respuestas[1].toLowerCase().includes(`${FIN}connection: close${FIN}`), respuestas[1])
  assert.ok(respuestas[1].endsWith(FIN + FIN + 'ok'), respuestas[1])
})
