import { useParams } from 'react-router-dom'
import { getPageBySlug, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { BodyCopy } from '../components/ui/BodyCopy'
import { NotFoundPage } from './NotFoundPage'

export function CmsPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { slug } = useParams()
  const page = slug ? getPageBySlug(snapshot, slug) : undefined

  if (!page) {
    return <NotFoundPage />
  }

  return (
    <section className="section">
      <Container>
        <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current={page.title} />
        <div className="mb-9 max-w-[640px]">
          <Eyebrow>Page</Eyebrow>
          <h1>{page.title}</h1>
          {page.summary ? <p className="mt-4 lead">{page.summary}</p> : null}
        </div>
        <div className="grid max-w-[70ch] gap-4 text-ink-soft">
          <BodyCopy body={page.body} />
        </div>
      </Container>
    </section>
  )
}
