import { Link } from 'react-router-dom'
import { Logo } from './logo';

/** Brand lockup: smile mark + Wordmark. */
export function Wordmark({
  onClick,
  className = '',
}: {
  onClick?: () => void
  sub?: boolean
  className?: string
}) {
  return (
    <Link to="/" onClick={onClick} className={`flex items-center gap-2.5 ${className}`}>
      <Logo className="w-25 flex-none text-primary" />
    </Link>
  )
}
