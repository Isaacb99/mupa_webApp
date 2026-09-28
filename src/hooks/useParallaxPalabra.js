import { useMemo } from 'react'
import useScrollPorPasos from './useScrollPorPasos.js'

// Lleva la palabra del titular de fila en fila, junto a las líneas fijas, según el scroll (motor: useScrollPorPasos).
//
// refs.palabra  -> el span que se mueve (vive en la primera fila).
// refs.primera  -> la línea fija de la primera fila (referencia de arriba).
// refs.ultima   -> la línea fija de la última fila (referencia de abajo).
// refs.bloque   -> el contenedor del titular (define cuándo empieza y termina el recorrido).
// refs tiene que ser un objeto estable (useMemo): es dependencia del efecto.

// Paso = distancia entre dos filas (la palabra baja).
function medir({ primera, ultima }, tramos) {
  return { paso: (ultima.getBoundingClientRect().top - primera.getBoundingClientRect().top) / tramos, tramos }
}

// Pantallas chicas (debajo de lg, donde se scrollea con el dedo): el recorrido se estira un 10 %.
const CHICA = typeof window === 'undefined' ? null : window.matchMedia('(width < 64rem)')
const ESTIRAR_CHICA = 1.1

// Progreso 0..1 según dónde está el bloque en el viewport. Empieza cuando el bloque entra por el 80 % del alto (o desde
// donde está, si ya era visible al cargar) y dura max(0,3·alto, 240 px) por tramo, salvo que el final quede clavado en
// 0,15·alto: en móvil el titular ya está en pantalla al cargar y el efecto ocupaba ~220 px. Debajo de lg ese recorrido
// se estira un 10 % corriendo el final (a 375x812, ~245 px): el desarrollador pidió el 22/09/2026 un poco más de
// recorrido por paso con el dedo (+25 %) y ese mismo día un punto medio, porque un usuario de prueba lo sintió trabado.
// El recorrido es por tramo desde el V03 (25/09/2026), que dejó dos filas en vez de tres: así cada fila cuesta el mismo
// scroll que antes (eran max(0,6·alto, 480 px) para los dos tramos) y la palabra llega a "hecho por" en la mitad de
// scroll que antes, que es lo que pidió el desarrollador para que el párrafo se active ahí.
// Debajo de lg el tramo es la mitad: ahí el titular está arriba de todo y el final quedaba clavado en 0,15·alto, así
// que con tres filas los dos viajes entraban en 246 px (123 cada uno) y con dos filas el único viaje se quedaba con los
// 246; el desarrollador sintió el scroll "menos sutil" y se volvió al ritmo de antes (~134 px por viaje, +10 %).
function progreso({ top }, alto, { tramos = 1 }) {
  const inicio = Math.min(alto * 0.8, top + window.scrollY)
  const rango = (CHICA?.matches ? Math.max(alto * 0.15, 120) : Math.max(alto * 0.3, 240)) * tramos
  let fin = Math.max(inicio - rango, alto * 0.15)
  if (CHICA?.matches) fin = inicio - (inicio - fin) * ESTIRAR_CHICA
  if (inicio <= fin) return 1
  return Math.min(Math.max((inicio - top) / (inicio - fin), 0), 1)
}

export default function useParallaxPalabra(refs, { paradas = 3, activo = true } = {}) {
  const nodos = useMemo(
    () => ({ elemento: refs.palabra, bloque: refs.bloque, primera: refs.primera, ultima: refs.ultima }),
    [refs],
  )
  useScrollPorPasos(nodos, { pasos: paradas, medir, progreso, eje: 'y', activo })
}
