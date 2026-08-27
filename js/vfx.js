/**
 * Browser-native VFX: pooled particles, shockwaves, lights, archetype trails/impacts.
 */
import * as THREE from "three";
import { createPoopMaterial } from "./poop-models.js";

export const ARCHETYPE_ACCENTS = {
  rifle: { hex: 0xb8651d, css: "#b8651d", glow: "#ffaa44", trail: 0x8a4a18, label: "Rifle" },
  shotgun: { hex: 0xc4782a, css: "#c4782a", glow: "#ffcc66", trail: 0x9a5a20, label: "Shotgun" },
  gatling: { hex: 0xd4a030, css: "#d4a030", glow: "#ffe080", trail: 0xff8800, label: "Gatling" },
  grenade: { hex: 0x6a9a28, css: "#6a9a28", glow: "#aaff44", trail: 0x4a7a18, label: "Grenade" },
  rocket: { hex: 0xff6622, css: "#ff6622", glow: "#ffaa44", trail: 0x888888, label: "Rocket" },
  mine: { hex: 0xff2244, css: "#ff2244", glow: "#ff6688", trail: 0xaa1122, label: "Mine" },
  plunger: { hex: 0xc45a28, css: "#c45a28", glow: "#ff8844", trail: 0x8a3a18, label: "Plunger" },
  sniper: { hex: 0x44ccff, css: "#44ccff", glow: "#88eeff", trail: 0x2288aa, label: "Sniper" },
  puddle: { hex: 0x3a8a30, css: "#3a8a30", glow: "#66ff88", trail: 0x2a6a20, label: "Puddle" },
  turret: { hex: 0x8888aa, css: "#8888aa", glow: "#ccccff", trail: 0x555577, label: "Turret" },
  boomerang: { hex: 0xccaa44, css: "#ccaa44", glow: "#ffee88", trail: 0xaa8822, label: "Boomerang" },
};

const MAX_PARTICLES = 140;
const MAX_RINGS = 14;
const MAX_BEAMS = 6;
const MAX_DECALS = 24;

let sceneRef = null;
let bloomEl = null;
let bloomAmt = 0;

/** @type {THREE.PointLight[]} */
const flashLights = [];
/** @type {{ mesh: THREE.Object3D, life: number, maxLife: number, kind: string, velocity?: THREE.Vector3, scaleVel?: number, onUpdate?: (o: object, dt: number) => void }[]} */
let fxObjects = [];
/** @type {THREE.Mesh[]} */
const particlePool = [];
/** @type {THREE.Mesh[]} */
const ringPool = [];

function poolMesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.visible = false;
  return m;
}

function acquireParticle() {
  for (const p of particlePool) {
    if (!p.visible) return p;
  }
  if (particlePool.length >= MAX_PARTICLES) {
    const p = particlePool.shift();
    if (p) return p;
  }
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false });
  const mesh = poolMesh(new THREE.SphereGeometry(0.1, 6, 6), mat);
  particlePool.push(mesh);
  return mesh;
}

function acquireRing() {
  for (const r of ringPool) {
    if (!r.visible) return r;
  }
  if (ringPool.length >= MAX_RINGS) {
    const r = ringPool.shift();
    if (r) return r;
  }
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffaa44,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = poolMesh(new THREE.RingGeometry(0.3, 0.55, 32), mat);
  mesh.rotation.x = -Math.PI / 2;
  ringPool.push(mesh);
  return mesh;
}

export function initVfx(scene, bloomElement) {
  sceneRef = scene;
  bloomEl = bloomElement;
  for (let i = 0; i < 4; i++) {
    const light = new THREE.PointLight(0xffaa44, 0, 12, 2);
    light.visible = false;
    scene.add(light);
    flashLights.push(light);
  }
}

function acquireFlashLight() {
  return flashLights.find((l) => !l.visible) || flashLights[0];
}

export function setBloomFlash(amount = 0.35, color = "255,180,80") {
  bloomAmt = Math.max(bloomAmt, amount);
  if (bloomEl) {
    bloomEl.style.setProperty("--bloom-rgb", color);
    bloomEl.style.opacity = String(Math.min(0.85, bloomAmt));
  }
}

function spawnParticle(pos, {
  color = 0xffaa44, scale = 1, life = 0.4,
  velocity = null, gravity = true, fade = 1,
} = {}) {
  if (!sceneRef) return;
  const mesh = acquireParticle();
  mesh.material.color.setHex(color);
  mesh.material.opacity = fade;
  mesh.position.copy(pos);
  mesh.scale.setScalar(scale);
  mesh.visible = true;
  sceneRef.add(mesh);
  const vel = velocity || new THREE.Vector3(
    (Math.random() - 0.5) * 4,
    1.5 + Math.random() * 3,
    (Math.random() - 0.5) * 4,
  );
  fxObjects.push({
    mesh, life, maxLife: life, kind: "particle",
    velocity: vel, gravity,
  });
}

function spawnShockwave(pos, {
  color = 0xffaa44, maxScale = 6, life = 0.45, y = 0.14,
} = {}) {
  if (!sceneRef) return;
  const mesh = acquireRing();
  mesh.material.color.setHex(color);
  mesh.material.opacity = 0.75;
  mesh.position.set(pos.x, y, pos.z);
  mesh.scale.setScalar(0.2);
  mesh.visible = true;
  sceneRef.add(mesh);
  fxObjects.push({
    mesh, life, maxLife: life, kind: "ring",
    scaleVel: maxScale / life,
    maxScale,
  });
}

function spawnFlash(pos, color, intensity = 2.5, life = 0.12) {
  if (!sceneRef) return;
  const light = acquireFlashLight();
  light.color.setHex(color);
  light.intensity = intensity;
  light.position.copy(pos);
  light.position.y = Math.max(0.5, pos.y);
  light.visible = true;
  fxObjects.push({ mesh: light, life, maxLife: life, kind: "light" });
}

/** Distinct projectile meshes per archetype */
export function createArchetypeProjectileMesh(arch, color = 0xb8651d, scale = 1) {
  const accent = ARCHETYPE_ACCENTS[arch] || ARCHETYPE_ACCENTS.rifle;
  const c = color || accent.hex;
  const group = new THREE.Group();
  group.userData.archetype = arch;

  if (arch === "sniper") {
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.55, 8),
      createPoopMaterial(c),
    );
    core.rotation.x = Math.PI / 2;
    core.castShadow = true;
    group.add(core);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: accent.glow ? parseInt(accent.glow.slice(1), 16) : 0x44ccff, transparent: true, opacity: 0.55 }),
    );
    glow.position.z = -0.28;
    group.add(glow);
  } else if (arch === "gatling") {
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffcc44 }));
    group.add(core);
    const trail = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.2, 6),
      new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.6 }),
    );
    trail.rotation.x = Math.PI / 2;
    trail.position.z = 0.12;
    group.add(trail);
  } else if (arch === "shotgun") {
    const mat = createPoopMaterial(c);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat);
    core.scale.set(1.2, 0.85, 1.2);
    group.add(core);
  } else {
    const mat = createPoopMaterial(c);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat);
    core.scale.set(1, 0.9, 1.05);
    core.castShadow = true;
    group.add(core);
    const hi = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: accent.glow ? parseInt(accent.glow.slice(1), 16) : c, transparent: true, opacity: 0.4 }),
    );
    hi.position.set(0.04, 0.04, 0.08);
    group.add(hi);
  }

  group.scale.setScalar(scale);
  return group;
}

export function spawnTrailForArchetype(arch, pos, color) {
  const accent = ARCHETYPE_ACCENTS[arch] || ARCHETYPE_ACCENTS.rifle;
  const c = color || accent.trail || accent.hex;

  if (arch === "rocket") {
    spawnParticle(pos, {
      color: 0x888888, scale: 0.35 + Math.random() * 0.25, life: 0.5,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.3, (Math.random() - 0.5) * 0.5),
      fade: 0.55,
    });
    spawnParticle(pos, {
      color: 0xff6622, scale: 0.2, life: 0.25,
      velocity: new THREE.Vector3(0, 0.1, 0), fade: 0.7,
    });
    return;
  }
  if (arch === "grenade") {
    spawnParticle(pos, {
      color: 0x88cc44, scale: 0.22, life: 0.35,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.4, (Math.random() - 0.5) * 1.2),
      fade: 0.5,
    });
    return;
  }
  if (arch === "mine") {
    spawnParticle(pos, { color: 0xff2244, scale: 0.12, life: 0.2, fade: 0.8 });
    return;
  }
  if (arch === "puddle") {
    spawnParticle(pos, {
      color: 0x44aa44, scale: 0.28, life: 0.4,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.2, (Math.random() - 0.5) * 0.8),
      fade: 0.45,
    });
    return;
  }
  if (arch === "boomerang") {
    spawnParticle(pos, {
      color: c, scale: 0.18, life: 0.3,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 2, 0.1, (Math.random() - 0.5) * 2),
      fade: 0.55,
    });
    return;
  }
  if (arch === "gatling") {
    spawnParticle(pos, { color: 0xffaa00, scale: 0.1, life: 0.15, fade: 0.7 });
    return;
  }
  if (arch === "sniper") {
    spawnParticle(pos, { color: 0x44ccff, scale: 0.08, life: 0.12, fade: 0.9 });
    return;
  }
  spawnParticle(pos, { color: c, scale: arch === "shotgun" ? 0.14 : 0.11, life: 0.22, fade: 0.55 });
}

export function spawnMuzzleVfx(arch, pos, forward, color) {
  const accent = ARCHETYPE_ACCENTS[arch] || ARCHETYPE_ACCENTS.rifle;
  const c = color || accent.hex;
  spawnFlash(pos, c, arch === "rocket" ? 3.5 : arch === "sniper" ? 2.8 : 1.8, 0.08);
  const count = arch === "shotgun" ? 6 : arch === "gatling" ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const off = forward.clone().multiplyScalar(0.15 + Math.random() * 0.1);
    spawnParticle(pos.clone().add(off), {
      color: parseInt(accent.glow?.slice(1) || "ffaa44", 16),
      scale: 0.08 + Math.random() * 0.12,
      life: 0.12 + Math.random() * 0.08,
      velocity: forward.clone().multiplyScalar(2 + Math.random() * 3).add(
        new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
      ),
      gravity: false,
      fade: 0.85,
    });
  }
  if (arch === "rocket" || arch === "grenade") setBloomFlash(0.15, "255,140,60");
  if (arch === "sniper") setBloomFlash(0.22, "100,200,255");
}

export function spawnSniperBeam(from, to, color = 0x44ccff) {
  if (!sceneRef || fxObjects.filter((o) => o.kind === "beam").length >= MAX_BEAMS) return;
  const dir = to.clone().sub(from);
  const len = dir.length();
  if (len < 0.1) return;
  const geo = new THREE.CylinderGeometry(0.03, 0.06, len, 6);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.85, depthWrite: false,
  });
  const beam = new THREE.Mesh(geo, mat);
  beam.position.copy(from).add(to).multiplyScalar(0.5);
  beam.lookAt(to);
  beam.rotateX(Math.PI / 2);
  sceneRef.add(beam);
  fxObjects.push({ mesh: beam, life: 0.09, maxLife: 0.09, kind: "beam" });
  spawnFlash(to, color, 2, 0.06);
  setBloomFlash(0.28, "100,210,255");
}

export function spawnPlungerSmear(pos, forward) {
  if (!sceneRef) return;
  const geo = new THREE.PlaneGeometry(0.9, 0.5);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xc45a28, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false,
  });
  const smear = new THREE.Mesh(geo, mat);
  smear.position.copy(pos);
  smear.position.y = 0.35;
  const yaw = Math.atan2(forward.x, forward.z);
  smear.rotation.set(-Math.PI / 2, 0, yaw);
  sceneRef.add(smear);
  fxObjects.push({ mesh: smear, life: 0.35, maxLife: 0.35, kind: "smear" });
  for (let i = 0; i < 8; i++) {
    spawnParticle(pos.clone().add(forward.clone().multiplyScalar(0.3 + i * 0.15)), {
      color: 0xff8844, scale: 0.2, life: 0.3,
      velocity: forward.clone().multiplyScalar(3).add(new THREE.Vector3((Math.random() - 0.5) * 2, 0.5, (Math.random() - 0.5) * 2)),
    });
  }
  setBloomFlash(0.12, "255,120,60");
}

export function spawnTurretDeployVfx(pos) {
  spawnShockwave(pos, { color: 0x8888cc, maxScale: 3.5, life: 0.35 });
  spawnFlash(pos, 0xaaaaff, 2.5, 0.15);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    spawnParticle(pos.clone().add(new THREE.Vector3(Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3)), {
      color: 0xccccff, scale: 0.15, life: 0.4,
      velocity: new THREE.Vector3(Math.cos(a) * 2, 1.5, Math.sin(a) * 2),
    });
  }
}

export function spawnPuddleSpread(pos, radius, color = 0x3a8a30) {
  if (!sceneRef) return;
  const geo = new THREE.CircleGeometry(0.2, 24);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false,
  });
  const blob = new THREE.Mesh(geo, mat);
  blob.rotation.x = -Math.PI / 2;
  blob.position.set(pos.x, 0.12, pos.z);
  sceneRef.add(blob);
  fxObjects.push({
    mesh: blob, life: 0.55, maxLife: 0.55, kind: "puddleSpread",
    scaleVel: radius / 0.55,
    maxScale: radius,
  });
  for (let i = 0; i < 10; i++) {
    spawnParticle(pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * radius * 0.3, 0.1, (Math.random() - 0.5) * radius * 0.3)), {
      color: 0x66ff88, scale: 0.2, life: 0.5,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 2, 0.3, (Math.random() - 0.5) * 2),
      fade: 0.5,
    });
  }
}

export function spawnMineArmedVfx(pos) {
  spawnFlash(pos, 0xff2244, 1.2, 0.08);
  spawnParticle(pos.clone().add(new THREE.Vector3(0, 0.2, 0)), {
    color: 0xff4466, scale: 0.25, life: 0.3, velocity: new THREE.Vector3(0, 0.5, 0), fade: 0.7,
  });
}

export function spawnExplosionVfx(arch, pos, radius = 4, { shakeCallback = null } = {}) {
  const accent = ARCHETYPE_ACCENTS[arch] || ARCHETYPE_ACCENTS.grenade;
  const shakeByArch = {
    rocket: 0.16, grenade: 0.1, mine: 0.11, puddle: 0.06, rifle: 0.04,
  };
  if (shakeCallback) shakeCallback(shakeByArch[arch] ?? 0.08);

  if (arch === "rocket") {
    spawnShockwave(pos, { color: 0xff6622, maxScale: radius * 1.8, life: 0.55 });
    spawnShockwave(pos, { color: 0xffaa44, maxScale: radius * 1.2, life: 0.35, y: 0.16 });
    spawnFlash(pos, 0xff4400, 6, 0.2);
    setBloomFlash(0.55, "255,100,40");
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 10;
      spawnParticle(pos, {
        color: Math.random() > 0.4 ? 0xff6622 : 0xffcc44,
        scale: 0.25 + Math.random() * 0.4,
        life: 0.5 + Math.random() * 0.3,
        velocity: new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 6, Math.sin(a) * sp),
      });
    }
    for (let i = 0; i < 8; i++) {
      spawnParticle(pos, {
        color: 0x666666, scale: 0.5, life: 0.8,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 3, 4 + Math.random() * 4, (Math.random() - 0.5) * 3),
        fade: 0.4,
      });
    }
    return;
  }

  if (arch === "mine") {
    spawnShockwave(pos, { color: 0xff2244, maxScale: radius * 1.5, life: 0.4 });
    spawnFlash(pos, 0xff4466, 4, 0.15);
    setBloomFlash(0.4, "255,60,80");
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      spawnParticle(pos, {
        color: Math.random() > 0.5 ? 0xff2244 : 0xffaa44,
        scale: 0.2 + Math.random() * 0.3,
        life: 0.35 + Math.random() * 0.2,
        velocity: new THREE.Vector3(Math.cos(a) * (5 + Math.random() * 5), 2 + Math.random() * 4, Math.sin(a) * (5 + Math.random() * 5)),
      });
    }
    return;
  }

  if (arch === "grenade") {
    spawnShockwave(pos, { color: 0x88cc44, maxScale: radius * 1.6, life: 0.48 });
    spawnFlash(pos, 0xaaff44, 3.5, 0.16);
    setBloomFlash(0.38, "140,220,80");
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      spawnParticle(pos, {
        color: Math.random() > 0.5 ? 0x88cc44 : 0xccaa44,
        scale: 0.2 + Math.random() * 0.35,
        life: 0.4 + Math.random() * 0.25,
        velocity: new THREE.Vector3(Math.cos(a) * (4 + Math.random() * 5), 2.5 + Math.random() * 4, Math.sin(a) * (4 + Math.random() * 5)),
      });
    }
    return;
  }

  spawnShockwave(pos, { color: accent.hex, maxScale: radius * 1.4, life: 0.42 });
  spawnFlash(pos, accent.hex, 2.5, 0.12);
  setBloomFlash(0.25);
  for (let i = 0; i < 9; i++) {
    spawnParticle(pos, { color: accent.trail || accent.hex, scale: 0.2 + Math.random() * 0.25, life: 0.35 + Math.random() * 0.2 });
  }
}

export function spawnImpactVfx(arch, pos, color) {
  const accent = ARCHETYPE_ACCENTS[arch] || ARCHETYPE_ACCENTS.rifle;
  const c = color || accent.hex;
  const count = arch === "shotgun" ? 5 : arch === "sniper" ? 3 : 2;
  for (let i = 0; i < count; i++) {
    spawnParticle(pos, {
      color: c, scale: 0.1 + Math.random() * 0.12, life: 0.2,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3),
      gravity: false,
    });
  }
  if (arch === "sniper") setBloomFlash(0.15, "100,200,255");
}

export function spawnBoomerangSpark(pos) {
  spawnParticle(pos, {
    color: 0xffee88, scale: 0.15, life: 0.25,
    velocity: new THREE.Vector3((Math.random() - 0.5) * 3, 0.2, (Math.random() - 0.5) * 3),
    fade: 0.7,
  });
}

export function updateVfx(dt) {
  bloomAmt = Math.max(0, bloomAmt - dt * 3.5);
  if (bloomEl) bloomEl.style.opacity = String(Math.min(0.85, bloomAmt));

  fxObjects = fxObjects.filter((obj) => {
    obj.life -= dt;
    const t = 1 - obj.life / obj.maxLife;

    if (obj.kind === "particle") {
      if (obj.gravity !== false) obj.velocity.y -= 9.8 * 0.45 * dt;
      obj.mesh.position.add(obj.velocity.clone().multiplyScalar(dt));
      if (obj.mesh.material?.opacity != null) {
        obj.mesh.material.opacity = Math.max(0, (obj.life / obj.maxLife) * 0.85);
      }
      obj.mesh.scale.multiplyScalar(1 - dt * 1.8);
    } else if (obj.kind === "ring") {
      const s = 0.2 + t * (obj.maxScale || 6);
      obj.mesh.scale.setScalar(s);
      if (obj.mesh.material) obj.mesh.material.opacity = Math.max(0, 0.75 * (1 - t));
    } else if (obj.kind === "light") {
      obj.mesh.intensity = Math.max(0, 4 * (obj.life / obj.maxLife));
      if (obj.life <= 0) obj.mesh.visible = false;
    } else if (obj.kind === "beam") {
      if (obj.mesh.material) obj.mesh.material.opacity = Math.max(0, 0.85 * (1 - t * 1.2));
    } else if (obj.kind === "smear") {
      if (obj.mesh.material) obj.mesh.material.opacity = Math.max(0, 0.75 * (1 - t));
      obj.mesh.scale.multiplyScalar(1 + dt * 0.5);
    } else if (obj.kind === "puddleSpread") {
      const s = 0.2 + t * (obj.maxScale || 3);
      obj.mesh.scale.setScalar(s);
      if (obj.mesh.material) obj.mesh.material.opacity = Math.max(0, 0.65 * (1 - t * 0.8));
    }

    if (obj.onUpdate) obj.onUpdate(obj, dt);

    if (obj.life <= 0) {
      if (obj.kind === "light") {
        obj.mesh.visible = false;
        obj.mesh.intensity = 0;
      } else if (obj.kind === "beam" || obj.kind === "smear" || obj.kind === "puddleSpread") {
        sceneRef?.remove(obj.mesh);
        obj.mesh.geometry?.dispose?.();
        obj.mesh.material?.dispose?.();
      } else {
        obj.mesh.visible = false;
        sceneRef?.remove(obj.mesh);
      }
      return false;
    }
    return true;
  });
}

export function clearVfx() {
  fxObjects.forEach((obj) => {
    if (obj.kind === "light") {
      obj.mesh.visible = false;
      obj.mesh.intensity = 0;
    } else if (obj.kind !== "particle" && obj.kind !== "ring") {
      sceneRef?.remove(obj.mesh);
    } else {
      obj.mesh.visible = false;
      sceneRef?.remove(obj.mesh);
    }
  });
  fxObjects = [];
  bloomAmt = 0;
  if (bloomEl) bloomEl.style.opacity = "0";
}
