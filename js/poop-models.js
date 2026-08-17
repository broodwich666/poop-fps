import * as THREE from "three";

export function createPoopMaterial(color = 0x9b5523) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.22,
    metalness: 0.08,
    emissive: new THREE.Color(0x4a2810),
    emissiveIntensity: 0.12,
  });
}

export function createCoiledPoop(scale = 1, color = 0x9b5523) {
  const group = new THREE.Group();
  const mat = createPoopMaterial(color);
  const coils = [
    { major: 0.54, minor: 0.19, y: 0.1 },
    { major: 0.44, minor: 0.16, y: 0.34 },
    { major: 0.34, minor: 0.13, y: 0.56 },
    { major: 0.24, minor: 0.1, y: 0.74 },
  ];

  coils.forEach(({ major, minor, y }) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(major * scale, minor * scale, 16, 32),
      mat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y * scale;
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);
  });

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 14, 12), mat);
  tip.scale.set(1, 1.35, 1);
  tip.position.y = 0.95 * scale;
  tip.castShadow = true;
  group.add(tip);

  group.userData.height = 1.05 * scale;
  return group;
}

export function createAngryFace(scale = 1) {
  const face = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x2a1406, roughness: 0.7 });

  const eyeRadius = 0.14 * scale;
  const eyeY = 0.82 * scale;
  const eyeZ = 0.48 * scale;
  const eyeSpacing = 0.22 * scale;

  [-1, 1].forEach((side) => {
    const x = side * eyeSpacing;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 12, 12), white);
    eye.position.set(x, eyeY, eyeZ);
    face.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius * 0.45, 8, 8), black);
    pupil.position.set(x, eyeY, eyeZ + eyeRadius * 0.55);
    face.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.05 * scale, 0.04 * scale), browMat);
    brow.position.set(x, eyeY + 0.12 * scale, eyeZ + 0.02 * scale);
    brow.rotation.z = side > 0 ? -0.55 : 0.55;
    face.add(brow);
  });

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.13 * scale, 0.028 * scale, 8, 20, Math.PI),
    white
  );
  mouth.rotation.x = Math.PI;
  mouth.position.set(0, 0.62 * scale, eyeZ - 0.02 * scale);
  face.add(mouth);

  return face;
}

export function createEnemyPoop(sizeScale = 1) {
  const group = new THREE.Group();
  const body = createCoiledPoop(sizeScale, 0x8b4513);
  body.position.y = 0.05 * sizeScale;
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
  const gun = createCoiledPoop(0.85, 0xb8732a);
  gun.rotation.set(0.12, -0.5, 0.05);
  vm.add(gun);

  vm.position.set(0.58, -0.48, -0.82);
  vm.rotation.set(-0.06, 0.15, 0.04);
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
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat);
  mesh.scale.set(1.2, 0.8, 1.2);
  return mesh;
}
