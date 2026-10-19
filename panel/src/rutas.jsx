// Las rutas del panel (plan 5.2), con React Router 7 en modo Data: createBrowserRouter con basename /administracion
// (RUTA_PANEL), así las rutas de acá y los navigate()/redirect() van sin el prefijo ('/usuarios' es
// /administracion/usuarios).
//
// Cada pantalla con sesión se declara adentro del Marco con su loader envuelto en protegida():
//
//   { path: 'museo', loader: protegida({ cargar: cargarMuseo }), Component: Museo }
//   { path: 'usuarios', loader: protegida({ rol: 'admin', cargar: cargarUsuarios }), Component: Usuarios }
//
// protegida() espera la sesión (la primera vez la pide al servidor) y, ANTES de pedir nada más: sin sesión, lleva a
// Ingresar (con ?volver= para regresar después); con la contraseña temporal sin cambiar, a Cambiar la contraseña; con
// un rol que no alcanza, tira un 403 que ErrorDePantalla muestra como "No tenés permiso" (adentro del Marco). Después
// llama a cargar(args, sesion), si hay. Todas las rutas llevan protegida(), aunque no carguen nada: los loaders de una
// navegación corren en paralelo y cada uno se protege solo. Lo que cargue tiene que usar api.js, con
// { signal: args.request.signal }. La pantalla lee lo cargado con useLoaderData(); después de guardar algo que cambie
// lo que muestran otras pantallas, useRevalidator().revalidate().
// Las secciones de la barra están en navegacion.js; el título de cada pantalla lo pone su <Encabezado>.
// Desde E3.3 y E3.4: Novedades (/novedades, /novedades/nueva y /novedades/:id) y Exposiciones (/exposiciones, con las
// pestañas Muestras y Salas, y /muestras/nueva, /muestras/:id, /salas/nueva y /salas/:id). Las fichas de los tres son
// la misma pantalla (pantallas/contenido/Ficha.jsx), montada de nuevo para cada id (si no, al ir de una ficha a otra
// quedaría lo escrito en la anterior); el alta, pantallas/contenido/Nuevo.jsx. /muestras y /salas solos llevan a
// Exposiciones.
import { createBrowserRouter, data, Outlet, redirect, useLoaderData } from 'react-router'
import { RUTA_PANEL } from '../../compartido/panel.js'
import { Marco } from './componentes/Marco.jsx'
import { rutaSinBase, volverSeguro } from './navegacion.js'
import CambiarClave, { cargarCambiarClave } from './pantallas/CambiarClave.jsx'
import { cargarFicha, Ficha } from './pantallas/contenido/Ficha.jsx'
import { Nuevo } from './pantallas/contenido/Nuevo.jsx'
import Cuenta from './pantallas/Cuenta.jsx'
import { ErrorDePantalla, ErrorGeneral, NoEncontrada } from './pantallas/Errores.jsx'
import Ingresar, { cargarIngresar } from './pantallas/Ingresar.jsx'
import Inicio, { cargarInicio } from './pantallas/Inicio.jsx'
import Exposiciones, { cargarExposiciones, revalidarExposiciones } from './pantallas/Exposiciones.jsx'
import Museo, { cargarMuseo } from './pantallas/Museo.jsx'
import Novedades, { cargarNovedades } from './pantallas/Novedades.jsx'
import Usuarios, { cargarUsuarios } from './pantallas/Usuarios.jsx'
import Visitas, { cargarVisitas } from './pantallas/Visitas.jsx'
import { asegurarSesion, ponerAviso, salir } from './sesion.jsx'

/**
 * El loader de una pantalla con sesión.
 * @param {{ rol?: 'editor' | 'admin', cargar?: (args: import('react-router').LoaderFunctionArgs, sesion: any) => unknown }} [opciones]
 */
export function protegida({ rol = 'editor', cargar } = {}) {
  return async (args) => {
    const sesion = await asegurarSesion()
    if (!sesion) {
      const volver = volverSeguro(rutaSinBase(args.request.url, RUTA_PANEL))
      throw redirect(volver && volver !== '/' ? `/ingresar?volver=${encodeURIComponent(volver)}` : '/ingresar')
    }
    if (sesion.debeCambiarClave) throw redirect('/cambiar-clave')
    if (rol === 'admin' && sesion.usuario.rol !== 'admin') throw data('No tenés permiso.', { status: 403 })
    return cargar ? cargar(args, sesion) : null
  }
}

/** "Salir": cierra la sesión en el servidor y lleva a Ingresar con el aviso. */
async function cargarSalir() {
  await salir()
  ponerAviso('Cerraste la sesión.')
  return redirect('/ingresar')
}

// El loader siempre redirige, así que no se llega a ver; está para que una ruta sin pantalla no avise en la consola
// cuando se abre /administracion/salir directo (Atrás, un marcador).
function Saliendo() {
  return (
    <p role="status" className="p-8 text-tenue">
      Cerrando la sesión…
    </p>
  )
}

// Sin <ScrollRestoration />: guarda las posiciones en sessionStorage, que comparten las páginas públicas del mismo
// origen (plan 9: el panel no guarda nada ahí). Cada pantalla nueva arranca arriba (Encabezado.jsx).
function Raiz() {
  return <Outlet />
}

/** La ficha de un tipo, con key = id: cada ficha arranca de cero. */
function fichaDe(tipo) {
  return function PantallaDeFicha() {
    const { ficha } = useLoaderData()
    return <Ficha key={ficha.id} tipo={tipo} />
  }
}

const NuevaNovedad = () => <Nuevo tipo="novedades" />
const NuevaMuestra = () => <Nuevo tipo="muestras" />
const NuevaSala = () => <Nuevo tipo="salas" />

// /muestras y /salas solos (sin una ficha): a Exposiciones, en su pestaña. El componente no se llega a ver (está para
// que una ruta sin pantalla no avise en la consola).
const aExposiciones = (pestana) => () => redirect(pestana ? `/exposiciones?pestana=${pestana}` : '/exposiciones')
const Nada = () => null

function Cargando() {
  return (
    <p role="status" className="p-8 text-tenue">
      Cargando el panel…
    </p>
  )
}

export const rutas = [
  {
    Component: Raiz,
    HydrateFallback: Cargando,
    ErrorBoundary: ErrorGeneral,
    children: [
      { path: 'ingresar', loader: cargarIngresar, Component: Ingresar },
      { path: 'cambiar-clave', loader: cargarCambiarClave, Component: CambiarClave },
      { path: 'salir', loader: cargarSalir, Component: Saliendo },
      {
        loader: protegida(),
        Component: Marco,
        children: [
          {
            // Los errores de una pantalla se muestran adentro del Marco (con la barra).
            ErrorBoundary: ErrorDePantalla,
            children: [
              { index: true, loader: protegida({ cargar: cargarInicio }), Component: Inicio },
              { path: 'novedades', loader: protegida({ cargar: cargarNovedades }), Component: Novedades },
              { path: 'novedades/nueva', loader: protegida(), Component: NuevaNovedad },
              { path: 'novedades/:id', loader: protegida({ cargar: cargarFicha('novedades') }), Component: fichaDe('novedades') },
              {
                path: 'exposiciones',
                loader: protegida({ cargar: cargarExposiciones }),
                shouldRevalidate: revalidarExposiciones,
                Component: Exposiciones,
              },
              { path: 'muestras', loader: aExposiciones(null), Component: Nada },
              { path: 'muestras/nueva', loader: protegida(), Component: NuevaMuestra },
              { path: 'muestras/:id', loader: protegida({ cargar: cargarFicha('muestras') }), Component: fichaDe('muestras') },
              { path: 'salas', loader: aExposiciones('salas'), Component: Nada },
              { path: 'salas/nueva', loader: protegida(), Component: NuevaSala },
              { path: 'salas/:id', loader: protegida({ cargar: cargarFicha('salas') }), Component: fichaDe('salas') },
              { path: 'visitas', loader: protegida({ cargar: cargarVisitas }), Component: Visitas },
              { path: 'museo', loader: protegida({ cargar: cargarMuseo }), Component: Museo },
              { path: 'usuarios', loader: protegida({ rol: 'admin', cargar: cargarUsuarios }), Component: Usuarios },
              { path: 'cuenta', loader: protegida(), Component: Cuenta },
              { path: '*', loader: protegida(), Component: NoEncontrada },
            ],
          },
        ],
      },
    ],
  },
]

export const crearRouter = () => createBrowserRouter(rutas, { basename: RUTA_PANEL })
