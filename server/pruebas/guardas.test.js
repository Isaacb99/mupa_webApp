// Guardas de los comandos que borran datos (server/db/guardas.js). Sin base: son funciones puras.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { exigirBaseDePrueba, exigirBaseLocal, exigirConfirmacion } from '../db/guardas.js'

const DEV = { produccion: false }
const PROD = { produccion: true }

test('las pruebas solo borran una base local que termine en _test', () => {
  assert.deepEqual(exigirBaseDePrueba('postgres://mupa:x@localhost:5432/mupa_test'), { host: 'localhost', base: 'mupa_test' })
  assert.doesNotThrow(() => exigirBaseDePrueba('postgres://mupa:x@127.0.0.1/otra_test'))
  assert.doesNotThrow(() => exigirBaseDePrueba('postgres://mupa:x@[::1]:5432/mupa_test'))
  assert.throws(() => exigirBaseDePrueba(undefined), /DATABASE_URL_TEST/)
  assert.throws(() => exigirBaseDePrueba('postgres://mupa:x@localhost:5432/mupa_dev'), /_test/)
  assert.throws(() => exigirBaseDePrueba('postgres://u:x@dpg-abc.virginia-postgres.render.com/mupa_test'), /localhost/)
  assert.throws(() => exigirBaseDePrueba('no es una url'), /no es válida/)
})

test('la semilla de ejemplo no corre en producción ni contra una base remota', () => {
  assert.doesNotThrow(() => exigirBaseLocal(DEV, 'postgres://mupa:x@localhost:5432/mupa_dev'))
  assert.throws(() => exigirBaseLocal(PROD, 'postgres://mupa:x@localhost:5432/mupa_dev'), /production/)
  assert.throws(() => exigirBaseLocal(DEV, 'postgres://u:x@dpg-abc.oregon-postgres.render.com/mupa'), /local/)
})

test('migrar:atras exige la bandera en producción y contra una base que no es local', () => {
  const LOCAL = 'postgres://mupa:x@localhost:5432/mupa_dev'
  const REMOTA = 'postgres://u:x@dpg-abc.oregon-postgres.render.com/mupa'
  assert.doesNotThrow(() => exigirConfirmacion(DEV, LOCAL, ['node', 'migrar.js', 'down']))
  assert.throws(() => exigirConfirmacion(PROD, LOCAL, ['node', 'migrar.js', 'down']), /--confirmo-borrar-datos/)
  assert.doesNotThrow(() => exigirConfirmacion(PROD, LOCAL, ['node', 'migrar.js', 'down', '--confirmo-borrar-datos']))
  // Sin NODE_ENV=production, desde una PC contra la URL externa de Render (plan 2.5).
  assert.throws(() => exigirConfirmacion(DEV, REMOTA, ['node', 'migrar.js', 'down']), /no es local/)
  assert.doesNotThrow(() => exigirConfirmacion(DEV, REMOTA, ['node', 'migrar.js', 'down', '--confirmo-borrar-datos']))
  assert.throws(() => exigirConfirmacion(DEV, undefined, ['node', 'migrar.js', 'down']), /--confirmo-borrar-datos/)
})

test('una URL con parámetros o barras invertidas no pasa por local (Sequelize obedece ?host=)', () => {
  for (const url of [
    'postgres://mupa:x@localhost/mupa_test?host=db.remota.example',
    'postgres://mupa:x@localhost/mupa_test?hostaddr=10.0.0.1',
    'postgres://mupa:x@localhost\\@db.remota.example/mupa_test',
  ]) {
    assert.throws(() => exigirBaseDePrueba(url), /parámetros|barras invertidas|no es válida/, url)
    assert.throws(() => exigirBaseLocal(DEV, url), /parámetros|barras invertidas|no es válida/, url)
  }
  assert.throws(() => exigirConfirmacion(DEV, 'postgres://mupa:x@localhost/mupa_dev?host=db.remota', ['node', 'm', 'down']), /parámetros/)
})

test('el mensaje nunca incluye la contraseña de la URL', () => {
  try {
    exigirBaseDePrueba('postgres://mupa:clave-secreta@remoto.example.com/mupa_dev')
    assert.fail('tenía que negarse')
  } catch (err) {
    assert.doesNotMatch(err.message, /clave-secreta/)
  }
})
