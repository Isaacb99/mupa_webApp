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
      // Este archivo y contenido.test.js (que la repite, plan 13.1) nombran la regla.
      if (archivo === ESTE_ARCHIVO || archivo === join(RAIZ, 'server', 'pruebas', 'contenido.test.js')) continue
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

// Las tablas que crea cada migración. Una migración nueva suma su línea: si no, la prueba de ida y vuelta falla.
const TABLAS_DE = {
  '20261013-01-usuarios.js': ['sesiones', 'usuarios'],
  '20261013-02-museo-visitas.js': ['horario_semanal', 'museo', 'tarifas'],
  '20261016-03-fotos.js': ['fotos', 'fotos_archivos'],
  '20261016-04-salas-muestras.js': ['galeria_muestras', 'muestras', 'salas'],
  '20261016-05-novedades.js': ['galeria_novedades', 'novedades'],
}

describe('migraciones', { skip: base.motivo ?? false }, () => {
  test('ida, vuelta de a una hasta el principio y otra vez ida, con SequelizeMeta al día', async () => {
    const migrador = crearMigrador(base.sequelize)
    const archivos = readdirSync(CARPETA_MIGRACIONES).filter((f) => f.endsWith('.js')).sort()
    assert.deepEqual(Object.keys(TABLAS_DE).sort(), archivos, 'cada migración con sus tablas en TABLAS_DE')
    assert.deepEqual((await migrador.executed()).map((m) => m.name), archivos, 'prepararBase aplicó todas, en orden')
    assert.deepEqual(await migrador.pending(), [])
    const hasta = (n) => ['SequelizeMeta', ...archivos.slice(0, n).flatMap((a) => TABLAS_DE[a])].sort()
    const todas = hasta(archivos.length)
    assert.deepEqual(await tablas(), todas)

    // Una por una, de la última a la primera: cada una se lleva solo lo suyo.
    for (let n = archivos.length; n > 0; n--) {
      assert.deepEqual((await migrador.down()).map((m) => m.name), [archivos[n - 1]])
      assert.deepEqual(await tablas(), hasta(n - 1), `después de deshacer ${archivos[n - 1]}`)
    }
    assert.deepEqual(await tablas(), ['SequelizeMeta'])
    assert.deepEqual(await sql('SELECT name FROM "SequelizeMeta"'), [])
    assert.deepEqual(await migrador.down(), [], 'no queda nada para deshacer')

    assert.deepEqual((await migrador.up()).map((m) => m.name), archivos)
    assert.deepEqual(await tablas(), todas)
    assert.deepEqual((await sql('SELECT name FROM "SequelizeMeta" ORDER BY name')).map((f) => f.name), archivos)
  })

  test('cada modelo coincide con las columnas de su tabla (nombres y NOT NULL)', async () => {
    // SequelizeMeta lo define umzug (SequelizeStorage) sobre la misma instancia: no es un modelo nuestro.
    // fotos_archivos no tiene modelo, a propósito: ningún findAll puede traer los archivos (server/db/modelos/Foto.js).
    const modelos = Object.values(base.sequelize.models).filter((m) => m.name !== 'SequelizeMeta')
    assert.deepEqual(modelos.map((m) => m.getTableName()).sort(), [
      'fotos',
      'galeria_muestras',
      'galeria_novedades',
      'horario_semanal',
      'muestras',
      'museo',
      'novedades',
      'salas',
      'sesiones',
      'tarifas',
      'usuarios',
    ])
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
      'fotos_alt_o_decorativa',
      'fotos_archivos_foto_id_fkey',
      'fotos_archivos_pkey',
      'fotos_archivos_variante_valida',
      'fotos_clave_hex',
      'fotos_clave_unico',
      'fotos_medidas_positivas',
      'fotos_pkey',
      'fotos_subida_por_fkey',
      'galeria_muestras_foto_id_fkey',
      'galeria_muestras_muestra_id_fkey',
      'galeria_muestras_pkey',
      'galeria_novedades_foto_id_fkey',
      'galeria_novedades_novedad_id_fkey',
      'galeria_novedades_pkey',
      'horario_dia_iso',
      'horario_semanal_pkey',
      'muestras_actualizado_por_fkey',
      'muestras_creado_por_fkey',
      'muestras_estado_valido',
      'muestras_fechas_en_orden',
      'muestras_pkey',
      'muestras_portada_id_fkey',
      'muestras_publicada_con_fecha',
      'muestras_sala_id_fkey',
      'muestras_slug_unico',
      'muestras_slug_valido',
      'muestras_temporal_con_inicio',
      'muestras_tipo_valido',
      'museo_actualizado_por_fkey',
      'museo_compra_https',
      'museo_mapa_embed_google',
      'museo_mapa_https',
      'museo_pkey',
      'museo_una_fila',
      'novedades_actividad_con_inicio',
      'novedades_actualizado_por_fkey',
      'novedades_creado_por_fkey',
      'novedades_estado_valido',
      'novedades_evento_en_orden',
      'novedades_inscripcion_https',
      'novedades_pkey',
      'novedades_portada_id_fkey',
      'novedades_publicada_con_fecha',
      'novedades_slug_unico',
      'novedades_slug_valido',
      'novedades_tipo_valido',
      'salas_actualizado_por_fkey',
      'salas_creado_por_fkey',
      'salas_estado_valido',
      'salas_pkey',
      'salas_plano_ref_unico',
      'salas_portada_id_fkey',
      'salas_publicada_con_fecha',
      'salas_slug_unico',
      'salas_slug_valido',
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
    const indices = (await sql(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname`)).map(
      (i) => i.indexname,
    )
    // El de sesiones por usuario (E1), los de las páginas públicas (plan 3.2) y uno por cada columna que apunta a fotos
    // (los EXISTS de liberarFotos y de la tarea de las huérfanas, E3.3 y E3.4).
    for (const indice of [
      'sesiones_usuario',
      'salas_publicas',
      'muestras_publicas',
      'novedades_publicas',
      'novedades_actividades',
      'muestras_sala',
      'salas_portada',
      'muestras_portada',
      'novedades_portada',
      'galeria_muestras_foto',
      'galeria_novedades_foto',
    ]) {
      assert.ok(indices.includes(indice), `el índice ${indice}`)
    }

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
    // Fotos (migración 03).
    const foto = (cambios) =>
      sql(
        `INSERT INTO fotos (clave, ancho, alto, variantes, bytes, alt, decorativa, created_at, updated_at)
         VALUES (:clave, :ancho, 10, '[480]', 100, :alt, :decorativa, now(), now()) RETURNING id`,
        { clave: '0123456789abcdef', ancho: 10, alt: 'Una foto', decorativa: false, ...cambios },
      )
    await rechaza(foto({ alt: '', decorativa: false }), 'fotos_alt_o_decorativa', '23514')
    await rechaza(foto({ clave: '0123456789ABCDEF' }), 'fotos_clave_hex')
    await rechaza(foto({ clave: 'zzzzzzzzzzzzzzzz' }), 'fotos_clave_hex')
    await rechaza(foto({ ancho: 0 }), 'fotos_medidas_positivas')
    const [{ id: fotoId }] = await foto({ alt: '', decorativa: true })
    await rechaza(foto({}), 'fotos_clave_unico', '23505')
    const archivo = (variante, id = fotoId) =>
      sql(`INSERT INTO fotos_archivos (foto_id, variante, datos, bytes) VALUES (:id, :variante, '\\x00'::bytea, 1)`, {
        id,
        variante,
      })
    await rechaza(archivo('2401'), 'fotos_archivos_variante_valida')
    await rechaza(archivo('960', 2147483647), 'fotos_archivos_foto_id_fkey')
    await archivo('960')
    await rechaza(archivo('960'), 'fotos_archivos_pkey')
    // Los archivos se van con la foto.
    await sql('DELETE FROM fotos WHERE id = :fotoId', { fotoId })
    assert.deepEqual(await sql('SELECT foto_id FROM fotos_archivos'), [])
    // Los archivos ya vienen comprimidos (WebP, JPEG): fuera de la fila y sin volver a comprimirlos (e = EXTERNAL).
    const [{ attstorage }] = await sql(
      `SELECT attstorage FROM pg_attribute WHERE attrelid = 'fotos_archivos'::regclass AND attname = 'datos'`,
    )
    assert.equal(attstorage, 'e')
    // Salas, muestras y novedades (migraciones 04 y 05).
    const [{ id: portadaId }] = await foto({ clave: '00000000000000aa' })
    const contenido = (tabla, columnas) => {
      const fila = { slug: 'una-direccion', estado: 'borrador', publicado_en: null, ...columnas }
      const nombres = Object.keys(fila)
      return sql(
        `INSERT INTO ${tabla} (${nombres.join(', ')}, created_at, updated_at)
         VALUES (${nombres.map((n) => `:${n}`).join(', ')}, now(), now()) RETURNING id`,
        fila,
      )
    }
    const sala = (c) => contenido('salas', { nombre: 'Sala', ...c })
    const muestra = (c) => contenido('muestras', { titulo: 'Muestra', tipo: 'temporal', ...c })
    const novedad = (c) => contenido('novedades', { titulo: 'Novedad', tipo: 'noticia', ...c })
    for (const [crear, tabla] of [
      [sala, 'salas'],
      [muestra, 'muestras'],
      [novedad, 'novedades'],
    ]) {
      await rechaza(crear({ slug: 'Con-Mayusculas' }), `${tabla}_slug_valido`, '23514')
      await rechaza(crear({ slug: 'doble--guion' }), `${tabla}_slug_valido`)
      await rechaza(crear({ slug: '-guion' }), `${tabla}_slug_valido`)
      await rechaza(crear({ estado: 'archivado' }), `${tabla}_estado_valido`)
      await rechaza(crear({ estado: 'publicado' }), `${tabla}_publicada_con_fecha`)
      await rechaza(crear({ portada_id: 2147483647 }), `${tabla}_portada_id_fkey`)
      await crear({ slug: 'repetida' })
      await rechaza(crear({ slug: 'repetida' }), `${tabla}_slug_unico`, '23505')
    }
    await sala({ slug: 'con-plano', plano_ref: 'sala-1' })
    await rechaza(sala({ slug: 'otra-con-plano', plano_ref: 'sala-1' }), 'salas_plano_ref_unico', '23505')
    await rechaza(muestra({ tipo: 'itinerante' }), 'muestras_tipo_valido')
    await rechaza(muestra({ fecha_inicio: '2026-10-20', fecha_fin: '2026-10-19' }), 'muestras_fechas_en_orden')
    await rechaza(muestra({ estado: 'publicado', publicado_en: new Date() }), 'muestras_temporal_con_inicio')
    await muestra({ slug: 'permanente-publicada', tipo: 'permanente', estado: 'publicado', publicado_en: new Date() })
    await rechaza(muestra({ sala_id: 2147483647 }), 'muestras_sala_id_fkey')
    await rechaza(novedad({ tipo: 'evento' }), 'novedades_tipo_valido')
    await rechaza(novedad({ enlace_inscripcion: 'http://inscripcion.example.com' }), 'novedades_inscripcion_https')
    await rechaza(
      novedad({ tipo: 'actividad', evento_inicio: '2026-10-20T18:00:00-03:00', evento_fin: '2026-10-20T17:00:00-03:00' }),
      'novedades_evento_en_orden',
    )
    await rechaza(
      novedad({ tipo: 'actividad', estado: 'publicado', publicado_en: new Date() }),
      'novedades_actividad_con_inicio',
    )
    // Las galerías: la foto existe, una vez por contenido; se van con el contenido; una foto en uso no se borra.
    const [{ id: muestraId }] = await muestra({ slug: 'con-galeria', portada_id: portadaId })
    const [{ id: novedadId }] = await novedad({ slug: 'con-galeria' })
    const lugar = (tabla, columna, id, fotoId) =>
      sql(`INSERT INTO ${tabla} (${columna}, foto_id, orden) VALUES (:id, :fotoId, 1)`, { id, fotoId })
    await rechaza(lugar('galeria_muestras', 'muestra_id', muestraId, 2147483647), 'galeria_muestras_foto_id_fkey')
    await rechaza(lugar('galeria_novedades', 'novedad_id', 2147483647, portadaId), 'galeria_novedades_novedad_id_fkey')
    await lugar('galeria_muestras', 'muestra_id', muestraId, portadaId)
    await rechaza(lugar('galeria_muestras', 'muestra_id', muestraId, portadaId), 'galeria_muestras_pkey')
    await lugar('galeria_novedades', 'novedad_id', novedadId, portadaId)
    await rechaza(sql('DELETE FROM fotos WHERE id = :portadaId', { portadaId }), 'muestras_portada_id_fkey', '23503')
    await sql('DELETE FROM muestras WHERE id = :muestraId', { muestraId })
    await sql('DELETE FROM novedades WHERE id = :novedadId', { novedadId })
    assert.deepEqual(await sql('SELECT * FROM galeria_muestras'), [])
    assert.deepEqual(await sql('SELECT * FROM galeria_novedades'), [])
    // Lo válido entra (y se borra, para la prueba de abajo).
    await tarifa(true, null)
    await sql(`DELETE FROM tarifas`)
    await sql(`DELETE FROM novedades`)
    await sql(`DELETE FROM muestras`)
    await sql(`DELETE FROM salas`)
    await sql(`DELETE FROM fotos`)
    await sql(`DELETE FROM usuarios`)
  })

  test('datos iniciales (plan 3.4): la fila del museo vacía, los 7 días cerrados, ninguna tarifa, foto ni contenido', async () => {
    assert.deepEqual(await sql('SELECT id FROM fotos'), [])
    for (const tabla of ['salas', 'muestras', 'novedades']) assert.deepEqual(await sql(`SELECT id FROM ${tabla}`), [], tabla)
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
