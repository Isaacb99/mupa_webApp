// IndexNow (E4.6, opcional; CLAUDE.md, "Para E4", punto 6): cuando se publica, se despublica, se elimina o se cambia
// algo publicado en el panel, se le avisa a Bing (IndexNow lo comparten otros buscadores) qué direcciones del sitio
// cambiaron, así no espera a volver a rastrear el sitio. Nunca por el guardado de un borrador.
//
// - Apagado sin INDEXNOW_CLAVE (vacía: no se manda nada ni se sirve el archivo). Con clave, el sitio sirve
//   /<clave>.txt con la clave (así IndexNow comprueba que el aviso es del dueño del sitio: server/app.js).
// - Solo avisa en producción, con el host público mupa.ar (URL_PUBLICA) y desde el corte del dominio (CANONICO=1): ni
//   en local, ni antes del corte (E5-01 de la verificación de E5, 27/10/2026). En Render, URL_PUBLICA ya es
//   https://mupa.ar/ desde el primer deploy, pero hasta el corte mupa.ar sigue siendo la landing de Hostinger, que no
//   tiene ni el archivo de la clave ni esas páginas: avisar ahí le mandaba a IndexNow direcciones que no existen.
//   Si se vuelve atrás el corte (CANONICO=0), deja de avisar.
// - Sin frenar la respuesta del panel: el pedido sale después de guardar y nadie lo espera; tiene su tope de tiempo
//   (TOPE_INDEXNOW_MS) y, salga bien o mal, una línea de log con cuántas direcciones y el código, sin las direcciones.
// - El fetch se toma en cada aviso (globalThis.fetch), así las pruebas lo reemplazan por uno falso: nunca sale un
//   pedido de verdad desde las pruebas.
import { log } from './log.js'

export const API_INDEXNOW = 'https://api.indexnow.org/indexnow'
export const TOPE_INDEXNOW_MS = 5_000
/** El patrón de la clave (la de IndexNow: de 8 a 128 letras, números o guiones). */
export const PATRON_CLAVE_INDEXNOW = /^[A-Za-z0-9-]{8,128}$/

/**
 * @param {ReturnType<import('./config.js').leerConfig>} config
 * @returns {{ activo: boolean, avisar: (rutas: string[]) => void }}
 */
export function crearIndexNow(config) {
  const clave = config.INDEXNOW_CLAVE ?? null
  const activo = Boolean(clave) && config.produccion && config.hostPublico === 'mupa.ar' && Boolean(config.CANONICO)
  return {
    activo,
    /** Avisa que cambiaron estas rutas del sitio ("/novedades/<slug>", "/novedades"…). No espera ni tira. */
    avisar(rutas) {
      if (!activo) return
      const urlList = [...new Set(rutas)].map((ruta) => config.urlPublica + ruta.replace(/^\//, ''))
      if (!urlList.length) return
      let pedido
      try {
        pedido = globalThis.fetch(API_INDEXNOW, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: config.hostPublico,
            key: clave,
            keyLocation: `${config.urlPublica}${clave}.txt`,
            urlList,
          }),
          signal: AbortSignal.timeout(TOPE_INDEXNOW_MS),
        })
      } catch (err) {
        pedido = Promise.reject(err)
      }
      Promise.resolve(pedido).then(
        (r) => log(r.ok ? 'info' : 'aviso', 'indexnow', { urls: urlList.length, status: r.status }),
        (err) => log('aviso', 'indexnow', { urls: urlList.length, codigo: err?.name ?? 'error' }),
      )
    },
  }
}
