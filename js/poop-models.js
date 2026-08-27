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

export function createViewmodelGun() {
  const vm = new THREE.Group();
  // Compact lower-right coil — readable without eating half the FOV
  const gun = createCoiledPoop(0.7, 0x5c3010);
  gun.rotation.set(0.28, -0.72, 0.12);
  vm.add(gun);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  muzzle.position.set(0.08, 0.55, 0.28);
  gun.add(muzzle);

  vm.position.set(0.38, -0.42, -0.52);
  vm.rotation.set(0.12, 0.42, 0.1);
  vm.userData.gun = gun;
  vm.userData.muzzle = muzzle;
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
