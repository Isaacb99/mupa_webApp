import { useEffect, useRef, useState } from 'react'
import { CONTACTO, TRAMPA } from '../../compartido/contacto.js'
import { contacto } from '../content.js'
import { BOTON, ENLACE, SUBTITULO } from './estilos.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// El formulario de contacto (E4.5, plan 8): un <form method="post" action="/contacto#formulario"> que anda sin
// JavaScript. El navegador valida con los atributos HTML (required, minLength, maxLength, type="email"; los topes de
// compartido/contacto.js) y la validación de verdad es la del servidor (server/contacto.js): el bundle público no lleva
// zod (plan 6.2). Si el servidor encuentra algo, devuelve la página con lo escrito (valores), un error por campo
// (errores: códigos, con sus textos en content.js) y arriba un resumen con enlaces a cada campo; un error de todo el
// formulario (error: los límites, que no se pudo enviar) va arriba, con el correo público si hay. El "#formulario" de la
// acción lleva la página de vuelta acá (también sin JavaScript); con JavaScript, el foco va al aviso al cargar.
// - El campo trampa (sitio_web): oculto con sr-only, aria-hidden en su envoltorio, tabindex="-1" y autocomplete="off".
//   Una persona no lo ve ni lo llena; un robot que llena todo recibe un 303 sin que se guarde ni se mande nada.
// - Sin formulario (sin casilla de envío o sin dirección de destino), solo los avisos: "Recibimos tu mensaje" (si se
//   llega con la marca de ?enviado= que pone el 303 de un envío) o "El formulario no está disponible" (si se mandó
//   justo cuando se apagó).
// - La línea de privacidad (content.js, contacto.privacidad) va debajo solo si existe: la escribe el museo.
// - Si el formulario se apagó mientras la persona escribía (503 no_disponible), lo que escribió va en un cuadro de solo
//   lectura, para copiarlo y mandarlo al correo público (CON-07 de la verificación de E4).
// - Con JavaScript, el segundo clic en Enviar no manda otra vez (durante ESPERA_REENVIO_MS: si la persona detuvo la
//   carga, después puede volver a mandarlo) y el botón dice "Enviando…" (aria-disabled, sin disabled: el primer envío
//   sigue). Sin JavaScript, el servidor reconoce el repetido (server/contacto.js, CON-02).
// - Los campos llevan scroll-margin: al llegar desde el resumen de errores, su etiqueta y su error quedan a la vista
//   (A11Y-02). Los enlaces del resumen miden 44 px de alto (A11Y-01).
// Lo escrito va como defaultValue (sin estado de React): lo que dibujó el servidor es lo que se hidrata.
const t = contacto.formulario

const CAMPOS = [
  { nombre: 'nombre', etiqueta: t.nombre, tipo: 'text', autoComplete: 'name', maxLength: CONTACTO.NOMBRE_MAX },
  { nombre: 'email', etiqueta: t.email, tipo: 'email', autoComplete: 'email', maxLength: CONTACTO.EMAIL_MAX },
  { nombre: 'mensaje', etiqueta: t.mensaje, minLength: CONTACTO.MENSAJE_MIN, maxLength: CONTACTO.MENSAJE_MAX },
]

const idDe = (campo) => `contacto-${campo}`
const textoDeError = (campo, codigo) => t.errores[campo]?.[codigo] ?? t.errores[campo]?.falta ?? ''

/** Cuánto no vuelve a mandar el formulario después de un envío (el doble clic). */
const ESPERA_REENVIO_MS = 8_000

const CONTROL =
  'mt-2 block w-full scroll-mt-32 rounded-md border bg-transparent px-4 py-3 text-lg font-light text-paper ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper'
const CONTROL_BIEN = `${CONTROL} border-muted`
const CONTROL_MAL = `${CONTROL} border-naranja`
const AVISO = 'mt-8 rounded-md border-[1.5px] px-5 py-4 text-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper'

/** Un error de todo el formulario, con "o escribinos a <correo>" si el museo cargó uno. */
function ErrorGeneral({ codigo, correo }) {
  const texto = t.generales[codigo] ?? t.generales.no_enviado
  if (!correo) return <p>{`${texto}.`}</p>
  return (
    <p>
      {`${texto} ${t.oEscribinos} `}
      <a href={`mailto:${correo}`} className={`${ENLACE} wrap-anywhere`}>
        {correo}
      </a>
      .
    </p>
  )
}

/**
 * @param {{ formulario: boolean, enviado?: boolean, valores?: Record<string, string> | null,
 *   errores?: Record<string, string> | null, error?: string | null, correo?: string | null }} props
 *   formulario: se dibuja el formulario; correo: el correo público del museo (para los errores de todo el formulario)
 */
export default function FormularioContacto({ formulario, enviado = false, valores, errores, error, correo }) {
  const aviso = useRef(null)
  // Cuándo salió el último envío (0: ninguno) y si el botón dice "Enviando…".
  const enviadoEn = useRef(0)
  const [enviando, setEnviando] = useState(false)
  const conErrores = Boolean(errores) && Object.keys(errores).length > 0
  // Con JavaScript, el foco va al aviso con que llega la página (el resumen de errores, el error de todo el formulario o
  // "Recibimos tu mensaje"), así el lector de pantalla lo lee. Sin JavaScript, el #formulario de la dirección lleva la
  // página hasta acá.
  useEffect(() => {
    aviso.current?.focus()
  }, [])
  // Al volver a la página con Atrás (bfcache), el botón vuelve a "Enviar"; y pasada la espera, también.
  useEffect(() => {
    if (!enviando) return undefined
    const reloj = setTimeout(() => setEnviando(false), ESPERA_REENVIO_MS)
    const alVolver = (e) => {
      if (!e.persisted) return
      enviadoEn.current = 0
      setEnviando(false)
    }
    window.addEventListener('pageshow', alVolver)
    return () => {
      clearTimeout(reloj)
      window.removeEventListener('pageshow', alVolver)
    }
  }, [enviando])
  if (!formulario && !enviado && !error) return null

  // El navegador valida antes (required, minLength…): esto corre solo con el formulario completo.
  const alEnviar = (e) => {
    const ahora = Date.now()
    if (ahora - enviadoEn.current < ESPERA_REENVIO_MS) {
      e.preventDefault()
      return
    }
    enviadoEn.current = ahora
    setEnviando(true)
  }

  return (
    <section id="formulario" aria-labelledby="formulario-titulo" className="min-w-0 max-w-3xl scroll-mt-8">
      <h2 id="formulario-titulo" className={SUBTITULO}>
        {t.titulo}
      </h2>

      {enviado && !error && !conErrores ? (
        <p ref={aviso} tabIndex={-1} role="status" className={`${AVISO} border-verde-claro`}>
          {t.enviado}
        </p>
      ) : null}
      {error ? (
        <div ref={aviso} tabIndex={-1} role="alert" className={`${AVISO} border-naranja`}>
          <ErrorGeneral codigo={error} correo={correo} />
        </div>
      ) : null}
      {conErrores && !error ? (
        <div ref={aviso} tabIndex={-1} role="group" aria-labelledby="contacto-revisar" className={`${AVISO} border-naranja`}>
          <h3 id="contacto-revisar" className="font-normal">
            {t.revisar}
          </h3>
          <ul className="mt-2 list-disc pl-[1.25em]">
            {CAMPOS.filter((c) => errores[c.nombre]).map((c) => (
              <li key={c.nombre}>
                <a href={`#${idDe(c.nombre)}`} className={`${ENLACE} inline-flex min-h-11 items-center`}>
                  {textoDeError(c.nombre, errores[c.nombre])}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!formulario && error && valores?.mensaje ? (
        <div className="mt-8 min-w-0">
          <label htmlFor="contacto-escrito" className="block text-lg">
            {t.escrito}
          </label>
          <textarea id="contacto-escrito" readOnly rows={8} defaultValue={valores.mensaje} className={CONTROL_BIEN} />
        </div>
      ) : null}

      {formulario ? (
        <form method="post" action="/contacto#formulario" onSubmit={alEnviar} className="mt-8 grid gap-7">
          <p className="text-base font-light text-muted">{t.obligatorios}</p>
          {CAMPOS.map((c) => {
            const id = idDe(c.nombre)
            const codigo = errores?.[c.nombre] ?? null
            const comunes = {
              id,
              name: c.nombre,
              required: true,
              maxLength: c.maxLength,
              defaultValue: valores?.[c.nombre] ?? '',
              'aria-invalid': codigo ? true : undefined,
              'aria-describedby': codigo ? `${id}-error` : undefined,
              className: codigo ? CONTROL_MAL : CONTROL_BIEN,
            }
            return (
              <div key={c.nombre} className="min-w-0">
                <label htmlFor={id} className="block text-lg">
                  {c.etiqueta}
                </label>
                {codigo ? (
                  <p id={`${id}-error`} className="mt-1 text-base text-naranja">
                    {textoDeError(c.nombre, codigo)}
                  </p>
                ) : null}
                {c.tipo ? (
                  <input type={c.tipo} autoComplete={c.autoComplete} {...comunes} />
                ) : (
                  <textarea rows={8} minLength={c.minLength} {...comunes} />
                )}
              </div>
            )
          })}
          {/* El campo trampa: ni se ve ni se recorre con Tab ni lo lee el lector de pantalla. */}
          <div aria-hidden="true" className="sr-only">
            <label htmlFor="contacto-sitio-web">{t.trampa}</label>
            <input id="contacto-sitio-web" type="text" name={TRAMPA} tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <p>
            <button
              type="submit"
              aria-disabled={enviando || undefined}
              className={`${BOTON} cursor-pointer aria-disabled:cursor-wait`}
            >
              {enviando ? t.enviando : t.enviar}
            </button>
          </p>
          {contacto.privacidad ? <p className="text-sm font-light text-muted">{contacto.privacidad}</p> : null}
        </form>
      ) : null}
    </section>
  )
}
