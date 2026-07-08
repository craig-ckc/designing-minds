import { useEffect, useRef, useState } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { Button } from '../ui/button'
import { Icon, type IconName } from '../ui/icon'
import { Placeholder } from '../ui/placeholder'
import { Section } from '../ui/section'
import getToKnowItems from '../../content/home/get-to-know-items.json'

const items = getToKnowItems as { icon: IconName; title: string; body: string }[]

/** Time each feature stays open before the carousel auto-advances. */
const INTERVAL_MS = 5000

export function GetToKnowSection() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
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

  // Single rAF clock drives the underline fill and the auto-advance, so they
  // stay in sync and pause together on hover. Width is written imperatively to
  // avoid a React render per frame.
  useEffect(() => {
    if (fillRef.current) fillRef.current.style.width = '0%'
    if (paused || reduced || items.length < 2) return
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
  }, [paused, reduced, cycle])

  return (
    <Section>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
        <h2 className="max-w-[12ch]">Get to know Designing Minds</h2>
        <div>
          <p className="lead max-w-[46ch]">
            Replace scattered worksheets and past papers with one tidy library of CAPS-aligned resources built for
            South African classrooms.
          </p>
          <Button to="/about" variant="text" className="mt-3">
            See how it works
            <span className="h-4 w-4">
              <Icon name="arrow" />
            </span>
          </Button>
        </div>
      </div>

      <div
        className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-2 lg:items-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <Accordion.Root
          multiple={false}
          value={[active]}
          onValueChange={(value) => {
            const next = value[0]
            if (typeof next === 'number') select(next)
          }}
          className="border-t border-line"
        >
          {items.map((item, i) => {
            const isOpen = i === active
            return (
              <Accordion.Item key={item.title} value={i} className="relative border-b border-line">
                <Accordion.Header className="m-0">
                  <Accordion.Trigger className="group flex w-full items-center gap-3.5 py-4 text-left">
                    <span className={`h-6 w-6 flex-none transition-colors duration-300 ${isOpen ? 'text-primary' : 'text-muted'}`}>
                      <Icon name={item.icon} />
                    </span>
                    <span className="flex-1 text-body-lg font-bold text-ink transition-colors group-hover:text-primary">
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

        <Placeholder ratio="4 / 3" className="bg-surface" />
      </div>
    </Section>
  )
}
