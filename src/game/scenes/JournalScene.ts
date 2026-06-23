import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import {
  buildJournalEntries,
  JOURNAL_CATEGORIES,
  journalDiscoveryCount,
  type JournalEntryView,
} from '../systems/journalModel';
import {
  markJournalCategorySeen,
  unseenJournalCount,
} from '../systems/JournalDiscoverySystem';
import {
  MAIN_MENU_RETURN_TARGET,
  returnFromMenu,
  type MenuReturnTarget,
} from '../systems/MenuNavigationSystem';
import { loadSave, writeSave } from '../systems/SaveSystem';
import type { JournalDiscoveryKind, SaveData } from '../types/gameTypes';
import { addButton, addTitle } from '../ui/uiHelpers';

interface JournalSceneData {
  returnTarget?: MenuReturnTarget;
  resumeGame?: () => void;
}

const PAGE_SIZE = 6;

export class JournalScene extends Phaser.Scene {
  private save!: SaveData;
  private selectedCategory: JournalDiscoveryKind = 'weapons';
  private selectedEntry?: JournalEntryView;
  private page = 0;
  private content?: Phaser.GameObjects.Container;
  private returnTarget: MenuReturnTarget = MAIN_MENU_RETURN_TARGET;
  private resumeGameCallback?: () => void;

  constructor() {
    super('JournalScene');
  }

  init(data: JournalSceneData = {}): void {
    this.returnTarget = data.returnTarget ?? MAIN_MENU_RETURN_TARGET;
    this.resumeGameCallback = data.resumeGame;
  }

  create(): void {
    this.save = loadSave();
    this.markSelectedCategorySeen();
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.36);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.74).setOrigin(0);
    addTitle(this, GAME_WIDTH / 2, 58, 'THE LIMBO JOURNAL', 36);
    this.add
      .text(GAME_WIDTH / 2, 101, 'Known truths are carved here. The rest waits behind the veil.', {
        fontFamily: 'Cinzel, serif',
        fontSize: '14px',
        color: '#9fb1b8',
      })
      .setOrigin(0.5);

    addButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 42, 'RETURN', () => this.returnToPreviousScene(), 240);
    this.input.keyboard?.once('keydown-ESC', () => this.returnToPreviousScene());
    this.render();
  }

  private render(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0);
    this.renderCategoryTabs();
    const entries = buildJournalEntries(this.save, this.selectedCategory);
    this.selectedEntry ??= entries[0];
    if (!this.selectedEntry || !entries.some((entry) => entry.id === this.selectedEntry?.id)) {
      this.selectedEntry = entries[0];
    }
    this.page = Phaser.Math.Clamp(this.page, 0, Math.max(0, Math.ceil(entries.length / PAGE_SIZE) - 1));
    this.renderEntryList(entries);
    this.renderDetails(this.selectedEntry);
  }

  private renderCategoryTabs(): void {
    JOURNAL_CATEGORIES.forEach((category, index) => {
      const selected = category.id === this.selectedCategory;
      const y = 150 + index * 58;
      const count = journalDiscoveryCount(this.save, category.id);
      const unseen = unseenJournalCount(this.save, category.id);
      const background = this.add
        .rectangle(140, y, 220, 46, selected ? COLORS.panelLight : COLORS.panel, 0.96)
        .setStrokeStyle(2, selected ? COLORS.gold : COLORS.border)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(140, y - 6, category.label.toUpperCase(), {
          fontFamily: 'Cinzel, serif',
          fontSize: '14px',
          color: selected ? '#f0d8a0' : '#dce8ed',
        })
        .setOrigin(0.5);
      const progress = this.add
        .text(140, y + 12, unseen > 0 ? `NEW ${unseen}  /  ${count.known}/${count.total} KNOWN` : `${count.known}/${count.total} KNOWN`, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: unseen > 0 ? '#d8c49b' : '#8fa2aa',
        })
        .setOrigin(0.5);
      const newMarker = unseen > 0
        ? this.add.circle(230, y - 15, 6, COLORS.gold, 1).setStrokeStyle(1, 0xf0d8a0)
        : undefined;
      background.on('pointerdown', () => {
        this.selectedCategory = category.id;
        this.selectedEntry = undefined;
        this.page = 0;
        this.markSelectedCategorySeen();
        this.render();
      });
      this.content?.add(newMarker ? [background, label, progress, newMarker] : [background, label, progress]);
    });
  }

  private renderEntryList(entries: JournalEntryView[]): void {
    const category = JOURNAL_CATEGORIES.find((entry) => entry.id === this.selectedCategory)!;
    const start = this.page * PAGE_SIZE;
    const visible = entries.slice(start, start + PAGE_SIZE);
    this.content?.add(
      this.add
        .text(290, 126, `${category.label.toUpperCase()}  ${entries.filter((entry) => entry.discovered).length}/${entries.length}`, {
          fontFamily: 'Cinzel, serif',
          fontSize: '15px',
          color: '#d8c49b',
        })
        .setOrigin(0, 0.5),
    );

    if (visible.length === 0) {
      this.content?.add(
        this.add
          .text(500, 360, category.emptyHint, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            color: '#9fb1b8',
            align: 'center',
            wordWrap: { width: 410 },
          })
          .setOrigin(0.5),
      );
    }

    visible.forEach((entry, index) => {
      const y = 167 + index * 72;
      const selected = this.selectedEntry?.id === entry.id;
      const panel = this.add
        .rectangle(515, y, 450, 60, selected ? COLORS.panelLight : COLORS.panel, 0.95)
        .setStrokeStyle(2, selected ? COLORS.gold : COLORS.border)
        .setInteractive({ useHandCursor: true });
      const icon = this.add
        .image(318, y, entry.texture)
        .setDisplaySize(42, 42)
        .setAlpha(entry.discovered ? 1 : 0.22)
        .setTint(entry.discovered ? 0xffffff : 0x64717a);
      const title = this.add
        .text(350, y - 10, entry.title.toUpperCase(), {
          fontFamily: 'Cinzel, serif',
          fontSize: '15px',
          color: entry.discovered ? '#dce8ed' : '#7d8c93',
        })
        .setOrigin(0, 0.5);
      const subtitle = this.add
        .text(350, y + 12, entry.subtitle, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: entry.discovered ? '#8edfff' : '#6f7e85',
        })
        .setOrigin(0, 0.5);
      panel.on('pointerdown', () => {
        this.selectedEntry = entry;
        this.render();
      });
      this.content?.add([panel, icon, title, subtitle]);
    });

    const maxPage = Math.max(0, Math.ceil(entries.length / PAGE_SIZE) - 1);
    this.addPageButton(390, 620, 'PREV', () => {
      this.page = Math.max(0, this.page - 1);
      this.render();
    }, this.page > 0);
    this.addPageButton(640, 620, 'NEXT', () => {
      this.page = Math.min(maxPage, this.page + 1);
      this.render();
    }, this.page < maxPage);
    this.content?.add(
      this.add
        .text(515, 620, `${this.page + 1}/${maxPage + 1}`, {
          fontFamily: 'Cinzel, serif',
          fontSize: '13px',
          color: '#91a5ad',
        })
        .setOrigin(0.5),
    );
  }

  private renderDetails(entry: JournalEntryView | undefined): void {
    const panel = this.add
      .rectangle(980, 370, 500, 490, COLORS.panel, 0.96)
      .setStrokeStyle(2, COLORS.border);
    this.content?.add(panel);
    if (!entry) {
      return;
    }
    const icon = this.add
      .image(980, 190, entry.texture)
      .setDisplaySize(112, 112)
      .setAlpha(entry.discovered ? 1 : 0.18)
      .setTint(entry.discovered ? 0xffffff : 0x637985);
    const title = this.add
      .text(980, 274, entry.title.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '24px',
        color: entry.discovered ? '#e4edf1' : '#83959c',
        align: 'center',
        wordWrap: { width: 420 },
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(980, 310, entry.subtitle, {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: entry.discovered ? '#d8c49b' : '#7a878d',
        align: 'center',
      })
      .setOrigin(0.5);
    const description = this.add
      .text(980, 374, entry.description, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        color: entry.discovered ? '#b9cad1' : '#87979e',
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: 410 },
      })
      .setOrigin(0.5);
    const details = this.add
      .text(980, 500, entry.details.join('\n'), {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#8fa2aa',
        align: 'center',
        lineSpacing: 7,
        wordWrap: { width: 410 },
      })
      .setOrigin(0.5);
    this.content?.add([icon, title, subtitle, description, details]);
  }

  private addPageButton(x: number, y: number, label: string, onClick: () => void, enabled: boolean): void {
    const background = this.add
      .rectangle(x, y, 120, 38, COLORS.panel, enabled ? 0.96 : 0.38)
      .setStrokeStyle(2, enabled ? COLORS.border : 0x334048);
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: enabled ? '#dce8ed' : '#58676e',
      })
      .setOrigin(0.5);
    if (enabled) {
      background.setInteractive({ useHandCursor: true });
      background.on('pointerdown', onClick);
    }
    this.content?.add([background, text]);
  }

  private returnToPreviousScene(): void {
    if (this.resumeGameCallback) {
      this.scene.stop();
      this.resumeGameCallback();
      return;
    }
    returnFromMenu(
      {
        start: (sceneKey, data) => {
          this.scene.start(sceneKey, data);
        },
        bringToTop: (sceneKey) => {
          this.scene.bringToTop(sceneKey);
        },
      },
      this.returnTarget,
    );
  }

  private markSelectedCategorySeen(): void {
    if (markJournalCategorySeen(this.save, this.selectedCategory)) {
      writeSave(this.save);
    }
  }
}
