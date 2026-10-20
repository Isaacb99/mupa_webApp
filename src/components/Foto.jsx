import { urlFoto } from '../../compartido/fotos.js'
import { paginas } from '../content.js'

// Aspecto provisorio hasta el diseño de las páginas internas (E6.3): solo clases y orden; los datos y la lógica no
// cambian.
//
// Una foto del panel en el sitio (plan 7, "Foto.jsx"): las que se suben al panel se publican en /fotos/<clave>/ con
// 480, 960 y 1600 px de ancho en WebP (compartido/fotos.js). La foto llega del servidor con sus campos públicos
// (server/contenido-publico.js, fotoPublica): { clave, ancho, alto, variantes, alt, decorativa, epigrafe, credito }.
// - srcset con el ancho REAL de cada archivo, que es min(variante, ancho): una foto de 800 px tiene los tres archivos
//   de 800, así que va uno solo (el de 480 y el de 800). src: el de 960.
// - width y height reales (la proporción: sin corrimientos al cargar, CLS 0) y alt: la descripción, o "" si es
//   decorativa.
// - loading="lazy" salvo la portada de una ficha (prioridad): React precarga las imágenes que no son lazy, así que
//   todo lo que no está en el primer pantallazo va lazy (CLAUDE.md, Buscadores). decoding="async".
// - conPie: en un <figure> con el epígrafe y el crédito, si tiene alguno.

const ANCHOS = [480, 960, 1600]

/**
 * @param {{ foto: { clave: string, ancho: number, alto: number, variantes?: number[], alt: string, decorativa: boolean,
 *   epigrafe?: string | null, credito?: string | null } | null, sizes: string, className?: string,
 *   prioridad?: boolean, conPie?: boolean, altoMaximo?: string }} props
 *   altoMaximo: un alto en CSS ("75svh") que la foto no pasa sin recortarse: el ancho se calcula con su proporción
 *   (min(100%, alto × ancho / alto)), así se sabe antes de que cargue y no corre nada al llegar (con width: auto el
 *   navegador no lo sabe hasta tener la foto)
 */
export default function Foto({ foto, sizes, className = '', prioridad = false, conPie = false, altoMaximo }) {
  if (!foto?.clave) return null
  const { clave, ancho, alto, epigrafe, credito } = foto
  const hay = Array.isArray(foto.variantes) && foto.variantes.length ? foto.variantes : ANCHOS
  const vistos = new Set()
  const srcSet = ANCHOS.filter((a) => hay.includes(a))
    .map((a) => [a, Math.min(a, ancho)])
    .filter(([, real]) => !vistos.has(real) && vistos.add(real))
    .map(([a, real]) => `${urlFoto(clave, `${a}.webp`)} ${real}w`)
    .join(', ')
  const img = (
    <img
      src={urlFoto(clave)}
      srcSet={srcSet}
      sizes={sizes}
      width={ancho}
      height={alto}
      alt={foto.decorativa ? '' : foto.alt}
      loading={prioridad ? undefined : 'lazy'}
      fetchPriority={prioridad ? 'high' : undefined}
      decoding="async"
      className={className}
      style={altoMaximo ? { width: `min(100%, calc(${altoMaximo} * ${ancho / alto}))` } : undefined}
    />
  )
  if (!conPie || !(epigrafe || credito)) return img
  return (
    <figure>
      {img}
      <figcaption className="mt-3 text-sm leading-relaxed text-muted wrap-anywhere">
        {epigrafe}
        {epigrafe && credito ? ' ' : null}
        {credito ? `${paginas.credito} ${credito}` : null}
      </figcaption>
    </figure>
  )
}
