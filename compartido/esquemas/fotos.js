// Los datos de una foto (plan 3.2, 4.3 y 5.5): POST /administracion/api/fotos (multipart, junto con el archivo) y
// PATCH /fotos/:id. Solo servidor y panel (el panel valida con el mismo esquema antes de mandar).
// - alt: el texto alternativo, una línea de hasta 250 caracteres. Obligatorio salvo que la foto sea decorativa; en
//   una decorativa se guarda vacío (el sitio la dibuja con alt="").
// - decorativa: sí o no. La portada no la admite (esquemaDatosPortada; las fichas lo vuelven a revisar al publicar,
//   E3.3 y E3.4).
// - epigrafe (hasta 300) y credito (hasta 120): opcionales, de una línea. Vacíos se guardan en null.
import { opcional, siNo, textoLinea } from './campos.js'
import { z } from './zod.js'

export const ALT_MAX = 250
export const EPIGRAFE_MAX = 300
export const CREDITO_MAX = 120

export const FALTA_ALT = 'Describí lo que se ve en la foto, o marcala como decorativa.'
export const FALTA_ALT_PORTADA = 'Describí lo que se ve en la foto: la portada siempre lleva descripción.'

const alt = opcional(
  textoLinea(ALT_MAX, { falta: FALTA_ALT, largo: `La descripción puede tener hasta ${ALT_MAX} caracteres.` }),
)
const decorativa = siNo('Decorativa')
const epigrafe = opcional(textoLinea(EPIGRAFE_MAX, { largo: `El epígrafe puede tener hasta ${EPIGRAFE_MAX} caracteres.` }))
const credito = opcional(textoLinea(CREDITO_MAX, { largo: `El crédito puede tener hasta ${CREDITO_MAX} caracteres.` }))

/**
 * La regla que mira dos campos (sobre la foto como quedaría): sin descripción, solo si es decorativa. Devuelve los
 * datos con alt '' si no hay (en una decorativa, siempre '').
 */
function conRegla(objeto, faltaAlt = FALTA_ALT) {
  return objeto
    .superRefine((f, ctx) => {
      if (!f.decorativa && !f.alt) ctx.addIssue({ code: 'custom', path: ['alt'], message: faltaAlt })
    })
    .transform((f) => ({ ...f, alt: f.decorativa ? '' : (f.alt ?? '') }))
}

/** Todos los datos de una foto: lo que no viene toma su valor por defecto (no decorativa, sin epígrafe ni crédito). */
export const esquemaDatosFoto = conRegla(
  z.object({
    alt: alt.default(null),
    decorativa: decorativa.default(false),
    epigrafe: epigrafe.default(null),
    credito: credito.default(null),
  }),
)

/** Los de una portada: nunca decorativa (plan 5.3). */
export const esquemaDatosPortada = conRegla(
  z.object({
    alt: alt.default(null),
    decorativa: z.literal(false, { error: 'La portada no puede ser una foto decorativa.' }).default(false),
    epigrafe: epigrafe.default(null),
    credito: credito.default(null),
  }),
  FALTA_ALT_PORTADA,
)

// En un formulario multipart todo llega como texto: "true" y "false" pasan a sí y no (lo demás queda como vino y el
// esquema lo rechaza). El cuerpo que arma multer no tiene prototipo: se copia a un objeto común.
function desdeFormulario(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) return cuerpo
  const copia = { ...cuerpo }
  if (copia.decorativa === 'true') copia.decorativa = true
  else if (copia.decorativa === 'false') copia.decorativa = false
  return copia
}

/** POST /fotos: los campos del formulario multipart (el archivo va aparte, en "foto"). */
export const esquemaSubidaFoto = z.preprocess(desdeFormulario, esquemaDatosFoto)

/**
 * PATCH /fotos/:id: solo lo que cambia (al menos un dato). La regla de alt y decorativa la revisa la ruta sobre la
 * foto como quedaría, con la fila bloqueada (como PUT /museo).
 */
export const esquemaCambioFoto = z
  .object({
    alt: alt.optional(),
    decorativa: decorativa.optional(),
    epigrafe: epigrafe.optional(),
    credito: credito.optional(),
  })
  .refine((cambios) => Object.values(cambios).some((v) => v !== undefined), {
    error: 'No hay nada para cambiar en la foto.',
  })
