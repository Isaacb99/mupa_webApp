// Migración 01 (plan 3.2): usuarios del panel y sus sesiones.
// SQL fijo, con los CHECK y los índices tal cual: los modelos (server/db/modelos/) describen estas tablas, nunca las
// crean. Cada migración corre en una transacción: si algo falla, no queda nada a medias.
// - usuarios: el correo es el usuario y va en minúsculas; roles como varchar con CHECK (nunca ENUM, plan 3.1);
//   debe_cambiar_clave mientras tenga una contraseña temporal, que vence a las 72 h (clave_temporal_vence).
// - sesiones: en la base va el SHA-256 (hex) del valor de la cookie, nunca el valor; 12 h como máximo (expira_en) y
//   2 h sin uso (ultimo_uso), que se miden con el reloj de la base (server/auth/sesiones.js). Sin IP.

const ARRIBA = `
CREATE TABLE usuarios (
  id serial PRIMARY KEY,
  email varchar(254) NOT NULL,
  nombre varchar(100) NOT NULL,
  password_hash varchar(255) NOT NULL,
  debe_cambiar_clave boolean NOT NULL DEFAULT true,
  clave_temporal_vence timestamptz,
  rol varchar(20) NOT NULL DEFAULT 'editor',
  activo boolean NOT NULL DEFAULT true,
  ultimo_acceso timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT usuarios_email_unico UNIQUE (email),
  CONSTRAINT usuarios_email_minusculas CHECK (email = lower(email)),
  CONSTRAINT usuarios_rol_valido CHECK (rol IN ('admin', 'editor')),
  CONSTRAINT usuarios_temporal_con_vencimiento CHECK (NOT debe_cambiar_clave OR clave_temporal_vence IS NOT NULL)
);

CREATE TABLE sesiones (
  id bigserial PRIMARY KEY,
  usuario_id int NOT NULL REFERENCES usuarios ON DELETE CASCADE,
  token_hash char(64) NOT NULL,
  creada_en timestamptz NOT NULL DEFAULT now(),
  ultimo_uso timestamptz NOT NULL DEFAULT now(),
  expira_en timestamptz NOT NULL,
  user_agent varchar(300),
  CONSTRAINT sesiones_token_unico UNIQUE (token_hash)
);

CREATE INDEX sesiones_usuario ON sesiones (usuario_id);
`

const ABAJO = `
DROP TABLE sesiones;
DROP TABLE usuarios;
`

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function up({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ARRIBA, { transaction: t }))
}

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function down({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ABAJO, { transaction: t }))
}
