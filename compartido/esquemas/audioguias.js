// El esquema del manifiesto de la audioguía, audioguias/pistas.json (especificación de las audioguías, versión 2,
// sección 1.2): la versión de los códigos y el recorrido, espacios > estaciones, con dos versiones de audio por estación
// (la común y la de audiodescripción) que no se nombran: los archivos salen del número (A11: 07.mp3, 07-ad.mp3, 07.txt
// y 07-ad.txt). Con z de compartido/esquemas/zod.js (los mensajes en castellano). Lo usan el servidor
// (server/audioguia/pistas.js), el script de las URL de los QR (server/scripts/audioguia-urls.js), la herramienta de
// los QR y las pruebas: nunca el bundle público ni el panel.
//
// Lo que controla, además de la forma de cada campo:
// - espacio: un id del plano de la Home (IDS_DEL_PLANO, los de SALAS_DEL_PLANO de src/components/mapaSalas.js) o
//   recepcion, el único propio (A12). La Confitería, la Tienda y el Microcine no llevan pistas (decisión del
//   desarrollador, 19/11/2026): no se aceptan.
// - Solo recepcion se repite, y solo como primer y último grupo (01 Bienvenida y 35 Despedida).
// - numero: de 1 a 99, creciente en todo el recorrido (así tampoco se repite).
// - nombre: el del plano (home.mapa.espacios de src/content.js, el mismo índice que en SALAS_DEL_PLANO) o «Recepción».
//   src/content.js importa SVG y no se puede cargar en Node sin Vite: quien tiene los nombres los pasa
//   (nombresDelPlano); sin ellos, solo se exige que no esté vacío (la comparación con el plano va en layout.test.js,
//   que carga content.js con el Vite del proyecto, 9.3).
// - Los textos del museo van tal cual, con su caja (ni se recortan ni se cambian): solo se rechaza un texto vacío o con
//   espacios de más en las puntas, que es un error al copiarlo.
// - Los objetos son estrictos: una clave mal escrita («kpbs», «titulo_provisorio») es un error, no se ignora.
//
// Los ids del plano van escritos acá y no importados de src/components/mapaSalas.js (20/11/2026, al pasar el esquema
// de server/audioguia/esquema.js a compartido/): compartido/ es código puro que no depende de src/ (ningún otro archivo
// de acá lo hace), y mapaSalas.js trae además los 14 trazados del plano (unos 6 kB) que ni el servidor ni las
// herramientas usan. Lo limpio sería que mapaSalas.js tomara los ids de acá, pero eso cambia src/; mientras tanto,
// server/pruebas/audioguia.test.js compara IDS_DEL_PLANO con SALAS_DEL_PLANO, en el mismo orden: si la diseñadora
// cambia la planta y alguien suma o renombra una sala allá, la prueba falla y dice cuál.
import { z } from './zod.js'

/** Los ids de las 14 salas del plano de la Home, en el orden de SALAS_DEL_PLANO (src/components/mapaSalas.js). */
export const IDS_DEL_PLANO = Object.freeze([
  'confiteria',
  'sala-inmersiva',
  'tienda',
  'sala-8',
  'microcine',
  'sala-1',
  'sala-educativa',
  'sala-2',
  'sala-3',
  'sala-4',
  'sala-5',
  'jardin-triasico',
  'sala-6',
  'sala-7',
])
/** El único espacio que no está en el plano de la Home, con su nombre. */
export const ESPACIOS_FUERA_DEL_PLANO = Object.freeze({ recepcion: 'Recepción' })
/** Los espacios del plano que no llevan pistas. */
export const ESPACIOS_SIN_PISTAS = Object.freeze(['confiteria', 'tienda', 'microcine'])
/** Los ids que acepta el manifiesto, en el orden del plano y Recepción al final. */
export const ESPACIOS_DE_LA_AUDIOGUIA = Object.freeze([
  ...IDS_DEL_PLANO.filter((id) => !ESPACIOS_SIN_PISTAS.includes(id)),
  ...Object.keys(ESPACIOS_FUERA_DEL_PLANO),
])
/** El espacio que puede ir dos veces: al principio y al final del recorrido. */
export const ESPACIO_QUE_SE_REPITE = 'recepcion'
/** Los bitrates de los MP3: 64 kbps, salvo una versión que declara kbps (o kbpsAd) 80 por tener mucha música. */
export const KBPS_COMUN = 64
export const KBPS_CON_MUSICA = 80
/** El número más alto de una estación (dos cifras en el nombre del archivo). */
export const NUMERO_MAX = 99

const textoDelMuseo = (max, que) =>
  z
    .string({ error: `Falta ${que}.` })
    .min(1, `Falta ${que}.`)
    .max(max, `${que[0].toUpperCase()}${que.slice(1)}: como mucho ${max} caracteres.`)
    .refine((t) => t.trim() === t && t.trim() !== '', `${que[0].toUpperCase()}${que.slice(1)}: sin espacios en las puntas.`)

const voz = z.enum(['masculina', 'femenina'], { error: 'La voz es masculina o femenina.' })
const conMusica = z.literal(KBPS_CON_MUSICA, { error: `kbps solo puede ser ${KBPS_CON_MUSICA} (sin él, ${KBPS_COMUN}).` })

const esquemaEstacion = z.strictObject({
  numero: z.int({ error: 'El número es un entero.' }).min(1, 'El número va de 1 a 99.').max(NUMERO_MAX, 'El número va de 1 a 99.'),
  titulo: textoDelMuseo(120, 'el título de la estación'),
  tituloProvisorio: z.literal(true, { error: 'tituloProvisorio solo puede ser true (si no es provisorio, no va).' }).optional(),
  voz: voz.optional(),
  vozAd: voz.optional(),
  kbps: conMusica.optional(),
  kbpsAd: conMusica.optional(),
})

const esquemaGrupo = z.strictObject({
  espacio: z.string({ error: 'Falta el id del espacio.' }),
  nombre: textoDelMuseo(60, 'el nombre del espacio'),
  nombreGuion: textoDelMuseo(80, 'el rótulo del espacio en el guion'),
  titulo: textoDelMuseo(120, 'el título del espacio').optional(),
  lema: textoDelMuseo(160, 'el lema del espacio').optional(),
  estaciones: z.array(esquemaEstacion).min(1, 'Un espacio lleva al menos una estación.'),
})

/**
 * El esquema del manifiesto.
 * @param {{ nombresDelPlano?: Record<string, string> }} [opciones]  el nombre de cada id del plano (de
 *   home.mapa.espacios): con él, el nombre de cada grupo tiene que ser igual
 */
export function crearEsquemaPistas({ nombresDelPlano } = {}) {
  return z
    .strictObject({
      version: z.int({ error: 'La versión es un entero.' }).min(1, 'La versión va de 1 a 999.').max(999, 'La versión va de 1 a 999.'),
      recorrido: z.array(esquemaGrupo).min(1, 'El recorrido lleva al menos un espacio.'),
    })
    .superRefine(({ recorrido }, ctx) => {
      const problema = (path, message) => ctx.addIssue({ code: 'custom', path: ['recorrido', ...path], message })
      const vistos = new Set()
      let anterior = 0
      recorrido.forEach((grupo, i) => {
        const { espacio } = grupo
        if (!ESPACIOS_DE_LA_AUDIOGUIA.includes(espacio)) {
          problema([i, 'espacio'], ESPACIOS_SIN_PISTAS.includes(espacio)
            ? `${espacio} no lleva pistas.`
            : `${espacio} no es un espacio de la audioguía.`)
        } else if (espacio === ESPACIO_QUE_SE_REPITE) {
          if (i !== 0 && i !== recorrido.length - 1) problema([i, 'espacio'], 'Recepción va solo al principio o al final del recorrido.')
        } else if (vistos.has(espacio)) {
          problema([i, 'espacio'], `${espacio} está dos veces: solo Recepción se repite.`)
        }
        vistos.add(espacio)

        // Con Object.hasOwn: un id como «constructor» o «__proto__» no trae un nombre heredado de Object.
        const fueraDelPlano = Object.hasOwn(ESPACIOS_FUERA_DEL_PLANO, espacio)
        const esperado = fueraDelPlano
          ? ESPACIOS_FUERA_DEL_PLANO[espacio]
          : nombresDelPlano && Object.hasOwn(nombresDelPlano, espacio) ? nombresDelPlano[espacio] : undefined
        if (esperado !== undefined && grupo.nombre !== esperado) {
          problema([i, 'nombre'], `El nombre de ${espacio} es «${esperado}»${fueraDelPlano ? '' : ', como en el plano'}.`)
        }

        grupo.estaciones.forEach((estacion, j) => {
          if (estacion.numero <= anterior) problema([i, 'estaciones', j, 'numero'], `La estación ${estacion.numero} va después de la ${anterior}: los números crecen en todo el recorrido.`)
          anterior = Math.max(anterior, estacion.numero)
        })
      })
    })
}

/** El esquema sin los nombres del plano. */
export const esquemaPistas = crearEsquemaPistas()

/**
 * Valida el manifiesto ya leído.
 * @param {unknown} datos
 * @param {{ nombresDelPlano?: Record<string, string> }} [opciones]
 * @returns {{ ok: true, manifiesto: z.infer<typeof esquemaPistas> } | { ok: false, problemas: string[] }}
 */
export function validarManifiesto(datos, opciones) {
  const esquema = opciones?.nombresDelPlano ? crearEsquemaPistas(opciones) : esquemaPistas
  const r = esquema.safeParse(datos)
  if (r.success) return { ok: true, manifiesto: r.data }
  return { ok: false, problemas: r.error.issues.map((issue) => `${issue.path.join('.') || 'pistas.json'}: ${issue.message}`) }
}

/** El número de una estación en dos cifras, como en el nombre de sus archivos: 7 → '07'. */
export const numeroEnDosCifras = (numero) => String(numero).padStart(2, '0')
