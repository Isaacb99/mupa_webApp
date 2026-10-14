// La API del panel, en /administracion/api (plan 2.4, punto 5, y 4). Una sola tabla de rutas: de ella sale el router
// y la recorre server/pruebas/permisos.test.js, así no puede haber una ruta sin sesión, sin rol o sin CSRF.
//
// Para todo pedido, en este orden:
//   1. CSRF por origen (Sec-Fetch-Site / Origin) en lo que no es GET, HEAD ni OPTIONS: 403;
//   2. Content-Type: application/json en POST, PUT, PATCH y DELETE con cuerpo: 415;
//   3. express.json con tope de 100 kB (413; un JSON roto, 400);
// y por ruta:
//   4. con rol: requiereSesion (401), la contraseña temporal ya cambiada salvo las rutas que la permiten (403 con
//      debeCambiarClave), 300 pedidos por minuto por usuario (429) y el rol (403);
//   5. los límites propios de la ruta (el inicio de sesión: por IP y por correo + IP);
//   6. el :id (400) y el cuerpo con su esquema zod (400 con los campos), ANTES de que la ruta toque la base;
//   7. la ruta, que recibe solo lo que devolvió el esquema (req.datos).
// Lo que no está en la tabla: 404 en JSON. Sin base (SIN_BASE o sin DATABASE_URL): 503 en JSON. Sin argon2 (el
// binario nativo no cargó): 503 en JSON en las rutas que usan contraseñas.
// Rol "editor" = cualquier cuenta; "admin" = solo admins; null = sin sesión (entrar y salir).
// Las rutas de museo, horarios y tarifas llegan con E2; contenidos y fotos con E3; mensajes y estado con E4.9/E2.2.
import express from 'express'
import { hashDeRelleno } from '../auth/claves.js'
import { crearRequiereSesion, exigirClaveCambiada, requiereRol } from '../auth/middleware.js'
import { httpError } from '../errores.js'
import { crearLimites } from '../limites.js'
import { crearControlDeOrigen, exigirJson } from '../seguridad.js'
import { rutasDeCuenta } from './cuenta.js'
import { parseId } from './entrada.js'
import { rutasDeSesion } from './sesion.js'
import { rutasDeUsuarios } from './usuarios.js'

/**
 * @typedef {object} Definicion
 * @property {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} metodo
 * @property {string} ruta  relativa a /administracion/api
 * @property {'editor'|'admin'|null} rol
 * @property {boolean} [conClaveTemporal]  pasa aunque la contraseña temporal no se haya cambiado
 * @property {import('zod').ZodType} [cuerpo]
 * @property {(limites: ReturnType<typeof crearLimites>) => Function[]} [antes]
 * @property {(req, res, ctx: { config: object, sequelize: import('sequelize').Sequelize, limites: ReturnType<typeof crearLimites> }) => unknown} manejador
 */

/** @type {Definicion[]} */
const DEFINICIONES = [...rutasDeSesion, ...rutasDeCuenta, ...rutasDeUsuarios]

/** La tabla [{ metodo, ruta, rol }] (más si la ruta lleva cuerpo y si pasa con la temporal), sin los manejadores. */
export const RUTAS = Object.freeze(
  DEFINICIONES.map(({ metodo, ruta, rol, cuerpo, conClaveTemporal }) =>
    Object.freeze({ metodo, ruta, rol, conCuerpo: Boolean(cuerpo), conClaveTemporal: Boolean(conClaveTemporal) }),
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
 * @param {{ config: object, sequelize: import('sequelize').Sequelize | null }} deps
 */
export function crearApi({ config, sequelize }) {
  const api = express.Router()
  api.use(crearControlDeOrigen(config))
  api.use(exigirJson)
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
  const ctx = { config, sequelize, limites }

  for (const def of DEFINICIONES) {
    const cadena = []
    if (def.rol) {
      cadena.push(requiereSesion)
      if (!def.conClaveTemporal) cadena.push(exigirClaveCambiada)
      cadena.push(limites.porUsuario, requiereRol(def.rol))
    }
    if (def.antes) cadena.push(...def.antes(limites))
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
