// El alta de una novedad, una muestra o una sala (plan 4.3 y 5.2; E3.3 y E3.4): /novedades/nueva, /muestras/nueva y
// /salas/nueva. Pide solo el tipo y el título (el nombre, en una sala): POST /<tipo> crea un BORRADOR (la dirección
// web sale del título) y se sigue en su ficha, con el aviso de qué falta. Lo demás se completa ahí.
// - Se valida con el mismo esquema del servidor antes de mandar; lo escrito cuenta como cambio sin guardar.
// - Si el alta se queda sin respuesta (sin conexión o un error del servidor de por medio), puede haberse creado igual:
//   antes de mandarla de nuevo se busca en el listado un borrador con ese mismo título, de esta persona y de recién
//   (como en Tarifas y Usuarios); si está, se va a su ficha en vez de crear otro.
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ESQUEMAS_CONTENIDO, NOMBRE_SALA_MAX, TITULO_MAX } from '../../../../compartido/esquemas/contenido.js'
import { api, quizasGuardo } from '../../api.js'
import { Boton } from '../../componentes/Boton.jsx'
import { Campo } from '../../componentes/Campo.jsx'
import { Encabezado } from '../../componentes/Encabezado.jsx'
import { ResumenErrores, useCambiosSinGuardar, useEnvio } from '../../componentes/formulario.jsx'
import { CONTENIDOS } from '../../contenidos.js'
import { validarCon } from '../../formato.js'
import { ponerAviso, sesionConocida } from '../../sesion.jsx'

/** El borrador que se creó sin que llegara la respuesta, si está: mismo título, de esta persona y de recién. */
async function buscarElQueQuizasSeCreo(c, titulo, desde) {
  const { items } = await api.get(`${c.api}?estado=borrador&q=${encodeURIComponent(titulo.slice(0, 100))}&por=20`)
  const yo = sesionConocida()?.usuario?.nombre
  return items.find(
    (x) =>
      x[c.campoTitulo] === titulo &&
      x.ultimaEdicion?.nombre === yo &&
      new Date(x.ultimaEdicion.fecha).getTime() >= desde - 60_000,
  )
}

/** @param {{ tipo: 'novedades' | 'muestras' | 'salas' }} props */
export function Nuevo({ tipo }) {
  const c = CONTENIDOS[tipo]
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [tipoElegido, setTipoElegido] = useState(c.tipos?.[0].valor ?? null)
  const envio = useEnvio([c.campoTitulo, 'tipo'])
  const { dialogo, liberar } = useCambiosSinGuardar(titulo.trim() !== '')
  // Un alta anterior quedó sin respuesta: desde cuándo.
  const sinRespuesta = useRef(null)
  const max = tipo === 'salas' ? NOMBRE_SALA_MAX : TITULO_MAX

  async function alEnviar(e) {
    e.preventDefault()
    const cuerpo = c.tipos ? { tipo: tipoElegido, [c.campoTitulo]: titulo } : { [c.campoTitulo]: titulo }
    const v = validarCon(ESQUEMAS_CONTENIDO[tipo].alta, cuerpo)
    if (!v.ok) {
      envio.mostrar(v.errores, v.general)
      return
    }
    const r = await envio.enviar(async () => {
      if (sinRespuesta.current) {
        const ya = await buscarElQueQuizasSeCreo(c, v.datos[c.campoTitulo], sinRespuesta.current)
        if (ya) return ya
      }
      return api.post(c.api, v.datos)
    })
    if (!r.ok) {
      if (quizasGuardo(r.error)) sinRespuesta.current ??= Date.now()
      return
    }
    liberar()
    ponerAviso(
      tipo === 'salas'
        ? 'Se creó la sala como borrador. Completá el resumen y la portada y, cuando esté lista, publicala.'
        : `Se creó ${c.la} como borrador. Completá lo que falta y, cuando esté lista, publicala.`,
    )
    navigate(c.ficha(r.datos.id), { replace: true })
  }

  return (
    <>
      <p className="mb-2">
        <Link to={c.lista} className="inline-flex min-h-11 items-center">
          Volver a {c.textoLista}
        </Link>
      </p>
      <Encabezado titulo={c.nuevaTexto} />
      <p className="max-w-3xl">
        Se crea como borrador: no está en el sitio hasta que la publiques. Después de crearla completás los demás
        datos (el resumen, la portada{tipo === 'salas' ? ' y la descripción' : ', el texto y las fotos'}).
      </p>
      <form noValidate onSubmit={alEnviar} className="mt-8 grid max-w-3xl gap-6">
        <ResumenErrores envio={envio} etiquetas={{ [c.campoTitulo]: c.etiquetaTitulo, tipo: 'Tipo' }} />
        {c.tipos ? (
          <fieldset
            id="tipo"
            tabIndex={-1}
            aria-describedby={envio.errores.tipo ? 'tipo-error' : undefined}
            className="grid gap-1"
          >
            <legend className="font-semibold">Tipo</legend>
            {envio.errores.tipo ? (
              <p id="tipo-error" className="text-sm font-semibold text-error">
                <span className="sr-only">Error: </span>
                {envio.errores.tipo}
              </p>
            ) : null}
            {c.tipos.map(({ valor, texto, ayuda }) => (
              <div key={valor} className="grid grid-cols-[auto_1fr] gap-x-3">
                <input
                  id={`tipo-${valor}`}
                  type="radio"
                  name="tipo"
                  value={valor}
                  checked={tipoElegido === valor}
                  onChange={() => setTipoElegido(valor)}
                  // El error del grupo también en cada radio: el resumen de errores lleva al primero.
                  aria-describedby={envio.errores.tipo ? `tipo-error tipo-${valor}-ayuda` : `tipo-${valor}-ayuda`}
                  aria-invalid={envio.errores.tipo ? true : undefined}
                  className="mt-2.5 size-6 shrink-0 cursor-pointer accent-accion"
                />
                <label htmlFor={`tipo-${valor}`} className="flex min-h-11 cursor-pointer items-center font-semibold">
                  {texto}
                </label>
                <p id={`tipo-${valor}-ayuda`} className="col-start-2 text-sm text-tenue">
                  {ayuda}
                </p>
              </div>
            ))}
          </fieldset>
        ) : null}
        <Campo
          id={c.campoTitulo}
          etiqueta={c.etiquetaTitulo}
          obligatorio
          ayuda={`La dirección web de la página se arma con esto (la podés cambiar hasta publicar). Hasta ${max} caracteres (quedan ${max - titulo.length}).`}
          maxLength={max}
          autoComplete="off"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          error={envio.errores[c.campoTitulo]}
        />
        <div>
          <Boton type="submit" ocupado={envio.enviando}>
            {envio.enviando ? 'Creando…' : 'Crear el borrador'}
          </Boton>
        </div>
      </form>
      {dialogo}
    </>
  )
}
