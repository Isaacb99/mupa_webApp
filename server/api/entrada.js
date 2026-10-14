// Lectura segura de la entrada de la API que no es el cuerpo (plan 4.1). El cuerpo lo valida zod con el esquema de
// cada ruta (server/api/indice.js). escapeLike (búsquedas con ?q=) se suma con los listados de E3.

// Tope de un int4 de Postgres: un id más grande daría un 500 por desborde en vez de un 404.
const MAX_INT4 = 2_147_483_647

/** Un id de la ruta (":id") como entero positivo de Postgres, o null si no lo es (la API responde 400). */
export function parseId(texto) {
  if (!/^[0-9]{1,10}$/.test(String(texto))) return null
  const id = Number(texto)
  return id >= 1 && id <= MAX_INT4 ? id : null
}
