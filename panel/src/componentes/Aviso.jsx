// Avisos del panel (plan 5.6, WCAG 4.1.3).
// - tipo 'ok' ("Guardado"): role="status". La región está SIEMPRE en la página (vacía si no hay mensaje), porque los
//   lectores de pantalla anuncian los cambios de una región viva que ya existía, no una que aparece con el texto.
// - tipo 'error': role="alert" (se anuncia al aparecer). Para los errores de un formulario, ResumenErrores.
// - tipo 'atencion' e 'info': sin rol, para lo que ya está en la página al llegar (los avisos del Inicio).
// titulo es opcional (una línea en negrita arriba del texto).
// - AvisoDeLlegada: el aviso de una sola vez con el que llega una pantalla (abajo).
import { useEffect, useState } from 'react'

const ESTILOS = {
  ok: 'border-ok bg-ok-fondo text-ok',
  error: 'border-error bg-error-fondo text-error',
  atencion: 'border-atencion bg-atencion-fondo text-atencion',
  info: 'border-linea bg-fondo-2 text-tinta',
}

/**
 * @param {{ tipo?: 'ok' | 'error' | 'atencion' | 'info', titulo?: import('react').ReactNode, children?: import('react').ReactNode, className?: string }} props
 */
export function Aviso({ tipo = 'info', titulo, children, className = '' }) {
  const hay = Boolean(children || titulo)
  const caja = hay ? (
    <div className={`rounded-md border-l-4 px-4 py-3 wrap-anywhere ${ESTILOS[tipo] ?? ESTILOS.info} ${className}`}>
      {titulo ? <p className="font-semibold">{titulo}</p> : null}
      {typeof children === 'string' ? <p>{children}</p> : children}
    </div>
  ) : null
  if (tipo === 'ok') return <div role="status">{caja}</div>
  if (!hay) return null
  if (tipo === 'error') return <div role="alert">{caja}</div>
  return caja
}

/**
 * Un aviso de una sola vez que llega con la pantalla ("Cerraste la sesión.", "Listo: tu contraseña nueva quedó
 * guardada."): se ve desde el primer dibujo, pero para el lector va en una región role="status" que está vacía al
 * montarse y recibe el texto un momento después. Una región que aparece ya con su texto no se anuncia, y el foco va
 * al h1 de la pantalla nueva: sin esto, se oía "Ingresar, encabezado" sin la confirmación.
 * @param {{ texto: string | null, className?: string }} props
 */
export function AvisoDeLlegada({ texto, className = '' }) {
  const [anunciado, setAnunciado] = useState('')
  useEffect(() => {
    if (!texto) return undefined
    const t = setTimeout(() => setAnunciado(texto), 250)
    return () => clearTimeout(t)
  }, [texto])
  return (
    <>
      {texto ? (
        <div aria-hidden="true" className={`rounded-md border-l-4 px-4 py-3 ${ESTILOS.ok} ${className}`}>
          <p>{texto}</p>
        </div>
      ) : null}
      <p role="status" className="sr-only">
        {anunciado}
      </p>
    </>
  )
}
