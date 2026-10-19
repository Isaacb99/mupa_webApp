// Migración 03 (plan 3.2 y 7; decisión del desarrollador del 15/10/2026: las fotos van en Postgres, plan 16.1).
// - fotos: una fila por foto subida. clave son 64 bits al azar en hexadecimal (la dirección pública,
//   /fotos/<clave>/960.webp: nunca se reusa ni se sobrescribe); ancho y alto, los de la maestra ya orientada; variantes,
//   los anchos que se guardaron ([480, 960, 1600, 2400], sin agrandar: el ancho real de cada uno es
//   min(variante, ancho)); bytes, lo que ocupan los cinco archivos. alt vacío solo en una decorativa.
// - fotos_archivos: los cinco archivos de cada foto (480, 960 y 1600 en WebP, la maestra de 2400 en WebP y og.jpg), en
//   bytea. Se borran con la foto (ON DELETE CASCADE). STORAGE EXTERNAL: WebP y JPEG ya vienen comprimidos, así
//   Postgres no pierde tiempo en volver a comprimirlos (los guarda fuera de la fila, sin pglz). Ningún listado lee
//   "datos": no tiene modelo de Sequelize (server/fotos/almacen.js la lee y la escribe con SQL).
// Quién usa una foto (portadas y galerías) lo suman las migraciones de E3.3 y E3.4, con claves foráneas a fotos(id);
// la lista de esos usos está en server/fotos/usos.js.
// SQL fijo, en una transacción. Es aditiva: el sitio en marcha no usa estas tablas.

const ARRIBA = `
CREATE TABLE fotos (
  id serial PRIMARY KEY,
  clave char(16) NOT NULL,
  ancho int NOT NULL,
  alto int NOT NULL,
  variantes jsonb NOT NULL,
  bytes int NOT NULL,
  alt varchar(250) NOT NULL DEFAULT '',
  decorativa boolean NOT NULL DEFAULT false,
  epigrafe varchar(300),
  credito varchar(120),
  subida_por int REFERENCES usuarios ON DELETE SET NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT fotos_clave_unico UNIQUE (clave),
  CONSTRAINT fotos_clave_hex CHECK (clave ~ '^[0-9a-f]{16}$'),
  CONSTRAINT fotos_alt_o_decorativa CHECK (decorativa OR alt <> ''),
  CONSTRAINT fotos_medidas_positivas CHECK (ancho > 0 AND alto > 0 AND bytes > 0)
);

CREATE TABLE fotos_archivos (
  foto_id int NOT NULL REFERENCES fotos ON DELETE CASCADE,
  variante varchar(8) NOT NULL,
  datos bytea NOT NULL,
  bytes int NOT NULL,
  PRIMARY KEY (foto_id, variante),
  CONSTRAINT fotos_archivos_variante_valida CHECK (variante IN ('480', '960', '1600', '2400', 'og'))
);

ALTER TABLE fotos_archivos ALTER COLUMN datos SET STORAGE EXTERNAL;
`

const ABAJO = `
DROP TABLE fotos_archivos;
DROP TABLE fotos;
`

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function up({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ARRIBA, { transaction: t }))
}

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function down({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ABAJO, { transaction: t }))
}
