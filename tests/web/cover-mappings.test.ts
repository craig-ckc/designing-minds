import assert from 'node:assert/strict'
import test from 'node:test'
import { subjectIllustration, termColorway } from '../../apps/web/src/lib/cover-mappings.ts'

test('each seeded term has its own cover colourway', () => {
  const terms = ['Any Term', 'Term 1', 'Term 2', 'Term 3', 'Term 4']
  const bands = terms.map((term) => termColorway(term).band)
  assert.equal(new Set(bands).size, terms.length)
})

test('an unknown term safely uses the Any Term colourway', () => {
  assert.deepEqual(termColorway('Future term'), termColorway('Any Term'))
})

test('every seeded subject has an intentional illustration mapping', () => {
  const expected = {
    'Afrikaans First Additional Language': 'subjects/afrikaans.avif',
    'Economic Management Sciences (EMS)': 'subjects/economic.avif',
    'English First Additional Language': 'subjects/english.avif',
    'English Home Language': 'subjects/english.avif',
    Geography: 'subjects/geography.avif',
    History: 'subjects/history.avif',
    'Life Orientation': 'subjects/life-science.avif',
    'Life Skills': 'subjects/life-science.avif',
    'Life Skills (PSW)': 'subjects/life-science.avif',
    Mathematics: 'subjects/mathematics.avif',
    'Natural Science': 'subjects/science.avif',
    'Natural Science and Technology': 'subjects/science.avif',
    Technology: 'subjects/technology.avif',
  } as const

  for (const [subject, illustration] of Object.entries(expected)) {
    assert.equal(subjectIllustration(subject), illustration, subject)
  }
})

test('future subjects use text classification and then the general fallback', () => {
  assert.equal(subjectIllustration('Creative Arts'), 'covers/arts.svg')
  assert.equal(subjectIllustration('New Elective'), 'covers/general.svg')
})
