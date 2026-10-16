// Mi cuenta (plan 4.3, 4.4 y 5.2), para cualquier rol: el nombre (PUT /cuenta), la contraseña (PUT /cuenta/clave:
// cierra las demás sesiones) y "Cerrar sesión en todos lados" (DELETE /cuenta/sesiones: también esta, así que
// termina en Ingresar). El correo es el usuario y no se cambia desde acá.
// Una sola pregunta por los cambios sin guardar para los dos formularios (React Router admite un bloqueo por vez).
// Cada "Guardado" / "Listo" se ve hasta el primer cambio en su formulario (si se vuelve a lo guardado, no reaparece).
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { nombrePersona } from '../../../compartido/esquemas/usuarios.js'
import { api } from '../api.js'
import { Aviso } from '../componentes/Aviso.jsx'
import { Boton } from '../componentes/Boton.jsx'
import { Campo } from '../componentes/Campo.jsx'
import { Confirmar } from '../componentes/Confirmar.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { CamposClave } from '../componentes/FormularioClave.jsx'
import { ResumenErrores, useCambiosSinGuardar, useEnvio } from '../componentes/formulario.jsx'
import { actualizarSesion, ponerAviso, terminarSesion, useSesion } from '../sesion.jsx'
import { validarCon } from '../formato.js'

const PREFIJO = 'cuenta-'
const ROLES = { admin: 'Administrador', editor: 'Editor' }

export default function Cuenta() {
  const sesion = useSesion()
  const navigate = useNavigate()
  const usuario = sesion?.usuario
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [nombreGuardado, setNombreGuardado] = useState(usuario?.nombre ?? '')
  const [okNombre, setOkNombre] = useState(null)
  const [okClave, setOkClave] = useState(null)
  const [claveSucia, setClaveSucia] = useState(false)
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [errorCierre, setErrorCierre] = useState(null)
  const envio = useEnvio(['nombre'])
  const nombreSucio = nombre.trim() !== nombreGuardado
  const { dialogo, liberar } = useCambiosSinGuardar(nombreSucio || claveSucia)
  const alCambiarClaveSucia = useCallback((sucia) => setClaveSucia(sucia), [])
  useEffect(() => {
    if (nombreSucio) setOkNombre(null)
  }, [nombreSucio])
  useEffect(() => {
    if (claveSucia) setOkClave(null)
  }, [claveSucia])

  async function guardarNombre(e) {
    e.preventDefault()
    setOkNombre(null)
    const v = validarCon(nombrePersona, nombre)
    if (!v.ok) {
      envio.mostrar({ nombre: v.general })
      return
    }
    const r = await envio.enviar(() => api.put('/cuenta', { nombre: v.datos }))
    if (!r.ok) return
    const guardado = r.datos.usuario.nombre
    setNombre(guardado)
    setNombreGuardado(guardado)
    actualizarSesion({ usuario: { nombre: guardado } })
    setOkNombre('Guardado: así te ven en el panel.')
  }

  async function cerrarTodo() {
    setCerrando(true)
    setErrorCierre(null)
    try {
      await api.delete('/cuenta/sesiones')
    } catch (err) {
      setCerrando(false)
      setConfirmarCierre(false)
      setErrorCierre(err?.message ?? 'No se pudo cerrar la sesión. Probá de nuevo.')
      return
    }
    liberar()
    terminarSesion()
    ponerAviso('Cerraste la sesión en todos los dispositivos, también en este.')
    navigate('/ingresar', { replace: true })
  }

  return (
    <>
      <Encabezado titulo="Mi cuenta" />
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold">Correo</dt>
        <dd className="wrap-anywhere">
          {usuario?.email} <span className="text-tenue">(es tu usuario para entrar)</span>
        </dd>
        <dt className="font-semibold">Rol</dt>
        <dd>{ROLES[usuario?.rol] ?? usuario?.rol}</dd>
      </dl>

      <section aria-labelledby="cuenta-titulo-nombre" className="mt-10 max-w-xl">
        <h2 id="cuenta-titulo-nombre" className="text-2xl font-bold">
          Tu nombre
        </h2>
        <form onSubmit={guardarNombre} noValidate className="mt-4 grid gap-5">
          <ResumenErrores envio={envio} prefijo={PREFIJO} etiquetas={{ nombre: 'Nombre' }} />
          <Campo
            id={`${PREFIJO}nombre`}
            etiqueta="Nombre"
            ayuda="Es el que ven las demás personas del panel, por ejemplo en «Última edición»."
            autoComplete="name"
            maxLength={100}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={envio.errores.nombre}
          />
          <div>
            <Boton type="submit" ocupado={envio.enviando}>
              {envio.enviando ? 'Guardando…' : 'Guardar el nombre'}
            </Boton>
          </div>
          <Aviso tipo="ok">{nombreSucio ? null : okNombre}</Aviso>
        </form>
      </section>

      <section aria-labelledby="cuenta-titulo-clave" className="mt-12 max-w-xl">
        <h2 id="cuenta-titulo-clave" className="text-2xl font-bold">
          Cambiar la contraseña
        </h2>
        <p className="mt-2 mb-4">
          Al guardarla se cierra tu sesión en los demás dispositivos y pestañas: ahí vas a tener que volver a ingresar.
        </p>
        <CamposClave
          alCambiarSucio={alCambiarClaveSucia}
          liberar={liberar}
          alGuardar={() => setOkClave('Listo: tu contraseña nueva quedó guardada.')}
        />
        <div className="mt-4">
          <Aviso tipo="ok">{claveSucia ? null : okClave}</Aviso>
        </div>
      </section>

      <section aria-labelledby="cuenta-titulo-cerrar" className="mt-12 max-w-xl">
        <h2 id="cuenta-titulo-cerrar" className="text-2xl font-bold">
          Cerrar sesión en todos lados
        </h2>
        <p className="mt-2">
          Cierra tu sesión en todos los dispositivos donde entraste, también en este. Usalo si entraste desde una
          computadora que no es tuya y no saliste, o si perdiste el celular.
        </p>
        {errorCierre ? (
          <Aviso tipo="error" className="mt-4">
            {errorCierre}
          </Aviso>
        ) : null}
        <div className="mt-4">
          <Boton variante="secundario" onClick={() => setConfirmarCierre(true)}>
            Cerrar sesión en todos lados
          </Boton>
        </div>
      </section>

      <Confirmar
        abierto={confirmarCierre}
        titulo="¿Cerrar tu sesión en todos lados?"
        confirmar="Cerrar sesión en todos lados"
        ocupado={cerrando}
        alCancelar={() => setConfirmarCierre(false)}
        alConfirmar={cerrarTodo}
      >
        Vas a tener que volver a ingresar en cada dispositivo, también en este.
      </Confirmar>
      {dialogo}
    </>
  )
}
