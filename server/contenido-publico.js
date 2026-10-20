// Lo que el sitio público lee de los contenidos (E4.2 a E4.4 y el sitemap de E4.6; plan 3.2, 6.1 y 6.3): las muestras,
// las salas y las novedades PUBLICADAS, con sus portadas y galerías. Lo usan las páginas (server/paginas.js, por la
// tabla de server/rutas-publicas.js) y el sitemap (server/ssr.js).
//
// Reglas:
// - Solo lo publicado (estado = 'publicado'): un borrador no existe para el sitio (su dirección da 404).
// - Solo las columnas que se dibujan, escritas a mano (nunca m.*), y de las fotos solo sus campos públicos (fotoPublica:
//   clave, medidas, variantes, descripción, epígrafe y crédito; nunca el id, el peso, quién la subió ni los archivos de
//   fotos_archivos). Cada página hace UNA consulta (con json_agg para las listas y las galerías).
// - Lo que viene de la base se vuelve a mirar antes de salir, como el museo (server/museo.js): las fotos con su clave y
//   sus medidas, los textos con formato con el esquema (textoRicoPublicable: si no pasa, null) y la inscripción con
//   https. Validar un texto grande cuesta unos milisegundos: se recuerda lo validado por el md5 que da la base (hasta
//   TEXTOS_EN_MEMORIA), así una página no vuelve a pagarlo mientras no cambie.
// - Si la base falla o no contesta en TOPE_CONTENIDO_MS, la consulta tira un error con code 'BASE_NO_DISPONIBLE' y la
//   página responde la 503 simple (server/ssr.js). Sin base (sin DATABASE_URL en desarrollo, o con SIN_BASE para
//   probar el pie en local) no hay contenidos: LECTOR_VACIO da listas vacías y ninguna ficha (404).
// Las fechas salen como vienen ("AAAA-MM-DD" las de las muestras, instantes las de las novedades); los textos para
// mostrar los arma server/paginas.js.
import { QueryTypes } from 'sequelize'
import { esUrlHttps } from '../compartido/esquemas/campos.js'
import { textoRicoPublicable } from '../compartido/esquemas/textoRico.js'
import { CLAVE_FOTO } from '../compartido/fotos.js'
import { baseNoDisponible, conTope, esBaseNoDisponible } from './tope.js'

/** Cuánto espera una página interna a la base antes de responder la 503 simple. */
export const TOPE_CONTENIDO_MS = 4_000
/** Las noticias de cada página de /novedades (plan 6.1). */
export const NOVEDADES_POR_PAGINA = 12
/** Cuántos textos validados se recuerdan (por su md5). */
const TEXTOS_EN_MEMORIA = 300

// El error de la base caída o colgada y quién lo reconoce (server/ssr.js, server/app.js): los de server/tope.js.
export { esBaseNoDisponible }

// Los campos públicos de una foto, en JSON (alias: la tabla fotos en la consulta).
const fotoJson = (a) =>
  `CASE WHEN ${a}.id IS NULL THEN NULL ELSE json_build_object('clave', ${a}.clave, 'ancho', ${a}.ancho, ` +
  `'alto', ${a}.alto, 'variantes', ${a}.variantes, 'alt', ${a}.alt, 'decorativa', ${a}.decorativa, ` +
  `'epigrafe', ${a}.epigrafe, 'credito', ${a}.credito) END`

// La galería de un contenido, en orden.
const galeriaJson = (tabla, columna, id) =>
  `(SELECT coalesce(json_agg(${fotoJson('gf')} ORDER BY g.orden), '[]') FROM ${tabla} g ` +
  `JOIN fotos gf ON gf.id = g.foto_id WHERE g.${columna} = ${id})`

const texto = (v) => (typeof v === 'string' && v.trim() !== '' ? v : null)
const entero = (v) => Number.isInteger(v) && v > 0

/**
 * Una foto con sus campos públicos, o null si no sirve (sin clave válida o sin medidas). Una decorativa va sin
 * descripción (alt="").
 * @param {unknown} f
 * @returns {{ clave: string, ancho: number, alto: number, variantes: number[], alt: string, decorativa: boolean,
 *   epigrafe: string | null, credito: string | null } | null}
 */
export function fotoPublica(f) {
  if (!f || typeof f !== 'object' || !CLAVE_FOTO.test(f.clave) || !entero(f.ancho) || !entero(f.alto)) return null
  const decorativa = f.decorativa === true
  return {
    clave: f.clave,
    ancho: f.ancho,
    alto: f.alto,
    variantes: (Array.isArray(f.variantes) ? f.variantes : []).filter(entero),
    alt: decorativa ? '' : (texto(f.alt) ?? ''),
    decorativa,
    epigrafe: texto(f.epigrafe),
    credito: texto(f.credito),
  }
}

const galeriaPublica = (lista) => (Array.isArray(lista) ? lista.map(fotoPublica).filter(Boolean) : [])

/** Un instante (Date de pg o texto ISO de json_agg) como Date; null si no es una fecha. */
export function instante(v) {
  if (v == null) return null
  const fecha = v instanceof Date ? v : new Date(v)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

/** El lector sin base: nada publicado. */
export const LECTOR_VACIO = Object.freeze({
  exposiciones: async () => ({ muestras: [], salas: [] }),
  muestra: async () => null,
  novedades: async () => ({ proximas: [], noticias: [], total: 0 }),
  novedad: async () => null,
  sitemap: async () => [],
})

/**
 * @param {import('sequelize').Sequelize | null} sequelize  null: sin base (LECTOR_VACIO)
 * @param {{ tope?: number }} [opciones]  tope: los ms de espera de cada consulta
 */
export function crearLectorPublico(sequelize, { tope = TOPE_CONTENIDO_MS } = {}) {
  if (!sequelize) return LECTOR_VACIO

  /** Una consulta con tope de tiempo; cualquier falla de la base sale como BASE_NO_DISPONIBLE. */
  async function consultar(sql, replacements = {}) {
    // Si gana el tope, la consulta sigue y termina (o falla) sola (conTope atiende su rechazo).
    try {
      return await conTope(sequelize.query(sql, { replacements, type: QueryTypes.SELECT }), tope)
    } catch (err) {
      throw baseNoDisponible(err)
    }
  }

  // Los textos ya validados, por su md5 (el orden de inserción del Map hace de "el más viejo sale primero").
  const textos = new Map()
  function textoValidado(doc, huella) {
    if (doc == null) return null
    if (typeof huella === 'string' && textos.has(huella)) return textos.get(huella)
    const valido = textoRicoPublicable(doc)
    if (typeof huella === 'string') {
      if (textos.size >= TEXTOS_EN_MEMORIA) textos.delete(textos.keys().next().value)
      textos.set(huella, valido)
    }
    return valido
  }

  return {
    /**
     * Las muestras publicadas que no terminaron antes de hoy (actuales, próximas y permanentes) y las salas publicadas,
     * cada lista en su orden (el del panel).
     * @param {string} hoy  "AAAA-MM-DD" en San Juan
     */
    async exposiciones(hoy) {
      const [fila] = await consultar(
        `SELECT
          (SELECT coalesce(json_agg(x ORDER BY x.orden, x.id), '[]') FROM (
             SELECT m.id, m.orden, m.titulo, m.slug, m.tipo, CAST(m.fecha_inicio AS text) AS "fechaInicio",
                    CAST(m.fecha_fin AS text) AS "fechaFin", m.resumen, ${fotoJson('f')} AS portada,
                    s.nombre AS "salaNombre", s.slug AS "salaSlug"
               FROM muestras m
               LEFT JOIN fotos f ON f.id = m.portada_id
               LEFT JOIN salas s ON s.id = m.sala_id AND s.estado = 'publicado'
              WHERE m.estado = 'publicado'
                AND (m.tipo = 'permanente' OR m.fecha_fin IS NULL OR m.fecha_fin >= CAST(:hoy AS date))) AS x
          ) AS muestras,
          (SELECT coalesce(json_agg(x ORDER BY x.orden, x.id), '[]') FROM (
             SELECT s.id, s.orden, s.nombre, s.slug, s.resumen, s.descripcion,
                    md5(CAST(s.descripcion AS text)) AS huella, ${fotoJson('f')} AS portada
               FROM salas s
               LEFT JOIN fotos f ON f.id = s.portada_id
              WHERE s.estado = 'publicado') AS x
          ) AS salas`,
        { hoy },
      )
      return {
        muestras: (fila?.muestras ?? []).map((m) => ({
          titulo: m.titulo,
          slug: m.slug,
          tipo: m.tipo,
          fechaInicio: texto(m.fechaInicio),
          fechaFin: texto(m.fechaFin),
          resumen: texto(m.resumen),
          portada: fotoPublica(m.portada),
          sala: m.salaSlug ? { nombre: m.salaNombre, slug: m.salaSlug } : null,
        })),
        salas: (fila?.salas ?? []).map((s) => ({
          nombre: s.nombre,
          slug: s.slug,
          resumen: texto(s.resumen),
          descripcion: textoValidado(s.descripcion, s.huella),
          portada: fotoPublica(s.portada),
        })),
      }
    },

    /** Una muestra publicada (también finalizada) por su dirección, con su sala (si está publicada) y su galería. */
    async muestra(slug) {
      const [m] = await consultar(
        `SELECT m.titulo, m.slug, m.tipo, CAST(m.fecha_inicio AS text) AS "fechaInicio",
                CAST(m.fecha_fin AS text) AS "fechaFin", m.resumen, m.descripcion,
                md5(CAST(m.descripcion AS text)) AS huella, ${fotoJson('f')} AS portada,
                s.nombre AS "salaNombre", s.slug AS "salaSlug",
                ${galeriaJson('galeria_muestras', 'muestra_id', 'm.id')} AS galeria
           FROM muestras m
           LEFT JOIN fotos f ON f.id = m.portada_id
           LEFT JOIN salas s ON s.id = m.sala_id AND s.estado = 'publicado'
          WHERE m.slug = :slug AND m.estado = 'publicado'`,
        { slug },
      )
      if (!m) return null
      return {
        titulo: m.titulo,
        slug: m.slug,
        tipo: m.tipo,
        fechaInicio: texto(m.fechaInicio),
        fechaFin: texto(m.fechaFin),
        resumen: texto(m.resumen),
        descripcion: textoValidado(m.descripcion, m.huella),
        portada: fotoPublica(m.portada),
        sala: m.salaSlug ? { nombre: m.salaNombre, slug: m.salaSlug } : null,
        galeria: galeriaPublica(m.galeria),
      }
    },

    /**
     * Las próximas actividades (las publicadas que no terminaron: el fin, o el inicio si no tiene, desde ahora), por
     * fecha, y una página de noticias publicadas, de la más nueva a la más vieja, con el total de noticias. Las
     * actividades realizadas no se listan (su página sigue: plan 6.1).
     * @param {{ pagina: number, ahora: Date, conProximas: boolean }} opciones
     */
    async novedades({ pagina, ahora, conProximas }) {
      const [fila] = await consultar(
        `SELECT
          ${
            conProximas
              ? `(SELECT coalesce(json_agg(x ORDER BY x.inicio, x.id), '[]') FROM (
                   SELECT n.id, n.titulo, n.slug, n.resumen, n.evento_inicio AS inicio, n.evento_fin AS fin,
                          ${fotoJson('f')} AS portada
                     FROM novedades n
                     LEFT JOIN fotos f ON f.id = n.portada_id
                    WHERE n.estado = 'publicado' AND n.tipo = 'actividad' AND n.evento_inicio IS NOT NULL
                      AND coalesce(n.evento_fin, n.evento_inicio) >= CAST(:ahora AS timestamptz)) AS x)`
              : `'[]'::json`
          } AS proximas,
          (SELECT CAST(count(*) AS int) FROM novedades WHERE estado = 'publicado' AND tipo = 'noticia') AS total,
          (SELECT coalesce(json_agg(x ORDER BY x."publicadoEn" DESC, x.id DESC), '[]') FROM (
             SELECT n.id, n.titulo, n.slug, n.resumen, n.publicado_en AS "publicadoEn", ${fotoJson('f')} AS portada
               FROM novedades n
               LEFT JOIN fotos f ON f.id = n.portada_id
              WHERE n.estado = 'publicado' AND n.tipo = 'noticia'
              ORDER BY n.publicado_en DESC, n.id DESC
              LIMIT :por OFFSET :desde) AS x
          ) AS noticias`,
        { ahora: ahora.toISOString(), por: NOVEDADES_POR_PAGINA, desde: (pagina - 1) * NOVEDADES_POR_PAGINA },
      )
      const tarjeta = (n) => ({
        titulo: n.titulo,
        slug: n.slug,
        resumen: texto(n.resumen),
        portada: fotoPublica(n.portada),
      })
      return {
        proximas: (fila?.proximas ?? []).map((n) => ({ ...tarjeta(n), inicio: instante(n.inicio), fin: instante(n.fin) })),
        noticias: (fila?.noticias ?? []).map((n) => ({ ...tarjeta(n), publicadoEn: instante(n.publicadoEn) })),
        total: fila?.total ?? 0,
      }
    },

    /** Una novedad publicada (también una actividad realizada) por su dirección, con su galería. */
    async novedad(slug) {
      const [n] = await consultar(
        `SELECT n.tipo, n.titulo, n.slug, n.resumen, n.cuerpo, md5(CAST(n.cuerpo AS text)) AS huella,
                n.evento_inicio AS inicio, n.evento_fin AS fin, n.lugar, n.costo,
                n.enlace_inscripcion AS "enlaceInscripcion", n.publicado_en AS "publicadoEn",
                n.updated_at AS "actualizadoEn", ${fotoJson('f')} AS portada,
                ${galeriaJson('galeria_novedades', 'novedad_id', 'n.id')} AS galeria
           FROM novedades n
           LEFT JOIN fotos f ON f.id = n.portada_id
          WHERE n.slug = :slug AND n.estado = 'publicado'`,
        { slug },
      )
      if (!n) return null
      return {
        tipo: n.tipo,
        titulo: n.titulo,
        slug: n.slug,
        resumen: texto(n.resumen),
        cuerpo: textoValidado(n.cuerpo, n.huella),
        inicio: instante(n.inicio),
        fin: instante(n.fin),
        lugar: texto(n.lugar),
        costo: texto(n.costo),
        enlaceInscripcion: esUrlHttps(n.enlaceInscripcion) ? n.enlaceInscripcion : null,
        publicadoEn: instante(n.publicadoEn),
        actualizadoEn: instante(n.actualizadoEn),
        portada: fotoPublica(n.portada),
        galeria: galeriaPublica(n.galeria),
      }
    },

    /**
     * Lo publicado para el sitemap (plan 6.5): las muestras y las novedades (también las finalizadas o realizadas) y
     * las salas (que no tienen página propia: cuentan para la fecha de /exposiciones), con su última modificación.
     * @returns {Promise<{ tipo: 'muestras' | 'novedades' | 'salas', slug: string, actualizadoEn: Date | null }[]>}
     */
    async sitemap() {
      const filas = await consultar(
        `SELECT 'muestras' AS tipo, slug, updated_at AS "actualizadoEn", publicado_en AS "publicadoEn", id
           FROM muestras WHERE estado = 'publicado'
         UNION ALL
         SELECT 'novedades', slug, updated_at, publicado_en, id FROM novedades WHERE estado = 'publicado'
         UNION ALL
         SELECT 'salas', slug, updated_at, publicado_en, id FROM salas WHERE estado = 'publicado'
         ORDER BY 1, 4 DESC, 5 DESC`,
      )
      return filas.map((f) => ({ tipo: f.tipo, slug: f.slug, actualizadoEn: instante(f.actualizadoEn) }))
    },
  }
}
