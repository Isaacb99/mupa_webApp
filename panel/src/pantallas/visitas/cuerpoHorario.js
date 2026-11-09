// Lo que muestra y manda el horario semanal de Visitas (Horario.jsx), sin React: lo prueba server/pruebas/panel-api.test.js.
// - estadoDe(dias): el estado de la pantalla a partir de GET /horarios (o de la respuesta del PUT): un día abierto tiene
//   al menos una franja para escribir.
// - cuerpoDe(estado): lo que se manda en PUT /horarios: los 7 días, sin las franjas vacías y, de un día cerrado, ninguna.
// La nota de cada día ya no se ve en la pantalla (desde la Visitas del tablero "Web" de la diseñadora, 03/11/2026: V2 y
// V3 del desarrollador, el sitio no la muestra), pero viaja tal como llegó: PUT /horarios guarda los 7 días enteros, y
// una nota que no se mandara se guardaría vacía. Así lo que el museo cargó no se pierde (la columna sigue, sin borrar:
// C1, 09/11/2026). La nota general de los horarios (nota_horarios del museo) tampoco se ve ni se manda: PUT /museo es
// parcial y queda como estaba.

/** Una franja recién agregada, sin horas. */
export const FRANJA_VACIA = Object.freeze({ abre: '', cierra: '' })

/**
 * El estado de la pantalla: los 7 días, cada uno con sus franjas (un día abierto, al menos una para escribir) y su nota
 * tal como vino.
 * @param {{ dia: number, abierto: boolean, franjas: { abre: string, cierra: string }[], nota?: string | null }[]} dias
 */
export const estadoDe = (dias) =>
  dias.map((d) => ({
    dia: d.dia,
    abierto: d.abierto,
    franjas: d.franjas.length ? d.franjas.map((f) => ({ ...f })) : d.abierto ? [{ ...FRANJA_VACIA }] : [],
    nota: d.nota ?? null,
  }))

/**
 * Lo que se manda en PUT /horarios (y lo que se compara para saber si hay cambios sin guardar): sin las franjas vacías
 * y, de un día cerrado, ninguna; la nota, como vino.
 * @param {ReturnType<typeof estadoDe>} estado
 */
export const cuerpoDe = (estado) => ({
  dias: estado.map((d) => ({
    dia: d.dia,
    abierto: d.abierto,
    franjas: d.abierto ? d.franjas.filter((f) => f.abre || f.cierra) : [],
    nota: d.nota,
  })),
})
