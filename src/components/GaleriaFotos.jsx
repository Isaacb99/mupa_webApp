import Foto from './Foto.jsx'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// La galería de una muestra o de una novedad: las fotos en su orden, en columnas (una en el celular, dos y tres desde
// tablet), cada una con su proporción (sin recortar) y con su epígrafe y su crédito. Todas lazy (Foto.jsx): están
// debajo del texto, nunca en el primer pantallazo. Sin visor ni efectos.

/** @param {{ fotos: object[] }} props  las fotos con sus campos públicos (Foto.jsx) */
export default function GaleriaFotos({ fotos }) {
  return (
    <ul className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">
      {fotos.map((foto) => (
        <li key={foto.clave} className="mb-6 break-inside-avoid">
          <Foto
            foto={foto}
            conPie
            sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 100vw"
            className="h-auto w-full rounded-[0.625rem]"
          />
        </li>
      ))}
    </ul>
  )
}
