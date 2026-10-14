// Migraciones (plan 3.3, 3.4 y 13.1) sobre mupa_test: la ida, la vuelta de a una hasta el principio y otra vez la
// ida (un down() roto o una migración aplicada que alguien cambió se ven acá), cada modelo contra las columnas de su
// tabla, las restricciones con nombre (y que de verdad rechacen) y los datos iniciales. Sin base se saltean con un
// aviso, salvo la de abajo: que nadie sincronice el esquema desde los modelos (el plan la pone en contenido.test.js,
// E3; va desde E1, que es cuando aparecen los modelos).
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { after, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { crearMigrador } from '../db/migrar.js'
import { cerrarBase, prepararBase, salteoVisible, sql } from './ayudas.js'

const ESTE_ARCHIVO = fileURLToPath(import.meta.url)
const RAIZ = join(dirname(ESTE_ARCHIVO), '..', '..')
const CARPETA_MIGRACIONES = join(RAIZ, 'server', 'db', 'migraciones')

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

/** Los .js de una carpeta y sus subcarpetas, con la ruta completa. */
const archivosJs = (carpeta) =>
  readdirSync(carpeta, { recursive: true })
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(carpeta, f))

test('nadie sincroniza el esquema desde los modelos: ni sync( ni .sync en server/ ni compartido/', () => {
  // Con el límite de palabra: "async (" y "readFileSync(" no cuentan.
  const SYNC = /(^|[^\w$])sync\s*\(|\.sync\b/
  const hallados = []
  for (const carpeta of ['server', 'compartido']) {
    for (const archivo of archivosJs(join(RAIZ, carpeta))) {
      if (archivo === ESTE_ARCHIVO) continue // este archivo nombra la regla
      readFileSync(archivo, 'utf8')
        .split('\n')
        .forEach((linea, i) => {
          if (SYNC.test(linea)) hallados.push(`${archivo}:${i + 1}`)
        })
    }
  }
  assert.ok(archivosJs(join(RAIZ, 'server')).length > 20, 'recorrió server/')
  assert.deepEqual(hallados, [])
})

const tablas = async () =>
  (await sql(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`)).map((t) => t.tablename)

describe('migraciones', { skip: base.motivo ?? false }, () => {
  test('ida, vuelta de a una hasta el principio y otra vez ida, con SequelizeMeta al día', async () => {
    const migrador = crearMigrador(base.sequelize)
    const archivos = readdirSync(CARPETA_MIGRACIONES).filter((f) => f.endsWith('.js')).sort()
    assert.deepEqual((await migrador.executed()).map((m) => m.name), archivos, 'prepararBase aplicó todas, en orden')
    assert.deepEqual(await migrador.pending(), [])
    const todas = ['SequelizeMeta', 'horario_semanal', 'museo', 'sesiones', 'tarifas', 'usuarios']
    assert.deepEqual(await tablas(), todas)

    // Una por una, de la última a la primera: cada una se lleva solo lo suyo.
    assert.deepEqual((await migrador.down()).map((m) => m.name), [archivos[1]])
    assert.deepEqual(await tablas(), ['SequelizeMeta', 'sesiones', 'usuarios'])
    assert.deepEqual((await migrador.down()).map((m) => m.name), [archivos[0]])
    assert.deepEqual(await tablas(), ['SequelizeMeta'])
    assert.deepEqual(await sql('SELECT name FROM "SequelizeMeta"'), [])
    assert.deepEqual(await migrador.down(), [], 'no queda nada para deshacer')

    assert.deepEqual((await migrador.up()).map((m) => m.name), archivos)
    assert.deepEqual(await tablas(), todas)
    assert.deepEqual((await sql('SELECT name FROM "SequelizeMeta" ORDER BY name')).map((f) => f.name), archivos)
  })

  test('cada modelo coincide con las columnas de su tabla (nombres y NOT NULL)', async () => {
    // SequelizeMeta lo define umzug (SequelizeStorage) sobre la misma instancia: no es un modelo nuestro.
    const modelos = Object.values(base.sequelize.models).filter((m) => m.name !== 'SequelizeMeta')
    assert.deepEqual(modelos.map((m) => m.getTableName()).sort(), ['horario_semanal', 'museo', 'sesiones', 'tarifas', 'usuarios'])
    for (const modelo of modelos) {
      const tabla = modelo.getTableName()
      const columnas = await sql(
        `SELECT column_name, is_nullable FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = :tabla ORDER BY column_name`,
        { tabla },
      )
      const atributos = Object.values(modelo.getAttributes())
      assert.deepEqual(atributos.map((a) => a.field).sort(), columnas.map((c) => c.column_name), tabla)
      for (const a of atributos) {
        const columna = columnas.find((c) => c.column_name === a.field)
        const notNullEnLaTabla = columna.is_nullable === 'NO'
        const notNullEnElModelo = a.allowNull === false || a.primaryKey === true
        assert.equal(notNullEnElModelo, notNullEnLaTabla, `${tabla}.${a.field}`)
      }
    }
  })

  test('las restricciones con nombre del plan 3.2, y que rechazan lo que tienen que rechazar', async () => {
    const nombres = (
      await sql(
        `SELECT conname FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
          WHERE n.nspname = 'public' AND c.contype IN ('c', 'u', 'f', 'p') AND conrelid <> '"SequelizeMeta"'::regclass
          ORDER BY conname`,
      )
    ).map((c) => c.conname)
    assert.deepEqual(nombres, [
      'horario_dia_iso',
      'horario_semanal_pkey',
      'museo_actualizado_por_fkey',
      'museo_compra_https',
      'museo_mapa_embed_google',
      'museo_mapa_https',
      'museo_pkey',
      'museo_una_fila',
      'sesiones_pkey',
      'sesiones_token_unico',
      'sesiones_usuario_id_fkey',
      'tarifas_pkey',
      'tarifas_precio_no_negativo',
      'tarifas_precio_o_gratuita',
      'usuarios_email_minusculas',
      'usuarios_email_unico',
      'usuarios_pkey',
      'usuarios_rol_valido',
      'usuarios_temporal_con_vencimiento',
    ])
    const indices = (await sql(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'sesiones_usuario'`))
    assert.equal(indices.length, 1, 'el índice de sesiones por usuario')

    const usuario = (cambios) => {
      const fila = { email: 'ok@example.com', nombre: 'X', hash: 'h', debe: false, vence: null, rol: 'editor', ...cambios }
      return sql(
        `INSERT INTO usuarios (email, nombre, password_hash, debe_cambiar_clave, clave_temporal_vence, rol, created_at, updated_at)
         VALUES (:email, :nombre, :hash, :debe, :vence, :rol, now(), now())`,
        fila,
      )
    }
    // Con el código, además: 23514 un CHECK, 23505 un UNIQUE.
    const rechaza = (promesa, restriccion, codigo) =>
      assert.rejects(
        promesa,
        (err) => {
          const pg = err.parent ?? err.original
          return pg?.constraint === restriccion && (!codigo || pg.code === codigo)
        },
        restriccion,
      )
    await rechaza(usuario({ email: 'Mayus@example.com' }), 'usuarios_email_minusculas')
    await rechaza(usuario({ rol: 'jefe' }), 'usuarios_rol_valido')
    await rechaza(usuario({ debe: true, vence: null }), 'usuarios_temporal_con_vencimiento')
    await usuario({ email: 'repetido@example.com' })
    await rechaza(usuario({ email: 'repetido@example.com' }), 'usuarios_email_unico')
    await rechaza(sql(`INSERT INTO museo (id, updated_at) VALUES (2, now())`), 'museo_una_fila')
    await rechaza(sql(`UPDATE museo SET compra_url = 'http://ejemplo.com' WHERE id = 1`), 'museo_compra_https')
    await rechaza(sql(`UPDATE museo SET mapa_embed_url = 'https://maps.example.com/' WHERE id = 1`), 'museo_mapa_embed_google')
    await rechaza(sql(`UPDATE museo SET mapa_url = 'http://x.com' WHERE id = 1`), 'museo_mapa_https', '23514')
    await rechaza(sql(`INSERT INTO horario_semanal (dia) VALUES (8)`), 'horario_dia_iso')
    const tarifa = (gratuita, precio) =>
      sql(`INSERT INTO tarifas (nombre, gratuita, precio, created_at, updated_at) VALUES ('T', :gratuita, :precio, now(), now())`, {
        gratuita,
        precio,
      })
    await rechaza(tarifa(false, null), 'tarifas_precio_o_gratuita')
    await rechaza(tarifa(false, -1), 'tarifas_precio_no_negativo')
    await rechaza(sql(`INSERT INTO sesiones (usuario_id, token_hash, expira_en) VALUES (2147483647, :h, now())`, { h: 'a'.repeat(64) }), 'sesiones_usuario_id_fkey')
    // Dos sesiones con el mismo hash de token, de una cuenta que existe.
    const [{ id: usuarioId }] = await sql(`SELECT id FROM usuarios WHERE email = 'repetido@example.com'`)
    const sesion = () =>
      sql(`INSERT INTO sesiones (usuario_id, token_hash, expira_en) VALUES (:usuarioId, :h, now() + interval '1 hour')`, {
        usuarioId,
        h: 'b'.repeat(64),
      })
    await sesion()
    await rechaza(sesion(), 'sesiones_token_unico', '23505')
    // Lo válido entra (y se borra, para la prueba de abajo).
    await tarifa(true, null)
    await sql(`DELETE FROM tarifas`)
    await sql(`DELETE FROM usuarios`)
  })

  test('datos iniciales (plan 3.4): la fila del museo vacía, los 7 días cerrados y ninguna tarifa', async () => {
    const [museo, ...demas] = await sql('SELECT * FROM museo')
    assert.equal(demas.length, 0)
    assert.equal(museo.id, 1)
    assert.deepEqual(museo.redes, [])
    assert.equal(museo.compra_activa, false)
    const conDatos = Object.entries(museo).filter(([k, v]) => v !== null && !['id', 'redes', 'compra_activa', 'updated_at'].includes(k))
    assert.deepEqual(conDatos, [], 'no se inventa ningún dato del museo')
    assert.deepEqual(
      await sql('SELECT dia, abierto, franjas, nota FROM horario_semanal ORDER BY dia'),
      [1, 2, 3, 4, 5, 6, 7].map((dia) => ({ dia, abierto: false, franjas: [], nota: null })),
    )
    assert.deepEqual(await sql('SELECT id FROM tarifas'), [])
  })
})
