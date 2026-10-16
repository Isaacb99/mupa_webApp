// Entrada del panel (/administracion): una SPA solo de cliente (plan 5.1). Arma el router (rutas.jsx), le conecta a
// api.js el diálogo de reingreso (401) y el paso obligatorio a Cambiar la contraseña (403 con debeCambiarClave), y
// escucha vite:preloadError (un archivo del panel que ya no existe después de un deploy).
// El aviso de versión nueva y el diálogo de reingreso van fuera del router: así andan también mientras carga la
// primera pantalla. Si en el reingreso la persona vuelve con otro rol, el router vuelve a cargar la pantalla.
// No importa nada del sitio público (ni analitica.js ni UserWay: plan 9).
import './panel.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { api } from './api.js'
import { avisarVersionNueva, AvisoVersionNueva } from './componentes/AvisoVersionNueva.jsx'
import { pedirReingreso, ReingresoDialogo } from './componentes/ReingresoDialogo.jsx'
import { crearRouter } from './rutas.jsx'
import { actualizarSesion } from './sesion.jsx'

/** @type {ReturnType<typeof crearRouter> | null} */
let router = null

api.configurar({
  reingresar: pedirReingreso,
  alDebeCambiarClave: () => {
    actualizarSesion({ debeCambiarClave: true })
    router?.navigate('/cambiar-clave')
  },
})

window.addEventListener('vite:preloadError', () => avisarVersionNueva())

router = crearRouter()

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <AvisoVersionNueva />
    <RouterProvider router={router} />
    <ReingresoDialogo alCambiarRol={() => router?.revalidate()} />
  </StrictMode>,
)
