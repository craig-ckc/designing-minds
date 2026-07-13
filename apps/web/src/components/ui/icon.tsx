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
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple'
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText'
import { MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin'
import { PhoneIcon } from '@phosphor-icons/react/dist/ssr/Phone'
import { FlaskIcon } from '@phosphor-icons/react/dist/ssr/Flask'
import { FunnelIcon } from '@phosphor-icons/react/dist/ssr/Funnel'
import { GlobeIcon } from '@phosphor-icons/react/dist/ssr/Globe'
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List'
import { PaletteIcon } from '@phosphor-icons/react/dist/ssr/Palette'
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple'
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus'
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck'
import { ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr/ShoppingCart'
import { SmileyIcon } from '@phosphor-icons/react/dist/ssr/Smiley'
import { SparkleIcon } from '@phosphor-icons/react/dist/ssr/Sparkle'
import { StarIcon } from '@phosphor-icons/react/dist/ssr/Star'
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash'
import { TrendUpIcon } from '@phosphor-icons/react/dist/ssr/TrendUp'
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
  | 'smile'
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
  | 'trash'
  | 'trend'
  | 'filter'
  | 'phone'
  | 'mail'
  | 'pin'

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
  smile: SmileyIcon,
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
  trash: TrashIcon,
  trend: TrendUpIcon,
  filter: FunnelIcon,
  phone: PhoneIcon,
  mail: EnvelopeSimpleIcon,
  pin: MapPinIcon,
}

// Functional UI glyphs read best as simple single-stroke lines; everything else
// keeps Phosphor's richer duotone. An explicit `weight` prop overrides both.
const LINE_ICONS = new Set<IconName>(['arrow', 'plus', 'check', 'chevron', 'close', 'menu', 'filter', 'download', 'trash'])

/**
 * Themeable Icon. Picks up `currentColor` from the surrounding text. Defaults to
 * duotone, except the functional glyphs above which default to a clean `regular`
 * line. Renders at `size="100%"` to fill a fixed-size wrapper by default; pass a
 * `size` (px number or CSS length) to size directly, or `weight` to force one.
 */
export function Icon({
  name,
  weight,
  size = '100%',
  className,
}: {
  name: IconName
  weight?: IconWeight
  size?: number | string
  className?: string
}) {
  const Glyph = icons[name]
  const resolved = weight ?? (LINE_ICONS.has(name) ? 'regular' : 'duotone')
  return <Glyph weight={resolved} size={size} className={className} aria-hidden />
}
