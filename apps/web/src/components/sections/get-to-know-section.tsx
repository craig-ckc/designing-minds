import { useEffect, useRef, useState } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { Button } from '../ui/button'
import { ArrowAffordance, Icon, type IconName } from '../ui/icon'
import { Section } from '../ui/section'
const items: { icon: IconName; title: string; body: string }[] = [
  { icon: 'doc', title: 'Find the right test', body: 'Browse tests and summaries by grade, term or subject. Everything follows CAPS, so it matches what your child is learning at school.' },
  { icon: 'check', title: 'Choose a resource or bundle', body: 'Pick one resource for a specific topic, or choose a bundle for more of the term’s practice in one purchase.' },
  { icon: 'download', title: 'Buy & download', body: 'Once payment succeeds, download your learning materials from your order page. Your purchases are also saved in your account.' },
  { icon: 'book', title: 'Print, practise & revise', body: 'Print at home, work through the tests and use the included memos to mark together. Summaries help revisit key concepts before assessments.' },
  { icon: 'shield', title: 'Download again any time', body: 'Re-download purchases from your account, ready for the next practice session.' },
]

/** Time each feature stays open before the carousel auto-advances. */
const INTERVAL_MS = 5000

export function GetToKnowSection() {
  const [active, setActive] = useState(0)
  const [reduced, setReduced] = useState(false)
  // Bumped on manual selection so the progress timer restarts from zero.
  const [cycle, setCycle] = useState(0)
  const fillRef = useRef<HTMLSpanElement>(null)

  const select = (i: number) => {
    setActive(i)
    setCycle((c) => c + 1)
  }

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Single rAF clock drives the underline fill and the auto-advance. Width is
  // written imperatively to avoid a React render per frame.
  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = '0%'
    if (reduced || items.length < 2) return
    let raf = 0
    let start: number | null = null
    const tick = (t: number) => {
      if (start === null) start = t
      const progress = Math.min((t - start) / INTERVAL_MS, 1)
      if (fillRef.current) fillRef.current.style.width = `${progress * 100}%`
      if (progress >= 1) {
        start = t
        setActive((a) => (a + 1) % items.length)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, cycle])

  return (
    // The cream band marks the shift from shopping to the "why" story, and
    // the heading sits above the steps it introduces rather than in its own
    // row, which left a dead band between intro and steps on desktop.
    <Section id="learning-support" className="bg-surface-alt">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <h2 className="max-w-[18ch]">How Designing Minds works</h2>
          <p className="lead mt-4 max-w-[46ch]">
            Find the tests and summaries your child needs, buy them once and print them at home before the next
            assessment.
          </p>
          <Button to="/about" variant="text" className="mt-3 px-0">
            Our story
            <ArrowAffordance size="md" />
          </Button>

          <Accordion.Root
            multiple={false}
            value={[active]}
            onValueChange={(value) => {
              const next = value[0]
              if (typeof next === 'number') select(next)
            }}
            className="mt-8 border-t border-line-strong"
          >
            {items.map((item, i) => {
              const isOpen = i === active
              return (
                <Accordion.Item key={item.title} value={i} className="relative border-b border-line-strong">
                  <Accordion.Header className="m-0">
                    <Accordion.Trigger className="group flex w-full items-center gap-4 py-4 text-left">
                      <span className={`h-6 w-6 flex-none transition-colors duration-300 ${isOpen ? 'text-primary' : 'text-muted'}`}>
                        <Icon name={item.icon} />
                      </span>
                      <span className="flex-1 text-body-lg font-bold text-ink transition-colors group-hover:text-primary-ink">
                        {item.title}
                      </span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                    <p className="pb-5 pl-[38px] pr-4 text-body text-muted">{item.body}</p>
                  </Accordion.Panel>
                  {/* Active item's underline doubles as the auto-advance progress bar. */}
                  {isOpen ? (
                    <span ref={fillRef} className="absolute -bottom-px left-0 h-[2px] bg-primary" style={{ width: '0%' }} aria-hidden />
                  ) : null}
                </Accordion.Item>
              )
            })}
          </Accordion.Root>
        </div>

        <img
          src="/images/paintings/how-it-works-kitchen-table.avif"
          alt=""
          width={1280}
          height={960}
          loading="lazy"
          decoding="async"
          className="hidden aspect-[4/3] w-full rounded-md object-cover lg:block"
        />
      </div>
    </Section>
  )
}
