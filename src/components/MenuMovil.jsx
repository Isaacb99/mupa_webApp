import { useEffect, useRef, useState } from 'react'
import { navegacion } from '../content.js'
import { detenerScrollSuave } from '../hooks/useScrollSuave.js'
import Logo from './Logo.jsx'
import { marcaActual, seccionesDelMenu } from './navegacion.js'
import { BOTON_NARANJA } from './tablero.js'

// Aspecto provisorio: el tablero "Web" de la diseñadora (02/11/2026) es solo de escritorio y la versión de celular la va
// a hacer ella (decisión D2); mientras tanto, este menú funciona igual que desde E4.1 con los ítems y la tipografía del
// tablero.
//
// El menú debajo de xl (plan 6.7): el botón "Menú" abre un <dialog> modal a pantalla completa con las mismas secciones
// que el menú ancho (las que existen: navegacion.js) y el botón naranja de entradas (si la compra externa está activa).
// Arriba, el logo y "Cerrar" en el mismo lugar que el logo y "Menú" del header (las mismas clases de fila).
// - showModal(): el resto de la página queda inerte (ni el foco ni el lector salen del menú). Esc lo cierra (es del
//   navegador) y el foco vuelve al botón, sin mover el scroll.
// - Mientras está abierto, la página de atrás no se mueve: Lenis parado (detenerScrollSuave: si no, la rueda la seguía
//   moviendo), overflow: hidden en html y overscroll-behavior: contain en el menú (el scroll del menú, si no entra en
//   la pantalla, no pasa a la página). data-lenis-prevent: con Lenis parado, la rueda sobre el menú lo scrollea a él.
//   Al cerrar todo vuelve como estaba, en el mismo lugar: el scroll no se toca, así los efectos de la Home siguen
//   donde quedaron.
// - Alto con svh (la regla de Safari de CLAUDE.md, "Compatibilidad entre navegadores"): el menú no cambia de alto con
//   la barra del navegador; lo que quede debajo lo tapa el ::backdrop, del mismo color.
// - Si la ventana se agranda hasta xl con el menú abierto, se cierra: ahí ya está el menú del header. También al volver
//   atrás a la página desde otra (bfcache).
// - Sin animación de apertura (diseño provisorio, sin efectos nuevos).
// - Si no hay nada que mostrar (ninguna sección y sin compra), no se dibuja el botón.

const ANCHO_MENU_COMPLETO = '(width >= 80rem)' // xl, el de Header.jsx

// La fila de arriba del menú: la misma del header (Header.jsx), así el logo y "Cerrar" quedan donde estaban el logo y
// "Menú".
const FILA = 'flex items-center justify-between gap-2 px-6 py-6 sm:gap-4 md:px-10 md:py-8 lg:h-32 lg:px-16 lg:py-0'

// Las secciones, grandes, en Roboto Mono blanca como el menú ancho; la de la página, subrayada en naranja. Con la letra
// del navegador al 200 % en el celular, una palabra larga no entraba en el ancho y el menú se desplazaba a lo ancho: se
// parte (con guion si el navegador sabe partir en castellano) en vez de desbordar (A11Y-06 de E4).
const ENLACE =
  'inline-block max-w-full rounded-sm py-2 font-mono text-[length:clamp(1.5rem,6vw,2.25rem)] leading-tight ' +
  'text-blanco hyphens-auto wrap-anywhere decoration-1 underline-offset-[0.2em] hover:underline ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco'
const ACTUAL = 'underline decoration-naranja decoration-2'

// El botón del header y el de cerrar: mismo tamaño y lugar (44 px de alto, el mínimo para el dedo).
const BOTON =
  'inline-flex h-11 items-center rounded-[0.25rem] border border-blanco/60 px-3 font-mono text-base leading-none ' +
  'text-blanco transition-colors hover:border-blanco focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-blanco'

/**
 * @param {{ ruta: string | null, compra: { url: string } | null, className?: string }} props
 *   ruta: la de la página (estado.ruta; null en la 404); compra: estado.museo.compra (solo viene si está activa)
 */
export default function MenuMovil({ ruta, compra, className = '' }) {
  const dialogo = useRef(null)
  const boton = useRef(null)
  const botonCerrar = useRef(null)
  // Deshace el bloqueo del scroll del abrir (null si el menú está cerrado).
  const desbloquear = useRef(null)
  const [abierto, setAbierto] = useState(false)
  const secciones = seccionesDelMenu()
  const conAlgo = secciones.length > 0 || Boolean(compra)

  const abrir = () => {
    const d = dialogo.current
    if (!d || d.open) return
    const html = document.documentElement
    const antes = html.style.overflow
    html.style.overflow = 'hidden'
    detenerScrollSuave(true)
    desbloquear.current = () => {
      html.style.overflow = antes
      detenerScrollSuave(false)
    }
    d.showModal()
    botonCerrar.current?.focus({ preventScroll: true })
    setAbierto(true)
  }

  useEffect(() => {
    const d = dialogo.current
    if (!d) return undefined
    const liberar = () => {
      desbloquear.current?.()
      desbloquear.current = null
    }
    // Con "Cerrar", con Esc o al ir a xl: el evento close llega en todos los casos.
    const alCerrar = () => {
      liberar()
      setAbierto(false)
      boton.current?.focus({ preventScroll: true })
    }
    const ancho = matchMedia(ANCHO_MENU_COMPLETO)
    const alCambiarAncho = () => {
      if (ancho.matches && d.open) d.close()
    }
    // Al volver atrás a esta página desde una del menú, el navegador la puede traer tal como quedó (bfcache), con el
    // menú abierto: se cierra, así se vuelve a la página.
    const alVolver = (e) => {
      if (e.persisted && d.open) d.close()
    }
    d.addEventListener('close', alCerrar)
    ancho.addEventListener('change', alCambiarAncho)
    window.addEventListener('pageshow', alVolver)
    return () => {
      d.removeEventListener('close', alCerrar)
      ancho.removeEventListener('change', alCambiarAncho)
      window.removeEventListener('pageshow', alVolver)
      if (d.open) d.close()
      liberar()
    }
  }, [conAlgo])

  if (!conAlgo) return null

  return (
    <div className={className}>
      <button
        ref={boton}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls="menu-movil"
        onClick={abrir}
        className={BOTON}
      >
        {navegacion.abrir}
      </button>

      {/* Sin clases de display en el <dialog>: cerrado lo oculta el navegador (display: none). */}
      <dialog
        ref={dialogo}
        id="menu-movil"
        aria-label={navegacion.abrir}
        data-lenis-prevent=""
        className="m-0 h-svh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-ink p-0 text-paper backdrop:bg-ink"
      >
        <div className="mx-auto flex min-h-full max-w-tablero flex-col">
          <div className={FILA}>
            <Logo />
            <button ref={botonCerrar} type="button" onClick={() => dialogo.current?.close()} className={`shrink-0 ${BOTON}`}>
              {navegacion.cerrar}
            </button>
          </div>

          <nav aria-label={navegacion.etiqueta} className="px-6 pt-8 pb-12 md:px-10 md:pt-12 lg:px-16">
            <ul className="flex flex-col gap-1">
              {secciones.map((s) => {
                const actual = marcaActual(ruta, s.ruta)
                return (
                  <li key={s.ruta}>
                    <a
                      href={s.ruta}
                      aria-current={actual}
                      className={actual ? `${ENLACE} ${ACTUAL}` : ENLACE}
                    >
                      {s.texto}
                    </a>
                  </li>
                )
              })}
            </ul>
            {compra ? (
              <a href={compra.url} data-entradas="" className={`mt-10 ${BOTON_NARANJA}`}>
                {navegacion.entradas}
              </a>
            ) : null}
          </nav>
        </div>
      </dialog>
    </div>
  )
}
