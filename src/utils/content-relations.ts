export interface ServiceInfo {
  slug: string;
  title: string;
  href: string;
  icon: string;
  description: string;
}

export interface GuideInfo {
  title: string;
  description: string;
  href: string;
}

export interface BlogPostSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  pubDate: Date;
}

export interface CaseStudySummary {
  slug: string;
  title: string;
  client: string;
  industry: string;
  description: string;
  tags: string[];
}

export const allServices: ServiceInfo[] = [
  { slug: 'web-design', title: 'Web Design', href: '/services/web-design/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>', description: 'Custom, conversion-focused websites built from scratch.' },
  { slug: 'web-development', title: 'Web Development', href: '/services/web-development/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>', description: 'Fast, scalable web applications with modern frameworks.' },
  { slug: 'seo', title: 'SEO', href: '/services/seo/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>', description: 'Rank higher on Google and drive organic traffic.' },
  { slug: 'local-seo', title: 'Local SEO', href: '/services/local-seo/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>', description: 'Dominate local search results in Christchurch.' },
  { slug: 'digital-marketing', title: 'Digital Marketing', href: '/services/digital-marketing/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>', description: 'SEO, ads, email and automation — one growth engine.' },
  { slug: 'ecommerce', title: 'eCommerce', href: '/services/ecommerce/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', description: 'Online stores that sell. Built for conversion.' },
  { slug: 'wordpress-development', title: 'WordPress Development', href: '/services/wordpress-development/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', description: 'Custom WordPress sites that are fast and secure.' },
  { slug: 'branding', title: 'Branding', href: '/services/branding/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>', description: 'Brand strategy and identity that stands out.' },
  { slug: 'logo-design', title: 'Logo Design', href: '/services/logo-design/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', description: 'Memorable logos that define your brand.' },
  { slug: 'custom-applications', title: 'Custom Applications', href: '/services/custom-applications/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M20 15h2M9 2v2M9 20v2M2 9h2M20 9h2"/></svg>', description: 'Tailor-made web apps for your business processes.' },
  { slug: 'mobile-app-development', title: 'Mobile App Development', href: '/services/mobile-app-development/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>', description: 'Installable PWA & cross-platform mobile apps.' },
  { slug: 'website-maintenance', title: 'Website Maintenance', href: '/services/website-maintenance/', icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>', description: 'Keep your site fast, secure, and up to date.' },
];

export const allGuides: GuideInfo[] = [
  { title: 'Web Design Christchurch 2026', description: 'Everything you need to know about web design trends and best practices for Christchurch businesses.', href: '/guides/web-design-christchurch-2026/' },
  { title: 'Website Cost Guide NZ', description: 'A transparent breakdown of website costs in New Zealand, from simple sites to complex builds.', href: '/guides/website-cost-guide-nz/' },
  { title: 'SEO Domination Handbook', description: 'The complete handbook for ranking your business on Google in competitive local markets.', href: '/guides/seo-domination-handbook/' },
  { title: 'Digital Transformation Guide', description: 'How to modernise your business operations with digital tools and strategies.', href: '/guides/digital-transformation/' },
  { title: 'Headless CMS vs Traditional', description: 'Compare headless CMS platforms with traditional approaches to find the right fit.', href: '/guides/headless-cms-vs-traditional/' },
];

const serviceToBlogTags: Record<string, string[]> = {
  'web-design': ['web design', 'trends', 'web designer', 'conversion', 'CRO'],
  'web-development': ['custom development', 'WordPress', 'websites', 'speed', 'performance'],
  'seo': ['SEO', 'statistics', 'digital marketing', 'optimization'],
  'local-seo': ['local SEO', 'suburb SEO', 'Google Business Profile', 'checklist', 'Christchurch'],
  'digital-marketing': ['digital marketing', 'statistics', 'conversion', 'CRO', 'Google Business Profile', 'eCommerce'],
  'ecommerce': ['eCommerce'],
  'wordpress-development': ['WordPress', 'comparison'],
  'branding': ['branding'],
  'logo-design': [],
  'custom-applications': ['AI', 'future-proof', 'booking system', 'quote calculator', 'custom application', 'web app', 'real-time'],
  'mobile-app-development': ['mobile app', 'PWA', 'progressive web app', 'real-time', 'react', 'app'],
  'website-maintenance': ['speed', 'performance', 'accessibility', 'WCAG', 'optimization'],
};

const serviceToGuideSlugs: Record<string, string[]> = {
  'web-design': ['web-design-christchurch-2026', 'website-cost-guide-nz'],
  'web-development': ['headless-cms-vs-traditional', 'website-cost-guide-nz', 'digital-transformation'],
  'seo': ['seo-domination-handbook', 'web-design-christchurch-2026'],
  'local-seo': ['seo-domination-handbook'],
  'digital-marketing': ['seo-domination-handbook', 'website-cost-guide-nz'],
  'ecommerce': ['website-cost-guide-nz', 'web-design-christchurch-2026'],
  'wordpress-development': ['headless-cms-vs-traditional', 'website-cost-guide-nz'],
  'branding': [],
  'logo-design': [],
  'custom-applications': ['digital-transformation', 'website-cost-guide-nz'],
  'mobile-app-development': ['digital-transformation', 'website-cost-guide-nz'],
  'website-maintenance': ['website-cost-guide-nz', 'web-design-christchurch-2026'],
};

const serviceToCaseStudyTags: Record<string, string[]> = {
  'web-design': ['web design', 'lead generation'],
  'web-development': ['booking system', 'quote calculator', 'mobile-first'],
  'seo': ['seo', 'local SEO', 'google business profile', 'google'],
  'local-seo': ['local SEO', 'Christchurch', 'google business profile'],
  'digital-marketing': ['digital marketing', 'statistics', 'conversion', 'marketing', 'ecommerce'],
  'ecommerce': [],
  'wordpress-development': ['WordPress'],
  'branding': [],
  'logo-design': [],
  'custom-applications': ['booking system', 'quote calculator', 'custom application', 'web app', 'real-time', 'AI app'],
  'mobile-app-development': ['mobile app', 'PWA', 'progressive web app', 'real-time', 'react', 'app'],
  'website-maintenance': [],
};

export function getRelatedPosts(serviceSlug: string, allPosts: BlogPostSummary[], max: number = 3): BlogPostSummary[] {
  const tags = serviceToBlogTags[serviceSlug] || [];
  if (tags.length === 0) return allPosts.slice(0, max);

  const scored = allPosts.map(post => {
    const tagOverlap = post.tags.filter(t =>
      tags.some(rt => t.toLowerCase().includes(rt.toLowerCase()) || rt.toLowerCase().includes(t.toLowerCase()))
    ).length;
    const categoryMatch = tags.some(rt =>
      post.category.toLowerCase().includes(rt.toLowerCase()) || rt.toLowerCase().includes(post.category.toLowerCase())
    ) ? 1 : 0;
    return { post, score: tagOverlap + categoryMatch };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || b.post.pubDate.getTime() - a.post.pubDate.getTime())
    .slice(0, max)
    .map(s => s.post);
}

export function getRelatedGuides(serviceSlug: string, max: number = 2): GuideInfo[] {
  const slugs = serviceToGuideSlugs[serviceSlug] || [];
  return slugs.slice(0, max).map(slug => allGuides.find(g => g.href.includes(slug))).filter(Boolean) as GuideInfo[];
}

export function getRelatedCaseStudies(serviceSlug: string, allStudies: CaseStudySummary[], max: number = 2): CaseStudySummary[] {
  const tags = serviceToCaseStudyTags[serviceSlug] || [];
  if (tags.length === 0) return allStudies.slice(0, max);

  const scored = allStudies.map(study => {
    const tagOverlap = study.tags.filter(t =>
      tags.some(rt => t.toLowerCase().includes(rt.toLowerCase()) || rt.toLowerCase().includes(t.toLowerCase()))
    ).length;
    return { study, score: tagOverlap };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(s => s.study);
}

export function getRelatedServices(serviceSlug: string, max: number = 4): ServiceInfo[] {
  const service = allServices.find(s => s.slug === serviceSlug);
  if (!service) return allServices.slice(0, max);
  return allServices.filter(s => s.slug !== serviceSlug).slice(0, max);
}

export function getRelatedPostsByCategory(category: string, currentSlug: string, allPosts: BlogPostSummary[], max: number = 3): BlogPostSummary[] {
  return allPosts
    .filter(p => p.slug !== currentSlug && p.category === category)
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, max);
}

export function getUniqueCategories(posts: BlogPostSummary[]): string[] {
  return [...new Set(posts.map(p => p.category))].sort();
}
