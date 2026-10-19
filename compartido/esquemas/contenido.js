// Los contenidos (plan 3.2, 4.3 y 5.3; E3.3 y E3.4): novedades, muestras y salas. Solo servidor y panel (el panel
// valida con el mismo esquema antes de mandar). Lo que no es zod (la dirección web, la página pública) está en
// compartido/contenidos.js; los estados calculados, en compartido/estados.js.
//
// Por tipo hay dos esquemas y una regla:
// - El alta (POST /novedades, /muestras, /salas): crea un BORRADOR y solo exige el título (el nombre, en una sala); el
//   tipo de una novedad o una muestra es opcional (noticia y temporal). La dirección web sale del título (el servidor).
// - El cambio (PUT /:tipo/:id): el esquema COMPLETO, sin valores por defecto (como el de una tarifa): un campo que
//   falta da 400, así un cambio nunca borra algo sin querer. Lo opcional va en null. Para un borrador alcanza con el
//   título; lo demás puede estar vacío.
// - Para publicar (problemasParaPublicar): lo marcado con * en el plan 5.3. Lo revisa el servidor al publicar y al
//   guardar algo ya publicado (sobre el contenido como quedaría), y el panel antes de mandar. La portada además no
//   puede ser decorativa: eso lo sabe el servidor (la foto está en la base) y el panel (la tiene en la mano).
// Lo que no corresponde al tipo se guarda vacío: una noticia no tiene fecha, lugar, costo ni inscripción (son de una
// actividad), y una muestra permanente no tiene fechas.
// Las fechas: las de una muestra son días ("AAAA-MM-DD"); las de una actividad, día y hora de San Juan
// ("AAAA-MM-DDTHH:MM", lo que da un <input type="datetime-local">; el servidor las guarda como instantes).
// Los textos con formato (el cuerpo de una novedad, la descripción de una muestra o una sala) pasan por
// compartido/esquemas/textoRico.js: se guardan en su forma canónica.
import { PATRON_SLUG, SLUG_MAX } from '../contenidos.js'
import { fechaHoraOpcional, fechaOpcional, opcional, textoLinea, urlHttps } from './campos.js'
import { textoRico } from './textoRico.js'
import { z } from './zod.js'

export const TITULO_MAX = 160
export const NOMBRE_SALA_MAX = 120
export const RESUMEN_MAX = 200
export const LUGAR_MAX = 160
export const COSTO_MAX = 80
/** Fotos de una galería, como mucho (el tope de panel/src/componentes/Galeria.jsx). */
export const GALERIA_MAX = 40
/** Salas o muestras, como mucho (el orden es un smallint; alcanza de sobra). */
export const ORDEN_MAX = 1000
/** Los listados: de a cuántos por página, por defecto y como mucho (plan 4.1). */
export const POR_PAGINA = 20
export const POR_PAGINA_MAX = 100
export const BUSQUEDA_MAX = 100

export const TIPOS_NOVEDAD = Object.freeze(['noticia', 'actividad'])
export const TIPOS_MUESTRA = Object.freeze(['temporal', 'permanente'])
export const ESTADOS_CONTENIDO = Object.freeze(['borrador', 'publicado'])

export const MENSAJE_SLUG =
  'Usá solo letras minúsculas sin acentos, números y guiones, por ejemplo «noche-de-los-museos».'
export const PORTADA_DECORATIVA =
  'La portada no puede ser una foto decorativa: describí lo que se ve (sale en las tarjetas, en Google y al compartir).'

const ID_MAX = 2_147_483_647
const id = (mensaje) =>
  z.number({ error: mensaje }).int({ error: mensaje }).min(1, { error: mensaje }).max(ID_MAX, { error: mensaje })

const titulo = textoLinea(TITULO_MAX, {
  falta: 'Escribí el título.',
  largo: `El título puede tener hasta ${TITULO_MAX} caracteres.`,
})
const nombreSala = textoLinea(NOMBRE_SALA_MAX, {
  falta: 'Escribí el nombre de la sala.',
  largo: `El nombre puede tener hasta ${NOMBRE_SALA_MAX} caracteres.`,
})
const resumen = opcional(textoLinea(RESUMEN_MAX, { largo: `El resumen puede tener hasta ${RESUMEN_MAX} caracteres.` }))
const portadaId = id('La portada no es válida.').nullable()
/**
 * Opcional en el PUT: la portada que tenía la ficha cuando se abrió (la manda el panel). Con ella el servidor no pisa
 * ni borra una portada que otra persona puso mientras tanto (server/api/contenido.js). No se guarda.
 */
const portadaAntes = id('La portada no es válida.').nullable().optional()
/** Vacía (o null): el servidor la arma con el título (en un borrador) o deja la que tenía (si ya se publicó). */
const slug = (tipo) =>
  opcional(
    z
      .string({ error: MENSAJE_SLUG })
      .trim()
      .max(SLUG_MAX[tipo], { error: `La dirección puede tener hasta ${SLUG_MAX[tipo]} caracteres.` })
      .regex(PATRON_SLUG, { error: MENSAJE_SLUG }),
  )

// --- Novedades ---

const tipoNovedad = z.enum(TIPOS_NOVEDAD, { error: 'Elegí si es una noticia o una actividad.' })

/** POST /novedades: el borrador, con su título (y el tipo, noticia si no viene). */
export const esquemaAltaNovedad = z.object({ tipo: tipoNovedad.default('noticia'), titulo })

/** PUT /novedades/:id: la novedad completa. */
export const esquemaNovedad = z
  .object({
    tipo: tipoNovedad,
    titulo,
    slug: slug('novedades'),
    resumen,
    cuerpo: textoRico,
    portadaId,
    portadaAntes,
    eventoInicio: fechaHoraOpcional,
    eventoFin: fechaHoraOpcional,
    lugar: opcional(textoLinea(LUGAR_MAX, { largo: `El lugar puede tener hasta ${LUGAR_MAX} caracteres.` })),
    costo: opcional(textoLinea(COSTO_MAX, { largo: `El costo puede tener hasta ${COSTO_MAX} caracteres.` })),
    enlaceInscripcion: opcional(urlHttps()),
  })
  .superRefine((n, ctx) => {
    if (n.tipo !== 'actividad') return
    if (n.eventoFin && !n.eventoInicio) {
      ctx.addIssue({ code: 'custom', path: ['eventoInicio'], message: 'Poné también cuándo empieza.' })
    } else if (n.eventoFin && n.eventoFin < n.eventoInicio) {
      ctx.addIssue({ code: 'custom', path: ['eventoFin'], message: 'El fin no puede ser antes del inicio.' })
    }
  })
  // Lo que es solo de una actividad, vacío en una noticia.
  .transform((n) =>
    n.tipo === 'actividad'
      ? n
      : { ...n, eventoInicio: null, eventoFin: null, lugar: null, costo: null, enlaceInscripcion: null },
  )

// --- Muestras ---

const tipoMuestra = z.enum(TIPOS_MUESTRA, { error: 'Elegí si la muestra es temporal o permanente.' })

/** POST /muestras: el borrador, con su título (y el tipo, temporal si no viene). */
export const esquemaAltaMuestra = z.object({ tipo: tipoMuestra.default('temporal'), titulo })

/** PUT /muestras/:id: la muestra completa. */
export const esquemaMuestra = z
  .object({
    tipo: tipoMuestra,
    titulo,
    slug: slug('muestras'),
    resumen,
    descripcion: textoRico,
    portadaId,
    portadaAntes,
    fechaInicio: fechaOpcional,
    fechaFin: fechaOpcional,
    salaId: id('La sala no es válida.').nullable(),
  })
  .superRefine((m, ctx) => {
    if (m.tipo === 'temporal' && m.fechaInicio && m.fechaFin && m.fechaFin < m.fechaInicio) {
      ctx.addIssue({ code: 'custom', path: ['fechaFin'], message: 'La fecha de fin no puede ser antes de la de inicio.' })
    }
  })
  // Las fechas son de una temporal.
  .transform((m) => (m.tipo === 'temporal' ? m : { ...m, fechaInicio: null, fechaFin: null }))

// --- Salas ---

/** POST /salas: el borrador, con su nombre. */
export const esquemaAltaSala = z.object({ nombre: nombreSala })

/** PUT /salas/:id: la sala completa (plano_ref queda fuera hasta el módulo 4, plan 3.5). */
export const esquemaSala = z.object({
  nombre: nombreSala,
  slug: slug('salas'),
  resumen,
  descripcion: textoRico,
  portadaId,
  portadaAntes,
})

// --- Galería, orden y listados ---

const unaVez = (lista) => new Set(lista).size === lista.length

const fotosDeGaleria = z
  .array(id('Las fotos de la galería no son válidas.'), { error: 'Faltan las fotos de la galería.' })
  .max(GALERIA_MAX, { error: `La galería puede tener hasta ${GALERIA_MAX} fotos.` })
  .refine(unaVez, { error: 'Una foto aparece dos veces en la galería.' })

/**
 * PUT /muestras/:id/galeria y /novedades/:id/galeria: las fotos en el orden en que se muestran. antes (opcional, lo
 * manda el panel): las que tenía la galería cuando se abrió la ficha; si otra persona la cambió mientras tanto, 409 en
 * vez de borrar lo que esa persona agregó (server/api/contenido.js).
 */
export const esquemaGaleria = z.object({
  fotos: fotosDeGaleria,
  antes: fotosDeGaleria.optional(),
})

/** PUT /salas/orden y /muestras/orden: { ids }, todas en el orden nuevo, cada una una vez (como las tarifas). */
export const esquemaOrden = z.object({
  ids: z
    .array(id('Los ids tienen que ser números.'), { error: 'Falta el orden nuevo.' })
    .min(1, { error: 'Falta el orden nuevo.' })
    .max(ORDEN_MAX, { error: 'Son demasiadas.' })
    .refine(unaVez, { error: 'Una aparece dos veces.' }),
})

const sinNada = (v) => (v === '' ? undefined : v)
const CONTROL = /[\p{Cc}\p{Cs}]/u

/**
 * El listado (GET /novedades, /muestras, /salas): ?estado=&tipo=&q=&pagina=&por=. Vacíos = sin filtro.
 * @param {readonly string[] | null} tipos  los valores del filtro por tipo (null: el contenido no tiene tipo)
 */
export function esquemaListado(tipos = null) {
  const forma = {
    estado: z.preprocess(sinNada, z.enum(ESTADOS_CONTENIDO, { error: 'El estado no es válido.' }).optional()),
    q: z.preprocess(
      sinNada,
      z
        .string({ error: 'La búsqueda no es válida.' })
        .trim()
        .max(BUSQUEDA_MAX, { error: `La búsqueda puede tener hasta ${BUSQUEDA_MAX} caracteres.` })
        .refine((v) => !CONTROL.test(v), { error: 'La búsqueda tiene caracteres que no se pueden buscar.' })
        .transform((v) => v || undefined)
        .optional(),
    ),
    pagina: z.preprocess(
      sinNada,
      z.coerce
        .number({ error: 'La página no es válida.' })
        .int({ error: 'La página no es válida.' })
        .min(1, { error: 'La página no es válida.' })
        .max(100_000, { error: 'La página no es válida.' })
        .default(1),
    ),
    por: z.preprocess(
      sinNada,
      z.coerce
        .number({ error: 'La cantidad por página no es válida.' })
        .int()
        .min(1, { error: 'La cantidad por página no es válida.' })
        .max(POR_PAGINA_MAX, { error: `Se pueden pedir hasta ${POR_PAGINA_MAX} por página.` })
        .default(POR_PAGINA),
    ),
  }
  if (tipos) forma.tipo = z.preprocess(sinNada, z.enum(tipos, { error: 'El tipo no es válido.' }).optional())
  return z.object(forma)
}

// --- Para publicar ---

const FALTAN = {
  novedades: [
    ['resumen', 'Escribí el resumen: aparece en Google y en las tarjetas.'],
    ['portadaId', 'Elegí la portada.'],
    ['cuerpo', 'Escribí el texto de la novedad.'],
  ],
  muestras: [
    ['resumen', 'Escribí el resumen: aparece en Google y en las tarjetas.'],
    ['portadaId', 'Elegí la portada.'],
    ['descripcion', 'Escribí la descripción de la muestra.'],
  ],
  salas: [
    ['resumen', 'Escribí el resumen: aparece en Google y en las tarjetas.'],
    ['portadaId', 'Elegí la portada.'],
  ],
}

/**
 * Lo que falta para publicar (lo marcado con * en el plan 5.3), sobre un contenido que ya pasó su esquema:
 * { campo: mensaje }, vacío si no falta nada. El título ya lo exige el esquema. La portada decorativa la mira quien
 * tiene la foto (PORTADA_DECORATIVA).
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 * @param {Record<string, unknown>} datos
 */
export function problemasParaPublicar(tipo, datos) {
  const problemas = {}
  for (const [campo, mensaje] of FALTAN[tipo]) if (datos[campo] == null || datos[campo] === '') problemas[campo] = mensaje
  if (tipo === 'novedades' && datos.tipo === 'actividad' && !datos.eventoInicio) {
    problemas.eventoInicio = 'Poné cuándo empieza la actividad.'
  }
  if (tipo === 'muestras' && datos.tipo === 'temporal' && !datos.fechaInicio) {
    problemas.fechaInicio = 'Poné desde cuándo se puede ver la muestra (una temporal necesita la fecha de inicio).'
  }
  return problemas
}

/** Los esquemas de cada tipo, para quien los elige por el nombre (el servidor y las fichas del panel). */
export const ESQUEMAS_CONTENIDO = Object.freeze({
  novedades: Object.freeze({ alta: esquemaAltaNovedad, cambio: esquemaNovedad, tipos: TIPOS_NOVEDAD }),
  muestras: Object.freeze({ alta: esquemaAltaMuestra, cambio: esquemaMuestra, tipos: TIPOS_MUESTRA }),
  salas: Object.freeze({ alta: esquemaAltaSala, cambio: esquemaSala, tipos: null }),
})
