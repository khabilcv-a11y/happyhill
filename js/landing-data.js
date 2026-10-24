/* Content for the Happy Hill home page.
   Everything on the page is read from this file, so updating the site means editing text here.

   Items marked  sample: true  are placeholders (they show a small "Sample" tag while SHOW_SAMPLE_TAGS is on).
   Replace them with real entries, then set SHOW_SAMPLE_TAGS to false.

   Photos: put image files in  assets/gallery/  and set  image: 'assets/gallery/name.jpg'  on an item.
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
    { n: '6', l: 'Government welfare homes covered' },
    { n: '2', l: 'Departments working together: SJD and WCD' },
    { n: '1', l: 'Partner college for every home, under an annual MoU' },
    { n: '1', l: 'Shared tracker for plans, follow-up and reports' }
  ],

  pillars: [
    { icon: 'college', title: 'Partner colleges', text: 'Every welfare home is paired with a college through an annual MoU. Students and faculty bring regular, planned activity into the home.' },
    { icon: 'experts', title: 'Expert institutions', text: 'Specialist institutions are brought in for sustained engagement: counselling, skills, health, design and more.' },
    { icon: 'link', title: 'DCIP’s administrative access', text: 'DCIP uses its access to the District Administration to help with documentation and to link residents to the schemes they are entitled to.' }
  ],

  programmes: [
    { icon: 'mind', title: 'Psychosocial support', text: 'Counselling, group sessions and social-skills development.' },
    { icon: 'craft', title: 'Vocational training', text: 'Hands-on skills for self-employment, such as envelope making, with guidance on marketing.' },
    { icon: 'learn', title: 'Life skills and education', text: 'Everyday living skills, learning programmes and literacy support.' },
    { icon: 'play', title: 'Recreation and culture', text: 'Games, music, art and cultural evenings that bring people together.' },
    { icon: 'docs', title: 'Documentation and schemes', text: 'Help with documents and links to government schemes.' },
    { icon: 'build', title: 'Better spaces', text: 'Infrastructure upgrades designed with architects and supported through CSR.' }
  ],

  milestones: [
    { status: 'done', title: 'A partnership model for every home', text: 'Each welfare home paired with a partner college through an annual MoU.' },
    { status: 'done', title: 'Six welfare homes brought in', text: 'Homes administered by the Social Justice Department and the Department of Women and Child Development.' },
    { status: 'done', title: 'Happy Hill Tracker goes live', text: 'One shared portal for activities, follow-up, requests and reports.', date: 'October 2026' },
    { status: 'now', title: 'Sustained engagement', text: 'Partner colleges and expert institutions run regular activities in the homes.' },
    { status: 'now', title: 'Quarterly reviews and MoU renewals', text: 'Progress reviewed with each college; MoUs renewed every year.' },
    { status: 'next', title: 'Better spaces for residents', text: 'Infrastructure upgrades with design partners and CSR support.' }
  ],

  institutions: [
    { name: 'Social Justice Department', role: 'Administers welfare homes', mark: 'SJD' },
    { name: 'Department of Women and Child Development', role: 'Administers welfare homes', mark: 'WCD' },
    { name: 'DCIP Kozhikode', role: 'Programme lead and coordination', mark: 'DCIP', logo: 'assets/dcip-logo.png' },
    { name: 'District Administration, Kozhikode', role: 'Nammude Kozhikode Initiative', mark: 'DA', logo: 'assets/district-logo.png' },
    { name: 'Sat Kriya Architects', role: 'Design partner for infrastructure', mark: 'SK' },
    { name: 'District Nirmiti Kendra', role: 'Design and construction support', mark: 'DNK' },
    { name: 'Indian Institute of Architects', role: 'Design partner for infrastructure', mark: 'IIA' }
  ],

  // One entry per partner college. Add real names as MoUs are signed.
  colleges: [
    { name: 'Partner college 1', home: 'Welfare home 1', sample: true },
    { name: 'Partner college 2', home: 'Welfare home 2', sample: true },
    { name: 'Partner college 3', home: 'Welfare home 3', sample: true },
    { name: 'Partner college 4', home: 'Welfare home 4', sample: true },
    { name: 'Partner college 5', home: 'Welfare home 5', sample: true },
    { name: 'Partner college 6', home: 'Welfare home 6', sample: true }
  ],

  // daysAgo is for samples. For real entries use  date: '2026-11-05'  instead.
  activities: [
    { art: 'craft', title: 'Envelope-making training', text: 'A hands-on session on making envelopes, with tips on pricing and selling.', college: 'Partner college 1', daysAgo: 6, sample: true },
    { art: 'mind', title: 'Group counselling circle', text: 'A relaxed circle for sharing, listening and building social skills.', college: 'Partner college 2', daysAgo: 12, sample: true },
    { art: 'culture', title: 'Cultural evening', text: 'Music, dance and storytelling led together by students and residents.', college: 'Partner college 3', daysAgo: 19, sample: true },
    { art: 'health', title: 'Health awareness camp', text: 'A basic health check-up and an awareness talk with a local clinic.', college: 'Partner college 4', daysAgo: 27, sample: true },
    { art: 'play', title: 'Recreation day', text: 'Indoor and outdoor games and a shared meal.', college: 'Partner college 5', daysAgo: 34, sample: true },
    { art: 'learn', title: 'Life skills workshop', text: 'Everyday skills for independence: budgeting, hygiene and communication.', college: 'Partner college 6', daysAgo: 41, sample: true }
  ],

  // file: path or link to a PDF. Leave empty to show "Available soon".
  reports: [
    { title: 'Project brief', kind: 'Overview', text: 'What Happy Hill is, how it works and who is involved.', file: '', sample: true },
    { title: 'Quarterly progress report', kind: 'Report', text: 'Activities completed, follow-ups and key observations for the quarter.', file: '', sample: true },
    { title: 'MoU summary', kind: 'Partnerships', text: 'Partner colleges, welfare homes and MoU validity.', file: '', sample: true },
    { title: 'Tracker user guide', kind: 'Guide', text: 'How colleges, homes and the District use the Happy Hill Tracker.', file: '', sample: true }
  ],

  // inDays is for samples. For real events use  date: '2026-12-04'  instead.
  events: [
    { art: 'culture', title: 'Cultural evening at the welfare home', where: 'Welfare home 1', college: 'Partner college 1', inDays: 6, sample: true },
    { art: 'health', title: 'Health awareness camp', where: 'Welfare home 3', college: 'Partner college 3', inDays: 13, sample: true },
    { art: 'meet', title: 'Quarterly review meeting', where: 'DCIP office, Civil Station', college: 'All partner colleges', inDays: 21, sample: true }
  ]
};
