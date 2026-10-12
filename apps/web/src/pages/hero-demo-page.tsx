import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { CmsSnapshot } from '@designing-minds/cms'
import { SOCIAL_PROOF } from '../content/site'
import { HERO_STUDIES, heroExamples, heroStudyIndex, type HeroExample } from '../lib/hero-demo'
import { Button } from '../components/ui/button'
import { Icon } from '../components/ui/icon'
import { ProductCover } from '../components/ui/product-cover'
import { StarRating } from '../components/ui/star-rating'
import './hero-demo.css'

const DEFAULT_GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7']

function HeroBook({ example, index }: { example: HeroExample; index: number }) {
  return (
    <Link
      to={example.slug ? `/shop/${example.slug}` : `/shop?grade=${encodeURIComponent(example.cover.grade)}`}
      aria-label={`View ${example.cover.title}`}
      className="study-book"
      style={{ '--book-index': index, '--tilt': `${(index - 2) * 7}deg`, '--lift': `${Math.abs(index - 2) * 8}px` } as CSSProperties}
    >
      <ProductCover product={example.cover} priority />
    </Link>
  )
}

function BookScene({ examples }: { examples: HeroExample[] }) {
  return (
    <div className="study-scene">
      <div className="study-orbit" aria-hidden="true" />
      <span className="study-doodle study-doodle-one" aria-hidden="true"><Icon name="spark" size={38} /></span>
      <span className="study-doodle study-doodle-two" aria-hidden="true"><Icon name="smile" size={42} /></span>
      <span className="study-note study-note-one" aria-hidden="true">A little “aha!”</span>
      <span className="study-note study-note-two" aria-hidden="true">Made for curious minds</span>
      <div className="study-books" aria-label="Example learning resources">
        {examples.map((example, index) => <HeroBook key={example.slug ?? example.cover.title} example={example} index={index} />)}
      </div>
    </div>
  )
}

export default function HeroDemoPage({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const [params, setParams] = useSearchParams()
  // Keep rapid grade/design choices together before the router rerenders.
  const latestParams = useRef(params)
  useEffect(() => { latestParams.current = params }, [params])
  const [controlsVisible, setControlsVisible] = useState(true)
  const index = heroStudyIndex(params.get('option'))
  const study = HERO_STUDIES[index]
  const grades = snapshot?.valueLists.grades.length ? snapshot.valueLists.grades : DEFAULT_GRADES
  const grade = grades.includes(params.get('grade') ?? '') ? params.get('grade')! : grades[0]
  const examples = heroExamples(snapshot, grade)
  const selectOption = (next: number) => {
    const updated = new URLSearchParams(latestParams.current)
    updated.set('option', String((next + HERO_STUDIES.length) % HERO_STUDIES.length + 1))
    latestParams.current = updated
    setParams(updated, { replace: true, preventScrollReset: true })
  }
  const selectGrade = (next: string) => {
    const updated = new URLSearchParams(latestParams.current)
    updated.set('grade', next)
    latestParams.current = updated
    setParams(updated, { replace: true, preventScrollReset: true })
  }
  const gradeSelector = (
    <div className="study-grade-picker" role="group" aria-label="Choose a grade">
      <span className="study-grade-label">Find their grade</span>
      <div className="study-grade-buttons">
        {grades.map((item) => (
          <button type="button" key={item} aria-pressed={item === grade} onClick={() => selectGrade(item)}>{item}</button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="hero-demo-page">
      <section className={`hero-study hero-study--${study.id}`} aria-label={`${study.name} hero preview`}>
        {study.id === 'landscape' ? <img src="/images/hero-learning-landscape.avif" className="study-landscape" alt="" fetchPriority="high" /> : null}
        <div className="study-background" aria-hidden="true" />
        <div className="study-layout">
          <div className="study-copy">
            <p className="study-eyebrow"><Icon name="spark" size={16} /> Little minds. Endless possibilities.</p>
            <h1>{study.headline} <span>{study.accent}</span></h1>
            <p className="study-lead">{study.lead}</p>
            <div className="study-actions">
              <Button to={`/shop?grade=${encodeURIComponent(grade)}`} variant="solid">Explore {grade} <Icon name="arrow" size={18} /></Button>
              <Button to="/packages" variant="text">Find a bundle <Icon name="arrow" size={16} /></Button>
            </div>
            <div className="study-proof">
              <span className="study-proof-flower" aria-hidden="true"><Icon name="smile" size={22} /></span>
              <div><StarRating value={SOCIAL_PROOF.rating} size="sm" /><p>{SOCIAL_PROOF.ratingClaim}</p></div>
            </div>
          </div>
          {study.id === 'chapters' ? (
            <div className="study-chapters" role="group" aria-label="Choose a grade">
              {grades.map((item, position) => (
                <button key={item} type="button" className="study-chapter" aria-pressed={item === grade} onClick={() => selectGrade(item)} style={{ '--chapter-index': position } as CSSProperties}>
                  <span className="study-chapter-top"><span>{item}</span><Icon name="arrow" size={20} /></span>
                  <span className="study-chapter-cover"><ProductCover product={heroExamples(snapshot, item)[0].cover} priority /></span>
                  <span className="study-chapter-label">Let’s explore</span>
                </button>
              ))}
            </div>
          ) : <BookScene examples={examples} />}
          {study.id !== 'chapters' ? gradeSelector : null}
          <p className="study-caption"><Icon name="check" size={15} /> CAPS-aligned <span>·</span> Ready to print <span>·</span> Made by a teacher</p>
        </div>
      </section>

      <div className="study-follow-on">
        <span>Good practice, made simple.</span>
        <span><Icon name="doc" size={20} /> Tests & assessments</span>
        <span><Icon name="book" size={20} /> Clear summaries</span>
        <span><Icon name="smile" size={20} /> Little confidence boosts</span>
      </div>

      {controlsVisible ? (
        <nav className="hero-demo-controls" aria-label="Hero design options">
          <div className="hero-demo-control-title"><strong>Hero playground</strong><span>8 directions · Preview only</span></div>
          <div className="hero-demo-choice">
            <label htmlFor="hero-demo-option" className="sr-only">Choose a hero design</label>
            <select id="hero-demo-option" value={index} onChange={(event) => selectOption(Number(event.target.value))}>
              {HERO_STUDIES.map((option, position) => <option key={option.id} value={position}>{String(position + 1).padStart(2, '0')} · {option.name}</option>)}
            </select>
            <p>{study.note}</p>
          </div>
          <div className="hero-demo-step-controls">
            <button type="button" aria-label="Previous hero design" onClick={() => selectOption(index - 1)}><Icon name="arrow" size={18} className="rotate-180" /></button>
            <span aria-live="polite">{index + 1} / {HERO_STUDIES.length}</span>
            <button type="button" aria-label="Next hero design" onClick={() => selectOption(index + 1)}><Icon name="arrow" size={18} /></button>
          </div>
          <button type="button" className="hero-demo-hide" aria-label="Hide design controls" onClick={() => setControlsVisible(false)}><span>Hide controls</span><Icon name="close" size={16} /></button>
        </nav>
      ) : <button type="button" className="hero-demo-show" onClick={() => setControlsVisible(true)}>Show design controls</button>}
    </div>
  )
}
