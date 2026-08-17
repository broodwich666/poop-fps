import * as THREE from "three";

function makeWoodPlankMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#a56f3c";
  ctx.fillRect(0, 0, 64, 256);

  for (let y = 0; y < 256; y++) {
    const n = (y % 37) / 37;
    ctx.fillStyle = n < 0.5 ? "#8a572c" : "#b8834d";
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, y, 64, 1);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#7a4e26";
  for (let y = 0; y < 256; y += 20) {
    ctx.fillRect(0, y, 64, 2);
  }
  ctx.fillStyle = "#c9955c";
  ctx.fillRect(6, 0, 7, 256);
  ctx.fillStyle = "#6b3d1c";
  ctx.fillRect(48, 0, 3, 256);

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#3d220f";
  for (let i = 0; i < 18; i++) {
    ctx.fillRect(4 + Math.random() * 50, Math.random() * 240, 2 + Math.random() * 10, 1 + Math.random() * 3);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.86,
    metalness: 0.02,
    color: 0xffffff,
  });
}

function makeGrassMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#62c24c";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const shade = i % 3;
    ctx.fillStyle = shade === 0 ? "#4aa63a" : shade === 1 ? "#78d45e" : "#3d8f30";
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 5 + Math.random() * 10);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 28);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.96,
    color: 0xffffff,
  });
}

function drawPoopIcon(ctx, x, y, s) {
  ctx.fillStyle = "#6b3a14";
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.34, s * 0.44, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.1, s * 0.32, s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + s * 0.02, y - s * 0.12, s * 0.2, s * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + s * 0.04, y - s * 0.28, s * 0.1, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function makeSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#a87440";
  ctx.fillRect(0, 0, 768, 256);
  for (let x = 0; x < 768; x += 48) {
    ctx.fillStyle = x % 96 === 0 ? "#8b5a2b" : "#b8844f";
    ctx.globalAlpha = 0.28;
    ctx.fillRect(x, 0, 6, 256);
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#5c3a18";
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 748, 236);
  ctx.strokeStyle = "#d4b07a";
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 22, 724, 212);

  drawPoopIcon(ctx, 118, 128, 70);

  ctx.font = "900 72px Nunito, Arial Black, sans-serif";
  ctx.fillStyle = "#5c3010";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("POOP ARENA", 188, 134);
  ctx.fillStyle = "#8b4a1c";
  ctx.fillText("POOP ARENA", 186, 130);

  return new THREE.CanvasTexture(canvas);
}

function createCloud(x, y, z, scale = 1) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.96,
  });
  const blobs = [
    [0, 0, 0, 1.35],
    [-1.1, 0.12, 0.25, 1],
    [1.15, 0.08, -0.15, 1.1],
    [0.45, 0.28, 0.55, 0.8],
    [-0.55, 0.22, -0.45, 0.85],
    [0.1, 0.4, 0.1, 0.7],
  ];
  blobs.forEach(([bx, by, bz, r]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 12, 10), mat);
    puff.scale.set(1.35, 0.68, 1);
    puff.position.set(bx * scale, by * scale, bz * scale);
    group.add(puff);
  });
  group.position.set(x, y, z);
  return group;
}

function createPlankWall(width, height, depth, plankMat) {
  const group = new THREE.Group();
  const plankW = 0.52;
  const count = Math.floor(width / plankW);
  for (let i = 0; i < count; i++) {
    const hJitter = height * (0.94 + (i % 5) * 0.015);
    const plank = new THREE.Mesh(new THREE.BoxGeometry(plankW - 0.05, hJitter, depth), plankMat);
    plank.position.x = -width / 2 + plankW * i + plankW / 2;
    plank.position.y = (hJitter - height) / 2;
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }
  const railMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, depth + 0.1), railMat);
  topRail.position.y = height / 2 - 0.04;
  group.add(topRail);
  const botRail = topRail.clone();
  botRail.position.y = -height / 2 + 0.28;
  group.add(botRail);
  return group;
}

export function createMockupSplat(position, options = {}) {
  const { scale = 1, onWall = false } = options;
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x4a2810,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const main = new THREE.Mesh(
    new THREE.CircleGeometry((0.55 + Math.random() * 0.35) * scale, 12),
    mat
  );
  if (!onWall) main.rotation.x = -Math.PI / 2;
  group.add(main);
  for (let i = 0; i < 3; i++) {
    const drip = new THREE.Mesh(
      new THREE.CircleGeometry((0.15 + Math.random() * 0.2) * scale, 8),
      mat
    );
    if (!onWall) drip.rotation.x = -Math.PI / 2;
    drip.position.set((Math.random() - 0.5) * 0.8 * scale, onWall ? (Math.random() - 0.5) * 0.5 : 0.001, (Math.random() - 0.5) * 0.8 * scale);
    group.add(drip);
  }
  group.position.copy(position);
  if (!onWall) group.position.y = 0.025;
  group.rotation.y = Math.random() * Math.PI;
  group.userData.life = options.life ?? 8;
  group.userData.permanent = Boolean(options.permanent);
  return group;
}

export function buildMockupArena(scene, arenaSize = 40) {
  scene.background = new THREE.Color(0x62b7ea);
  scene.fog = new THREE.Fog(0xb7dff5, 55, 110);

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(arenaSize * 2, arenaSize * 2),
    makeGrassMaterial()
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);

  const plankMat = makeWoodPlankMaterial();
  const wallH = 5.4;
  const walls = [
    { x: 0, z: -arenaSize, rotY: 0, w: arenaSize * 2 },
    { x: 0, z: arenaSize, rotY: Math.PI, w: arenaSize * 2 },
    { x: -arenaSize, z: 0, rotY: Math.PI / 2, w: arenaSize * 2 },
    { x: arenaSize, z: 0, rotY: -Math.PI / 2, w: arenaSize * 2 },
  ];
  walls.forEach(({ x, z, rotY, w }) => {
    const fence = createPlankWall(w, wallH, 0.38, plankMat);
    fence.position.set(x, wallH / 2, z);
    fence.rotation.y = rotY;
    scene.add(fence);
  });

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8.2, 2.5),
    new THREE.MeshStandardMaterial({ roughness: 0.78 })
  );
  const applySign = () => {
    const tex = makeSignTexture();
    tex.colorSpace = THREE.SRGBColorSpace;
    if (sign.material.map) sign.material.map.dispose();
    sign.material.map = tex;
    sign.material.needsUpdate = true;
  };
  applySign();
  if (document.fonts?.ready) document.fonts.ready.then(applySign);
  sign.position.set(0, 3.4, -arenaSize + 0.55);
  scene.add(sign);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const signPostL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.8, 0.22), postMat);
  signPostL.position.set(-3.9, 1.9, -arenaSize + 0.42);
  const signPostR = signPostL.clone();
  signPostR.position.x = 3.9;
  scene.add(signPostL, signPostR);

  [
    [-18, 22, -12],
    [14, 24, -20],
    [-8, 26, 16],
    [22, 23, 8],
    [0, 28, 0],
    [-24, 25, 10],
    [10, 27, -6],
  ].forEach(([x, y, z]) => scene.add(createCloud(x, y, z, 1.5 + Math.random() * 0.55)));

  for (let i = 0; i < 16; i++) {
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * arenaSize * 1.7,
      0,
      (Math.random() - 0.5) * arenaSize * 1.7
    );
    scene.add(createMockupSplat(pos, { permanent: true, life: Infinity, scale: 0.7 + Math.random() * 0.8 }));
  }

  const wallSplats = [
    new THREE.Vector3(-6, 1.6, -arenaSize + 0.22),
    new THREE.Vector3(9, 2.4, -arenaSize + 0.22),
    new THREE.Vector3(-14, 3.1, -arenaSize + 0.22),
  ];
  wallSplats.forEach((pos) => {
    const splat = createMockupSplat(pos, { permanent: true, life: Infinity, onWall: true, scale: 1.1 });
    splat.rotation.set(0, 0, Math.random() * 0.4);
    scene.add(splat);
  });

  return { arenaSize, wallH };
}

export function setupMockupLighting(scene) {
  const hemi = new THREE.HemisphereLight(0x9ad4f5, 0x5aad4a, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff6e8, 1.85);
  sun.position.set(-22, 38, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 90;
  sun.shadow.camera.left = -38;
  sun.shadow.camera.right = 38;
  sun.shadow.camera.top = 38;
  sun.shadow.camera.bottom = -38;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const bounce = new THREE.DirectionalLight(0xffeedd, 0.32);
  bounce.position.set(16, 10, -12);
  scene.add(bounce);
}

export function configureMockupRenderer(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}
