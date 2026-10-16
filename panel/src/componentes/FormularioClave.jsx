// El formulario para cambiar la contraseña (plan 4.4 y 5.2): la actual (o la temporal) y la nueva, con "Mostrar" y la
// ayuda de las reglas. Lo usan la pantalla Cambiar la contraseña (obligatoria con una temporal) y Mi cuenta (E2.5).
// - FormularioClave: con su propia pregunta por los cambios sin guardar (Cambiar la contraseña).
// - CamposClave: sin ella, para una pantalla que tiene otros formularios y una sola pregunta para todos (Mi cuenta:
//   React Router admite un bloqueo por vez). Avisa si hay algo escrito con alCambiarSucio y recibe liberar().
// Las reglas son las del servidor (compartido/esquemas/cuenta.js, problemaDeClave): se comprueban acá antes de
// mandar, así un error se ve sin esperar al servidor ni gastar intentos, y el servidor las vuelve a aplicar.
// Al guardar, el servidor cierra todas las sesiones de la persona (las otras pestañas y dispositivos tienen que volver
// a entrar) y abre una nueva en este navegador; alGuardar recibe la sesión nueva ({ usuario, debeCambiarClave }).
import { useEffect, useState } from 'react'
import { problemaDeClave } from '../../../compartido/esquemas/cuenta.js'
import { api } from '../api.js'
import { ponerSesion, useSesion } from '../sesion.jsx'
import { Boton } from './Boton.jsx'
import { CampoClave } from './Campo.jsx'
import { ResumenErrores, useCambiosSinGuardar, useEnvio } from './formulario.jsx'

const CAMPOS = ['actual', 'nueva']

export const AYUDA_CLAVE =
  'Entre 15 y 128 caracteres, sin otras reglas: te recomendamos una frase de tres o cuatro palabras que te resulte ' +
  'fácil de recordar y que no uses en otro lado. No puede contener "mupa", "museo", "paleontológico" ni la primera ' +
  'parte de tu correo.'

/**
 * @param {{ temporal?: boolean, alGuardar: (sesion: { usuario: object, debeCambiarClave: boolean }, liberar: () => void) => void }} props
 *   temporal: la "actual" es la contraseña temporal (el primer ingreso o una que dio un administrador)
 *   alGuardar recibe además liberar(), para navegar en el mismo momento sin que pregunte por cambios sin guardar
 */
export function FormularioClave({ temporal = false, alGuardar }) {
  const [sucio, setSucio] = useState(false)
  const { dialogo, liberar } = useCambiosSinGuardar(sucio)
  return (
    <>
      <CamposClave temporal={temporal} alGuardar={alGuardar} alCambiarSucio={setSucio} liberar={liberar} />
      {dialogo}
    </>
  )
}

/**
 * @param {{ temporal?: boolean, alGuardar: (sesion: { usuario: object, debeCambiarClave: boolean }, liberar: () => void) => void,
 *   alCambiarSucio?: (sucio: boolean) => void, liberar?: () => void, textoBoton?: string }} props
 */
export function CamposClave({
  temporal = false,
  alGuardar,
  alCambiarSucio,
  liberar = () => {},
  textoBoton = 'Guardar la contraseña nueva',
}) {
  const sesion = useSesion()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const envio = useEnvio(CAMPOS)
  const sucio = actual !== '' || nueva !== ''
  useEffect(() => {
    alCambiarSucio?.(sucio)
  }, [sucio, alCambiarSucio])
  const etiquetaActual = temporal ? 'Contraseña temporal' : 'Contraseña actual'

  async function alEnviar(e) {
    e.preventDefault()
    const errores = {}
    if (!actual) errores.actual = temporal ? 'Escribí la contraseña temporal.' : 'Escribí tu contraseña actual.'
    const problema = problemaDeClave(nueva, { email: sesion?.usuario.email, actual })
    if (problema) errores.nueva = problema
    if (Object.keys(errores).length) {
      envio.mostrar(errores)
      return
    }
    const r = await envio.enviar(() => api.put('/cuenta/clave', { actual, nueva }))
    if (!r.ok) return
    liberar()
    setActual('')
    setNueva('')
    ponerSesion(r.datos)
    alGuardar(r.datos, liberar)
  }

  return (
    <form onSubmit={alEnviar} noValidate className="grid gap-5">
      <ResumenErrores envio={envio} etiquetas={{ actual: etiquetaActual, nueva: 'Contraseña nueva' }} />
      {/* Para el gestor de contraseñas: de qué cuenta es la contraseña nueva. */}
      <input type="email" name="username" autoComplete="username" value={sesion?.usuario.email ?? ''} readOnly hidden />
      <CampoClave
        id="actual"
        etiqueta={etiquetaActual}
        ayuda={temporal ? 'La que te dio un administrador. Podés escribirla con o sin los guiones.' : undefined}
        autoComplete="current-password"
        value={actual}
        onChange={(e) => setActual(e.target.value)}
        error={envio.errores.actual}
      />
      <CampoClave
        id="nueva"
        etiqueta="Contraseña nueva"
        ayuda={AYUDA_CLAVE}
        autoComplete="new-password"
        value={nueva}
        onChange={(e) => setNueva(e.target.value)}
        error={envio.errores.nueva}
      />
      <div>
        <Boton type="submit" ocupado={envio.enviando}>
          {envio.enviando ? 'Guardando…' : textoBoton}
        </Boton>
      </div>
    </form>
  )
}
