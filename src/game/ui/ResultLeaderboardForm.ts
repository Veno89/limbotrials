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
  ) {
    this.root = document.createElement('form');
    this.root.className = 'result-name-form';
    this.root.innerHTML = `
      <label for="result-leaderboard-name">CARVE YOUR NAME INTO THE LEDGER</label>
      <div>
        <input
          id="result-leaderboard-name"
          maxlength="24"
          autocomplete="nickname"
          placeholder="Enter leaderboard name"
        />
        <button type="submit">SUBMIT SCORE</button>
      </div>
    `;
    this.input = this.root.querySelector('input')!;
    this.button = this.root.querySelector('button')!;
    this.input.value = loadPlayerName();
    this.updateButton();

    this.input.addEventListener('input', () => {
      this.input.value = savePlayerName(this.input.value);
      this.updateButton();
    });
    this.root.addEventListener('submit', (event) => {
      event.preventDefault();
      const playerName = parsePlayerName(this.input.value);
      if (!playerName) {
        this.updateButton();
        return;
      }
      this.setPending(true);
      void session.submit(playerName).then((result) => {
        if (this.root.isConnected) {
          this.setPending(false);
          onResult(result);
        }
      });
    });

    scene.add.dom(640, 545, this.root);
  }

  destroy(): void {
    this.root.remove();
  }

  private setPending(pending: boolean): void {
    this.input.disabled = pending;
    this.button.disabled = pending;
    this.button.textContent = pending ? 'RECORDING...' : 'SUBMIT SCORE';
  }

  private updateButton(): void {
    this.button.disabled = !parsePlayerName(this.input.value);
  }
}
