import { useEffect, useRef, useState } from 'react'
import { CONTACTO, TRAMPA } from '../../compartido/contacto.js'
import { contacto } from '../content.js'
import {
  BAJADA,
  BOTON_NARANJA,
  CLASES_TEXTO_TABLERO,
  CONTENEDOR_TABLERO,
  ROTULO_SECCION,
  SECCION_TABLERO,
  TITULO_SECCION,
} from './tablero.js'

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
//
// Con el lenguaje del tablero "Web" de la diseñadora (decisiones R1 a R7 del desarrollador; el tablero no dibuja esta
// página ni ningún formulario: lo de acá es lo mínimo con su lenguaje, desvío a confirmar con la diseñadora). La lógica
// de arriba no cambió: solo las clases y el lugar de las piezas.
// - La sección, como las de Visitas: 80 de aire arriba y abajo y 1280 de contenido a 1440; el rótulo (el título de la
//   página, "Contacto", como en los datos: ningún texto nuevo) y, 24 abajo, el h2 Thin "Escribinos". 48 abajo, el aviso
//   con que llega la página (si hay) y, 48 abajo, el formulario.
// - El formulario, en la grilla del tablero (dos columnas de 620 con 40 entre sí a 1440): "Todos los campos son
//   obligatorios." como la bajada de una sección (Regular 18/28 en gris), el nombre y el correo lado a lado, el mensaje
//   a lo ancho y el botón naranja del tablero (BOTON_NARANJA: Roboto Mono 14 con el texto oscuro, D4). Debajo de lg, una
//   columna.
// - Cada campo: la etiqueta con la letra del rótulo de una sección (Roboto Mono Medium 14/20, crema) pero escrita como
//   está, sin pasar a mayúsculas: la etiqueta es el nombre del campo para el lector de pantalla, y Chrome se lo da con
//   las mayúsculas del CSS («TU MENSAJE»: algunos lectores deletrean las palabras cortas en mayúsculas, y una línea
//   braille las muestra así; A11Y-03 de la verificación del rediseño, 05/11/2026). 12 abajo, el control: el fondo del
//   cuadrado de los íconos de las tarjetas (bg-caja, #1a1a1a), el borde de 1 px en gris (muted: 5,6:1 contra el fondo
//   de la página, más de los 3:1 que pide un control), esquinas de 4 como el botón, el texto Regular 18/28 en crema y el
//   foco con el contorno blanco de 2 px del sitio. El mensaje se agranda solo hacia abajo (resize-y). Con un error, el
//   borde pasa a naranja y el error va entre la etiqueta y el control, Regular 16/24 en naranja (#eb622d: 5,5:1 contra
//   el fondo, AA).
// - Los avisos (el resumen de errores, el error de todo el formulario y "Recibimos tu mensaje"): una caja con el fondo
//   bg-caja, esquinas de 12 (las de las tarjetas del tablero), el borde de 1 px naranja (error) o verde (enviado, el
//   verde claro de la paleta: el tablero no tiene un color para "salió bien") y el texto Regular 18/28 en crema; solo
//   tan ancha como su texto (w-fit), que como todo párrafo del sitio no pasa de 42em (src/index.css: 756 px a 18),
//   hasta el ancho del contenido. Sus enlaces, subrayados como los del texto con formato del tablero
//   (CLASES_TEXTO_TABLERO.a).
// - El cuadro de solo lectura del 503, como un campo.
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

// ROTULO_SECCION sin uppercase (ver arriba).
const ETIQUETA = 'block font-mono text-sm leading-5 font-medium text-paper'
const CONTROL =
  'mt-3 block w-full scroll-mt-32 rounded-[0.25rem] border bg-caja px-4 py-3 text-lg leading-7 font-normal ' +
  'text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blanco'
const CONTROL_BIEN = `${CONTROL} border-muted`
const CONTROL_MAL = `${CONTROL} border-naranja`
const ERROR_CAMPO = 'mt-2 text-base leading-6 font-normal text-naranja'
const AVISO =
  'mt-12 w-fit max-w-full rounded-xl border bg-caja px-6 py-5 text-lg leading-7 font-normal text-paper ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blanco'
// Los enlaces dentro de un aviso: los del texto con formato del tablero; los del resumen, además, de 44 de alto.
const ENLACE = CLASES_TEXTO_TABLERO.a
const ENLACE_RESUMEN = `${ENLACE} inline-flex min-h-11 items-center`

/** Un error de todo el formulario, con "o escribinos a <correo>" si el museo cargó uno. */
function ErrorGeneral({ codigo, correo }) {
  const texto = t.generales[codigo] ?? t.generales.no_enviado
  if (!correo) return <p>{`${texto}.`}</p>
  return (
    <p>
      {`${texto} ${t.oEscribinos} `}
      <a href={`mailto:${correo}`} className={ENLACE}>
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
    <section id="formulario" aria-labelledby="formulario-titulo" className={SECCION_TABLERO}>
      <div className={CONTENEDOR_TABLERO}>
        <p className={ROTULO_SECCION}>{contacto.titulo}</p>
        <h2 id="formulario-titulo" className={`${TITULO_SECCION} mt-6`}>
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
            <h3 id="contacto-revisar" className="font-medium">
              {t.revisar}
            </h3>
            <ul className="mt-2 list-disc pl-[1.25em]">
              {CAMPOS.filter((c) => errores[c.nombre]).map((c) => (
                <li key={c.nombre}>
                  <a href={`#${idDe(c.nombre)}`} className={ENLACE_RESUMEN}>
                    {textoDeError(c.nombre, errores[c.nombre])}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!formulario && error && valores?.mensaje ? (
          <div className="mt-12 min-w-0">
            <label htmlFor="contacto-escrito" className={ETIQUETA}>
              {t.escrito}
            </label>
            <textarea
              id="contacto-escrito"
              readOnly
              rows={8}
              defaultValue={valores.mensaje}
              className={`${CONTROL_BIEN} resize-y`}
            />
          </div>
        ) : null}

        {formulario ? (
          <form method="post" action="/contacto#formulario" onSubmit={alEnviar} className="mt-12 grid gap-x-10 gap-y-8 lg:grid-cols-2">
            <p className={`${BAJADA} lg:col-span-2`}>{t.obligatorios}</p>
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
                <div key={c.nombre} className={c.tipo ? 'min-w-0' : 'min-w-0 lg:col-span-2'}>
                  <label htmlFor={id} className={ETIQUETA}>
                    {c.etiqueta}
                  </label>
                  {codigo ? (
                    <p id={`${id}-error`} className={ERROR_CAMPO}>
                      {textoDeError(c.nombre, codigo)}
                    </p>
                  ) : null}
                  {c.tipo ? (
                    <input type={c.tipo} autoComplete={c.autoComplete} {...comunes} />
                  ) : (
                    <textarea rows={8} minLength={c.minLength} {...comunes} className={`${comunes.className} resize-y`} />
                  )}
                </div>
              )
            })}
            {/* El campo trampa: ni se ve ni se recorre con Tab ni lo lee el lector de pantalla. */}
            <div aria-hidden="true" className="sr-only">
              <label htmlFor="contacto-sitio-web">{t.trampa}</label>
              <input id="contacto-sitio-web" type="text" name={TRAMPA} tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>
            <p className="lg:col-span-2">
              <button
                type="submit"
                aria-disabled={enviando || undefined}
                className={`${BOTON_NARANJA} cursor-pointer aria-disabled:cursor-wait`}
              >
                {enviando ? t.enviando : t.enviar}
              </button>
            </p>
            {contacto.privacidad ? (
              <p className="text-base leading-[1.625rem] font-normal text-muted lg:col-span-2">{contacto.privacidad}</p>
            ) : null}
          </form>
        ) : null}
      </div>
    </section>
  )
}
