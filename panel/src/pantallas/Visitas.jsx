// Visitas (plan 4.3, 5.2 y 5.3), para cualquier rol: el horario semanal, las tarifas, el aviso general y la compra de
// entradas. Cada parte se guarda por su lado (con su botón y su "Guardado"; las tarifas, en el momento, cada una al
// guardarla en su diálogo, moverla, ocultarla o eliminarla); la pantalla junta si alguna tiene cambios sin guardar,
// para preguntar una sola vez antes de irse (React Router admite un bloqueo por vez), y la pregunta dice cuáles
// ("Falta guardar: Horario semanal y Aviso general.": la pantalla es larga y tiene cuatro botones de guardar).
// - Horario: GET y PUT /horarios, más la nota general (nota_horarios del museo).
// - Tarifas: GET, POST, PUT y DELETE /tarifas y PUT /tarifas/orden, más la nota de las tarifas.
// - Aviso general (texto y "Mostrar hasta") y compra externa (activa, dirección y texto del botón): campos del museo.
// - El diálogo de una tarifa también cuenta: con algo escrito ahí, irse pregunta como con los demás.
// Los textos con formato (cómo llegar, normas, accesibilidad) se suman con el editor de texto (E3.2).
// El texto del aviso es de una línea, pero va en un cuadro de dos renglones para que se lea entero en el celular: Enter
// no hace nada y un salto de línea pegado pasa a espacio.
import { useCallback, useState } from 'react'
import { useLoaderData } from 'react-router'
import { completarHttps, esUrlHttps } from '../../../compartido/esquemas/campos.js'
import { api } from '../api.js'
import { Aviso } from '../componentes/Aviso.jsx'
import { Boton } from '../componentes/Boton.jsx'
import { Campo, clasesControl } from '../componentes/Campo.jsx'
import { Casilla } from '../componentes/Casilla.jsx'
import { Encabezado } from '../componentes/Encabezado.jsx'
import { useCambiosSinGuardar } from '../componentes/formulario.jsx'
import { fechaLarga, hoyEnSanJuan } from '../formato.js'
import { FormularioMuseo } from './visitas/FormularioMuseo.jsx'
import { Horario } from './visitas/Horario.jsx'
import { Tarifas } from './visitas/Tarifas.jsx'

/** El loader (rutas.jsx lo envuelve con la sesión): las tres cosas a la vez. */
export async function cargarVisitas({ request }) {
  const opciones = { signal: request.signal }
  const [horarios, tarifas, museo] = await Promise.all([
    api.get('/horarios', opciones),
    api.get('/tarifas', opciones),
    api.get('/museo', opciones),
  ])
  return { dias: horarios.dias, tarifas, museo }
}

/** Lo que avisa cada formulario con alCambiarSucio (su clave) y cómo se llama en la pregunta, en el orden de la pantalla. */
const PARTES = [
  ['horario', 'Horario semanal'],
  ['tarifa', 'la tarifa que estás escribiendo'],
  ['nt-', 'Nota de las tarifas'],
  ['av-', 'Aviso general'],
  ['co-', 'Compra de entradas'],
]
const lista = new Intl.ListFormat('es', { type: 'conjunction' })

/** "Falta guardar: Horario semanal y Aviso general." (null si no falta nada) */
function faltaGuardar(sucios) {
  const nombres = PARTES.filter(([clave]) => sucios[clave]).map(([, nombre]) => nombre)
  return nombres.length ? `Falta guardar: ${lista.format(nombres)}.` : null
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
  const { dias, tarifas, museo } = useLoaderData()
  const [sucios, setSucios] = useState({})
  const marcar = useCallback(
    (clave, sucio) => setSucios((s) => (Boolean(s[clave]) === sucio ? s : { ...s, [clave]: sucio })),
    [],
  )
  const { dialogo } = useCambiosSinGuardar(Object.values(sucios).some(Boolean), faltaGuardar(sucios))
  const hoy = hoyEnSanJuan()

  return (
    <>
      <Encabezado titulo="Visitas" />
      <p className="max-w-3xl">
        Lo que necesita saber quien quiere visitar el museo. El horario, la nota de las tarifas, el aviso y la compra de
        entradas se guardan cada uno con su botón; las tarifas se guardan en el momento, sin otro botón. Todo se ve en
        el sitio en cuanto se guarda.
      </p>

      <div className="mt-8 grid max-w-3xl gap-12">
        <Seccion id="visitas-horario" titulo="Horario semanal">
          <Horario dias={dias} notaHorarios={museo.notaHorarios} alCambiarSucio={marcar} />
        </Seccion>

        <Seccion id="visitas-tarifas" titulo="Tarifas">
          <Tarifas tarifas={tarifas} alCambiarSucio={marcar} />
          <FormularioMuseo
            prefijo="nt-"
            campos={['notaTarifas']}
            museo={museo}
            etiquetas={{ notaTarifas: 'Nota de las tarifas' }}
            textoBoton="Guardar la nota de las tarifas"
            alCambiarSucio={marcar}
          >
            {({ valores, poner, errores }) => (
              <Campo
                id="nt-notaTarifas"
                etiqueta="Nota de las tarifas"
                ayuda={`Opcional: se muestra debajo de las tarifas, por ejemplo cómo se paga o quién no paga entrada. Hasta 300 caracteres (quedan ${300 - valores.notaTarifas.length}).`}
                error={errores.notaTarifas}
              >
                {(accesible) => (
                  <textarea
                    {...accesible}
                    rows={3}
                    maxLength={300}
                    value={valores.notaTarifas}
                    onChange={(e) => poner('notaTarifas', e.target.value)}
                    className={clasesControl}
                  />
                )}
              </Campo>
            )}
          </FormularioMuseo>
        </Seccion>

        <Seccion id="visitas-aviso" titulo="Aviso general">
          <p className="text-tenue">
            Para feriados, cierres o cambios de horario: se muestra arriba en el sitio. Con «Mostrar hasta», deja de
            verse después de ese día; sin fecha, queda hasta que lo quites.
          </p>
          <FormularioMuseo
            prefijo="av-"
            campos={['avisoTexto', 'avisoHasta']}
            museo={museo}
            etiquetas={{ avisoTexto: 'Texto del aviso', avisoHasta: 'Mostrar hasta' }}
            textoBoton="Guardar el aviso"
            alCambiarSucio={marcar}
          >
            {({ valores, poner, errores, guardado, guardar, enviando }) => (
              <>
                {guardado.avisoTexto && guardado.avisoHasta && guardado.avisoHasta < hoy ? (
                  <Aviso tipo="atencion">
                    {`El aviso guardado ya no se muestra: era hasta el ${fechaLarga(guardado.avisoHasta)}.`}
                  </Aviso>
                ) : null}
                <Campo
                  id="av-avisoTexto"
                  etiqueta="Texto del aviso"
                  ayuda={`Una oración, por ejemplo «El lunes 12 de octubre el museo permanece cerrado». Hasta 200 caracteres (quedan ${200 - valores.avisoTexto.length}).`}
                  error={errores.avisoTexto}
                >
                  {(accesible) => (
                    <textarea
                      {...accesible}
                      rows={2}
                      maxLength={200}
                      autoComplete="off"
                      value={valores.avisoTexto}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault()
                      }}
                      onChange={(e) => poner('avisoTexto', e.target.value.replace(/\s*[\r\n]+\s*/g, ' '))}
                    />
                  )}
                </Campo>
                <Campo
                  id="av-avisoHasta"
                  etiqueta="Mostrar hasta"
                  ayuda="Opcional. Se muestra hasta ese día inclusive."
                  type="date"
                  className="max-w-60"
                  value={valores.avisoHasta}
                  onChange={(e) => poner('avisoHasta', e.target.value)}
                  error={errores.avisoHasta}
                />
                {guardado.avisoTexto ? (
                  <div>
                    <Boton
                      variante="secundario"
                      ocupado={enviando}
                      onClick={() => guardar({ avisoTexto: '', avisoHasta: '' }, 'Listo: el aviso ya no se muestra.')}
                    >
                      Quitar el aviso
                    </Boton>
                  </div>
                ) : null}
              </>
            )}
          </FormularioMuseo>
        </Seccion>

        <Seccion id="visitas-compra" titulo="Compra de entradas">
          <p className="text-tenue">
            Si las entradas se venden en otra página (una ticketera), el sitio muestra un botón que lleva ahí.
          </p>
          <FormularioMuseo
            prefijo="co-"
            campos={['compraActiva', 'compraUrl', 'compraTexto']}
            museo={museo}
            etiquetas={{
              compraActiva: 'Mostrar el botón',
              compraUrl: 'Dirección de la página de venta',
              compraTexto: 'Texto del botón',
            }}
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
                <Campo
                  id="co-compraTexto"
                  etiqueta="Texto del botón"
                  ayuda={`Opcional: si lo dejás vacío, dice «Comprar entradas». Hasta 40 caracteres (quedan ${40 - valores.compraTexto.length}).`}
                  maxLength={40}
                  autoComplete="off"
                  value={valores.compraTexto}
                  onChange={(e) => poner('compraTexto', e.target.value)}
                  error={errores.compraTexto}
                />
              </>
            )}
          </FormularioMuseo>
        </Seccion>
      </div>
      {dialogo}
    </>
  )
}
