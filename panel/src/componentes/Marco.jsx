// El marco de las pantallas del panel (plan 5.2 y 5.6).
// - Marco: el de las pantallas con sesión. "Ir al contenido", la barra superior (siempre igual y en el mismo lugar,
//   WCAG 3.2.6: las secciones de navegacion.js según el rol, "Mi cuenta" (con el nombre de la persona desde sm) y
//   "Salir", que se ve siempre, también en el celular: no hay menú escondido) y el <main>. En el celular la barra
//   ocupa dos filas (arriba el nombre del panel, Mi cuenta y Salir; abajo las secciones; a 320 px, Mi cuenta y Salir
//   bajan a una fila propia) y se va con el scroll; desde lg queda fija arriba, y el scroll-padding de panel.css deja
//   lugar para que no tape lo que recibe el foco (2.4.11): toma el alto real de la barra (--alto-barra, que pone un
//   ResizeObserver), porque con Novedades y Exposiciones, entre 1024 y ~1180 px, la barra pasaba a dos filas (110 px)
//   y tapaba el foco al volver con Mayús+Tab (corrección de E3, 16/10/2026). Por lo mismo, entre lg y xl "Mi cuenta"
//   va sin el nombre: así la barra entra en una fila con el nombre que sea.
//   El orden del Tab es el de escritorio (secciones, Mi cuenta, Salir), donde se va a usar más: en el celular las
//   secciones se ven en la segunda fila pero el Tab las recorre primero. Es a propósito (revisión de accesibilidad de
//   E2, 14/10/2026): para que coincidieran en los dos tamaños habría que repetir la barra o pasar Salir a una tercera
//   fila.
// - MarcoSimple: el de Ingresar, Cambiar la contraseña y los errores generales: sin secciones (con una temporal sin
//   cambiar no se puede ir a otra pantalla), con "Salir" si hay sesión.
// "Salir" va a /salir (un loader cierra la sesión y lleva a Ingresar): es una navegación, así un formulario con
// cambios sin guardar pregunta antes.
// Mientras se carga la pantalla siguiente (sus datos), abajo aparece "Cargando…" y el <main> queda aria-busy: con la
// red lenta, si no, la pantalla vieja quedaba igual y parecía que el clic no había andado. Aparece a los 400 ms, así
// en una conexión rápida no parpadea; la región role="status" está siempre (vacía), para que el lector lo anuncie.
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigation } from 'react-router'
import { esDeLaSeccion, seccionesPara } from '../navegacion.js'
import { useSesion } from '../sesion.jsx'
import { Boton } from './Boton.jsx'
import { NOMBRE_PANEL } from './Encabezado.jsx'

function SaltoAlContenido() {
  return (
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-blanco focus:px-4 focus:py-3 focus:font-semibold"
      onClick={(e) => {
        // A mano: un "#contenido" en la URL lo tomaría el router como una navegación.
        e.preventDefault()
        document.getElementById('contenido')?.focus()
      }}
    >
      Ir al contenido
    </a>
  )
}

const claseSeccion = ({ isActive }) =>
  'inline-flex min-h-11 items-center rounded-md px-3 no-underline ' +
  (isActive
    ? 'bg-blanco font-bold text-tinta shadow-[inset_0_-3px_0_var(--color-accion)]'
    : 'text-tinta hover:bg-blanco hover:text-accion-fuerte hover:underline')

/** true si hace más de 400 ms que se está cargando la pantalla siguiente. */
function useCargandoPantalla() {
  const cargando = useNavigation().state !== 'idle'
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!cargando) {
      setVisible(false)
      return undefined
    }
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [cargando])
  return visible
}

/** Pone el alto de la barra en --alto-barra (en <html>) mientras está, y lo sigue si cambia (ancho, letra, filas). */
function useAltoDeLaBarra() {
  const barra = useRef(null)
  useEffect(() => {
    const nodo = barra.current
    const raiz = document.documentElement
    if (!nodo || typeof ResizeObserver === 'undefined') return undefined
    const medir = () => raiz.style.setProperty('--alto-barra', `${nodo.offsetHeight}px`)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => {
      observador.disconnect()
      raiz.style.removeProperty('--alto-barra')
    }
  }, [])
  return barra
}

export function Marco() {
  const sesion = useSesion()
  const navigate = useNavigate()
  const cargando = useCargandoPantalla()
  const { pathname } = useLocation()
  const barra = useAltoDeLaBarra()
  const usuario = sesion?.usuario
  return (
    <>
      <SaltoAlContenido />
      <header ref={barra} className="border-b-2 border-suave bg-fondo-2 lg:sticky lg:top-0 lg:z-10">
        <div className="mx-auto flex max-w-panel flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <p className="py-2 font-bold">{NOMBRE_PANEL}</p>
          <nav aria-label="Secciones del panel" className="order-last w-full lg:order-none lg:w-auto">
            <ul className="-mx-3 flex flex-wrap lg:mx-0">
              {seccionesPara(usuario?.rol).map((s) => (
                <li key={s.a}>
                  {esDeLaSeccion(s, pathname) ? (
                    // Una pantalla de la sección con otra ruta (la ficha de una muestra, en Exposiciones): marcada
                    // como la sección actual, con aria-current="true" (no es la página de la sección).
                    <Link to={s.a} aria-current="true" className={claseSeccion({ isActive: true })}>
                      {s.texto}
                    </Link>
                  ) : (
                    <NavLink to={s.a} end={s.exacta} className={claseSeccion}>
                      {s.texto}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {usuario ? (
              <NavLink
                to="/cuenta"
                className={(estado) => `${claseSeccion(estado)} min-w-0 max-w-[20rem] whitespace-nowrap`}
              >
                <span className="shrink-0">Mi cuenta</span>
                <span className="hidden min-w-0 truncate font-normal sm:block lg:hidden xl:block">: {usuario.nombre}</span>
              </NavLink>
            ) : null}
            <Boton variante="secundario" onClick={() => navigate('/salir')}>
              Salir
            </Boton>
          </div>
        </div>
      </header>
      <main
        id="contenido"
        tabIndex={-1}
        aria-busy={cargando || undefined}
        className="mx-auto w-full max-w-panel px-4 py-8"
      >
        <Outlet />
      </main>
      <div role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
        {cargando ? (
          <p className="rounded-md bg-tinta px-4 py-2 font-semibold text-blanco shadow-lg">Cargando…</p>
        ) : null}
      </div>
    </>
  )
}

/** @param {{ children: import('react').ReactNode, conSalir?: boolean }} props */
export function MarcoSimple({ children, conSalir = false }) {
  const navigate = useNavigate()
  return (
    <>
      <SaltoAlContenido />
      <header className="border-b-2 border-suave bg-fondo-2">
        <div className="mx-auto flex max-w-panel flex-wrap items-center justify-between gap-2 px-4 py-2">
          <p className="py-2">
            <span className="font-bold">{NOMBRE_PANEL}</span>
            <span className="hidden text-tenue sm:inline"> · Museo Paleontológico de San Juan</span>
          </p>
          {conSalir ? (
            <Boton variante="secundario" onClick={() => navigate('/salir')}>
              Salir
            </Boton>
          ) : null}
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-xl px-4 py-8">
        {children}
      </main>
    </>
  )
}
