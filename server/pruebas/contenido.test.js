// Contenidos (E3.3, E3.4 y E3.5; plan 3.2, 4.3, 5.3, 5.4 y 13.1): novedades, muestras y salas por la API del panel
// (server/api/contenido.js). Todavía no hay páginas públicas (llegan con E4): lo de "un borrador da 404 en el sitio y
// publicar se ve en el pedido siguiente" lo suma E4, cuando las prenda (PAGINAS_PUBLICAS_DE_CONTENIDO); hasta entonces
// se prueba que esas direcciones den la 404 del sitio.
// Sin base (corren siempre): la dirección web (crearSlug, -2, -3…), la página pública, los estados calculados, la hora
// de San Juan de las actividades, los esquemas (lo que falta para publicar, javascript:) y el grep de sync( y de
// dangerouslySetInnerHTML.
// Con base: borrador, publicar y despublicar (publicado_en una sola vez, la dirección fija), la dirección única (en el
// alta con -2, -3…, también con altas a la vez; en un cambio, 409 en su campo), la validación al publicar (también al
// guardar algo publicado, y la portada decorativa), el listado (filtros, búsqueda con % y _, páginas), la galería
// (fotos que no existen: 409), eliminar y reemplazar liberan solo las fotos sin uso, la sala de una muestra, el orden
// de salas y muestras, y que el log no lleve los títulos. Desde la corrección de E3 (16/10/2026): borrar una foto que
// otra transacción está empezando a usar no da 500 (ni en un pedido ni en la tarea diaria), la galería y la portada de
// una pestaña vieja no borran lo que agregó otra persona (antes, portadaAntes), el 409 de una foto que ya no está dice
// cuál (faltan) y el PUT de un contenido admite 300 kB (un texto con demasiado formato da 400 en su campo).
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  crearSlug,
  PAGINAS_PUBLICAS_DE_CONTENIDO,
  PATRON_SLUG,
  SLUG_MAX,
  slugDeTitulo,
  slugNumerado,
  urlPublica,
} from '../../compartido/contenidos.js'
import {
  esquemaListado,
  esquemaMuestra,
  esquemaNovedad,
  esquemaSala,
  problemasParaPublicar,
  PORTADA_DECORATIVA,
  TIPOS_NOVEDAD,
} from '../../compartido/esquemas/contenido.js'
import { actividadRealizada, situacionDeMuestra } from '../../compartido/estados.js'
import { instanteDeLocal, localDeInstante } from '../../compartido/fechas.js'
import { VARIANTES_FOTO } from '../../compartido/fotos.js'
import { escapeLike } from '../api/entrada.js'
import { cargarEjemplo } from '../db/semillas/ejemplo.js'
import { crearAlmacen } from '../fotos/almacen.js'
import { cerrarBase, escucharLogs, levantar, prepararBase, salteoVisible, sql } from './ayudas.js'

/** Espera a que algún pedido quede trabado esperando un bloqueo de la base (como en auth.test.js). */
async function esperarBloqueo() {
  for (let i = 0; i < 100; i++) {
    const [{ n }] = await sql(
      `SELECT count(*) AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`,
    )
    if (Number(n) > 0) return
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('ningún pedido quedó esperando el bloqueo')
}

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))

const base = await prepararBase()
after(cerrarBase)
salteoVisible(base)

/** Un texto con formato válido (un párrafo). */
const parrafo = (texto) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: texto }] }] })

/** Los esquemas completos con todo lo opcional en null (lo que manda una ficha recién creada). */
const novedadVacia = (c = {}) => ({
  tipo: 'noticia',
  titulo: 'Una novedad',
  slug: null,
  resumen: null,
  cuerpo: null,
  portadaId: null,
  eventoInicio: null,
  eventoFin: null,
  lugar: null,
  costo: null,
  enlaceInscripcion: null,
  ...c,
})
const muestraVacia = (c = {}) => ({
  tipo: 'temporal',
  titulo: 'Una muestra',
  slug: null,
  resumen: null,
  descripcion: null,
  portadaId: null,
  fechaInicio: null,
  fechaFin: null,
  salaId: null,
  ...c,
})
const salaVacia = (c = {}) => ({ nombre: 'Una sala', slug: null, resumen: null, descripcion: null, portadaId: null, ...c })

// --- Sin base ---

describe('la dirección web, la página pública, los estados y las horas (sin base)', () => {
  test('crearSlug: minúsculas, sin acentos ni signos, con guiones; vacío si no hay letras ni números', () => {
    assert.equal(crearSlug('Noche de los Museos 2026'), 'noche-de-los-museos-2026')
    assert.equal(crearSlug('  Año Ñandú: ¿qué? — Œuvre, Straße  '), 'ano-nandu-que-oeuvre-strasse')
    assert.equal(crearSlug('«Dinosaurios» & cía.'), 'dinosaurios-cia')
    assert.equal(crearSlug('🦖🦕'), '')
    assert.equal(slugDeTitulo('novedades', '🦖'), 'novedad')
    assert.equal(slugDeTitulo('muestras', '!!!'), 'muestra')
    assert.equal(slugDeTitulo('salas', ''), 'sala')
    for (const titulo of ['Ñ', 'a--b', '-x-', 'Sala 2 (planta baja)']) assert.match(crearSlug(titulo), PATRON_SLUG)
  })

  test('el largo: se corta en un guion, sin guion al final; con número, entra en el máximo', () => {
    const largo = crearSlug('palabra '.repeat(40), SLUG_MAX.salas)
    assert.ok(largo.length <= SLUG_MAX.salas)
    assert.match(largo, /^palabra(-palabra)*$/)
    const numerado = slugNumerado('a'.repeat(180), 12, 180)
    assert.equal(numerado.length, 180)
    assert.ok(numerado.endsWith('-12'))
    assert.equal(slugNumerado('noche', 2, 180), 'noche-2')
  })

  test('urlPublica (plan 6.1) y "Ver en el sitio" apagado hasta E4', () => {
    assert.equal(urlPublica('novedades', 'noche'), '/novedades/noche')
    assert.equal(urlPublica('muestras', 'triasico'), '/exposiciones/triasico')
    assert.equal(urlPublica('salas', 'sala-1'), '/exposiciones#sala-sala-1')
    assert.throws(() => urlPublica('otra', 'x'))
    assert.equal(PAGINAS_PUBLICAS_DE_CONTENIDO, false)
  })

  test('la situación de una muestra con el "hoy" de San Juan', () => {
    const hoy = '2026-10-16'
    const temporal = (fechaInicio, fechaFin = null) => situacionDeMuestra({ tipo: 'temporal', fechaInicio, fechaFin }, hoy)
    assert.equal(situacionDeMuestra({ tipo: 'permanente', fechaInicio: null, fechaFin: '2000-01-01' }, hoy), 'permanente')
    assert.equal(temporal('2026-10-17'), 'proxima')
    assert.equal(temporal('2026-10-16'), 'actual')
    assert.equal(temporal('2026-01-01', '2026-10-16'), 'actual')
    assert.equal(temporal('2026-01-01', '2026-10-15'), 'finalizada')
    assert.equal(temporal(null), null)
    assert.equal(temporal(null, '2026-10-01'), 'finalizada')
  })

  test('una actividad es "Realizada" cuando terminó (o empezó, si no tiene fin)', () => {
    const ahora = new Date('2026-10-16T21:00:00Z') // 18:00 en San Juan
    assert.equal(actividadRealizada({ eventoInicio: '2026-10-16T17:59', eventoFin: null }, ahora), true)
    assert.equal(actividadRealizada({ eventoInicio: '2026-10-16T18:01', eventoFin: null }, ahora), false)
    assert.equal(actividadRealizada({ eventoInicio: '2026-10-16T10:00', eventoFin: '2026-10-16T19:00' }, ahora), false)
    assert.equal(actividadRealizada({ eventoInicio: new Date('2026-10-01T12:00:00Z'), eventoFin: null }, ahora), true)
    assert.equal(actividadRealizada({ eventoInicio: null, eventoFin: null }, ahora), false)
  })

  test('la hora de San Juan: un datetime-local se lee como -03:00 y vuelve igual', () => {
    assert.equal(instanteDeLocal('2026-10-20T18:30').toISOString(), '2026-10-20T21:30:00.000Z')
    assert.equal(instanteDeLocal('2026-12-31T23:59').toISOString(), '2027-01-01T02:59:00.000Z')
    assert.equal(localDeInstante('2026-10-20T21:30:00.000Z'), '2026-10-20T18:30')
    assert.equal(localDeInstante(new Date('2027-01-01T02:59:00Z')), '2026-12-31T23:59')
    for (const malo of ['2026-02-30T10:00', '2026-10-20T24:00', '2026-10-20 18:30', '2026-10-20T18:30:00', '', null]) {
      assert.equal(instanteDeLocal(malo), null, String(malo))
    }
    assert.equal(localDeInstante(null), null)
  })

  test('los esquemas: lo que no es del tipo queda vacío; fechas en orden; javascript: y nodos prohibidos, 400', () => {
    const noticia = esquemaNovedad.parse(novedadVacia({ eventoInicio: '2026-10-20T18:30', lugar: 'Patio', costo: 'Gratis' }))
    assert.deepEqual([noticia.eventoInicio, noticia.lugar, noticia.costo], [null, null, null])
    const actividad = esquemaNovedad.safeParse(
      novedadVacia({ tipo: 'actividad', eventoInicio: '2026-10-20T18:30', eventoFin: '2026-10-20T18:00' }),
    )
    assert.equal(actividad.error.issues[0].path.join('.'), 'eventoFin')
    const soloFin = esquemaNovedad.safeParse(novedadVacia({ tipo: 'actividad', eventoFin: '2026-10-20T18:00' }))
    assert.equal(soloFin.error.issues[0].path.join('.'), 'eventoInicio')
    const permanente = esquemaMuestra.parse(muestraVacia({ tipo: 'permanente', fechaInicio: '2026-01-01' }))
    assert.equal(permanente.fechaInicio, null)
    const alReves = esquemaMuestra.safeParse(muestraVacia({ fechaInicio: '2026-10-20', fechaFin: '2026-10-19' }))
    assert.equal(alReves.error.issues[0].path.join('.'), 'fechaFin')
    const enlace = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'clic', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }],
        },
      ],
    }
    const imagen = { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.com/x.png' } }] }
    for (const malo of [enlace, imagen, '<p>html</p>']) {
      assert.equal(esquemaNovedad.safeParse(novedadVacia({ cuerpo: malo })).error.issues[0].path.join('.'), 'cuerpo')
      assert.equal(esquemaSala.safeParse(salaVacia({ descripcion: malo })).error.issues[0].path.join('.'), 'descripcion')
    }
    // La dirección: solo el patrón (vacía, null: la arma el servidor).
    assert.equal(esquemaSala.parse(salaVacia({ slug: '' })).slug, null)
    for (const malo of ['Con Espacios', 'con--doble', 'ñandu', 'x'.repeat(141)]) {
      assert.equal(esquemaSala.safeParse(salaVacia({ slug: malo })).success, false, malo)
    }
    // Un campo que falta: 400 (el PUT recibe el esquema completo).
    const { resumen, ...sinResumen } = novedadVacia()
    assert.equal(esquemaNovedad.safeParse(sinResumen).success, false)
    assert.equal(resumen, null)
  })

  test('lo que falta para publicar (lo marcado con * en el plan 5.3)', () => {
    assert.deepEqual(Object.keys(problemasParaPublicar('novedades', novedadVacia())), ['resumen', 'portadaId', 'cuerpo'])
    assert.ok('eventoInicio' in problemasParaPublicar('novedades', novedadVacia({ tipo: 'actividad' })))
    assert.deepEqual(Object.keys(problemasParaPublicar('muestras', muestraVacia())), [
      'resumen',
      'portadaId',
      'descripcion',
      'fechaInicio',
    ])
    assert.ok(!('fechaInicio' in problemasParaPublicar('muestras', muestraVacia({ tipo: 'permanente' }))))
    assert.deepEqual(Object.keys(problemasParaPublicar('salas', salaVacia())), ['resumen', 'portadaId'])
    assert.deepEqual(problemasParaPublicar('salas', salaVacia({ resumen: 'R', portadaId: 3 })), {})
  })

  test('el listado: filtros, búsqueda y páginas; lo malo da error (400)', () => {
    const esquema = esquemaListado(TIPOS_NOVEDAD)
    // Sin los filtros que no vinieron (quedan en undefined).
    const sinVacios = (o) => JSON.parse(JSON.stringify(o))
    assert.deepEqual(sinVacios(esquema.parse({})), { pagina: 1, por: 20 })
    assert.deepEqual(sinVacios(esquema.parse({ estado: '', tipo: '', q: '   ', pagina: '' })), { pagina: 1, por: 20 })
    assert.deepEqual(esquema.parse({ estado: 'publicado', tipo: 'actividad', q: ' taller ', pagina: '2', por: '100' }), {
      estado: 'publicado',
      tipo: 'actividad',
      q: 'taller',
      pagina: 2,
      por: 100,
    })
    for (const malo of [{ estado: 'otro' }, { tipo: 'evento' }, { por: '101' }, { pagina: '0' }, { pagina: 'x' }, { q: ['a', 'b'] }]) {
      assert.equal(esquema.safeParse(malo).success, false, JSON.stringify(malo))
    }
    // Una sala no tiene tipo: el filtro no existe (se descarta).
    assert.equal('tipo' in esquemaListado(null).parse({ tipo: 'noticia' }), false)
    assert.equal(escapeLike('50%_off\\'), '50\\%\\_off\\\\')
  })

  test('nadie sincroniza el esquema ni usa HTML crudo: ni sync( ni dangerouslySetInnerHTML en server/, panel/src, src/ ni compartido/', () => {
    const SYNC = /(^|[^\w$])sync\s*\(|\.sync\b/
    const CRUDO = /dangerouslySetInnerHTML|\.innerHTML\s*=/
    // Las pruebas que nombran las reglas (este archivo, la de las migraciones y la de los textos con formato).
    const NOMBRAN_LA_REGLA = ['contenido.test.js', 'migraciones.test.js', 'textoRico.test.js'].map((a) =>
      join(RAIZ, 'server', 'pruebas', a),
    )
    const hallados = []
    let revisados = 0
    const recorrer = (carpeta) => {
      for (const e of readdirSync(carpeta, { withFileTypes: true })) {
        const ruta = join(carpeta, e.name)
        if (e.isDirectory()) recorrer(ruta)
        else if (/\.(jsx?|mjs)$/.test(e.name) && !NOMBRAN_LA_REGLA.includes(ruta)) {
          revisados += 1
          readFileSync(ruta, 'utf8')
            .split('\n')
            .forEach((linea, i) => {
              if (SYNC.test(linea) || CRUDO.test(linea)) hallados.push(`${ruta}:${i + 1}`)
            })
        }
      }
    }
    for (const carpeta of ['server', join('panel', 'src'), 'src', 'compartido']) recorrer(join(RAIZ, carpeta))
    assert.ok(revisados > 100, `revisó ${revisados} archivos`)
    assert.deepEqual(hallados, [])
  })
})

// --- Con base ---

describe('contenidos con base', { skip: base.motivo ?? false }, () => {
  let s
  let editor
  let almacen
  before(async () => {
    almacen = crearAlmacen(base.sequelize)
    s = await levantar({}, { almacen })
    editor = await s.cookiePara('editor', { nombre: 'Editora de contenidos' })
  })
  after(() => s?.cerrar())

  /** Un pedido a la API con la sesión de la editora (o la de quien se pase). */
  const api = (metodo, ruta, cuerpo, quien = editor) =>
    s.pedir(metodo, `api:${ruta}`, { cookie: quien.cookie, cuerpo: cuerpo ?? (metodo === 'GET' || metodo === 'DELETE' ? undefined : {}) })

  /** Una foto guardada directo en el almacén (sin sharp: los archivos son unos bytes; acá no se sirven). */
  async function foto({ alt = 'Una foto de prueba', decorativa = false } = {}) {
    const archivos = VARIANTES_FOTO.map((variante) => ({ variante, datos: Buffer.from([1, 2, 3]) }))
    const f = await almacen.guardar(
      { alt: decorativa ? '' : alt, decorativa, epigrafe: null, credito: null, subidaPor: null },
      { ancho: 1200, alto: 800, variantes: [480, 960, 1600, 2400], bytes: 15, archivos },
    )
    return { id: f.id, clave: f.clave }
  }
  const existe = async (fotoId) => (await sql('SELECT id FROM fotos WHERE id = :fotoId', { fotoId })).length === 1
  const archivosDe = async (fotoId) =>
    (await sql('SELECT count(*)::int AS n FROM fotos_archivos WHERE foto_id = :fotoId', { fotoId }))[0].n

  /** Crea un borrador y lo deja completo para publicar. */
  async function novedadCompleta(c = {}) {
    const alta = await api('POST', '/novedades', { titulo: c.titulo ?? 'Novedad completa' })
    assert.equal(alta.status, 201, alta.texto)
    const portada = await foto()
    const r = await api(
      'PUT',
      `/novedades/${alta.json.data.id}`,
      novedadVacia({ titulo: alta.json.data.titulo, resumen: 'Un resumen', cuerpo: parrafo('El texto.'), portadaId: portada.id, ...c }),
    )
    assert.equal(r.status, 200, r.texto)
    return { ...r.json.data, portada }
  }

  test('alta: un borrador con el título; la dirección sale del título y, si ya está, con -2, -3…', async () => {
    const r = await api('POST', '/novedades', { titulo: 'Noche de los Museos 2026', creadoPor: 999, estado: 'publicado' })
    assert.equal(r.status, 201, r.texto)
    const n = r.json.data
    assert.equal(n.slug, 'noche-de-los-museos-2026')
    assert.equal(n.tipo, 'noticia')
    assert.equal(n.estado, 'borrador')
    assert.equal(n.publicadoEn, null)
    assert.equal(n.slugFijo, false)
    assert.deepEqual(n.galeria, [])
    assert.equal(n.portada, null)
    assert.equal(n.ultimaEdicion.nombre, 'Editora de contenidos')
    const [fila] = await sql('SELECT creado_por, actualizado_por, estado FROM novedades WHERE id = :id', { id: n.id })
    assert.deepEqual(fila, { creado_por: editor.usuario.id, actualizado_por: editor.usuario.id, estado: 'borrador' })

    const segunda = await api('POST', '/novedades', { titulo: 'Noche de los museos 2026' })
    const tercera = await api('POST', '/novedades', { titulo: '¡Noche de los museos 2026!', tipo: 'actividad' })
    assert.equal(segunda.json.data.slug, 'noche-de-los-museos-2026-2')
    assert.equal(tercera.json.data.slug, 'noche-de-los-museos-2026-3')
    assert.equal(tercera.json.data.tipo, 'actividad')
    assert.equal((await api('POST', '/novedades', { titulo: '🦖' })).json.data.slug, 'novedad')

    // Sin título: 400 en su campo. Muestra temporal por defecto.
    const sinTitulo = await api('POST', '/novedades', { titulo: '   ' })
    assert.equal(sinTitulo.status, 400)
    assert.ok(sinTitulo.json.campos.titulo)
    const muestra = await api('POST', '/muestras', { titulo: 'Triásico' })
    assert.equal(muestra.json.data.tipo, 'temporal')
    const sala = await api('POST', '/salas', { nombre: 'Sala 1' })
    assert.equal(sala.json.data.slug, 'sala-1')
    assert.ok(!('galeria' in sala.json.data), 'las salas no tienen galería (llega con el plano)')
  })

  test('altas a la vez con el mismo título: cada una con su dirección', async () => {
    // Más que las conexiones del pool (5): las altas van de a una y ninguna choca.
    for (const tipo of ['novedades', 'muestras']) {
      const respuestas = await Promise.all(Array.from({ length: 8 }, () => api('POST', `/${tipo}`, { titulo: 'Simultánea' })))
      assert.deepEqual(respuestas.map((r) => r.status), Array(8).fill(201), tipo)
      const slugs = respuestas.map((r) => r.json.data.slug).sort()
      assert.deepEqual(slugs, ['simultanea', ...[2, 3, 4, 5, 6, 7, 8].map((n) => `simultanea-${n}`)].sort(), tipo)
    }
  })

  test('cambiar un borrador: el PUT completo; la dirección vacía se arma con el título; repetida, 409 en su campo', async () => {
    const { data: a } = (await api('POST', '/novedades', { titulo: 'Taller de fósiles' })).json
    const { data: b } = (await api('POST', '/novedades', { titulo: 'Charla' })).json
    // Un campo que falta: 400 sin cambiar nada.
    const { cuerpo, ...sinCuerpo } = novedadVacia({ titulo: 'Otro título' })
    assert.equal(cuerpo, null)
    assert.equal((await api('PUT', `/novedades/${a.id}`, sinCuerpo)).status, 400)
    // La dirección a mano.
    const propia = await api('PUT', `/novedades/${a.id}`, novedadVacia({ titulo: 'Taller de fósiles', slug: 'taller' }))
    assert.equal(propia.status, 200, propia.texto)
    assert.equal(propia.json.data.slug, 'taller')
    // La de otra: 409 en su campo.
    const repetida = await api('PUT', `/novedades/${b.id}`, novedadVacia({ titulo: 'Charla', slug: 'taller' }))
    assert.equal(repetida.status, 409)
    assert.match(repetida.json.campos.slug, /Ya hay otra novedad con esa dirección/)
    // Vacía: se arma con el título (el de ahora).
    const vacia = await api('PUT', `/novedades/${b.id}`, novedadVacia({ titulo: 'Charla sobre el Triásico', slug: '' }))
    assert.equal(vacia.json.data.slug, 'charla-sobre-el-triasico')
    // Mal escrita: 400 (el panel la arregla antes de mandar).
    assert.equal((await api('PUT', `/novedades/${b.id}`, novedadVacia({ slug: 'Con Espacios' }))).status, 400)
    // Lo que no es del PUT se descarta: el estado, publicado_en, quién.
    const deMas = await api('PUT', `/novedades/${b.id}`, {
      ...novedadVacia({ titulo: 'Charla', slug: 'charla' }),
      estado: 'publicado',
      publicadoEn: '2020-01-01T00:00:00Z',
      actualizadoPor: 999,
    })
    assert.equal(deMas.status, 200)
    assert.equal(deMas.json.data.estado, 'borrador')
    assert.equal(deMas.json.data.publicadoEn, null)
    // No existe: 404.
    assert.equal((await api('PUT', '/novedades/2147483647', novedadVacia())).status, 404)
  })

  test('actividad: la hora de San Juan ida y vuelta; el fin antes del inicio, 400; la noticia guarda vacíos esos datos', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Visita nocturna', tipo: 'actividad' })).json
    const r = await api(
      'PUT',
      `/novedades/${n.id}`,
      novedadVacia({
        tipo: 'actividad',
        titulo: 'Visita nocturna',
        eventoInicio: '2026-11-20T20:30',
        eventoFin: '2026-11-20T23:00',
        lugar: 'Patio del museo',
        costo: 'Gratis',
        enlaceInscripcion: 'HTTPS://inscripcion.example.com/nocturna',
      }),
    )
    assert.equal(r.status, 200, r.texto)
    assert.equal(r.json.data.eventoInicio, '2026-11-20T20:30')
    assert.equal(r.json.data.enlaceInscripcion, 'https://inscripcion.example.com/nocturna')
    const [fila] = await sql('SELECT evento_inicio, evento_fin FROM novedades WHERE id = :id', { id: n.id })
    assert.equal(fila.evento_inicio.toISOString(), '2026-11-20T23:30:00.000Z')
    assert.equal(fila.evento_fin.toISOString(), '2026-11-21T02:00:00.000Z')
    const alReves = await api(
      'PUT',
      `/novedades/${n.id}`,
      novedadVacia({ tipo: 'actividad', titulo: 'Visita', eventoInicio: '2026-11-20T20:30', eventoFin: '2026-11-20T19:00' }),
    )
    assert.equal(alReves.status, 400)
    assert.ok(alReves.json.campos.eventoFin)
    const inscripcion = await api(
      'PUT',
      `/novedades/${n.id}`,
      novedadVacia({ tipo: 'actividad', titulo: 'Visita', enlaceInscripcion: 'http://inseguro.example.com' }),
    )
    assert.equal(inscripcion.status, 400)
    assert.ok(inscripcion.json.campos.enlaceInscripcion)
    // Pasa a noticia: lo de la actividad queda vacío.
    const noticia = await api('PUT', `/novedades/${n.id}`, {
      ...r.json.data,
      tipo: 'noticia',
      slug: r.json.data.slug,
    })
    assert.equal(noticia.status, 200, noticia.texto)
    const [vacia] = await sql('SELECT evento_inicio, lugar, costo, enlace_inscripcion FROM novedades WHERE id = :id', { id: n.id })
    assert.deepEqual(vacia, { evento_inicio: null, lugar: null, costo: null, enlace_inscripcion: null })
  })

  test('publicar: valida, pone publicado_en una sola vez y fija la dirección; despublicar vuelve a borrador', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Para publicar', tipo: 'actividad' })).json
    // Incompleta: 400 con lo que falta, sin publicar.
    const incompleta = await api('POST', `/novedades/${n.id}/publicar`)
    assert.equal(incompleta.status, 400)
    assert.deepEqual(Object.keys(incompleta.json.campos).sort(), ['cuerpo', 'eventoInicio', 'portadaId', 'resumen'])
    assert.equal((await sql('SELECT estado FROM novedades WHERE id = :id', { id: n.id }))[0].estado, 'borrador')
    // Con una portada decorativa: tampoco.
    const decorativa = await foto({ decorativa: true })
    const completa = novedadVacia({
      tipo: 'actividad',
      titulo: 'Para publicar',
      slug: n.slug,
      resumen: 'Resumen',
      cuerpo: parrafo('Texto.'),
      portadaId: decorativa.id,
      eventoInicio: '2026-12-01T10:00',
    })
    assert.equal((await api('PUT', `/novedades/${n.id}`, completa)).status, 200)
    const conDecorativa = await api('POST', `/novedades/${n.id}/publicar`)
    assert.equal(conDecorativa.status, 400)
    assert.deepEqual(conDecorativa.json.campos, { portadaId: PORTADA_DECORATIVA })
    // Con una de verdad: publicada, con fecha y la dirección fija. La decorativa se liberó (nadie más la usaba).
    const portada = await foto()
    assert.equal((await api('PUT', `/novedades/${n.id}`, { ...completa, portadaId: portada.id })).status, 200)
    assert.equal(await existe(decorativa.id), false)
    const publicada = await api('POST', `/novedades/${n.id}/publicar`)
    assert.equal(publicada.status, 200, publicada.texto)
    assert.equal(publicada.json.data.estado, 'publicado')
    assert.equal(publicada.json.data.slugFijo, true)
    const fecha = publicada.json.data.publicadoEn
    assert.ok(fecha)
    // Publicar otra vez no cambia la fecha.
    assert.equal((await api('POST', `/novedades/${n.id}/publicar`)).json.data.publicadoEn, fecha)
    // La dirección, fija: otra da 409 en su campo; vacía, queda la que tenía.
    const otraDireccion = await api('PUT', `/novedades/${n.id}`, { ...completa, portadaId: portada.id, slug: 'otra' })
    assert.equal(otraDireccion.status, 409)
    assert.match(otraDireccion.json.campos.slug, /queda fija/)
    const sinDireccion = await api('PUT', `/novedades/${n.id}`, { ...completa, portadaId: portada.id, slug: null, titulo: 'Título nuevo' })
    assert.equal(sinDireccion.json.data.slug, n.slug)
    // Publicada, guardar sin lo necesario para publicar: 400 y nada cambia.
    const sinResumen = await api('PUT', `/novedades/${n.id}`, { ...completa, portadaId: portada.id, resumen: null })
    assert.equal(sinResumen.status, 400)
    assert.ok(sinResumen.json.campos.resumen)
    assert.equal((await sql('SELECT resumen FROM novedades WHERE id = :id', { id: n.id }))[0].resumen, 'Resumen')
    // Despublicar: borrador, con la fecha de la primera publicación y la dirección todavía fija.
    const despublicada = await api('POST', `/novedades/${n.id}/despublicar`)
    assert.equal(despublicada.status, 200)
    assert.equal(despublicada.json.data.estado, 'borrador')
    assert.equal(despublicada.json.data.publicadoEn, fecha)
    assert.equal(despublicada.json.data.slugFijo, true)
    assert.equal((await api('PUT', `/novedades/${n.id}`, { ...completa, portadaId: portada.id, slug: 'otra' })).status, 409)
    // Como borrador ya se puede guardar incompleta; volver a publicar conserva la fecha.
    assert.equal((await api('PUT', `/novedades/${n.id}`, { ...completa, portadaId: portada.id, resumen: null })).status, 200)
    assert.equal((await api('POST', `/novedades/${n.id}/publicar`)).status, 400)
    await api('PUT', `/novedades/${n.id}`, { ...completa, portadaId: portada.id })
    assert.equal((await api('POST', `/novedades/${n.id}/publicar`)).json.data.publicadoEn, fecha)
  })

  test('muestras y salas: lo que piden para publicar; la sala de una muestra existe (si no, 409)', async () => {
    const { data: sala } = (await api('POST', '/salas', { nombre: 'Sala de los dinosaurios' })).json
    assert.deepEqual(Object.keys((await api('POST', `/salas/${sala.id}/publicar`)).json.campos).sort(), ['portadaId', 'resumen'])
    const portadaSala = await foto()
    const salaCompleta = salaVacia({ nombre: sala.nombre, resumen: 'Dinosaurios', portadaId: portadaSala.id })
    assert.equal((await api('PUT', `/salas/${sala.id}`, salaCompleta)).status, 200)
    assert.equal((await api('POST', `/salas/${sala.id}/publicar`)).status, 200)

    const { data: m } = (await api('POST', '/muestras', { titulo: 'Bichos del Triásico' })).json
    const faltan = (await api('POST', `/muestras/${m.id}/publicar`)).json.campos
    assert.deepEqual(Object.keys(faltan).sort(), ['descripcion', 'fechaInicio', 'portadaId', 'resumen'])
    const portada = await foto()
    const completa = muestraVacia({
      titulo: m.titulo,
      slug: m.slug,
      resumen: 'Resumen',
      descripcion: parrafo('Descripción.'),
      portadaId: portada.id,
      fechaInicio: '2026-10-01',
      fechaFin: '2026-12-31',
      salaId: sala.id,
    })
    assert.equal((await api('PUT', `/muestras/${m.id}`, completa)).status, 200)
    assert.equal((await api('POST', `/muestras/${m.id}/publicar`)).status, 200)
    // Una sala que no existe: 409 en su campo.
    const sinSala = await api('PUT', `/muestras/${m.id}`, { ...completa, salaId: 2147483647 })
    assert.equal(sinSala.status, 409)
    assert.ok(sinSala.json.campos.salaId)
    // Publicada y pasada a permanente: sin fechas (no le hacen falta).
    const permanente = await api('PUT', `/muestras/${m.id}`, { ...completa, tipo: 'permanente' })
    assert.equal(permanente.status, 200)
    assert.deepEqual([permanente.json.data.fechaInicio, permanente.json.data.fechaFin], [null, null])
    // Eliminar la sala: la muestra queda sin sala.
    assert.equal((await api('DELETE', `/salas/${sala.id}`)).status, 200)
    assert.equal((await api('GET', `/muestras/${m.id}`)).json.data.salaId, null)
    assert.equal(await existe(portadaSala.id), false, 'la portada de la sala se liberó')
  })

  test('textos con formato: un nodo prohibido o un enlace javascript: dan 400 en su campo; se guardan en la forma canónica', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Con texto' })).json
    const javascript = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] },
      ],
    }
    const imagen = { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.com/a.png' } }] }
    for (const malo of [javascript, imagen, '<script>alert(1)</script>']) {
      const r = await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: 'Con texto', resumen: 'Cambia', cuerpo: malo }))
      assert.equal(r.status, 400)
      assert.deepEqual(Object.keys(r.json.campos), ['cuerpo'])
    }
    assert.equal((await sql('SELECT resumen FROM novedades WHERE id = :id', { id: n.id }))[0].resumen, null)
    // La forma canónica: sin el párrafo vacío del final y con los textos iguales juntos.
    const crudo = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hola ' }, { type: 'text', text: 'mundo' }] },
        { type: 'paragraph' },
      ],
    }
    const r = await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: 'Con texto', cuerpo: crudo }))
    assert.equal(r.status, 200)
    assert.deepEqual(r.json.data.cuerpo, parrafo('Hola mundo'))
    const { data: m } = (await api('POST', '/muestras', { titulo: 'Con descripción' })).json
    const malaMuestra = await api('PUT', `/muestras/${m.id}`, muestraVacia({ titulo: 'Con descripción', descripcion: javascript }))
    assert.deepEqual(Object.keys(malaMuestra.json.campos), ['descripcion'])
  })

  test('galería: en orden; fotos que no existen, 409 «volvé a subirla»; quitar una la libera si nadie más la usa', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Con galería' })).json
    const [a, b, c] = [await foto(), await foto(), await foto()]
    const r = await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [c.id, a.id, b.id] })
    assert.equal(r.status, 200, r.texto)
    assert.deepEqual(r.json.data.galeria.map((f) => f.id), [c.id, a.id, b.id])
    assert.equal(r.json.data.galeria[0].clave, c.clave)
    // Una que no existe (p. ej. la borró la tarea diaria): 409 y la galería queda como estaba.
    const noEsta = await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [a.id, 2147483647] })
    assert.equal(noEsta.status, 409)
    assert.match(noEsta.json.campos.fotos, /Volvé a subirla/)
    assert.deepEqual((await api('GET', `/novedades/${n.id}`)).json.data.galeria.map((f) => f.id), [c.id, a.id, b.id])
    // Repetida o de más: 400.
    assert.equal((await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [a.id, a.id] })).status, 400)
    assert.equal((await api('PUT', `/novedades/${n.id}/galeria`, { fotos: Array.from({ length: 41 }, (_, i) => i + 1) })).status, 400)
    // b también es la portada de otra novedad: al quitarla de esta galería sigue; c no la usa nadie más: se borra.
    const { data: otra } = (await api('POST', '/novedades', { titulo: 'Otra' })).json
    await api('PUT', `/novedades/${otra.id}`, novedadVacia({ titulo: 'Otra', portadaId: b.id }))
    const quitadas = await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [a.id] })
    assert.deepEqual(quitadas.json.data.galeria.map((f) => f.id), [a.id])
    assert.equal(await existe(b.id), true)
    assert.equal(await existe(c.id), false)
    assert.equal(await archivosDe(c.id), 0)
    // Una portada que ya no está: 409 en su campo.
    const portadaVieja = await api('PUT', `/novedades/${otra.id}`, novedadVacia({ titulo: 'Otra', portadaId: c.id }))
    assert.equal(portadaVieja.status, 409)
    assert.match(portadaVieja.json.campos.portadaId, /Volvé a subirla/)
    // Las muestras también tienen galería; las salas, no.
    const { data: m } = (await api('POST', '/muestras', { titulo: 'Con galería' })).json
    assert.equal((await api('PUT', `/muestras/${m.id}/galeria`, { fotos: [a.id] })).status, 200)
    const { data: sala } = (await api('POST', '/salas', { nombre: 'Sin galería' })).json
    assert.equal((await api('PUT', `/salas/${sala.id}/galeria`, { fotos: [] })).status, 404)
  })

  test('la portada no puede pasar a decorativa (PATCH /fotos/:id); una foto de la galería sí', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Portada con descripción' })).json
    const [portada, otra] = [await foto(), await foto()]
    await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: n.titulo, portadaId: portada.id }))
    await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [otra.id] })
    const r = await api('PATCH', `/fotos/${portada.id}`, { decorativa: true })
    assert.equal(r.status, 400)
    assert.match(r.json.campos.decorativa, /portada siempre lleva descripción/)
    assert.equal((await sql('SELECT decorativa FROM fotos WHERE id = :id', { id: portada.id }))[0].decorativa, false)
    assert.equal((await api('PATCH', `/fotos/${portada.id}`, { epigrafe: 'Sí se puede cambiar lo demás' })).status, 200)
    const enGaleria = await api('PATCH', `/fotos/${otra.id}`, { decorativa: true })
    assert.equal(enGaleria.status, 200)
    assert.deepEqual([enGaleria.json.data.decorativa, enGaleria.json.data.alt], [true, ''])
  })

  test('reemplazar o quitar la portada libera la anterior si nadie más la usa', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Portadas' })).json
    const [uno, dos] = [await foto(), await foto()]
    await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: 'Portadas', portadaId: uno.id }))
    // uno también está en una galería: reemplazarla no la borra.
    const { data: m } = (await api('POST', '/muestras', { titulo: 'Usa la uno' })).json
    await api('PUT', `/muestras/${m.id}/galeria`, { fotos: [uno.id] })
    await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: 'Portadas', portadaId: dos.id }))
    assert.equal(await existe(uno.id), true)
    // dos no la usa nadie más: quitarla la borra.
    const sinPortada = await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: 'Portadas', portadaId: null }))
    assert.equal(sinPortada.json.data.portada, null)
    assert.equal(await existe(dos.id), false)
  })

  test('eliminar: borra el contenido y su galería y libera solo las fotos que nadie más usa', async () => {
    const compartida = await foto()
    const n = await novedadCompleta({ titulo: 'Para eliminar' })
    const propia = await foto()
    await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [propia.id, compartida.id] })
    // La compartida es también la portada de una muestra.
    const { data: m } = (await api('POST', '/muestras', { titulo: 'Comparte foto' })).json
    await api('PUT', `/muestras/${m.id}`, muestraVacia({ titulo: 'Comparte foto', portadaId: compartida.id }))
    await api('POST', `/novedades/${n.id}/publicar`)
    const r = await api('DELETE', `/novedades/${n.id}`)
    assert.equal(r.status, 200, r.texto)
    assert.deepEqual(r.json.data, { id: n.id })
    assert.equal((await api('GET', `/novedades/${n.id}`)).status, 404)
    assert.deepEqual(await sql('SELECT * FROM galeria_novedades WHERE novedad_id = :id', { id: n.id }), [])
    assert.equal(await existe(n.portada.id), false)
    assert.equal(await existe(propia.id), false)
    assert.equal(await archivosDe(propia.id), 0)
    assert.equal(await existe(compartida.id), true)
    // Otra vez: 404.
    assert.equal((await api('DELETE', `/novedades/${n.id}`)).status, 404)
    // La muestra con su portada y su galería, igual.
    const enGaleria = await foto()
    await api('PUT', `/muestras/${m.id}/galeria`, { fotos: [enGaleria.id] })
    assert.equal((await api('DELETE', `/muestras/${m.id}`)).status, 200)
    assert.equal(await existe(compartida.id), false)
    assert.equal(await existe(enGaleria.id), false)
  })

  test('el listado: filtros, búsqueda (% y _ son letras), páginas y última edición; lo malo da 400', async () => {
    await sql('DELETE FROM novedades')
    const titulos = ['100% gratis', 'Taller_de_fósiles', 'Algo cualquiera', 'Otra cosa cualquiera']
    for (const titulo of titulos) await api('POST', '/novedades', { titulo, tipo: titulo.startsWith('Taller') ? 'actividad' : 'noticia' })
    const lista = (consulta = '') => api('GET', `/novedades${consulta}`)
    const todas = await lista()
    assert.equal(todas.status, 200)
    assert.equal(todas.json.data.total, 4)
    assert.deepEqual(Object.keys(todas.json.data).sort(), ['items', 'pagina', 'paginas', 'por', 'total'])
    const item = todas.json.data.items[0]
    assert.equal(item.titulo, 'Otra cosa cualquiera', 'la más nueva primero')
    assert.equal(item.ultimaEdicion.nombre, 'Editora de contenidos')
    assert.ok(!('cuerpo' in item) && !('galeria' in item), 'el listado no trae los textos ni la galería')
    const titulosDe = (r) => r.json.data.items.map((i) => i.titulo)
    assert.deepEqual(titulosDe(await lista('?q=%25')), ['100% gratis'])
    assert.deepEqual(titulosDe(await lista('?q=_')), ['Taller_de_fósiles'])
    assert.deepEqual(titulosDe(await lista('?q=CUALQUIERA')).sort(), ['Algo cualquiera', 'Otra cosa cualquiera'])
    assert.deepEqual(titulosDe(await lista('?tipo=actividad')), ['Taller_de_fósiles'])
    assert.deepEqual(titulosDe(await lista('?estado=publicado')), [])
    const pagina2 = await lista('?por=3&pagina=2')
    assert.deepEqual([pagina2.json.data.items.length, pagina2.json.data.paginas, pagina2.json.data.pagina], [1, 2, 2])
    assert.equal((await lista('?pagina=9')).json.data.items.length, 0)
    for (const mala of ['?por=101', '?pagina=0', '?estado=otro', '?tipo=evento', '?q=a&q=b']) {
      const r = await lista(mala)
      assert.equal(r.status, 400, mala)
      assert.ok(r.json.campos, mala)
    }
    // Salas y muestras, en su orden; las muestras con el nombre de su sala.
    const salas = await api('GET', '/salas?por=100')
    assert.deepEqual(
      salas.json.data.items.map((i) => i.orden),
      [...salas.json.data.items.map((i) => i.orden)].sort((x, y) => x - y),
    )
  })

  test('el orden de salas y muestras: { ids } con todas (si no, 409); la nueva va al final y los huecos se renumeran', async () => {
    await sql('DELETE FROM muestras')
    await sql('DELETE FROM salas')
    const ids = []
    for (const nombre of ['A', 'B', 'C']) ids.push((await api('POST', '/salas', { nombre: `Sala ${nombre}` })).json.data.id)
    const nuevo = [ids[2], ids[0], ids[1]]
    const r = await api('PUT', '/salas/orden', { ids: nuevo })
    assert.equal(r.status, 200, r.texto)
    assert.deepEqual(r.json.data.map((x) => [x.id, x.orden]), nuevo.map((id, i) => [id, i + 1]))
    // Una que falta o una de más: 409 sin cambiar nada.
    assert.equal((await api('PUT', '/salas/orden', { ids: [ids[0], ids[1]] })).status, 409)
    assert.equal((await api('PUT', '/salas/orden', { ids: [...ids, 2147483647] })).status, 409)
    assert.equal((await api('PUT', '/salas/orden', { ids: [ids[0], ids[0], ids[1]] })).status, 400)
    // Borrar la del medio y agregar otra: queda 1..n, la nueva al final.
    await api('DELETE', `/salas/${ids[0]}`)
    const { data: d } = (await api('POST', '/salas', { nombre: 'Sala D' })).json
    assert.equal(d.orden, 3)
    assert.deepEqual(
      (await api('GET', '/salas')).json.data.items.map((x) => [x.nombre, x.orden]),
      [
        ['Sala C', 1],
        ['Sala B', 2],
        ['Sala D', 3],
      ],
    )
    // Las muestras, igual.
    const m1 = (await api('POST', '/muestras', { titulo: 'M1' })).json.data
    const m2 = (await api('POST', '/muestras', { titulo: 'M2' })).json.data
    assert.equal((await api('PUT', '/muestras/orden', { ids: [m2.id, m1.id] })).status, 200)
    assert.deepEqual((await api('GET', '/muestras')).json.data.items.map((x) => x.titulo), ['M2', 'M1'])
  })

  test('el log: el id y quién, nunca el título', async () => {
    const logs = escucharLogs()
    try {
      const { data: n } = (await api('POST', '/novedades', { titulo: 'Título secreto del log' })).json
      await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: 'Título secreto del log', resumen: 'Resumen secreto' }))
      await api('DELETE', `/novedades/${n.id}`)
      const eventos = logs.eventos().filter((e) => e.evento?.startsWith('novedad_'))
      assert.deepEqual(eventos.map((e) => e.evento), ['novedad_creada', 'novedad_modificada', 'novedad_eliminada'])
      assert.ok(eventos.every((e) => e.novedad_id === n.id && e.por === editor.usuario.id))
      assert.ok(!logs.lineas.join('\n').includes('secreto'))
    } finally {
      logs.detener()
    }
  })

  test('la semilla de ejemplo (plan 3.4): 2 salas, 3 muestras (actual, próxima, finalizada) y 4 novedades, y se repite', async () => {
    const primera = await cargarEjemplo(base.sequelize)
    assert.deepEqual([primera.salas, primera.muestras, primera.novedades, primera.fotos], [2, 3, 4, 5])
    const segunda = await cargarEjemplo(base.sequelize)
    assert.equal(segunda.contenidosReemplazados, 9)
    const ejemplo = (tabla, campo) => sql(`SELECT * FROM ${tabla} WHERE ${campo} LIKE 'EJEMPLO · %' ORDER BY id`)
    const muestras = await ejemplo('muestras', 'titulo')
    const novedades = await ejemplo('novedades', 'titulo')
    assert.equal((await ejemplo('salas', 'nombre')).length, 2)
    assert.equal(muestras.length, 3)
    assert.equal(novedades.length, 4)
    // Todas publicadas y completas para publicar (lo que pide el esquema).
    for (const [tipo, filas] of [
      ['muestras', muestras],
      ['novedades', novedades],
    ]) {
      for (const f of filas) {
        assert.equal(f.estado, 'publicado')
        const r = await api('GET', `/${tipo}/${f.id}`)
        assert.deepEqual(problemasParaPublicar(tipo, r.json.data), {}, f.slug)
      }
    }
    // Sequelize da las columnas date como texto ("AAAA-MM-DD").
    const aDia = (d) => String(d).slice(0, 10)
    assert.deepEqual(
      muestras.map((m) =>
        situacionDeMuestra({ tipo: m.tipo, fechaInicio: aDia(m.fecha_inicio), fechaFin: aDia(m.fecha_fin) }),
      ),
      ['actual', 'proxima', 'finalizada'],
    )
    const actividades = novedades.filter((n) => n.tipo === 'actividad')
    assert.deepEqual(actividades.map((n) => actividadRealizada({ eventoInicio: n.evento_inicio, eventoFin: n.evento_fin })), [true, false])
    // Al repetirla, las fotos de la anterior se liberaron: quedan las 5 de ahora (más las de las otras pruebas).
    const enUso = await sql(`SELECT count(*)::int AS n FROM fotos WHERE alt LIKE 'EJEMPLO · %'`)
    assert.equal(enUso[0].n, 5)
  })

  test('borrar una foto que otra transacción está empezando a usar: espera, no la borra y no da 500 (API-01)', async () => {
    const n = await novedadCompleta({ titulo: 'Se elimina en la carrera' })
    const x = n.portada.id
    const { data: b } = (await api('POST', '/novedades', { titulo: 'Toma la foto en la carrera' })).json
    // Otra transacción bloquea la foto (como exigirFotos) y la mete en una galería, sin confirmar todavía.
    const t = await base.sequelize.transaction()
    let respuesta
    try {
      await base.sequelize.query('SELECT id FROM fotos WHERE id = :x FOR KEY SHARE', { replacements: { x }, transaction: t })
      await base.sequelize.query('INSERT INTO galeria_novedades (novedad_id, foto_id, orden) VALUES (:b, :x, 1)', {
        replacements: { b: b.id, x },
        transaction: t,
      })
      const logs = escucharLogs()
      try {
        respuesta = api('DELETE', `/novedades/${n.id}`)
        await esperarBloqueo()
        await t.commit()
        respuesta = await respuesta
      } finally {
        logs.detener()
      }
      assert.ok(!logs.eventos().some((e) => e.evento === 'error_500'), 'sin 500 en el log')
    } catch (err) {
      if (!t.finished) await t.rollback()
      throw err
    }
    assert.equal(respuesta.status, 200, respuesta.texto)
    assert.equal(await existe(x), true, 'la foto quedó: ahora la usa la galería de la otra')
    assert.deepEqual((await api('GET', `/novedades/${b.id}`)).json.data.galeria.map((f) => f.id), [x])
    assert.equal((await api('GET', `/novedades/${n.id}`)).status, 404)
  })

  test('la tarea diaria saltea las huérfanas que alguien está por usar y borra las demás, sin fallar (API-01)', async () => {
    const [usada, libre] = [await foto(), await foto()]
    await sql(`UPDATE fotos SET created_at = now() - interval '25 hours' WHERE id IN (:ids)`, { ids: [usada.id, libre.id] })
    const { data: b } = (await api('POST', '/novedades', { titulo: 'Toma una huérfana' })).json
    const t = await base.sequelize.transaction()
    try {
      await base.sequelize.query('SELECT id FROM fotos WHERE id = :x FOR KEY SHARE', { replacements: { x: usada.id }, transaction: t })
      await base.sequelize.query('INSERT INTO galeria_novedades (novedad_id, foto_id, orden) VALUES (:b, :x, 1)', {
        replacements: { b: b.id, x: usada.id },
        transaction: t,
      })
      // No espera a la transacción abierta (SKIP LOCKED): borra la otra y sigue.
      const borradas = await almacen.borrarHuerfanas()
      assert.ok(borradas >= 1)
      await t.commit()
    } catch (err) {
      if (!t.finished) await t.rollback()
      throw err
    }
    assert.equal(await existe(usada.id), true)
    assert.equal(await existe(libre.id), false)
    // Y en la vuelta siguiente, la usada sigue (ya está en una galería).
    await almacen.borrarHuerfanas()
    assert.equal(await existe(usada.id), true)
  })

  test('la galería de una pestaña vieja: si otra persona la cambió, 409 y no se borra lo que agregó (API-06)', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Galería compartida' })).json
    const [f1, f2, f3] = [await foto(), await foto(), await foto()]
    assert.equal((await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [f1.id, f2.id] })).status, 200)
    // A abre la ficha con [f1, f2]. B (otra cuenta) agrega f3.
    const otra = await s.cookiePara('editor')
    const deB = await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [f1.id, f2.id, f3.id], antes: [f1.id, f2.id] }, otra)
    assert.equal(deB.status, 200, deB.texto)
    // A guarda su orden con lo que tenía: 409, y f3 sigue.
    const deA = await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [f2.id, f1.id], antes: [f1.id, f2.id] })
    assert.equal(deA.status, 409)
    assert.match(deA.json.campos.fotos, /Otra persona cambió la galería/)
    assert.equal(await existe(f3.id), true)
    assert.deepEqual((await api('GET', `/novedades/${n.id}`)).json.data.galeria.map((f) => f.id), [f1.id, f2.id, f3.id])
    // Con lo que hay ahora (en otro orden: el orden no cuenta), pasa.
    const bien = await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [f3.id, f1.id], antes: [f3.id, f2.id, f1.id] })
    assert.equal(bien.status, 200, bien.texto)
    assert.equal(await existe(f2.id), false, 'la que se quitó a propósito sí se borra')
  })

  test('la portada de una pestaña vieja: si no la tocó, queda la de la otra persona; si la tocó, no se borra la otra (API-06)', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Portada compartida' })).json
    const [p1, p2, p3] = [await foto(), await foto(), await foto()]
    await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: n.titulo, portadaId: p1.id }))
    // B cambia la portada (sabía que era p1): p1 se libera.
    const otra = await s.cookiePara('editor')
    const deB = await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: n.titulo, portadaId: p2.id, portadaAntes: p1.id }), otra)
    assert.equal(deB.status, 200, deB.texto)
    assert.equal(await existe(p1.id), false)
    // A (abrió con p1) cambia el resumen sin tocar la portada: queda p2 y no se borra.
    const deA = await api(
      'PUT',
      `/novedades/${n.id}`,
      novedadVacia({ titulo: n.titulo, resumen: 'Lo cambió A', portadaId: p1.id, portadaAntes: p1.id }),
    )
    assert.equal(deA.status, 200, deA.texto)
    assert.deepEqual([deA.json.data.portada.id, deA.json.data.resumen], [p2.id, 'Lo cambió A'])
    assert.equal(await existe(p2.id), true)
    // A (todavía con p1 como la de antes) elige p3: gana A, pero p2 no se borra en el momento (queda para la tarea).
    const conOtra = await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: n.titulo, portadaId: p3.id, portadaAntes: p1.id }))
    assert.equal(conOtra.json.data.portada.id, p3.id)
    assert.equal(await existe(p2.id), true)
    // Sin portadaAntes, como siempre: gana el último y la anterior se libera.
    await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: n.titulo, portadaId: p2.id }))
    assert.equal(await existe(p3.id), false)
  })

  test('el 409 de una foto que ya no está dice cuáles faltan (FLU-05)', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Fotos que faltan' })).json
    const [a, b] = [await foto(), await foto()]
    await sql('DELETE FROM fotos WHERE id = :id', { id: b.id })
    const r = await api('PUT', `/novedades/${n.id}/galeria`, { fotos: [a.id, b.id, 2147483647] })
    assert.equal(r.status, 409)
    assert.deepEqual(r.json.faltan, [b.id, 2147483647])
    const portada = await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: n.titulo, portadaId: b.id }))
    assert.equal(portada.status, 409)
    assert.deepEqual(portada.json.faltan, [b.id])
  })

  test('el PUT de un contenido admite 300 kB; un texto con demasiado formato da 400 en su campo, no 413 (COD-01)', async () => {
    const { data: n } = (await api('POST', '/novedades', { titulo: 'Texto largo' })).json
    // ~140 kB de JSON que se guardan: 1.500 párrafos vacíos (como lo que pega Word) y el texto.
    const vacios = Array.from({ length: 1500 }, () => ({ type: 'paragraph', content: [{ type: 'text', text: '        ' }] }))
    const conVacios = { type: 'doc', content: [...vacios, { type: 'paragraph', content: [{ type: 'text', text: 'El texto.' }] }] }
    const cuerpoGrande = novedadVacia({ titulo: n.titulo, cuerpo: conVacios })
    assert.ok(JSON.stringify(cuerpoGrande).length > 100_000)
    const grande = await api('PUT', `/novedades/${n.id}`, cuerpoGrande)
    assert.equal(grande.status, 200, grande.texto)
    assert.deepEqual(grande.json.data.cuerpo, parrafo('El texto.'))
    // 19.500 caracteres con negrita una palabra sí y otra no: válido en caracteres, pero ~115 kB de JSON.
    const palabras = Array.from({ length: 3250 }, (_, i) => ({
      type: 'text',
      text: 'fósil ',
      ...(i % 2 ? { marks: [{ type: 'bold' }] } : {}),
    }))
    const formato = await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: n.titulo, cuerpo: { type: 'doc', content: [{ type: 'paragraph', content: palabras }] } }))
    assert.equal(formato.status, 400, formato.texto)
    assert.match(formato.json.campos.cuerpo, /demasiado formato/)
    // Más de 300 kB: 413, como siempre. Y lo demás de la API sigue en 100 kB.
    const enorme = await api('PUT', `/novedades/${n.id}`, novedadVacia({ titulo: n.titulo, resumen: 'x'.repeat(310_000) }))
    assert.equal(enorme.status, 413)
    const cuenta = await api('PUT', '/cuenta', { nombre: 'x'.repeat(120_000) })
    assert.equal(cuenta.status, 413)
  })

  test('sin páginas públicas todavía (E4): sus direcciones dan la 404 del sitio, publicadas o no', async () => {
    const n = await novedadCompleta({ titulo: 'Publicada sin página' })
    await api('POST', `/novedades/${n.id}/publicar`)
    for (const ruta of [urlPublica('novedades', n.slug), '/exposiciones/algo', '/novedades', '/exposiciones']) {
      const r = await s.pedir('GET', ruta)
      assert.equal(r.status, 404, ruta)
      assert.equal(r.h['set-cookie'], undefined)
    }
  })
})
