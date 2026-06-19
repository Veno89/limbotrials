import Phaser from 'phaser';
import type { RunSubmissionResult, RunSubmissionSession } from '../../analytics/runSubmissionService';
import { loadPlayerName, savePlayerName } from '../../leaderboard/playerIdentity';
import { parsePlayerName } from '../../leaderboard/scoreSubmissionRules';

export class ResultLeaderboardForm {
  private readonly root: HTMLFormElement;
  private readonly input: HTMLInputElement;
  private readonly button: HTMLButtonElement;

  constructor(
    scene: Phaser.Scene,
    session: RunSubmissionSession,
    onResult: (result: RunSubmissionResult) => void,
    x = 640,
    y = 510,
  ) {
    this.root = document.createElement('form');
    this.root.className = 'result-name-form';
    this.root.innerHTML = `
      <label for="result-leaderboard-name">PUBLISH THIS RUN TO THE LEDGER</label>
      <div>
        <input
          id="result-leaderboard-name"
          maxlength="24"
          autocomplete="nickname"
          placeholder="Enter leaderboard name"
        />
        <button type="submit">PUBLISH SCORE</button>
      </div>
      <p>Private balance analytics are saved automatically. Publishing the score is optional.</p>
    `;
    this.input = this.root.querySelector('input')!;
    this.button = this.root.querySelector('button')!;
    this.input.value = loadPlayerName();
    this.updateButton();

    this.input.addEventListener('input', () => {
      this.updateButton();
    });
    this.root.addEventListener('submit', (event) => {
      event.preventDefault();
      const playerName = parsePlayerName(this.input.value);
      if (!playerName) {
        this.updateButton();
        return;
      }
      this.input.value = savePlayerName(playerName);
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

    scene.add.dom(x, y, this.root);
  }

  destroy(): void {
    this.root.remove();
  }

  private setPending(pending: boolean): void {
    this.input.disabled = pending;
    this.button.disabled = pending;
    this.button.textContent = pending ? 'PUBLISHING...' : 'PUBLISH SCORE';
  }

  private setRecorded(): void {
    this.root.classList.add('result-name-form--recorded');
    this.input.disabled = true;
    this.button.disabled = true;
    this.button.textContent = 'SCORE PUBLISHED';
  }

  private updateButton(): void {
    this.button.disabled = !parsePlayerName(this.input.value);
  }
}
