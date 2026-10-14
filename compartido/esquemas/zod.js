// zod con los mensajes en castellano (plan 4.1: las respuestas de error van en castellano). Todos los esquemas de
// compartido/esquemas/ importan z de acá, así el idioma se configura una sola vez, en el servidor y en el panel.
// Los campos que ve una persona llevan su propio mensaje; el del idioma queda para lo que no debería pasar desde el
// panel (un tipo equivocado, una clave que falta). Solo servidor y panel: nunca en el bundle público (plan 1).
// Código puro: sin APIs de Node ni del DOM.
import { z } from 'zod'

z.config(z.locales.es())

export { z }
