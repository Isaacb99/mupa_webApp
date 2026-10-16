// Datos del museo (plan 4.3, 5.2 y 5.3), para cualquier rol: dirección, contacto, redes y mapa (GET y PUT /museo).
// - El correo de destino del formulario de contacto solo lo ven y lo cambian los admins: a un editor la API no se lo
//   manda (y si lo mandara en el PUT, 403), así que esta pantalla solo lo muestra si vino en el GET.
// - El PUT es parcial: acá se mandan solo los campos de esta pantalla (las notas, el aviso y la compra son de Visitas).
// - Se valida con el mismo esquema del servidor (compartido/esquemas/museo.js) antes de mandar.
// - Redes: agregar y quitar con botones; cada cambio se anuncia (role="status") y el foco va a donde corresponde.
// - El mapa: se puede pegar el código entero de "Insertar un mapa" de Google Maps; al salir del campo queda solo la
//   dirección, que es lo que se guarda. Las direcciones de las redes y la de "Abrir en Google Maps" pegadas sin
//   https:// ("www.instagram.com/museo") lo reciben al salir del campo y al guardar (completarHttps). No se muestra acá (la CSP del panel no deja cargar a Google): "Ver el mapa"
//   lo abre en otra pestaña.
// - Cada parte (Ubicación, Contacto, Redes, Mapa) es un fieldset con su título como h2 dentro de la leyenda: así está
//   en la lista de encabezados del lector, como en las demás pantallas.
// - "Guardado." se ve hasta el primer cambio después de guardar (si se vuelve a lo guardado, no reaparece).
// - La dirección de cada red lleva el número de la red escondido (sr-only): si no, había dos campos «Dirección».
import { useEffect, useRef, useState } from 'react'
import { useLoaderData } from 'react-router'
import { esMapaEmbed, esquemaCambioMuseo, REDES, REDES_MAX, srcDelMapa } from '../../../compartido/esquemas/museo.js'
import { completarHttps, esUrlHttps } from '../../../compartido/esquemas/campos.js'
import { api } from '../api.js'
import { Aviso } from '../componentes/Aviso.jsx'
import { Boton } from '../componentes/Boton.jsx'
import { Campo, clasesControl } from '../componentes/Campo.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { ResumenErrores, useCambiosSinGuardar, useEnvio } from '../componentes/formulario.jsx'
import { UltimaEdicion } from '../componentes/UltimaEdicion.jsx'
import { aTexto, iguales, validarCon } from '../formato.js'

/** El loader (rutas.jsx lo envuelve con la sesión). */
export const cargarMuseo = ({ request }) => api.get('/museo', { signal: request.signal })

const TEXTOS = [
  'direccion',
  'localidad',
  'provincia',
  'codigoPostal',
  'telefono',
  'emailPublico',
  'mapaEmbedUrl',
  'mapaUrl',
]

const ETIQUETAS = {
  direccion: 'Dirección',
  localidad: 'Localidad',
  provincia: 'Provincia',
  codigoPostal: 'Código postal',
  telefono: 'Teléfono',
  emailPublico: 'Correo público',
  emailDestinoContacto: 'Correo de destino del formulario',
  redes: 'Redes',
  mapaEmbedUrl: 'Insertar mapa',
  mapaUrl: 'Abrir en Google Maps',
}
for (let i = 0; i < REDES_MAX; i++) {
  ETIQUETAS[`redes.${i}.red`] = `Red ${i + 1}`
  ETIQUETAS[`redes.${i}.url`] = `Red ${i + 1}, dirección`
}

/** Lo que muestra la pantalla a partir de lo que devolvió la API (null pasa a ""). */
function valoresDe(datos) {
  const valores = Object.fromEntries(TEXTOS.map((c) => [c, aTexto(datos[c])]))
  if ('emailDestinoContacto' in datos) valores.emailDestinoContacto = aTexto(datos.emailDestinoContacto)
  valores.redes = (datos.redes ?? []).map((r) => ({ red: r.red, url: r.url }))
  return valores
}

export default function Museo() {
  const datos = useLoaderData()
  const conDestino = 'emailDestinoContacto' in datos
  const [guardado, setGuardado] = useState(() => valoresDe(datos))
  const [valores, setValores] = useState(guardado)
  const [ultimaEdicion, setUltimaEdicion] = useState(datos.ultimaEdicion)
  const [ok, setOk] = useState(null)
  const [anuncio, setAnuncio] = useState('')
  const agregar = useRef(null)
  const envio = useEnvio(null)
  const sucio = !iguales(valores, guardado)
  const { dialogo } = useCambiosSinGuardar(sucio)
  useEffect(() => {
    if (sucio) setOk(null)
  }, [sucio])

  const poner = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))
  const ponerUrlRed = (i, url) =>
    setValores((v) => ({ ...v, redes: v.redes.map((x, j) => (j === i ? { ...x, url } : x)) }))
  /** Al salir de un campo de dirección: si se pegó sin https://, se lo agrega (y se ve). */
  const completar = (actual, aplicar) => {
    const completa = completarHttps(actual)
    if (completa !== actual) aplicar(completa)
  }
  const enfocar = (id) => requestAnimationFrame(() => document.getElementById(id)?.focus())

  function agregarRed() {
    const i = valores.redes.length
    setValores((v) => ({ ...v, redes: [...v.redes, { red: '', url: '' }] }))
    setAnuncio(`Se agregó la red ${i + 1}: elegí cuál es y pegá su dirección.`)
    enfocar(`redes.${i}.red`)
  }

  function quitarRed(i) {
    const quitada = valores.redes[i]
    const nombre = REDES[quitada.red] ?? `la red ${i + 1}`
    const quedan = valores.redes.length - 1
    // Si no estaba guardada, no hay nada que guardar.
    const estaba = guardado.redes.some((r) => r.red === quitada.red && r.url === quitada.url)
    setValores((v) => ({ ...v, redes: v.redes.filter((_, j) => j !== i) }))
    setAnuncio(estaba ? `Se quitó ${nombre}. Se guarda cuando apretás «Guardar».` : `Se quitó ${nombre}.`)
    if (quedan === 0) agregar.current?.focus()
    else enfocar(`redes.${Math.min(i, quedan - 1)}.red`)
  }

  async function alEnviar(e) {
    e.preventDefault()
    setOk(null)
    const cuerpo = {
      ...valores,
      mapaUrl: completarHttps(valores.mapaUrl),
      redes: valores.redes.map((r) => ({ red: r.red, url: completarHttps(r.url).trim() })),
    }
    const v = validarCon(esquemaCambioMuseo, cuerpo)
    if (!v.ok) {
      envio.mostrar(v.errores, v.general)
      return
    }
    const r = await envio.enviar(() => api.put('/museo', v.datos))
    if (!r.ok) return
    const nuevos = valoresDe(r.datos)
    setGuardado(nuevos)
    setValores(nuevos)
    setUltimaEdicion(r.datos.ultimaEdicion)
    setOk('Guardado.')
  }

  const mapaValido = esMapaEmbed(valores.mapaEmbedUrl.trim())
  const enlaceValido = esUrlHttps(valores.mapaUrl.trim())

  return (
    <>
      <Encabezado titulo="Datos del museo" />
      <UltimaEdicion edicion={ultimaEdicion} />
      <p className="mt-2 max-w-3xl">
        Lo que el sitio muestra para encontrar y contactar al museo: en el pie de todas las páginas y en Contacto. Lo
        que dejes vacío no se muestra.
      </p>

      <form onSubmit={alEnviar} noValidate className="mt-8 grid max-w-3xl gap-10">
        <ResumenErrores envio={envio} etiquetas={ETIQUETAS} />

        <fieldset className="grid gap-5">
          <legend className="mb-4">
            <h2 className="text-2xl font-bold">Ubicación</h2>
          </legend>
          <Campo
            id="direccion"
            etiqueta="Dirección"
            ayuda="Calle y número, como se escribe en un sobre. Por ejemplo: Av. España 400 (Sur)."
            autoComplete="off"
            maxLength={200}
            value={valores.direccion}
            onChange={poner('direccion')}
            error={envio.errores.direccion}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo
              id="localidad"
              etiqueta="Localidad"
              maxLength={100}
              autoComplete="off"
              value={valores.localidad}
              onChange={poner('localidad')}
              error={envio.errores.localidad}
            />
            <Campo
              id="provincia"
              etiqueta="Provincia"
              maxLength={60}
              autoComplete="off"
              value={valores.provincia}
              onChange={poner('provincia')}
              error={envio.errores.provincia}
            />
            <Campo
              id="codigoPostal"
              etiqueta="Código postal"
              maxLength={10}
              autoComplete="off"
              value={valores.codigoPostal}
              onChange={poner('codigoPostal')}
              error={envio.errores.codigoPostal}
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-5">
          <legend className="mb-4">
            <h2 className="text-2xl font-bold">Contacto</h2>
          </legend>
          <Campo
            id="telefono"
            etiqueta="Teléfono"
            ayuda="Como querés que se vea, por ejemplo +54 264 421-0000."
            type="tel"
            autoComplete="off"
            maxLength={40}
            value={valores.telefono}
            onChange={poner('telefono')}
            error={envio.errores.telefono}
          />
          <Campo
            id="emailPublico"
            etiqueta="Correo público"
            ayuda="El que se muestra en el sitio para escribirle al museo."
            type="email"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            maxLength={254}
            value={valores.emailPublico}
            onChange={poner('emailPublico')}
            error={envio.errores.emailPublico}
          />
          {conDestino ? (
            <Campo
              id="emailDestinoContacto"
              etiqueta="Correo de destino del formulario"
              ayuda={
                'A esta dirección llegan los mensajes que la gente manda desde el formulario de Contacto del sitio. ' +
                'Puede ser cualquier correo, también un Gmail. No se muestra en el sitio y solo los administradores ' +
                'la ven y la cambian.'
              }
              type="email"
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              maxLength={254}
              value={valores.emailDestinoContacto}
              onChange={poner('emailDestinoContacto')}
              error={envio.errores.emailDestinoContacto}
            />
          ) : null}
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-4">
            <h2 className="text-2xl font-bold">Redes</h2>
          </legend>
          <p id="redes" tabIndex={-1} className="text-tenue">
            Hasta {REDES_MAX}. Pegá la dirección completa de la página del museo en cada red (empieza con https://).
          </p>
          {envio.errores.redes ? <p className="font-semibold text-error">{envio.errores.redes}</p> : null}
          {valores.redes.length ? (
            <ul className="grid gap-4">
              {valores.redes.map((r, i) => (
                <li
                  key={i}
                  className="grid gap-3 rounded-md border-2 border-suave p-4 sm:grid-cols-[12rem_1fr_auto] sm:items-end"
                >
                  <Campo id={`redes.${i}.red`} etiqueta={`Red ${i + 1}`} error={envio.errores[`redes.${i}.red`]}>
                    {(accesible) => (
                      <select
                        {...accesible}
                        value={r.red}
                        onChange={(e) =>
                          setValores((v) => ({
                            ...v,
                            redes: v.redes.map((x, j) => (j === i ? { ...x, red: e.target.value } : x)),
                          }))
                        }
                      >
                        <option value="">Elegí la red</option>
                        {Object.entries(REDES).map(([valor, nombre]) => (
                          <option key={valor} value={valor}>
                            {nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </Campo>
                  <Campo
                    id={`redes.${i}.url`}
                    etiqueta={
                      <>
                        Dirección<span className="sr-only"> de la red {i + 1}</span>
                      </>
                    }
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    autoCapitalize="none"
                    placeholder="https://"
                    value={r.url}
                    onChange={(e) => ponerUrlRed(i, e.target.value)}
                    onBlur={(e) => completar(e.target.value, (url) => ponerUrlRed(i, url))}
                    error={envio.errores[`redes.${i}.url`]}
                  />
                  <Boton variante="secundario" onClick={() => quitarRed(i)}>
                    Quitar<span className="sr-only"> la red {i + 1}</span>
                  </Boton>
                </li>
              ))}
            </ul>
          ) : (
            <p>Todavía no hay redes cargadas.</p>
          )}
          <p role="status" className="sr-only">
            {anuncio}
          </p>
          {valores.redes.length < REDES_MAX ? (
            <div>
              <Boton ref={agregar} variante="secundario" onClick={agregarRed}>
                Agregar una red
              </Boton>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="grid gap-5">
          <legend className="mb-4">
            <h2 className="text-2xl font-bold">Mapa</h2>
          </legend>
          <Campo
            id="mapaEmbedUrl"
            etiqueta="Insertar mapa"
            ayuda={
              <>
                El mapa que se ve en la página de Contacto. En Google Maps, buscá el museo, tocá «Compartir», elegí
                «Insertar un mapa» y después «Copiar HTML». Pegalo acá: sirve el código entero (empieza con &lt;iframe)
                o solo la dirección que empieza con https://www.google.com/maps/embed?
              </>
            }
            error={envio.errores.mapaEmbedUrl}
          >
            {(accesible) => (
              <textarea
                {...accesible}
                rows={3}
                spellCheck={false}
                autoCapitalize="none"
                value={valores.mapaEmbedUrl}
                onChange={poner('mapaEmbedUrl')}
                onBlur={(e) => {
                  const src = srcDelMapa(e.target.value)
                  if (src !== e.target.value) setValores((v) => ({ ...v, mapaEmbedUrl: src }))
                }}
                className={`${clasesControl} font-mono text-sm`}
              />
            )}
          </Campo>
          {mapaValido ? (
            <p>
              <a
                href={valores.mapaEmbedUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center"
              >
                Ver el mapa en otra pestaña
              </a>
            </p>
          ) : null}
          <Campo
            id="mapaUrl"
            etiqueta="Abrir en Google Maps"
            ayuda="El enlace «Cómo llegar» del sitio, que abre Google Maps en el celular. En Google Maps, buscá el museo, tocá «Compartir» y después «Copiar vínculo»."
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="https://"
            value={valores.mapaUrl}
            onChange={poner('mapaUrl')}
            onBlur={(e) => completar(e.target.value, (url) => setValores((v) => ({ ...v, mapaUrl: url })))}
            error={envio.errores.mapaUrl}
          />
          {enlaceValido ? (
            <p>
              <a
                href={valores.mapaUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center"
              >
                Probar el enlace en otra pestaña
              </a>
            </p>
          ) : null}
        </fieldset>

        <div className="grid gap-4">
          <div>
            <Boton type="submit" ocupado={envio.enviando}>
              {envio.enviando ? 'Guardando…' : 'Guardar'}
            </Boton>
          </div>
          <Aviso tipo="ok">{sucio ? null : ok}</Aviso>
        </div>
      </form>
      {dialogo}
    </>
  )
}
