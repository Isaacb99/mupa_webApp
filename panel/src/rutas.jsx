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
import { createBrowserRouter, data, Outlet, redirect } from 'react-router'
import { RUTA_PANEL } from '../../compartido/panel.js'
import { Marco } from './componentes/Marco.jsx'
import { rutaSinBase, volverSeguro } from './navegacion.js'
import CambiarClave, { cargarCambiarClave } from './pantallas/CambiarClave.jsx'
import Cuenta from './pantallas/Cuenta.jsx'
import { ErrorDePantalla, ErrorGeneral, NoEncontrada } from './pantallas/Errores.jsx'
import Ingresar, { cargarIngresar } from './pantallas/Ingresar.jsx'
import Inicio, { cargarInicio } from './pantallas/Inicio.jsx'
import Museo, { cargarMuseo } from './pantallas/Museo.jsx'
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
