// Datos de ejemplo para trabajar en local (plan 3.4): npm run semilla:ejemplo, después de npm run migrar.
// Solo contra una base local y nunca con NODE_ENV=production (exigirBaseLocal, server/db/guardas.js): pisa datos.
// Todo lo que muestra el sitio va marcado "EJEMPLO ·" y las direcciones son de example.com (reservado para ejemplos),
// como el museo de SIN_BASE (server/museo.js). Crece con cada migración: hoy, la fila del museo, el horario semanal,
// las tarifas y, desde E3.3 y E3.4, salas, muestras y novedades (plan 3.4: 2 salas, 3 muestras —actual, próxima y
// finalizada, con las fechas corridas desde hoy— y 4 novedades —dos noticias, una actividad pasada y otra futura—,
// todas publicadas, con portadas de un color liso hechas con sharp y alguna galería) y, desde E4.9, 3 mensajes del
// formulario de contacto (uno que no se pudo mandar). Sin usuarios: el admin se crea con npm run crear-admin.
// Se puede correr varias veces: pisa la fila del museo y los 7 días, y reemplaza solo las tarifas y los contenidos
// "EJEMPLO ·" (con sus fotos, que libera liberarFotos si nadie más las usa) y los mensajes "EJEMPLO ·".
import { Op } from 'sequelize'
import sharp from 'sharp'
import { hoyEnSanJuan } from '../../../compartido/fechas.js'
import { crearAlmacen } from '../../fotos/almacen.js'
import { procesarFoto } from '../../fotos/procesar.js'
import { esPrincipal } from '../../principal.js'

const EJEMPLO = 'EJEMPLO · '

const MUSEO = {
  direccion: `${EJEMPLO}Avenida de ejemplo 1234 (Oeste)`,
  localidad: `${EJEMPLO}Ciudad de San Juan`,
  provincia: 'San Juan',
  codigoPostal: '5400',
  telefono: '+54 264 000-0000',
  emailPublico: 'museo@example.com',
  emailDestinoContacto: 'destino@example.com',
  redes: [
    { red: 'instagram', url: 'https://example.com/instagram' },
    { red: 'facebook', url: 'https://example.com/facebook' },
  ],
  mapaEmbedUrl: null,
  mapaUrl: 'https://example.com/mapa',
  // Los textos con formato (E3.2): el JSON del editor, en la forma canónica de compartido/esquemas/textoRico.js.
  comoLlegar: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `${EJEMPLO}En colectivo` }] },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `${EJEMPLO}Texto de prueba: ` },
          { type: 'text', text: 'no son los recorridos del museo', marks: [{ type: 'bold' }] },
          { type: 'text', text: '. ' },
          { type: 'text', text: 'Mapa de ejemplo', marks: [{ type: 'link', attrs: { href: 'https://example.com/mapa' } }] },
        ],
      },
    ],
  },
  normas: {
    type: 'doc',
    content: [
      {
        type: 'bulletList',
        content: [`${EJEMPLO}Norma de prueba uno`, `${EJEMPLO}Norma de prueba dos`].map((text) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        })),
      },
    ],
  },
  accesibilidad: null,
  notaHorarios: `${EJEMPLO}Horarios de prueba: no son los del museo.`,
  notaTarifas: `${EJEMPLO}Precios de prueba: no son los del museo.`,
  compraActiva: false,
  compraUrl: null,
  compraTexto: null,
  avisoTexto: `${EJEMPLO}Aviso de prueba (cierre por feriado).`,
  avisoHasta: null,
  actualizadoPor: null,
}

const MANANA_Y_TARDE = [
  { abre: '09:00', cierra: '13:00' },
  { abre: '16:00', cierra: '20:00' },
]
const HORARIO = [
  { dia: 1, abierto: false, franjas: [], nota: `${EJEMPLO}Cerrado por mantenimiento` },
  { dia: 2, abierto: true, franjas: MANANA_Y_TARDE, nota: null },
  { dia: 3, abierto: true, franjas: MANANA_Y_TARDE, nota: null },
  { dia: 4, abierto: true, franjas: MANANA_Y_TARDE, nota: null },
  { dia: 5, abierto: true, franjas: MANANA_Y_TARDE, nota: null },
  { dia: 6, abierto: true, franjas: [{ abre: '10:00', cierra: '19:00' }], nota: null },
  { dia: 7, abierto: true, franjas: [{ abre: '10:00', cierra: '19:00' }], nota: `${EJEMPLO}Visitas guiadas a las 11` },
]

const TARIFAS = [
  { nombre: `${EJEMPLO}General`, gratuita: false, precio: 3000, condicion: null, orden: 1, visible: true },
  {
    nombre: `${EJEMPLO}Estudiantes y jubilados`,
    gratuita: false,
    precio: 1500,
    condicion: `${EJEMPLO}Con credencial`,
    orden: 2,
    visible: true,
  },
  { nombre: `${EJEMPLO}Menores de 6 años`, gratuita: true, precio: null, condicion: null, orden: 3, visible: true },
  { nombre: `${EJEMPLO}Tarifa oculta`, gratuita: false, precio: 500, condicion: null, orden: 4, visible: false },
]

// --- Mensajes del formulario de contacto (E4.9) ---

/** Tres mensajes, uno que no se pudo mandar por correo (plan 3.4); hace cuántas horas llegó cada uno. */
const MENSAJES = [
  {
    nombre: `${EJEMPLO}Persona de prueba uno`,
    email: 'visitante-uno@example.com',
    mensaje: `${EJEMPLO}Mensaje de prueba: no lo escribió nadie.\nTiene dos renglones.`,
    envio: 'enviado',
    error: null,
    horas: 50,
  },
  {
    nombre: `${EJEMPLO}Persona de prueba dos`,
    email: 'visitante-dos@example.com',
    mensaje: `${EJEMPLO}Otro mensaje de prueba, que salió por correo.`,
    envio: 'enviado',
    error: null,
    horas: 26,
  },
  {
    nombre: `${EJEMPLO}Persona de prueba tres`,
    email: 'visitante-tres@example.com',
    mensaje: `${EJEMPLO}Un mensaje de prueba que no se pudo mandar por correo (quedó guardado).`,
    envio: 'fallido',
    error: 'EAUTH',
    horas: 2,
  },
]

/** Reemplaza los mensajes "EJEMPLO ·". Devuelve cuántos había. */
async function cargarMensajes(sequelize, transaction) {
  const [, borrados] = await sequelize.query(`DELETE FROM mensajes_contacto WHERE nombre LIKE 'EJEMPLO · %'`, {
    transaction,
  })
  for (const { horas, ...m } of MENSAJES) {
    await sequelize.query(
      `INSERT INTO mensajes_contacto (nombre, email, mensaje, envio, error, created_at)
       VALUES (:nombre, :email, :mensaje, :envio, :error, now() - make_interval(hours => :horas))`,
      { replacements: { ...m, horas }, transaction },
    )
  }
  return borrados?.rowCount ?? 0
}

// --- Contenidos (E3.3 y E3.4) ---

/** Un texto con formato de un párrafo, en la forma canónica (compartido/esquemas/textoRico.js). */
const parrafo = (texto) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: texto }] }] })

/** Las fotos de ejemplo: un color liso (sharp), con su descripción. */
const FOTOS = [
  { color: '#7a5230', alt: `${EJEMPLO}Foto de prueba color tierra` },
  { color: '#2f4f6f', alt: `${EJEMPLO}Foto de prueba azul` },
  { color: '#5f7a3a', alt: `${EJEMPLO}Foto de prueba verde` },
  { color: '#8a1812', alt: `${EJEMPLO}Foto de prueba bordó` },
  { color: '#c9a227', alt: `${EJEMPLO}Foto de prueba ocre` },
]

/** Un día "AAAA-MM-DD" corrido n días desde hoy (en San Juan). */
function diaDesdeHoy(n, hoy) {
  const fecha = new Date(`${hoy}T12:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + n)
  return fecha.toISOString().slice(0, 10)
}
const DIA = 24 * 60 * 60 * 1000

/**
 * Borra los contenidos "EJEMPLO ·" que haya y libera sus fotos. Devuelve cuántos borró.
 * @param {import('sequelize').Sequelize} sequelize
 */
async function borrarContenidosDeEjemplo(sequelize, almacen, transaction) {
  const { Sala, Muestra, Novedad, GaleriaMuestra, GaleriaNovedad } = sequelize.models
  let borrados = 0
  const fotos = []
  for (const [Modelo, campo, Galeria] of [
    [Novedad, 'titulo', GaleriaNovedad],
    [Muestra, 'titulo', GaleriaMuestra],
    [Sala, 'nombre', null],
  ]) {
    const filas = await Modelo.findAll({ where: { [campo]: { [Op.startsWith]: EJEMPLO } }, transaction })
    if (!filas.length) continue
    const ids = filas.map((f) => f.id)
    fotos.push(...filas.map((f) => f.portadaId))
    if (Galeria) {
      const lugares = await Galeria.findAll({ where: { [Galeria.claveDelContenido]: ids }, transaction })
      fotos.push(...lugares.map((l) => l.fotoId))
    }
    borrados += await Modelo.destroy({ where: { id: ids }, transaction })
  }
  await almacen.liberar(fotos, transaction)
  return borrados
}

/**
 * Las 2 salas, 3 muestras y 4 novedades de ejemplo, publicadas, con sus portadas (y alguna galería).
 * @param {import('sequelize').Sequelize} sequelize
 */
async function cargarContenidos(sequelize, almacen, transaction, { hoy = hoyEnSanJuan(), ahora = new Date() } = {}) {
  const { Sala, Muestra, Novedad, GaleriaMuestra, GaleriaNovedad } = sequelize.models
  const fotos = []
  for (const { color, alt } of FOTOS) {
    const original = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: color } })
      .jpeg()
      .toBuffer()
    const foto = await almacen.guardar(
      { alt, decorativa: false, epigrafe: `${EJEMPLO}Epígrafe de prueba`, credito: null, subidaPor: null },
      await procesarFoto(original),
      { transaction },
    )
    fotos.push(foto.id)
  }
  const publicada = (diasAtras) => ({ estado: 'publicado', publicadoEn: new Date(ahora.getTime() - diasAtras * DIA) })
  const siguiente = async (Modelo) =>
    ((await Modelo.max('orden', { transaction })) ?? 0) + 1

  const salaUno = await Sala.create(
    {
      nombre: `${EJEMPLO}Sala de los primeros dinosaurios`,
      slug: 'ejemplo-sala-primeros-dinosaurios',
      resumen: `${EJEMPLO}Resumen de prueba de una sala.`,
      descripcion: parrafo(`${EJEMPLO}Descripción de prueba de la sala.`),
      portadaId: fotos[0],
      orden: await siguiente(Sala),
      ...publicada(30),
    },
    { transaction },
  )
  await Sala.create(
    {
      nombre: `${EJEMPLO}Sala del Triásico`,
      slug: 'ejemplo-sala-triasico',
      resumen: `${EJEMPLO}Otra sala de prueba.`,
      descripcion: null,
      portadaId: fotos[1],
      orden: await siguiente(Sala),
      ...publicada(30),
    },
    { transaction },
  )

  const MUESTRAS = [
    ['actual', 'Muestra actual', -30, 60, salaUno.id],
    ['proxima', 'Muestra próxima', 20, 90, null],
    ['finalizada', 'Muestra finalizada', -120, -10, null],
  ]
  for (const [clave, titulo, desde, hasta, salaId] of MUESTRAS) {
    const muestra = await Muestra.create(
      {
        titulo: `${EJEMPLO}${titulo}`,
        slug: `ejemplo-muestra-${clave}`,
        tipo: 'temporal',
        fechaInicio: diaDesdeHoy(desde, hoy),
        fechaFin: diaDesdeHoy(hasta, hoy),
        salaId,
        resumen: `${EJEMPLO}Resumen de prueba de la ${titulo.toLowerCase()}.`,
        descripcion: parrafo(`${EJEMPLO}Descripción de prueba: no es una muestra del museo.`),
        portadaId: fotos[2],
        orden: await siguiente(Muestra),
        ...publicada(clave === 'finalizada' ? 120 : 40),
      },
      { transaction },
    )
    if (clave === 'actual') {
      await GaleriaMuestra.bulkCreate(
        [fotos[3], fotos[4]].map((fotoId, i) => ({ muestraId: muestra.id, fotoId, orden: i + 1 })),
        { transaction },
      )
    }
  }

  const NOVEDADES = [
    { clave: 'noticia-1', tipo: 'noticia', titulo: 'Noticia de prueba', dias: 2 },
    { clave: 'noticia-2', tipo: 'noticia', titulo: 'Otra noticia de prueba', dias: 15 },
    { clave: 'actividad-pasada', tipo: 'actividad', titulo: 'Actividad que ya pasó', dias: 20, evento: -7 },
    { clave: 'actividad-futura', tipo: 'actividad', titulo: 'Actividad que viene', dias: 1, evento: 14 },
  ]
  for (const n of NOVEDADES) {
    const actividad = n.tipo === 'actividad'
    const inicio = actividad ? new Date(ahora.getTime() + n.evento * DIA) : null
    const novedad = await Novedad.create(
      {
        tipo: n.tipo,
        titulo: `${EJEMPLO}${n.titulo}`,
        slug: `ejemplo-${n.clave}`,
        resumen: `${EJEMPLO}Resumen de prueba: no es una novedad del museo.`,
        cuerpo: parrafo(`${EJEMPLO}Texto de prueba de la novedad.`),
        portadaId: fotos[n.clave === 'noticia-1' ? 3 : 4],
        eventoInicio: inicio,
        eventoFin: inicio ? new Date(inicio.getTime() + 2 * 60 * 60 * 1000) : null,
        lugar: actividad ? `${EJEMPLO}Patio del museo` : null,
        costo: actividad ? `${EJEMPLO}Gratis` : null,
        enlaceInscripcion: n.clave === 'actividad-futura' ? 'https://example.com/inscripcion' : null,
        ...publicada(n.dias),
      },
      { transaction },
    )
    if (n.clave === 'noticia-1') {
      await GaleriaNovedad.create({ novedadId: novedad.id, fotoId: fotos[0], orden: 1 }, { transaction })
    }
  }
  return { fotos: fotos.length, salas: 2, muestras: MUESTRAS.length, novedades: NOVEDADES.length }
}

/** Carga los datos de ejemplo en una transacción. */
export async function cargarEjemplo(sequelize) {
  const { HorarioSemanal, Museo, Tarifa } = sequelize.models
  const almacen = crearAlmacen(sequelize)
  return sequelize.transaction(async (transaction) => {
    const [museo] = await Museo.upsert({ id: 1, ...MUSEO }, { transaction })
    for (const dia of HORARIO) await HorarioSemanal.upsert(dia, { transaction })
    const borradas = await Tarifa.destroy({ where: { nombre: { [Op.startsWith]: EJEMPLO } }, transaction })
    const tarifas = await Tarifa.bulkCreate(TARIFAS, { transaction })
    const contenidosReemplazados = await borrarContenidosDeEjemplo(sequelize, almacen, transaction)
    const contenidos = await cargarContenidos(sequelize, almacen, transaction)
    const mensajesReemplazados = await cargarMensajes(sequelize, transaction)
    return {
      mensajes: MENSAJES.length,
      mensajesReemplazados,
      museo: museo.id,
      dias: HORARIO.length,
      tarifas: tarifas.length,
      tarifasReemplazadas: borradas,
      ...contenidos,
      contenidosReemplazados,
    }
  })
}

if (esPrincipal(import.meta)) {
  const { configDelProceso } = await import('../../config.js')
  const { crearConexion } = await import('../conexion.js')
  const { exigirBaseLocal } = await import('../guardas.js')
  const config = configDelProceso()
  try {
    // Antes de abrir la conexión.
    exigirBaseLocal(config, config.DATABASE_URL)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
  const sequelize = crearConexion(config)
  if (!sequelize) {
    console.error('Falta DATABASE_URL (o está SIN_BASE): no hay base donde cargar el ejemplo.')
    process.exit(1)
  }
  let codigo = 0
  try {
    const r = await cargarEjemplo(sequelize)
    console.log(
      `Ejemplo cargado: museo (fila ${r.museo}), ${r.dias} días de horario, ${r.tarifas} tarifas` +
        (r.tarifasReemplazadas ? ` (reemplazó ${r.tarifasReemplazadas} de ejemplo)` : '') +
        `, ${r.salas} salas, ${r.muestras} muestras y ${r.novedades} novedades con ${r.fotos} fotos` +
        (r.contenidosReemplazados ? ` (reemplazó ${r.contenidosReemplazados} contenidos de ejemplo)` : '') +
        `, y ${r.mensajes} mensajes del formulario` +
        (r.mensajesReemplazados ? ` (reemplazó ${r.mensajesReemplazados})` : '') +
        '.',
    )
  } catch (err) {
    console.error(`No se pudo cargar el ejemplo: ${err.message}`)
    codigo = 1
  } finally {
    await sequelize.close()
  }
  process.exit(codigo)
}
