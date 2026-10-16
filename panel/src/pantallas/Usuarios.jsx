// Usuarios (plan 4.3, 4.4 y 5.2), solo para admins: las cuentas del panel y el alta de una persona.
// - Lista (GET /usuarios): nombre, correo, rol, estado (activa, desactivada, con la temporal sin cambiar o vencida) y
//   último acceso. Por cuenta (nunca la propia, que se maneja en Mi cuenta): cambiar el rol, desactivar o activar
//   (PATCH /usuarios/:id), "Dar contraseña temporal" (POST /usuarios/:id/clave-temporal) y cerrar sus sesiones
//   (DELETE /usuarios/:id/sesiones). Lo que quita acceso pide confirmación.
// - Una cuenta desactivada no puede entrar (el ingreso solo busca cuentas activas): su ficha ofrece "Activar" y no
//   "Dar contraseña temporal" (la API la rechaza con un 409); al activarla, el "Listo" dice que, si no recuerda su
//   contraseña, le dé una temporal, y el botón aparece en su ficha.
// - Alta (POST /usuarios): nombre, correo y rol. La contraseña temporal (de un alta o de "Dar contraseña temporal")
//   se muestra UNA vez en el diálogo ClaveTemporal.
// - Un alta que se guardó sin que llegara la respuesta (sin conexión o un 5xx de por medio), como en Tarifas: después
//   de ese error, o del "Ya hay una cuenta con ese correo." al reintentar, se vuelve a pedir la lista y, si la cuenta
//   está (y no estaba antes), el formulario se vacía, la cuenta aparece y un aviso explica que se creó pero que su
//   temporal no se pudo mostrar, con "Dar contraseña temporal" ahí mismo (al cerrar la temporal, el foco va a la ficha
//   de esa cuenta: el aviso ya no está).
// - El resultado de una acción sobre una cuenta ("Listo: …" o el error, también el 409 del último admin, que dice qué
//   hacer) se muestra en la ficha de esa cuenta, debajo de sus botones: ahí vuelve el foco al cerrarse la confirmación
//   (arriba de todo quedaba fuera de la pantalla). El del alta, debajo de "Dar de alta". Con un solo admin activo, un
//   aviso arriba: lo recomendable son dos.
import { useEffect, useRef, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { esquemaAltaUsuario } from '../../../compartido/esquemas/usuarios.js'
import { api, quizasGuardo } from '../api.js'
import { Aviso } from '../componentes/Aviso.jsx'
import { Boton } from '../componentes/Boton.jsx'
import { Campo } from '../componentes/Campo.jsx'
import { ClaveTemporal } from '../componentes/ClaveTemporal.jsx'
import { Confirmar } from '../componentes/Confirmar.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { ResumenErrores, useCambiosSinGuardar, useEnvio } from '../componentes/formulario.jsx'
import { fechaHora, validarCon } from '../formato.js'
import { useSesion } from '../sesion.jsx'

/** El loader (rutas.jsx lo envuelve con la sesión y el rol de admin). */
export const cargarUsuarios = ({ request }) => api.get('/usuarios', { signal: request.signal })

const ROLES = { admin: 'Administrador', editor: 'Editor' }
const PREFIJO = 'alta-'
/** Los ids de los botones de una ficha a los que vuelve el foco. */
const idBoton = (accion, u) => `cuenta-${accion}-${u.id}`
const CAMPOS_ALTA = ['nombre', 'email', 'rol']
const ALTA_VACIA = { nombre: '', email: '', rol: 'editor' }

const ordenar = (lista) => [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es') || a.id - b.id)

/** Lo que pide confirmación, por acción: título, texto, botón y si es peligrosa. */
function textosDe(accion, u) {
  switch (accion) {
    case 'hacerAdmin':
      return {
        titulo: `¿Hacer administrador a ${u.nombre}?`,
        texto:
          'Va a poder dar de alta cuentas, dar contraseñas temporales, cambiar roles y ver y cambiar el correo de destino del formulario.',
        boton: 'Hacer administrador',
      }
    case 'hacerEditor':
      return {
        titulo: `¿Pasar a ${u.nombre} a editor?`,
        texto:
          'Deja de poder administrar las cuentas. Se cierran sus sesiones abiertas: cuando vuelva a entrar, ya va a ser editor.',
        boton: 'Pasar a editor',
        peligro: true,
      }
    case 'desactivar':
      return {
        titulo: `¿Desactivar la cuenta de ${u.nombre}?`,
        texto:
          'No va a poder entrar al panel y se cierran sus sesiones abiertas. Lo que cargó sigue en el sitio. Podés volver a activarla cuando quieras.',
        boton: 'Desactivar',
        peligro: true,
      }
    case 'temporal':
      return {
        titulo: `¿Dar una contraseña temporal a ${u.nombre}?`,
        texto:
          'Su contraseña actual deja de servir y se cierran sus sesiones abiertas. La temporal se muestra una sola vez: tenela a mano para pasársela.',
        boton: 'Dar contraseña temporal',
      }
    case 'cerrarSesiones':
      return {
        titulo: `¿Cerrar las sesiones de ${u.nombre}?`,
        texto:
          'Va a tener que volver a entrar en todos sus dispositivos. Sirve si dejó el panel abierto en una computadora que no es suya.',
        boton: 'Cerrar sus sesiones',
      }
    default:
      return null
  }
}

/** El estado de la cuenta, en palabras. */
function estadoDe(u, ahora) {
  if (!u.activo) return 'Desactivada: no puede entrar. Para que vuelva a entrar, activala.'
  if (u.debeCambiarClave && u.claveTemporalVence) {
    return new Date(u.claveTemporalVence) <= ahora
      ? `La contraseña temporal venció el ${fechaHora(u.claveTemporalVence)}: dale otra.`
      : `Activa. Todavía no eligió su contraseña: la temporal vence el ${fechaHora(u.claveTemporalVence)}.`
  }
  return 'Activa.'
}

export default function Usuarios() {
  const inicial = useLoaderData()
  const sesion = useSesion()
  const yo = sesion?.usuario.id
  const [usuarios, setUsuarios] = useState(() => ordenar(inicial))
  // El resultado de la última acción sobre una cuenta: { id, tipo: 'ok' | 'error', titulo?, texto }.
  const [resultado, setResultado] = useState(null)
  const [okAlta, setOkAlta] = useState(null)
  const [pendiente, setPendiente] = useState(null) // { accion, usuario }
  const [trabajando, setTrabajando] = useState(false)
  const [temporal, setTemporal] = useState(null)
  // La cuenta que se creó sin que llegara la respuesta del alta (su temporal no se vio): el aviso debajo del alta.
  const [sinTemporal, setSinTemporal] = useState(null)
  // Un alta quedó sin respuesta: si al reintentar el correo ya existe, puede ser esa misma.
  const altaSinRespuesta = useRef(false)
  const avisoSinTemporal = useRef(null)
  // El aviso aparece debajo de "Dar de alta" (que conserva el foco): que quede a la vista.
  useEffect(() => {
    if (sinTemporal) avisoSinTemporal.current?.scrollIntoView({ block: 'nearest' })
  }, [sinTemporal])
  // A dónde va el foco después del próximo dibujo (después de que se cerró un diálogo).
  const [foco, setFoco] = useState(null)
  useEffect(() => {
    if (!foco) return
    document.getElementById(foco)?.focus()
    setFoco(null)
  }, [foco])
  const [alta, setAlta] = useState(ALTA_VACIA)
  const envio = useEnvio(CAMPOS_ALTA)
  const { dialogo, liberar } = useCambiosSinGuardar(alta.nombre.trim() !== '' || alta.email.trim() !== '')
  const ahora = new Date()
  const adminsActivos = usuarios.filter((u) => u.rol === 'admin' && u.activo).length

  const reemplazar = (u) => setUsuarios((lista) => ordenar(lista.map((x) => (x.id === u.id ? u : x))))
  const recargar = async () => {
    const lista = ordenar(await api.get('/usuarios'))
    setUsuarios(lista)
    return lista
  }

  const listo = (u, texto) => setResultado({ id: u.id, tipo: 'ok', texto })

  function pedirAccion(accion, usuario) {
    setResultado(null)
    setOkAlta(null)
    if (accion === 'activar') return ejecutar('activar', usuario)
    setPendiente({ accion, usuario })
  }

  async function ejecutar(accion, u) {
    setTrabajando(true)
    try {
      if (accion === 'hacerAdmin' || accion === 'hacerEditor') {
        const r = await api.patch(`/usuarios/${u.id}`, { rol: accion === 'hacerAdmin' ? 'admin' : 'editor' })
        reemplazar(r.usuario)
        listo(
          u,
          accion === 'hacerAdmin'
            ? `Listo: ${u.nombre} ahora es administrador.`
            : `Listo: ${u.nombre} ahora es editor.`,
        )
      } else if (accion === 'desactivar' || accion === 'activar') {
        const r = await api.patch(`/usuarios/${u.id}`, { activo: accion === 'activar' })
        reemplazar(r.usuario)
        listo(
          u,
          accion === 'activar'
            ? `Listo: la cuenta de ${u.nombre} está activa y puede entrar con su contraseña. Si no la recuerda, dale una con «Dar contraseña temporal».`
            : `Listo: la cuenta de ${u.nombre} quedó desactivada.`,
        )
      } else if (accion === 'temporal') {
        const r = await api.post(`/usuarios/${u.id}/clave-temporal`)
        // Si era la cuenta del alta sin respuesta, ese aviso ya no hace falta (y el diálogo dice que la cuenta se creó).
        const delAlta = sinTemporal?.id === u.id
        if (delAlta) setSinTemporal(null)
        setPendiente(null)
        setTemporal({
          nombre: u.nombre,
          email: u.email,
          claveTemporal: r.claveTemporal,
          alta: delAlta,
          volverA: idBoton('temporal', u),
        })
        await recargar().catch(() => {})
        listo(u, `Le diste una contraseña temporal a ${u.nombre}.`)
        return
      } else if (accion === 'cerrarSesiones') {
        const r = await api.delete(`/usuarios/${u.id}/sesiones`)
        listo(
          u,
          r.cerradas === 1
            ? `Se cerró la sesión abierta de ${u.nombre}.`
            : r.cerradas
              ? `Se cerraron las ${r.cerradas} sesiones abiertas de ${u.nombre}.`
              : `${u.nombre} no tenía sesiones abiertas.`,
        )
      }
      setPendiente(null)
    } catch (err) {
      setPendiente(null)
      setResultado({
        id: u.id,
        tipo: 'error',
        titulo:
          accion === 'temporal'
            ? `No se pudo dar la contraseña temporal a ${u.nombre}`
            : err?.status === 409
              ? `No se pudo cambiar a ${u.nombre}`
              : 'No se pudo hacer el cambio',
        texto: err?.message ?? 'Probá de nuevo en unos minutos.',
      })
      // Otro admin pudo haberla cambiado mientras tanto (p. ej. desactivada): la ficha, con lo que hay ahora; si el
      // botón que tenía el foco ya no está, el foco va a "Activar".
      if (err?.status === 409 || err?.status === 404) {
        const lista = await recargar().catch(() => null)
        if (lista?.some((x) => x.id === u.id && !x.activo)) setFoco(idBoton('activar', u))
      }
    } finally {
      setTrabajando(false)
    }
  }

  async function darDeAlta(e) {
    e.preventDefault()
    setResultado(null)
    setOkAlta(null)
    setSinTemporal(null)
    const v = validarCon(esquemaAltaUsuario, alta)
    if (!v.ok) {
      envio.mostrar(v.errores, v.general)
      return
    }
    const antes = new Set(usuarios.map((x) => x.id))
    const dudosa = altaSinRespuesta.current
    const r = await envio.enviar(async () => {
      try {
        return await api.post('/usuarios', v.datos)
      } catch (err) {
        // ¿Se guardó igual? Sin respuesta (o un 5xx), o el correo repetido al reintentar después de un alta sin
        // respuesta: la lista lo dice. Si no está (o ya estaba antes), el error se muestra como siempre.
        const sinRespuesta = quizasGuardo(err)
        if (sinRespuesta) altaSinRespuesta.current = true
        if (!sinRespuesta && !(dudosa && err?.status === 409 && err?.campos?.email)) throw err
        const lista = await api.get('/usuarios').catch(() => null)
        const creada = lista?.find((x) => x.email === v.datos.email && !antes.has(x.id))
        if (!creada) throw err
        return { usuario: creada, lista }
      }
    })
    if (!r.ok) return
    altaSinRespuesta.current = false
    liberar()
    setAlta(ALTA_VACIA)
    const { usuario, claveTemporal, lista } = r.datos
    if (lista) {
      // Se creó, pero la temporal no llegó: el aviso de abajo ofrece darle una.
      setUsuarios(ordenar(lista))
      setSinTemporal(usuario)
      return
    }
    setUsuarios((l) => ordenar([...l.filter((x) => x.id !== usuario.id), usuario]))
    // Un alta anterior sin respuesta (con otro correo) puede haberse guardado: que aparezca en la lista.
    if (dudosa) recargar().catch(() => {})
    setTemporal({ nombre: usuario.nombre, email: usuario.email, claveTemporal, alta: true })
    setOkAlta(`Listo: ${usuario.nombre} ya tiene su cuenta.`)
  }

  const confirmacion = pendiente ? textosDe(pendiente.accion, pendiente.usuario) : null

  return (
    <>
      <Encabezado titulo="Usuarios" />
      <p className="max-w-3xl">
        Las personas que pueden entrar al panel. Los editores cargan y cambian el contenido del sitio; los
        administradores además manejan las cuentas y el correo de destino del formulario.
      </p>

      {adminsActivos <= 1 ? (
        <Aviso tipo="atencion" titulo="Hay un solo administrador" className="mt-6">
          <p>
            Si esa cuenta no puede entrar, nadie puede dar de alta usuarios ni dar contraseñas temporales. Lo
            recomendable son dos: hacé administradora a otra persona de confianza.
          </p>
        </Aviso>
      ) : null}

      <section aria-labelledby="usuarios-cuentas" className="mt-8">
        <h2 id="usuarios-cuentas" className="text-2xl font-bold">
          Cuentas
        </h2>
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {usuarios.map((u) => {
            const esYo = u.id === yo
            const suyo = resultado?.id === u.id ? resultado : null
            return (
              <li
                key={u.id}
                className={`rounded-md border-2 p-4 ${u.activo ? 'border-suave' : 'border-dashed border-linea bg-fondo-2'}`}
              >
                <h3 className="text-lg font-bold break-words">
                  {u.nombre}
                  {esYo ? <span className="font-normal text-tenue"> (vos)</span> : null}
                </h3>
                <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
                  <dt className="font-semibold">Correo</dt>
                  <dd className="wrap-anywhere">{u.email}</dd>
                  <dt className="font-semibold">Rol</dt>
                  <dd>{ROLES[u.rol] ?? u.rol}</dd>
                  <dt className="font-semibold">Estado</dt>
                  <dd>{estadoDe(u, ahora)}</dd>
                  <dt className="font-semibold">Último acceso</dt>
                  <dd>{u.ultimoAcceso ? fechaHora(u.ultimoAcceso) : 'Todavía no entró.'}</dd>
                </dl>
                {esYo ? (
                  <p className="mt-3 text-tenue">
                    Es tu cuenta: tu nombre y tu contraseña se cambian en <Link to="/cuenta">Mi cuenta</Link>.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {u.rol === 'admin' ? (
                      <Boton variante="secundario" onClick={() => pedirAccion('hacerEditor', u)}>
                        Pasar a editor<span className="sr-only">: {u.nombre}</span>
                      </Boton>
                    ) : (
                      <Boton variante="secundario" onClick={() => pedirAccion('hacerAdmin', u)}>
                        Hacer administrador<span className="sr-only">: {u.nombre}</span>
                      </Boton>
                    )}
                    {u.activo ? (
                      <Boton variante="secundario" onClick={() => pedirAccion('desactivar', u)}>
                        Desactivar<span className="sr-only"> la cuenta de {u.nombre}</span>
                      </Boton>
                    ) : (
                      <Boton
                        id={idBoton('activar', u)}
                        variante="secundario"
                        ocupado={trabajando}
                        onClick={() => pedirAccion('activar', u)}
                      >
                        Activar<span className="sr-only"> la cuenta de {u.nombre}</span>
                      </Boton>
                    )}
                    {/* Desactivada, una temporal no le serviría para entrar: primero se activa. */}
                    {u.activo ? (
                      <Boton id={idBoton('temporal', u)} variante="secundario" onClick={() => pedirAccion('temporal', u)}>
                        Dar contraseña temporal<span className="sr-only"> a {u.nombre}</span>
                      </Boton>
                    ) : null}
                    {u.activo ? (
                      <Boton variante="secundario" onClick={() => pedirAccion('cerrarSesiones', u)}>
                        Cerrar sus sesiones<span className="sr-only">: {u.nombre}</span>
                      </Boton>
                    ) : null}
                  </div>
                )}
                {esYo ? null : (
                  <>
                    {/* La región del "Listo" está siempre (vacía): así el lector la anuncia al cambiar. */}
                    <Aviso tipo="ok" className="mt-3">
                      {suyo?.tipo === 'ok' ? suyo.texto : null}
                    </Aviso>
                    {suyo?.tipo === 'error' ? (
                      <Aviso tipo="error" titulo={suyo.titulo} className="mt-3">
                        {suyo.texto}
                      </Aviso>
                    ) : null}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="usuarios-alta" className="mt-12 max-w-xl">
        <h2 id="usuarios-alta" className="text-2xl font-bold">
          Dar de alta a una persona
        </h2>
        <p className="mt-2">
          El panel le da una contraseña temporal, que vas a ver una sola vez. No se manda ningún correo: se la pasás
          vos.
        </p>
        <form onSubmit={darDeAlta} noValidate className="mt-4 grid gap-5">
          <ResumenErrores
            envio={envio}
            prefijo={PREFIJO}
            etiquetas={{ nombre: 'Nombre', email: 'Correo', rol: 'Rol' }}
          />
          <Campo
            id={`${PREFIJO}nombre`}
            etiqueta="Nombre"
            obligatorio
            autoComplete="off"
            maxLength={100}
            value={alta.nombre}
            onChange={(e) => setAlta((a) => ({ ...a, nombre: e.target.value }))}
            error={envio.errores.nombre}
          />
          <Campo
            id={`${PREFIJO}email`}
            etiqueta="Correo"
            obligatorio
            ayuda="Es su usuario para entrar. Tiene que ser de esa persona, aunque el panel no le escribe."
            type="email"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            maxLength={254}
            value={alta.email}
            onChange={(e) => setAlta((a) => ({ ...a, email: e.target.value }))}
            error={envio.errores.email}
          />
          <fieldset
            id={`${PREFIJO}rol`}
            tabIndex={-1}
            aria-describedby={envio.errores.rol ? `${PREFIJO}rol-error` : undefined}
            className="grid gap-1"
          >
            <legend className="font-semibold">Rol</legend>
            {envio.errores.rol ? (
              <p id={`${PREFIJO}rol-error`} className="text-sm font-semibold text-error">
                <span className="sr-only">Error: </span>
                {envio.errores.rol}
              </p>
            ) : null}
            {[
              ['editor', 'Editor', 'Carga y cambia el contenido: visitas, datos del museo, novedades, exposiciones.'],
              [
                'admin',
                'Administrador',
                'Lo mismo, y además maneja las cuentas y el correo de destino del formulario.',
              ],
            ].map(([valor, texto, ayuda]) => (
              // El nombre del radio es solo el rol; la explicación va como su descripción (dentro de la etiqueta,
              // el lector la decía entera como nombre).
              <div key={valor} className="grid grid-cols-[auto_1fr] gap-x-3">
                <input
                  id={`${PREFIJO}rol-${valor}`}
                  type="radio"
                  name="rol"
                  value={valor}
                  checked={alta.rol === valor}
                  onChange={() => setAlta((a) => ({ ...a, rol: valor }))}
                  aria-describedby={`${PREFIJO}rol-${valor}-ayuda`}
                  className="mt-2.5 size-6 shrink-0 cursor-pointer accent-accion"
                />
                <label
                  htmlFor={`${PREFIJO}rol-${valor}`}
                  className="flex min-h-11 cursor-pointer items-center font-semibold"
                >
                  {texto}
                </label>
                <p id={`${PREFIJO}rol-${valor}-ayuda`} className="col-start-2 text-sm text-tenue">
                  {ayuda}
                </p>
              </div>
            ))}
          </fieldset>
          <div>
            <Boton type="submit" ocupado={envio.enviando}>
              {envio.enviando ? 'Dando de alta…' : 'Dar de alta'}
            </Boton>
          </div>
          <Aviso tipo="ok">{okAlta}</Aviso>
          {/* Región viva siempre presente (vacía), así el lector anuncia el aviso al aparecer. */}
          <div ref={avisoSinTemporal} role="status">
            {sinTemporal ? (
              <Aviso tipo="atencion" titulo={`La cuenta de ${sinTemporal.nombre} quedó creada`}>
                <p>
                  Pero la respuesta del panel no llegó y su contraseña temporal no se pudo mostrar. Dale una ahora: la
                  de la cuenta nueva no la vio nadie.
                </p>
                <div className="mt-3">
                  <Boton variante="secundario" onClick={() => pedirAccion('temporal', sinTemporal)}>
                    Dar contraseña temporal<span className="sr-only"> a {sinTemporal.nombre}</span>
                  </Boton>
                </div>
              </Aviso>
            ) : null}
          </div>
        </form>
      </section>

      <Confirmar
        abierto={Boolean(confirmacion)}
        titulo={confirmacion?.titulo ?? ''}
        confirmar={confirmacion?.boton ?? 'Confirmar'}
        peligro={Boolean(confirmacion?.peligro)}
        ocupado={trabajando}
        alCancelar={() => setPendiente(null)}
        alConfirmar={() => ejecutar(pendiente.accion, pendiente.usuario)}
      >
        {confirmacion?.texto ?? ''}
      </Confirmar>
      <ClaveTemporal
        datos={temporal}
        alCerrar={() => {
          setTemporal(null)
          if (temporal?.volverA) setFoco(temporal.volverA)
        }}
      />
      {dialogo}
    </>
  )
}
