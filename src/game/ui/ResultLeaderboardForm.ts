import Phaser from 'phaser';
import type { RunSubmissionResult, RunSubmissionSession } from '../../analytics/runSubmissionService';
import { loadPlayerName, savePlayerName } from '../../leaderboard/playerIdentity';
import { parsePlayerName } from '../../leaderboard/scoreSubmissionRules';
import type { RunSummary } from '../types/gameTypes';
import { copyRunSummaryJson } from './runJsonExport';

export class ResultLeaderboardForm {
  private readonly root: HTMLFormElement;
  private readonly input?: HTMLInputElement;
  private readonly uploadButton?: HTMLButtonElement;
  private readonly copyButton: HTMLButtonElement;

  constructor(
    scene: Phaser.Scene,
    summary: RunSummary,
    session: RunSubmissionSession | undefined,
    onResult: (result: RunSubmissionResult) => void,
    onCopyResult: (copied: boolean) => void,
    x = 640,
    y = 510,
  ) {
    this.root = document.createElement('form');
    this.root.className = 'result-name-form';
    this.root.innerHTML = session
      ? `
        <label for="result-leaderboard-name">SAVE OR SHARE THIS RUN</label>
        <div class="result-name-form__row">
          <input
            id="result-leaderboard-name"
            maxlength="24"
            autocomplete="nickname"
            placeholder="Enter name"
          />
          <button type="submit" data-action="upload">UPLOAD RUN</button>
          <button type="button" data-action="copy">COPY RUN JSON</button>
        </div>
        <p>Upload publishes the score and balance data. Copy JSON stays local and includes the complete run report.</p>
      `
      : `
        <label>LOCAL RUN DATA</label>
        <div class="result-name-form__row result-name-form__row--local">
          <button type="button" data-action="copy">COPY RUN JSON</button>
        </div>
        <p>Lab runs cannot be uploaded, but their complete report can still be copied for analysis.</p>
      `;
    this.input = this.root.querySelector('input') ?? undefined;
    this.uploadButton = this.root.querySelector<HTMLButtonElement>('[data-action="upload"]') ?? undefined;
    this.copyButton = this.root.querySelector<HTMLButtonElement>('[data-action="copy"]')!;

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
            onResult(result);
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
        onCopyResult(copied);
      });
    });

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
}
