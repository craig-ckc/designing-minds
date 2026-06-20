import { toParagraphs } from '@designing-minds/cms'

export function BodyCopy({ body, divided }: { body: string; divided?: boolean }) {
  const paragraphs = toParagraphs(body).filter((paragraph) => paragraph !== '-' && paragraph.length > 1)

  if (paragraphs.length === 0) {
    return <p className="text-muted">No additional content was extracted for this item yet.</p>
  }

  return (
    <div className={divided ? 'divide-y divide-line' : 'grid gap-4'}>
      {paragraphs.slice(0, 12).map((paragraph, index) => (
        <p key={index} className={`text-[1.02rem] ${divided ? 'py-4' : ''}`}>
          {paragraph}
        </p>
      ))}
    </div>
  )
}
