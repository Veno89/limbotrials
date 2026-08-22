import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const MAX_LOCAL_RUN_BYTES = 350_000;
const FORMAT_VERSION = 1;

export async function saveRunData(payload, options) {
  const parsed = parseIncomingRun(payload);
  if (!parsed) {
    throw new Error('Invalid run data.');
  }

  const dataDirectory = join(options.rootDir, 'playtest-data');
  const runsDirectory = join(dataDirectory, 'runs');
  await mkdir(runsDirectory, { recursive: true });

  const existingFiles = await listJsonFiles(runsDirectory);
  const duplicate = existingFiles.find((file) => file.endsWith(`_${parsed.runId}.json`));
  if (duplicate) {
    const indexCount = await rebuildRunIndexes(options);
    return {
      filePath: toWorkspacePath(options.rootDir, join(runsDirectory, duplicate)),
      duplicate: true,
      indexCount,
    };
  }

  const savedAt = (options.now ?? new Date()).toISOString();
  const result = parsed.summary.victory ? 'victory' : 'defeat';
  const character = safeSegment(parsed.summary.characterId, 'unknown-character');
  const preset = safeSegment(parsed.summary.balance.presetId, 'unknown-mode');
  const commit = safeSegment(options.gitCommit ?? 'unknown', 'unknown');
  const timestamp = savedAt.replace(/[:.]/g, '-');
  const fileName = `${timestamp}_${commit}_${character}_${result}_${preset}_${parsed.runId}.json`;
  const filePath = join(runsDirectory, fileName);
  const record = {
    formatVersion: FORMAT_VERSION,
    runId: parsed.runId,
    savedAt,
    gitCommit: options.gitCommit ?? 'unknown',
    summary: parsed.summary,
  };

  await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  const indexCount = await rebuildRunIndexes(options);
  return {
    filePath: toWorkspacePath(options.rootDir, filePath),
    duplicate: false,
    indexCount,
  };
}

export async function rebuildRunIndexes(options) {
  const dataDirectory = join(options.rootDir, 'playtest-data');
  const runsDirectory = join(dataDirectory, 'runs');
  await mkdir(runsDirectory, { recursive: true });

  const files = await listJsonFiles(runsDirectory);
  const records = [];
  for (const file of files) {
    const filePath = join(runsDirectory, file);
    const parsed = await readRunFile(filePath, file);
    if (parsed) {
      records.push(parsed);
    }
  }
  records.sort((left, right) => left.savedAt.localeCompare(right.savedAt));

  const header = [
    'run_id',
    'saved_at',
    'git_commit',
    'file',
    'character',
    'result',
    'preset',
    'time_seconds',
    'level',
    'kills',
    'souls',
    'curse',
    'damage',
    'top_weapon',
  ];
  const rows = records.map((record) => compactRow(record));
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const jsonl = records.map((record) => JSON.stringify(record)).join('\n');

  await writeFile(join(dataDirectory, 'index.csv'), `${csv}\n`, 'utf8');
  await writeFile(join(dataDirectory, 'runs.jsonl'), jsonl ? `${jsonl}\n` : '', 'utf8');
  return records.length;
}

async function readRunFile(filePath, fileName) {
  try {
    const value = JSON.parse(await readFile(filePath, 'utf8'));
    const wrapped = isRecord(value) && isRecord(value.summary) ? value : undefined;
    const summary = wrapped?.summary ?? value;
    if (!isRunSummary(summary)) {
      return undefined;
    }
    const fileStats = await stat(filePath);
    return {
      formatVersion: FORMAT_VERSION,
      runId: typeof wrapped?.runId === 'string' ? wrapped.runId : `manual-${fileName}`,
      savedAt: typeof wrapped?.savedAt === 'string' ? wrapped.savedAt : fileStats.mtime.toISOString(),
      gitCommit: typeof wrapped?.gitCommit === 'string' ? wrapped.gitCommit : 'unknown',
      file: fileName,
      summary,
    };
  } catch {
    return undefined;
  }
}

function compactRow(record) {
  const summary = record.summary;
  const topWeapon = [...summary.weaponResults].sort((left, right) => right.damage - left.damage)[0];
  return [
    record.runId,
    record.savedAt,
    record.gitCommit,
    record.file,
    summary.characterId,
    summary.victory ? 'victory' : 'defeat',
    summary.balance.presetId,
    Math.round(summary.elapsedMs / 1000),
    summary.level,
    summary.kills,
    summary.souls,
    summary.curse.level,
    Math.round(summary.balance.totalDamageDealt),
    topWeapon?.id ?? '',
  ];
}

function parseIncomingRun(value) {
  if (
    !isRecord(value) ||
    value.formatVersion !== FORMAT_VERSION ||
    typeof value.runId !== 'string' ||
    !/^[a-zA-Z0-9-]{8,64}$/.test(value.runId) ||
    !isRunSummary(value.summary)
  ) {
    return undefined;
  }
  return { runId: value.runId, summary: value.summary };
}

function isRunSummary(value) {
  return (
    isRecord(value) &&
    typeof value.victory === 'boolean' &&
    typeof value.characterId === 'string' &&
    /^[a-z0-9-]{1,64}$/.test(value.characterId) &&
    isFiniteNumber(value.elapsedMs, 0, 24 * 60 * 60 * 1000) &&
    Number.isInteger(value.level) &&
    value.level >= 1 &&
    Number.isInteger(value.kills) &&
    value.kills >= 0 &&
    Number.isInteger(value.souls) &&
    value.souls >= 0 &&
    Array.isArray(value.weaponResults) &&
    value.weaponResults.length <= 16 &&
    isRecord(value.curse) &&
    isFiniteNumber(value.curse.level, 0, 100_000) &&
    isRecord(value.balance) &&
    typeof value.balance.presetId === 'string' &&
    /^[a-z0-9-]{1,64}$/.test(value.balance.presetId) &&
    isFiniteNumber(value.balance.totalDamageDealt, 0, Number.MAX_SAFE_INTEGER)
  );
}

function isFiniteNumber(value, minimum, maximum) {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function listJsonFiles(directory) {
  try {
    return (await readdir(directory)).filter((file) => file.endsWith('.json')).sort();
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function safeSegment(value, fallback) {
  const safe = String(value).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || fallback;
}

function csvCell(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toWorkspacePath(rootDir, filePath) {
  return relative(rootDir, filePath).replaceAll('\\', '/');
}
