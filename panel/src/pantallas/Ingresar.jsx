// Ingresar (plan 5.2): correo y contraseña. Con una contraseña temporal lleva a Cambiar la contraseña; si no, a la
// pantalla que se quería abrir (?volver=, solo rutas del panel) o al Inicio. Los errores del servidor se muestran tal
// cual: "Correo o contraseña incorrectos." (el mismo para los dos casos), la temporal vencida, el 429 de los límites
// ("Demasiados intentos. Esperá 15 minutos.") y "Sin conexión, reintentá.". Los campos vacíos se avisan acá, sin
// mandar nada (cada intento cuenta para el límite).
import { useEffect, useState } from 'react'
import { redirect, useNavigate, useSearchParams } from 'react-router'
import { AvisoDeLlegada } from '../componentes/Aviso.jsx'
import { Boton } from '../componentes/Boton.jsx'
import { Campo, CampoClave } from '../componentes/Campo.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { ResumenErrores, useEnvio } from '../componentes/formulario.jsx'
import { MarcoSimple } from '../componentes/Marco.jsx'
import { volverSeguro } from '../navegacion.js'
import { asegurarSesion, borrarAviso, entrar, leerAviso } from '../sesion.jsx'

const CAMPOS = ['email', 'clave']

/** Con sesión no hay nada que hacer acá. */
export async function cargarIngresar() {
  const sesion = await asegurarSesion()
  if (sesion) throw redirect(sesion.debeCambiarClave ? '/cambiar-clave' : '/')
  return null
}

export default function Ingresar() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const [aviso] = useState(leerAviso)
  useEffect(() => borrarAviso(), [])
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const envio = useEnvio(CAMPOS)

  async function alEnviar(e) {
    e.preventDefault()
    const errores = {}
    if (!email.trim()) errores.email = 'Escribí tu correo.'
    if (!clave) errores.clave = 'Escribí tu contraseña.'
    if (Object.keys(errores).length) {
      envio.mostrar(errores)
      return
    }
    const r = await envio.enviar(() => entrar(email.trim(), clave))
    if (!r.ok) return
    const destino = r.datos.debeCambiarClave ? '/cambiar-clave' : (volverSeguro(parametros.get('volver')) ?? '/')
    navigate(destino, { replace: true })
  }

  return (
    <MarcoSimple>
      <Encabezado titulo="Ingresar" />
      <AvisoDeLlegada texto={aviso} className="mb-6" />
      <form onSubmit={alEnviar} noValidate className="grid gap-5">
        <ResumenErrores envio={envio} etiquetas={{ email: 'Correo', clave: 'Contraseña' }} />
        <Campo
          id="email"
          etiqueta="Correo"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={envio.errores.email}
        />
        <CampoClave
          id="clave"
          etiqueta="Contraseña"
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={envio.errores.clave}
        />
        <div>
          <Boton type="submit" ocupado={envio.enviando}>
            {envio.enviando ? 'Ingresando…' : 'Ingresar'}
          </Boton>
        </div>
      </form>
      <p className="mt-8 text-tenue">
        ¿Olvidaste tu contraseña? Pedile a un administrador una contraseña temporal.
      </p>
      <p className="mt-4">
        <a href="/" className="inline-flex min-h-11 items-center">
          Ir al sitio del museo
        </a>
      </p>
    </MarcoSimple>
  )
}
