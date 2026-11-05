// Visitas (plan 4.3, 5.2 y 5.3), para cualquier rol. Desde la Visitas del tablero "Web" de la diseñadora (03/11/2026;
// V1 y V2 del desarrollador) la pantalla pide solo lo que el sitio muestra, en tres partes, cada una con su botón y su
// "Guardado":
// - Horario semanal (visitas/Horario.jsx): GET y PUT /horarios, los días y sus franjas. En el sitio, resumido en la
//   tarjeta "Horarios" de la página de Visitas.
// - Museo accesible (visitas/Textos.jsx): el texto con formato "Accesibilidad" del museo (PUT /museo), con el editor de
//   texto (su código se carga aparte, EditorTexto: el loader lo pide junto con los datos). En el sitio, junto a la foto
//   de "Museo accesible"; vacío, los párrafos del diseño.
// - Compra de entradas (visitas/FormularioMuseo.jsx): si está activa y su dirección (PUT /museo). En el sitio, el botón
//   "Tickets" del menú y de la página principal.
// La dirección, el teléfono, el correo y el mapa de la página de Visitas son de Datos del museo (Museo.jsx): el texto de
// arriba lleva ahí.
// La pantalla junta si alguna parte tiene cambios sin guardar, para preguntar una sola vez antes de irse (React Router
// admite un bloqueo por vez), y la pregunta dice cuáles (visitas/partes.js: "Falta guardar: Horario semanal y
// Accesibilidad.").
// Lo que el sitio dejó de mostrar ya no se pide acá: las tarifas y su nota, el aviso general, la nota general de los
// horarios y la de cada día, "Cómo llegar", las normas y el texto del botón de compra. La API, las columnas y los
// componentes (visitas/Tarifas.jsx) siguen (se decide al cierre, como D1) y lo que el museo cargó no se pierde: PUT
// /museo es parcial y cada parte manda solo lo suyo, y el horario manda la nota de cada día como vino
// (visitas/cuerpoHorario.js).
import { useCallback, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { completarHttps, esUrlHttps } from '../../../compartido/esquemas/campos.js'
import { api } from '../api.js'
import { Campo } from '../componentes/Campo.jsx'
import { Casilla } from '../componentes/Casilla.jsx'
import { precargarEditor } from '../componentes/EditorTexto.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { useCambiosSinGuardar } from '../componentes/formulario.jsx'
import { FormularioMuseo } from './visitas/FormularioMuseo.jsx'
import { Horario } from './visitas/Horario.jsx'
import { CAMPOS_COMPRA, faltaGuardar, PREFIJO_COMPRA } from './visitas/partes.js'
import { Textos } from './visitas/Textos.jsx'

/** El loader (rutas.jsx lo envuelve con la sesión): el horario y el museo a la vez, y el código del editor de texto. */
export async function cargarVisitas({ request }) {
  const opciones = { signal: request.signal }
  // Sin esperarlo: si no llega, el lugar del texto lo dice (EditorTexto) y lo demás de la pantalla anda igual.
  precargarEditor().catch(() => {})
  const [horarios, museo] = await Promise.all([api.get('/horarios', opciones), api.get('/museo', opciones)])
  return { dias: horarios.dias, museo }
}

function Seccion({ id, titulo, children }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-t-2 border-suave pt-8">
      <h2 id={id} className="text-2xl font-bold">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

export default function Visitas() {
  const { dias, museo } = useLoaderData()
  const [sucios, setSucios] = useState({})
  const marcar = useCallback(
    (clave, sucio) => setSucios((s) => (Boolean(s[clave]) === sucio ? s : { ...s, [clave]: sucio })),
    [],
  )
  const { dialogo } = useCambiosSinGuardar(Object.values(sucios).some(Boolean), faltaGuardar(sucios))

  return (
    <>
      <Encabezado titulo="Visitas" />
      <p className="max-w-3xl">
        Lo que se muestra en la página de Visitas del sitio: el horario y el texto de accesibilidad. La dirección, el
        teléfono, el correo y el mapa de esa página se cargan en <Link to="/museo">Datos del museo</Link>. Acá está
        también la compra de entradas. Cada parte se guarda con su botón y se ve en el sitio en cuanto se guarda.
      </p>

      <div className="mt-8 grid max-w-3xl gap-12">
        <Seccion id="visitas-horario" titulo="Horario semanal">
          <p className="text-tenue">
            En la página de Visitas se muestra resumido: los días con el mismo horario van juntos, por ejemplo «Martes a
            viernes: 9:00 a 13:00 y 16:00 a 20:00», y los cerrados al final. Si ningún día está marcado como abierto,
            la página no muestra el horario.
          </p>
          <Horario dias={dias} alCambiarSucio={marcar} />
        </Seccion>

        <Seccion id="visitas-accesible" titulo="Museo accesible">
          <p className="text-tenue">
            El texto de «Museo accesible» en la página de Visitas, junto a la foto. Las cuatro tarjetas que van debajo
            (accesibilidad física, visual y auditiva, y neurodivergencia) son fijas: no se cambian desde el panel. Se
            puede usar negrita, cursiva, subtítulos, listas y enlaces; lo que se pega de Word o de una página queda solo
            con eso.
          </p>
          <Textos museo={museo} alCambiarSucio={marcar} />
        </Seccion>

        <Seccion id="visitas-compra" titulo="Compra de entradas">
          <p className="text-tenue">
            Si las entradas se venden en otra página (una ticketera), el sitio muestra un botón «Tickets» que lleva ahí,
            en el menú de todas las páginas y en la página principal.
          </p>
          <FormularioMuseo
            prefijo={PREFIJO_COMPRA}
            campos={CAMPOS_COMPRA}
            museo={museo}
            etiquetas={{ compraActiva: 'Mostrar el botón', compraUrl: 'Dirección de la página de venta' }}
            textoBoton="Guardar la compra de entradas"
            alCambiarSucio={marcar}
            direcciones={['compraUrl']}
          >
            {({ valores, poner, errores }) => (
              <>
                <Casilla
                  id="co-compraActiva"
                  etiqueta="Mostrar el botón de compra en el sitio"
                  checked={valores.compraActiva}
                  onChange={(e) => poner('compraActiva', e.target.checked)}
                  error={errores.compraActiva}
                />
                <Campo
                  id="co-compraUrl"
                  etiqueta="Dirección de la página de venta"
                  ayuda="La dirección completa, que empieza con https://"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder="https://"
                  value={valores.compraUrl}
                  onChange={(e) => poner('compraUrl', e.target.value)}
                  onBlur={(e) => {
                    // Pegada sin https:// ("www.ticketera.com/museo"): se lo agrega.
                    const completa = completarHttps(e.target.value)
                    if (completa !== e.target.value) poner('compraUrl', completa)
                  }}
                  error={errores.compraUrl}
                />
                {esUrlHttps(valores.compraUrl.trim()) ? (
                  <p>
                    <a
                      href={valores.compraUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center"
                    >
                      Probar la dirección en otra pestaña
                    </a>
                  </p>
                ) : null}
              </>
            )}
          </FormularioMuseo>
        </Seccion>
      </div>
      {dialogo}
    </>
  )
}
