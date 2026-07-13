import { type ReactNode } from 'react'
import { Card } from '../ui/card'
import { Icon, type IconName } from '../ui/icon'
import { Section } from '../ui/section'
import { GrowthChart } from './growth-chart'

const FEATURES = [
  {
    title: 'CAPS-Aligned Curriculum',
    body: 'Every resource follows the latest CAPS Annual Teaching Plan for the grade.',
  },
  {
    title: 'Memorandums Included',
    body: 'Assessments ship with a clear marking memorandum for stress-free marking.',
  },
  {
    title: 'Instant Download & Access',
    body: 'Files unlock on your order page the moment payment succeeds. Print anytime.',
  },
  {
    title: 'Builds Exam Confidence',
    body: 'Structured practice helps learners feel prepared and confident in assessments.',
  },
] as const

const FEATURE_SUBJECTS = ['Mathematics', 'English', 'Natural Science', 'Life Skills', 'Afrikaans', 'History']
const MEMO_ROWS = ['Question 1 — 5 marks', 'Question 2 — 8 marks', 'Question 3 — 12 marks']
const DOWNLOAD_FILES = ['Grade 5 Maths — Term 4.pdf', 'Memorandum.pdf']

function ChipRow() {
  return (
    <div className="flex flex-wrap gap-4">
      {FEATURE_SUBJECTS.map((s) => (
        <span key={s} className="rounded-pill border border-line bg-surface px-3 py-1.5 text-label font-semibold text-ink-soft">
          {s}
        </span>
      ))}
    </div>
  )
}

function MemoRows() {
  return (
    <div className="grid gap-4">
      {MEMO_ROWS.map((r) => (
        <div key={r} className="flex items-center gap-4.5 rounded-lg border border-line bg-surface px-3 py-2 text-label">
          <span className="grid h-5 w-5 flex-none place-items-center rounded-pill bg-meadow text-forest">
            <span className="h-3 w-3">
              <Icon name="check" />
            </span>
          </span>
          {r}
        </div>
      ))}
    </div>
  )
}

function DownloadRows() {
  return (
    <div className="grid gap-4">
      {DOWNLOAD_FILES.map((r) => (
        <div key={r} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-3 py-2 text-label">
          <span className="flex items-center gap-4 truncate">
            <span className="h-4 w-4 flex-none text-primary">
              <Icon name="doc" />
            </span>
            <span className="truncate">{r}</span>
          </span>
          <span className="h-4 w-4 flex-none text-primary">
            <Icon name="download" />
          </span>
        </div>
      ))}
    </div>
  )
}

function BentoCard({
  wide,
  title,
  body,
  tone,
  icon,
  children,
}: {
  wide?: boolean
  title: string
  body: string
  tone: string
  icon: IconName
  children: ReactNode
}) {
  return (
    <Card
      as="article"
      pad="none"
      className={`flex flex-col gap-6 p-7 ${
        wide ? 'lg:col-span-2 lg:flex-row lg:items-start lg:gap-8' : ''
      }`}
    >
      <div className={wide ? 'lg:w-1/2' : ''}>
        <span className={`grid h-11 w-11 place-items-center rounded-lg ${tone}`}>
          <span className="h-6 w-6">
            <Icon name={icon} />
          </span>
        </span>
        <h4 className="mt-4">{title}</h4>
        <p className="mt-2 text-body text-muted">{body}</p>
      </div>
      <div className={wide ? 'lg:w-1/2' : 'mt-auto'}>{children}</div>
    </Card>
  )
}

export function FeatureBentoSection() {
  return (
    <Section>
      <div className="mx-auto mb-10 max-w-prose text-center lg:mb-14">
        <h2>Everything you need for the school term</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <BentoCard wide tone="bg-butter text-amber" icon="doc" title={FEATURES[0].title} body={FEATURES[0].body}>
          <ChipRow />
        </BentoCard>
        <BentoCard tone="bg-blossom text-magenta" icon="check" title={FEATURES[1].title} body={FEATURES[1].body}>
          <MemoRows />
        </BentoCard>
        <BentoCard tone="bg-lagoon text-teal" icon="download" title={FEATURES[2].title} body={FEATURES[2].body}>
          <DownloadRows />
        </BentoCard>
        <BentoCard wide tone="bg-periwinkle text-navy" icon="spark" title={FEATURES[3].title} body={FEATURES[3].body}>
          <GrowthChart />
        </BentoCard>
      </div>
    </Section>
  )
}
