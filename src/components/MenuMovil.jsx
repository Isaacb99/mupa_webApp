import { useEffect, useRef, useState } from 'react'
import { navegacion } from '../content.js'
import { detenerScrollSuave } from '../hooks/useScrollSuave.js'
import BarraHoy from './BarraHoy.jsx'
import { IconoCerrar, IconoMenu } from './Iconos.jsx'
import Logo from './Logo.jsx'
import { marcaActual, seccionesDelMenu } from './navegacion.js'
import { BOTON_NARANJA } from './tablero.js'

// El menú debajo de xl (plan 6.7; desde el 10/11/2026, el del cuadro de celular de la diseñadora: Figma "Web Mobile",
// 3106:17179, decisión O2): el botón de tres líneas abre un <dialog> modal a pantalla completa con las mismas
// secciones que el menú ancho (las que existen: navegacion.js) y el botón naranja de entradas (si la compra externa
// está activa). Lo que dibuja (medidas del cuadro a 402):
// - El botón: el ícono de tres líneas de 40 con "Menú" como nombre accesible, en un área de 44x44 para el dedo (el
//   margen negativo la deja ocupando 40: el ícono queda en el lugar del cuadro). Sin JavaScript no se ve (lo esconde
//   Header.jsx): no abriría nada.
// - El diálogo: arriba, la barra de hoy (BarraHoy.jsx: el diálogo tapa la del header y la deja inerte, por eso va
//   también acá) y la fila del header, con el logo y la cruz ("Cerrar") donde estaban el logo y las tres líneas. 48
//   abajo, la lista: renglones de 65 en Roboto Mono Regular 16/28,8 blanca, con una línea blanca de 1 px entre uno y
//   otro (paso de 73), y 4 abajo el botón de entradas a todo el ancho (44 de alto, con el texto oscuro: D4). 48 abajo.
//   Desde md, la lista y el botón con un tope de 354 (el ancho del cuadro), a la izquierda: sin él, de lg a xl las
//   líneas y el botón pasarían de 1100 px.
// - El renglón entero es el enlace (el dedo lo toma en cualquier punto) y el foco va por dentro. La sección de la
//   página, que el cuadro no dibuja: el subrayado naranja de 2 px en el texto, como en el menú ancho. Una palabra que no
//   entra se parte en vez de ensanchar el menú (con la letra del navegador agrandada: A11Y-06 de E4).
// - Sin el selector de idioma del cuadro (D3).
// Lo que hace (como desde E4.1):
// - showModal(): el resto de la página queda inerte (ni el foco ni el lector salen del menú). Esc lo cierra (es del
//   navegador) y el foco vuelve al botón, sin mover el scroll.
// - Mientras está abierto, la página de atrás no se mueve: Lenis parado (detenerScrollSuave: si no, la rueda la seguía
//   moviendo), overflow: hidden en html y overscroll-behavior: contain en el menú (el scroll del menú, si no entra en
//   la pantalla, no pasa a la página). data-lenis-prevent: con Lenis parado, la rueda sobre el menú lo scrollea a él.
//   Al cerrar todo vuelve como estaba, en el mismo lugar: el scroll no se toca, así los efectos de la Home siguen
//   donde quedaron.
// - Alto con svh (la regla de Safari de CLAUDE.md, "Compatibilidad entre navegadores"): el menú no cambia de alto con
//   la barra del navegador; lo que quede debajo lo tapa el ::backdrop, del mismo color. Si el contenido no entra (un
//   teléfono bajo o acostado, la letra agrandada), se desplaza por dentro del menú.
// - Si la ventana se agranda hasta xl con el menú abierto, se cierra: ahí ya está el menú del header. También al volver
//   atrás a la página desde otra (bfcache).
// - Un clic en un enlace de adentro lo cierra antes de que el navegador lo siga (desde el 10/11/2026): "Horarios" de la
//   barra, en la propia página de Visitas, es una navegación dentro de la página (no recarga) y el menú quedaba
//   abierto, tapando la tarjeta. La página se desbloquea en ese mismo momento, antes del scroll al ancla (el del
//   navegador o, con puntero fino, el de Lenis, que parado no lo hacía), y el foco no se lleva al botón: sigue desde
//   el destino del enlace.
// - Sin animación de apertura.
// - Si no hay nada que mostrar (ninguna sección y sin compra), no se dibuja el botón.

const ANCHO_MENU_COMPLETO = '(width >= 80rem)' // xl, el de Header.jsx

// La fila de arriba del menú: la misma del header (Header.jsx), así el logo y la cruz quedan donde estaban el logo y
// las tres líneas.
const FILA = 'flex items-center justify-between gap-2 px-6 py-4 sm:gap-4 md:px-10 lg:h-32 lg:px-16 lg:py-0'

// Los botones de ícono (abrir y cerrar): 44x44, con el ícono de 40 centrado. Como bloque flexible y no en línea: un
// botón en línea que adentro tiene solo un SVG se apoya en la línea de base del renglón, y la fila del header medía 79
// en vez de 73 (el contrato del marco: Header.jsx).
// Con colores forzados llevan el fondo de botón del sistema: el ícono toma el color del texto del sistema y, sin fondo,
// con un tema claro quedaba negro sobre la foto oscura de un hero (que no se fuerza): de 1,6 a 1,9 de contraste, casi
// no se veía (medido el 10/11/2026 con colores forzados emulados). Con el fondo se ve en cualquier tema, sobre una foto
// o sobre la página. Con el puntero encima, un fondo blanco tenue (el hover sutil de D8; solo con un puntero que hace
// hover: lo pone así Tailwind), que el cuadro no dibuja (VMAR-04 de la verificación, 11/11/2026).
const BOTON_ICONO =
  '-m-0.5 flex size-11 shrink-0 items-center justify-center rounded-[0.25rem] text-blanco transition-colors ' +
  'hover:bg-blanco/10 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-blanco forced-colors:bg-[ButtonFace]'

// Un renglón de la lista: 65 de alto y a todo el ancho, con 8 de aire a cada lado que no corren el texto (el margen
// negativo): el contorno del foco va por dentro y así no pisa la primera letra (VMAR-01 de la verificación).
const ENLACE =
  'flex min-h-[4.0625rem] -mx-2 w-[calc(100%+1rem)] items-center rounded-sm px-2 font-mono text-base leading-[1.8] ' +
  'font-normal text-blanco ' +
  'hyphens-auto wrap-anywhere decoration-1 underline-offset-[0.4em] hover:underline ' +
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blanco'
const ACTUAL_TEXTO = 'underline decoration-naranja decoration-2 underline-offset-[0.4em]'
// Desde el segundo renglón: 4 de aire, la línea de 1 px y 3 más (el paso de 73 del cuadro: 65 + 4 + 4).
const CON_LINEA = 'mt-1 border-t border-blanco pt-[0.1875rem]'

/**
 * @param {{ ruta: string | null, compra: { url: string } | null, abiertoHoy?: boolean | null, className?: string }} props
 *   ruta: la de la página (estado.ruta; null en la 404); compra: estado.museo.compra (solo viene si está activa);
 *   abiertoHoy: estado.abiertoHoy, para la barra de hoy de adentro del menú
 */
export default function MenuMovil({ ruta, compra, abiertoHoy = null, className = '' }) {
  const dialogo = useRef(null)
  const boton = useRef(null)
  const botonCerrar = useRef(null)
  // Deshace el bloqueo del scroll del abrir (null si el menú está cerrado).
  const desbloquear = useRef(null)
  // true si el menú se está cerrando por un clic en uno de sus enlaces: el foco no vuelve al botón.
  const porEnlace = useRef(false)
  const [abierto, setAbierto] = useState(false)
  const secciones = seccionesDelMenu()
  const conAlgo = secciones.length > 0 || Boolean(compra)

  // Solo toca la referencia: vale la de cualquier render (la usan el efecto y el clic en un enlace).
  const liberar = () => {
    desbloquear.current?.()
    desbloquear.current = null
  }

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

  // Un clic en un enlace de adentro (una sección, "Tickets", "Horarios", la marca): se desbloquea la página y se
  // cierra el menú ahora, y el navegador sigue el enlace. No se frena el clic: la navegación es la de siempre.
  const alClicAdentro = (e) => {
    const d = dialogo.current
    if (!d?.open || !e.target.closest?.('a[href]')) return
    porEnlace.current = true
    liberar()
    d.close()
  }

  useEffect(() => {
    const d = dialogo.current
    if (!d) return undefined
    // Con la cruz, con Esc, con un enlace de adentro o al ir a xl: el evento close llega en todos los casos.
    const alCerrar = () => {
      liberar()
      setAbierto(false)
      if (!porEnlace.current) boton.current?.focus({ preventScroll: true })
      porEnlace.current = false
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
        aria-label={navegacion.abrir}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls="menu-movil"
        onClick={abrir}
        className={BOTON_ICONO}
      >
        <IconoMenu />
      </button>

      {/* Sin clases de display en el <dialog>: cerrado lo oculta el navegador (display: none). */}
      <dialog
        ref={dialogo}
        id="menu-movil"
        aria-label={navegacion.abrir}
        data-lenis-prevent=""
        onClick={alClicAdentro}
        className="m-0 h-svh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-ink p-0 text-paper backdrop:bg-ink"
      >
        <div className="mx-auto flex min-h-full max-w-tablero flex-col">
          <BarraHoy abierto={abiertoHoy} />
          <div className={FILA}>
            <Logo />
            <button
              ref={botonCerrar}
              type="button"
              aria-label={navegacion.cerrar}
              onClick={() => dialogo.current?.close()}
              className={BOTON_ICONO}
            >
              <IconoCerrar />
            </button>
          </div>

          <nav aria-label={navegacion.etiqueta} className="px-6 py-12 md:px-10 lg:px-16">
            <div className="md:max-w-[22.125rem]">
              <ul>
                {secciones.map((s, i) => {
                  const actual = marcaActual(ruta, s.ruta)
                  return (
                    <li key={s.ruta} className={i > 0 ? CON_LINEA : undefined}>
                      <a href={s.ruta} aria-current={actual} className={ENLACE}>
                        {actual ? <span className={ACTUAL_TEXTO}>{s.texto}</span> : s.texto}
                      </a>
                    </li>
                  )
                })}
              </ul>
              {compra ? (
                <a href={compra.url} data-entradas="" className={`mt-1 w-full ${BOTON_NARANJA}`}>
                  {navegacion.entradas}
                </a>
              ) : null}
            </div>
          </nav>
        </div>
      </dialog>
    </div>
  )
}
