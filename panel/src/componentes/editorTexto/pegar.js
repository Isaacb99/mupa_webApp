// Lo que se pega en el editor de texto (plan 5.4: "pegar desde Word queda limpio"), antes de que lo lea el editor
// (transformPastedHTML de ProseMirror). El editor ya se queda solo con lo que admite su esquema (párrafos, un nivel
// de subtítulo, listas, negrita, cursiva, enlaces y saltos de línea): las fuentes, los colores, los tamaños, los
// estilos mso-*, el subrayado, las imágenes y los <style> de Word se van solos. Acá se arregla lo que, sin ayuda,
// quedaría mal:
// - Las listas de Word de escritorio no son <ul>/<ol>: son párrafos con style="mso-list:l0 level1 lfo1" y la viñeta
//   o el número escritos adentro, en un <span style="mso-list:Ignore">. Sin esto quedaban párrafos que empiezan con
//   "·" y espacios. Se arman listas de verdad (numerada si el marcador es "1.", "a)", "iv."…), una por cada tramo de
//   párrafos seguidos del mismo tipo, sin niveles (el editor no tiene listas adentro de listas). Word Online, Google
//   Docs y LibreOffice ya pegan <ul>/<ol>.
// - Los títulos de otros niveles (<h1>, "Título 1" de Word; <h3>…) pasan a <h2>, el único subtítulo.
// - Una celda de tabla sin párrafos adentro pasa a un párrafo (si no, las celdas de una fila quedaban pegadas en un
//   solo renglón). La tabla en sí no existe en el editor: queda su texto, celda por celda.
// Lo que no viene de Word pasa igual por los dos últimos arreglos. DOMParser no ejecuta nada ni descarga imágenes.

const DE_WORD = /urn:schemas-microsoft-com|mso-|class="?Mso/i
const PARRAFO_DE_LISTA = /mso-list:\s*l\d+/i
const NUMERADA = /^\(?(\d+|[a-z]{1,2}|[ivxlcdm]+)[.)]/i
const BLOQUES = 'p, div, h1, h2, h3, h4, h5, h6, ul, ol, li, table, blockquote, pre'

/** Las listas de Word de escritorio (ver arriba). */
function listasDeWord(doc) {
  let lista = null
  for (const p of doc.body.querySelectorAll('p')) {
    const marcadores = p.querySelectorAll('span[style*="mso-list" i]')
    const esDeLista = PARRAFO_DE_LISTA.test(p.getAttribute('style') ?? '') || /^MsoListParagraph/.test(p.className)
    const marcador = [...marcadores].find((s) => /mso-list:\s*ignore/i.test(s.getAttribute('style') ?? ''))
    const textoMarcador = (marcador?.textContent ?? '').replace(/\s+/g, '')
    marcador?.remove()
    if (!esDeLista) continue
    const numero = NUMERADA.exec(textoMarcador)
    const tipo = numero ? 'ol' : 'ul'
    // Sigue la lista anterior si este párrafo viene justo después de ella (y es del mismo tipo).
    if (!(lista && p.previousElementSibling === lista && lista.localName === tipo)) {
      lista = doc.createElement(tipo)
      if (numero && /^\d+$/.test(numero[1]) && Number(numero[1]) > 1) lista.setAttribute('start', numero[1])
      p.before(lista)
    }
    const li = doc.createElement('li')
    const parrafo = doc.createElement('p')
    parrafo.append(...p.childNodes)
    li.append(parrafo)
    lista.append(li)
    p.remove()
  }
}

/** Los títulos de cualquier nivel, al único subtítulo del editor. */
function subtitulos(doc) {
  for (const h of doc.body.querySelectorAll('h1, h3, h4, h5, h6')) {
    const h2 = doc.createElement('h2')
    h2.append(...h.childNodes)
    h.replaceWith(h2)
  }
}

/** Cada celda de tabla sin bloques adentro, en su párrafo. */
function celdas(doc) {
  for (const celda of doc.body.querySelectorAll('td, th')) {
    if (celda.querySelector(BLOQUES)) continue
    const p = doc.createElement('p')
    p.append(...celda.childNodes)
    celda.append(p)
  }
}

/**
 * El HTML que se pegó, arreglado para el editor.
 * @param {string} html
 */
export function limpiarHtmlPegado(html) {
  if (typeof html !== 'string' || !html) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (DE_WORD.test(html)) listasDeWord(doc)
  subtitulos(doc)
  celdas(doc)
  return doc.body.innerHTML
}
