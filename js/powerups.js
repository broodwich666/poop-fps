/**
 * ~1000 power-up pool. Stacking allowed; 3-card offers after each wave.
 */

import { WEAPON_IDS, WEAPONS } from "./weapons.js";

const ADJECTIVES = [
  "Spicy", "Juicy", "Nuclear", "Sticky", "Fermented", "Chunky", "Crispy",
  "Volatile", "Gunky", "Putrid", "Turbo", "Soggy", "Metallic", "Acidic",
  "Blessed", "Cursed", "Lucky", "Rancid", "Glazed", "Feral", "Brown",
  "Toxic", "Greasy", "Fizzy", "Moldy", "Sizzling", "Dank", "Funky",
];

const NOUNS = [
  "Splat", "Spray", "Core", "Pack", "Boost", "Charm", "Gland", "Canister",
  "Serum", "Capsule", "Mote", "Shard", "Totem", "Relic", "Injection",
  "Glob", "Wad", "Clump", "Drip", "Puddle", "Blast", "Fuse", "Tube",
];

function pick(list, i) {
  return list[i % list.length];
}

function makeName(adjI, nounI, suffix = "") {
  const s = suffix ? ` ${suffix}` : "";
  return `${pick(ADJECTIVES, adjI)} ${pick(NOUNS, nounI)}${s}`;
}

/** @typedef {{ id: string, name: string, desc: string, rarity: string, apply: (m: object) => void }} PowerUp */

/** @returns {PowerUp[]} */
export function buildPowerUpPool() {
  /** @type {PowerUp[]} */
  const pool = [];
  let n = 0;
  const seen = new Set();

  const push = (name, desc, rarity, apply, extra = {}) => {
    const id = `pu_${n++}`;
    if (seen.has(name)) return;
    seen.add(name);
    pool.push({ id, name, desc, rarity, apply, ...extra });
  };

  // Weapon unlock cards — sample across full weapon roster
  WEAPON_IDS.forEach((wid, i) => {
    const w = WEAPONS[wid];
    if (!w) return;
    push(
      w.name,
      `Unlock ${w.name} — ${w.desc?.slice(0, 48) || w.archetype}`,
      "rare",
      () => {},
      { grantWeapon: wid },
    );
    if (i % 3 === 0) {
      push(
        `${w.short} Kit`,
        `${w.name} kit (or ammo top-up if owned)`,
        "rare",
        (m) => { m.magBonus += 1; },
        { grantWeapon: wid },
      );
    }
  });

  // Core stat loops
  for (let i = 0; i < 80; i++) {
    const v = 0.04 + (i % 20) * 0.008;
    push(makeName(i, i, "Damage"), `+${Math.round(v * 100)}% damage`, i % 4 === 0 ? "rare" : "common", (m) => { m.damage *= 1 + v; });
  }
  for (let i = 0; i < 70; i++) {
    const v = 0.04 + (i % 18) * 0.009;
    push(makeName(i + 5, i + 2, "RoF"), `+${Math.round(v * 100)}% fire rate`, i % 5 === 0 ? "rare" : "common", (m) => { m.fireRate *= 1 + v; });
  }
  for (let i = 0; i < 60; i++) {
    const v = 1 + (i % 6);
    push(makeName(i + 10, i + 4, "Mag"), `+${v} magazine size`, v >= 4 ? "rare" : "common", (m) => { m.magBonus += v; });
  }
  for (let i = 0; i < 55; i++) {
    const v = 0.06 + (i % 15) * 0.012;
    push(makeName(i + 3, i + 6, "Reload"), `+${Math.round(v * 100)}% reload speed`, i % 4 === 0 ? "rare" : "common", (m) => { m.reloadSpeed *= 1 + v; });
  }
  for (let i = 0; i < 40; i++) {
    const v = 0.02 + (i % 8) * 0.004;
    push(makeName(i + 7, i + 8, "Stride"), `+${Math.round(v * 100)}% move speed`, "common", (m) => { m.moveSpeed *= 1 + v; });
  }
  for (let i = 0; i < 65; i++) {
    const v = 6 + (i % 12) * 2;
    push(makeName(i + 12, i + 3, "Vitality"), `+${v} max HP (heal now)`, v >= 20 ? "rare" : "common", (m) => { m.maxHpBonus += v; m.instantHeal += Math.round(v * 0.6); });
  }
  for (let i = 0; i < 45; i++) {
    const v = 0.02 + (i % 10) * 0.012;
    push(makeName(i + 14, i + 10, "Leech"), `${Math.round(v * 100)}% lifesteal`, i % 3 === 0 ? "rare" : "common", (m) => { m.lifesteal += v; });
  }
  for (let i = 0; i < 35; i++) {
    const v = i % 3 === 0 ? 2 : 1;
    push(makeName(i + 16, i + 11, "Scatter"), `+${v} projectile per shot`, "rare", (m) => { m.extraProjectiles += v; });
  }
  for (let i = 0; i < 40; i++) {
    const v = 1 + (i % 3);
    push(makeName(i + 1, i + 12, "Ricochet"), `Bullets bounce +${v}`, i % 3 === 0 ? "rare" : "common", (m) => { m.bounce += v; });
  }
  for (let i = 0; i < 50; i++) {
    const v = 0.08 + (i % 12) * 0.025;
    push(makeName(i + 4, i + 7, "Caliber"), `+${Math.round(v * 100)}% bullet size`, i % 4 === 0 ? "rare" : "common", (m) => { m.bulletScale *= 1 + v; });
  }
  for (let i = 0; i < 35; i++) {
    const v = 1.5 + (i % 8) * 0.8;
    push(makeName(i + 6, i + 9, "Magnet"), `Ammo magnet +${v.toFixed(0)}m`, i % 3 === 0 ? "rare" : "common", (m) => { m.magnetRange += v; });
  }
  for (let i = 0; i < 40; i++) {
    const v = 1 + (i % 2);
    push(makeName(i + 8, i + 11, "Pierce"), `Pierce +${v} enemy`, "rare", (m) => { m.pierce += v; });
  }
  for (let i = 0; i < 45; i++) {
    const v = 0.03 + (i % 14) * 0.008;
    push(makeName(i + 10, i + 5, "Crit"), `+${Math.round(v * 100)}% crit chance`, i % 4 === 0 ? "rare" : "common", (m) => { m.critChance += v; });
  }
  for (let i = 0; i < 30; i++) {
    const v = 0.12 + (i % 10) * 0.06;
    push(makeName(i + 12, i + 13, "Crit Dmg"), `+${Math.round(v * 100)}% crit damage`, "rare", (m) => { m.critMult += v; });
  }
  for (let i = 0; i < 40; i++) {
    const v = 0.06 + (i % 12) * 0.018;
    push(makeName(i + 15, i, "Focus"), `-${Math.round(v * 100)}% spread`, i % 3 === 0 ? "rare" : "common", (m) => { m.spreadMult *= 1 - v; });
  }
  for (let i = 0; i < 40; i++) {
    const v = 0.12 + (i % 10) * 0.08;
    push(makeName(i + 17, i + 14, "Scavenger"), `+${Math.round(v * 100)}% pickup ammo`, i % 4 === 0 ? "rare" : "common", (m) => { m.pickupMult *= 1 + v; });
  }
  for (let i = 0; i < 35; i++) {
    const v = 4 + (i % 10) * 3;
    push(makeName(i, i + 15, "Recovery"), `Heal ${v} HP now`, "common", (m) => { m.instantHeal += v; });
  }
  for (let i = 0; i < 45; i++) {
    const v = 0.05 + (i % 14) * 0.015;
    push(makeName(i + 18, i + 2, "Velocity"), `+${Math.round(v * 100)}% projectile speed`, "common", (m) => { m.bulletSpeed *= 1 + v; });
  }
  for (let i = 0; i < 40; i++) {
    const v = 0.03 + (i % 12) * 0.007;
    push(makeName(i + 3, i + 4, "Shell"), `-${Math.round(v * 100)}% damage taken`, i % 4 === 0 ? "rare" : "common", (m) => { m.damageTaken *= 1 - v; });
  }
  for (let i = 0; i < 35; i++) {
    const v = 0.04 + (i % 10) * 0.012;
    push(makeName(i + 19, i + 6, "Echo"), `${Math.round(v * 100)}% double shot`, "rare", (m) => { m.echoChance += v; });
  }

  // Splash / explosive themed
  for (let i = 0; i < 50; i++) {
    const v = 0.05 + (i % 12) * 0.015;
    push(makeName(i + 2, i + 16, "Blast"), `+${Math.round(v * 100)}% splash radius`, i % 3 === 0 ? "rare" : "common", (m) => { m.splashMult = (m.splashMult || 1) * (1 + v); });
  }
  for (let i = 0; i < 40; i++) {
    const v = 0.06 + (i % 10) * 0.014;
    push(makeName(i + 6, i + 17, "Boom"), `+${Math.round(v * 100)}% splash damage`, "rare", (m) => { m.splashDamageMult = (m.splashDamageMult || 1) * (1 + v); });
  }
  for (let i = 0; i < 30; i++) {
    const v = 0.04 + (i % 8) * 0.01;
    push(makeName(i + 11, i + 18, "Fuse"), `-${Math.round(v * 100)}% nade fuse time`, "common", (m) => { m.fuseMult = (m.fuseMult || 1) * (1 - v); });
  }
  for (let i = 0; i < 30; i++) {
    const v = 0.05 + (i % 9) * 0.012;
    push(makeName(i + 13, i + 19, "Rocket"), `+${Math.round(v * 100)}% rocket speed`, "rare", (m) => { m.rocketSpeedMult = (m.rocketSpeedMult || 1) * (1 + v); });
  }
  for (let i = 0; i < 25; i++) {
    const v = 0.08 + (i % 7) * 0.02;
    push(makeName(i + 16, i + 20, "Puddle"), `+${Math.round(v * 100)}% puddle DoT`, "rare", (m) => { m.puddleMult = (m.puddleMult || 1) * (1 + v); });
  }
  for (let i = 0; i < 25; i++) {
    const v = 0.1 + (i % 6) * 0.03;
    push(makeName(i + 18, i + 21, "Turret"), `+${Math.round(v * 100)}% turret duration`, "rare", (m) => { m.turretMult = (m.turretMult || 1) * (1 + v); });
  }

  // Pad to exactly 1000 with mixed micro mods
  let pad = 0;
  while (pool.length < 1000) {
    const kind = pad % 12;
    const v = 0.03 + (pad % 17) * 0.004;
    const name = makeName(pad + 20, pad + 7, `Mod${pad + 1}`);
    if (kind === 0) push(name, `+${Math.round(v * 100)}% damage`, "common", (m) => { m.damage *= 1 + v; });
    else if (kind === 1) push(name, `+${Math.round(v * 100)}% fire rate`, "common", (m) => { m.fireRate *= 1 + v; });
    else if (kind === 2) push(name, `+1 mag`, "common", (m) => { m.magBonus += 1; });
    else if (kind === 3) push(name, `+${Math.round(v * 100)}% reload`, "common", (m) => { m.reloadSpeed *= 1 + v; });
    else if (kind === 4) push(name, `+${Math.round(v * 50)}% move`, "common", (m) => { m.moveSpeed *= 1 + v * 0.5; });
    else if (kind === 5) push(name, `+${4 + pad % 8} HP`, "common", (m) => { m.maxHpBonus += 4 + pad % 8; });
    else if (kind === 6) push(name, `+${Math.round(v * 100)}% splash`, "common", (m) => { m.splashMult = (m.splashMult || 1) * (1 + v); });
    else if (kind === 7) push(name, `Bounce +1`, "rare", (m) => { m.bounce += 1; });
    else if (kind === 8) push(name, `Pierce +1`, "rare", (m) => { m.pierce += 1; });
    else if (kind === 9) push(name, `Heal ${6 + pad % 10}`, "common", (m) => { m.instantHeal += 6 + pad % 10; });
    else if (kind === 10) push(name, `+${Math.round(v * 100)}% pickup`, "common", (m) => { m.pickupMult *= 1 + v; });
    else push(name, `+${Math.round(v * 100)}% bullet speed`, "common", (m) => { m.bulletSpeed *= 1 + v; });
    pad += 1;
    if (pad > 500) break;
  }

  while (pool.length < 1000) {
    const v = 0.02 + (pool.length % 25) * 0.003;
    push(
      makeName(pool.length, pool.length + 5, `Boost${pool.length}`),
      `+${Math.round(v * 100)}% all splat damage`,
      pool.length % 5 === 0 ? "rare" : "common",
      (m) => { m.damage *= 1 + v; },
    );
  }

  return pool.slice(0, 1000);
}

export function createDefaultMods() {
  return {
    damage: 1,
    fireRate: 1,
    magBonus: 0,
    reloadSpeed: 1,
    moveSpeed: 1,
    maxHpBonus: 0,
    lifesteal: 0,
    extraProjectiles: 0,
    bounce: 0,
    bulletScale: 1,
    magnetRange: 0,
    pierce: 0,
    critChance: 0,
    critMult: 1.5,
    spreadMult: 1,
    pickupMult: 1,
    bulletSpeed: 1,
    damageTaken: 1,
    echoChance: 0,
    instantHeal: 0,
    splashMult: 1,
    splashDamageMult: 1,
    fuseMult: 1,
    rocketSpeedMult: 1,
    puddleMult: 1,
    turretMult: 1,
  };
}

/** Pick `count` unique random entries from the pool. */
export function rollOffer(pool, count = 3) {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}
