import type { IconName } from '../../ui/icon'

/** Browse destinations shared by the desktop mega menu and the mobile sheet. */
export const shopBrowseLinks: { to: string; icon: IconName; label: string; sub: string }[] = [
  { to: '/shop', icon: 'doc', label: 'All resources', sub: 'The full catalogue' },
  { to: '/grades', icon: 'book', label: 'Grades', sub: 'Browse Grades 3–7' },
  { to: '/packages', icon: 'spark', label: 'Bundles', sub: 'Save with term or full-year bundles' },
]
