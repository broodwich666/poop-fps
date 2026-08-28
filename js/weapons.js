/**
 * ~100 usable weapons across 11 archetypes. Variants share archetype models (tint/scale in game).
 */

export const ARCHETYPES = [
  "rifle", "shotgun", "gatling", "grenade", "rocket",
  "mine", "plunger", "sniper", "puddle", "turret", "boomerang",
];

export const ARCHETYPE_LABELS = {
  rifle: "Rifle",
  shotgun: "Shotgun",
  gatling: "Gatling",
  grenade: "Grenade",
  rocket: "Rocket",
  mine: "Mine",
  plunger: "Plunger",
  sniper: "Sniper",
  puddle: "Puddle",
  turret: "Turret",
  boomerang: "Boomerang",
};

const ARCHETYPE_BASES = {
  rifle: {
    archetype: "rifle", projectileType: "bullet", name: "Poop Rifle", short: "RIFLE",
    desc: "Balanced starter. Steady mid-range splat.",
    magSize: 12, reloadTime: 1.05, fireRate: 0.14, pellets: 1, spread: 0.018,
    projectileSpeed: 34, projectileLife: 2.4, damage: 1, bulletScale: 1, windup: 0,
    recoil: 1, shake: 0.04, color: 0xb8651d, modelScale: 1,
  },
  shotgun: {
    archetype: "shotgun", projectileType: "bullet", name: "Chunk Blaster", short: "SHOTGUN",
    desc: "Spread pellets. Short range. Chunky damage.",
    magSize: 6, reloadTime: 1.4, fireRate: 0.58, pellets: 8, spread: 0.16,
    projectileSpeed: 24, projectileLife: 0.48, damage: 1.35, bulletScale: 1.2, windup: 0,
    recoil: 1.65, shake: 0.085, color: 0xc4782a, modelScale: 1,
  },
  gatling: {
    archetype: "gatling", projectileType: "bullet", name: "Turret Hose", short: "GATLING",
    desc: "High RoF stream. Wind-up. Ammo hungry.",
    magSize: 60, reloadTime: 2.15, fireRate: 0.048, pellets: 1, spread: 0.055,
    projectileSpeed: 40, projectileLife: 1.9, damage: 0.52, bulletScale: 0.82, windup: 0.42,
    recoil: 0.55, shake: 0.022, color: 0x8a5a28, modelScale: 1,
  },
  grenade: {
    archetype: "grenade", projectileType: "grenade", name: "Stink Nade", short: "NADE",
    desc: "Arcing stink bomb. Cook or tap-throw. Splash pop.",
    magSize: 3, reloadTime: 1.65, fireRate: 0.72, pellets: 1, spread: 0.02,
    projectileSpeed: 14, projectileLife: 4.5, throwArc: 9.5, fuseTime: 1.75,
    splashRadius: 7.8, splashDamage: 11, selfDamageScale: 0.22, damage: 0, bulletScale: 1,
    windup: 0, recoil: 1.1, shake: 0.06, color: 0x6a4a18, modelScale: 1,
  },
  rocket: {
    archetype: "rocket", projectileType: "rocket", name: "U-Launch", short: "ROCKET",
    desc: "Fat rocket tube. Slow shot, big boom splash.",
    magSize: 4, reloadTime: 2.35, fireRate: 0.95, pellets: 1, spread: 0.012,
    projectileSpeed: 22, projectileLife: 3.2, splashRadius: 9.2, splashDamage: 14,
    selfDamageScale: 0.3, damage: 2.5, bulletScale: 1, windup: 0,
    recoil: 1.85, shake: 0.11, color: 0x5a4020, modelScale: 1,
  },
  mine: {
    archetype: "mine", projectileType: "mine", name: "Sticky Mine", short: "MINE",
    desc: "Toss a sticky mine. Arms on landing, pops when foes step close.",
    magSize: 4, reloadTime: 1.5, fireRate: 0.85, pellets: 1, spread: 0.03,
    projectileSpeed: 12, projectileLife: 5, throwArc: 5, fuseTime: 0.4,
    splashRadius: 3.6, splashDamage: 3.2, selfDamageScale: 0.22, damage: 0, bulletScale: 1,
    windup: 0, recoil: 0.9, shake: 0.05, color: 0x4a3820, modelScale: 1,
    triggerRadius: 2.2, armTime: 0.55,
  },
  plunger: {
    archetype: "plunger", projectileType: "melee", name: "Plunge Doom", short: "PLUNGER",
    desc: "Melee thwack. Short range splat smack.",
    magSize: 999, reloadTime: 0.5, fireRate: 0.42, pellets: 1, spread: 0.08,
    projectileSpeed: 0, projectileLife: 0.12, damage: 2.4, bulletScale: 1,
    meleeRange: 2.8, windup: 0, recoil: 0.8, shake: 0.055, color: 0xc45a28, modelScale: 1,
  },
  sniper: {
    archetype: "sniper", projectileType: "bullet", name: "Long Brown", short: "SNIPER",
    desc: "Slow, precise, hard-hitting single shots.",
    magSize: 5, reloadTime: 1.8, fireRate: 0.88, pellets: 1, spread: 0.004,
    projectileSpeed: 58, projectileLife: 3.2, damage: 3.6, bulletScale: 0.9, windup: 0,
    recoil: 1.4, shake: 0.07, color: 0x3a4a30, modelScale: 1.08,
  },
  puddle: {
    archetype: "puddle", projectileType: "puddle", name: "Puddle Bomb", short: "PUDDLE",
    desc: "Throws a goop puddle. Ground DoT zone after splash.",
    magSize: 3, reloadTime: 1.7, fireRate: 0.78, pellets: 1, spread: 0.025,
    projectileSpeed: 13, projectileLife: 4, throwArc: 8, fuseTime: 0.05,
    splashRadius: 3.2, splashDamage: 1.2, selfDamageScale: 0.15, damage: 0, bulletScale: 1,
    puddleRadius: 3.8, puddleDuration: 6, puddleDps: 1.1,
    windup: 0, recoil: 1, shake: 0.05, color: 0x3a5a20, modelScale: 1,
  },
  turret: {
    archetype: "turret", projectileType: "turret", name: "Deploy Turret", short: "TURRET",
    desc: "Plant a poop turret. Auto-shoots nearby foes.",
    magSize: 2, reloadTime: 2.5, fireRate: 1.1, pellets: 1, spread: 0,
    projectileSpeed: 0, projectileLife: 0, damage: 0.85, bulletScale: 1,
    turretDuration: 22, turretFireRate: 0.48, turretRange: 16,
    windup: 0, recoil: 0.6, shake: 0.04, color: 0x4a4a38, modelScale: 1,
  },
  boomerang: {
    archetype: "boomerang", projectileType: "boomerang", name: "Brown Rang", short: "BOOM",
    desc: "Curving poop disk. Out and back hits.",
    magSize: 3, reloadTime: 1.35, fireRate: 0.68, pellets: 1, spread: 0.04,
    projectileSpeed: 26, projectileLife: 2.2, damage: 1.5, bulletScale: 1.1,
    returnAt: 0.45, windup: 0, recoil: 0.95, shake: 0.045, color: 0x7a5020, modelScale: 1,
  },
};

const NAME_BITS = {
  rifle: { pre: ["Rusty", "Tactical", "Brown", "Scoped", "Compact", "Heavy", "Swift", "Dirty", "Golden"], suf: ["Rifle", "Striker", "Pew", "Blaster", "Tapper"] },
  shotgun: { pre: ["Chunk", "Double", "Sawed", "Boom", "Wide", "Street", "Barn", "Muck", "Royal"], suf: ["Blaster", "Bark", "Spray", "Popper", "Boom"] },
  gatling: { pre: ["Turret", "Belt", "Spin", "Hose", "Rapid", "Brass", "Oil", "Grind", "Turbo"], suf: ["Hose", "Feed", "Storm", "Drill", "Rain"] },
  grenade: { pre: ["Stink", "Foul", "Ripe", "Gassy", "Chunk", "Rotten", "Sour", "Noxious", "Rank"], suf: ["Nade", "Egg", "Orb", "Pop", "Ball"] },
  rocket: { pre: ["U-", "Mega", "Fat", "Tube", "Boom", "Sky", "Heavy", "Gunk", "Launch"], suf: ["Launch", "Tube", "Rack", "Punch", "Boom"] },
  mine: { pre: ["Sticky", "Trip", "Goo", "Hidden", "Bury", "Sneak", "Trap", "Lurk", "Snap"], suf: ["Mine", "Trap", "Pod", "Snare", "Pop"] },
  plunger: { pre: ["Plunge", "Suction", "Clog", "Thwack", "Rubber", "Bathroom", "Hero", "Mega", "Turbo"], suf: ["Doom", "Smack", "King", "Bop", "Wack"] },
  sniper: { pre: ["Long", "Far", "Scope", "Silent", "Dusty", "Hill", "Pigeon", "Brown", "Eagle"], suf: ["Brown", "Sight", "Reach", "Pick", "Line"] },
  puddle: { pre: ["Puddle", "Goop", "Slime", "Muck", "Ooze", "Spill", "Drip", "Pool", "Flood"], suf: ["Bomb", "Jar", "Can", "Blob", "Splash"] },
  turret: { pre: ["Deploy", "Auto", "Mini", "Gunk", "Watch", "Poop", "Sentry", "Camp", "Field"], suf: ["Turret", "Nest", "Pod", "Gun", "Post"] },
  boomerang: { pre: ["Brown", "Curved", "Spin", "Return", "Whirl", "Disk", "Loop", "Arc", "Swirl"], suf: ["Rang", "Disk", "Loop", "Spin", "Cut"] },
};

const COLOR_TINTS = [0, 0x0a0804, 0x120c06, 0x180e08, 0x1a1006, 0x201408, 0x28180a, 0x301c0c, 0x382010];

function pick(list, i) {
  return list[i % list.length];
}

function buildWeaponId(arch, index) {
  if (index === 0 && ["rifle", "shotgun", "gatling", "grenade", "rocket"].includes(arch)) return arch;
  return `${arch}_${index}`;
}

function variantMul(base, idx, spread = 0.12) {
  const t = (idx % 9) / 8;
  const wobble = ((idx * 7 + 3) % 11) / 11 * spread;
  return 1 + (t - 0.5) * spread * 2 + wobble - spread / 2;
}

function buildAllWeapons() {
  /** @type {Record<string, object>} */
  const weapons = {};
  /** @type {string[]} */
  const ids = [];

  for (const arch of ARCHETYPES) {
    const base = ARCHETYPE_BASES[arch];
    const bits = NAME_BITS[arch];
    for (let i = 0; i < 9 && ids.length < 100; i++) {
      const id = buildWeaponId(arch, i);
      const vm = variantMul(1, i, 0.14);
      const name = i === 0 && base.name ? base.name : `${pick(bits.pre, i + arch.length)} ${pick(bits.suf, i * 2 + 1)}`;
      const short = base.short.slice(0, 4) + (i > 0 ? String(i) : "");
      weapons[id] = {
        ...base,
        id,
        archetype: arch,
        name,
        short: short.slice(0, 8),
        desc: base.desc,
        magSize: Math.max(1, Math.round(base.magSize * variantMul(1, i, 0.18))),
        reloadTime: +(base.reloadTime * variantMul(1, i, 0.1)).toFixed(2),
        fireRate: +(base.fireRate / variantMul(1, i, 0.12)).toFixed(3),
        spread: +(base.spread * variantMul(1, i, 0.15)).toFixed(4),
        projectileSpeed: +(base.projectileSpeed * variantMul(1, i, 0.1)).toFixed(1),
        damage: +(base.damage * variantMul(1, i, 0.14)).toFixed(2),
        bulletScale: +(base.bulletScale * variantMul(1, i, 0.08)).toFixed(2),
        color: (base.color + (COLOR_TINTS[i] || 0)) & 0xffffff,
        modelScale: +(base.modelScale * variantMul(1, i, 0.06)).toFixed(2),
      };
      if (base.splashRadius) {
        const splashMul = i === 0 ? 1 : variantMul(1, i, 0.1);
        const dmgMul = i === 0 ? 1 : variantMul(1, i, 0.12);
        weapons[id].splashRadius = +(base.splashRadius * splashMul).toFixed(2);
        weapons[id].splashDamage = +(base.splashDamage * dmgMul).toFixed(2);
      }
      if (base.pellets > 1) {
        weapons[id].pellets = Math.max(4, Math.round(base.pellets * variantMul(1, i, 0.08)));
      }
      ids.push(id);
    }
  }

  // 100th weapon — bonus rifle variant
  if (ids.length < 100) {
    const id = "rifle_elite";
    weapons[id] = {
      ...ARCHETYPE_BASES.rifle,
      id,
      archetype: "rifle",
      name: "Elite Brown Rifle",
      short: "ELITE",
      desc: "Premium rifle variant. Tight spread, fast shots.",
      magSize: 14,
      fireRate: 0.11,
      spread: 0.012,
      projectileSpeed: 38,
      damage: 1.15,
      color: 0xd4a040,
      modelScale: 1.05,
    };
    ids.push(id);
  }

  return { weapons, ids: ids.slice(0, 100) };
}

const built = buildAllWeapons();
export const WEAPONS = built.weapons;
export const WEAPON_IDS = built.ids;

export function getWeaponArchetype(id) {
  return WEAPONS[id]?.archetype || String(id).split("_")[0];
}

export function weaponsForArchetype(arch) {
  return WEAPON_IDS.filter((id) => getWeaponArchetype(id) === arch);
}

/** Cheap optional starting extras for the loadout screen */
export const LOADOUT_EXTRAS = [
  { id: "none", name: "Nothing Extra", desc: "Clean start. Just the gun.", apply: null },
  { id: "spare_clip", name: "Spare Clip", desc: "+24 reserve ammo.", apply: (ctx) => { ctx.reserveBonus = (ctx.reserveBonus || 0) + 24; } },
  { id: "hot_tip", name: "Hot Tip", desc: "+10% damage this run.", apply: (ctx) => { ctx.mods.damage *= 1.1; } },
  { id: "thick_shell", name: "Thick Shell", desc: "+15 max HP.", apply: (ctx) => { ctx.mods.maxHpBonus += 15; } },
];

export function createLoadoutState() {
  return { startWeapon: "rifle", startExtra: "none" };
}

export function weaponLabel(id) {
  return WEAPONS[id]?.short || String(id).toUpperCase().slice(0, 8);
}

export function randomWeaponId() {
  return WEAPON_IDS[Math.floor(Math.random() * WEAPON_IDS.length)];
}
