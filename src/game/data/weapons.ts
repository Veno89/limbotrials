import type { WeaponDefinition, WeaponId, WeaponStats } from '../types/gameTypes';

const stats = (values: Partial<WeaponStats> & Pick<WeaponStats, 'damage' | 'cooldownMs' | 'range'>): WeaponStats => ({
  projectileSpeed: 0,
  projectileSize: 32,
  projectileCount: 1,
  pierce: 0,
  area: 100,
  targetCount: 1,
  critChance: 0,
  critDamage: 0,
  ...values,
});

export const WEAPONS: Record<WeaponId, WeaponDefinition> = {
  'bone-scythe': {
    id: 'bone-scythe',
    behavior: 'scythe',
    name: 'Bone Scythe',
    description: 'Reaps souls in a 180-degree spectral sweep in the direction you face.',
    texture: 'weapon-bone-scythe',
    iconTexture: 'weapon-bone-scythe',
    baseStats: stats({ damage: 36, cooldownMs: 1500, range: 150, area: 150 }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.18 },
      { stat: 'area', mode: 'multiply', value: 1.09 },
    ],
    evolution: {
      name: 'Ossuary Reaper',
      description: 'Every sweep is followed by a second spectral reaping.',
    },
  },
  'soul-bolt': {
    id: 'soul-bolt',
    behavior: 'targeted-projectile',
    name: 'Soul Bolt',
    description: 'Hurls seeking fragments of condemned memory.',
    texture: 'weapon-soul-bolt',
    iconTexture: 'weapon-soul-bolt',
    baseStats: stats({
      damage: 18,
      cooldownMs: 500,
      range: 620,
      projectileSpeed: 520,
      projectileSize: 30,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.16 },
      { stat: 'cooldownMs', mode: 'multiply', value: 0.95 },
    ],
    evolution: {
      name: 'Choir of the Damned',
      description: 'Soul Bolts chain into a nearby condemned soul.',
    },
  },
  'hellfire-sigil': {
    id: 'hellfire-sigil',
    behavior: 'sigil',
    name: 'Hellfire Sigil',
    description: 'Brands the earth beneath a nearby foe.',
    texture: 'weapon-hellfire-sigil',
    iconTexture: 'weapon-hellfire-sigil',
    baseStats: stats({ damage: 72, cooldownMs: 3000, range: 700, area: 148 }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.2 },
      { stat: 'area', mode: 'multiply', value: 1.08 },
    ],
    evolution: {
      name: 'Infernal Sentence',
      description: 'Detonations leave a briefly burning execution ground.',
    },
  },
  'grave-lance': {
    id: 'grave-lance',
    behavior: 'targeted-projectile',
    name: 'Grave Lance',
    description: 'Drives a fast spectral lance through a line of foes.',
    texture: 'weapon-grave-lance',
    iconTexture: 'weapon-grave-lance',
    baseStats: stats({
      damage: 105,
      cooldownMs: 2800,
      range: 820,
      projectileSpeed: 820,
      projectileSize: 44,
      pierce: 4,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.22 },
      { stat: 'pierce', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Procession of Graves',
      description: 'Kills send the lance onward into another target.',
    },
  },
  'wailing-shards': {
    id: 'wailing-shards',
    behavior: 'radial-projectile',
    name: 'Wailing Shards',
    description: 'Casts shrieking fragments in every direction.',
    texture: 'weapon-wailing-shards',
    iconTexture: 'weapon-wailing-shards',
    baseStats: stats({
      damage: 20,
      cooldownMs: 1500,
      range: 600,
      projectileSpeed: 460,
      projectileSize: 24,
      projectileCount: 6,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.15 },
      { stat: 'projectileCount', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Mourning Choir',
      description: 'Each shard erupts in a small wailing blast on impact.',
    },
  },
  'cinder-reliquary': {
    id: 'cinder-reliquary',
    behavior: 'pulse',
    name: 'Cinder Reliquary',
    description: 'Releases a slow, punishing ring of grave-cinder.',
    texture: 'weapon-cinder-reliquary',
    iconTexture: 'weapon-cinder-reliquary',
    baseStats: stats({ damage: 58, cooldownMs: 4200, range: 230, area: 230 }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.16 },
      { stat: 'area', mode: 'multiply', value: 1.05 },
    ],
    evolution: {
      name: 'Funeral Pyre',
      description: 'Every cinder pulse is followed by a larger aftershock.',
    },
  },
  'ashen-longbow': {
    id: 'ashen-longbow',
    behavior: 'fan-projectile',
    name: 'Ashen Longbow',
    description: 'Loose a focused fan of grave-ash arrows toward the nearest soul.',
    texture: 'projectile-laser',
    iconTexture: 'weapon-ashen-longbow',
    baseStats: stats({
      damage: 36,
      cooldownMs: 1900,
      range: 760,
      projectileSpeed: 720,
      projectileSize: 26,
      projectileCount: 3,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.2 },
      { stat: 'projectileSpeed', mode: 'multiply', value: 1.08 },
    ],
    evolution: {
      name: 'Black Rain',
      description: 'Ashen arrows burst into grave-dust when they strike.',
    },
  },
  'bloodletter-axe': {
    id: 'bloodletter-axe',
    behavior: 'returning-projectile',
    name: 'Bloodletter Axe',
    description: 'Hurl a broad executioner axe that carves outward and returns.',
    texture: 'weapon-bloodletter-axe',
    iconTexture: 'weapon-bloodletter-axe',
    baseStats: stats({
      damage: 38,
      cooldownMs: 1900,
      range: 640,
      projectileSpeed: 540,
      projectileSize: 58,
      pierce: 5,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.2 },
      { stat: 'projectileSize', mode: 'multiply', value: 1.08 },
    ],
    evolution: {
      name: 'Crimson Orbit',
      description: 'Three or more executioner axes circle nearby and repeatedly reap enemies they pass through.',
    },
  },
  'dirge-staff': {
    id: 'dirge-staff',
    behavior: 'chain-strike',
    name: 'Dirge Staff',
    description: 'Condemn several nearby souls with instant spectral judgments.',
    texture: 'weapon-dirge-staff',
    iconTexture: 'weapon-dirge-staff',
    baseStats: stats({
      damage: 55,
      cooldownMs: 3000,
      range: 740,
      area: 78,
      targetCount: 2,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.18 },
      { stat: 'targetCount', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Last Rites',
      description: 'Each judgment erupts around the condemned target.',
    },
  },
  'poison-flask': {
    id: 'poison-flask',
    behavior: 'lobbed-projectile',
    name: 'Poison Flask',
    description: 'Throws venom flasks that burst on impact and leave acid pools behind.',
    texture: 'weapon-poison-flask',
    iconTexture: 'weapon-poison-flask',
    baseStats: stats({
      damage: 26,
      cooldownMs: 2400,
      range: 680,
      area: 92,
      projectileSpeed: 520,
      projectileSize: 34,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.17 },
      { stat: 'area', mode: 'multiply', value: 1.08 },
    ],
    evolution: {
      name: 'Virulent Mire',
      description: 'Acid pools last longer, bite harder, and poison enemies they burn.',
    },
  },
  'sanguine-needle': {
    id: 'sanguine-needle',
    behavior: 'targeted-projectile',
    name: 'Sanguine Needle',
    description: 'A blood-forged dart sold only by Limbo\'s wandering market.',
    texture: 'weapon-sanguine-needle',
    iconTexture: 'weapon-sanguine-needle',
    baseStats: stats({
      damage: 44,
      cooldownMs: 1050,
      range: 720,
      projectileSpeed: 760,
      projectileSize: 25,
      pierce: 1,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.19 },
      { stat: 'pierce', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Exsanguination',
      description: 'The Needle splits into three blood darts with greater penetration.',
    },
  },
  'spectral-chains': {
    id: 'spectral-chains',
    behavior: 'chain-arc',
    name: 'Spectral Chains',
    description: 'Sweeps a chained arc toward nearby groups, damaging enemies along the curve.',
    texture: 'weapon-spectral-chains',
    iconTexture: 'weapon-spectral-chains',
    baseStats: stats({
      damage: 42,
      cooldownMs: 2200,
      range: 580,
      area: 120, // Sweep arc width/angle
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.15 },
      { stat: 'area', mode: 'multiply', value: 1.08 },
    ],
    evolution: {
      name: 'Procession Bindings',
      description: 'Chains jump between several enemies and briefly pull lesser enemies toward the final struck target.',
    },
  },
  'gravetide-repeater': {
    id: 'gravetide-repeater',
    behavior: 'targeted-projectile',
    name: 'Gravetide Repeater',
    description: 'A cursed rapid-fire weapon that fires rhythmic bursts of piercing bolts.',
    texture: 'projectile-laser', // placeholder
    iconTexture: 'icon-staff', // placeholder
    baseStats: stats({
      damage: 14,
      cooldownMs: 800,
      range: 600,
      projectileSpeed: 600,
      projectileSize: 18,
      projectileCount: 3,
      pierce: 1,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.15 },
      { stat: 'projectileCount', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Abyssal Volley',
      description: 'Bolts pierce further and travel much faster.',
    },
  },
  'saintbreaker-pike': {
    id: 'saintbreaker-pike',
    behavior: 'targeted-projectile',
    name: 'Saintbreaker Pike',
    description: 'A brutal forward thrust that punishes everything in a long line.',
    texture: 'weapon-grave-lance', // placeholder
    iconTexture: 'icon-sword', // placeholder
    baseStats: stats({
      damage: 140,
      cooldownMs: 3200,
      range: 400,
      projectileSpeed: 1200,
      projectileSize: 64,
      pierce: 10,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.25 },
      { stat: 'cooldownMs', mode: 'multiply', value: 0.9 },
    ],
    evolution: {
      name: 'Martyr’s End',
      description: 'The thrust is wider, reaches further, and deals immense damage.',
    },
  },
  'ashen-orbit': {
    id: 'ashen-orbit',
    behavior: 'returning-projectile', // Can act as orbit if we give it the Crimson Orbit behavior
    name: 'Ashen Orbit',
    description: 'Burning relic fragments constantly orbit you, damaging enemies on contact.',
    texture: 'weapon-cinder-reliquary', // placeholder
    iconTexture: 'icon-void-sword', // placeholder
    baseStats: stats({
      damage: 28,
      cooldownMs: 1500, // Speed of rotation/hits can be tied to this or hardcoded in logic
      range: 150, // Orbit radius
      projectileSpeed: 200, // Orbit speed
      projectileSize: 32,
      projectileCount: 2,
      pierce: 999, // Infinite pierce for orbit
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.18 },
      { stat: 'projectileCount', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Corona of Ash',
      description: 'Adds more fragments and increases the orbit speed significantly.',
    },
  },
  'choir-of-teeth': {
    id: 'choir-of-teeth',
    behavior: 'fan-projectile',
    name: 'Choir of Teeth',
    description: 'Fires a grotesque fan of jagged bone shards at very close range.',
    texture: 'weapon-wailing-shards', // placeholder
    iconTexture: 'icon-chest', // placeholder
    baseStats: stats({
      damage: 42,
      cooldownMs: 1200,
      range: 300,
      projectileSpeed: 800,
      projectileSize: 20,
      projectileCount: 5,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.2 },
      { stat: 'projectileCount', mode: 'add', value: 2 },
    ],
    evolution: {
      name: 'Maw of the Abyss',
      description: 'Fires a massive spread of teeth that shred everything in front of you.',
    },
  },
  'eclipse-brand': {
    id: 'eclipse-brand',
    behavior: 'chain-strike', // Can act as a mark if we use chain-strike
    name: 'Eclipse Brand',
    description: 'Marks a targeted enemy with dark magic that erupts after a brief delay.',
    texture: 'weapon-dirge-staff', // placeholder
    iconTexture: 'icon-staff', // placeholder
    baseStats: stats({
      damage: 65,
      cooldownMs: 2000,
      range: 800,
      area: 120, // Blast radius
      targetCount: 1,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.25 },
      { stat: 'targetCount', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Total Eclipse',
      description: 'Marks chain to additional enemies and the eruptions are much larger.',
    },
  },
  'rustbound-dagger': {
    id: 'rustbound-dagger',
    behavior: 'targeted-projectile',
    name: 'Rustbound Dagger',
    description: 'Hurls a quick corroded blade toward the nearest foe.',
    texture: 'projectile-laser',
    iconTexture: 'icon-sword',
    baseStats: stats({
      damage: 12,
      cooldownMs: 380,
      range: 480,
      projectileSpeed: 680,
      projectileSize: 22,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.14 },
      { stat: 'cooldownMs', mode: 'multiply', value: 0.96 },
    ],
    evolution: {
      name: 'Tetanus Fang',
      description: 'Daggers strike faster and each hit briefly weakens enemy armor.',
    },
  },
  'pilgrims-sling': {
    id: 'pilgrims-sling',
    behavior: 'targeted-projectile',
    name: "Pilgrim's Sling",
    description: 'Flings a consecrated stone toward a distant soul.',
    texture: 'projectile-laser',
    iconTexture: 'icon-staff',
    baseStats: stats({
      damage: 22,
      cooldownMs: 650,
      range: 720,
      projectileSpeed: 550,
      projectileSize: 26,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.16 },
      { stat: 'projectileSpeed', mode: 'multiply', value: 1.06 },
    ],
    evolution: {
      name: 'Stoning Verdict',
      description: 'Stones shatter on impact, scattering sharp fragments to nearby enemies.',
    },
  },
  'grave-spark': {
    id: 'grave-spark',
    behavior: 'sigil',
    name: 'Grave Spark',
    description: 'Ignites a small spectral flame beneath a nearby condemned soul.',
    texture: 'weapon-hellfire-sigil',
    iconTexture: 'icon-staff',
    baseStats: stats({ damage: 48, cooldownMs: 2400, range: 600, area: 110 }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.18 },
      { stat: 'area', mode: 'multiply', value: 1.07 },
    ],
    evolution: {
      name: 'Purgatorial Ignition',
      description: 'The spark erupts into a larger flame that lingers and burns nearby enemies.',
    },
  },
  'bonefan': {
    id: 'bonefan',
    behavior: 'fan-projectile',
    name: 'Bonefan',
    description: 'Spreads a fan of sharpened bone shards at close range.',
    texture: 'weapon-wailing-shards',
    iconTexture: 'icon-void-sword',
    baseStats: stats({
      damage: 30,
      cooldownMs: 1100,
      range: 320,
      projectileSpeed: 650,
      projectileSize: 20,
      projectileCount: 4,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.17 },
      { stat: 'projectileCount', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Ossuary Bloom',
      description: 'Bone shards pierce through enemies and each shard spawns a smaller fragment on impact.',
    },
  },
  'candlebrand': {
    id: 'candlebrand',
    behavior: 'pulse',
    name: 'Candlebrand',
    description: 'Releases a slow ring of consecrated flame around the bearer.',
    texture: 'weapon-cinder-reliquary',
    iconTexture: 'icon-staff',
    baseStats: stats({ damage: 40, cooldownMs: 3200, range: 180, area: 180 }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.16 },
      { stat: 'area', mode: 'multiply', value: 1.06 },
    ],
    evolution: {
      name: 'Eternal Vigil',
      description: 'Each pulse leaves a brief burning zone that damages enemies who enter.',
    },
  },
  'bellringer-mace': {
    id: 'bellringer-mace',
    behavior: 'pulse',
    name: 'Bellringer Mace',
    description: 'Tolls a heavy bell that sends a shockwave through nearby condemned.',
    texture: 'weapon-cinder-reliquary',
    iconTexture: 'icon-chest',
    baseStats: stats({ damage: 55, cooldownMs: 3600, range: 200, area: 220 }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.2 },
      { stat: 'area', mode: 'multiply', value: 1.05 },
    ],
    evolution: {
      name: 'Funeral Toll',
      description: 'Every third toll releases a much larger shockwave that briefly stuns lesser enemies.',
    },
  },
  'crowfeather-arbalest': {
    id: 'crowfeather-arbalest',
    behavior: 'targeted-projectile',
    name: 'Crowfeather Arbalest',
    description: 'Fires a heavy crow-fletched bolt that pierces through the condemned.',
    texture: 'weapon-grave-lance',
    iconTexture: 'icon-bow',
    baseStats: stats({
      damage: 95,
      cooldownMs: 2600,
      range: 800,
      projectileSpeed: 900,
      projectileSize: 40,
      pierce: 3,
    }),
    levelGrowth: [
      { stat: 'damage', mode: 'multiply', value: 1.22 },
      { stat: 'pierce', mode: 'add', value: 1 },
    ],
    evolution: {
      name: 'Carrion Spear',
      description: 'Bolts deal increased damage to isolated targets and always crit the last enemy pierced.',
    },
  },
};
