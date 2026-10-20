// /administracion/api/novedades, /muestras y /salas (plan 3.2, 4.3, 4.8 y 5.4; E3.3 y E3.4): la fábrica que arma las
// rutas de los tres contenidos, para cualquier rol. Por tipo (rutasDeContenido(tipo)):
// - GET /<tipo>?estado=&tipo=&q=&pagina=&por=: el listado (sin los textos con formato), con el total y las páginas.
//   estado: borrador | publicado; tipo: noticia | actividad o temporal | permanente; q: busca en el título (el nombre,
//   en una sala), la dirección y el resumen, sin distinguir mayúsculas (con escapeLike); por: hasta 100. Novedades,
//   de la más nueva a la más vieja (la fecha de publicación, o la de creación si nunca se publicó); salas y muestras,
//   en su orden.
// - POST /<tipo>: crea un BORRADOR con el título (el nombre, en una sala) y el tipo; la dirección web sale del título
//   (compartido/contenidos.js) y, si ya está, se le agrega -2, -3…; salas y muestras van al final del orden. 201 con
//   la ficha.
// - PUT /salas/orden y /muestras/orden { ids }: el orden nuevo con TODAS (como /tarifas/orden: si la lista no
//   coincide, 409). Van antes de /<tipo>/:id en la tabla. Responden la lista en el orden nuevo. No cambian la última
//   edición de cada una (el orden es de la lista, no del contenido).
// - GET /<tipo>/:id: la ficha (los campos, la portada y la galería con sus datos, el estado y la última edición).
// - PUT /<tipo>/:id: el contenido COMPLETO (compartido/esquemas/contenido.js), con un tope de 300 kB (plan 2.4: lleva
//   un texto con formato). Si ya está publicado, se valida como publicado (problemasParaPublicar y la portada no
//   decorativa): si no alcanza, 400 con los campos. La dirección web: vacía, se arma con el título; repetida, 409 en su
//   campo; desde la primera publicación queda fija (otra, 409). portadaAntes (opcional, lo manda el panel) es la
//   portada que tenía la ficha cuando se abrió: si otra persona la cambió mientras tanto y este pedido no la tocó, queda
//   la de la otra persona; si las dos la cambiaron, gana este pedido pero la de la otra persona no se borra en el
//   momento (si nadie la usa, la borra la tarea diaria a las 24 h). Sin portadaAntes, gana el último guardado.
// - POST /<tipo>/:id/publicar: valida para publicar (400 con los campos que faltan), pone publicado_en la primera vez
//   (con eso la dirección queda fija) y el estado en publicado. Ya publicado, no cambia nada.
// - POST /<tipo>/:id/despublicar: vuelve a borrador (publicado_en se queda: es la fecha de la primera publicación).
// - DELETE /<tipo>/:id: lo borra de verdad, en una transacción (plan 3.2, "Eliminar contenido"): junta su portada y su
//   galería, borra la fila (la galería cae en cascada; de una sala, sus muestras quedan sin sala) y liberarFotos borra
//   las fotos que ya no usa nadie (sus archivos, en cascada; la caché, después del commit).
// - PUT /muestras/:id/galeria y /novedades/:id/galeria { fotos: [id], antes?: [id] }: las fotos de la galería, en
//   orden. Las que se quitaron se liberan. antes (lo manda el panel) son las que tenía cuando se abrió la ficha: si
//   otra persona cambió la galería mientras tanto, 409 (corrección de E3, 16/10/2026: una pestaña vieja borraba para
//   siempre la foto que había agregado otra persona).
// Reemplazar o quitar la portada en un PUT también libera la anterior (si nadie más la usa).
// Una portada o una foto de la galería que ya no está (la tarea diaria borra las subidas sin usar de más de 24 h, y la
// ficha pudo quedar abierta todo ese tiempo): 409 "volvé a subirla", en su campo, con los ids que faltan (faltan: el
// panel marca cuáles son). Las fotos y la sala elegidas se bloquean (FOR KEY SHARE) hasta el commit: ni la tarea
// diaria ni otro pedido las borran en el medio.
// creado_por y actualizado_por salen de la sesión (req.usuario.id), nunca del pedido. El log lleva el id y quién, nunca
// el título ni los textos.
// Desde E4.6, después de publicar, despublicar, eliminar algo publicado o guardar un cambio (o la galería) de algo
// publicado, se avisa a IndexNow qué páginas del sitio cambiaron (server/indexnow.js: apagado sin INDEXNOW_CLAVE, solo
// en producción con mupa.ar y sin esperar la respuesta). Nunca por un borrador.
import { Op, QueryTypes } from 'sequelize'
import { SLUG_MAX, slugDeTitulo, slugNumerado, urlPublica } from '../../compartido/contenidos.js'
import {
  ESQUEMAS_CONTENIDO,
  esquemaGaleria,
  esquemaListado,
  esquemaOrden,
  ORDEN_MAX,
  PORTADA_DECORATIVA,
  problemasParaPublicar,
} from '../../compartido/esquemas/contenido.js'
import { instanteDeLocal, localDeInstante } from '../../compartido/fechas.js'
import { httpError } from '../errores.js'
import { log } from '../log.js'
import { escapeLike } from './entrada.js'
import { fotoDelPanel } from './fotos.js'

/**
 * Lo propio de cada tipo. campos: los del PUT (el esquema completo), en el orden de la ficha; alta: los del POST.
 * @type {Record<'novedades' | 'muestras' | 'salas', {
 *   modelo: string, tabla: string, singular: string, nombre: 'titulo' | 'nombre', noExiste: string,
 *   galeria: string | null, conOrden: boolean, campos: string[], alta: string[], listado: string[] }>}
 */
const TIPOS = {
  novedades: {
    modelo: 'Novedad',
    tabla: 'novedades',
    singular: 'novedad',
    nombre: 'titulo',
    noExiste: 'No existe esa novedad.',
    galeria: 'GaleriaNovedad',
    conOrden: false,
    campos: [
      'tipo',
      'titulo',
      'slug',
      'resumen',
      'cuerpo',
      'portadaId',
      'eventoInicio',
      'eventoFin',
      'lugar',
      'costo',
      'enlaceInscripcion',
    ],
    alta: ['tipo', 'titulo'],
    listado: ['tipo', 'titulo', 'eventoInicio', 'eventoFin'],
  },
  muestras: {
    modelo: 'Muestra',
    tabla: 'muestras',
    singular: 'muestra',
    nombre: 'titulo',
    noExiste: 'No existe esa muestra.',
    galeria: 'GaleriaMuestra',
    conOrden: true,
    campos: ['tipo', 'titulo', 'slug', 'resumen', 'descripcion', 'portadaId', 'fechaInicio', 'fechaFin', 'salaId'],
    alta: ['tipo', 'titulo'],
    listado: ['tipo', 'titulo', 'fechaInicio', 'fechaFin', 'salaId', 'orden'],
  },
  salas: {
    modelo: 'Sala',
    tabla: 'salas',
    singular: 'sala',
    nombre: 'nombre',
    noExiste: 'No existe esa sala.',
    galeria: null,
    conOrden: true,
    campos: ['nombre', 'slug', 'resumen', 'descripcion', 'portadaId'],
    alta: ['nombre'],
    listado: ['nombre', 'orden'],
  },
}

// Las columnas que la API da y recibe como hora de San Juan ("AAAA-MM-DDTHH:MM") y la base guarda como instantes.
const CON_HORA = ['eventoInicio', 'eventoFin']

const FOTO_NO_ESTA =
  'Una de las fotos ya no está guardada: las fotos que se suben y no se guardan en ninguna ficha se borran a las 24 ' +
  'horas. Volvé a subirla.'
const PORTADA_NO_ESTA =
  'La portada ya no está guardada: las fotos que se suben y no se guardan en ninguna ficha se borran a las 24 horas. ' +
  'Volvé a subirla.'
const SALA_NO_ESTA = 'Esa sala ya no existe (alguien la eliminó). Elegí otra o dejala sin sala.'
export const GALERIA_CAMBIO =
  'Otra persona cambió la galería mientras tenías la ficha abierta. Recargá la pantalla para ver cómo quedó y volvé a ' +
  'hacer tus cambios.'
const SLUG_FIJO =
  'La dirección web queda fija desde que se publicó por primera vez: los enlaces que ya circulan dejarían de andar.'
const slugRepetido = (singular) => `Ya hay otra ${singular} con esa dirección web: cambiala.`

/** Lo editable de una fila como lo habla la API (la forma del PUT): la hora de San Juan en las de las actividades. */
function datosDe(def, fila) {
  const datos = Object.fromEntries(def.campos.map((c) => [c, fila[c] ?? null]))
  for (const c of CON_HORA) if (c in datos) datos[c] = localDeInstante(datos[c])
  return datos
}

/** Lo que llegó en el PUT, para la base (las horas de San Juan, como instantes). */
function paraLaBase(datos) {
  const valores = { ...datos }
  for (const c of CON_HORA) if (c in valores) valores[c] = valores[c] == null ? null : instanteDeLocal(valores[c])
  return valores
}

const ultimaEdicion = (fila) => ({ nombre: fila.editor?.nombre ?? null, fecha: fila.updatedAt })

/** Un elemento del listado: sin los textos con formato ni la galería. */
function itemDe(def, fila) {
  const item = { id: fila.id }
  for (const c of def.listado) item[c] = fila[c] ?? null
  for (const c of CON_HORA) if (c in item) item[c] = localDeInstante(item[c])
  if (def.modelo === 'Muestra') item.sala = fila.sala ? { id: fila.sala.id, nombre: fila.sala.nombre } : null
  return {
    ...item,
    slug: fila.slug,
    estado: fila.estado,
    publicadoEn: fila.publicadoEn ?? null,
    ultimaEdicion: ultimaEdicion(fila),
  }
}

/**
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 * @returns {import('./indice.js').Definicion[]}
 */
export function rutasDeContenido(tipo) {
  const def = TIPOS[tipo]
  const { alta: esquemaAlta, cambio: esquemaCambio, tipos } = ESQUEMAS_CONTENIDO[tipo]
  const consulta = esquemaListado(tipos)
  const evento = (accion) => `${def.singular}_${accion}`
  const idDelLog = `${def.singular}_id`
  // Las páginas del sitio que cambian con un contenido publicado (IndexNow): la suya y el listado; una sala no tiene
  // página propia (es una sección de /exposiciones).
  const paginasDelSitio = (slug) =>
    tipo === 'salas' ? ['/exposiciones'] : [urlPublica(tipo, slug), tipo === 'novedades' ? '/novedades' : '/exposiciones']

  const modelos = (sequelize) => {
    const m = sequelize.models
    return { Modelo: m[def.modelo], Galeria: def.galeria ? m[def.galeria] : null }
  }
  const incluirEditor = { association: 'editor', attributes: ['nombre'] }
  const incluirSala = { association: 'sala', attributes: ['id', 'nombre'] }
  const incluirListado = def.modelo === 'Muestra' ? [incluirEditor, incluirSala] : [incluirEditor]
  const atributosListado = ['id', ...new Set([...def.listado, 'slug', 'estado', 'publicadoEn', 'updatedAt'])]
  const ordenLista = (sequelize) =>
    def.conOrden
      ? [
          ['orden', 'ASC'],
          ['id', 'ASC'],
        ]
      : [
          [
            sequelize.fn('coalesce', sequelize.col(`${def.modelo}.publicado_en`), sequelize.col(`${def.modelo}.created_at`)),
            'DESC',
          ],
          ['id', 'DESC'],
        ]

  /** La ficha para el panel, o null si no existe. */
  async function leerFicha(sequelize, id, transaction) {
    const { Modelo, Galeria } = modelos(sequelize)
    const fila = await Modelo.findByPk(id, {
      include: [{ association: 'portada' }, incluirEditor],
      transaction,
    })
    if (!fila) return null
    const ficha = {
      id: fila.id,
      ...datosDe(def, fila),
      estado: fila.estado,
      publicadoEn: fila.publicadoEn ?? null,
      // Desde la primera publicación, la dirección web no se puede cambiar.
      slugFijo: fila.publicadoEn != null,
      portada: fila.portada ? fotoDelPanel(fila.portada) : null,
      creadoEn: fila.createdAt,
      ultimaEdicion: ultimaEdicion(fila),
    }
    if (def.conOrden) ficha.orden = fila.orden
    if (Galeria) {
      const lugares = await Galeria.findAll({
        where: { [Galeria.claveDelContenido]: id },
        include: [{ association: 'foto' }],
        order: [['orden', 'ASC']],
        transaction,
      })
      ficha.galeria = lugares.map((l) => fotoDelPanel(l.foto))
    }
    return ficha
  }

  /** La fila bloqueada para cambiarla (FOR UPDATE), o 404. */
  async function bloquear(sequelize, id, transaction) {
    const fila = await modelos(sequelize).Modelo.findByPk(id, { lock: transaction.LOCK.UPDATE, transaction })
    if (!fila) throw httpError(404, def.noExiste)
    return fila
  }

  /** ¿La dirección ya la usa otro (que no sea excepto)? */
  async function slugOcupado(sequelize, slug, excepto, transaction) {
    const filas = await sequelize.query(`SELECT 1 FROM ${def.tabla} WHERE slug = :slug AND id <> :excepto LIMIT 1`, {
      replacements: { slug, excepto: excepto ?? 0 },
      type: QueryTypes.SELECT,
      transaction,
    })
    return filas.length > 0
  }

  /** La dirección a partir del título, libre: la base o, si ya está, con -2, -3… (de a tandas de 50). */
  async function slugLibre(sequelize, titulo, excepto, transaction) {
    const max = SLUG_MAX[tipo]
    const base = slugDeTitulo(tipo, titulo)
    for (let desde = 1; desde <= 1000; desde += 50) {
      const candidatos = Array.from({ length: 50 }, (_, i) =>
        desde + i === 1 ? base : slugNumerado(base, desde + i, max),
      )
      const ocupados = await sequelize.query(
        `SELECT slug FROM ${def.tabla} WHERE slug IN (:candidatos) AND id <> :excepto`,
        { replacements: { candidatos, excepto: excepto ?? 0 }, type: QueryTypes.SELECT, transaction },
      )
      const tomados = new Set(ocupados.map((f) => f.slug))
      const libre = candidatos.find((c) => !tomados.has(c))
      if (libre) return libre
    }
    throw httpError(409, 'No se pudo armar la dirección web con el título: escribila a mano.', {
      campos: { slug: 'Escribí la dirección web.' },
    })
  }

  /** La dirección que se guarda en un PUT. */
  async function slugParaGuardar(sequelize, fila, datos, transaction) {
    if (fila.publicadoEn != null) {
      if (datos.slug != null && datos.slug !== fila.slug) {
        throw httpError(409, SLUG_FIJO, { campos: { slug: SLUG_FIJO } })
      }
      return fila.slug
    }
    if (datos.slug == null) return slugLibre(sequelize, datos[def.nombre], fila.id, transaction)
    if (datos.slug !== fila.slug && (await slugOcupado(sequelize, datos.slug, fila.id, transaction))) {
      const mensaje = slugRepetido(def.singular)
      throw httpError(409, mensaje, { campos: { slug: mensaje } })
    }
    return datos.slug
  }

  /**
   * Que las fotos existan, bloqueadas hasta el commit (FOR KEY SHARE: nadie las borra en el medio). Devuelve sus
   * datos por id ({ id, alt, decorativa }). Si falta alguna, 409 en el campo.
   */
  async function exigirFotos(sequelize, ids, campo, transaction) {
    const lista = [...new Set(ids.filter((id) => id != null))]
    if (!lista.length) return new Map()
    const filas = await sequelize.query(
      'SELECT id, alt, decorativa FROM fotos WHERE id IN (:lista) ORDER BY id FOR KEY SHARE',
      { replacements: { lista }, type: QueryTypes.SELECT, transaction },
    )
    if (filas.length !== lista.length) {
      const hay = new Set(filas.map((f) => f.id))
      const mensaje = campo === 'portadaId' ? PORTADA_NO_ESTA : FOTO_NO_ESTA
      throw httpError(409, mensaje, { campos: { [campo]: mensaje }, faltan: lista.filter((id) => !hay.has(id)) })
    }
    return new Map(filas.map((f) => [f.id, f]))
  }

  /** Que la sala exista, bloqueada hasta el commit; si no, 409 en el campo. */
  async function exigirSala(sequelize, salaId, transaction) {
    if (salaId == null) return
    const filas = await sequelize.query('SELECT id FROM salas WHERE id = :salaId FOR KEY SHARE', {
      replacements: { salaId },
      type: QueryTypes.SELECT,
      transaction,
    })
    if (!filas.length) throw httpError(409, SALA_NO_ESTA, { campos: { salaId: SALA_NO_ESTA } })
  }

  /** 400 con los campos si no alcanza para publicar (portada: la foto, con su descripción y si es decorativa). */
  function exigirParaPublicar(datos, portada, mensaje) {
    const problemas = problemasParaPublicar(tipo, datos)
    if (datos.portadaId != null && portada && (portada.decorativa || !portada.alt)) {
      problemas.portadaId ??= PORTADA_DECORATIVA
    }
    if (Object.keys(problemas).length) throw httpError(400, mensaje, { campos: problemas })
  }

  /**
   * Un alta que choca por la dirección se repite: las altas de un tipo van de a una (LOCK TABLE en salas y muestras,
   * un candado de la transacción en novedades), así solo puede chocar con un cambio de dirección hecho a la vez.
   */
  async function conReintento(hacer) {
    for (let intento = 1; ; intento++) {
      try {
        return await hacer()
      } catch (err) {
        const restriccion = err?.parent?.constraint ?? err?.original?.constraint
        if (intento >= 5 || err?.name !== 'SequelizeUniqueConstraintError' || restriccion !== `${def.tabla}_slug_unico`) {
          throw err
        }
      }
    }
  }

  async function listar(req, res, { sequelize }) {
    // Un ZodError va a server/errores.js: 400 con los campos, antes de tocar la base.
    const q = consulta.parse(req.query ?? {})
    const where = {}
    if (q.estado) where.estado = q.estado
    if (q.tipo) where.tipo = q.tipo
    if (q.q) {
      const patron = `%${escapeLike(q.q)}%`
      where[Op.or] = [def.nombre, 'slug', 'resumen'].map((c) => ({ [c]: { [Op.iLike]: patron } }))
    }
    const { count, rows } = await modelos(sequelize).Modelo.findAndCountAll({
      where,
      attributes: atributosListado,
      include: incluirListado,
      order: ordenLista(sequelize),
      limit: q.por,
      offset: (q.pagina - 1) * q.por,
    })
    res.json({
      data: {
        items: rows.map((f) => itemDe(def, f)),
        total: count,
        pagina: q.pagina,
        por: q.por,
        paginas: Math.max(1, Math.ceil(count / q.por)),
      },
    })
  }

  async function crear(req, res, { sequelize }) {
    const { Modelo } = modelos(sequelize)
    const datos = req.datos
    const id = await conReintento(() =>
      sequelize.transaction(async (transaction) => {
        const valores = { ...datos, estado: 'borrador', creadoPor: req.usuario.id, actualizadoPor: req.usuario.id }
        if (def.conOrden) {
          // De a una (como las tarifas): la nueva va al final, y el orden queda 1..n aunque se hayan borrado otras.
          await sequelize.query(`LOCK TABLE ${def.tabla} IN SHARE ROW EXCLUSIVE MODE`, { transaction })
          const [{ cuantas, ultimo }] = await sequelize.query(
            `SELECT count(*)::int AS cuantas, coalesce(max(orden), 0)::int AS ultimo FROM ${def.tabla}`,
            { type: QueryTypes.SELECT, transaction },
          )
          if (cuantas >= ORDEN_MAX) {
            throw httpError(409, `Ya hay ${ORDEN_MAX}: eliminá alguna antes de agregar otra.`)
          }
          if (ultimo !== cuantas) {
            await sequelize.query(
              `UPDATE ${def.tabla} SET orden = n.lugar
                 FROM (SELECT id, row_number() OVER (ORDER BY orden, id) AS lugar FROM ${def.tabla}) AS n
                WHERE ${def.tabla}.id = n.id AND ${def.tabla}.orden <> n.lugar`,
              { transaction },
            )
          }
          valores.orden = cuantas + 1
        } else {
          // De a una también (sin tocar la tabla): dos altas con el mismo título no eligen la misma dirección.
          await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:clave))', {
            replacements: { clave: `mupa_alta_${def.tabla}` },
            transaction,
          })
        }
        valores.slug = await slugLibre(sequelize, datos[def.nombre], null, transaction)
        const fila = await Modelo.create(valores, {
          fields: [...def.alta, 'slug', 'estado', 'creadoPor', 'actualizadoPor', ...(def.conOrden ? ['orden'] : [])],
          transaction,
        })
        return fila.id
      }),
    )
    log('info', evento('creada'), { [idDelLog]: id, por: req.usuario.id })
    res.status(201).json({ data: await leerFicha(sequelize, id) })
  }

  async function ver(req, res, { sequelize }) {
    const ficha = await leerFicha(sequelize, req.idRuta)
    if (!ficha) throw httpError(404, def.noExiste)
    res.json({ data: ficha })
  }

  /**
   * La portada que se guarda y si la que había se libera, según portadaAntes (la que tenía la ficha cuando se abrió).
   * @returns {{ portadaId: number | null, liberarLaDeAntes: boolean }}
   */
  function portadaParaGuardar(fila, datos) {
    const enLaBase = fila.portadaId ?? null
    const pedida = datos.portadaId
    if (datos.portadaAntes === undefined || datos.portadaAntes === enLaBase) {
      return { portadaId: pedida, liberarLaDeAntes: enLaBase != null && enLaBase !== pedida }
    }
    // Otra persona la cambió mientras tanto: si este pedido no la tocó, queda la suya; si la tocó, gana este pero la
    // de la otra persona no se borra ahora.
    return { portadaId: pedida === datos.portadaAntes ? enLaBase : pedida, liberarLaDeAntes: false }
  }

  async function modificar(req, res, { sequelize, almacen, indexNow }) {
    let publicada = null
    await sequelize.transaction(async (transaction) => {
      const fila = await bloquear(sequelize, req.idRuta, transaction)
      const { portadaId, liberarLaDeAntes } = portadaParaGuardar(fila, req.datos)
      const datos = { ...req.datos, portadaId }
      const slug = await slugParaGuardar(sequelize, fila, datos, transaction)
      if ('salaId' in datos) await exigirSala(sequelize, datos.salaId, transaction)
      const fotos = await exigirFotos(sequelize, [datos.portadaId], 'portadaId', transaction)
      if (fila.estado === 'publicado') {
        exigirParaPublicar(
          datos,
          fotos.get(datos.portadaId),
          'Está publicada: para guardar los cambios tiene que seguir completa (o despublicala primero).',
        )
      }
      const portadaDeAntes = fila.portadaId
      await fila.update(
        { ...paraLaBase(datos), slug, actualizadoPor: req.usuario.id },
        { fields: [...def.campos, 'actualizadoPor'], transaction },
      )
      if (liberarLaDeAntes) await almacen.liberar([portadaDeAntes], transaction)
      if (fila.estado === 'publicado') publicada = slug
    })
    log('info', evento('modificada'), { [idDelLog]: req.idRuta, por: req.usuario.id })
    if (publicada) indexNow?.avisar(paginasDelSitio(publicada))
    res.json({ data: await leerFicha(sequelize, req.idRuta) })
  }

  async function publicar(req, res, { sequelize, indexNow }) {
    let cambio = false
    await sequelize.transaction(async (transaction) => {
      const fila = await bloquear(sequelize, req.idRuta, transaction)
      if (fila.estado === 'publicado') return
      const datos = datosDe(def, fila)
      const fotos = await exigirFotos(sequelize, [fila.portadaId], 'portadaId', transaction)
      exigirParaPublicar(datos, fotos.get(fila.portadaId), 'Para publicar, falta completar algunos datos.')
      await fila.update(
        { estado: 'publicado', publicadoEn: fila.publicadoEn ?? new Date(), actualizadoPor: req.usuario.id },
        { fields: ['estado', 'publicadoEn', 'actualizadoPor'], transaction },
      )
      cambio = fila.slug
    })
    if (cambio) {
      log('info', evento('publicada'), { [idDelLog]: req.idRuta, por: req.usuario.id })
      indexNow?.avisar(paginasDelSitio(cambio))
    }
    res.json({ data: await leerFicha(sequelize, req.idRuta) })
  }

  async function despublicar(req, res, { sequelize, indexNow }) {
    let cambio = false
    await sequelize.transaction(async (transaction) => {
      const fila = await bloquear(sequelize, req.idRuta, transaction)
      if (fila.estado === 'borrador') return
      await fila.update(
        { estado: 'borrador', actualizadoPor: req.usuario.id },
        { fields: ['estado', 'actualizadoPor'], transaction },
      )
      cambio = fila.slug
    })
    if (cambio) {
      log('info', evento('despublicada'), { [idDelLog]: req.idRuta, por: req.usuario.id })
      indexNow?.avisar(paginasDelSitio(cambio))
    }
    res.json({ data: await leerFicha(sequelize, req.idRuta) })
  }

  async function eliminar(req, res, { sequelize, almacen, indexNow }) {
    const { Galeria } = modelos(sequelize)
    let publicada = null
    const borradas = await sequelize.transaction(async (transaction) => {
      const fila = await bloquear(sequelize, req.idRuta, transaction)
      if (fila.estado === 'publicado') publicada = fila.slug
      const fotos = [fila.portadaId]
      if (Galeria) {
        const lugares = await Galeria.findAll({
          where: { [Galeria.claveDelContenido]: fila.id },
          attributes: ['fotoId'],
          transaction,
        })
        fotos.push(...lugares.map((l) => l.fotoId))
      }
      await fila.destroy({ transaction })
      return almacen.liberar(fotos, transaction)
    })
    log('info', evento('eliminada'), { [idDelLog]: req.idRuta, fotos_borradas: borradas.length, por: req.usuario.id })
    if (publicada) indexNow?.avisar(paginasDelSitio(publicada))
    res.json({ data: { id: req.idRuta } })
  }

  async function guardarGaleria(req, res, { sequelize, almacen, indexNow }) {
    const { Modelo, Galeria } = modelos(sequelize)
    const clave = Galeria.claveDelContenido
    const { fotos, antes: cargadas } = req.datos
    let publicada = null
    await sequelize.transaction(async (transaction) => {
      const fila = await bloquear(sequelize, req.idRuta, transaction)
      if (fila.estado === 'publicado') publicada = fila.slug
      const lugares = await Galeria.findAll({ where: { [clave]: fila.id }, attributes: ['fotoId'], transaction })
      const actuales = lugares.map((l) => l.fotoId)
      if (cargadas) {
        // Lo que tenía cuando se abrió la ficha contra lo que hay (el orden no importa: lo que se pierde es una foto).
        const conocidas = new Set(cargadas)
        if (actuales.length !== conocidas.size || actuales.some((id) => !conocidas.has(id))) {
          throw httpError(409, GALERIA_CAMBIO, { campos: { fotos: GALERIA_CAMBIO } })
        }
      }
      await exigirFotos(sequelize, fotos, 'fotos', transaction)
      await Galeria.destroy({ where: { [clave]: fila.id }, transaction })
      if (fotos.length) {
        await Galeria.bulkCreate(
          fotos.map((fotoId, i) => ({ [clave]: fila.id, fotoId, orden: i + 1 })),
          { transaction },
        )
      }
      // La última edición (updated_at lo pone Sequelize).
      await Modelo.update({ actualizadoPor: req.usuario.id }, { where: { id: fila.id }, transaction })
      const quitadas = actuales.filter((id) => !fotos.includes(id))
      await almacen.liberar(quitadas, transaction)
    })
    log('info', evento('galeria'), { [idDelLog]: req.idRuta, fotos: fotos.length, por: req.usuario.id })
    if (publicada) indexNow?.avisar(paginasDelSitio(publicada))
    res.json({ data: await leerFicha(sequelize, req.idRuta) })
  }

  async function ordenar(req, res, { sequelize }) {
    const { Modelo } = modelos(sequelize)
    const { ids } = req.datos
    const lista = await sequelize.transaction(async (transaction) => {
      await sequelize.query(`LOCK TABLE ${def.tabla} IN SHARE ROW EXCLUSIVE MODE`, { transaction })
      const actuales = await Modelo.findAll({ attributes: ['id'], transaction })
      const hay = new Set(actuales.map((f) => f.id))
      if (hay.size !== ids.length || ids.some((id) => !hay.has(id))) {
        throw httpError(
          409,
          'La lista cambió mientras tanto (alguien agregó o eliminó una). Recargá la pantalla y probá de nuevo.',
        )
      }
      await sequelize.query(
        `UPDATE ${def.tabla} SET orden = n.lugar
           FROM unnest(ARRAY[:ids]::int[]) WITH ORDINALITY AS n(id, lugar)
          WHERE ${def.tabla}.id = n.id AND ${def.tabla}.orden <> n.lugar`,
        { replacements: { ids }, transaction },
      )
      return Modelo.findAll({
        attributes: atributosListado,
        include: incluirListado,
        order: ordenLista(sequelize),
        transaction,
      })
    })
    log('info', `${tipo}_ordenadas`, { cuantas: ids.length, por: req.usuario.id })
    res.json({ data: lista.map((f) => itemDe(def, f)) })
  }

  const rutas = [
    { metodo: 'GET', ruta: `/${tipo}`, rol: 'editor', manejador: listar },
    { metodo: 'POST', ruta: `/${tipo}`, rol: 'editor', cuerpo: esquemaAlta, manejador: crear },
  ]
  // Antes que /<tipo>/:id: si no, "orden" se tomaría como un id (400).
  if (def.conOrden) {
    rutas.push({ metodo: 'PUT', ruta: `/${tipo}/orden`, rol: 'editor', cuerpo: esquemaOrden, manejador: ordenar })
  }
  rutas.push(
    { metodo: 'GET', ruta: `/${tipo}/:id`, rol: 'editor', manejador: ver },
    {
      metodo: 'PUT',
      ruta: `/${tipo}/:id`,
      rol: 'editor',
      limiteJson: '300kb',
      cuerpo: esquemaCambio,
      manejador: modificar,
    },
    { metodo: 'DELETE', ruta: `/${tipo}/:id`, rol: 'editor', manejador: eliminar },
    { metodo: 'POST', ruta: `/${tipo}/:id/publicar`, rol: 'editor', manejador: publicar },
    { metodo: 'POST', ruta: `/${tipo}/:id/despublicar`, rol: 'editor', manejador: despublicar },
  )
  if (def.galeria) {
    rutas.push({
      metodo: 'PUT',
      ruta: `/${tipo}/:id/galeria`,
      rol: 'editor',
      cuerpo: esquemaGaleria,
      manejador: guardarGaleria,
    })
  }
  return rutas
}

/** @type {import('./indice.js').Definicion[]} */
export const rutasDeContenidos = ['novedades', 'muestras', 'salas'].flatMap(rutasDeContenido)
