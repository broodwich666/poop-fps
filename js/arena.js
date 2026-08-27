import * as THREE from "three";
import { createEnemyPoop } from "./poop-models.js";

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
  for (let y = 0; y < 256; y += 20) ctx.fillRect(0, y, 64, 2);
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
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0.02, color: 0xffffff });
}

function makeGrassMaterial(bright = true) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bright ? "#62c24c" : "#3a5a28";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) {
    const shade = i % 3;
    ctx.fillStyle = bright
      ? shade === 0 ? "#4aa63a" : shade === 1 ? "#78d45e" : "#3d8f30"
      : shade === 0 ? "#2a4418" : shade === 1 ? "#4a6830" : "#1e3210";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 5 + Math.random() * 10);
  }
  if (!bright) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#2a1a0c";
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 20, 5 + Math.random() * 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 28);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.96, color: 0xffffff });
}

function makeConcreteMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4a443c";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = i % 2 ? "#3a342c" : "#5a544c";
    ctx.globalAlpha = 0.35;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.05, color: 0xffffff });
}

function makeTileMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4a5248";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#2a3028";
  ctx.lineWidth = 3;
  for (let i = 0; i <= 128; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(20,30,20,0.25)";
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 4 + Math.random() * 12, 2 + Math.random() * 6);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0.08, color: 0xffffff });
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
  drawPoopIcon(ctx, 98, 128, 92);
  const titleFont = document.fonts?.check?.('900 92px "Luckiest Guy"')
    ? '900 92px "Luckiest Guy", "Arial Black", Arial, sans-serif'
    : "900 92px Arial Black, Arial, sans-serif";
  ctx.font = titleFont;
  ctx.fillStyle = "#3d1e08";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("POOP ARENA", 178, 138);
  ctx.fillStyle = "#6b3410";
  ctx.fillText("POOP ARENA", 174, 132);
  return new THREE.CanvasTexture(canvas);
}

function makeBannerTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6b3a14";
  ctx.fillRect(0, 0, 512, 640);
  ctx.fillStyle = "#5a3010";
  for (let y = 0; y < 640; y += 18) ctx.fillRect(0, y, 512, 2);
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 480, 608);
  ctx.fillStyle = "#e8c48a";
  ctx.font = "bold 72px Arial Black, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = text.split("\n");
  lines.forEach((line, i) => ctx.fillText(line, 256, 200 + i * 90));
  drawPoopIcon(ctx, 256, 420, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGraffitiTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 1024, 256);
  ctx.fillStyle = "rgba(240,230,210,0.92)";
  ctx.font = "italic 900 72px Impact, Arial Black, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(512, 128);
  ctx.rotate(-0.04);
  ctx.fillText("POOP IS POWER", 0, 0);
  ctx.strokeStyle = "rgba(20,10,0,0.45)";
  ctx.lineWidth = 3;
  ctx.strokeText("POOP IS POWER", 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCloud(x, y, z, scale = 1, color = 0xffffff) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
  });
  [[0, 0, 0, 1.35], [-1.1, 0.12, 0.25, 1], [1.15, 0.08, -0.15, 1.1], [0.45, 0.28, 0.55, 0.8], [-0.55, 0.22, -0.45, 0.85]].forEach(([bx, by, bz, r]) => {
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

function createToilet() {
  const g = new THREE.Group();
  const porcelain = new THREE.MeshStandardMaterial({ color: 0xd8ddd8, roughness: 0.35, metalness: 0.05 });
  const dirty = new THREE.MeshStandardMaterial({ color: 0xb8b8a8, roughness: 0.55 });
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.35, 0.55, 16), dirty);
  bowl.position.y = 0.35;
  g.add(bowl);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 8, 20), porcelain);
  seat.rotation.x = Math.PI / 2;
  seat.position.y = 0.62;
  g.add(seat);
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.28), porcelain);
  tank.position.set(0, 0.95, -0.35);
  g.add(tank);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.2, 12), dirty);
  base.position.y = 0.1;
  g.add(base);
  return g;
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
  const main = new THREE.Mesh(new THREE.CircleGeometry((0.55 + Math.random() * 0.35) * scale, 12), mat);
  if (!onWall) main.rotation.x = -Math.PI / 2;
  group.add(main);
  for (let i = 0; i < 3; i++) {
    const drip = new THREE.Mesh(new THREE.CircleGeometry((0.15 + Math.random() * 0.2) * scale, 8), mat);
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

function createWatchtower() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.7, metalness: 0.4 });
  [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 8, 0.22), wood);
    leg.position.set(x, 4, z);
    leg.castShadow = true;
    g.add(leg);
  });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 3.2), wood);
  deck.position.y = 8;
  deck.castShadow = true;
  g.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.6), metal);
  cabin.position.y = 9.2;
  cabin.castShadow = true;
  g.add(cabin);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), wood);
  roof.position.y = 10.9;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);
  const lightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), metal);
  lightPole.position.set(0, 11.4, 1.1);
  g.add(lightPole);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffcc66 })
  );
  lamp.position.set(0, 10.9, 1.35);
  g.add(lamp);
  return g;
}

function createParachutePoop() {
  const g = new THREE.Group();
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.85, side: THREE.DoubleSide })
  );
  canopy.position.y = 2.4;
  g.add(canopy);
  const cordMat = new THREE.MeshBasicMaterial({ color: 0x1a1008 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.2, 4), cordMat);
    cord.position.set(Math.cos(a) * 0.7, 1.3, Math.sin(a) * 0.7);
    cord.lookAt(0, 0.4, 0);
    g.add(cord);
  }
  const poop = createEnemyPoop(0.85);
  poop.position.y = 0;
  g.add(poop);
  g.userData.bob = Math.random() * Math.PI * 2;
  return g;
}

/** Sunny wooden POOP ARENA — gameplay mockup */
export function buildGameplayArena(scene, arenaSize = 40) {
  const root = new THREE.Group();
  root.name = "gameplay-arena";

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(arenaSize * 2, arenaSize * 2), makeGrassMaterial(true));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  root.add(grass);

  const plankMat = makeWoodPlankMaterial();
  const wallH = 5.4;
  [
    { x: 0, z: -arenaSize, rotY: 0, w: arenaSize * 2 },
    { x: 0, z: arenaSize, rotY: Math.PI, w: arenaSize * 2 },
    { x: -arenaSize, z: 0, rotY: Math.PI / 2, w: arenaSize * 2 },
    { x: arenaSize, z: 0, rotY: -Math.PI / 2, w: arenaSize * 2 },
  ].forEach(({ x, z, rotY, w }) => {
    const fence = createPlankWall(w, wallH, 0.38, plankMat);
    fence.position.set(x, wallH / 2, z);
    fence.rotation.y = rotY;
    root.add(fence);
  });

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 3.6), new THREE.MeshStandardMaterial({ roughness: 0.78 }));
  const applySign = () => {
    const tex = makeSignTexture();
    tex.colorSpace = THREE.SRGBColorSpace;
    if (sign.material.map) sign.material.map.dispose();
    sign.material.map = tex;
    sign.material.needsUpdate = true;
  };
  applySign();
  if (document.fonts?.ready) document.fonts.ready.then(applySign);
  sign.position.set(0, 3.9, -arenaSize + 0.55);
  root.add(sign);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
  const signPostL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.4, 0.28), postMat);
  signPostL.position.set(-5.8, 2.2, -arenaSize + 0.42);
  const signPostR = signPostL.clone();
  signPostR.position.x = 5.8;
  root.add(signPostL, signPostR);

  [[-10, 16, -14], [12, 17, -22], [-6, 18, -28], [18, 15, -8], [2, 19, -18], [-20, 16, -6], [8, 17, 4]].forEach(([x, y, z]) => {
    root.add(createCloud(x, y, z, 1.7 + Math.random() * 0.5));
  });

  for (let i = 0; i < 22; i++) {
    const pos = new THREE.Vector3((Math.random() - 0.5) * arenaSize * 1.7, 0, (Math.random() - 0.5) * arenaSize * 1.7);
    root.add(createMockupSplat(pos, { permanent: true, life: Infinity, scale: 0.7 + Math.random() * 0.9 }));
  }
  [
    new THREE.Vector3(-6, 1.6, -arenaSize + 0.22),
    new THREE.Vector3(9, 2.4, -arenaSize + 0.22),
    new THREE.Vector3(-14, 3.1, -arenaSize + 0.22),
  ].forEach((pos) => {
    const splat = createMockupSplat(pos, { permanent: true, life: Infinity, onWall: true, scale: 1.1 });
    splat.rotation.set(0, 0, Math.random() * 0.4);
    root.add(splat);
  });

  scene.add(root);
  return { root, arenaSize, wallH };
}

/** Dusk military compound — title menu mockup */
export function buildMenuCompound(scene) {
  const root = new THREE.Group();
  root.name = "menu-compound";
  const size = 28;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(size * 2.4, size * 2.4), makeGrassMaterial(false));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const concrete = makeConcreteMaterial();
  const wallH = 9;
  [
    { x: 0, z: -size, rotY: 0 },
    { x: 0, z: size, rotY: Math.PI },
    { x: -size, z: 0, rotY: Math.PI / 2 },
    { x: size, z: 0, rotY: -Math.PI / 2 },
  ].forEach(({ x, z, rotY }) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(size * 2.05, wallH, 0.7), concrete);
    wall.position.set(x, wallH / 2, z);
    wall.rotation.y = rotY;
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);
    const fence = new THREE.Mesh(
      new THREE.BoxGeometry(size * 2.05, 1.4, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x1a140e, roughness: 0.6, metalness: 0.5 })
    );
    fence.position.set(x, wallH + 0.5, z);
    fence.rotation.y = rotY;
    root.add(fence);
  });

  const graffiti = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 3.8),
    new THREE.MeshBasicMaterial({ map: makeGraffitiTexture(), transparent: true, depthWrite: false })
  );
  graffiti.position.set(-size + 0.42, 5.5, 2);
  graffiti.rotation.y = Math.PI / 2;
  root.add(graffiti);

  const tower = createWatchtower();
  tower.position.set(14, 0, -10);
  root.add(tower);

  const tower2 = createWatchtower();
  tower2.position.set(-16, 0, 8);
  tower2.scale.setScalar(0.85);
  root.add(tower2);

  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 5.2),
    new THREE.MeshStandardMaterial({ map: makeBannerTexture("BROWN\nZONE"), roughness: 0.85, side: THREE.DoubleSide })
  );
  banner.position.set(14, 5.2, -7.2);
  banner.rotation.y = -0.4;
  root.add(banner);

  // Spotlights
  const spotTargets = [];
  [
    [12, 11, -9, 4, 0, -2],
    [-14, 10, 6, -4, 0, 2],
    [0, 12, -20, 0, 0, -8],
  ].forEach(([x, y, z, tx, ty, tz]) => {
    const spot = new THREE.SpotLight(0xffb060, 4.8, 60, 0.5, 0.4, 1.1);
    spot.position.set(x, y, z);
    spot.castShadow = true;
    const target = new THREE.Object3D();
    target.position.set(tx, ty, tz);
    root.add(target);
    spot.target = target;
    root.add(spot);
    spotTargets.push(spot);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffcc77 })
    );
    glow.position.set(x, y, z);
    root.add(glow);
  });

  // Crowd of angry poops
  const props = [];
  for (let i = 0; i < 18; i++) {
    const p = createEnemyPoop(0.9 + Math.random() * 0.7);
    p.position.set((Math.random() - 0.5) * 30, 0, -2 - Math.random() * 22);
    p.rotation.y = Math.random() * Math.PI * 2;
    p.userData.wobble = Math.random() * 10;
    root.add(p);
    props.push(p);
  }

  const chute = createParachutePoop();
  chute.position.set(-10, 9, -14);
  root.add(chute);
  props.push(chute);

  // Dusk clouds
  [[-12, 18, -20], [8, 16, -24], [18, 17, -12]].forEach(([x, y, z]) => {
    root.add(createCloud(x, y, z, 2.2, 0x5a4838));
  });

  scene.add(root);
  return { root, props, spotTargets };
}

/** Grim bathroom — game over mockup */
export function buildBathroomArena(scene) {
  const root = new THREE.Group();
  root.name = "bathroom-arena";

  const tile = makeTileMaterial();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), tile);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a4238, roughness: 0.85 });
  [
    [0, 4, -10, 24, 8, 0.4, 0],
    [0, 4, 10, 24, 8, 0.4, 0],
    [-10, 4, 0, 0.4, 8, 24, 0],
    [10, 4, 0, 0.4, 8, 24, 0],
  ].forEach(([x, y, z, w, h, d]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, y, z);
    wall.receiveShadow = true;
    root.add(wall);
  });

  const stalls = [];
  for (let i = 0; i < 5; i++) {
    const toilet = createToilet();
    toilet.position.set(-6 + i * 3, 0, -7.5);
    root.add(toilet);
    stalls.push(toilet);
  }

  const props = [];
  for (let i = 0; i < 8; i++) {
    const p = createEnemyPoop(0.55 + Math.random() * 0.35);
    p.position.set((Math.random() - 0.5) * 12, 0, -2 + Math.random() * 5);
    p.lookAt(0.5, 0.4, 6);
    p.userData.wobble = Math.random() * 8;
    root.add(p);
    props.push(p);
  }

  // Dim overhead lamps
  for (let i = 0; i < 3; i++) {
    const lamp = new THREE.PointLight(0xffe0a0, 0.55, 14, 2);
    lamp.position.set(-5 + i * 5, 6.5, 0);
    root.add(lamp);
  }

  scene.add(root);
  return { root, props };
}

export function applyMenuLighting(scene) {
  clearLights(scene);
  scene.background = new THREE.Color(0x4a2a18);
  scene.fog = new THREE.FogExp2(0x2a1810, 0.012);
  const hemi = new THREE.HemisphereLight(0xff9040, 0x1a1008, 0.75);
  hemi.name = "dyn-light";
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xff8028, 0.95);
  sun.name = "dyn-light";
  sun.position.set(-18, 22, 10);
  sun.castShadow = true;
  scene.add(sun);
  const fill = new THREE.AmbientLight(0x5a3820, 0.55);
  fill.name = "dyn-light";
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xff6030, 0.4);
  rim.name = "dyn-light";
  rim.position.set(10, 8, -20);
  scene.add(rim);
}

export function applyGameplayLighting(scene) {
  clearLights(scene);
  scene.background = new THREE.Color(0x62b7ea);
  scene.fog = new THREE.Fog(0xb7dff5, 55, 110);
  const hemi = new THREE.HemisphereLight(0x9ad4f5, 0x5aad4a, 0.9);
  hemi.name = "dyn-light";
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e8, 1.85);
  sun.name = "dyn-light";
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
  bounce.name = "dyn-light";
  bounce.position.set(16, 10, -12);
  scene.add(bounce);
}

export function applyBathroomLighting(scene) {
  clearLights(scene);
  scene.background = new THREE.Color(0x151810);
  scene.fog = new THREE.Fog(0x0e120e, 10, 32);
  const amb = new THREE.AmbientLight(0x506050, 0.55);
  amb.name = "dyn-light";
  scene.add(amb);
  const hemi = new THREE.HemisphereLight(0x7a8870, 0x1a1810, 0.55);
  hemi.name = "dyn-light";
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe8c0, 0.85);
  key.name = "dyn-light";
  key.position.set(4, 10, 6);
  scene.add(key);
  const fill = new THREE.PointLight(0xffcc88, 1.1, 18, 1.5);
  fill.name = "dyn-light";
  fill.position.set(0, 5, 2);
  scene.add(fill);
}

function clearLights(scene) {
  const remove = [];
  scene.traverse((o) => {
    if (o.name === "dyn-light" || (o.isLight && o.parent === scene && o.name !== "keep")) remove.push(o);
  });
  remove.forEach((o) => scene.remove(o));
}

export function configureMockupRenderer(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

// Back-compat aliases used by older game.js
export function buildMockupArena(scene, arenaSize = 40) {
  return buildGameplayArena(scene, arenaSize);
}
export function setupMockupLighting(scene) {
  applyGameplayLighting(scene);
}
