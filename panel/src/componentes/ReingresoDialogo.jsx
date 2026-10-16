// Volver a ingresar sin perder lo que se estaba haciendo (plan 5.1). Cuando un pedido da 401 (la sesión venció: 2 h
// sin uso o 12 h, o se cerró desde otro lado), api.js llama a pedirReingreso(error): se abre este <dialog> con el
// correo y la contraseña, y el pedido queda esperando. Si la persona vuelve a entrar, el pedido se repite (y el
// formulario de atrás sigue como estaba); si cierra el diálogo ("Ahora no" o Escape), el pedido termina con el 401 y
// el panel da la sesión por terminada (la pantalla siguiente lleva a Ingresar; la que está a la vista sigue siendo de
// esa persona: ver useSesion en sesion.jsx).
// Varios pedidos que dan 401 a la vez esperan el mismo diálogo.
// El correo viene completo (el de la sesión que terminó, también la segunda vez, después de "Ahora no") y el foco va a
// la contraseña. El texto del diálogo es su descripción (el lector lo dice al abrirse, aunque el foco esté en la
// contraseña). Si la contraseña no anda (también si desactivaron la cuenta: el servidor dice lo mismo, a propósito),
// el diálogo dice a quién pedirle ayuda.
// Si el 401 es por la contraseña temporal vencida, no hay nada que hacer acá (no se puede volver a entrar con ella:
// hace falta otra): el diálogo lo dice, sin campos, con un solo botón, "Ir a Ingresar", que descarta lo escrito (ya
// no se puede guardar) y lleva a Ingresar.
// Después de entrar (reingreso.js): si es otra cuenta, el panel vuelve a empezar desde el Inicio, sin preguntar por
// los cambios sin guardar y sin repetir el pedido (lo de la pantalla era de la otra); el diálogo queda abierto, con un
// aviso, hasta que la página se va. Si es la misma persona con otro rol, el pedido se repite y la pantalla se vuelve a
// cargar (alCambiarRol, que main.jsx conecta con el router).
// Va fuera del router (main.jsx), así funciona también mientras carga la primera pantalla.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { RUTA_PANEL } from '../../../compartido/panel.js'
import { api, esTemporalVencida } from '../api.js'
import { queHacerAlReingresar } from '../reingreso.js'
import { ponerSesion, sesionConocida } from '../sesion.jsx'
import { Aviso } from './Aviso.jsx'
import { Boton } from './Boton.jsx'
import { Campo, CampoClave } from './Campo.jsx'
import { Dialogo } from './Confirmar.jsx'
import { descartarCambiosSinGuardar, ResumenErrores, useEnvio } from './formulario.jsx'

/** @type {{ error: import('../api.js').ErrorApi, promesa: Promise<boolean>, resolver: (ok: boolean) => void } | null} */
let pendiente = null
const oyentes = new Set()
const avisar = () => oyentes.forEach((o) => o())
const suscribir = (o) => {
  oyentes.add(o)
  return () => oyentes.delete(o)
}

/** Abre el diálogo (o se suma al que ya está abierto). true si la persona volvió a entrar. */
export function pedirReingreso(error) {
  if (!pendiente) {
    let resolver
    const promesa = new Promise((r) => {
      resolver = r
    })
    pendiente = { error, promesa, resolver }
    avisar()
  }
  return pendiente.promesa
}

function terminar(ok) {
  if (!pendiente) return
  const { resolver } = pendiente
  pendiente = null
  // Sin volver a entrar, para el panel ya no hay sesión: la próxima pantalla lleva a Ingresar.
  if (!ok) ponerSesion(null)
  avisar()
  resolver(ok)
}

const CAMPOS = ['email', 'clave']

/** @param {{ alCambiarRol?: () => void }} props */
export function ReingresoDialogo({ alCambiarRol }) {
  const actual = useSyncExternalStore(suscribir, () => pendiente)
  const dialogo = useRef(null)
  const campoClave = useRef(null)
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  // Entró otra cuenta: la página se está yendo al Inicio.
  const [otraCuenta, setOtraCuenta] = useState(false)
  const textoOtra = useRef(null)
  const envio = useEnvio(CAMPOS)
  const { limpiar } = envio
  // El botón que tenía el foco ya no está: el foco va al aviso, así el lector lo dice.
  useEffect(() => {
    if (otraCuenta) textoOtra.current?.focus()
  }, [otraCuenta])

  useEffect(() => {
    const d = dialogo.current
    if (actual && !d.open) {
      const correo = sesionConocida()?.usuario.email ?? ''
      setEmail(correo)
      setClave('')
      limpiar()
      d.showModal()
      // Con la temporal vencida, el único botón; si no, la contraseña (el correo ya está) o el correo.
      requestAnimationFrame(() => {
        const destino = esTemporalVencida(actual.error)
          ? d.querySelector('button')
          : correo
            ? campoClave.current
            : d.querySelector('input')
        destino?.focus()
      })
    } else if (!actual && d.open) {
      d.close()
    }
  }, [actual, limpiar])

  async function alEnviar(e) {
    e.preventDefault()
    if (otraCuenta) return
    const r = await envio.enviar(() => api.post('/sesion', { email, clave }, { sinReingreso: true }))
    if (!r.ok) return
    setClave('')
    const queHacer = queHacerAlReingresar(sesionConocida(), r.datos)
    ponerSesion(r.datos)
    if (queHacer === 'otra-cuenta') {
      // El pedido de atrás no se repite ni se termina: la página se va. Sin la pregunta por los cambios sin guardar
      // (ni la del navegador): lo escrito era de la otra cuenta.
      descartarCambiosSinGuardar()
      setOtraCuenta(true)
      window.location.assign(`${RUTA_PANEL}/`)
      return
    }
    terminar(true)
    if (queHacer === 'otro-rol') alCambiarRol?.()
  }

  function irAIngresar() {
    descartarCambiosSinGuardar()
    terminar(false)
    window.location.assign(`${RUTA_PANEL}/ingresar`)
  }

  const vencida = Boolean(actual) && esTemporalVencida(actual.error)
  return (
    <Dialogo
      ref={dialogo}
      aria-labelledby="reingreso-titulo"
      aria-describedby={vencida ? 'reingreso-vencida' : otraCuenta ? 'reingreso-otra' : 'reingreso-texto'}
      onCancel={(e) => {
        // Con otra cuenta ya no hay nada que cerrar: la página se está yendo.
        if (otraCuenta) e.preventDefault()
      }}
      onClose={() => {
        // Escape o "Ahora no": el pedido de atrás termina con el 401.
        if (vencida) descartarCambiosSinGuardar()
        terminar(false)
      }}
    >
      {vencida ? (
        <div className="grid gap-4">
          <h2 id="reingreso-titulo" className="text-xl font-bold">
            Tu contraseña temporal venció
          </h2>
          <Aviso tipo="atencion">
            <p id="reingreso-vencida">
              {actual.error.message} Con ella ya no se puede entrar ni guardar nada: cuando tengas la nueva, ingresá con
              ella.
            </p>
          </Aviso>
          <div>
            <Boton onClick={irAIngresar}>Ir a Ingresar</Boton>
          </div>
        </div>
      ) : otraCuenta ? (
        <div className="grid gap-4">
          <h2 id="reingreso-titulo" className="text-xl font-bold">
            Entraste con otra cuenta
          </h2>
          <p id="reingreso-otra" ref={textoOtra} tabIndex={-1}>
            El panel vuelve a empezar desde el Inicio, con tu cuenta. Lo que había en la pantalla era de la otra
            cuenta y no se guardó.
          </p>
        </div>
      ) : (
        <form onSubmit={alEnviar} noValidate className="grid gap-4">
          <h2 id="reingreso-titulo" className="text-xl font-bold">
            Volvé a ingresar
          </h2>
          <p id="reingreso-texto">
            Tu sesión terminó: pasaron dos horas sin usar el panel o se cerró desde otro lado. Ingresá de nuevo para
            seguir; lo que estabas haciendo no se pierde.
          </p>
          <ResumenErrores envio={envio} etiquetas={{ email: 'Correo', clave: 'Contraseña' }} prefijo="reingreso-" />
          <Campo
            id="reingreso-email"
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
            id="reingreso-clave"
            etiqueta="Contraseña"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            error={envio.errores.clave}
            entradaRef={campoClave}
          />
          <div className="flex flex-wrap gap-3">
            <Boton type="submit" ocupado={envio.enviando}>
              {envio.enviando ? 'Ingresando…' : 'Ingresar'}
            </Boton>
            <Boton variante="secundario" onClick={() => terminar(false)}>
              Ahora no
            </Boton>
          </div>
          <p className="text-sm text-tenue">
            Si tu contraseña no funciona, pedile ayuda a un administrador: puede darte una contraseña temporal o
            revisar que tu cuenta esté activa.
          </p>
        </form>
      )}
    </Dialogo>
  )
}
