// "¿Me ejecutaron directamente?" de los comandos (server/db/migrar.js, server/db/semillas/ejemplo.js,
// server/scripts/admin.js): true si el archivo es el que se pasó a node, false si otro lo importó (las pruebas).
//
// import.meta.main (Node 22.18 y 24.2) es la respuesta de Node. Sin él, se compara con el archivo de process.argv[1]
// después de resolver symlinks y junctions de Windows (realpathSync): Node carga el principal por su ruta real, así
// que import.meta.url es la real, y comparar contra resolve(argv[1]) daba false cuando el comando se llamaba por un
// enlace: el script no hacía nada y salía con 0.
import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

/** @param {ImportMeta} meta  el import.meta del que pregunta */
export function esPrincipal(meta) {
  if (typeof meta.main === 'boolean') return meta.main
  const entrada = process.argv[1]
  if (!entrada) return false
  try {
    return meta.url === pathToFileURL(realpathSync(entrada)).href
  } catch {
    // argv[1] que no existe como archivo (p. ej. sin la extensión): no es este.
    return false
  }
}
