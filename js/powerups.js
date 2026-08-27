/**
 * Template-generated roguelite power-up pool (~100 entries).
 * Stacking is allowed; each pick applies one modifier delta.
 */

const ADJECTIVES = [
  'Spicy', 'Juicy', 'Nuclear', 'Sticky', 'Fermented', 'Chunky', 'Crispy',
  'Volatile', 'Gunky', 'Putrid', 'Turbo', 'Soggy', 'Metallic', 'Acidic',
  'Blessed', 'Cursed', 'Lucky', 'Rancid', 'Glazed', 'Feral',
];

const NOUNS = [
  'Splat', 'Spray', 'Core', 'Pack', 'Boost', 'Charm', 'Gland', 'Canister',
  'Serum', 'Capsule', 'Mote', 'Shard', 'Totem', 'Relic', 'Injection',
];

function pick(list, i) {
  return list[i % list.length];
}

function makeName(adjI, nounI, suffix) {
  return `${pick(ADJECTIVES, adjI)} ${pick(NOUNS, nounI)}${suffix ? ` ${suffix}` : ''}`;
}

/**
 * @typedef {{ id: string, name: string, desc: string, rarity: string, apply: (m: object) => void }} PowerUp
 */

/** @returns {PowerUp[]} */
export function buildPowerUpPool() {
  /** @type {PowerUp[]} */
  const pool = [];
  let n = 0;

  const push = (name, desc, rarity, apply) => {
    pool.push({ id: `pu_${n++}`, name, desc, rarity, apply });
  };

  // Damage
  [0.08, 0.12, 0.16, 0.2, 0.25].forEach((v, i) => {
    push(makeName(i, i, 'Damage'), `+${Math.round(v * 100)}% bullet damage`, i > 2 ? 'rare' : 'common', (m) => { m.damage *= 1 + v; });
  });

  // Fire rate (lower interval)
  [0.08, 0.12, 0.16, 0.2, 0.28].forEach((v, i) => {
    push(makeName(i + 3, i + 2, 'RoF'), `+${Math.round(v * 100)}% fire rate`, i > 2 ? 'rare' : 'common', (m) => { m.fireRate *= 1 + v; });
  });

  // Mag size
  [1, 2, 3, 4, 5, 6].forEach((v, i) => {
    push(makeName(i + 5, i + 1, 'Mag'), `+${v} magazine size`, v >= 4 ? 'rare' : 'common', (m) => { m.magBonus += v; });
  });

  // Reload speed
  [0.1, 0.15, 0.2, 0.25, 0.35].forEach((v, i) => {
    push(makeName(i + 7, i + 4, 'Reload'), `+${Math.round(v * 100)}% reload speed`, i > 2 ? 'rare' : 'common', (m) => { m.reloadSpeed *= 1 + v; });
  });

  // Move speed
  [0.06, 0.1, 0.14, 0.18, 0.22].forEach((v, i) => {
    push(makeName(i + 2, i + 6, 'Stride'), `+${Math.round(v * 100)}% move speed`, i > 2 ? 'rare' : 'common', (m) => { m.moveSpeed *= 1 + v; });
  });

  // Max HP
  [10, 15, 20, 25, 35, 50].forEach((v, i) => {
    push(makeName(i + 9, i + 3, 'Vitality'), `+${v} max HP (heal that amount)`, v >= 25 ? 'rare' : 'common', (m) => { m.maxHpBonus += v; });
  });

  // Lifesteal
  [0.04, 0.07, 0.1, 0.14, 0.18].forEach((v, i) => {
    push(makeName(i + 11, i + 8, 'Leech'), `${Math.round(v * 100)}% lifesteal on hit`, i > 2 ? 'rare' : 'common', (m) => { m.lifesteal += v; });
  });

  // Extra projectiles
  [1, 1, 2].forEach((v, i) => {
    push(makeName(i + 14, i + 10, 'Scatter'), `+${v} projectile per shot`, 'rare', (m) => { m.extraProjectiles += v; });
  });

  // Bounce
  [1, 1, 2, 3].forEach((v, i) => {
    push(makeName(i + 1, i + 12, 'Ricochet'), `Bullets bounce +${v}`, i > 1 ? 'rare' : 'common', (m) => { m.bounce += v; });
  });

  // Bigger bullets
  [0.15, 0.25, 0.35, 0.5].forEach((v, i) => {
    push(makeName(i + 4, i + 7, 'Caliber'), `+${Math.round(v * 100)}% bullet size`, i > 1 ? 'rare' : 'common', (m) => { m.bulletScale *= 1 + v; });
  });

  // Magnet ammo
  [2.5, 4, 6, 8].forEach((v, i) => {
    push(makeName(i + 6, i + 9, 'Magnet'), `Ammo magnet +${v.toFixed(0)}m`, i > 1 ? 'rare' : 'common', (m) => { m.magnetRange += v; });
  });

  // Pierce
  [1, 1, 2].forEach((v, i) => {
    push(makeName(i + 8, i + 11, 'Pierce'), `Pierce +${v} enemy`, 'rare', (m) => { m.pierce += v; });
  });

  // Crit
  [0.05, 0.08, 0.12, 0.16].forEach((v, i) => {
    push(makeName(i + 10, i + 5, 'Crit'), `+${Math.round(v * 100)}% crit chance`, i > 1 ? 'rare' : 'common', (m) => { m.critChance += v; });
  });
  [0.25, 0.4, 0.6].forEach((v, i) => {
    push(makeName(i + 12, i + 13, 'Crit Dmg'), `+${Math.round(v * 100)}% crit damage`, 'rare', (m) => { m.critMult += v; });
  });

  // Spread control
  [0.12, 0.2, 0.3].forEach((v, i) => {
    push(makeName(i + 15, i + 0, 'Focus'), `-${Math.round(v * 100)}% bullet spread`, i > 0 ? 'rare' : 'common', (m) => { m.spreadMult *= 1 - v; });
  });

  // Pickup value
  [0.25, 0.5, 0.75, 1].forEach((v, i) => {
    push(makeName(i + 17, i + 14, 'Scavenger'), `+${Math.round(v * 100)}% ammo from pickups`, i > 1 ? 'rare' : 'common', (m) => { m.pickupMult *= 1 + v; });
  });

  // Heal on wave clear (flat)
  [8, 15, 25].forEach((v, i) => {
    push(makeName(i + 0, i + 15, 'Recovery'), `Heal ${v} HP now`, 'common', (m) => { m.instantHeal += v; });
  });

  // Bullet speed
  [0.1, 0.18, 0.28].forEach((v, i) => {
    push(makeName(i + 18, i + 2, 'Velocity'), `+${Math.round(v * 100)}% bullet speed`, 'common', (m) => { m.bulletSpeed *= 1 + v; });
  });

  // Armor / damage taken reduction
  [0.05, 0.08, 0.12, 0.16].forEach((v, i) => {
    push(makeName(i + 3, i + 4, 'Shell'), `-${Math.round(v * 100)}% damage taken`, i > 1 ? 'rare' : 'common', (m) => { m.damageTaken *= 1 - v; });
  });

  // Double tap (chance to fire twice)
  [0.08, 0.12, 0.18].forEach((v, i) => {
    push(makeName(i + 19, i + 6, 'Echo'), `${Math.round(v * 100)}% chance double shot`, 'rare', (m) => { m.echoChance += v; });
  });

  // Fill remaining to ~100 with mixed micro-boosts
  const fillers = [
    ['Gunk Coating', '+6% damage', 'common', (m) => { m.damage *= 1.06; }],
    ['Quick Latch', '+7% fire rate', 'common', (m) => { m.fireRate *= 1.07; }],
    ['Extra Clip Spring', '+1 mag size', 'common', (m) => { m.magBonus += 1; }],
    ['Greased Bolt', '+8% reload', 'common', (m) => { m.reloadSpeed *= 1.08; }],
    ['Light Boots', '+5% move', 'common', (m) => { m.moveSpeed *= 1.05; }],
    ['Hardened Core', '+8 max HP', 'common', (m) => { m.maxHpBonus += 8; }],
    ['Siphon Droplet', '+3% lifesteal', 'common', (m) => { m.lifesteal += 0.03; }],
    ['Wide Bore', '+10% bullet size', 'common', (m) => { m.bulletScale *= 1.1; }],
    ['Pull Field', 'Magnet +2m', 'common', (m) => { m.magnetRange += 2; }],
    ['Needle Tip', '+4% crit', 'common', (m) => { m.critChance += 0.04; }],
    ['Soft Recoil Pad', '-8% spread', 'common', (m) => { m.spreadMult *= 0.92; }],
    ['Loot Sensor', '+20% pickup ammo', 'common', (m) => { m.pickupMult *= 1.2; }],
    ['Hot Barrel', '+5% bullet speed', 'common', (m) => { m.bulletSpeed *= 1.05; }],
    ['Rubber Shell', '-4% damage taken', 'common', (m) => { m.damageTaken *= 0.96; }],
    ['Second Squeeze', '+5% echo shot', 'common', (m) => { m.echoChance += 0.05; }],
    ['Bank Shot', 'Bounce +1', 'rare', (m) => { m.bounce += 1; }],
    ['Twin Nozzle', '+1 projectile', 'rare', (m) => { m.extraProjectiles += 1; }],
    ['Drill Bit', 'Pierce +1', 'rare', (m) => { m.pierce += 1; }],
    ['Overcharge Cap', '+18% damage', 'rare', (m) => { m.damage *= 1.18; }],
    ['Machine Spirit', '+15% fire rate', 'rare', (m) => { m.fireRate *= 1.15; }],
    ['Deep Mag', '+4 mag size', 'rare', (m) => { m.magBonus += 4; }],
    ['Snap Reload', '+20% reload', 'rare', (m) => { m.reloadSpeed *= 1.2; }],
    ['Adrenal Rush', '+12% move', 'rare', (m) => { m.moveSpeed *= 1.12; }],
    ['Iron Gut', '+30 max HP', 'rare', (m) => { m.maxHpBonus += 30; }],
    ['Vampiric Mist', '+10% lifesteal', 'rare', (m) => { m.lifesteal += 0.1; }],
    ['Mega Slug', '+40% bullet size', 'rare', (m) => { m.bulletScale *= 1.4; }],
    ['Tractor Beam', 'Magnet +7m', 'rare', (m) => { m.magnetRange += 7; }],
    ['Lucky Streak', '+12% crit', 'rare', (m) => { m.critChance += 0.12; }],
    ['Brutal Finisher', '+50% crit damage', 'rare', (m) => { m.critMult += 0.5; }],
    ['Laser Focus', '-25% spread', 'rare', (m) => { m.spreadMult *= 0.75; }],
    ['Hoarder Instinct', '+80% pickup ammo', 'rare', (m) => { m.pickupMult *= 1.8; }],
    ['Rail Boost', '+25% bullet speed', 'rare', (m) => { m.bulletSpeed *= 1.25; }],
    ['Plated Hide', '-12% damage taken', 'rare', (m) => { m.damageTaken *= 0.88; }],
    ['Afterimage', '+15% echo shot', 'rare', (m) => { m.echoChance += 0.15; }],
    ['Field Med', 'Heal 20 HP now', 'common', (m) => { m.instantHeal += 20; }],
  ];

  fillers.forEach(([name, desc, rarity, apply]) => {
    if (pool.length >= 100) return;
    push(name, desc, rarity, apply);
  });

  // Top up if still short
  let pad = 0;
  while (pool.length < 100) {
    const v = 0.04 + (pad % 5) * 0.01;
    push(
      makeName(pad, pad + 3, `Mod ${pad + 1}`),
      `+${Math.round(v * 100)}% damage`,
      'common',
      (m) => { m.damage *= 1 + v; },
    );
    pad += 1;
  }

  return pool.slice(0, 100);
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
