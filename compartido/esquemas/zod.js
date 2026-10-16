// zod con los mensajes en castellano (plan 4.1: las respuestas de error van en castellano). Todos los esquemas de
// compartido/esquemas/ importan z de acá, así el idioma se configura una sola vez, en el servidor y en el panel.
// Los campos que ve una persona llevan su propio mensaje; el del idioma queda para lo que no debería pasar desde el
// panel (un tipo equivocado, una clave que falta). Solo servidor y panel: nunca en el bundle público (plan 1).
// Sin JIT (jitless): si no, al definir el primer z.object zod prueba si puede compilar código con new Function, y en
// el panel la CSP (script-src 'self', sin 'unsafe-eval') lo bloquea y el navegador lo informa como una violación,
// aunque zod la ataje (E2.1, 14/10/2026). Los esquemas son chicos: en el servidor la diferencia no se nota. Tiene que
// ir acá, antes de que se defina cualquier esquema.
// Código puro: sin APIs de Node ni del DOM.
import { z } from 'zod'

z.config({ ...z.locales.es(), jitless: true })

export { z }
