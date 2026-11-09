import { useState } from 'react'
import { type CmsSnapshot } from '@designing-minds/cms'
import { SOCIAL_PROOF } from '../../content/site'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { ResourceStack } from '../ui/resource-stack'
import { Section } from '../ui/section'
import { StarRating } from '../ui/star-rating'

const GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7']

export function HomeHeroSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const [selectedGrade, setSelectedGrade] = useState('Grade 4')
  const grades = snapshot?.valueLists.grades.length ? snapshot.valueLists.grades : GRADES
  const grade = grades.includes(selectedGrade) ? selectedGrade : grades[0]
  const hasPublishedTestimonials = snapshot?.testimonials.some((testimonial) => testimonial.published) ?? false

  return (
    <Section id="home-intro" className="home-hero" spacing="none" containerClassName="home-hero__layout">
      <div className="home-hero__copy">
        <h1>Practice resources that build confidence at home</h1>
        <p className="mt-5 lead">
          Printable tests and summaries for <span className="whitespace-nowrap">Grades 3–7</span>. Aligned with CAPS, South Africa’s
          Curriculum and Assessment Policy Statement.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <Button to="/shop" variant="solid">
            Browse resources <Icon name="arrow" size={16} />
          </Button>
          {hasPublishedTestimonials ? (
            <a href="#parent-stories" className="inline-flex min-h-8 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-ink-soft">
              <StarRating value={SOCIAL_PROOF.rating} size="sm" />
              <span>{SOCIAL_PROOF.ratingClaim}</span>
            </a>
          ) : null}
        </div>
      </div>
      <div className="home-hero__showcase">
        <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Choose a grade">
          {grades.map((item) => (
            <button key={item} type="button" className="filter-chip" aria-pressed={item === grade} onClick={() => setSelectedGrade(item)}>
              {item}
            </button>
          ))}
        </div>
        <ResourceStack snapshot={snapshot} grade={grade} interactive priority layout="shelf" />
      </div>
    </Section>
  )
}
