/**
 * Usable weapon definitions — rifle (starter), shotgun, gatling.
 * Mag / fire feel / pellet count differ so they don't play the same.
 */

export const WEAPON_IDS = ["rifle", "shotgun", "gatling"];

/** @type {Record<string, object>} */
export const WEAPONS = {
  rifle: {
    id: "rifle",
    name: "Poop Rifle",
    short: "RIFLE",
    desc: "Balanced starter. Steady mid-range splat.",
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
