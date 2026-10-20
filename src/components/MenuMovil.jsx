import { useEffect, useRef, useState } from 'react'
import { navegacion } from '../content.js'
import { detenerScrollSuave } from '../hooks/useScrollSuave.js'
import Logo from './Logo.jsx'
import { marcaActual, textoCompra } from './Menu.jsx'

// Aspecto provisorio hasta el diseño del menú del celular (E6.3): solo clases y orden; los datos y la lógica no cambian.
//
// El menú debajo de xl (plan 6.7): el botón "Menú" abre un <dialog> modal a pantalla completa con las secciones y
// "Comprar entradas" (si la compra externa está activa). Arriba, el logo y "Cerrar" en el mismo lugar que el logo y
// "Menú" del header.
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

const ANCHO_MENU_COMPLETO = '(width >= 80rem)' // xl, el de Menu.jsx

// Las secciones, grandes (como los títulos de la Home, en Light); la de la página, subrayada en naranja como en Menu.jsx.
// Con la letra del navegador al 200 % en el celular, "Exposiciones" no entraba en el ancho y el menú se desplazaba a
// lo ancho: se parte (con guion si el navegador sabe partir en castellano) en vez de desbordar (A11Y-06 de E4).
const ENLACE =
  'inline-block max-w-full rounded-sm py-2 font-display text-[length:clamp(2rem,8vw,3rem)] leading-tight font-light ' +
  'hyphens-auto wrap-anywhere ' +
  'underline-offset-[0.2em] decoration-1 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-paper'
const ACTUAL = 'underline decoration-naranja decoration-2'

// El botón del header y el de cerrar: mismo tamaño y lugar (44 px de alto, el mínimo para el dedo).
const BOTON =
  'inline-flex h-11 items-center rounded-md border-[1.5px] border-paper/60 px-2 text-[0.9375rem] leading-none text-paper ' +
  'transition-colors hover:border-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper'

/**
 * @param {{ ruta: string | null, compra: { url: string, texto: string | null } | null, className?: string }} props
 *   ruta: la de la página (estado.ruta; null en la 404); compra: estado.museo.compra (solo viene si está activa)
 */
export default function MenuMovil({ ruta, compra, className = '' }) {
  const dialogo = useRef(null)
  const boton = useRef(null)
  const botonCerrar = useRef(null)
  // Deshace el bloqueo del scroll del abrir (null si el menú está cerrado).
  const desbloquear = useRef(null)
  const [abierto, setAbierto] = useState(false)

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
  }, [])

  return (
    <div className={className}>
      <button
        ref={boton}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls="menu-movil"
        onClick={abrir}
        className={`${BOTON} [text-shadow:0_0_0.75rem_rgb(14_16_13/0.85)]`}
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
        <div className="flex min-h-full flex-col px-6 pt-6 pb-12 md:px-10 md:pt-8 lg:px-[5.15625rem] lg:pt-[4.4375rem]">
          {/* El logo no se achica desde 360 px: así queda igual que el del header aunque "Cerrar" sea más ancho que
              "Menú" (a 375 px el botón se mete unos px en el margen). Más angosto sí, para que el botón no se salga. */}
          <div className="flex items-start justify-between gap-2">
            <Logo className="min-[22.5rem]:shrink-0" />
            <div className="flex h-0 shrink-0 items-center self-center">
              <button ref={botonCerrar} type="button" onClick={() => dialogo.current?.close()} className={BOTON}>
                {navegacion.cerrar}
              </button>
            </div>
          </div>

          <nav aria-label={navegacion.etiqueta} className="mt-14 md:mt-20">
            <ul className="flex flex-col gap-1">
              {navegacion.secciones.map((s) => {
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
              <a
                href={compra.url}
                data-entradas=""
                className="mt-10 inline-block max-w-full rounded-md border-[1.5px] border-naranja px-5 py-3 text-lg leading-6 text-paper transition-colors hover:bg-naranja hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
              >
                {textoCompra(compra)}
              </a>
            ) : null}
          </nav>
        </div>
      </dialog>
    </div>
  )
}
