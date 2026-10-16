// La sesión del panel: quién entró ({ usuario: { id, nombre, email, rol }, debeCambiarClave }) o null. Vive en un
// almacén chico fuera de React (sin Context), porque la leen los loaders de las rutas (para redirigir antes de dibujar
// nada), el diálogo de reingreso y las pantallas. Nada va a localStorage ni a sessionStorage: se comparten con las
// páginas públicas del mismo origen (plan 9); la sesión de verdad es la cookie, que el navegador no deja leer.
//
// - asegurarSesion(): la primera vez pide GET /sesion (sin diálogo de reingreso: un 401 acá es "no hay sesión") y
//   después devuelve lo que ya sabe. La usan los loaders (rutas.jsx).
// - entrar(email, clave) y salir(): POST y DELETE /sesion, y actualizan el almacén.
// - useSesion(): la sesión en un componente (se vuelve a dibujar cuando cambia). Si terminó sin salir (el "Ahora no"
//   del diálogo de reingreso), la última que hubo: la pantalla sigue siendo de esa persona (la barra no pierde "Mi
//   cuenta" ni Usuarios, y Usuarios sigue sabiendo cuál es la ficha propia) hasta que la pantalla siguiente lleve a
//   Ingresar. Para decidir algo (los loaders), sesionActual() o asegurarSesion(), que sí dan null.
// - sesionConocida(): lo mismo fuera de React (el diálogo de reingreso: ¿entró la misma persona?).
// - terminarSesion(): la sesión terminó y la persona se fue (Salir, "Cerrar sesión en todos lados"): sin última.
// - ponerAviso / leerAviso / borrarAviso: un mensaje de una sola vez para la pantalla siguiente ("Cerraste la
//   sesión", "Tu contraseña nueva quedó guardada"). La pantalla lo lee al montarse y lo borra en un efecto.
import { useSyncExternalStore } from 'react'
import { api } from './api.js'

const SIN_CARGAR = Symbol('sin cargar')
/** @type {typeof SIN_CARGAR | null | { usuario: { id: number, nombre: string, email: string, rol: 'admin' | 'editor' }, debeCambiarClave: boolean }} */
let actual = SIN_CARGAR
/** La última sesión que hubo (ver useSesion). */
let anterior = null
/** @type {Promise<any> | null} */
let cargando = null
const oyentes = new Set()

function suscribir(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** La sesión que se conoce ahora (null si no hay o todavía no se cargó). */
export function sesionActual() {
  return actual === SIN_CARGAR ? null : actual
}

export function ponerSesion(sesion) {
  actual = sesion
  if (sesion) anterior = sesion
  cargando = null
  for (const oyente of oyentes) oyente()
}

/** Cambia algo de la sesión que se conoce (el nombre después de Mi cuenta, debeCambiarClave después de un 403). */
export function actualizarSesion(cambios) {
  const s = sesionActual()
  if (s) ponerSesion({ ...s, ...cambios, usuario: { ...s.usuario, ...cambios.usuario } })
}

/** La sesión, o la última que hubo si terminó sin salir (ver arriba). */
export const sesionConocida = () => sesionActual() ?? anterior

/** @returns {ReturnType<typeof sesionActual>} */
export function useSesion() {
  return useSyncExternalStore(suscribir, sesionConocida)
}

/** Ya no hay sesión ni última sesión (Salir, "Cerrar sesión en todos lados"). */
export function terminarSesion() {
  anterior = null
  ponerSesion(null)
}

/** La sesión, pidiéndola al servidor la primera vez. Un 401 es "no hay sesión" (null); otro error se tira. */
export function asegurarSesion() {
  if (actual !== SIN_CARGAR) return Promise.resolve(actual)
  cargando ??= api.get('/sesion', { sinReingreso: true }).then(
    (datos) => {
      ponerSesion(datos)
      return datos
    },
    (err) => {
      cargando = null
      if (err?.status === 401) {
        ponerSesion(null)
        return null
      }
      throw err
    },
  )
  return cargando
}

export async function entrar(email, clave) {
  const datos = await api.post('/sesion', { email, clave }, { sinReingreso: true })
  ponerSesion(datos)
  return datos
}

export async function salir() {
  await api.delete('/sesion', undefined, { sinReingreso: true })
  terminarSesion()
}

let aviso = null
export const ponerAviso = (texto) => {
  aviso = texto
}
export const leerAviso = () => aviso
export const borrarAviso = () => {
  aviso = null
}
