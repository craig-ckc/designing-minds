import { publishedProducts, type CmsSnapshot } from '@designing-minds/cms'
import type { CoverItem } from '../components/ui/product-cover'

export const HERO_STUDIES = [
  { id: 'parade', name: 'The book parade', note: 'An open, centred headline with a generous fan of books.', headline: 'Little steps.', accent: 'Big confidence.', lead: 'Make after-school practice a little brighter with teacher-made tests and summaries for Grades 3–7.' },
  { id: 'landscape', name: 'A world of learning', note: 'A storybook landscape, with real resources in the foreground.', headline: 'Let curiosity', accent: 'lead the way.', lead: 'A little practice. A new discovery. CAPS-aligned resources to help your child grow, one page at a time.' },
  { id: 'bright', name: 'Bright beginnings', note: 'A clear split layout with colourful resource windows.', headline: 'Make room for', accent: '“I can do it!”', lead: 'Turn tricky topics into small wins with printable tests, summaries and practice for Grades 3–7.' },
  { id: 'shelf', name: 'The learning shelf', note: 'A quieter editorial direction: words and books side by side.', headline: 'Their next little', accent: 'breakthrough.', lead: 'Thoughtfully made learning resources for curious minds. Find the right practice for your child’s next chapter.' },
  { id: 'sunshine', name: 'Sunny-side learning', note: 'Books first, with a warm sunburst and a friendly message.', headline: 'A little practice.', accent: 'A brighter day.', lead: 'Keep learning light with ready-to-print resources that make practice feel possible.' },
  { id: 'notebook', name: 'The practice notebook', note: 'Paper texture, playful pencil marks and a resource collage.', headline: 'Big ideas start', accent: 'on a little page.', lead: 'From “how?” to “aha!” — give your child the tools to practise, discover and build confidence at home.' },
  { id: 'chapters', name: 'Choose your chapter', note: 'Grade selection becomes the colourful centrepiece.', headline: 'Every grade.', accent: 'A new adventure.', lead: 'Start where your child is. Explore teacher-made, CAPS-aligned tests and summaries for their grade.' },
  { id: 'wonder', name: 'After-school wonder', note: 'A deep-blue evening sky with bright, floating book covers.', headline: 'Small moments.', accent: 'Wonderful minds.', lead: 'Make a little space for learning with printable resources that turn practice into progress.' },
] as const

export function heroStudyIndex(value: string | null): number {
  const option = Number(value)
  return Number.isInteger(option) && option >= 1 && option <= HERO_STUDIES.length ? option - 1 : 0
}

export interface HeroExample { cover: CoverItem; slug?: string }

/** Prefer different subjects, so the hero shows the breadth of actual resources. */
export function heroExamples(snapshot: CmsSnapshot | null, grade: string): HeroExample[] {
  const matches = snapshot ? publishedProducts(snapshot).filter((product) => product.grade === grade) : []
  const unique = matches.filter((product, index) => matches.findIndex((other) => other.subjects[0] === product.subjects[0]) === index)
  const varied = unique.map((product, index) => matches.find((other) => other.subjects[0] === product.subjects[0] && other.term === `Term ${index % 4 + 1}`) ?? product)
  const chosen = [...varied, ...matches.filter((product) => !varied.includes(product))].slice(0, 5)
  if (chosen.length) return chosen.map((product) => ({ cover: product, slug: product.slug }))
  // Representative cover examples keep the design preview useful before CMS
  // data loads. These link to the grade catalogue, never invented products.
  return ['Mathematics', 'English Home Language', 'Natural Science', 'Afrikaans First Additional Language', 'Life Skills'].map((subject, index) => ({
    cover: { title: `${grade} ${subject} Practice`, grade, term: `Term ${index % 4 + 1}`, subjects: [subject] },
  }))
}
