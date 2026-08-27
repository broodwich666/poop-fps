import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import {
  applyBathroomLighting,
  applyGameplayLighting,
  applyMenuLighting,
  buildBathroomArena,
  buildGameplayArena,
  buildMenuCompound,
  configureMockupRenderer,
  createMockupSplat,
} from "./arena.js";
import {
  createEnemyPoop,
  createProjectileMesh,
  createRifleViewmodel,
  createTrailParticle,
  createViewmodelGun,
} from "./poop-models.js";

const canvas = document.getElementById("game-canvas");
const overlay = document.getElementById("overlay");
const menu = document.getElementById("menu");
const gameOverPanel = document.getElementById("game-over");
const pausePanel = document.getElementById("paused");
const hud = document.getElementById("hud");
const playHud = document.getElementById("play-hud");
const goHud = document.getElementById("go-hud");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const menuBtn = document.getElementById("menu-btn");
const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const killsEl = document.getElementById("kills");
const finalScoreEl = document.getElementById("final-score");
const finalWaveEl = document.getElementById("final-wave");
const finalKillsEl = document.getElementById("final-kills");
const healthFill = document.getElementById("health-fill");
const healthText = document.getElementById("health-text");
const damageVignette = document.getElementById("damage-vignette");
const hitMarker = document.getElementById("hit-marker");
const waveToast = document.getElementById("wave-toast");
const waveToastNum = document.getElementById("wave-toast-num");
const crosshair = document.getElementById("crosshair");
const ammoText = document.getElementById("ammo-text");
const minimapCanvas = document.getElementById("minimap");
const goMinimapCanvas = document.getElementById("go-minimap");
const goWaveText = document.getElementById("go-wave-text");
const goHealthFill = document.getElementById("go-health-fill");
const goHealthText = document.getElementById("go-health-text");
const goAmmoText = document.getElementById("go-ammo-text");

const ARENA_SIZE = 40;
const PLAYER_HEIGHT = 1.7;
const GRAVITY = 25;
const MOVE_SPEED = 8.5;
const SPRINT_MULT = 1.65;
const FIRE_RATE = 0.16;
const PROJECTILE_SPEED = 32;
const ENEMY_SPEED = 3.6;
const ENEMY_DAMAGE = 12;
const ENEMY_ATTACK_COOLDOWN = 1.05;
const MAX_TRAIL_PARTS = 10;
const MAX_WAVES = 10;
const MAG_SIZE = 12;
const START_RESERVE = 96;

const keys = {};
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let scene, camera, renderer, controls;
let swirlGun, rifleGun, activeViewmodel;
let projectiles = [];
let fxBits = [];
let enemies = [];
let splats = [];
let playing = false;
let lastShot = 0;
let spawnTimer = 0;
let enemyIdCounter = 0;
let weaponRecoil = 0;
let muzzleFlash = 0;
let shakeAmp = 0;
let bobPhase = 0;
let audioCtx = null;
let mode = "menu"; // menu | play | gameover

let menuWorld = null;
let playWorld = null;
let bathWorld = null;

const state = {
  health: 100,
  score: 0,
  kills: 0,
  wave: 1,
  enemiesToSpawn: 5,
  enemiesSpawned: 0,
  mag: MAG_SIZE,
  reserve: START_RESERVE,
  lastHealth: 100,
};

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}

function playTone({ freq = 220, dur = 0.08, type = "square", gain = 0.05, slide = 0 }) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const sfxShoot = () => {
  playTone({ freq: 160, dur: 0.07, type: "triangle", gain: 0.06, slide: -90 });
  playTone({ freq: 420, dur: 0.04, type: "square", gain: 0.025, slide: -200 });
};
const sfxHit = () => playTone({ freq: 520, dur: 0.05, type: "square", gain: 0.04, slide: 80 });
const sfxKill = () => {
  playTone({ freq: 180, dur: 0.12, type: "sawtooth", gain: 0.05, slide: -120 });
  playTone({ freq: 90, dur: 0.16, type: "triangle", gain: 0.045, slide: -40 });
};
const sfxHurt = () => playTone({ freq: 110, dur: 0.14, type: "sawtooth", gain: 0.055, slide: -60 });
const sfxWave = () => {
  playTone({ freq: 260, dur: 0.1, type: "triangle", gain: 0.04, slide: 120 });
  playTone({ freq: 390, dur: 0.14, type: "triangle", gain: 0.035, slide: 160 });
};
const sfxEmpty = () => playTone({ freq: 90, dur: 0.06, type: "square", gain: 0.03, slide: -20 });
const sfxReload = () => playTone({ freq: 200, dur: 0.1, type: "triangle", gain: 0.04, slide: 80 });

function formatScore(n) {
  return n.toLocaleString("en-US");
}

function enemyCenter(enemy) {
  const h = enemy.userData.height ?? 1;
  return enemy.position.clone().add(new THREE.Vector3(0, h * 0.5, 0));
}

function setViewmodel(kind) {
  swirlGun.visible = kind === "swirl";
  rifleGun.visible = kind === "rifle";
  activeViewmodel = kind === "rifle" ? rifleGun : swirlGun;
}

function hideWorlds() {
  if (menuWorld?.root) menuWorld.root.visible = false;
  if (playWorld?.root) playWorld.root.visible = false;
  if (bathWorld?.root) bathWorld.root.visible = false;
}

function showMenuWorld() {
  mode = "menu";
  hideWorlds();
  if (!menuWorld) menuWorld = buildMenuCompound(scene);
  menuWorld.root.visible = true;
  applyMenuLighting(scene);
  setViewmodel("none");
  swirlGun.visible = false;
  rifleGun.visible = false;
  poseMenuCamera();
  document.body.classList.remove("is-gameover-screen", "is-playing");
  hud.classList.add("hidden");
  playHud.classList.remove("hidden");
  goHud.classList.add("hidden");
}

function showPlayWorld() {
  mode = "play";
  hideWorlds();
  if (!playWorld) playWorld = buildGameplayArena(scene, ARENA_SIZE);
  playWorld.root.visible = true;
  applyGameplayLighting(scene);
  setViewmodel("swirl");
  document.body.classList.remove("is-gameover-screen");
  playHud.classList.remove("hidden");
  goHud.classList.add("hidden");
}

function showBathroomWorld() {
  mode = "gameover";
  hideWorlds();
  if (!bathWorld) bathWorld = buildBathroomArena(scene);
  bathWorld.root.visible = true;
  applyBathroomLighting(scene);
  setViewmodel("rifle");
  poseGameOverCamera();
  document.body.classList.add("is-gameover-screen");
  document.body.classList.remove("is-playing");
  hud.classList.remove("hidden");
  playHud.classList.add("hidden");
  goHud.classList.remove("hidden");
  updateGoHud();
  drawMinimap(goMinimapCanvas, true);
}

function poseMenuCamera() {
  camera.position.set(2.5, 3.2, 14);
  camera.lookAt(-2, 3.5, -6);
}

function poseGameOverCamera() {
  camera.position.set(0.55, 1.65, 6.2);
  camera.lookAt(-0.4, 1.15, -5);
  camera.rotation.z = 0;
}

function createEnemy(x, z) {
  const sizeScale = 1.05 + Math.random() * 0.55;
  const group = createEnemyPoop(sizeScale);
  group.position.set(x, 0, z);
  group.userData = {
    ...group.userData,
    id: ++enemyIdCounter,
    health: 2 + Math.floor(state.wave / 2),
    speed: ENEMY_SPEED + state.wave * 0.22 + Math.random() * 0.4,
    lastAttack: 0,
    wobble: Math.random() * Math.PI * 2,
    hopPhase: Math.random() * Math.PI * 2,
    hopSpeed: 7 + Math.random() * 3,
    hopHeight: 0.22 + Math.random() * 0.18,
    sizeScale,
    flashUntil: 0,
    telegraphUntil: 0,
  };
  scene.add(group);
  enemies.push(group);
}

function createSplat(position) {
  const splat = createMockupSplat(position);
  scene.add(splat);
  splats.push(splat);
}

function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, PLAYER_HEIGHT, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  configureMockupRenderer(renderer);

  scene.add(camera);
  swirlGun = createViewmodelGun();
  rifleGun = createRifleViewmodel();
  swirlGun.visible = false;
  rifleGun.visible = false;
  camera.add(swirlGun);
  camera.add(rifleGun);
  activeViewmodel = swirlGun;

  controls = new PointerLockControls(camera, document.body);
  controls.addEventListener("lock", () => {
    if (playing) {
      overlay.classList.add("playing");
      overlay.classList.remove("is-gameover");
      menu.classList.add("hidden");
      gameOverPanel.classList.add("hidden");
      pausePanel.classList.add("hidden");
      hud.classList.remove("hidden");
      document.body.classList.add("is-playing");
    }
  });
  controls.addEventListener("unlock", () => {
    document.body.classList.remove("is-playing");
    if (playing && state.health > 0) {
      overlay.classList.remove("playing");
      pausePanel.classList.remove("hidden");
    }
  });

  showMenuWorld();
}

function clearCombat() {
  projectiles.forEach((p) => {
    scene.remove(p.mesh);
    p.trail.forEach((t) => scene.remove(t.mesh));
  });
  fxBits.forEach((b) => scene.remove(b.mesh));
  enemies.forEach((e) => scene.remove(e));
  splats.forEach((s) => {
    if (!s.userData.permanent) scene.remove(s);
  });
  projectiles = [];
  fxBits = [];
  enemies = [];
  splats = splats.filter((s) => s.userData.permanent);
  weaponRecoil = 0;
  muzzleFlash = 0;
  shakeAmp = 0;
}

function resetGame() {
  clearCombat();
  state.health = 100;
  state.score = 0;
  state.kills = 0;
  state.wave = 1;
  state.enemiesToSpawn = 5;
  state.enemiesSpawned = 0;
  state.mag = MAG_SIZE;
  state.reserve = START_RESERVE;
  spawnTimer = 0;
  velocity.set(0, 0, 0);
  camera.position.set(0, PLAYER_HEIGHT, 0);
  updateHud();
}

function updateHud() {
  scoreEl.textContent = formatScore(state.score);
  waveEl.textContent = state.wave;
  killsEl.textContent = state.kills;
  healthFill.style.width = `${Math.max(0, state.health)}%`;
  healthText.textContent = Math.max(0, Math.ceil(state.health));
  healthFill.style.background =
    state.health > 50
      ? "linear-gradient(180deg, #e2ff78, #8fd63a 48%, #5aa81a)"
      : state.health > 25
        ? "linear-gradient(180deg, #f0d060, #d4a017 55%, #b8860b)"
        : "linear-gradient(180deg, #ff6b6b, #c62828 55%, #8b0000)";
  ammoText.textContent = `${state.mag}/${state.reserve}`;
  drawMinimap(minimapCanvas, false);
}

function updateGoHud() {
  const hp = state.lastHealth > 0 ? state.lastHealth : 35;
  goWaveText.textContent = `${Math.min(state.wave, MAX_WAVES)}/${MAX_WAVES}`;
  goHealthFill.style.width = `${Math.max(0, hp)}%`;
  goHealthText.textContent = Math.max(0, Math.ceil(hp));
  goAmmoText.textContent = `${state.mag}/${state.reserve}`;
}

function drawMinimap(c, frozen) {
  if (!c) return;
  const ctx = c.getContext("2d");
  const w = c.width;
  const h = c.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0c140c";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1e3a1e";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, (w / 2) * (i / 3) * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }
  const scale = (w * 0.42) / ARENA_SIZE;
  const px = frozen ? 0 : camera.position.x;
  const pz = frozen ? 2 : camera.position.z;

  enemies.forEach((e) => {
    const x = w / 2 + (e.position.x - px) * scale;
    const y = h / 2 + (e.position.z - pz) * scale;
    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // player triangle
  ctx.save();
  ctx.translate(w / 2, h / 2);
  if (!frozen) {
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    ctx.rotate(-euler.y);
  }
  ctx.fillStyle = "#7CFF6B";
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 6);
  ctx.lineTo(-5, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function flashHitMarker() {
  hitMarker.classList.remove("show");
  void hitMarker.offsetWidth;
  hitMarker.classList.add("show");
}

function flashDamageVignette() {
  damageVignette.classList.add("flash");
  setTimeout(() => damageVignette.classList.remove("flash"), 140);
}

function showWaveToast(n) {
  waveToastNum.textContent = n;
  waveToast.classList.remove("hidden", "show");
  void waveToast.offsetWidth;
  waveToast.classList.add("show");
  sfxWave();
}

function spawnEnemyAtEdge() {
  const edge = Math.floor(Math.random() * 4);
  const near = Math.min(ARENA_SIZE - 2, 14 + state.wave * 3);
  const far = ARENA_SIZE - 2;
  const dist = THREE.MathUtils.lerp(near, far, Math.min(1, (state.wave - 1) / 5));
  let x, z;
  switch (edge) {
    case 0: x = (Math.random() - 0.5) * dist * 1.6; z = -dist; break;
    case 1: x = (Math.random() - 0.5) * dist * 1.6; z = dist; break;
    case 2: x = -dist; z = (Math.random() - 0.5) * dist * 1.6; break;
    default: x = dist; z = (Math.random() - 0.5) * dist * 1.6;
  }
  createEnemy(
    THREE.MathUtils.clamp(x, -far, far),
    THREE.MathUtils.clamp(z, -far, far)
  );
  state.enemiesSpawned++;
}

function tryReload() {
  if (state.mag >= MAG_SIZE || state.reserve <= 0) return;
  const need = MAG_SIZE - state.mag;
  const take = Math.min(need, state.reserve);
  state.mag += take;
  state.reserve -= take;
  sfxReload();
  updateHud();
}

function shoot() {
  const now = performance.now() / 1000;
  if (now - lastShot < FIRE_RATE) return;
  if (state.mag <= 0) {
    sfxEmpty();
    tryReload();
    return;
  }
  lastShot = now;
  state.mag--;
  weaponRecoil = 1;
  muzzleFlash = 1;
  shakeAmp = Math.max(shakeAmp, 0.035);
  sfxShoot();
  crosshair.classList.remove("shoot");
  void crosshair.offsetWidth;
  crosshair.classList.add("shoot");
  setTimeout(() => crosshair.classList.remove("shoot"), 80);
  updateHud();

  const mesh = createProjectileMesh();
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const spawnPos = new THREE.Vector3();
  if (activeViewmodel?.userData?.muzzle) {
    activeViewmodel.userData.muzzle.getWorldPosition(spawnPos);
  } else {
    activeViewmodel.getWorldPosition(spawnPos);
    spawnPos.add(forward.clone().multiplyScalar(0.45));
  }
  mesh.position.copy(spawnPos);
  scene.add(mesh);
  projectiles.push({
    mesh,
    velocity: forward.multiplyScalar(PROJECTILE_SPEED),
    life: 2.4,
    trail: [],
    trailTimer: 0,
  });
}

function flashEnemyHit(enemy) {
  enemy.userData.flashUntil = performance.now() / 1000 + 0.12;
  enemy.traverse((child) => {
    if (child.isMesh && child.material?.emissive) {
      child.userData._prevEmissive = child.material.emissive.getHex();
      child.userData._prevIntensity = child.material.emissiveIntensity ?? 0;
      child.material.emissive.setHex(0xfff2c0);
      child.material.emissiveIntensity = 0.85;
    }
  });
}

function clearEnemyFlash(enemy) {
  enemy.traverse((child) => {
    if (child.isMesh && child.material?.emissive && child.userData._prevEmissive != null) {
      child.material.emissive.setHex(child.userData._prevEmissive);
      child.material.emissiveIntensity = child.userData._prevIntensity ?? 0.08;
      delete child.userData._prevEmissive;
      delete child.userData._prevIntensity;
    }
  });
}

function damageEnemy(enemy, hitPoint) {
  enemy.userData.health--;
  const base = enemy.userData.sizeScale ?? 1;
  enemy.scale.setScalar(base * 1.18);
  setTimeout(() => {
    if (enemies.includes(enemy)) enemy.scale.setScalar(base);
  }, 90);
  flashEnemyHit(enemy);
  flashHitMarker();
  shakeAmp = Math.max(shakeAmp, 0.02);
  sfxHit();

  if (enemy.userData.health <= 0) {
    createSplat(hitPoint);
    for (let i = 0; i < 5; i++) {
      const bit = createTrailParticle();
      bit.position.copy(hitPoint);
      bit.position.x += (Math.random() - 0.5) * 0.4;
      bit.position.y += Math.random() * 0.5;
      bit.position.z += (Math.random() - 0.5) * 0.4;
      scene.add(bit);
      fxBits.push({
        mesh: bit,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4),
        life: 0.35 + Math.random() * 0.2,
      });
    }
    scene.remove(enemy);
    enemies = enemies.filter((e) => e !== enemy);
    state.kills++;
    state.score += 100;
    sfxKill();
    updateHud();
  }
}

function hurtPlayer(amount) {
  state.health -= amount;
  state.lastHealth = Math.max(0, state.health);
  flashDamageVignette();
  shakeAmp = Math.max(shakeAmp, 0.09);
  sfxHurt();
  updateHud();
  if (state.health <= 0) {
    state.health = 0;
    endGame();
  }
}

function endGame() {
  playing = false;
  controls.unlock();
  overlay.classList.remove("playing");
  overlay.classList.add("is-gameover");
  pausePanel.classList.add("hidden");
  menu.classList.add("hidden");
  gameOverPanel.classList.remove("hidden");
  clearCombat();
  showBathroomWorld();
  finalScoreEl.textContent = formatScore(state.score);
  finalWaveEl.textContent = state.wave;
  finalKillsEl.textContent = state.kills;
}

function startGame() {
  ensureAudio();
  resetGame();
  showPlayWorld();
  camera.position.set(0, PLAYER_HEIGHT, 0);
  camera.rotation.set(0, 0, 0);
  camera.quaternion.identity();
  playing = true;
  shakeAmp = 0;
  bobPhase = 0;
  overlay.classList.remove("playing");
  overlay.classList.remove("is-gameover");
  menu.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
  pausePanel.classList.add("hidden");
  hud.classList.remove("hidden");
  showWaveToast(1);
  spawnTimer = 0.05;
  // Seed a few enemies in view so the first second matches the mockup beat
  createEnemy(-3, -10);
  createEnemy(2.5, -12);
  createEnemy(0.5, -8);
  state.enemiesSpawned = 3;
  controls.lock();
}

function returnToMenu() {
  playing = false;
  clearCombat();
  resetGame();
  showMenuWorld();
  overlay.classList.remove("playing");
  overlay.classList.remove("is-gameover");
  gameOverPanel.classList.add("hidden");
  pausePanel.classList.add("hidden");
  menu.classList.remove("hidden");
}

function updateViewmodel(dt) {
  if (!activeViewmodel?.visible) return;
  weaponRecoil = THREE.MathUtils.lerp(weaponRecoil, 0, dt * 12);
  muzzleFlash = Math.max(0, muzzleFlash - dt * 8);
  const base = activeViewmodel.userData.basePos || activeViewmodel.position;
  const baseRot = activeViewmodel.userData.baseRot || { x: 0, y: 0, z: 0 };
  const moving = keys["KeyW"] || keys["KeyA"] || keys["KeyS"] || keys["KeyD"];
  if (playing && controls.isLocked && moving) {
    const sprint = keys["ShiftLeft"] || keys["ShiftRight"];
    bobPhase += dt * (sprint ? 14 : 10);
  }
  const bobY = Math.sin(bobPhase) * 0.018;
  const bobX = Math.cos(bobPhase * 0.5) * 0.012;
  activeViewmodel.position.x = base.x + bobX;
  activeViewmodel.position.y = base.y + bobY - weaponRecoil * 0.05;
  activeViewmodel.position.z = base.z + weaponRecoil * 0.14;
  activeViewmodel.rotation.x = baseRot.x - weaponRecoil * 0.4;
  activeViewmodel.rotation.y = baseRot.y;
  activeViewmodel.rotation.z = baseRot.z + weaponRecoil * 0.08;
  if (activeViewmodel.userData.gun) {
    activeViewmodel.userData.gun.rotation.y = -0.55 - weaponRecoil * 0.2;
  }
  if (activeViewmodel.userData.muzzle?.material) {
    activeViewmodel.userData.muzzle.material.opacity = muzzleFlash * 0.95;
    activeViewmodel.userData.muzzle.scale.setScalar(0.7 + muzzleFlash * 1.6);
  }
}

function updatePlayer(dt) {
  const onGround = camera.position.y <= PLAYER_HEIGHT;
  if (!onGround) velocity.y -= GRAVITY * dt;
  else {
    velocity.y = 0;
    camera.position.y = PLAYER_HEIGHT;
  }
  direction.set(0, 0, 0);
  if (keys["KeyW"]) direction.z -= 1;
  if (keys["KeyS"]) direction.z += 1;
  if (keys["KeyA"]) direction.x -= 1;
  if (keys["KeyD"]) direction.x += 1;
  if (direction.lengthSq() > 0) {
    direction.normalize();
    const speed = keys["ShiftLeft"] || keys["ShiftRight"] ? MOVE_SPEED * SPRINT_MULT : MOVE_SPEED;
    controls.moveRight(direction.x * speed * dt);
    controls.moveForward(-direction.z * speed * dt);
  }
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -ARENA_SIZE + 1.5, ARENA_SIZE - 1.5);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -ARENA_SIZE + 1.5, ARENA_SIZE - 1.5);
  camera.position.y += velocity.y * dt;
}

function addTrailParticle(proj) {
  const particle = createTrailParticle();
  particle.position.copy(proj.mesh.position);
  scene.add(particle);
  proj.trail.push({ mesh: particle, life: 0.35 });
  if (proj.trail.length > MAX_TRAIL_PARTS) {
    const old = proj.trail.shift();
    scene.remove(old.mesh);
  }
}

function updateProjectiles(dt) {
  projectiles = projectiles.filter((proj) => {
    proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
    proj.life -= dt;
    proj.trailTimer -= dt;
    if (proj.trailTimer <= 0) {
      addTrailParticle(proj);
      proj.trailTimer = 0.022;
    }
    proj.trail = proj.trail.filter((t) => {
      t.life -= dt;
      t.mesh.material.opacity = Math.max(0, (t.life / 0.35) * 0.65);
      t.mesh.scale.multiplyScalar(1 - dt * 1.5);
      if (t.life <= 0) {
        scene.remove(t.mesh);
        return false;
      }
      return true;
    });
    let hit = false;
    for (const enemy of enemies) {
      if (proj.mesh.position.distanceTo(enemyCenter(enemy)) < enemy.userData.hitRadius) {
        damageEnemy(enemy, proj.mesh.position.clone());
        hit = true;
        break;
      }
    }
    if (hit || proj.life <= 0) {
      scene.remove(proj.mesh);
      proj.trail.forEach((t) => scene.remove(t.mesh));
      return false;
    }
    return true;
  });
}

function updateFxBits(dt) {
  fxBits = fxBits.filter((bit) => {
    bit.velocity.y -= GRAVITY * 0.45 * dt;
    bit.mesh.position.add(bit.velocity.clone().multiplyScalar(dt));
    bit.life -= dt;
    if (bit.mesh.material?.opacity !== undefined) bit.mesh.material.opacity = Math.max(0, bit.life * 2);
    bit.mesh.scale.multiplyScalar(1 - dt * 1.2);
    if (bit.life <= 0) {
      scene.remove(bit.mesh);
      return false;
    }
    return true;
  });
}

function updateEnemies(dt, now) {
  const playerPos = camera.position;
  enemies.forEach((enemy) => {
    enemy.userData.wobble += dt * 4;
    enemy.userData.hopPhase += dt * (enemy.userData.hopSpeed || 8);
    if (enemy.userData.flashUntil && now > enemy.userData.flashUntil) {
      clearEnemyFlash(enemy);
      enemy.userData.flashUntil = 0;
    }
    if (enemy.userData.body) {
      enemy.userData.body.rotation.y = Math.sin(enemy.userData.wobble) * 0.2;
    }
    const hop = Math.abs(Math.sin(enemy.userData.hopPhase)) * (enemy.userData.hopHeight || 0.25);
    enemy.position.y = hop;
    const target = new THREE.Vector3(playerPos.x, enemy.position.y, playerPos.z);
    const toPlayer = target.clone().sub(enemy.position);
    const dist = toPlayer.length();
    if (dist > 1.1) {
      toPlayer.normalize();
      const side = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);
      const weave = Math.sin(enemy.userData.wobble * 0.7) * 0.35;
      enemy.position.x += toPlayer.x * enemy.userData.speed * dt + side.x * weave * dt;
      enemy.position.z += toPlayer.z * enemy.userData.speed * dt + side.z * weave * dt;
    }
    enemy.lookAt(playerPos.x, enemy.position.y + 0.4, playerPos.z);
    const attackRange = 1.7 + (enemy.userData.sizeScale ?? 1) * 0.45;
    if (dist < attackRange) {
      if (now - enemy.userData.lastAttack > ENEMY_ATTACK_COOLDOWN - 0.25 && !enemy.userData.telegraphUntil) {
        enemy.userData.telegraphUntil = now + 0.22;
        enemy.scale.setScalar((enemy.userData.sizeScale ?? 1) * 1.12);
      }
      if (enemy.userData.telegraphUntil && now >= enemy.userData.telegraphUntil) {
        enemy.userData.telegraphUntil = 0;
        enemy.userData.lastAttack = now;
        enemy.scale.setScalar(enemy.userData.sizeScale ?? 1);
        hurtPlayer(ENEMY_DAMAGE);
      }
    } else if (enemy.userData.telegraphUntil) {
      enemy.userData.telegraphUntil = 0;
      enemy.scale.setScalar(enemy.userData.sizeScale ?? 1);
    }
  });
}

function updateSpawns(dt) {
  if (state.enemiesSpawned < state.enemiesToSpawn) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemyAtEdge();
      spawnTimer = Math.max(0.35, 0.7 - state.wave * 0.04);
    }
    return;
  }
  if (enemies.length === 0) {
    if (state.wave >= MAX_WAVES) {
      // Survived all waves — still "flush" celebration via end, or keep going soft
      state.score += 500;
      endGame();
      return;
    }
    state.wave++;
    state.enemiesToSpawn = 4 + state.wave * 2;
    state.enemiesSpawned = 0;
    state.score += state.wave * 50;
    // partial mag refill between waves
    state.reserve = Math.min(START_RESERVE, state.reserve + 24);
    tryReload();
    spawnTimer = 1.1;
    showWaveToast(state.wave);
    updateHud();
  }
}

function updateSplats(dt) {
  splats = splats.filter((splat) => {
    if (splat.userData.permanent) return true;
    splat.userData.life -= dt;
    const fade = Math.max(0, splat.userData.life / 8);
    splat.traverse((child) => {
      if (child.material?.opacity !== undefined) child.material.opacity = fade * 0.92;
    });
    if (splat.userData.life <= 0) {
      scene.remove(splat);
      return false;
    }
    return true;
  });
}

function updateMenuProps(dt) {
  menuWorld?.props?.forEach((obj) => {
    obj.userData.wobble = (obj.userData.wobble || 0) + dt * 2;
    if (obj.userData.bob != null) {
      obj.userData.bob += dt * 1.2;
      obj.position.y = 8.5 + Math.sin(obj.userData.bob) * 0.6;
      obj.position.x += Math.sin(obj.userData.bob * 0.5) * 0.01;
    } else if (obj.userData.body) {
      obj.userData.body.rotation.y = Math.sin(obj.userData.wobble) * 0.15;
      obj.position.y = Math.abs(Math.sin(obj.userData.wobble * 1.5)) * 0.1;
    }
  });
  bathWorld?.props?.forEach((obj) => {
    obj.userData.wobble = (obj.userData.wobble || 0) + dt * 2.2;
    if (obj.userData.body) {
      obj.userData.body.rotation.y = Math.sin(obj.userData.wobble) * 0.12;
      obj.position.y = Math.abs(Math.sin(obj.userData.wobble * 1.8)) * 0.08;
    }
  });
}

let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (playing && controls.isLocked) {
    updatePlayer(dt);
    updateViewmodel(dt);
    updateProjectiles(dt);
    updateFxBits(dt);
    updateEnemies(dt, now / 1000);
    updateSpawns(dt);
    updateSplats(dt);
    if (Math.floor(now / 100) % 2 === 0) drawMinimap(minimapCanvas, false);
  } else {
    updateViewmodel(dt);
    updateMenuProps(dt);
  }

  if (shakeAmp > 0.0005 && playing) {
    const sx = (Math.random() - 0.5) * shakeAmp;
    const sy = (Math.random() - 0.5) * shakeAmp;
    camera.position.x += sx;
    camera.position.y += sy;
    shakeAmp = THREE.MathUtils.lerp(shakeAmp, 0, dt * 8);
    renderer.render(scene, camera);
    camera.position.x -= sx;
    camera.position.y -= sy;
  } else {
    shakeAmp = 0;
    renderer.render(scene, camera);
  }
}

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyR" && playing && controls.isLocked) tryReload();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
window.addEventListener("mousedown", (e) => {
  if (playing && controls.isLocked && e.button === 0) shoot();
});
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

startBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  ensureAudio();
  startGame();
});
restartBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  ensureAudio();
  startGame();
});
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  returnToMenu();
});
overlay.addEventListener("click", () => {
  if (playing && !controls.isLocked && state.health > 0) {
    pausePanel.classList.add("hidden");
    controls.lock();
  }
});

initScene();
animate();

window.__poopFpsForceGameOver = () => {
  if (!playing) {
    showPlayWorld();
    playing = true;
  }
  state.score = Math.max(state.score, 1240);
  state.wave = Math.max(state.wave, 4);
  state.kills = Math.max(state.kills, 18);
  state.lastHealth = 35;
  state.health = 35;
  state.mag = 12;
  state.reserve = 96;
  updateHud();
  state.health = 0;
  endGame();
};
