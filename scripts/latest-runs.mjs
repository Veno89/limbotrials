import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Add them to the ignored .env file before querying analytics.',
  );
  process.exit(1);
}

const full = process.argv.includes('--full');
const limit = parseLimit(readArgument('--limit') ?? '5');
const runId = readArgument('--run-id');
const columns = full
  ? '*'
  : [
      'run_id',
      'created_at',
      'player_name',
      'character_id',
      'victory',
      'survival_ms',
      'enemies_killed',
      'damage_dealt',
      'level_reached',
      'souls_collected',
    ].join(',');

const client = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

let query = client
  .from('run_analytics')
  .select(columns)
  .order('created_at', { ascending: false })
  .limit(limit);

if (runId) {
  query = query.eq('run_id', runId);
}

const { data, error } = await query;

if (error) {
  console.error(`Supabase analytics query failed (${error.code}): ${error.message}`);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));

function readArgument(name) {
  const prefix = `${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function parseLimit(rawLimit) {
  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    console.error('--limit must be an integer between 1 and 100.');
    process.exit(1);
  }
  return parsed;
}
