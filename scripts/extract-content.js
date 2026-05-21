import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function getAllFiles(dir, extensions) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.includes(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const frontmatterStr = match[1];
  const data = {};
  const lines = frontmatterStr.split('\n');
  let currentKey = null;
  let currentArray = [];

  for (const line of lines) {
    const arrayMatch = line.match(/^\s*-\s+"?(.+?)"?\s*$/);
    if (currentKey && arrayMatch) {
      currentArray.push(arrayMatch[1]);
      continue;
    }
    const kvMatch = line.match(/^(\w+):\s+(.+)$/);
    if (kvMatch) {
      if (currentKey && currentArray.length > 0) {
        data[currentKey] = currentArray;
        currentArray = [];
      }
      currentKey = kvMatch[1];
      let value = kvMatch[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (!isNaN(value) && value !== '') {
        value = Number(value);
      }
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          data[currentKey] = JSON.parse(value);
        } catch {
          data[currentKey] = value;
        }
        currentKey = null;
      } else {
        data[currentKey] = value;
      }
    }
  }
  if (currentKey && currentArray.length > 0) {
    data[currentKey] = currentArray;
  }
  return data;
}

function stripAstroContent(content) {
  let text = content;
  text = text.replace(/---[\s\S]*?---/, '');
  text = text.replace(/import\s+.*?from\s+['"][^'"]*['"];?\n?/g, '');
  text = text.replace(/export\s+interface\s+.*?\n?/g, '');
  text = text.replace(/export\s+const\s+.*?=\s*\[.*?\];?\n?/gs, '');
  text = text.replace(/export\s+function\s+.*?\n?/g, '');
  text = text.replace(/<[^>]*>/g, ' ');
  text = text.replace(/\{[^}]*\}/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function stripMdxContent(content) {
  let text = content;
  text = text.replace(/---[\s\S]*?---/, '');
  text = text.replace(/import\s+.*?from\s+['"][^'"]*['"];?\n?/g, '');
  text = text.replace(/export\s+.*?\n?/g, '');
  text = text.replace(/<[^>]*>/g, ' ');
  text = text.replace(/\{[^}]*\}/g, ' ');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/\[(.+?)\]\(.+?\)/g, '$1');
  text = text.replace(/^[-*]\s+/gm, '');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function extractAstroPageText(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const frontmatter = extractFrontmatter(content);
  const text = stripAstroContent(content);
  const fileName = basename(filePath, '.astro');
  return {
    file: fileName,
    frontmatter,
    text: text.substring(0, 3000),
  };
}

function extractMdxContent(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const frontmatter = extractFrontmatter(content);
  const text = stripMdxContent(content);
  const fileName = basename(filePath, '.mdx');
  return {
    file: fileName,
    frontmatter,
    text: text.substring(0, 3000),
  };
}

function extractServiceContent() {
  const content = readFileSync(
    join(rootDir, 'src', 'utils', 'content-relations.ts'),
    'utf-8'
  );
  const services = [];
  const servicesMatch = content.match(/export const allServices.*?=\s*\[([\s\S]*?)\];/);
  if (servicesMatch) {
    const serviceBlocks = servicesMatch[1].match(/\{[^{}]+\}/g);
    if (serviceBlocks) {
      for (const block of serviceBlocks) {
        const slugMatch = block.match(/slug:\s*'([^']+)'/);
        const titleMatch = block.match(/title:\s*'([^']+)'/);
        const descMatch = block.match(/description:\s*'([^']+)'/);
        if (slugMatch && titleMatch) {
          services.push({
            slug: slugMatch[1],
            title: titleMatch[1],
            description: descMatch ? descMatch[1] : '',
          });
        }
      }
    }
  }
  const guides = [];
  const guidesMatch = content.match(/export const allGuides.*?=\s*\[([\s\S]*?)\];/);
  if (guidesMatch) {
    const guideBlocks = guidesMatch[1].match(/\{[^{}]+\}/g);
    if (guideBlocks) {
      for (const block of guideBlocks) {
        const titleMatch = block.match(/title:\s*'([^']+)'/);
        const descMatch = block.match(/description:\s*'([^']+)'/);
        const hrefMatch = block.match(/href:\s*'([^']+)'/);
        if (titleMatch) {
          guides.push({
            title: titleMatch[1],
            description: descMatch ? descMatch[1] : '',
            href: hrefMatch ? hrefMatch[1] : '',
          });
        }
      }
    }
  }
  return { services, guides };
}

function extractFaqFromIndex() {
  const indexPath = join(rootDir, 'src', 'pages', 'index.astro');
  try {
    const content = readFileSync(indexPath, 'utf-8');
    const faqMatch = content.match(/const faqItems\s*=\s*\[([\s\S]*?)\];/);
    if (faqMatch) {
      const faqBlocks = faqMatch[1].match(/\{[\s\S]*?\}/g);
      if (faqBlocks) {
        return faqBlocks
          .map((block) => {
            const qMatch = block.match(/question:\s*'([^']+)'/);
            const aMatch = block.match(/answer:\s*"([^"]+)"/);
            if (qMatch && aMatch) {
              return { question: qMatch[1], answer: aMatch[1] };
            }
            return null;
          })
          .filter(Boolean);
      }
    }
  } catch {
    return [];
  }
  return [];
}

function extractAboutContent() {
  const aboutPath = join(rootDir, 'src', 'pages', 'about.astro');
  try {
    const content = readFileSync(aboutPath, 'utf-8');
    const text = stripAstroContent(content);
    return text.substring(0, 2000);
  } catch {
    return '';
  }
}

function extractContactContent() {
  const contactPath = join(rootDir, 'src', 'pages', 'contact.astro');
  try {
    const content = readFileSync(contactPath, 'utf-8');
    const text = stripAstroContent(content);
    return text.substring(0, 1000);
  } catch {
    return '';
  }
}

function extractLocationPages() {
  const locationsDir = join(rootDir, 'src', 'pages', 'locations');
  try {
    const files = readdirSync(locationsDir, { withFileTypes: true });
    const locations = [];
    for (const file of files) {
      if (file.isFile() && extname(file.name) === '.astro' && file.name !== 'index.astro') {
        const filePath = join(locationsDir, file.name);
        const page = extractAstroPageText(filePath);
        const suburb = basename(file.name, '.astro').replace(/-/g, ' ');
        locations.push({
          suburb: suburb.charAt(0).toUpperCase() + suburb.slice(1),
          slug: basename(file.name, '.astro'),
          text: page.text.substring(0, 500),
        });
      }
    }
    return locations;
  } catch {
    return [];
  }
}

console.log('Extracting site content for chatbot knowledge base...');

const businessInfo = {
  name: 'Byte Digital',
  url: 'https://bytedigital.co.nz',
  location: 'Christchurch, Canterbury, New Zealand',
  founder: 'Barry Grottis',
  founderTitle: 'Lead Developer & Founder',
  experience: '14+ years',
  email: 'barry@bytedigital.co.nz',
  description:
    'Premium web design and digital marketing agency for local businesses who want to dominate their market. We build lightning-fast, high-converting websites with SEO baked in from the ground up.',
  services: [
    'Web Design',
    'Web Development',
    'SEO',
    'Local SEO',
    'eCommerce',
    'WordPress Development',
    'Branding',
    'Logo Design',
    'Custom Applications',
    'Website Maintenance',
  ],
};

const { services, guides } = extractServiceContent();

const blogFiles = getAllFiles(join(rootDir, 'src', 'content', 'blog'), ['.mdx']);
const blogPosts = blogFiles.map((f) => extractMdxContent(f));

const caseStudyFiles = getAllFiles(join(rootDir, 'src', 'content', 'case-studies'), ['.mdx']);
const caseStudies = caseStudyFiles.map((f) => extractMdxContent(f));

const pageFiles = getAllFiles(join(rootDir, 'src', 'pages'), ['.astro']);
const pages = pageFiles
  .filter(
    (f) =>
      !f.includes('/locations/') &&
      !f.includes('/services/') &&
      !f.includes('/blog/') &&
      !f.includes('/case-studies/') &&
      !f.includes('/guides/') &&
      !f.includes('/tools/')
  )
  .map((f) => extractAstroPageText(f));

const servicePages = getAllFiles(join(rootDir, 'src', 'pages', 'services'), ['.astro']);
const servicePageContent = servicePages.map((f) => extractAstroPageText(f));

const guidePages = getAllFiles(join(rootDir, 'src', 'pages', 'guides'), ['.astro']);
const guidePageContent = guidePages.map((f) => extractAstroPageText(f));

const locations = extractLocationPages();
const faq = extractFaqFromIndex();
const aboutText = extractAboutContent();
const contactText = extractContactContent();

const siteContent = {
  business: businessInfo,
  services,
  guides,
  blogPosts: blogPosts.map((p) => ({
    title: p.frontmatter.title || p.file,
    description: p.frontmatter.description || '',
    category: p.frontmatter.category || '',
    tags: p.frontmatter.tags || [],
    content: p.text,
  })),
  caseStudies: caseStudies.map((c) => ({
    title: c.frontmatter.title || c.file,
    client: c.frontmatter.client || '',
    industry: c.frontmatter.industry || '',
    description: c.frontmatter.description || '',
    tags: c.frontmatter.tags || [],
    content: c.text,
  })),
  servicePages: servicePageContent.map((p) => ({
    slug: basename(p.file),
    title: p.frontmatter.title || basename(p.file),
    content: p.text,
  })),
  guidePages: guidePageContent.map((p) => ({
    slug: basename(p.file),
    title: p.frontmatter.title || basename(p.file),
    content: p.text,
  })),
  locations,
  faq,
  about: {
    text: aboutText,
    founder: businessInfo.founder,
    founderTitle: businessInfo.founderTitle,
    experience: businessInfo.experience,
  },
  contact: {
    text: contactText,
    email: businessInfo.email,
    location: businessInfo.location,
  },
};

const outputDir = join(rootDir, 'public', 'data');
mkdirSync(outputDir, { recursive: true });

const outputPath = join(outputDir, 'site-content.json');
writeFileSync(outputPath, JSON.stringify(siteContent, null, 2));

const size = (JSON.stringify(siteContent).length / 1024).toFixed(1);
console.log(`Content extracted: ${size}KB written to ${outputPath}`);
console.log(`  Services: ${services.length}`);
console.log(`  Guides: ${guides.length}`);
console.log(`  Blog posts: ${blogPosts.length}`);
console.log(`  Case studies: ${caseStudies.length}`);
console.log(`  Service pages: ${servicePageContent.length}`);
console.log(`  Guide pages: ${guidePageContent.length}`);
console.log(`  Locations: ${locations.length}`);
console.log(`  FAQ items: ${faq.length}`);
console.log('Done!');
