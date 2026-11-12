import { Link } from 'react-router-dom'
import { Container } from '../../ui/container'
import { Icon } from '../../ui/icon'

/** Full-width promo bar above the nav; scrolls away as the sticky header pins.
 *  Brand pink (`primary-strong`) by design: white text is ~3.4:1, accepted
 *  deliberately (2026-11-11). Hover deepens to `primary-ink`. */
export function AnnouncementBar() {
  return (
    <Link to="/shop" className="block bg-primary-strong text-on-primary transition-colors hover:bg-primary-ink">
      <Container className="flex items-center justify-center gap-2 py-3 text-center text-label font-semibold">
        New: CAPS resources for Grades 3–7 are here
        <Icon name="arrow" size={16} />
      </Container>
    </Link>
  )
}
