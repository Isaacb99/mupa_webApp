// Las redes sociales que el museo puede cargar (Datos del museo, plan 5.3) y que el sitio sabe mostrar en el pie
// (E4.1). Código puro, SIN zod: lo usa el sitio público, que no importa compartido/esquemas/ (plan 6.2); el esquema
// del PUT (compartido/esquemas/museo.js) los toma de acá.

/** Las redes que el sitio sabe mostrar (valor -> nombre visible, que es también el nombre accesible del enlace). */
export const REDES = Object.freeze({
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X (Twitter)',
  threads: 'Threads',
  linkedin: 'LinkedIn',
})

/** Cuántas redes se pueden cargar. */
export const REDES_MAX = 8
