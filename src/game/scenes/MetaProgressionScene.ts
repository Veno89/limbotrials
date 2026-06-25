import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { CHARACTERS, isCharacterId } from '../data/characters';
import { TALENT_NODES, TALENT_PATH_ORDER, TALENT_PATHS } from '../data/talentTree';
import {
  allocateTalentNode,
  availableTalentPoints,
  earnedTalentPoints,
  nextTalentPoint,
  pathTalentPoints,
  refundCharacterTalents,
  spentTalentPoints,
} from '../systems/TalentTreeSystem';
import { loadSave, writeSave } from '../systems/SaveSystem';
import type { CharacterId, SaveData, TalentNodeDefinition, TalentPathDefinition } from '../types/gameTypes';
import { addButton, addTitle } from '../ui/uiHelpers';

interface MetaProgressionSceneData {
  characterId?: CharacterId;
  notice?: string;
}

interface NodeRenderState {
  x: number;
  y: number;
  radius: number;
}

const PATH_CENTER_X = [GAME_WIDTH / 2 - 392, GAME_WIDTH / 2, GAME_WIDTH / 2 + 392] as const;
const NODE_START_Y = (GAME_HEIGHT - 720) / 2 + 238;
const NODE_ROW_GAP = 62;
const NODE_COLUMN_GAP = 68;

export class MetaProgressionScene extends Phaser.Scene {
  private selectedCharacter: CharacterId = 'haunted';
  private tooltip?: Phaser.GameObjects.Container;

  constructor() {
    super('MetaProgressionScene');
  }

  init(data?: MetaProgressionSceneData): void {
    if (isCharacterId(data?.characterId)) {
      this.selectedCharacter = data.characterId;
    }
  }

  create(data?: MetaProgressionSceneData): void {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'legacy-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.35);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x030708, 0.7).setOrigin(0);
    const save = loadSave();
    if (!save.unlockedCharacters.includes(this.selectedCharacter)) {
      this.selectedCharacter = save.selectedCharacter;
    }

    addTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 314, 'META UPGRADES', 34);
    this.renderCharacterTabs(save);
    this.renderSummary(save);
    this.renderTree(save);
    if (data?.notice) {
      this.renderNotice(data.notice);
    }
    addButton(this, GAME_WIDTH / 2 - 420, GAME_HEIGHT - 48, 'REFUND THIS SOUL', () => {
      refundCharacterTalents(save, this.selectedCharacter);
      writeSave(save);
      this.scene.restart({ characterId: this.selectedCharacter, notice: 'TALENTS REFUNDED' });
    }, 250);
    addButton(this, GAME_WIDTH - 175, GAME_HEIGHT - 48, 'RETURN', () => this.scene.start('MainMenuScene'), 210);
  }

  private renderCharacterTabs(save: SaveData): void {
    (Object.keys(CHARACTERS) as CharacterId[]).forEach((characterId, index) => {
      const character = CHARACTERS[characterId];
      const unlocked = save.unlockedCharacters.includes(characterId);
      const selected = characterId === this.selectedCharacter;
      const available = unlocked ? availableTalentPoints(save, characterId) : 0;
      const x = GAME_WIDTH / 2 - 310 + index * 310;
      const yBase = GAME_HEIGHT / 2 - 267;
      const tab = this.add
        .rectangle(x, yBase, 260, 44, selected ? COLORS.panelLight : COLORS.panel, 0.96)
        .setStrokeStyle(2, selected ? COLORS.soul : unlocked ? COLORS.border : 0x394047)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(x, yBase, unlocked ? character.name.toUpperCase() : `${character.name.toUpperCase()} LOCKED`, {
          fontFamily: 'Cinzel, serif',
          fontSize: '15px',
          color: unlocked ? '#dce8ed' : '#697780',
        })
        .setOrigin(0.5);
      if (available > 0) {
        this.add.circle(x + 116, yBase - 17, 11, COLORS.gold, 1).setStrokeStyle(2, 0xf0d8a0);
        this.add
          .text(x + 116, yBase - 17, available > 99 ? '99+' : String(available), {
            fontFamily: 'Inter, sans-serif',
            fontSize: available > 9 ? '9px' : '11px',
            fontStyle: 'bold',
            color: '#071014',
          })
          .setOrigin(0.5);
      }
      tab.on('pointerdown', () => {
        this.scene.restart({ characterId });
      });
    });
  }

  private renderSummary(save: SaveData): void {
    const progress = save.talentProgress[this.selectedCharacter];
    const earned = earnedTalentPoints(save, this.selectedCharacter);
    const spent = spentTalentPoints(save, this.selectedCharacter);
    const available = availableTalentPoints(save, this.selectedCharacter);
    const next = nextTalentPoint(save, this.selectedCharacter);
    const nextText = next ? `NEXT POINT AT ${next} SOULS` : 'LEGACY COMPLETE';
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 228,
        `${CHARACTERS[this.selectedCharacter].title.toUpperCase()}  |  LEGACY SOULS ${progress.legacySouls}  |  ` +
          `POINTS ${available} AVAILABLE / ${spent} SPENT / ${earned} EARNED  |  ${nextText}`,
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '14px',
          color: '#8edfff',
        },
      )
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 206, 'Runs feed legacy souls to the character you played. Nodes spend points, not souls.', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#9fb1b8',
      })
      .setOrigin(0.5);
  }

  private renderTree(save: SaveData): void {
    const paths = TALENT_PATH_ORDER.map((id) => TALENT_PATHS[id]).filter(
      (path) => path.characterId === this.selectedCharacter,
    );
    const nodePositions = new Map<string, NodeRenderState>();

    paths.forEach((path, pathIndex) => {
      const centerX = PATH_CENTER_X[pathIndex] ?? PATH_CENTER_X[1];
      this.renderPathHeader(path, centerX);
      const nodes = Object.values(TALENT_NODES).filter((node) => node.pathId === path.id);
      for (const node of nodes) {
        nodePositions.set(node.id, this.nodePosition(centerX, node));
      }
    });

    const lines = this.add.graphics().setDepth(18);
    for (const path of paths) {
      for (const node of Object.values(TALENT_NODES).filter((candidate) => candidate.pathId === path.id)) {
        const to = nodePositions.get(node.id);
        if (!to) {
          continue;
        }
        for (const prerequisite of node.prerequisites) {
          const from = nodePositions.get(prerequisite);
          if (!from) {
            continue;
          }
          lines.lineStyle(2, path.color, 0.3);
          lines.lineBetween(from.x, from.y, to.x, to.y);
        }
      }
    }

    for (const path of paths) {
      for (const node of Object.values(TALENT_NODES).filter((candidate) => candidate.pathId === path.id)) {
        const position = nodePositions.get(node.id);
        if (position) {
          this.renderNode(save, node, path, position);
        }
      }
    }
  }

  private renderPathHeader(path: TalentPathDefinition, centerX: number): void {
    const yBase = GAME_HEIGHT / 2 - 183;
    this.add
      .rectangle(centerX, yBase, 330, 44, COLORS.panel, 0.92)
      .setStrokeStyle(2, path.color, 0.8);
    this.add
      .text(centerX, yBase - 9, path.name.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '17px',
        color: '#dce8ed',
      })
      .setOrigin(0.5);
    this.add
      .text(centerX, yBase + 11, path.description, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#9fb1b8',
        align: 'center',
        wordWrap: { width: 300 },
      })
      .setOrigin(0.5, 0);
  }

  private renderNode(
    save: SaveData,
    node: TalentNodeDefinition,
    path: TalentPathDefinition,
    position: NodeRenderState,
  ): void {
    const ranks = save.talentProgress[this.selectedCharacter].allocations[node.id] ?? 0;
    const canAllocate = allocatePreview(save, node).allowed;
    const complete = ranks >= node.maxRanks;
    const fill = ranks > 0 ? path.color : canAllocate ? COLORS.panelLight : COLORS.panel;
    const stroke = complete ? COLORS.gold : canAllocate ? COLORS.soul : 0x394047;
    const alpha = ranks > 0 ? 0.95 : canAllocate ? 0.9 : 0.65;
    const circle = this.add
      .circle(position.x, position.y, position.radius, fill, alpha)
      .setStrokeStyle(2, stroke)
      .setDepth(22)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(position.x, position.y, `${ranks}/${node.maxRanks}`, {
        fontFamily: 'Consolas, monospace',
        fontSize: '11px',
        color: ranks > 0 ? '#071014' : '#dce8ed',
      })
      .setOrigin(0.5)
      .setDepth(23);
    circle.on('pointerover', (pointer: Phaser.Input.Pointer) => this.showTooltip(save, node, pointer.x, pointer.y));
    circle.on('pointermove', (pointer: Phaser.Input.Pointer) => this.moveTooltip(pointer.x, pointer.y));
    circle.on('pointerout', () => this.hideTooltip());
    circle.on('pointerdown', () => {
      const result = allocateTalentNode(save, node.id);
      if (result.allowed) {
        writeSave(save);
        this.scene.restart({ characterId: this.selectedCharacter });
      } else {
        this.renderNotice(result.reason ?? 'TALENT LOCKED');
      }
    });
  }

  private nodePosition(centerX: number, node: TalentNodeDefinition): NodeRenderState {
    return {
      x: centerX + node.position.column * NODE_COLUMN_GAP,
      y: NODE_START_Y + node.position.row * NODE_ROW_GAP,
      radius: node.tier === 'capstone' ? 25 : node.tier === 'notable' ? 21 : node.tier === 'choice' ? 19 : 17,
    };
  }

  private showTooltip(save: SaveData, node: TalentNodeDefinition, x: number, y: number): void {
    this.hideTooltip();
    const pathPoints = pathTalentPoints(save, node.characterId, node.pathId);
    const ranks = save.talentProgress[node.characterId].allocations[node.id] ?? 0;
    const preview = allocatePreview(save, node);
    const lockText = preview.allowed || ranks >= node.maxRanks ? '' : `\n\n${preview.reason}`;
    const text = this.add.text(14, 12, `${node.name}\n${ranks}/${node.maxRanks} RANKS\n\n${node.description}\n\nRequires ${node.pathPointsRequired} path points. You have ${pathPoints}.${lockText}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#dce8ed',
      wordWrap: { width: 310 },
      lineSpacing: 4,
    });
    const bounds = text.getBounds();
    const background = this.add
      .rectangle(0, 0, bounds.width + 28, bounds.height + 24, COLORS.panel, 0.98)
      .setOrigin(0)
      .setStrokeStyle(2, COLORS.border);
    this.tooltip = this.add.container(0, 0, [background, text]).setDepth(80);
    this.moveTooltip(x, y);
  }

  private moveTooltip(x: number, y: number): void {
    if (!this.tooltip) {
      return;
    }
    const width = 360;
    const height = 190;
    this.tooltip.setPosition(Math.min(x + 24, GAME_WIDTH - width), Math.min(y + 16, GAME_HEIGHT - height));
  }

  private hideTooltip(): void {
    this.tooltip?.destroy();
    this.tooltip = undefined;
  }

  private renderNotice(message: string): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 86, message.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '14px',
        color: '#d7bd82',
      })
      .setOrigin(0.5)
      .setDepth(90);
  }
}

function allocatePreview(save: SaveData, node: TalentNodeDefinition): ReturnType<typeof allocateTalentNode> {
  const clone: SaveData = {
    ...save,
    talentProgress: {
      haunted: {
        legacySouls: save.talentProgress.haunted.legacySouls,
        allocations: { ...save.talentProgress.haunted.allocations },
      },
      'the-penitent': {
        legacySouls: save.talentProgress['the-penitent'].legacySouls,
        allocations: { ...save.talentProgress['the-penitent'].allocations },
      },
      ashwalker: {
        legacySouls: save.talentProgress.ashwalker.legacySouls,
        allocations: { ...save.talentProgress.ashwalker.allocations },
      },
    },
  };
  return allocateTalentNode(clone, node.id);
}
