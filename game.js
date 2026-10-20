const soundEffects = window.SFX || {play() {}, loop() {}, stopAll() {}, menuOpen:false};
function playSound(name, options) { void soundEffects.play(name, options); }

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const loading = document.getElementById("loading");
const menuButtons = document.getElementById("menuButtons");
const normalButton = document.getElementById("normalButton");
const hardButton = document.getElementById("hardButton");
const restartButton = document.getElementById("restartButton");
const playfield = document.getElementById("playfield");
const menuButton = document.getElementById("menuButton");
const fullscreenButton = document.getElementById("fullscreenButton");
const rotateNotice = document.getElementById("rotateNotice");
const storyIntro = document.getElementById("storyIntro");
const storyIntroNext = document.getElementById("storyIntroNext");
const storyIntroImage = document.getElementById("storyIntroImage");
const storyIntroCaption = document.getElementById("storyIntroCaption");
const displayNotice = document.getElementById("displayNotice");
const retryLoadingButton = document.getElementById("retryLoadingButton");
const loadingStatus = document.getElementById("loadingStatus");
const BUILD_VERSION = "20261020-41";
const STORY_INTRO_FADE_MS = 260;
const SIMULATION_STEP = 1 / 60;
const MAX_FRAME_SECONDS = 0.25; // Discard long stalls equally for gameplay and its clocks.
let simulationAccumulator = 0;
let gameReady = false;
let loadingInProgress = false;
let loopStarted = false;
let fullscreenDeclined = false;
let storyIntroIndex = 0;
let storyIntroTransitioning = false;
let storyIntroActive = false;
let pendingGameMode = null;

let W = 1600;
const H = 900;
const TURN_SPEED = 3.2;
const THRUST = 620;
const REVERSE_THRUST = 360;
const DRAG = 0.985;
const MAX_SPEED = 430;
const BACTERIA_CELL = 980;
const ACTIVE_RADIUS = 2600;
const BACTERIA_UNIT = 644;
// All redesigned infection skins share this canvas, including transparent margins.
const BACTERIA_CANVAS_WIDTH = 1001;
const BACTERIA_BODY_WIDTH = 805;
const MIN_BACTERIA_DISTANCE = BACTERIA_UNIT;
const CAMERA_LERP = 0.038;
const HARD_MODE_DURATION_MS = 10 * 60 * 1000;
const TARGET_DNA = 5;
const TARGET_PHAGES = 5;
const SAFE_MARGIN = 24;
const DOCK_SECONDS = 0.85;
const INFECTION_REACH = 150;
const INFECTION_HOLD_SECONDS = 0.65;
const INTERIOR_SCALE = 1.45;
const ESCAPE_SECONDS = 2.4;
const AMBIENT_COUNT = 6;
const BUBBLE_COMBO_WINDOW = 3.5;
const ENERGY_SECONDS = 8;
const ENERGY_SPEED_MULTIPLIER = 1.65;
const LYSIS_PHAGE_LAYOUT = [
  { x: -250, y: -35, rotation: -0.18 },
  { x: -125, y: 30, rotation: 0.12 },
  { x: 0, y: -20, rotation: -0.05 },
  { x: 125, y: 35, rotation: 0.16 },
  { x: 250, y: -30, rotation: -0.12 },
];
const QUALITY = {
  particlesMax: 220,
};

const State = {
  INTRO: "intro",
  SEARCH: "search",
  ADSORPTION: "adsorption",
  INJECTION: "injection",
  DNA_REPLICATION: "dna_replication",
  NUCLEOTIDE_MINIGAME: "nucleotide_minigame",
  BIOSYNTHESIS: "biosynthesis",
  PART_ASSEMBLY: "part_assembly",
  LYSIS: "lysis",
  ESCAPE: "escape",
  COMPLETE: "complete",
  GAME_OVER: "game_over",
};

const GameMode = {
  NORMAL: "normal",
  HARD: "hard",
};

const PARALLAX_LAYERS = [
  { key: "far", factor: 0.18, cell: 300, density: 0.88, diameter: 64, minAlpha: 0.08, maxAlpha: 0.14 },
  { key: "mid", factor: 0.38, cell: 400, density: 0.78, diameter: 106, minAlpha: 0.16, maxAlpha: 0.28 },
  { key: "near", factor: 0.62, cell: 540, density: 0.68, diameter: 168, minAlpha: 0.32, maxAlpha: 0.52 },
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
  pointingOn: "assets_webp/pointing_pulse_on.webp",
  pointingOff: "assets_webp/pointing_pulse_off.webp",
  story: "assets_webp/Story.webp",
  storyIntro1: "assets_webp/storys/wide/0.webp",
  storyIntro2: "assets_webp/storys/wide/2.webp",
  storyIntro3: "assets_webp/storys/wide/5.webp",
  storyIntroMacrophage: "assets_webp/storys/wide/7.webp",
  introBack: "assets_webp/Intro_back_V2.webp",
  macrofago_idle: "assets_webp/macrofago/macrofago_idle.webp",
  macrofago_reach: "assets_webp/macrofago/macrofago_reach.webp",
  macrofago_closed: "assets_webp/macrofago/macrofago_closed.webp",
  title: "assets_webp/Title.webp",
  easyIcon: "assets_webp/phage_easy.webp",
  hardIcon: "assets_webp/phage_hard.webp",
  start: "assets_webp/Start.webp",
  arrow: "assets_webp/Arrow.webp",
  phageSprite: "assets_webp/Phage_Sprite.webp",
  bacteriaInside: "assets_webp/new_size/Bacteria_Inside.webp",
  bacteriaOutside1: "assets_webp/new_size/Bacteria_Outside_1.webp",
  bacteriaOutside2: "assets_webp/new_size/Bacteria_Outside_2.webp",
  bacteriaOutside3: "assets_webp/new_size/Bacteria_Outside_3.webp",
  bacteriaOutside4: "assets_webp/new_size/Bacteria_Outside_4.webp",
  bacteriaOutside5: "assets_webp/new_size/Bacteria_Outside_5.webp",
  bacteriaOutside6: "assets_webp/new_size/Bacteria_Outside_6.webp",
  body: "assets_webp/Body_Phage.webp",
  head: "assets_webp/Head_Phage.webp",
  phagePhase1: "assets_webp/Phage_phase_1.webp",
  phagePhase2: "assets_webp/Phage_phase_2.webp",
  phagePhase3: "assets_webp/Phage_phase_3.webp",
  legs: "assets_webp/Legs_Phage.webp",
  dnaBroken: "assets_webp/DNA_broken.webp",
  dnaComplete: "assets_webp/DNA_complete.webp",
  dnaIcon: "assets_webp/DNA_icon.webp",
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
  clock: "assets_webp/clock.webp",
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

for (const key of WORLD_SPRITES) ASSETS[key] = `assets_webp/celulas/${key.slice(5)}.webp`;
const img = {};
const keys = new Set();
const mouse = { x: 0, y: 0, down: false, justDown: false, justUp: false, pointerId: null };
const uiButtons = [];
const touchControls = {
  joystick: { active: false, pointerId: null, cx: 0, cy: 0, dx: 0, dy: 0, radius: 76 },
  actionDown: false,
  actionPointerId: null,
};

let lastTime = 0;
let state = State.INTRO;
let stateTime = 0;
let camera = { x: 0, y: 0, zoom: 1 };
let player;
let bacteriaField;
let cellField = [];
let targetBacteria = null;
let attachPose = null;
let attachCandidate = null;
let attachTimer = 0;
let infectionPointer = null;
let injectionProgress = 0;
let dragItem = null;
let spaceWasDown = false;
let spaceTap = false;
let pendingActionTaps = 0;
let pausedAt = null;
let landscapeReady = true;
let displayNoticeTimeout;
let infectionView = null;
let escape = null;
let worldTime = 0;
let ambientLife = [];
const depthSprites = [];
const backgroundFields = [];
let bubbleStats = { total: 0, combo: 0, cooldown: 0, energy: 0, popAge: 1 };
const silhouetteGlows = {};
let replication;
let nucleotideGame = null;
let assembly;
let lysis;
let particles = [];
let currentProcCell = { x: null, y: null };
let worldSeed = 0;
let gameMode = GameMode.NORMAL;
let score = 0;
let kills = 0;
let hardModeElapsed = 0;
let lysisStartedAt = 0;
let infectedBacteriaIds = new Set();
let toastMessage = "";
let toastTimer = 0;
let mobileControls = false;
let desktopMovementMode = DesktopMovementMode.ADVANCED;
let viewportSafe = { left: 0, top: 0, right: W, bottom: H, width: W, height: H, cx: W * 0.5, cy: H * 0.5 };
const layers = {};
const glowSprites = {};
const poppedBubbles = new Map();

const stageInfo = {
  [State.SEARCH]: ["Adsorción", 1, "Toca y desliza para moverte. Mantén pulsada una bacteria cercana para infectarla."],
  [State.ADSORPTION]: ["Adsorción", 1, "Mantén pulsada la bacteria para iniciar la inyección; también puedes usar ESPACIO."],
  [State.INJECTION]: ["Inyección", 2, "Mantén pulsada la bacteria o ESPACIO para inyectar el ADN."],
  [State.DNA_REPLICATION]: ["Replicación", 3, "Selecciona el ADN para duplicarlo o procesarlo."],
  [State.NUCLEOTIDE_MINIGAME]: ["Nucleótidos", 4, "Selecciona un nucleótido y su destino, o arrástralo a su misma letra."],
  [State.BIOSYNTHESIS]: ["Fabricación", 4, "La bacteria fabrica las piezas del fago."],
  [State.PART_ASSEMBLY]: ["Ensamblaje", 5, "Selecciona una pieza y su destino, o arrastra para unirlas."],
  [State.LYSIS]: ["Lisis", 6, "Toca la pantalla o pulsa ESPACIO para liberar los fagos."],
  [State.ESCAPE]: ["Nuevos fagos", 6, "¡Libre! Sigue explorando con uno de los fagos que creaste."],
};
const MOBILE_STAGE_OBJECTIVES = {
  [State.ADSORPTION]: "Mantén pulsada la bacteria para iniciar la inyección.",
  [State.INJECTION]: "Mantén pulsada la bacteria para inyectar el ADN.",
  [State.NUCLEOTIDE_MINIGAME]: "Toca un nucleótido y luego el espacio de su misma letra.",
  [State.PART_ASSEMBLY]: "Toca una pieza y su destino, o arrástralas para unirlas.",
  [State.LYSIS]: "Toca varias veces para liberar los fagos.",
};

function getStageInfo(stage = state) {
  const info = stageInfo[stage];
  if (!info || !mobileControls || !MOBILE_STAGE_OBJECTIVES[stage]) return info;
  return [info[0], info[1], MOBILE_STAGE_OBJECTIVES[stage]];
}

canvas.width = W;
canvas.height = H;

const OPTIONAL_ASSETS = new Set(['introBack', 'title', 'easyIcon', 'hardIcon', 'flare', 'noise', 'story', ...Array.from({length:8}, (_,i)=>`bg${i+1}`)]);
const STORY_INTRO_ASSETS = [ASSETS.storyIntro1, ASSETS.storyIntro2, ASSETS.storyIntro3];
const HARD_STORY_INTRO_ASSETS = [...STORY_INTRO_ASSETS, ASSETS.storyIntroMacrophage];
let activeStoryIntroAssets = STORY_INTRO_ASSETS;
const STORY_INTRO_CAPTIONS = [
  "Infecta una bacteria con tu fago.",
  "Replica su ADN y ensambla nuevos fagos.",
  "Libéralos cuando la bacteria se rompa.",
];
const STORY_INTRO_ALT_TEXTS = [
  "Un fago se acerca a una bacteria",
  "Los fagos se multiplican dentro de la bacteria",
  "La bacteria se rompe y libera nuevos fagos",
];
function loadImage(src, priority = "auto") {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const finish = (error) => {
      clearTimeout(timeout);
      image.onload = image.onerror = null;
      error ? reject(error) : resolve(image);
    };
    const timeout = setTimeout(() => finish(new Error(`Tiempo de espera agotado: ${src}`)), 10000);
    image.onload = () => finish();
    image.onerror = () => finish(new Error(`No se pudo cargar ${src}`));
    image.fetchPriority = priority;
    image.src = `${src}?v=${BUILD_VERSION}`;
  });
}

// Keep the menu ahead of large story panels and later minigames on slow connections.
const MENU_ASSETS = ['introBack', 'title', 'easyIcon', 'hardIcon'];
const EARLY_ASSETS = ['pointingOn', 'pointingOff', 'storyIntro1', 'phageSprite',
  'bacteriaOutside1', 'arrow', 'stage0', 'clock'];
async function loadImages() {
  let completed = 0;
  const entries = Object.entries(ASSETS);
  const loadEntry = async ([key, src], priority) => {
    if (!img[key] || img[key].fallback) {
      let error;
      for (let attempt = 0; attempt < 2; attempt++) {
        try { img[key] = await loadImage(src, priority); error = null; break; }
        catch (failure) { error = failure; }
      }
      if (error) {
        if (!OPTIONAL_ASSETS.has(key)) throw error;
        img[key] = createLayer(2, 2);
        img[key].fallback = true;
      }
    }
    loadingStatus.textContent = `Cargando imágenes… ${++completed}/${entries.length}`;
  };
  const loadGroup = async (group, priority) => {
    let cursor = 0;
    const results = await Promise.allSettled(Array.from({ length: Math.min(4, group.length) }, async () => {
      while (cursor < group.length) await loadEntry(group[cursor++], priority);
    }));
    const failed = results.find(result => result.status === 'rejected');
    if (failed) throw failed.reason;
  };
  await loadGroup(entries.filter(([key]) => MENU_ASSETS.includes(key)), 'high');
  // Paint the actual menu while the remaining assets load; play stays disabled.
  drawIntro();
  rotateNotice.style.setProperty("--portrait-story-background", `url("${ASSETS.story}?v=${BUILD_VERSION}")`);
  await loadGroup(entries.filter(([key]) => EARLY_ASSETS.includes(key)), 'high');
  await loadGroup(entries.filter(([key]) => !MENU_ASSETS.includes(key) && !EARLY_ASSETS.includes(key)), 'low');
}


async function bootstrapGame() {
  if (loadingInProgress || gameReady) return;
  loadingInProgress = true;
  normalButton.disabled = hardButton.disabled = true;
  retryLoadingButton.classList.add('hidden');
  loadingStatus.textContent = 'Cargando imágenes…';
  try {
    // Fonts are decorative; an unavailable font must not hold up the game.
    const fonts = document.fonts ? Promise.allSettled([
      document.fonts.load('400 32px "Lilita One"'), document.fonts.load('800 24px Nunito'),
    ]) : Promise.resolve();
    await Promise.all([loadImages(), Promise.race([fonts, new Promise(resolve=>setTimeout(resolve,1500))])]);
    init();
    loading.classList.add('hidden');
    normalButton.disabled = hardButton.disabled = false;
    if (!loopStarted) { loopStarted = true; lastTime = performance.now(); requestAnimationFrame(loop); }
  } catch (error) {
    loadingStatus.textContent = `${error.message}. Comprueba la conexión y vuelve a intentarlo.`;
    retryLoadingButton.classList.remove('hidden');
  } finally { loadingInProgress = false; }
}

function init() {
  rebuildRenderCaches();
  initAmbientLife();
  resetGame();
  gameReady = true;
}

function startStoryIntro(mode) {
  pendingGameMode = mode;
  activeStoryIntroAssets = mode === GameMode.HARD ? HARD_STORY_INTRO_ASSETS : STORY_INTRO_ASSETS;
  storyIntroIndex = 0;
  storyIntroTransitioning = false;
  storyIntroActive = true;
  storyIntroImage.classList.remove("is-fading");
  storyIntroImage.src = `${activeStoryIntroAssets[storyIntroIndex]}?v=${BUILD_VERSION}`;
  updateStoryIntroControls();
  menuButtons.classList.add("hidden");
  playfield.inert = true;
  storyIntro.classList.remove("hidden", "is-leaving");
  requestAnimationFrame(() => storyIntro.classList.add("is-visible"));
  storyIntroNext.focus({ preventScroll: true });
}

function updateStoryIntroControls() {
  const finalScene = storyIntroIndex === activeStoryIntroAssets.length - 1;
  storyIntroCaption.textContent = storyIntroIndex < STORY_INTRO_CAPTIONS.length
    ? STORY_INTRO_CAPTIONS[storyIntroIndex]
    : "En difícil, evita al macrófago.";
  storyIntroNext.setAttribute("aria-label", finalScene ? "Iniciar partida" : "Avanzar a la siguiente escena");
  storyIntroImage.alt = storyIntroIndex < STORY_INTRO_ALT_TEXTS.length
    ? STORY_INTRO_ALT_TEXTS[storyIntroIndex]
    : "Un macrófago persigue a un fago.";
}

function advanceStoryIntro() {
  if (!storyIntroActive || storyIntroTransitioning) return;
  storyIntroTransitioning = true;
  const finalScene = storyIntroIndex + 1 >= activeStoryIntroAssets.length;
  if (finalScene) {
    const mode = pendingGameMode;
    pendingGameMode = null;
    if (mode) {
      // Start and paint the first real game frame beneath the final illustration.
      launchGame(mode);
      render(0);
    } else {
      menuButtons.classList.remove("hidden");
      normalButton.focus({ preventScroll: true });
    }
    storyIntro.classList.add("is-leaving");
    setTimeout(() => {
      storyIntro.classList.add("hidden");
      storyIntro.classList.remove("is-visible", "is-leaving");
      clearHeldInputs();
      playfield.inert = false;
      storyIntroNext.blur?.();
      canvas.focus?.({ preventScroll: true });
      storyIntroActive = false;
      storyIntroTransitioning = false;
    }, STORY_INTRO_FADE_MS);
    return;
  }
  storyIntroImage.classList.add("is-fading");
  setTimeout(() => {
    storyIntroIndex++;
    storyIntroImage.src = `${activeStoryIntroAssets[storyIntroIndex]}?v=${BUILD_VERSION}`;
    updateStoryIntroControls();
    requestAnimationFrame(() => {
      storyIntroImage.classList.remove("is-fading");
      storyIntroTransitioning = false;
    });
  }, STORY_INTRO_FADE_MS);
}

function resetGame() {
  resetMacrophages();
  soundEffects.stopAll();
  if (state !== State.INTRO) playSound("volver_menu");
  playfield.classList.remove("playing");
  setState(State.INTRO);
  gameMode = GameMode.NORMAL;
  score = 0;
  kills = 0;
  hardModeElapsed = 0;
  infectedBacteriaIds = new Set();
  poppedBubbles.clear();
  clearHeldInputs();
  resetCycleState(330, 470, 0.65);
  menuButtons.classList.remove("hidden");
  menuButton.classList.add("hidden");
  restartButton.classList.add("hidden");
}

function resetCycleState(x = player?.x || 330, y = player?.y || 470, rotation = player?.rotation || 0.65) {
  camera = { x: 0, y: 0, zoom: 1 };
  infectionView = null;
  escape = null;
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
    contactSoundTimer: 0,
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
    packed: false,
    pendingDna: null,
    returnDelay: 0,
    message: "",
    messageTimer: 0,
  };
  lysis = { pressure: 0, damageProgress: 0, burst: false, burstTime: 0, burstStartedAt: 0, released: [] };
}

function startGame(mode) {
  if (!gameReady || isDisplayBlocked() || storyIntroActive) return;
  startStoryIntro(mode);
}

function launchGame(mode) {
  const nextSeed = Math.floor(Math.random() * 0x100000000) >>> 0;
  worldSeed = nextSeed === worldSeed ? (nextSeed + 1) >>> 0 : nextSeed;
  clearHeldInputs();
  playfield.classList.add("playing");
  gameMode = mode;
  resetMacrophages();
  playSound("partida_iniciar");
  score = 0;
  kills = 0;
  infectedBacteriaIds = new Set();
  cellField = [];
  hardModeElapsed = 0;
  poppedBubbles.clear();
  visualTutorial.learned = {};
  visualTutorial.key = null;
  visualTutorial.age = 0;
  visualTutorial.movementInputSeen = false;
  resetCycleState(50, 50, 0.65);
  camera.x=player.x-W/2; camera.y=player.y-H/2;
  backgroundFields.length = 0;
  initAmbientLife();
  updateProceduralBacteriaIfNeeded(true);
  bubbleStats = { total: 0, combo: 0, cooldown: 0, energy: 0, popAge: 1 };
  menuButtons.classList.add("hidden");
  menuButton.classList.remove("hidden");
  restartButton.classList.add("hidden");
  setState(State.SEARCH);
}

function makeBacteria(x, y, scale, rotation, variant, health = "healthy", seed = 0, id = null) {
  const infected = id !== null && infectedBacteriaIds.has(id);
  const finalHealth = infected || !isHealthyBacteriaVariant(variant) ? "broken" : health;
  return {
    x,
    y,
    scale,
    rotation: infected ? 0 : rotation,
    variant: infected ? 6 : variant,
    health: finalHealth,
    healthy: finalHealth === "healthy" && isHealthyBacteriaVariant(variant),
    infectable: finalHealth === "healthy" && isHealthyBacteriaVariant(variant) && !infected,
    seed,
    id,
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
  buildDepthSprites();
  buildSilhouetteGlows();
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
  // Paint once: each visible bubble costs one drawImage, without per-frame gradients.
  const bubble = createLayer(128, 128);
  const c = bubble.getContext("2d");
  const fill = c.createRadialGradient(44, 38, 4, 64, 64, 59);
  fill.addColorStop(0, "rgba(215, 252, 255, 0.025)");
  fill.addColorStop(0.8, "rgba(155, 225, 246, 0.035)");
  fill.addColorStop(1, "rgba(180, 244, 255, 0.18)");
  c.fillStyle = fill;
  c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(205, 250, 255, 0.36)"; c.lineWidth = 1.5; c.stroke();
  c.strokeStyle = "rgba(244, 255, 255, 0.65)"; c.lineWidth = 3;
  c.beginPath(); c.arc(64, 64, 51, 3.65, 4.75); c.stroke();
  c.strokeStyle = "rgba(128, 216, 240, 0.25)"; c.lineWidth = 2;
  c.beginPath(); c.arc(64, 64, 53, 0.4, 1.2); c.stroke();
  glowSprites.bubble = bubble;
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
  const cx = Math.floor(player.x / BACTERIA_CELL), cy = Math.floor(player.y / BACTERIA_CELL);
  if (!force && currentProcCell.x === cx && currentProcCell.y === cy) return;
  currentProcCell = { x: cx, y: cy };
  // Retain by actual position, with one-cell hysteresis. IDs reserve displaced
  // bodies' origins while nearby, so regeneration cannot create a second copy.
  const nearby = body => body === targetBacteria || Math.hypot(body.x-player.x,body.y-player.y) <= ACTIVE_RADIUS + BACTERIA_CELL;
  const cells = cellField.filter(nearby), generated = bacteriaField.filter(nearby);
  const retainedIds = new Set([...cells,...generated].map(body=>body.id));
  for (let gx=cx-3;gx<=cx+3;gx++) for(let gy=cy-3;gy<=cy+3;gy++) {
    const id=`${gx}:${gy}`;
    if(retainedIds.has(id)) continue;
    const seed=hash2(gx,gy);
    const x=(gx+.5)*BACTERIA_CELL+(seeded(seed)-.5)*36;
    const y=(gy+.5)*BACTERIA_CELL+(seeded(seed+11)-.5)*36;
    if(Math.hypot(x-player.x,y-player.y)>ACTIVE_RADIUS) continue;
    const kind=worldSlotKind(gx,gy);
    if(kind==='cell') {
      const type=FOREGROUND_CELL_TYPES[(seed>>>3)%FOREGROUND_CELL_TYPES.length];
      const cell=makeWorldCell(type,x,y,seed,id);
      cells.push(cell);
    } else {
      const variant=kind==='healthy'?1:2+(seed%5);
      const cell=makeBacteria(x,y,.74+seeded(seed+23)*.08,-.45+seeded(seed+41)*.9,variant,kind,seed,id);
      generated.push(cell);
    }
  }
  bacteriaField=generated;cellField=cells;
}

function getBacteriaVariant(seed) {
  if (seed % 2 === 0) return 1;
  return 2 + (seed % 5);
}

function isHealthyBacteriaVariant(variant) {
  return variant === 1;
}

function isBacteriaInteractable(bacteria) {
  return Boolean(bacteria?.infectable && bacteria.healthy && isHealthyBacteriaVariant(bacteria.variant));
}

function getPlayerCollisionProbes() {
  return [{offset:-125,r:22},{offset:35,r:18},{offset:155,r:13}].map(p=>({
    ...localToWorld(player.x,player.y,player.rotation,0,p.offset*player.scale),r:p.r,
  }));
}

function registerWorldContact(entity) {
  if((player.contactSoundTimer || 0)<=0) playSound("choque_suave", {volume:0.55});
  player.contactSoundTimer=.35;
  // A pushable body makes contact without forcing the blocked collision pose.
  if(!entity.movable) player.collisionTimer=.35;
  if(entity.kind==='cell' || !isBacteriaInteractable(entity)) {
    if((entity.infoCooldown||0)<=0) {
      toastMessage=entity.kind==='cell'?cellEncounterText(entity):"Bacteria dañada: ya está rota. Busca una bacteria sana compatible.";
      toastTimer=4;entity.infoCooldown=3;
    }
  }
}

function resolveBacteriaPhysics() {
  for(const entity of [...bacteriaField,...cellField]) {
    const key=entity.sprite || `bacteriaOutside${entity.variant}`,shape=collisionShape(key);
    const radius=Math.hypot(shape.width,shape.height)*entity.scale/2+75;
    if(Math.hypot(player.x-entity.x,player.y-entity.y)>radius) continue;
    let touched=false;
    for(let iteration=0;iteration<3;iteration++) {
      let contact=null;
      for(const probe of getPlayerCollisionProbes()) {
        const surface=spriteSurface(entity,probe),penetration=probe.r-surface.distance;
        if(penetration>0 && (!contact || penetration>contact.penetration)) contact={...surface,penetration};
      }
      if(!contact) break;
      const n=contact.normal, inverseMass=entity.movable?1.8:0;
      const correction=Math.min(contact.penetration+.5,90)/(1+inverseMass);
      player.x+=n.x*correction;player.y+=n.y*correction;
      if(entity.movable) {entity.x-=n.x*correction*inverseMass;entity.y-=n.y*correction*inverseMass;}
      const relative=(player.vx-(entity.vx||0))*n.x+(player.vy-(entity.vy||0))*n.y;
      if(relative<0) {
        const impulse=-(1+.35)*relative/(1+inverseMass);
        player.vx+=n.x*impulse;player.vy+=n.y*impulse;
        if(entity.movable) {
          entity.vx-=n.x*impulse*inverseMass;entity.vy-=n.y*impulse*inverseMass;
          const tangent=-n.y*player.vx+n.x*player.vy;
          entity.spin=clamp(entity.spin+tangent*.001,-1.4,1.4);
        }
      }
      touched=true;
    }
    if(touched) registerWorldContact(entity);
  }
}

function updateWorldCells(dt) {
  for(const entity of [...bacteriaField,...cellField]) entity.infoCooldown=Math.max(0,(entity.infoCooldown||0)-dt);
  const bodies=[...bacteriaField,...cellField];
  for(const cell of bodies) {
    if((!cell.movable && !cell.enemyMovable) || cell===targetBacteria) continue;
    const speed=Math.hypot(cell.vx,cell.vy);
    const maxSpeed=cell.movable?240:90;
    if(speed>maxSpeed) {cell.vx*=maxSpeed/speed;cell.vy*=maxSpeed/speed;}
    cell.x+=cell.vx*dt;cell.y+=cell.vy*dt;cell.rotation+=cell.spin*dt;
    const drag=Math.exp(-2.6*dt);cell.vx*=drag;cell.vy*=drag;cell.spin*=drag;
    // Nearby bodies constrain the drifting platelet; no simulation outside the active neighbourhood.
    for(const obstacle of bodies) {
      if(obstacle===cell) continue;
      const ownShape=collisionShape(cell.sprite || `bacteriaOutside${cell.variant}`),otherShape=collisionShape(obstacle.sprite || `bacteriaOutside${obstacle.variant}`);
      if(Math.hypot(cell.x-obstacle.x,cell.y-obstacle.y)>ownShape.radius*cell.scale+otherShape.radius*obstacle.scale+8) continue;
      let surface=null,penetration=0;
      for(const [px,py] of ownShape.points) {
        const point=localToWorld(cell.x,cell.y,cell.rotation,px*cell.scale,py*cell.scale);
        const contact=spriteSurface(obstacle,point),depth=1-contact.distance;
        if(depth>penetration) {surface=contact;penetration=depth;}
      }
      if(!surface) continue;
      const n=surface.normal;
      const inverseOwn=1/worldBodyMass(cell);
      const mayTransfer=gameMode===GameMode.HARD && cell.enemyMovable && canMacrophagePush(obstacle);
      const inverseOther=obstacle!==targetBacteria && (obstacle.movable || mayTransfer)?1/worldBodyMass(obstacle):0;
      const total=inverseOwn+inverseOther, correction=Math.min(penetration+.2,55)/total;
      cell.x+=n.x*correction*inverseOwn;cell.y+=n.y*correction*inverseOwn;
      if(inverseOther) {
        obstacle.x-=n.x*correction*inverseOther;obstacle.y-=n.y*correction*inverseOther;
        if(mayTransfer) obstacle.enemyMovable=true;
        obstacle.vx ||= 0;obstacle.vy ||= 0;obstacle.spin ||= 0;
      }
      const vn=(cell.vx-(obstacle.vx||0))*n.x+(cell.vy-(obstacle.vy||0))*n.y;
      if(vn<0) {
        const impulse=-vn*1.15/total;
        cell.vx+=n.x*impulse*inverseOwn;cell.vy+=n.y*impulse*inverseOwn;
        if(inverseOther) {obstacle.vx-=n.x*impulse*inverseOther;obstacle.vy-=n.y*impulse*inverseOther;}
      }
    }
  }
}

function setState(next) {
  invalidateUi();
  cancelGenericPointer();
  if (next === State.INJECTION && targetBacteria) infectionView = { camera: { ...camera }, rotation: targetBacteria.rotation };
  const previous = state;
  if (![State.SEARCH, State.ADSORPTION, State.INJECTION].includes(next)) infectionPointer = null;
  state = next;
  const soundByState = { [State.ADSORPTION]: "infeccion_acercamiento", [State.NUCLEOTIDE_MINIGAME]: "adn_seleccionar",
    [State.BIOSYNTHESIS]: "adn_secuencia_completa", [State.PART_ASSEMBLY]: "pieza_aparecer",
    [State.LYSIS]: "fagos_objetivo_completo", [State.ESCAPE]: "fago_seguimiento", [State.COMPLETE]: "partida_tiempo_agotado" };
  if (previous !== next && soundByState[next]) playSound(soundByState[next]);
  if (previous === State.INJECTION && next === State.DNA_REPLICATION) { playSound("adn_inyeccion_completa"); playSound("bacteria_entrar", {volume:0.35}); }

  if (next === State.SEARCH && previous !== State.SEARCH) protectFromMacrophages();
  if (next !== State.SEARCH) resetJoystick();
  stateTime = 0;
  if (next !== State.INTRO) menuButtons.classList.add("hidden");
  menuButton.classList.toggle("hidden", next === State.INTRO);
  if (next !== State.COMPLETE) restartButton.classList.add("hidden");
  announceGameState();
}

function loop(time) {
  let dt = Math.min(MAX_FRAME_SECONDS, Math.max(0, (time - lastTime) / 1000 || 0));
  lastTime = time;
  if (isDisplayBlocked() || document.hidden || soundEffects.menuOpen || storyIntroActive) {
    if (!soundEffects.menuOpen) soundEffects.stopAll();
    if (pausedAt === null) pausedAt = performance.now();
    simulationAccumulator = 0;
    clearHeldInputs();
    requestAnimationFrame(loop);
    return;
  }
  if (pausedAt !== null) {
    dt = 0;
    simulationAccumulator = 0;
    pausedAt = null;
  }
  simulationAccumulator += dt;
  while (simulationAccumulator + 1e-9 >= SIMULATION_STEP) {
    simulationAccumulator = Math.max(0,simulationAccumulator-SIMULATION_STEP);
    stateTime += SIMULATION_STEP;
    const actionDown = isActionHeld();
    const actionTaps = pendingActionTaps;
    pendingActionTaps = 0;
    spaceTap = actionTaps > 0 || (actionDown && !spaceWasDown);
    spaceWasDown = actionDown;
    update(SIMULATION_STEP, actionDown, actionTaps);
    updateSoundEffects(actionDown);
    mouse.justDown = false;
    mouse.justUp = false;
  }
  render(dt);
  requestAnimationFrame(loop);
}

let lastSwimStroke = null;
function updateSoundEffects(actionDown) {
  const swim = getPlayerSwimAnimation();
  if (state === State.SEARCH && player.collisionTimer <= 0 && swim.moving) {
    if (lastSwimStroke !== swim.stroke) {
      lastSwimStroke = swim.stroke;
      // One soft water pulse per complete leg cycle; no independent audio loop.
      playSound("fago_nadar", {volume:0.3, duration:0.16, fade:0.015, maxDelay:120});
    }
  } else {
    if (lastSwimStroke !== null) soundEffects.stop?.("fago_nadar");
    lastSwimStroke = null;
  }
  soundEffects.loop("energia_activa", state===State.SEARCH && bubbleStats.energy>0, {volume:0.15});
  soundEffects.loop("adn_inyectar", state===State.INJECTION && actionDown, {volume:0.4});
  soundEffects.loop("biosintesis_proceso", state===State.BIOSYNTHESIS, {volume:0.3});
}

function update(dt, spaceDown, actionTaps = spaceTap ? 1 : 0) {
  if (state === State.GAME_OVER) {
    if (stateTime >= MACROPHAGE.menuSeconds) resetGame();
    return;
  }
  if (state !== State.SEARCH) updateMacrophages(dt);
  worldTime += dt;
  updateAmbientLife(dt);
  updateBubbleEnergy(dt);
  if ([State.DNA_REPLICATION, State.NUCLEOTIDE_MINIGAME, State.BIOSYNTHESIS, State.PART_ASSEMBLY].includes(state)) updateConstructedPhages(dt);
  if (player) {
    player.animTime += dt;
    if (player.collisionTimer > 0) player.collisionTimer = Math.max(0, player.collisionTimer-dt);
    player.contactSoundTimer = Math.max(0, (player.contactSoundTimer || 0)-dt);
  }
  if (gameMode === GameMode.HARD && state !== State.INTRO && state !== State.COMPLETE) {
    hardModeElapsed += dt * 1000;
    if (hardModeElapsed + 1e-6 >= HARD_MODE_DURATION_MS) {
      setState(State.COMPLETE);
      return;
    }
  }
  if (toastTimer > 0) toastTimer -= dt;
  expirePoppedBubbles();
  updateParticles(dt);
  updateVisualTutorial(dt);
  if (replication.messageTimer > 0) replication.messageTimer -= dt;
  if (assembly.messageTimer > 0) assembly.messageTimer -= dt;

  if (state === State.SEARCH) updateSearch(dt);
  if (state === State.ADSORPTION) updateAdsorption(dt, spaceDown);
  if (state === State.INJECTION) updateInjection(dt, spaceDown);
  if (state === State.DNA_REPLICATION) updateDnaReplication(dt);
  if (state === State.NUCLEOTIDE_MINIGAME) updateNucleotideMinigame(dt);
  if (state === State.BIOSYNTHESIS && stateTime >= 3) {
    createPhagePartsFromDna(assembly.pendingDna);
    setState(State.PART_ASSEMBLY);
  }
  if (state === State.PART_ASSEMBLY) updatePartAssembly(dt);
  if (state === State.LYSIS) updateLysis(dt, actionTaps);
  else if (state === State.ESCAPE) updateEscape(dt);
}

function updateSearch(dt) {
  updateProceduralBacteriaIfNeeded();
  updateWorldCells(dt);
  const movement = getMovementInput();
  const boost = bubbleStats.energy > 0 ? ENERGY_SPEED_MULTIPLIER : 1;
  if (movement.mobileActive || movement.simpleActive) {
    player.vx += movement.x * THRUST * boost * dt;
    player.vy += movement.y * THRUST * boost * dt;
    if (Math.hypot(movement.x, movement.y) > 0.05) {
      player.rotation = lerpAngle(player.rotation, Math.atan2(movement.x, -movement.y), frameAlpha(0.18, dt));
    }
  } else {
    if (movement.left) player.rotation -= TURN_SPEED * dt;
    if (movement.right) player.rotation += TURN_SPEED * dt;

    const forward = getForward(player.rotation);
    if (movement.up) {
      player.vx += forward.x * THRUST * boost * dt;
      player.vy += forward.y * THRUST * boost * dt;
    }
    if (movement.down) {
      player.vx -= forward.x * REVERSE_THRUST * boost * dt;
      player.vy -= forward.y * REVERSE_THRUST * boost * dt;
    }
  }

  player.vx *= Math.pow(DRAG, dt * 60);
  player.vy *= Math.pow(DRAG, dt * 60);
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > MAX_SPEED * boost) {
    player.vx = (player.vx / speed) * MAX_SPEED * boost;
    player.vy = (player.vy / speed) * MAX_SPEED * boost;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  resolveBubbleCollisions();
  resolveBacteriaPhysics();
  updateMacrophages(dt);
  if (state !== State.SEARCH) return;

  const previousCandidate = attachCandidate;
  attachCandidate = null;
  let closestDistance = Infinity;
  for (const b of bacteriaField) {
    if (!isBacteriaInteractable(b)) continue;
    const result = canAttachToBacteria(player, b);
    if (result.valid && result.distance < closestDistance) {
      attachCandidate = b;
      closestDistance = result.distance;
    }
  }

  if (attachCandidate && !previousCandidate) playSound("bacteria_disponible", {volume:0.3});
  // A pointer owns one bacterium; dragging across another cannot transfer a hold.
  if (infectionPointer) {
    const b = infectionPointer.bacteria;
    const valid = isBacteriaInteractable(b) && canAttachToBacteria(player, b).valid && infectionPointerHeld();
    infectionPointer.elapsed = valid ? infectionPointer.elapsed + dt : 0;
    if (valid) attachCandidate = b;
  }
  const pointerReady = infectionPointer && infectionPointer.elapsed >= INFECTION_HOLD_SECONDS;
  const keyboardAction = keys.has(" ") || keys.has("Spacebar") || semanticActionKey !== null;
  if (attachCandidate && (pointerReady || keyboardAction)) {
    learnTutorial("infection");
    clearBubbleEnergy();
    targetBacteria = attachCandidate;
    attachPose = getDockPose(player, targetBacteria);
    attachPose.start = { x: player.x, y: player.y, rotation: player.rotation };
    attachTimer = 0;
    player.vx = 0;
    player.vy = 0;
    keys.delete(" ");
    keys.delete("Spacebar");
    setState(State.ADSORPTION);
    return;
  }

  const targetCameraX = player.x - W * 0.5;
  const targetCameraY = player.y - H * 0.5;
  camera.x = lerp(camera.x, targetCameraX, frameAlpha(CAMERA_LERP, dt));
  camera.y = lerp(camera.y, targetCameraY, frameAlpha(CAMERA_LERP, dt));
}

function updateAdsorption(dt, spaceDown) {
  const previousTimer=attachTimer;
  attachTimer = Math.min(DOCK_SECONDS, attachTimer + dt);
  const t = smoothstep(0, DOCK_SECONDS, attachTimer);
  player.x = lerp(attachPose.start.x, attachPose.x, t);
  player.y = lerp(attachPose.start.y, attachPose.y, t);
  player.rotation = lerpAngle(attachPose.start.rotation, attachPose.rotation, t);
  camera.x = lerp(camera.x, targetBacteria.x - W * 0.5, frameAlpha(0.08, dt));
  camera.y = lerp(camera.y, targetBacteria.y - H * 0.52, frameAlpha(0.08, dt));
  if (previousTimer < DOCK_SECONDS && attachTimer >= DOCK_SECONDS) playSound("infeccion_anclaje");
  if (attachTimer >= DOCK_SECONDS && (spaceDown || spaceTap)) setState(State.INJECTION);
}

function updateInjection(dt, spaceDown) {
  const t = smoothstep(0, 0.95, stateTime);
  const zoom = lerp(infectionView.camera.zoom || 1, INTERIOR_SCALE / targetBacteria.scale, t);
  camera.zoom = zoom;
  camera.x = lerp(infectionView.camera.x, targetBacteria.x - W * 0.5 / zoom, t);
  camera.y = lerp(infectionView.camera.y, targetBacteria.y - H * 0.52 / zoom, t);
  if (spaceDown) injectionProgress = clamp(injectionProgress + dt * 0.36, 0, 1);
  if (injectionProgress >= 1) {
    learnTutorial("injection");
    targetBacteria.rotation = 0;
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
}

function updateDnaReplication(dt) {
  for (const dna of replication.dnaPieces) {
    dna.x += dna.vx * dt;
    dna.y += dna.vy * dt;
    dna.rotation += dna.spin * dt;
    dna.vx *= Math.pow(0.985, dt * 60);
    dna.vy *= Math.pow(0.985, dt * 60);
    keepInsideBacteria(dna, 55, dt);
  }
  resolveDnaCollisions();
  if (!mouse.justDown) return;
  const dna = pickDna(mouse.x, mouse.y);
  if (!dna) return;
  activateDna(dna);
}

function activateDna(dna) {
  if (replication.dnaPieces.length < TARGET_DNA && !dna.duplicated) {
    spawnDnaCopy(dna);
    dna.duplicated = true;
    learnTutorial("dna-copy");
    sayReplication(`ADN duplicado ${replication.dnaPieces.length}/${TARGET_DNA}`);
    return;
  }
  if (replication.dnaPieces.length < TARGET_DNA) {
    sayReplication("Elige una copia que aún no se haya duplicado.");
    return;
  }
  if (dna.processed) {
    sayReplication("Ese ADN ya produjo un fago.");
    return;
  }
  learnTutorial("dna-process");
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
  playSound("adn_copiar");
  if (replication.dnaPieces.length===TARGET_DNA) playSound("adn_copias_completas");
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
        learnTutorial("nucleotide");
        matched = true;
        playSound("nucleotido_encajar");
        spawnParticle(slot.x, slot.y, "#9be8ff", 16);
      } else {
        playSound("pieza_no_encaja", {volume:0.4});
        nucleotideGame.message = `Prueba otra vez: coloca ${slot.code} sobre ${slot.code}.`;
        nucleotideGame.messageTimer = 1.2;
      }
      break;
    }
  }
  if (matched && nucleotideGame.slots.every(slot => slot.filled)) {
    nucleotideGame.dna.processed = true;
    assembly.pendingDna = nucleotideGame.dna;
    nucleotideGame = null;
    setState(State.BIOSYNTHESIS);
  }
}

function createPhagePartsFromDna(dna) {
  assembly.returnDelay = 0;
  const baseX = W / 2, baseY = H * 0.52;
  assembly.activeParts = [makePart("head", baseX - 210, baseY - 45), makePart("body", baseX, baseY - 10), makePart("legs", baseX + 210, baseY + 25), makePart("genome", baseX - 190, baseY + 120)];
  assembly.packed = false;
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
  handleDrag(assembly.activeParts.filter(p => !assembly.joining.headBody || p.kind !== "head"), item => trySnapParts(item));
  for (const part of assembly.activeParts) {
    keepInsideBacteria(part, 60, dt);
  }
  if (assembly.activeParts.length === 0) {
    if (assembly.completed >= TARGET_PHAGES) setState(State.LYSIS);
    else if (assembly.returnDelay > 0) {
      assembly.returnDelay -= dt;
      if (assembly.returnDelay <= 0) setState(State.DNA_REPLICATION);
    }
  }
}

function trySnapParts() {
  const head = assembly.activeParts.find(p => p.kind === "head");
  const body = assembly.activeParts.find(p => p.kind === "body");
  const legs = assembly.activeParts.find(p => p.kind === "legs");
  if (!head || !body || !legs) return;

  if (!assembly.packed) {
    const genome = assembly.activeParts.find(p => p.kind === "genome");
    if (genome && Math.hypot(genome.x - head.x, genome.y - head.y) < 90) {
      assembly.packed = true;
      learnTutorial("assembly-genome");
      playSound("adn_empaquetar");
      assembly.activeParts = assembly.activeParts.filter(p => p !== genome);
      spawnParticle(head.x, head.y, "#ffdd69", 20);
      sayAssembly("¡ADN protegido! Ahora une cabeza y cola.");
    } else {
      playSound("pieza_no_encaja", {volume:0.4});
      sayAssembly("Primero arrastra el ADN al interior de la cabeza.");
    }
    return;
  }

  if (!assembly.joining.headBody && Math.hypot(head.x - body.x, head.y - body.y) < 75) {
    assembly.joining.headBody = true;
    learnTutorial("assembly-head");
    playSound("fago_unir_cabeza_cuerpo");
    const cx = (head.x + body.x) / 2;
    const cy = (head.y + body.y) / 2;
    body.x = cx;
    body.y = cy + 13;
    head.x = body.x;
    head.y = body.y - (280 - 103) * ASSEMBLY_PHASE_SCALE;
    spawnParticle(cx, cy, "#9be8ff", 14);
  }

  if (assembly.joining.headBody && !assembly.joining.bodyLegs && Math.hypot(body.x - legs.x, body.y - legs.y) < 85) {
    assembly.joining.bodyLegs = true;
    learnTutorial("assembly-body");
    playSound("fago_unir_fibras");
    completePhageFromParts(body.x + (177 - 170) * ASSEMBLY_PHASE_SCALE, body.y + (234.5 - 280) * ASSEMBLY_PHASE_SCALE);
  } else if (!assembly.joining.headBody && Math.hypot(head.x - legs.x, head.y - legs.y) < 75) {
    playSound("pieza_no_encaja", {volume:0.4});
    sayAssembly("Primero une la cabeza con el cuerpo.");
  }
}

function completePhageFromParts(x, y) {
  playSound("fago_construido");
  assembly.completed += 1;
  assembly.completePhages.push({
    x,
    y,
    vx: rand(-16, 16),
    vy: rand(-10, 10),
    rotation: rand(-0.25, 0.25),
    swimAge: 0,
  });
  assembly.activeParts = [];
  spawnParticle(x, y, "#f6e56e", 30);
  assembly.returnDelay = 0.65;
}

function updateLysis(dt, taps = spaceTap ? 1 : 0) {
  if (!lysisStartedAt) lysisStartedAt = worldTime * 1000;
  if (taps > 0 && !lysis.burst) {
    const previousPressure=lysis.pressure;
    lysis.pressure = clamp(lysis.pressure + 0.105 * taps, 0, 1);
    playSound("lisis_pulsar", {volume:0.5,rate:0.9+lysis.pressure*0.35});
    if (previousPressure<1 && lysis.pressure===1) playSound("lisis_presion_maxima");
    spawnParticle(W * 0.5 + rand(-280, 280), H * 0.5 + rand(-80, 80), "#e9fb79", 8);
  }
  const previousDamage=Math.floor(lysis.damageProgress*5);
  lysis.damageProgress = Math.min(lysis.pressure, lysis.damageProgress + dt * 0.85);
  if (Math.floor(lysis.damageProgress*5)>previousDamage) playSound("lisis_deterioro", {volume:0.4});
  if (lysis.damageProgress >= 1 && !lysis.burst) {
    lysis.burst = true;
    learnTutorial("lysis");
    playSound("bacteria_explotar");
    playSound("fagos_liberar", {volume:0.35});
    lysis.burstStartedAt = worldTime * 1000;
    for (let i = 0; i < 18; i++) {
      const angle = i === 0 ? -0.6 : i * Math.PI * 2 / 17;
      const speed = i === 0 ? 570 : rand(180, 350);
      lysis.released.push({
        x: W * 0.5 + (i === 0 ? 190 : rand(-230, 230)), y: H * 0.52 + rand(-65, 65),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        rotation: angle + Math.PI / 2, hero: i === 0,
      });
    }
    spawnParticle(W * 0.5, H * 0.52, "#d9ef80", 96);
  }
  if (lysis.burst) {
    lysis.burstTime += dt;
    for (const p of lysis.released) { p.x += p.vx * dt; p.y += p.vy * dt; }
    if (lysis.burstTime >= 0.55) beginEscape();
  }
}

function beginEscape() {
  if (!targetBacteria) return;
  const zoom = camera.zoom || 1;
  for (const p of lysis.released) {
    const world = screenToWorld(p.x, p.y);
    p.x = world.x; p.y = world.y; p.vx /= zoom; p.vy /= zoom; p.scale = 0.18 / zoom;
  }
  targetBacteria.variant = 6;
  targetBacteria.health = "broken";
  targetBacteria.healthy = false;
  targetBacteria.infectable = false;
  if (targetBacteria.id !== null) infectedBacteriaIds.add(targetBacteria.id);
  escape = { elapsed: 0, camera: { ...camera }, hero: lysis.released[0], startScale: 0.18 / zoom };
  setState(State.ESCAPE);
  clearHeldInputs();
}

function updateEscape(dt) {
  escape.elapsed = Math.min(ESCAPE_SECONDS, escape.elapsed + dt);
  const t = smoothstep(0, ESCAPE_SECONDS, escape.elapsed);
  for (const p of lysis.released) { p.x += p.vx * dt; p.y += p.vy * dt; }
  const hero = escape.hero;
  hero.scale = lerp(escape.startScale, 0.24, t);
  camera.zoom = lerp(escape.camera.zoom, 1, t);
  camera.x = lerp(escape.camera.x, hero.x - W * 0.5 / camera.zoom, t);
  camera.y = lerp(escape.camera.y, hero.y - H * 0.5 / camera.zoom, t);
  if (escape.elapsed >= ESCAPE_SECONDS) returnToFlightAfterKill();
}

function returnToFlightAfterKill() {
  playSound("ciclo_completo", {volume:0.45});
  const bonus = worldTime * 1000 - lysisStartedAt < 8000 ? 25 : 0;
  score += 100 + bonus;
  kills++;
  const hero = { ...escape.hero }, view = { ...camera }, previousBacteria = bacteriaField;
  resetCycleState(hero.x, hero.y, hero.rotation);
  camera = view;
  bacteriaField = previousBacteria;
  player.vx = hero.vx; player.vy = hero.vy; player.animTime = worldTime;
  updateProceduralBacteriaIfNeeded(true);
  setState(State.SEARCH);
  toastMessage = "¡Ciclo completado! Ahora guías a uno de los nuevos fagos.";
  toastTimer = 3;
}

function drawEscape() {
  drawWorldBacteria();
  const t = smoothstep(0, ESCAPE_SECONDS, escape.elapsed);
  ctx.save(); ctx.scale(camera.zoom, camera.zoom); ctx.translate(-camera.x, -camera.y);
  for (const p of lysis.released) {
    const scale = p.hero ? p.scale : p.scale * (1 - t) ** 1.5;
    if (p.hero) drawGlow(p.x, p.y, "cyan", 0.65);
    drawPhageFrame(p.x, p.y, scale, p.rotation, Math.floor(worldTime * 12) % 3);
  }
  ctx.restore();
}

function handleDrag(items, onDrop) {
  if (mouse.justDown && !dragItem) {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      const radius = item.kind === "nucleotide" ? 68 : item.kind === "legs" ? 70 : 64;
      const joined = state === State.PART_ASSEMBLY && assembly.joining.headBody && item.kind === "body";
      const pickY = joined ? item.y + (160.5 - 280) * ASSEMBLY_PHASE_SCALE : item.y;
      if (hit(mouse, item.x, pickY, radius)) {
        dragItem = item;
        item.dragOrigin = {x:item.x, y:item.y};
        item.dragPartners = state===State.PART_ASSEMBLY && assembly.joining.headBody && ['head','body'].includes(item.kind)
          ? assembly.activeParts.filter(part=>part!==item && ['head','body'].includes(part.kind)).map(part=>({part,x:part.x,y:part.y})) : [];
        item.dragging = true;
        item.grabOffsetX = joined ? item.x - mouse.x : 0;
        item.grabOffsetY = joined ? item.y - mouse.y : 0;
        playSound(item.kind === "nucleotide" ? "nucleotido_tomar" : "pieza_tomar");
        break;
      }
    }
  }
  if (dragItem && mouse.down) {
    const oldX = dragItem.x, oldY = dragItem.y;
    dragItem.x = mouse.x + (dragItem.grabOffsetX || 0);
    dragItem.y = mouse.y + (dragItem.grabOffsetY || 0);
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
      if (assembly.joining.headBody && ["head", "body"].includes(dragItem.kind)) {
        const partner = assembly.activeParts.find(p => p.kind === (dragItem.kind === "head" ? "body" : "head"));
        if (partner) { partner.x += dragItem.x - oldX; partner.y += dragItem.y - oldY; }
      }
    }
  }
  if (dragItem && mouse.justUp) {
    const item = dragItem;
    item.dragging = false;
    delete item.dragOrigin;
    delete item.dragPartners;
    dragItem = null;
    onDrop(item);
    if (item.kind === "nucleotide") {
      item.x = item.ox;
      item.y = item.oy;
    }
    dragItem = null;
  }
}

function render(dt) {
  beginUiFrame();
  ctx.clearRect(0, 0, W, H);
  drawBackground(dt);
  if (state === State.INTRO) drawIntro();
  if (state === State.SEARCH || state === State.ADSORPTION) drawSearchWorld();
  if (![State.INTRO, State.SEARCH, State.ADSORPTION, State.ESCAPE, State.COMPLETE, State.GAME_OVER].includes(state)) drawWorldBacteria(targetBacteria);
  if (state === State.INJECTION) drawInjection();
  if (state === State.DNA_REPLICATION) drawDnaReplication();
  if (state === State.NUCLEOTIDE_MINIGAME) drawNucleotideMinigame();
  if (state === State.BIOSYNTHESIS) drawBiosynthesis();
  if (state === State.PART_ASSEMBLY) drawPartAssembly();
  if (state === State.LYSIS) drawLysis();
  if (state === State.ESCAPE) drawEscape();
  if (state === State.COMPLETE) drawComplete();
  if (state === State.GAME_OVER) drawMacrophageGameOver();
  drawParticles();
  if (state === State.SEARCH && bubbleStats.energy > 0) drawEnergyEffect();
  drawMacrophageEdgeWarning();
  if (stageInfo[state]) drawHud();
  registerMinigameControls();
  syncSemanticControls();
  drawVisualTutorial();
}

function buildDepthSprites() {
  depthSprites.length = 0;
  backgroundFields.length = 0;
  const cache = {};
  const keys = [...Array.from({ length: 8 }, (_, i) => `bg${i + 1}`), ...Array.from({ length: 6 }, (_, i) => `bacteriaOutside${i + 1}`), ...WORLD_SPRITES];
  // Keep the original RGB values. Uniform blue paint cannot reproduce alpha
  // compositing over a changing background, so use the original appearance.
  for (const key of keys) cache[key] = { image: img[key], ratio: 1 };
  for (let frame = 0; frame < 3; frame++) {
    const sprite = createLayer(192, 192), c = sprite.getContext("2d");
    c.drawImage(img.phageSprite, (frame % 2) * 1024, Math.floor(frame / 2) * 1024, 1024, 1024, 0, 0, 192, 192);
    cache[`phage${frame}`] = { image: sprite, ratio: 1024 * 0.458 / 192 };
  }
  // All layers share the same small cache; only their original opacity differs.
  for (const layer of PARALLAX_LAYERS) depthSprites.push(cache);
}

function drawDepthImage(key, x, y, scale, rotation, layer, alpha) {
  const sprite = depthSprites[layer][key];
  const config = PARALLAX_LAYERS[layer];
  ctx.save();
  ctx.globalAlpha = alpha ?? (config.minAlpha + config.maxAlpha) * 0.5;
  drawImageCenter(sprite.image, x, y, scale * sprite.ratio, rotation);
  ctx.restore();
}

function drawBacteriaSkin(key, x, y, scale, rotation) {
  const source = img[key];
  drawImageCenter(source, x, y, scale * BACTERIA_CANVAS_WIDTH / source.width, rotation);
}

function drawCellInterior() {
  drawBacteriaSkin("bacteriaInside", W / 2, H * 0.52, INTERIOR_SCALE, 0);
}

function makeBackgroundCell(layerIndex, gx, gy) {
  const layer = PARALLAX_LAYERS[layerIndex];
  const seed = hash2(gx, gy, 1000 + layerIndex * 97);
  if (seeded(seed) > layer.density) return null;
  const diameter = layer.diameter * lerp(0.93, 1.07, seeded(seed + 17));
  // Each rotated sprite fits in its own cell with a gap to every neighbour.
  // Both scenery and infections use these SAME slots, avoiding duplicate cells.
  const margin = layer.diameter * 1.07 + 24;
  const kind=worldSlotKind(gx,gy,1000+layerIndex*97);
  let key;
  if(kind==='cell') key=cellSprite(FOREGROUND_CELL_TYPES[(seed>>>3)%FOREGROUND_CELL_TYPES.length],seed);
  else if(kind==='healthy') {
    key=seeded(seed+59)<.55 ? `bg${1+seed%2}` : cellSprite(seed%2?'bacilo':'espirilo',seed);
  } else key=`bg${3+seed%6}`;
  return {
    id: `${layerIndex}:${gx}:${gy}`, layer: layerIndex, seed,
    x: gx * layer.cell + margin + seeded(seed + 3) * (layer.cell - 2 * margin),
    y: gy * layer.cell + margin + seeded(seed + 9) * (layer.cell - 2 * margin),
    diameter, rotation: -Math.PI + seeded(seed + 41) * Math.PI * 2,
    alpha: lerp(layer.minAlpha, layer.maxAlpha, seeded(seed + 29)), key, kind,
  };
}

function getBackgroundCells(layerIndex) {
  const layer = PARALLAX_LAYERS[layerIndex];
  const startX = Math.floor(camera.x * layer.factor / layer.cell) - 1;
  const startY = Math.floor(camera.y * layer.factor / layer.cell) - 1;
  const cols = Math.ceil(W / layer.cell) + 3, rows = Math.ceil(H / layer.cell) + 3;
  let field = backgroundFields[layerIndex];
  if (!field || field.startX !== startX || field.startY !== startY || field.cols !== cols || field.rows !== rows) {
    const cells = [];
    for (let gx = startX; gx < startX + cols; gx++) for (let gy = startY; gy < startY + rows; gy++) {
      const cell = makeBackgroundCell(layerIndex, gx, gy);
      if (cell) cells.push(cell);
    }
    field = backgroundFields[layerIndex] = { startX, startY, cols, rows, cells };
  }
  return field.cells;
}

function initAmbientLife() {
  ambientLife = [];
  for (let i = 0; i < AMBIENT_COUNT; i++) ambientLife.push(makeAmbientScene(i, true));
}

function makeAmbientScene(index, initial = false, recycling = false) {
  const layer = index % PARALLAX_LAYERS.length, config = PARALLAX_LAYERS[layer];
  const used = new Set(ambientLife.filter((s, i) => s && i !== index).map(s => s.cellId));
  const cells = getBackgroundCells(layer);
  let candidates = cells.filter(c => c.kind!=="cell" && !c.key.startsWith("cell_") && !used.has(c.id));
  if (recycling) {
    const offscreen = candidates.filter(c => {
      const x = c.x - camera.x * config.factor, y = c.y - camera.y * config.factor, radius = c.diameter / 2;
      return x + radius < 0 || x - radius > W || y + radius < 0 || y - radius > H;
    });
    if (offscreen.length) candidates = offscreen;
  }
  // Prefer an original healthy silhouette for the cell hosting an infection.
  const healthy = candidates.filter(c => c.key === "bg1" || c.key === "bg2");
  const options = healthy.length ? healthy : candidates;
  const centerX = camera.x * config.factor + W / 2, centerY = camera.y * config.factor + H / 2;
  options.sort((a, b) => Math.hypot(a.x - centerX, a.y - centerY) - Math.hypot(b.x - centerX, b.y - centerY));
  const cell = options[Math.min(index % 2, options.length - 1)];
  if(!cell) return null;
  const scene = {
    ...cell, cellId: cell.id, index, time: initial ? (index * 4.7) % 22 : 0,
    duration: 26 + seeded(cell.seed + 71) * 8, phase: "swim", released: [],
    phageScale: cell.diameter / BACTERIA_BODY_WIDTH * 0.42,
  };
  const body = { x: cell.x, y: cell.y, rotation: cell.rotation, rx: cell.diameter * 0.47, ry: cell.diameter * 0.21 };
  const probe = localToWorld(cell.x, cell.y, cell.rotation, 0, cell.diameter);
  scene.dock = getDockPose({ ...probe, scale: scene.phageScale }, body);
  const outward = rotatePoint(0, 1, cell.rotation), tangent = rotatePoint(1, 0, cell.rotation);
  const point = (normal, side) => ({
    x: scene.dock.x + cell.diameter * (outward.x * normal + tangent.x * side),
    y: scene.dock.y + cell.diameter * (outward.y * normal + tangent.y * side),
  });
  scene.path = [point(1.1, -0.6), point(1.3, 0.7), point(0.5, 0), { x: scene.dock.x, y: scene.dock.y }];
  scene.phase = ambientPhase(scene.time);
  return scene;
}

function ambientPhase(time) {
  return time < 5 ? "swim" : time < 7 ? "dock" : time < 19 ? "infected" : time < 22 ? "burst" : "rest";
}

function getAmbientPhagePose(scene, time = scene.time) {
  const t = smoothstep(0, 7, time), u = 1 - t;
  const [a, b, c, d] = scene.path;
  const x = u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x;
  const y = u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y;
  const vx = 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x);
  const vy = 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y);
  const heading = Math.atan2(vx, -vy);
  return { x, y, vx, vy, rotation: time >= 7 ? scene.dock.rotation : lerpAngle(heading, scene.dock.rotation, smoothstep(5, 7, time)) };
}

function updateAmbientLife(dt) {
  for (let i = 0; i < ambientLife.length; i++) {
    let scene = ambientLife[i];
    if(!scene) {ambientLife[i]=makeAmbientScene(i,true);continue;}
    // Rebind only after leaving the cached neighbourhood. The shared slot is
    // never drawn twice, and the pool remains six actors at any camera position.
    if (!getBackgroundCells(scene.layer).some(c => c.id === scene.cellId)) {
      scene = ambientLife[i] = makeAmbientScene(i, true, true);
      if(!scene) continue;
    }
    const previousPhase=scene.phase;
    scene.time += dt;
    if (scene.time >= scene.duration) scene.time %= scene.duration;
    scene.phase = ambientPhase(scene.time);
    const factor=PARALLAX_LAYERS[scene.layer].factor;
    const sx=scene.x-camera.x*factor, sy=scene.y-camera.y*factor;
    if(state===State.SEARCH && sx>0 && sx<W && sy>0 && sy<H && scene.phase!==previousPhase) {
      if(scene.phase==="infected") playSound("fondo_infeccion", {volume:0.08});
      if(scene.phase==="burst") playSound("fondo_explosion", {volume:0.1});
    }
  }
}

function drawBackgroundSlot(key, cell) {
  const layer = PARALLAX_LAYERS[cell.layer], source = img[key];
  let scale;
  if(key.startsWith('cell_')) {
    const shape=collisionShape(key),bounds=shape.bounds;
    const type=WORLD_CELL_TYPES[key.slice(5,-3)];
    const relative=type.movable ? 0.35 : type.diameter/540;
    scale=cell.diameter*relative/Math.max(bounds[2]-bounds[0],bounds[3]-bounds[1]);
  } else scale=key.startsWith('bacteriaOutside')
    ? cell.diameter / BACTERIA_BODY_WIDTH * BACTERIA_CANVAS_WIDTH / source.width
    : cell.diameter / Math.max(source.width, source.height);
  drawDepthImage(key, cell.x - camera.x * layer.factor, cell.y - camera.y * layer.factor, scale, cell.rotation, cell.layer, cell.alpha);
}

function drawAmbientLife(layerIndex) {
  const factor = PARALLAX_LAYERS[layerIndex].factor;
  for (const scene of ambientLife) {
    if (!scene || scene.layer !== layerIndex) continue;
    const damage = scene.time < 7 ? 1 : scene.time < 19 ? Math.min(5, 1 + Math.floor((scene.time - 7) / 2.8)) : 6;
    drawBackgroundSlot(`bacteriaOutside${damage}`, scene);
    if (scene.time < 19) {
      const pose = getAmbientPhagePose(scene);
      const frame = scene.time < 7 ? Math.floor((worldTime + scene.index * 0.23) * 10) % 3 : 0;
      drawDepthImage(`phage${frame}`, pose.x - camera.x * factor, pose.y - camera.y * factor, scene.phageScale, pose.rotation, layerIndex, scene.alpha);
    } else if (scene.phase === "burst") {
      const t = scene.time - 19;
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2 + scene.rotation;
        const vx = Math.cos(angle) * scene.diameter * 0.9, vy = Math.sin(angle) * scene.diameter * 0.9;
        const frame = Math.floor((worldTime + i * 0.2) * 10) % 3;
        drawDepthImage(`phage${frame}`, scene.x - camera.x * factor + vx * t, scene.y - camera.y * factor + vy * t, scene.phageScale, Math.atan2(vx, -vy), layerIndex, scene.alpha * (1 - smoothstep(1.5, 3, t)));
      }
    }
  }
}

function drawBackground(dt) {
  ctx.drawImage(layers.backgroundStatic, 0, 0);
  for (let i = 0; i < PARALLAX_LAYERS.length; i++) {
    drawParallaxLayer(PARALLAX_LAYERS[i], i);
    drawAmbientLife(i);
  }
  drawWorldBubbles();
}

function drawParallaxLayer(layer, layerIndex) {
  for (const cell of getBackgroundCells(layerIndex)) {
    if (ambientLife.some(scene => scene && scene.cellId === cell.id)) continue;
    drawBackgroundSlot(cell.key, cell);
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
        const sprite = glowSprites.bubble;
        const x = gx * layer.cell + seeded(seed + 5) * layer.cell - camX;
        const y = gy * layer.cell + seeded(seed + 13) * layer.cell - camY + Math.sin(worldTime * 0.9 + seed) * 10;
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
        const y = gy * layer.cell + seeded(seed + 13) * layer.cell + Math.sin(worldTime * 0.9 + seed) * 10;
        if (Math.hypot(body.x - x, body.y - y) > size * 0.52 + 36) continue;
        poppedBubbles.set(id, worldTime + 12);
        registerBubblePop();
        player.collisionTimer = 0.16;
        spawnBubblePop(x, y, size);
      }
    }
  }
}

function spawnBubblePop(x, y, size) {
  const count = Math.min(Math.round(clamp(size / 4, 8, 22)), QUALITY.particlesMax);
  if (particles.length + count > QUALITY.particlesMax) particles.splice(0, particles.length + count - QUALITY.particlesMax);
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2), speed = rand(25, 100);
    const life = rand(0.45, 0.9);
    particles.push({
      kind: "bubble", space: "world",
      x: x + Math.cos(angle) * size * 0.12,
      y: y + Math.sin(angle) * size * 0.12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 25,
      life, max: life,
      r: rand(4, Math.max(6, size * 0.16)),
    });
  }
}

function expirePoppedBubbles() {
  if (poppedBubbles.size === 0) return;
  const now = worldTime;
  for (const [id, expiresAt] of poppedBubbles) {
    if (expiresAt <= now) poppedBubbles.delete(id);
  }
}

function drawIntro() {
  drawImageCover(img.introBack, 0, 0, W, H);
  drawImageCenter(img.title, safeCenterX(), safeY(240), 0.56, 0);
}

function worldToScreen(x, y) {
  const zoom = camera.zoom || 1;
  return { x: (x - camera.x) * zoom, y: (y - camera.y) * zoom };
}

function screenToWorld(x, y) {
  const zoom = camera.zoom || 1;
  return { x: camera.x + x / zoom, y: camera.y + y / zoom };
}

function isNearWorldElement(entity) {
  const shape=collisionShape(entity.sprite || `bacteriaOutside${entity.variant}`);
  if(Math.hypot(entity.x-player.x,entity.y-player.y)>Math.hypot(shape.width,shape.height)*entity.scale/2+180) return false;
  return spriteSurface(entity,getPhageBodyPoint(player)).distance<155;
}

function drawWorldBacteria(exclude = null) {
  ctx.save();
  ctx.scale(camera.zoom || 1, camera.zoom || 1);
  ctx.translate(-camera.x, -camera.y);
  for (const b of bacteriaField) {
    if (b === exclude || !isVisibleWorld(b.x, b.y, 720)) continue;
    if (state === State.SEARCH) {
      if (b === attachCandidate) drawSilhouetteGlow("bacteriaOutside1", b.x, b.y, b.scale, b.rotation);
      else if(!isBacteriaInteractable(b) && isNearWorldElement(b)) drawSilhouetteGlow(`bacteriaOutside${b.variant}`, b.x, b.y, b.scale, b.rotation);
    }
    drawBacteriaSkin(`bacteriaOutside${b.variant}`, b.x, b.y, b.scale, b.rotation);
  }
  for(const cell of cellField) {
    if(!isVisibleWorld(cell.x,cell.y,720)) continue;
    if(state===State.SEARCH && isNearWorldElement(cell)) drawSilhouetteGlow(cell.sprite,cell.x,cell.y,cell.scale,cell.rotation);
    drawImageCenter(img[cell.sprite],cell.x,cell.y,cell.scale,cell.rotation);
  }
  ctx.restore();
}

function drawSearchWorld() {
  drawWorldBacteria();
  ctx.save();
  ctx.scale(camera.zoom || 1, camera.zoom || 1);
  ctx.translate(-camera.x, -camera.y);
  drawMapBackdrop();
  drawMacrophages();
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

function getInfectionPose() {
  const t = smoothstep(0, 0.95, stateTime);
  const center = worldToScreen(targetBacteria.x, targetBacteria.y);
  return { ...center, scale: targetBacteria.scale * (camera.zoom || 1), rotation: lerpAngle(infectionView.rotation, 0, t) };
}

function drawInjection() {
  const b = targetBacteria, view = getInfectionPose();
  const reveal = smoothstep(0.12, 0.94, injectionProgress);
  drawBacteriaSkin(`bacteriaOutside${b.variant}`, view.x, view.y, view.scale, view.rotation);
  ctx.save(); ctx.globalAlpha = reveal;
  drawBacteriaSkin("bacteriaInside", view.x, view.y, view.scale, view.rotation);
  ctx.restore();
  const local = worldToLocal(b.x, b.y, infectionView.rotation, attachPose.x, attachPose.y);
  const phagePos = localToWorld(view.x, view.y, view.rotation, local.x * camera.zoom, local.y * camera.zoom);
  const phage = { ...phagePos, rotation: attachPose.rotation + view.rotation - infectionView.rotation, scale: player.scale * camera.zoom };
  const feet = getPhageFeetPoint(phage);
  const axis = normalize({ x: view.x - feet.x, y: view.y - feet.y });
  const settle = smoothstep(0.7, 1, injectionProgress);
  ctx.save(); ctx.globalAlpha = 1 - settle;
  drawPhageFrame(phage.x, phage.y, phage.scale, phage.rotation, 0);
  drawInjectedDna(feet, axis, injectionProgress, Math.hypot(view.x - feet.x, view.y - feet.y));
  ctx.restore();
  ctx.save(); ctx.globalAlpha = settle;
  drawImageCenter(img.dnaComplete, W * 0.52, H * 0.52, 0.38, -0.35);
  ctx.restore();
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
  drawCellInterior();
  for (const dna of replication.dnaPieces) {
    if (dna.processed) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      drawImageCenter(img.dnaComplete, dna.x, dna.y, dna.scale, dna.rotation);
      ctx.restore();
    } else {
      const canDuplicate = replication.dnaPieces.length < TARGET_DNA && !dna.duplicated;
      const canProcess = replication.dnaPieces.length >= TARGET_DNA;
      if (canDuplicate || canProcess) drawSilhouetteGlow("dnaComplete", dna.x, dna.y, dna.scale, dna.rotation);
      drawImageCenter(img.dnaComplete, dna.x, dna.y, dna.scale, dna.rotation);

    }
  }
  drawConstructedPhages();
  const processed = replication.dnaPieces.filter(d => d.processed).length;
  drawCycleStatsSide(processed);
  if (replication.dnaPieces.length < TARGET_DNA) {
    drawTextCentered(mobileControls ? "Toca un ADN para duplicarlo" : "Haz clic en un ADN para duplicarlo", safeCenterX(), safeBottom(0, 38), 30, "#fff", "900");
  } else if (processed < TARGET_DNA) {
    drawTextCentered(mobileControls ? "Toca un ADN brillante para construir un fago" : "Haz clic en un ADN brillante para construir un fago", safeCenterX(), safeBottom(0, 38), 30, "#fff", "900");
  }
  if (replication.messageTimer > 0) drawMinigameHint(replication.message);
}

function drawNucleotideMinigame() {
  const layout = getNucleotideLayout();
  syncNucleotideLayout(layout);
  drawCellInterior();
  for (const dna of replication.dnaPieces) {
    if (!dna.processed) drawImageCenter(img.dnaComplete, dna.x, dna.y, dna.scale * 0.85, dna.rotation);
  }
  drawConstructedPhages();
  ctx.fillStyle = "rgba(3, 17, 27, 0.58)";
  ctx.fillRect(0, 0, W, H);
  drawPanel(layout.panelX, layout.panelY, layout.panelW, layout.panelH, 0.72);
  drawTextCentered(nucleotideGame.messageTimer > 0 ? nucleotideGame.message : "Completa la secuencia del ADN", safeCenterX(), layout.titleY, layout.titleSize, "#fff", "900");
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
  drawTextCentered("Nucleótidos", safeCenterX(), layout.trayTitleY, layout.trayTitleSize, "#fff", "900");
  for (const n of nucleotideGame.nucleotides) drawImageCenter(getNucleotideImage(n.code), n.x, n.y, layout.nucleotideScale, n.dragging ? 0.12 : 0);
}

function getNucleotideLayout() {
  const topReserved = 162;
  const bottomReserved = mobileControls ? 18 : 24;
  const availableTop = safeY(topReserved);
  const availableBottom = safeBottom(0, bottomReserved);
  const availableHeight = Math.max(300, availableBottom - availableTop);
  const compact = availableHeight < 560;
  const panelW = 920;
  const panelX = safeCenterX() - panelW / 2;
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
    trayTitleY: trayY - 12,
    trayTitleSize: compact ? 19 : 24,
    nucGap,
    nucY: trayY + trayH * 0.53,
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
  drawCellInterior();
  ctx.save();
  ctx.globalAlpha = 0.16;
  for (const dna of replication.dnaPieces) {
    if (!dna.processed) drawImageCenter(img.dnaComplete, dna.x, dna.y, dna.scale * 0.8, dna.rotation);
  }
  ctx.restore();
  drawConstructedPhages();
  for (const part of assembly.activeParts) drawPart(part);
  const instruction = assembly.activeParts.length === 0 ? "¡Fago completo!" : !assembly.packed ? "1. Guarda el ADN dentro de la cabeza"
    : !assembly.joining.headBody ? "2. Une la cabeza con la cola" : "3. Arrastra el fago hacia las fibras";
  drawMinigameHint(assembly.messageTimer > 0 ? assembly.message : instruction);
  drawTextCentered("Las proteínas forman las piezas; el ADN lleva las instrucciones.", safeCenterX(), safeBottom(0, 48), 25, "#d7f5ff");
  drawCycleStatsSide(replication.dnaPieces.filter(d => d.processed).length);
}

function drawCycleStatsSide(processedDna) {
  const panelW = 178;
  const panelH = 146;
  const x = safeX(SAFE_MARGIN);
  const y = safeY(SAFE_MARGIN);
  drawPanel(x, y, panelW, panelH, 0.5);
  drawImageCenter(img.dnaIcon, x + 44, y + 48, 0.4, 0);
  drawText(`${replication.dnaPieces.length}/${TARGET_DNA}`, x + 82, y + 57, 26, "#fff", "900");
  drawPhageFrame(x + 45, y + 106, 0.14, -0.1, 0);
  drawText(`${assembly.completed}/${TARGET_PHAGES}`, x + 82, y + 116, 26, "#ffdd69", "900");
  if (processedDna > 0) {
    drawText(`${processedDna}`, x + panelW - 38, y + 58, 18, "#9be8ff", "900");
  }
}

const ASSEMBLY_PHASE_SCALE = 0.3;

function getPartAppearance(part) {
  let key = part.kind === "genome" ? "dnaComplete" : part.kind;
  let scale = part.kind === "genome" ? 0.3 : part.kind === "legs" ? 0.168 : part.kind === "body" ? 0.216 : 0.24;
  let x = part.x, y = part.y;
  if (part.kind === "head" && assembly.packed) {
    if (assembly.joining.headBody) return null;
    key = "phagePhase1"; scale = ASSEMBLY_PHASE_SCALE;
    x += (177 - 170) * scale; y += (234.5 - 103) * scale;
  } else if (part.kind === "body" && assembly.joining.headBody) {
    key = "phagePhase2"; scale = ASSEMBLY_PHASE_SCALE;
    x += (177 - 170) * scale; y += (234.5 - 280) * scale;
  }
  return { key, x, y, scale };
}

function drawPart(part) {
  const appearance = getPartAppearance(part);
  if (!appearance) return;
  const { key, x, y, scale } = appearance;
  const hint = getAssemblyHint();
  const highlight = dragItem?.kind === hint.source ? part.kind === hint.target : !dragItem && part.kind === hint.source;
  const rotation = part.dragging && !key.startsWith("phagePhase") ? 0.12 : 0;
  if (highlight) drawSilhouetteGlow(key, x, y, scale, rotation);
  drawImageCenter(img[key], x, y, scale, rotation);
  if (!assembly.joining.headBody) {
    const label = { head: "Cabeza", body: "Cola", legs: "Fibras", genome: "ADN" }[part.kind];
    drawTextCentered(label, part.x, part.y + 76, 22, "#fff");
  }
}

function drawBiosynthesis() {
  drawCellInterior();
  drawConstructedPhages();
  drawTextCentered("La bacteria se convierte en una fábrica", W / 2, 175, 36, "#fff", "900");
  drawTextCentered("El ADN aporta instrucciones. La maquinaria celular fabrica proteínas.", W / 2, safeBottom(0, 48), 25, "#d7f5ff");
  ctx.save(); ctx.translate((W - 1600) / 2, 0);
  drawImageCenter(img.dnaComplete, 450, 465, 0.45, -0.1);
  drawTextCentered("Instrucciones", 450, 580, 25, "#ffdf7d");
  drawPanel(650, 370, 230, 200, 0.7);
  drawTextCentered("Maquinaria", 765, 440, 29, "#9be8ff");
  drawTextCentered("de la bacteria", 765, 480, 26, "#fff");
  for (let i = 0; i < 7; i++) {
    const t = (stateTime * 0.6 + i / 7) % 1;
    ctx.fillStyle = "#ffdf7d"; ctx.beginPath(); ctx.arc(540 + t * 110, 460 + Math.sin(t * Math.PI * 2) * 14, 5, 0, Math.PI * 2); ctx.fill();
  }
  [img.head, img.body, img.legs].forEach((image, i) => {
    const t = smoothstep(i * 0.6, i * 0.6 + 0.8, stateTime);
    ctx.save(); ctx.globalAlpha = t;
    drawImageCenter(image, 990 + i * 100, 465 - Math.sin(t * Math.PI) * 50, 0.2 * t, 0); ctx.restore();
  });
  drawTextCentered("Piezas de proteína", 1090, 580, 25, "#9be8ff");
  drawProgress(550, safeBottom(24, 90), 500, 24, stateTime / 3, "#62d6bf");
  ctx.restore();
}

function drawLysis() {
  if (!lysis.burst) {
    if (lysis.damageProgress < 0.12) drawCellInterior();
    const damage = getLysisAppearance();
    ctx.save(); ctx.globalAlpha = smoothstep(0, 0.12, lysis.damageProgress);
    drawBacteriaSkin(`bacteriaOutside${damage.stage}`, W / 2, H * 0.52, INTERIOR_SCALE, 0);
    if (damage.blend > 0) {
      ctx.globalAlpha *= damage.blend;
      drawBacteriaSkin(`bacteriaOutside${damage.stage + 1}`, W / 2, H * 0.52, INTERIOR_SCALE, 0);
    }
    ctx.restore();
    LYSIS_PHAGE_LAYOUT.forEach((layout, i) => {
      const from = assembly.completePhages[i] || { x: W * 0.5 + layout.x, y: H * 0.52 + layout.y, rotation: layout.rotation };
      const t = smoothstep(0, 0.65, stateTime);
      const x = lerp(from.x, W * 0.5 + layout.x, t), y = lerp(from.y, H * 0.52 + layout.y, t);
      const rotation = lerpAngle(from.rotation, layout.rotation, t);
      ctx.save(); ctx.globalAlpha = 1 - t;
      drawImageCenter(img.phagePhase3, x, y, ASSEMBLY_PHASE_SCALE, rotation);
      ctx.globalAlpha = t; drawPhageFrame(x, y, 0.18, rotation, 0); ctx.restore();
    });
  } else {
    drawBacteriaSkin("bacteriaOutside6", W * 0.5, H * 0.52, INTERIOR_SCALE, 0);
    for (const p of lysis.released) drawPhageFrame(p.x, p.y, 0.18, p.rotation, Math.floor(worldTime * 12) % 3);
  }
  if (lysis.burst) return;
  drawMinigameHint(mobileControls ? "¡Toca la pantalla para liberar los fagos!" : "¡Haz clic o pulsa ESPACIO para liberar los fagos!");
  drawProgress(safeCenterX() - 295, safeY(152), 590, 28, lysis.pressure, "#f07b58");
}

function drawComplete() {
  drawImageCenter(img.title, safeCenterX(), safeY(170), 0.55, 0);
  const cardW = 960;
  const cardH = 410;
  const cardX = safeCenterX() - cardW / 2;
  const cardY = Math.min(safeY(330), safeBottom(cardH, 92));
  drawPanel(cardX, cardY, cardW, cardH, 0.58);
  drawTextCentered(gameMode === GameMode.HARD ? "Tiempo terminado" : "Infección completada", safeCenterX(), cardY + 90, 48, "#ffdd69", "900");
  const stars = gameMode === GameMode.HARD ? clamp(kills, 0, 3) : 3;
  const startX = safeCenterX() - (stars - 1) * 120;
  for (let i = 0; i < stars; i += 1) drawImageCenter(img.start, startX + i * 120, cardY + 205, 0.34, 0);
  if (gameMode === GameMode.HARD) {
    drawTextCentered(`Puntos: ${score}`, safeCenterX(), cardY + 320, 32, "#fff", "900");
    drawTextCentered(`Bacterias destruidas: ${kills}`, safeCenterX(), cardY + 364, 28, "#d7f5ff", "900");
  } else {
    drawTextCentered("Has completado el ciclo lítico:", safeCenterX(), cardY + 320, 28, "#fff", "800");
    drawTextCentered("adsorción, inyeccion, replicación, nucleótidos, ensamblaje y lisis.", safeCenterX(), cardY + 364, 26, "#d7f5ff", "800");
  }
  restartButton.classList.remove("hidden");
}

function drawHud() {
  const [name, stage, objective] = getStageInfo();
  let instruction = objective;
  if (state === State.SEARCH) instruction = "Acércate y mantén pulsada una bacteria sana brillante para adherirte.";
  if (state === State.SEARCH && mobileControls) instruction = attachCandidate
    ? "Mantén el dedo sobre la bacteria para adherirte."
    : "Toca y desliza para moverte. Busca una bacteria brillante.";
  if (state === State.ADSORPTION && attachTimer < DOCK_SECONDS) instruction = "El fago se está posando sobre la bacteria…";
  if (state === State.PART_ASSEMBLY) instruction = "Guarda el ADN y ensambla las piezas.";
  if (state === State.LYSIS) instruction = mobileControls
    ? "¡Toca muchas veces! La barra no retrocede."
    : "¡Pulsa muchas veces! La barra no retrocede.";
  const objectiveText = instruction;
  const objectiveX = safeX(SAFE_MARGIN);
  const objectiveY = safeY(SAFE_MARGIN);
  if (![State.DNA_REPLICATION, State.NUCLEOTIDE_MINIGAME, State.BIOSYNTHESIS, State.PART_ASSEMBLY].includes(state)) {
    const objectiveWidth = 340;
    const objectiveTextWidth = objectiveWidth - 40;
    const objectiveLineHeight = 22;
    const objectiveTextY = 75;
    const objectiveLines = wrapTextLines(objectiveText, objectiveTextWidth, "800 21px Nunito, sans-serif");
    const objectiveHeight = Math.max(132, objectiveTextY + (objectiveLines.length - 1) * objectiveLineHeight + 20);
    drawPanel(objectiveX, objectiveY, objectiveWidth, objectiveHeight, 0.48);
    drawTextCentered("Objetivo", objectiveX + objectiveWidth / 2, objectiveY + 38, 22, "#fff", "900");
    drawWrappedTextCentered(objectiveLines, objectiveX + objectiveWidth / 2, objectiveY + objectiveTextY, objectiveLineHeight, "#fff", "800 21px Nunito, sans-serif");
  }
  drawStageIcons(stage, name);
  if (gameMode === GameMode.HARD) drawHardModeHud();
  if (state === State.SEARCH) drawBubbleMultiplier();
  if (state === State.SEARCH && !attachCandidate) {
    const nearest = bacteriaField.filter(isBacteriaInteractable).reduce((best, b) => !best || Math.hypot(b.x - player.x, b.y - player.y) < Math.hypot(best.x - player.x, best.y - player.y) ? b : best, null);
    if (nearest) {
      const y = safeBottom(0, 48);
      drawPanel(safeCenterX() - 85, y - 50, 170, 70, 0.5);
      drawBacteriaSkin("bacteriaOutside1", safeCenterX()-27, y-15, 0.085, 0);
      drawImageCenter(img.arrow, safeCenterX()+48, y-15, 0.3, Math.atan2(nearest.y-player.y,nearest.x-player.x));
    }
  }
  if (toastTimer > 0) {
    if ([State.DNA_REPLICATION, State.PART_ASSEMBLY, State.BIOSYNTHESIS].includes(state)) drawMinigameHint(toastMessage);
    else if (state !== State.NUCLEOTIDE_MINIGAME) drawTopToast(toastMessage);
  }

  if ([State.SEARCH, State.ADSORPTION, State.INJECTION].includes(state)) drawInfectionControl();
  if (state === State.SEARCH && !mobileControls) drawDesktopMovementCard();
}

function drawHardModeHud() {
  const remaining = Math.max(0, HARD_MODE_DURATION_MS - hardModeElapsed);
  const seconds = Math.ceil(remaining / 1000);
  const minutesText = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const x = safeRight(240, SAFE_MARGIN);
  const y = safeY(120);
  drawImageCenter(img.bg7, x + 28, y + 32, 0.19, 0);
  drawText(`${score}`, x + 65, y + 43, 36, "#ffdd69", "900");
  drawImageCenter(img.clock, x + 28, y + 90, 0.09, 0);
  drawText(minutesText, x + 65, y + 101, 36, "#fff", "900");
}

function drawStageIcons(activeStage, stageName) {
  const icons=[img.stage0,img.stage1,img.stage2,img.stage3,img.stage4,img.stage5];
  const sizes=icons.map((icon,i)=>({scale:i+1===activeStage ? 0.25 : 0.105,width:icon.width*(i+1===activeStage ? 0.25 : 0.105)}));
  const total=sizes.reduce((n,item)=>n+item.width,0)+5*12;
  let cursor=safeCenterX()-total/2;
  for(let i=0;i<icons.length;i++) {
    const size=sizes[i],x=cursor+size.width/2,y=safeY(56);
    ctx.save();ctx.globalAlpha=i+1<=activeStage?1:.42;
    if(i+1===activeStage) drawGlow(x,y,'green',.34);
    drawImageCenter(icons[i],x,y,size.scale,0);ctx.restore();cursor+=size.width+12;
  }
  drawTextCentered(stageName,safeCenterX(),safeY(141),34,'#fff','900');
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

function actionPromptText() {
  if (state === State.SEARCH) return 'Adherirse a la bacteria';
  if (state === State.ADSORPTION && attachTimer < DOCK_SECONDS) return 'Adhiriéndose a la bacteria…';
  if (state === State.ADSORPTION) return mobileControls ? 'Toca para iniciar la inyección' : 'Pulsa para iniciar la inyección';
  return 'Mantén pulsado para inyectar ADN';
}

function drawActionPrompt(text) {
  const w = mobileControls ? 520 : 560;
  const x = safeCenterX() - w / 2;
  const y = safeBottom(70, SAFE_MARGIN + 18);
  const pulse = (Math.sin(worldTime * 4) + 1) / 2;
  ctx.save();
  ctx.shadowColor = "#ffdd69";
  ctx.shadowBlur = 12 + pulse * 18;
  drawPanel(x, y, w, 70, touchControls.actionDown ? 0.88 : 0.65);
  ctx.strokeStyle = `rgba(255, 221, 105, ${0.5 + pulse * 0.45})`;
  ctx.lineWidth = 2;
  roundedRect(x, y, w, 70, 20);
  ctx.stroke();
  ctx.restore();
  drawTextCentered(text, x + w / 2, y + 43, 26, "#ffdd69", "900");
  registerUiButton("action", x, y, w, 70, () => {});
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

function drawMinigameHint(text) {
  // The cell ends around y=742; these two footer lines stay outside it.
  drawTextCentered(text, safeCenterX(), safeBottom(0, 100), 30, "#fff8d9", "900");
}

function gameFont(size, weight = "700") {
  return Number(weight) >= 900 ? `400 ${size}px "Lilita One", sans-serif` : `${weight} ${size}px Nunito, sans-serif`;
}

function drawToast(text, y = safeY(170)) {
  const x = safeCenterX() - 300;
  drawPanel(x, y, 600, 72, 0.72);
  wrapTextCentered(text, x + 300, y + 30, 550, 24, "#fff");
}

function getPlayerSwimAnimation() {
  const movement = getMovementInput();
  const thrust = movement.mobileActive || movement.simpleActive || movement.up || movement.down || movement.left || movement.right;
  const moving = Boolean(thrust || Math.hypot(player.vx, player.vy) > 30);
  const tick = Math.floor(player.animTime * 12);
  return { moving, frame: tick % 3, stroke: Math.floor(tick / 3) };
}

function getPlayerFrameIndex() {
  if (state === State.ADSORPTION || state === State.INJECTION) return 0;
  if (player.collisionTimer > 0) return 3;
  const swim = getPlayerSwimAnimation();
  if (swim.moving) return swim.frame;
  return [0, 2][Math.floor(player.animTime * 4) % 2];
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
  ctx.font = gameFont(size, "900");
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
  ctx.font = gameFont(size, weight);
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
  ctx.font = gameFont(size, weight);
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
  ctx.font = '800 23px Nunito, sans-serif';
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
  const font = "800 21px Nunito, sans-serif";
  const lines = wrapTextLines(text, maxWidth, font);
  drawWrappedTextCentered(lines, x, y, lineHeight, color, font);
  return lines.length;
}

function wrapTextLines(text, maxWidth, font) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  ctx.save();
  ctx.font = font;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.restore();
  return lines;
}

function drawWrappedTextCentered(lines, x, y, lineHeight, color, font) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(4, 20, 34, 0.65)";
  ctx.lineWidth = 3;
  lines.forEach((line, index) => {
    const lineY = y + index * lineHeight;
    ctx.strokeText(line, x, lineY);
    ctx.fillText(line, x, lineY);
  });
  ctx.restore();
}

function drawTopToast(text) {
  const width=Math.min(740,W-64), x=safeCenterX()-width/2, y=safeY(180);
  drawPanel(x,y,width,104,.72);
  wrapTextCentered(text,safeCenterX(),y+30,width-40,25,"#fff8d9");
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

function keepInsideBacteria(obj, radius = 55, dt = 1/60) {
  const center = { x: W * 0.5, y: H * 0.52 };
  const dx = obj.x - center.x;
  const dy = obj.y - center.y;
  const rx = 470 - radius;
  const ry = 210 - radius;
  const value = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
  if (value > 1) {
    obj.x -= dx * frameAlpha(0.025, dt);
    obj.y -= dy * frameAlpha(0.025, dt);
    if (obj.vx !== undefined) obj.vx *= -0.25;
    if (obj.vy !== undefined) obj.vy *= -0.25;
  }
}

function canAttachToBacteria(phage, bacteria) {
  if (Math.hypot(phage.x - bacteria.x, phage.y - bacteria.y) > Math.max(bacteria.rx, bacteria.ry) + INFECTION_REACH) return { valid: false, distance: Infinity };
  const contact = closestBacteriaSurface(phage, bacteria);
  return { valid: contact.distance <= INFECTION_REACH, distance: contact.distance };
}

function clearBubbleEnergy() {
  if (bubbleStats.energy>0) playSound("energia_terminar", {volume:0.35});
  bubbleStats.combo = 0; bubbleStats.cooldown = 0; bubbleStats.energy = 0;
}

function registerBubblePop() {
  const wasActive=bubbleStats.energy>0;
  bubbleStats.total++;
  bubbleStats.popAge = 0;
  bubbleStats.combo = bubbleStats.energy > 0 ? 10 : bubbleStats.cooldown > 0 ? Math.min(10, bubbleStats.combo + 1) : 1;
  bubbleStats.cooldown = BUBBLE_COMBO_WINDOW;
  if (bubbleStats.energy > 0 || bubbleStats.combo >= 10) bubbleStats.energy = ENERGY_SECONDS;
  playSound("burbuja_explotar", {volume:0.25});
  if (bubbleStats.energy>0) playSound(wasActive ? "energia_renovar" : "energia_activar", {volume:0.45});
}

function updateBubbleEnergy(dt) {
  if (state !== State.SEARCH) return;
  const hadEnergy=bubbleStats.energy>0, hadCombo=bubbleStats.combo>0;
  bubbleStats.popAge += dt;
  bubbleStats.cooldown = Math.max(0, bubbleStats.cooldown - dt);
  bubbleStats.energy = Math.max(0, bubbleStats.energy - dt);
  if (bubbleStats.cooldown === 0 && bubbleStats.energy === 0) bubbleStats.combo = 0;
  if(hadEnergy && bubbleStats.energy===0) playSound("energia_terminar", {volume:0.35});
  else if(hadCombo && bubbleStats.combo===0) playSound("burbuja_racha_fin", {volume:0.2});
}

function getBubbleMultiplierVisual() {
  const count = Math.min(10, bubbleStats.combo);
  const age = bubbleStats.popAge;
  const anchor = worldToScreen(player.x, player.y);
  return { count, x: anchor.x, y: anchor.y - 115,
    alpha: clamp(1 - age / 0.5, 0, 1),
    size: (40 + count * 4) * (1 + 0.2 * Math.sin(clamp(age / 0.18, 0, 1) * Math.PI)) };
}

function drawBubbleMultiplier() {
  const v = getBubbleMultiplierVisual();
  if (!v.count || v.alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = v.alpha;
  ctx.textAlign = "center";
  ctx.font = `400 ${v.size}px "Lilita One", sans-serif`;
  ctx.lineJoin = "round";
  const text = `×${v.count}`;
  ctx.lineWidth = 8; ctx.strokeStyle = "#74330a";
  ctx.strokeText(text, v.x, v.y + 5);
  ctx.fillStyle = "#c86806"; ctx.fillText(text, v.x, v.y + 5);
  const gold = ctx.createLinearGradient(0, v.y - v.size, 0, v.y);
  gold.addColorStop(0, "#fffda5"); gold.addColorStop(0.45, "#ffe941"); gold.addColorStop(1, "#ffb516");
  ctx.lineWidth = 3; ctx.strokeStyle = "#fff080";
  ctx.strokeText(text, v.x, v.y); ctx.fillStyle = gold; ctx.fillText(text, v.x, v.y);
  ctx.restore();
}

function drawEnergyEffect() {
  ctx.save();
  ctx.globalAlpha = Math.min(1, bubbleStats.energy) * (0.8 + 0.12 * Math.sin(worldTime * 3));
  ctx.drawImage(layers.energyVignette, 0, 0, W, H);
  ctx.strokeStyle = "rgba(152, 255, 235, 0.4)"; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const y = (worldTime * 190 + i * H / 8) % H;
    const x = i % 2 ? W - 25 : 25;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (i % 2 ? -17 : 17), y - 35); ctx.stroke();
  }
  ctx.restore();
}

function buildSilhouetteGlows() {
  for (const key of ["macrofago_idle", "macrofago_reach", "macrofago_closed", "head", "body", "legs", "dnaComplete", "bacteriaOutside1", "phagePhase1", "phagePhase2", ...Array.from({length:5},(_,i)=>`bacteriaOutside${i+2}`), ...WORLD_SPRITES]) {
    const source = img[key], ratio = Math.min(1, 384 / Math.max(source.width, source.height));
    const mask = createLayer(Math.ceil(source.width * ratio), Math.ceil(source.height * ratio));
    const m = mask.getContext("2d"); m.drawImage(source, 0, 0, mask.width, mask.height);
    m.globalCompositeOperation = "source-in"; m.fillStyle = key.startsWith('macrofago_') || key.startsWith('cell_') || /^bacteriaOutside[2-6]$/.test(key) ? '#ff6868' : '#ffe998'; m.fillRect(0, 0, mask.width, mask.height);
    silhouetteGlows[key] = { mask, sourceWidth: source.width, sourceHeight: source.height, color: key.startsWith("macrofago_") || key.startsWith("cell_") || /^bacteriaOutside[2-6]$/.test(key) ? "#ff3535" : "#ffd95a", cached: null };
  }
  layers.energyVignette = createLayer(320, 180);
  const c = layers.energyVignette.getContext("2d");
  const g = c.createRadialGradient(160, 90, 40, 160, 90, 180);
  g.addColorStop(0, "rgba(88,255,219,0)"); g.addColorStop(0.6, "rgba(88,255,219,0.015)"); g.addColorStop(1, "rgba(88,255,219,0.3)");
  c.fillStyle = g; c.fillRect(0, 0, 320, 180);
}

// Build halos in CSS pixels so their thickness is independent of sprite size,
// camera zoom and the canvas display scale. Keep a small bounded cache per asset.
function getScreenGlow(glow, width, height) {
  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));
  if (glow.cached?.width === width && glow.cached?.height === height) return glow.cached;
  glow.rasters ||= new Map();
  const cacheKey=`${width}:${height}`;
  if(glow.rasters.has(cacheKey)) return glow.cached=glow.rasters.get(cacheKey);
  const padding = 40;
  const image = createLayer(width + padding * 2, height + padding * 2);
  const c = image.getContext("2d");
  c.shadowColor = glow.color || "#ffd95a";
  c.shadowBlur = 12;
  const offsets=glow.color==='#ff3535' ? [[-4,0],[4,0],[0,-4],[0,4],[0,0]] : [[-2,0],[0,0],[2,0]];
  for (const [ox,oy] of offsets) c.drawImage(glow.mask, padding+ox, padding+oy, width, height);
  glow.cached = { image, width, height };
  if(glow.rasters.size>=4) glow.rasters.delete(glow.rasters.keys().next().value);
  glow.rasters.set(cacheKey,glow.cached);
  return glow.cached;
}

function drawSilhouetteGlow(key, x, y, scale, rotation = 0, strength = 1) {
  const glow = silhouetteGlows[key];
  if (!glow) return;
  const transform = ctx.getTransform();
  const displayScale = getCanvasTransform().scale;
  const zoom = Math.hypot(transform.a, transform.b);
  const raster = getScreenGlow(glow, glow.sourceWidth * scale * zoom * displayScale, glow.sourceHeight * scale * zoom * displayScale);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, transform.a * x + transform.c * y + transform.e, transform.b * x + transform.d * y + transform.f);
  ctx.rotate(rotation + Math.atan2(transform.b, transform.a));
  ctx.scale(1 / displayScale, 1 / displayScale);
  ctx.globalAlpha *= strength * ((glow.color==='#ff3535' ? 0.6 : 0.35) + (glow.color==='#ff3535' ? 0.35 : 0.5) * ((Math.cos(worldTime * 4) + 1) / 2) ** 2);
  ctx.drawImage(raster.image, -raster.image.width / 2, -raster.image.height / 2);
  ctx.restore();
}

function getAssemblyHint() {
  if (!assembly.packed) return { source: "genome", target: "head" };
  if (!assembly.joining.headBody) return { source: "head", target: "body" };
  return { source: "body", target: "legs" };
}

function updateConstructedPhages(dt) {
  const phages = assembly.completePhages;
  phages.forEach((p, i) => {
    p.swimAge = (p.swimAge || 0) + dt;
    const angle = worldTime * 0.22 + i * Math.PI * 2 / TARGET_PHAGES;
    const target = { x: W / 2 + Math.cos(angle) * 320, y: H * 0.52 + Math.sin(angle) * 125 };
    const v = normalize({ x: target.x - p.x, y: target.y - p.y });
    const mix = 1 - Math.exp(-dt * 1.6);
    p.vx = lerp(p.vx, v.x * 65, mix); p.vy = lerp(p.vy, v.y * 65, mix);
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (Math.hypot(p.vx, p.vy) > 1) p.rotation = lerpAngle(p.rotation, Math.atan2(p.vx, -p.vy), mix);
  });
  for (let i = 0; i < phages.length; i++) for (let j = i + 1; j < phages.length; j++) {
    const a = phages[i], b = phages[j];
    const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
    if (distance < 85) {
      const n = distance > 0.001 ? { x: dx / distance, y: dy / distance } : { x: Math.cos(j), y: Math.sin(j) };
      const push = (85 - distance) * 0.5;
      a.x -= n.x * push; a.y -= n.y * push; b.x += n.x * push; b.y += n.y * push;
    }
  }
  for (const p of phages) {
    const dx = p.x - W / 2, dy = p.y - H * 0.52, value = Math.hypot(dx / 410, dy / 155);
    if (value > 1) { p.x = W / 2 + dx / value; p.y = H * 0.52 + dy / value; }
  }
}

function drawConstructedPhages() {
  assembly.completePhages.forEach((p, i) => {
    const t = smoothstep(0, 0.2, p.swimAge ?? 1);
    ctx.save();
    if (t < 1) {
      ctx.globalAlpha = 1 - t;
      drawImageCenter(img.phagePhase3, p.x, p.y, ASSEMBLY_PHASE_SCALE, p.rotation);
    }
    if (t > 0) {
      ctx.globalAlpha = t;
      drawPhageFrame(p.x, p.y, ASSEMBLY_PHASE_SCALE, p.rotation, Math.floor((worldTime + i * 0.17) * 12) % 3);
    }
    ctx.restore();
  });
}

function getLysisAppearance() {
  const progress = Math.min(4.9999, lysis.damageProgress * 5);
  const stage = 1 + Math.floor(progress);
  return { stage, blend: stage < 5 ? progress % 1 : 0 };
}

function closestBacteriaSurface(phage, bacteria) {
  const p = worldToLocal(bacteria.x, bacteria.y, bacteria.rotation, phage.x, phage.y);
  // Coarse global search plus local refinement avoids unstable ellipse projection
  // when the phage approaches either narrow end of a rotated bacterium.
  const distanceAt = a => (bacteria.rx * Math.cos(a) - p.x) ** 2 + (bacteria.ry * Math.sin(a) - p.y) ** 2;
  let angle = 0;
  let best = Infinity;
  const step = Math.PI * 2 / 32;
  for (let i = 0; i < 32; i++) {
    const d = distanceAt(i * step);
    if (d < best) { best = d; angle = i * step; }
  }
  let lo = angle - step, hi = angle + step;
  for (let i = 0; i < 14; i++) {
    const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3;
    if (distanceAt(a) < distanceAt(b)) hi = b;
    else lo = a;
  }
  angle = (lo + hi) / 2;
  const local = { x: bacteria.rx * Math.cos(angle), y: bacteria.ry * Math.sin(angle) };
  const world = localToWorld(bacteria.x, bacteria.y, bacteria.rotation, local.x, local.y);
  const normal = rotatePoint(local.x / (bacteria.rx * bacteria.rx), local.y / (bacteria.ry * bacteria.ry), bacteria.rotation);
  const inside = (p.x / bacteria.rx) ** 2 + (p.y / bacteria.ry) ** 2 < 1;
  return { ...world, normal: normalize(normal), distance: inside ? 0 : Math.hypot(world.x - phage.x, world.y - phage.y) };
}

function getDockPose(phage, bacteria) {
  const surface = closestBacteriaSurface(phage, bacteria);
  const rotation = Math.atan2(surface.normal.x, -surface.normal.y);
  const feetOffset = rotatePoint(0, 168 * phage.scale, rotation);
  return { x: surface.x - feetOffset.x, y: surface.y - feetOffset.y, rotation, feet: { x: surface.x, y: surface.y }, bacteria };
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
  // Stable throughout a run, including revisits and returns from an infection.
  let h = (x * 374761393 + y * 668265263 + salt * 1442695041) ^ worldSeed;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

function seeded(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function spawnParticle(x, y, color, count) {
  count = Math.min(count, QUALITY.particlesMax);
  if (particles.length + count > QUALITY.particlesMax) particles.splice(0, particles.length + count - QUALITY.particlesMax);
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
    p.vx *= Math.pow(0.96, dt * 60);
    p.vy *= Math.pow(0.96, dt * 60);
    return p.life > 0;
  });
}

function drawParticles() {
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    if (p.kind === "bubble") {
      if (![State.SEARCH, State.ADSORPTION, State.ESCAPE].includes(state)) continue;
      const point = worldToScreen(p.x, p.y);
      const radius = p.r * (camera.zoom || 1);
      if (point.x + radius < 0 || point.x - radius > W || point.y + radius < 0 || point.y - radius > H) continue;
      ctx.drawImage(glowSprites.bubble, point.x - radius, point.y - radius, radius * 2, radius * 2);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
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
  const scale = Math.min(rect.width / W, rect.height / H);
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

function requiresFullscreen() {
  const root = document.documentElement;
  const supported = Boolean(root?.requestFullscreen || root?.webkitRequestFullscreen);
  return mobileControls && supported && !fullscreenDeclined && !document.fullscreenElement && !document.webkitFullscreenElement;
}

function isDisplayBlocked() {
  return !landscapeReady || requiresFullscreen();
}

function resizeCanvasToViewport() {
  const previousW = W;
  landscapeReady = window.innerWidth >= window.innerHeight;
  mobileControls = isMobileControls();
  if (landscapeReady) W = Math.round(H * window.innerWidth / window.innerHeight);
  const shift = (W - previousW) / 2;
  if (shift && player) {
    camera.x -= shift / (camera.zoom || 1);
    if (infectionView) infectionView.camera.x -= shift / (infectionView.camera.zoom || 1);
    if (escape) escape.camera.x -= shift / (escape.camera.zoom || 1);
    for (const list of [replication.dnaPieces, assembly.activeParts, assembly.completePhages]) for (const item of list) {
      item.x += shift; if (item.ox !== undefined) item.ox += shift;
    }
    if (state === State.LYSIS) for (const p of lysis.released) p.x += shift;
    clearHeldInputs();
  }
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`;
  playfield.style.width = `${window.innerWidth}px`; playfield.style.height = `${window.innerHeight}px`;
  playfield.style.left = "0px"; playfield.style.top = "0px";
  canvas.style.left = "0px"; canvas.style.top = "0px";
  if (shift && img.noise) {
    layers.backgroundStatic = createLayer(); buildStaticBackgroundLayer(); backgroundFields.length = 0;
  }
  const blocked = isDisplayBlocked();
  rotateNotice.classList.toggle("hidden", !blocked);
  rotateNotice.classList.toggle("portrait-mobile", mobileControls && !landscapeReady);
  document.getElementById("orientationTitle").textContent = landscapeReady ? "Pantalla completa" : "Gira tu pantalla";
  document.getElementById("orientationMessage").textContent = landscapeReady
    ? "Toca el botón para jugar a pantalla completa. Tu partida te espera."
    : "Toca el icono y gira tu dispositivo para jugar en horizontal.";
  fullscreenButton.classList.toggle("hidden", Boolean(document.fullscreenElement || document.webkitFullscreenElement));
  if (blocked) {
    clearHeldInputs(); if (pausedAt === null) pausedAt = performance.now();
  }
  updateViewportSafeArea();
  invalidateUi();
}

function updateViewportSafeArea() {
  const probe = document.getElementById('safeAreaProbe');
  const style = window.getComputedStyle?.(probe);
  const sx = W/window.innerWidth, sy = H/window.innerHeight;
  const left = (parseFloat(style?.paddingLeft)||0)*sx, top = (parseFloat(style?.paddingTop)||0)*sy;
  const right = W-(parseFloat(style?.paddingRight)||0)*sx, bottom = H-(parseFloat(style?.paddingBottom)||0)*sy;
  viewportSafe = {left,top,right,bottom,width:right-left,height:bottom-top,cx:(left+right)/2,cy:(top+bottom)/2};
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
  semanticFrame.length = 0;
}

function registerUiButton(id, x, y, w, h, onClick) {
  uiButtons.push({ id, x, y, w, h, onClick, state });
  const label = id === 'action' ? actionPromptText() : id === 'movement-mode' ? `Cambiar movimiento. Modo ${desktopMovementMode===DesktopMovementMode.SIMPLE?'simple':'normal'}` : 'Volver al menú';
  registerSemanticControl(id, x, y, w, h, label, onClick);
}

function handleUiPointerDown(p, pointerId) {
  for (let i = uiButtons.length - 1; i >= 0; i -= 1) {
    const button = uiButtons[i];
    if (button.state !== state) continue;
    if (p.x < button.x || p.x > button.x + button.w || p.y < button.y || p.y > button.y + button.h) continue;
    if (button.id === "action") {
      if (touchControls.actionPointerId !== null) return true;
      touchControls.actionPointerId = pointerId;
      touchControls.actionDown = true;
      pendingActionTaps++;
    }
    button.onClick();
    return true;
  }
  return false;
}

function handleMobileControlPointerDown(p, pointerId) {
  if (state !== State.SEARCH) return false;
  const joy = touchControls.joystick;
  // The first finger owns movement until release; other fingers can use actions.
  if (joy.active) return true;
  joy.active = true;
  joy.pointerId = pointerId;
  joy.cx = p.x;
  joy.cy = p.y;
  updateJoystickFromPoint(p);
  return true;
}

function releaseControlPointer(pointerId) {
  if (infectionPointer?.id === pointerId) { infectionPointer = null; return true; }
  if (touchControls.joystick.pointerId === pointerId) {
    resetJoystick();
    return true;
  }
  if (touchControls.actionPointerId === pointerId) {
    touchControls.actionPointerId = null;
    touchControls.actionDown = false;
    return true;
  }
  return false;
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
  infectionPointer = null;
  resetJoystick();
  touchControls.actionDown = false;
  touchControls.actionPointerId = null;
}

function getMovementInput() {
  const joy = touchControls.joystick;
  const joyLen = Math.hypot(joy.dx, joy.dy);
  if (joy.active && joyLen > 10) {
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

function showDisplayNotice(message) {
  clearTimeout(displayNoticeTimeout);
  displayNotice.textContent = message;
  document.getElementById("rotateStatus").textContent = message;
  displayNotice.classList.remove("hidden");
  displayNoticeTimeout = setTimeout(() => displayNotice.classList.add("hidden"), 4500);
}

async function toggleFullscreen({ requestLandscape = false } = {}) {
  try {
    const alreadyFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    if (alreadyFullscreen && !requestLandscape) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else document.webkitExitFullscreen?.();
    } else if (!alreadyFullscreen) {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
      else { showDisplayNotice("Este navegador no ofrece pantalla completa. Puedes jugar en horizontal."); return; }
      fullscreenDeclined = false;
    }
    if (requestLandscape || !alreadyFullscreen) {
      fullscreenDeclined = false;
      try { await screen.orientation?.lock?.("landscape"); } catch { /* Rotate prompt remains the fallback on unsupported devices. */ }
    }
  } catch {
    fullscreenDeclined = true;
    showDisplayNotice("No se pudo abrir pantalla completa. Puedes seguir jugando en horizontal o volver a intentarlo.");
  }
  resizeCanvasToViewport();
}

function clearHeldInputs() {
  keys.clear();
  semanticActionKey = null;
  resetTouchControls();
  pendingActionTaps = 0;
  spaceWasDown = false;
  cancelGenericPointer();
}

function cancelGenericPointer(pointerId = mouse.pointerId) {
  if (pointerId !== mouse.pointerId) return;
  mouse.pointerId = null;
  mouse.down = mouse.justDown = mouse.justUp = false;
  if (dragItem) {
    if (dragItem.dragOrigin) Object.assign(dragItem, dragItem.dragOrigin);
    for (const origin of dragItem.dragPartners || []) { origin.part.x=origin.x; origin.part.y=origin.y; }
    delete dragItem.dragOrigin;
    delete dragItem.dragPartners;
    dragItem.dragging = false;
    dragItem = null;
  }
}

// Pointer interaction uses the same precomputed silhouette as world collisions.
// During injection it follows the displayed rotation and zoom, not the old world pose.
function infectionScreenEntity(b) {
  if (state === State.INJECTION && b === targetBacteria && infectionView) {
    return { ...b, ...getInfectionPose() };
  }
  return { ...b, ...worldToScreen(b.x, b.y), scale: b.scale * (camera.zoom || 1) };
}

function hitsInfectionBacteria(b, point) {
  return Boolean(b && isBacteriaInteractable(b) && spriteSurface(infectionScreenEntity(b), point)?.distance <= 0);
}

function infectionPointerHeld() {
  return Boolean(infectionPointer && [State.SEARCH, State.ADSORPTION, State.INJECTION].includes(state)
    && hitsInfectionBacteria(infectionPointer.bacteria, infectionPointer));
}

function handleInfectionPointerDown(p, id) {
  if (![State.SEARCH, State.ADSORPTION, State.INJECTION].includes(state)) return false;
  if (infectionPointer) return true;
  const b = state === State.SEARCH
    ? bacteriaField.find(b => canAttachToBacteria(player, b).valid && hitsInfectionBacteria(b, p))
    : targetBacteria;
  if (!hitsInfectionBacteria(b, p)) return false;
  infectionPointer = { id, bacteria: b, x: p.x, y: p.y, elapsed: 0 };
  // Holding the target stops movement, including an existing movement finger.
  resetJoystick();
  return true;
}

function drawInfectionControl() {
  const b = state === State.SEARCH ? attachCandidate : targetBacteria;
  if (!b) return;
  const view = infectionScreenEntity(b);
  const radius = Math.min(220, BACTERIA_BODY_WIDTH * view.scale * 0.4);
  registerSemanticControl('action', view.x-radius, view.y-radius/2, radius*2, radius,
    mobileControls
      ? (state === State.SEARCH ? 'Mantén pulsada la bacteria para adherirte' : 'Mantén pulsada la bacteria para inyectar ADN')
      : (state === State.SEARCH ? 'Mantén ESPACIO o Enter para adherirte a esta bacteria' : 'Mantén ESPACIO o Enter para inyectar ADN'), () => {});
  if (state === State.SEARCH && infectionPointer?.elapsed > 0) {
    drawProgress(view.x-90, view.y+45, 180, 14, infectionPointer.elapsed/INFECTION_HOLD_SECONDS, '#9be8ff');
  }
}

// Lessons belong to the current run: each action is demonstrated once per game.
// Old localStorage progress must not suppress a new game's tutorials.
const visualTutorial = { learned: {}, key: null, age: 0, movementInputSeen: false };
function learnTutorial(key) {
  visualTutorial.learned[key] = true;
}

function getTutorialCue() {
  const tap = (key, p, hold = false) => ({ key, source: p, target: p, hold });
  let cue = null;
  if (state === State.SEARCH) {
    // Show a full movement demonstration before offering a nearby infection target.
    if (visualTutorial.learned['movement-v2'] !== true) cue = { key: 'movement-v2', movement: true, source: { x: safeCenterX()+Math.min(190, W*.14), y: H*.63 } };
    else if (attachCandidate) cue = tap('infection', worldToScreen(attachCandidate.x, attachCandidate.y), true);
    else cue = null;
  } else if ([State.ADSORPTION, State.INJECTION].includes(state) && targetBacteria) {
    cue = tap('injection', infectionScreenEntity(targetBacteria), true);
  } else if (state === State.DNA_REPLICATION) {
    const copying = replication.dnaPieces.length < TARGET_DNA;
    const dna = replication.dnaPieces.find(d => copying ? !d.duplicated : !d.processed);
    if (dna) cue = tap(copying ? 'dna-copy' : 'dna-process', dna);
  } else if (state === State.NUCLEOTIDE_MINIGAME && nucleotideGame) {
    const slot = nucleotideGame.slots.find(s => !s.filled);
    const item = slot && nucleotideGame.nucleotides.find(n => n.code === slot.code);
    if (item) cue = { key: 'nucleotide', source: item, target: slot, drag: true };
  } else if (state === State.PART_ASSEMBLY) {
    const hint = getAssemblyHint();
    const source = assembly.activeParts.find(p => p.kind === hint.source);
    const target = assembly.activeParts.find(p => p.kind === hint.target);
    if (source && target) {
      // The joined body is drawn with its anchor below the visible head/body centre.
      const from = getPartAppearance(source);
      const to = getPartAppearance(target);
      if (from && to) cue = { key: `assembly-${hint.source}`, source: from, target: to, drag: true };
    }
  } else if (state === State.LYSIS && !lysis.burst) {
    cue = tap('lysis', { x: W*.5, y: H*.52 });
  }
  return cue && visualTutorial.learned[cue.key] !== true ? cue : null;
}

function updateVisualTutorial(dt) {
  const cue = getTutorialCue();
  if (state === State.SEARCH && cue?.key === 'movement-v2') {
    const movement = getMovementInput();
    const moving = movement.mobileActive || movement.simpleActive || movement.left || movement.right || movement.up || movement.down;
    if (moving) visualTutorial.movementInputSeen = true;
    const shownFor = cue.key === visualTutorial.key ? visualTutorial.age + dt : dt;
    // A touch can control the ship while the hand remains visible; only complete
    // the lesson after the player has seen all four directions and moved once.
    if (visualTutorial.movementInputSeen && shownFor >= 6.4) learnTutorial('movement-v2');
  }
  const nextCue = getTutorialCue();
  if (nextCue?.key !== visualTutorial.key) { visualTutorial.key = nextCue?.key || null; visualTutorial.age = 0; }
  else visualTutorial.age += dt;
}

function drawVisualTutorial() {
  const cue = getTutorialCue();
  if (!cue) return;
  const age = visualTutorial.age;
  let p = cue.source, pressed = false, alpha = 1;
  if (cue.movement) {
    const t = age % 6.4;
    const direction = Math.floor(t/1.6);
    const segment = t%1.6;
    const delta = [[95,0],[0,-95],[-95,0],[0,95]][direction];
    const progress = smoothstep(.3,1.1,segment);
    p = { x: p.x+delta[0]*progress, y: p.y+delta[1]*progress };
    pressed = segment>.2 && segment<1.3;
    alpha = segment>1.3 ? 1-0.22*smoothstep(1.3,1.6,segment) : 1;
  } else if (cue.drag) {
    const t = age%3.2;
    const progress = smoothstep(.6,2.2,t);
    p = { x: lerp(p.x,cue.target.x,progress), y: lerp(p.y,cue.target.y,progress) };
    pressed = t>.35 && t<2.45;
    alpha = t>2.65 ? 1-0.22*smoothstep(2.65,3.2,t) : 1;
  } else {
    const t = age%(cue.hold ? 3 : .8);
    pressed = cue.hold ? t>.35 && t<2.6 : t>.18 && t<.5;
  }
  const image = pressed ? img.pointingOn : img.pointingOff;
  if (!image) return;
  // Both source frames share 399x434, including their original transparent margins.
  // Use a common fingertip anchor rather than trimming/centering each silhouette.
  const scale = .30;
  ctx.save();
  ctx.globalAlpha = alpha*.92;
  ctx.drawImage(image, p.x-340*scale, p.y-40*scale, image.width*scale, image.height*scale);
  ctx.restore();
}

function frameAlpha(alpha60, dt) { return 1 - Math.pow(1-alpha60, dt*60); }
function isActionHeld() { return infectionPointerHeld() || keys.has(' ') || keys.has('Spacebar') || touchControls.actionDown || semanticActionKey !== null; }

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
  if (soundEffects.menuOpen || storyIntroActive) return;
  const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  if (ev.key === "Escape" && state !== State.INTRO) {
    resetGame();
    ev.preventDefault();
    return;
  }
  if (isDisplayBlocked() || ev.target?.closest?.('button, input, select, textarea, dialog')) return;
  if ((ev.key === " " || ev.key === "Spacebar") && !ev.repeat && !keys.has(key)) pendingActionTaps++;
  keys.add(key);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(ev.key)) ev.preventDefault();
});

window.addEventListener("keyup", ev => {
  const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
  keys.delete(key);
  if (ev.key === semanticActionKey) semanticActionKey = null;
});

canvas.addEventListener("pointerdown", ev => {
  if (!gameReady || isDisplayBlocked() || soundEffects.menuOpen || storyIntroActive) return;
  const p = screenToCanvas(ev);
  if (state === State.LYSIS) {
    if (!lysis.burst) pendingActionTaps++;
    canvas.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    return;
  }
  const pointerState = state;
  if (handleUiPointerDown(p, ev.pointerId) || handleInfectionPointerDown(p, ev.pointerId) || handleMobileControlPointerDown(p, ev.pointerId)) {
    if (state === pointerState) canvas.setPointerCapture(ev.pointerId);
    ev.preventDefault();
    return;
  }
  if (mouse.pointerId !== null || mouse.justDown || mouse.justUp) return;
  mouse.pointerId = ev.pointerId;
  mouse.x = p.x;
  mouse.y = p.y;
  mouse.down = true;
  mouse.justDown = true;
  canvas.setPointerCapture(ev.pointerId);
});

canvas.addEventListener("pointermove", ev => {
  const p = screenToCanvas(ev);
  if (infectionPointer?.id === ev.pointerId) {
    infectionPointer.x = p.x; infectionPointer.y = p.y;
    if (!infectionPointerHeld()) infectionPointer.elapsed = 0;
    ev.preventDefault();
    return;
  }
  if (touchControls.joystick.active && touchControls.joystick.pointerId === ev.pointerId) {
    updateJoystickFromPoint(p);
    ev.preventDefault();
    return;
  }
  if (mouse.pointerId !== ev.pointerId) return;
  mouse.x = p.x;
  mouse.y = p.y;
});

canvas.addEventListener("pointerup", ev => {
  if (releaseControlPointer(ev.pointerId)) return;
  if (mouse.pointerId !== ev.pointerId) return;
  const p = screenToCanvas(ev);
  mouse.x = p.x;
  mouse.y = p.y;
  mouse.down = false;
  mouse.justUp = true;
  mouse.pointerId = null;
});

canvas.addEventListener("pointercancel", ev => {
  if (releaseControlPointer(ev.pointerId)) return;
  cancelGenericPointer(ev.pointerId);
});
canvas.addEventListener("lostpointercapture", ev => {
  if (!releaseControlPointer(ev.pointerId)) cancelGenericPointer(ev.pointerId);
});

window.addEventListener("resize", resizeCanvasToViewport);
window.addEventListener("blur", clearHeldInputs);
document.addEventListener("visibilitychange", () => {
  clearHeldInputs();
  // Hidden tabs may stop animation frames entirely, so record the pause here.
  if (document.hidden && pausedAt === null) pausedAt = performance.now();
});
document.addEventListener("fullscreenchange", resizeCanvasToViewport);
document.addEventListener("webkitfullscreenchange", resizeCanvasToViewport);
fullscreenButton.addEventListener("click", toggleFullscreen);
document.getElementById("rotateFullscreenButton").addEventListener("click", () => toggleFullscreen({requestLandscape:true}));
storyIntroNext.addEventListener("click", advanceStoryIntro);
normalButton.addEventListener("click", () => startGame(GameMode.NORMAL));
hardButton.addEventListener("click", () => startGame(GameMode.HARD));
restartButton.addEventListener("click", resetGame);
menuButton.addEventListener("click", resetGame);
retryLoadingButton.addEventListener('click', bootstrapGame);
resizeCanvasToViewport();
void bootstrapGame();
