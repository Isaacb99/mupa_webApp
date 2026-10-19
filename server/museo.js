// Los datos públicos del museo que van en el estado de cada página (estado.museo: el pie, el JSON-LD y, desde E4,
// Visitas y Contacto), con "el último museo bueno" en memoria por si la base no responde (plan 2.3, 6.2 y 6.3).
//
// leerMuseo() (E2.3) lee la fila museo, los 7 días del horario y las tarifas visibles en su orden, en UNA consulta y
// con la lista de columnas escrita a mano: NUNCA email_destino_contacto (plan 9, "Salida"), ni quién editó, ni las
// tarifas ocultas. La Home todavía no dibuja nada de esto (el pie llega con E4.1), pero el estado ya lo lleva.
// La forma (la de MUSEO_VACIO) es la que leen las páginas, en objetos planos:
//   { direccion, localidad, provincia, codigoPostal, telefono, emailPublico,   texto o null
//     redes: [{ red, url }],
//     mapaEmbedUrl, mapaUrl, notaHorarios, notaTarifas,                       texto o null
//     comoLlegar, normas, accesibilidad,   texto con formato (el JSON del editor, forma canónica) o null
//     aviso: { texto, hasta } | null,      solo si está vigente: sin fecha, o "Mostrar hasta" hoy o después
//     compra: { url, texto } | null,       solo si la compra externa está activa (texto null: el sitio pone el suyo)
//     horarios: [{ dia, abierto, franjas: [{ abre, cierra }], nota }],      ISO: 1 = lunes, ordenados
//     tarifas: [{ id, nombre, gratuita, precio, condicion }] }              las visibles, en su orden; precio en pesos
// Lo que viene de la base se vuelve a mirar al armarlo (lo que el panel no deja guardar tampoco sale, aunque alguien
// lo haya escrito a mano en la base): solo redes conocidas con https, el mapa de Google, la compra con https y los
// textos con formato que pasan el esquema (compartido/esquemas/textoRico.js; si no, null). Los textos los dibuja
// src/components/TextoRico.jsx (la página de Visitas, E4.3); van en el estado de todas las páginas, como el resto del
// museo, aunque hoy ninguna los muestre (en E4.3 conviene pasarlos a los datos de /visitas: el plan 6.1 los pone ahí,
// y con los tres cerca de su tope la Home pasaba de 73 a 357 kB). Validarlos cuesta unos 7 ms con textos grandes:
// leerMuseo los vuelve a validar solo si cambiaron (la base da un md5 de los tres; si es el de la vez anterior, se usa
// lo validado entonces), así cada página no paga ese tiempo.
//
// Si la base falla o tarda más de TOPE_MUSEO_MS, la página sale igual, con el último museo bueno (plan 6.3).
// Con SIN_BASE (solo para probar en local, plan 6.7) no se consulta nada y el museo es uno de ejemplo: "maximo" (todos
// los campos llenos, 6 redes, dirección larga: así lo que el museo cargue después queda dentro de lo probado) o
// "vacio". Las direcciones son de example.com (reservado para ejemplos).
import { QueryTypes } from 'sequelize'
import { esUrlHttps } from '../compartido/esquemas/campos.js'
import { esMapaEmbed, REDES } from '../compartido/esquemas/museo.js'
import { textoRicoPublicable } from '../compartido/esquemas/textoRico.js'
import { hoyEnSanJuan } from '../compartido/fechas.js'
import { codigoDeError, log } from './log.js'

const EJEMPLO = 'EJEMPLO · '

export const MUSEO_VACIO = Object.freeze({
  direccion: null,
  localidad: null,
  provincia: null,
  codigoPostal: null,
  telefono: null,
  emailPublico: null,
  redes: [],
  mapaEmbedUrl: null,
  mapaUrl: null,
  comoLlegar: null,
  normas: null,
  accesibilidad: null,
  notaHorarios: null,
  notaTarifas: null,
  aviso: null,
  compra: null,
  horarios: [],
  tarifas: [],
})

// Los textos con formato del museo de ejemplo, en la forma canónica (la que sale de textoRico.js), con todo lo que el
// editor sabe hacer: subtítulos, negrita, cursiva, listas, enlaces (página, correo y teléfono) y saltos de línea.
const trozo = (text, ...marks) => (marks.length ? { type: 'text', text, marks } : { type: 'text', text })
const parrafo = (...content) => ({ type: 'paragraph', content })
const subtitulo = (text) => ({ type: 'heading', attrs: { level: 2 }, content: [trozo(text)] })
const lista = (tipo, ...items) => ({ type: tipo, content: items.map((p) => ({ type: 'listItem', content: [p] })) })
const NEGRITA = { type: 'bold' }
const CURSIVA = { type: 'italic' }
const enlace = (href) => ({ type: 'link', attrs: { href } })

export const MUSEO_MAXIMO = Object.freeze({
  direccion: `${EJEMPLO}Avenida de ejemplo 1234 (Oeste), entre calle Uno y calle Dos, edificio de la ex estación`,
  localidad: `${EJEMPLO}Ciudad de San Juan`,
  provincia: 'San Juan',
  codigoPostal: '5400',
  telefono: '+54 264 000-0000',
  emailPublico: 'museo@example.com',
  redes: [
    { red: 'instagram', url: 'https://example.com/instagram' },
    { red: 'facebook', url: 'https://example.com/facebook' },
    { red: 'youtube', url: 'https://example.com/youtube' },
    { red: 'tiktok', url: 'https://example.com/tiktok' },
    { red: 'x', url: 'https://example.com/x' },
    { red: 'linkedin', url: 'https://example.com/linkedin' },
  ],
  mapaEmbedUrl: 'https://www.google.com/maps/embed?pb=EJEMPLO',
  mapaUrl: 'https://example.com/mapa',
  comoLlegar: {
    type: 'doc',
    content: [
      subtitulo(`${EJEMPLO}En colectivo`),
      parrafo(
        trozo(`${EJEMPLO}Las líneas de ejemplo paran a `),
        trozo('una cuadra del museo', NEGRITA),
        trozo('. Los fines de semana pasan cada 40 minutos.'),
      ),
      lista(
        'bulletList',
        parrafo(trozo(`${EJEMPLO}Línea 1, desde el centro`)),
        parrafo(trozo(`${EJEMPLO}Línea 2, desde la terminal de ómnibus`)),
        parrafo(trozo(`${EJEMPLO}Línea 3, `), trozo('solo de lunes a viernes', CURSIVA)),
      ),
      subtitulo(`${EJEMPLO}En auto`),
      parrafo(
        trozo(`${EJEMPLO}Hay estacionamiento en la calle. `),
        trozo('Ver el mapa', enlace('https://example.com/mapa')),
        { type: 'hardBreak' },
        trozo('Desde la ruta de ejemplo, tomar la avenida hacia el oeste.'),
      ),
    ],
  },
  normas: {
    type: 'doc',
    content: [
      lista(
        'orderedList',
        parrafo(trozo(`${EJEMPLO}No se pueden tocar las piezas de las vitrinas.`)),
        parrafo(trozo(`${EJEMPLO}Las fotos se sacan `), trozo('sin flash', NEGRITA, CURSIVA), trozo('.')),
        parrafo(
          trozo(`${EJEMPLO}Las escuelas reservan su visita por correo a `),
          trozo('museo@example.com', enlace('mailto:museo@example.com')),
          trozo(' o al '),
          trozo('+54 264 000-0000', enlace('tel:+542640000000')),
          trozo('.'),
        ),
      ),
    ],
  },
  accesibilidad: {
    type: 'doc',
    content: [
      parrafo(
        trozo(
          `${EJEMPLO}El edificio tiene rampa en la entrada principal, ascensor a la planta alta y un baño adaptado. ` +
            'Las salas tienen bancos para descansar durante el recorrido y la recepción presta una silla de ruedas.',
        ),
      ),
    ],
  },
  notaHorarios: `${EJEMPLO}Los feriados nacionales el museo abre en horario de domingo.`,
  notaTarifas: `${EJEMPLO}Los menores de 6 años, los jubilados y las escuelas con turno no pagan entrada.`,
  aviso: { texto: `${EJEMPLO}El museo cierra el lunes 12 de octubre por el feriado nacional.`, hasta: null },
  compra: { url: 'https://example.com/entradas', texto: 'Comprar entradas' },
  horarios: [1, 2, 3, 4, 5, 6, 7].map((dia) => ({
    dia,
    abierto: dia !== 1,
    franjas:
      dia === 1
        ? []
        : [
            { abre: '09:00', cierra: '13:00' },
            { abre: '17:00', cierra: '21:00' },
          ],
    nota: dia === 7 ? `${EJEMPLO}Visitas guiadas a las 11` : null,
  })),
  tarifas: [
    { id: 1, nombre: `${EJEMPLO}General`, gratuita: false, precio: 3000, condicion: null },
    {
      id: 2,
      nombre: `${EJEMPLO}Estudiantes y jubilados`,
      gratuita: false,
      precio: 1500,
      condicion: `${EJEMPLO}Con credencial`,
    },
    { id: 3, nombre: `${EJEMPLO}Menores de 6 años`, gratuita: true, precio: null, condicion: null },
  ],
})

// Una sola consulta. Sin datos de la persona: no lleva replacements. Las columnas, a mano (nunca m.*).
const CONSULTA = `
SELECT
  (SELECT row_to_json(m) FROM (
     SELECT direccion, localidad, provincia, codigo_postal AS "codigoPostal", telefono, email_publico AS "emailPublico",
            redes, mapa_embed_url AS "mapaEmbedUrl", mapa_url AS "mapaUrl", como_llegar AS "comoLlegar", normas,
            accesibilidad, md5(concat(coalesce(como_llegar::text, '-'), '|', coalesce(normas::text, '-'), '|',
              coalesce(accesibilidad::text, '-'))) AS "huellaTextos",
            nota_horarios AS "notaHorarios",
            nota_tarifas AS "notaTarifas", compra_activa AS "compraActiva", compra_url AS "compraUrl",
            compra_texto AS "compraTexto", aviso_texto AS "avisoTexto", aviso_hasta AS "avisoHasta"
     FROM museo WHERE id = 1) AS m) AS museo,
  (SELECT coalesce(json_agg(h ORDER BY h.dia), '[]') FROM (
     SELECT dia, abierto, franjas, nota FROM horario_semanal) AS h) AS horarios,
  (SELECT coalesce(json_agg(t ORDER BY t.orden, t.id), '[]') FROM (
     SELECT id, nombre, gratuita, precio, condicion, orden FROM tarifas WHERE visible) AS t) AS tarifas
`

const texto = (v) => (typeof v === 'string' && v.trim() !== '' ? v : null)
const esHora = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)

/** Los tres textos con formato, validados (textoRicoPublicable). */
export const textosPublicos = (m) => ({
  comoLlegar: textoRicoPublicable(m?.comoLlegar),
  normas: textoRicoPublicable(m?.normas),
  accesibilidad: textoRicoPublicable(m?.accesibilidad),
})

/**
 * El museo público a partir de lo que devolvió la base (también lo usan las pruebas).
 * @param {{ museo: object | null, horarios: object[], tarifas: object[] }} filas
 * @param {string} hoy  "AAAA-MM-DD" en San Juan
 * @param {ReturnType<typeof textosPublicos>} [textos]  los textos ya validados (leerMuseo, si no cambiaron)
 */
export function armarMuseoPublico({ museo, horarios, tarifas }, hoy, textos = textosPublicos(museo)) {
  const m = museo ?? {}
  const avisoTexto = texto(m.avisoTexto)
  const avisoHasta = texto(m.avisoHasta)
  return {
    direccion: texto(m.direccion),
    localidad: texto(m.localidad),
    provincia: texto(m.provincia),
    codigoPostal: texto(m.codigoPostal),
    telefono: texto(m.telefono),
    emailPublico: texto(m.emailPublico),
    redes: (Array.isArray(m.redes) ? m.redes : [])
      .filter((r) => r && Object.hasOwn(REDES, r.red) && esUrlHttps(r.url))
      .map(({ red, url }) => ({ red, url })),
    mapaEmbedUrl: esMapaEmbed(m.mapaEmbedUrl) ? m.mapaEmbedUrl : null,
    mapaUrl: esUrlHttps(m.mapaUrl) ? m.mapaUrl : null,
    comoLlegar: textos.comoLlegar,
    normas: textos.normas,
    accesibilidad: textos.accesibilidad,
    notaHorarios: texto(m.notaHorarios),
    notaTarifas: texto(m.notaTarifas),
    // Las fechas "AAAA-MM-DD" se comparan como texto.
    aviso: avisoTexto && (!avisoHasta || avisoHasta >= hoy) ? { texto: avisoTexto, hasta: avisoHasta } : null,
    compra: m.compraActiva && esUrlHttps(m.compraUrl) ? { url: m.compraUrl, texto: texto(m.compraTexto) } : null,
    horarios: (horarios ?? []).map((h) => {
      const franjas = (Array.isArray(h.franjas) ? h.franjas : [])
        .filter((f) => f && esHora(f.abre) && esHora(f.cierra))
        .map(({ abre, cierra }) => ({ abre, cierra }))
      return {
        dia: h.dia,
        abierto: Boolean(h.abierto) && franjas.length > 0,
        franjas: h.abierto ? franjas : [],
        nota: texto(h.nota),
      }
    }),
    tarifas: (tarifas ?? []).map((t) => ({
      id: t.id,
      nombre: t.nombre,
      gratuita: t.gratuita,
      precio: t.gratuita ? null : t.precio,
      condicion: texto(t.condicion),
    })),
  }
}

/**
 * Lee el museo público de la base.
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ hoy?: string }} [opciones]
 */
export async function leerMuseo(sequelize, { hoy = hoyEnSanJuan() } = {}) {
  const [filas] = await sequelize.query(CONSULTA, { type: QueryTypes.SELECT })
  const huella = filas.museo?.huellaTextos ?? null
  if (huella === null || huella !== ultimosTextos.huella) {
    ultimosTextos = { huella, textos: textosPublicos(filas.museo) }
    validacionesDeTextos += 1
  }
  return armarMuseoPublico(filas, hoy, ultimosTextos.textos)
}

// Los últimos textos validados, por el md5 de los tres (el mismo contenido da el mismo md5, en cualquier base).
let ultimosTextos = { huella: null, textos: null }
let validacionesDeTextos = 0
/** Cuántas veces leerMuseo validó los textos (las pruebas: con los mismos textos, no los vuelve a validar). */
export const vecesQueSeValidaronLosTextos = () => validacionesDeTextos

/** Cuánto espera una página al museo antes de salir con el último bueno (la base colgada no puede trabar la Home). */
export const TOPE_MUSEO_MS = 2_000

/**
 * museoPublico() para server/ssr.js: el museo de la base, el último bueno si la base falla o no contesta en
 * TOPE_MUSEO_MS (o el vacío si nunca respondió), el de ejemplo con SIN_BASE, o el vacío sin base.
 * @param {{ sinBase: false | 'maximo' | 'vacio' }} config
 * @param {{ sequelize?: import('sequelize').Sequelize | null, leer?: () => Promise<object>, tope?: number }} [opciones]
 *   leer: otra forma de leerlo (las pruebas); tope: los ms de espera
 */
export function crearMuseoPublico(config, { sequelize = null, leer, tope = TOPE_MUSEO_MS } = {}) {
  if (config.sinBase) {
    const fijo = config.sinBase === 'vacio' ? MUSEO_VACIO : MUSEO_MAXIMO
    return async () => fijo
  }
  const leerDeVerdad = leer ?? (sequelize ? () => leerMuseo(sequelize) : null)
  if (!leerDeVerdad) return async () => MUSEO_VACIO
  let ultimoMuseo = null
  return async function museoPublico() {
    let reloj
    const lectura = leerDeVerdad()
    // Si gana el tope, la consulta sigue y termina (o falla) sola más tarde: que no quede un rechazo sin atender. Si
    // termina bien, igual sirve como último bueno para el pedido siguiente.
    lectura.then(
      (museo) => {
        ultimoMuseo = museo
      },
      () => {},
    )
    const vencida = new Promise((_, rechazar) => {
      reloj = setTimeout(
        () => rechazar(Object.assign(new Error('La base no contestó a tiempo'), { code: 'TOPE' })),
        tope,
      )
    })
    try {
      return await Promise.race([lectura, vencida])
    } catch (err) {
      log('aviso', 'museo_sin_base', { mensaje: err.message, codigo: codigoDeError(err) })
      return ultimoMuseo ?? MUSEO_VACIO
    } finally {
      clearTimeout(reloj)
    }
  }
}
