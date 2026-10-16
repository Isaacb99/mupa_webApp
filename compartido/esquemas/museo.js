// Datos del museo (plan 3.2, 4.3 y 5.3): PUT /administracion/api/museo, desde las pantallas Datos del museo y
// Visitas (las notas de horarios y tarifas, el aviso general y la compra externa). Solo servidor y panel.
//
// El PUT es PARCIAL: cambia solo los campos que trae (cada pantalla manda los suyos, así una no pisa lo que guardó la
// otra) y tiene que traer al menos uno. Lo que no está en el esquema se descarta (z.object quita las claves de más): a
// Sequelize llega solo lo validado. Los tres textos con formato (comoLlegar, normas, accesibilidad) llegan con el
// editor en E3.2: hasta entonces este esquema no los tiene, así que el PUT no los cambia ni los borra.
// emailDestinoContacto está en el esquema, pero solo un admin lo puede mandar: la ruta da 403 a un editor que lo
// incluya, antes de validar (server/api/museo.js).
//
// Reglas que miran dos campos: con la compra externa activa hace falta su dirección, y "Mostrar hasta" necesita el
// texto del aviso. Como el PUT es parcial, se comprueban sobre cómo quedaría la fila (problemasDeMuseo): el servidor
// con la fila de la base y lo que llegó, el panel con lo que tiene en pantalla.
import {
  correoOpcional,
  esquemaEnMinusculas,
  esUrlHttps,
  fechaOpcional,
  MENSAJE_INVISIBLES,
  opcional,
  siNo,
  textoLinea,
  textoVariasLineas,
  tieneInvisibles,
  URL_MAX,
  urlHttps,
} from './campos.js'
import { z } from './zod.js'

/** Las redes que el sitio sabe mostrar (valor -> nombre visible). */
export const REDES = Object.freeze({
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X (Twitter)',
  threads: 'Threads',
  linkedin: 'LinkedIn',
})
export const REDES_MAX = 8

/** El "Insertar mapa" de Google Maps tiene que empezar así (también lo exige la tabla, museo_mapa_embed_google). */
export const PREFIJO_MAPA_EMBED = 'https://www.google.com/maps/embed?'

/**
 * Google Maps da el mapa para insertar como un <iframe src="…"> entero ("Copiar HTML"). Si se pegó eso, devuelve
 * solo la dirección del src (con los &amp; vueltos &); si no, el texto tal cual.
 * @param {unknown} texto
 */
export function srcDelMapa(texto) {
  if (typeof texto !== 'string' || !/<iframe\b/i.test(texto)) return texto
  const m = /\ssrc\s*=\s*(["'])(.*?)\1/is.exec(texto)
  return m ? m[2].replaceAll('&amp;', '&').trim() : texto
}

const MENSAJE_EMBED =
  'Pegá el código de "Insertar un mapa" de Google Maps (o solo su dirección, que empieza con ' +
  `${PREFIJO_MAPA_EMBED}).`

export const esMapaEmbed = (texto) => esUrlHttps(texto) && texto.startsWith(PREFIJO_MAPA_EMBED)

const mapaEmbed = opcional(
  z
    .string({ error: MENSAJE_EMBED })
    .trim()
    .overwrite(esquemaEnMinusculas)
    .max(URL_MAX, { error: 'El código del mapa es demasiado largo.' })
    .refine((v) => !tieneInvisibles(v), { error: MENSAJE_INVISIBLES })
    .refine(esMapaEmbed, { error: MENSAJE_EMBED }),
)

const red = z.object({
  red: z.enum(Object.keys(REDES), { error: 'Elegí la red.' }),
  url: urlHttps(),
})

/** Los campos del museo que se editan en el panel, con su largo de la tabla (plan 3.2). */
export const CAMPOS_MUSEO = Object.freeze({
  direccion: opcional(textoLinea(200)),
  localidad: opcional(textoLinea(100)),
  provincia: opcional(textoLinea(60)),
  codigoPostal: opcional(textoLinea(10)),
  telefono: opcional(textoLinea(40)),
  emailPublico: correoOpcional,
  emailDestinoContacto: correoOpcional,
  redes: z.array(red, { error: 'Las redes tienen que ser una lista.' }).max(REDES_MAX, {
    error: `Pueden ser hasta ${REDES_MAX} redes.`,
  }),
  mapaEmbedUrl: mapaEmbed,
  mapaUrl: opcional(urlHttps()),
  notaHorarios: opcional(textoVariasLineas(300)),
  notaTarifas: opcional(textoVariasLineas(300)),
  compraActiva: siNo('La compra externa'),
  compraUrl: opcional(urlHttps()),
  compraTexto: opcional(textoLinea(40)),
  avisoTexto: opcional(textoLinea(200)),
  avisoHasta: fechaOpcional,
})

/** Los nombres de los campos (en el orden de la tabla). */
export const NOMBRES_CAMPOS_MUSEO = Object.freeze(Object.keys(CAMPOS_MUSEO))

// El mapa entra antes de validar: así el código entero que da Google Maps sirve igual.
const conMapaLimpio = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) && 'mapaEmbedUrl' in v
    ? { ...v, mapaEmbedUrl: srcDelMapa(v.mapaEmbedUrl) }
    : v

// Qué campos mira cada regla de dos campos (y en cuál se muestra el problema).
const REGLAS = [
  {
    campo: 'compraUrl',
    mira: ['compraActiva', 'compraUrl'],
    falla: (f) => f.compraActiva && !f.compraUrl,
    mensaje: 'Para mostrar el botón de compra, pegá la dirección de la página donde se compran las entradas.',
  },
  {
    campo: 'avisoTexto',
    mira: ['avisoTexto', 'avisoHasta'],
    falla: (f) => f.avisoHasta && !f.avisoTexto,
    mensaje: 'Escribí el aviso, o borrá la fecha de "Mostrar hasta".',
  },
]

/**
 * Los problemas de dos campos sobre la fila como quedaría ({ campo: mensaje }, vacío si no hay).
 * @param {Record<string, unknown>} fila
 * @param {string[] | null} [tocados]  solo las reglas que miran alguno de estos campos (los que cambian); sin lista,
 *   todas
 */
export function problemasDeMuseo(fila, tocados = null) {
  const problemas = {}
  for (const regla of REGLAS) {
    if (tocados && !regla.mira.some((c) => tocados.includes(c))) continue
    if (regla.falla(fila)) problemas[regla.campo] = regla.mensaje
  }
  return problemas
}

/** PUT /museo: los campos que cambian (al menos uno). */
export const esquemaCambioMuseo = z.preprocess(
  conMapaLimpio,
  z
    .object(Object.fromEntries(Object.entries(CAMPOS_MUSEO).map(([campo, esquema]) => [campo, esquema.optional()])))
    .refine((v) => Object.keys(v).length > 0, { error: 'No hay nada para cambiar.' })
    // Lo que se puede comprobar con lo que llegó: las reglas cuyos dos campos vinieron (el servidor las vuelve a
    // mirar con la fila entera).
    .superRefine((v, ctx) => {
      for (const regla of REGLAS) {
        if (regla.mira.every((c) => c in v) && regla.falla(v)) {
          ctx.addIssue({ code: 'custom', path: [regla.campo], message: regla.mensaje })
        }
      }
    }),
)
