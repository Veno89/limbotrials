import { CHARACTERS } from '../data/characters';
import {
  TALENT_NODES,
  TALENT_PATHS,
  nextTalentPointThreshold,
  talentPointsForLegacySouls,
} from '../data/talentTree';
import type {
  CharacterId,
  CharacterTalentProgress,
  SaveData,
  TalentNodeDefinition,
  TalentNodeId,
  TalentPathId,
} from '../types/gameTypes';

export interface TalentAllocationCheck {
  allowed: boolean;
  reason?: string;
  node?: TalentNodeDefinition;
}

export function createDefaultTalentProgress(): Record<CharacterId, CharacterTalentProgress> {
  return {
    haunted: { legacySouls: 0, allocations: {} },
    'the-penitent': { legacySouls: 0, allocations: {} },
    ashwalker: { legacySouls: 0, allocations: {} },
  };
}

export function sanitizeTalentProgress(input: unknown): Record<CharacterId, CharacterTalentProgress> {
  const defaults = createDefaultTalentProgress();
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return defaults;
  }
  const record = input as Partial<Record<CharacterId, Partial<CharacterTalentProgress>>>;
  for (const characterId of Object.keys(CHARACTERS) as CharacterId[]) {
    const stored = record[characterId];
    if (!stored || typeof stored !== 'object') {
      continue;
    }
    defaults[characterId].legacySouls = boundedInteger(stored.legacySouls, 0, 1_000_000);
    defaults[characterId].allocations = sanitizeAllocations(stored.allocations, characterId);
  }
  return defaults;
}

export function earnedTalentPoints(save: SaveData, characterId: CharacterId): number {
  return talentPointsForLegacySouls(save.talentProgress[characterId].legacySouls);
}

export function spentTalentPoints(save: SaveData, characterId: CharacterId): number {
  return Object.values(save.talentProgress[characterId].allocations).reduce(
    (total, ranks) => total + (ranks ?? 0),
    0,
  );
}

export function availableTalentPoints(save: SaveData, characterId: CharacterId): number {
  return Math.max(0, earnedTalentPoints(save, characterId) - spentTalentPoints(save, characterId));
}

export function nextTalentPoint(save: SaveData, characterId: CharacterId): number | undefined {
  return nextTalentPointThreshold(save.talentProgress[characterId].legacySouls);
}

export function pathTalentPoints(save: SaveData, characterId: CharacterId, pathId: TalentPathId): number {
  const path = TALENT_PATHS[pathId];
  if (path.characterId !== characterId) {
    return 0;
  }
  return Object.entries(save.talentProgress[characterId].allocations).reduce((total, [id, ranks]) => {
    const node = TALENT_NODES[id as TalentNodeId];
    return node?.pathId === pathId ? total + (ranks ?? 0) : total;
  }, 0);
}

export function canAllocateTalent(save: SaveData, nodeId: TalentNodeId): TalentAllocationCheck {
  const node = TALENT_NODES[nodeId];
  if (!node) {
    return { allowed: false, reason: 'Unknown talent node.' };
  }
  if (!save.unlockedCharacters.includes(node.characterId)) {
    return { allowed: false, reason: `${CHARACTERS[node.characterId].name} is still locked.`, node };
  }
  if (availableTalentPoints(save, node.characterId) <= 0) {
    return { allowed: false, reason: 'No talent points available.', node };
  }
  const allocations = save.talentProgress[node.characterId].allocations;
  const currentRanks = allocations[node.id] ?? 0;
  if (currentRanks >= node.maxRanks) {
    return { allowed: false, reason: 'This node is already complete.', node };
  }
  if (node.prerequisites.some((required) => (allocations[required] ?? 0) <= 0)) {
    return { allowed: false, reason: 'A connected prerequisite is missing.', node };
  }
  if (pathTalentPoints(save, node.characterId, node.pathId) < node.pathPointsRequired) {
    return {
      allowed: false,
      reason: `Requires ${node.pathPointsRequired} points in ${TALENT_PATHS[node.pathId].name}.`,
      node,
    };
  }
  if (node.choiceGroup && currentRanks === 0) {
    const conflictingChoice = Object.entries(allocations).some(([id, ranks]) => {
      const other = TALENT_NODES[id as TalentNodeId];
      return other?.choiceGroup === node.choiceGroup && other.id !== node.id && (ranks ?? 0) > 0;
    });
    if (conflictingChoice) {
      return { allowed: false, reason: 'Another choice in this pair is already selected.', node };
    }
  }
  return { allowed: true, node };
}

export function allocateTalentNode(save: SaveData, nodeId: TalentNodeId): TalentAllocationCheck {
  const check = canAllocateTalent(save, nodeId);
  if (!check.allowed || !check.node) {
    return check;
  }
  const allocations = save.talentProgress[check.node.characterId].allocations;
  allocations[nodeId] = (allocations[nodeId] ?? 0) + 1;
  return check;
}

export function refundCharacterTalents(save: SaveData, characterId: CharacterId): void {
  save.talentProgress[characterId].allocations = {};
}

export function getAllocatedTalentNodes(
  save: SaveData,
  characterId: CharacterId,
): { node: TalentNodeDefinition; ranks: number }[] {
  return Object.entries(save.talentProgress[characterId].allocations)
    .map(([id, ranks]) => ({ node: TALENT_NODES[id as TalentNodeId], ranks: ranks ?? 0 }))
    .filter((entry): entry is { node: TalentNodeDefinition; ranks: number } =>
      Boolean(entry.node && entry.node.characterId === characterId && entry.ranks > 0),
    );
}

function sanitizeAllocations(input: unknown, characterId: CharacterId): Partial<Record<TalentNodeId, number>> {
  const allocations: Partial<Record<TalentNodeId, number>> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return allocations;
  }
  for (const [id, value] of Object.entries(input)) {
    const node = TALENT_NODES[id as TalentNodeId];
    if (!node || node.characterId !== characterId) {
      continue;
    }
    const ranks = boundedInteger(value, 0, node.maxRanks);
    if (ranks > 0) {
      allocations[node.id] = ranks;
    }
  }
  return allocations;
}

function boundedInteger(value: unknown, minimum: number, maximum: number): number {
  return Number.isInteger(value) ? Math.max(minimum, Math.min(maximum, value as number)) : minimum;
}
