// Los logs del servicio (server/log.js): el código de un error de la base tiene que llegar al log (salud_base,
// base_no_responde, museo_sin_base), y Sequelize no lo deja en err.code sino en err.parent / err.original.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConnectionRefusedError } from 'sequelize'
import { codigoDeError, log } from '../log.js'

const conCodigo = (code) => Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:1'), { code })

test('codigoDeError lee el código propio o el que Sequelize guarda en parent/original', () => {
  assert.equal(codigoDeError(conCodigo('ECONNREFUSED')), 'ECONNREFUSED')
  // El error real de Sequelize cuando la base no está: el código va en parent y en original, no en code.
  const deSequelize = new ConnectionRefusedError(conCodigo('ECONNREFUSED'))
  assert.equal(deSequelize.code, undefined)
  assert.equal(codigoDeError(deSequelize), 'ECONNREFUSED')
  assert.equal(codigoDeError(Object.assign(new Error('x'), { original: { code: '28P01' } })), '28P01')
  assert.equal(codigoDeError(new Error('sin código')), undefined)
  assert.equal(codigoDeError(null), undefined)
})

test('log() con un error de Sequelize deja el código en la línea', () => {
  const lineas = []
  const original = console.error
  console.error = (texto) => lineas.push(JSON.parse(texto))
  try {
    log('error', 'prueba', new ConnectionRefusedError(conCodigo('ECONNREFUSED')))
  } finally {
    console.error = original
  }
  assert.equal(lineas.length, 1)
  assert.equal(lineas[0].evento, 'prueba')
  assert.equal(lineas[0].codigo, 'ECONNREFUSED')
})
