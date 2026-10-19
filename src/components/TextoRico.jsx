// Un texto con formato del panel (plan 5.4 y 6.1): el JSON del editor, ya validado por el servidor
// (compartido/esquemas/textoRico.js, que lo deja en su forma canónica), dibujado con elementos de React. Nunca HTML
// crudo (plan 9, "Salida"): el texto va como texto y React lo escapa.
// - Párrafos, subtítulos (en el nivel que diga la página: nivelSubtitulo, 2 por defecto; en Visitas, debajo del h2 de
//   cada sección, va 3), listas con viñetas y numeradas, saltos de línea, negrita, cursiva y enlaces.
// - La negrita lleva su peso explícito (font-bold) y no el del strong por defecto: el preflight de Tailwind le pone
//   `bolder`, que es relativo al párrafo y sobre el cuerpo en 300 (V03) daba 400 (ver CLAUDE.md, content.js).
// - Cada enlace se vuelve a mirar antes de dibujarlo (esEnlacePermitido, compartido/enlaces.js, sin zod): si la
//   dirección no es https:, http:, mailto: o tel:, sale el texto sin enlace. Los textos seguidos con el mismo enlace
//   (una parte en negrita) van en un solo <a>.
// - Lo que no conoce (un nodo que el esquema no admite) no lo dibuja.
// - clases: las de cada elemento ({ p, h, ul, ol, li, a }), que pone la página que lo usa. Este archivo no trae estilos
//   propios a propósito: Tailwind escanea src/ entero y cualquier clase nueva escrita acá cambiaría el CSS del sitio.
// Hoy no lo usa ninguna página: llega con Visitas (E4.3) y las páginas de novedades y exposiciones.
import { esEnlacePermitido } from '../../compartido/enlaces.js'

const tiene = (nodo, tipo) => Array.isArray(nodo.marks) && nodo.marks.some((m) => m?.type === tipo)
const enlaceDe = (nodo) => {
  const href = Array.isArray(nodo.marks) ? nodo.marks.find((m) => m?.type === 'link')?.attrs?.href : undefined
  return esEnlacePermitido(href) ? href : null
}

/** Un texto con su negrita y su cursiva (el enlace lo pone el grupo). */
function Trozo({ nodo }) {
  if (nodo.type === 'hardBreak') return <br />
  if (nodo.type !== 'text' || typeof nodo.text !== 'string') return null
  let salida = nodo.text
  if (tiene(nodo, 'italic')) salida = <em>{salida}</em>
  if (tiene(nodo, 'bold')) salida = <strong className="font-bold">{salida}</strong>
  return salida
}

/** El contenido de un párrafo o un subtítulo: los textos seguidos con el mismo enlace van juntos en un <a>. */
function EnLinea({ content, clases }) {
  if (!Array.isArray(content)) return null
  const grupos = []
  for (const nodo of content) {
    if (!nodo || typeof nodo !== 'object') continue
    const href = nodo.type === 'text' ? enlaceDe(nodo) : null
    const ultimo = grupos.at(-1)
    if (ultimo && href && ultimo.href === href) ultimo.nodos.push(nodo)
    else grupos.push({ href, nodos: [nodo] })
  }
  return grupos.flatMap((g, i) =>
    g.href
      ? [
          <a key={i} href={g.href} className={clases.a}>
            {g.nodos.map((nodo, j) => (
              <Trozo key={j} nodo={nodo} />
            ))}
          </a>,
        ]
      : g.nodos.map((nodo, j) => <Trozo key={`${i}.${j}`} nodo={nodo} />),
  )
}

function Parrafo({ nodo, clases }) {
  return (
    <p className={clases.p}>
      <EnLinea content={nodo.content} clases={clases} />
    </p>
  )
}

function Lista({ nodo, clases }) {
  const items = (Array.isArray(nodo.content) ? nodo.content : []).filter((n) => n?.type === 'listItem')
  const hijos = items.map((item, i) => {
    const parrafos = (Array.isArray(item.content) ? item.content : []).filter((n) => n?.type === 'paragraph')
    return (
      <li key={i} className={clases.li}>
        {parrafos.length === 1 ? (
          <EnLinea content={parrafos[0].content} clases={clases} />
        ) : (
          parrafos.map((p, j) => <Parrafo key={j} nodo={p} clases={clases} />)
        )}
      </li>
    )
  })
  if (nodo.type === 'bulletList') return <ul className={clases.ul}>{hijos}</ul>
  const desde = Number.isInteger(nodo.attrs?.start) && nodo.attrs.start > 1 ? nodo.attrs.start : undefined
  return (
    <ol className={clases.ol} start={desde}>
      {hijos}
    </ol>
  )
}

/**
 * @param {{ texto: { type: 'doc', content?: object[] } | null | undefined, nivelSubtitulo?: 2 | 3 | 4 | 5 | 6,
 *   clases?: { p?: string, h?: string, ul?: string, ol?: string, li?: string, a?: string } }} props
 */
export default function TextoRico({ texto, nivelSubtitulo = 2, clases = {} }) {
  if (!texto || texto.type !== 'doc' || !Array.isArray(texto.content)) return null
  const Subtitulo = `h${[2, 3, 4, 5, 6].includes(nivelSubtitulo) ? nivelSubtitulo : 2}`
  return texto.content.map((nodo, i) => {
    switch (nodo?.type) {
      case 'paragraph':
        return <Parrafo key={i} nodo={nodo} clases={clases} />
      case 'heading':
        return (
          <Subtitulo key={i} className={clases.h}>
            <EnLinea content={nodo.content} clases={clases} />
          </Subtitulo>
        )
      case 'bulletList':
      case 'orderedList':
        return <Lista key={i} nodo={nodo} clases={clases} />
      default:
        return null
    }
  })
}
