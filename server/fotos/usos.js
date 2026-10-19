// Quién usa una foto (plan 3.2 y 7): cada columna de la base que apunta a fotos(id). Es el ÚNICO lugar donde se dice:
// lo usan liberarFotos (borra las que ya no usa nadie al quitar una foto o eliminar un contenido) y la tarea diaria
// de las huérfanas (las subidas que nunca se usaron, con más de 24 h), las dos en server/fotos/almacen.js.
//
// Desde E3.3 y E3.4: las portadas de las salas, las muestras y las novedades (migraciones 04 y 05) y las galerías de las
// muestras y las novedades. Cuando una migración agregue otra clave foránea a fotos(id) (la galería de las salas, con
// el plano: plan 3.5), su tabla y su columna van acá. server/pruebas/fotos.test.js compara esta lista con las claves
// foráneas de la base: si falta una, la prueba falla (si no, la tarea diaria borraría fotos en uso; las claves
// foráneas con ON DELETE RESTRICT lo frenarían, pero la tarea fallaría entera todos los días).
// Cada columna tiene su índice (las migraciones), así cada EXISTS es una búsqueda por índice.
//
// Solo constantes del código: los nombres van tal cual en el SQL (nunca vienen de un pedido) y se validan igual.

/** @type {ReadonlyArray<{ tabla: string, columna: string }>} */
export const USOS_DE_FOTOS = Object.freeze([
  Object.freeze({ tabla: 'galeria_muestras', columna: 'foto_id' }),
  Object.freeze({ tabla: 'galeria_novedades', columna: 'foto_id' }),
  Object.freeze({ tabla: 'muestras', columna: 'portada_id' }),
  Object.freeze({ tabla: 'novedades', columna: 'portada_id' }),
  Object.freeze({ tabla: 'salas', columna: 'portada_id' }),
])

const IDENTIFICADOR = /^[a-z_][a-z0-9_]*$/

/**
 * La condición SQL "la foto <alias> está en uso" (un EXISTS por cada uso, unidos con OR), o false si no hay usos.
 * @param {string} [alias]  el de la tabla fotos en la consulta
 * @param {ReadonlyArray<{ tabla: string, columna: string }>} [usos]
 */
export function condicionEnUso(alias = 'f', usos = USOS_DE_FOTOS) {
  for (const nombre of [alias, ...usos.flatMap((u) => [u.tabla, u.columna])]) {
    if (!IDENTIFICADOR.test(nombre)) throw new Error(`Nombre inválido en los usos de las fotos: ${nombre}`)
  }
  if (!usos.length) return 'false'
  return usos
    .map(({ tabla, columna }) => `EXISTS (SELECT 1 FROM ${tabla} uso WHERE uso.${columna} = ${alias}.id)`)
    .join(' OR ')
}
