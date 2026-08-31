import type { AudioCue } from '../assets/assetTypes';
import type { ArtifactId, PowerupId, WeaponId } from '../types/gameTypes';
import { ARTIFACTS } from './artifacts';
import { POWERUPS } from './powerups';
import { WEAPONS } from './weapons';

export const ASSET_CHECKLIST_CATEGORIES = [
  'Characters',
  'Enemies & Bosses',
  'Weapons & Attacks',
  'Artifacts',
  'Projectiles & Combat Marks',
  'Powerups & Pickups',
  'Arena, Props & Buildings',
  'Status & Interface',
  'Floor Tiles',
  'Sound & Ambience',
] as const;

export type AssetChecklistCategory = typeof ASSET_CHECKLIST_CATEGORIES[number];

export interface AssetCreativeConcept {
  id: string;
  displayName: string;
  category: AssetChecklistCategory;
  creativeBrief: string;
  /** Every technical manifest row represented by this one artist-facing concept. */
  assetIds: readonly string[];
  startHere?: boolean;
}

const WEAPON_CREATIVE_BRIEFS = {
  'bone-scythe': 'A giant rib sharpened into a pale crescent blade on a long black haft, with a restrained cyan spectral edge.',
  'soul-bolt': 'A jagged pale-blue memory shard shaped like an arrowhead, with the suggestion of a condemned face trapped inside.',
  'hellfire-sigil': 'A bold broken circle of red-orange ritual marks, simple enough to read both as an icon and a ground brand.',
  'grave-lance': 'A long narrow spearhead made from bone and cyan soul light, built around an unmistakably piercing silhouette.',
  'wailing-shards': 'A cluster of translucent grave-glass shards containing tiny screaming faces, with one clear primary projectile.',
  'cinder-reliquary': 'A chained miniature ossuary or censer cracked open while a ring of grave ash escapes.',
  'ashen-longbow': 'A black-yew and bone longbow scorched at the tips, strung with pale soul thread beside ash-feathered arrows.',
  'bloodletter-axe': 'A broad executioner axe with hooked corners, deep blood channels, and a silhouette that suggests its returning flight.',
  'dirge-staff': 'A black funeral staff crowned by a cracked choir bell and a caged cyan soul flame.',
  'poison-flask': 'A squat plague-apothecary bottle held in an iron wrap and filled with sickly green venom.',
  'sanguine-needle': 'An ornate bloodletting lancet with a crimson reservoir, avoiding the look of a modern medical syringe.',
  'spectral-chains': 'A length of black barbed chain fading into translucent cyan links and ending in a hooked manacle.',
  'gravetide-repeater': 'A gothic repeating hand-crossbow with an ossuary magazine and a heavy grave-iron mechanism.',
  'saintbreaker-pike': 'A brutal iron pike whose spearhead is formed from a cracked saint statue and broken halo.',
  'ashen-orbit': 'Three uneven burned relic fragments—a saint-mask shard, bone, and tarnished gold—circling a dead ember.',
  'choir-of-teeth': 'A hinged jaw-shaped reliquary packed with mismatched teeth, several fanning outward like projectiles.',
  'eclipse-brand': 'A black-sun branding seal with a thin gold rim being swallowed by a deep violet center.',
  'rustbound-dagger': 'A narrow corroded pilgrim knife wrapped in stained prayer cloth.',
  'pilgrims-sling': 'A worn leather sling tied with prayer strips and carrying a smooth, consecrated black stone.',
  'grave-spark': 'A chipped gravestone flint or charred funeral taper producing one pale grave flame.',
  bonefan: 'A folding war fan made from sharpened ribs, visually explaining the spread of bone shards.',
  candlebrand: 'An iron branding staff tipped with a devotional candle and surrounded by a restrained ring of pale-gold fire.',
  'bellringer-mace': 'A heavy mace whose head is a cracked church bell, with the clapper still visible inside.',
  'crowfeather-arbalest': 'A stocky black arbalest shown with one oversized crow-fletched bolt.',
  gravecleaver: 'A short coffin-bladed executioner sword with chipped iron, grave runes, and a strong close-range silhouette.',
  'frozen-orb': 'A cracked funerary-glass sphere containing an icy skull, with three distinct icicles orbiting its cyan core.',
  'meteor-hammer': 'A two-handed black-iron maul whose head resembles a cracked ember meteor; this is a grave maul, not the historical rope-and-weight weapon.',
  'exploding-revolver': 'A short baroque hand cannon with a coffin-shaped cylinder and ember-lit explosive chambers.',
  'infernal-blunderbuss': 'An archaic black-powder blunderbuss whose flared muzzle resembles a cathedral gargoyle mouth glowing with restrained hellfire.',
  'spike-trap': 'A low folding iron trap with penitential spikes, hinge chains, and narrow blood channels.',
  'pouch-of-chaos': 'A stitched ritual pouch holding mismatched cursed phials, with strange colored vapors leaking from its mouth.',
  'tesla-coil': 'A tomb-top copper coil wound around a black reliquary, discharging pale cyan soul lightning rather than looking like laboratory equipment.',
} satisfies Record<WeaponId, string>;

const WEAPON_WORLD_ASSETS: Partial<Record<WeaponId, string>> = {
  'bone-scythe': 'weapon-bone-scythe',
  'soul-bolt': 'weapon-soul-bolt',
  'hellfire-sigil': 'weapon-hellfire-sigil',
  'grave-lance': 'weapon-grave-lance',
  'wailing-shards': 'weapon-wailing-shards',
  'cinder-reliquary': 'weapon-cinder-reliquary',
  'ashen-longbow': 'weapon-ashen-longbow',
  'bloodletter-axe': 'weapon-bloodletter-axe',
  'dirge-staff': 'weapon-dirge-staff',
  'poison-flask': 'weapon-poison-flask',
  'sanguine-needle': 'weapon-sanguine-needle',
  'spectral-chains': 'weapon-spectral-chains',
  'gravetide-repeater': 'weapon-gravetide-repeater',
  gravecleaver: 'weapon-gravecleaver',
  'meteor-hammer': 'weapon-bellringer-mace',
  'tesla-coil': 'weapon-tesla-coil',
};

const ARTIFACT_CREATIVE_BRIEFS = {
  'pendant-of-vigor': 'A tarnished iron necklace with a small lion-head medallion holding a pale-cyan soul ember; make it a locket only if it visibly opens.',
  'winged-sandals': 'Worn pilgrim sandals with small bone or spectral wings at the heels, avoiding bright heroic-Greek styling.',
  'magnet-stone': 'A black lodestone wrapped in rusted wire, pulling tiny soul-blue iron filings toward itself.',
  'sharpened-stone': 'A grooved executioner whetstone covered in metal filings, with one blood-darkened edge.',
  'blood-vial': 'A stoppered apothecary vial of dark blood held inside a black-iron cage and sealed with wax.',
  'reinforced-buckler': 'A dented round buckler made from reliquary iron, with a broken-halo boss and one cyan soul rivet.',
  'hallowed-ash': 'A small sealed censer or ampoule of pale ash marked by a broken golden saint sigil.',
  'vampiric-fury': 'A long silver reliquary fang wrapped in red cord, with a blood drop suspended from its tip.',
  'soul-lantern': 'A small funeral lantern imprisoning one pale-cyan soul flame behind cathedral-shaped bars.',
  'shadow-cloak': 'A folded, ragged black hooded cloak whose hem dissolves into pale spectral mist.',
  'lucky-clover': 'A four-leaf clover dried black beneath cracked reliquary glass, with one leaf faintly gilded so it feels funerary rather than cheerful.',
  'unstable-core': 'A cracked black-stone soul core clamped inside an iron reliquary cage, leaking cyan-violet light.',
  'spiked-collar': 'A heavy penitential iron collar with inward thorns, old blood, and one broken chain.',
  'cursed-hourglass': 'A black-iron hourglass whose blood-red sand flows upward through cracked glass.',
  'golden-egg': 'A small gilded funerary egg split by black cracks and leaking soul light, deliberately unsettling rather than whimsical.',
  'death-gaze': 'An embalmed eye mounted in a cracked black funerary setting, with a skull-like pupil and a black tear.',
  'giants-belt': 'An enormous cracked-hide girdle with a cathedral-arch buckle, coiled around a small skull to show its scale.',
  'wardens-eye': 'A carved stone eye held behind prison-like iron bars, with a cyan iris and restrained gold ring.',
  'soul-furnace': 'A palm-sized iron furnace with a ribbed reliquary door, fed by cyan souls and orange coals.',
  'extra-pocket': 'A weathered pilgrim satchel sewn with impossible nested pockets, with soul light leaking through the seams.',
  'spectral-pass': 'A funerary writ or toll token stamped with the Warden seal and dissolving into cyan mist.',
  'ascended-crown': 'A tall black-iron crown shaped like rising cathedral spires, edged with restrained gold and cyan light.',
  'red-ledger': 'A blood-red merchant account book with brass corners, tally marks, and a chained clasp.',
  'heart-of-the-market': 'A preserved heart locked inside a brass merchant scale or cage, with coinlike veins.',
  'crown-of-the-second-damnation': 'A broken crown crudely reforged with a second, smaller circlet nested beneath it.',
  'martyrs-ledger': 'A battered gray prayer ledger pierced by nails and covered in handwritten blood tallies.',
  'black-reliquary': 'A miniature black-stone ossuary bound in iron, with violent violet-cyan light pressing through its seams.',
  'bell-of-the-hollow-host': 'A cracked black processional bell with tiny pale faces visible inside its mouth.',
  'unlit-halo': 'A thin cracked iron halo that remains almost completely dark above a single suspended blood drop.',
  'cracked-prayer-bead': 'One oversized bone or black-stone prayer bead split open by soul light, still tied to frayed cord.',
  'soot-stained-bandage': 'A roll of old linen charred at the edges, marked by soot and one restrained blood stain.',
  'iron-nail-charm': 'A bent martyr nail bound to rough twine, with a tiny saint sigil scratched into its head.',
  'grave-soil-pouch': 'A stitched burial-cloth pouch leaking dark soil and one pale root or soul mote.',
  'pilgrims-step': 'A single battered pilgrim boot or sandal with prayer strips and a faint cyan trail curling from its heel.',
  'wax-seal-of-mercy': 'A broken ivory wax medallion stamped with an open hand and tied to blood-red cord.',
  'martyrs-splinter': 'A blood-dark splinter from a saint stake sealed inside a narrow iron reliquary.',
  'black-candle-stub': 'A low melted votive candle in a bone holder, producing cold blue smoke from a dead wick.',
  'chain-of-lent': 'A short loop of penitential chain with prayer tags and one deliberately missing link.',
  'crowbone-dice': 'Two tiny dice carved from blackened bird bone, accompanied by a single crow feather.',
  'ember-rosary': 'A charred rosary whose beads glow internally like banked funeral coals.',
  'hollow-coin': 'A thin black toll coin punched through its center, with the Warden face worn away.',
  'saintless-mirror': 'A tarnished hand-mirror shard whose missing silver backing forms an empty halo.',
  'blood-tithe-chalice': 'A heavy black communion chalice filled with dark blood and cut with fine tally marks.',
  'funeral-bell-clapper': 'A detached iron bell tongue hanging from torn rope, chipped and blood-darkened.',
  'thornscript-vellum': 'A roll of vellum covered in thornlike crimson writing whose letters pierce the page edges.',
  'reliquary-key': 'A long cathedral key whose bow resembles a miniature chained ossuary.',
  'crown-of-ash': 'A low jagged crown made from fused charcoal and bone, shedding ash through ember-lit cracks.',
  'the-red-testament': 'A thick crimson scripture book with wounded page edges, an iron spine, and a large broken seal.',
  'halo-of-flies': 'A tarnished saint halo around which black flies form a second broken ring.',
  'necromancers-skull': 'A small human skull floating over its broken jaw while violet whispers curl from its teeth.',
} satisfies Record<ArtifactId, string>;

const ARTIFACT_COMPANION_ASSETS: Partial<Record<ArtifactId, readonly string[]>> = {
  'cursed-hourglass': ['artifact-cursed-hourglass'],
};

const POWERUP_CREATIVE_BRIEFS = {
  'mending-soul': 'A green soul flame visibly stitching together a cracked heart-shaped reliquary, benevolent without resembling a modern medical icon.',
  'soul-vacuum': 'A miniature iron censer pulling several cyan wisps into its open center, communicating collection without a sci-fi magnet.',
  'grave-frenzy': 'A cracked funeral bell wreathed in orange soul-fire and edged with restrained gold, aggressive but still unmistakably a safe pickup.',
} satisfies Record<PowerupId, string>;

const DIRECT_VISUAL_CONCEPTS: readonly AssetCreativeConcept[] = [
  {
    id: 'character-haunted', displayName: 'Haunted, the Unremembered', category: 'Characters',
    assetIds: ['player-haunted'],
    creativeBrief: 'A hooded condemned revenant in torn black grave-cloth, carrying a bone scythe and lit by a small pale-cyan soul glow; keep the silhouette readable when reused as a corrupted Death Echo.',
  },
  {
    id: 'character-penitent', displayName: 'The Penitent, Bearer of the Last Burden', category: 'Characters',
    assetIds: ['player-penitent'],
    creativeBrief: 'A broad, stooped pilgrim in battered plate and heavy chains, braced around an oversized Gravecleaver so endurance and burden read before detail.',
  },
  {
    id: 'character-ashwalker', displayName: 'Ashwalker, the Cinder Between Worlds', category: 'Characters',
    assetIds: ['player-ashwalker'],
    creativeBrief: 'A lean, fast archer wrapped in charred cloth, with an Ashen Longbow and fine ember cracks that glow warm without borrowing the enemies’ crimson danger rim.',
  },
  {
    id: 'enemy-lost-soul', displayName: 'Lost Soul', category: 'Enemies & Bosses',
    assetIds: ['enemy-lost-soul'],
    creativeBrief: 'A small hooded spirit in a frayed burial shroud, its face almost erased except for a weak cyan remnant trapped inside.',
  },
  {
    id: 'enemy-grave-crawler', displayName: 'Grave Crawler', category: 'Enemies & Bosses',
    assetIds: ['enemy-crawler'],
    creativeBrief: 'A starved condemned body forced onto all fours, with exposed ribs and dragging grave-cloth creating a low, fast silhouette.',
  },
  {
    id: 'enemy-limbo-knight', displayName: 'Limbo Knight', category: 'Enemies & Bosses',
    assetIds: ['enemy-limbo-knight'],
    creativeBrief: 'A bulky dead knight in tarnished black plate, sealed helm, and ruined penitential tabard, built as a slow wall among smaller souls.',
  },
  {
    id: 'enemy-plague-crawler', displayName: 'Plague Crawler', category: 'Enemies & Bosses',
    assetIds: ['enemy-plague-crawler'],
    creativeBrief: 'A diseased corpse-crawler with swollen joints and a leaking green-black belly, clearly related to—but fouler and heavier than—the Grave Crawler.',
  },
  {
    id: 'enemy-tormented-shade', displayName: 'Tormented Shade', category: 'Enemies & Bosses',
    assetIds: ['enemy-tormented-shade'],
    creativeBrief: 'An elongated spectral prisoner being pulled apart by its own shadow, with a pale soul core visible through the split form.',
  },
  {
    id: 'enemy-screamer', displayName: 'Screamer / Banshee Queen', category: 'Enemies & Bosses',
    assetIds: ['enemy-screamer'],
    creativeBrief: 'A gaunt shrouded revenant with an impossible open mouth and rib-like organ folds; a crown-shaped torn veil should let the same art feel regal when enlarged for the Queen.',
  },
  {
    id: 'enemy-wretched-runt', displayName: 'Wretched Runt', category: 'Enemies & Bosses',
    assetIds: ['enemy-wretched-runt'],
    creativeBrief: 'An undersized shackled prisoner with a hunched back and oversized grasping hands, pathetic at a glance but vicious rather than comic.',
  },
  {
    id: 'enemy-stalker', displayName: 'Veil Stalker / Sinbound Stalker', category: 'Enemies & Bosses',
    assetIds: ['enemy-stalker'],
    creativeBrief: 'A tall blade-thin executioner hidden behind funeral veils, coiled for a sudden lunge and simple enough to remain legible under the cursed blue tint.',
  },
  {
    id: 'enemy-flayed-wanderer', displayName: 'Flayed Wanderer', category: 'Enemies & Bosses',
    assetIds: ['enemy-flayed-wanderer'],
    creativeBrief: 'A skinless pilgrim still wrapped in strips of burial cloth, using a raw red-and-bone silhouette instead of fine gore detail.',
  },
  {
    id: 'enemy-lantern-ghost', displayName: 'Lantern Ghost / Lich King', category: 'Enemies & Bosses',
    assetIds: ['enemy-lantern-ghost'],
    creativeBrief: 'A floating grave-cleric carrying an iron lantern full of trapped cyan souls, with a ragged mitre or crown that still reads when enlarged into the summoner elite.',
  },
  {
    id: 'enemy-gravebound-archer', displayName: 'Gravebound Archer', category: 'Enemies & Bosses',
    assetIds: ['enemy-gravebound-archer'],
    creativeBrief: 'A skeletal archer lashed to a bent black-yew bow, with a burial-shroud cape and grave-marker-shaped quiver making the ranged role immediate.',
  },
  {
    id: 'enemy-void-caster', displayName: 'Void Caster / Void Archon', category: 'Enemies & Bosses',
    assetIds: ['enemy-void-caster'],
    creativeBrief: 'A hooded fallen cleric whose face is a violet absence, framed by asymmetrical ritual sleeves and a few floating relic shards so it reads at normal and elite scale.',
  },
  {
    id: 'enemy-condemned-brute', displayName: 'Condemned Brute', category: 'Enemies & Bosses',
    assetIds: ['enemy-brute'], startHere: true,
    creativeBrief: 'A massive shackled execution-laborer with slab shoulders, an iron muzzle, and a reinforced leading shoulder that clearly announces its charge.',
  },
  {
    id: 'enemy-sentinel-of-woe', displayName: 'Sentinel of Woe', category: 'Enemies & Bosses',
    assetIds: ['enemy-sentinel'], startHere: true,
    creativeBrief: 'A towering cathedral guardian of black iron and cracked stone, crowned by a broken gold halo and shaped like a heavier ceremonial charger than the Brute.',
  },
  {
    id: 'enemy-ember-imp', displayName: 'Ember Imp', category: 'Enemies & Bosses',
    assetIds: ['enemy-ember-imp'], startHere: true,
    creativeBrief: 'A tiny soot-black infernal acolyte clutching a visibly glowing fire flask, with bright orange hands and eyes that remain readable at its small size.',
  },
  {
    id: 'enemy-grave-defiler', displayName: 'Grave Defiler', category: 'Enemies & Bosses',
    assetIds: ['enemy-archer'],
    creativeBrief: 'A stooped corpse-priest carrying a leaking censer or grave urn, its green-black stained hem explaining the hazardous trail; do not depict an archer despite the internal legacy ID.',
  },
  {
    id: 'boss-limbo-warden', displayName: 'The Limbo Warden', category: 'Enemies & Bosses',
    assetIds: ['boss-warden'], startHere: true,
    creativeBrief: 'A towering jailer-judge in black iron plate and torn cathedral vestments, with a broken crown, grave keys, heavy chains, trapped cyan souls, and restrained gold ritual details.',
  },
  {
    id: 'projectile-repeater-bolt', displayName: 'Gravetide Repeater Bolt', category: 'Projectiles & Combat Marks',
    assetIds: ['projectile-crossbow-bolt'],
    creativeBrief: 'A right-facing bone-and-black-iron quarrel with a chipped grave-marker head and a faint pale soul etching along the shaft.',
  },
  {
    id: 'projectile-linear-grave-bolt', displayName: 'Reusable Linear Grave Bolt', category: 'Projectiles & Combat Marks',
    assetIds: ['projectile-laser'],
    creativeBrief: 'A slim grave-iron nail or shard with a bright neutral core and clean pointed silhouette, made to remain coherent when runtime-tinted cyan, ice-blue, or crimson.',
  },
  {
    id: 'projectile-soul-magic-mote', displayName: 'Soul-Magic Mote', category: 'Projectiles & Combat Marks',
    assetIds: ['projectile-magic'],
    creativeBrief: 'A compact knot of pale violet flame curled around a tiny bone rune, luminous and occult without looking like a sci-fi energy ball.',
  },
  {
    id: 'projectile-reliquary-orb', displayName: 'Volatile Reliquary Orb', category: 'Projectiles & Combat Marks',
    assetIds: ['projectile-orb'],
    creativeBrief: 'A cracked glass-or-iron sphere with a clearly visible core and sparse radial fragments, neutral enough to support explosive, frozen, and companion variants through tinting.',
  },
  {
    id: 'projectile-void-orb', displayName: 'Void Orb', category: 'Projectiles & Combat Marks',
    assetIds: ['projectile-void'],
    creativeBrief: 'A dense black-violet tear in reality with an off-center hollow core and a sharp edge that remains obvious when enemy attacks tint it crimson.',
  },
  {
    id: 'combat-poison-pool', displayName: 'Poison Pool', category: 'Projectiles & Combat Marks',
    assetIds: ['poison-ooze'],
    creativeBrief: 'An irregular low green-black puddle with a few bubbles, bone chips, and oily highlights, leaving the runtime red danger rim as the clearest boundary.',
  },
  {
    id: 'pickup-soul-currency', displayName: 'Soul Currency', category: 'Powerups & Pickups',
    assetIds: ['soul'],
    creativeBrief: 'A large pale-cyan spirit flame held inside a broken iron-and-gold ring, valuable and clearly distinct from the smaller experience remnant.',
  },
  {
    id: 'pickup-experience-remnant', displayName: 'Experience Remnant', category: 'Powerups & Pickups',
    assetIds: ['pickup-xp'],
    creativeBrief: 'A small blue-white memory shard or teardrop wisp with a simple silhouette, designed to remain recognizable in dense crowds.',
  },
  {
    id: 'arena-reward-reliquary', displayName: 'Reward Reliquary', category: 'Arena, Props & Buildings',
    assetIds: ['reliquary-chest'], startHere: true,
    creativeBrief: 'A compact cracked black-stone and iron chest sealed by pale-cyan soul light, with only a few worn gold accents so it feels precious without looking clean or royal.',
  },
  {
    id: 'arena-blood-shrine', displayName: 'Blood Shrine', category: 'Arena, Props & Buildings',
    assetIds: ['prop-altar'],
    creativeBrief: 'A low cracked black-stone altar bound in rusted chains, with a shallow sacrificial basin and one restrained crimson rune announcing its dangerous bargain.',
  },
  {
    id: 'arena-soul-brazier', displayName: 'Soul Brazier', category: 'Arena, Props & Buildings',
    assetIds: ['prop-brazier'],
    creativeBrief: 'A squat obsidian-and-iron brazier burning with cold cyan corpse flame, gothic illumination rather than enemy hellfire.',
  },
  {
    id: 'arena-cage', displayName: 'Penitent Cage / Spike-Trap Prop', category: 'Arena, Props & Buildings',
    assetIds: ['prop-cage'],
    creativeBrief: 'A collapsed rusted prisoner cage whose broken bars flare into floor spikes, allowing the silhouette to work as grim scenery and trap dressing.',
  },
  {
    id: 'arena-soul-lantern', displayName: 'Arena Soul Lantern', category: 'Arena, Props & Buildings',
    assetIds: ['prop-lantern'],
    creativeBrief: 'A tarnished iron reliquary lantern containing one pale-cyan captive wisp, with a strong handle-and-cage silhouette.',
  },
  {
    id: 'arena-rubble', displayName: 'Cathedral Rubble', category: 'Arena, Props & Buildings',
    assetIds: ['prop-rubble'],
    creativeBrief: 'A low pile of cracked dark masonry, ash, and one broken chain or carved saint fragment, deliberately subdued so it never resembles a hazard.',
  },
  {
    id: 'arena-skeleton', displayName: 'Chained Skeleton', category: 'Arena, Props & Buildings',
    assetIds: ['prop-skeleton'],
    creativeBrief: 'A condemned skeleton slumped against a broken grave marker with rusted shackles still attached, dry and unlit so it remains background dressing.',
  },
  {
    id: 'arena-blood-market', displayName: 'The Blood Market', category: 'Arena, Props & Buildings',
    assetIds: ['shop-building'],
    creativeBrief: 'A crooked portable shrine-stall of black timber, oxblood cloth, candles, hanging ledgers, and iron scales, with restrained gold light making it read as a merchant.',
  },
  {
    id: 'reward-warden-crown', displayName: 'Warden’s Crown', category: 'Status & Interface',
    assetIds: ['boss-crown'],
    creativeBrief: 'A broken black-iron crown with blunt cathedral spires, tarnished gold edges, and a trapped cyan soul at its center.',
  },
  {
    id: 'reward-reliquary-key', displayName: 'Reliquary Key Symbol', category: 'Status & Interface',
    assetIds: ['boss-key'],
    creativeBrief: 'A long ceremonial iron key with a cathedral-arch bow, a chipped cyan crystal tooth, and one restrained gold binding.',
  },
  {
    id: 'ui-chained-ledger', displayName: 'Chained Ledger Symbol', category: 'Status & Interface',
    assetIds: ['icon-book'],
    creativeBrief: 'An oxblood or black leather ledger bound by a thin chain, with worn gold page edges and a bone clasp.',
  },
  {
    id: 'ui-pilgrim-boots', displayName: 'Pilgrim’s Boots Symbol', category: 'Status & Interface',
    assetIds: ['icon-boots'],
    creativeBrief: 'A pair of worn dark leather boots wrapped in penitential strips, with a faint cyan motion wisp behind the heels.',
  },
  {
    id: 'ui-grave-bow', displayName: 'Grave Bow Symbol', category: 'Status & Interface',
    assetIds: ['icon-bow'],
    creativeBrief: 'A black-yew gothic longbow with bone nocks and a pale ash-grey string, shown in a clean crescent silhouette.',
  },
  {
    id: 'ui-defense', displayName: 'Black-Iron Defense Symbol', category: 'Status & Interface',
    assetIds: ['icon-chest'],
    creativeBrief: 'A compact riveted black-iron cuirass or reliquary chest with a simple gold rim and an old impact scar, conveying protection at icon size.',
  },
  {
    id: 'ui-devotional-ring', displayName: 'Devotional Ring Symbol', category: 'Status & Interface',
    assetIds: ['icon-ring'],
    creativeBrief: 'A tarnished iron ring carrying a tiny cracked relic stone and almost-erased prayer marks.',
  },
  {
    id: 'ui-grave-crozier', displayName: 'Grave Crozier Symbol', category: 'Status & Interface',
    assetIds: ['icon-staff'],
    creativeBrief: 'A gnarled gravewood staff ending in an iron reliquary cage around a violet or cyan soul crystal.',
  },
  {
    id: 'ui-condemned-blade', displayName: 'Condemned Blade Symbol', category: 'Status & Interface',
    assetIds: ['icon-sword'],
    creativeBrief: 'A nicked practical iron sword with a grave-marker pommel and pale edge highlights, unmistakable even at icon size.',
  },
  {
    id: 'ui-void-blade', displayName: 'Void Blade Symbol', category: 'Status & Interface',
    assetIds: ['icon-void-sword'],
    creativeBrief: 'A black sword whose center appears eaten away by violet absence, with one sharp purple fissure and no glossy fantasy ornament.',
  },
  {
    id: 'ui-journal', displayName: 'Journal', category: 'Status & Interface',
    assetIds: ['icon-journal'],
    creativeBrief: 'A chained vellum codex stamped with a small cyan soul seal and a frayed page marker.',
  },
  {
    id: 'ui-run-ledger', displayName: 'Run Ledger', category: 'Status & Interface',
    assetIds: ['icon-stats'],
    creativeBrief: 'An open mortuary ledger filled with tally marks, a tiny skull seal, and one upward gold stroke rather than a modern bar chart.',
  },
  {
    id: 'status-bleeding', displayName: 'Bleeding Status', category: 'Status & Interface',
    assetIds: ['status-bleed'],
    creativeBrief: 'Three descending blood drops crossed by a fresh blade cut, kept bold enough to read above an enemy.',
  },
  {
    id: 'status-burning', displayName: 'Burning Status', category: 'Status & Interface',
    assetIds: ['status-burn'],
    creativeBrief: 'A black candle-flame silhouette with a bright orange core and drifting ash at the tip.',
  },
  {
    id: 'status-poisoned', displayName: 'Poisoned Status', category: 'Status & Interface',
    assetIds: ['status-poison'],
    creativeBrief: 'A cracked green vial leaking one heavy toxic drop, using acidic green that cannot be mistaken for cyan soul light.',
  },
  {
    id: 'status-death-curse', displayName: 'Death / Curse Status', category: 'Status & Interface',
    assetIds: ['status-skull'],
    creativeBrief: 'A bound skull beneath a broken violet halo, with one crimson fissure connecting death and condemnation without becoming a generic pirate skull.',
  },
  {
    id: 'status-slowed', displayName: 'Slowed Status', category: 'Status & Interface',
    assetIds: ['status-slow'],
    creativeBrief: 'A frost-locked iron ankle shackle with a short dragging chain, communicating impaired movement more directly than a standalone snowflake.',
  },
  {
    id: 'arena-floor-set', displayName: 'Arena Floor Tile Set', category: 'Floor Tiles',
    assetIds: ['arena-tile-1', 'arena-tile-2', 'arena-tile-3', 'arena-tile-4', 'arena-tile-5'],
    creativeBrief: 'Five seamless low-contrast cathedral floors: quiet soot-dark flagstone, cracked repair-stapled stone, a faded processional inlay, ash-and-bone-strewn stone, and one faint cyan soul-seep variant.',
  },
];

const AUDIO_CREATIVE_BRIEFS = {
  button: ['Menu Confirmation', 'A dry iron-clasp click followed by a tiny glassy soul chime, restrained enough for repeated navigation.'],
  dash: ['Dash', 'A brief reversed cloak-and-ash rush ending in a faint chain snap, fast and bodily rather than mechanical.'],
  'soul-bolt': ['Soul Bolt', 'A tight spectral crack with a short whispered tail and falling pale chime, intentionally lighter than the larger weapons.'],
  scythe: ['Bone Scythe', 'A broad low metal-and-bone whoosh followed by a short grave-chain rasp, weighty but clear of the next swing.'],
  hellfire: ['Hellfire', 'A low inhaling ignition that collapses into an ember-heavy thump and brief crackle, infernal without becoming an explosion wall.'],
  pickup: ['Pickup', 'A tiny ascending glass-and-soul chime with a soft breath of light, immediately safe and rewarding.'],
  hurt: ['Player Hurt', 'A muted flesh-or-armor impact, brief strained breath, and small soul flicker, with no long vocal line to stack during damage.'],
  'level-up': ['Level Up', 'A somber ascending three-note reliquary chime supported by a very short distant choir, luminous but not triumphant.'],
  boss: ['Warden Arrival / Phase', 'A deep cracked cathedral bell, dragged chain, and controlled sub impact, avoiding heroic brass or trailer-style booms.'],
  shield: ['Soul Shield', 'A glassy ward bloom followed by a low iron ring, with a softer brittle tick when the shield absorbs damage.'],
  victory: ['Trial Complete', 'A restrained minor-key bell-and-choir phrase resolving into one pale hopeful note rather than a celebratory fanfare.'],
  'limbo-ambience': ['Limbo Arena Ambience', 'Cold wind through ruined stone, distant chains, nearly inaudible prayers, and an occasional far cathedral bell over a low non-melodic drone.'],
} satisfies Record<AudioCue, readonly [displayName: string, creativeBrief: string]>;

const weaponConcepts: AssetCreativeConcept[] = (Object.keys(WEAPONS) as WeaponId[]).map((id) => ({
  id: `weapon-${id}`,
  displayName: WEAPONS[id].name,
  category: 'Weapons & Attacks',
  creativeBrief: WEAPON_CREATIVE_BRIEFS[id],
  assetIds: [`icon-weapon-${id}`, ...(WEAPON_WORLD_ASSETS[id] ? [WEAPON_WORLD_ASSETS[id]] : [])],
}));

const artifactConcepts: AssetCreativeConcept[] = (Object.keys(ARTIFACTS) as ArtifactId[]).map((id) => ({
  id: `artifact-${id}`,
  displayName: ARTIFACTS[id].name,
  category: 'Artifacts',
  creativeBrief: ARTIFACT_CREATIVE_BRIEFS[id],
  assetIds: [`icon-artifact-${id}`, ...(ARTIFACT_COMPANION_ASSETS[id] ?? [])],
}));

const powerupConcepts: AssetCreativeConcept[] = (Object.keys(POWERUPS) as PowerupId[]).map((id) => ({
  id: `powerup-${id}`,
  displayName: POWERUPS[id].name,
  category: 'Powerups & Pickups',
  creativeBrief: POWERUP_CREATIVE_BRIEFS[id],
  assetIds: [`icon-powerup-${id}`],
}));

const audioConcepts: AssetCreativeConcept[] = (Object.entries(AUDIO_CREATIVE_BRIEFS) as Array<
  [AudioCue, readonly [string, string]]
>).map(([cue, [displayName, creativeBrief]]) => ({
  id: `sound-${cue}`,
  displayName,
  category: 'Sound & Ambience',
  creativeBrief,
  assetIds: [`audio-${cue}`],
}));

/** Human-facing concepts; the generator validates exact one-to-one coverage of manifest rows. */
export const ASSET_CREATIVE_CONCEPTS: readonly AssetCreativeConcept[] = [
  ...DIRECT_VISUAL_CONCEPTS,
  ...weaponConcepts,
  ...artifactConcepts,
  ...powerupConcepts,
  ...audioConcepts,
];
