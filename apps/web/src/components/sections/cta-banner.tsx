/* eslint-disable react-refresh/only-export-components -- Intentional compound component API. */
import { type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'

/** Composable CTA: Root → Content (Title, Description, Actions) + optional Artwork. */
function Root({ children, tone = 'brand', layout = 'feature', className }: { children: ReactNode; tone?: 'brand' | 'neutral'; layout?: 'feature' | 'inline'; className?: string }) {
  const tones = { brand: 'bg-primary text-ink', neutral: 'border border-line bg-surface text-ink' }
  return (
    <div className={cn('cta-panel relative isolate rounded-lg', tones[tone], layout === 'inline' && 'cta-panel--inline', className)}>
      {children}
    </div>
  )
}
function Content({ children }: { children: ReactNode }) {
  return <div className="cta-panel__content">{children}</div>
}
function Title({ children, as: Tag = 'h2' }: { children: ReactNode; as?: 'h2' | 'h3' }) {
  return <Tag className="max-w-[24ch] text-balance">{children}</Tag>
}
function Description({ children }: { children: ReactNode }) {
  return <p className="mt-3 max-w-[58ch] text-body leading-relaxed">{children}</p>
}
function Actions({ children }: { children: ReactNode }) {
  return <div className="cta-panel__actions mt-5 flex flex-wrap gap-3">{children}</div>
}
function Artwork({ children }: { children: ReactNode }) {
  return <div className="cta-panel__artwork" aria-hidden="true">{children}</div>
}
export const CtaBanner = { Root, Content, Title, Description, Actions, Artwork }
