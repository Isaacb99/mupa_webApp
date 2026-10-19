// El diálogo del botón "Enlace" del editor de texto (plan 5.4): un <dialog> (Modal) con la dirección y, si no hay
// texto elegido, el texto que se va a ver. Sirve para poner un enlace, cambiarlo o quitarlo (si el cursor está en uno
// o lo toca, justo antes o justo después, arranca con su dirección y lo cambia entero: enlace.js).
// - La dirección se completa como en el resto del panel ("www.museo.gob.ar" -> https://…; un correo -> mailto:; un
//   teléfono -> tel:, compartido/enlaces.js) y solo se aceptan https:, http:, mailto: y tel:, de hasta 500 caracteres:
//   lo mismo que admite el servidor.
// - Va en un portal, fuera del formulario de la pantalla: un <form> adentro de otro no vale, y Enter en la dirección
//   mandaría el de afuera (guardaría los textos). El envío no sigue hacia el formulario de afuera (en React, los
//   eventos de un portal suben por el árbol de componentes).
// - Con algo escrito, Escape pregunta antes de descartar (Modal con sucio). Al cerrarse, el foco vuelve al texto
//   (Editor.jsx).
// - Un error (la dirección vacía o que no se acepta) va con el patrón de los formularios del panel (useEnvio y
//   ResumenErrores): el resumen recibe el foco y es una región role="alert", así se anuncia también cuando se manda
//   con Enter desde la dirección, donde el foco no se movía y el error no se oía (corrección de E3, 16/10/2026).
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { completarEnlace, esEnlacePermitido, MENSAJE_ENLACE } from '../../../../compartido/enlaces.js'
import { Boton } from '../Boton.jsx'
import { Campo } from '../Campo.jsx'
import { ResumenErrores, useEnvio } from '../formulario.jsx'
import { Modal } from '../Modal.jsx'
import { enlaceParaElDialogo, ponerEnlace, quitarEnlace } from './enlace.js'

const CAMPOS = ['direccion', 'texto']

/**
 * @param {{ abierto: boolean, editor: import('@tiptap/react').Editor | null, idCampo: string, alCerrar: () => void }} props
 */
export function DialogoEnlace({ abierto, editor, idCampo, alCerrar }) {
  const [sucio, setSucio] = useState(false)
  useEffect(() => {
    if (abierto) setSucio(false)
  }, [abierto])
  if (typeof document === 'undefined') return null
  return createPortal(
    <Modal abierto={abierto} titulo="Enlace" alCerrar={alCerrar} sucio={sucio}>
      {/* Se monta al abrirse (Modal): cada vez arranca con lo que hay en el texto en ese momento. */}
      {editor ? (
        <FormularioEnlace editor={editor} idCampo={idCampo} alCerrar={alCerrar} alCambiarSucio={setSucio} />
      ) : null}
    </Modal>,
    document.body,
  )
}

function FormularioEnlace({ editor, idCampo, alCerrar, alCambiarSucio }) {
  const [inicio] = useState(() => enlaceParaElDialogo(editor))
  const [href, setHref] = useState(inicio.href)
  const [texto, setTexto] = useState('')
  const envio = useEnvio(CAMPOS)
  const prefijo = `${idCampo}-enlace-`
  const idHref = `${prefijo}direccion`
  const idTexto = `${prefijo}texto`

  const cambiar = (poner) => (e) => {
    poner(e.target.value)
    envio.limpiar()
    alCambiarSucio(true)
  }

  function guardar(e) {
    e.preventDefault()
    e.stopPropagation()
    const completo = completarEnlace(href)
    if (!esEnlacePermitido(completo)) {
      envio.mostrar({ direccion: completo ? MENSAJE_ENLACE : 'Escribí la dirección del enlace.' })
      return
    }
    ponerEnlace(editor, completo, inicio.conTexto ? texto : '')
    alCambiarSucio(false)
    alCerrar()
  }

  function quitar() {
    quitarEnlace(editor)
    alCambiarSucio(false)
    alCerrar()
  }

  return (
    <form noValidate onSubmit={guardar} className="grid gap-4">
      <ResumenErrores envio={envio} prefijo={prefijo} etiquetas={{ direccion: 'Dirección' }} />
      <Campo
        id={idHref}
        etiqueta="Dirección"
        ayuda="Una página (www.ejemplo.com o https://…), un correo (nombre@dominio.com) o un teléfono (+54 264 …)."
        error={envio.errores.direccion}
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={500}
        value={href}
        onChange={cambiar(setHref)}
      />
      {inicio.conTexto ? (
        <Campo
          id={idTexto}
          etiqueta="Texto que se ve"
          ayuda="Opcional: si lo dejás vacío, se ve la dirección."
          autoComplete="off"
          maxLength={200}
          value={texto}
          onChange={cambiar(setTexto)}
        />
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        {inicio.href ? (
          <Boton variante="secundario" onClick={quitar} className="mr-auto">
            Quitar el enlace
          </Boton>
        ) : null}
        <Boton
          variante="secundario"
          onClick={() => {
            alCambiarSucio(false)
            alCerrar()
          }}
        >
          Cancelar
        </Boton>
        <Boton type="submit">{inicio.href ? 'Cambiar el enlace' : 'Poner el enlace'}</Boton>
      </div>
    </form>
  )
}
