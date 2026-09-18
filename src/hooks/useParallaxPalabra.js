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
  return { paso: (ultima.getBoundingClientRect().top - primera.getBoundingClientRect().top) / tramos }
}

// Progreso 0..1 según dónde está el bloque en el viewport. Empieza cuando el bloque entra por el 80 % del alto (o desde
// donde está, si ya era visible al cargar) y dura max(0,6·alto, 480 px) de scroll, salvo que el final quede clavado en
// 0,15·alto: en móvil el titular ya está en pantalla al cargar y el efecto ocupa ~290 px.
function progreso({ top }, alto) {
  const inicio = Math.min(alto * 0.8, top + window.scrollY)
  const rango = Math.max(alto * 0.6, 480)
  const fin = Math.max(inicio - rango, alto * 0.15)
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
