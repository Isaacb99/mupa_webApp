// Usuarios del panel (plan 4.3 y 4.4): alta y cambios que hace un admin. Solo servidor y panel.
// Lo que no está en el esquema se descarta (z.object quita las claves de más): a Sequelize llega solo lo validado.
import { z } from './zod.js'

export const ROLES = ['admin', 'editor']

/**
 * Nombre de una persona: 1 a 100 caracteres, sin saltos de línea ni caracteres de control, y sin surrogates sueltos
 * (\p{Cs}: Postgres los guardaría como U+FFFD y la respuesta no diría lo que quedó) ni U+FFFD (lo que dejan los bytes
 * que no eran UTF-8). Ese chequeo va primero: la API muestra el primer problema de cada campo.
 */
export const nombrePersona = z
  .string({ error: 'Escribí el nombre.' })
  .trim()
  .min(1, { error: 'Escribí el nombre.' })
  .max(100, { error: 'El nombre puede tener hasta 100 caracteres.' })
  .regex(/^[^\p{Cs}�]*$/u, { error: 'El nombre tiene caracteres que no se pudieron leer. Escribilo de nuevo.' })
  .regex(/^[^\p{Cc}\p{Cf}\p{Zl}\p{Zp}]*$/u, { error: 'El nombre no puede tener saltos de línea ni caracteres especiales.' })

/** El correo es el usuario (no hace falta que reciba mails, plan 4.4): en minúsculas, como lo exige la tabla. */
export const correo = z
  .string({ error: 'Escribí el correo.' })
  .trim()
  .toLowerCase()
  .max(254, { error: 'El correo es demasiado largo.' })
  .email({ error: 'Escribí un correo válido, por ejemplo nombre@dominio.com.' })

export const rol = z.enum(ROLES, { error: 'El rol tiene que ser admin o editor.' })

/** POST /usuarios: { nombre, email, rol }. La contraseña temporal la genera el servidor. */
export const esquemaAltaUsuario = z.object({
  nombre: nombrePersona,
  email: correo,
  rol,
})

/** PATCH /usuarios/:id: { nombre?, rol?, activo? }, al menos uno. */
export const esquemaCambioUsuario = z
  .object({
    nombre: nombrePersona.optional(),
    rol: rol.optional(),
    activo: z.boolean({ error: 'activo tiene que ser true o false.' }).optional(),
  })
  .refine((v) => v.nombre !== undefined || v.rol !== undefined || v.activo !== undefined, {
    error: 'No hay nada para cambiar.',
  })
