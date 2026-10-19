// La ficha de una novedad, una muestra o una sala (plan 5.2 a 5.5; E3.3, E3.4 y E3.5): /novedades/:id, /muestras/:id y
// /salas/:id. Una sola pantalla para los tres (lo propio de cada uno está en contenidos.js y valores.js).
// - Campos de 5.3: tipo (noticia o actividad, temporal o permanente), título (nombre en una sala), resumen, lo de una
//   actividad (inicio y fin con la hora de San Juan, lugar, costo, inscripción) o de una muestra (fechas, sala), la
//   portada (Portada), el texto con formato (EditorTexto, cargado aparte), la galería (Galeria; muestras y novedades) y
//   la dirección web (editable hasta la primera publicación; después, fija).
// - Botones (5.4): en un borrador, "Guardar borrador" y "Publicar" (guarda lo que cambió y publica); en una publicada,
//   "Guardar cambios", "Despublicar" (pregunta antes) y, cuando estén las páginas públicas (E4), "Ver en el sitio".
//   Guardar manda la ficha (PUT /<tipo>/:id, el esquema completo) y, si cambió, la galería (PUT …/galeria). Antes se
//   valida con el mismo esquema del servidor; para publicar (o con algo ya publicado), también lo que pide publicar
//   (problemasParaPublicar y la portada no decorativa). Un error va a su campo y al resumen de arriba.
// - Eliminar (E3.5): un <dialog> (Confirmar) que nombra lo que se borra, dice qué pasa con las fotos y propone
//   despublicarla si solo no se quiere que se vea. Después vuelve al listado con el aviso.
// - Cambios sin guardar (E3.5): los campos, el texto, la portada y la galería (comparados con lo guardado en la forma
//   que guardaría el servidor, valores.js), y lo que avisan Portada y Galeria (datos de una foto sin guardar, fotos
//   elegidas sin subir). La pregunta al irse dice qué falta guardar. Después de eliminar, liberar() y recién ahí se
//   navega.
// - "Guardado." se ve hasta el primer cambio; después de publicar o despublicar, el foco pasa al botón que quedó en ese
//   lugar (el que se apretó ya no está).
// - Después de guardar (corrección de E3, 16/10/2026): lo que devolvió la API va solo a los campos que no se tocaron
//   mientras se guardaba (fusionarGuardado de valores.js; antes lo escrito en el texto durante el guardado se perdía sin
//   aviso), y el texto pasa a verse como quedó guardado (reemplazo de Editor.jsx: sin las líneas en blanco, que no se
//   guardan). La ficha manda también la portada y la galería con que se abrió (portadaAntes, antes): el servidor no
//   pisa ni borra lo que otra persona cambió mientras tanto (en la galería, 409: "recargá"). La galería guardada que se
//   compara (galeriaGuardada) cambia solo al guardar la galería.
// - Un 409 de una foto de la galería que ya no está trae cuáles (faltan): la galería las marca y el resumen de errores
//   lleva a "Quitar" de la primera.
// - Los avisos que hablan del sitio (textosDelSitio de contenidos.js) no dicen "ya está en el sitio" hasta que estén
//   las páginas públicas (E4).
// La ruta la monta con key = id (rutas.jsx): ir de una ficha a otra arranca de cero.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { data, Link, useLoaderData, useNavigate } from 'react-router'
import { crearSlug, PAGINAS_PUBLICAS_DE_CONTENIDO, SLUG_MAX, urlPublica } from '../../../../compartido/contenidos.js'
import { completarHttps } from '../../../../compartido/esquemas/campos.js'
import {
  COSTO_MAX,
  ESQUEMAS_CONTENIDO,
  GALERIA_MAX,
  LUGAR_MAX,
  NOMBRE_SALA_MAX,
  PORTADA_DECORATIVA,
  problemasParaPublicar,
  RESUMEN_MAX,
  TITULO_MAX,
} from '../../../../compartido/esquemas/contenido.js'
import { CARACTERES_MAX, medirDocumento } from '../../../../compartido/esquemas/textoRico.js'
import { api } from '../../api.js'
import { Aviso, AvisoDeLlegada } from '../../componentes/Aviso.jsx'
import { Boton, clasesBoton } from '../../componentes/Boton.jsx'
import { Campo } from '../../componentes/Campo.jsx'
import { Confirmar } from '../../componentes/Confirmar.jsx'
import { EditorTexto, precargarEditor } from '../../componentes/EditorTexto.jsx'
import { Encabezado } from '../../componentes/Encabezado.jsx'
import { EstadoContenido } from '../../componentes/EstadoContenido.jsx'
import { ResumenErrores, useCambiosSinGuardar, useEnvio } from '../../componentes/formulario.jsx'
import { Galeria } from '../../componentes/Galeria.jsx'
import { Portada } from '../../componentes/Portada.jsx'
import { UltimaEdicion } from '../../componentes/UltimaEdicion.jsx'
import { CONTENIDOS, textosDelSitio, traerTodas } from '../../contenidos.js'
import { fechaHora, validarCon } from '../../formato.js'
import { borrarAviso, leerAviso, ponerAviso } from '../../sesion.jsx'
import { CAMPOS_FICHA, comparable, cuerpoDe, ETIQUETAS_FICHA, fusionarGuardado, valoresDe } from './valores.js'

const formatoNumero = new Intl.NumberFormat('es-AR')
const lista = new Intl.ListFormat('es', { type: 'conjunction' })

/**
 * El loader de la ficha de un tipo (rutas.jsx lo envuelve con la sesión): la ficha y, en una muestra, las salas para
 * elegir. Pide también el código del editor de texto (sin esperarlo: si no llega, el lugar del texto lo dice).
 * @param {'novedades' | 'muestras' | 'salas'} tipo
 */
export function cargarFicha(tipo) {
  const c = CONTENIDOS[tipo]
  return async ({ params, request }) => {
    precargarEditor().catch(() => {})
    // Un id que no es un número no existe (sin preguntarle a la API, que daría 400).
    if (!/^[1-9][0-9]{0,9}$/.test(params.id ?? '')) throw data(null, { status: 404 })
    const opciones = { signal: request.signal }
    const [ficha, salas] = await Promise.all([
      api.get(`${c.api}/${params.id}`, opciones),
      tipo === 'muestras' ? traerTodas(api, '/salas', opciones) : null,
    ])
    return { ficha, salas }
  }
}

/** Una ayuda con cuántos caracteres quedan. */
const quedan = (texto, max) => `Hasta ${max} caracteres (quedan ${max - texto.length}).`

/** "(obligatorio para publicar)" junto a una etiqueta. */
const ParaPublicar = () => <span className="font-normal text-tenue"> (obligatorio para publicar)</span>

/**
 * @param {{ tipo: 'novedades' | 'muestras' | 'salas' }} props
 */
export function Ficha({ tipo }) {
  const c = CONTENIDOS[tipo]
  const esquemaCambio = ESQUEMAS_CONTENIDO[tipo].cambio
  const { ficha: inicial, salas } = useLoaderData()
  const navigate = useNavigate()
  const sitio = textosDelSitio(c)
  const [guardada, setGuardada] = useState(inicial)
  const [valores, setValores] = useState(() => valoresDe(tipo, inicial))
  const [portada, setPortada] = useState(inicial.portada)
  const [galeria, setGaleria] = useState(inicial.galeria ?? [])
  // La galería como quedó guardada por esta pantalla (la base para comparar y lo que se manda como "antes").
  const [galeriaGuardada, setGaleriaGuardada] = useState(inicial.galeria ?? [])
  // Lo guardado del texto, para que el editor lo muestre así (Editor.jsx).
  const [reemplazo, setReemplazo] = useState(null)
  // Las fotos de la galería que ya no están (un 409 con faltan).
  const [faltanFotos, setFaltanFotos] = useState([])
  // Lo que avisan Portada y Galeria (clave -> sucio): datos de una foto sin guardar ("…-datos…") o fotos elegidas sin
  // subir ("…-subir").
  const [suciosFotos, setSuciosFotos] = useState({})
  const [ok, setOk] = useState(null)
  const [confirmar, setConfirmar] = useState(null) // null | 'eliminar' | 'despublicar'
  const [trabajando, setTrabajando] = useState(false)
  const [errorAccion, setErrorAccion] = useState(null)
  const [aviso] = useState(leerAviso)
  useEffect(() => borrarAviso(), [])
  const [foco, setFoco] = useState(null)
  useEffect(() => {
    if (!foco) return
    document.getElementById(foco)?.focus()
    setFoco(null)
  }, [foco])
  const envio = useEnvio(CAMPOS_FICHA[tipo])
  const etiquetas = { ...ETIQUETAS_FICHA, [c.campoTexto]: c.etiquetaTexto }
  const publicada = guardada.estado === 'publicado'
  const titulo = guardada[c.campoTitulo]

  const poner = (campo, valor) => setValores((v) => ({ ...v, [campo]: valor }))
  const alCambiarTexto = useCallback((json) => setValores((v) => ({ ...v, texto: json })), [])
  const marcar = useCallback(
    (clave, sucio) => setSuciosFotos((s) => (Boolean(s[clave]) === sucio ? s : { ...s, [clave]: sucio })),
    [],
  )

  // Qué hay sin guardar.
  const cuerpo = useMemo(() => cuerpoDe(tipo, valores, portada), [tipo, valores, portada])
  const actual = useMemo(() => comparable(tipo, cuerpo), [tipo, cuerpo])
  const base = useMemo(
    () => comparable(tipo, cuerpoDe(tipo, valoresDe(tipo, guardada), guardada.portada)),
    [tipo, guardada],
  )
  const sucioFicha = JSON.stringify(actual) !== JSON.stringify(base)
  const idsGaleria = galeria.map((f) => f.id).join(',')
  const sucioGaleria = c.conGaleria && idsGaleria !== galeriaGuardada.map((f) => f.id).join(',')
  const sinSubir = Object.entries(suciosFotos).some(([clave, sucio]) => sucio && clave.endsWith('-subir'))
  const datosDeFoto = Object.entries(suciosFotos).some(([clave, sucio]) => sucio && !clave.endsWith('-subir'))
  const faltan = [
    sucioFicha ? 'los datos de la ficha' : null,
    sucioGaleria ? 'las fotos o el orden de la galería' : null,
    datosDeFoto ? 'los datos de una foto' : null,
    sinSubir ? 'fotos elegidas que todavía no se subieron' : null,
  ].filter(Boolean)
  const sucio = faltan.length > 0
  const { dialogo, liberar } = useCambiosSinGuardar(sucio, sucio ? `Falta guardar: ${lista.format(faltan)}.` : null)
  useEffect(() => {
    if (sucio) setOk(null)
  }, [sucio])

  /**
   * Lo que devolvió el PUT de la ficha: lo guardado y, en lo que no se tocó mientras tanto, los valores del servidor
   * (pudo arreglar algo: la dirección armada con el título, los espacios de más, la portada de otra persona).
   */
  function despuesDeGuardarLaFicha(ficha, enviados, portadaEnviada) {
    setGuardada(ficha)
    setValores((actuales) => fusionarGuardado(tipo, actuales, enviados, ficha))
    setPortada((p) => (p === portadaEnviada ? ficha.portada : p))
    setReemplazo({ doc: ficha[c.campoTexto] ?? null, si: enviados.texto })
  }

  /** Guardar (y, con publicar, publicar después). */
  async function guardar({ publicar = false } = {}) {
    setOk(null)
    setErrorAccion(null)
    const v = validarCon(esquemaCambio, cuerpo)
    const errores = v.ok ? {} : { ...v.errores }
    if (v.ok && (publicada || publicar)) {
      Object.assign(errores, problemasParaPublicar(tipo, v.datos))
      if (portada && (portada.decorativa || !portada.alt)) errores.portadaId ??= PORTADA_DECORATIVA
    }
    if (!v.ok || Object.keys(errores).length) {
      const mensaje = !v.ok
        ? v.general
        : publicar
          ? 'Para publicar, falta completar estos datos.'
          : 'Está publicada: para guardar los cambios tiene que seguir completa (o despublicala primero).'
      envio.mostrar(errores, mensaje)
      return
    }
    // Lo que sale en este guardado (si mientras tanto se escribe algo, queda: despuesDeGuardarLaFicha).
    const enviados = valores
    const portadaEnviada = portada
    const galeriaEnviada = galeria
    const portadaAntes = guardada.portada?.id ?? null
    const galeriaAntes = galeriaGuardada.map((f) => f.id)
    const r = await envio.enviar(async () => {
      let ultima = null
      // La ficha va si cambió (o si no cambió nada: guardar confirma lo que hay).
      if (sucioFicha || (!sucioGaleria && !publicar)) {
        ultima = await api.put(`${c.api}/${guardada.id}`, { ...v.datos, portadaAntes })
        despuesDeGuardarLaFicha(ultima, enviados, portadaEnviada)
      }
      if (sucioGaleria) {
        ultima = await api.put(`${c.api}/${guardada.id}/galeria`, {
          fotos: galeriaEnviada.map((f) => f.id),
          antes: galeriaAntes,
        })
        setGuardada(ultima)
        setGaleriaGuardada(ultima.galeria ?? [])
        setGaleria((g) => (g === galeriaEnviada ? (ultima.galeria ?? []) : g))
      }
      if (publicar) {
        ultima = await api.post(`${c.api}/${guardada.id}/publicar`)
        setGuardada(ultima)
      }
      return ultima
    })
    setFaltanFotos(r.ok ? [] : (r.error?.faltan ?? []))
    if (!r.ok) return
    if (publicar) {
      setOk(sitio.publicada)
      setFoco('ficha-despublicar')
    } else {
      setOk(publicada ? sitio.guardadaPublicada : 'Guardado.')
    }
  }

  async function despublicar() {
    setTrabajando(true)
    setErrorAccion(null)
    setOk(null)
    try {
      // Solo el estado: lo que haya sin guardar en el formulario sigue ahí.
      setGuardada(await api.post(`${c.api}/${guardada.id}/despublicar`))
      setConfirmar(null)
      setOk(sitio.despublicada)
      setFoco('ficha-publicar')
    } catch (err) {
      setConfirmar(null)
      setErrorAccion(err?.message ?? 'No se pudo despublicar.')
    } finally {
      setTrabajando(false)
    }
  }

  async function eliminar() {
    setTrabajando(true)
    setErrorAccion(null)
    try {
      await api.delete(`${c.api}/${guardada.id}`)
      liberar()
      ponerAviso(`Se eliminó ${c.la} «${titulo}».`)
      navigate(c.lista)
    } catch (err) {
      setTrabajando(false)
      setConfirmar(null)
      if (err?.status === 404) {
        // Ya no estaba (la eliminó otra persona): no hay nada que guardar.
        liberar()
        ponerAviso(`${c.la[0].toUpperCase()}${c.la.slice(1)} «${titulo}» ya no existía: la eliminó otra persona.`)
        navigate(c.lista)
        return
      }
      setErrorAccion(err?.message ?? 'No se pudo eliminar.')
    }
  }

  // Los caracteres del texto, contados sobre lo que se guardaría (como el servidor).
  const caracteres = medirDocumento(actual[c.campoTexto]).caracteres
  const restan = CARACTERES_MAX - caracteres
  const estadoEnPalabras = publicada
    ? `Publicada el ${fechaHora(guardada.publicadoEn)}.`
    : guardada.publicadoEn
      ? `Borrador: no está en el sitio (se publicó por primera vez el ${fechaHora(guardada.publicadoEn)}).`
      : 'Borrador: no está en el sitio.'

  const campoTitulo = (
    <Campo
      id={c.campoTitulo}
      etiqueta={c.etiquetaTitulo}
      obligatorio
      ayuda={quedan(valores[c.campoTitulo], tipo === 'salas' ? NOMBRE_SALA_MAX : TITULO_MAX)}
      maxLength={tipo === 'salas' ? NOMBRE_SALA_MAX : TITULO_MAX}
      autoComplete="off"
      value={valores[c.campoTitulo]}
      onChange={(e) => poner(c.campoTitulo, e.target.value)}
      error={envio.errores[c.campoTitulo]}
    />
  )

  const campoResumen = (
    <Campo
      id="resumen"
      etiqueta={
        <>
          Resumen
          <ParaPublicar />
        </>
      }
      ayuda={`Una o dos oraciones: aparece en Google, en las tarjetas y al compartir el enlace. ${quedan(valores.resumen, RESUMEN_MAX)}`}
      error={envio.errores.resumen}
    >
      {(accesible) => (
        <textarea
          {...accesible}
          rows={2}
          maxLength={RESUMEN_MAX}
          autoComplete="off"
          value={valores.resumen}
          // Es de una línea: Enter no hace nada y un salto de línea pegado pasa a espacio.
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
          onChange={(e) => poner('resumen', e.target.value.replace(/\s*[\r\n]+\s*/g, ' '))}
        />
      )}
    </Campo>
  )

  return (
    <>
      <p className="mb-2">
        <Link to={c.lista} className="inline-flex min-h-11 items-center">
          Volver a {c.textoLista}
        </Link>
      </p>
      <Encabezado titulo={`${c.Nombre}: ${titulo}`} />
      <UltimaEdicion edicion={guardada.ultimaEdicion} />
      <p className="mt-3 flex flex-wrap items-center gap-2">
        <EstadoContenido tipo={tipo} item={guardada} />
        <span>{estadoEnPalabras}</span>
      </p>
      <AvisoDeLlegada texto={aviso} className="mt-4" />

      <form
        noValidate
        className="mt-8 grid max-w-3xl gap-8"
        onSubmit={(e) => {
          e.preventDefault()
          guardar()
        }}
      >
        <ResumenErrores
          envio={envio}
          etiquetas={etiquetas}
          // Una foto de la galería que ya no está: a su "Quitar".
          destinos={faltanFotos.length ? { fotos: `fotos-quitar-${faltanFotos[0]}` } : undefined}
        />

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
              // El nombre del radio es solo el tipo; la explicación va como su descripción.
              <div key={valor} className="grid grid-cols-[auto_1fr] gap-x-3">
                <input
                  id={`tipo-${valor}`}
                  type="radio"
                  name="tipo"
                  value={valor}
                  checked={valores.tipo === valor}
                  onChange={() => poner('tipo', valor)}
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

        {campoTitulo}
        {campoResumen}

        {tipo === 'novedades' && valores.tipo === 'actividad' ? (
          <fieldset className="grid gap-5 rounded-md border-2 border-suave p-4">
            <legend className="px-1 text-lg font-bold">La actividad</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo
                id="eventoInicio"
                etiqueta={
                  <>
                    Empieza
                    <ParaPublicar />
                  </>
                }
                ayuda="Día y hora (de San Juan)."
                type="datetime-local"
                value={valores.eventoInicio}
                onChange={(e) => poner('eventoInicio', e.target.value.slice(0, 16))}
                error={envio.errores.eventoInicio}
              />
              <Campo
                id="eventoFin"
                etiqueta="Termina"
                ayuda="Opcional."
                type="datetime-local"
                value={valores.eventoFin}
                onChange={(e) => poner('eventoFin', e.target.value.slice(0, 16))}
                error={envio.errores.eventoFin}
              />
            </div>
            <Campo
              id="lugar"
              etiqueta="Lugar"
              ayuda={`Opcional: si queda vacío, es en el museo. ${quedan(valores.lugar, LUGAR_MAX)}`}
              maxLength={LUGAR_MAX}
              autoComplete="off"
              value={valores.lugar}
              onChange={(e) => poner('lugar', e.target.value)}
              error={envio.errores.lugar}
            />
            <Campo
              id="costo"
              etiqueta="Costo"
              ayuda={`Opcional, como se quiera mostrar: «Gratis», «$ 3.000», «Con la entrada al museo». ${quedan(valores.costo, COSTO_MAX)}`}
              maxLength={COSTO_MAX}
              autoComplete="off"
              value={valores.costo}
              onChange={(e) => poner('costo', e.target.value)}
              error={envio.errores.costo}
            />
            <Campo
              id="enlaceInscripcion"
              etiqueta="Enlace de inscripción"
              ayuda="Opcional: la dirección completa del formulario de inscripción, que empieza con https://"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              placeholder="https://"
              value={valores.enlaceInscripcion}
              onChange={(e) => poner('enlaceInscripcion', e.target.value)}
              onBlur={(e) => {
                // Pegada sin https:// ("forms.gle/…"): se lo agrega.
                const completa = completarHttps(e.target.value)
                if (completa !== e.target.value) poner('enlaceInscripcion', completa)
              }}
              error={envio.errores.enlaceInscripcion}
            />
          </fieldset>
        ) : null}

        {tipo === 'muestras' ? (
          <>
            {valores.tipo === 'temporal' ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo
                  id="fechaInicio"
                  etiqueta={
                    <>
                      Fecha de inicio
                      <ParaPublicar />
                    </>
                  }
                  ayuda="Desde cuándo se puede ver."
                  type="date"
                  value={valores.fechaInicio}
                  onChange={(e) => poner('fechaInicio', e.target.value)}
                  error={envio.errores.fechaInicio}
                />
                <Campo
                  id="fechaFin"
                  etiqueta="Fecha de fin"
                  ayuda="Opcional: el último día. Si queda vacía, sigue hasta que la cambies."
                  type="date"
                  value={valores.fechaFin}
                  onChange={(e) => poner('fechaFin', e.target.value)}
                  error={envio.errores.fechaFin}
                />
              </div>
            ) : null}
            <Campo id="salaId" etiqueta="Sala" ayuda="Opcional: en qué sala del museo está." error={envio.errores.salaId}>
              {(accesible) => (
                <select {...accesible} value={valores.salaId} onChange={(e) => poner('salaId', e.target.value)}>
                  <option value="">Sin sala</option>
                  {(salas ?? []).map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.nombre}
                      {s.estado === 'publicado' ? '' : ' (borrador)'}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
          </>
        ) : null}

        <Portada
          id="portadaId"
          foto={portada}
          alCambiar={setPortada}
          obligatorio
          error={envio.errores.portadaId}
          alCambiarSucio={marcar}
        />

        <EditorTexto
          id={c.campoTexto}
          etiqueta={c.etiquetaTexto}
          ayuda={
            `${c.textoParaPublicar ? 'Obligatorio para publicar. ' : 'Opcional. '}Negrita, cursiva, subtítulos, listas y ` +
            `enlaces. Hasta ${formatoNumero.format(CARACTERES_MAX)} caracteres ` +
            `(${restan >= 0 ? `quedan ${formatoNumero.format(restan)}` : `sobran ${formatoNumero.format(-restan)}`}).`
          }
          error={envio.errores[c.campoTexto]}
          valor={inicial[c.campoTexto] ?? null}
          alCambiar={alCambiarTexto}
          reemplazo={reemplazo}
        />

        {c.conGaleria ? (
          <Galeria
            id="fotos"
            fotos={galeria}
            alCambiar={setGaleria}
            maximo={GALERIA_MAX}
            error={envio.errores.fotos}
            faltan={faltanFotos}
            alCambiarSucio={marcar}
          />
        ) : null}

        {guardada.slugFijo ? (
          <div className="grid gap-1.5">
            <p className="font-semibold">Dirección web</p>
            <p className="wrap-anywhere">
              {c.prefijoDireccion}
              <strong>{guardada.slug}</strong>
            </p>
            <p className="text-sm text-tenue">
              Quedó fija cuando se publicó por primera vez: los enlaces que ya circulan dejarían de andar.
            </p>
          </div>
        ) : (
          <Campo
            id="slug"
            etiqueta="Dirección web"
            ayuda={
              `La parte final de la dirección de la página: ${c.prefijoDireccion}${valores.slug.trim() || '…'}. Se ` +
              'arma con el título; podés cambiarla hasta publicar (después queda fija). Solo minúsculas sin acentos, ' +
              'números y guiones; si la dejás vacía, se vuelve a armar con el título.'
            }
            maxLength={SLUG_MAX[tipo]}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            value={valores.slug}
            onChange={(e) => poner('slug', e.target.value)}
            onBlur={(e) => {
              // Escrita con mayúsculas, acentos o espacios: se arregla sola.
              const arreglada = crearSlug(e.target.value, SLUG_MAX[tipo])
              if (arreglada !== e.target.value) poner('slug', arreglada)
            }}
            error={envio.errores.slug}
          />
        )}

        <div className="grid gap-3 border-t-2 border-suave pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Boton type="submit" ocupado={envio.enviando}>
              {envio.enviando ? 'Guardando…' : publicada ? 'Guardar cambios' : 'Guardar borrador'}
            </Boton>
            {publicada ? (
              <Boton id="ficha-despublicar" variante="secundario" onClick={() => setConfirmar('despublicar')}>
                Despublicar
              </Boton>
            ) : (
              <Boton
                id="ficha-publicar"
                variante="secundario"
                ocupado={envio.enviando}
                onClick={() => guardar({ publicar: true })}
              >
                Publicar
              </Boton>
            )}
            {publicada && PAGINAS_PUBLICAS_DE_CONTENIDO ? (
              <a
                href={urlPublica(tipo, guardada.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className={clasesBoton('secundario')}
              >
                Ver en el sitio<span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            ) : null}
          </div>
          <p className="text-sm text-tenue">
            {publicada
              ? sitio.notaPublicada
              : 'Es un borrador: no está en el sitio. «Publicar» guarda lo que cambiaste y la publica.'}
          </p>
          <Aviso tipo="ok">{sucio ? null : ok}</Aviso>
          {errorAccion ? <Aviso tipo="error">{errorAccion}</Aviso> : null}
        </div>
      </form>

      <section aria-labelledby="ficha-eliminar" className="mt-12 grid max-w-3xl gap-3 border-t-2 border-suave pt-6">
        <h2 id="ficha-eliminar" className="text-xl font-bold">
          Eliminar {c.la}
        </h2>
        <p>
          {publicada
            ? 'Se borra para siempre, con sus fotos. Si solo querés que no se vea en el sitio, despublicala.'
            : 'Se borra para siempre, con sus fotos. Como es un borrador, no está en el sitio aunque no la elimines.'}
        </p>
        <div>
          <Boton variante="peligro" onClick={() => setConfirmar('eliminar')}>
            Eliminar {c.la}
          </Boton>
        </div>
      </section>

      <Confirmar
        abierto={confirmar === 'eliminar'}
        titulo={`¿Eliminar ${c.la} «${titulo}»?`}
        confirmar="Eliminar"
        peligro
        ocupado={trabajando}
        alCancelar={() => setConfirmar(null)}
        alConfirmar={eliminar}
      >
        <p>
          Se borra para siempre, con su portada{c.conGaleria ? ' y las fotos de su galería' : ''} (las que no use otra
          ficha). No se puede deshacer.
        </p>
        {tipo === 'salas' ? <p>Las muestras que estaban en esta sala quedan sin sala.</p> : null}
        {publicada ? (
          <>
            <p>
              Si solo querés que no se vea, despublicala: queda guardada como borrador y la podés volver a publicar
              cuando quieras.
            </p>
            <div>
              <Boton variante="secundario" ocupado={trabajando} onClick={despublicar}>
                Despublicarla en vez de eliminarla
              </Boton>
            </div>
          </>
        ) : (
          <p>Es un borrador: ya no está en el sitio aunque no la elimines.</p>
        )}
      </Confirmar>

      <Confirmar
        abierto={confirmar === 'despublicar'}
        titulo={`¿Despublicar ${c.la} «${titulo}»?`}
        confirmar="Despublicar"
        ocupado={trabajando}
        alCancelar={() => setConfirmar(null)}
        alConfirmar={despublicar}
      >
        <p>{sitio.confirmarDespublicar}</p>
      </Confirmar>
      {dialogo}
    </>
  )
}
