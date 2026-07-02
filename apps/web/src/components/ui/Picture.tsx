import type { ImgHTMLAttributes } from 'react'

/* -------------------------------------------------------------------------
   <Picture> — AVIF-first image with the original as a compressed fallback.

   Point `src` at a raster image in public/ (e.g. "/images/hero.png"). The build
   step (scripts/optimize-images.mjs) generates a sibling ".avif" and shrinks the
   original, so in production this renders:

     <picture>
       <source srcset="/images/hero.avif" type="image/avif" />
       <img src="/images/hero.png" ... />
     </picture>

   In dev the .avif does not exist yet (it's a build artifact), and a <picture>
   source that 404s would show a broken image, so we render a plain <img> until
   the build runs. SVG/GIF sources are passed straight through unchanged.
   ------------------------------------------------------------------------- */

const AVIF_SOURCE_EXT = /\.(png|jpe?g|webp)$/i

type PictureProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
}

export function Picture({ src, alt, ...imgProps }: PictureProps) {
  const eligible = import.meta.env.PROD && AVIF_SOURCE_EXT.test(src)

  if (!eligible) {
    return <img src={src} alt={alt} {...imgProps} />
  }

  const avifSrc = src.replace(AVIF_SOURCE_EXT, '.avif')
  return (
    <picture>
      <source srcSet={avifSrc} type="image/avif" />
      <img src={src} alt={alt} {...imgProps} />
    </picture>
  )
}
