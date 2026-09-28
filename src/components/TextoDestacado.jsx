// Texto con destacados: en content.js, lo que va entre **dobles asteriscos** sale en negrita (Bold 700, el peso que
// tienen en el .ai del V03: medido, entre 625 y 700 según la corrida). Solo eso: sin anidar ni otros marcadores.
// El peso va explícito y no por el `strong { font-weight: bolder }` del preflight de Tailwind: `bolder` es relativo al
// del párrafo, y desde que el cuerpo pasó a Light (300, V03) devolvía 400, así que los destacados casi no se notaban
// (lo vio el desarrollador el 25/09/2026 en el párrafo de la intro).
export default function TextoDestacado({ texto = '' }) {
  return texto
    .split('**')
    .map((parte, i) =>
      i % 2 ? (
        <strong key={i} className="font-bold">
          {parte}
        </strong>
      ) : (
        parte
      ),
    )
}
