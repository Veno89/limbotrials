import type { RunSummary } from '../types/gameTypes';

interface ClipboardWriter {
  writeText(text: string): Promise<void>;
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
