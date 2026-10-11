/**
 * Copy and taxonomies for the reactivation funnel (/reactivation/).
 *
 * Deliberately a separate file from funnel-copy.ts: the website wizard asks
 * about pages, designs and integrations; this one asks about dormant lists,
 * consent bases and offers. Only the Chip and PageCopy shapes are shared,
 * imported rather than duplicated.
 *
 * The Pages function keeps its own copies of every allow-list below: server
 * side allow-lists can never share a bundle with the page that renders them,
 * because the page is the untrusted side.
 */

import type { Chip, PageCopy } from './funnel-copy';

export interface ChipGroup {
  id: string;
  legend: string;
  hint?: string;
  options: Chip[];
  single?: boolean;
}

export interface ReactivationCopy {
  eyebrow: string;
  submitLabel: string;
  page: PageCopy;
  business: {
    title: string;
    lede: string;
    nameLabel: string;
    namePlaceholder: string;
    websiteLabel: string;
    websitePlaceholder: string;
    group: ChipGroup;
  };
  list: {
    title: string;
    lede: string;
    sizeGroup: ChipGroup;
    ageGroup: ChipGroup;
    sourceGroup: ChipGroup;
  };
  dormant: {
    title: string;
    lede: string;
    group: ChipGroup;
    noteLabel: string;
    notePlaceholder: string;
  };
  goal: {
    title: string;
    lede: string;
    group: ChipGroup;
    noteLabel: string;
    notePlaceholder: string;
  };
  offer: {
    title: string;
    lede: string;
    note: string;
    label: string;
    placeholder: string;
    group: ChipGroup;
  };
  consentBasis: {
    title: string;
    lede: string;
    group: ChipGroup;
    note: string;
  };
  upload: {
    title: string;
    lede: string;
    dropStrong: string;
    dropLink: string;
    dropHint: string;
    pasteLabel: string;
    pastePlaceholder: string;
    firstNameLabel: string;
    firstNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    attestation: string;
    ownerConsent: string;
    receivedTitle: string;
    receivedBody: string;
  };
}

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

export const LIST_SIZE_OPTIONS: Chip[] = [
  { value: 'under-100', label: 'Under 100' },
  { value: '100-500', label: '100–500' },
  { value: '500-2000', label: '500–2,000' },
  { value: 'over-2000', label: 'Over 2,000' },
];

export const LIST_AGE_OPTIONS: Chip[] = [
  { value: 'recent', label: 'Last 6 months' },
  { value: '6m', label: '6–12 months ago' },
  { value: '1y', label: '1–2 years ago' },
  { value: '2y', label: '2–5 years ago' },
  { value: 'older', label: 'More than 5 years' },
  { value: 'mixed', label: 'A mix of all ages' },
];

/** Where the contacts originally came from — doubles as a consent signal. */
export const LIST_SOURCE_OPTIONS: Chip[] = [
  { value: 'enquiry', label: 'They enquired about my business' },
  { value: 'customer', label: 'They bought from me' },
  { value: 'booking', label: 'They booked with me' },
  { value: 'newsletter', label: 'They signed up to my mailing list' },
  { value: 'event', label: 'They signed up at an event' },
  { value: 'other', label: 'Somewhere else' },
];

export const DORMANT_REASON_OPTIONS: Chip[] = [
  { value: 'price', label: 'Price — too expensive' },
  { value: 'timing', label: 'Timing — came back at the wrong time' },
  { value: 'forgot', label: 'They simply forgot about us' },
  { value: 'competitor', label: 'They went with someone else' },
  { value: 'service', label: 'A bad experience' },
  { value: 'moved', label: 'Moved away or changed circumstances' },
  { value: 'seasonal', label: 'Seasonal — only buy sometimes' },
  { value: 'other', label: 'Something else' },
];

export const GOAL_OPTIONS: Chip[] = [
  { value: 'book', label: 'Book a job or appointment' },
  { value: 'quote', label: 'Get a quote' },
  { value: 'call', label: 'Get a phone call' },
  { value: 'buy', label: 'Buy something' },
  { value: 'reply', label: 'Start a conversation' },
];

export const OFFER_ARCHETYPE_OPTIONS: Chip[] = [
  { value: 'discount', label: 'A discount or special price' },
  { value: 'free-consult', label: 'A free consult or assessment' },
  { value: 'priority', label: 'Priority booking or early access' },
  { value: 'content', label: 'Something useful (guide, checklist)' },
  { value: 'bundle', label: 'A bundle or package deal' },
  { value: 'none', label: 'No offer — just checking in' },
];

/** Consent bases that are legally defensible for reactivation email. */
export const SAFE_CONSENT_BASES = ['enquiry', 'customer', 'booking', 'newsletter', 'event'] as const;

/** Consent bases that cannot carry a reactivation email. */
export const UNSAFE_CONSENT_BASES = ['bought', 'scraped', 'shared', 'unknown'] as const;

export const CONSENT_BASIS_OPTIONS: Chip[] = [
  { value: 'enquiry', label: 'They filled in an enquiry form' },
  { value: 'customer', label: 'They bought from me' },
  { value: 'booking', label: 'They booked with me' },
  { value: 'newsletter', label: 'They signed up to my mailing list' },
  { value: 'event', label: 'They signed up at an event' },
  { value: 'bought', label: 'I bought or rented this list' },
  { value: 'scraped', label: 'I collected these from the web' },
  { value: 'shared', label: 'Someone shared this list with me' },
  { value: 'unknown', label: "I'm not sure" },
];

export const COPY: ReactivationCopy = {
  eyebrow: 'Reactivate your list',
  submitLabel: 'Build my campaign',
  page: {
    badge: 'Reactivate your list',
    title: 'Reactivate Your Old Leads — Byte Digital',
    description:
      'Your old leads still want to hear from you. Answer seven questions and we will build an email campaign to bring dormant contacts back.',
    headingLead: 'Your old leads still want ',
    headingAccent: 'to hear from you',
    lede: 'Answer seven quick questions about your business and your list. We will build an email campaign to bring them back — legally, on your terms.',
    footnote: 'No commitment. We will send you the plan before anything goes out.',
    exitLabel: 'Back',
  },
  business: {
    title: 'Tell us about your business',
    lede: 'A few basics so we know who we are writing for.',
    nameLabel: 'Business name',
    namePlaceholder: 'e.g. Rangiora Denture Clinic',
    websiteLabel: 'Your website',
    websitePlaceholder: 'e.g. rangioradenture.co.nz',
    group: {
      id: 'category',
      legend: 'What kind of business is it?',
      single: true,
      options: CATEGORY_OPTIONS,
    },
  },
  list: {
    title: 'Tell us about your list',
    lede: 'The contacts you want to bring back. Rough numbers are fine.',
    sizeGroup: {
      id: 'listSize',
      legend: 'Roughly how many contacts are on it?',
      single: true,
      options: LIST_SIZE_OPTIONS,
    },
    ageGroup: {
      id: 'listAge',
      legend: 'How old is the newest contact?',
      hint: 'How long since they last heard from you.',
      single: true,
      options: LIST_AGE_OPTIONS,
    },
    sourceGroup: {
      id: 'listSource',
      legend: 'Where did these contacts originally come from?',
      hint: 'This decides what we can legally send them.',
      single: true,
      options: LIST_SOURCE_OPTIONS,
    },
  },
  dormant: {
    title: 'Why did they go quiet?',
    lede: 'Pick everything that applies — this shapes the angle of every email.',
    group: {
      id: 'dormantReasons',
      legend: 'Why did these contacts stop engaging?',
      options: DORMANT_REASON_OPTIONS,
    },
    noteLabel: 'Anything else about why they stopped?',
    notePlaceholder: 'e.g. We stopped marketing after COVID and never picked it back up',
  },
  goal: {
    title: 'What does a win look like?',
    lede: 'The one action every email in the campaign is trying to get.',
    group: {
      id: 'goal',
      legend: 'What do you want them to do?',
      single: true,
      options: GOAL_OPTIONS,
    },
    noteLabel: 'What would a win look like for you?',
    notePlaceholder: 'e.g. Booked a check-up within 30 days',
  },
  offer: {
    title: 'What can you offer them?',
    lede: 'Something worth coming back for. This is the hook in every email.',
    note: 'The more specific and generous, the better it converts. "20% off their first visit back" beats "get in touch".',
    label: 'Your offer, in your own words',
    placeholder: 'e.g. Free 30-minute check-up for anyone who has not been in for over a year',
    group: {
      id: 'offerArchetype',
      legend: 'What kind of offer is this?',
      hint: 'Pick the closest — this guides the AI but does not lock you in.',
      single: true,
      options: OFFER_ARCHETYPE_OPTIONS,
    },
  },
  consentBasis: {
    title: 'How did you get these contacts?',
    lede: 'Be honest — this decides whether we can legally email them.',
    note: 'Enquiry, customer, booking, newsletter and event are safe to reactivate. Bought, scraped and shared lists cannot be emailed under New Zealand, Australian, US, UK or Canadian law — we will tell you what can be done instead.',
    group: {
      id: 'consentBasis',
      legend: 'How did you get these contacts?',
      single: true,
      options: CONSENT_BASIS_OPTIONS,
    },
  },
  upload: {
    title: 'Upload your list',
    lede: 'A CSV with at least the email column. Names and phone numbers make the emails better.',
    dropStrong: 'Drop your CSV here',
    dropLink: 'or choose a file',
    dropHint: 'CSV files up to 2,000 contacts. We only need email — name and phone help.',
    pasteLabel: 'Or paste your contacts',
    pastePlaceholder: 'email,name,phone\nsam@example.co.nz,Sam,021 123 4567',
    firstNameLabel: 'Your first name',
    firstNamePlaceholder: 'e.g. Sam',
    emailLabel: 'Your email',
    emailPlaceholder: 'e.g. sam@rangioradenture.co.nz',
    attestation:
      'I confirm these people gave me permission to be emailed, and the consent basis above is accurate.',
    ownerConsent:
      'Yes, email me about this campaign. I understand nothing goes out until I approve the plan.',
    receivedTitle: 'We have got it.',
    receivedBody:
      'We will build your campaign and email you the plan within one business day. Nothing goes out until you approve it.',
  },
};
