// Cambiar la contraseña (plan 4.4 y 5.2). Con una contraseña temporal sin cambiar es obligatoria: todas las demás
// pantallas mandan acá (los loaders de rutas.jsx, y api.js con un 403 debeCambiarClave), no hay barra de secciones y
// solo se puede salir. Sin temporal también sirve (el cambio voluntario, que además está en Mi cuenta).
import { useState } from 'react'
import { Link, redirect, useNavigate } from 'react-router'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { FormularioClave } from '../componentes/FormularioClave.jsx'
import { MarcoSimple } from '../componentes/Marco.jsx'
import { asegurarSesion, ponerAviso, sesionActual } from '../sesion.jsx'
import { Aviso } from '../componentes/Aviso.jsx'

/** Hace falta una sesión (también con la temporal sin cambiar). */
export async function cargarCambiarClave() {
  if (!(await asegurarSesion())) throw redirect('/ingresar')
  return null
}

export default function CambiarClave() {
  const navigate = useNavigate()
  // Cómo se llegó: al guardar, la sesión deja de tener la temporal antes de que la pantalla se vaya.
  const [temporal] = useState(() => Boolean(sesionActual()?.debeCambiarClave))
  const [guardada, setGuardada] = useState(false)

  return (
    <MarcoSimple conSalir>
      <Encabezado titulo="Cambiar la contraseña" />
      {temporal ? (
        <p className="mb-6">
          Entraste con una contraseña temporal. Para seguir, elegí una contraseña nueva: es la que vas a usar desde
          ahora, y la temporal deja de servir.
        </p>
      ) : (
        <p className="mb-6">
          Al guardarla se cierra tu sesión en los demás dispositivos y pestañas: ahí vas a tener que volver a
          ingresar. <Link to="/cuenta">Volver a Mi cuenta</Link>
        </p>
      )}
      <Aviso tipo="ok" className="mb-6">
        {guardada ? 'Listo: tu contraseña nueva quedó guardada.' : null}
      </Aviso>
      <FormularioClave
        temporal={temporal}
        alGuardar={() => {
          if (temporal) {
            ponerAviso('Listo: tu contraseña nueva quedó guardada.')
            navigate('/', { replace: true })
          } else {
            setGuardada(true)
          }
        }}
      />
    </MarcoSimple>
  )
}
