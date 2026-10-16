// "Última edición: <persona>, <fecha>" (plan 4.8), debajo del título de una ficha. Sin edición desde el panel (la
// fila recién creada por la migración), no muestra nada.
import { fechaHora } from '../formato.js'

/** @param {{ edicion: { nombre: string | null, fecha: string } | null }} props */
export function UltimaEdicion({ edicion }) {
  if (!edicion) return null
  return (
    <p className="-mt-4 text-sm text-tenue">
      Última edición: {edicion.nombre ?? 'una cuenta que ya no existe'}, {fechaHora(edicion.fecha)}.
    </p>
  )
}
