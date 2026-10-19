// Migración 05 (plan 3.1 y 3.2; E3.3): las novedades (noticias y actividades) y la galería de cada una.
// - novedades: tipo (noticia o actividad), título, dirección web (slug: única, con el patrón, fija desde la primera
//   publicación), resumen, cuerpo (texto con formato), portada y, solo en una actividad, inicio y fin (instantes: el
//   panel los carga con la hora de San Juan), lugar, costo e inscripción (solo https). Publicada, una actividad tiene
//   inicio.
// - galeria_novedades: las fotos de cada novedad, en orden (como galeria_muestras, migración 04).
// Grupos P y C del plan 3.1, como en la migración 04. Las portadas y las galerías están en server/fotos/usos.js.
// Las restricciones únicas se llaman <tabla>_<columna>_unico (server/errores.js saca la columna del nombre).
// SQL fijo, en una transacción. Es aditiva: el sitio en marcha no usa estas tablas.

const ARRIBA = `
CREATE TABLE novedades (
  id serial PRIMARY KEY,
  tipo varchar(12) NOT NULL,
  titulo varchar(160) NOT NULL,
  slug varchar(180) NOT NULL,
  resumen varchar(200),
  cuerpo jsonb,
  portada_id int REFERENCES fotos ON DELETE RESTRICT,
  evento_inicio timestamptz,
  evento_fin timestamptz,
  lugar varchar(160),
  costo varchar(80),
  enlace_inscripcion text,
  estado varchar(10) NOT NULL DEFAULT 'borrador',
  publicado_en timestamptz,
  creado_por int REFERENCES usuarios ON DELETE SET NULL,
  actualizado_por int REFERENCES usuarios ON DELETE SET NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT novedades_slug_unico UNIQUE (slug),
  CONSTRAINT novedades_slug_valido CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT novedades_tipo_valido CHECK (tipo IN ('noticia', 'actividad')),
  CONSTRAINT novedades_evento_en_orden CHECK (evento_fin IS NULL OR evento_fin >= evento_inicio),
  CONSTRAINT novedades_inscripcion_https CHECK (enlace_inscripcion IS NULL OR enlace_inscripcion LIKE 'https://%'),
  CONSTRAINT novedades_actividad_con_inicio CHECK (tipo = 'noticia' OR estado = 'borrador' OR evento_inicio IS NOT NULL),
  CONSTRAINT novedades_estado_valido CHECK (estado IN ('borrador', 'publicado')),
  CONSTRAINT novedades_publicada_con_fecha CHECK (estado = 'borrador' OR publicado_en IS NOT NULL)
);
CREATE INDEX novedades_publicas ON novedades (estado, publicado_en DESC);
CREATE INDEX novedades_actividades ON novedades (tipo, evento_inicio);
CREATE INDEX novedades_portada ON novedades (portada_id);

CREATE TABLE galeria_novedades (
  novedad_id int NOT NULL REFERENCES novedades ON DELETE CASCADE,
  foto_id int NOT NULL REFERENCES fotos ON DELETE RESTRICT,
  orden smallint NOT NULL,
  PRIMARY KEY (novedad_id, foto_id)
);
CREATE INDEX galeria_novedades_foto ON galeria_novedades (foto_id);
`

const ABAJO = `
DROP TABLE galeria_novedades;
DROP TABLE novedades;
`

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function up({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ARRIBA, { transaction: t }))
}

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function down({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ABAJO, { transaction: t }))
}
