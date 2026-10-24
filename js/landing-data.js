/* Content for the Happy Hill home page.
   Everything on the page is read from this file, so updating the site means editing text here.

   Items marked  sample: true  are placeholders (they show a small tag while SHOW_SAMPLE_TAGS is on).
   Replace them with real entries, then set SHOW_SAMPLE_TAGS to false.

   Photos: put image files in  assets/photos/  and set  image: 'assets/photos/name.jpg'  on an item.
   Without an image the card shows a coloured illustration instead.
   Please publish only photographs taken with consent, and never show residents' names or identifiable faces. */
window.HH_SITE = {
  SHOW_SAMPLE_TAGS: true,

  contact: {
    org: 'DCIP Kozhikode',
    line: 'District Collector\u2019s Internship Programme',
    address: ['Nammude Kozhikode Mission Room, Room No. 4035, Civil Station', 'Kozhikode, Kerala 673020'],
    phone: '0495 2370200',
    email: 'dcipclt@gmail.com'
  },

  stats: [
    { n: '8', l: 'Government welfare homes' },
    { n: '7', l: 'Partner colleges' },
    { n: '2', l: 'Departments: SJD and WCD' },
    { n: '1', l: 'Shared tracker' }
  ],

  /* ---------- the challenge ---------- */
  challenge: {
    principle: 'From institutional care to social inclusion: restoring dignity, identity and participation.',
    problemTitle: 'Social isolation',
    problem: 'Residents of welfare homes are often cut off from learning, community life and the rights they are entitled to.',
    gaps: [
      'Little access to learning and creative activity',
      'Inadequate mental health and psychosocial support',
      'Weak civic identity and community participation',
      'No basic documents such as Aadhaar and Voter ID'
    ],
    causes: [
      'Neglect, abandonment and stigma',
      'Limited resources and capacity in the homes',
      'Gaps in coordination between agencies',
      'Few sustained chances to take part in the community'
    ],
    goal: 'Promote social inclusion, dignity and holistic development of residents through a rights-based approach to social security.'
  },

  /* ---------- the approach ---------- */
  steps: [
    { title: 'The need', text: 'Residents need care, development and protection.' },
    { title: 'The response', text: 'Students\u2019 energy turned into empathy and service.' },
    { title: 'The partnership', text: 'An annual MoU pairs each home with a college.' },
    { title: 'The impact', text: 'Pooled resources deliver an integrated model of care.' }
  ],
  mou: {
    purpose: 'Every welfare home is paired with a partner college through an annual MoU, so residents get comprehensive care and development.'
  },
  components: [
    { icon: 'learn', title: 'Education', text: 'Literacy, tutoring, digital and life skills.' },
    { icon: 'docs', title: 'Identity and rights', text: 'Aadhaar, Voter ID and awareness of entitlements.' },
    { icon: 'craft', title: 'Creative stimulation', text: 'Arts, crafts, culture and sports.' },
    { icon: 'meet', title: 'Community', text: 'Regular time with students and volunteers.' },
    { icon: 'mind', title: 'Well-being', text: 'Counselling, peer support and recreation.' },
    { icon: 'experts', title: 'Skills and livelihood', text: 'Vocational training and market links.' }
  ],

  /* ---------- the homes (names as in the DCIP presentation) ----------
     "who" says whom each home is for. Please check these descriptions. */
  homes: {
    intro: 'Eight government homes run by the Social Justice and Women and Child Development departments, each paired with a partner college.',
    list: [
      { name: 'Children’s Home for Boys', who: 'Boys needing care and protection.', college: 'JDT Islam College', image: 'assets/photos/home-green.jpg' },
      { name: 'Children’s Home for Girls', who: 'Girls needing care and protection.', college: 'Providence College', image: 'assets/photos/home-plain.jpg' },
      { name: 'Home for Mentally Deficient Children', who: 'Children with intellectual disabilities.', college: 'Farook Training College', image: 'assets/photos/home-orange.jpg' },
      { name: 'Government Home for the Elderly', who: 'Older people needing shelter and care.', college: 'Malabar Christian College', image: 'assets/photos/home-elderly.jpg' },
      { name: 'Asha Bhavan for Men', who: 'Men recovering from mental illness.', college: 'IHRD Kozhikode', image: 'assets/photos/home-asha-male.jpg' },
      { name: 'Asha Bhavan for Women', who: 'Women recovering from mental illness.', college: 'Devagiri College', image: 'assets/photos/home-asha-women.jpg' },
      { name: 'Mahila Mandiram', who: 'Women needing shelter and support.', college: 'Holy Cross College', image: 'assets/photos/home-mahila.jpg' },
      { name: 'After Care Home for Girls', who: 'Young women moving to independent life.', college: 'Holy Cross College', image: 'assets/photos/home-asha-long.jpg' }
    ]
  },

  /* ---------- looking ahead ---------- */
  ahead: [
    { kicker: 'Identity', title: 'Aadhaar and UDID', text: 'Camps and follow-up so every resident has legal identity.', image: 'assets/photos/aadhaar-camp-2.jpg', pos: '50% 45%' },
    { kicker: 'Livelihood', title: 'Asha Craft', text: 'A kiosk, brand and Instagram page for residents’ handmade products.', image: 'assets/photos/craft-dolls.jpg', link: { href: 'https://www.instagram.com/asha.craftedwithhope/', label: '@asha.craftedwithhope' } },
    { kicker: 'Recreation', title: 'Lensfed Park', text: 'A safe, accessible park through CSR support.', image: 'assets/photos/park-vision.jpg', pos: '50% 50%' },
    { kicker: 'Learning', title: 'DREAMS sessions', text: 'Age-appropriate sessions, with visits to NIT, the Planetarium and the Employment Exchange.', logo: 'assets/logos/dreams.png' }
  ],

  /* ---------- institutions and partners ---------- */
  institutions: [
    { name: 'Social Justice Department', role: 'Runs welfare homes', mark: 'SJD', logo: 'assets/logos/sjd.png' },
    { name: 'Department of Women and Child Development', role: 'Runs welfare homes', mark: 'WCD', logo: 'assets/logos/wcd.png' },
    { name: 'DCIP Kozhikode', role: 'Programme lead and coordination', mark: 'DCIP', logo: 'assets/dcip-logo.png' },
    { name: 'District Administration, Kozhikode', mark: 'DA', logo: 'assets/district-logo.png' }
  ],
  mouCycle: [
    { n: '1', title: 'Action plans', text: 'Each college shares its yearly plan.' },
    { n: '2', title: 'Review and renewal', text: 'Work is reviewed and the MoU renewed.' },
    { n: '3', title: 'Monthly meetings', text: '10th of every month, 3 to 4 PM.' },
    { n: '4', title: 'Plans revised', text: 'Updated as interventions progress.' }
  ],

  // One entry per partner college. Photos are from the award ceremony; homes follow the DCIP presentation.
  colleges: [
    { name: 'IHRD College of Applied Science', homes: ['Asha Bhavan for Men'], image: 'assets/photos/mou-ihrd.jpg', pos: '50% 42%' },
    { name: 'St. Joseph’s College (Autonomous), Devagiri', homes: ['Asha Bhavan for Women'], image: 'assets/photos/mou-stjoseph.jpg', pos: '50% 42%' },
    { name: 'Providence Women’s College (Autonomous)', homes: ['Children’s Home for Girls'], image: 'assets/photos/mou-providence.jpg', pos: '50% 40%' },
    { name: 'Holy Cross Institute of Management and Technology', homes: ['Mahila Mandiram', 'After Care Home for Girls'], image: 'assets/photos/mou-holycross.jpg', pos: '50% 45%' },
    { name: 'Malabar Christian College', homes: ['Government Home for the Elderly'], image: 'assets/photos/mou-malabar.jpg', pos: '50% 42%' },
    { name: 'JDT Islam College of Arts and Science', homes: ['Children’s Home for Boys'], image: 'assets/photos/mou-sixth.jpg', pos: '50% 42%' },
    { name: 'Farook Training College', homes: ['Home for Mentally Deficient Children'], art: 'learn' }
  ],

  // Use  date: '2026-11-05'  for a dated card, or  label: 'text'  to show words instead of a date.
  activities: [
    { image: 'assets/photos/dreams-stage.jpg', pos: '50% 58%', title: 'DREAMS launch', text: 'Partners and the District team come together.', tag: 'Launch', date: '2026-02-03' },
    { image: 'assets/photos/tree-planting-2.jpg', pos: '50% 45%', title: 'Tree planting with SBI', text: 'Officials and SBI colleagues plant saplings.', tag: 'Community' },
    { image: 'assets/photos/partner-group-2.jpg', pos: '50% 62%', title: 'Partner colleges meet the District team', text: 'Coordinators with their Happy Hill folders.', tag: 'Partnership' },
    { image: 'assets/photos/mou-holycross.jpg', pos: '50% 45%', title: 'Partner colleges honoured', text: 'Awards presented by Dr. R. Bindu, then Minister for Higher Education and Social Justice.', tag: 'Awards' },
    { image: 'assets/photos/group-collectorate.jpg', pos: '50% 72%', title: 'Together at the Collectorate', text: 'Students, coordinators and officials.', tag: 'Gathering' },
    { image: 'assets/photos/dreams-lamp.jpg', pos: '50% 55%', title: 'Lighting the lamp', text: 'Opening the DREAMS launch.', tag: 'Launch', date: '2026-02-03' },
    { image: 'assets/photos/library-girls-home.jpg', pos: '60% 40%', title: 'Library set up at the Girls’ Home', text: 'A new reading corner, opened with the Happy Hill team.', tag: 'Library' },
    { image: 'assets/photos/aadhaar-camp-2.jpg', pos: '50% 45%', title: 'Aadhaar enrolment camp', text: 'On-site enrolment so residents get legal identity.', tag: 'Identity' }
  ],

  // Photographs shown in the "In pictures" slideshow. Only photos taken with consent; no residents' faces.
  gallery: [
    { image: 'assets/photos/dreams-stage.jpg', alt: 'The stage at the DREAMS launch' },
    { image: 'assets/photos/tree-planting-1.jpg', alt: 'Officials planting a sapling' },
    { image: 'assets/photos/partner-group-1.jpg', alt: 'Partner college coordinators with District officials' },
    { image: 'assets/photos/dreams-speech.jpg', alt: 'A speaker addressing the DREAMS launch' },
    { image: 'assets/photos/audience.jpg', alt: 'Students and coordinators at a Happy Hill gathering' },
    { image: 'assets/photos/mou-ihrd.jpg', alt: 'A partner college receiving its award' },
    { image: 'assets/photos/tree-planting-2.jpg', alt: 'Tree planting under the Happy Hill banner' },
    { image: 'assets/photos/group-collectorate.jpg', alt: 'A group photograph at the Collectorate' },
    { image: 'assets/photos/mou-malabar.jpg', alt: 'A partner college honoured at the award ceremony' },
    { image: 'assets/photos/aadhaar-camp-2.jpg', alt: 'An Aadhaar enrolment camp at a welfare home' },
    { image: 'assets/photos/library-girls-home.jpg', alt: 'Opening the library at the Girls’ Home' },
    { image: 'assets/photos/aadhaar-camp-1.jpg', alt: 'Staff helping with Aadhaar enrolment' }
  ],

  // Reports and documents. While this list is empty the whole section is hidden from the page.
  // To publish one, add an entry such as:
  //   { title: 'Quarterly progress report', kind: 'Report', text: 'One line about it.', file: 'assets/reports/q1.pdf' }
  reports: [],

  // inDays is for samples. For real events use  date: '2026-12-04'  instead.
  events: [
    { art: 'culture', title: 'Cultural evening at the welfare home', where: 'Welfare home 1', college: 'Partner college 1', inDays: 6, sample: true },
    { art: 'health', title: 'Health awareness camp', where: 'Welfare home 3', college: 'Partner college 3', inDays: 13, sample: true },
    { art: 'meet', title: 'Quarterly review meeting', where: 'Nammude Kozhikode Mission Room, Civil Station', college: 'All partner colleges', inDays: 21, sample: true }
  ]
};
