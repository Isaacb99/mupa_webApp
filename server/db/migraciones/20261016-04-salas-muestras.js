// Migración 04 (plan 3.1, 3.2 y 3.5; E3.4): las salas, las muestras y la galería de cada muestra.
// - salas: nombre, dirección web (slug: única, con el patrón, fija desde la primera publicación), resumen, descripción
//   (texto con formato), portada y orden (el de la página de exposiciones). plano_ref queda reservado para el plano
//   (módulo 4): único, sin uso todavía. La galería de las salas se suma con el plano (plan 3.5).
// - muestras: título, slug, tipo (permanente o temporal), fechas (días), sala (si la eliminan, queda sin sala),
//   resumen, descripción, portada y orden. Publicada, una temporal tiene fecha de inicio.
// - galeria_muestras: las fotos de cada muestra, en orden. Se van con la muestra (CASCADE); una foto en uso no se
//   puede borrar (RESTRICT): la borra liberarFotos (server/fotos/almacen.js) cuando ya no la usa nadie.
// Grupos del plan 3.1 en las dos tablas: P (estado borrador | publicado y publicado_en, la primera publicación: con
// estado publicado, siempre está) y C (creado_por, actualizado_por, created_at, updated_at; si se borra la cuenta,
// quedan en null).
// Las portadas y las galerías apuntan a fotos(id): están en server/fotos/usos.js (fotos.test.js lo compara con la
// base). Un índice por cada columna que apunta a fotos: lo usan liberarFotos y la tarea de las huérfanas (EXISTS) y el
// RESTRICT al borrar una foto.
// Las restricciones únicas se llaman <tabla>_<columna>_unico (server/errores.js saca la columna del nombre).
// SQL fijo, en una transacción. Es aditiva: el sitio en marcha no usa estas tablas.

const ARRIBA = `
CREATE TABLE salas (
  id serial PRIMARY KEY,
  nombre varchar(120) NOT NULL,
  slug varchar(140) NOT NULL,
  resumen varchar(200),
  descripcion jsonb,
  portada_id int REFERENCES fotos ON DELETE RESTRICT,
  orden smallint NOT NULL DEFAULT 0,
  plano_ref varchar(60),
  estado varchar(10) NOT NULL DEFAULT 'borrador',
  publicado_en timestamptz,
  creado_por int REFERENCES usuarios ON DELETE SET NULL,
  actualizado_por int REFERENCES usuarios ON DELETE SET NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT salas_slug_unico UNIQUE (slug),
  CONSTRAINT salas_plano_ref_unico UNIQUE (plano_ref),
  CONSTRAINT salas_slug_valido CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT salas_estado_valido CHECK (estado IN ('borrador', 'publicado')),
  CONSTRAINT salas_publicada_con_fecha CHECK (estado = 'borrador' OR publicado_en IS NOT NULL)
);
CREATE INDEX salas_publicas ON salas (estado, orden);
CREATE INDEX salas_portada ON salas (portada_id);

CREATE TABLE muestras (
  id serial PRIMARY KEY,
  titulo varchar(160) NOT NULL,
  slug varchar(180) NOT NULL,
  tipo varchar(12) NOT NULL,
  fecha_inicio date,
  fecha_fin date,
  sala_id int REFERENCES salas ON DELETE SET NULL,
  resumen varchar(200),
  descripcion jsonb,
  portada_id int REFERENCES fotos ON DELETE RESTRICT,
  orden smallint NOT NULL DEFAULT 0,
  estado varchar(10) NOT NULL DEFAULT 'borrador',
  publicado_en timestamptz,
  creado_por int REFERENCES usuarios ON DELETE SET NULL,
  actualizado_por int REFERENCES usuarios ON DELETE SET NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT muestras_slug_unico UNIQUE (slug),
  CONSTRAINT muestras_slug_valido CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT muestras_tipo_valido CHECK (tipo IN ('permanente', 'temporal')),
  CONSTRAINT muestras_fechas_en_orden CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio),
  CONSTRAINT muestras_temporal_con_inicio CHECK (estado = 'borrador' OR tipo = 'permanente' OR fecha_inicio IS NOT NULL),
  CONSTRAINT muestras_estado_valido CHECK (estado IN ('borrador', 'publicado')),
  CONSTRAINT muestras_publicada_con_fecha CHECK (estado = 'borrador' OR publicado_en IS NOT NULL)
);
CREATE INDEX muestras_publicas ON muestras (estado, fecha_fin);
CREATE INDEX muestras_sala ON muestras (sala_id);
CREATE INDEX muestras_portada ON muestras (portada_id);

CREATE TABLE galeria_muestras (
  muestra_id int NOT NULL REFERENCES muestras ON DELETE CASCADE,
  foto_id int NOT NULL REFERENCES fotos ON DELETE RESTRICT,
  orden smallint NOT NULL,
  PRIMARY KEY (muestra_id, foto_id)
);
CREATE INDEX galeria_muestras_foto ON galeria_muestras (foto_id);
`

const ABAJO = `
DROP TABLE galeria_muestras;
DROP TABLE muestras;
DROP TABLE salas;
`

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function up({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ARRIBA, { transaction: t }))
}

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function down({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ABAJO, { transaction: t }))
}
