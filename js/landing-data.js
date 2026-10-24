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
    line: 'District Collector’s Internship Programme',
    address: ['DCIP office, Mission Room, 2nd Floor, Block C', 'Civil Station, Kozhikode, Kerala 673020'],
    phone: '0495 2370200',
    email: 'projectcellclt@gmail.com'
  },

  stats: [
    { n: '8', l: 'Government welfare homes in the programme' },
    { n: '7', l: 'Partner colleges, each under an annual MoU' },
    { n: '2', l: 'Departments working together: SJD and WCD' },
    { n: '1', l: 'Shared tracker for plans, follow-up and reports' }
  ],

  /* ---------- the challenge ---------- */
  challenge: {
    principle: 'From institutional care to social inclusion: restoring dignity, identity, opportunities and participation through the collective support of welfare institutions.',
    problemTitle: 'Social isolation',
    problem: 'Residents of welfare homes experience social isolation. It limits their chances of personal development, of taking part in society, and of wellbeing. It goes beyond physical care and affects their access to essential rights, services and opportunities.',
    gaps: [
      'Limited access to extracurricular exposure and lifelong learning',
      'Little creative and recreational stimulation for self-expression and skill development',
      'Inadequate mental health and psychosocial support',
      'Weak civic identity and participation in community life',
      'No basic identity documents such as Aadhaar and Voter ID, which restricts access to rights, entitlements and services'
    ],
    causes: [
      'Historical neglect, abandonment and the stigma faced by people in institutions',
      'Limited resources and institutional capacity to meet whole-person needs',
      'Gaps in coordination between welfare institutions and the agencies that serve them',
      'Few sustained chances for social integration and community engagement',
      'Systemic barriers to documentation, mental health services and civic participation'
    ],
    goal: 'Promote social inclusion, dignity and holistic development of residents by advancing a rights-based approach to social security programmes and services.'
  },

  /* ---------- the approach ---------- */
  steps: [
    { title: 'The need', text: 'Residents of welfare homes need comprehensive care, development and protection.' },
    { title: 'The response', text: 'Happy Hill channels students’ youthful energy into empathy, compassion and social responsibility.' },
    { title: 'The partnership', text: 'An MoU with reputed educational institutions in Kozhikode formalises the collaboration.' },
    { title: 'The impact', text: 'Converged resources and manpower deliver an integrated model of care.' }
  ],
  mou: {
    purpose: 'To ensure comprehensive care and development for residents of welfare homes under the Social Justice Department, through cooperation between the department and educational institutions.',
    resources: 'Convergence of financial, technical and human resources, together with existing services, infrastructure and manpower across all related sectors. Partner colleges, expert institutions and DCIP’s access to the District Administration all play a part.'
  },
  components: [
    { icon: 'learn', title: 'Educational inclusion', text: 'Literacy support, tutoring, digital learning and life-skills education.' },
    { icon: 'docs', title: 'Civic identity and rights', text: 'Help to get Aadhaar, Voter ID and other essential documents, and awareness of rights and entitlements.' },
    { icon: 'craft', title: 'Creative stimulation', text: 'Arts, crafts, cultural activities, sports and talent development.' },
    { icon: 'meet', title: 'Community integration', text: 'Regular time with students, volunteers and community members to reduce isolation and stigma.' },
    { icon: 'mind', title: 'Mental health and well-being', text: 'Counselling, peer engagement, recreation and psychosocial care.' },
    { icon: 'experts', title: 'Skills and livelihood', text: 'Vocational training, entrepreneurship and market links for products made by residents.' }
  ],

  /* ---------- the homes (names as in the DCIP presentation) ----------
     "who" says whom each home is for. Please check these descriptions. */
  homes: {
    intro: 'Eight government welfare homes in Kozhikode are part of Happy Hill. They are run by the Social Justice Department and the Department of Women and Child Development, and each one is paired with a partner college.',
    list: [
      { name: 'Children’s Home for Boys', who: 'For boys who need care and protection.', college: 'JDT Islam College', image: 'assets/photos/home-green.jpg' },
      { name: 'Children’s Home for Girls', who: 'For girls who need care and protection.', college: 'Providence College', image: 'assets/photos/home-plain.jpg' },
      { name: 'Home for Mentally Deficient Children', who: 'For children with intellectual disabilities, who need ongoing care and support.', college: 'Farook Training College', image: 'assets/photos/home-orange.jpg' },
      { name: 'Government Home for the Elderly', who: 'For older people who need shelter and care in their later years.', college: 'Malabar Christian College', image: 'assets/photos/home-elderly.jpg' },
      { name: 'Asha Bhavan for Men', who: 'A rehabilitation centre for men recovering from mental illness.', college: 'IHRD Kozhikode', image: 'assets/photos/home-asha-male.jpg' },
      { name: 'Asha Bhavan for Women', who: 'A psychosocial rehabilitation centre for women recovering from mental illness, focused on their return to community life.', college: 'Devagiri College', art: 'mind' },
      { name: 'Mahila Mandiram', who: 'A home for women who need shelter and support.', college: 'Holy Cross College', image: 'assets/photos/home-mahila.jpg' },
      { name: 'After Care Home for Girls', who: 'For young women who grew up in child care homes, as they move towards independent adult life.', college: 'Holy Cross College', image: 'assets/photos/home-asha-long.jpg' }
    ]
  },

  milestones: [
    { status: 'done', title: 'A partner college for every home', text: 'Each welfare home is paired with a college through an annual MoU.' },
    { status: 'done', title: 'Eight homes, seven partner colleges', text: 'Homes run by the Social Justice Department and the Department of Women and Child Development.' },
    { status: 'done', title: 'Happy Hill Tracker goes live', text: 'One shared portal for activities, follow-up, requests and reports.', date: 'October 2026' },
    { status: 'now', title: 'Sustained engagement and monthly reviews', text: 'Colleges run regular activities. Assessment meetings are held on the 10th of every month, and MoUs are renewed each year.' },
    { status: 'now', title: 'Aadhaar and UDID for every resident', text: 'Following up pending applications, with enrolment and medical camps planned.' },
    { status: 'next', title: 'Asha Craft kiosk and brand', text: 'A place to show and sell what residents make, with a brand of its own.' },
    { status: 'next', title: 'A renovated Lensfed Park', text: 'A safe, accessible park for residents, through CSR support.' }
  ],

  /* ---------- looking ahead ---------- */
  ahead: [
    {
      kicker: 'Identity and access', title: 'Aadhaar and UDID for every resident',
      text: 'Aadhaar and UDID cards give legal identity. They help residents reach their rights, welfare schemes and public services.',
      bullets: ['Follow up pending Aadhaar applications', 'Hold Aadhaar enrolment camps with Akshaya Centres', 'Hold medical camps for disability assessment and UDID registration', 'Track and speed up UDID issue'],
      art: 'docs'
    },
    {
      kicker: 'Livelihood and dignity', title: 'Asha Craft',
      text: 'Handmade products made by residents. Crafting builds vocational skills, creativity and confidence, offers therapy and recreation, and opens a way to earn.',
      bullets: ['Set up an Asha Craft kiosk to display and sell products', 'Promote the crafts on Instagram', 'Register a trademark and brand identity', 'List Asha Craft on the NIC website', 'Move CSR support towards Asha Craft production'],
      photos: [
        { image: 'assets/photos/craft-dolls.jpg', alt: 'Hand-made yarn dolls' },
        { image: 'assets/photos/craft-keychains.jpg', alt: 'Pom-pom key chains' },
        { image: 'assets/photos/craft-toys.jpg', alt: 'Soft toys on a shelf' },
        { image: 'assets/photos/craft-beads.jpg', alt: 'A bead flower' }
      ],
      link: { href: 'https://www.instagram.com/asha.craftedwithhope/', label: 'Follow @asha.craftedwithhope' }
    },
    {
      kicker: 'Recreational space', title: 'Lensfed Park renovation',
      text: 'A renovated park will be a safe, accessible place to relax and meet. It will help residents of the Government Home for the Elderly, the Children’s Home for Girls and the Home for Mentally Deficient Children most.',
      bullets: ['Follow up the CSR proposal already submitted', 'Help with approvals and the release of CSR funds'],
      pair: [
        { image: 'assets/photos/park-now.jpg', alt: 'Lensfed Park today', cap: 'Today' },
        { image: 'assets/photos/park-vision.jpg', alt: 'How Lensfed Park could look', cap: 'The vision' }
      ]
    },
    {
      kicker: 'Education and enrichment', title: 'Reframing the DREAMS sessions',
      text: 'Sessions that open up academics, arts, science and technology, and build life skills and career awareness.',
      bullets: ['An adolescent-friendly learning module, drafted with experts', 'Module-based learning from approved modules', 'Younger resource persons to bridge the gap', 'Children grouped by age, with age-appropriate sessions', 'Exposure visits and workshops', 'Performing arts and cultural activities'],
      logo: 'assets/logos/dreams.png',
      visits: [
        { name: 'NIT', text: 'Inspiring STEM aspirations and a look at higher education' },
        { name: 'Planetarium', text: 'Fostering scientific curiosity and hands-on learning' },
        { name: 'Employment Exchange', text: 'Building career readiness and job connections' }
      ]
    }
  ],

  /* ---------- institutions and partners ---------- */
  institutions: [
    { name: 'Social Justice Department', role: 'Runs welfare homes', mark: 'SJD', logo: 'assets/logos/sjd.png' },
    { name: 'Department of Women and Child Development', role: 'Runs welfare homes', mark: 'WCD', logo: 'assets/logos/wcd.png' },
    { name: 'DCIP Kozhikode', role: 'Programme lead and coordination', mark: 'DCIP', logo: 'assets/dcip-logo.png' },
    { name: 'District Administration, Kozhikode', role: 'Nammude Kozhikode Initiative', mark: 'DA', logo: 'assets/district-logo.png' },
    { name: 'Sat Kriya Architects', role: 'Design partner for infrastructure', mark: 'SK' },
    { name: 'District Nirmiti Kendra', role: 'Design and construction support', mark: 'DNK' },
    { name: 'Indian Institute of Architects', role: 'Design partner for infrastructure', mark: 'IIA' }
  ],
  stakeholders: [
    'CSR partners', 'Welfare home superintendents', 'Child Development Project Officers', 'District Child Protection Officer', 'Child Welfare Committee',
    'District Mental Health Programme', 'Medical superintendents', 'Employment Exchange', 'NIT', 'Planetarium', 'Residents of the welfare homes'
  ],
  mouCycle: [
    { n: '1', title: 'Action plans', text: 'Each partner college shares its action plan for the academic year.' },
    { n: '2', title: 'Review and renewal', text: 'A review meeting looks at the work done and renews the MoU.' },
    { n: '3', title: 'Monthly meetings', text: 'Assessment meetings on the 10th of every month, 3 to 4 PM.' },
    { n: '4', title: 'Plans revised', text: 'Action plans are updated as the interventions progress.' }
  ],

  // One entry per partner college. Names are as confirmed; homes follow the DCIP presentation.
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
    { image: 'assets/photos/dreams-stage.jpg', pos: '50% 58%', title: 'DREAMS launch', text: 'Happy Hill builds the foundation; DREAMS expands the horizon. The launch brought the District team and partners together.', tag: 'Launch', date: '2026-02-03' },
    { image: 'assets/photos/tree-planting-2.jpg', pos: '50% 45%', title: 'Tree planting with SBI', text: 'District Administration officials and SBI Bank colleagues plant saplings under the Happy Hill project.', tag: 'Community' },
    { image: 'assets/photos/partner-group-2.jpg', pos: '50% 62%', title: 'Partner colleges meet the District team', text: 'Coordinators from the partner colleges gather with District officials, with their Happy Hill folders in hand.', tag: 'Partnership' },
    { image: 'assets/photos/mou-holycross.jpg', pos: '50% 45%', title: 'Certificates for partner colleges', text: 'Each partner college is welcomed and presented with a certificate as it joins a welfare home.', tag: 'MoU' },
    { image: 'assets/photos/group-collectorate.jpg', pos: '50% 72%', title: 'Together at the Collectorate', text: 'Students, coordinators and officials after a Happy Hill gathering at the Civil Station.', tag: 'Gathering' },
    { image: 'assets/photos/dreams-lamp.jpg', pos: '50% 55%', title: 'Lighting the lamp', text: 'The lamp is lit to open the DREAMS launch.', tag: 'Launch', date: '2026-02-03' },
    { art: 'learn', title: 'Books for the After Care Home library', text: 'A call to the community to donate a book, so the After Care Home can set up a library of its own.', tag: 'Drive' },
    { art: 'build', title: 'Refreshing the Home for the Elderly', text: 'Rooms at the Government Home for the Elderly were revamped with Happy Hill’s support.', tag: 'Spaces' }
  ],

  // Photographs shown in the "In pictures" slideshow. Only photos taken with consent; no residents' faces.
  gallery: [
    { image: 'assets/photos/dreams-stage.jpg', alt: 'The stage at the DREAMS launch' },
    { image: 'assets/photos/tree-planting-1.jpg', alt: 'Officials planting a sapling' },
    { image: 'assets/photos/partner-group-1.jpg', alt: 'Partner college coordinators with District officials' },
    { image: 'assets/photos/dreams-speech.jpg', alt: 'A speaker addressing the DREAMS launch' },
    { image: 'assets/photos/audience.jpg', alt: 'Students and coordinators at a Happy Hill gathering' },
    { image: 'assets/photos/mou-ihrd.jpg', alt: 'A partner college receiving its certificate' },
    { image: 'assets/photos/tree-planting-2.jpg', alt: 'Tree planting under the Happy Hill banner' },
    { image: 'assets/photos/group-collectorate.jpg', alt: 'A group photograph at the Collectorate' },
    { image: 'assets/photos/mou-malabar.jpg', alt: 'A partner college and welfare home presented on screen' }
  ],

  // Reports and documents. While this list is empty the whole section is hidden from the page.
  // To publish one, add an entry such as:
  //   { title: 'Quarterly progress report', kind: 'Report', text: 'One line about it.', file: 'assets/reports/q1.pdf' }
  reports: [],

  // inDays is for samples. For real events use  date: '2026-12-04'  instead.
  events: [
    { art: 'culture', title: 'Cultural evening at the welfare home', where: 'Welfare home 1', college: 'Partner college 1', inDays: 6, sample: true },
    { art: 'health', title: 'Health awareness camp', where: 'Welfare home 3', college: 'Partner college 3', inDays: 13, sample: true },
    { art: 'meet', title: 'Quarterly review meeting', where: 'DCIP office, Civil Station', college: 'All partner colleges', inDays: 21, sample: true }
  ]
};
