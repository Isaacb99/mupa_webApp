// Las pantallas de error del panel. Cada una con su <h1> (Encabezado: título de la pestaña y foco).
// - ErrorDePantalla: el ErrorBoundary de las pantallas con sesión (adentro del Marco, así la barra sigue). Un 403
//   (un editor en una pantalla de admin: lo tira el loader, rutas.jsx, o la API si le cambiaron el rol) dice "No tenés
//   permiso"; sin conexión, "Sin conexión, reintentá" con un botón que vuelve a cargar la pantalla; un archivo del
//   panel que ya no existe (deploy nuevo), el aviso de versión nueva; el resto, un error genérico.
// - ErrorGeneral: el de la raíz (cuando falla algo fuera del Marco: cargar la sesión, salir), con el MarcoSimple.
// - NoEncontrada: una ruta del panel que no existe.
import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useLocation, useRevalidator, useRouteError } from 'react-router'
import { ErrorApi } from '../api.js'
import { avisarVersionNueva, esVersionVieja } from '../componentes/AvisoVersionNueva.jsx'
import { Boton, clasesBoton } from '../componentes/Boton.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { MarcoSimple } from '../componentes/Marco.jsx'

/** Qué decir de un error: { titulo, texto, reintentar: 'cargar' | 'recargar' | null, ingresar? }. */
function describir(error) {
  const status = isRouteErrorResponse(error) ? error.status : error instanceof ErrorApi ? error.status : null
  if (status === 403) {
    return {
      titulo: 'No tenés permiso',
      texto: 'Esta pantalla es solo para administradores. Si necesitás hacer algo acá, pedíselo a un administrador.',
      reintentar: null,
    }
  }
  if (status === 404) return { titulo: 'No existe', texto: error.message ?? 'Lo que buscabas no existe.', reintentar: null }
  if (status === 401) {
    return { titulo: 'Tu sesión terminó', texto: 'Ingresá de nuevo para seguir.', reintentar: null, ingresar: true }
  }
  if (status === 0) {
    return {
      titulo: 'Sin conexión',
      texto: 'No se pudo cargar esta pantalla: sin conexión, reintentá.',
      reintentar: 'cargar',
    }
  }
  if (esVersionVieja(error)) {
    return {
      titulo: 'Hay una versión nueva del panel',
      texto: 'Recargá la página para seguir.',
      reintentar: 'recargar',
    }
  }
  return {
    titulo: 'Algo salió mal',
    texto: error instanceof ErrorApi ? error.message : 'No se pudo mostrar esta pantalla. Probá de nuevo en unos minutos.',
    reintentar: 'cargar',
  }
}

function ContenidoDeError({ error }) {
  const { titulo, texto, reintentar, ingresar } = describir(error)
  const revalidador = useRevalidator()
  const { pathname, search } = useLocation()
  useEffect(() => {
    if (esVersionVieja(error)) avisarVersionNueva()
  }, [error])
  return (
    <>
      <Encabezado titulo={titulo} />
      <p>{texto}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {reintentar === 'cargar' ? (
          <Boton ocupado={revalidador.state === 'loading'} onClick={() => revalidador.revalidate()}>
            Reintentar
          </Boton>
        ) : null}
        {reintentar === 'recargar' ? <Boton onClick={() => window.location.reload()}>Recargar</Boton> : null}
        {ingresar ? (
          <Link to={`/ingresar?volver=${encodeURIComponent(pathname + search)}`} className={clasesBoton('primario')}>
            Ingresar
          </Link>
        ) : null}
        <Link to="/" className="inline-flex min-h-11 items-center">
          Ir al Inicio
        </Link>
      </div>
    </>
  )
}

export function ErrorDePantalla() {
  return <ContenidoDeError error={useRouteError()} />
}

export function ErrorGeneral() {
  return (
    <MarcoSimple>
      <ContenidoDeError error={useRouteError()} />
    </MarcoSimple>
  )
}

export function NoEncontrada() {
  return (
    <>
      <Encabezado titulo="No existe esta pantalla" />
      <p>La dirección no corresponde a ninguna pantalla del panel.</p>
      <p className="mt-6">
        <Link to="/" className="inline-flex min-h-11 items-center">
          Ir al Inicio
        </Link>
      </p>
    </>
  )
}
