import { type ReactNode } from 'react'
import { WHY_FEATURES } from '../../content/site'
import { Eyebrow } from '../ui/eyebrow'
import { Icon, type IconName } from '../ui/icon'
import { Section } from '../ui/section'
import { GrowthChart } from './growth-chart'
import featureSubjects from '../../content/home/feature-subjects.json'
import featureMemoRows from '../../content/home/feature-memo-rows.json'
import featureDownloadFiles from '../../content/home/feature-download-files.json'

function ChipRow() {
  return (
    <div className="flex flex-wrap gap-4">
      {featureSubjects.map((s) => (
        <span key={s} className="rounded-full bg-surface px-3 py-1.5 text-[0.8rem] font-semibold text-ink-soft shadow-soft">
          {s}
        </span>
      ))}
    </div>
  )
}

function MemoRows() {
  return (
    <div className="grid gap-4">
      {featureMemoRows.map((r) => (
        <div key={r} className="flex items-center gap-4.5 rounded-lg bg-surface px-3 py-2 text-[0.85rem] shadow-soft">
          <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-meadow text-forest">
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
      {featureDownloadFiles.map((r) => (
        <div key={r} className="flex items-center justify-between gap-4 rounded-lg bg-surface px-3 py-2 text-[0.85rem] shadow-soft">
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
    <article
      className={`card flex flex-col gap-6 p-7 ${
        wide ? 'lg:col-span-2 lg:flex-row lg:items-center lg:gap-8' : ''
      }`}
    >
      <div className={wide ? 'lg:w-1/2' : ''}>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
          <span className="h-6 w-6">
            <Icon name={icon} />
          </span>
        </span>
        <h4 className="mt-4">{title}</h4>
        <p className="mt-2 text-[0.95rem] text-muted">{body}</p>
      </div>
      <div className={wide ? 'lg:w-1/2' : 'mt-auto'}>{children}</div>
    </article>
  )
}

export function FeatureBentoSection() {
  return (
    <Section className="bg-surface-alt">
      <div className="mx-auto mb-10 max-w-[680px] text-center lg:mb-14">
        <div className="flex justify-center">
          <Eyebrow>Why families choose us</Eyebrow>
        </div>
        <h2>Everything you need for the school term</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <BentoCard wide tone="bg-butter text-amber" icon="doc" title={WHY_FEATURES[0].title} body={WHY_FEATURES[0].body}>
          <ChipRow />
        </BentoCard>
        <BentoCard tone="bg-blossom text-magenta" icon="check" title={WHY_FEATURES[1].title} body={WHY_FEATURES[1].body}>
          <MemoRows />
        </BentoCard>
        <BentoCard tone="bg-lagoon text-teal" icon="download" title={WHY_FEATURES[2].title} body={WHY_FEATURES[2].body}>
          <DownloadRows />
        </BentoCard>
        <BentoCard wide tone="bg-periwinkle text-navy" icon="spark" title={WHY_FEATURES[3].title} body={WHY_FEATURES[3].body}>
          <GrowthChart />
        </BentoCard>
      </div>
    </Section>
  )
}
