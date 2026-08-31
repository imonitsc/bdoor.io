#!/usr/bin/env node
/**
 * Ask bdoor AI retrieval bench: the old serial hybrid path vs the new
 * parallel split path, against a real local Postgres.
 *
 * What is measured directly: execution time of ai_search_knowledge (hybrid),
 * ai_search_keyword and ai_search_semantic over a seeded 80-chunk corpus.
 * What is modelled from those measurements: end-to-end pre-model latency for
 * the production topology, using a typical 350ms embedding call and the
 * network RTT between the Vercel function region and the ap-southeast-1
 * database (measured ~220ms from iad1, ~3ms from sin1). The eleven-stage
 * `ai.pipeline.timings` log line reports the true numbers per request once
 * deployed; this bench exists so the before/after claim rests on arithmetic
 * from measured parts, not vibes.
 *
 * Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres PGDATABASE=bdoor_test node scripts/ask-bench.mjs
 */
import pg from 'pg';

const client = new pg.Client({
  host: process.env.PGHOST ?? '/tmp',
  port: Number(process.env.PGPORT ?? 55432),
  user: process.env.PGUSER ?? 'postgres',
  database: process.env.PGDATABASE ?? 'bdoor_test',
});
await client.connect();
await client.query('begin');

// --- Seed a corpus comparable to the production one (dozens of chunks). ----
const vector = (first) =>
  `[${Array.from({ length: 768 }, (_, i) => (i === 0 ? first : i === 1 ? Math.sqrt(1 - first * first) : 0)).join(',')}]`;

for (let s = 0; s < 40; s += 1) {
  const { rows } = await client.query(
    `insert into public.ai_knowledge_sources
       (slug, title, country, locale, source_type, body, status, access_scope, effective_from, authority_tier)
     values ($1, $2, 'bd', 'en', 'government_reference', $3, 'published', 'public', '2020-01-01', $4)
     returning id`,
    [
      `bench-${s}`,
      `Bench source ${s}`,
      `Trade licence renewal fees, VAT registration and company filings, sample text block ${s}.`,
      (s % 6) + 1,
    ],
  );
  for (let c = 0; c < 2; c += 1) {
    await client.query(
      `insert into public.ai_knowledge_chunks (source_id, chunk_index, content, embedding)
       values ($1, $2, $3, $4::extensions.vector)`,
      [
        rows[0].id,
        c,
        `Renewal of a trade licence and the fee schedule, with VAT notes, block ${s}-${c}.`,
        vector(0.3 + ((s * 2 + c) % 60) / 100),
      ],
    );
  }
}

const QUERY = 'trade licence renewal fee';
const EMB = vector(0.9);

async function timeMedian(label, fn, runs = 25) {
  const samples = [];
  await fn(); // warm
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(runs / 2)];
  const p95 = samples[Math.floor(runs * 0.95)];
  console.log(`${label.padEnd(22)} median ${median.toFixed(1)}ms  p95 ${p95.toFixed(1)}ms`);
  return median;
}

const hybrid = await timeMedian('hybrid (old SQL)', () =>
  client.query(
    `select * from public.ai_search_knowledge($1::extensions.vector, $2, 'en', 'bd', 8)`,
    [EMB, QUERY],
  ),
);
const keyword = await timeMedian('keyword (new)', () =>
  client.query(`select * from public.ai_search_keyword($1, 'bd', 40)`, [QUERY]),
);
const semantic = await timeMedian('semantic (new)', () =>
  client.query(`select * from public.ai_search_semantic($1::extensions.vector, 'bd', 40)`, [EMB]),
);

await client.query('rollback');
await client.end();

// --- Model the production totals from the measured parts. ------------------
const EMBED_MS = 350; // typical gemini-embedding-001 call
for (const [region, rtt] of [
  ['iad1 (before)', 220],
  ['sin1 (after)', 3],
]) {
  // OLD pipeline: 6 serial DB round-trips (auth, conversation select+insert
  // amortised to 1, history, user message, budget, hybrid rpc) after the
  // embedding completes.
  const oldTotal = EMBED_MS + 6 * rtt + hybrid + 5 * 2;
  // NEW pipeline: auth (route) + the parallel block. The retrieval leg is
  // max(keyword, embed+semantic); conversation+history is 2 serial trips;
  // budget 1; the user-message write no longer blocks.
  const retrievalLeg = Math.max(keyword + rtt, EMBED_MS + semantic + rtt);
  const convLeg = 2 * (rtt + 2);
  const budgetLeg = rtt + 2;
  const newTotal = rtt /* auth */ + Math.max(retrievalLeg, convLeg, budgetLeg);
  console.log(
    `${region.padEnd(14)} modelled pre-model latency: old ${Math.round(oldTotal)}ms → new ${Math.round(newTotal)}ms`,
  );
}
