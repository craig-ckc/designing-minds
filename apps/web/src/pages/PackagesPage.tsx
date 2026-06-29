import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs } from '@base-ui/react/tabs'
import { ALL, type CmsSnapshot, type Product, accessPlanProducts, bundleProducts } from '@designing-minds/cms'
import { Container } from '../components/ui/Container'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { PageHeader } from '../components/ui/Headings'
import { Select } from '../components/ui/Select'
import { ProductCard } from '../components/ProductCard'

function Grid({ products, empty }: { products: Product[]; empty: string }) {
  if (products.length === 0) {
    return (
      <div className="card p-7 text-center">
        <p className="text-muted">{empty}</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

const tabCls = 'relative z-10 px-4 py-2.5 text-[0.95rem] font-medium text-muted data-[selected]:text-ink'

type Tier = 'essential' | 'premium'

export function PackagesPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams] = useSearchParams()
  const bundles = useMemo(() => bundleProducts(snapshot), [snapshot])
  const termBundles = bundles.filter((b) => b.bundleScope === 'Term')
  const yearBundles = bundles.filter((b) => b.bundleScope === 'Full Year')
  const plans = useMemo(() => accessPlanProducts(snapshot), [snapshot])

  // Arrive pre-filtered when a homepage/nav tier link sets the query params.
  const planParam = searchParams.get('plan')
  const defaultTab = searchParams.get('tab') === 'plans' || planParam ? 'plans' : 'term'
  const [tier, setTier] = useState<Tier>(planParam === 'premium' ? 'premium' : 'essential')
  const [grade, setGrade] = useState<string>(searchParams.get('grade') ?? ALL)
  const [term, setTerm] = useState<string>(searchParams.get('term') ?? ALL)

  // Essential is one grade + one term; Premium is one grade across all terms.
  const period = tier === 'premium' ? 'Year' : 'Term'
  const filteredPlans = plans.filter(
    (p) =>
      p.accessPeriod === period &&
      (grade === ALL || p.grade === grade) &&
      (tier === 'premium' || term === ALL || p.term === term),
  )

  const gradeOptions = [ALL, ...snapshot.valueLists.grades]
  // The runtime terms value list can include 'Any Term' (used by Premium and some
  // resources); Essential filters to concrete terms only.
  const termOptions = [ALL, ...snapshot.valueLists.terms.filter((t) => (t as string) !== 'Any Term')]

  return (
    <>
      <PageHeader
        eyebrow="Bundles & access plans"
        title="Buy more, save more"
        lead="Bundles group a grade’s resources into one discounted, once-off purchase. Access plans unlock a single grade for a term or the full year — none of these renew automatically."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Packages" />
        </div>
      </PageHeader>

      <section className="section">
        <Container>
          <Tabs.Root defaultValue={defaultTab}>
            <Tabs.List className="relative mb-9 inline-flex gap-1 rounded-md border border-line bg-surface-alt p-1">
              <Tabs.Tab value="term" className={tabCls}>
                Term bundles
              </Tabs.Tab>
              <Tabs.Tab value="year" className={tabCls}>
                Full-year bundles
              </Tabs.Tab>
              <Tabs.Tab value="plans" className={tabCls}>
                Access plans
              </Tabs.Tab>
              <Tabs.Indicator className="absolute left-0 top-1 z-0 h-[calc(100%-0.5rem)] w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded bg-surface shadow-sm transition-all" />
            </Tabs.List>

            <Tabs.Panel value="term">
              <Grid products={termBundles} empty="No term bundles are published yet." />
            </Tabs.Panel>
            <Tabs.Panel value="year">
              <Grid products={yearBundles} empty="No full-year bundles are published yet." />
            </Tabs.Panel>
            <Tabs.Panel value="plans">
              <div className="mb-7 grid gap-4">
                <div className="inline-flex w-fit gap-1 rounded-md border border-line bg-surface-alt p-1">
                  {(['essential', 'premium'] as Tier[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={`rounded px-4 py-2 text-[0.92rem] font-medium capitalize transition ${
                        tier === t ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {t} access
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select label="Grade" value={grade} options={gradeOptions} onChange={setGrade} />
                  {tier === 'essential' ? (
                    <Select label="Term" value={term} options={termOptions} onChange={setTerm} />
                  ) : null}
                </div>
              </div>
              <Grid products={filteredPlans} empty="No access plans match these filters yet." />
            </Tabs.Panel>
          </Tabs.Root>
        </Container>
      </section>
    </>
  )
}
