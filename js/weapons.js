/**
 * Usable weapon definitions — rifle, shotgun, gatling, grenade, rocket.
 */

export const WEAPON_IDS = ["rifle", "shotgun", "gatling", "grenade", "rocket"];

/** @type {Record<string, object>} */
export const WEAPONS = {
  rifle: {
    id: "rifle",
    name: "Poop Rifle",
    short: "RIFLE",
    desc: "Balanced starter. Steady mid-range splat.",
    projectileType: "bullet",
    magSize: 12,
    reloadTime: 1.05,
    fireRate: 0.14,
    pellets: 1,
    spread: 0.018,
    projectileSpeed: 34,
    projectileLife: 2.4,
    damage: 1,
    bulletScale: 1,
    ammoPerShot: 1,
    windup: 0,
    recoil: 1,
    shake: 0.04,
    color: 0xb8651d,
  },
  shotgun: {
    id: "shotgun",
    name: "Chunk Blaster",
    short: "SHOTGUN",
    desc: "Spread pellets. Short range. Chunky damage.",
    projectileType: "bullet",
    magSize: 6,
    reloadTime: 1.4,
    fireRate: 0.58,
    pellets: 8,
    spread: 0.16,
    projectileSpeed: 24,
    projectileLife: 0.48,
    damage: 1.35,
    bulletScale: 1.2,
    ammoPerShot: 1,
    windup: 0,
    recoil: 1.65,
    shake: 0.085,
    color: 0xc4782a,
  },
  gatling: {
    id: "gatling",
    name: "Turret Hose",
    short: "GATLING",
    desc: "High RoF stream. Wind-up. Ammo hungry.",
    projectileType: "bullet",
    magSize: 60,
    reloadTime: 2.15,
    fireRate: 0.048,
    pellets: 1,
    spread: 0.055,
    projectileSpeed: 40,
    projectileLife: 1.9,
    damage: 0.52,
    bulletScale: 0.82,
    ammoPerShot: 1,
    windup: 0.42,
    recoil: 0.55,
    shake: 0.022,
    color: 0x8a5a28,
  },
  grenade: {
    id: "grenade",
    name: "Stink Nade",
    short: "NADE",
    desc: "Arcing stink bomb. Cook or tap-throw. Splash pop.",
    projectileType: "grenade",
    magSize: 3,
    reloadTime: 1.65,
    fireRate: 0.72,
    pellets: 1,
    spread: 0.02,
    projectileSpeed: 14,
    projectileLife: 4.5,
    throwArc: 9.5,
    fuseTime: 1.75,
    splashRadius: 4.2,
    splashDamage: 2.8,
    selfDamageScale: 0.28,
    damage: 0,
    bulletScale: 1,
    ammoPerShot: 1,
    windup: 0,
    recoil: 1.1,
    shake: 0.06,
    color: 0x6a4a18,
  },
  rocket: {
    id: "rocket",
    name: "U-Launch",
    short: "ROCKET",
    desc: "Fat rocket tube. Slow shot, big boom splash.",
    projectileType: "rocket",
    magSize: 4,
    reloadTime: 2.35,
    fireRate: 0.95,
    pellets: 1,
    spread: 0.012,
    projectileSpeed: 22,
    projectileLife: 3.2,
    splashRadius: 5.5,
    splashDamage: 4.2,
    selfDamageScale: 0.38,
    damage: 2.5,
    bulletScale: 1,
    ammoPerShot: 1,
    windup: 0,
    recoil: 1.85,
    shake: 0.11,
    color: 0x5a4020,
  },
};

/** Cheap optional starting extras for the loadout screen */
export const LOADOUT_EXTRAS = [
  {
    id: "none",
    name: "Nothing Extra",
    desc: "Clean start. Just the gun.",
    apply: null,
  },
  {
    id: "spare_clip",
    name: "Spare Clip",
    desc: "+24 reserve ammo.",
    apply: (ctx) => {
      ctx.reserveBonus = (ctx.reserveBonus || 0) + 24;
    },
  },
  {
    id: "hot_tip",
    name: "Hot Tip",
    desc: "+10% damage this run.",
    apply: (ctx) => {
      ctx.mods.damage *= 1.1;
    },
  },
  {
    id: "thick_shell",
    name: "Thick Shell",
    desc: "+15 max HP.",
    apply: (ctx) => {
      ctx.mods.maxHpBonus += 15;
    },
  },
];

export function createLoadoutState() {
  return {
    startWeapon: "rifle",
    startExtra: "none",
  };
}

export function weaponLabel(id) {
  return WEAPONS[id]?.short || String(id).toUpperCase();
}
