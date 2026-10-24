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

  // One entry per partner college. The sixth college will be added here once its name is confirmed.
  colleges: [
    { name: 'IHRD College of Applied Science', home: 'Asha Bhavan', image: 'assets/photos/mou-ihrd.jpg', pos: '50% 42%' },
    { name: 'St. Joseph’s College (Autonomous), Devagiri', home: 'Old Age Home', image: 'assets/photos/mou-stjoseph.jpg', pos: '50% 42%' },
    { name: 'Providence Women’s College (Autonomous)', home: 'Welfare home', image: 'assets/photos/mou-providence.jpg', pos: '50% 40%' },
    { name: 'Holy Cross Institute of Management and Technology', home: 'Asha Bhavan (Women)', image: 'assets/photos/mou-holycross.jpg', pos: '50% 45%' },
    { name: 'Malabar Christian College', home: 'Old Age Home', image: 'assets/photos/mou-malabar.jpg', pos: '50% 42%' }
  ],

  // Use  date: '2026-11-05'  for a dated card, or  label: 'text'  to show words instead of a date.
  activities: [
    { image: 'assets/photos/dreams-stage.jpg', pos: '50% 58%', title: 'DREAMS launch', text: 'Happy Hill builds the foundation; DREAMS expands the horizon. The launch brought the District team and partners together.', tag: 'Launch', date: '2026-02-03' },
    { image: 'assets/photos/tree-planting-2.jpg', pos: '50% 45%', title: 'Tree planting with SBI', text: 'District Administration officials and SBI Bank colleagues plant saplings under the Happy Hill project.', tag: 'Community' },
    { image: 'assets/photos/partner-group-2.jpg', pos: '50% 62%', title: 'Partner colleges meet the District team', text: 'Coordinators from the partner colleges gather with District officials, with their Happy Hill folders in hand.', tag: 'Partnership' },
    { image: 'assets/photos/mou-holycross.jpg', pos: '50% 45%', title: 'Certificates for partner colleges', text: 'Each partner college is welcomed and presented with a certificate as it joins a welfare home.', tag: 'MoU' },
    { image: 'assets/photos/group-collectorate.jpg', pos: '50% 72%', title: 'Together at the Collectorate', text: 'Students, coordinators and officials after a Happy Hill gathering at the Civil Station.', tag: 'Gathering' },
    { image: 'assets/photos/dreams-lamp.jpg', pos: '50% 55%', title: 'Lighting the lamp', text: 'The lamp is lit to open the DREAMS launch.', tag: 'Launch', date: '2026-02-03' }
  ],

  // Photographs shown in the "In pictures" section. Only photos taken with consent; no residents' faces.
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
