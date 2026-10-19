// Límites de intentos (plan 4.7) con express-rate-limit, en memoria: alcanza porque hay una sola instancia, y un
// reinicio solo pone los contadores en cero. Es siempre una espera, nunca un bloqueo permanente.
//
// | Qué                                  | Límite                    | Clave                                       |
// |--------------------------------------|---------------------------|---------------------------------------------|
// | POST /administracion/api/sesion      | 10 cada 15 min            | IP                                          |
// | POST /administracion/api/sesion      | 5 FALLIDOS cada 15 min    | IP + correo: nadie deja afuera al titular   |
// |                                      | (un ingreso correcto los  | desde otra IP                               |
// |                                      | pone en cero)             |                                             |
// | PUT /administracion/api/cuenta/clave | 5 con la "actual"         | usuario: con una sesión robada no se puede  |
// |                                      | EQUIVOCADA cada 15 min    | probar la contraseña de a miles (el cambio  |
// |                                      | (el cambio correcto los   | correcto y los demás 400, como una nueva    |
// |                                      | pone en cero)             | que no cumple las reglas, no cuentan)       |
// | /administracion/api/* con sesión     | 300 por minuto            | usuario                                     |
// | POST /administracion/api/fotos       | 60 por hora (E3.1)        | usuario: cada subida ocupa la cola de sharp |
// |                                      |                           | (cuentan también las que se rechazan)       |
// El de POST /contacto (E4.5) se suma acá.
//
// La IP es req.ip, que depende de trust proxy (TRUST_PROXY, un número de saltos, nunca true: plan 10.1); las IPv6 se
// agrupan por /56 (ipKeyGenerator). Ni la IP ni el correo van al log: solo que se alcanzó un límite, y una sola línea
// por ventana y clave (el primer pedido bloqueado), no una por pedido: quien insiste no llena el log.
// Se crean con cada app (server/api/indice.js): cada prueba arranca con los contadores en cero.
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { log } from './log.js'

const QUINCE_MINUTOS = 15 * 60_000

function responder(mensaje, evento) {
  return (req, res, next, opciones) => {
    // used cuenta este pedido: limit + 1 es el primero que se pasa en esta ventana (los bloqueados siguen contando,
    // ver claveActualPorUsuario).
    if (req.rateLimit?.used === req.rateLimit?.limit + 1) log('aviso', evento)
    res.status(opciones.statusCode).json({ error: mensaje })
  }
}

/** El correo del cuerpo de un inicio de sesión, como lo normaliza el esquema ('' si no vino). */
const correoDelCuerpo = (req) =>
  typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : ''

/** La clave del límite de fallidos: IP + correo. La usa también el ingreso correcto, para ponerla en cero. */
export const claveDeIngreso = (req) => `${ipKeyGenerator(req.ip)}|${correoDelCuerpo(req)}`

/** La clave del límite de la contraseña actual equivocada: el usuario. La usa también el cambio correcto. */
export const claveDeCambio = (req) => `usuario-${req.usuario.id}`

/** Lo que marca server/api/cuenta.js cuando la contraseña actual no es la correcta: solo eso cuenta para el límite. */
export const ACTUAL_EQUIVOCADA = 'claveActualEquivocada'

export function crearLimites() {
  const comunes = { standardHeaders: 'draft-8', legacyHeaders: false }
  return {
    ingresoPorIp: rateLimit({
      ...comunes,
      windowMs: QUINCE_MINUTOS,
      limit: 10,
      handler: responder('Demasiados intentos. Esperá 15 minutos.', 'limite_ingreso_ip'),
    }),
    // Cuenta cada intento; el ingreso correcto pone la clave en cero (resetKey, en server/api/sesion.js), así quedan
    // los fallidos desde el último ingreso. Va después de express.json: el correo ya está en req.body.
    ingresoFallidoPorCorreo: rateLimit({
      ...comunes,
      windowMs: QUINCE_MINUTOS,
      limit: 5,
      keyGenerator: claveDeIngreso,
      handler: responder('Demasiados intentos. Esperá 15 minutos.', 'limite_ingreso_correo'),
    }),
    // PUT /cuenta/clave, después de requiereSesion. Cuenta cada pedido y descuenta (al terminar la respuesta) los que
    // no traían la actual equivocada; el cambio correcto pone la clave en cero (resetKey, en server/api/cuenta.js).
    // Los 429 de este mismo límite no se descuentan (como en los demás): si no, used quedaba siempre en limit + 1 y
    // cada pedido bloqueado escribía su línea en el log. La ventana es fija, así que contarlos no alarga la espera.
    claveActualPorUsuario: rateLimit({
      ...comunes,
      windowMs: QUINCE_MINUTOS,
      limit: 5,
      keyGenerator: claveDeCambio,
      skipSuccessfulRequests: true,
      requestWasSuccessful: (req, res) => res.statusCode !== 429 && !res.locals[ACTUAL_EQUIVOCADA],
      handler: responder('Demasiados intentos. Esperá 15 minutos.', 'limite_clave_actual'),
    }),
    // Después de requiereSesion: req.usuario ya está.
    porUsuario: rateLimit({
      ...comunes,
      windowMs: 60_000,
      limit: 300,
      keyGenerator: (req) => `usuario-${req.usuario.id}`,
      handler: responder('Demasiados pedidos. Esperá un minuto.', 'limite_usuario'),
    }),
    // POST /fotos, después de requiereSesion y antes de multer (server/api/fotos.js): un pedido bloqueado no llega a
    // leer el archivo.
    fotosPorUsuario: rateLimit({
      ...comunes,
      windowMs: 60 * 60_000,
      limit: 60,
      keyGenerator: (req) => `fotos-${req.usuario.id}`,
      handler: responder(
        'Subiste 60 fotos en la última hora, que es el máximo. Esperá un rato y seguí.',
        'limite_fotos',
      ),
    }),
  }
}
