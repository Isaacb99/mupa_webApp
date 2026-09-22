// Medidas y progreso de un bloque que se engancha (sticky) mientras dura un efecto por pasos, compartidos por los
// paneles de Identidad y el collage. El bloque exterior mide la pantalla fija más el recorrido; el hijo fijo (sticky,
// top de CSS) queda enganchado mientras el scroll recorre la diferencia.

// Si el hijo no está enganchado (variante apilado: reduced-motion o pantalla baja), no hay recorrido.
export function medirEnganche(fijo) {
  const estilo = getComputedStyle(fijo)
  if (estilo.position !== 'sticky') return { enganchado: false }
  return { enganchado: true, topFijo: parseFloat(estilo.top) || 0, altoFijo: fijo.offsetHeight }
}

// Progreso 0..1 mientras el bloque está enganchado: 0 cuando se engancha, 1 cuando se suelta.
export function progresoEnganche({ top, height }, alto, { enganchado, topFijo, altoFijo }) {
  const recorrido = height - altoFijo
  if (!enganchado || recorrido <= 0) return 0
  return Math.min(Math.max((topFijo - top) / recorrido, 0), 1)
}
