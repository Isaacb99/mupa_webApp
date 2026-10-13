// Guardas de los comandos que borran datos (plan 9, "Comandos destructivos"). Todo comando o prueba que borre filas,
// tablas o el esquema llama a una de estas funciones ANTES de abrir la conexión, y se niega si no corresponde:
//
// | Quién (etapa)                                  | Guarda                                              |
// |------------------------------------------------|-----------------------------------------------------|
// | server/pruebas/ayudas.js, prepararBase() (E1.4) | exigirBaseDePrueba(DATABASE_URL_TEST): DROP SCHEMA  |
// | server/db/migrar.js down (E1.1)                 | exigirConfirmacion(config, DATABASE_URL, argv)      |
// | server/db/semillas/ejemplo.js (E1.1)            | exigirBaseLocal(config, DATABASE_URL): solo local   |
//
// Son funciones puras (prueba en server/pruebas/guardas.test.js). Ninguna lee la URL de otro lado que el argumento,
// así una prueba no puede terminar apuntando a la base de desarrollo por una variable mal puesta.

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/**
 * Host y nombre de la base de una URL postgres://, sin la contraseña.
 * Se niega si la URL trae parámetros o barras invertidas: Sequelize 6 obedece ?host= (y pg otros, como hostaddr) y lee
 * la URL con el url.parse viejo, así que "postgres://u:p@localhost/mupa_test?host=db.remota" pasaría por local y
 * conectaría a otro servidor. Las URL de esta PC y la de Render no llevan ninguna de las dos cosas.
 */
export function datosDeLaBase(url) {
  let u
  try {
    u = new URL(url)
  } catch {
    throw new Error('La URL de la base no es válida')
  }
  if (u.search || url.includes('\\')) {
    throw new Error('La URL de la base no puede llevar parámetros (?host=… cambiaría el servidor) ni barras invertidas')
  }
  return { host: u.hostname.toLowerCase(), base: decodeURIComponent(u.pathname.replace(/^\//, '')) }
}

const esLocal = (host) => HOSTS_LOCALES.has(host)

/** Para lo que borra la base entera (las pruebas): solo localhost y un nombre que termine en _test. */
export function exigirBaseDePrueba(url) {
  if (!url) throw new Error('Falta DATABASE_URL_TEST: las pruebas nunca usan DATABASE_URL')
  const { host, base } = datosDeLaBase(url)
  if (!esLocal(host)) throw new Error(`Las pruebas borran la base: solo contra localhost (llegó "${host}")`)
  if (!base.endsWith('_test')) throw new Error(`Las pruebas borran la base: solo una que termine en _test (llegó "${base}")`)
  return { host, base }
}

/** Para lo que carga datos de ejemplo o pisa contenido: nunca en producción y solo contra localhost. */
export function exigirBaseLocal(config, url) {
  if (config.produccion) throw new Error('Este comando no corre con NODE_ENV=production')
  if (!url) throw new Error('Falta DATABASE_URL')
  const { host, base } = datosDeLaBase(url)
  if (!esLocal(host)) throw new Error(`Este comando solo corre contra una base local (llegó "${host}")`)
  return { host, base }
}

/**
 * Para migrar:atras (plan 3.3): exige la bandera explícita en producción y también contra cualquier base que no sea
 * local, aunque NODE_ENV no sea production (plan 2.5: desde una PC contra la URL externa de Render, con DB_SSL=1).
 */
export function exigirConfirmacion(config, url, argv = process.argv, bandera = '--confirmo-borrar-datos') {
  if (argv.includes(bandera)) return
  if (config.produccion) throw new Error(`Esto borra datos en producción: agregá ${bandera} si es lo que querés`)
  const host = url ? datosDeLaBase(url).host : null
  if (!host || !esLocal(host)) {
    throw new Error(`Esto borra datos de una base que no es local (${host ?? 'sin DATABASE_URL'}): agregá ${bandera} si es lo que querés`)
  }
}
