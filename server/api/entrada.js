// Lectura segura de la entrada de la API que no es el cuerpo (plan 4.1). El cuerpo lo valida zod con el esquema de
// cada ruta (server/api/indice.js); la consulta de los listados (?estado=&q=&pagina=&por=), el esquema de su ruta
// (compartido/esquemas/contenido.js, esquemaListado).

// Tope de un int4 de Postgres: un id más grande daría un 500 por desborde en vez de un 404.
const MAX_INT4 = 2_147_483_647

/** Un id de la ruta (":id") como entero positivo de Postgres, o null si no lo es (la API responde 400). */
export function parseId(texto) {
  if (!/^[0-9]{1,10}$/.test(String(texto))) return null
  const id = Number(texto)
  return id >= 1 && id <= MAX_INT4 ? id : null
}

/**
 * Un texto para buscar con LIKE / ILIKE, con sus comodines escapados: "50%_off\" busca eso y no "50 cualquier cosa".
 * Con la barra invertida, que es el escape por defecto de LIKE en Postgres (y standard_conforming_strings, que viene
 * prendido: la barra llega tal cual). El valor va siempre como parámetro, nunca pegado en el SQL.
 * @param {string} texto
 */
export const escapeLike = (texto) => String(texto).replace(/[\\%_]/g, (c) => `\\${c}`)
