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
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32 });
  const black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.45 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x1a0c04, roughness: 0.7 });

  const eyeRadius = 0.155 * scale;
  const eyeY = 0.72 * scale;
  const eyeZ = 0.5 * scale;
  const eyeSpacing = 0.2 * scale;

  [-1, 1].forEach((side) => {
    const x = side * eyeSpacing;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 14, 14), white);
    eye.scale.set(1, 1.05, 0.72);
    eye.position.set(x, eyeY, eyeZ);
    face.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius * 0.42, 10, 10), black);
    pupil.position.set(x + side * 0.01 * scale, eyeY - 0.015 * scale, eyeZ + eyeRadius * 0.42);
    face.add(pupil);

    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.24 * scale, 0.055 * scale, 0.05 * scale),
      browMat
    );
    brow.position.set(x, eyeY + 0.145 * scale, eyeZ + 0.02 * scale);
    brow.rotation.z = side > 0 ? -0.62 : 0.62;
    face.add(brow);
  });

  return face;
}

export function createEnemyPoop(sizeScale = 1) {
  const group = new THREE.Group();
  const body = createCoiledPoop(sizeScale, 0x8b4513);
  body.position.y = 0.04 * sizeScale;
  group.add(body);

  const face = createAngryFace(sizeScale);
  face.position.z = 0.02 * sizeScale;
  group.add(face);

  group.userData.body = body;
  group.userData.face = face;
  group.userData.hitRadius = 0.95 * sizeScale;
  group.userData.height = body.userData.height;
  return group;
}

export function createViewmodelGun() {
  const vm = new THREE.Group();
  const gun = createCoiledPoop(0.95, 0x5c3010);
  gun.rotation.set(0.14, -0.52, 0.06);
  vm.add(gun);

  vm.position.set(0.62, -0.5, -0.78);
  vm.rotation.set(-0.08, 0.16, 0.05);
  vm.userData.gun = gun;
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
