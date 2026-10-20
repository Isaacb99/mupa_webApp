// Los datos de cada página interna del sitio (E4.2 a E4.5; plan 6.1 y 6.2): lo que devuelve el cargar() de cada ruta de
// server/rutas-publicas.js, que va a estado.datos. Objetos planos y con todo lo que se muestra ya como texto (fechas,
// situaciones, precios, "Hoy (jueves)"): el navegador no calcula nada que pueda cambiar entre el servidor y él (la
// fecha, la zona horaria), así la hidratación dibuja lo mismo.
//
// Cada cargar(ctx) recibe { params, consulta, hoy, ahora, lector, museo }: params de la ruta (el slug), consulta
// (req.query), hoy ("AAAA-MM-DD" en San Juan) y ahora (Date), los dos del pedido; lector: los contenidos publicados
// (server/contenido-publico.js); museo(): la lectura del museo de ese pedido, { museo, alDia } (server/museo.js);
// contacto: el formulario de contacto (server/contacto.js), para saber si se dibuja.
// Devuelve los datos, null (404 real) o redirigir(destino) (301). Si la base falla, la consulta tira
// BASE_NO_DISPONIBLE y la página sale con la 503 simple (server/ssr.js).
//
// Reglas del plan 6.1: un borrador da 404 (el lector no lo ve); lo finalizado o realizado da 200 en su página pero no
// se lista; una sección sin contenido no se dibuja (las listas vacías y los textos null los saltea cada página).
import { urlPublica } from '../compartido/contenidos.js'
import { actividadRealizada, situacionDeMuestra, SITUACIONES_MUESTRA } from '../compartido/estados.js'
import { cuandoEs, diaDeLaSemana, fechaLarga, hoyEnSanJuan, localDeInstante, nombreDelDia, periodo } from '../compartido/fechas.js'
import { DIAS, textoFranjas } from '../compartido/horarios.js'
import { textoPrecio } from '../compartido/precios.js'
import { esMarcaDeEnviado } from './contacto.js'
import { NOVEDADES_POR_PAGINA } from './contenido-publico.js'

/** Lo que devuelve un cargar() para mandar a otra dirección (301). */
export class Redireccion {
  constructor(destino) {
    this.destino = destino
  }
}
export const redirigir = (destino) => new Redireccion(destino)

/** El error con que una página dice que no tiene los datos de ahora (la 503 simple, server/ssr.js). */
const sinDatosAlDia = () => Object.assign(new Error('El museo no está al día'), { code: 'BASE_NO_DISPONIBLE' })

const iso = (fecha) => (fecha instanceof Date ? fecha.toISOString() : null)
// "AAAA-MM-DDTHH:MM-03:00": la hora de San Juan con su desfase, para <time dateTime>.
const isoLocal = (fecha) => {
  const local = localDeInstante(fecha)
  return local ? `${local}-03:00` : null
}

// --- Exposiciones (E4.2) ---

/**
 * Lo que dice una muestra de cuándo se puede ver. En la lista, corto ("Hasta el 30 de noviembre de 2026"); en su
 * página, el período entero, y si ya terminó, "Finalizó el …" (plan 6.1).
 * @param {'permanente' | 'proxima' | 'actual' | 'finalizada' | null} situacion
 */
function fechasDeMuestra(situacion, { fechaInicio, fechaFin }, enSuPagina) {
  if (situacion === 'finalizada') return `Finalizó el ${fechaLarga(fechaFin)}`
  if (situacion === 'actual' && !enSuPagina) return fechaFin ? `Hasta el ${fechaLarga(fechaFin)}` : null
  if (situacion === 'actual' || situacion === 'proxima') return periodo(fechaInicio, fechaFin) || null
  return null
}

const salaDe = (sala) => (sala ? { nombre: sala.nombre, url: urlPublica('salas', sala.slug) } : null)

/**
 * /exposiciones: las muestras actuales, próximas y permanentes publicadas (como tarjetas: { titulo, url, resumen,
 * portada, etiqueta, detalle }, la forma de src/components/Tarjeta.jsx) y las salas publicadas.
 */
export async function cargarExposiciones({ hoy, lector }) {
  const { muestras, salas } = await lector.exposiciones(hoy)
  const listadas = muestras.flatMap((m) => {
    const situacion = situacionDeMuestra(m, hoy)
    if (situacion !== 'actual' && situacion !== 'proxima' && situacion !== 'permanente') return []
    return [
      {
        titulo: m.titulo,
        url: urlPublica('muestras', m.slug),
        resumen: m.resumen,
        portada: m.portada,
        etiqueta: SITUACIONES_MUESTRA[situacion],
        detalle: fechasDeMuestra(situacion, m, false),
        salaSlug: m.sala?.slug ?? null,
      },
    ]
  })
  return {
    muestras: listadas.map(({ salaSlug, ...tarjeta }) => tarjeta),
    salas: salas.map((s) => ({
      nombre: s.nombre,
      ancla: `sala-${s.slug}`,
      resumen: s.resumen,
      descripcion: s.descripcion,
      portada: s.portada,
      muestras: listadas.filter((m) => m.salaSlug === s.slug).map((m) => ({ titulo: m.titulo, url: m.url })),
    })),
  }
}

/** /exposiciones/:slug: la muestra (también finalizada: 200 con "Finalizó el …"). */
export async function cargarMuestra({ params, hoy, lector }) {
  const m = await lector.muestra(params.slug)
  if (!m) return null
  const situacion = situacionDeMuestra(m, hoy)
  return {
    titulo: m.titulo,
    slug: m.slug,
    resumen: m.resumen,
    situacion: situacion ? SITUACIONES_MUESTRA[situacion] : null,
    fechas: fechasDeMuestra(situacion, m, true),
    sala: salaDe(m.sala),
    portada: m.portada,
    descripcion: m.descripcion,
    galeria: m.galeria,
  }
}

// --- Visitas (E4.3) ---

/**
 * El horario de la semana para la tabla: un renglón por día, con "Hoy (jueves)" en el de hoy y las franjas como texto
 * (null: cerrado). Si ningún día abre (lo que deja la migración con el horario sin cargar), vacío: no se dibuja (como
 * el pie, compartido/horarios.js).
 */
export function horarioDeLaSemana(horarios, hoy) {
  const dias = (Array.isArray(horarios) ? horarios : []).filter((h) => Number.isInteger(h?.dia) && h.dia >= 1 && h.dia <= 7)
  if (!dias.some((h) => h.abierto)) return []
  const diaDeHoy = diaDeLaSemana(hoy)
  return [...dias]
    .sort((a, b) => a.dia - b.dia)
    .map((h) => ({
      dia: h.dia === diaDeHoy ? `Hoy (${nombreDelDia(h.dia)})` : DIAS[h.dia - 1],
      hoy: h.dia === diaDeHoy,
      horas: h.abierto && Array.isArray(h.franjas) && h.franjas.length ? textoFranjas(h.franjas) : null,
      nota: h.nota ?? null,
    }))
}

/**
 * /visitas: el horario, las tarifas visibles, sus notas, el aviso vigente, la compra externa y los tres textos con
 * formato del museo (que van solo acá: COD-04 de E3). Sale del museo del pedido: si la base no respondió (el último
 * bueno), la 503 simple (plan 6.3).
 */
export async function cargarVisitas({ hoy, museo: leerMuseo }) {
  const { museo, alDia } = await leerMuseo()
  if (!alDia) throw sinDatosAlDia()
  return {
    horario: horarioDeLaSemana(museo.horarios, hoy),
    notaHorarios: museo.notaHorarios ?? null,
    aviso: museo.aviso?.texto ?? null,
    tarifas: (museo.tarifas ?? []).map((t) => ({
      nombre: t.nombre,
      // null: gratuita (el sitio dice "Gratis", content.js).
      precio: t.gratuita || !Number.isInteger(t.precio) ? null : textoPrecio(t.precio),
      condicion: t.condicion ?? null,
    })),
    notaTarifas: museo.notaTarifas ?? null,
    compra: museo.compra ?? null,
    comoLlegar: museo.comoLlegar ?? null,
    normas: museo.normas ?? null,
    accesibilidad: museo.accesibilidad ?? null,
  }
}

// --- Novedades (E4.4) ---

/**
 * La página pedida en ?pagina=: 1 sin el parámetro; redirigir si es "1" (301 a /novedades); null si no es un entero
 * de 2 en adelante (404).
 */
export function paginaPedida(valor) {
  if (valor === undefined) return 1
  if (valor === '1') return redirigir('/novedades')
  if (typeof valor !== 'string' || !/^[1-9]\d{0,5}$/.test(valor)) return null
  return Number(valor)
}

/** /novedades: las próximas actividades (en la primera página) y las noticias publicadas, de a 12 por página. */
export async function cargarNovedades({ consulta, ahora, lector }) {
  const pagina = paginaPedida(consulta?.pagina)
  if (pagina === null || pagina instanceof Redireccion) return pagina
  const { proximas, noticias, total } = await lector.novedades({ pagina, ahora, conProximas: pagina === 1 })
  const paginas = Math.max(1, Math.ceil(total / NOVEDADES_POR_PAGINA))
  if (pagina > paginas) return null
  // Las tarjetas, con la forma de src/components/Tarjeta.jsx: detalle es cuándo es la actividad o la fecha de la
  // noticia, y fechaIso su valor para <time dateTime>.
  const tarjeta = (n, detalle, fechaIso) => ({
    titulo: n.titulo,
    url: urlPublica('novedades', n.slug),
    resumen: n.resumen,
    portada: n.portada,
    detalle: detalle || null,
    fechaIso,
  })
  return {
    pagina,
    paginas,
    proximas: proximas.map((n) => tarjeta(n, cuandoEs(n.inicio, n.fin), isoLocal(n.inicio))),
    noticias: noticias.map((n) => {
      const dia = n.publicadoEn ? hoyEnSanJuan(n.publicadoEn) : null
      return tarjeta(n, dia ? fechaLarga(dia) : null, dia)
    }),
  }
}

/** /novedades/:slug: la noticia o la actividad (también realizada: 200, con "Realizada" y sin la inscripción). */
export async function cargarNovedad({ params, ahora, lector }) {
  const n = await lector.novedad(params.slug)
  if (!n) return null
  const dia = n.publicadoEn ? hoyEnSanJuan(n.publicadoEn) : null
  const esActividad = n.tipo === 'actividad'
  const realizada = esActividad && actividadRealizada({ eventoInicio: n.inicio, eventoFin: n.fin }, ahora)
  return {
    tipo: esActividad ? 'actividad' : 'noticia',
    titulo: n.titulo,
    slug: n.slug,
    resumen: n.resumen,
    fecha: dia ? fechaLarga(dia) : null,
    fechaIso: dia,
    actividad: esActividad
      ? {
          cuando: cuandoEs(n.inicio, n.fin) || null,
          cuandoIso: isoLocal(n.inicio),
          realizada,
          lugar: n.lugar,
          costo: n.costo,
          inscripcion: realizada ? null : n.enlaceInscripcion,
        }
      : null,
    portada: n.portada,
    cuerpo: n.cuerpo,
    galeria: n.galeria,
    publicadaEn: iso(n.publicadoEn),
    actualizadaEn: iso(n.actualizadoEn),
  }
}

// --- Contacto (E4.5) ---

/**
 * /contacto: si se dibuja el formulario (casilla de envío y dirección de destino: server/contacto.js; la dirección
 * nunca viene acá) y si se llega después de mandar un mensaje (?enviado=<marca>, el 303 de POST /contacto: la marca la
 * firma el servidor y vale 10 minutos, así una dirección compartida o guardada no dice "Recibimos tu mensaje" ni cuenta
 * enviar_contacto; ?enviado=1 es la página de siempre). Los datos del museo (dirección, teléfono, correo público, redes
 * y el mapa) ya van en estado.museo. Si la base no respondió, la 503 simple (plan 6.3), como Visitas. valores, errores
 * y error son los de POST /contacto cuando hay que corregir algo (acá, siempre null).
 */
export async function cargarContacto({ consulta, museo: leerMuseo, contacto, ahora = new Date() }) {
  const [{ alDia }, formulario] = await Promise.all([leerMuseo(), contacto ? contacto.formularioActivo() : false])
  if (!alDia) throw sinDatosAlDia()
  const enviado = esMarcaDeEnviado(consulta?.enviado, ahora.getTime())
  return { formulario, enviado, valores: null, errores: null, error: null }
}
