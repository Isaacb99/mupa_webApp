// La API del panel, en /administracion/api (plan 2.4, punto 5, y 4). Una sola tabla de rutas: de ella sale el router
// y la recorre server/pruebas/permisos.test.js, así no puede haber una ruta sin sesión, sin rol o sin CSRF.
//
// Para todo pedido, en este orden:
//   1. CSRF por origen (Sec-Fetch-Site / Origin) en lo que no es GET, HEAD ni OPTIONS: 403;
//   2. Content-Type: application/json en POST, PUT, PATCH y DELETE con cuerpo (en POST /fotos, multipart/form-data:
//      MULTIPART de server/seguridad.js): 415;
//   3. express.json con tope de 100 kB, o el de la ruta (limiteJson: 300 kB en lo que guarda textos con formato, plan
//      2.4: PUT /museo y PUT /novedades, /muestras y /salas/:id; ojo, el parser de /salas/:id y /muestras/:id lee
//      también /salas/orden y /muestras/orden, que quedan con 300 kB: hallazgo COD-08 de la verificación de E3,
//      pendiente) (413; un JSON roto, 400). El multipart lo lee multer,
//      en la ruta (después de la sesión, el rol, el límite y un lugar en la cola: server/api/fotos.js);
// y por ruta:
//   4. con rol: requiereSesion (401), la contraseña temporal ya cambiada salvo las rutas que la permiten (403 con
//      debeCambiarClave), 300 pedidos por minuto por usuario (429) y el rol (403);
//   5. lo propio de la ruta antes de validar: los límites (el inicio de sesión: por IP y por correo + IP) y los campos
//      que solo puede mandar un admin (el correo de destino de PUT /museo: 403);
//   6. el :id (400) y el cuerpo con su esquema zod (400 con los campos), ANTES de que la ruta toque la base;
//   7. la ruta, que recibe solo lo que devolvió el esquema (req.datos).
// Lo que no está en la tabla: 404 en JSON. Sin base (SIN_BASE o sin DATABASE_URL): 503 en JSON. Sin argon2 (el
// binario nativo no cargó): 503 en JSON en las rutas que usan contraseñas.
// Rol "editor" = cualquier cuenta; "admin" = solo admins; null = sin sesión (entrar y salir).
// /estado (el Inicio) desde E2.2; museo, horarios y tarifas desde E2.3 y E2.4; fotos desde E3.1; novedades, muestras y
// salas desde E3.3 y E3.4 (server/api/contenido.js, una fábrica para los tres); mensajes desde E4.9. Una ruta nueva va en
// su archivo (un arreglo de Definicion) y en DEFINICIONES: así entra sola en el recorrido de
// server/pruebas/permisos.test.js. Express prueba las rutas en el orden de la tabla: una fija (/tarifas/orden,
// /salas/orden, /muestras/orden) va antes que la de su :id.
import express from 'express'
import { hashDeRelleno } from '../auth/claves.js'
import { crearRequiereSesion, exigirClaveCambiada, requiereRol } from '../auth/middleware.js'
import { httpError } from '../errores.js'
import { crearAlmacen } from '../fotos/almacen.js'
import { crearIndexNow } from '../indexnow.js'
import { crearCola } from '../fotos/cola.js'
import { crearLimites } from '../limites.js'
import { crearControlDeOrigen, exigirJson } from '../seguridad.js'
import { rutasDeContenidos } from './contenido.js'
import { rutasDeCuenta } from './cuenta.js'
import { parseId } from './entrada.js'
import { rutasDeEstado } from './estado.js'
import { rutasDeFotos } from './fotos.js'
import { rutasDeHorarios } from './horarios.js'
import { rutasDeMensajes } from './mensajes.js'
import { rutasDeMuseo } from './museo.js'
import { rutasDeSesion } from './sesion.js'
import { rutasDeTarifas } from './tarifas.js'
import { rutasDeUsuarios } from './usuarios.js'

/**
 * @typedef {object} Definicion
 * @property {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} metodo
 * @property {string} ruta  relativa a /administracion/api
 * @property {'editor'|'admin'|null} rol
 * @property {boolean} [conClaveTemporal]  pasa aunque la contraseña temporal no se haya cambiado
 * @property {boolean} [multipart]  recibe multipart/form-data (un archivo) en vez de JSON: tiene que estar también en
 *   MULTIPART de server/seguridad.js, y multer va en "antes"
 * @property {import('zod').ZodType} [cuerpo]
 * @property {string} [limiteJson]  el tope del cuerpo JSON de esta ruta, si no es el común de 100 kB ('300kb')
 * @property {(limites: ReturnType<typeof crearLimites>, ctx: Contexto) => Function[]} [antes]
 * @property {(req, res, ctx: Contexto) => unknown} manejador
 */

/**
 * Lo que recibe cada manejador además de req y res.
 * @typedef {object} Contexto
 * @property {object} config
 * @property {import('sequelize').Sequelize} sequelize
 * @property {ReturnType<typeof crearLimites>} limites
 * @property {ReturnType<typeof import('../tareas.js').crearRegistroDeTareas> | null} registroTareas
 * @property {ReturnType<typeof crearAlmacen>} almacen  las fotos en la base (server/fotos/almacen.js)
 * @property {ReturnType<typeof crearCola>} colaDeFotos  el procesado de fotos, de a una (server/fotos/cola.js)
 * @property {ReturnType<typeof crearIndexNow>} indexNow  avisa a los buscadores lo publicado (server/indexnow.js, E4.6)
 * @property {ReturnType<typeof import('../correo.js').crearCorreo> | null} correo  el correo del formulario de
 *   contacto, para el aviso del Inicio (GET /estado, E4.9); null: sin casilla
 */

/** @type {Definicion[]} */
const DEFINICIONES = [
  ...rutasDeSesion,
  ...rutasDeCuenta,
  ...rutasDeUsuarios,
  ...rutasDeEstado,
  ...rutasDeMuseo,
  ...rutasDeHorarios,
  ...rutasDeTarifas,
  ...rutasDeFotos,
  ...rutasDeContenidos,
  ...rutasDeMensajes,
]

/**
 * La tabla [{ metodo, ruta, rol }] (más si la ruta lleva cuerpo, si es multipart, si pasa con la temporal y su tope
 * de JSON propio), sin los manejadores.
 */
export const RUTAS = Object.freeze(
  DEFINICIONES.map(({ metodo, ruta, rol, cuerpo, conClaveTemporal, multipart, limiteJson }) =>
    Object.freeze({
      metodo,
      ruta,
      rol,
      conCuerpo: Boolean(cuerpo),
      multipart: Boolean(multipart),
      conClaveTemporal: Boolean(conClaveTemporal),
      limiteJson: limiteJson ?? null,
    }),
  ),
)

function validarId(req, res, next) {
  req.idRuta = parseId(req.params.id)
  if (req.idRuta == null) throw httpError(400, 'El id no es válido.')
  next()
}

function validarCuerpo(esquema) {
  return function cuerpoValido(req, res, next) {
    // Un ZodError va a server/errores.js: 400 con los campos.
    req.datos = esquema ? esquema.parse(req.body ?? {}) : {}
    next()
  }
}

/**
 * @param {{ config: object, sequelize: import('sequelize').Sequelize | null, registroTareas?: Contexto['registroTareas'],
 *   almacen?: Contexto['almacen'] | null }} deps
 *   registroTareas: cómo salieron las tareas diarias (server/tareas.js), para GET /estado; null: ninguna falló.
 *   almacen: el de las fotos, el mismo que sirve /fotos (server/app.js), así lo que se borra sale también de su caché;
 *   sin él, uno propio. correo: el del formulario de contacto (server/correo.js), para GET /estado.
 */
export function crearApi({ config, sequelize, registroTareas = null, almacen = null, correo = null }) {
  const api = express.Router()
  api.use(crearControlDeOrigen(config))
  api.use(exigirJson)
  // Las rutas con un tope propio leen su cuerpo antes que el común: express.json no vuelve a leer un cuerpo ya leído.
  for (const def of DEFINICIONES) {
    if (def.limiteJson) api[def.metodo.toLowerCase()](def.ruta, express.json({ limit: def.limiteJson }))
  }
  api.use(express.json({ limit: '100kb' }))

  if (!sequelize) {
    api.use((req, res) => {
      res.status(503).json({ error: 'El panel no está disponible: el servicio está sin base de datos.' })
    })
    return api
  }

  // El hash de relleno se calcula al armar la app y no en el primer ingreso con un correo que no existe. Con él se
  // carga argon2 (server/auth/claves.js), sin frenar el arranque: si el binario no carga, el log lo dice al arrancar
  // ("argon2_no_disponible"), el sitio público sigue y las rutas que usan contraseñas dan 503.
  hashDeRelleno().catch(() => {})
  const limites = crearLimites()
  const requiereSesion = crearRequiereSesion({ config, sequelize })
  const ctx = {
    config,
    sequelize,
    limites,
    registroTareas,
    almacen: almacen ?? crearAlmacen(sequelize),
    colaDeFotos: crearCola(),
    indexNow: crearIndexNow(config),
    correo,
  }

  for (const def of DEFINICIONES) {
    const cadena = []
    if (def.rol) {
      cadena.push(requiereSesion)
      if (!def.conClaveTemporal) cadena.push(exigirClaveCambiada)
      cadena.push(limites.porUsuario, requiereRol(def.rol))
    }
    if (def.antes) cadena.push(...def.antes(limites, ctx))
    if (def.ruta.includes(':id')) cadena.push(validarId)
    cadena.push(validarCuerpo(def.cuerpo))
    cadena.push((req, res) => def.manejador(req, res, ctx))
    api[def.metodo.toLowerCase()](def.ruta, ...cadena)
  }

  api.use((req, res) => {
    res.status(404).json({ error: 'No existe esa ruta de la API.' })
  })
  return api
}
