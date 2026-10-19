// Los textos de Visitas (plan 5.3): Cómo llegar, Normas del museo y Accesibilidad del edificio, tres textos con formato
// (EditorTexto) que se guardan juntos con su botón (PUT /museo, parcial: solo los que cambiaron). Vacío = el sitio no
// muestra esa parte.
// - Lo que da el editor (su JSON) se compara en la forma canónica (compartido/esquemas/textoRico.js, la que guarda el
//   servidor): si no, un párrafo vacío al final o las claves en otro orden (como las devuelve el jsonb) parecían
//   cambios sin guardar.
// - Antes de mandar, los enlaces pegados sin el esquema ("www.…") se completan (completarEnlaces) y se valida con el
//   mismo esquema del servidor; un error va a su campo (el resumen lleva al texto) y a la región del resumen.
// - Avisa a la pantalla qué texto tiene cambios sin guardar, cada uno con su clave (tx-comoLlegar…), así la pregunta
//   al irse dice cuál ("Falta guardar: Cómo llegar.").
// - "Guardado." se ve hasta el primer cambio después de guardar (como en los otros formularios de Visitas).
// - Después de guardar, cada texto que no se tocó mientras se guardaba pasa a verse como quedó guardado (reemplazo de
//   Editor.jsx: sin las líneas en blanco, que no se guardan; corrección de E3, 16/10/2026).
// - La cantidad de caracteres que quedan va en la ayuda de cada texto (hasta CARACTERES_MAX).
import { useEffect, useMemo, useRef, useState } from 'react'
import { esquemaCambioMuseo } from '../../../../compartido/esquemas/museo.js'
import {
  CARACTERES_MAX,
  completarEnlaces,
  medirDocumento,
  textoRico,
} from '../../../../compartido/esquemas/textoRico.js'
import { api } from '../../api.js'
import { Aviso } from '../../componentes/Aviso.jsx'
import { Boton } from '../../componentes/Boton.jsx'
import { EditorTexto } from '../../componentes/EditorTexto.jsx'
import { ResumenErrores, useEnvio } from '../../componentes/formulario.jsx'
import { iguales, validarCon } from '../../formato.js'

export const PREFIJO_TEXTOS = 'tx-'

/** Los tres textos, en el orden de la pantalla: el campo de la API, su nombre y su ayuda. */
export const TEXTOS = [
  {
    campo: 'comoLlegar',
    etiqueta: 'Cómo llegar',
    ayuda: 'Por ejemplo, qué colectivos pasan cerca, dónde estacionar o cómo llegar desde la terminal.',
  },
  {
    campo: 'normas',
    etiqueta: 'Normas del museo',
    ayuda: 'Lo que hay que saber durante la visita: si se pueden sacar fotos, si se puede entrar con comida…',
  },
  {
    campo: 'accesibilidad',
    etiqueta: 'Accesibilidad del edificio',
    ayuda: 'Rampas, ascensor, baños adaptados, lugares para descansar o sillas de ruedas para prestar.',
  },
]
const CAMPOS = TEXTOS.map((t) => t.campo)
const ETIQUETAS = Object.fromEntries(TEXTOS.map((t) => [t.campo, t.etiqueta]))
const formatoNumero = new Intl.NumberFormat('es-AR')

/** La forma canónica de un texto (la que se guarda), o el mismo valor si todavía no es válido. */
function canonico(valor) {
  const r = textoRico.safeParse(completarEnlaces(valor ?? null))
  return r.success ? r.data : valor
}

/**
 * @param {{ museo: Record<string, any>, alCambiarSucio: (clave: string, sucio: boolean) => void }} props
 */
export function Textos({ museo, alCambiarSucio }) {
  const [guardado, setGuardado] = useState(() => Object.fromEntries(CAMPOS.map((c) => [c, canonico(museo[c])])))
  // Lo que da cada editor, tal cual (el inicial: lo guardado).
  const [valores, setValores] = useState(guardado)
  // Los de ahora también entre dos dibujos: al volver el guardado, para saber qué se tocó mientras tanto.
  const valoresAhora = useRef(valores)
  valoresAhora.current = valores
  // Por texto, lo guardado para que su editor lo muestre así.
  const [reemplazos, setReemplazos] = useState({})
  const [ok, setOk] = useState(null)
  const envio = useEnvio(CAMPOS)

  const canonicos = useMemo(() => Object.fromEntries(CAMPOS.map((c) => [c, canonico(valores[c])])), [valores])
  const sucios = Object.fromEntries(CAMPOS.map((c) => [c, !iguales(canonicos[c], guardado[c])]))
  const sucio = CAMPOS.some((c) => sucios[c])
  const clavesSucias = CAMPOS.filter((c) => sucios[c]).join(',')
  useEffect(() => {
    for (const c of CAMPOS) alCambiarSucio(`${PREFIJO_TEXTOS}${c}`, clavesSucias.split(',').includes(c))
  }, [clavesSucias, alCambiarSucio])
  useEffect(() => {
    if (sucio) setOk(null)
  }, [sucio])

  // Una función por texto que no cambia entre dibujos (el editor va en memo).
  const alCambiar = useMemo(
    () => Object.fromEntries(CAMPOS.map((c) => [c, (json) => setValores((v) => ({ ...v, [c]: json }))])),
    [],
  )

  async function alEnviar(e) {
    e.preventDefault()
    setOk(null)
    // Solo los que cambiaron (el pedido no crece de más); si no cambió ninguno, los tres (confirma lo guardado).
    const cambiados = CAMPOS.filter((c) => sucios[c])
    const cuerpo = Object.fromEntries(
      (cambiados.length ? cambiados : CAMPOS).map((c) => [c, completarEnlaces(valores[c] ?? null)]),
    )
    const v = validarCon(esquemaCambioMuseo, cuerpo)
    if (!v.ok) {
      envio.mostrar(v.errores, v.general)
      return
    }
    const enviados = valores
    const r = await envio.enviar(() => api.put('/museo', v.datos))
    if (!r.ok) return
    setGuardado(Object.fromEntries(CAMPOS.map((c) => [c, canonico(r.datos[c])])))
    setReemplazos(
      Object.fromEntries(
        CAMPOS.filter((c) => valoresAhora.current[c] === enviados[c]).map((c) => [
          c,
          { doc: canonico(r.datos[c]), si: enviados[c] },
        ]),
      ),
    )
    setOk('Guardado.')
  }

  return (
    <form noValidate className="grid gap-6" onSubmit={alEnviar}>
      <ResumenErrores envio={envio} prefijo={PREFIJO_TEXTOS} etiquetas={ETIQUETAS} />
      {TEXTOS.map(({ campo, etiqueta, ayuda }) => {
        const quedan = CARACTERES_MAX - medirDocumento(canonicos[campo]).caracteres
        return (
          <EditorTexto
            key={campo}
            id={`${PREFIJO_TEXTOS}${campo}`}
            etiqueta={etiqueta}
            ayuda={
              `${ayuda} Opcional: si queda vacío, no se muestra. Hasta ${formatoNumero.format(CARACTERES_MAX)} ` +
              `caracteres (${quedan >= 0 ? `quedan ${formatoNumero.format(quedan)}` : `sobran ${formatoNumero.format(-quedan)}`}).`
            }
            error={envio.errores[campo]}
            valor={museo[campo] ?? null}
            alCambiar={alCambiar[campo]}
            reemplazo={reemplazos[campo] ?? null}
          />
        )
      })}
      <div>
        <Boton type="submit" ocupado={envio.enviando}>
          {envio.enviando ? 'Guardando…' : 'Guardar los textos'}
        </Boton>
      </div>
      <Aviso tipo="ok">{sucio ? null : ok}</Aviso>
    </form>
  )
}
