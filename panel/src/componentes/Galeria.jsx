// La galería de una ficha (plan 5.3 y 5.5; E3.1): las fotos en orden, cada una con su miniatura, sus datos
// (descripción, "decorativa", epígrafe y crédito: "Editar los datos" abre DatosFoto, que los guarda en el momento con
// PATCH /fotos/:id, porque son de la foto) y "Mover antes", "Mover después" y "Quitar". Sin arrastrar (WCAG 2.5.7):
// el orden va con botones y cada cambio se anuncia en una región role="status" ("La foto «…» quedó en el lugar 2 de
// 5."); después de mover una, el foco se queda en su botón (o en el otro, si ese ya no se puede usar). "Quitar" ofrece
// "Deshacer" hasta el próximo cambio. Abajo, "Agregar fotos" (SubirFoto, varias en cola).
// Es controlado: el orden y lo que se quita lo guarda la ficha (PUT /:tipo/:id/galeria { fotos: [id] }, E3.3 y E3.4;
// al guardar, el servidor borra las fotos que se quitaron si nadie más las usa). Las fotos que se suben y la ficha no
// llega a guardar quedan huérfanas y las borra la tarea diaria a las 24 h.
// Va adentro del formulario de la ficha: no tiene <form> propio (DatosFoto.jsx explica por qué).
// Correcciones de E3 (16/10/2026): los botones de cada foto la nombran por su lugar y su descripción ("Quitar la foto 2,
// «Chicos mirando un cráneo»"), no solo por el número, que cambia al moverlas; el error de la ficha va también en la
// descripción del primer control (adonde lleva el resumen de errores); y las fotos que ya no están (faltan: el 409 de
// una que borró la tarea diaria) se marcan con su mensaje, en la descripción de su "Quitar".
//
// <Galeria
//   id="galeria"                       el id del grupo (ResumenErrores de la ficha enlaza acá) y prefijo de los demás
//   fotos={[foto, …]}                  en orden, como las devuelve la API ({ id, clave, ancho, alto, alt, … })
//   alCambiar={(fotos) => …}           la lista nueva (otro orden, una menos, una más, o una con sus datos cambiados)
//   etiqueta="Galería"                 opcional
//   maximo={40}                        opcional: cuántas fotos como mucho
//   error={null}                       opcional: el error de la ficha para este campo
//   faltan={[12]}                      opcional: las fotos que ya no están guardadas (se marcan)
//   alCambiarSucio={(clave, sucio) => …}   opcional: datos de una foto o fotos elegidas sin guardar
// />
import { useEffect, useRef, useState } from 'react'
import { Boton } from './Boton.jsx'
import { DatosFoto, Miniatura } from './DatosFoto.jsx'
import { SubirFoto } from './SubirFoto.jsx'

/** Cómo se nombra una foto en los anuncios: por su descripción, o por su lugar si es decorativa. */
const nombreDe = (foto, lugar) => (foto.alt ? `«${foto.alt}»` : `${lugar}`)

const FALTA = 'Esta foto ya no está guardada: quitala y volvé a subirla.'
/** La descripción, recortada para el nombre de un botón. */
const corta = (texto, max = 60) => (texto.length > max ? `${texto.slice(0, max - 1).trimEnd()}…` : texto)
/** "la foto 2, «Chicos mirando un cráneo»" (o "la foto 2 (decorativa)"): lo que nombra cada botón de una foto. */
const cualFoto = (foto, lugar) =>
  foto.decorativa || !foto.alt ? `la foto ${lugar} (decorativa)` : `la foto ${lugar}, «${corta(foto.alt)}»`

/**
 * @param {{ id: string, fotos: object[], alCambiar: (fotos: object[]) => void, etiqueta?: string, maximo?: number,
 *   error?: string | null, faltan?: number[], alCambiarSucio?: (clave: string, sucio: boolean) => void }} props
 */
export function Galeria({
  id,
  fotos,
  alCambiar,
  etiqueta = 'Galería',
  maximo = 40,
  error = null,
  faltan = [],
  alCambiarSucio,
}) {
  // La lista más nueva, también entre dos dibujos: SubirFoto avisa una foto por vez, desde una misma subida.
  const actuales = useRef(fotos)
  actuales.current = fotos
  const avisarSucio = useRef(alCambiarSucio)
  avisarSucio.current = alCambiarSucio
  const [editando, setEditando] = useState(null)
  const [anuncio, setAnuncio] = useState('')
  const [quitada, setQuitada] = useState(null) // { foto, lugar } para "Deshacer"
  const [foco, setFoco] = useState(null)
  useEffect(() => {
    if (!foco) return
    document.getElementById(foco)?.focus()
    setFoco(null)
  }, [foco])
  const idBoton = (accion, foto) => `${id}-${accion}-${foto.id}`
  const idError = error ? `${id}-error` : undefined

  function cambiar(nuevas) {
    actuales.current = nuevas
    alCambiar(nuevas)
  }

  function mover(i, delta) {
    const j = i + delta
    const lista = [...actuales.current]
    if (j < 0 || j >= lista.length) return
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    cambiar(lista)
    setQuitada(null)
    const foto = lista[j]
    setAnuncio(`La foto ${nombreDe(foto, j + 1)} quedó en el lugar ${j + 1} de ${lista.length}.`)
    const extremo = delta < 0 ? j === 0 : j === lista.length - 1
    const mismo = delta < 0 ? 'antes' : 'despues'
    const otro = delta < 0 ? 'despues' : 'antes'
    setFoco(idBoton(extremo ? otro : mismo, foto))
  }

  function quitar(i) {
    const lista = [...actuales.current]
    const [foto] = lista.splice(i, 1)
    cambiar(lista)
    if (editando === foto.id) setEditando(null)
    setQuitada({ foto, lugar: i })
    setAnuncio(`Se quitó la foto ${nombreDe(foto, i + 1)} de la galería. El cambio queda cuando guardes.`)
    // El foco: a la que quedó en su lugar, a la anterior o, si no queda ninguna, a "Deshacer".
    const siguiente = lista[i] ?? lista[i - 1]
    setFoco(siguiente ? idBoton('quitar', siguiente) : `${id}-deshacer`)
  }

  function deshacer() {
    if (!quitada) return
    const lista = [...actuales.current]
    lista.splice(Math.min(quitada.lugar, lista.length), 0, quitada.foto)
    cambiar(lista)
    setAnuncio(`La foto ${nombreDe(quitada.foto, quitada.lugar + 1)} volvió a la galería, en el lugar ${quitada.lugar + 1}.`)
    setFoco(idBoton('quitar', quitada.foto))
    setQuitada(null)
  }

  function alSubir(foto) {
    const lista = [...actuales.current, foto]
    cambiar(lista)
    setQuitada(null)
  }

  function alGuardarDatos(guardada) {
    cambiar(actuales.current.map((f) => (f.id === guardada.id ? guardada : f)))
    setEditando(null)
    const lugar = actuales.current.findIndex((f) => f.id === guardada.id)
    setAnuncio(`Se guardaron los datos de la foto ${lugar + 1}.`)
    setFoco(idBoton('editar', guardada))
  }

  const total = fotos.length
  const lugarLibre = maximo - total
  return (
    <fieldset
      id={id}
      aria-describedby={idError}
      className={`grid min-w-0 gap-4 rounded-md border-2 p-4 ${error ? 'border-error' : 'border-suave'}`}
    >
      <legend className="px-1 text-lg font-bold">{etiqueta}</legend>
      <p className="text-tenue">
        Las fotos se muestran en este orden. La descripción y los demás datos de cada foto se guardan con su botón;
        el orden, las que agregues y las que quites, cuando guardes.
      </p>
      {error ? (
        <p id={idError} className="font-semibold text-error">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}

      {total ? (
        <ol className="grid gap-4">
          {fotos.map((foto, i) => {
            const idTitulo = `${id}-titulo-${foto.id}`
            const enLaFoto = <span className="sr-only"> {cualFoto(foto, i + 1)}</span>
            const falta = faltan.includes(foto.id)
            const idFalta = falta ? `${id}-falta-${foto.id}` : undefined
            // El error de la ficha, en la descripción del primer control de la galería (el de la primera foto).
            const conError = i === 0 && idError ? idError : undefined
            return (
              <li key={foto.id} className={`rounded-md border-2 p-3 ${falta ? 'border-error' : 'border-suave'}`}>
                {/* El grupo adentro del <li>: un rol en el <li> le sacaría el de elemento de la lista. */}
                <div
                  role="group"
                  aria-labelledby={idTitulo}
                  className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-start"
                >
                  <Miniatura foto={foto} className="h-auto w-full max-w-48" />
                  <div className="grid min-w-0 gap-3">
                    <p id={idTitulo} className="font-bold">
                      Foto {i + 1} de {total}
                    </p>
                    {falta ? (
                      <p id={idFalta} className="font-semibold text-error">
                        <span className="sr-only">Error: </span>
                        {FALTA}
                      </p>
                    ) : null}
                    {editando === foto.id ? (
                      <DatosFoto
                        key={foto.id}
                        id={`${id}-datos-${foto.id}`}
                        foto={foto}
                        alGuardar={alGuardarDatos}
                        alCancelar={() => {
                          setEditando(null)
                          setFoco(idBoton('editar', foto))
                        }}
                        alCambiarSucio={avisarSucio.current}
                        describedby={conError}
                      />
                    ) : (
                      <dl className="grid gap-1 wrap-anywhere">
                        <div>
                          <dt className="inline font-semibold">Descripción: </dt>
                          <dd className="inline">{foto.decorativa ? 'Ninguna (es decorativa).' : foto.alt}</dd>
                        </div>
                        {foto.epigrafe ? (
                          <div>
                            <dt className="inline font-semibold">Epígrafe: </dt>
                            <dd className="inline">{foto.epigrafe}</dd>
                          </div>
                        ) : null}
                        {foto.credito ? (
                          <div>
                            <dt className="inline font-semibold">Crédito: </dt>
                            <dd className="inline">{foto.credito}</dd>
                          </div>
                        ) : null}
                      </dl>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {editando === foto.id ? null : (
                        <Boton
                          id={idBoton('editar', foto)}
                          variante="secundario"
                          aria-describedby={conError}
                          onClick={() => {
                            setEditando(foto.id)
                            setFoco(`${id}-datos-${foto.id}-${foto.decorativa ? 'decorativa' : 'alt'}`)
                          }}
                        >
                          Editar los datos<span className="sr-only"> de {cualFoto(foto, i + 1)}</span>
                        </Boton>
                      )}
                      <Boton
                        id={idBoton('antes', foto)}
                        variante="secundario"
                        disabled={i === 0}
                        onClick={() => mover(i, -1)}
                        className="disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mover antes<span className="sr-only">:</span>
                        {enLaFoto}
                      </Boton>
                      <Boton
                        id={idBoton('despues', foto)}
                        variante="secundario"
                        disabled={i === total - 1}
                        onClick={() => mover(i, 1)}
                        className="disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mover después<span className="sr-only">:</span>
                        {enLaFoto}
                      </Boton>
                      <Boton
                        id={idBoton('quitar', foto)}
                        variante="secundario"
                        aria-describedby={idFalta}
                        onClick={() => quitar(i)}
                      >
                        Quitar{enLaFoto}
                      </Boton>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p>Todavía no hay fotos en la galería.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p role="status" className="min-h-6 font-semibold">
          {anuncio}
        </p>
        {quitada ? (
          <Boton id={`${id}-deshacer`} variante="enlace" onClick={deshacer}>
            Deshacer<span className="sr-only">: volver a poner la foto que se quitó</span>
          </Boton>
        ) : null}
      </div>

      {lugarLibre > 0 ? (
        <SubirFoto
          id={`${id}-subir`}
          varias
          maximo={lugarLibre}
          alSubir={alSubir}
          alCambiarSucio={avisarSucio.current}
          etiqueta="Agregar fotos a la galería"
          // Sin fotos, el selector es el primer control de la galería.
          describedby={total ? undefined : idError}
          invalido={!total && Boolean(error)}
        />
      ) : (
        <p className="text-tenue">La galería ya tiene {maximo} fotos, que es el máximo.</p>
      )}
    </fieldset>
  )
}
