// La portada de una ficha (plan 5.3 y 5.5; E3.1): elegirla, reemplazarla o quitarla. No admite una foto decorativa
// (la portada siempre lleva descripción: sale en las tarjetas, en Google y al compartir).
// - Sin portada: el selector para subir una (SubirFoto, de a una y sin "decorativa").
// - Con portada: la foto chica, sus datos (DatosFoto: descripción, epígrafe y crédito, que se guardan en el momento
//   con su botón, porque son de la foto) y "Reemplazar la portada" / "Quitar la portada".
// Es controlado: la portada la guarda la ficha (portadaId en su PUT, E3.3 y E3.4). Una foto subida que la ficha no
// llega a guardar queda huérfana y la borra la tarea diaria a las 24 h; la que se reemplaza o se quita la borra el
// servidor al guardar la ficha (liberarFotos), si nadie más la usa.
// Va adentro del formulario de la ficha: no tiene <form> propio (DatosFoto.jsx explica por qué).
// El error de la ficha (error) va en la descripción del grupo y del primer control, que es adonde lleva el resumen de
// errores: el selector de archivos (sin portada, o reemplazándola) o la descripción de la foto (corrección de E3,
// 16/10/2026: estaba solo en el grupo, y algunos lectores de pantalla no lo leen al entrar).
//
// <Portada
//   id="portadaId"                 el id del grupo: ResumenErrores de la ficha enlaza acá (lleva al primer control)
//   foto={foto | null}             la portada actual, como la devuelve la API ({ id, clave, ancho, alto, alt, … })
//   alCambiar={(foto | null) => …} la nueva portada (subida recién) o null si se quitó
//   etiqueta="Portada"             opcional
//   obligatorio={true}             opcional: "(obligatoria para publicar)"
//   error={'Elegí una portada.'}   opcional: el error de la ficha para este campo
//   quitable={true}                opcional: false para no ofrecer "Quitar la portada"
//   alCambiarSucio={(clave, sucio) => …}   opcional: hay algo elegido o escrito sin guardar en la foto
// />
import { useEffect, useRef, useState } from 'react'
import { Boton } from './Boton.jsx'
import { DatosFoto, Miniatura } from './DatosFoto.jsx'
import { SubirFoto } from './SubirFoto.jsx'

/**
 * @param {{ id: string, foto: object | null, alCambiar: (foto: object | null) => void, etiqueta?: string,
 *   obligatorio?: boolean, error?: string | null, quitable?: boolean,
 *   alCambiarSucio?: (clave: string, sucio: boolean) => void }} props
 */
export function Portada({
  id,
  foto,
  alCambiar,
  etiqueta = 'Portada',
  obligatorio = false,
  error = null,
  quitable = true,
  alCambiarSucio,
}) {
  const [reemplazando, setReemplazando] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  // A dónde va el foco después del próximo dibujo (el botón que tenía el foco ya no está).
  const [foco, setFoco] = useState(null)
  useEffect(() => {
    if (!foco) return
    document.getElementById(foco)?.focus()
    setFoco(null)
  }, [foco])
  const avisarSucio = useRef(alCambiarSucio)
  avisarSucio.current = alCambiarSucio
  const idError = error ? `${id}-error` : undefined

  function alSubir(nueva) {
    setReemplazando(false)
    alCambiar(nueva)
    setAnuncio('Se subió la foto: queda como portada cuando guardes.')
    setFoco(`${id}-reemplazar`)
  }

  function quitar() {
    alCambiar(null)
    setAnuncio('Se quitó la portada: el cambio queda cuando guardes.')
    setFoco(`${id}-subir-archivo`)
  }

  const subir = (
    <SubirFoto
      id={`${id}-subir`}
      conDecorativa={false}
      alSubir={alSubir}
      alCambiarSucio={avisarSucio.current}
      etiqueta={foto ? 'Elegir la portada nueva' : 'Elegir la portada'}
      textoSubir="Subir la portada"
      describedby={idError}
      invalido={Boolean(error)}
    />
  )

  return (
    <fieldset
      id={id}
      aria-describedby={idError}
      className={`grid min-w-0 gap-4 rounded-md border-2 p-4 ${error ? 'border-error' : 'border-suave'}`}
    >
      <legend className="px-1 text-lg font-bold">
        {etiqueta}
        {obligatorio ? <span className="font-normal text-tenue"> (obligatoria para publicar)</span> : null}
      </legend>
      <p className="text-tenue">
        La foto principal: se ve arriba de la ficha, en las tarjetas y al compartir el enlace. Siempre lleva
        descripción.
      </p>
      {error ? (
        <p id={idError} className="font-semibold text-error">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}

      {foto ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-start">
          <Miniatura foto={foto} className="h-auto w-full max-w-80" />
          <div className="grid min-w-0 gap-4">
            {reemplazando ? (
              <>
                {subir}
                <div>
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setReemplazando(false)
                      setFoco(`${id}-reemplazar`)
                    }}
                  >
                    No reemplazarla
                  </Boton>
                </div>
              </>
            ) : (
              <>
                <DatosFoto
                  key={foto.id}
                  id={`${id}-datos`}
                  foto={foto}
                  conDecorativa={false}
                  alGuardar={(guardada) => alCambiar(guardada)}
                  alCambiarSucio={avisarSucio.current}
                  describedby={idError}
                />
                <div className="flex flex-wrap gap-3">
                  <Boton
                    id={`${id}-reemplazar`}
                    variante="secundario"
                    onClick={() => {
                      setReemplazando(true)
                      setAnuncio('')
                      setFoco(`${id}-subir-archivo`)
                    }}
                  >
                    Reemplazar la portada
                  </Boton>
                  {quitable ? (
                    <Boton variante="secundario" onClick={quitar}>
                      Quitar la portada
                    </Boton>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        subir
      )}
      <p role="status" className="min-h-6 font-semibold">
        {anuncio}
      </p>
    </fieldset>
  )
}
