// Lugar de una pantalla que todavía no está (las de E2.3 a E2.5 ya llegaron; sirve para las secciones de E3 y E4.9,
// Novedades, Exposiciones y Mensajes, si se suman a la barra antes que su pantalla): la sección figura en la barra y
// su ruta existe (con su rol), así la barra no cambia de lugar cuando llega. Se reemplaza en rutas.jsx por la
// pantalla de verdad. Hoy no la usa ninguna ruta.
import { Link } from 'react-router'
import { Encabezado } from '../componentes/Encabezado.jsx'

/** @param {{ titulo: string, children?: import('react').ReactNode }} props */
export default function Pendiente({ titulo, children }) {
  return (
    <>
      <Encabezado titulo={titulo} />
      <p>Esta pantalla todavía no está lista.</p>
      {children}
      <p className="mt-6">
        <Link to="/" className="inline-flex min-h-11 items-center">
          Volver al Inicio
        </Link>
      </p>
    </>
  )
}
