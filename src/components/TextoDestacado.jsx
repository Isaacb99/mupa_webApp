// Texto con destacados: en content.js, lo que va entre **dobles asteriscos** sale en negrita (Geologica Bold, como en
// el diseño). Solo eso: sin anidar ni otros marcadores.
export default function TextoDestacado({ texto = '' }) {
  return texto.split('**').map((parte, i) => (i % 2 ? <strong key={i}>{parte}</strong> : parte))
}
