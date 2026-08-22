export const MAX_LOCAL_RUN_BYTES: number;

export interface RunDataStoreOptions {
  rootDir: string;
  gitCommit?: string;
  now?: Date;
}

export interface SavedRunDataResult {
  filePath: string;
  duplicate: boolean;
  indexCount: number;
}

export function saveRunData(payload: unknown, options: RunDataStoreOptions): Promise<SavedRunDataResult>;
export function rebuildRunIndexes(options: RunDataStoreOptions): Promise<number>;
