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
  createAmmoPickup,
  createEnemyPoop,
  createHeldGatling,
  createHeldGun,
  createHeldShotgun,
  createPlayerPoop,
  createProjectileMesh,
  createRifleViewmodel,
  createTrailParticle,
  createViewmodelGatling,
  createViewmodelGun,
  createViewmodelShotgun,
} from "./poop-models.js";
import {
  buildPowerUpPool,
  createDefaultMods,
  rollOffer,
} from "./powerups.js";
import {
  LOADOUT_EXTRAS,
  WEAPON_IDS,
  WEAPONS,
  createLoadoutState,
  weaponLabel,
} from "./weapons.js";

const canvas = document.getElementById("game-canvas");
const overlay = document.getElementById("overlay");
const menu = document.getElementById("menu");
const gameOverPanel = document.getElementById("game-over");
const pausePanel = document.getElementById("paused");
const pauseResumeBtn = document.getElementById("pause-resume-btn");
const pauseMenuBtn = document.getElementById("pause-menu-btn");
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
const ammoPanel = document.getElementById("ammo-panel");
const weaponLabelEl = document.getElementById("weapon-label");
const reloadBar = document.getElementById("reload-bar");
const reloadFill = document.getElementById("reload-fill");
const reloadLabel = document.getElementById("reload-label");
const pickupToast = document.getElementById("pickup-toast");
const rewardOverlay = document.getElementById("reward-overlay");
const rewardCards = document.getElementById("reward-cards");
const rewardConfirm = document.getElementById("reward-confirm");
const loadoutPanel = document.getElementById("loadout");
const loadoutBtn = document.getElementById("loadout-btn");
const loadoutBack = document.getElementById("loadout-back");
const loadoutConfirm = document.getElementById("loadout-confirm");
const loadoutStart = document.getElementById("loadout-start");
const loadoutGuns = document.getElementById("loadout-guns");
const loadoutExtras = document.getElementById("loadout-extras");
const loadoutSummary = document.getElementById("loadout-summary");
const godBadge = document.getElementById("god-badge");
const devPanel = document.getElementById("dev-panel");
const devMenuBtn = document.getElementById("dev-menu-btn");

/** DEV cheats only on file://, ?dev=1, or #dev — hidden on public Pages. */
const devAllowed = (() => {
  try {
    if (location.protocol === "file:") return true;
    if (new URLSearchParams(location.search).get("dev") === "1") return true;
    const hash = (location.hash || "").replace(/^#/, "").toLowerCase();
    if (hash === "dev" || hash.startsWith("dev=")) return true;
    return false;
  } catch {
    return false;
  }
})();
const minimapCanvas = document.getElementById("minimap");
const goMinimapCanvas = document.getElementById("go-minimap");
const goWaveText = document.getElementById("go-wave-text");
const goHealthFill = document.getElementById("go-health-fill");
const goHealthText = document.getElementById("go-health-text");
const goAmmoText = document.getElementById("go-ammo-text");

const POWER_POOL = buildPowerUpPool();
let mods = createDefaultMods();
let rewarding = false;
let rewardOffer = [];
let pendingWaveAdvance = null;
let demoHold = false;
let loadoutOpen = false;
let loadoutFocus = { section: "gun", index: 0 };
const loadout = createLoadoutState();
let ownedWeapons = new Set(["rifle"]);
let activeWeaponId = "rifle";
const weaponMags = { rifle: 12, shotgun: 6, gatling: 60 };
let gatlingSpin = 0;
let shootHeld = false;
let devOpen = false;
let cheatGod = false;
let cheatInfiniteAmmo = false;

const ARENA_SIZE = 40;
const PLAYER_HEIGHT = 1.15;
const EYE_HEIGHT = 1.45;
const GRAVITY = 25;
const MOVE_SPEED = 8.5;
const SPRINT_MULT = 1.65;
const JUMP_VELOCITY = 7.4;
const JUMP_CUT_MULT = 0.42;
const COYOTE_TIME = 0.11;
const ADS_FOV_MULT = 0.72;
const ADS_LOOK_MULT = 0.78;
const GROUND_Y = 0;
const FIRE_RATE = 0.14;
const PROJECTILE_SPEED = 34;
const ENEMY_SPEED = 3.6;
const ENEMY_DAMAGE = 12;
const ENEMY_ATTACK_COOLDOWN = 1.05;
const MAX_TRAIL_PARTS = 10;
const MAX_WAVES = 10;
const MAG_SIZE = 12;
const START_RESERVE = 96;
const RELOAD_TIME = 1.05;
const AMMO_PICKUP_AMOUNT = 18;
const MAX_RESERVE = 120;
const LOOK_SENS = 0.0022;
const PAD_LOOK_SENS = 2.4;
const DEADZONE = 0.18;

const CAMERA_MODES = [
  {
    id: "ots",
    // Close over-the-shoulder (default)
    offset: new THREE.Vector3(0.85, 1.7, 3.0),
    lookHeight: 1.15,
    fov: 66,
    showBody: true,
    showHeld: true,
    showVM: false,
  },
  {
    id: "third",
    offset: new THREE.Vector3(1.0, 2.25, 4.4),
    lookHeight: 1.05,
    fov: 62,
    showBody: true,
    showHeld: true,
    showVM: false,
  },
  {
    id: "fps",
    offset: new THREE.Vector3(0, EYE_HEIGHT, 0.05),
    lookHeight: EYE_HEIGHT,
    fov: 75,
    showBody: false,
    showHeld: false,
    showVM: true,
  },
];

const keys = {};
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();

let scene, camera, renderer, controls;
let swirlGun, rifleGun, activeViewmodel;
let heldGunModels = {};
let viewmodelGuns = {};
let playerRoot, playerBody, heldGun;
let projectiles = [];
let fxBits = [];
let enemies = [];
let splats = [];
let ammoPickups = [];
let playing = false;
let pointerLocked = false;
let lastShot = 0;
let lastEmptyClick = 0;
let spawnTimer = 0;
let enemyIdCounter = 0;
let weaponRecoil = 0;
let muzzleFlash = 0;
let shakeAmp = 0;
let bobPhase = 0;
let reloading = false;
let reloadTimer = 0;
let heldGunBase = { x: 0.42, z: -0.35, y: 0.85 };
let audioCtx = null;
let musicMuted = false;
let musicTimer = null;
let musicStep = 0;
let mode = "menu"; // menu | play | gameover
let lookYaw = 0;
let lookPitch = 0;
let cameraModeIndex = 0;
let padPrev = {};
let gamePaused = false;
let adsHeld = false;
let verticalVelocity = 0;
let coyoteTimer = 0;
let jumpHeld = false;

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

function playTone({ freq = 220, dur = 0.08, type = "square", gain = 0.05, slide = 0, when = 0 }) {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const t0 = when || ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + Math.max(0.02, dur));
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Original tropical chiptune loop (NOT Nintendo / SM64) — C major pentatonic
const MUSIC_MELODY = [
  523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0,
  392.0, 523.25, 587.33, 659.25, 587.33, 523.25, 392.0, 0,
  659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 392.0,
  523.25, 0, 587.33, 659.25, 783.99, 659.25, 523.25, 0,
];
const MUSIC_BASS = [
  130.81, 0, 130.81, 0, 146.83, 0, 146.83, 0,
  164.81, 0, 164.81, 0, 196.0, 0, 174.61, 0,
  130.81, 0, 130.81, 0, 146.83, 0, 146.83, 0,
  196.0, 0, 174.61, 0, 164.81, 0, 130.81, 0,
];

function musicTick() {
  if (musicMuted || !audioCtx) return;
  const step = musicStep % 32;
  const mel = MUSIC_MELODY[step];
  const bass = MUSIC_BASS[step];
  if (mel) playTone({ freq: mel, dur: 0.14, type: "triangle", gain: 0.028 });
  if (bass) playTone({ freq: bass, dur: 0.18, type: "square", gain: 0.018 });
  // Percussion: kick on 0/8/16/24, hat on odds
  if (step % 8 === 0) playTone({ freq: 90, dur: 0.06, type: "sine", gain: 0.04, slide: -50 });
  if (step % 2 === 1) playTone({ freq: 1200, dur: 0.025, type: "square", gain: 0.008 });
  musicStep++;
}

function startMusic() {
  ensureAudio();
  if (musicTimer) return;
  musicStep = 0;
  musicTimer = setInterval(musicTick, 160);
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

function toggleMusic() {
  musicMuted = !musicMuted;
  if (!musicMuted) startMusic();
}

const sfxEmpty = () => playTone({ freq: 70, dur: 0.05, type: "square", gain: 0.035, slide: -15 });
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
const sfxReload = () => {
  playTone({ freq: 180, dur: 0.08, type: "triangle", gain: 0.04, slide: 40 });
  playTone({ freq: 140, dur: 0.12, type: "square", gain: 0.03, slide: -30 });
};
const sfxReloadDone = () => {
  playTone({ freq: 320, dur: 0.07, type: "triangle", gain: 0.045, slide: 100 });
  playTone({ freq: 520, dur: 0.05, type: "square", gain: 0.025 });
};
const sfxAmmoPickup = () => {
  playTone({ freq: 440, dur: 0.07, type: "triangle", gain: 0.045, slide: 120 });
  playTone({ freq: 660, dur: 0.1, type: "sine", gain: 0.03, slide: 80 });
};
const sfxPowerUp = () => {
  playTone({ freq: 330, dur: 0.08, type: "triangle", gain: 0.045, slide: 100 });
  playTone({ freq: 494, dur: 0.1, type: "triangle", gain: 0.04, slide: 140 });
  playTone({ freq: 660, dur: 0.12, type: "sine", gain: 0.03 });
};
const sfxWeaponSwap = () => playTone({ freq: 280, dur: 0.06, type: "triangle", gain: 0.04, slide: 90 });

function sfxShootFor(weaponId) {
  if (weaponId === "shotgun") {
    playTone({ freq: 90, dur: 0.12, type: "sawtooth", gain: 0.07, slide: -70 });
    playTone({ freq: 180, dur: 0.08, type: "square", gain: 0.04, slide: -120 });
    playTone({ freq: 55, dur: 0.14, type: "triangle", gain: 0.05, slide: -20 });
    return;
  }
  if (weaponId === "gatling") {
    playTone({ freq: 240, dur: 0.035, type: "square", gain: 0.03, slide: -80 });
    playTone({ freq: 520, dur: 0.025, type: "triangle", gain: 0.018, slide: -160 });
    return;
  }
  playTone({ freq: 160, dur: 0.07, type: "triangle", gain: 0.06, slide: -90 });
  playTone({ freq: 420, dur: 0.04, type: "square", gain: 0.025, slide: -200 });
}

function activeWeapon() {
  return WEAPONS[activeWeaponId] || WEAPONS.rifle;
}

function syncMagFromState() {
  weaponMags[activeWeaponId] = state.mag;
}

function loadMagIntoState() {
  state.mag = weaponMags[activeWeaponId] ?? activeWeapon().magSize;
}

function magCapacity() {
  return activeWeapon().magSize + Math.max(0, mods.magBonus | 0);
}

function maxHealth() {
  return 100 + Math.max(0, mods.maxHpBonus | 0);
}

function reloadDuration() {
  return activeWeapon().reloadTime / Math.max(0.35, mods.reloadSpeed);
}

function fireInterval() {
  return activeWeapon().fireRate / Math.max(0.35, mods.fireRate);
}

function updateLoadoutSummary() {
  if (!loadoutSummary) return;
  const gun = WEAPONS[loadout.startWeapon]?.name || "Rifle";
  const extra = LOADOUT_EXTRAS.find((e) => e.id === loadout.startExtra)?.name || "None";
  loadoutSummary.textContent = `Start: ${gun} · Extra: ${extra}`;
}

function showPickupToast(text, sticky = false) {
  if (!pickupToast) return;
  pickupToast.textContent = text;
  pickupToast.classList.remove("hidden", "show");
  pickupToast.style.animation = "";
  pickupToast.style.opacity = "";
  void pickupToast.offsetWidth;
  pickupToast.classList.add("show");
  clearTimeout(showPickupToast._t);
  if (sticky) {
    pickupToast.style.animation = "none";
    pickupToast.style.opacity = "1";
    pickupToast.style.transform = "translateX(-50%) translateY(0)";
    return;
  }
  showPickupToast._t = setTimeout(() => {
    pickupToast.classList.remove("show");
    pickupToast.classList.add("hidden");
  }, 1400);
}

function formatScore(n) {
  return n.toLocaleString("en-US");
}

function enemyCenter(enemy) {
  const h = enemy.userData.height ?? 1;
  return enemy.position.clone().add(new THREE.Vector3(0, h * 0.5, 0));
}

function currentCamMode() {
  return CAMERA_MODES[cameraModeIndex];
}

function adsActive() {
  return adsHeld && playing && mode === "play" && pointerLocked && !gamePaused && !rewarding && !devOpen;
}

function lookSensMult() {
  return adsActive() ? ADS_LOOK_MULT : 1;
}

function effectiveFov() {
  const base = currentCamMode().fov;
  return adsActive() ? base * ADS_FOV_MULT : base;
}

function updateAdsZoom() {
  if (!camera) return;
  const target = effectiveFov();
  if (Math.abs(camera.fov - target) > 0.05) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, target, 0.22);
    camera.updateProjectionMatrix();
  } else if (camera.fov !== target) {
    camera.fov = target;
    camera.updateProjectionMatrix();
  }
}

function isGrounded() {
  return playerRoot && playerRoot.position.y <= GROUND_Y + 0.001 && verticalVelocity <= 0;
}

function tryJump() {
  if (!playing || !pointerLocked || gamePaused || rewarding || devOpen || loadoutOpen) return;
  if (coyoteTimer > 0 || isGrounded()) {
    verticalVelocity = JUMP_VELOCITY;
    coyoteTimer = 0;
    jumpHeld = true;
  }
}

function releaseJump() {
  if (jumpHeld && verticalVelocity > 0) verticalVelocity *= JUMP_CUT_MULT;
  jumpHeld = false;
}

function setPaused(paused) {
  if (!playing || mode !== "play" || rewarding || devOpen || loadoutOpen) return;
  if (paused === gamePaused) return;
  gamePaused = paused;
  shootHeld = false;
  keys._mouseDown = false;
  adsHeld = false;
  if (paused) {
    pausePanel?.classList.remove("hidden");
    overlay?.classList.remove("playing");
    overlay?.classList.add("is-paused");
    if (pointerLocked) {
      try { controls.unlock(); } catch (_) { /* ignore */ }
    }
    playTone({ freq: 300, dur: 0.05, type: "triangle", gain: 0.03 });
  } else {
    pausePanel?.classList.add("hidden");
    overlay?.classList.remove("is-paused");
    if (state.health > 0) controls.lock();
    playTone({ freq: 420, dur: 0.05, type: "triangle", gain: 0.03 });
  }
}

function togglePause() {
  if (!playing || mode !== "play" || rewarding || devOpen || loadoutOpen) return;
  setPaused(!gamePaused);
}

function resumeFromPause() {
  if (!gamePaused) return;
  setPaused(false);
}

function applyCameraModeVisuals() {
  const m = currentCamMode();
  if (playerBody) playerBody.visible = mode === "play" && m.showBody;
  if (heldGun) heldGun.visible = mode === "play" && m.showHeld;
  Object.values(heldGunModels).forEach((g) => {
    if (g && g !== heldGun) g.visible = false;
  });
  Object.values(viewmodelGuns).forEach((g) => {
    if (g) g.visible = false;
  });
  if (mode === "play" && m.showVM) {
    activeViewmodel = viewmodelGuns[activeWeaponId] || swirlGun;
    if (activeViewmodel) activeViewmodel.visible = true;
  } else if (mode === "gameover") {
    activeViewmodel = rifleGun;
    if (rifleGun) rifleGun.visible = true;
  } else {
    activeViewmodel = null;
  }
  if (swirlGun && swirlGun !== activeViewmodel) swirlGun.visible = false;
  if (rifleGun && mode !== "gameover") rifleGun.visible = false;
  camera.fov = effectiveFov();
  camera.updateProjectionMatrix();
}

function cycleCameraMode() {
  if (mode !== "play" || !playing) return;
  cameraModeIndex = (cameraModeIndex + 1) % CAMERA_MODES.length;
  applyCameraModeVisuals();
  playTone({ freq: 320 + cameraModeIndex * 40, dur: 0.06, type: "triangle", gain: 0.035 });
}

function setViewmodel(kind) {
  if (kind === "rifle") {
    Object.values(viewmodelGuns).forEach((g) => { if (g) g.visible = false; });
    if (swirlGun) swirlGun.visible = false;
    rifleGun.visible = true;
    activeViewmodel = rifleGun;
    if (playerRoot) playerRoot.visible = false;
  } else if (kind === "swirl") {
    rifleGun.visible = false;
    if (playerRoot) playerRoot.visible = true;
    applyCameraModeVisuals();
  } else {
    Object.values(viewmodelGuns).forEach((g) => { if (g) g.visible = false; });
    if (swirlGun) swirlGun.visible = false;
    rifleGun.visible = false;
    if (playerRoot) playerRoot.visible = false;
  }
}

function equipWeapon(id, { announce = true, refill = false } = {}) {
  if (!WEAPONS[id]) return;
  const already = ownedWeapons.has(id);
  ownedWeapons.add(id);
  syncMagFromState();
  cancelReload(false);
  activeWeaponId = id;
  if (refill || !already) {
    weaponMags[id] = WEAPONS[id].magSize + Math.max(0, mods.magBonus | 0);
  }
  loadMagIntoState();
  gatlingSpin = 0;

  // Swap held model
  Object.values(heldGunModels).forEach((g) => {
    if (g) g.visible = false;
  });
  heldGun = heldGunModels[id] || heldGunModels.rifle;
  if (heldGun) {
    heldGun.visible = mode === "play" && currentCamMode().showHeld;
    heldGun.position.set(heldGunBase.x, heldGunBase.y, heldGunBase.z);
    heldGun.rotation.set(0.05, 0.08, 0.12);
  }
  applyCameraModeVisuals();
  sfxWeaponSwap();
  if (announce) showPickupToast(already && !refill ? `${WEAPONS[id].name} READY` : `EQUIPPED ${WEAPONS[id].name}`);
  updateHud();
}

function cycleOwnedWeapon(dir = 1) {
  const list = WEAPON_IDS.filter((id) => ownedWeapons.has(id));
  if (list.length < 2) return;
  const idx = list.indexOf(activeWeaponId);
  const next = list[(idx + dir + list.length) % list.length];
  equipWeapon(next, { announce: true });
}

function getPlayerPos() {
  return playerRoot ? playerRoot.position : camera.position;
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
  if (playerRoot) playerRoot.visible = false;
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
  if (playerRoot) playerRoot.visible = true;
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
  if (playerRoot) playerRoot.visible = false;
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
  camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2, 4);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  configureMockupRenderer(renderer);

  // Player avatar + held guns in world space
  playerRoot = new THREE.Group();
  playerRoot.visible = false;
  playerBody = createPlayerPoop(1.05);
  playerRoot.add(playerBody);

  heldGunModels = {
    rifle: createHeldGun(),
    shotgun: createHeldShotgun(),
    gatling: createHeldGatling(),
  };
  Object.values(heldGunModels).forEach((g) => {
    g.position.set(heldGunBase.x, heldGunBase.y, heldGunBase.z);
    g.rotation.set(0.05, 0.08, 0.12);
    g.visible = false;
    playerRoot.add(g);
  });
  heldGun = heldGunModels.rifle;
  heldGun.visible = false;
  scene.add(playerRoot);

  // FP viewmodels + game-over rifle stay parented to camera
  viewmodelGuns = {
    rifle: createViewmodelGun(),
    shotgun: createViewmodelShotgun(),
    gatling: createViewmodelGatling(),
  };
  swirlGun = viewmodelGuns.rifle;
  rifleGun = createRifleViewmodel();
  Object.values(viewmodelGuns).forEach((g) => {
    g.visible = false;
    camera.add(g);
  });
  rifleGun.visible = false;
  camera.add(rifleGun);
  scene.add(camera);
  activeViewmodel = swirlGun;

  // Pointer lock only for look/capture — movement is custom
  controls = new PointerLockControls(camera, document.body);
  controls.addEventListener("lock", () => {
    pointerLocked = true;
    if (playing) {
      gamePaused = false;
      pausePanel?.classList.add("hidden");
      overlay?.classList.remove("is-paused");
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
    pointerLocked = false;
    document.body.classList.remove("is-playing");
    if (playing && state.health > 0 && !rewarding && !devOpen) {
      if (!gamePaused) {
        gamePaused = true;
        pausePanel?.classList.remove("hidden");
        overlay?.classList.remove("playing");
        overlay?.classList.add("is-paused");
        shootHeld = false;
        keys._mouseDown = false;
        adsHeld = false;
      }
    }
  });

  document.addEventListener("mousemove", onMouseLook);

  showMenuWorld();
}

function onMouseLook(e) {
  if (!playing || !pointerLocked || mode !== "play" || rewarding || devOpen || gamePaused) return;
  const sens = LOOK_SENS * lookSensMult();
  lookYaw -= e.movementX * sens;
  lookPitch -= e.movementY * sens;
  lookPitch = THREE.MathUtils.clamp(lookPitch, -0.85, 0.75);
}

function clearCombat() {
  projectiles.forEach((p) => {
    scene.remove(p.mesh);
    p.trail.forEach((t) => scene.remove(t.mesh));
  });
  fxBits.forEach((b) => scene.remove(b.mesh));
  enemies.forEach((e) => scene.remove(e));
  ammoPickups.forEach((p) => scene.remove(p.mesh));
  splats.forEach((s) => {
    if (!s.userData.permanent) scene.remove(s);
  });
  projectiles = [];
  fxBits = [];
  enemies = [];
  ammoPickups = [];
  splats = splats.filter((s) => s.userData.permanent);
  weaponRecoil = 0;
  muzzleFlash = 0;
  shakeAmp = 0;
  cancelReload(false);
}

function cancelReload(playSound = false) {
  reloading = false;
  reloadTimer = 0;
  if (reloadBar) reloadBar.classList.add("hidden");
  if (reloadLabel) reloadLabel.classList.add("hidden");
  if (reloadFill) reloadFill.style.width = "0%";
  ammoPanel?.classList.remove("reloading");
  if (playSound) sfxEmpty();
}

function resetGame() {
  clearCombat();
  hideRewardUI(false);
  mods = createDefaultMods();
  demoHold = false;
  gatlingSpin = 0;
  shootHeld = false;
  gamePaused = false;
  adsHeld = false;
  verticalVelocity = 0;
  coyoteTimer = 0;
  jumpHeld = false;

  // Apply loadout
  ownedWeapons = new Set([loadout.startWeapon || "rifle"]);
  activeWeaponId = loadout.startWeapon || "rifle";
  WEAPON_IDS.forEach((id) => {
    weaponMags[id] = WEAPONS[id].magSize;
  });

  const ctx = { mods, reserveBonus: 0 };
  const extra = LOADOUT_EXTRAS.find((e) => e.id === loadout.startExtra);
  extra?.apply?.(ctx);

  state.health = 100 + Math.max(0, mods.maxHpBonus | 0);
  state.score = 0;
  state.kills = 0;
  state.wave = 1;
  state.enemiesToSpawn = 5;
  state.enemiesSpawned = 0;
  state.reserve = START_RESERVE + (ctx.reserveBonus || 0);
  state.reserve = Math.min(MAX_RESERVE + 40, state.reserve);
  state.lastHealth = state.health;
  weaponMags[activeWeaponId] = WEAPONS[activeWeaponId].magSize + Math.max(0, mods.magBonus | 0);
  state.mag = weaponMags[activeWeaponId];
  spawnTimer = 0;
  pendingWaveAdvance = null;
  velocity.set(0, 0, 0);
  lookYaw = 0;
  lookPitch = 0;
  cameraModeIndex = 0;
  if (playerRoot) {
    playerRoot.position.set(0, 0, 0);
    playerRoot.rotation.set(0, 0, 0);
  }
  equipWeapon(activeWeaponId, { announce: false, refill: true });
  updateHud();
  updateLoadoutSummary();
}

function updateHud() {
  scoreEl.textContent = formatScore(state.score);
  waveEl.textContent = state.wave;
  killsEl.textContent = state.kills;
  const hpPct = (state.health / maxHealth()) * 100;
  healthFill.style.width = `${Math.max(0, hpPct)}%`;
  healthText.textContent = Math.max(0, Math.ceil(state.health));
  healthFill.style.background =
    hpPct > 50
      ? "linear-gradient(180deg, #e2ff78, #8fd63a 48%, #5aa81a)"
      : hpPct > 25
        ? "linear-gradient(180deg, #f0d060, #d4a017 55%, #b8860b)"
        : "linear-gradient(180deg, #ff6b6b, #c62828 55%, #8b0000)";
  ammoText.textContent = `${state.mag}/${state.reserve}`;
  if (weaponLabelEl) weaponLabelEl.textContent = weaponLabel(activeWeaponId);
  if (ammoPanel) {
    ammoPanel.classList.toggle("empty-mag", state.mag <= 0 && !reloading);
    ammoPanel.classList.toggle("reloading", reloading);
  }
  if (reloading) {
    const dur = reloadDuration();
    const pct = Math.min(100, ((dur - reloadTimer) / dur) * 100);
    reloadBar?.classList.remove("hidden");
    reloadLabel?.classList.remove("hidden");
    if (reloadFill) reloadFill.style.width = `${pct}%`;
  } else {
    reloadBar?.classList.add("hidden");
    reloadLabel?.classList.add("hidden");
    if (reloadFill) reloadFill.style.width = "0%";
  }
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
  const pos = getPlayerPos();
  const px = frozen ? 0 : pos.x;
  const pz = frozen ? 2 : pos.z;

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
  if (!frozen) ctx.rotate(-lookYaw);
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
  if (rewarding || reloading || devOpen || gamePaused) return;
  if (cheatInfiniteAmmo) {
    state.mag = magCapacity();
    state.reserve = Math.max(state.reserve, MAX_RESERVE);
    syncMagFromState();
    updateHud();
    return;
  }
  if (state.mag >= magCapacity() || state.reserve <= 0) {
    if (state.reserve <= 0 && state.mag <= 0) {
      const now = performance.now() / 1000;
      if (now - lastEmptyClick > 0.25) {
        lastEmptyClick = now;
        sfxEmpty();
      }
    }
    return;
  }
  reloading = true;
  reloadTimer = reloadDuration();
  sfxReload();
  weaponRecoil = Math.max(weaponRecoil, 0.35);
  updateHud();
}

function updateReload(dt) {
  if (!reloading) return;
  reloadTimer -= dt;
  updateHud();
  // Animate held gun dip during reload
  if (heldGun && heldGun.visible) {
    const t = 1 - Math.max(0, reloadTimer) / reloadDuration();
    heldGun.rotation.x = 0.05 + Math.sin(t * Math.PI) * 0.55;
    heldGun.position.y = heldGunBase.y - Math.sin(t * Math.PI) * 0.12;
  }
  if (reloadTimer > 0) return;
  const need = magCapacity() - state.mag;
  const take = Math.min(need, state.reserve);
  state.mag += take;
  state.reserve -= take;
  syncMagFromState();
  reloading = false;
  reloadTimer = 0;
  if (heldGun) {
    heldGun.rotation.x = 0.05;
    heldGun.position.y = heldGunBase.y;
  }
  sfxReloadDone();
  updateHud();
}

function spawnAmmoPickup(pos, amount = AMMO_PICKUP_AMOUNT) {
  if (!scene) return;
  const mesh = createAmmoPickup(amount);
  mesh.position.set(pos.x, 0, pos.z);
  scene.add(mesh);
  ammoPickups.push({
    mesh,
    amount,
    bob: Math.random() * Math.PI * 2,
    life: 45,
  });
}

function updateAmmoPickups(dt) {
  const playerPos = getPlayerPos();
  const magnet = mods.magnetRange || 0;
  ammoPickups = ammoPickups.filter((p) => {
    p.bob += dt * 2.4;
    p.life -= dt;
    p.mesh.position.y = 0.15 + Math.sin(p.bob) * 0.12;
    p.mesh.rotation.y += dt * 1.4;
    if (p.mesh.userData.glow?.material) {
      p.mesh.userData.glow.material.opacity = 0.28 + Math.sin(p.bob * 2) * 0.12;
    }
    if (p.mesh.userData.crate?.material) {
      p.mesh.userData.crate.material.emissiveIntensity = 0.45 + Math.sin(p.bob * 3) * 0.2;
    }

    let dx = playerPos.x - p.mesh.position.x;
    let dz = playerPos.z - p.mesh.position.z;
    let dist = Math.hypot(dx, dz);
    if (magnet > 0 && dist < magnet && dist > 0.05) {
      const pull = Math.min(14, 4 + magnet) * dt;
      p.mesh.position.x += (dx / dist) * pull;
      p.mesh.position.z += (dz / dist) * pull;
      dx = playerPos.x - p.mesh.position.x;
      dz = playerPos.z - p.mesh.position.z;
      dist = Math.hypot(dx, dz);
    }

    if (dist < 1.35) {
      const gained = Math.max(1, Math.round(p.amount * mods.pickupMult));
      const room = MAX_RESERVE - state.reserve;
      const add = Math.min(room, gained);
      if (add > 0) {
        state.reserve += add;
        sfxAmmoPickup();
        showPickupToast(`+${add} AMMO`);
        updateHud();
      } else {
        showPickupToast("RESERVE FULL");
      }
      scene.remove(p.mesh);
      return false;
    }
    if (p.life <= 0) {
      scene.remove(p.mesh);
      return false;
    }
    return true;
  });
}

function fireOneProjectile(spreadYaw = 0, spreadPitch = 0, opts = {}) {
  const wpn = activeWeapon();
  const mesh = createProjectileMesh();
  const scale = mods.bulletScale * (opts.bulletScale || wpn.bulletScale || 1);
  mesh.scale.setScalar(scale);

  const forward = new THREE.Vector3(
    -Math.sin(lookYaw + spreadYaw),
    Math.sin(lookPitch + spreadPitch),
    -Math.cos(lookYaw + spreadYaw),
  );
  forward.normalize();

  const spawnPos = new THREE.Vector3();
  const cam = currentCamMode();
  const vm = viewmodelGuns[activeWeaponId];
  if (cam.showVM && vm?.userData?.muzzle) {
    vm.userData.muzzle.getWorldPosition(spawnPos);
  } else if (heldGun?.userData?.muzzle) {
    heldGun.userData.muzzle.getWorldPosition(spawnPos);
  } else {
    spawnPos.copy(getPlayerPos());
    spawnPos.y += EYE_HEIGHT;
    spawnPos.add(forward.clone().multiplyScalar(0.8));
  }
  mesh.position.copy(spawnPos);
  scene.add(mesh);
  const speed = (opts.speed || wpn.projectileSpeed) * mods.bulletSpeed;
  const life = opts.life || wpn.projectileLife;
  projectiles.push({
    mesh,
    velocity: forward.multiplyScalar(speed),
    life,
    trail: [],
    trailTimer: 0,
    bounceLeft: mods.bounce | 0,
    pierceLeft: mods.pierce | 0,
    hitIds: new Set(),
    radius: 0.22 * scale,
    damage: (opts.damage || wpn.damage || 1),
  });
}

function shoot() {
  if (rewarding || loadoutOpen || devOpen || gamePaused) return;
  const now = performance.now() / 1000;
  if (reloading && !cheatInfiniteAmmo) return;
  if (cheatInfiniteAmmo && reloading) cancelReload(false);
  const wpn = activeWeapon();

  // Gatling wind-up: must be held long enough
  if (wpn.windup > 0) {
    if (gatlingSpin < wpn.windup) return;
  }

  if (now - lastShot < fireInterval()) return;
  if (!cheatInfiniteAmmo && state.mag <= 0) {
    if (now - lastEmptyClick > 0.22) {
      lastEmptyClick = now;
      sfxEmpty();
      shakeAmp = Math.max(shakeAmp, 0.012);
    }
    if (state.reserve > 0) tryReload();
    return;
  }
  lastShot = now;
  if (cheatInfiniteAmmo) {
    state.mag = magCapacity();
    state.reserve = Math.max(state.reserve, MAX_RESERVE);
  } else {
    state.mag -= wpn.ammoPerShot || 1;
    if (state.mag < 0) state.mag = 0;
  }
  syncMagFromState();
  weaponRecoil = wpn.recoil || 1;
  muzzleFlash = 1;
  shakeAmp = Math.max(shakeAmp, wpn.shake || 0.04);
  sfxShootFor(wpn.id);
  crosshair.classList.remove("shoot");
  void crosshair.offsetWidth;
  crosshair.classList.add("shoot");
  setTimeout(() => crosshair.classList.remove("shoot"), 80);
  updateHud();

  const spreadBase = wpn.spread * mods.spreadMult;
  const pellets = wpn.pellets || 1;
  const extras = mods.extraProjectiles | 0;
  for (let i = 0; i < pellets; i++) {
    const yaw = (Math.random() - 0.5) * spreadBase * 2;
    const pitch = (Math.random() - 0.5) * spreadBase;
    fireOneProjectile(yaw, pitch);
  }
  for (let i = 0; i < extras; i++) {
    const yaw = (Math.random() - 0.5) * (0.12 + spreadBase * 4);
    const pitch = (Math.random() - 0.5) * 0.06;
    fireOneProjectile(yaw, pitch);
  }
  if (Math.random() < mods.echoChance && wpn.id === "rifle") {
    setTimeout(() => {
      if (!playing || rewarding || reloading || (!cheatInfiniteAmmo && state.mag <= 0)) return;
      if (!cheatInfiniteAmmo) {
        state.mag--;
        syncMagFromState();
      }
      updateHud();
      fireOneProjectile((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.02);
      weaponRecoil = 0.7;
      muzzleFlash = 0.8;
      sfxShootFor("rifle");
    }, 55);
  }

  if (!cheatInfiniteAmmo && state.mag <= 0 && state.reserve > 0) {
    setTimeout(() => {
      if (playing && !rewarding && state.mag <= 0 && state.reserve > 0 && !reloading) tryReload();
    }, 180);
  }
}

function updateWeaponSpin(dt) {
  const wpn = activeWeapon();
  if (wpn.windup > 0 && shootHeld && !reloading && playing && pointerLocked && !rewarding) {
    gatlingSpin = Math.min(wpn.windup + 0.2, gatlingSpin + dt);
  } else {
    gatlingSpin = Math.max(0, gatlingSpin - dt * 1.6);
  }
  const spinRate = gatlingSpin > 0.05 ? 18 + gatlingSpin * 40 : 0;
  const bg = heldGun?.userData?.barrelGroup;
  if (bg) bg.rotation.z += spinRate * dt;
  const vbg = viewmodelGuns.gatling?.userData?.barrelGroup;
  if (vbg && viewmodelGuns.gatling?.visible) vbg.rotation.z += spinRate * dt;
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

function damageEnemy(enemy, hitPoint, dmg = 1) {
  const crit = Math.random() < mods.critChance;
  const dealt = Math.max(1, Math.round(dmg * mods.damage * (crit ? mods.critMult : 1)));
  enemy.userData.health -= dealt;
  if (mods.lifesteal > 0) {
    state.health = Math.min(maxHealth(), state.health + dealt * mods.lifesteal * 4);
  }
  const base = enemy.userData.sizeScale ?? 1;
  enemy.scale.setScalar(base * (crit ? 1.28 : 1.18));
  setTimeout(() => {
    if (enemies.includes(enemy)) enemy.scale.setScalar(base);
  }, 90);
  flashEnemyHit(enemy);
  flashHitMarker();
  shakeAmp = Math.max(shakeAmp, crit ? 0.035 : 0.02);
  sfxHit();
  if (crit) playTone({ freq: 880, dur: 0.05, type: "square", gain: 0.03 });

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
    // Ammo drop chance
    if (Math.random() < 0.42) {
      spawnAmmoPickup(enemy.position.clone(), AMMO_PICKUP_AMOUNT);
    } else if (Math.random() < 0.2) {
      spawnAmmoPickup(enemy.position.clone(), Math.round(AMMO_PICKUP_AMOUNT * 0.55));
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
  if (cheatGod) return;
  const taken = amount * mods.damageTaken;
  state.health -= taken;
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
  gamePaused = false;
  adsHeld = false;
  hideRewardUI(false);
  closeDevPanel({ relockHint: false });
  controls.unlock();
  overlay.classList.remove("playing");
  overlay.classList.remove("is-paused");
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
  startMusic();
  resetGame();
  showPlayWorld();
  lookYaw = 0;
  lookPitch = 0;
  cameraModeIndex = 0;
  if (playerRoot) {
    playerRoot.position.set(0, 0, 0);
    playerRoot.visible = true;
  }
  playing = true;
  shakeAmp = 0;
  bobPhase = 0;
  overlay.classList.remove("playing");
  overlay.classList.remove("is-gameover");
  overlay.classList.remove("is-paused");
  menu.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
  pausePanel.classList.add("hidden");
  hud.classList.remove("hidden");
  applyCameraModeVisuals();
  updateFollowCamera(0);
  showWaveToast(1);
  spawnTimer = 0.05;
  createEnemy(-4, -14);
  createEnemy(3.5, -16);
  createEnemy(0.5, -12);
  state.enemiesSpawned = 3;
  // A couple floor ammo crates so pickups are visible early
  spawnAmmoPickup(new THREE.Vector3(4, 0, -3), AMMO_PICKUP_AMOUNT);
  spawnAmmoPickup(new THREE.Vector3(-5, 0, 2), Math.round(AMMO_PICKUP_AMOUNT * 0.7));
  controls.lock();
}

function returnToMenu() {
  playing = false;
  gamePaused = false;
  adsHeld = false;
  hideRewardUI(false);
  closeDevPanel({ relockHint: false });
  loadoutOpen = false;
  loadoutPanel?.classList.add("hidden");
  clearCombat();
  resetGame();
  showMenuWorld();
  overlay.classList.remove("playing");
  overlay.classList.remove("is-gameover");
  gameOverPanel.classList.add("hidden");
  pausePanel.classList.add("hidden");
  overlay?.classList.remove("is-paused");
  menu.classList.remove("hidden");
  updateLoadoutSummary();
}

function updateViewmodel(dt) {
  weaponRecoil = THREE.MathUtils.lerp(weaponRecoil, 0, dt * 12);
  muzzleFlash = Math.max(0, muzzleFlash - dt * 8);

  // Recoil kick on held world gun
  if (heldGun && heldGun.visible && !reloading) {
    heldGun.rotation.x = 0.05 - weaponRecoil * 0.35;
    heldGun.position.z = heldGunBase.z + weaponRecoil * 0.08;
    heldGun.position.y = heldGunBase.y;
    if (heldGun.userData.muzzle?.material) {
      heldGun.userData.muzzle.material.opacity = muzzleFlash * 0.95;
      heldGun.userData.muzzle.scale.setScalar(0.7 + muzzleFlash * 1.8);
    }
  } else if (heldGun && heldGun.visible && reloading && heldGun.userData.muzzle?.material) {
    heldGun.userData.muzzle.material.opacity = 0;
  }

  if (!activeViewmodel?.visible) return;
  const base = activeViewmodel.userData.basePos || activeViewmodel.position;
  const baseRot = activeViewmodel.userData.baseRot || { x: 0, y: 0, z: 0 };
  const moving = keys["KeyW"] || keys["KeyA"] || keys["KeyS"] || keys["KeyD"] || padMoveActive();
  if (playing && pointerLocked && moving) {
    const sprint = keys["ShiftLeft"] || keys["ShiftRight"] || padSprint();
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
  if (activeViewmodel.userData.muzzle?.material) {
    activeViewmodel.userData.muzzle.material.opacity = muzzleFlash * 0.95;
    activeViewmodel.userData.muzzle.scale.setScalar(0.7 + muzzleFlash * 1.6);
  }
}

function updateFollowCamera(dt) {
  if (!playerRoot || mode !== "play") return;
  const m = currentCamMode();
  // Rotate offset by yaw
  _camOffset.copy(m.offset);
  _camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), lookYaw);
  const targetPos = playerRoot.position.clone().add(_camOffset);
  if (dt > 0) {
    camera.position.lerp(targetPos, 1 - Math.exp(-12 * dt));
  } else {
    camera.position.copy(targetPos);
  }
  _lookTarget.set(
    playerRoot.position.x - Math.sin(lookYaw) * 6,
    playerRoot.position.y + m.lookHeight + Math.sin(lookPitch) * 4,
    playerRoot.position.z - Math.cos(lookYaw) * 6
  );
  camera.lookAt(_lookTarget);
}

function readMoveInput() {
  direction.set(0, 0, 0);
  if (keys["KeyW"]) direction.z -= 1;
  if (keys["KeyS"]) direction.z += 1;
  if (keys["KeyA"]) direction.x -= 1;
  if (keys["KeyD"]) direction.x += 1;

  const pad = getPad();
  if (pad) {
    const lx = axisDZ(pad.axes[0]);
    const ly = axisDZ(pad.axes[1]);
    direction.x += lx;
    direction.z += ly;
  }
  if (direction.lengthSq() > 1) direction.normalize();
  return direction;
}

function updatePlayer(dt) {
  if (!playerRoot || rewarding || gamePaused) return;
  const move = readMoveInput();
  const sprint = keys["ShiftLeft"] || keys["ShiftRight"] || padSprint();
  const speed = (sprint ? MOVE_SPEED * SPRINT_MULT : MOVE_SPEED) * mods.moveSpeed;

  if (move.lengthSq() > 0) {
    _forward.set(-Math.sin(lookYaw), 0, -Math.cos(lookYaw));
    _right.set(Math.cos(lookYaw), 0, -Math.sin(lookYaw));
    playerRoot.position.addScaledVector(_right, move.x * speed * dt);
    playerRoot.position.addScaledVector(_forward, -move.z * speed * dt);
    bobPhase += dt * (sprint ? 14 : 10);
    if (playerBody?.userData?.body) {
      playerBody.userData.body.rotation.y = Math.sin(bobPhase) * 0.12;
    }
  }

  if (isGrounded()) coyoteTimer = COYOTE_TIME;
  else coyoteTimer = Math.max(0, coyoteTimer - dt);

  verticalVelocity -= GRAVITY * dt;
  playerRoot.position.y += verticalVelocity * dt;
  if (playerRoot.position.y <= GROUND_Y) {
    playerRoot.position.y = GROUND_Y;
    if (verticalVelocity < 0) verticalVelocity = 0;
  }

  playerRoot.position.x = THREE.MathUtils.clamp(playerRoot.position.x, -ARENA_SIZE + 1.5, ARENA_SIZE - 1.5);
  playerRoot.position.z = THREE.MathUtils.clamp(playerRoot.position.z, -ARENA_SIZE + 1.5, ARENA_SIZE - 1.5);
  // Face look direction
  playerRoot.rotation.y = lookYaw;

  updateFollowCamera(dt);
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
  const half = ARENA_SIZE - 0.5;
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

    // Soft wall bounce
    let bounced = false;
    if (Math.abs(proj.mesh.position.x) > half && proj.bounceLeft > 0) {
      proj.velocity.x *= -1;
      proj.mesh.position.x = THREE.MathUtils.clamp(proj.mesh.position.x, -half, half);
      proj.bounceLeft--;
      bounced = true;
    }
    if (Math.abs(proj.mesh.position.z) > half && proj.bounceLeft > 0) {
      proj.velocity.z *= -1;
      proj.mesh.position.z = THREE.MathUtils.clamp(proj.mesh.position.z, -half, half);
      proj.bounceLeft--;
      bounced = true;
    }
    if (bounced) shakeAmp = Math.max(shakeAmp, 0.01);

    let remove = false;
    for (const enemy of enemies) {
      const id = enemy.userData.id;
      if (proj.hitIds?.has(id)) continue;
      const hitR = (enemy.userData.hitRadius || 0.8) + (proj.radius || 0.22) - 0.22;
      if (proj.mesh.position.distanceTo(enemyCenter(enemy)) < hitR) {
        damageEnemy(enemy, proj.mesh.position.clone(), proj.damage || 1);
        proj.hitIds?.add(id);
        if (proj.pierceLeft > 0) {
          proj.pierceLeft--;
        } else {
          remove = true;
          break;
        }
      }
    }
    if (remove || proj.life <= 0 || Math.abs(proj.mesh.position.x) > half + 2 || Math.abs(proj.mesh.position.z) > half + 2) {
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
  const playerPos = getPlayerPos();
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
  if (rewarding || demoHold || gamePaused) return;
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
      state.score += 500;
      endGame();
      return;
    }
    openRewardUI();
  }
}

function applyPowerUp(pu) {
  if (!pu) return;
  mods.instantHeal = 0;
  pu.apply?.(mods);
  if (mods.instantHeal > 0) {
    state.health = Math.min(maxHealth(), state.health + mods.instantHeal);
    mods.instantHeal = 0;
  }
  state.health = Math.min(maxHealth(), state.health);
  if (pu.grantWeapon) {
    const id = pu.grantWeapon;
    const already = ownedWeapons.has(id);
    if (already) {
      // Ammo top-up when re-rolling a weapon card
      const add = id === "gatling" ? 18 : id === "shotgun" ? 8 : 12;
      state.reserve = Math.min(MAX_RESERVE + 40, state.reserve + add);
      weaponMags[id] = Math.min(magCapacity() + (id === activeWeaponId ? 0 : WEAPONS[id].magSize), (weaponMags[id] || 0) + Math.ceil(add / 3));
      showPickupToast(`${WEAPONS[id].name} AMMO +${add}`);
    }
    equipWeapon(id, { announce: !already, refill: !already });
  }
  if (state.mag > magCapacity()) state.mag = magCapacity();
  syncMagFromState();
  sfxPowerUp();
}

function renderRewardCards() {
  rewardCards.innerHTML = "";
  rewardOffer.forEach((pu, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `reward-card${pu.rarity === "rare" ? " rare" : ""}${pu._taken ? " taken" : ""}`;
    btn.dataset.index = String(i);
    btn.innerHTML = `
      <span class="rc-rarity">${pu.rarity === "rare" ? "RARE" : "COMMON"}</span>
      <span class="rc-check">✓</span>
      <strong class="rc-name">${pu.name}</strong>
      <p class="rc-desc">${pu.desc}</p>
    `;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      claimRewardCard(i);
    });
    rewardCards.appendChild(btn);
  });
}

function openRewardUI() {
  if (rewarding) return;
  rewarding = true;
  cancelReload(false);
  pendingWaveAdvance = {
    nextWave: state.wave + 1,
  };
  rewardOffer = rollOffer(POWER_POOL, 3).map((p) => ({ ...p, _taken: false }));
  renderRewardCards();
  rewardOverlay.classList.remove("hidden");
  document.body.classList.add("rewarding");
  crosshair?.classList.add("hidden");
  // Unlock for mouse clicks on cards
  if (pointerLocked) controls.unlock();
  pausePanel.classList.add("hidden");
  sfxWave();
  showPickupToast("CHOOSE 3 POWER-UPS");
}

function hideRewardUI(reLock = true) {
  rewarding = false;
  rewardOffer = [];
  rewardOverlay?.classList.add("hidden");
  document.body.classList.remove("rewarding");
  crosshair?.classList.remove("hidden");
  if (reLock && playing && state.health > 0 && mode === "play") {
    try {
      controls.lock();
    } catch (_) {
      /* ignore */
    }
  }
}

function claimRewardCard(index) {
  if (!rewarding) return;
  const pu = rewardOffer[index];
  if (!pu || pu._taken) return;
  pu._taken = true;
  applyPowerUp(pu);
  showPickupToast(pu.name);
  renderRewardCards();
  updateHud();
  if (rewardOffer.every((p) => p._taken)) {
    finishRewardAndAdvance();
  }
}

function confirmAllRewards() {
  if (!rewarding) return;
  const names = [];
  rewardOffer.forEach((pu) => {
    if (!pu._taken) {
      pu._taken = true;
      applyPowerUp(pu);
      names.push(pu.name);
    }
  });
  if (names.length) showPickupToast(names.join(" · "));
  finishRewardAndAdvance();
}

function finishRewardAndAdvance() {
  if (!pendingWaveAdvance) {
    hideRewardUI(true);
    return;
  }
  const next = pendingWaveAdvance.nextWave;
  pendingWaveAdvance = null;
  state.wave = next;
  state.enemiesToSpawn = 4 + state.wave * 2;
  state.enemiesSpawned = 0;
  state.score += state.wave * 50;
  state.reserve = Math.min(MAX_RESERVE, state.reserve + 24);
  hideRewardUI(true);
  spawnTimer = 0.85;
  showWaveToast(state.wave);
  // Start reload into possibly larger mag
  if (state.mag < magCapacity() && state.reserve > 0) tryReload();
  updateHud();
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

function axisDZ(v) {
  return Math.abs(v) < DEADZONE ? 0 : v;
}

function getPad() {
  const pads = navigator.getGamepads?.() || [];
  for (const p of pads) {
    if (p && p.connected) return p;
  }
  return null;
}

function padBtn(pad, i) {
  return Boolean(pad?.buttons?.[i]?.pressed);
}

function padBtnEdge(name, pressed) {
  const was = padPrev[name];
  padPrev[name] = pressed;
  return pressed && !was;
}

function padSprint() {
  const pad = getPad();
  if (!pad) return false;
  return padBtn(pad, 1);
}

function padMoveActive() {
  const pad = getPad();
  if (!pad) return false;
  return Math.abs(axisDZ(pad.axes[0])) > 0 || Math.abs(axisDZ(pad.axes[1])) > 0;
}

function renderLoadoutUI() {
  if (!loadoutGuns || !loadoutExtras) return;
  loadoutGuns.innerHTML = "";
  WEAPON_IDS.forEach((id, i) => {
    const w = WEAPONS[id];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `loadout-card${loadout.startWeapon === id ? " selected" : ""}`;
    btn.dataset.id = id;
    btn.innerHTML = `<strong class="lc-name">${w.name}</strong><p class="lc-desc">${w.desc}</p>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      loadout.startWeapon = id;
      loadoutFocus = { section: "gun", index: i };
      renderLoadoutUI();
      updateLoadoutSummary();
      sfxWeaponSwap();
    });
    loadoutGuns.appendChild(btn);
  });

  loadoutExtras.innerHTML = "";
  LOADOUT_EXTRAS.forEach((ex, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `loadout-card${loadout.startExtra === ex.id ? " selected" : ""}`;
    btn.dataset.id = ex.id;
    btn.innerHTML = `<strong class="lc-name">${ex.name}</strong><p class="lc-desc">${ex.desc}</p>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      loadout.startExtra = ex.id;
      loadoutFocus = { section: "extra", index: i };
      renderLoadoutUI();
      updateLoadoutSummary();
      playTone({ freq: 360, dur: 0.05, type: "triangle", gain: 0.03 });
    });
    loadoutExtras.appendChild(btn);
  });
}

function openLoadout() {
  loadoutOpen = true;
  menu.classList.add("hidden");
  loadoutPanel.classList.remove("hidden");
  renderLoadoutUI();
  updateLoadoutSummary();
  ensureAudio();
}

function closeLoadout() {
  loadoutOpen = false;
  loadoutPanel.classList.add("hidden");
  menu.classList.remove("hidden");
  updateLoadoutSummary();
}

function applyDevGate() {
  if (devAllowed) return;
  cheatGod = false;
  cheatInfiniteAmmo = false;
  devOpen = false;
  devMenuBtn?.classList.add("hidden");
  devPanel?.classList.add("hidden");
  godBadge?.classList.add("hidden");
}

function updateDevPanelUI() {
  if (!devAllowed) {
    godBadge?.classList.add("hidden");
    return;
  }
  if (!devPanel) return;
  devPanel.querySelectorAll(".dev-btn").forEach((btn) => {
    const id = btn.dataset.cheat;
    const on =
      (id === "god" && cheatGod) ||
      (id === "ammo" && cheatInfiniteAmmo);
    btn.classList.toggle("on", Boolean(on));
  });
  if (godBadge) godBadge.classList.toggle("hidden", !cheatGod);
}

function openDevPanel() {
  if (!devAllowed) return;
  if (rewarding || loadoutOpen) return;
  if (mode === "gameover") return;
  devOpen = true;
  updateDevPanelUI();
  devPanel?.classList.remove("hidden");
  // Ensure HUD is visible so the corner panel can show from menu too
  hud?.classList.remove("hidden");
  playHud?.classList.remove("hidden");
  pausePanel.classList.add("hidden");
  shootHeld = false;
  keys._mouseDown = false;
  if (pointerLocked) {
    try { controls.unlock(); } catch (_) { /* ignore */ }
  }
  playTone({ freq: 420, dur: 0.05, type: "triangle", gain: 0.03 });
}

function closeDevPanel({ relockHint = true } = {}) {
  if (!devOpen && devPanel?.classList.contains("hidden")) return;
  devOpen = false;
  devPanel?.classList.add("hidden");
  if (relockHint && playing && mode === "play" && state.health > 0 && !rewarding) {
    gamePaused = false;
    pausePanel?.classList.add("hidden");
    overlay?.classList.remove("is-paused");
    controls.lock();
  } else if (!playing && mode === "menu") {
    // From title menu — leave landing UI as-is
  }
  playTone({ freq: 280, dur: 0.045, type: "triangle", gain: 0.025 });
}

function toggleDevPanel() {
  if (!devAllowed) return;
  if (devOpen) closeDevPanel({ relockHint: playing && mode === "play" });
  else openDevPanel();
}

function cheatToggleGod() {
  if (!devAllowed) return;
  cheatGod = !cheatGod;
  updateDevPanelUI();
  showPickupToast(cheatGod ? "GOD MODE ON" : "GOD MODE OFF");
  sfxPowerUp();
}

function cheatToggleInfiniteAmmo() {
  if (!devAllowed) return;
  cheatInfiniteAmmo = !cheatInfiniteAmmo;
  if (cheatInfiniteAmmo) {
    cancelReload(false);
    state.mag = magCapacity();
    state.reserve = Math.max(state.reserve, MAX_RESERVE);
    syncMagFromState();
    updateHud();
  }
  updateDevPanelUI();
  showPickupToast(cheatInfiniteAmmo ? "INFINITE AMMO ON" : "INFINITE AMMO OFF");
  sfxPowerUp();
}

function cheatUnlockAllGuns() {
  if (!devAllowed) return;
  WEAPON_IDS.forEach((id) => {
    ownedWeapons.add(id);
    weaponMags[id] = WEAPONS[id].magSize + Math.max(0, mods.magBonus | 0);
  });
  state.reserve = Math.max(state.reserve, MAX_RESERVE);
  if (!ownedWeapons.has(activeWeaponId)) activeWeaponId = "shotgun";
  loadMagIntoState();
  equipWeapon(activeWeaponId, { announce: false, refill: true });
  WEAPON_IDS.forEach((id) => {
    weaponMags[id] = WEAPONS[id].magSize + Math.max(0, mods.magBonus | 0);
  });
  loadMagIntoState();
  updateHud();
  showPickupToast("ALL GUNS UNLOCKED");
  sfxWeaponSwap();
}

function cheatSkipWave() {
  if (!devAllowed) return;
  if (!playing || mode !== "play") {
    showPickupToast("START A MATCH FIRST");
    return;
  }
  if (rewarding) {
    confirmAllRewards();
    return;
  }
  enemies.forEach((e) => scene.remove(e));
  enemies = [];
  state.enemiesSpawned = state.enemiesToSpawn;
  if (state.wave >= MAX_WAVES) {
    state.score += 500;
    showPickupToast("FINAL WAVE CLEARED");
    closeDevPanel({ relockHint: false });
    endGame();
    return;
  }
  closeDevPanel({ relockHint: false });
  openRewardUI();
  showPickupToast("WAVE SKIPPED");
}

function cheatHealAndRefill() {
  if (!devAllowed) return;
  state.health = maxHealth();
  cancelReload(false);
  state.mag = magCapacity();
  state.reserve = Math.max(state.reserve, MAX_RESERVE);
  WEAPON_IDS.forEach((id) => {
    if (ownedWeapons.has(id)) {
      weaponMags[id] = WEAPONS[id].magSize + Math.max(0, mods.magBonus | 0);
    }
  });
  syncMagFromState();
  updateHud();
  showPickupToast("HEALED + AMMO FULL");
  sfxAmmoPickup();
}

function runDevCheat(id) {
  if (!devAllowed) return;
  switch (id) {
    case "god": cheatToggleGod(); break;
    case "ammo": cheatToggleInfiniteAmmo(); break;
    case "guns": cheatUnlockAllGuns(); break;
    case "wave": cheatSkipWave(); break;
    case "heal": cheatHealAndRefill(); break;
    default: break;
  }
  updateDevPanelUI();
}

function confirmLoadout(startMatch = false) {
  updateLoadoutSummary();
  sfxPowerUp();
  if (startMatch) {
    loadoutOpen = false;
    loadoutPanel.classList.add("hidden");
    startGame();
    return;
  }
  closeLoadout();
  showPickupToast(`LOADOUT: ${WEAPONS[loadout.startWeapon].short}`);
}

function nudgeLoadout(dir) {
  if (!loadoutOpen) return;
  if (loadoutFocus.section === "gun") {
    const i = (loadoutFocus.index + dir + WEAPON_IDS.length) % WEAPON_IDS.length;
    loadoutFocus.index = i;
    loadout.startWeapon = WEAPON_IDS[i];
  } else {
    const i = (loadoutFocus.index + dir + LOADOUT_EXTRAS.length) % LOADOUT_EXTRAS.length;
    loadoutFocus.index = i;
    loadout.startExtra = LOADOUT_EXTRAS[i].id;
  }
  renderLoadoutUI();
  updateLoadoutSummary();
  sfxWeaponSwap();
}

function pollGamepad(dt) {
  if (playing && pointerLocked && mode === "play" && !gamePaused) {
    const padForAds = getPad();
    adsHeld = Boolean(keys._rmbDown)
      || (padForAds && ((padForAds.buttons[6]?.value ?? 0) > 0.35 || padBtn(padForAds, 6)));
  } else if (!keys._rmbDown) {
    adsHeld = false;
  }

  const pad = getPad();
  if (!pad) {
    return;
  }

  if (loadoutOpen) {
    if (padBtnEdge("loLeft", padBtn(pad, 14) || axisDZ(pad.axes[0]) < -0.6)) nudgeLoadout(-1);
    if (padBtnEdge("loRight", padBtn(pad, 15) || axisDZ(pad.axes[0]) > 0.6)) nudgeLoadout(1);
    if (padBtnEdge("loUp", padBtn(pad, 12) || axisDZ(pad.axes[1]) < -0.6)) {
      loadoutFocus.section = "gun";
      loadoutFocus.index = Math.max(0, WEAPON_IDS.indexOf(loadout.startWeapon));
      renderLoadoutUI();
    }
    if (padBtnEdge("loDown", padBtn(pad, 13) || axisDZ(pad.axes[1]) > 0.6)) {
      loadoutFocus.section = "extra";
      loadoutFocus.index = Math.max(0, LOADOUT_EXTRAS.findIndex((e) => e.id === loadout.startExtra));
      renderLoadoutUI();
    }
    if (padBtnEdge("loConfirm", padBtn(pad, 0))) confirmLoadout(false);
    if (padBtnEdge("loStart", padBtn(pad, 1) || padBtn(pad, 9))) confirmLoadout(true);
    if (padBtnEdge("loBack", padBtn(pad, 2) || padBtn(pad, 8))) closeLoadout();
    return;
  }

  if (devOpen) {
    if (padBtnEdge("devBack", padBtn(pad, 1) || padBtn(pad, 8))) closeDevPanel();
    return;
  }

  if (playing && mode === "play" && !rewarding && !devOpen && padBtnEdge("start", padBtn(pad, 9))) {
    togglePause();
    return;
  }

  if (gamePaused) return;

  // Right stick look — axes 2/3 standard; some browsers use 3/4
  const rx = axisDZ(pad.axes[2] ?? 0);
  const ry = axisDZ(pad.axes[3] ?? pad.axes[4] ?? 0);
  if (playing && pointerLocked && mode === "play" && !rewarding) {
    const padSens = PAD_LOOK_SENS * lookSensMult();
    lookYaw -= rx * padSens * dt;
    lookPitch -= ry * padSens * dt;
    lookPitch = THREE.MathUtils.clamp(lookPitch, -0.85, 0.75);
  }

  if (rewarding) {
    if (padBtnEdge("rewardConfirm", padBtn(pad, 0) || padBtn(pad, 1))) {
      confirmAllRewards();
    }
    return;
  }

  if (padBtnEdge("jump", padBtn(pad, 0)) && playing && pointerLocked) tryJump();
  if (!padBtn(pad, 0) && jumpHeld) releaseJump();

  // RT (7) shoot — A (0) is jump only
  const padShoot = padBtn(pad, 7) || (pad.buttons[7]?.value ?? 0) > 0.4;
  if (padShoot) shootHeld = true;
  if (playing && pointerLocked && padShoot) shoot();

  // X / Square (2) reload
  if (padBtnEdge("reload", padBtn(pad, 2)) && playing && pointerLocked) tryReload();

  // R1 (5) camera cycle
  if (padBtnEdge("cam", padBtn(pad, 5)) && playing && pointerLocked) cycleCameraMode();

  // LB weapon prev · Y / D-pad right weapon next
  if (padBtnEdge("wepPrev", padBtn(pad, 4)) && playing && pointerLocked) cycleOwnedWeapon(-1);
  if (playing && pointerLocked && padBtnEdge("wepNext", padBtn(pad, 3) || padBtn(pad, 15))) cycleOwnedWeapon(1);
}

let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  // Mouse LMB held tracking via buttons on pad + keys; also check buttons
  if (!getPad()) {
    // shootHeld set by mousedown/mouseup
  } else {
    const pad = getPad();
    const padShoot = padBtn(pad, 7) || (pad.buttons[7]?.value ?? 0) > 0.4;
    if (!padShoot && !keys._mouseDown) shootHeld = false;
  }

  pollGamepad(dt);
  updateAdsZoom();

  if (playing && mode === "play") {
    if (gamePaused) {
      updateViewmodel(dt);
      updateFollowCamera(dt);
    } else if (rewarding) {
      updateViewmodel(dt);
      updateFollowCamera(dt);
      updateAmmoPickups(dt);
      updateSplats(dt);
      updateFxBits(dt);
    } else if (pointerLocked) {
      updatePlayer(dt);
      updateReload(dt);
      updateWeaponSpin(dt);
      updateViewmodel(dt);
      updateProjectiles(dt);
      updateFxBits(dt);
      updateEnemies(dt, now / 1000);
      updateSpawns(dt);
      updateAmmoPickups(dt);
      updateSplats(dt);
      if (shootHeld) shoot();
    } else {
      updateViewmodel(dt);
      updateFollowCamera(dt);
    }
    if (Math.floor(now / 100) % 2 === 0) drawMinimap(minimapCanvas, false);
  } else {
    updateViewmodel(dt);
    updateMenuProps(dt);
    if (playing && mode === "play") updateFollowCamera(dt);
  }

  if (shakeAmp > 0.0005 && playing && mode === "play" && !rewarding) {
    const sx = (Math.random() - 0.5) * shakeAmp;
    const sy = (Math.random() - 0.5) * shakeAmp;
    camera.position.x += sx;
    camera.position.y += sy;
    shakeAmp = THREE.MathUtils.lerp(shakeAmp, 0, dt * 8);
    renderer.render(scene, camera);
    camera.position.x -= sx;
    camera.position.y -= sy;
  } else {
    if (!rewarding) shakeAmp = 0;
    renderer.render(scene, camera);
  }
}

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  // DEV panel toggle — backtick only (never KeyD / WASD); gated off on public Pages
  if (e.code === "Backquote" || e.code === "IntlBackslash") {
    if (!devAllowed) return;
    e.preventDefault();
    toggleDevPanel();
    return;
  }

  if (devOpen && devAllowed) {
    if (e.code === "Escape") { e.preventDefault(); closeDevPanel(); return; }
    if (e.code === "Digit1") { e.preventDefault(); runDevCheat("god"); return; }
    if (e.code === "Digit2") { e.preventDefault(); runDevCheat("ammo"); return; }
    if (e.code === "Digit3") { e.preventDefault(); runDevCheat("guns"); return; }
    if (e.code === "Digit4") { e.preventDefault(); runDevCheat("wave"); return; }
    if (e.code === "Digit5") { e.preventDefault(); runDevCheat("heal"); return; }
    return;
  }

  if (loadoutOpen) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") { e.preventDefault(); nudgeLoadout(-1); }
    if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); nudgeLoadout(1); }
    if (e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      loadoutFocus.section = "gun";
      loadoutFocus.index = Math.max(0, WEAPON_IDS.indexOf(loadout.startWeapon));
      renderLoadoutUI();
    }
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      e.preventDefault();
      loadoutFocus.section = "extra";
      loadoutFocus.index = Math.max(0, LOADOUT_EXTRAS.findIndex((x) => x.id === loadout.startExtra));
      renderLoadoutUI();
    }
    if (e.code === "Enter") { e.preventDefault(); confirmLoadout(false); }
    if (e.code === "Space") { e.preventDefault(); confirmLoadout(true); }
    if (e.code === "Escape") { e.preventDefault(); closeLoadout(); }
    return;
  }
  if (rewarding) {
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      confirmAllRewards();
    }
    if (e.code === "Digit1") claimRewardCard(0);
    if (e.code === "Digit2") claimRewardCard(1);
    if (e.code === "Digit3") claimRewardCard(2);
    return;
  }
  if (e.code === "Escape" && playing && mode === "play" && !devOpen && !loadoutOpen) {
    e.preventDefault();
    togglePause();
    return;
  }
  if (e.code === "Space" && playing && pointerLocked && !gamePaused) {
    e.preventDefault();
    tryJump();
    return;
  }
  if (e.code === "KeyR" && playing && pointerLocked) tryReload();
  if (e.code === "KeyQ" && playing) { e.preventDefault(); cycleOwnedWeapon(-1); }
  if (e.code === "Digit1" && playing && ownedWeapons.has("rifle")) equipWeapon("rifle");
  if (e.code === "Digit2" && playing && ownedWeapons.has("shotgun")) equipWeapon("shotgun");
  if (e.code === "Digit3" && playing && ownedWeapons.has("gatling")) equipWeapon("gatling");
  if (e.code === "KeyC" && playing) {
    e.preventDefault();
    cycleCameraMode();
  }
  if (e.code === "KeyM") {
    e.preventDefault();
    toggleMusic();
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
  if (e.code === "Space") releaseJump();
});
window.addEventListener("mousedown", (e) => {
  if (rewarding || loadoutOpen || devOpen) return;
  if (e.button === 0) {
    keys._mouseDown = true;
    shootHeld = true;
  }
  if (e.button === 2) keys._rmbDown = true;
  if (playing && pointerLocked && e.button === 0) shoot();
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0) {
    keys._mouseDown = false;
    if (!getPad()) shootHeld = false;
  }
  if (e.button === 2) keys._rmbDown = false;
});
window.addEventListener("wheel", (e) => {
  if (!playing || rewarding || loadoutOpen || devOpen) return;
  if (e.deltaY > 0) cycleOwnedWeapon(1);
  else if (e.deltaY < 0) cycleOwnedWeapon(-1);
}, { passive: true });
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("gamepadconnected", () => {
  // no-op — pollGamepad picks it up
});

startBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  ensureAudio();
  startGame();
});
loadoutBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  openLoadout();
});
devMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  ensureAudio();
  openDevPanel();
});
devPanel?.querySelectorAll(".dev-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    runDevCheat(btn.dataset.cheat);
  });
});
loadoutBack?.addEventListener("click", (e) => {
  e.stopPropagation();
  closeLoadout();
});
loadoutConfirm?.addEventListener("click", (e) => {
  e.stopPropagation();
  confirmLoadout(false);
});
loadoutStart?.addEventListener("click", (e) => {
  e.stopPropagation();
  confirmLoadout(true);
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
rewardConfirm?.addEventListener("click", (e) => {
  e.stopPropagation();
  confirmAllRewards();
});
overlay.addEventListener("click", () => {
  if (rewarding || loadoutOpen || devOpen) return;
  if (playing && gamePaused && state.health > 0) resumeFromPause();
});
pauseResumeBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  resumeFromPause();
});
pauseMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  gamePaused = false;
  pausePanel?.classList.add("hidden");
  overlay?.classList.remove("is-paused");
  returnToMenu();
});
document.addEventListener("contextmenu", (e) => {
  if (playing && pointerLocked && mode === "play") e.preventDefault();
});

initScene();
applyDevGate();
updateLoadoutSummary();
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

window.__poopFpsCycleCamera = cycleCameraMode;
window.__poopFpsForceReward = () => {
  if (!playing) {
    ensureAudio();
    startGame();
  }
  enemies.forEach((e) => scene.remove(e));
  enemies = [];
  state.enemiesSpawned = state.enemiesToSpawn;
  openRewardUI();
};
window.__poopFpsEmptyMag = () => {
  state.mag = 0;
  syncMagFromState();
  updateHud();
};
window.__poopFpsSpawnAmmo = () => {
  const p = getPlayerPos();
  spawnAmmoPickup(new THREE.Vector3(p.x + 1.5, 0, p.z + 1.2), AMMO_PICKUP_AMOUNT);
};
window.__poopFpsSafeDemo = () => {
  if (!playing) {
    ensureAudio();
    startGame();
  }
  demoHold = true;
  enemies.forEach((e) => scene.remove(e));
  enemies = [];
  state.enemiesToSpawn = 1;
  state.enemiesSpawned = 0;
  state.health = maxHealth();
  state.reserve = Math.max(state.reserve, 60);
  updateHud();
};
window.__poopFpsStartReload = () => {
  state.mag = 0;
  state.reserve = Math.max(state.reserve, 24);
  tryReload();
  updateHud();
};
window.__poopFpsPickupToast = () => {
  const gained = Math.max(1, Math.round(AMMO_PICKUP_AMOUNT * mods.pickupMult));
  const room = MAX_RESERVE - state.reserve;
  const add = Math.min(room, gained);
  if (add > 0) {
    state.reserve += add;
    sfxAmmoPickup();
    showPickupToast(`+${add} AMMO`);
    updateHud();
  } else {
    showPickupToast("RESERVE FULL");
  }
};
window.__poopFpsStickyAmmoToast = () => {
  showPickupToast("+18 AMMO", true);
};
window.__poopFpsGiveShotgun = () => {
  if (!playing) { ensureAudio(); startGame(); }
  demoHold = true;
  enemies.forEach((e) => scene.remove(e));
  enemies = [];
  state.health = maxHealth();
  state.reserve = Math.max(state.reserve, 80);
  equipWeapon("shotgun", { announce: true, refill: true });
};
window.__poopFpsGiveGatling = () => {
  if (!playing) { ensureAudio(); startGame(); }
  demoHold = true;
  enemies.forEach((e) => scene.remove(e));
  enemies = [];
  state.health = maxHealth();
  state.reserve = Math.max(state.reserve, 80);
  equipWeapon("gatling", { announce: true, refill: true });
  gatlingSpin = WEAPONS.gatling.windup + 0.5;
  shootHeld = true;
};
window.__poopFpsBurstFire = (count = 6) => {
  demoHold = true;
  enemies.forEach((e) => scene.remove(e));
  enemies = [];
  gatlingSpin = 99;
  shootHeld = true;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      lastShot = 0;
      shoot();
    }, i * 45);
  }
};
window.__poopFpsOpenLoadout = () => openLoadout();
window.__poopFpsSetLoadout = (gun, extra = "none") => {
  if (WEAPONS[gun]) loadout.startWeapon = gun;
  if (LOADOUT_EXTRAS.some((e) => e.id === extra)) loadout.startExtra = extra;
  updateLoadoutSummary();
  renderLoadoutUI();
};
window.__poopFpsOpenDev = () => { if (devAllowed) openDevPanel(); };
window.__poopFpsToggleGod = () => { if (devAllowed) cheatToggleGod(); };
window.__poopFpsToggleInfiniteAmmo = () => { if (devAllowed) cheatToggleInfiniteAmmo(); };
