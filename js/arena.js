import * as THREE from "three";

function makeWoodPlankMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#9a6b3a";
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = "#7a5228";
  for (let y = 0; y < 256; y += 18) {
    ctx.fillRect(0, y, 64, 2);
  }
  ctx.fillStyle = "#b8844f";
  ctx.fillRect(4, 0, 8, 256);
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#3d220f";
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(Math.random() * 50, Math.random() * 240, 3 + Math.random() * 8, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.82,
    metalness: 0.02,
    color: 0xffffff,
  });
}

function makeGrassMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#5aad4a";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = i % 2 ? "#4a9c3d" : "#6bc45a";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 6 + Math.random() * 8);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.95,
    color: 0xffffff,
  });
}

function makeSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = "#5c3a18";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 240);
  ctx.font = "bold 52px Georgia, serif";
  ctx.fillStyle = "#f5e6c8";
  ctx.textAlign = "center";
  ctx.fillText("💩 POOP ARENA 💩", 256, 110);
  ctx.font = "italic 28px Georgia, serif";
  ctx.fillStyle = "#d4a574";
  ctx.fillText("Brown Zone Battleground", 256, 170);
  return new THREE.CanvasTexture(canvas);
}

function createCloud(x, y, z, scale = 1) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.95,
  });
  const blobs = [
    [0, 0, 0, 1.2],
    [-0.9, 0.1, 0.2, 0.9],
    [0.9, 0.05, -0.1, 1],
    [0.4, 0.2, 0.5, 0.75],
    [-0.5, 0.15, -0.4, 0.8],
  ];
  blobs.forEach(([bx, by, bz, r]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 12, 10), mat);
    puff.scale.set(1.3, 0.7, 1);
    puff.position.set(bx * scale, by * scale, bz * scale);
    group.add(puff);
  });
  group.position.set(x, y, z);
  return group;
}

function createPlankWall(width, height, depth, plankMat) {
  const group = new THREE.Group();
  const plankW = 0.55;
  const count = Math.floor(width / plankW);
  for (let i = 0; i < count; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(plankW - 0.06, height, depth), plankMat);
    plank.position.x = -width / 2 + plankW * i + plankW / 2;
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }
  const railMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, depth + 0.08), railMat);
  topRail.position.y = height / 2 - 0.05;
  group.add(topRail);
  const botRail = topRail.clone();
  botRail.position.y = -height / 2 + 0.25;
  group.add(botRail);
  return group;
}

export function buildMockupArena(scene, arenaSize = 40) {
  scene.background = new THREE.Color(0x5eb3e8);
  scene.fog = new THREE.Fog(0xa8d8f0, 45, 95);

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(arenaSize * 2, arenaSize * 2),
    makeGrassMaterial()
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  const plankMat = makeWoodPlankMaterial();
  const wallH = 4.2;
  const walls = [
    { x: 0, z: -arenaSize, rotY: 0, w: arenaSize * 2 },
    { x: 0, z: arenaSize, rotY: Math.PI, w: arenaSize * 2 },
    { x: -arenaSize, z: 0, rotY: Math.PI / 2, w: arenaSize * 2 },
    { x: arenaSize, z: 0, rotY: -Math.PI / 2, w: arenaSize * 2 },
  ];
  walls.forEach(({ x, z, rotY, w }) => {
    const fence = createPlankWall(w, wallH, 0.35, plankMat);
    fence.position.set(x, wallH / 2, z);
    fence.rotation.y = rotY;
    scene.add(fence);
  });

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 3),
    new THREE.MeshStandardMaterial({ map: makeSignTexture(), roughness: 0.8 })
  );
  sign.position.set(0, 3.2, -arenaSize + 0.5);
  scene.add(sign);

  const signPostL = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 3.5, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x6b4423 })
  );
  signPostL.position.set(-2.8, 1.75, -arenaSize + 0.4);
  const signPostR = signPostL.clone();
  signPostR.position.x = 2.8;
  scene.add(signPostL, signPostR);

  [
    [-18, 22, -12],
    [14, 24, -20],
    [-8, 26, 16],
    [22, 23, 8],
    [0, 28, 0],
  ].forEach(([x, y, z]) => scene.add(createCloud(x, y, z, 1.4 + Math.random() * 0.6)));

  return { arenaSize, wallH };
}

export function createMockupSplat(position) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x4a2810,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
  const main = new THREE.Mesh(new THREE.CircleGeometry(0.55 + Math.random() * 0.35, 12), mat);
  main.rotation.x = -Math.PI / 2;
  group.add(main);
  for (let i = 0; i < 3; i++) {
    const drip = new THREE.Mesh(new THREE.CircleGeometry(0.15 + Math.random() * 0.2, 8), mat);
    drip.rotation.x = -Math.PI / 2;
    drip.position.set((Math.random() - 0.5) * 0.8, 0.001, (Math.random() - 0.5) * 0.8);
    group.add(drip);
  }
  group.position.copy(position);
  group.position.y = 0.025;
  group.rotation.y = Math.random() * Math.PI;
  group.userData.life = 8;
  return group;
}

export function setupMockupLighting(scene) {
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x5aad4a, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff8ee, 1.65);
  sun.position.set(20, 35, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 90;
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35;
  sun.shadow.camera.bottom = -35;
  scene.add(sun);

  const bounce = new THREE.DirectionalLight(0xffeedd, 0.35);
  bounce.position.set(-15, 10, -10);
  scene.add(bounce);
}

export function configureMockupRenderer(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}
