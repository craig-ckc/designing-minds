// import { useRef } from 'react'
import { type CmsSnapshot } from '@designing-minds/cms'
import { GradeCard } from '../ui/grade-card'
// import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import fallbackGrades from '../../content/home/fallback-grades.json'
import { productsForGrade } from '../../lib/products';

export function GradeFinderSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = snapshot?.valueLists.grades ?? fallbackGrades
  // const scroller = useRef<HTMLDivElement>(null)

  // const scrollByCard = (dir: number) => {
  //   const el = scroller.current
  //   if (!el) return
  //   const card = el.querySelector<HTMLElement>('[data-card]')
  //   const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8
  //   el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  // }

  return (
    <Section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 lg:mb-10">
        <div className="max-w-xl">
          <h2 className="max-w-[14ch]">A resource set for every grade</h2>
          <p className="lead mt-4 max-w-[46ch]">
            CAPS-aligned tests, memos and summaries for Grades 3 to 7 — pick your child’s grade to start.
          </p>
        </div>
        {/* <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous grades"
            onClick={() => scrollByCard(-1)}
            className="grid h-11 w-11 place-items-center rounded-pill border border-line-strong text-ink transition-colors hover:border-primary hover:text-primary"
          >
            <span className="h-[18px] w-[18px] rotate-180">
              <Icon name="arrow" />
            </span>
          </button>
          <button
            type="button"
            aria-label="Next grades"
            onClick={() => scrollByCard(1)}
            className="grid h-11 w-11 place-items-center rounded-pill border border-line-strong text-ink transition-colors hover:border-primary hover:text-primary"
          >
            <span className="h-[18px] w-[18px]">
              <Icon name="arrow" />
            </span>
          </button>
        </div> */}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {grades.map((grade) => (
          <GradeCard key={grade} grade={grade} count={snapshot ? productsForGrade(snapshot, grade).length : 0} />
        ))}
      </div>

      {/* <div ref={scroller} className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 scroll-pl-5 [--edge:1.25rem] [mask-image:linear-gradient(to_right,transparent,#000_var(--edge),#000_calc(100%-var(--edge)),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,#000_var(--edge),#000_calc(100%-var(--edge)),transparent)] [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-8 sm:px-8 sm:scroll-pl-8 sm:[--edge:2rem] lg:-mx-12 lg:px-12 lg:scroll-pl-12 lg:[--edge:3rem] [&::-webkit-scrollbar]:hidden" >
        {grades.map((grade) => (
          <GradeCard
            key={grade}
            grade={grade}
            className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
          />
        ))}
      </div> */}
    </Section>
  )
}
