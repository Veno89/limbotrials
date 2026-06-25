import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { ShopOfferDefinition } from '../data/shop';
import { canAffordBlood } from '../systems/shopRules';
import { addButton, addTitle } from '../ui/uiHelpers';

export interface ShopPurchaseResult {
  success: boolean;
  health: number;
  message: string;
}

export interface ShopSceneData {
  offers: ShopOfferDefinition[];
  health: number;
  maxHealth: number;
  onPurchase: (offer: ShopOfferDefinition) => ShopPurchaseResult;
  onClose: () => void;
}

export class ShopScene extends Phaser.Scene {
  private dataRef!: ShopSceneData;
  private health = 1;
  private readonly purchased = new Set<string>();
  private content?: Phaser.GameObjects.Container;
  private status = 'THE MERCHANT TAKES BLOOD, BUT NEVER YOUR LAST DROP.';

  constructor() {
    super('ShopScene');
  }

  init(data: ShopSceneData): void {
    this.dataRef = data;
    this.health = data.health;
    this.purchased.clear();
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020405, 0.88).setOrigin(0).setInteractive();
    this.add
      .image(GAME_WIDTH / 2 - 470, GAME_HEIGHT / 2 - 244, 'shop-building')
      .setDisplaySize(172, 158)
      .setAlpha(0.9);
    addTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 294, 'THE BLOOD MARKET', 36).setColor('#e1b1a5');
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 252, 'POWER FOR BLOOD. THE STRONGER THE RELIC, THE DEEPER THE CUT.', {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: '#aebdc3',
      })
      .setOrigin(0.5);
    addButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 42, 'LEAVE THE MARKET', () => this.close(), 260);
    this.input.keyboard?.once('keydown-ESC', () => this.close());
    this.render();
  }

  private render(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0);
    const ratio = Phaser.Math.Clamp(this.health / this.dataRef.maxHealth, 0, 1);
    const healthBack = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 217, 320, 18, 0x050809, 0.95).setStrokeStyle(2, COLORS.border);
    const healthBar = this.add
      .rectangle(GAME_WIDTH / 2 - 158, GAME_HEIGHT / 2 - 217, 316 * ratio, 12, COLORS.blood)
      .setOrigin(0, 0.5);
    const healthText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 217, `YOUR BLOOD  ${Math.ceil(this.health)} / ${Math.round(this.dataRef.maxHealth)}`, {
        fontFamily: 'Cinzel, serif',
        fontSize: '12px',
        color: '#f0d4ce',
        stroke: '#020405',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.content.add([healthBack, healthBar, healthText]);

    if (this.dataRef.offers.length === 0) {
      this.content.add(
        this.add
          .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'THE STALL HOLDS NOTHING YOU DO NOT ALREADY OWN.', {
            fontFamily: 'Cinzel, serif',
            fontSize: '18px',
            color: '#95a7ae',
          })
          .setOrigin(0.5),
      );
    }
    this.dataRef.offers.forEach((offer, index) => this.createOfferCard(offer, GAME_WIDTH / 2 - 380 + index * 380, GAME_HEIGHT / 2 + 30));
    this.content.add(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 242, this.status, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: '#c9a49c',
          align: 'center',
          wordWrap: { width: 800 },
        })
        .setOrigin(0.5),
    );
  }

  private createOfferCard(offer: ShopOfferDefinition, x: number, y: number): void {
    const purchased = this.purchased.has(offer.id);
    const affordable = canAffordBlood(this.health, offer.healthCost);
    const enabled = !purchased && affordable;
    const rarityColor = offer.rarity === 'legendary' ? 0xd7bd82 : 0xb687ed;
    const panel = this.add
      .rectangle(x, y, 330, 390, COLORS.panel, purchased ? 0.5 : 0.98)
      .setStrokeStyle(3, purchased ? 0x4b555a : rarityColor);
    const icon = this.add.image(x, y - 112, offer.iconTexture).setDisplaySize(82, 82).setAlpha(purchased ? 0.35 : 1);
    const kind = this.add
      .text(x, y - 52, `${offer.kind.toUpperCase()} / ${offer.rarity.toUpperCase()}`, {
        fontFamily: 'Cinzel, serif',
        fontSize: '11px',
        color: `#${rarityColor.toString(16).padStart(6, '0')}`,
      })
      .setOrigin(0.5);
    const title = this.add
      .text(x, y - 17, offer.name.toUpperCase(), {
        fontFamily: 'Cinzel, serif',
        fontSize: '19px',
        color: purchased ? '#67747a' : '#e4edf1',
        align: 'center',
        wordWrap: { width: 285 },
      })
      .setOrigin(0.5);
    const description = this.add
      .text(x, y + 62, offer.description, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: purchased ? '#59666c' : '#aabcc4',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: 276 },
      })
      .setOrigin(0.5);
    const button = this.add
      .rectangle(x, y + 153, 248, 48, enabled ? 0x301014 : 0x14191c, enabled ? 0.98 : 0.65)
      .setStrokeStyle(2, enabled ? COLORS.blood : 0x455057);
    const buttonText = this.add
      .text(
        x,
        y + 153,
        purchased ? 'SOLD' : affordable ? `BUY FOR ${offer.healthCost} HP` : `NEED ${offer.healthCost + 1} HP`,
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '14px',
          color: enabled ? '#f0d4ce' : '#68757b',
        },
      )
      .setOrigin(0.5);
    if (enabled) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.purchase(offer));
    }
    this.content?.add([panel, icon, kind, title, description, button, buttonText]);
  }

  private purchase(offer: ShopOfferDefinition): void {
    const result = this.dataRef.onPurchase(offer);
    this.health = result.health;
    this.status = result.message.toUpperCase();
    if (result.success) {
      this.purchased.add(offer.id);
    }
    this.render();
  }

  private close(): void {
    this.scene.stop();
    this.dataRef.onClose();
  }
}
