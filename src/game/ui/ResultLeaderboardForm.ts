import Phaser from 'phaser';
import type { LocalRunArchiveResult } from '../../analytics/localRunArchiveService';
import type { RunSubmissionSession } from '../../analytics/runSubmissionService';
import { loadPlayerName, savePlayerName } from '../../leaderboard/playerIdentity';
import { parsePlayerName } from '../../leaderboard/scoreSubmissionRules';
import type { RunSummary } from '../types/gameTypes';
import { copyRunSummaryJson, downloadRunSummaryJson } from './runJsonExport';

export class ResultLeaderboardForm {
  private readonly root: HTMLFormElement;
  private readonly input?: HTMLInputElement;
  private readonly uploadButton?: HTMLButtonElement;
  private readonly copyButton: HTMLButtonElement;
  private readonly downloadButton: HTMLButtonElement;
  private readonly actionStatus: HTMLParagraphElement;
  private readonly archiveStatus?: HTMLParagraphElement;

  constructor(
    scene: Phaser.Scene,
    summary: RunSummary,
    session: RunSubmissionSession | undefined,
    localArchive: Promise<LocalRunArchiveResult> | undefined,
    x = 640,
    y = 510,
  ) {
    this.root = document.createElement('form');
    this.root.className = 'result-name-form';
    this.root.innerHTML = session
      ? `
        <label>RUN DATA</label>
        <div class="result-name-form__row">
          <input
            id="result-leaderboard-name"
            aria-label="Leaderboard name"
            maxlength="24"
            autocomplete="nickname"
            placeholder="Enter name"
          />
          <button type="submit" data-action="upload">UPLOAD RUN</button>
          <button type="button" data-action="copy">COPY JSON</button>
          <button type="button" data-action="download">DOWNLOAD JSON</button>
        </div>
        <p class="result-name-form__help">Upload is optional and needs a name. Copy or Download keeps the complete report locally.</p>
        ${localArchive ? '<p class="result-name-form__archive" data-role="archive">AUTO-SAVE: SAVING TO PLAYTEST-DATA...</p>' : ''}
        <p class="result-name-form__status" data-role="status" aria-live="polite"></p>
      `
      : `
        <label>RUN DATA</label>
        <div class="result-name-form__row result-name-form__row--local">
          <button type="button" data-action="copy">COPY JSON</button>
          <button type="button" data-action="download">DOWNLOAD JSON</button>
        </div>
        <p class="result-name-form__help">Lab runs stay local. Copy puts the report on your clipboard; Download saves a JSON file.</p>
        ${localArchive ? '<p class="result-name-form__archive" data-role="archive">AUTO-SAVE: SAVING TO PLAYTEST-DATA...</p>' : ''}
        <p class="result-name-form__status" data-role="status" aria-live="polite"></p>
      `;
    this.input = this.root.querySelector('input') ?? undefined;
    this.uploadButton = this.root.querySelector<HTMLButtonElement>('[data-action="upload"]') ?? undefined;
    this.copyButton = this.root.querySelector<HTMLButtonElement>('[data-action="copy"]')!;
    this.downloadButton = this.root.querySelector<HTMLButtonElement>('[data-action="download"]')!;
    this.actionStatus = this.root.querySelector<HTMLParagraphElement>('[data-role="status"]')!;
    this.archiveStatus = this.root.querySelector<HTMLParagraphElement>('[data-role="archive"]') ?? undefined;

    if (this.input && this.uploadButton && session) {
      this.input.value = loadPlayerName();
      this.updateButton();
      this.input.addEventListener('input', () => {
        this.updateButton();
      });
      this.root.addEventListener('submit', (event) => {
        event.preventDefault();
        const playerName = parsePlayerName(this.input!.value);
        if (!playerName) {
          this.updateButton();
          return;
        }
        this.input!.value = savePlayerName(playerName);
        this.setPending(true);
        void session.submit(playerName).then((result) => {
          if (this.root.isConnected) {
            if (result.leaderboardRecorded) {
              this.setRecorded();
            } else {
              this.setPending(false);
            }
            this.showActionResult(result.message, result.status === 'failed' ? 'failed' : 'success');
          }
        });
      });
    }

    this.copyButton.addEventListener('click', () => {
      this.copyButton.disabled = true;
      this.copyButton.textContent = 'COPYING...';
      void copyRunSummaryJson(summary).then((copied) => {
        if (!this.root.isConnected) {
          return;
        }
        this.copyButton.disabled = false;
        this.copyButton.textContent = copied ? 'JSON COPIED' : 'COPY FAILED';
        this.showActionResult(
          copied ? 'Full run JSON copied. It is ready to paste.' : 'Could not copy. Use Download instead.',
          copied ? 'success' : 'failed',
        );
      });
    });

    this.downloadButton.addEventListener('click', () => {
      const fileName = downloadRunSummaryJson(summary);
      this.downloadButton.textContent = fileName ? 'JSON DOWNLOADED' : 'DOWNLOAD FAILED';
      this.showActionResult(
        fileName ? `Downloaded ${fileName}` : 'Could not download. Use Copy JSON instead.',
        fileName ? 'success' : 'failed',
      );
    });

    if (localArchive && this.archiveStatus) {
      void localArchive.then((result) => {
        if (!this.root.isConnected || !this.archiveStatus) {
          return;
        }
        this.archiveStatus.textContent = result.status === 'saved'
          ? `AUTO-SAVED: ${result.filePath}`
          : 'AUTO-SAVE FAILED: USE DOWNLOAD';
        this.archiveStatus.classList.toggle('result-name-form__archive--failed', result.status === 'failed');
        this.archiveStatus.title = result.message;
      });
    }

    scene.add.dom(x, y, this.root).setOrigin(0.5);
  }

  destroy(): void {
    this.root.remove();
  }

  private setPending(pending: boolean): void {
    if (!this.input || !this.uploadButton) {
      return;
    }
    this.input.disabled = pending;
    this.uploadButton.disabled = pending;
    this.uploadButton.textContent = pending ? 'UPLOADING...' : 'UPLOAD RUN';
  }

  private setRecorded(): void {
    if (!this.input || !this.uploadButton) {
      return;
    }
    this.root.classList.add('result-name-form--recorded');
    this.input.disabled = true;
    this.uploadButton.disabled = true;
    this.uploadButton.textContent = 'RUN UPLOADED';
  }

  private updateButton(): void {
    if (this.input && this.uploadButton) {
      this.uploadButton.disabled = !parsePlayerName(this.input.value);
    }
  }

  private showActionResult(message: string, status: 'success' | 'failed'): void {
    this.actionStatus.textContent = message;
    this.actionStatus.classList.toggle('result-name-form__status--failed', status === 'failed');
  }
}
