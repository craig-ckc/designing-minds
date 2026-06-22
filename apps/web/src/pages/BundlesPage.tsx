import { useMemo } from 'react'
import { Tabs } from '@base-ui/react/tabs'
import { type CmsSnapshot, type Product, accessPlanProducts, bundleProducts } from '@designing-minds/cms'
import { Container } from '../components/ui/Container'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { PageHeader } from '../components/ui/Headings'
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

const tabCls =
  'relative z-10 px-4 py-2.5 text-[0.95rem] font-medium text-muted data-[selected]:text-ink'

export function BundlesPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const bundles = useMemo(() => bundleProducts(snapshot), [snapshot])
  const termBundles = bundles.filter((b) => b.bundleScope === 'Term')
  const yearBundles = bundles.filter((b) => b.bundleScope === 'Full Year')
  const plans = useMemo(() => accessPlanProducts(snapshot), [snapshot])

  return (
    <>
      <PageHeader
        eyebrow="Bundles & access plans"
        title="Buy more, save more"
        lead="Bundles group a grade’s resources into one discounted, once-off purchase. Access plans unlock a term or year — none of these renew automatically."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Bundles" />
        </div>
      </PageHeader>

      <section className="section">
        <Container>
          <Tabs.Root defaultValue="term">
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
              <Grid products={plans} empty="No access plans are published yet." />
            </Tabs.Panel>
          </Tabs.Root>
        </Container>
      </section>
    </>
  )
}
