/* -------------------------------------------------------------------------
   Markdown renderer for CMS rich text (product full descriptions).

   The admin's rich text editor stores Markdown; this renders it back into
   real elements — Headings, dividers, lists, quotes, bold/italic/links.
   It builds React elements directly (never raw HTML), so CMS content cannot
   inject markup, and it needs no dependencies.
   ------------------------------------------------------------------------- */

import { Fragment, type ReactNode } from 'react'

/* ------------------------------- Inline -------------------------------- */

const INLINE =
  /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(_[^_\s][^_]*_)|(\[[^\]]+\]\((?:https?:\/\/|\/|#)[^)\s]*\))/

/** Remove markdown backslash-escapes (`\*` → `*`) from plain text runs. */
const unescape = (text: string) => text.replace(/\\([\\`*_{}[\]()#+\-.!>])/g, '$1')

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = []
  let rest = text
  let key = 0

  while (rest.length > 0) {
    const match = INLINE.exec(rest)
    if (!match || match.index === undefined) {
      parts.push(unescape(rest))
      break
    }
    if (match.index > 0) parts.push(unescape(rest.slice(0, match.index)))
    const token = match[0]
    key += 1

    if (token.startsWith('`')) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('**')) {
      parts.push(<strong key={key}>{renderInline(token.slice(2, -2))}</strong>)
    } else if (token.startsWith('*') || token.startsWith('_')) {
      parts.push(<em key={key}>{renderInline(token.slice(1, -1))}</em>)
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]*)\)$/.exec(token)
      if (link) {
        parts.push(
          <a key={key} href={link[2]} className="underline underline-offset-4" target="_blank" rel="noreferrer">
            {renderInline(link[1])}
          </a>,
        )
      } else {
        parts.push(unescape(token))
      }
    }
    rest = rest.slice(match.index + token.length)
  }

  return <>{parts}</>
}

/* -------------------------------- Blocks ------------------------------- */

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: 'hr' }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'paragraph'; lines: string[] }

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = []
  const lines = source.replace(/\r\n/g, '\n').split('\n')

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '') continue

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6, text: heading[2] })
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ kind: 'hr' })
      continue
    }

    if (/^[-*+]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const ordered = /^\d+[.)]\s+/.test(trimmed)
      const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/
      const items: string[] = []
      while (i < lines.length && pattern.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(pattern, ''))
        i += 1
      }
      i -= 1
      blocks.push({ kind: 'list', ordered, items })
      continue
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i += 1
      }
      i -= 1
      blocks.push({ kind: 'quote', lines: quote })
      continue
    }

    const paragraph: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|-{3,}$|\*{3,}$)/.test(lines[i].trim())) {
      paragraph.push(lines[i].trim())
      i += 1
    }
    i -= 1
    blocks.push({ kind: 'paragraph', lines: paragraph })
  }

  return blocks
}

/* ------------------------------ Component ------------------------------ */

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseBlocks(source)
  if (blocks.length === 0) return null

  return (
    <div className={`rich-text ${className ?? ''}`.trim()}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading': {
            const Tag = `h${block.level}` as const
            return <Tag key={index}>{renderInline(block.text)}</Tag>
          }
          case 'hr':
            return <hr key={index} />
          case 'list': {
            const items = block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)
            return block.ordered ? <ol key={index}>{items}</ol> : <ul key={index}>{items}</ul>
          }
          case 'quote':
            return (
              <blockquote key={index}>
                {block.lines.map((line, lineIndex) => (
                  <Fragment key={lineIndex}>
                    {lineIndex > 0 ? <br /> : null}
                    {renderInline(line)}
                  </Fragment>
                ))}
              </blockquote>
            )
          case 'paragraph':
            return (
              <p key={index}>
                {block.lines.map((line, lineIndex) => (
                  <Fragment key={lineIndex}>
                    {lineIndex > 0 ? ' ' : null}
                    {renderInline(line)}
                  </Fragment>
                ))}
              </p>
            )
        }
      })}
    </div>
  )
}
