import type { Pattern } from "../../schema.js";

export const aiEmbeddings: Pattern = {
  name: "AI Embeddings",
  slug: "ai-embeddings",
  description:
    "Vector embeddings for semantic search and RAG applications using Upstash Vector. Includes embedding generation, storage, and similarity search.",
  category: "ai",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "intermediate",
  tags: ["ai", "embeddings", "vector", "rag", "semantic-search", "upstash"],
  alternatives: [
    {
      name: "Pinecone",
      description: "Industry-leading vector database with advanced features",
      url: "https://pinecone.io",
      pricingTier: "freemium",
      pricingNote: "Free tier with 1 index, 100K vectors",
      advantages: [
        "Industry standard",
        "Advanced metadata filtering",
        "Serverless and pod-based options",
      ],
    },
    {
      name: "Weaviate",
      description: "Open-source vector database with GraphQL API",
      url: "https://weaviate.io",
      pricingTier: "freemium",
      advantages: [
        "Open source and self-hostable",
        "Built-in vectorization modules",
        "GraphQL and REST APIs",
      ],
    },
    {
      name: "Chroma",
      description: "Open-source embedding database for AI applications",
      url: "https://trychroma.com",
      pricingTier: "free",
      advantages: ["Fully open source", "Simple Python/JS SDK", "Local-first development"],
    },
    {
      name: "pgvector",
      description: "Vector similarity search for PostgreSQL",
      url: "https://github.com/pgvector/pgvector",
      pricingTier: "free",
      advantages: ["Use existing PostgreSQL", "No additional infrastructure", "SQL-based queries"],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/ai/embeddings.ts",
        content: `import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

// Default embedding model
const embeddingModel = openai.embedding("text-embedding-3-small");

// Generate embedding for a single text
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

// Generate embeddings for multiple texts (batched)
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });
  return embeddings;
}

// Chunk text for embedding (handles long documents).
// maxChunkSize and overlap are measured in characters.
export function chunkText(
  text: string,
  options: {
    maxChunkSize?: number;
    overlap?: number;
  } = {}
): string[] {
  const { maxChunkSize = 1000, overlap = 200 } = options;
  const chunks: string[] = [];

  // Tail of a chunk to prepend to the next one, so context isn't lost at
  // boundaries. Cut on a word boundary within the last \`overlap\` characters.
  const overlapTail = (chunk: string): string => {
    if (overlap <= 0 || chunk.length <= overlap) return chunk;
    const tail = chunk.slice(-overlap);
    const firstSpace = tail.indexOf(" ");
    return firstSpace === -1 ? tail : tail.slice(firstSpace + 1);
  };

  // Flush the current chunk and start a new one seeded with the overlap tail.
  let currentChunk = "";
  const flush = () => {
    if (!currentChunk) return;
    chunks.push(currentChunk);
    currentChunk = overlapTail(currentChunk);
  };

  // Append a unit (paragraph or sentence) to the current chunk, flushing first
  // if it would overflow.
  const append = (unit: string, separator: string) => {
    const candidate = currentChunk ? currentChunk + separator + unit : unit;
    if (candidate.length <= maxChunkSize) {
      currentChunk = candidate;
    } else {
      flush();
      currentChunk = currentChunk ? currentChunk + separator + unit : unit;
    }
  };

  for (const paragraph of text.split(/\\n\\n+/)) {
    if (paragraph.length <= maxChunkSize) {
      append(paragraph, "\\n\\n");
    } else {
      // Paragraph alone exceeds the limit — break it into sentences.
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) ?? [paragraph];
      for (const sentence of sentences) {
        append(sentence.trim(), " ");
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}
`,
      },
      {
        path: "lib/ai/vector-store.ts",
        content: `import { Index } from "@upstash/vector";
import { generateEmbedding, generateEmbeddings } from "./embeddings";

// Initialize Upstash Vector index
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata?: Record<string, unknown>;
}

// Upsert a single document
export async function upsertDocument(doc: VectorDocument): Promise<void> {
  const embedding = await generateEmbedding(doc.content);

  await index.upsert({
    id: doc.id,
    vector: embedding,
    metadata: {
      content: doc.content,
      ...doc.metadata,
    },
  });
}

// Upsert multiple documents (batched for efficiency)
export async function upsertDocuments(docs: VectorDocument[]): Promise<void> {
  const contents = docs.map((d) => d.content);
  const embeddings = await generateEmbeddings(contents);

  const vectors = docs.map((doc, i) => ({
    id: doc.id,
    vector: embeddings[i],
    metadata: {
      content: doc.content,
      ...doc.metadata,
    },
  }));

  // Batch upsert (Upstash supports up to 1000 per request)
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
  }
}

// Semantic search
export async function search(
  query: string,
  options: {
    topK?: number;
    filter?: string;
    includeMetadata?: boolean;
  } = {}
): Promise<SearchResult[]> {
  const { topK = 5, filter, includeMetadata = true } = options;

  const queryEmbedding = await generateEmbedding(query);

  const results = await index.query({
    vector: queryEmbedding,
    topK,
    filter,
    includeMetadata,
  });

  return results.map((r) => ({
    id: r.id as string,
    score: r.score,
    content: (r.metadata?.content as string) || "",
    metadata: r.metadata as Record<string, unknown> | undefined,
  }));
}

// Delete document by ID
export async function deleteDocument(id: string): Promise<void> {
  await index.delete(id);
}

// Delete multiple documents
export async function deleteDocuments(ids: string[]): Promise<void> {
  await index.delete(ids);
}

// Get index stats
export async function getIndexStats() {
  return await index.info();
}
`,
      },
      {
        path: "lib/ai/rag.ts",
        content: `import { streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { search } from "./vector-store";

// RAG (Retrieval-Augmented Generation) utilities
// Uses OpenAI by default. Swap this for your own provider/model selection.
const model = openai("gpt-4o");

export interface RAGOptions {
  topK?: number;
  systemPrompt?: string;
  includeContext?: boolean;
}

// Generate response with context from vector store
export async function ragGenerate(
  query: string,
  options: RAGOptions = {}
) {
  const { topK = 5, includeContext = true } = options;

  // Retrieve relevant documents
  const results = await search(query, { topK });

  // Build context from search results
  const context = results
    .map((r, i) => \`[\${i + 1}] \${r.content}\`)
    .join("\\n\\n");

  const systemPrompt = options.systemPrompt ?? \`You are a helpful assistant.
Use the following context to answer the user's question.
If the context doesn't contain relevant information, say so.

Context:
\${context}\`;

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: query,
  });

  return {
    answer: text,
    sources: includeContext ? results : undefined,
  };
}

// Stream RAG response
export async function ragStream(
  query: string,
  options: RAGOptions = {}
) {
  const { topK = 5 } = options;

  const results = await search(query, { topK });

  const context = results
    .map((r, i) => \`[\${i + 1}] \${r.content}\`)
    .join("\\n\\n");

  const systemPrompt = options.systemPrompt ?? \`You are a helpful assistant.
Use the following context to answer the user's question.
If the context doesn't contain relevant information, say so.
Cite sources using [1], [2], etc. when referencing the context.

Context:
\${context}\`;

  const result = streamText({
    model,
    system: systemPrompt,
    prompt: query,
  });

  return {
    stream: result,
    sources: results,
  };
}
`,
      },
      {
        path: "app/api/search/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/ai/vector-store";

export async function POST(req: NextRequest) {
  try {
    const { query, topK = 5, filter } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const results = await search(query, { topK, filter });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# OpenAI for embeddings (https://platform.openai.com/api-keys)
OPENAI_API_KEY="sk-..."

# Upstash Vector (https://console.upstash.com/vector)
UPSTASH_VECTOR_REST_URL="https://your-vector.upstash.io"
UPSTASH_VECTOR_REST_TOKEN="your-token"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [
      { name: "ai", version: "^6.0.0" },
      { name: "@ai-sdk/openai", version: "^3.0.0" },
      { name: "@upstash/vector", version: "^1.2.0" },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
