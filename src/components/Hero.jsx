import { hero, ui } from '../content.js'
import Placeholder from './Placeholder.jsx'

export default function Hero() {
  const { src, srcSet, sizes, alt } = hero.imagen

  return (
    <section aria-label={ui.portada} className="w-full bg-ink">
      <div className="relative w-full aspect-[4/3] overflow-hidden md:aspect-[16/9] lg:aspect-[21/9] lg:min-h-128 lg:max-h-[85svh]">
        {src ? (
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        ) : (
          <Placeholder alt={alt} className="h-full w-full" />
        )}
      </div>
    </section>
  )
}
