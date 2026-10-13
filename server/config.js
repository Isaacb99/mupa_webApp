// Configuración del servicio (plan 2.5), leída de las variables de entorno y validada con zod al arrancar: si falta o
// está mal algo, el proceso no arranca y dice qué (nunca el valor: puede ser una contraseña).
// En desarrollo todo tiene un valor por defecto razonable salvo la base, que es opcional: sin DATABASE_URL (o con
// SIN_BASE) la Home se sirve igual y /salud/base responde 503. En producción son obligatorias URL_PUBLICA y la base.
// Las variables del correo (SMTP_*) llegan con el formulario de contacto (E4.5); por ahora solo CORREO_MODO.
// Las de las fotos (DIR_FOTOS) llegan con E3.1.
import { z } from 'zod'

// 0/1 como en Render; vacía cuenta como no definida (ver sinVacias).
const bandera = z
  .enum(['0', '1'], { error: 'tiene que ser 0 o 1' })
  .default('0')
  .transform((v) => v === '1')

const urlBase = z
  .string()
  .refine((v) => /^postgres(ql)?:\/\//.test(v) && URL.canParse(v), { error: 'tiene que ser una URL postgres://…' })

// Cualquier URL http(s); RENDER_EXTERNAL_URL llega sin la barra final (https://mupa-web.onrender.com).
const esUrlWeb = (v) => URL.canParse(v) && /^https?:$/.test(new URL(v).protocol)
const urlWeb = z.string().refine(esUrlWeb, { error: 'tiene que ser una URL http:// o https://' })

// URL_PUBLICA: solo el origen, con la barra final (sin usuario ni contraseña: iría tal cual al canonical y al 301).
const urlSitio = z.string().refine(
  (v) => {
    if (!esUrlWeb(v)) return false
    const u = new URL(v)
    return u.pathname === '/' && !u.search && !u.hash && !u.username && !u.password && v.endsWith('/')
  },
  { error: 'tiene que ser una URL http(s) con solo el origen y la barra final, p. ej. https://mupa.ar/' },
)

const esquema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5300),
  // Dónde escucha. Render exige 0.0.0.0 (y define RENDER); en esta PC, solo la interfaz local (escuchar en todas
  // haría que Windows pida permiso en el firewall).
  HOST: z.string().min(1).optional(),
  RENDER: z.string().optional(),
  DATABASE_URL: urlBase.optional(),
  DATABASE_URL_TEST: urlBase.optional(),
  DB_SSL: bandera,
  URL_PUBLICA: urlSitio.optional(),
  CANONICO: bandera,
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  CORREO_MODO: z.enum(['smtp', 'consola', 'memoria']).optional(),
  // Sin base (plan 2.5 y 6.7): la Home con un museo de ejemplo. 1 o "maximo": todos los campos llenos; "vacio": nada.
  SIN_BASE: z.enum(['0', '1', 'maximo', 'vacio']).default('0'),
  DIR_BUILD: z.string().min(1).default('dist'),
  DEPURAR_IP: bandera,
  USERWAY_ID: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,64}$/, { error: 'solo letras, números, - y _' })
    .optional(),
  // La pone Render: el host aceptado antes del corte (sitio, panel y formulario).
  RENDER_EXTERNAL_URL: urlWeb.optional(),
})

// Una variable definida vacía (USERWAY_ID= en el .env) cuenta como no definida.
function sinVacias(env) {
  return Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v !== ''))
}

const hostDe = (url) => (url ? new URL(url).host.toLowerCase() : null)

/** Valida las variables y devuelve la configuración congelada. Tira un Error con la lista de problemas. */
export function leerConfig(env = process.env) {
  const resultado = esquema.safeParse(sinVacias(env))
  const problemas = resultado.success
    ? []
    : resultado.error.issues.map((i) => `${i.path.join('.') || '(entorno)'}: ${i.message}`)
  if (problemas.length) throw new Error(`Configuración inválida:\n- ${problemas.join('\n- ')}`)
  const v = resultado.data

  const produccion = v.NODE_ENV === 'production'
  const sinBase = v.SIN_BASE === '0' ? false : v.SIN_BASE === 'vacio' ? 'vacio' : 'maximo'
  const correoModo = v.CORREO_MODO ?? (produccion ? 'smtp' : v.NODE_ENV === 'test' ? 'memoria' : 'consola')

  if (produccion) {
    if (!v.URL_PUBLICA) problemas.push('URL_PUBLICA: obligatoria en producción (https://mupa.ar/)')
    if (!v.DATABASE_URL && !sinBase) problemas.push('DATABASE_URL: obligatoria en producción (o SIN_BASE=1)')
    // consola escribiría en los logs los mensajes del público (plan 8).
    if (correoModo !== 'smtp') problemas.push('CORREO_MODO: en producción solo puede ser smtp')
  }
  // Nunca el museo de ejemplo donde lo pueda ver el público (saldría en el pie y en el JSON-LD): ni en Render (que
  // define RENDER) ni con URL_PUBLICA en mupa.ar, en ningún entorno. SIN_BASE sigue sirviendo para la prueba de
  // producción en esta PC, con una URL_PUBLICA local (plan 2.5).
  const enMupaAr = Boolean(v.URL_PUBLICA) && /(^|\.)mupa\.ar\.?$/.test(new URL(v.URL_PUBLICA).hostname)
  if (sinBase && (v.RENDER || enMupaAr)) {
    const donde = v.RENDER ? 'en Render' : 'con URL_PUBLICA en mupa.ar'
    problemas.push(`SIN_BASE: solo para probar en local (con URL_PUBLICA local), nunca ${donde}`)
  }
  // En Render, siempre https.
  if (v.RENDER && v.URL_PUBLICA && new URL(v.URL_PUBLICA).protocol !== 'https:') {
    problemas.push('URL_PUBLICA: en Render tiene que ser https://')
  }
  if (problemas.length) throw new Error(`Configuración inválida:\n- ${problemas.join('\n- ')}`)

  const urlPublica = v.URL_PUBLICA ?? `http://localhost:${v.PORT}/`
  return Object.freeze({
    ...v,
    produccion,
    desarrollo: v.NODE_ENV === 'development',
    sinBase,
    correoModo,
    host: v.HOST ?? (v.RENDER ? '0.0.0.0' : '127.0.0.1'),
    // URL_PUBLICA, siempre con la barra final: canonical, OG, sitemap y JSON-LD (plan 6.4).
    urlPublica,
    origenPublico: urlPublica.slice(0, -1),
    hostPublico: hostDe(urlPublica),
    hostRender: hostDe(v.RENDER_EXTERNAL_URL),
    hayBase: Boolean(v.DATABASE_URL) && !sinBase,
  })
}

/** La configuración del proceso. Si es inválida, avisa y sale (lo usan servidor.js y dev.js al arrancar). */
export function configDelProceso() {
  try {
    return leerConfig()
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}
