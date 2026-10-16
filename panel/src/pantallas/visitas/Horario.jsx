// El horario semanal de Visitas (plan 5.3): 7 renglones (Abierto, franja 1 y una franja 2 opcional con
// <input type="time">, nota) y la nota general de los horarios. Guarda con PUT /horarios (los 7 días) y, si cambió,
// la nota general con PUT /museo. Se valida antes con los mismos esquemas del servidor; los errores van al control
// exacto (h-dias.1.franjas.0.cierra).
// Una franja con las dos horas vacías no se manda (si el día está abierto y no queda ninguna, el error lo dice). Un
// error de las franjas del día (ninguna, o más de dos) queda enlazado a sus horas (aria-describedby y aria-invalid),
// y el resumen lleva a la primera.
// "Abre" y "cierra" van lado a lado también en el celular (una debajo de la otra, cada día ocupaba ~600 px).
// "Guardado." se ve hasta el primer cambio después de guardar (si se vuelve a lo guardado, no reaparece).
// Las etiquetas de cada día ("Abierto", "Franja 1: abre", "Nota del día") se repiten 7 veces: llevan el día escondido
// (sr-only), así en la lista de campos del lector y para el control por voz no son siete iguales.
import { useEffect, useState } from 'react'
import { DIAS, esquemaHorarios } from '../../../../compartido/esquemas/horarios.js'
import { esquemaCambioMuseo } from '../../../../compartido/esquemas/museo.js'
import { api } from '../../api.js'
import { Aviso } from '../../componentes/Aviso.jsx'
import { Boton } from '../../componentes/Boton.jsx'
import { Campo, clasesControl } from '../../componentes/Campo.jsx'
import { Casilla } from '../../componentes/Casilla.jsx'
import { ResumenErrores, useEnvio } from '../../componentes/formulario.jsx'
import { aTexto, iguales, validarCon } from '../../formato.js'

const PREFIJO = 'h-'
const FRANJA_VACIA = { abre: '', cierra: '' }

const ETIQUETAS = { notaHorarios: 'Nota general', dias: 'Días' }
DIAS.forEach((nombre, i) => {
  ETIQUETAS[`dias.${i}.franjas`] = `${nombre}, franjas`
  ETIQUETAS[`dias.${i}.nota`] = `${nombre}, nota`
  for (const j of [0, 1]) {
    ETIQUETAS[`dias.${i}.franjas.${j}.abre`] = `${nombre}, franja ${j + 1}, abre`
    ETIQUETAS[`dias.${i}.franjas.${j}.cierra`] = `${nombre}, franja ${j + 1}, cierra`
  }
})

/** El estado de la pantalla: un día abierto tiene al menos una franja para escribir. */
const estadoDe = (dias, notaHorarios) => ({
  dias: dias.map((d) => ({
    dia: d.dia,
    abierto: d.abierto,
    franjas: d.franjas.length ? d.franjas.map((f) => ({ ...f })) : d.abierto ? [{ ...FRANJA_VACIA }] : [],
    nota: aTexto(d.nota),
  })),
  notaHorarios: aTexto(notaHorarios),
})

/** Lo que se manda: sin las franjas vacías y, de un día cerrado, ninguna. */
const cuerpoDe = (estado) => ({
  dias: estado.dias.map((d) => ({
    dia: d.dia,
    abierto: d.abierto,
    franjas: d.abierto ? d.franjas.filter((f) => f.abre || f.cierra) : [],
    nota: d.nota,
  })),
})

/**
 * @param {{ dias: object[], notaHorarios: string | null, alCambiarSucio: (clave: string, sucio: boolean) => void }} props
 */
export function Horario({ dias, notaHorarios, alCambiarSucio }) {
  const [guardado, setGuardado] = useState(() => estadoDe(dias, notaHorarios))
  const [estado, setEstado] = useState(guardado)
  const [ok, setOk] = useState(null)
  const envio = useEnvio(null)
  const sucio = !iguales(cuerpoDe(estado), cuerpoDe(guardado)) || estado.notaHorarios !== guardado.notaHorarios
  const idErrorFranjas = (i) => `${PREFIJO}dias.${i}.franjas-error`
  useEffect(() => {
    alCambiarSucio('horario', sucio)
  }, [sucio, alCambiarSucio])
  useEffect(() => {
    if (sucio) setOk(null)
  }, [sucio])

  const cambiarDia = (i, cambio) =>
    setEstado((e) => ({ ...e, dias: e.dias.map((d, j) => (j === i ? { ...d, ...cambio(d) } : d)) }))
  const cambiarFranja = (i, k, campo, valor) =>
    cambiarDia(i, (d) => ({ franjas: d.franjas.map((f, j) => (j === k ? { ...f, [campo]: valor } : f)) }))
  const enfocar = (id) => requestAnimationFrame(() => document.getElementById(id)?.focus())

  async function alEnviar(e) {
    e.preventDefault()
    setOk(null)
    const horario = validarCon(esquemaHorarios, cuerpoDe(estado))
    const notaCambio = estado.notaHorarios !== guardado.notaHorarios
    const nota = validarCon(esquemaCambioMuseo, { notaHorarios: estado.notaHorarios })
    if (!horario.ok || !nota.ok) {
      envio.mostrar({ ...(horario.errores ?? {}), ...(nota.errores ?? {}) }, horario.general ?? null)
      return
    }
    const r = await envio.enviar(async () => {
      const h = await api.put('/horarios', horario.datos)
      const m = notaCambio ? await api.put('/museo', nota.datos) : null
      return { dias: h.dias, notaHorarios: m ? m.notaHorarios : estado.notaHorarios.trim() || null }
    })
    if (!r.ok) return
    const nuevo = estadoDe(r.datos.dias, r.datos.notaHorarios)
    setGuardado(nuevo)
    setEstado(nuevo)
    setOk('Guardado.')
  }

  return (
    <form onSubmit={alEnviar} noValidate className="grid gap-6">
      <ResumenErrores envio={envio} prefijo={PREFIJO} etiquetas={ETIQUETAS} />
      <ul className="grid gap-4">
        {estado.dias.map((d, i) => {
          const id = `${PREFIJO}dias.${i}`
          const errorFranjas = envio.errores[`dias.${i}.franjas`]
          const delDia = <span className="sr-only"> ({DIAS[i].toLowerCase()})</span>
          return (
            <li key={d.dia}>
              <fieldset className="grid gap-3 rounded-md border-2 border-suave p-4">
                <legend className="px-1 text-lg font-bold">{DIAS[i]}</legend>
                <Casilla
                  id={`${id}.abierto`}
                  etiqueta={<>Abierto{delDia}</>}
                  checked={d.abierto}
                  onChange={(ev) => {
                    const abierto = ev.target.checked
                    cambiarDia(i, (x) => ({
                      abierto,
                      franjas: abierto && !x.franjas.length ? [{ ...FRANJA_VACIA }] : x.franjas,
                    }))
                  }}
                />
                {d.abierto ? (
                  <div id={`${id}.franjas`} tabIndex={-1} className="grid gap-3">
                    {errorFranjas ? (
                      <p id={idErrorFranjas(i)} className="text-sm font-semibold text-error">
                        <span className="sr-only">Error: </span>
                        {errorFranjas}
                      </p>
                    ) : null}
                    {d.franjas.map((f, k) => (
                      <div key={k} className="flex flex-wrap items-end gap-3">
                        <div className="grid w-full grid-cols-2 items-end gap-3 sm:w-auto sm:grid-cols-[10rem_10rem]">
                          <Campo
                            id={`${id}.franjas.${k}.abre`}
                            etiqueta={
                              <>
                                Franja {k + 1}: abre{delDia}
                              </>
                            }
                            type="time"
                            value={f.abre}
                            onChange={(ev) => cambiarFranja(i, k, 'abre', ev.target.value)}
                            error={envio.errores[`dias.${i}.franjas.${k}.abre`]}
                            aria-describedby={errorFranjas ? idErrorFranjas(i) : undefined}
                            aria-invalid={errorFranjas ? true : undefined}
                          />
                          <Campo
                            id={`${id}.franjas.${k}.cierra`}
                            etiqueta={
                              <>
                                Franja {k + 1}: cierra{delDia}
                              </>
                            }
                            type="time"
                            value={f.cierra}
                            onChange={(ev) => cambiarFranja(i, k, 'cierra', ev.target.value)}
                            error={envio.errores[`dias.${i}.franjas.${k}.cierra`]}
                            aria-describedby={errorFranjas ? idErrorFranjas(i) : undefined}
                            aria-invalid={errorFranjas ? true : undefined}
                          />
                        </div>
                        {k === 1 ? (
                          <Boton
                            variante="secundario"
                            onClick={() => {
                              cambiarDia(i, (x) => ({ franjas: x.franjas.slice(0, 1) }))
                              enfocar(`${id}.agregar`)
                            }}
                          >
                            Quitar la franja 2<span className="sr-only"> del {DIAS[i].toLowerCase()}</span>
                          </Boton>
                        ) : null}
                      </div>
                    ))}
                    {d.franjas.length < 2 ? (
                      <div>
                        <Boton
                          id={`${id}.agregar`}
                          variante="secundario"
                          onClick={() => {
                            cambiarDia(i, (x) => ({ franjas: [...x.franjas, { ...FRANJA_VACIA }] }))
                            enfocar(`${id}.franjas.1.abre`)
                          }}
                        >
                          Agregar una segunda franja<span className="sr-only"> al {DIAS[i].toLowerCase()}</span>
                        </Boton>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-tenue">Cerrado.</p>
                )}
                <Campo
                  id={`${id}.nota`}
                  etiqueta={<>Nota del día{delDia}</>}
                  ayuda="Opcional, por ejemplo «Visitas guiadas a las 11»."
                  maxLength={120}
                  autoComplete="off"
                  value={d.nota}
                  onChange={(ev) => cambiarDia(i, () => ({ nota: ev.target.value }))}
                  error={envio.errores[`dias.${i}.nota`]}
                />
              </fieldset>
            </li>
          )
        })}
      </ul>
      <Campo
        id={`${PREFIJO}notaHorarios`}
        etiqueta="Nota general de los horarios"
        ayuda={`Opcional: se muestra debajo del horario, por ejemplo qué pasa los feriados. Hasta 300 caracteres (quedan ${300 - estado.notaHorarios.length}).`}
        error={envio.errores.notaHorarios}
      >
        {(accesible) => (
          <textarea
            {...accesible}
            rows={3}
            maxLength={300}
            value={estado.notaHorarios}
            onChange={(ev) => setEstado((e) => ({ ...e, notaHorarios: ev.target.value }))}
            className={clasesControl}
          />
        )}
      </Campo>
      <div>
        <Boton type="submit" ocupado={envio.enviando}>
          {envio.enviando ? 'Guardando…' : 'Guardar el horario'}
        </Boton>
      </div>
      <Aviso tipo="ok">{sucio ? null : ok}</Aviso>
    </form>
  )
}
