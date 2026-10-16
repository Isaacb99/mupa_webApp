// Precios de las tarifas (plan 3.2: pesos, sin centavos). Código puro, sin zod: lo puede usar también el sitio
// público (E4.3), que no importa compartido/esquemas/ (plan 6.2).

/**
 * Lee el precio como lo escribe una persona: "3000", "3.000", "$ 3.000". null si está vacío; NaN si no se entiende
 * (con centavos, letras…). Lo usa el panel antes de mandar: la API recibe un número entero.
 * @param {string} texto
 */
export function leerPrecio(texto) {
  const limpio = String(texto ?? '').replace(/[\s$]/g, '')
  if (limpio === '') return null
  if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) return Number(limpio.replaceAll('.', ''))
  if (/^\d+$/.test(limpio)) return Number(limpio)
  return Number.NaN
}

/** "$ 3.000": con el punto de los miles y sin centavos. Sin toLocaleString: igual en Node y en cualquier navegador. */
export function textoPrecio(precio) {
  return `$ ${String(precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}
