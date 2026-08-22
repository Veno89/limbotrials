import type { RunSummary } from '../types/gameTypes';

interface ClipboardWriter {
  writeText(text: string): Promise<void>;
}

interface ObjectUrlFactory {
  createObjectURL(value: Blob): string;
  revokeObjectURL(url: string): void;
}

export function formatRunSummaryJson(summary: RunSummary): string {
  return JSON.stringify(summary, null, 2);
}

export async function copyRunSummaryJson(
  summary: RunSummary,
  clipboard: ClipboardWriter | null | undefined = getClipboard(),
  documentRef: Document | undefined = getDocument(),
): Promise<boolean> {
  let json: string;
  try {
    json = formatRunSummaryJson(summary);
  } catch {
    return false;
  }

  if (clipboard) {
    try {
      await clipboard.writeText(json);
      return true;
    } catch {
      // Fall through to the legacy copy path when clipboard permission is unavailable.
    }
  }

  return copyWithTextArea(json, documentRef);
}

export function buildRunJsonFileName(summary: RunSummary, now: Date = new Date()): string {
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const result = summary.victory ? 'victory' : 'defeat';
  const preset = safeFileSegment(summary.balance.presetId);
  return `${timestamp}_${safeFileSegment(summary.characterId)}_${result}_${preset}.json`;
}

export function downloadRunSummaryJson(
  summary: RunSummary,
  documentRef: Document | undefined = getDocument(),
  urlFactory: ObjectUrlFactory | undefined = getUrlFactory(),
  now: Date = new Date(),
): string | undefined {
  if (!documentRef?.body || !urlFactory) {
    return undefined;
  }

  const fileName = buildRunJsonFileName(summary, now);
  const blob = new Blob([`${formatRunSummaryJson(summary)}\n`], { type: 'application/json' });
  const objectUrl = urlFactory.createObjectURL(blob);
  const link = documentRef.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = 'none';
  documentRef.body.append(link);
  link.click();
  link.remove();
  urlFactory.revokeObjectURL(objectUrl);
  return fileName;
}

function copyWithTextArea(text: string, documentRef: Document | undefined): boolean {
  if (!documentRef?.body || typeof documentRef.execCommand !== 'function') {
    return false;
  }

  const textArea = documentRef.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  documentRef.body.append(textArea);
  textArea.select();

  try {
    return documentRef.execCommand('copy');
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
}

function getClipboard(): ClipboardWriter | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.clipboard;
}

function getDocument(): Document | undefined {
  return typeof document === 'undefined' ? undefined : document;
}

function getUrlFactory(): ObjectUrlFactory | undefined {
  return typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function' ? undefined : URL;
}

function safeFileSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}
