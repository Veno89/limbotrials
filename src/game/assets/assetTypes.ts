export type AssetCategory =
  | 'background'
  | 'character'
  | 'enemy'
  | 'boss'
  | 'weapon'
  | 'projectile'
  | 'pickup'
  | 'artifact'
  | 'status'
  | 'environment'
  | 'building'
  | 'tile'
  | 'ui';

export type AssetProvenance =
  | 'owner-created'
  | 'owner-supplied-legacy'
  | 'procedural-placeholder'
  | 'unverified';

export interface AssetProductionSpec {
  tier: 'minimum-playable' | 'presentation-polish' | 'optional-variation' | 'post-demo';
  order: number;
  targetFilePath: string;
  transparency: 'required' | 'opaque' | 'either';
  orientation: 'right-facing' | 'left-facing' | 'front-facing' | 'not-directional';
  runtimePresentation: readonly string[];
  templateFilePath?: string;
}

export interface AssetPoint {
  /** Normalized source-space coordinate. Zero is the left/top edge and one is the right/bottom edge. */
  x: number;
  y: number;
}

export interface AssetAttachmentPoint extends AssetPoint {
  name: string;
}

/** A concrete display contract used by a named runtime consumer. */
export interface AssetRuntimeDisplay {
  consumer: string;
  width: number;
  height: number;
  note?: string;
}

export type AssetCollisionFootprint =
  | { shape: 'circle'; radius: number; offset?: AssetPoint }
  | { shape: 'box'; width: number; height: number; offset?: AssetPoint };

export interface FileAssetSource {
  kind: 'file';
  /** Repository-relative path used for validation and production handoff. */
  filePath: string;
  /** Explicit Vite URL import. Keeping this explicit prevents the legacy art archive from being bundled. */
  url: string;
}

export interface PrimitiveAssetFallback {
  kind: 'primitive';
  shape: 'circle' | 'diamond' | 'ring' | 'square' | 'triangle';
  fillColor: number;
  strokeColor: number;
  label?: string;
}

export interface AssetReferenceFallback {
  kind: 'asset';
  assetId: string;
}

export type VisualAssetFallback = PrimitiveAssetFallback | AssetReferenceFallback;

export interface VisualAssetDefinition {
  id: string;
  source?: FileAssetSource;
  category: AssetCategory;
  intendedGameplayUse: string;
  expectedWidth: number;
  expectedHeight: number;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  animation?: {
    startFrame: number;
    endFrame: number;
    framesPerSecond: number;
    loop: boolean;
  };
  origin: AssetPoint;
  /** Uniform authoring/import scale hint. Named runtime consumers may override it with setDisplaySize. */
  worldScale: number;
  /** Exact current display sizes where gameplay or UI code fixes them explicitly. */
  runtimeDisplays: readonly AssetRuntimeDisplay[];
  expectedDepth: number;
  mirroring: 'none' | 'horizontal' | 'vertical' | 'both';
  tinting: 'none' | 'allowed' | 'recommended';
  collision?: AssetCollisionFootprint;
  attachments: readonly AssetAttachmentPoint[];
  requiredAttachments?: readonly string[];
  required: boolean;
  developmentFallback?: VisualAssetFallback;
  provenance: AssetProvenance;
  /** Present when the registered placeholder or legacy source is an owner-art production task. */
  production?: AssetProductionSpec;
}

export type AudioCue =
  | 'button'
  | 'dash'
  | 'soul-bolt'
  | 'scythe'
  | 'hellfire'
  | 'pickup'
  | 'hurt'
  | 'level-up'
  | 'boss'
  | 'shield'
  | 'victory'
  | 'limbo-ambience';

export interface ProceduralAudioFallback {
  kind: 'procedural-audio';
  generator: 'web-audio-tone' | 'web-audio-ambience';
  oscillator: OscillatorType;
  frequencyHz: number;
  endFrequencyHz?: number;
  durationSeconds?: number;
  gain: number;
  cooldownMs?: number;
}

export interface AudioAssetDefinition {
  id: string;
  cue: AudioCue;
  category: 'sound-effect' | 'ambience';
  intendedGameplayUse: string;
  /** Canonical owner-delivery location even while the procedural fallback is active. */
  productionTargetFilePath: string;
  source?: FileAssetSource;
  loop: boolean;
  required: boolean;
  developmentFallback: ProceduralAudioFallback;
  provenance: AssetProvenance;
}

export interface AssetManifest {
  visual: readonly VisualAssetDefinition[];
  audio: readonly AudioAssetDefinition[];
}
