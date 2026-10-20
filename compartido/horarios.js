// El horario semanal del museo como lo lee una persona (E4.1): el resumen del pie ("Martes a domingo: 9:00 a 13:00 y
// 17:00 a 21:00", "Lunes: cerrado") y los nombres de los días. Código puro, SIN zod: lo usa el sitio público, que no
// importa compartido/esquemas/ (plan 6.2); el esquema del PUT (compartido/esquemas/horarios.js) toma de acá los días.
//
// La entrada es estado.museo.horarios (server/museo.js): [{ dia, abierto, franjas: [{ abre, cierra }], nota }], con
// dia ISO (1 = lunes) y las horas "HH:MM". Lo que no es un día del 1 al 7 se ignora, y un día que falta no se da por
// cerrado: no se sabe.
//
// Si no hay ningún día abierto, el resumen está vacío y el pie no dibuja el horario. Es lo que deja la migración
// (los 7 días cerrados: el horario sin cargar, que el Inicio del panel pide en "Para completar"), así que decir
// "cerrado todos los días" sería inventar un dato; un cierre temporal va en el aviso general (Visitas).

/** Los días de la semana, ISO: DIAS[0] es el lunes (dia 1). */
export const DIAS = Object.freeze(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'])

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/

/** "09:00" -> "9:00" (sin el cero de adelante de la hora). Lo que no es una hora, tal cual. */
export function textoHora(hora) {
  const m = HORA.exec(String(hora))
  return m ? `${Number(m[1])}:${m[2]}` : String(hora)
}

/** Une una lista como se dice: ["a"] -> "a", ["a", "b"] -> "a y b", ["a", "b", "c"] -> "a, b y c". */
export function unirConY(partes) {
  if (partes.length <= 1) return partes.join('')
  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
}

/**
 * Las franjas de un día: "9:00 a 13:00 y 17:00 a 21:00", ordenadas por la hora de apertura.
 * @param {{ abre: string, cierra: string }[]} franjas
 */
export function textoFranjas(franjas) {
  return unirConY(
    [...franjas].sort((a, b) => (a.abre < b.abre ? -1 : 1)).map((f) => `${textoHora(f.abre)} a ${textoHora(f.cierra)}`),
  )
}

/**
 * Los días de una lista (números ISO), como se dicen: los seguidos de a tres o más como "martes a viernes", los demás
 * uno por uno ("lunes, miércoles y viernes"; "sábado y domingo"); los siete, "todos los días". Con la primera letra en
 * mayúscula. La semana va de lunes a domingo: el domingo y el lunes no se cuentan como seguidos.
 * @param {number[]} dias
 */
export function textoDias(dias) {
  const orden = [...new Set(dias)].filter((d) => Number.isInteger(d) && d >= 1 && d <= 7).sort((a, b) => a - b)
  if (orden.length === 0) return ''
  if (orden.length === 7) return 'Todos los días'
  const tramos = []
  for (const d of orden) {
    const ultimo = tramos.at(-1)
    if (ultimo && d === ultimo.hasta + 1) ultimo.hasta = d
    else tramos.push({ desde: d, hasta: d })
  }
  const nombre = (d) => DIAS[d - 1].toLowerCase()
  const partes = tramos.flatMap(({ desde, hasta }) => {
    if (hasta - desde >= 2) return [`${nombre(desde)} a ${nombre(hasta)}`]
    return desde === hasta ? [nombre(desde)] : [nombre(desde), nombre(hasta)]
  })
  const texto = unirConY(partes)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Los días que se pueden leer: del 1 al 7, sin repetir (si viniera dos veces, el primero), con sus franjas válidas.
function diasLegibles(horarios) {
  const vistos = new Map()
  for (const h of Array.isArray(horarios) ? horarios : []) {
    if (!h || !Number.isInteger(h.dia) || h.dia < 1 || h.dia > 7 || vistos.has(h.dia)) continue
    const franjas = (Array.isArray(h.franjas) ? h.franjas : []).filter(
      (f) => f && HORA.test(f.abre) && HORA.test(f.cierra) && f.abre < f.cierra,
    )
    const nota = typeof h.nota === 'string' && h.nota.trim() !== '' ? h.nota.trim() : null
    vistos.set(h.dia, { dia: h.dia, abierto: Boolean(h.abierto) && franjas.length > 0, franjas, nota })
  }
  return [...vistos.values()].sort((a, b) => a.dia - b.dia)
}

/**
 * El horario resumido: los días con las mismas franjas van juntos, en el orden de la semana, y los cerrados al final,
 * en una sola línea. Las notas de los días ("Visitas guiadas a las 11"), aparte, juntas si dicen lo mismo.
 * Sin ningún día abierto devuelve las dos listas vacías (ver el encabezado).
 * @param {{ dia: number, abierto: boolean, franjas: { abre: string, cierra: string }[], nota?: string | null }[]} horarios
 * @returns {{ lineas: { dias: string, horas: string | null }[], notas: { dias: string, texto: string }[] }}
 *   horas: las franjas como texto, o null si esos días cierra
 */
export function resumirHorario(horarios) {
  const dias = diasLegibles(horarios)
  if (!dias.some((d) => d.abierto)) return { lineas: [], notas: [] }

  // Los días abiertos, agrupados por sus franjas (en el orden en que aparece cada grupo en la semana).
  const grupos = new Map()
  for (const d of dias.filter((x) => x.abierto)) {
    const horas = textoFranjas(d.franjas)
    if (!grupos.has(horas)) grupos.set(horas, [])
    grupos.get(horas).push(d.dia)
  }
  const lineas = [...grupos].map(([horas, lista]) => ({ dias: textoDias(lista), horas }))
  const cerrados = dias.filter((d) => !d.abierto).map((d) => d.dia)
  if (cerrados.length) lineas.push({ dias: textoDias(cerrados), horas: null })

  const porNota = new Map()
  for (const d of dias.filter((x) => x.nota)) {
    if (!porNota.has(d.nota)) porNota.set(d.nota, [])
    porNota.get(d.nota).push(d.dia)
  }
  const notas = [...porNota].map(([texto, lista]) => ({ dias: textoDias(lista), texto }))
  return { lineas, notas }
}
