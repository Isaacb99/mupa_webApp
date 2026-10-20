// Mensajes (E4.9; plan 5.2 y 8), solo para admins: los mensajes del formulario de contacto del sitio, en una lista de
// solo lectura (GET /administracion/api/mensajes?pagina=, 50 por página), del más nuevo al más viejo. Cada uno con la fecha,
// el nombre, el correo (un enlace mailto: para responder desde el programa de correo), el mensaje y si salió por correo
// ("Enviado por correo", "No se pudo enviar por correo" con su código o, si se cortó en el medio, "Envío sin
// confirmar"). Sin borrar, responder ni reintentar (el reintento está en la fase 2): la tarea diaria del sitio los
// borra a los 180 días.
// - La página va en la dirección del panel (/mensajes?pagina=2): Atrás vuelve a la misma. Una página que no es un
//   número se toma como la primera; una que pasa del total lo dice y ofrece ir a la primera.
// - Al cambiar de página, la cuenta se anuncia (role="status") y el foco va a ella (como en Novedades).
import { useEffect, useRef, useState } from 'react'
import { Link, useLoaderData, useLocation } from 'react-router'
import { api } from '../api.js'
import { clasesBoton } from '../componentes/Boton.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { fechaHora } from '../formato.js'

/** La página pedida en la dirección (?pagina=): un entero de 1 en adelante; si no, 1. */
export function paginaDeLaDireccion(params) {
  const texto = params.get('pagina') ?? ''
  return /^[1-9]\d{0,5}$/.test(texto) ? Number(texto) : 1
}

/** El loader (rutas.jsx lo envuelve con la sesión y el rol de admin). */
export async function cargarMensajes({ request }) {
  const pagina = paginaDeLaDireccion(new URL(request.url).searchParams)
  return api.get(`/mensajes${pagina > 1 ? `?pagina=${pagina}` : ''}`, { signal: request.signal })
}

const ENVIO = {
  enviado: { texto: 'Enviado por correo', clases: 'border-ok bg-ok-fondo text-ok' },
  fallido: { texto: 'No se pudo enviar por correo', clases: 'border-error bg-error-fondo text-error' },
  pendiente: { texto: 'Envío sin confirmar', clases: 'border-atencion bg-atencion-fondo text-atencion' },
}

const aPagina = (n) => (n > 1 ? `/mensajes?pagina=${n}` : '/mensajes')

export default function Mensajes() {
  const { items, total, pagina, paginas } = useLoaderData()
  const { search } = useLocation()
  const sinPagina = pagina > paginas
  const cuenta =
    total === 0
      ? 'Todavía no llegó ningún mensaje.'
      : `${total === 1 ? 'Un mensaje' : `${total} mensajes`}${paginas > 1 ? `: página ${Math.min(pagina, paginas)} de ${paginas}` : ''}.`
  const [anuncio, setAnuncio] = useState('')
  const busquedaAnterior = useRef(search)
  const enfocarCuenta = useRef(false)
  const cuentaRef = useRef(null)
  useEffect(() => {
    if (busquedaAnterior.current === search) return
    busquedaAnterior.current = search
    setAnuncio(cuenta)
    if (enfocarCuenta.current) {
      enfocarCuenta.current = false
      cuentaRef.current?.focus()
    }
  }, [search, cuenta])
  const alCambiarDePagina = () => {
    enfocarCuenta.current = true
  }

  return (
    <>
      <Encabezado titulo="Mensajes" />
      <p className="max-w-3xl">
        Los mensajes que llegan por el formulario de contacto del sitio, del más nuevo al más viejo. Cada uno sale
        también por correo a la dirección de destino de Datos del museo; si no pudo salir, queda acá igual. Para
        responder, escribile a la persona desde tu correo. Se borran solos a los 180 días.
      </p>

      <p ref={cuentaRef} tabIndex={-1} className="mt-6 font-semibold">
        {cuenta}
      </p>
      <p role="status" className="sr-only">
        {anuncio}
      </p>

      {sinPagina && total > 0 ? (
        <p className="mt-4">
          Esta página no existe.{' '}
          {/* 44 px de alto, como los demás enlaces sueltos del panel (A11Y-05 de la verificación de E4). */}
          <Link to={aPagina(1)} className="inline-flex min-h-11 items-center">
            Ir a la primera página
          </Link>
          .
        </p>
      ) : null}

      {items.length ? (
        <ol className="mt-4 grid gap-4">
          {items.map((m) => {
            const envio = ENVIO[m.envio] ?? ENVIO.pendiente
            return (
              <li key={m.id}>
                <article aria-labelledby={`mensaje-${m.id}`} className="grid gap-2 rounded-md border-2 border-suave p-4">
                  <h2 id={`mensaje-${m.id}`} className="text-lg font-bold wrap-anywhere">
                    {m.nombre}
                  </h2>
                  <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <a href={`mailto:${m.email}`} className="inline-flex min-h-11 items-center wrap-anywhere">
                      {m.email}
                    </a>
                    <span className="text-tenue">{fechaHora(m.fecha)}</span>
                    <span className={`rounded-md border-l-4 px-2 py-0.5 text-sm font-semibold ${envio.clases}`}>
                      {envio.texto}
                      {m.envio === 'fallido' && m.error ? ` (código ${m.error})` : ''}
                    </span>
                  </p>
                  <p className="max-w-3xl whitespace-pre-wrap wrap-anywhere">{m.mensaje}</p>
                </article>
              </li>
            )
          })}
        </ol>
      ) : null}

      {paginas > 1 ? (
        <nav aria-label="Páginas de mensajes" className="mt-6 flex flex-wrap items-center gap-4">
          {pagina > 1 && !sinPagina ? (
            <Link to={aPagina(pagina - 1)} className={clasesBoton('secundario')} onClick={alCambiarDePagina}>
              Anterior
            </Link>
          ) : null}
          <span>
            Página {Math.min(pagina, paginas)} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link to={aPagina(pagina + 1)} className={clasesBoton('secundario')} onClick={alCambiarDePagina}>
              Siguiente
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  )
}
