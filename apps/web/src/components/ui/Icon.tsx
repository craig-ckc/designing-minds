import type { ComponentType } from 'react'
import type { IconProps, IconWeight } from '@phosphor-icons/react'
// Duotone icons, sourced per-glyph from Phosphor's SSR (context-free) build so
// the prerender step stays pure and Vite only bundles the icons we use. These
// are the same icons shadcn.io re-hosts as its "duotone" set.
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight'
import { BookOpenIcon } from '@phosphor-icons/react/dist/ssr/BookOpen'
import { CalculatorIcon } from '@phosphor-icons/react/dist/ssr/Calculator'
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown'
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check'
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr/DownloadSimple'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { FlaskIcon } from '@phosphor-icons/react/dist/ssr/Flask'
import { GlobeIcon } from '@phosphor-icons/react/dist/ssr/Globe'
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List'
import { PaletteIcon } from '@phosphor-icons/react/dist/ssr/Palette'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr/ShoppingCart'
import { SparkleIcon } from '@phosphor-icons/react/dist/ssr/Sparkle'
import { StarIcon } from '@phosphor-icons/react/dist/ssr/Star'
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'

export type IconName =
  | 'check'
  | 'arrow'
  | 'cart'
  | 'doc'
  | 'star'
  | 'shield'
  | 'download'
  | 'spark'
  | 'plus'
  | 'chevron'
  | 'menu'
  | 'close'
  | 'user'
  | 'globe'
  | 'book'
  | 'calc'
  | 'flask'
  | 'palette'
  | 'pencil'

const icons: Record<IconName, ComponentType<IconProps>> = {
  check: CheckIcon,
  arrow: ArrowRightIcon,
  cart: ShoppingCartIcon,
  doc: FileTextIcon,
  star: StarIcon,
  shield: ShieldCheckIcon,
  download: DownloadSimpleIcon,
  spark: SparkleIcon,
  plus: PlusIcon,
  chevron: CaretDownIcon,
  menu: ListIcon,
  close: XIcon,
  user: UserIcon,
  globe: GlobeIcon,
  book: BookOpenIcon,
  calc: CalculatorIcon,
  flask: FlaskIcon,
  palette: PaletteIcon,
  pencil: PencilSimpleIcon,
}

/**
 * Themeable duotone icon. Renders at `size="100%"` so it fills the fixed-size
 * wrapper each call site provides (e.g. `<span className="h-4 w-4">`) and picks
 * up `currentColor` from the surrounding text colour — matching the previous
 * inline-SVG behaviour. Pass `weight` to opt a glyph out of duotone.
 */
export function Icon({
  name,
  weight = 'duotone',
  className,
}: {
  name: IconName
  weight?: IconWeight
  className?: string
}) {
  const Glyph = icons[name]
  return <Glyph weight={weight} size="100%" className={className} aria-hidden />
}
