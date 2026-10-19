// Los textos con formato (plan 3.1 y 5.4): lo que guarda el editor del panel (EditorTexto, el JSON de TipTap:
// editor.getJSON()) en una columna jsonb. Hoy, los tres textos de Visitas (cómo llegar, normas y accesibilidad); desde
// E3.3 y E3.4, el cuerpo de las novedades y la descripción de las salas y las muestras. Solo servidor y panel: nunca
// en el bundle público (zod no entra ahí, plan 6.2; el sitio los dibuja con src/components/TextoRico.jsx).
//
// Lo que se admite es exactamente lo que el editor sabe hacer, con esta forma (la profundidad queda fija en cinco:
// documento > lista > elemento > párrafo > texto, así que no hace falta otro tope):
//   doc            -> bloques: paragraph | heading | bulletList | orderedList     (hasta BLOQUES_MAX)
//   paragraph      -> en línea: text | hardBreak
//   heading        -> attrs.level 2 (el único subtítulo), en línea
//   bulletList     -> listItem (al menos uno)
//   orderedList    -> attrs.start (opcional, desde 1), listItem (al menos uno)
//   listItem       -> paragraph (al menos uno: sin listas adentro de listas)
//   text           -> marcas: bold, italic, link (attrs.href: compartido/enlaces.js)
// Un nodo o una marca que no está en la lista (una imagen, el subrayado, una tabla) da 400; un enlace javascript:,
// relativo o de más de 500 caracteres, también. Las claves que no son de la lista (target y rel del enlace, el type de
// una lista numerada, cualquier otra) se descartan.
//
// Lo que sale es la forma CANÓNICA, para guardarla y para comparar (el panel sabe si hay cambios sin guardar
// comparando las dos canónicas: la base devuelve el jsonb con las claves en otro orden y el editor agrega un párrafo
// vacío al final):
// - Sin párrafos, subtítulos ni elementos de lista vacíos (solo espacios o saltos de línea: así queda lo que se pega
//   de Word, que separa con párrafos de un &nbsp;), sin listas vacías y sin saltos de línea al principio o al final de
//   un párrafo.
// - Los textos seguidos con las mismas marcas, juntos; las marcas en un orden fijo y sin repetir; el tabulador y los
//   saltos de línea dentro de un texto pasan a espacio y los demás caracteres de control se quitan (Postgres no
//   guarda el NUL en un jsonb). Un surrogate suelto da 400 (no es texto).
// - La lista numerada lleva start solo si no empieza en 1.
// - Un documento vacío (o que queda vacío) es null: el sitio no dibuja la sección.
// El total: hasta BLOQUES_MAX párrafos, subtítulos o elementos de lista, CARACTERES_MAX caracteres de texto y BYTES_MAX
// bytes de la forma canónica en JSON (corrección de E3, 16/10/2026: con mucho formato, 20.000 caracteres pueden ser más
// de 100 kB de JSON, y el pedido daba el 413 genérico en vez de un error en el campo). Los pedidos que llevan textos con
// formato admiten 300 kB (server/api/indice.js, limiteJson): entran los tres de Visitas juntos, cada uno en su tope, EN
// SU FORMA CANÓNICA. Ojo: el panel manda el JSON del editor (con target, rel, class y title en cada enlace), que con
// cientos de enlaces pesa más; tres textos así, cambiados a la vez, pueden pasar los 300 kB (hallazgo COD-09 de la
// verificación de E3, pendiente: que el panel mande la forma canónica que ya calcula).
// El error es uno solo y va en el campo (no en "comoLlegar.content.3.content.0…"), con un mensaje para la persona.
import { ENLACE_MAX, completarEnlace, esEnlacePermitido, MENSAJE_ENLACE } from '../enlaces.js'
import { z } from './zod.js'

/** Párrafos, subtítulos y elementos de lista, como mucho. */
export const BLOQUES_MAX = 300
/** Caracteres de texto, como mucho (sumando todos los textos del documento). */
export const CARACTERES_MAX = 20_000
/**
 * Bytes de la forma canónica en JSON (UTF-8), como mucho: 20.000 caracteres sin formato son unos 22 kB; el resto es
 * lugar para negritas, cursivas, listas y enlaces. Tres textos en su tope, en la forma canónica, entran en un pedido de
 * 300 kB (ver arriba: el panel todavía manda el JSON del editor).
 */
export const BYTES_MAX = 90_000
// Topes por arreglo, antes de sacar los vacíos, para no recorrer de más lo que no puede entrar (el cuerpo del pedido
// ya está limitado a 300 kB). Son más que BLOQUES_MAX a propósito: lo que se pega de Word trae muchos párrafos vacíos,
// que no cuentan.
const CRUDOS_MAX = 2_000
const EN_LINEA_MAX = 5_000

export const MENSAJE_FORMATO =
  'Tiene un formato que no se puede guardar: solo negrita, cursiva, subtítulos, listas y enlaces.'
const MENSAJE_BLOQUES = `Puede tener hasta ${BLOQUES_MAX.toLocaleString('es-AR')} párrafos, subtítulos o elementos de lista.`
const MENSAJE_ILEGIBLE = 'Tiene caracteres que no se pudieron leer. Escribilo de nuevo.'

const ESQUEMA_ENLACE = /^(https?:\/\/|mailto:|tel:)/i

const enlace = z
  .string({ error: MENSAJE_ENLACE })
  .max(ENLACE_MAX, { error: MENSAJE_ENLACE })
  // El esquema en minúsculas ("HTTPS://"), como las direcciones de los demás campos.
  .overwrite((href) => href.replace(ESQUEMA_ENLACE, (esquema) => esquema.toLowerCase()))
  .refine(esEnlacePermitido, { error: MENSAJE_ENLACE })

const marca = z.discriminatedUnion(
  'type',
  [
    z.object({ type: z.literal('bold') }),
    z.object({ type: z.literal('italic') }),
    z.object({ type: z.literal('link'), attrs: z.object({ href: enlace }, { error: MENSAJE_ENLACE }) }),
  ],
  { error: MENSAJE_FORMATO },
)

const texto = z.object({
  type: z.literal('text'),
  text: z
    .string({ error: MENSAJE_FORMATO })
    // Un tope generoso para un solo texto: el de CARACTERES_MAX, con cuántos tiene, lo mira el total (más abajo).
    .max(CARACTERES_MAX * 5, { error: `Puede tener hasta ${CARACTERES_MAX.toLocaleString('es-AR')} caracteres.` })
    .refine((t) => !/\p{Cs}/u.test(t), { error: MENSAJE_ILEGIBLE }),
  marks: z.array(marca, { error: MENSAJE_FORMATO }).max(10, { error: MENSAJE_FORMATO }).optional(),
})

const enLinea = z
  .array(
    z.discriminatedUnion('type', [texto, z.object({ type: z.literal('hardBreak') })], { error: MENSAJE_FORMATO }),
    { error: MENSAJE_FORMATO },
  )
  .max(EN_LINEA_MAX, { error: MENSAJE_FORMATO })
  .optional()

const parrafo = z.object({ type: z.literal('paragraph'), content: enLinea })

const subtitulo = z.object({
  type: z.literal('heading'),
  attrs: z.object({ level: z.literal(2, { error: 'Hay un solo nivel de subtítulo.' }) }, { error: MENSAJE_FORMATO }),
  content: enLinea,
})

const elemento = z.object({
  type: z.literal('listItem'),
  content: z
    .array(z.discriminatedUnion('type', [parrafo], { error: MENSAJE_FORMATO }), { error: MENSAJE_FORMATO })
    .min(1, { error: MENSAJE_FORMATO })
    .max(CRUDOS_MAX, { error: MENSAJE_BLOQUES }),
})
const elementos = z
  .array(z.discriminatedUnion('type', [elemento], { error: MENSAJE_FORMATO }), { error: MENSAJE_FORMATO })
  .min(1, { error: MENSAJE_FORMATO })
  .max(CRUDOS_MAX, { error: MENSAJE_BLOQUES })

const lista = z.object({ type: z.literal('bulletList'), content: elementos })
const listaNumerada = z.object({
  type: z.literal('orderedList'),
  attrs: z
    .object({ start: z.number({ error: MENSAJE_FORMATO }).int().min(1).max(100_000).nullish() }, { error: MENSAJE_FORMATO })
    .optional(),
  content: elementos,
})

const documento = z.object(
  {
    type: z.literal('doc', { error: MENSAJE_FORMATO }),
    content: z
      .array(z.discriminatedUnion('type', [parrafo, subtitulo, lista, listaNumerada], { error: MENSAJE_FORMATO }), {
        error: MENSAJE_FORMATO,
      })
      .max(CRUDOS_MAX, { error: MENSAJE_BLOQUES })
      .optional(),
  },
  { error: MENSAJE_FORMATO },
)

// --- La forma canónica ---------------------------------------------------------------------------------------------

const ORDEN_MARCAS = ['link', 'bold', 'italic']

/** Tabulador y saltos de línea a espacio; los demás de control, fuera. */
const textoLimpio = (t) => t.replace(/[\t\n\v\f\r\u2028\u2029]/g, ' ').replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

function marcasCanonicas(marks = []) {
  const porTipo = new Map()
  for (const m of marks) if (!porTipo.has(m.type)) porTipo.set(m.type, m)
  return ORDEN_MARCAS.filter((t) => porTipo.has(t)).map((t) =>
    t === 'link' ? { type: 'link', attrs: { href: porTipo.get(t).attrs.href } } : { type: t },
  )
}

/** El contenido en línea canónico ([] si no tiene ningún texto que no sea espacio). */
function enLineaCanonica(content = []) {
  const salida = []
  for (const nodo of content) {
    if (nodo.type === 'hardBreak') {
      salida.push({ type: 'hardBreak' })
      continue
    }
    const text = textoLimpio(nodo.text)
    if (!text) continue
    const marks = marcasCanonicas(nodo.marks)
    const anterior = salida.at(-1)
    if (anterior?.type === 'text' && JSON.stringify(anterior.marks ?? []) === JSON.stringify(marks)) {
      anterior.text += text
      continue
    }
    salida.push(marks.length ? { type: 'text', text, marks } : { type: 'text', text })
  }
  while (salida[0]?.type === 'hardBreak') salida.shift()
  while (salida.at(-1)?.type === 'hardBreak') salida.pop()
  return salida.some((n) => n.type === 'text' && n.text.trim() !== '') ? salida : []
}

function parrafosCanonicos(parrafos) {
  return parrafos
    .map((p) => ({ type: 'paragraph', content: enLineaCanonica(p.content) }))
    .filter((p) => p.content.length > 0)
}

function listaCanonica(nodo) {
  const content = nodo.content
    .map((item) => ({ type: 'listItem', content: parrafosCanonicos(item.content) }))
    .filter((item) => item.content.length > 0)
  if (!content.length) return null
  if (nodo.type === 'bulletList') return { type: 'bulletList', content }
  const start = nodo.attrs?.start ?? 1
  return start > 1 ? { type: 'orderedList', attrs: { start }, content } : { type: 'orderedList', content }
}

function bloqueCanonico(nodo) {
  if (nodo.type === 'paragraph' || nodo.type === 'heading') {
    const content = enLineaCanonica(nodo.content)
    if (!content.length) return null
    return nodo.type === 'heading' ? { type: 'heading', attrs: { level: 2 }, content } : { type: 'paragraph', content }
  }
  return listaCanonica(nodo)
}

/**
 * Los párrafos, subtítulos y elementos de lista, y los caracteres de texto (en code points) de un documento. Mide
 * también lo que todavía no pasó el esquema (el panel cuenta los caracteres mientras se escribe): lo que no entiende
 * no lo cuenta.
 * @param {unknown} doc
 */
export function medirDocumento(doc) {
  let bloques = 0
  let caracteres = 0
  const lista = (v) => (Array.isArray(v) ? v : [])
  const contarEnLinea = (content) => {
    bloques += 1
    for (const n of lista(content)) if (n?.type === 'text' && typeof n.text === 'string') caracteres += [...n.text].length
  }
  for (const b of lista(doc?.content)) {
    if (b?.type === 'paragraph' || b?.type === 'heading') contarEnLinea(b.content)
    else for (const item of lista(b?.content)) for (const p of lista(item?.content)) contarEnLinea(p?.content)
  }
  return { bloques, caracteres }
}

/** Los bytes del JSON de un documento (UTF-8): lo que ocupa en el pedido. */
export const bytesDe = (doc) => new TextEncoder().encode(JSON.stringify(doc)).length

const kb = (bytes) => Math.ceil(bytes / 1000).toLocaleString('es-AR')
const mensajeBytes = (bytes) =>
  `Tiene demasiado formato para guardarse (negritas, cursivas, listas o enlaces): ocupa ${kb(bytes)} kB y el ` +
  `máximo es ${kb(BYTES_MAX)} kB. Sacá formato o enlaces que no hagan falta, o acortalo.`

const canonico = documento.transform((doc, ctx) => {
  const content = (doc.content ?? []).map(bloqueCanonico).filter(Boolean)
  if (!content.length) return null
  const salida = { type: 'doc', content }
  const { bloques, caracteres } = medirDocumento(salida)
  if (bloques > BLOQUES_MAX) {
    ctx.addIssue({ code: 'custom', message: `${MENSAJE_BLOQUES} Tiene ${bloques.toLocaleString('es-AR')}.` })
    return z.NEVER
  }
  if (caracteres > CARACTERES_MAX) {
    ctx.addIssue({
      code: 'custom',
      message:
        `Puede tener hasta ${CARACTERES_MAX.toLocaleString('es-AR')} caracteres: tiene ` +
        `${caracteres.toLocaleString('es-AR')}.`,
    })
    return z.NEVER
  }
  const bytes = bytesDe(salida)
  if (bytes > BYTES_MAX) {
    ctx.addIssue({ code: 'custom', message: mensajeBytes(bytes) })
    return z.NEVER
  }
  return salida
})

/**
 * Un texto con formato para guardar: null (o un documento vacío) pasa a null; si no, la forma canónica. Un solo error
 * por campo, con el mensaje del primer problema.
 */
export const textoRico = z.unknown().transform((valor, ctx) => {
  if (valor == null) return null
  const r = canonico.safeParse(valor)
  if (r.success) return r.data
  ctx.addIssue({ code: 'custom', message: r.error.issues[0]?.message ?? MENSAJE_FORMATO })
  return z.NEVER
})

/**
 * Lo que guardó la base, para publicar: la forma canónica, o null si no es válido (alguien lo escribió a mano). Lo usa
 * el museo público (server/museo.js): lo que el panel no deja guardar tampoco sale.
 * @param {unknown} valor
 */
export function textoRicoPublicable(valor) {
  const r = textoRico.safeParse(valor)
  return r.success ? r.data : null
}

/**
 * Lo que da el editor, con las direcciones de los enlaces completas (compartido/enlaces.js: "www.museo.gob.ar" ->
 * https://…, un correo -> mailto:) y sin los enlaces que no sirven (el texto queda). Lo usa el panel antes de validar y
 * de mandar: el editor deja pegar <a href="www.…">, la API exige la dirección completa. No valida nada más.
 * @param {unknown} doc
 */
export function completarEnlaces(doc) {
  const recorrer = (nodo) => {
    if (!nodo || typeof nodo !== 'object' || Array.isArray(nodo)) return nodo
    const copia = { ...nodo }
    if (Array.isArray(nodo.content)) copia.content = nodo.content.map(recorrer)
    if (Array.isArray(nodo.marks)) {
      copia.marks = nodo.marks.flatMap((m) => {
        if (m?.type !== 'link') return [m]
        const href = completarEnlace(m.attrs?.href)
        return esEnlacePermitido(href) ? [{ ...m, attrs: { ...m.attrs, href } }] : []
      })
    }
    return copia
  }
  return recorrer(doc)
}
