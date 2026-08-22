#!/usr/bin/env node
/**
 * Generate `src/types/database.ts` by introspecting the local database built by
 * scripts/local-db/apply.sh.
 *
 * This exists because the Supabase CLI needs Docker, which is not always
 * available. The output is shaped like `supabase gen types typescript`, so it
 * can be replaced by that command verbatim once the CLI is set up:
 *
 *   supabase gen types typescript --local > src/types/database.ts
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const DB = process.env.PGDATABASE ?? 'bdoor_test';
const HOST = process.env.PGHOST ?? '/tmp';
const PORT = process.env.PGPORT ?? '55432';
const USER = process.env.PGUSER ?? 'postgres';
const SCHEMAS = ['public'];

function query(sql) {
  const out = execFileSync(
    'psql',
    ['-h', HOST, '-p', PORT, '-U', USER, '-d', DB, '-tAqc', sql],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return out.trim() ? JSON.parse(out) : [];
}

const TYPE_MAP = {
  uuid: 'string',
  text: 'string',
  citext: 'string',
  varchar: 'string',
  bpchar: 'string',
  name: 'string',
  int2: 'number',
  int4: 'number',
  int8: 'number',
  float4: 'number',
  float8: 'number',
  numeric: 'number',
  bool: 'boolean',
  json: 'Json',
  jsonb: 'Json',
  date: 'string',
  timestamp: 'string',
  timestamptz: 'string',
  time: 'string',
  timetz: 'string',
  interval: 'string',
  bytea: 'string',
};

const enums = query(`
  select coalesce(json_agg(row_to_json(x) order by x.name), '[]'::json) from (
    select t.typname as name,
           array_agg(e.enumlabel order by e.enumsortorder) as labels
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
    group by t.typname
  ) x;
`);

const enumNames = new Set(enums.map((e) => e.name));

const columns = query(`
  select coalesce(json_agg(row_to_json(x) order by x.table_name, x.ordinal_position), '[]'::json) from (
    select c.relname as table_name,
           c.relkind as kind,
           a.attname as column_name,
           a.attnum as ordinal_position,
           a.attnotnull as not_null,
           format_type(a.atttypid, a.atttypmod) as formatted,
           t.typname as type_name,
           t.typcategory as type_category,
           (pg_get_expr(d.adbin, d.adrelid) is not null) as has_default,
           a.attidentity <> '' as is_identity,
           et.typname as elem_type_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    join pg_type t on t.oid = a.atttypid
    left join pg_type et on et.oid = t.typelem
    left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
    where n.nspname = 'public' and c.relkind in ('r', 'v')
    order by c.relname, a.attnum
  ) x;
`);

function tsType(col) {
  const isArray = col.type_category === 'A';
  const base = isArray ? col.elem_type_name : col.type_name;
  let ts;
  if (enumNames.has(base)) {
    ts = `Database["public"]["Enums"]["${base}"]`;
  } else {
    ts = TYPE_MAP[base] ?? 'unknown';
  }
  return isArray ? `${ts}[]` : ts;
}

const byTable = new Map();
for (const col of columns) {
  if (!byTable.has(col.table_name)) byTable.set(col.table_name, { kind: col.kind, cols: [] });
  byTable.get(col.table_name).cols.push(col);
}

const tableNames = [...byTable.entries()].filter(([, v]) => v.kind === 'r').map(([k]) => k).sort();
const viewNames = [...byTable.entries()].filter(([, v]) => v.kind === 'v').map(([k]) => k).sort();

function renderRelation(name, { cols }, { insertable }) {
  const row = cols
    .map((c) => `          ${JSON.stringify(c.column_name)}: ${tsType(c)}${c.not_null ? '' : ' | null'}`)
    .join('\n');

  if (!insertable) {
    return `      ${JSON.stringify(name)}: {\n        Row: {\n${row}\n        }\n        Relationships: []\n      }`;
  }

  const insert = cols
    .map((c) => {
      const optional = !c.not_null || c.has_default || c.is_identity;
      return `          ${JSON.stringify(c.column_name)}${optional ? '?' : ''}: ${tsType(c)}${c.not_null ? '' : ' | null'}`;
    })
    .join('\n');

  const update = cols
    .map((c) => `          ${JSON.stringify(c.column_name)}?: ${tsType(c)}${c.not_null ? '' : ' | null'}`)
    .join('\n');

  return `      ${JSON.stringify(name)}: {\n        Row: {\n${row}\n        }\n        Insert: {\n${insert}\n        }\n        Update: {\n${update}\n        }\n        Relationships: []\n      }`;
}

const tablesBlock = tableNames
  .map((n) => renderRelation(n, byTable.get(n), { insertable: true }))
  .join('\n');
const viewsBlock = viewNames.length
  ? viewNames.map((n) => renderRelation(n, byTable.get(n), { insertable: false })).join('\n')
  : '';

const enumsBlock = enums
  .map((e) => `      ${JSON.stringify(e.name)}: ${e.labels.map((l) => JSON.stringify(l)).join(' | ')}`)
  .join('\n');

const out = `// AUTO-GENERATED — DO NOT EDIT BY HAND.
//
// Regenerate with either of:
//   supabase gen types typescript --local > src/types/database.ts
//   node scripts/local-db/gen-types.mjs        (introspects the local test DB)
//
// The \`compliance\` schema is deliberately absent: it is not exposed through the
// Data API, and application code must reach it only through server-side helpers.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
${tablesBlock}
    }
    Views: {
${viewsBlock}
    }
    Functions: Record<string, never>
    Enums: {
${enumsBlock}
    }
    CompositeTypes: Record<string, never>
  }
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Views<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
`;

writeFileSync(new URL('../../src/types/database.ts', import.meta.url), out);
console.log(`Generated ${tableNames.length} tables, ${viewNames.length} views, ${enums.length} enums.`);
