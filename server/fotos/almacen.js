// El almacén de las fotos en Postgres (plan 7 y 16.1; decisión del desarrollador del 15/10/2026): la fila en fotos y
// sus cinco archivos en fotos_archivos (bytea).
// - guardar(datos, procesada, { transaction? }): la foto y sus cinco archivos en UNA transacción (la propia o, si se
//   pasa, la de quien llama: la semilla de ejemplo guarda todo junto): si algo falla en el medio, no queda nada. La clave son 64 bits al azar (randomBytes(8)): nunca se sobrescribe una foto.
// - abrir(clave, variante): los bytes de un archivo, o null si no existe. Primero en una caché en memoria (LRU de
//   ~32 MB, por bytes) y si no, en la base, con como mucho 2 lecturas a la vez (el pool tiene 5 conexiones: las páginas
//   y el panel nunca se quedan sin una por las fotos). Si muchos piden la misma foto a la vez, se lee una sola vez. Las
//   demás esperan su turno, hasta 1000 en fila y hasta 10 s cada una (corrección de E3, 16/10/2026: con 100 en fila y
//   sin espera, 300 fotos distintas pedidas juntas con la caché vacía daban 198 respuestas 503, fotos rotas en la
//   página); pasado eso, un error con code FOTOS_OCUPADO (la ruta responde 503). Lo que no existe se recuerda 10 minutos
//   (NO_EXISTE_MS, hasta 10.000): pedir otra vez una foto borrada no vuelve a ir a la base.
// - liberar(ids, transaction?): borra, de esas fotos, las que ya no usa nadie (server/fotos/usos.js); sus archivos
//   caen en cascada. Para quitar una foto o eliminar un contenido (plan 3.2), adentro de la transacción del cambio: la
//   caché se limpia después del commit. Devuelve las claves borradas.
// - borrarHuerfanas(): la tarea diaria (server/tareas.js): las que nadie usa y tienen más de 24 h.
// Borrar va en dos pasos, en la misma transacción: primero se bloquean las fotos (FOR UPDATE) y después se borran las
// que no se usan. Un pedido que está por usar una foto la tiene bloqueada (FOR KEY SHARE, hasta su commit: exigirFotos
// de server/api/contenido.js, o la clave foránea al insertar): el borrado espera, y como en READ COMMITTED cada sentencia
// ve lo último confirmado, el DELETE ya ve ese uso y no la borra. En una sola sentencia, el DELETE esperaba la fila pero
// miraba los usos con lo que veía al empezar, la borraba igual y la clave foránea (ON DELETE RESTRICT) cortaba todo con
// un 500 (corrección de E3, 16/10/2026). Al revés, quien quiera usar una foto que se está borrando espera al borrado y
// después no la encuentra: 409 "volvé a subirla". La tarea diaria saltea las bloqueadas (SKIP LOCKED): las mira al día
// siguiente.
// - olvidar(claves): saca esas fotos de la caché.
// Ningún listado lee "datos": solo abrir(), de a un archivo.
import { randomBytes } from 'node:crypto'
import { QueryTypes } from 'sequelize'
import { condicionEnUso, USOS_DE_FOTOS } from './usos.js'

const MB = 1024 * 1024

/**
 * Caché LRU por bytes: un Map, que recuerda el orden de inserción (el primero es el menos usado). Un archivo de más de
 * un cuarto del total no entra (no vacía la caché por uno solo).
 * @param {number} maximo  bytes
 */
export function crearLru(maximo) {
  /** @type {Map<string, Buffer>} */
  const mapa = new Map()
  let total = 0
  const sacar = (clave) => {
    const datos = mapa.get(clave)
    if (!datos) return
    mapa.delete(clave)
    total -= datos.length
  }
  return {
    get(clave) {
      const datos = mapa.get(clave)
      if (!datos) return null
      mapa.delete(clave)
      mapa.set(clave, datos)
      return datos
    },
    set(clave, datos) {
      sacar(clave)
      if (datos.length > maximo / 4) return
      mapa.set(clave, datos)
      total += datos.length
      for (const vieja of mapa.keys()) {
        if (total <= maximo) break
        sacar(vieja)
      }
    },
    /** Saca todo lo que empieza con el prefijo (todas las variantes de una foto). */
    sacarPrefijo(prefijo) {
      for (const clave of [...mapa.keys()]) if (clave.startsWith(prefijo)) sacar(clave)
    },
    get bytes() {
      return total
    },
    get cantidad() {
      return mapa.size
    },
  }
}

const ocupado = () => Object.assign(new Error('Demasiadas lecturas de fotos esperando'), { code: 'FOTOS_OCUPADO' })

/**
 * Un semáforo: como mucho max tareas a la vez y hasta maxEsperando en fila, cada una esperando como mucho esperaMaxMs
 * (más, o pasado ese tiempo: error FOTOS_OCUPADO).
 * @param {number} max
 * @param {number} maxEsperando
 * @param {number} [esperaMaxMs]
 */
export function crearSemaforo(max, maxEsperando, esperaMaxMs = 10_000) {
  let activas = 0
  let maximoVisto = 0
  /** @type {{ seguir: () => void }[]} */
  const fila = []
  return {
    /**
     * @template T
     * @param {() => Promise<T>} tarea
     * @returns {Promise<T>}
     */
    async con(tarea) {
      if (activas >= max) {
        if (fila.length >= maxEsperando) throw ocupado()
        // El lugar lo pasa la que termina (activas no cambia). Si no llega a tiempo, sale de la fila.
        await new Promise((seguir, rechazar) => {
          const turno = {
            seguir: () => {
              clearTimeout(reloj)
              seguir()
            },
          }
          const reloj = setTimeout(() => {
            const lugar = fila.indexOf(turno)
            if (lugar >= 0) fila.splice(lugar, 1)
            rechazar(ocupado())
          }, esperaMaxMs)
          fila.push(turno)
        })
      } else {
        activas += 1
      }
      maximoVisto = Math.max(maximoVisto, activas)
      try {
        return await tarea()
      } finally {
        const siguiente = fila.shift()
        if (siguiente) siguiente.seguir()
        else activas -= 1
      }
    },
    get esperando() {
      return fila.length
    },
    get activas() {
      return activas
    },
    get maximoVisto() {
      return maximoVisto
    },
  }
}

/** Cuánto se recuerda que un archivo no existe, y cuántos como mucho. */
export const NO_EXISTE_MS = 10 * 60_000
const NO_EXISTE_MAX = 10_000

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ bytesCache?: number, lecturas?: number, maxEsperando?: number, esperaMaxMs?: number,
 *   usos?: ReadonlyArray<{ tabla: string, columna: string }> }} [opciones]
 *   usos: quién usa una foto (por defecto USOS_DE_FOTOS; las pruebas pasan uno propio)
 */
export function crearAlmacen(
  sequelize,
  { bytesCache = 32 * MB, lecturas = 2, maxEsperando = 1000, esperaMaxMs = 10_000, usos = USOS_DE_FOTOS } = {},
) {
  const enUso = condicionEnUso('f', usos)
  const cache = crearLru(bytesCache)
  const semaforo = crearSemaforo(lecturas, maxEsperando, esperaMaxMs)
  /** @type {Map<string, Promise<Buffer | null>>} */
  const enCurso = new Map()
  /** Lo que no existe ("clave/variante" -> hasta cuándo se recuerda), en el orden en que se anotó. */
  const noExiste = new Map()
  // Cambia con cada borrado: una lectura que empezó antes de un borrado no guarda lo que leyó en la caché.
  let generacion = 0

  function olvidar(claves) {
    if (!claves?.length) return
    generacion += 1
    for (const clave of claves) {
      cache.sacarPrefijo(`${clave}/`)
      for (const k of [...enCurso.keys()]) if (k.startsWith(`${clave}/`)) enCurso.delete(k)
    }
  }

  function anotarQueNoExiste(k) {
    noExiste.delete(k)
    noExiste.set(k, Date.now() + NO_EXISTE_MS)
    if (noExiste.size > NO_EXISTE_MAX) noExiste.delete(noExiste.keys().next().value)
  }
  function sabemosQueNoExiste(k) {
    const hasta = noExiste.get(k)
    if (hasta === undefined) return false
    if (hasta > Date.now()) return true
    noExiste.delete(k)
    return false
  }

  /** Bloquea esas fotos (FOR UPDATE) y borra las que no se usan, en la transacción. Devuelve las claves borradas. */
  async function borrarSinUso(ids, transaction) {
    await sequelize.query('SELECT id FROM fotos WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE', {
      bind: [ids],
      type: QueryTypes.SELECT,
      transaction,
    })
    const filas = await sequelize.query(
      `DELETE FROM fotos f WHERE f.id = ANY($1::int[]) AND NOT (${enUso}) RETURNING f.clave`,
      { bind: [ids], type: QueryTypes.SELECT, transaction },
    )
    return filas.map((f) => f.clave)
  }

  async function leer(clave, variante) {
    const filas = await sequelize.query(
      `SELECT a.datos FROM fotos_archivos a JOIN fotos f ON f.id = a.foto_id
        WHERE f.clave = $1 AND a.variante = $2`,
      { bind: [clave, variante], type: QueryTypes.SELECT },
    )
    return filas[0]?.datos ?? null
  }

  return {
    /**
     * @param {{ alt: string, decorativa: boolean, epigrafe: string | null, credito: string | null, subidaPor: number }} datos
     * @param {import('./procesar.js').FotoProcesada} procesada
     * @param {{ transaction?: import('sequelize').Transaction }} [opciones]  la de quien llama (si no, una propia)
     */
    async guardar(datos, procesada, { transaction: deAfuera } = {}) {
      const { Foto } = sequelize.models
      const hacer = async (transaction) => {
        const foto = await Foto.create(
          {
            clave: randomBytes(8).toString('hex'),
            ancho: procesada.ancho,
            alto: procesada.alto,
            variantes: procesada.variantes,
            bytes: procesada.bytes,
            alt: datos.alt,
            decorativa: datos.decorativa,
            epigrafe: datos.epigrafe,
            credito: datos.credito,
            subidaPor: datos.subidaPor,
          },
          { transaction },
        )
        // Los cinco archivos en una sola sentencia, con parámetros (el bytea va binario, no como texto escapado).
        const bind = [foto.id]
        const valores = procesada.archivos.map(({ variante, datos: bytes }) => {
          bind.push(variante, bytes, bytes.length)
          const n = bind.length
          return `($1, $${n - 2}, $${n - 1}, $${n})`
        })
        await sequelize.query(
          `INSERT INTO fotos_archivos (foto_id, variante, datos, bytes) VALUES ${valores.join(', ')}`,
          { bind, transaction },
        )
        // La clave es nueva y al azar: nadie pudo pedirla antes. Igual, que no quede anotada como que no existe.
        for (const k of [...noExiste.keys()]) if (k.startsWith(`${foto.clave}/`)) noExiste.delete(k)
        return foto
      }
      return deAfuera ? hacer(deAfuera) : sequelize.transaction(hacer)
    },

    /**
     * @param {string} clave  ya validada (CLAVE_FOTO)
     * @param {string} variante
     * @returns {Promise<Buffer | null>}
     */
    async abrir(clave, variante) {
      const k = `${clave}/${variante}`
      const enCache = cache.get(k)
      if (enCache) return enCache
      if (sabemosQueNoExiste(k)) return null
      const yaLeyendo = enCurso.get(k)
      if (yaLeyendo) return yaLeyendo
      const desde = generacion
      const lectura = semaforo
        .con(() => leer(clave, variante))
        .then((datos) => {
          if (!datos) anotarQueNoExiste(k)
          else if (generacion === desde) cache.set(k, datos)
          return datos
        })
        .finally(() => {
          if (enCurso.get(k) === lectura) enCurso.delete(k)
        })
      enCurso.set(k, lectura)
      return lectura
    },

    /**
     * @param {number[]} ids
     * @param {import('sequelize').Transaction} [transaction]
     * @returns {Promise<string[]>} las claves borradas
     */
    async liberar(ids, transaction) {
      const lista = [...new Set((ids ?? []).filter((id) => Number.isInteger(id) && id > 0))].sort((a, b) => a - b)
      if (!lista.length) return []
      // Los dos pasos van en la misma transacción (la de quien llama o una propia).
      const claves = transaction
        ? await borrarSinUso(lista, transaction)
        : await sequelize.transaction((t) => borrarSinUso(lista, t))
      if (transaction) transaction.afterCommit(() => olvidar(claves))
      else olvidar(claves)
      return claves
    },

    /** La tarea diaria: borra las fotos sin uso con más de 24 h. Devuelve cuántas borró. */
    async borrarHuerfanas() {
      const claves = await sequelize.transaction(async (transaction) => {
        // Las que alguien está por usar (bloqueadas) quedan para la vuelta siguiente.
        const candidatas = await sequelize.query(
          `SELECT f.id FROM fotos f WHERE f.created_at < now() - interval '24 hours' AND NOT (${enUso})
            ORDER BY f.id FOR UPDATE SKIP LOCKED`,
          { type: QueryTypes.SELECT, transaction },
        )
        if (!candidatas.length) return []
        const filas = await sequelize.query(
          `DELETE FROM fotos f WHERE f.id = ANY($1::int[]) AND NOT (${enUso}) RETURNING f.clave`,
          { bind: [candidatas.map((f) => f.id)], type: QueryTypes.SELECT, transaction },
        )
        return filas.map((f) => f.clave)
      })
      olvidar(claves)
      return claves.length
    },

    olvidar,

    /** Para las pruebas: lo que hay en la caché y cuántas lecturas a la base hubo a la vez como mucho. */
    estadisticas() {
      return {
        enCache: cache.cantidad,
        bytesEnCache: cache.bytes,
        lecturasMaximas: semaforo.maximoVisto,
        noExisten: noExiste.size,
      }
    },
  }
}
