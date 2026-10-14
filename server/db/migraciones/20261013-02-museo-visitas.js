// Migración 02 (plan 3.2 y 3.4): los datos del museo y de las visitas, que el panel edita desde E2.
// - museo: una sola fila (id = 1), que esta migración crea VACÍA: no se inventa ningún dato del museo (va a
//   producción). email_destino_contacto es solo para admins y nunca sale al HTML (plan 9, "Salida").
// - horario_semanal: los 7 días (ISO: 1 = lunes), que esta migración crea CERRADOS. Las franjas (hasta 2, con
//   abre < cierra) las valida zod en E2.4.
// - tarifas: id estable, porque lo va a referenciar la venta de entradas (plan 3.6). Precio en pesos, sin centavos.
// SQL fijo, con los CHECK tal cual (las URL solo https), en una transacción.

const ARRIBA = `
CREATE TABLE museo (
  id smallint PRIMARY KEY DEFAULT 1,
  direccion varchar(200),
  localidad varchar(100),
  provincia varchar(60),
  codigo_postal varchar(10),
  telefono varchar(40),
  email_publico varchar(254),
  email_destino_contacto varchar(254),
  redes jsonb NOT NULL DEFAULT '[]',
  mapa_embed_url text,
  mapa_url text,
  como_llegar jsonb,
  normas jsonb,
  accesibilidad jsonb,
  nota_horarios varchar(300),
  nota_tarifas varchar(300),
  compra_activa boolean NOT NULL DEFAULT false,
  compra_url text,
  compra_texto varchar(40),
  aviso_texto varchar(200),
  aviso_hasta date,
  updated_at timestamptz NOT NULL,
  actualizado_por int REFERENCES usuarios ON DELETE SET NULL,
  CONSTRAINT museo_una_fila CHECK (id = 1),
  CONSTRAINT museo_mapa_embed_google CHECK (mapa_embed_url IS NULL OR mapa_embed_url LIKE 'https://www.google.com/maps/embed?%'),
  CONSTRAINT museo_mapa_https CHECK (mapa_url IS NULL OR mapa_url LIKE 'https://%'),
  CONSTRAINT museo_compra_https CHECK (compra_url IS NULL OR compra_url LIKE 'https://%')
);

CREATE TABLE horario_semanal (
  dia smallint PRIMARY KEY,
  abierto boolean NOT NULL DEFAULT false,
  franjas jsonb NOT NULL DEFAULT '[]',
  nota varchar(120),
  CONSTRAINT horario_dia_iso CHECK (dia BETWEEN 1 AND 7)
);

CREATE TABLE tarifas (
  id serial PRIMARY KEY,
  nombre varchar(80) NOT NULL,
  gratuita boolean NOT NULL DEFAULT false,
  precio integer,
  condicion varchar(160),
  orden smallint NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT tarifas_precio_no_negativo CHECK (precio >= 0),
  CONSTRAINT tarifas_precio_o_gratuita CHECK (gratuita OR precio IS NOT NULL)
);

INSERT INTO museo (id, updated_at) VALUES (1, now());
INSERT INTO horario_semanal (dia) SELECT d FROM generate_series(1, 7) AS d;
`

const ABAJO = `
DROP TABLE tarifas;
DROP TABLE horario_semanal;
DROP TABLE museo;
`

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function up({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ARRIBA, { transaction: t }))
}

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function down({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ABAJO, { transaction: t }))
}
