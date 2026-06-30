const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const loading = document.getElementById("loading");
const menuButtons = document.getElementById("menuButtons");
const normalButton = document.getElementById("normalButton");
const hardButton = document.getElementById("hardButton");
const restartButton = document.getElementById("restartButton");

const W = 1600;
const H = 900;
const TURN_SPEED = 3.2;
const THRUST = 620;
const REVERSE_THRUST = 360;
const DRAG = 0.985;
const MAX_SPEED = 430;
const BACTERIA_CELL = 980;
const ACTIVE_RADIUS = 2600;
const BACTERIA_UNIT = 644;
const MIN_BACTERIA_DISTANCE = BACTERIA_UNIT;
const CAMERA_LERP = 0.038;
const LYSIS_BURST_SECONDS = 3;
const HARD_MODE_DURATION_MS = 10 * 60 * 1000;
const TARGET_DNA = 5;
const TARGET_PHAGES = 5;
const SAFE_MARGIN = 24;
const LYSIS_PHAGE_LAYOUT = [
  { x: -250, y: -35, rotation: -0.18 },
  { x: -125, y: 30, rotation: 0.12 },
  { x: 0, y: -20, rotation: -0.05 },
  { x: 125, y: 35, rotation: 0.16 },
  { x: 250, y: -30, rotation: -0.12 },
];
const QUALITY = {
  backgroundBacteria: 26,
  bubbles: 112,
  particlesMax: 220,
};

const State = {
  INTRO: "intro",
  SEARCH: "search",
  ADSORPTION: "adsorption",
  INJECTION: "injection",
  DNA_REPLICATION: "dna_replication",
  NUCLEOTIDE_MINIGAME: "nucleotide_minigame",
  PART_ASSEMBLY: "part_assembly",
  LYSIS: "lysis",
  COMPLETE: "complete",
};

const GameMode = {
  NORMAL: "normal",
  HARD: "hard",
};

const PARALLAX_LAYERS = [
  { key: "far", factor: 0.18, cell: 520, density: 0.88, minScale: 0.12, maxScale: 0.24, minAlpha: 0.08, maxAlpha: 0.14 },
  { key: "mid", factor: 0.38, cell: 680, density: 0.68, minScale: 0.22, maxScale: 0.38, minAlpha: 0.12, maxAlpha: 0.32 },
  { key: "near", factor: 0.62, cell: 620, density: 0.58, minScale: 0.34, maxScale: 0.54, minAlpha: 0.18, maxAlpha: 0.65 },
];

const BUBBLE_LAYERS = [
  { factor: 1, cell: 230, density: 0.7, minSize: 14, maxSize: 84 },
  { factor: 1, cell: 190, density: 0.42, minSize: 9, maxSize: 56 },
];

const DesktopMovementMode = {
  ADVANCED: "advanced",
  SIMPLE: "simple",
};

const ASSETS = {
  introBack: "assets_webp/Intro_back.webp",
  title: "assets_webp/Title.webp",
  easyIcon: "assets_webp/phage_easy.webp",
  hardIcon: "assets_webp/phage_hard.webp",
  start: "assets_webp/Start.webp",
  arrow: "assets_webp/Arrow.webp",
  phage: "assets_webp/Phage.webp",
  phageSprite: "assets_webp/Phage_Sprite.webp",
  bacteriaInside: "assets_webp/Bacteria_Inside.webp",
  bacteriaOutside1: "assets_webp/Bacteria_Outside_1.webp",
  bacteriaOutside2: "assets_webp/Bacteria_Outside_2.webp",
  bacteriaOutside3: "assets_webp/Bacteria_Outside_3.webp",
  bacteriaOutside4: "assets_webp/Bacteria_Outside_4.webp",
  bacteriaOutside5: "assets_webp/Bacteria_Outside_5.webp",
  bacteriaOutside6: "assets_webp/Bacteria_Outside_6.webp",
  body: "assets_webp/Body_Phage.webp",
  head: "assets_webp/Head_Phage.webp",
  legs: "assets_webp/Legs_Phage.webp",
  dnaBroken: "assets_webp/DNA_broken.webp",
  dnaComplete: "assets_webp/DNA_complete.webp",
  dnaIcon: "assets_webp/DNA_icon.png",
  nucA: "assets_webp/Nucleotido_A.webp",
  nucC: "assets_webp/Nucleotido_C.webp",
  nucG: "assets_webp/Nucleotido_G.webp",
  nucT: "assets_webp/Nucleotido_T.webp",
  bg1: "assets_webp/Bacteria_Background_1.webp",
  bg2: "assets_webp/Bacteria_Background_2.webp",
  bg3: "assets_webp/Bacteria_Background_3.webp",
  bg4: "assets_webp/Bacteria_Background_4.webp",
  bg5: "assets_webp/Bacteria_Background_5.webp",
  bg6: "assets_webp/Bacteria_Background_6.webp",
  bg7: "assets_webp/Bacteria_Background_7.webp",
  bg8: "assets_webp/Bacteria_Background_8.webp",
  bubble: "assets_webp/bubble.webp",
  flare: "assets_webp/flare.webp",
  noise: "assets_webp/noise.webp",
  stage0: "assets_webp/Stage_0.webp",
  stage1: "assets_webp/Stage_1.webp",
  stage2: "assets_webp/Stage_2.webp",
  stage3: "assets_webp/Stage_3.webp",
  stage4: "assets_webp/Stage_4.webp",
  stage5: "assets_webp/Stage_5.webp",
};

const NUCLEOTIDE_SEQUENCES = [
  ["A", "T", "C", "G"],
  ["T", "A", "G", "C"],
  ["C", "G", "A", "T"],
  ["G", "C", "T", "A"],
  ["A", "C", "T", "G"],
];

const img = {};
const keys = new Set();
const mouse = { x: 0, y: 0, down: false, justDown: false, justUp: false };
const uiButtons = [];
const touchControls = {
  joystick: { active: false, pointerId: null, cx: 0, cy: 0, dx: 0, dy: 0, radius: 76 },
  actionDown: false,
  actionPointerId: null,
};

let lastTime = 0;
let state = State.INTRO;
let stateTime = 0;
let camera = { x: 0, y: 0 };
let player;
let bacteriaField;
let targetBacteria = null;
let attachPose = null;
let attachCandidate = null;
let attachTimer = 0;
let injectionProgress = 0;
let dragItem = null;
let spaceWasDown = false;
let spaceTap = false;
let replication;
let nucleotideGame = null;
let assembly;
let lysis;
let bgBacteria = [];
let bubbles = [];
let particles = [];
let currentProcCell = { x: null, y: null };
let gameMode = GameMode.NORMAL;
let score = 0;
let kills = 0;
let hardModeStartedAt = 0;
let lysisStartedAt = 0;
let infectedBacteriaSeeds = new Set();
let infectionTimer = 0;
let infectionTimerMax = 0;
let toastMessage = "";
let toastTimer = 0;
let mobileControls = false;
let desktopMovementMode = DesktopMovementMode.ADVANCED;
let viewportSafe = { left: 0, top: 0, right: W, bottom: H, width: W, height: H, cx: W * 0.5, cy: H * 0.5 };
const layers = {};
const glowSprites = {};
const poppedBubbles = new Map();

const stageInfo = {
  [State.SEARCH]: ["Adsorcion", 1, "Rota y propulsa el fago. Acopla las patas a una bacteria."],
  [State.ADSORPTION]: ["Adsorcion", 1, "Fago adherido. Pulsa ESPACIO para iniciar la inyeccion."],
  [State.INJECTION]: ["Inyeccion", 2, "Manten ESPACIO para inyectar el ADN."],
  [State.DNA_REPLICATION]: ["Replicacion", 3, "Haz click en el ADN para duplicarlo o procesarlo."],
  [State.NUCLEOTIDE_MINIGAME]: ["Nucleotidos", 4, "Arrastra cada nucleotido al slot con su misma letra."],
  [State.PART_ASSEMBLY]: ["Ensamblaje", 5, "Junta cabeza, cuerpo y patas para formar un fago."],
  [State.LYSIS]: ["Lisis", 6, "Pulsa ESPACIO rapidamente para liberar los fagos."],
};

canvas.width = W;
canvas.height = H;

function loadImages() {
  return Promise.all(Object.entries(ASSETS).map(([key, src]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      img[key] = image;
      resolve();
    };
    image.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    image.src = src;
  })));
}

function init() {
  bgBacteria = Array.from({ length: QUALITY.backgroundBacteria }, (_, i) => {
    const drift = rand(0.08, 0.65);
    const t = (drift - 0.08) / (0.65 - 0.08);
    const scale = lerp(0.12, 0.58, t);
    const alpha = lerp(0.06, 0.65, t);
    
    const isDestroyed = rand(0, 1) < 0.75;
    const bgIndex = isDestroyed ? Math.floor(rand(5, 9)) : Math.floor(rand(1, 5));
    
    return {
      image: img[`bg${bgIndex}`],
      x: rand(-80, W + 80),
      y: rand(-80, H + 80),
      scale,
      rotation: rand(-Math.PI, Math.PI),
      alpha,
      drift,
    };
  });
  bubbles = Array.from({ length: QUALITY.bubbles }, () => ({
    x: rand(0, W),
    y: rand(0, H),
    r: rand(7, 30),
    alpha: rand(0.08, 0.35),
    speed: rand(4, 18),
    sprite: Math.floor(rand(0, 3)),
  }));
  rebuildRenderCaches();
  resetGame();
}

function resetGame() {
  state = State.INTRO;
  stateTime = 0;
  gameMode = GameMode.NORMAL;
  score = 0;
  kills = 0;
  hardModeStartedAt = 0;
  infectedBacteriaSeeds = new Set();
  poppedBubbles.clear();
  resetTouchControls();
  resetCycleState(330, 470, 0.65);
  menuButtons.classList.remove("hidden");
  restartButton.classList.add("hidden");
}

function resetCycleState(x = player?.x || 330, y = player?.y || 470, rotation = player?.rotation || 0.65) {
  camera = { x: 0, y: 0 };
  targetBacteria = null;
  attachPose = null;
  attachCandidate = null;
  attachTimer = 0;
  injectionProgress = 0;
  dragItem = null;
  nucleotideGame = null;
  lysisStartedAt = 0;
  particles = [];
  player = {
    x,
    y,
    vx: 0,
    vy: 0,
    rotation,
    scale: 0.24,
    animTime: 0,
    collisionTimer: 0,
  };
  bacteriaField = [];
  currentProcCell = { x: null, y: null };
  replication = {
    dnaPieces: [],
    nextId: 1,
    message: "",
    messageTimer: 0,
  };
  assembly = {
    completed: 0,
    activeParts: [],
    completePhages: [],
    joining: { headBody: false, bodyLegs: false },
    message: "",
    messageTimer: 0,
  };
  lysis = { pressure: 0, burst: false, burstTime: 0, burstStartedAt: 0, released: [] };
  infectionTimer = 0;
}

function startGame(mode) {
  gameMode = mode;
  score = 0;
  kills = 0;
  infectedBacteriaSeeds = new Set();
  hardModeStartedAt = mode === GameMode.HARD ? performance.now() : 0;
  poppedBubbles.clear();
  resetCycleState(330, 470, 0.65);
  updateProceduralBacteriaIfNeeded(true);
  menuButtons.classList.add("hidden");
  restartButton.classList.add("hidden");
  setState(State.SEARCH);
}

function makeBacteria(x, y, scale, rotation, variant, health = "healthy", seed = 0) {
  const infected = infectedBacteriaSeeds.has(seed);
  const finalHealth = infected || !isHealthyBacteriaVariant(variant) ? "broken" : health;
  return {
    x,
    y,
    scale,
    rotation,
    variant: infected ? 6 : variant,
    health: finalHealth,
    healthy: finalHealth === "healthy" && isHealthyBacteriaVariant(variant),
    infectable: finalHealth === "healthy" && isHealthyBacteriaVariant(variant) && !infected,
    seed,
    rx: 390 * scale,
    ry: 175 * scale,
  };
}

function createLayer(width = W, height = H) {
  const layer = document.createElement("canvas");
  layer.width = width;
  layer.height = height;
  return layer;
}

function rebuildRenderCaches() {
  layers.backgroundStatic = createLayer();
  buildStaticBackgroundLayer();
  buildGlowSprites();
}

function buildStaticBackgroundLayer() {
  const c = layers.backgroundStatic.getContext("2d");
  c.clearRect(0, 0, W, H);
  const g = c.createRadialGradient(W * 0.34, H * 0.25, 40, W * 0.45, H * 0.45, W * 0.82);
  g.addColorStop(0, "#1d8aa0");
  g.addColorStop(0.45, "#0b4967");
  g.addColorStop(1, "#061827");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  c.save();
  c.globalAlpha = 0.16;
  c.globalCompositeOperation = "screen";
  drawImageCenterOn(c, img.flare, W * 0.28, H * 0.22, 1.35, 0.05);
  drawImageCenterOn(c, img.flare, W * 0.72, H * 0.72, 1.0, Math.PI);
  c.restore();

  c.save();
  c.globalAlpha = 0.045;
  c.drawImage(img.noise, 0, 0, W, H);
  c.restore();

}

function buildGlowSprites() {
  glowSprites.green = makeGlowSprite(420, "rgba(147, 241, 124, 0.18)");
  glowSprites.yellow = makeGlowSprite(420, "rgba(238, 226, 100, 0.12)");
  glowSprites.cyan = makeGlowSprite(180, "rgba(122, 230, 255, 0.26)");
}

function makeGlowSprite(size, color) {
  const layer = createLayer(size, size);
  const c = layer.getContext("2d");
  const r = size / 2;
  const gradient = c.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  c.fillStyle = gradient;
  c.beginPath();
  c.arc(r, r, r, 0, Math.PI * 2);
  c.fill();
  return layer;
}

function updateProceduralBacteriaIfNeeded(force = false) {
  const cx = Math.floor(player.x / BACTERIA_CELL);
  const cy = Math.floor(player.y / BACTERIA_CELL);
  if (!force && currentProcCell.x === cx && currentProcCell.y === cy) return;
  currentProcCell = { x: cx, y: cy };
  const generated = [];
  for (let gx = cx - 3; gx <= cx + 3; gx += 1) {
    for (let gy = cy - 3; gy <= cy + 3; gy += 1) {
      const seed = hash2(gx, gy);
      if ((seed % 100) < 22) continue;
      const r1 = seeded(seed);
      const r2 = seeded(seed + 11);
      const r3 = seeded(seed + 23);
      const r4 = seeded(seed + 41);
      const x = gx * BACTERIA_CELL + 230 + r1 * (BACTERIA_CELL - 460);
      const y = gy * BACTERIA_CELL + 210 + r2 * (BACTERIA_CELL - 420);
      const dist = Math.hypot(x - player.x, y - player.y);
      if (dist > ACTIVE_RADIUS) continue;
      if (generated.some(b => Math.hypot(x - b.x, y - b.y) < MIN_BACTERIA_DISTANCE)) continue;
      const variant = getBacteriaVariant(seed);
      const health = isHealthyBacteriaVariant(variant) ? "healthy" : "broken";
      const scale = 0.76 + r3 * 0.2;
      generated.push(makeBacteria(x, y, scale, -0.45 + r4 * 0.9, variant, health, seed));
    }
  }
  bacteriaField = generated;
}

function getBacteriaVariant(seed) {
  if (seed % 3 === 0) return 1;
  return 2 + (seed % 5);
}

function isHealthyBacteriaVariant(variant) {
  return variant === 1;
}

function isBacteriaInteractable(bacteria) {
  return Boolean(bacteria?.infectable && bacteria.healthy && isHealthyBacteriaVariant(bacteria.variant));
}

function resolveBacteriaPhysics() {
  const body = getPhageBodyPoint(player);
  for (const b of bacteriaField) {
    const local = worldToLocal(b.x, b.y, b.rotation, body.x, body.y);
    const rx = b.rx + 42;
    const ry = b.ry + 42;
    const value = (local.x * local.x) / (rx * rx) + (local.y * local.y) / (ry * ry);
    if (value >= 1) continue;
    if (player) player.collisionTimer = 0.35;
    if (!isBacteriaInteractable(b) && state === State.SEARCH) {
      toastMessage = "Busca una bacteria sana para infectar";
      toastTimer = 1.8;
    }
    const normalLocal = normalize({ x: local.x / (rx * rx), y: local.y / (ry * ry) });
    const normalWorld = rotatePoint(normalLocal.x, normalLocal.y, b.rotation);
    const push = (1 - Math.sqrt(value)) * 85;
    player.x += normalWorld.x * push;
    player.y += normalWorld.y * push;
    const vn = player.vx * normalWorld.x + player.vy * normalWorld.y;
    if (vn < 0) {
      player.vx -= vn * normalWorld.x * 1.45;
      player.vy -= vn * normalWorld.y * 1.45;
    }
  }
}

function setState(next) {
  state = next;
  stateTime = 0;
  dragItem = null;
  mouse.down = false;
  mouse.justDown = false;
  mouse.justUp = false;
  if (next !== State.INTRO) menuButtons.classList.add("hidden");
  if (next !== State.COMPLETE) restartButton.classList.add("hidden");
}

function loop(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  stateTime += dt;
  const actionDown = keys.has(" ") || keys.has("Spacebar") || touchControls.actionDown;
  spaceTap = actionDown && !spaceWasDown;
  spaceWasDown = actionDown;
  update(dt, actionDown);
  render(dt);
  mouse.justDown = false;
  mouse.justUp = false;
  requestAnimationFrame(loop);
}

function update(dt, spaceDown) {
  if (player) {
    player.animTime += dt;
    if (player.collisionTimer > 0) player.collisionTimer -= dt;
  }
  if (gameMode === GameMode.HARD && state !== State.INTRO && state !== State.COMPLETE) {
    if (performance.now() - hardModeStartedAt >= HARD_MODE_DURATION_MS) {
      setState(State.COMPLETE);
      return;
    }
  }
  if (toastTimer > 0) toastTimer -= dt;
  expirePoppedBubbles();
  updateParticles(dt);
  if (replication.messageTimer > 0) replication.messageTimer -= dt;
  if (assembly.messageTimer > 0) assembly.messageTimer -= dt;

  if (state === State.DNA_REPLICATION || 
      state === State.NUCLEOTIDE_MINIGAME || 
      state === State.PART_ASSEMBLY || 
      state === State.LYSIS) {
    if (infectionTimer > 0 && !lysis.burst) {
      infectionTimer -= dt;
      if (infectionTimer <= 0) {
        infectionTimer = 0;
        abortInfection();
        return;
      }
    }
  }

  if (state === State.SEARCH) updateSearch(dt);
  if (state === State.ADSORPTION) updateAdsorption(dt, spaceDown);
  if (state === State.INJECTION) updateInjection(dt, spaceDown);
  if (state === State.DNA_REPLICATION) updateDnaReplication(dt);
  if (state === State.NUCLEOTIDE_MINIGAME) updateNucleotideMinigame(dt);
  if (state === State.PART_ASSEMBLY) updatePartAssembly(dt);
  if (state === State.LYSIS) updateLysis(dt);
}

function updateSearch(dt) {
  updateProceduralBacteriaIfNeeded();
  const movement = getMovementInput();
  if (movement.mobileActive || movement.simpleActive) {
    player.vx += movement.x * THRUST * dt;
    player.vy += movement.y * THRUST * dt;
    if (Math.hypot(movement.x, movement.y) > 0.05) {
      player.rotation = lerpAngle(player.rotation, Math.atan2(movement.x, -movement.y), 0.18);
    }
  } else {
    if (movement.left) player.rotation -= TURN_SPEED * dt;
    if (movement.right) player.rotation += TURN_SPEED * dt;

    const forward = getForward(player.rotation);
    if (movement.up) {
      player.vx += forward.x * THRUST * dt;
      player.vy += forward.y * THRUST * dt;
    }
    if (movement.down) {
      player.vx -= forward.x * REVERSE_THRUST * dt;
      player.vy -= forward.y * REVERSE_THRUST * dt;
    }
  }

  player.vx *= Math.pow(DRAG, dt * 60);
  player.vy *= Math.pow(DRAG, dt * 60);
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > MAX_SPEED) {
    player.vx = (player.vx / speed) * MAX_SPEED;
    player.vy = (player.vy / speed) * MAX_SPEED;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  resolveBubbleCollisions();
  resolveBacteriaPhysics();

  attachCandidate = null;
  for (const b of bacteriaField) {
    if (!isBacteriaInteractable(b)) continue;
    const result = canAttachToBacteria(player, b);
    if (result.valid) {
      attachCandidate = b;
      attachPose = {
        x: player.x,
        y: player.y,
        rotation: player.rotation,
        feet: result.feet,
        bacteria: b,
      };
      break;
    }
  }

  if (attachCandidate && (keys.has(" ") || keys.has("Spacebar") || touchControls.actionDown)) {
    targetBacteria = attachCandidate;
    player.vx = 0;
    player.vy = 0;
    keys.delete(" ");
    keys.delete("Spacebar");
    setState(State.ADSORPTION);
    return;
  }

  const targetCameraX = player.x - W * 0.5;
  const targetCameraY = player.y - H * 0.5;
  camera.x = lerp(camera.x, targetCameraX, CAMERA_LERP);
  camera.y = lerp(camera.y, targetCameraY, CAMERA_LERP);
}

function updateAdsorption(dt, spaceDown) {
  player.x = lerp(player.x, attachPose.x, 0.14);
  player.y = lerp(player.y, attachPose.y, 0.14);
  player.rotation = lerpAngle(player.rotation, attachPose.rotation, 0.14);
  camera.x = lerp(camera.x, targetBacteria.x - W * 0.5, 0.08);
  camera.y = lerp(camera.y, targetBacteria.y - H * 0.52, 0.08);
  attachPose.x = player.x;
  attachPose.y = player.y;
  attachPose.rotation = player.rotation;
  attachPose.feet = getPhageFeetPoint(player);
  if (stateTime > 0.25 && (spaceDown || spaceTap)) setState(State.INJECTION);
}

function updateInjection(dt, spaceDown) {
  if (spaceDown) injectionProgress = clamp(injectionProgress + dt * 0.36, 0, 1);
  if (injectionProgress >= 1) {
    createInitialDnaFromInjection();
    setState(State.DNA_REPLICATION);
  }
}

function createInitialDnaFromInjection() {
  replication.dnaPieces = [{
    id: replication.nextId++,
    x: W * 0.52,
    y: H * 0.52,
    vx: 0,
    vy: 0,
    rotation: -0.35,
    spin: 0.12,
    scale: 0.38,
    duplicated: false,
    processed: false,
  }];
  infectionTimerMax = gameMode === GameMode.HARD ? 40 : 60;
  infectionTimer = infectionTimerMax;
}

function updateDnaReplication(dt) {
  for (const dna of replication.dnaPieces) {
    dna.x += dna.vx * dt;
    dna.y += dna.vy * dt;
    dna.rotation += dna.spin * dt;
    dna.vx *= 0.985;
    dna.vy *= 0.985;
    keepInsideBacteria(dna);
  }
  resolveDnaCollisions();
  if (!mouse.justDown) return;
  const dna = pickDna(mouse.x, mouse.y);
  if (!dna) return;
  if (replication.dnaPieces.length < TARGET_DNA && !dna.duplicated) {
    spawnDnaCopy(dna);
    dna.duplicated = true;
    sayReplication(`ADN duplicado ${replication.dnaPieces.length}/${TARGET_DNA}`);
    return;
  }
  if (replication.dnaPieces.length < TARGET_DNA) {
    sayReplication("Elige una copia que aun no se haya duplicado.");
    return;
  }
  if (dna.processed) {
    sayReplication("Ese ADN ya produjo un fago.");
    return;
  }
  nucleotideGame = createNucleotideGame(dna);
  setState(State.NUCLEOTIDE_MINIGAME);
}

function spawnDnaCopy(source) {
  const angle = rand(0, Math.PI * 2);
  const copy = {
    id: replication.nextId++,
    x: clamp(source.x + Math.cos(angle) * 130, 270, W - 270),
    y: clamp(source.y + Math.sin(angle) * 100, 285, H - 250),
    vx: Math.cos(angle) * 360,
    vy: Math.sin(angle) * 280,
    rotation: source.rotation + rand(-0.5, 0.5),
    spin: rand(-0.28, 0.28),
    scale: 0.36,
    duplicated: false,
    processed: false,
  };
  source.vx -= Math.cos(angle) * 260;
  source.vy -= Math.sin(angle) * 210;
  replication.dnaPieces.push(copy);
  spawnParticle(source.x, source.y, "#ffd56a", 18);
}

function resolveDnaCollisions() {
  const minDist = 118;
  for (let i = 0; i < replication.dnaPieces.length; i += 1) {
    for (let j = i + 1; j < replication.dnaPieces.length; j += 1) {
      const a = replication.dnaPieces[i];
      const b = replication.dnaPieces[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist >= minDist) continue;
      const nx = dx / dist;
      const ny = dy / dist;
      const push = (minDist - dist) * 0.5;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
      a.vx -= nx * 35;
      a.vy -= ny * 35;
      b.vx += nx * 35;
      b.vy += ny * 35;
    }
  }
}

function createNucleotideGame(dna) {
  const sequence = NUCLEOTIDE_SEQUENCES[(dna.id - 1) % NUCLEOTIDE_SEQUENCES.length];
  return {
    dna,
    sequence,
    slots: sequence.map((code, i) => ({ code, x: 500 + i * 150, y: 500, filled: false })),
    nucleotides: [
      makeDrag("nucleotide", "A", 520, 760),
      makeDrag("nucleotide", "T", 675, 760),
      makeDrag("nucleotide", "C", 830, 760),
      makeDrag("nucleotide", "G", 985, 760),
    ],
    message: "",
    messageTimer: 0,
  };
}

function updateNucleotideMinigame(dt) {
  if (nucleotideGame.messageTimer > 0) nucleotideGame.messageTimer -= dt;
  syncNucleotideLayout();
  handleDrag(nucleotideGame.nucleotides, item => dropNucleotideOnSlot(item));
}

function dropNucleotideOnSlot(item) {
  let matched = false;
  for (const slot of nucleotideGame.slots) {
    if (slot.filled) continue;
    if (Math.hypot(item.x - slot.x, item.y - slot.y) < 72) {
      if (item.code === slot.code) {
        slot.filled = true;
        matched = true;
        spawnParticle(slot.x, slot.y, "#9be8ff", 16);
      } else {
        nucleotideGame.message = `${item.code} no va en el slot ${slot.code}.`;
        nucleotideGame.messageTimer = 1.2;
      }
      break;
    }
  }
  if (matched && nucleotideGame.slots.every(slot => slot.filled)) {
    nucleotideGame.dna.processed = true;
    createPhagePartsFromDna(nucleotideGame.dna);
    nucleotideGame = null;
    setState(State.PART_ASSEMBLY);
  }
}

function createPhagePartsFromDna(dna) {
  const baseX = dna.x;
  const baseY = dna.y;
  assembly.activeParts = [
    makePart("head", baseX - 90, baseY - 50),
    makePart("body", baseX + 15, baseY - 30),
    makePart("legs", baseX + 75, baseY + 60),
  ];
  for (const part of assembly.activeParts) {
    keepInsideBacteria(part, 60);
  }
  assembly.joining = { headBody: false, bodyLegs: false };
  spawnParticle(baseX, baseY, "#8eeaff", 26);
}

function makePart(kind, x, y) {
  return {
    kind,
    x,
    y,
    ox: x,
    oy: y,
    dragging: false,
    joined: false,
  };
}

function makeDrag(kind, code, x, y) {
  return {
    kind,
    code,
    x,
    y,
    ox: x,
    oy: y,
    dragging: false,
  };
}

function updatePartAssembly(dt) {
  handleDrag(assembly.activeParts, item => trySnapParts(item));
  for (const part of assembly.activeParts) {
    keepInsideBacteria(part, 60);
  }
  if (assembly.activeParts.length === 0 && assembly.completed >= TARGET_PHAGES) setState(State.LYSIS);
}

function trySnapParts() {
  const head = assembly.activeParts.find(p => p.kind === "head");
  const body = assembly.activeParts.find(p => p.kind === "body");
  const legs = assembly.activeParts.find(p => p.kind === "legs");
  if (!head || !body || !legs) return;

  if (!assembly.joining.headBody && Math.hypot(head.x - body.x, head.y - body.y) < 75) {
    assembly.joining.headBody = true;
    const cx = (head.x + body.x) / 2;
    const cy = (head.y + body.y) / 2;
    head.x = cx - 15;
    head.y = cy - 49;
    body.x = cx;
    body.y = cy + 13;
    spawnParticle(cx, cy, "#9be8ff", 14);
  }

  if (assembly.joining.headBody && !assembly.joining.bodyLegs && Math.hypot(body.x - legs.x, body.y - legs.y) < 85) {
    assembly.joining.bodyLegs = true;
    completePhageFromParts(body.x, body.y);
  } else if (!assembly.joining.headBody && Math.hypot(head.x - legs.x, head.y - legs.y) < 75) {
    sayAssembly("Primero une la cabeza con el cuerpo.");
  }
}

function completePhageFromParts(x, y) {
  assembly.completed += 1;
  assembly.completePhages.push({
    x,
    y,
    vx: rand(-16, 16),
    vy: rand(-10, 10),
    rotation: rand(-0.25, 0.25),
  });
  assembly.activeParts = [];
  spawnParticle(x, y, "#f6e56e", 30);
  if (assembly.completed >= TARGET_PHAGES) {
    setTimeout(() => {
      if (state === State.PART_ASSEMBLY) setState(State.LYSIS);
    }, 450);
  } else {
    setTimeout(() => {
      if (state === State.PART_ASSEMBLY) setState(State.DNA_REPLICATION);
    }, 650);
  }
}

function updateLysis(dt) {
  if (!lysisStartedAt) lysisStartedAt = performance.now();
  lysis.pressure = clamp(lysis.pressure - dt * 0.08, 0, 1);
  if (spaceTap && !lysis.burst) {
    lysis.pressure = clamp(lysis.pressure + 0.105, 0, 1);
    spawnParticle(W * 0.5 + rand(-280, 280), H * 0.5 + rand(-80, 80), "#e9fb79", 8);
  }
  if (lysis.pressure >= 1 && !lysis.burst) {
    lysis.burst = true;
    lysis.burstTime = 0;
    lysis.burstStartedAt = performance.now();
    for (const layout of LYSIS_PHAGE_LAYOUT) {
      const originX = W * 0.5 + layout.x;
      const originY = H * 0.52 + layout.y;
      const dir = normalize({ x: layout.x || rand(-1, 1), y: layout.y || rand(-1, 1) });
      const a = Math.atan2(dir.y, dir.x);
      lysis.released.push({
        x: originX,
        y: originY,
        vx: dir.x * rand(230, 430),
        vy: dir.y * rand(170, 340),
        rotation: layout.rotation,
      });
    }
    for (let i = 0; i < 100; i += 1) spawnParticle(W * 0.5 + rand(-220, 220), H * 0.52 + rand(-90, 90), i % 2 ? "#a8e36f" : "#f7ef73", 4);
  }
  if (lysis.burst) {
    lysis.burstTime = (performance.now() - lysis.burstStartedAt) / 1000;
    for (const p of lysis.released) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += dt * 1.5;
      p.vx *= 0.99;
      p.vy *= 0.99;
    }
    if (lysis.burstTime > LYSIS_BURST_SECONDS) {
      if (gameMode === GameMode.HARD) returnToFlightAfterKill();
      else setState(State.COMPLETE);
    }
  }
}

function returnToFlightAfterKill() {
  const bonus = performance.now() - lysisStartedAt < 8000 ? 25 : 0;
  score += 100 + bonus;
  kills += 1;
  if (targetBacteria) infectedBacteriaSeeds.add(targetBacteria.seed);
  const base = targetBacteria || { x: player.x, y: player.y };
  resetCycleState(base.x + 520, base.y - 260, -0.75);
  player.vx = 130;
  player.vy = -90;
  updateProceduralBacteriaIfNeeded(true);
  setState(State.SEARCH);
}

function abortInfection() {
  const b = targetBacteria;
  if (b) {
    b.health = "healthy";
    b.infectable = true;
    b.healthy = true;
  }
  const baseX = b ? b.x : player.x;
  const baseY = b ? b.y : player.y;

  resetCycleState(baseX + 520, baseY - 260, -0.75);
  player.vx = 130;
  player.vy = -90;
  updateProceduralBacteriaIfNeeded(true);
  setState(State.SEARCH);

  toastMessage = "¡Tiempo agotado! La bacteria se ha recuperado";
  toastTimer = 2.5;
}

function handleDrag(items, onDrop) {
  if (mouse.justDown && !dragItem) {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      const radius = item.kind === "nucleotide" ? 68 : item.kind === "legs" ? 60 : 50;
      if (hit(mouse, item.x, item.y, radius)) {
        dragItem = item;
        item.dragging = true;
        break;
      }
    }
  }
  if (dragItem && mouse.down) {
    dragItem.x = mouse.x;
    dragItem.y = mouse.y;
    if (state === State.PART_ASSEMBLY && assembly.activeParts.includes(dragItem)) {
      const center = { x: W * 0.5, y: H * 0.52 };
      const dx = dragItem.x - center.x;
      const dy = dragItem.y - center.y;
      const rx = 470 - 65;
      const ry = 210 - 65;
      const value = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (value > 1) {
        const angle = Math.atan2(dy * rx, dx * ry);
        dragItem.x = center.x + Math.cos(angle) * rx;
        dragItem.y = center.y + Math.sin(angle) * ry;
      }
    }
  }
  if (dragItem && mouse.justUp) {
    const item = dragItem;
    item.dragging = false;
    onDrop(item);
    if (item.kind === "nucleotide") {
      item.x = item.ox;
      item.y = item.oy;
    }
    dragItem = null;
  }
}

function render(dt) {
  updateViewportSafeArea();
  beginUiFrame();
  ctx.clearRect(0, 0, W, H);
  drawBackground(dt);
  if (state === State.INTRO) drawIntro();
  if (state === State.SEARCH || state === State.ADSORPTION) drawSearchWorld();
  if (state === State.INJECTION) drawInjection();
  if (state === State.DNA_REPLICATION) drawDnaReplication();
  if (state === State.NUCLEOTIDE_MINIGAME) drawNucleotideMinigame();
  if (state === State.PART_ASSEMBLY) drawPartAssembly();
  if (state === State.LYSIS) drawLysis();
  if (state === State.COMPLETE) drawComplete();
  drawParticles();
  if (stageInfo[state]) drawHud();
}

function drawBackground(dt) {
  ctx.drawImage(layers.backgroundStatic, 0, 0);
  drawBackgroundBacteria();
  for (let i = 0; i < PARALLAX_LAYERS.length; i += 1) drawParallaxLayer(PARALLAX_LAYERS[i], i);
  drawWorldBubbles();
}

function drawBackgroundBacteria() {
  const margin = 300;
  const wrapW = W + margin * 2;
  const wrapH = H + margin * 2;

  for (const b of bgBacteria) {
    const valX = b.x - camera.x * b.drift + margin;
    const drawX = ((valX % wrapW) + wrapW) % wrapW - margin;

    const valY = b.y - camera.y * b.drift + margin;
    const drawY = ((valY % wrapH) + wrapH) % wrapH - margin;

    ctx.save();
    ctx.globalAlpha = b.alpha;
    drawImageCenter(b.image, drawX, drawY, b.scale, b.rotation);
    ctx.restore();
  }
}

function drawParallaxLayer(layer, layerIndex) {
  const camX = camera.x * layer.factor;
  const camY = camera.y * layer.factor;
  const startX = Math.floor(camX / layer.cell) - 1;
  const endX = Math.floor((camX + W) / layer.cell) + 1;
  const startY = Math.floor(camY / layer.cell) - 1;
  const endY = Math.floor((camY + H) / layer.cell) + 1;
  for (let gx = startX; gx <= endX; gx += 1) {
    for (let gy = startY; gy <= endY; gy += 1) {
      const seed = hash2(gx, gy, 1000 + layerIndex * 97);
      if (seeded(seed) > layer.density) continue;
      const x = gx * layer.cell + seeded(seed + 3) * layer.cell - camX;
      const y = gy * layer.cell + seeded(seed + 9) * layer.cell - camY;
      const scale = layer.minScale + seeded(seed + 17) * (layer.maxScale - layer.minScale);
      const alpha = layer.minAlpha + seeded(seed + 29) * (layer.maxAlpha - layer.minAlpha);
      
      const isDestroyed = seeded(seed + 53) < 0.75;
      const bgIndex = isDestroyed ? Math.floor(seeded(seed + 59) * 4) + 5 : Math.floor(seeded(seed + 59) * 4) + 1;
      const image = img[`bg${bgIndex}`];
      
      ctx.save();
      ctx.globalAlpha = alpha;
      drawImageCenter(image, x, y, scale, -Math.PI + seeded(seed + 41) * Math.PI * 2);
      ctx.restore();
    }
  }
}

function drawWorldBubbles() {
  for (let layerIndex = 0; layerIndex < BUBBLE_LAYERS.length; layerIndex += 1) {
    const layer = BUBBLE_LAYERS[layerIndex];
    const camX = camera.x * layer.factor;
    const camY = camera.y * layer.factor;
    const startX = Math.floor(camX / layer.cell) - 1;
    const endX = Math.floor((camX + W) / layer.cell) + 1;
    const startY = Math.floor(camY / layer.cell) - 1;
    const endY = Math.floor((camY + H) / layer.cell) + 1;
    for (let gx = startX; gx <= endX; gx += 1) {
      for (let gy = startY; gy <= endY; gy += 1) {
        const seed = hash2(gx, gy, 3000 + layerIndex * 101);
        if (seeded(seed) > layer.density) continue;
        const id = `${layerIndex}:${gx}:${gy}`;
        if (poppedBubbles.has(id)) continue;
        const size = layer.minSize + seeded(seed + 23) * (layer.maxSize - layer.minSize);
        const sprite = img.bubble;
        const x = gx * layer.cell + seeded(seed + 5) * layer.cell - camX;
        const y = gy * layer.cell + seeded(seed + 13) * layer.cell - camY + Math.sin(stateTime * 0.9 + seed) * 10;
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
    }
  }
}

function resolveBubbleCollisions() {
  if (state !== State.SEARCH) return;
  const body = getPhageBodyPoint(player);
  for (let layerIndex = 0; layerIndex < BUBBLE_LAYERS.length; layerIndex += 1) {
    const layer = BUBBLE_LAYERS[layerIndex];
    const startX = Math.floor((body.x - 110) / layer.cell) - 1;
    const endX = Math.floor((body.x + 110) / layer.cell) + 1;
    const startY = Math.floor((body.y - 110) / layer.cell) - 1;
    const endY = Math.floor((body.y + 110) / layer.cell) + 1;
    for (let gx = startX; gx <= endX; gx += 1) {
      for (let gy = startY; gy <= endY; gy += 1) {
        const seed = hash2(gx, gy, 3000 + layerIndex * 101);
        if (seeded(seed) > layer.density) continue;
        const id = `${layerIndex}:${gx}:${gy}`;
        if (poppedBubbles.has(id)) continue;
        const size = layer.minSize + seeded(seed + 23) * (layer.maxSize - layer.minSize);
        const x = gx * layer.cell + seeded(seed + 5) * layer.cell;
        const y = gy * layer.cell + seeded(seed + 13) * layer.cell + Math.sin(stateTime * 0.9 + seed) * 10;
        if (Math.hypot(body.x - x, body.y - y) > size * 0.52 + 36) continue;
        poppedBubbles.set(id, performance.now() + 12000);
        player.collisionTimer = 0.16;
        spawnBubblePop(x - camera.x, y - camera.y, size);
      }
    }
  }
}

function spawnBubblePop(x, y, size) {
  spawnParticle(x, y, "#b7f4ff", Math.round(clamp(size / 4, 8, 22)));
  for (let i = 0; i < 5; i += 1) {
    particles.push({
      x: x + rand(-size * 0.25, size * 0.25),
      y: y + rand(-size * 0.25, size * 0.25),
      vx: rand(-50, 50),
      vy: rand(-70, 35),
      life: rand(0.18, 0.4),
      max: 0.4,
      color: "rgba(220, 252, 255, 0.9)",
      r: rand(2, Math.max(3, size * 0.08)),
    });
  }
}

function expirePoppedBubbles() {
  if (poppedBubbles.size === 0) return;
  const now = performance.now();
  for (const [id, expiresAt] of poppedBubbles) {
    if (expiresAt <= now) poppedBubbles.delete(id);
  }
}

function drawIntro() {
  drawImageCover(img.introBack, 0, 0, W, H);
  drawImageCenter(img.title, safeCenterX(), safeY(240), 0.56, 0);
}

function drawSearchWorld() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  drawMapBackdrop();
  for (const b of bacteriaField) {
    if (!isVisibleWorld(b.x, b.y, 720)) continue;
    if (isBacteriaInteractable(b)) drawGlow(b.x, b.y, "green", b.rx / 210);
    drawImageCenter(img[`bacteriaOutside${b.variant}`], b.x, b.y, b.scale, b.rotation);
  }
  drawGlow(player.x, player.y, "cyan", 0.65);
  drawPhageFrame(player.x, player.y, player.scale, player.rotation, getPlayerFrameIndex());
  ctx.restore();
}

function drawMapBackdrop() {
  ctx.fillStyle = "rgba(13, 72, 92, 0.18)";
  const startX = Math.floor(camera.x / 300) * 300 - 300;
  const startY = Math.floor(camera.y / 260) * 260 - 260;
  for (let x = startX; x < camera.x + W + 300; x += 300) {
    for (let y = startY; y < camera.y + H + 260; y += 260) {
      ctx.beginPath();
      ctx.arc(x + 70, y + 90, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawInjection() {
  const b = targetBacteria;
  const viewX = W * 0.5;
  const viewY = H * 0.52;
  const scale = 1.22;
  const outsideAlpha = 1 - smoothstep(0.1, 0.85, injectionProgress);
  const insideAlpha = smoothstep(0.12, 0.9, injectionProgress);
  ctx.save();
  ctx.globalAlpha = outsideAlpha;
  drawImageCenter(img[`bacteriaOutside${b.variant}`], viewX, viewY, scale, b.rotation);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = insideAlpha;
  drawImageCenter(img.bacteriaInside, viewX, viewY, scale, b.rotation);
  ctx.restore();

  // Calculate dynamic phage position and scale relative to target bacteria's centered zoom
  const localPos = worldToLocal(b.x, b.y, b.rotation, attachPose.x, attachPose.y);
  const normLocalX = localPos.x / b.scale;
  const normLocalY = localPos.y / b.scale;
  const injLocalX = normLocalX * scale;
  const injLocalY = normLocalY * scale;
  const rotated = rotatePoint(injLocalX, injLocalY, b.rotation);
  const injX = viewX + rotated.x;
  const injY = viewY + rotated.y;
  const phageScale = player.scale * (scale / b.scale);

  const phageDraw = { x: injX, y: injY, rotation: attachPose.rotation, scale: phageScale };
  const feetScreen = getPhageFeetPoint(phageDraw);
  const axis = normalize({ x: viewX - feetScreen.x, y: viewY - feetScreen.y });
  const animFrame = Math.floor(stateTime * 12) % 3;
  drawPhageFrame(phageDraw.x, phageDraw.y, phageDraw.scale, phageDraw.rotation, animFrame);
  const distance = Math.hypot(viewX - feetScreen.x, viewY - feetScreen.y);
  drawInjectedDna(feetScreen, axis, injectionProgress, distance);
  drawProgress(safeCenterX() - W * 0.19, safeBottom(34, 84), W * 0.38, 34, injectionProgress, "#f29b35");
}

function drawInjectedDna(start, dir, progress, distance) {
  const spacing = 58;
  const maxSegments = Math.max(1, Math.round(distance / spacing));
  const total = Math.max(1, Math.floor(1 + progress * maxSegments));
  const angle = Math.atan2(dir.y, dir.x);
  for (let i = 0; i < total; i += 1) {
    const t = total === 1 ? 0 : i / (total - 1);
    const wave = Math.sin(stateTime * 5 + i * 1.3) * 7;
    const px = start.x + dir.x * spacing * i + -dir.y * wave;
    const py = start.y + dir.y * spacing * i + dir.x * wave;
    ctx.save();
    ctx.globalAlpha = clamp(progress * 1.4 - t * 0.18, 0, 1);
    drawImageCenter(img.dnaComplete, px, py, 0.2, angle);
    ctx.restore();
  }
}

function drawDnaReplication() {
  drawImageCenter(img.bacteriaInside, W * 0.5, H * 0.52, 1.45, 0);
  for (const dna of replication.dnaPieces) {
    if (dna.processed) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      drawImageCenter(img.dnaComplete, dna.x, dna.y, dna.scale, dna.rotation);
      ctx.restore();
    } else {
      drawImageCenter(img.dnaComplete, dna.x, dna.y, dna.scale, dna.rotation);
      const canDuplicate = replication.dnaPieces.length < TARGET_DNA && !dna.duplicated;
      const canProcess = replication.dnaPieces.length >= TARGET_DNA;
      if (canDuplicate || canProcess) {
        ctx.strokeStyle = canProcess ? "rgba(255, 225, 100, 0.75)" : "rgba(150, 238, 255, 0.58)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(dna.x, dna.y, 62, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  assembly.completePhages.forEach((p, idx) => {
    const idleFrame = [0, 2][Math.floor((stateTime * 4.5 + idx * 0.7) % 2)];
    drawPhageFrame(p.x, p.y, 0.19, p.rotation, idleFrame);
  });
  const processed = replication.dnaPieces.filter(d => d.processed).length;
  drawCycleStatsSide(processed);
  if (replication.dnaPieces.length < TARGET_DNA) {
    drawTextCentered("Click en un ADN para duplicarlo", safeCenterX(), safeBottom(0, 38), 30, "#fff", "900");
  } else if (processed < TARGET_DNA) {
    drawTextCentered("Click en un ADN brillante para construir un fago", safeCenterX(), safeBottom(0, 38), 30, "#fff", "900");
  }
  if (replication.messageTimer > 0) drawToast(replication.message);
}

function drawNucleotideMinigame() {
  const layout = getNucleotideLayout();
  syncNucleotideLayout(layout);
  drawImageCenter(img.bacteriaInside, W * 0.5, H * 0.52, 1.45, 0);
  for (const dna of replication.dnaPieces) {
    if (!dna.processed) drawImageCenter(img.dnaComplete, dna.x, dna.y, dna.scale * 0.85, dna.rotation);
  }
  ctx.fillStyle = "rgba(3, 17, 27, 0.58)";
  ctx.fillRect(0, 0, W, H);
  drawPanel(layout.panelX, layout.panelY, layout.panelW, layout.panelH, 0.72);
  drawTextCentered("Completa la secuencia del ADN", safeCenterX(), layout.titleY, layout.titleSize, "#fff", "900");
  drawImageCenter(img.dnaComplete, safeCenterX(), layout.dnaY, layout.dnaScale, -0.06);
  for (const slot of nucleotideGame.slots) {
    drawPanel(slot.x - layout.slotW / 2, slot.y - layout.slotH / 2, layout.slotW, layout.slotH, slot.filled ? 0.5 : 0.32);
    if (slot.filled) {
      drawImageCenter(getNucleotideImage(slot.code), slot.x, slot.y, layout.slotNucleotideScale, 0);
    } else {
      drawTextCentered(slot.code, slot.x, slot.y + layout.slotLetterOffset, layout.slotLetterSize, "#fff", "900");
    }
  }
  drawPanel(layout.trayX, layout.trayY, layout.trayW, layout.trayH, 0.5);
  drawTextCentered("Nucleotidos", safeCenterX(), layout.trayTitleY, layout.trayTitleSize, "#fff", "900");
  for (const n of nucleotideGame.nucleotides) drawImageCenter(getNucleotideImage(n.code), n.x, n.y, layout.nucleotideScale, n.dragging ? 0.12 : 0);
  if (nucleotideGame.messageTimer > 0) drawToast(nucleotideGame.message);
}

function getNucleotideLayout() {
  const topReserved = mobileControls ? 108 : 150;
  const bottomReserved = mobileControls ? 18 : 24;
  const availableTop = safeY(topReserved);
  const availableBottom = safeBottom(0, bottomReserved);
  const availableHeight = Math.max(300, availableBottom - availableTop);
  const compact = availableHeight < 560;
  const panelW = mobileControls
    ? clamp(viewportSafe.width - 390, 520, 620)
    : clamp(viewportSafe.width - 460, 760, 920);
  const panelX = mobileControls
    ? clamp(safeCenterX() - panelW / 2, safeX(238), safeRight(panelW, SAFE_MARGIN))
    : safeCenterX() - panelW / 2;
  const panelY = availableTop;
  const panelH = availableHeight;
  const titleY = panelY + (compact ? 40 : 58);
  const dnaY = panelY + panelH * (compact ? 0.22 : 0.25);
  const slotsY = panelY + panelH * (compact ? 0.45 : 0.49);
  const trayH = compact ? 112 : 156;
  const trayW = Math.min(panelW - 180, compact ? 580 : 720);
  const trayX = safeCenterX() - trayW / 2;
  const trayY = panelY + panelH - trayH - (compact ? 10 : 18);
  const slotGap = compact ? 86 : 150;
  const slotW = compact ? 72 : 104;
  const slotH = compact ? 78 : 116;
  const nucGap = compact ? 92 : 155;
  const nucY = trayY + trayH * (compact ? 0.66 : 0.63);
  return {
    compact,
    panelX,
    panelY,
    panelW,
    panelH,
    titleY,
    titleSize: compact ? 24 : 38,
    dnaY,
    dnaScale: compact ? 0.28 : 0.42,
    slotsY,
    slotW,
    slotH,
    slotGap,
    slotLetterSize: compact ? 32 : 46,
    slotLetterOffset: compact ? 11 : 17,
    slotNucleotideScale: compact ? 0.32 : 0.42,
    trayX,
    trayY,
    trayW,
    trayH,
    trayTitleY: trayY + (compact ? 27 : 34),
    trayTitleSize: compact ? 19 : 24,
    nucGap,
    nucY: trayY + trayH * (compact ? 0.7 : 0.69),
    nucleotideScale: compact ? 0.36 : 0.52,
  };
}

function syncNucleotideLayout(layout = getNucleotideLayout()) {
  if (!nucleotideGame) return;
  const slotStartX = safeCenterX() - layout.slotGap * (nucleotideGame.slots.length - 1) / 2;
  nucleotideGame.slots.forEach((slot, i) => {
    slot.x = slotStartX + i * layout.slotGap;
    slot.y = layout.slotsY;
  });
  const nucStartX = safeCenterX() - layout.nucGap * (nucleotideGame.nucleotides.length - 1) / 2;
  nucleotideGame.nucleotides.forEach((n, i) => {
    n.ox = nucStartX + i * layout.nucGap;
    n.oy = layout.nucY;
    if (!n.dragging && dragItem !== n) {
      n.x = n.ox;
      n.y = n.oy;
    }
  });
}

function drawPartAssembly() {
  drawImageCenter(img.bacteriaInside, W * 0.5, H * 0.52, 1.45, 0);
  for (const dna of replication.dnaPieces) {
    if (!dna.processed) drawImageCenter(img.dnaComplete, dna.x, dna.y, dna.scale * 0.8, dna.rotation);
  }
  assembly.completePhages.forEach((p, idx) => {
    p.x += p.vx * 0.002;
    p.y += p.vy * 0.002;
    keepInsideBacteria(p, 60);
    const idleFrame = [0, 2][Math.floor((stateTime * 4.5 + idx * 0.7) % 2)];
    drawPhageFrame(p.x, p.y, 0.19, p.rotation, idleFrame);
  });
  for (const part of assembly.activeParts) drawPart(part);
  drawTextCentered("Junta cabeza + cuerpo + patas", safeCenterX(), safeY(150), 38, "#fff", "900");
  drawCycleStatsSide(replication.dnaPieces.filter(d => d.processed).length);
  if (assembly.messageTimer > 0) drawToast(assembly.message);
}

function drawCycleStatsSide(processedDna) {
  const panelW = 178;
  const panelH = 146;
  const x = safeRight(panelW, SAFE_MARGIN + 18);
  const y = safeY(164);
  drawPanel(x, y, panelW, panelH, 0.5);
  drawImageCenter(img.dnaIcon, x + 44, y + 48, 0.4, 0);
  drawText(`${replication.dnaPieces.length}/${TARGET_DNA}`, x + 82, y + 57, 26, "#fff", "900");
  drawPhageFrame(x + 45, y + 106, 0.14, -0.1, 0);
  drawText(`${assembly.completed}/${TARGET_PHAGES}`, x + 82, y + 116, 26, "#ffdd69", "900");
  if (processedDna > 0) {
    drawText(`${processedDna}`, x + panelW - 38, y + 58, 18, "#9be8ff", "900");
  }
}

function drawPart(part) {
  const image = part.kind === "head" ? img.head : part.kind === "body" ? img.body : img.legs;
  const scale = part.kind === "legs" ? 0.168 : part.kind === "body" ? 0.216 : 0.24;
  const pulse = 0.45 + Math.sin(stateTime * 5) * 0.25;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 232, 105, ${pulse})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(part.x, part.y, image.width * scale * 0.48 + 10, image.height * scale * 0.45 + 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  drawImageCenter(image, part.x, part.y, scale, part.dragging ? 0.12 : 0);
}

function drawLysis() {
  const shake = lysis.burst ? 0 : lysis.pressure * 18;
  const bx = W * 0.5 + rand(-shake, shake);
  const by = H * 0.49 + rand(-shake, shake);
  let image = img.bacteriaOutside1;
  if (lysis.pressure > 0.2) image = img.bacteriaOutside2;
  if (lysis.pressure > 0.4) image = img.bacteriaOutside3;
  if (lysis.pressure > 0.6) image = img.bacteriaOutside4;
  if (lysis.pressure > 0.8) image = img.bacteriaOutside5;
  if (lysis.pressure > 0.95) image = img.bacteriaOutside6;
  if (!lysis.burst) {
    drawImageCenter(image, bx, by, 1.08, -0.02);
    for (let i = 0; i < LYSIS_PHAGE_LAYOUT.length; i += 1) {
      const layout = LYSIS_PHAGE_LAYOUT[i];
      const animFrame = Math.floor(stateTime * 15 + i) % 3;
      drawPhageFrame(W * 0.5 + layout.x, H * 0.52 + layout.y, 0.18, layout.rotation + Math.sin(stateTime * 3 + i) * 0.08, animFrame);
    }
  } else {
    drawImageCenter(img.bacteriaOutside6, bx, by, 1.16, -0.02);
    for (const p of lysis.released) {
      const animFrame = Math.floor(stateTime * 12 + p.x) % 3;
      drawPhageFrame(p.x, p.y, 0.18, p.rotation, animFrame);
    }
  }
  const panelW = 330;
  const panelX = safeRight(panelW, SAFE_MARGIN + 24);
  const panelY = safeY(180);
  drawPanel(panelX, panelY, panelW, 250, 0.55);
  drawText("PRESION ALTA", panelX + 52, panelY + 60, 25, "#ff9d57", "900");
  drawText("Pulsa", panelX + 105, panelY + 127, 44, "#fff", "900");
  drawText(mobileControls ? "BOTON" : "ESPACIO", panelX + (mobileControls ? 82 : 68), panelY + 187, 48, "#fff", "900");
  drawText("para liberar los fagos", panelX + 54, panelY + 237, 24, "#fff", "800");
  drawProgress(safeCenterX() - 295, safeY(120), 590, 34, lysis.pressure, "#f07b58");
}

function drawComplete() {
  drawImageCenter(img.title, safeCenterX(), safeY(170), 0.55, 0);
  const cardW = 960;
  const cardH = 410;
  const cardX = safeCenterX() - cardW / 2;
  const cardY = Math.min(safeY(330), safeBottom(cardH, 92));
  drawPanel(cardX, cardY, cardW, cardH, 0.58);
  drawTextCentered(gameMode === GameMode.HARD ? "Tiempo terminado" : "Infeccion Completada", safeCenterX(), cardY + 90, 48, "#ffdd69", "900");
  const stars = gameMode === GameMode.HARD ? clamp(kills, 0, 3) : 3;
  const startX = safeCenterX() - (stars - 1) * 120;
  for (let i = 0; i < stars; i += 1) drawImageCenter(img.start, startX + i * 120, cardY + 205, 0.34, 0);
  if (gameMode === GameMode.HARD) {
    drawTextCentered(`Puntos: ${score}`, safeCenterX(), cardY + 320, 32, "#fff", "900");
    drawTextCentered(`Bacterias destruidas: ${kills}`, safeCenterX(), cardY + 364, 28, "#d7f5ff", "900");
  } else {
    drawTextCentered("Has completado el ciclo litico:", safeCenterX(), cardY + 320, 28, "#fff", "800");
    drawTextCentered("adsorcion, inyeccion, replicacion, nucleotidos, ensamblaje y lisis.", safeCenterX(), cardY + 364, 26, "#d7f5ff", "800");
  }
  restartButton.classList.remove("hidden");
}

function drawHud() {
  const [name, stage, objective] = stageInfo[state];
  const objectiveText = mobileControls ? objective.replaceAll("ESPACIO", "el boton") : objective;
  const objectiveX = safeX(SAFE_MARGIN);
  const objectiveY = safeY(SAFE_MARGIN);
  drawPanel(objectiveX, objectiveY, 340, 132, 0.48);
  drawTextCentered("Objetivo", objectiveX + 170, objectiveY + 38, 22, "#fff", "900");
  wrapTextCentered(objectiveText, objectiveX + 170, objectiveY + 75, 260, 22, "#fff");
  drawStageIcons(stage, name);
  if (gameMode === GameMode.HARD) drawHardModeHud();
  if (state === State.DNA_REPLICATION || 
      state === State.NUCLEOTIDE_MINIGAME || 
      state === State.PART_ASSEMBLY || 
      state === State.LYSIS) {
    drawInfectionTimer();
  }
  if (toastTimer > 0) drawTopToast(toastMessage);
  drawEscapeButton();

  if (state === State.SEARCH && attachCandidate) {
    drawActionPrompt(mobileControls ? "Manten el boton para infectar" : "Manten ESPACIO para infectar");
  } else if (state === State.ADSORPTION) {
    drawActionPrompt(mobileControls ? "Manten el boton para inyectar" : "Manten ESPACIO para inyectar");
  }
  if (state === State.SEARCH && !mobileControls) drawDesktopMovementCard();
  if (mobileControls) {
    drawFullscreenButton();
    drawMobileControls();
  }
}

function drawHardModeHud() {
  const remaining = Math.max(0, HARD_MODE_DURATION_MS - (performance.now() - hardModeStartedAt));
  const seconds = Math.ceil(remaining / 1000);
  const minutesText = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const x = safeRight(310, mobileControls ? 96 : SAFE_MARGIN);
  const y = safeY(SAFE_MARGIN);
  drawPanel(x, y, 310, 96, 0.52);
  drawTextCentered(`Puntos: ${score}`, x + 155, y + 38, 24, "#ffdd69", "900");
  drawTextCentered(`Tiempo: ${minutesText}`, x + 155, y + 72, 24, "#fff", "900");
}

function drawInfectionTimer() {
  if (infectionTimer <= 0 || lysis.burst) return;
  
  const width = 240;
  const height = 76;
  const x = safeRight(width, mobileControls ? 96 : SAFE_MARGIN);
  const isHard = gameMode === GameMode.HARD;
  const y = isHard ? safeY(SAFE_MARGIN) + 110 : safeY(SAFE_MARGIN);
  
  drawPanel(x, y, width, height, 0.6);
  
  let timeColor = "#62e49c"; // green
  if (infectionTimer < 10) {
    timeColor = "#ff6b6b"; // red
  } else if (infectionTimer < 20) {
    timeColor = "#ffd56a"; // yellow
  }
  
  const text = `Lisis: ${Math.ceil(infectionTimer)}s`;
  drawTextCentered(text, x + width / 2, y + 46, 24, timeColor, "900");
}

function drawStageIcons(activeStage, stageName) {
  const icons = [img.stage0, img.stage1, img.stage2, img.stage3, img.stage4, img.stage5];
  const baseX = safeCenterX() - 135;
  const y = safeY(54);
  for (let i = 0; i < icons.length; i += 1) {
    const x = baseX + i * 54;
    const completed = i + 1 <= activeStage;
    ctx.save();
    ctx.globalAlpha = completed ? 1 : 0.42;
    if (i + 1 === activeStage) drawGlow(x, y, "green", 0.26);
    drawImageCenter(icons[i], x, y, i + 1 === activeStage ? 0.16 : 0.135, 0);
    ctx.restore();
  }
  drawTextCentered(stageName, safeCenterX(), safeY(112), 24, "#fff", "900");
}

function drawPanel(x, y, w, h, alpha) {
  ctx.save();
  ctx.fillStyle = `rgba(6, 30, 48, ${alpha})`;
  ctx.strokeStyle = "rgba(192, 236, 242, 0.42)";
  ctx.lineWidth = 2;
  roundedRect(x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawProgress(x, y, w, h, value, color) {
  drawPanel(x - 12, y - 10, w + 24, h + 20, 0.5);
  ctx.fillStyle = "rgba(6, 22, 35, 0.8)";
  roundedRect(x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = color;
  roundedRect(x, y, w * clamp(value, 0, 1), h, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 2;
  roundedRect(x, y, w, h, 8);
  ctx.stroke();
}

function drawActionPrompt(text) {
  const w = mobileControls ? 520 : 560;
  const x = safeCenterX() - w / 2;
  const y = safeBottom(70, SAFE_MARGIN + 18);
  drawPanel(x, y, w, 70, 0.65);
  drawTextCentered(text, x + w / 2, y + 43, 26, "#ffdd69", "900");
}

function drawEscapeButton() {
  if (state === State.INTRO || !mobileControls) return;
  const w = 128;
  const h = 52;
  const x = safeRight(w, 96);
  const y = safeY(92);
  drawPanel(x, y, w, h, 0.58);
  drawTextCentered("Menu", x + w / 2, y + 34, 23, "#fff", "900");
  registerUiButton("escape", x, y, w, h, () => resetGame());
}

function drawFullscreenButton() {
  const size = 58;
  const x = safeRight(size, SAFE_MARGIN);
  const y = safeY(SAFE_MARGIN);
  drawPanel(x, y, size, size, 0.58);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  const pad = 16;
  ctx.beginPath();
  ctx.moveTo(x + pad, y + 25);
  ctx.lineTo(x + pad, y + pad);
  ctx.lineTo(x + 25, y + pad);
  ctx.moveTo(x + size - pad, y + 33);
  ctx.lineTo(x + size - pad, y + size - pad);
  ctx.lineTo(x + 33, y + size - pad);
  ctx.stroke();
  ctx.restore();
  registerUiButton("fullscreen", x, y, size, size, () => toggleFullscreen());
}

function drawDesktopMovementCard() {
  const w = 236;
  const h = 184;
  const x = safeX(SAFE_MARGIN);
  const y = safeBottom(h, SAFE_MARGIN);
  drawPanel(x, y, w, h, 0.52);
  drawTextCentered("Mover", x + w / 2, y + 34, 22, "#fff", "900");
  drawArrowIcon(x + 118, y + 66, 0, -Math.PI / 2);
  drawArrowIcon(x + 81, y + 103, 0, Math.PI);
  drawArrowIcon(x + 155, y + 103, 0, 0);
  drawArrowIcon(x + 118, y + 130, 0, Math.PI / 2);
  const modeLabel = desktopMovementMode === DesktopMovementMode.SIMPLE ? "Simple" : "Normal";
  const modeColor = desktopMovementMode === DesktopMovementMode.SIMPLE ? "#9be8ff" : "#ffdd69";
  drawTextCentered(`Modo: ${modeLabel}`, x + w / 2, y + 166, 18, modeColor, "900");
  registerUiButton("movement-mode", x, y, w, h, () => {
    desktopMovementMode = desktopMovementMode === DesktopMovementMode.SIMPLE
      ? DesktopMovementMode.ADVANCED
      : DesktopMovementMode.SIMPLE;
    resetJoystick();
  });
}

function drawArrowIcon(x, y, alphaBoost, rotation) {
  ctx.save();
  ctx.globalAlpha = 0.84 + alphaBoost;
  drawImageCenter(img.arrow, x, y, 0.28, rotation);
  ctx.restore();
}

function drawMobileControls() {
  if (state === State.SEARCH) drawMobileJoystick();
  const label = getMobileActionLabel();
  if (label) drawMobileActionButton(label);
}

function drawMobileJoystick() {
  const joy = touchControls.joystick;
  joy.cx = safeRight(0, 126);
  joy.cy = safeBottom(0, 126);
  const knobX = joy.cx + joy.dx;
  const knobY = joy.cy + joy.dy;
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "rgba(5, 24, 38, 0.56)";
  ctx.strokeStyle = "rgba(217, 248, 255, 0.58)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(joy.cx, joy.cy, joy.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(142, 234, 255, 0.32)";
  ctx.beginPath();
  ctx.arc(knobX, knobY, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMobileActionButton(label) {
  const w = 190;
  const h = 74;
  const x = safeX(SAFE_MARGIN);
  const y = safeBottom(h, SAFE_MARGIN);
  drawPanel(x, y, w, h, touchControls.actionDown ? 0.78 : 0.58);
  drawTextCentered(label, x + w / 2, y + 46, 24, "#ffdd69", "900");
  registerUiButton("action", x, y, w, h, () => {
    touchControls.actionDown = true;
  });
}

function getMobileActionLabel() {
  if (state === State.SEARCH && attachCandidate) return "Infectar";
  if (state === State.ADSORPTION || state === State.INJECTION) return "Inyectar";
  if (state === State.LYSIS) return "Liberar";
  return "";
}

function drawToast(text) {
  const x = safeCenterX() - 300;
  const y = safeY(170);
  drawPanel(x, y, 600, 72, 0.72);
  drawText(text, x + 34, y + 48, 27, "#fff", "900");
}

function getPlayerFrameIndex() {
  if (player.collisionTimer > 0) {
    return 3;
  }
  const movement = getMovementInput();
  const isThrusting = movement.mobileActive || movement.simpleActive || movement.up || movement.down || movement.left || movement.right;
  const isMoving = isThrusting || Math.hypot(player.vx, player.vy) > 30;

  if (isMoving) {
    return Math.floor(player.animTime * 12) % 3;
  } else {
    const idleFrames = [0, 2];
    return idleFrames[Math.floor(player.animTime * 4) % 2];
  }
}

function drawPhageFrame(x, y, scale, rotation, frameIndex) {
  const frameW = 1024;
  const frameH = 1024;
  const col = frameIndex % 2;
  const row = Math.floor(frameIndex / 2);
  const sx = col * frameW;
  const sy = row * frameH;
  
  // Scale adjustment relative to original phage dimensions
  const adjustedScale = scale * 0.458;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(adjustedScale, adjustedScale);
  ctx.drawImage(img.phageSprite, sx, sy, frameW, frameH, -frameW / 2, -frameH / 2, frameW, frameH);
  ctx.restore();
}

function drawImageCenter(image, x, y, scale, rotation) {
  if (!image) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  ctx.restore();
}

function drawTintedImageCenter(image, x, y, scale, rotation, tint) {
  drawTintedImageCenterOn(ctx, image, x, y, scale, rotation, tint);
}

function drawImageCover(image, x, y, w, h) {
  if (!image) return;
  const scale = Math.max(w / image.width, h / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  ctx.drawImage(image, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
}

function drawTitleText(text, x, y, size) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = `900 ${size}px Inter, system-ui, sans-serif`;
  ctx.lineWidth = 15;
  ctx.strokeStyle = "#082540";
  ctx.fillStyle = "#fff7e8";
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawTextCentered(text, x, y, size, color, weight = "700") {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.12);
  ctx.strokeStyle = "rgba(4, 20, 34, 0.65)";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawImageCenterOn(target, image, x, y, scale, rotation) {
  if (!image) return;
  target.save();
  target.translate(x, y);
  target.rotate(rotation);
  target.scale(scale, scale);
  target.drawImage(image, -image.width / 2, -image.height / 2);
  target.restore();
}

function drawTintedImageCenterOn(target, image, x, y, scale, rotation, tint) {
  if (!image) return;
  target.save();
  target.translate(x, y);
  target.rotate(rotation);
  target.scale(scale, scale);
  target.drawImage(image, -image.width / 2, -image.height / 2);
  target.globalCompositeOperation = "source-atop";
  target.fillStyle = tint;
  target.fillRect(-image.width / 2, -image.height / 2, image.width, image.height);
  target.restore();
}

function drawText(text, x, y, size, color, weight = "700") {
  ctx.save();
  ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.12);
  ctx.strokeStyle = "rgba(4, 20, 34, 0.65)";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapText(text, x, y, maxWidth, lineHeight, color) {
  const words = text.split(" ");
  let line = "";
  ctx.save();
  ctx.font = "800 23px Inter, system-ui, sans-serif";
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(4, 20, 34, 0.65)";
  ctx.lineWidth = 3;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.strokeText(line, x, y);
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.strokeText(line, x, y);
  ctx.fillText(line, x, y);
  ctx.restore();
}

function wrapTextCentered(text, x, y, maxWidth, lineHeight, color) {
  const words = text.split(" ");
  let line = "";
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "800 21px Inter, system-ui, sans-serif";
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(4, 20, 34, 0.65)";
  ctx.lineWidth = 3;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.strokeText(line, x, y);
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.strokeText(line, x, y);
  ctx.fillText(line, x, y);
  ctx.restore();
}

function drawTopToast(text) {
  const x = safeCenterX() - 280;
  const y = safeY(132);
  drawPanel(x, y, 560, 64, 0.62);
  drawTextCentered(text, x + 280, y + 42, 26, "#fff8d9", "900");
}

function roundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function getNucleotideImage(code) {
  return { A: img.nucA, C: img.nucC, G: img.nucG, T: img.nucT }[code];
}

function pickDna(x, y) {
  for (let i = replication.dnaPieces.length - 1; i >= 0; i -= 1) {
    const dna = replication.dnaPieces[i];
    if (!dna.processed && Math.hypot(x - dna.x, y - dna.y) < 78) return dna;
  }
  return null;
}

function keepInsideBacteria(obj, radius = 55) {
  const center = { x: W * 0.5, y: H * 0.52 };
  const dx = obj.x - center.x;
  const dy = obj.y - center.y;
  const rx = 470 - radius;
  const ry = 210 - radius;
  const value = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
  if (value > 1) {
    obj.x -= dx * 0.025;
    obj.y -= dy * 0.025;
    if (obj.vx !== undefined) obj.vx *= -0.25;
    if (obj.vy !== undefined) obj.vy *= -0.25;
  }
}

function canAttachToBacteria(phage, bacteria) {
  const points = getPhageContactScores(phage, bacteria);
  const others = [points.top.distance, points.left.distance, points.right.distance];
  const bottomDominates = points.bottom.distance <= Math.min(...others) + 28;
  const colliding = points.bottom.value < 1.22 || points.top.value < 1 || points.left.value < 1 || points.right.value < 1;
  return { valid: colliding && bottomDominates, near: colliding, feet: points.bottom.world };
}

function getPhageContactScores(phage, bacteria) {
  const localPoints = {
    bottom: { x: 0, y: 168 },
    top: { x: 0, y: -145 },
    left: { x: -62, y: 40 },
    right: { x: 62, y: 40 },
  };
  const scores = {};
  for (const [key, point] of Object.entries(localPoints)) {
    const world = localToWorld(phage.x, phage.y, phage.rotation, point.x * phage.scale, point.y * phage.scale);
    const local = worldToLocal(bacteria.x, bacteria.y, bacteria.rotation, world.x, world.y);
    const normalized = Math.sqrt((local.x * local.x) / (bacteria.rx * bacteria.rx) + (local.y * local.y) / (bacteria.ry * bacteria.ry));
    scores[key] = { world, value: normalized, distance: Math.abs(normalized - 1) * Math.max(bacteria.rx, bacteria.ry) };
  }
  return scores;
}

function getPhageFeetPoint(phage) {
  return localToWorld(phage.x, phage.y, phage.rotation, 0, 168 * phage.scale);
}

function getPhageBodyPoint(phage) {
  return localToWorld(phage.x, phage.y, phage.rotation, 0, 35 * phage.scale);
}

function localToWorld(x, y, rotation, localX, localY) {
  const p = rotatePoint(localX, localY, rotation);
  return { x: x + p.x, y: y + p.y };
}

function worldToLocal(x, y, rotation, worldX, worldY) {
  const dx = worldX - x;
  const dy = worldY - y;
  return rotatePoint(dx, dy, -rotation);
}

function rotatePoint(x, y, rotation) {
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  return { x: x * c - y * s, y: x * s + y * c };
}

function getForward(rotation) {
  return { x: Math.sin(rotation), y: -Math.cos(rotation) };
}

function normalize(v) {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function drawGlow(x, y, key, scale = 1) {
  const sprite = glowSprites[key];
  if (!sprite) return;
  const w = sprite.width * scale;
  const h = sprite.height * scale;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(sprite, x - w / 2, y - h / 2, w, h);
  ctx.restore();
}

function isVisibleWorld(x, y, margin) {
  return x > camera.x - margin &&
    x < camera.x + W + margin &&
    y > camera.y - margin &&
    y < camera.y + H + margin;
}

function hash2(x, y, salt = 0) {
  let h = x * 374761393 + y * 668265263 + salt * 1442695041;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

function seeded(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function updateBubbles(dt) {
  for (const bubble of bubbles) {
    bubble.y -= bubble.speed * dt;
    if (bubble.y < -30) {
      bubble.y = H + 30;
      bubble.x = rand(0, W);
    }
  }
}

function spawnParticle(x, y, color, count) {
  if (particles.length > QUALITY.particlesMax) particles.splice(0, particles.length - QUALITY.particlesMax);
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: rand(-120, 120),
      vy: rand(-120, 120),
      life: rand(0.35, 0.9),
      max: 0.9,
      color,
      r: rand(2, 7),
    });
  }
}

function updateParticles(dt) {
  particles = particles.filter(p => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    return p.life > 0;
  });
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function sayReplication(message) {
  replication.message = message;
  replication.messageTimer = 1.35;
}

function sayAssembly(message) {
  assembly.message = message;
  assembly.messageTimer = 1.35;
}

function hit(point, x, y, radius) {
  return Math.hypot(point.x - x, point.y - y) <= radius;
}

function getCanvasTransform() {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.max(rect.width / W, rect.height / H);
  const drawW = W * scale;
  const drawH = H * scale;
  return {
    rect,
    scale,
    offsetX: (rect.width - drawW) / 2,
    offsetY: (rect.height - drawH) / 2,
  };
}

function screenToCanvas(ev) {
  const t = getCanvasTransform();
  return {
    x: (ev.clientX - t.rect.left - t.offsetX) / t.scale,
    y: (ev.clientY - t.rect.top - t.offsetY) / t.scale,
  };
}

function resizeCanvasToViewport() {
  const scale = Math.max(window.innerWidth / W, window.innerHeight / H);
  const drawW = W * scale;
  const drawH = H * scale;
  canvas.style.width = `${drawW}px`;
  canvas.style.height = `${drawH}px`;
  canvas.style.left = `${(window.innerWidth - drawW) / 2}px`;
  canvas.style.top = `${(window.innerHeight - drawH) / 2}px`;
  mobileControls = isMobileControls();
  updateViewportSafeArea();
}

function updateViewportSafeArea() {
  const t = getCanvasTransform();
  const visibleLeftPx = Math.max(0, -t.rect.left);
  const visibleTopPx = Math.max(0, -t.rect.top);
  const visibleRightPx = Math.min(t.rect.width, window.innerWidth - t.rect.left);
  const visibleBottomPx = Math.min(t.rect.height, window.innerHeight - t.rect.top);
  const left = clamp(visibleLeftPx / t.scale, 0, W);
  const top = clamp(visibleTopPx / t.scale, 0, H);
  const right = clamp(visibleRightPx / t.scale, 0, W);
  const bottom = clamp(visibleBottomPx / t.scale, 0, H);
  viewportSafe = {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    cx: (left + right) * 0.5,
    cy: (top + bottom) * 0.5,
  };
}

function safeX(offset) {
  return viewportSafe.left + offset;
}

function safeY(offset) {
  return viewportSafe.top + offset;
}

function safeRight(width, offset) {
  return viewportSafe.right - width - offset;
}

function safeBottom(height, offset) {
  return viewportSafe.bottom - height - offset;
}

function safeCenterX() {
  return viewportSafe.cx;
}

function beginUiFrame() {
  uiButtons.length = 0;
}

function registerUiButton(id, x, y, w, h, onClick) {
  uiButtons.push({ id, x, y, w, h, onClick });
}

function handleUiPointerDown(p, pointerId) {
  for (let i = uiButtons.length - 1; i >= 0; i -= 1) {
    const button = uiButtons[i];
    if (p.x < button.x || p.x > button.x + button.w || p.y < button.y || p.y > button.y + button.h) continue;
    if (button.id === "action") {
      touchControls.actionPointerId = pointerId;
      touchControls.actionDown = true;
    }
    button.onClick();
    return true;
  }
  return false;
}

function handleMobileControlPointerDown(p, pointerId) {
  if (!mobileControls || state !== State.SEARCH) return false;
  const joy = touchControls.joystick;
  const dist = Math.hypot(p.x - joy.cx, p.y - joy.cy);
  if (dist > joy.radius + 42) return false;
  joy.active = true;
  joy.pointerId = pointerId;
  updateJoystickFromPoint(p);
  return true;
}

function updateJoystickFromPoint(p) {
  const joy = touchControls.joystick;
  const dx = p.x - joy.cx;
  const dy = p.y - joy.cy;
  const len = Math.hypot(dx, dy);
  const max = joy.radius;
  const scale = len > max ? max / len : 1;
  joy.dx = dx * scale;
  joy.dy = dy * scale;
}

function resetJoystick() {
  const joy = touchControls.joystick;
  joy.active = false;
  joy.pointerId = null;
  joy.dx = 0;
  joy.dy = 0;
}

function resetTouchControls() {
  resetJoystick();
  touchControls.actionDown = false;
  touchControls.actionPointerId = null;
}

function getMovementInput() {
  const joy = touchControls.joystick;
  const joyLen = Math.hypot(joy.dx, joy.dy);
  if (mobileControls && joy.active && joyLen > 10) {
    const strength = clamp(joyLen / joy.radius, 0, 1);
    return {
      mobileActive: true,
      x: (joy.dx / joyLen) * strength,
      y: (joy.dy / joyLen) * strength,
      left: false,
      right: false,
      up: false,
      down: false,
      simpleActive: false,
    };
  }
  const left = keys.has("ArrowLeft") || keys.has("a");
  const right = keys.has("ArrowRight") || keys.has("d");
  const up = keys.has("ArrowUp") || keys.has("w");
  const down = keys.has("ArrowDown") || keys.has("s");
  if (!mobileControls && desktopMovementMode === DesktopMovementMode.SIMPLE) {
    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);
    const len = Math.hypot(x, y);
    return {
      mobileActive: false,
      simpleActive: len > 0,
      x: len > 0 ? x / len : 0,
      y: len > 0 ? y / len : 0,
      left,
      right,
      up,
      down,
    };
  }
  return {
    mobileActive: false,
    simpleActive: false,
    x: 0,
    y: 0,
    left,
    right,
    up,
    down,
  };
}

function isMobileControls() {
  return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

window.addEventListener("keydown", ev => {
  const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (ev.key === "Escape" && state !== State.INTRO) {
    resetGame();
    ev.preventDefault();
    return;
  }
  keys.add(key);
  if (ev.key === " " && state === State.ADSORPTION && stateTime > 0.25) setState(State.INJECTION);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(ev.key)) ev.preventDefault();
});

window.addEventListener("keyup", ev => {
  const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  keys.delete(key);
});

canvas.addEventListener("pointerdown", ev => {
  const p = screenToCanvas(ev);
  if (handleUiPointerDown(p, ev.pointerId) || handleMobileControlPointerDown(p, ev.pointerId)) {
    canvas.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    return;
  }
  mouse.x = p.x;
  mouse.y = p.y;
  mouse.down = true;
  mouse.justDown = true;
  canvas.setPointerCapture(ev.pointerId);
});

canvas.addEventListener("pointermove", ev => {
  const p = screenToCanvas(ev);
  if (touchControls.joystick.active && touchControls.joystick.pointerId === ev.pointerId) {
    updateJoystickFromPoint(p);
    ev.preventDefault();
    return;
  }
  mouse.x = p.x;
  mouse.y = p.y;
});

canvas.addEventListener("pointerup", ev => {
  const p = screenToCanvas(ev);
  if (touchControls.joystick.pointerId === ev.pointerId) resetJoystick();
  if (touchControls.actionPointerId === ev.pointerId) {
    touchControls.actionPointerId = null;
    touchControls.actionDown = false;
  }
  mouse.x = p.x;
  mouse.y = p.y;
  mouse.down = false;
  mouse.justUp = true;
});

canvas.addEventListener("pointercancel", () => {
  resetTouchControls();
  mouse.down = false;
  mouse.justUp = true;
});

window.addEventListener("resize", resizeCanvasToViewport);
document.addEventListener("fullscreenchange", resizeCanvasToViewport);
normalButton.addEventListener("click", () => startGame(GameMode.NORMAL));
hardButton.addEventListener("click", () => startGame(GameMode.HARD));
restartButton.addEventListener("click", resetGame);

resizeCanvasToViewport();
loadImages()
  .then(() => {
    loading.classList.add("hidden");
    init();
    requestAnimationFrame(loop);
  })
  .catch(error => {
    loading.textContent = error.message;
  });
