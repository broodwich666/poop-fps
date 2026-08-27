import * as THREE from "three";

export function createPoopMaterial(color = 0x9b5523) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.72,
    clearcoatRoughness: 0.22,
    sheen: 0.35,
    sheenColor: new THREE.Color(0x3d2208),
    emissive: new THREE.Color(0x2a1408),
    emissiveIntensity: 0.08,
  });
}

export function createCoiledPoop(scale = 1, color = 0x9b5523) {
  const group = new THREE.Group();
  const mat = createPoopMaterial(color);

  const base = new THREE.Mesh(new THREE.SphereGeometry(0.46 * scale, 18, 14), mat);
  base.scale.set(1.12, 0.62, 1.08);
  base.position.y = 0.18 * scale;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const coils = [
    { major: 0.56, minor: 0.2, y: 0.22 },
    { major: 0.48, minor: 0.175, y: 0.4 },
    { major: 0.38, minor: 0.15, y: 0.56 },
    { major: 0.28, minor: 0.125, y: 0.7 },
    { major: 0.19, minor: 0.1, y: 0.82 },
  ];

  coils.forEach(({ major, minor, y }, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(major * scale, minor * scale, 18, 36),
      mat
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = i * 0.35;
    ring.position.y = y * scale;
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);
  });

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.145 * scale, 14, 12), mat);
  tip.scale.set(1, 1.45, 1);
  tip.position.set(0.02 * scale, 0.98 * scale, 0.02 * scale);
  tip.castShadow = true;
  group.add(tip);

  const gloss = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * scale, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0xf0d2a8,
      transparent: true,
      opacity: 0.22,
    })
  );
  gloss.scale.set(1.4, 0.7, 0.6);
  gloss.position.set(-0.12 * scale, 0.62 * scale, 0.32 * scale);
  group.add(gloss);

  group.userData.height = 1.08 * scale;
  return group;
}

export function createAngryFace(scale = 1) {
  const face = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0604, roughness: 0.4 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x0d0603, roughness: 0.7 });

  // Larger eyes + thicker brows so anger reads at mid-range (mockup)
  const eyeRadius = 0.24 * scale;
  const eyeY = 0.7 * scale;
  const eyeZ = 0.58 * scale;
  const eyeSpacing = 0.24 * scale;

  [-1, 1].forEach((side) => {
    const x = side * eyeSpacing;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 16, 16), white);
    eye.scale.set(1.08, 1.15, 0.7);
    eye.position.set(x, eyeY, eyeZ);
    face.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius * 0.4, 12, 12), black);
    pupil.position.set(x + side * 0.012 * scale, eyeY - 0.02 * scale, eyeZ + eyeRadius * 0.42);
    face.add(pupil);

    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.46 * scale, 0.13 * scale, 0.11 * scale),
      browMat
    );
    brow.position.set(x, eyeY + 0.2 * scale, eyeZ + 0.12 * scale);
    brow.rotation.z = side > 0 ? -0.95 : 0.95;
    face.add(brow);
  });

  // Deep downturned frown
  const mouthGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16 * scale, 0.5 * scale, eyeZ + 0.02 * scale),
      new THREE.Vector3(0, 0.4 * scale, eyeZ + 0.05 * scale),
      new THREE.Vector3(0.16 * scale, 0.5 * scale, eyeZ + 0.02 * scale),
    ]),
    12,
    0.032 * scale,
    6,
    false
  );
  const mouth = new THREE.Mesh(mouthGeo, black);
  face.add(mouth);

  return face;
}

export function createEnemyPoop(sizeScale = 1) {
  const group = new THREE.Group();
  const body = createCoiledPoop(sizeScale, 0x8b4513);
  body.position.y = 0.04 * sizeScale;
  group.add(body);

  const face = createAngryFace(sizeScale);
  face.position.z = 0.1 * sizeScale;
  group.add(face);

  group.userData.body = body;
  group.userData.face = face;
  group.userData.hitRadius = 0.95 * sizeScale;
  group.userData.height = body.userData.height;
  return group;
}

export function createHappyFace(scale = 1) {
  const face = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.28 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0604, roughness: 0.4 });
  const eyeRadius = 0.18 * scale;
  const eyeY = 0.7 * scale;
  const eyeZ = 0.55 * scale;
  const eyeSpacing = 0.2 * scale;
  [-1, 1].forEach((side) => {
    const x = side * eyeSpacing;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 14, 14), white);
    eye.scale.set(1.05, 1.1, 0.65);
    eye.position.set(x, eyeY, eyeZ);
    face.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius * 0.4, 10, 10), black);
    pupil.position.set(x, eyeY - 0.01 * scale, eyeZ + eyeRadius * 0.4);
    face.add(pupil);
  });
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.12 * scale, 0.025 * scale, 8, 16, Math.PI),
    black
  );
  smile.position.set(0, 0.48 * scale, eyeZ + 0.02 * scale);
  smile.rotation.x = Math.PI;
  face.add(smile);
  return face;
}

/** Visible hero poop for third-person / OTS */
export function createPlayerPoop(sizeScale = 1) {
  const group = new THREE.Group();
  const body = createCoiledPoop(sizeScale, 0xa05a28);
  body.position.y = 0.02 * sizeScale;
  group.add(body);
  const face = createHappyFace(sizeScale);
  face.position.z = 0.08 * sizeScale;
  group.add(face);
  group.userData.body = body;
  group.userData.face = face;
  group.userData.height = body.userData.height;
  return group;
}

/** World-space gun the player holds (not a giant FPS viewmodel) */
export function createHeldGun() {
  const gun = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.42, metalness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2e3236, roughness: 0.5, metalness: 0.4 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x6b3a14, roughness: 0.55, metalness: 0.15 });

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.48), black);
  receiver.position.set(0, 0, 0);
  receiver.castShadow = true;
  gun.add(receiver);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.7, 10), dark);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.015, -0.55);
  barrel.castShadow = true;
  gun.add(barrel);

  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.32), dark);
  handguard.position.set(0, -0.01, -0.28);
  gun.add(handguard);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.28), black);
  stock.position.set(0, -0.01, 0.32);
  gun.add(stock);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.12), black);
  mag.position.set(0, -0.14, 0.02);
  gun.add(mag);

  // Tiny poop tip for theme
  const tip = createCoiledPoop(0.18, 0x5c3010);
  tip.position.set(0, 0.02, -0.88);
  tip.rotation.x = 0.2;
  tip.scale.setScalar(0.55);
  tip.traverse((c) => {
    if (c.isMesh) c.castShadow = true;
  });
  gun.add(tip);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.1), accent);
  grip.position.set(0, -0.12, 0.14);
  grip.rotation.x = 0.35;
  gun.add(grip);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0, depthWrite: false })
  );
  muzzle.position.set(0, 0.02, -0.95);
  gun.add(muzzle);

  gun.userData.muzzle = muzzle;
  gun.userData.weaponId = "rifle";
  return gun;
}

/** World-space double-barrel chunk shotgun */
export function createHeldShotgun() {
  const gun = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3214, roughness: 0.7, metalness: 0.08 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a3e42, roughness: 0.4, metalness: 0.6 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.45, metalness: 0.55, emissive: 0x553300, emissiveIntensity: 0.15 });

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.42), wood);
  stock.position.set(0, -0.02, 0.28);
  stock.castShadow = true;
  gun.add(stock);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.36), steel);
  receiver.position.set(0, 0.02, -0.02);
  receiver.castShadow = true;
  gun.add(receiver);

  const makeBarrel = (x) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.62, 10), steel);
    b.rotation.x = Math.PI / 2;
    b.position.set(x, 0.04, -0.48);
    b.castShadow = true;
    gun.add(b);
  };
  makeBarrel(-0.045);
  makeBarrel(0.045);

  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.22), wood);
  pump.position.set(0, -0.02, -0.28);
  gun.add(pump);

  const band = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.08), brass);
  band.position.set(0, 0.05, -0.22);
  gun.add(band);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.12), wood);
  grip.position.set(0, -0.14, 0.08);
  grip.rotation.x = 0.4;
  gun.add(grip);

  const tip = createCoiledPoop(0.16, 0x6b3a10);
  tip.position.set(0, 0.06, -0.82);
  tip.scale.setScalar(0.5);
  gun.add(tip);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff9944, transparent: true, opacity: 0, depthWrite: false })
  );
  muzzle.position.set(0, 0.04, -0.88);
  gun.add(muzzle);

  gun.userData.muzzle = muzzle;
  gun.userData.weaponId = "shotgun";
  return gun;
}

/** World-space multi-barrel gatling / hose gun */
export function createHeldGatling() {
  const gun = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.4, metalness: 0.65 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x4a5056, roughness: 0.35, metalness: 0.7 });
  const hot = new THREE.MeshStandardMaterial({ color: 0x8b4510, roughness: 0.5, metalness: 0.3, emissive: 0x442200, emissiveIntensity: 0.25 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.4, 12), dark);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.02, 0.05);
  body.castShadow = true;
  gun.add(body);

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 14), steel);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0.02, -0.02, 0.18);
  gun.add(drum);

  const barrelGroup = new THREE.Group();
  barrelGroup.position.set(0, 0.02, -0.35);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.7, 8), steel);
    b.rotation.x = Math.PI / 2;
    b.position.set(Math.cos(a) * 0.055, Math.sin(a) * 0.055, -0.2);
    barrelGroup.add(b);
  }
  gun.add(barrelGroup);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.1), hot);
  grip.position.set(0, -0.14, 0.12);
  grip.rotation.x = 0.3;
  gun.add(grip);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.2), dark);
  handle.position.set(0.12, 0.06, 0.05);
  gun.add(handle);

  const tip = createCoiledPoop(0.14, 0x4a2810);
  tip.position.set(0, 0.02, -0.85);
  tip.scale.setScalar(0.45);
  gun.add(tip);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0, depthWrite: false })
  );
  muzzle.position.set(0, 0.02, -0.92);
  gun.add(muzzle);

  gun.userData.muzzle = muzzle;
  gun.userData.barrelGroup = barrelGroup;
  gun.userData.weaponId = "gatling";
  return gun;
}

export function createViewmodelGun() {
  const vm = new THREE.Group();
  // Compact FP swirl — only used in first-person camera mode
  const gun = createCoiledPoop(0.45, 0x5c3010);
  gun.rotation.set(0.22, -0.55, 0.1);
  vm.add(gun);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  muzzle.position.set(0.05, 0.4, 0.22);
  gun.add(muzzle);

  vm.position.set(0.35, -0.38, -0.55);
  vm.rotation.set(0.08, 0.25, 0.06);
  vm.userData.gun = gun;
  vm.userData.muzzle = muzzle;
  vm.userData.basePos = vm.position.clone();
  vm.userData.baseRot = { x: vm.rotation.x, y: vm.rotation.y, z: vm.rotation.z };
  vm.userData.weaponId = "rifle";
  return vm;
}

/** Compact FP viewmodels matching held weapons */
export function createViewmodelShotgun() {
  const vm = new THREE.Group();
  const held = createHeldShotgun();
  held.scale.setScalar(1.35);
  held.rotation.set(0.1, 0.2, 0.05);
  vm.add(held);
  vm.position.set(0.4, -0.4, -0.55);
  vm.rotation.set(0.1, 0.18, 0.05);
  vm.userData.muzzle = held.userData.muzzle;
  vm.userData.basePos = vm.position.clone();
  vm.userData.baseRot = { x: vm.rotation.x, y: vm.rotation.y, z: vm.rotation.z };
  vm.userData.weaponId = "shotgun";
  return vm;
}

export function createViewmodelGatling() {
  const vm = new THREE.Group();
  const held = createHeldGatling();
  held.scale.setScalar(1.25);
  held.rotation.set(0.08, 0.15, 0.04);
  vm.add(held);
  vm.position.set(0.42, -0.38, -0.5);
  vm.rotation.set(0.08, 0.15, 0.04);
  vm.userData.muzzle = held.userData.muzzle;
  vm.userData.barrelGroup = held.userData.barrelGroup;
  vm.userData.basePos = vm.position.clone();
  vm.userData.baseRot = { x: vm.rotation.x, y: vm.rotation.y, z: vm.rotation.z };
  vm.userData.weaponId = "gatling";
  return vm;
}

/** Fat spherical stink grenade projectile */
export function createGrenadeProjectileMesh() {
  const group = new THREE.Group();
  const mat = createPoopMaterial(0x5a3810);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), mat);
  core.scale.set(1.08, 0.95, 1.05);
  core.castShadow = true;
  group.add(core);

  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.04, 10, 20),
    createPoopMaterial(0x3d2208)
  );
  seam.rotation.x = Math.PI / 2;
  seam.position.y = 0.04;
  group.add(seam);

  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.14, 6),
    new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.6, roughness: 0.35 })
  );
  pin.position.set(0.22, 0.28, 0);
  pin.rotation.z = 0.6;
  group.add(pin);

  return group;
}

/** Slow fat rocket projectile */
export function createRocketProjectileMesh() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a3828, roughness: 0.55, metalness: 0.2 });
  const warheadMat = createPoopMaterial(0x7a4a18);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.55, 10), bodyMat);
  body.rotation.x = Math.PI / 2;
  body.position.z = -0.1;
  body.castShadow = true;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), warheadMat);
  nose.scale.set(1, 1, 1.35);
  nose.position.z = -0.42;
  nose.castShadow = true;
  group.add(nose);

  const finL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.12), bodyMat);
  finL.position.set(-0.12, 0, 0.12);
  group.add(finL);
  const finR = finL.clone();
  finR.position.x = 0.12;
  group.add(finR);

  const exhaust = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.55 })
  );
  exhaust.position.z = 0.28;
  group.add(exhaust);

  group.rotation.x = Math.PI / 2;
  return group;
}

/** World-space grenade launcher arm */
export function createHeldGrenade() {
  const gun = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3214, roughness: 0.7, metalness: 0.08 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a3e42, roughness: 0.4, metalness: 0.6 });

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.12), wood);
  grip.position.set(0, -0.14, 0.1);
  grip.rotation.x = 0.35;
  gun.add(grip);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.38), steel);
  arm.position.set(0, 0.02, -0.12);
  gun.add(arm);

  const cup = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), steel);
  cup.scale.set(1.1, 0.75, 1.1);
  cup.position.set(0, 0.06, -0.38);
  gun.add(cup);

  const nade = createGrenadeProjectileMesh();
  nade.scale.setScalar(0.55);
  nade.position.set(0, 0.06, -0.42);
  gun.add(nade);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff9944, transparent: true, opacity: 0, depthWrite: false })
  );
  muzzle.position.set(0, 0.06, -0.52);
  gun.add(muzzle);

  gun.userData.muzzle = muzzle;
  gun.userData.weaponId = "grenade";
  return gun;
}

/** World-space rocket tube */
export function createHeldRocket() {
  const gun = new THREE.Group();
  const tube = new THREE.MeshStandardMaterial({ color: 0x2e3438, roughness: 0.45, metalness: 0.55 });
  const band = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.4, metalness: 0.5 });

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.88, 12), tube);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.04, -0.42);
  barrel.castShadow = true;
  gun.add(barrel);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 16), band);
  ring.rotation.y = Math.PI / 2;
  ring.position.set(0, 0.04, -0.12);
  gun.add(ring);

  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.14), band);
  sight.position.set(0, 0.14, -0.35);
  gun.add(sight);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.1), tube);
  grip.position.set(0, -0.12, 0.08);
  grip.rotation.x = 0.3;
  gun.add(grip);

  const rocketTip = createRocketProjectileMesh();
  rocketTip.scale.setScalar(0.42);
  rocketTip.position.set(0, 0.04, -0.72);
  gun.add(rocketTip);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0, depthWrite: false })
  );
  muzzle.position.set(0, 0.04, -0.88);
  gun.add(muzzle);

  gun.userData.muzzle = muzzle;
  gun.userData.weaponId = "rocket";
  return gun;
}

export function createViewmodelGrenade() {
  const vm = new THREE.Group();
  const held = createHeldGrenade();
  held.scale.setScalar(1.3);
  held.rotation.set(0.1, 0.2, 0.05);
  vm.add(held);
  vm.position.set(0.38, -0.38, -0.52);
  vm.rotation.set(0.1, 0.18, 0.05);
  vm.userData.muzzle = held.userData.muzzle;
  vm.userData.basePos = vm.position.clone();
  vm.userData.baseRot = { x: vm.rotation.x, y: vm.rotation.y, z: vm.rotation.z };
  vm.userData.weaponId = "grenade";
  return vm;
}

export function createViewmodelRocket() {
  const vm = new THREE.Group();
  const held = createHeldRocket();
  held.scale.setScalar(1.28);
  held.rotation.set(0.08, 0.16, 0.04);
  vm.add(held);
  vm.position.set(0.4, -0.36, -0.5);
  vm.rotation.set(0.08, 0.16, 0.04);
  vm.userData.muzzle = held.userData.muzzle;
  vm.userData.basePos = vm.position.clone();
  vm.userData.baseRot = { x: vm.rotation.x, y: vm.rotation.y, z: vm.rotation.z };
  vm.userData.weaponId = "rocket";
  return vm;
}

/** Dark tactical rifle for game-over mockup viewmodel */
export function createRifleViewmodel() {
  const vm = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.45, metalness: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 0.5, metalness: 0.4 });

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.7), black);
  receiver.position.set(0, 0, -0.1);
  vm.add(receiver);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.85, 10), dark);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.75);
  vm.add(barrel);

  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.45), dark);
  handguard.position.set(0, -0.02, -0.45);
  vm.add(handguard);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.35), black);
  stock.position.set(0, -0.02, 0.4);
  vm.add(stock);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.16), black);
  mag.position.set(0, -0.2, -0.05);
  vm.add(mag);

  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.12), dark);
  sight.position.set(0, 0.16, -0.25);
  vm.add(sight);

  vm.position.set(0.48, -0.42, -0.62);
  vm.rotation.set(0.12, 0.22, 0.08);
  vm.userData.basePos = vm.position.clone();
  vm.userData.baseRot = { x: vm.rotation.x, y: vm.rotation.y, z: vm.rotation.z };
  return vm;
}

export function createProjectileMesh() {
  const group = new THREE.Group();
  const mat = createPoopMaterial(0xb8651d);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), mat);
  core.scale.set(1, 0.92, 1.08);
  core.castShadow = true;
  group.add(core);

  const highlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xd4a574, transparent: true, opacity: 0.35 })
  );
  highlight.position.set(0.06, 0.06, 0.1);
  group.add(highlight);

  return group;
}

export function createTrailParticle() {
  const mat = new THREE.MeshBasicMaterial({
    color: 0x6b3a10,
    transparent: true,
    opacity: 0.65,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), mat);
  mesh.scale.set(1.35, 0.75, 1.35);
  return mesh;
}

/** Glowing ammo crate pickup — bob + pulse in game loop */
export function createAmmoPickup(amount = 18) {
  const g = new THREE.Group();
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.4, 0.55),
    new THREE.MeshStandardMaterial({
      color: 0xc9a227,
      roughness: 0.45,
      metalness: 0.35,
      emissive: 0x664400,
      emissiveIntensity: 0.55,
    })
  );
  crate.position.y = 0.22;
  crate.castShadow = true;
  g.add(crate);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.08, 0.58),
    new THREE.MeshBasicMaterial({ color: 0xffe066 })
  );
  stripe.position.y = 0.28;
  g.add(stripe);

  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 0.05, 16),
    new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.35, depthWrite: false })
  );
  glow.position.y = 0.03;
  g.add(glow);

  // Tiny bullet icons on top
  const tip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6),
    new THREE.MeshStandardMaterial({ color: 0xf0d060, roughness: 0.4, metalness: 0.5, emissive: 0xaa8800, emissiveIntensity: 0.4 })
  );
  tip.position.set(0, 0.52, 0);
  g.add(tip);

  g.userData.amount = amount;
  g.userData.bob = Math.random() * Math.PI * 2;
  g.userData.glow = glow;
  g.userData.crate = crate;
  return g;
}
