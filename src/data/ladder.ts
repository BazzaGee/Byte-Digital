export type LadderStatus = 'live' | 'in-build' | 'later';

export interface LadderStep {
  step: number;
  slug: string;
  /** Canonical site path. Single source of truth for internal links. */
  href: string;
  name: string;
  shortName: string;
  promise: string;
  description: string;
  status: LadderStatus;
  statusLabel: string;
  journeyStage: string;
}

export const LADDER: LadderStep[] = [
  {
    step: 0,
    slug: 'free-website',
    href: '/free-website/',
    name: 'Free Concept Website',
    shortName: 'Free concept website',
    promise: 'A real concept website, built from your public information, reviewed privately by you.',
    description:
      'The entry point. I build a working concept site using information that is already publicly available about your business, host it on a private link, and you tell me what to change. You are not committing to anything.',
    status: 'live',
    statusLabel: 'Free — start here',
    journeyStage: 'Found',
  },
  {
    step: 1,
    slug: 'launch-and-care',
    href: '/steps/launch-and-care/',
    name: 'Launch & Care',
    shortName: 'Launch & care',
    promise: 'Live, secure, and kept current — hosting, domain, updates, backups, and content changes.',
    description:
      'Where most engagements begin. Your site goes live on managed hosting with a domain you own, and I handle the ongoing work: updates, security patches, backups, performance, and content changes when you need them.',
    status: 'live',
    statusLabel: 'Available now',
    journeyStage: 'Answered',
  },
  {
    step: 2,
    slug: 'search-ai-visibility',
    href: '/steps/search-ai-visibility/',
    name: 'Search & AI Visibility',
    shortName: 'Search & AI visibility',
    promise: 'Be findable when people search — and answerable when they ask an AI assistant instead.',
    description:
      'Customers increasingly ask assistants for recommendations rather than typing searches. This step makes sure your business can be found and accurately described in both places: technical foundations, honest factual content, consistent business details, and measurement of where AI referrals actually come from.',
    status: 'live',
    statusLabel: 'Available now',
    journeyStage: 'Found',
  },
  {
    step: 3,
    slug: 'ai-customer-service',
    href: '/steps/ai-customer-service/',
    name: 'AI Customer Service',
    shortName: 'AI customer service',
    promise: 'A website assistant that answers real questions, captures the enquiry, and hands over to you.',
    description:
      'An assistant on your own site that knows your services, answers common questions, collects the details of people who are ready to talk, and hands off to a human rather than pretending. Being built now — I am looking for one Christchurch pilot business.',
    status: 'in-build',
    statusLabel: 'In build — pilot places open',
    journeyStage: 'Answered',
  },
  {
    step: 4,
    slug: 'missed-enquiry-follow-up',
    href: '/steps/missed-enquiry-follow-up/',
    name: 'Missed-Enquiry Follow-up',
    shortName: 'Missed-enquiry follow-up',
    promise: 'Turn every enquiry into a booked job instead of a lost one.',
    description:
      'Most enquiries do not get an answer straight away, and the ones that do not answered at all are the expensive ones. This step builds the follow-up: fast acknowledgement, qualification, booking, reminders, and re-engagement of the people who enquired and went quiet. Being built now — pilot places open.',
    status: 'in-build',
    statusLabel: 'In build — pilot places open',
    journeyStage: 'Followed up',
  },
  {
    step: 5,
    slug: 'custom-software',
    href: '/steps/custom-software/',
    name: 'Custom Software & Apps',
    shortName: 'Custom software & apps',
    promise: 'Portals, dashboards, mobile apps, and internal tools built around how your business actually works.',
    description:
      'When off-the-shelf tools do not fit, I build the thing itself: customer portals, staff dashboards, mobile apps, booking systems, and integrations between the software you already use. CookTwo, the membership and booking platform, is a working example.',
    status: 'live',
    statusLabel: 'Available now',
    journeyStage: 'Shown up',
  },
  {
    step: 6,
    slug: 'internal-ai-assistants',
    href: '/steps/internal-ai-assistants/',
    name: 'Internal AI Assistants',
    shortName: 'Internal AI assistants',
    promise: 'Scheduled research, reporting, and document work that used to eat your week.',
    description:
      'Assistants that work inside your business rather than on your website: scheduled research and reporting, document processing, knowledge search across your own material, and the automation that ties systems together. This is the same pipeline that builds the free concept sites.',
    status: 'live',
    statusLabel: 'Available now',
    journeyStage: 'Came back',
  },
  {
    step: 7,
    slug: 'marketing',
    href: '/steps/marketing/',
    name: 'Marketing',
    shortName: 'Marketing',
    promise: 'Advertising that only makes sense once everything above it is working.',
    description:
      'Deliberately last. Sending traffic into a site that cannot answer, cannot capture an enquiry, and cannot follow up just wastes the spend. Once steps zero to four are working, targeted campaigns have something worth sending people to. Available through trusted partners rather than sold as a Byte Digital service.',
    status: 'later',
    statusLabel: 'Via partners — only after step 4',
    journeyStage: 'Told others',
  },
];

export const LADDER_STEPS = LADDER.filter((s) => s.step > 0);
export const FREE_STEP = LADDER[0];

export const JOURNEY = [
  {
    stage: 'Found',
    text: 'Someone finds you — on Google, in a map result, or by asking an AI assistant which business to use.',
  },
  {
    stage: 'Asked',
    text: 'They reach your site with a real question. Most are trying to work out whether you are the right fit, and whether you even exist.',
  },
  {
    stage: 'Answered',
    text: 'They get a straight answer at the time they are ready to decide — not a contact form that goes nowhere.',
  },
  {
    stage: 'Followed up',
    text: 'If they are not ready yet, the enquiry does not quietly disappear. It gets followed up properly.',
  },
  {
    stage: 'Shown up',
    text: 'The job gets booked and the appointment actually happens. Reminders, confirmations, and the details they need.',
  },
  {
    stage: 'Came back',
    text: 'The business remembers them — reminders, re-engagement, and the small things that bring a customer back.',
  },
  {
    stage: 'Told others',
    text: 'Good work turns into reviews and referrals. This is the cheapest acquisition channel there is, and it compounds.',
  },
];

export const REAL_PROOF = [
  {
    value: '2011',
    label: 'Building websites since',
    detail: 'Over ten years of client work, and the systems that came out of it.',
  },
  {
    value: '1',
    label: 'Person, not an agency',
    detail: 'You talk to the person who designs, builds, and maintains your site.',
  },
  {
    value: '38',
    label: 'Concept sites built',
    detail: 'Through a pipeline that only uses verified public information and checks every build on mobile.',
  },
  {
    value: '3',
    label: 'Live systems running',
    detail: 'The build pipeline itself, the AI customer-service assistant, and CookTwo.',
  },
];

export const FREE_INCLUDES = [
  'A working concept built from your public information',
  'Mobile, tablet, and desktop versions',
  'Technical SEO foundations set up properly',
  'Draft wording you can correct',
  'Images that are properly licensed and sourced',
  'A private preview link, visible only to you',
  'The source files, if you want them',
];

export const FREE_EXCLUDES = [
  'A custom domain name',
  'Hosting and ongoing maintenance',
  'Ongoing edits and new pages',
  'Contact forms, booking, or payment',
  'A website chatbot',
  'Custom software',
  'A search or visibility retainer',
];
