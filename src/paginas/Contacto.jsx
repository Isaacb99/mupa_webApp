import DatosDeContacto, { datosDeContacto, hayDatosDeContacto } from '../components/DatosDeContacto.jsx'
import FormularioContacto from '../components/FormularioContacto.jsx'
import { CONTENEDOR, TITULO_PAGINA } from '../components/estilos.js'
import { contacto } from '../content.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// /contacto (E4.5, plan 6.1 y 8): los datos de contacto del museo (estado.museo: dirección, teléfono, correo público,
// redes y el mapa) y el formulario, que se dibuja solo si hay casilla de envío y dirección de destino
// (estado.datos.formulario, server/paginas.js; si no, quedan el correo público y el teléfono de los datos). Después de
// mandar un mensaje se llega con ?enviado=<marca> (el 303 de POST /contacto, con una marca que firma el servidor:
// server/contacto.js) y el formulario dice "Recibimos tu mensaje"; si el servidor tuvo que devolver la página (un
// error de un campo, los límites, que no se pudo enviar), estado.datos trae lo escrito (valores), los errores de cada
// campo (errores) y el de todo el formulario (error), como códigos. Lo que no está cargado no se dibuja (plan 6.1).
// Con datos y formulario, dos columnas desde lg; con uno solo, una.

/** @param {{ estado: { datos: object, museo: object } }} props */
export default function Contacto({ estado }) {
  const d = estado.datos ?? {}
  const datos = datosDeContacto(estado.museo)
  const conDatos = hayDatosDeContacto(datos)
  const conFormulario = Boolean(d.formulario || d.enviado || d.error)
  return (
    <div className={CONTENEDOR}>
      <h1 className={TITULO_PAGINA}>{contacto.titulo}</h1>
      {conDatos || conFormulario ? (
        <div className={`mt-10 grid gap-16 md:mt-16 ${conDatos && conFormulario ? 'lg:grid-cols-2 lg:gap-x-20' : ''}`}>
          <DatosDeContacto datos={datos} />
          <FormularioContacto
            formulario={Boolean(d.formulario)}
            enviado={Boolean(d.enviado)}
            valores={d.valores ?? null}
            errores={d.errores ?? null}
            error={d.error ?? null}
            correo={datos.correo}
          />
        </div>
      ) : null}
    </div>
  )
}
