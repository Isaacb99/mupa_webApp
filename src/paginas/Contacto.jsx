import DatosDeContacto, { datosDeContacto } from '../components/DatosDeContacto.jsx'
import FormularioContacto from '../components/FormularioContacto.jsx'
import HeroPagina from '../components/HeroPagina.jsx'
import { contacto } from '../content.js'

// /contacto (E4.5, plan 6.1 y 8): los datos de contacto del museo (estado.museo: dirección, teléfono, correo público,
// redes y el mapa) y el formulario, que se dibuja solo si hay casilla de envío y dirección de destino
// (estado.datos.formulario, server/paginas.js; si no, quedan el correo público y el teléfono de los datos). Después de
// mandar un mensaje se llega con ?enviado=<marca> (el 303 de POST /contacto, con una marca que firma el servidor:
// server/contacto.js) y el formulario dice "Recibimos tu mensaje"; si el servidor tuvo que devolver la página (un
// error de un campo, los límites, que no se pudo enviar), estado.datos trae lo escrito (valores), los errores de cada
// campo (errores) y el de todo el formulario (error), como códigos. Lo que no está cargado no se dibuja (plan 6.1).
// Con el lenguaje del tablero "Web" de la diseñadora (decisiones R1 a R7 del desarrollador; el tablero no dibuja esta
// página), como Visitas: el hero de las páginas internas (HeroPagina.jsx) con su foto (contacto.imagen de content.js:
// la fachada con el cartel) y el h1, y la página se declara sobreFoto; debajo, una sección para los datos y el mapa
// (DatosDeContacto.jsx) y otra para el formulario (FormularioContacto.jsx), cada una a todo el ancho del contenido y
// solo si tiene algo. Hasta el rediseño iban en dos columnas desde lg; los datos, la lógica y el orden no cambiaron.

/** @param {{ estado: { datos: object, museo: object } }} props */
export default function Contacto({ estado }) {
  const d = estado.datos ?? {}
  const datos = datosDeContacto(estado.museo)
  return (
    <>
      <HeroPagina id="contacto-titulo" titulo={contacto.titulo} imagen={contacto.imagen} />
      <DatosDeContacto datos={datos} />
      <FormularioContacto
        formulario={Boolean(d.formulario)}
        enviado={Boolean(d.enviado)}
        valores={d.valores ?? null}
        errores={d.errores ?? null}
        error={d.error ?? null}
        correo={datos.correo}
      />
    </>
  )
}

// La página empieza con la foto del hero debajo del header (src/Raiz.jsx se lo pasa al Layout): con colores forzados
// en un tema claro el logo del header no se invierte sobre una foto (Logo.jsx, A11Y-08).
Contacto.sobreFoto = true
