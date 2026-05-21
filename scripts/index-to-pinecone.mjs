import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PINECONE_INDEX = 'n8n';
const PINECONE_NAMESPACE = 'byte-digital';
const OPENAI_MODEL = 'text-embedding-3-small';
const DIMENSIONS = 1536;
const BATCH_SIZE = 100;

async function main() {
  console.log('Initializing Pinecone...');
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  console.log('Loading site content from public/data/site-content.json...');
  const contentPath = path.join(__dirname, '..', 'public', 'data', 'site-content.json');
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));

  console.log('Initializing OpenAI embeddings...');
  const embeddings = new OpenAIEmbeddings({
    modelName: OPENAI_MODEL,
    dimensions: DIMENSIONS,
  });

  console.log('Extracting and chunking content...');
  const documents = [];

  if (content.business) {
    const b = content.business;
    documents.push({
      pageContent: `${b.name}: ${b.description}. Located at ${b.location}. Founder: ${b.founder}. Email: ${b.email}. Services: ${b.services.join(', ')}.`,
      metadata: { type: 'business-info', title: b.name, source: 'business' },
    });
  }

  if (content.services) {
    for (const service of content.services) {
      documents.push({
        pageContent: `${service.title}: ${service.description}`,
        metadata: { type: 'service', slug: service.slug, title: service.title, source: 'services' },
      });
    }
  }

  if (content.servicePages) {
    for (const page of content.servicePages) {
      documents.push({
        pageContent: `${page.title}: ${page.content}`,
        metadata: { type: 'service-page', title: page.title, source: 'service-pages' },
      });
    }
  }

  if (content.guides) {
    for (const guide of content.guides) {
      documents.push({
        pageContent: `${guide.title}: ${guide.description}`,
        metadata: { type: 'guide', slug: guide.slug, title: guide.title, source: 'guides' },
      });
    }
  }

  if (content.guidePages) {
    for (const page of content.guidePages) {
      documents.push({
        pageContent: `${page.title}: ${page.content}`,
        metadata: { type: 'guide-page', title: page.title, source: 'guide-pages' },
      });
    }
  }

  if (content.blogPosts) {
    for (const post of content.blogPosts) {
      documents.push({
        pageContent: `${post.title}: ${post.description} ${post.content}`,
        metadata: { type: 'blog-post', slug: post.slug, title: post.title, source: 'blog' },
      });
    }
  }

  if (content.caseStudies) {
    for (const cs of content.caseStudies) {
      documents.push({
        pageContent: `${cs.title}: ${cs.description} ${cs.content}`,
        metadata: { type: 'case-study', slug: cs.slug, title: cs.title, source: 'case-studies' },
      });
    }
  }

  if (content.faq) {
    for (const item of content.faq) {
      documents.push({
        pageContent: `Q: ${item.question} A: ${item.answer}`,
        metadata: { type: 'faq', question: item.question, source: 'faq' },
      });
    }
  }

  if (content.locations) {
    for (const loc of content.locations) {
      documents.push({
        pageContent: `${loc.suburb}: ${loc.text}`,
        metadata: { type: 'location', suburb: loc.suburb, source: 'locations' },
      });
    }
  }

  if (content.about && content.about.text) {
    documents.push({
      pageContent: `About Byte Digital: ${content.about.text}`,
      metadata: { type: 'about', title: 'About Byte Digital', source: 'about' },
    });
  }

  console.log(`Total documents extracted: ${documents.length}`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitDocuments(documents);
  console.log(`Total chunks after splitting: ${chunks.length}`);

  console.log('Generating embeddings...');
  const texts = chunks.map((c) => c.pageContent);
  const embeddingsList = await embeddings.embedDocuments(texts);

  console.log(`Upserting ${chunks.length} vectors to Pinecone index "${PINECONE_INDEX}", namespace "${PINECONE_NAMESPACE}"...`);

  const index = pinecone.Index(PINECONE_INDEX);

  const vectors = chunks.map((chunk, i) => {
    const cleanMetadata = {};
    for (const [key, value] of Object.entries(chunk.metadata)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleanMetadata[key] = value;
      } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        cleanMetadata[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        cleanMetadata[key] = JSON.stringify(value);
      }
    }
    return {
      id: `byte-digital-${i}-${Date.now()}`,
      values: embeddingsList[i],
      metadata: cleanMetadata,
    };
  });

  console.log(`  Total vectors to upsert: ${vectors.length}`);

  const listRes = await fetch('https://api.pinecone.io/indexes', {
    headers: { 'Api-Key': process.env.PINECONE_API_KEY },
  });
  const listData = await listRes.json();
  const indexInfo = listData.indexes.find((idx) => idx.name === PINECONE_INDEX);
  const indexHost = indexInfo.host;
  console.log(`  Index host: ${indexHost}`);

  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} vectors`);

    const response = await fetch(`https://${indexHost}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.PINECONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        namespace: PINECONE_NAMESPACE,
        vectors: batch,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinecone upsert failed: ${response.status} ${errorText}`);
    }

    console.log(`  Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(vectors.length / BATCH_SIZE)} (${batch.length} vectors)`);
  }

  console.log('Pinecone indexing complete!');
  console.log(`   Index: ${PINECONE_INDEX}`);
  console.log(`   Namespace: ${PINECONE_NAMESPACE}`);
  console.log(`   Total vectors: ${vectors.length}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
