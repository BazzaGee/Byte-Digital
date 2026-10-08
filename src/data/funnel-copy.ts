/**
 * One source of truth for the funnel's words and taxonomies.
 *
 * Two variants share a component but assume different worlds:
 *
 *   'rebuild'   — the visitor has (or saw) a website and wants it rebuilt.
 *                 Reached from a builder-made *.pages.dev site, the showcase
 *                 detail page, and any bare /rebuild/ link. Unchanged from
 *                 what shipped before this file existed.
 *   'new-build' — a cold visitor from anywhere online with any business type
 *                 who just wants a website. Reached from the main site's CTAs.
 *                 Says nothing about rebuilding; asks for the business type
 *                 first so the service chips are actually relevant, and asks
 *                 what the site needs to DO so the free build's boundary is
 *                 understood before it is offered.
 *
 * Only strings that genuinely differ between the variants are written twice —
 * `rebuild` is the base and `new-build` overrides what changes. Steps with no
 * override live in `rebuild` and are reused as-is.
 *
 * The Pages function keeps its own copies of these lists: server-side
 * allow-lists can never share a bundle with the page that renders them,
 * because the page is the untrusted side.
 */

export type FunnelVariant = 'rebuild' | 'new-build';

export interface Chip {
  value: string;
  label: string;
}

export interface ChipGroup {
  /** Key this group writes into the picks map, and the payload array name. */
  id: string;
  legend: string;
  hint?: string;
  options: Chip[];
  /** Single-select (category, existing-site question) vs the usual multi. */
  single?: boolean;
}

/**
 * Step 2's service chips belong to a category rather than to a fixed list, so
 * they are not rendered from `options` at all — the page walks
 * `SERVICES_BY_CATEGORY` itself and shows only the picked type's chips.
 */
export interface RevealGroup {
  id: string;
  legend: string;
  hint?: string;
}

export interface PageCopy {
  badge: string;
  title: string;
  description: string;
  headingLead: string;
  headingAccent: string;
  lede: string;
  footnote: string;
  exitLabel: string;
}

export interface BusinessStep {
  title: string;
  lede: string;
  note: string;
  businessLabel: string;
  businessPlaceholder: string;
  websiteLabel: string;
  websitePlaceholder: string;
  /** Absent on `rebuild`: that world already knows it has a site to work from. */
  existingGroup?: ChipGroup;
  /** The business's own public contact — the one thing a brief-only seed lacks. */
  contactLabel?: string;
  contactHint?: string;
  contactPlaceholder?: string;
}

export interface ChipsStep {
  title: string;
  lede: string;
  group: ChipGroup;
  /** The category-driven service list that appears under `group`. */
  revealGroup?: RevealGroup;
  /**
   * Always-visible own-words box directly under `group`. Ten category chips
   * can never cover every business, and hiding the escape hatch behind a pick
   * means the visitor whose trade is missing is simply stuck — so it sits
   * there whether or not they used a chip.
   */
  typeLabel?: string;
  typePlaceholder?: string;
  otherLabel: string;
  otherPlaceholder: string;
  /** Present only where a free-text supplement sits alongside the chips. */
  note?: string;
}

export interface UspStep {
  title: string;
  lede: string;
  /** `rebuild` asks in prose only; `new-build` offers quick-pick chips too. */
  group?: ChipGroup;
  label: string;
  /** Rendered inside the dimmed "(…)" note — the two variants word it differently. */
  labelNote?: string;
  placeholder: string;
}

export interface ScopePanel {
  /** Picks key, and the chip group's accessible name. */
  id: string;
  /** Visible heading of the whole tier, not just of the chips. */
  legend: string;
  body: string;
  options: Chip[];
}

/** Step 4: the shape of the site and what should be on it, as one screen. */
export interface ShapeStep {
  title: string;
  lede: string;
  siteGroup: ChipGroup;
  designGroup: ChipGroup;
  /** Shared free text — one box instead of two, because both are optional. */
  label: string;
  placeholder: string;
}

export interface CapabilitiesStep {
  title: string;
  lede: string;
  /** The two-tier boundary, stated before either list is offered. */
  inScope: ScopePanel;
  outScope: ScopePanel;
  /** Revealed only once a bigger build is actually ticked — nobody who wants
   *  "just the basics" should have to look at a payments question. */
  integrationLegend: string;
  integrationGroup: ChipGroup;
  noteLabel: string;
  notePlaceholder: string;
}

export interface DesignStep {
  title: string;
  lede: string;
  group: ChipGroup;
  label: string;
  placeholder: string;
}

export interface AssetsStep {
  title: string;
  lede: string;
  dropStrong: string;
  dropLink: string;
  dropHint: string;
  linkLabel: string;
  linkPlaceholder: string;
}

export interface ContactStep {
  title: string;
  lede: string;
  note: string;
  consent: string;
}

export interface FunnelCopy {
  eyebrow: string;
  submitLabel: string;
  page: PageCopy;
  business: BusinessStep;
  services?: ChipsStep;
  category?: ChipsStep;
  usp: UspStep;
  /** Present only on `new-build`; `rebuild` still runs a design step of its own. */
  shape?: ShapeStep;
  capabilities?: CapabilitiesStep;
  /** Present only on `rebuild` — `new-build` folds design into `shape`. */
  design?: DesignStep;
  assets: AssetsStep;
  contact: ContactStep;
}

export const EXISTING_SITE_OPTIONS: Chip[] = [
  { value: 'website', label: 'I have a website' },
  { value: 'social', label: 'Facebook or Instagram only' },
  { value: 'none', label: 'Nothing yet' },
];

export const SITE_TYPE_OPTIONS: Chip[] = [
  { value: 'info', label: 'Simple info site' },
  { value: 'booking', label: 'Bookings' },
  { value: 'store', label: 'Online shop' },
  { value: 'quotes', label: 'Quote requests' },
  { value: 'membership', label: 'Members area' },
  { value: 'portfolio', label: 'Portfolio' },
];

/**
 * Tier A: everything the pipeline actually produces — a static Astro marketing
 * site with a route per service, real photos, map, hours and tel:/mailto:
 * links. Checked against `owner-rules.md` and the build command: no forms, no
 * backend, ever.
 */
export const IN_SCOPE_OPTIONS: Chip[] = [
  { value: 'pages', label: 'All the main pages' },
  { value: 'service-pages', label: 'A page per service' },
  { value: 'gallery', label: 'Photo gallery' },
  { value: 'map', label: 'Map & directions' },
  { value: 'booking-link', label: 'Booking buttons' },
  { value: 'reviews', label: 'Customer reviews' },
];

/**
 * Tier B: requested honestly, recorded in the brief, and never attempted by
 * the free build. Selecting one flips `scope` to 'custom-build' — which is the
 * best segmentation signal in the whole funnel: these are the people who will
 * pay for the real project.
 */
export const OUT_SCOPE_OPTIONS: Chip[] = [
  { value: 'cart', label: 'Online shop' },
  { value: 'payments', label: 'Take payments' },
  { value: 'booking-diary', label: 'Live booking diary' },
  { value: 'logins', label: 'Member logins' },
  { value: 'quote-system', label: 'Quote system' },
  { value: 'api', label: 'Software connections' },
  /** The tier's own escape hatch: ticks nothing of consequence, keeps scope
   *  `standard`, and means the step can be answered without a project. */
  { value: 'nothing-now', label: 'Nothing extra' },
];

export const INTEGRATION_OPTIONS: Chip[] = [
  { value: 'payments', label: 'Payments (Stripe, Windcave)' },
  { value: 'accounting', label: 'Accounting (Xero, MYOB)' },
  { value: 'booking', label: 'Your booking software' },
  { value: 'none', label: 'Nothing yet' },
];

/**
 * The business-type question, and the service chips that follow it. The
 * pipeline's own seeds are all local home services, so a single service list
 * written for those would be nonsense to a law firm or a cafe — which is why
 * the type is asked first and the chips swap to match.
 */
export const CATEGORY_OPTIONS: Chip[] = [
  { value: 'trades', label: 'Trades & home services' },
  { value: 'property', label: 'Property & construction' },
  { value: 'retail', label: 'Retail & online stores' },
  { value: 'hospitality', label: 'Hospitality, food & events' },
  { value: 'professional', label: 'Professional services' },
  { value: 'health', label: 'Health & wellbeing' },
  { value: 'education', label: 'Education, training & childcare' },
  { value: 'auto', label: 'Auto, transport & logistics' },
  { value: 'creative', label: 'Creative, media & technology' },
  { value: 'other', label: 'Something else' },
];

export const SERVICES_BY_CATEGORY: Record<string, Chip[]> = {
  trades: [
    { value: 'Emergency call-outs', label: 'Emergency call-outs' },
    { value: 'Free quotes', label: 'Free quotes' },
    { value: 'Installations', label: 'Installations' },
    { value: 'Repairs & maintenance', label: 'Repairs & maintenance' },
    { value: 'Renovations', label: 'Renovations' },
    { value: 'Same-day service', label: 'Same-day service' },
    { value: 'Servicing plans', label: 'Servicing plans' },
    { value: 'Certified tradespeople', label: 'Certified tradespeople' },
  ],
  property: [
    { value: 'New builds', label: 'New builds' },
    { value: 'Renovations', label: 'Renovations' },
    { value: 'Commercial work', label: 'Commercial work' },
    { value: 'Project management', label: 'Project management' },
    { value: 'Free consultations', label: 'Free consultations' },
    { value: 'Fixed-price quotes', label: 'Fixed-price quotes' },
    { value: 'Site preparation', label: 'Site preparation' },
    { value: 'Landscape design', label: 'Landscape design' },
  ],
  retail: [
    { value: 'In-store shopping', label: 'In-store shopping' },
    { value: 'Online store', label: 'Online store' },
    { value: 'Delivery', label: 'Delivery' },
    { value: 'Click & collect', label: 'Click & collect' },
    { value: 'Gift cards', label: 'Gift cards' },
    { value: 'Trade accounts', label: 'Trade accounts' },
    { value: 'Custom orders', label: 'Custom orders' },
    { value: 'Loyalty rewards', label: 'Loyalty rewards' },
  ],
  hospitality: [
    { value: 'Menu & online ordering', label: 'Menu & online ordering' },
    { value: 'Table bookings', label: 'Table bookings' },
    { value: 'Functions & events', label: 'Functions & events' },
    { value: 'Takeaway', label: 'Takeaway' },
    { value: 'Catering', label: 'Catering' },
    { value: 'Private hire', label: 'Private hire' },
    { value: 'Gift vouchers', label: 'Gift vouchers' },
    { value: 'Delivery', label: 'Delivery' },
  ],
  professional: [
    { value: 'Initial consultation', label: 'Initial consultation' },
    { value: 'Fixed fees', label: 'Fixed fees' },
    { value: 'Ongoing retainer', label: 'Ongoing retainer' },
    { value: 'Remote appointments', label: 'Remote appointments' },
    { value: 'Written reports', label: 'Written reports' },
    { value: 'Document review', label: 'Document review' },
    { value: 'Second opinions', label: 'Second opinions' },
  ],
  health: [
    { value: 'New patient appointments', label: 'New patient appointments' },
    { value: 'Same-week appointments', label: 'Same-week appointments' },
    { value: 'Online booking', label: 'Online booking' },
    { value: 'Treatment plans', label: 'Treatment plans' },
    { value: 'Home visits', label: 'Home visits' },
    { value: 'Wellness plans', label: 'Wellness plans' },
    { value: 'Referrals', label: 'Referrals' },
  ],
  education: [
    { value: 'Term-based courses', label: 'Term-based courses' },
    { value: 'One-off workshops', label: 'One-off workshops' },
    { value: 'Enrolment online', label: 'Enrolment online' },
    { value: 'School groups', label: 'School groups' },
    { value: 'One-on-one tutoring', label: 'One-on-one tutoring' },
    { value: 'Certification', label: 'Certification' },
    { value: 'Before & after school care', label: 'Before & after school care' },
  ],
  auto: [
    { value: 'Vehicle servicing', label: 'Vehicle servicing' },
    { value: 'Repairs & diagnostics', label: 'Repairs & diagnostics' },
    { value: 'Towing & recovery', label: 'Towing & recovery' },
    { value: 'Routine servicing', label: 'Routine servicing' },
    { value: 'Tyres', label: 'Tyres' },
    { value: 'Fleet servicing', label: 'Fleet servicing' },
    { value: 'Storage', label: 'Storage' },
  ],
  creative: [
    { value: 'Project work', label: 'Project work' },
    { value: 'Retainers', label: 'Retainers' },
    { value: 'Print & design', label: 'Print & design' },
    { value: 'Photography', label: 'Photography' },
    { value: 'Video production', label: 'Video production' },
    { value: 'Website or app builds', label: 'Website or app builds' },
    { value: 'Support plans', label: 'Support plans' },
  ],
  other: [
    { value: 'Products or services', label: 'Products or services' },
    { value: 'Bookings & appointments', label: 'Bookings & appointments' },
    { value: 'Quotes & estimates', label: 'Quotes & estimates' },
    { value: 'Advice & consultations', label: 'Advice & consultations' },
    { value: 'Deliveries & shipping', label: 'Deliveries & shipping' },
    { value: 'Subscriptions', label: 'Subscriptions' },
    { value: 'Services for other businesses', label: 'Services for other businesses' },
  ],
};

/** Trade-shaped, written for the seeded businesses the workflow produces. */
const REBUILD_SERVICE_OPTIONS: Chip[] = [
  { value: 'Emergency call-outs', label: 'Emergency call-outs' },
  { value: 'Free quotes', label: 'Free quotes' },
  { value: 'Repairs & maintenance', label: 'Repairs & maintenance' },
  { value: 'Installations', label: 'Installations' },
  { value: 'Consultations', label: 'Consultations' },
  { value: 'Deliveries', label: 'Deliveries' },
  { value: 'Online orders', label: 'Online orders' },
  { value: '24/7 service', label: '24/7 service' },
  { value: 'Family owned', label: 'Family owned' },
  { value: 'Locally owned & trusted', label: 'Locally owned & trusted' },
];

const REBUILD_DESIGN_OPTIONS: Chip[] = [
  { value: 'Photo gallery', label: 'Photo gallery' },
  { value: 'Customer reviews', label: 'Customer reviews' },
  { value: 'Booking form', label: 'Booking form' },
  { value: 'Price list', label: 'Price list' },
  { value: 'Before & after', label: 'Before & after' },
  { value: 'Video', label: 'Video' },
  { value: 'Map & directions', label: 'Map & directions' },
  { value: 'Quote request form', label: 'Quote request form' },
  { value: 'Online shop', label: 'Online shop' },
  { value: 'Team profiles', label: 'Team profiles' },
];

/** Cleared of trade assumptions; "Booking or enquiry buttons" never says form. */
const NEW_BUILD_DESIGN_OPTIONS: Chip[] = [
  { value: 'Photo gallery', label: 'Photo gallery' },
  { value: 'Customer reviews', label: 'Customer reviews' },
  { value: 'Pricing or packages', label: 'Pricing or packages' },
  { value: 'Booking or enquiry buttons', label: 'Booking or enquiry buttons' },
  { value: 'Map and directions', label: 'Map and directions' },
  { value: 'Video', label: 'Video' },
];

const USP_CHIP_GROUP: ChipGroup = {
  id: 'usp',
  legend: 'Common picks',
  options: [
    { value: 'Free quotes', label: 'Free quotes' },
    { value: 'Same-day service', label: 'Same-day service' },
    { value: 'Locally owned', label: 'Locally owned' },
    { value: 'Family owned', label: 'Family owned' },
    { value: 'Fully licensed', label: 'Fully licensed' },
    { value: '10+ years experience', label: '10+ years experience' },
    { value: '5-star reviews', label: '5-star reviews' },
  ],
};

const REBUILD: FunnelCopy = {
  eyebrow: 'Free rebuild',
  submitLabel: 'Send my brief',
  page: {
    badge: 'Free rebuild — nothing to pay',
    title: 'Free Website Rebuild — No Payment Needed | Byte Digital',
    description:
      'Tell me about your business in six quick questions and I will rebuild your website free. No payment, no invoice, no card details, no obligation. Based in Christchurch, New Zealand.',
    headingLead: 'Let&rsquo;s rebuild ',
    headingAccent: 'your website',
    lede: 'Six quick questions — no scrolling, no jargon. Tell me what you do and what you want to see, and I&rsquo;ll do the rest.',
    footnote: 'Takes about two minutes &middot; no tech skills needed',
    exitLabel: 'Back to Byte Digital',
  },
  business: {
    title: 'First up — who are you?',
    lede: 'Just the basics. If you have a current website or social page, pop it in — it helps me see what you already have.',
    note: 'Completely free. No invoice, no payment and no card details — at any point.',
    businessLabel: 'Business name',
    businessPlaceholder: 'e.g. Beckenham Automotive',
    websiteLabel: 'Current website or Facebook page',
    websitePlaceholder: 'https://... or just the name',
  },
  services: {
    title: 'What do you do?',
    lede: 'Pick anything that applies — these get front and centre. Add your own words at the bottom if you offer something specific.',
    group: {
      id: 'services',
      legend: 'What you offer',
      options: REBUILD_SERVICE_OPTIONS,
    },
    otherLabel: 'Anything else you offer that should stand out?',
    otherPlaceholder: 'e.g. Same-day call-outs across Christchurch, or free measure and quote',
  },
  usp: {
    title: 'What makes you different?',
    lede: 'The thing customers say they love, or a service you want to be known for. Plain words are perfect — this shapes the whole site.',
    label: 'Your unique selling point',
    labelNote: 'optional, but worth 30 seconds',
    placeholder: 'e.g. We are the only local team that does X, or customers stay with us because...',
  },
  design: {
    title: 'What do you want to see on it?',
    lede: 'What would look great to you? Pick anything that appeals, or describe it your own way — visuals, style, a site you like.',
    group: { id: 'design', legend: 'Popular picks', options: REBUILD_DESIGN_OPTIONS },
    label: 'Anything visual you have in mind?',
    placeholder: 'e.g. Bold and modern, lots of photos of our work, a style like example.co.nz',
  },
  assets: {
    title: 'Have anything to send me?',
    lede: 'Logo, photos of your work, a brochure — anything helps make it yours. Skip this if you do not have anything handy.',
    dropStrong: 'Drop files here',
    dropLink: 'choose files',
    dropHint: 'Up to 6 files, 8 MB each — photos, logo, PDF or ZIP',
    linkLabel: 'Or paste a link instead',
    linkPlaceholder: 'Google Drive, Dropbox, or your current website',
  },
  contact: {
    title: 'Last one — where do I send it?',
    lede: 'Your first name and email, and that is the whole thing done. I will be in touch as soon as I have looked over your brief.',
    note: 'I only need an email to send it to. There is no invoice to pay and I will never ask for card details.',
    consent: 'Email me about my website. No spam, and a one-click unsubscribe in every email.',
  },
};

const NEW_BUILD: FunnelCopy = {
  ...REBUILD,
  eyebrow: 'Free website build',
  submitLabel: 'Build my website',
  page: {
    badge: 'Free website build — nothing to pay',
    title: 'Free Website Build — No Payment Needed | Byte Digital',
    description:
      'Tell me about your business in seven quick questions and I will build your website free. No payment, no invoice, no card details, no obligation. Based in Christchurch, New Zealand.',
    headingLead: 'Let&rsquo;s build ',
    headingAccent: 'your website',
    lede: 'Seven quick questions — no scrolling, no jargon. Tell me what your business does and what you want on the page, and I&rsquo;ll do the rest.',
    footnote: 'Takes about three minutes &middot; no tech skills needed',
    exitLabel: 'Back to Byte Digital',
  },
  // Spread from `rebuild` carries its trade-shaped service step and its design
  // step; new-build has neither — design folds into `shape` below.
  services: undefined,
  design: undefined,
  business: {
    title: 'First up — who are we building for?',
    lede: 'Your business name, what you have online, and how I reach you.',
    note: 'Completely free. No invoice, no payment and no card details — at any point.',
    businessLabel: 'Business name',
    businessPlaceholder: 'e.g. Beckenham Automotive',
    existingGroup: {
      id: 'existingSite',
      legend: 'Do you have a website today?',
      hint: 'This one question tells me what I am starting from.',
      options: EXISTING_SITE_OPTIONS,
      single: true,
    },
    websiteLabel: 'Website or social page',
    websitePlaceholder: 'https://... or just the name',
    contactLabel: 'Business contact to put on the site',
    contactHint: 'Optional — I only publish what you give me, never anything I invent.',
    contactPlaceholder: 'e.g. 021 555 0100 or hello@yourbusiness.co.nz',
  },
  category: {
    title: 'What kind of business is it?',
    lede: 'Pick the closest match — or just describe it below. These get front and centre on your site.',
    typeLabel: 'Or describe it in your own words',
    typePlaceholder: 'e.g. We make custom furniture, we run a doggy daycare, we are a mobile notary',
    group: {
      id: 'category',
      legend: 'Your type of business',
      options: CATEGORY_OPTIONS,
      single: true,
    },
    revealGroup: {
      id: 'services',
      legend: 'What you offer',
      hint: 'Shown for the type you picked above.',
    },
    otherLabel: 'Anything else you offer that should stand out?',
    otherPlaceholder: 'e.g. Same-day call-outs across Christchurch, or free measure and quote',
  },
  usp: {
    title: 'What makes you different?',
    lede: 'The thing customers say they love, or a service you want to be known for. Plain words are perfect — this shapes the whole site.',
    group: USP_CHIP_GROUP,
    label: 'Anything else worth knowing?',
    labelNote: 'optional',
    placeholder: 'e.g. We are the only local team that does X, or customers stay with us because...',
  },
  // The shape of the site and what should be on it are the same question
  // wearing two hats; splitting them is what made this flow feel like nine.
  shape: {
    title: 'What should it do and look like?',
    lede: 'Two short lists. Nothing here is required — skip both and just tell me below.',
    siteGroup: { id: 'siteType', legend: 'The shape of it', options: SITE_TYPE_OPTIONS },
    designGroup: { id: 'design', legend: 'What should be on it', options: NEW_BUILD_DESIGN_OPTIONS },
    label: 'Anything else about how it should work or look',
    placeholder: 'e.g. A shop with online orders, a page per location, something that feels like example.co.nz',
  },
  capabilities: {
    title: 'What does it need to do?',
    lede: 'Tick what applies — or skip it and tell me below.',
    inScope: {
      id: 'capabilitiesIn',
      legend: 'Included in the free build',
      body: 'The whole site — pages, photos, a page per service, map, hours and tap-to-call buttons — built properly, not stubbed.',
      options: IN_SCOPE_OPTIONS,
    },
    outScope: {
      id: 'capabilitiesOut',
      legend: 'Bigger build — separate quote',
      body: 'Cart, payments, a booking diary, logins and connections are real software — quoted separately. Tick them anyway: I build the foundation so they can be added later without redoing the site.',
      options: OUT_SCOPE_OPTIONS,
    },
    integrationLegend: 'Does it need to connect to anything?',
    integrationGroup: { id: 'integrations', legend: 'Connections', options: INTEGRATION_OPTIONS },
    noteLabel: 'The one thing it must have',
    notePlaceholder:
      'Describe it in your own words — the special feature you are picturing, or anything you need it to do.',
  },
  contact: {
    title: 'Last one — where do I send it?',
    lede: 'Your first name and email, and that is the whole thing done. I will get the build going the moment I have this.',
    note: 'I only need an email to send it to. There is no invoice to pay and I will never ask for card details.',
    consent: 'Email me about my website. No spam, and a one-click unsubscribe in every email.',
  },
};

const COPY: Record<FunnelVariant, FunnelCopy> = {
  rebuild: REBUILD,
  'new-build': NEW_BUILD,
};

export function copyFor(variant: FunnelVariant): FunnelCopy {
  return COPY[variant];
}

export function isFunnelVariant(value: unknown): value is FunnelVariant {
  return value === 'rebuild' || value === 'new-build';
}
