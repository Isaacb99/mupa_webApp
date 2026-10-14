// Inicio de sesión (plan 4.2): POST /administracion/api/sesion con { email, clave }.
// El correo pasa a minúsculas; no se exige que tenga forma de correo (un error de formato no le dice nada a quien
// prueba cuentas, y la respuesta es la misma que con una clave incorrecta). La clave, tal cual llegó, hasta 256: el
// mismo tope que el cambio de contraseña (CLAVE_MAX_CRUDA), así toda contraseña que se pudo guardar deja entrar.
import { CLAVE_MAX_CRUDA } from './cuenta.js'
import { z } from './zod.js'

export const esquemaIngreso = z.object({
  email: z
    .string({ error: 'Escribí tu correo.' })
    .trim()
    .toLowerCase()
    .min(1, { error: 'Escribí tu correo.' })
    .max(254, { error: 'El correo es demasiado largo.' }),
  clave: z
    .string({ error: 'Escribí tu contraseña.' })
    .min(1, { error: 'Escribí tu contraseña.' })
    .max(CLAVE_MAX_CRUDA, { error: 'La contraseña es demasiado larga.' }),
})
