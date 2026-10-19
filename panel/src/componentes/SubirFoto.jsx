// Subir fotos (plan 5.1, 5.5 y 7; E3.1): elegir una o varias, describirlas y subirlas de a una, en cola.
// - accept="image/jpeg,image/png,image/webp": Safari en iPhone convierte el HEIC a JPEG al elegirla.
// - Vista previa con URL.createObjectURL (la CSP del panel permite blob: en img-src); se libera al quitarla o al subirla.
// - Cada foto lleva su descripción (texto alternativo, obligatoria salvo "Foto decorativa"), epígrafe y crédito. Se
//   validan todas con el mismo esquema que el servidor antes de subir la primera.
// - Antes de mandarla, el navegador la achica si hace falta (panel/src/achicarFoto.js: más de 2400 px de ancho o más
//   de ~4 MB). Si pesa más de 20 MB igual, el error sale sin subirla.
// - Etapas, a la vista en cada foto: "Preparando foto…", "Subiendo… 45 %" (con una barra de progreso) y "Procesando
//   foto…"; y anunciadas en una región role="status" al cambiar de etapa (no con cada porcentaje).
// - La subida va con api.subir (XMLHttpRequest, con las reglas de api.js: 401 -> reingreso y se repite; 403 con
//   debeCambiarClave; sin red "Sin conexión, reintentá."). Una que falla queda en la lista con su error y la cola
//   sigue con la siguiente (salvo una sesión terminada o el límite de fotos por hora: ahí se frena).
// - "Cancelar la subida" corta la que está subiendo; las que faltaban quedan en la lista.
// - El foco (corrección de E3, 16/10/2026): mientras sube, los datos de las fotos quedan deshabilitados, así que al
//   empezar (también con Enter en un campo) el foco pasa al botón "Subir…" (ocupado, no deshabilitado). Al terminar:
//   si salió todo bien, al selector de archivos; si una falló, al primer control de esa foto (que tiene el error en su
//   descripción, como el grupo de la foto); si se canceló, a "Subir…" ("Cancelar" ya no está). Antes caía en el body.
// - describedby e invalido: el error de quien lo usa (Portada, Galeria) en el selector de archivos, que es adonde lleva
//   el resumen de errores de la ficha.
// No es un <form>: va adentro del formulario de una ficha (DatosFoto.jsx explica por qué).
//
// <SubirFoto
//   id="g-galeria-subir"             prefijo de los ids (único en la pantalla)
//   varias={false}                   true: elegir varias (galería); false: una (portada)
//   conDecorativa={true}             false en la portada (no la admite)
//   alSubir={(foto) => …}            cada foto subida, como la devuelve POST /fotos ({ id, clave, ancho, alto, alt, … })
//   alCambiarSucio={(clave, sucio) => …}   opcional: hay fotos elegidas sin subir (clave = id)
//   etiqueta="Elegir la foto"        opcional: la etiqueta del selector de archivos
//   textoSubir="Subir la portada"    opcional: el texto del botón
//   maximo={12}                      opcional: cuántas se pueden elegir como mucho (la galería pasa lo que le falta
//                                    para su tope); nunca más de MAX_POR_VEZ
//   describedby="portadaId-error"    opcional: un id más para el aria-describedby del selector de archivos
//   invalido={true}                  opcional: el selector lleva aria-invalid (hay un error de quien lo usa)
// />
import { useCallback, useEffect, useRef, useState } from 'react'
import { AYUDA_ALT, AYUDA_DECORATIVA, FOTO_BYTES_MAX, megas, mensajePeso, TIPOS_FOTO } from '../../../compartido/fotos.js'
import {
  ALT_MAX,
  CREDITO_MAX,
  EPIGRAFE_MAX,
  esquemaDatosFoto,
  esquemaDatosPortada,
} from '../../../compartido/esquemas/fotos.js'
import { prepararFoto } from '../achicarFoto.js'
import { api } from '../api.js'
import { validarCon } from '../formato.js'
import { Aviso } from './Aviso.jsx'
import { Boton } from './Boton.jsx'
import { Campo } from './Campo.jsx'
import { Casilla } from './Casilla.jsx'
import { guardarConEnter } from './DatosFoto.jsx'
import { ResumenErrores, useEnvio } from './formulario.jsx'

/** Cuántas fotos se pueden elegir de una vez. */
export const MAX_POR_VEZ = 20
const SELECTOR = 'selector'

let contador = 0
const nuevaClave = () => `f${++contador}`

const ETAPAS = {
  preparando: () => 'Preparando foto…',
  subiendo: (item) => `Subiendo… ${Math.round(item.progreso * 100)} %`,
  procesando: () => 'Procesando foto…',
}

/** Un error de la subida, para mostrar junto a la foto. */
const mensajeDe = (err) => err?.campos?.foto ?? err?.message ?? 'No se pudo subir la foto.'
/** Errores después de los cuales no tiene sentido seguir con la cola. */
const frenaLaCola = (err) => err?.status === 401 || err?.status === 429 || err?.debeCambiarClave

/**
 * @param {{ id: string, varias?: boolean, conDecorativa?: boolean, alSubir: (foto: object) => void,
 *   alCambiarSucio?: (clave: string, sucio: boolean) => void, etiqueta?: string, textoSubir?: string,
 *   maximo?: number, describedby?: string, invalido?: boolean }} props
 */
export function SubirFoto({
  id,
  varias = false,
  conDecorativa = true,
  alSubir,
  alCambiarSucio,
  etiqueta,
  textoSubir,
  maximo = MAX_POR_VEZ,
  describedby,
  invalido = false,
}) {
  const [elegidas, setElegidas] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  const [aviso, setAviso] = useState(null)
  // A dónde va el foco cuando termina la subida: después del dibujo en que los controles dejan de estar
  // deshabilitados (el id de un control; SELECTOR: el selector de archivos).
  const [foco, setFoco] = useState(null)
  const envio = useEnvio(null)
  const entrada = useRef(null)
  useEffect(() => {
    if (!foco || subiendo) return
    if (foco === SELECTOR) entrada.current?.focus()
    else document.getElementById(foco)?.focus()
    setFoco(null)
  }, [foco, subiendo])
  const control = useRef(null)
  // Para liberar las vistas previas al desmontarse.
  const vistas = useRef(new Set())
  const prefijo = `${id}-`
  // En una ref: si quien lo usa pasa una función nueva en cada dibujo, el efecto de abajo no tiene que correr de nuevo
  // (su limpieza cortaría la subida).
  const avisarSucio = useRef(alCambiarSucio)
  avisarSucio.current = alCambiarSucio

  useEffect(() => {
    avisarSucio.current?.(id, elegidas.length > 0)
  }, [id, elegidas.length])
  useEffect(() => {
    const lista = vistas.current
    return () => {
      avisarSucio.current?.(id, false)
      control.current?.abort()
      for (const url of lista) URL.revokeObjectURL(url)
      lista.clear()
    }
  }, [id])

  const actualizar = useCallback((clave, cambios) => {
    setElegidas((lista) => lista.map((i) => (i.clave === clave ? { ...i, ...cambios } : i)))
  }, [])

  const quitar = useCallback((clave) => {
    setElegidas((lista) => {
      const item = lista.find((i) => i.clave === clave)
      if (item) {
        URL.revokeObjectURL(item.vista)
        vistas.current.delete(item.vista)
      }
      return lista.filter((i) => i.clave !== clave)
    })
  }, [])

  function alElegir(e) {
    const archivos = [...(e.target.files ?? [])]
    // Se vacía, así elegir el mismo archivo otra vez vuelve a avisar.
    e.target.value = ''
    if (!archivos.length) return
    envio.limpiar()
    setAnuncio('')
    const tope = Math.min(MAX_POR_VEZ, maximo)
    const lugar = varias ? Math.max(0, tope - elegidas.length) : 1
    const tomadas = archivos.slice(0, lugar)
    let excedido = null
    if (archivos.length > tomadas.length) {
      const cuantas = tope === 1 ? 'una foto' : `${tope} fotos`
      excedido =
        tope < MAX_POR_VEZ
          ? `Se pueden agregar ${cuantas} más: quedaron ${tomadas.length} en la lista.`
          : `Se pueden subir hasta ${MAX_POR_VEZ} fotos por vez: quedaron ${tomadas.length} en la lista. Subilas y después elegí las demás.`
    }
    setAviso(excedido)
    const nuevas = tomadas.map((archivo) => {
      const vista = URL.createObjectURL(archivo)
      vistas.current.add(vista)
      return {
        clave: nuevaClave(),
        archivo,
        vista,
        sinVista: false,
        alt: '',
        decorativa: false,
        epigrafe: '',
        credito: '',
        estado: 'lista',
        progreso: 0,
        error: null,
      }
    })
    setElegidas((lista) => {
      if (varias) return [...lista, ...nuevas]
      // Una sola: la nueva reemplaza a la anterior.
      for (const i of lista) {
        URL.revokeObjectURL(i.vista)
        vistas.current.delete(i.vista)
      }
      return nuevas
    })
  }

  async function subirTodas() {
    if (subiendo) return
    const pendientes = elegidas
    if (!pendientes.length) return
    const esquema = conDecorativa ? esquemaDatosFoto : esquemaDatosPortada
    const errores = {}
    const datos = {}
    for (const item of pendientes) {
      const valores = { alt: item.alt, decorativa: conDecorativa && item.decorativa, epigrafe: item.epigrafe, credito: item.credito }
      const r = validarCon(esquema, valores)
      if (r.ok) datos[item.clave] = r.datos
      else for (const [campo, texto] of Object.entries(r.errores)) errores[`${item.clave}-${campo}`] = texto
    }
    if (Object.keys(errores).length) {
      envio.mostrar(errores)
      return
    }
    envio.limpiar()
    setAviso(null)
    // Los datos de las fotos se deshabilitan: el foco no puede quedar en uno (con Enter en un campo, ahí estaba).
    document.getElementById(`${prefijo}subir`)?.focus()
    setSubiendo(true)
    const controlador = new AbortController()
    control.current = controlador
    const total = pendientes.length
    let subidas = 0
    let fallidas = 0
    let primerFallida = null
    let cancelada = false
    // Lo que pasó con la anterior va junto con el anuncio de la siguiente: dos cambios seguidos de la región viva se
    // juntan en uno y el primero no se llegaría a oír.
    let anterior = ''
    try {
      for (const [n, item] of pendientes.entries()) {
        const numero = total > 1 ? ` ${n + 1} de ${total}` : ''
        actualizar(item.clave, { estado: 'preparando', progreso: 0, error: null })
        setAnuncio(`${anterior}Preparando la foto${numero}…`)
        anterior = ''
        let preparada
        try {
          preparada = await prepararFoto(item.archivo)
        } catch {
          // Si algo falla al achicarla, va el original (el servidor tiene sus límites).
          preparada = { archivo: item.archivo }
        }
        if (controlador.signal.aborted) {
          cancelada = true
          actualizar(item.clave, { estado: 'lista' })
          break
        }
        if (preparada.archivo.size > FOTO_BYTES_MAX) {
          fallidas += 1
          primerFallida ??= item.clave
          actualizar(item.clave, { estado: 'error', error: mensajePeso(preparada.archivo.size) })
          anterior = `No se pudo subir la foto${numero}. `
          continue
        }
        const d = datos[item.clave]
        const formulario = new FormData()
        formulario.append('alt', d.alt)
        formulario.append('decorativa', String(d.decorativa))
        formulario.append('epigrafe', d.epigrafe ?? '')
        formulario.append('credito', d.credito ?? '')
        formulario.append('foto', preparada.archivo, preparada.archivo.name)
        actualizar(item.clave, { estado: 'subiendo' })
        setAnuncio(`Subiendo la foto${numero}…`)
        try {
          const foto = await api.subir('/fotos', formulario, {
            signal: controlador.signal,
            alProgreso: (fraccion) => actualizar(item.clave, { progreso: fraccion }),
            alProcesar: () => {
              actualizar(item.clave, { estado: 'procesando' })
              setAnuncio(`Procesando la foto${numero}…`)
            },
          })
          subidas += 1
          quitar(item.clave)
          alSubir(foto)
          anterior = `Se subió la foto${numero}. `
        } catch (err) {
          if (err?.name === 'AbortError') {
            cancelada = true
            actualizar(item.clave, { estado: 'lista', progreso: 0 })
            break
          }
          fallidas += 1
          primerFallida ??= item.clave
          actualizar(item.clave, { estado: 'error', error: mensajeDe(err) })
          anterior = `No se pudo subir la foto${numero}. `
          if (frenaLaCola(err)) break
        }
      }
    } finally {
      control.current = null
      setSubiendo(false)
    }
    const quedaron = total - subidas
    if (cancelada) {
      setAnuncio(`Se canceló la subida.${quedaron ? ' Las fotos que faltaban siguen en la lista.' : ''}`)
      setFoco(quedaron ? `${prefijo}subir` : SELECTOR)
    } else if (!fallidas && quedaron === 0) {
      setAnuncio(total > 1 ? `Listo: se subieron las ${total} fotos.` : 'Listo: se subió la foto.')
      setFoco(SELECTOR)
    } else {
      const cuales = quedaron === 1 ? 'la que quedó' : `las ${quedaron} que quedaron`
      setAnuncio(`Se subieron ${subidas} de ${total}. Revisá ${cuales} en la lista.`)
      setFoco(primerFallida ? primerControl(primerFallida) : `${prefijo}subir`)
    }
  }

  /** El primer control de los datos de una foto de la lista (adonde va el foco si falló). */
  function primerControl(clave) {
    return `${prefijo}${clave}-${conDecorativa ? 'decorativa' : 'alt'}`
  }

  const pendientes = elegidas.length
  const etiquetas = {}
  elegidas.forEach((item, n) => {
    const foto = varias ? `Foto ${n + 1}` : 'La foto'
    etiquetas[`${item.clave}-alt`] = `${foto}, descripción`
    etiquetas[`${item.clave}-epigrafe`] = `${foto}, epígrafe`
    etiquetas[`${item.clave}-credito`] = `${foto}, crédito`
  })

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor={`${prefijo}archivo`} className="font-semibold">
          {etiqueta ?? (varias ? 'Elegir fotos' : 'Elegir la foto')}
        </label>
        <p id={`${prefijo}archivo-ayuda`} className="text-sm text-tenue">
          JPG, PNG o WebP, hasta 20 MB{varias ? `; hasta ${MAX_POR_VEZ} por vez` : ''}. Las fotos grandes se achican
          antes de subirlas.
        </p>
        <input
          ref={entrada}
          id={`${prefijo}archivo`}
          type="file"
          accept={TIPOS_FOTO.join(',')}
          multiple={varias}
          disabled={subiendo}
          aria-describedby={[describedby, `${prefijo}archivo-ayuda`].filter(Boolean).join(' ')}
          aria-invalid={invalido || undefined}
          onChange={alElegir}
          className={
            'block w-full min-h-11 rounded-md border-2 border-linea bg-blanco p-1.5 text-base text-tinta ' +
            'file:mr-3 file:min-h-9 file:cursor-pointer file:rounded-md file:border-0 file:bg-fondo-2 file:px-4 ' +
            'file:font-semibold file:text-tinta disabled:opacity-70'
          }
        />
      </div>
      {aviso ? <Aviso tipo="atencion">{aviso}</Aviso> : null}
      <ResumenErrores envio={envio} prefijo={prefijo} etiquetas={etiquetas} />

      {pendientes ? (
        <ol className="grid gap-4">
          {elegidas.map((item, n) => {
            const idNombre = `${prefijo}${item.clave}-nombre`
            // El error de la subida: en la descripción del grupo de la foto y de su primer control.
            const idErrorSubida = item.estado === 'error' ? `${prefijo}${item.clave}-error` : undefined
            const numero = varias ? <span className="sr-only"> de la foto {n + 1}</span> : null
            const etapa = ETAPAS[item.estado]?.(item)
            const conEnter = guardarConEnter(subirTodas)
            return (
              <li
                key={item.clave}
                className={`rounded-md border-2 p-4 ${item.estado === 'error' ? 'border-error' : 'border-suave'}`}
              >
                {/* El grupo adentro del <li>: un rol en el <li> le sacaría el de elemento de la lista. */}
                <div role="group" aria-labelledby={idNombre} aria-describedby={idErrorSubida} className="grid gap-4">
                  <div className="flex flex-wrap items-start gap-4">
                    {item.sinVista ? (
                      <div className="grid h-32 w-40 place-content-center rounded-md border-2 border-dashed border-linea bg-fondo-2 p-2 text-center text-sm text-tenue">
                        Sin vista previa
                      </div>
                    ) : (
                      <img
                        src={item.vista}
                        alt=""
                        decoding="async"
                        className="h-32 w-auto max-w-full rounded-md border-2 border-suave bg-fondo-2 object-contain"
                        onError={() => actualizar(item.clave, { sinVista: true })}
                      />
                    )}
                    <div className="grid min-w-0 flex-1 basis-48 gap-1">
                      <p id={idNombre} className="font-semibold wrap-anywhere">
                        {varias ? `Foto ${n + 1}: ` : ''}
                        {item.archivo.name}
                      </p>
                      <p className="text-tenue">{megas(item.archivo.size)} MB</p>
                      {item.sinVista ? (
                        <p className="text-sm text-tenue">
                          El navegador no la puede mostrar: puede ser un formato que no se acepta (como HEIC).
                        </p>
                      ) : null}
                      {etapa ? (
                        <div className="grid gap-1">
                          <p className="font-semibold">{etapa}</p>
                          {item.estado === 'subiendo' ? (
                            <progress
                              max={100}
                              value={Math.round(item.progreso * 100)}
                              aria-labelledby={idNombre}
                              className="h-3 w-full max-w-xs accent-accion"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {item.estado === 'error' ? (
                        <p id={idErrorSubida} className="font-semibold text-error wrap-anywhere">
                          <span className="sr-only">Error: </span>
                          {item.error}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <fieldset disabled={subiendo} className="grid gap-4">
                    <legend className="sr-only">Datos de {varias ? `la foto ${n + 1}` : 'la foto'}</legend>
                    {conDecorativa ? (
                      <Casilla
                        id={`${prefijo}${item.clave}-decorativa`}
                        etiqueta={<>Foto decorativa{numero}</>}
                        ayuda={AYUDA_DECORATIVA}
                        checked={item.decorativa}
                        onChange={(e) => actualizar(item.clave, { decorativa: e.target.checked })}
                        describedby={idErrorSubida}
                      />
                    ) : null}
                    {conDecorativa && item.decorativa ? null : (
                      <Campo
                        id={`${prefijo}${item.clave}-alt`}
                        etiqueta={<>Descripción (texto alternativo){numero}</>}
                        obligatorio
                        ayuda={AYUDA_ALT}
                        maxLength={ALT_MAX}
                        autoComplete="off"
                        value={item.alt}
                        onChange={(e) => actualizar(item.clave, { alt: e.target.value })}
                        onKeyDown={conEnter}
                        error={envio.errores[`${item.clave}-alt`]}
                        aria-describedby={conDecorativa ? undefined : idErrorSubida}
                      />
                    )}
                    <Campo
                      id={`${prefijo}${item.clave}-epigrafe`}
                      etiqueta={<>Epígrafe{numero}</>}
                      ayuda="Opcional: se muestra debajo de la foto."
                      maxLength={EPIGRAFE_MAX}
                      autoComplete="off"
                      value={item.epigrafe}
                      onChange={(e) => actualizar(item.clave, { epigrafe: e.target.value })}
                      onKeyDown={conEnter}
                      error={envio.errores[`${item.clave}-epigrafe`]}
                    />
                    <Campo
                      id={`${prefijo}${item.clave}-credito`}
                      etiqueta={<>Crédito{numero}</>}
                      ayuda="Opcional: quién sacó la foto, por ejemplo «Foto: Archivo MuPa»."
                      maxLength={CREDITO_MAX}
                      autoComplete="off"
                      value={item.credito}
                      onChange={(e) => actualizar(item.clave, { credito: e.target.value })}
                      onKeyDown={conEnter}
                      error={envio.errores[`${item.clave}-credito`]}
                    />
                    <div>
                      <Boton
                        variante="secundario"
                        onClick={() => {
                          quitar(item.clave)
                          setAnuncio(`Se quitó «${item.archivo.name}» de la lista.`)
                          // El botón que tenía el foco ya no está.
                          setFoco(SELECTOR)
                        }}
                      >
                        Quitar de la lista<span className="sr-only"> «{item.archivo.name}»</span>
                      </Boton>
                    </div>
                  </fieldset>
                </div>
              </li>
            )
          })}
        </ol>
      ) : null}

      {pendientes ? (
        <div className="flex flex-wrap items-center gap-3">
          <Boton id={`${prefijo}subir`} ocupado={subiendo} onClick={subirTodas}>
            {subiendo ? 'Subiendo…' : (textoSubir ?? (pendientes > 1 ? `Subir las ${pendientes} fotos` : 'Subir la foto'))}
          </Boton>
          {subiendo ? (
            <Boton variante="secundario" onClick={() => control.current?.abort()}>
              Cancelar la subida
            </Boton>
          ) : null}
        </div>
      ) : null}
      <p role="status" className="min-h-6 font-semibold">
        {anuncio}
      </p>
    </div>
  )
}
