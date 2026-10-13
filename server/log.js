// Logs del servicio: una línea JSON por evento, que Render guarda y deja buscar (plan 10.4).
// Nunca IP, correos ni contraseñas (plan 9, privacidad): quien llama pasa solo códigos y datos técnicos.
// Los errores llevan el stack en el log (lo lee el desarrollador); en las respuestas, nunca (server/errores.js).

/**
 * El código de un error (ECONNREFUSED, 28P01…). Sequelize lo guarda en err.parent (o err.original), no en err.code.
 * @param {any} err
 */
export const codigoDeError = (err) => err?.code ?? err?.parent?.code ?? err?.original?.code

/**
 * @param {'info'|'aviso'|'error'} nivel
 * @param {string} evento  nombre corto, p. ej. "arranque", "museo_sin_base", "error_500"
 * @param {Error|object} [datos]
 */
export function log(nivel, evento, datos) {
  const linea = { t: new Date().toISOString(), nivel, evento }
  if (datos instanceof Error) {
    linea.mensaje = datos.message
    const codigo = codigoDeError(datos)
    if (codigo) linea.codigo = codigo
    linea.stack = datos.stack
  } else if (datos) {
    Object.assign(linea, datos)
  }
  const texto = JSON.stringify(linea)
  if (nivel === 'error') console.error(texto)
  else console.log(texto)
}
