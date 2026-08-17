import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import {
  buildMockupArena,
  configureMockupRenderer,
  createMockupSplat,
  setupMockupLighting,
} from "./arena.js";
import {
  createCoiledPoop,
  createEnemyPoop,
  createProjectileMesh,
  createTrailParticle,
  createViewmodelGun,
} from "./poop-models.js";

const canvas = document.getElementById("game-canvas");
const overlay = document.getElementById("overlay");
const menu = document.getElementById("menu");
const gameOverPanel = document.getElementById("game-over");
const hud = document.getElementById("hud");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const killsEl = document.getElementById("kills");
const finalScoreEl = document.getElementById("final-score");
const healthFill = document.getElementById("health-fill");
const healthText = document.getElementById("health-text");

const ARENA_SIZE = 40;
const PLAYER_HEIGHT = 1.7;
const GRAVITY = 25;
const MOVE_SPEED = 8;
const SPRINT_MULT = 1.6;
const FIRE_RATE = 0.18;
const PROJECTILE_SPEED = 28;
const ENEMY_SPEED = 3.2;
const ENEMY_DAMAGE = 12;
const ENEMY_ATTACK_COOLDOWN = 1.2;
const MAX_TRAIL_PARTS = 10;

const keys = {};
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let scene, camera, renderer, controls, viewmodel;
let projectiles = [];
let enemies = [];
let splats = [];
let playing = false;
let lastShot = 0;
let spawnTimer = 0;
let enemyIdCounter = 0;
let weaponRecoil = 0;

const state = {
  health: 100,
  score: 0,
  kills: 0,
  wave: 1,
  enemiesToSpawn: 5,
  enemiesSpawned: 0,
};

function enemyCenter(enemy) {
  const h = enemy.userData.height ?? 1;
  return enemy.position.clone().add(new THREE.Vector3(0, h * 0.5, 0));
}

function createEnemy(x, z) {
  const sizeScale = 0.85 + Math.random() * 0.45;
  const group = createEnemyPoop(sizeScale);
  group.position.set(x, 0, z);
  group.userData = {
    ...group.userData,
    id: ++enemyIdCounter,
    health: 2 + Math.floor(state.wave / 2),
    speed: ENEMY_SPEED + state.wave * 0.15,
    lastAttack: 0,
    wobble: Math.random() * Math.PI * 2,
    sizeScale,
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

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, PLAYER_HEIGHT, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  configureMockupRenderer(renderer);

  buildMockupArena(scene, ARENA_SIZE);
  setupMockupLighting(scene);

  scene.add(camera);
  viewmodel = createViewmodelGun();
  camera.add(viewmodel);

  for (let i = 0; i < 12; i++) {
    const prop = createCoiledPoop(0.35 + Math.random() * 0.35, 0x7a4a1a);
    prop.position.set(
      (Math.random() - 0.5) * (ARENA_SIZE * 1.6),
      0,
      (Math.random() - 0.5) * (ARENA_SIZE * 1.6)
    );
    prop.rotation.y = Math.random() * Math.PI * 2;
    scene.add(prop);
  }

  controls = new PointerLockControls(camera, document.body);
  controls.addEventListener("lock", () => {
    if (playing) {
      overlay.classList.add("playing");
      menu.classList.add("hidden");
      gameOverPanel.classList.add("hidden");
      hud.classList.remove("hidden");
    }
  });
  controls.addEventListener("unlock", () => {
    if (playing && state.health > 0) {
      overlay.classList.remove("playing");
    }
  });
}

function resetGame() {
  projectiles.forEach((p) => {
    scene.remove(p.mesh);
    p.trail.forEach((t) => scene.remove(t.mesh));
  });
  enemies.forEach((e) => scene.remove(e));
  splats.forEach((s) => scene.remove(s));
  projectiles = [];
  enemies = [];
  splats = [];
  weaponRecoil = 0;

  state.health = 100;
  state.score = 0;
  state.kills = 0;
  state.wave = 1;
  state.enemiesToSpawn = 5;
  state.enemiesSpawned = 0;
  spawnTimer = 0;
  velocity.set(0, 0, 0);
  camera.position.set(0, PLAYER_HEIGHT, 0);
  updateHud();
}

function updateHud() {
  scoreEl.textContent = state.score;
  waveEl.textContent = state.wave;
  killsEl.textContent = state.kills;
  healthFill.style.width = `${Math.max(0, state.health)}%`;
  healthText.textContent = Math.max(0, Math.ceil(state.health));
  healthFill.style.background =
    state.health > 50
      ? "linear-gradient(90deg, #6b8e23, #9acd32)"
      : state.health > 25
        ? "linear-gradient(90deg, #b8860b, #daa520)"
        : "linear-gradient(90deg, #8b0000, #dc143c)";
}

function spawnEnemyAtEdge() {
  const edge = Math.floor(Math.random() * 4);
  let x, z;
  const margin = ARENA_SIZE - 2;
  switch (edge) {
    case 0: x = (Math.random() - 0.5) * margin * 2; z = -margin; break;
    case 1: x = (Math.random() - 0.5) * margin * 2; z = margin; break;
    case 2: x = -margin; z = (Math.random() - 0.5) * margin * 2; break;
    default: x = margin; z = (Math.random() - 0.5) * margin * 2;
  }
  createEnemy(x, z);
  state.enemiesSpawned++;
}

function shoot() {
  const now = performance.now() / 1000;
  if (now - lastShot < FIRE_RATE) return;
  lastShot = now;
  weaponRecoil = 1;

  const mesh = createProjectileMesh();
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  const spawnPos = new THREE.Vector3();
  viewmodel.getWorldPosition(spawnPos);
  spawnPos.add(forward.clone().multiplyScalar(0.35));
  mesh.position.copy(spawnPos);

  scene.add(mesh);
  projectiles.push({
    mesh,
    velocity: forward.multiplyScalar(PROJECTILE_SPEED),
    life: 3,
    trail: [],
    trailTimer: 0,
  });
}

function damageEnemy(enemy, hitPoint) {
  enemy.userData.health--;
  const base = enemy.userData.sizeScale ?? 1;
  enemy.scale.setScalar(base * 1.12);
  setTimeout(() => enemy.scale.setScalar(base), 100);

  if (enemy.userData.health <= 0) {
    createSplat(hitPoint);
    scene.remove(enemy);
    enemies = enemies.filter((e) => e !== enemy);
    state.kills++;
    state.score += 100;
    updateHud();
  }
}

function endGame() {
  playing = false;
  controls.unlock();
  overlay.classList.remove("playing");
  hud.classList.add("hidden");
  gameOverPanel.classList.remove("hidden");
  finalScoreEl.textContent = state.score;
}

function startGame() {
  resetGame();
  playing = true;
  overlay.classList.remove("playing");
  menu.classList.add("hidden");
  gameOverPanel.classList.add("hidden");
  controls.lock();
}

function updateViewmodel(dt) {
  weaponRecoil = THREE.MathUtils.lerp(weaponRecoil, 0, dt * 14);
  viewmodel.position.z = -0.82 + weaponRecoil * 0.18;
  viewmodel.position.y = -0.48 - weaponRecoil * 0.06;
  viewmodel.rotation.x = -0.06 - weaponRecoil * 0.35;
  if (viewmodel.userData.gun) {
    viewmodel.userData.gun.rotation.y = -0.5 - weaponRecoil * 0.15;
  }
}

function updatePlayer(dt) {
  const onGround = camera.position.y <= PLAYER_HEIGHT;
  if (!onGround) {
    velocity.y -= GRAVITY * dt;
  } else {
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
  particle.userData.life = 0.35;
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
      proj.trailTimer = 0.025;
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
      const dist = proj.mesh.position.distanceTo(enemyCenter(enemy));
      if (dist < enemy.userData.hitRadius) {
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

function updateEnemies(dt, now) {
  const playerPos = camera.position;

  enemies.forEach((enemy) => {
    enemy.userData.wobble += dt * 4;
    if (enemy.userData.body) {
      enemy.userData.body.rotation.y = Math.sin(enemy.userData.wobble) * 0.15;
    }

    const target = new THREE.Vector3(playerPos.x, enemy.position.y, playerPos.z);
    const toPlayer = target.clone().sub(enemy.position);
    const dist = toPlayer.length();

    if (dist > 0.5) {
      toPlayer.normalize();
      enemy.position.add(toPlayer.multiplyScalar(enemy.userData.speed * dt));
      enemy.lookAt(target);
    }

    const attackRange = 1.6 + (enemy.userData.sizeScale ?? 1) * 0.4;
    if (dist < attackRange && now - enemy.userData.lastAttack > ENEMY_ATTACK_COOLDOWN) {
      enemy.userData.lastAttack = now;
      state.health -= ENEMY_DAMAGE;
      updateHud();
      if (state.health <= 0) {
        state.health = 0;
        endGame();
      }
    }
  });
}

function updateSpawns(dt) {
  if (state.enemiesSpawned < state.enemiesToSpawn) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemyAtEdge();
      spawnTimer = 0.8;
    }
    return;
  }

  if (enemies.length === 0) {
    state.wave++;
    state.enemiesToSpawn = 4 + state.wave * 2;
    state.enemiesSpawned = 0;
    state.score += state.wave * 50;
    spawnTimer = 1.5;
    updateHud();
  }
}

function updateSplats(dt) {
  splats = splats.filter((splat) => {
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
    updateEnemies(dt, now / 1000);
    updateSpawns(dt);
    updateSplats(dt);
  } else if (viewmodel) {
    updateViewmodel(dt);
  }

  renderer.render(scene, camera);
}

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
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

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

initScene();
animate();
