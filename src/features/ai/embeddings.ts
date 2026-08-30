import 'server-only';

import { embed, embedMany } from 'ai';

import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, LIMITS } from './config';

/**
 * Embeddings, through AI Gateway.
 *
 * The embedding model never speaks to the customer. Its only job is to decide
 * which approved paragraphs Claude is allowed to read, which is why a different
 * vendor here is not a violation of "Claude answers": nothing it produces
 * reaches the page.
 */

/**
 * gemini-embedding-001 returns 3072 dimensions by default and accepts an
 * `outputDimensionality` hint. It is a Matryoshka model, so the first 768
 * dimensions of a 3072-vector carry the same information as a natively-768
 * vector — but only once renormalised, because truncation destroys the unit
 * norm that cosine distance assumes.
 *
 * Both paths therefore end here: whatever the provider returns is trimmed to
 * exactly `EMBEDDING_DIMENSIONS` and renormalised. Documents and queries go
 * through the same function, which is the property that actually matters — a
 * query embedded differently from the corpus retrieves noise.
 */
export function normaliseVector(values: number[]): number[] {
  const trimmed =
    values.length > EMBEDDING_DIMENSIONS ? values.slice(0, EMBEDDING_DIMENSIONS) : values;

  if (trimmed.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding has ${trimmed.length} dimensions, expected ${EMBEDDING_DIMENSIONS}. ` +
        'Documents and queries must share one embedding space; re-index before serving.',
    );
  }

  let sumOfSquares = 0;
  for (const value of trimmed) sumOfSquares += value * value;
  const magnitude = Math.sqrt(sumOfSquares);
  // A zero vector cannot be normalised and cannot be compared; surfacing it is
  // better than silently storing something that matches everything equally.
  if (!Number.isFinite(magnitude) || magnitude === 0) {
    throw new Error('Embedding has zero magnitude and cannot be used for retrieval.');
  }

  return trimmed.map((value) => value / magnitude);
}

const providerOptions = {
  google: { outputDimensionality: EMBEDDING_DIMENSIONS, taskType: 'RETRIEVAL_DOCUMENT' },
} as const;

const queryProviderOptions = {
  google: { outputDimensionality: EMBEDDING_DIMENSIONS, taskType: 'RETRIEVAL_QUERY' },
} as const;

/** One query vector. Short timeout: retrieval blocks the customer's answer. */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
    maxRetries: LIMITS.maxRetries,
    abortSignal: AbortSignal.timeout(LIMITS.embeddingTimeoutMs),
    providerOptions: queryProviderOptions,
  });
  return normaliseVector(embedding);
}

/** Document vectors, for the indexer. Runs offline, so it may take its time. */
export async function embedDocuments(values: string[]): Promise<number[][]> {
  if (values.length === 0) return [];
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values,
    maxParallelCalls: 4,
    maxRetries: LIMITS.maxRetries,
    providerOptions,
  });
  return embeddings.map(normaliseVector);
}

/**
 * Chunking for the indexer. Paragraph-aligned rather than fixed-width: a
 * government fee split across two chunks is a fee the assistant will cite
 * wrongly, and paragraph boundaries keep the number with its label.
 */
export function chunkText(body: string, targetChars = 1_200, overlapChars = 150): string[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > targetChars) {
      chunks.push(current);
      // Carry the tail of the previous chunk so a sentence spanning the seam is
      // still retrievable from either side.
      const tail = current.slice(-overlapChars);
      current = `${tail}\n\n${paragraph}`;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.trim()) chunks.push(current);
  return chunks;
}
