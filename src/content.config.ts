import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Byte Digital'),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
  }),
});

const caseStudyCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    industry: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    liveUrl: z.string().url().optional(),
    appType: z.string().optional(),
    techStack: z.array(z.string()).default([]),
    timeline: z.string().optional(),
    results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    services: z.array(z.string()).default([]),
    screenshots: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
  'case-studies': caseStudyCollection,
};
