/**
 * Persistent poop stain decals — pooled ground + wall splats.
 */
import * as THREE from "three";
import { createMockupSplat } from "./arena.js";

const MAX_STAINS = 240;
let sceneRef = null;
/** @type {import("three").Group[]} */
let stains = [];

export function initStains(scene) {
  sceneRef = scene;
  stains = [];
}

function trimStains() {
  while (stains.length > MAX_STAINS) {
    const old = stains.shift();
    if (old) sceneRef?.remove(old);
  }
}

export function leaveGroundStain(pos, scale = 1) {
  if (!sceneRef) return;
  const p = pos.clone();
  p.y = 0.025 + Math.random() * 0.008;
  const splat = createMockupSplat(p, {
    scale: 0.28 + scale * 0.45,
    permanent: true,
    life: Infinity,
  });
  splat.rotation.y = Math.random() * Math.PI;
  sceneRef.add(splat);
  stains.push(splat);
  trimStains();
}

export function leaveWallStain(pos, normal, scale = 1) {
  if (!sceneRef) return;
  const splat = createMockupSplat(pos, {
    scale: 0.25 + scale * 0.4,
    permanent: true,
    life: Infinity,
    onWall: true,
  });
  const n = normal.clone().normalize();
  splat.position.copy(pos);
  splat.lookAt(pos.clone().add(n));
  splat.position.add(n.clone().multiplyScalar(0.08));
  sceneRef.add(splat);
  stains.push(splat);
  trimStains();
}

/** Big messy explosion paint — overlapping brown patches */
export function paintExplosionStain(pos, radius) {
  const count = Math.min(22, Math.floor(8 + radius * 1.4));
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * radius * 0.92;
    const offset = pos.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    leaveGroundStain(offset, 1.1 + Math.random() * 1.6 + radius * 0.1);
  }
  const wallCount = Math.min(6, Math.floor(2 + radius * 0.35));
  for (let i = 0; i < wallCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const wp = pos.clone().add(new THREE.Vector3(
      Math.cos(a) * radius * (0.75 + Math.random() * 0.25),
      0.8 + Math.random() * 2.2,
      Math.sin(a) * radius * (0.75 + Math.random() * 0.25),
    ));
    leaveWallStain(wp, new THREE.Vector3(Math.cos(a), 0.15, Math.sin(a)), 0.7 + radius * 0.06);
  }
}

export function leaveProjectileStain(pos, kind = "bullet", arch = "rifle") {
  const scale = kind === "rocket" ? 1.15
    : kind === "grenade" ? 0.95
      : arch === "shotgun" ? 0.55
        : kind === "mine" || kind === "puddle" ? 0.85
          : 0.45;
  if (pos.y < 2.5) leaveGroundStain(pos, scale);
}

export function tryWallStain(pos, half, kind = "bullet") {
  const margin = 0.15;
  if (Math.abs(pos.x) > half - margin) {
    const nx = pos.x > 0 ? 1 : -1;
    leaveWallStain(
      pos.clone().setX(nx * half),
      new THREE.Vector3(nx, 0, 0),
      kind === "rocket" ? 1.4 : 0.9,
    );
    return true;
  }
  if (Math.abs(pos.z) > half - margin) {
    const nz = pos.z > 0 ? 1 : -1;
    leaveWallStain(
      pos.clone().setZ(nz * half),
      new THREE.Vector3(0, 0, nz),
      kind === "rocket" ? 1.4 : 0.9,
    );
    return true;
  }
  return false;
}

export function clearStains() {
  stains.forEach((s) => sceneRef?.remove(s));
  stains = [];
}

export function stainCount() {
  return stains.length;
}
