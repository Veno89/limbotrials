import menuBackground from '../../../assets/sprites/backgrounds/realmainmenubackground.png?url';
import legacyBackground from '../../../assets/sprites/backgrounds/characterselectbackground.png?url';
import playerHaunted from '../../../assets/sprites/playersprites/Haunted.png?url';
import hauntedIdle1 from '../../../assets/test/haunted/haunted_idle_1.png?url';
import playerPenitent from '../../../assets/sprites/playersprites/bulwark.png?url';
import playerAshwalker from '../../../assets/sprites/playersprites/Arcanist.png?url';
import enemyRunt from '../../../assets/sprites/enemies/enemy_wretched_runt.png?url';
import enemyLostSoul from '../../../assets/test/enemies/lost_soul.png?url';
import enemyCrawler from '../../../assets/test/enemies/grave_crawler.png?url';
import enemyKnight from '../../../assets/sprites/enemies/enemy_knight.png?url';
import enemyWraith from '../../../assets/sprites/enemies/enemy_tormented_shade.png?url';
import enemyBrute from '../../../assets/sprites/enemies/enemy_limbo_abomination.png?url';
import enemyVoidCaster from '../../../assets/sprites/enemies/enemy_void_caster.png?url';
import enemyScreamer from '../../../assets/sprites/enemies/enemy_screamer.png?url';
import enemyFlayedWanderer from '../../../assets/sprites/enemies/enemy_flayed_wanderer.png?url';
import enemyLanternGhost from '../../../assets/sprites/enemies/enemy_ghost.png?url';
import enemySentinel from '../../../assets/sprites/enemies/enemy_sentinel_of_woe.png?url';
import enemyGraveboundArcher from '../../../assets/sprites/enemies/enemy_gravebound_archer.png?url';
import enemyVeilStalker from '../../../assets/sprites/enemies/enemy_veil_stalker.png?url';
import enemyMireCrawler from '../../../assets/sprites/enemies/enemy_mire_crawler.png?url';
import enemyStalker from '../../../assets/test/enemies/stalker.png?url';
import enemyArcher from '../../../assets/sprites/enemies/enemy_archer.png?url';
import bossWarden from '../../../assets/sprites/bossprites/floor boss 1.png?url';
import projectileVoid from '../../../assets/sprites/projectiles/proj_void_orb.png?url';
import projectileMagic from '../../../assets/sprites/projectiles/proj_magic.png?url';
import projectileLaser from '../../../assets/sprites/projectiles/proj_laser.png?url';
import iconVoidSword from '../../../assets/sprites/items/icon_sword_void.png?url';
import iconSword from '../../../assets/sprites/items/icon_sword_steel.png?url';
import iconBoots from '../../../assets/sprites/items/icon_leather_boots.png?url';
import iconChest from '../../../assets/sprites/items/icon_iron_chest.png?url';
import reliquaryChest from '../../../assets/sprites/items/reliquary_chest.png?url';
import iconBow from '../../../assets/sprites/items/icon_bow_long.png?url';
import iconStaff from '../../../assets/sprites/items/icon_staff_archmage.png?url';
import bossKey from '../../../assets/sprites/items/key_boss.png?url';
import artifactCursedHourglass from '../../../assets/test/artifacts/cursed_hourglass.png?url';
import pickupXp from '../../../assets/test/misc/xp.png?url';
import statusBleed from '../../../assets/test/misc/blood_drop.png?url';
import statusPoison from '../../../assets/test/misc/poison.png?url';
import statusSkull from '../../../assets/test/misc/skull.png?url';
import iconJournal from '../../../assets/test/misc/journal.png?url';
import iconStats from '../../../assets/test/misc/stats.png?url';
import weaponBoneScythe from '../../../assets/test/weapons/bone_scythe.png?url';
import weaponSoulBolt from '../../../assets/test/weapons/soul_bolt.png?url';
import weaponHellfireSigil from '../../../assets/test/weapons/hellfire_sigil.png?url';
import weaponGraveLance from '../../../assets/test/weapons/grave_lance.png?url';
import weaponWailingShards from '../../../assets/test/weapons/wailing_shard.png?url';
import weaponCinderReliquary from '../../../assets/test/weapons/cinder_reliquary.png?url';
import weaponAshenLongbow from '../../../assets/test/weapons/ashen_longbow.png?url';
import weaponBloodletterAxe from '../../../assets/test/weapons/bloodletter_axe.png?url';
import weaponDirgeStaff from '../../../assets/test/weapons/dirge_staff.png?url';
import shopBuilding from '../../../assets/test/buildings/shop.png?url';
import arenaTile1 from '../../../assets/test/tiles/tile1.png?url';
import arenaTile2 from '../../../assets/test/tiles/tile2.png?url';
import arenaTile3 from '../../../assets/test/tiles/tile3.png?url';
import arenaTile4 from '../../../assets/test/tiles/tile4.png?url';
import arenaTile5 from '../../../assets/test/tiles/tile5.png?url';
import propSkeleton from '../../../assets/environment/props/prop_chained_skeleton.png?url';
import propCage from '../../../assets/environment/props/prop_rusty_cage.png?url';
import propAltar from '../../../assets/environment/props/prop_dark_altar.png?url';
import propRubble from '../../../assets/environment/props/prop_rubble_pile.png?url';
import propBrazier from '../../../assets/environment/light_sources/obsidian_magic_brazier.png?url';
import propLantern from '../../../assets/environment/light_sources/spectral_soul_lantern.png?url';

export const ASSETS: Array<[string, string]> = [
  ['menu-background', menuBackground],
  ['legacy-background', legacyBackground],
  ['player-haunted', playerHaunted],
  ['haunted_idle_1', hauntedIdle1],
  ['player-penitent', playerPenitent],
  ['player-ashwalker', playerAshwalker],
  ['enemy-runt', enemyRunt],
  ['enemy-lost-soul', enemyLostSoul],
  ['enemy-crawler', enemyCrawler],
  ['enemy-knight', enemyKnight],
  ['enemy-wraith', enemyWraith],
  ['enemy-brute', enemyBrute],
  ['enemy-void-caster', enemyVoidCaster],
  ['enemy-screamer', enemyScreamer],
  ['enemy-flayed-wanderer', enemyFlayedWanderer],
  ['enemy-lantern-ghost', enemyLanternGhost],
  ['enemy-sentinel', enemySentinel],
  ['enemy-gravebound-archer', enemyGraveboundArcher],
  ['enemy-veil-stalker', enemyVeilStalker],
  ['enemy-mire-crawler', enemyMireCrawler],
  ['enemy-stalker', enemyStalker],
  ['enemy-archer', enemyArcher],
  ['boss-warden', bossWarden],
  ['projectile-void', projectileVoid],
  ['projectile-magic', projectileMagic],
  ['projectile-laser', projectileLaser],
  ['icon-void-sword', iconVoidSword],
  ['icon-sword', iconSword],
  ['icon-boots', iconBoots],
  ['icon-chest', iconChest],
  ['reliquary-chest', reliquaryChest],
  ['icon-bow', iconBow],
  ['icon-staff', iconStaff],
  ['boss-key', bossKey],
  ['artifact-cursed-hourglass', artifactCursedHourglass],
  ['pickup-xp', pickupXp],
  ['status-bleed', statusBleed],
  ['status-poison', statusPoison],
  ['status-skull', statusSkull],
  ['icon-journal', iconJournal],
  ['icon-stats', iconStats],
  ['weapon-poison-flask', statusPoison],
  ['weapon-bone-scythe', weaponBoneScythe],
  ['weapon-soul-bolt', weaponSoulBolt],
  ['weapon-hellfire-sigil', weaponHellfireSigil],
  ['weapon-grave-lance', weaponGraveLance],
  ['weapon-wailing-shards', weaponWailingShards],
  ['weapon-cinder-reliquary', weaponCinderReliquary],
  ['weapon-ashen-longbow', weaponAshenLongbow],
  ['weapon-bloodletter-axe', weaponBloodletterAxe],
  ['weapon-dirge-staff', weaponDirgeStaff],
  ['weapon-sanguine-needle', statusBleed],
  ['shop-building', shopBuilding],
  ['arena-tile-1', arenaTile1],
  ['arena-tile-2', arenaTile2],
  ['arena-tile-3', arenaTile3],
  ['arena-tile-4', arenaTile4],
  ['arena-tile-5', arenaTile5],
  ['prop-skeleton', propSkeleton],
  ['prop-cage', propCage],
  ['prop-altar', propAltar],
  ['prop-rubble', propRubble],
  ['prop-brazier', propBrazier],
  ['prop-lantern', propLantern],

];

