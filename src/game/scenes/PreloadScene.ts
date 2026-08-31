import Phaser from 'phaser';
import { resolveVisualAsset, resolveVisualAssetFallback } from '../assets/AssetResolver';
import {
  reportAssetDiagnosticsOnce,
  validateAssetManifest,
  type AssetValidationIssue,
} from '../assets/assetValidation';
import type { PrimitiveAssetFallback } from '../assets/assetTypes';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import {
  ASSET_MANIFEST,
  ASSETS,
  VISUAL_ASSETS,
  VISUAL_ASSETS_BY_ID,
} from '../data/assets';
import { addTitle } from '../ui/uiHelpers';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    reportAssetDiagnosticsOnce(validateAssetManifest(ASSET_MANIFEST), (issue) => {
      this.reportDiagnostic(issue);
    });
    addTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, 'ENTERING LIMBO', 30);
    const border = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 480, 16, 0x030506)
      .setStrokeStyle(2, COLORS.border);
    const bar = this.add.rectangle(border.x - 237, border.y, 474, 10, COLORS.soul).setOrigin(0, 0.5);
    bar.displayWidth = 0;
    this.load.on('progress', (progress: number) => {
      bar.displayWidth = 474 * progress;
    });
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      const assetId = String(file.key);
      const definition = VISUAL_ASSETS_BY_ID.get(assetId);
      if (!definition) {
        return;
      }
      const resolved = resolveVisualAsset(VISUAL_ASSETS, assetId);
      const diagnosticDefinition = resolved?.kind === 'file'
        ? resolved.resolvedDefinition
        : definition;
      reportAssetDiagnosticsOnce([{
        code: 'missing-source-file',
        severity: diagnosticDefinition.required ? 'error' : 'warning',
        assetId: diagnosticDefinition.id,
        message: `Failed to load ${diagnosticDefinition.source?.filePath ?? 'resolved fallback source'}; development fallbacks will be used.`,
      }], (issue) => {
        this.reportDiagnostic(issue);
      });
    });
    for (const [key, path] of ASSETS) {
      const definition = VISUAL_ASSETS_BY_ID.get(key);
      // Alias keys are registered from the already-loaded target in create(), avoiding duplicate requests.
      if (!definition?.source) {
        continue;
      }
      if (definition && definition.frameCount > 1) {
        this.load.spritesheet(key, path, {
          frameWidth: definition.frameWidth,
          frameHeight: definition.frameHeight,
          endFrame: definition.frameCount - 1,
        });
      } else {
        this.load.image(key, path);
      }
    }
  }

  create(): void {
    this.createMissingFallbackTextures();
    this.registry.set('limbo:assets-ready', true);
    this.game.events.emit('limbo:assets-ready');
    this.scene.start('MainMenuScene');
  }

  private createMissingFallbackTextures(): void {
    for (const definition of VISUAL_ASSETS) {
      if (this.textures.exists(definition.id)) {
        continue;
      }
      const resolved = resolveVisualAsset(VISUAL_ASSETS, definition.id);
      if (resolved?.kind === 'file'
        && resolved.resolvedDefinition.id !== definition.id
        && this.textures.exists(resolved.resolvedDefinition.id)) {
        const sourceImage = this.textures.get(resolved.resolvedDefinition.id).getSourceImage();
        if (sourceImage instanceof HTMLCanvasElement) {
          this.textures.addCanvas(definition.id, sourceImage);
        } else if (sourceImage instanceof HTMLImageElement) {
          this.textures.addImage(definition.id, sourceImage);
        }
        if (this.textures.exists(definition.id)) {
          continue;
        }
      }
      const fallback = resolveVisualAssetFallback(VISUAL_ASSETS, definition.id);
      if (!fallback) {
        reportAssetDiagnosticsOnce([{
          code: 'missing-optional-fallback',
          severity: definition.required ? 'error' : 'warning',
          assetId: definition.id,
          message: 'No texture or resolvable primitive fallback is available.',
        }], (issue) => {
          this.reportDiagnostic(issue);
        });
        continue;
      }
      this.createPrimitiveTexture(definition.id, definition.frameWidth, definition.frameHeight, fallback);
    }
  }

  private createPrimitiveTexture(
    key: string,
    width: number,
    height: number,
    fallback: PrimitiveAssetFallback,
  ): void {
    const texture = this.textures.createCanvas(key, width, height);
    if (!texture) {
      reportAssetDiagnosticsOnce([{
        code: 'missing-optional-fallback',
        severity: 'error',
        assetId: key,
        message: 'Phaser could not register the generated canvas fallback texture.',
      }], (issue) => {
        this.reportDiagnostic(issue);
      });
      return;
    }
    const context = texture.context;
    const centerX = width / 2;
    const centerY = height / 2;
    const padding = Math.max(3, Math.floor(Math.min(width, height) * 0.1));
    const radius = Math.max(2, Math.min(width, height) / 2 - padding);
    context.fillStyle = this.cssColor(fallback.fillColor);
    context.strokeStyle = this.cssColor(fallback.strokeColor);
    context.lineWidth = Math.max(2, Math.floor(radius * 0.12));
    context.lineJoin = 'round';
    context.globalAlpha = fallback.shape === 'ring' ? 0.28 : 0.88;
    context.beginPath();

    if (fallback.shape === 'circle' || fallback.shape === 'ring') {
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      context.stroke();
      if (fallback.shape === 'ring') {
        context.beginPath();
        context.arc(centerX, centerY, radius * 0.55, 0, Math.PI * 2);
        context.stroke();
      }
    } else if (fallback.shape === 'square') {
      context.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      context.fill();
      context.globalAlpha = 1;
      context.stroke();
    } else if (fallback.shape === 'triangle') {
      context.moveTo(centerX, centerY - radius);
      context.lineTo(centerX + radius, centerY + radius);
      context.lineTo(centerX - radius, centerY + radius);
      context.closePath();
      context.fill();
      context.globalAlpha = 1;
      context.stroke();
    } else {
      context.moveTo(centerX, centerY - radius);
      context.lineTo(centerX + radius, centerY);
      context.lineTo(centerX, centerY + radius);
      context.lineTo(centerX - radius, centerY);
      context.closePath();
      context.fill();
      context.globalAlpha = 1;
      context.stroke();
    }

    if (fallback.label) {
      const label = fallback.label.slice(0, 12);
      const fontSize = Math.max(8, Math.min(
        18,
        Math.floor(Math.min(width, height) / 7),
        Math.floor(width / Math.max(4, label.length * 0.7)),
      ));
      context.globalAlpha = 1;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `bold ${fontSize}px monospace`;
      context.lineWidth = 3;
      context.strokeStyle = '#071014';
      context.fillStyle = '#f5fbff';
      context.strokeText(label, centerX, centerY);
      context.fillText(label, centerX, centerY);
    }
    texture.refresh();
  }

  private cssColor(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  private reportDiagnostic(issue: AssetValidationIssue): void {
    const message = `[assets:${issue.code}] ${issue.assetId}: ${issue.message}`;
    if (issue.severity === 'error') {
      console.error(message);
    } else {
      console.warn(message);
    }
  }
}
