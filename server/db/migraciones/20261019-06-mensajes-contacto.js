// Migración 06 (plan 3.2; E4.9): los mensajes del formulario de contacto del sitio. Cada mensaje que pasa la validación
// y los límites se guarda ANTES de mandarlo por correo (server/contacto.js), así un envío que falla no se pierde: el
// admin lo ve en Mensajes y el Inicio avisa (plan 8).
// - envio: pendiente (guardado, mandándose), enviado o fallido; error: el código de nodemailer (EAUTH, ETIMEDOUT…) de
//   un fallido, nunca el texto (puede traer direcciones).
// - Se borran a los 180 días (la tarea diaria, server/tareas.js). Los ve solo un admin (GET /mensajes).
// - El índice por fecha, para la lista del panel (de la más nueva a la más vieja) y para el borrado.
// Las restricciones llevan nombre (server/errores.js y migraciones.test.js). SQL fijo, en una transacción. Es
// aditiva: el sitio en marcha no usa esta tabla.

const ARRIBA = `
CREATE TABLE mensajes_contacto (
  id serial PRIMARY KEY,
  nombre varchar(100) NOT NULL,
  email varchar(254) NOT NULL,
  mensaje text NOT NULL,
  envio varchar(10) NOT NULL DEFAULT 'pendiente',
  error varchar(40),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mensajes_contacto_mensaje_largo CHECK (length(mensaje) <= 5000),
  CONSTRAINT mensajes_contacto_envio_valido CHECK (envio IN ('pendiente', 'enviado', 'fallido'))
);
CREATE INDEX mensajes_fecha ON mensajes_contacto (created_at DESC);
`

const ABAJO = `
DROP TABLE mensajes_contacto;
`

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function up({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ARRIBA, { transaction: t }))
}

/** @param {{ context: import('sequelize').QueryInterface }} opciones */
export async function down({ context }) {
  await context.sequelize.transaction((t) => context.sequelize.query(ABAJO, { transaction: t }))
}
