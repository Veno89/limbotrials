import type { RunSummary } from '../game/types/gameTypes';

export interface LocalRunArchiveResult {
  status: 'saved' | 'failed';
  message: string;
  filePath?: string;
  indexCount?: number;
}

interface ArchiveResponse {
  filePath?: unknown;
  indexCount?: unknown;
  error?: unknown;
}

export async function archiveRunLocally(
  summary: RunSummary,
  fetcher: typeof fetch = fetch,
  runId: string = crypto.randomUUID(),
): Promise<LocalRunArchiveResult> {
  try {
    const response = await fetcher('/__dev/playtest-runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ formatVersion: 1, runId, summary }),
    });
    const result = await readResponse(response);
    if (!response.ok || typeof result.filePath !== 'string') {
      return {
        status: 'failed',
        message: typeof result.error === 'string'
          ? result.error
          : 'Automatic save unavailable. Use Download JSON instead.',
      };
    }
    return {
      status: 'saved',
      filePath: result.filePath,
      ...(typeof result.indexCount === 'number' ? { indexCount: result.indexCount } : {}),
      message: `Saved automatically: ${result.filePath}`,
    };
  } catch {
    return {
      status: 'failed',
      message: 'Automatic save unavailable. Use Download JSON instead.',
    };
  }
}

async function readResponse(response: Response): Promise<ArchiveResponse> {
  try {
    return await response.json() as ArchiveResponse;
  } catch {
    return {};
  }
}
