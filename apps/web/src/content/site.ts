/* Static content sourced from the extracted designingminds.co.za research. */

export const PROOF_POINTS = ['Teacher-led', 'CAPS aligned', 'Grades 3–7', 'Printable PDFs', 'Instant download']

export interface Plan {
  name: string
  price: string
  cadence: string
  featured: boolean
  cta: string
  features: string[]
}

export const PLANS: Plan[] = [
  {
    name: 'Essential Access',
    price: 'R350',
    cadence: 'per term',
    featured: false,
    cta: 'Buy Term Access',
    features: [
      'Includes 2 CAPS-aligned tests per subject',
      'Covers all core subjects for your selected grade',
      'Memo included with every test',
      'Ideal for short-term use or new learners',
    ],
  },
  {
    name: 'Premium Access',
    price: 'R1,200',
    cadence: 'per year',
    featured: true,
    cta: 'Purchase Full Access',
    features: [
      'Access every subject and every term',
      'Automatic delivery each term via email',
      'Priority updates and new test releases',
      'One simple subscription, no reordering needed',
    ],
  },
]

export const WHY_FEATURES = [
  {
    title: 'CAPS-Aligned Curriculum',
    body: 'All tests are aligned to the latest CAPS Annual Teaching Plan for each grade.',
  },
  {
    title: 'Memorandums Included',
    body: 'Every test includes a clear, easy-to-use memorandum for stress-free marking.',
  },
  {
    title: 'Instant Download & Access',
    body: 'Get immediate access after purchase. Download once and print anytime.',
  },
  {
    title: 'Builds Exam Confidence',
    body: 'Structured practice helps learners feel prepared and confident in assessments.',
  },
]

export const TESTIMONIALS = [
  {
    name: 'Amoré',
    meta: 'Parent · 7 days ago',
    quote: 'My son’s Afrikaans mark improved from 42% to 84%! Thank you.',
  },
  {
    name: 'Lizaan',
    meta: 'Parent · Afrikaans HL',
    quote: 'Ek het verlede kwartaal al julle goedjies gekoop … dit maak dit soveel makliker.',
  },
]

export const FAQS = [
  {
    q: 'What grades are your tests available for?',
    a: 'We currently offer printable CAPS-aligned tests for Grades 3 to 7, covering all major subjects. Each term, new tests are released so your child can keep practicing with up-to-date material.',
  },
  {
    q: 'Are your tests aligned with the South African CAPS curriculum?',
    a: 'Yes, every single test is 100% CAPS-aligned and created by qualified teachers. They follow the same structure, layout, and expectations your child will encounter in the classroom.',
  },
  {
    q: 'How do I receive the tests after purchase?',
    a: 'Once your payment is complete, your tests are instantly available for download in PDF format. You’ll also receive a confirmation email with download links so you can access them anytime.',
  },
  {
    q: 'What’s the difference between Term Access and the Annual Subscription?',
    a: 'Term Access (Essential) is paid once per term (R350) for your selected grade and term only. The Annual Subscription (Premium) is one yearly payment (R1,200) for all grades, all subjects, and all terms — automatically delivered each term, with over R200 in savings.',
  },
  {
    q: 'Can I use the same tests for more than one child?',
    a: 'Yes — once you’ve purchased the tests, you’re free to print and reuse them within your household. If you’re a teacher or tutor, please contact us for multi-user or classroom licensing.',
  },
  {
    q: 'Can I print the tests from my phone or tablet?',
    a: 'Yes — all tests are PDF files, so you can download and print them from any device with a printer connection.',
  },
]

export const CONTACT = {
  phone: '+27 84 605 5217',
  email: 'designingminds123@gmail.com',
  location: 'Port Elizabeth, South Africa',
}

export const GRADE_BLURB: Record<string, string> = {
  'Grade 3': 'Foundation-phase practice that builds early confidence.',
  'Grade 4': 'Intermediate-phase tests across all core subjects.',
  'Grade 5': 'Term-by-term assessments aligned to the CAPS plan.',
  'Grade 6': 'Exam-style practice to prepare for senior phase.',
  'Grade 7': 'Senior-phase tests and full-year bundles.',
}
