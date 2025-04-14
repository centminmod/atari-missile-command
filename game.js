/* --- SESSION TOKEN FOR SCORE SUBMISSION --- */
let sessionToken = null; // Holds the session token for this game session

async function fetchSessionToken() {
  try {
    const response = await fetch('/start-session', { method: 'POST' });
    if (!response.ok) throw new Error('Failed to get session token');
    const data = await response.json();
    sessionToken = data.sessionToken;
    console.log('Session token acquired:', sessionToken);
  } catch (e) {
    sessionToken = null;
    console.error('Session token error:', e);
    // Optionally: disable score submission UI here
  }
}

// --- PWA Install Prompt Variables ---
let deferredPrompt; // To store the event
const installButton = document.getElementById('installPwaButton');

// --- Event Listener for beforeinstallprompt ---
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  console.log('`beforeinstallprompt` event fired.');
  if (installButton) {
    installButton.style.display = 'block'; // Show the install button
  } else {
    console.warn('Install button not found.');
  }
});

// --- Click Handler for the Install Button ---
if (installButton) {
  installButton.addEventListener('click', async () => {
    // Hide the app provided install promotion
    installButton.style.display = 'none';
    // Show the install prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, discard it
      deferredPrompt = null;
    } else {
      console.log('No deferred prompt available to show.');
    }
  });
} else {
  console.warn('Install button not found, cannot add click listener.');
}

// --- Optional: Listener for appinstalled event ---
window.addEventListener('appinstalled', () => {
  // Hide the install button
   if (installButton) {
    installButton.style.display = 'none';
   }
  // Clear the deferredPrompt so it can be garbage collected
  deferredPrompt = null;
  console.log('PWA was installed');
  // Optionally, send analytics event
});

// --- Canvas, Context, UI Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const waveDisplay = document.getElementById('wave');
const citiesLeftDisplay = document.getElementById('citiesLeft');
const multiplierDisplay = document.getElementById('multiplier');
const restartButton = document.getElementById('restartButton');
const pauseButton = document.getElementById('pauseButton');
const screenshotButton = document.getElementById('screenshotButton');
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const messageSubText = document.getElementById('messageSubText');
const messageBonusText = document.getElementById('messageBonusText');
const statsContainer = document.getElementById('statsContainer');
const pauseOverlay = document.getElementById('pauseOverlay');
const uiContainer = document.getElementById('uiContainer');
const controlsContainer = document.getElementById('controlsContainer');
const difficultySelectionDiv = document.getElementById('difficultySelection');
const startMenuContainer = document.getElementById('startMenuContainer');
const startHighScoreDisplay = document.getElementById('startHighScore');
const actualStartButton = document.getElementById('actualStartButton');
const bonusIndicator = document.getElementById('bonusIndicator');
const goToStoreButton = document.getElementById('goToStoreButton');
const skipStoreButton = document.getElementById('skipStoreButton');
const storeModal = document.getElementById('storeModal');
const storeScoreDisplay = document.getElementById('storeScore');
const stockSatelliteDisplay = document.getElementById('stockSatellite');
const stockBaseDisplay = document.getElementById('stockBase');
const stockCityDisplay = document.getElementById('stockCity');
const stockShieldDisplay = document.getElementById('stockShield');
const stockSatShieldDisplay = document.getElementById('stockSatShield');
const stockSonicWaveDisplay = document.getElementById('stockSonicWave');
const stockBombDisplay = document.getElementById('stockBomb');
const buySatelliteButton = document.getElementById('buySatelliteButton');
const buyBaseButton = document.getElementById('buyBaseButton');
const buyCityButton = document.getElementById('buyCityButton');
const buyShieldButton = document.getElementById('buyShieldButton');
const buySatShieldButton = document.getElementById('buySatShieldButton');
const buySonicWaveButton = document.getElementById('buySonicWaveButton');
const buyBombButton = document.getElementById('buyBombButton');
const buySonicWave10Button = document.getElementById('buySonicWave10Button');
const buyBomb10Button = document.getElementById('buyBomb10Button');
const storeContinueButton = document.getElementById('storeContinueButton');
const specialWeaponsUIDiv = document.getElementById('specialWeaponsUI');
const sonicWaveControl = document.getElementById('sonicWaveControl');
const sonicWaveCountDisplay = document.getElementById('sonicWaveCount');
const bombControl = document.getElementById('bombControl');
const bombCountDisplay = document.getElementById('bombCount');
const canvasContainer = document.getElementById('canvasContainer');
const costFasterMissileDisplay = document.getElementById('costFasterMissile');
const levelFasterMissileDisplay = document.getElementById('levelFasterMissile');
const buyFasterMissileButton = document.getElementById('buyFasterMissileButton');
const costWiderExplosionDisplay = document.getElementById('costWiderExplosion');
const levelWiderExplosionDisplay = document.getElementById('levelWiderExplosion');
const buyWiderExplosionButton = document.getElementById('buyWiderExplosionButton');

// --- ADDED: Audio Elements ---
const muteMusicButton = document.getElementById('muteMusicButton');
const muteSfxButton = document.getElementById('muteSfxButton');
const musicVolumeSlider = document.getElementById('musicVolumeSlider'); // NEW
const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');     // NEW

// --- NEW: Leaderboard Elements ---
const leaderboardContainer = document.getElementById('leaderboardContainer');
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardLoading = document.getElementById('leaderboardLoading');
const leaderboardViewMoreContainer = document.getElementById('leaderboardViewMoreContainer');
const leaderboardViewMoreLink = document.getElementById('leaderboardViewMoreLink');
const scoreSubmissionDiv = document.getElementById('scoreSubmission');
const playerNameInput = document.getElementById('playerNameInput');
const submitScoreButton = document.getElementById('submitScoreButton');
const submissionStatus = document.getElementById('submissionStatus');

// --- Game Constants & State Variables ---
const INTERNAL_WIDTH = 800;
const INTERNAL_HEIGHT = 600;
const GROUND_HEIGHT_RATIO = 10 / INTERNAL_HEIGHT;
const BASE_WIDTH_RATIO = 40 / INTERNAL_WIDTH;
const BASE_HEIGHT_RATIO = 40 / INTERNAL_HEIGHT;
const CITY_WIDTH_RATIO = 50 / INTERNAL_WIDTH;
const CITY_HEIGHT_RATIO = 30 / INTERNAL_HEIGHT;
const SATELLITE_WIDTH_RATIO = 35 / INTERNAL_WIDTH;
const SATELLITE_HEIGHT_RATIO = 25 / INTERNAL_HEIGHT;
const SATELLITE_Y_POS_RATIO = (INTERNAL_HEIGHT * 0.55) / INTERNAL_HEIGHT;
const MISSILE_SPEED_PLAYER_BASE = 5;
const MISSILE_SPEED_ENEMY_BASE = 0.4;
const MAX_ENEMY_MISSILE_SPEED = 3.25;
const EXPLOSION_RADIUS_START = 13;
const EXPLOSION_RADIUS_MAX_BASE = 65;
const EXPLOSION_DURATION = 60;
const POINTS_PER_MISSILE = 100;
const POINTS_PER_CITY = 1000;
const POINTS_PER_AMMO = 10;
const BONUS_FIRE_SPREAD = 8;
const BASE_SHIELD_RADIUS_MULTIPLIER = 2.45;
const SHIELD_STRENGTH_START = 150;
const SHIELD_DAMAGE_PER_HIT = 10;
const SHIELD_COLOR_FULL = 'rgba(0, 150, 255, 0.6)';
const SHIELD_COLOR_75 = 'rgba(0, 255, 150, 0.6)';
const SHIELD_COLOR_50 = 'rgba(255, 255, 0, 0.6)';
const SHIELD_COLOR_25 = 'rgba(255, 100, 0, 0.6)';
const SHIELD_FLASH_COLOR = 'rgba(255, 255, 255, 0.8)';
const SHIELD_FLASH_DURATION = 5;
const BOMB_EXPLOSION_RADIUS_MULTIPLIER = 5.5;
const BOMB_EXPLOSION_DURATION_MULTIPLIER = 1.5;
const SONIC_WAVE_SPEED = 3.5;
const SONIC_WAVE_HEIGHT = 10;
const SONIC_WAVE_COLOR = 'rgba(200, 0, 255, 0.5)';
const ACCURACY_BONUS_THRESHOLD = 20;
const ACCURACY_BONUS_POINTS = 25;
const MULTIPLIER_INCREASE_INTERVAL = 5;
const MULTIPLIER_MAX = 5.0;
const COST_FASTER_MISSILE_BASE = 10000;
const COST_WIDER_EXPLOSION_BASE = 10000;
const UPGRADE_COST_MULTIPLIER = 1.55;
const MAX_UPGRADE_LEVEL = 15;
const MISSILE_SPEED_INCREASE_PER_LEVEL = 0.9;
const EXPLOSION_RADIUS_INCREASE_PER_LEVEL = 8;
const SMART_BOMB_CHANCE = 0.05;
const SMART_BOMB_SPLIT_ALTITUDE_MIN = INTERNAL_HEIGHT * 0.45;
const SMART_BOMB_SPLIT_ALTITUDE_MAX = INTERNAL_HEIGHT * 0.65;
const SMART_BOMB_SPLIT_COUNT = 3;
const SMART_BOMB_SPLIT_SPEED_FACTOR = 0.7;
const SMART_BOMB_SPLIT_COLOR = '#ff8800';
const MIRV_CHANCE = 0.10;
const MIRV_SPLIT_ALTITUDE = INTERNAL_HEIGHT * 0.35;
const MIRV_WARHEAD_COUNT = 4;
const MIRV_WARHEAD_SPEED_FACTOR = 0.9;
const MIRV_WARHEAD_COLOR = '#ff4444';
const COMBO_BONUS_POINTS_PER_EXTRA_KILL = 15; // Points per extra kill in a combo
const PLANE_SPEED_INCREASE_PER_WAVE = 0.05;
const PLANE_VARIANT_CHANCE = 0.2;
const MAX_ACTIVE_SATELLITES = 3;
const COST_SATELLITE = 100000;
const MAX_STOCK_SATELLITE = 100;
const COST_BASE = 50000;
const MAX_STOCK_BASE = 100;
const COST_CITY = 100000;
const MAX_STOCK_CITY = 100;
const COST_SHIELD = 50000;
const MAX_STOCK_SHIELD = 100;
const COST_SAT_SHIELD = 50000;
const MAX_STOCK_SAT_SHIELD = 100;
const COST_SONIC_WAVE = 20000;
const MAX_STOCK_SONIC_WAVE = 100;
const COST_BOMB = 10000;
const MAX_STOCK_BOMB = 100;
const PLANE_SPEED_BASE = 1.5;
const PLANE_WIDTH = 50;
const PLANE_HEIGHT = 20;
const PLANE_BONUS_SCORE = 2000;
const PLANE_BOMB_POINTS = 10;
const PLANE_BOMB_SPEED = 1.0;
const BASE_BOMBS_PER_PLANE = 20;
const BOMBS_INCREASE_PER_WAVE = 1;
const PLANE_SPAWN_CHANCE = 0.025;
const PLANE_MIN_Y = INTERNAL_HEIGHT * 0.1;
const PLANE_MAX_Y = INTERNAL_HEIGHT * 0.3;
const PLANE_BOMB_DROP_INTERVAL_MIN = 75;
const PLANE_BOMB_DROP_INTERVAL_MAX = 150;
const PLANE_BOMB_COLOR = '#FFA500';
const PLANE_BOMB_TRAIL_COLOR = 'rgba(255, 165, 0, 0.4)';

// Game State Variables
let stars = [];
let gameStartTimestamp = 0;
let score = 0;
let gameTotalScore = 0;
let highScore = 0;
let currentWave = 0;
let cities = [];
let bases = [];
let incomingMissiles = [];
let playerMissiles = [];
let explosions = [];
let isGameOver = true;
let gameLoopId = null;
let transitioningWave = false;
let isPaused = false;
let gameHasStarted = false;
let difficultySelected = false;
let selectedDifficultyName = '';
let selectedDifficultyAmmo = 50;
let difficultyScoreMultiplier = 1.0;
let bonusMissileCount = 0;
let storeStockSatellite = MAX_STOCK_SATELLITE;
let storeStockBase = MAX_STOCK_BASE;
let storeStockCity = MAX_STOCK_CITY;
let storeStockShield = MAX_STOCK_SHIELD;
let storeStockSatShield = MAX_STOCK_SAT_SHIELD;
let storeStockSonicWave = MAX_STOCK_SONIC_WAVE;
let storeStockBomb = MAX_STOCK_BOMB;
let satelliteBases = [];
let baseShields = [null, null, null];
let inventorySonicWave = 0;
let inventoryBomb = 0;
let isBombArmed = false;
let activeSonicWave = null;
let consecutiveIntercepts = 0;
let scoreMultiplier = 1.0;
let playerMissileSpeedLevel = 0;
let explosionRadiusLevel = 0;
let accuracyBonusMessageTimer = 0;
let comboMessageTimer = 0; // NEW: Timer for combo message display
let statsMissilesFired = 0;
let statsEnemyMissilesDestroyed = 0;
let statsPlaneBombsDestroyed = 0;
let statsPlanesDestroyed = 0;
let statsCitiesLost = 0;
let statsBasesLost = 0;
let statsAccuracyBonusHits = 0;
let planes = [];
let planeBombs = [];
let statsShieldBombsDestroyed = 0;
let gameClickData = [];
let storeActions = [];
let scoreSubmitted = false; // Track if score has been submitted
const waveDefinitions = defineWaves();
let currentWaveConfig = {};
let waveTimer = 0;
let waveEnemiesSpawned = 0;
let waveEnemiesRequired = 0;
let submittedPlayerNameThisSession = null; // ADDED: Track submitted name for the current session
// ADDED: Duration tracking variables
let waveStartTime = 0;
let totalGameDurationSeconds = 0;
let waveAllSpawnedTimestamp = 0; // NEW: Timestamp when all enemies for the wave are spawned
let waveStats = []; // NEW: Array to store stats per wave [{ spawnToCompletionMs: 12345 }, ...]
// NEW: Keyboard control variables
let keyboardSelectedBaseIndex = -1; // -1 = none, 0-2 ground, 3-5 satellite
let reticleX = INTERNAL_WIDTH / 2;
let reticleY = INTERNAL_HEIGHT / 2;
let keyboardTargetingActive = false; // Flag to show reticle
const RETICLE_SPEED = 8;
// ADDED: Variables for performance tracking
let lastFrameTime = 0;
let frameCount = 0;
let frameTimes = [];
const FRAME_SAMPLE_SIZE = 60; // Number of frames to sample for performance
// ADDED: Debug logging flag
window.enableDebugLogging = false;
// NEW: Kill counting control variable
let useDeferredKillCounting = true; // Set to true to use new method, false for old

// --- ADDED: Web Audio API Setup ---
let audioContext;
let masterGainNode;
let musicGainNode;
let sfxGainNode;
let musicBuffer = null;
let launchBuffer = null;
let explosionBuffer = null;
let musicSourceNode = null; // To keep track of the playing music source
let isMusicMuted = true; // Start muted by default
let isSfxMuted = false;
let audioInitialized = false;
const audioFilePaths = {
    music: 'audio/music-lowest.mp3', // Placeholder
    launch: 'audio/launch.mp3', // Placeholder - Changed to mp3
    explosion: 'audio/explosion.mp3' // Placeholder - Changed to mp3
};

function initializeStars() {
  stars = []; // Clear any existing stars
  const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);
  const numStars = Math.floor(canvas.width * canvas.height / 5000);
  
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * groundY,
      radius: 0.3 + Math.random() * 1.2, // Base radius between 0.3 and 1.5
      twinkleSpeed: 0.3 + Math.random() * 0.7, // Random speed for twinkling
      twinkleOffset: Math.random() * Math.PI * 2 // Random starting phase
    });
  }
}

// Function to initialize AudioContext (must be called after user interaction)
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGainNode = audioContext.createGain();
            musicGainNode = audioContext.createGain();
            sfxGainNode = audioContext.createGain();

            // Set initial volumes from sliders
            musicGainNode.gain.value = parseFloat(musicVolumeSlider.value); // NEW
            sfxGainNode.gain.value = parseFloat(sfxVolumeSlider.value);     // NEW

            musicGainNode.connect(masterGainNode);
            sfxGainNode.connect(masterGainNode);
            masterGainNode.connect(audioContext.destination);

            console.log("AudioContext initialized successfully.");
            loadAllSounds(); // Start loading sounds once context is ready
        } catch (e) {
            console.error("Web Audio API is not supported in this browser", e);
            // Disable sound buttons if context fails
            if (muteMusicButton) muteMusicButton.disabled = true;
            if (muteSfxButton) muteSfxButton.disabled = true;
        }
    }
    // Resume context if it was suspended
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Function to load a single sound file
async function loadSound(url) {
    if (!audioContext) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`Sound loaded successfully: ${url}`);
        return audioBuffer;
    } catch (error) {
        console.error(`Error loading sound ${url}:`, error);
        // Display a user-friendly message or disable related features
        // For now, just log the error. You might want to show a message in the UI.
        return null; // Return null to indicate failure
    }
}


// Function to load all sounds
async function loadAllSounds() {
    if (!audioContext) return;
    console.log("Loading all sounds...");
    [musicBuffer, launchBuffer, explosionBuffer] = await Promise.all([
        loadSound(audioFilePaths.music),
        loadSound(audioFilePaths.launch),
        loadSound(audioFilePaths.explosion)
    ]);
    console.log("Sound loading process finished.");
    // ADDED: Attempt to play music now if conditions are right
    if (gameHasStarted && !isGameOver && !isPaused && !isMusicMuted && musicBuffer && !musicSourceNode) {
        console.log("Attempting to play music after loading sounds.");
        playMusic();
    }
    // Optionally, enable sound-related UI elements here if they were disabled
}

// Function to play a sound effect
function playSfx(buffer) {
    if (!audioContext || !buffer || isSfxMuted) return;
    // Resume context if needed (e.g., after inactivity)
     if (audioContext.state === 'suspended') {
         audioContext.resume();
     }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(sfxGainNode);
    source.start(0);
}

// Function to play background music (loops)
function playMusic() {
    if (!audioContext || !musicBuffer || musicSourceNode || isMusicMuted) return;
    // Resume context if needed
     if (audioContext.state === 'suspended') {
         audioContext.resume();
     }
    musicSourceNode = audioContext.createBufferSource();
    musicSourceNode.buffer = musicBuffer;
    musicSourceNode.loop = true;
    musicSourceNode.connect(musicGainNode);
    musicSourceNode.start(0);
    console.log("Music started.");
}

// Function to stop background music
function stopMusic() {
    if (musicSourceNode) {
        musicSourceNode.stop(0);
        musicSourceNode.disconnect();
        musicSourceNode = null;
        console.log("Music stopped.");
    }
}

// --- MODIFIED: Function to toggle music mute (works with slider) ---
function toggleMusicMute() {
    if (!audioContext) return;
    isMusicMuted = !isMusicMuted;
    if (isMusicMuted) {
        musicGainNode.gain.setValueAtTime(0, audioContext.currentTime); // Mute immediately
        muteMusicButton.textContent = 'Unmute Music';
        musicVolumeSlider.disabled = true; // Disable slider when muted
        stopMusic(); // Stop current playback when muting
    } else {
        // Restore volume to slider value
        musicGainNode.gain.setValueAtTime(parseFloat(musicVolumeSlider.value), audioContext.currentTime);
        muteMusicButton.textContent = 'Mute Music';
        musicVolumeSlider.disabled = false; // Enable slider
        // Optionally restart music if the game is running
        if (gameHasStarted && !isGameOver && !isPaused) {
             playMusic();
        }
    }
    console.log("Music Muted:", isMusicMuted);
}

// --- MODIFIED: Function to toggle SFX mute (works with slider) ---
function toggleSfxMute() {
    if (!audioContext) return;
    isSfxMuted = !isSfxMuted;
    if (isSfxMuted) {
        sfxGainNode.gain.setValueAtTime(0, audioContext.currentTime); // Mute immediately
        muteSfxButton.textContent = 'Unmute SFX';
        sfxVolumeSlider.disabled = true; // Disable slider when muted
    } else {
        // Restore volume to slider value
        sfxGainNode.gain.setValueAtTime(parseFloat(sfxVolumeSlider.value), audioContext.currentTime);
        muteSfxButton.textContent = 'Mute SFX';
        sfxVolumeSlider.disabled = false; // Enable slider
    }
    console.log("SFX Muted:", isSfxMuted);
}

// --- NEW: Function to handle music volume change ---
function handleMusicVolumeChange(event) {
    if (!audioContext || isMusicMuted) return; // Don't change if muted
    const volume = parseFloat(event.target.value);
    musicGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    console.log("Music Volume:", volume);
}

// --- NEW: Function to handle SFX volume change ---
function handleSfxVolumeChange(event) {
    if (!audioContext || isSfxMuted) return; // Don't change if muted
    const volume = parseFloat(event.target.value);
    sfxGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    console.log("SFX Volume:", volume);
    // Optionally play a test sound
    // playSfx(launchBuffer);
}
// --- END Web Audio API Setup ---


// --- Utility Functions ---
function distance(x1, y1, x2, y2) { const dx = x1 - x2; const dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); }
function getRandomTarget(avoidX = -1, avoidRadius = 0) {
    const aliveCities = cities.filter(c => c.alive);
    const aliveBases = bases.filter(b => b.alive);
    const aliveSatellites = satelliteBases.filter(s => s.alive);
    let possibleTargets = [...aliveCities, ...aliveBases, ...aliveSatellites];
    if (avoidX !== -1) {
        possibleTargets = possibleTargets.filter(t => {
            const targetCenterX = t.x + (t.width / 2);
            return distance(targetCenterX, t.y, avoidX, 0) > avoidRadius;
        });
    }
    const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);
    if (possibleTargets.length === 0) {
        let targetGroundX = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.4;
        if (avoidX !== -1 && Math.abs(targetGroundX - avoidX) < avoidRadius) {
            targetGroundX = avoidX + (Math.sign(targetGroundX - avoidX) || 1) * (avoidRadius + Math.random() * 50);
            targetGroundX = Math.max(0, Math.min(canvas.width, targetGroundX));
        }
        return { x: targetGroundX, y: groundY };
    }
    const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
    return { x: target.x + (target.width / 2), y: target.y };
}
function getCurrentPlayerMissileSpeed() { return MISSILE_SPEED_PLAYER_BASE + (playerMissileSpeedLevel * MISSILE_SPEED_INCREASE_PER_LEVEL); }
function getCurrentPlayerExplosionRadius() { return EXPLOSION_RADIUS_MAX_BASE + (explosionRadiusLevel * EXPLOSION_RADIUS_INCREASE_PER_LEVEL); }
function calculateUpgradeCost(baseCost, level) { return Math.floor(baseCost * Math.pow(UPGRADE_COST_MULTIPLIER, level)); }

// --- Game Object Factories ---
function createCity(xRatio) {
    const cityWidth = canvas.width * CITY_WIDTH_RATIO;
    const cityHeight = canvas.height * CITY_HEIGHT_RATIO;
    const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);
    const cityX = xRatio * canvas.width;
    const cityY = groundY - cityHeight;
    const buildings = [];
    const numBuildings = 3 + Math.floor(Math.random() * 3);
    let currentX = cityX;
    const totalBuildingWidth = cityWidth * 0.9;
    const baseBuildingWidth = totalBuildingWidth / numBuildings;
    for (let i = 0; i < numBuildings; i++) {
        const buildingHeight = (cityHeight * 0.6) + (Math.random() * cityHeight * 0.4);
        const buildingWidth = baseBuildingWidth * (0.8 + Math.random() * 0.4);
        const gap = (baseBuildingWidth - buildingWidth) / 2;
        buildings.push({ x: currentX + gap, y: groundY - buildingHeight, w: buildingWidth, h: buildingHeight, color: `hsl(180, 100%, ${35 + Math.random() * 15}%)` });
        currentX += baseBuildingWidth;
    }
    return {
        x: cityX, y: cityY, width: cityWidth, height: cityHeight, alive: true, buildings: buildings,
        draw() {
            if (!this.alive) return;
            this.buildings.forEach(b => {
                ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                const windowSize = Math.min(b.w, b.h) * 0.15;
                const cols = Math.floor(b.w / (windowSize * 2.5)); const rows = Math.floor(b.h / (windowSize * 3));
                if (cols > 0 && rows > 0) {
                    const xSpacing = b.w / cols; const ySpacing = b.h / rows;
                    for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) { ctx.fillRect(b.x + xSpacing * (c + 0.5) - windowSize / 2, b.y + ySpacing * (r + 0.5) - windowSize / 2, windowSize, windowSize); } }
                }
                ctx.strokeStyle = '#006666'; ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, b.w, b.h);
            });
        }
    };
}
function createBase(xRatio) {
    const baseWidth = canvas.width * BASE_WIDTH_RATIO;
    const baseHeight = canvas.height * BASE_HEIGHT_RATIO;
    const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);
    const baseX = (xRatio * canvas.width) - (baseWidth / 2);
    const baseY = groundY - baseHeight;
    return {
        x: baseX, y: baseY, width: baseWidth, height: baseHeight, color: '#dddd00', outlineColor: '#aaaa00', launcherColor: '#999999', alive: true, ammo: selectedDifficultyAmmo, isSatellite: false,
        draw() {
            if (!this.alive) return;

            // Ground platform
            ctx.fillStyle = '#556b2f'; // Dark olive green
            ctx.fillRect(this.x, this.y + this.height * 0.8, this.width, this.height * 0.2);

            // Central command building - made taller
            const buildingWidth = this.width * 0.4;
            const buildingX = this.x + (this.width - buildingWidth) / 2;
            const buildingHeight = this.height * 0.8; // Increased from 0.7
            const buildingY = this.y + this.height * 0.8 - buildingHeight;

            // Main building
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(buildingX, buildingY, buildingWidth, buildingHeight);

            // Building top
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(buildingX + buildingWidth * 0.1, buildingY, buildingWidth * 0.8, buildingHeight * 0.1);

            // Building windows - adjusted for taller building
            ctx.fillStyle = '#88ccff';
            const windowSize = buildingWidth * 0.1;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) { // Added an extra row of windows
                    ctx.fillRect(
                        buildingX + buildingWidth * 0.2 + i * buildingWidth * 0.3,
                        buildingY + buildingHeight * 0.15 + j * buildingHeight * 0.25,
                        windowSize, windowSize
                    );
                }
            }

            // Missile silos - adjusted positions
            const siloWidth = this.width * 0.15;
            const siloLeftX = this.x + this.width * 0.1;
            const siloRightX = this.x + this.width * 0.75;
            const siloY = this.y + this.height * 0.75;
            const siloHeight = this.height * 0.4; // Increased from 0.35

            // Silo bases
            ctx.fillStyle = '#777777';
            ctx.fillRect(siloLeftX, siloY - siloHeight * 0.2, siloWidth, siloHeight * 0.2);
            ctx.fillRect(siloRightX, siloY - siloHeight * 0.2, siloWidth, siloHeight * 0.2);

            // Draw missiles in silos - made taller
            const missileWidth = siloWidth * 0.6;
            const missileLeftX = siloLeftX + (siloWidth - missileWidth) / 2;
            const missileRightX = siloRightX + (siloWidth - missileWidth) / 2;

            // Draw left missile
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(missileLeftX, siloY - siloHeight * 0.8, missileWidth, siloHeight * 0.6);

            // Left missile tip
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(missileLeftX, siloY - siloHeight * 0.8);
            ctx.lineTo(missileLeftX + missileWidth / 2, siloY - siloHeight);
            ctx.lineTo(missileLeftX + missileWidth, siloY - siloHeight * 0.8);
            ctx.closePath();
            ctx.fill();

            // Draw right missile
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(missileRightX, siloY - siloHeight * 0.7, missileWidth, siloHeight * 0.5);

            // Right missile tip
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(missileRightX, siloY - siloHeight * 0.7);
            ctx.lineTo(missileRightX + missileWidth / 2, siloY - siloHeight * 0.9);
            ctx.lineTo(missileRightX + missileWidth, siloY - siloHeight * 0.7);
            ctx.closePath();
            ctx.fill();

            // Small antenna on command building
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(buildingX + buildingWidth / 2, buildingY);
            ctx.lineTo(buildingX + buildingWidth / 2, buildingY - buildingHeight * 0.15);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(buildingX + buildingWidth / 2, buildingY - buildingHeight * 0.15, buildingWidth * 0.05, 0, Math.PI * 2);
            ctx.stroke();

            // Ammo display
            ctx.fillStyle = '#ffffff';
            const fontSize = Math.max(8, Math.min(12, Math.floor(this.width * 0.25)));
            ctx.font = `${fontSize}px "Press Start 2P"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.ammo, this.x + this.width / 2, this.y + this.height * 0.9);
        }
    };
}
function createSatelliteBase(xRatio, yRatio) {
    const satWidth = canvas.width * SATELLITE_WIDTH_RATIO;
    const satHeight = canvas.height * SATELLITE_HEIGHT_RATIO;
    const satX = (xRatio * canvas.width) - (satWidth / 2);
    const satY = yRatio * canvas.height;
    return {
        x: satX, y: satY, width: satWidth, height: satHeight, bodyColor: '#b0b0b0', panelColor: '#3333cc', panelHighlight: '#6666ff', outlineColor: '#777777', antennaColor: '#dddddd', lightColor: '#ff0000', alive: true, ammo: selectedDifficultyAmmo, isSatellite: true, shield: null,
        draw() {
            if (!this.alive) return;

            // Main satellite body (central platform)
            const bodyW = this.width * 0.6;
            const bodyH = this.height * 0.7;
            const bodyX = this.x + (this.width - bodyW) / 2;
            const bodyY = this.y + (this.height - bodyH) / 2;

            // Central command module (matching the land base's command building)
            ctx.fillStyle = '#5a5a5a';
            ctx.beginPath();
            ctx.moveTo(bodyX, bodyY + bodyH * 0.2);
            ctx.lineTo(bodyX + bodyW * 0.1, bodyY);
            ctx.lineTo(bodyX + bodyW * 0.9, bodyY);
            ctx.lineTo(bodyX + bodyW, bodyY + bodyH * 0.2);
            ctx.lineTo(bodyX + bodyW, bodyY + bodyH * 0.8);
            ctx.lineTo(bodyX + bodyW * 0.9, bodyY + bodyH);
            ctx.lineTo(bodyX + bodyW * 0.1, bodyY + bodyH);
            ctx.lineTo(bodyX, bodyY + bodyH * 0.8);
            ctx.closePath();
            ctx.fill();

            // Command module outline
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Solar panels - left and right (similar layout to the land base silos)
            const panelW = this.width * 0.25;
            const panelH = this.height * 0.8;
            const panelY = this.y + (this.height - panelH) / 2;

            // Left panel
            ctx.fillStyle = '#336699'; // Blue panels (like windows in command center)
            ctx.fillRect(this.x, panelY, panelW, panelH);

            // Right panel
            ctx.fillRect(this.x + this.width - panelW, panelY, panelW, panelH);

            // Panel details - grid lines
            ctx.strokeStyle = '#88ccff';
            ctx.lineWidth = 1;

            // Left panel grid
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x, panelY + panelH * (i + 1) / 4);
                ctx.lineTo(this.x + panelW, panelY + panelH * (i + 1) / 4);
                ctx.stroke();
            }
            for (let i = 0; i < 1; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + panelW * (i + 1) / 2, panelY);
                ctx.lineTo(this.x + panelW * (i + 1) / 2, panelY + panelH);
                ctx.stroke();
            }

            // Right panel grid
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + this.width - panelW, panelY + panelH * (i + 1) / 4);
                ctx.lineTo(this.x + this.width, panelY + panelH * (i + 1) / 4);
                ctx.stroke();
            }
            for (let i = 0; i < 1; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + this.width - panelW * (i + 1) / 2, panelY);
                ctx.lineTo(this.x + this.width - panelW * (i + 1) / 2, panelY + panelH);
                ctx.stroke();
            }

            // Windows on command module (matching land base)
            ctx.fillStyle = '#88ccff';
            const windowSize = bodyW * 0.1;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    ctx.fillRect(
                        bodyX + bodyW * 0.2 + i * bodyW * 0.3,
                        bodyY + bodyH * 0.25 + j * bodyH * 0.3,
                        windowSize, windowSize
                    );
                }
            }

            // Missile launchers (top and bottom, similar to land base's dual launchers)
            const launcherW = bodyW * 0.15;
            const launcherH = this.height * 0.15;

            // Top launcher
            ctx.fillStyle = '#777777';
            ctx.fillRect(bodyX + (bodyW - launcherW) / 2, bodyY - launcherH * 0.6, launcherW, launcherH * 0.6);

            // Top missile
            const missileW = launcherW * 0.6;
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(bodyX + (bodyW - missileW) / 2, bodyY - launcherH * 1.5, missileW, launcherH * 0.9);

            // Missile tip
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(bodyX + (bodyW - missileW) / 2, bodyY - launcherH * 1.5);
            ctx.lineTo(bodyX + bodyW / 2, bodyY - launcherH * 1.8);
            ctx.lineTo(bodyX + (bodyW + missileW) / 2, bodyY - launcherH * 1.5);
            ctx.closePath();
            ctx.fill();

            // Bottom launcher
            ctx.fillStyle = '#777777';
            ctx.fillRect(bodyX + (bodyW - launcherW) / 2, bodyY + bodyH, launcherW, launcherH * 0.6);

            // Bottom missile
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(bodyX + (bodyW - missileW) / 2, bodyY + bodyH + launcherH * 0.6, missileW, launcherH * 0.9);

            // Bottom missile tip
            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.moveTo(bodyX + (bodyW - missileW) / 2, bodyY + bodyH + launcherH * 1.5);
            ctx.lineTo(bodyX + bodyW / 2, bodyY + bodyH + launcherH * 1.8);
            ctx.lineTo(bodyX + (bodyW + missileW) / 2, bodyY + bodyH + launcherH * 1.5);
            ctx.closePath();
            ctx.fill();

            // Communication antenna (matching land base)
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bodyX + bodyW * 0.8, bodyY);
            ctx.lineTo(bodyX + bodyW * 0.8, bodyY - bodyH * 0.3);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(bodyX + bodyW * 0.8, bodyY - bodyH * 0.3, bodyW * 0.05, 0, Math.PI * 2);
            ctx.stroke();

            // Status light
            ctx.fillStyle = this.lightColor;
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.beginPath();
                ctx.arc(bodyX + bodyW * 0.2, bodyY + bodyH * 0.5, bodyW * 0.03, 0, Math.PI * 2);
                ctx.fill();
            }

            // Ammo display
            ctx.fillStyle = '#ffff00';
            const fontSize = Math.max(7, Math.min(10, Math.floor(this.width * 0.25)));
            ctx.font = `${fontSize}px "Press Start 2P"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(this.ammo, this.x + this.width / 2, this.y + this.height + 3);
        }
    };
}
function createIncomingMissile(config = {}) {
    const startX = config.startX !== undefined ? config.startX : Math.random() * canvas.width;
    const startY = config.startY !== undefined ? config.startY : 0;
    const target = config.target || getRandomTarget();
    let baseSpeed = MISSILE_SPEED_ENEMY_BASE + (currentWave * 0.08);
    baseSpeed = Math.min(baseSpeed, MAX_ENEMY_MISSILE_SPEED);
    const speed = config.speed || baseSpeed * (config.speedFactor || 1.0);
    const angle = Math.atan2(target.y - startY, target.x - startX);
    const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);
    const waveSmartBombChance = SMART_BOMB_CHANCE * (1 + currentWave * 0.05);
    const waveMIRVChance = MIRV_CHANCE * (1 + currentWave * 0.03);
    let isSmartBomb = config.isSmartBomb !== undefined ? config.isSmartBomb : (!config.isMIRV && !config.isSplit && Math.random() < waveSmartBombChance);
    let isMIRV = config.isMIRV !== undefined ? config.isMIRV : (!isSmartBomb && !config.isSplit && Math.random() < waveMIRVChance);
    let isSplit = config.isSplit || false;
    let color = '#ff0000'; let trailColor = 'rgba(255, 100, 100, 0.5)';
    if (isMIRV) { color = MIRV_WARHEAD_COLOR; trailColor = 'rgba(255, 150, 150, 0.5)'; }
    if (isSmartBomb) { color = SMART_BOMB_SPLIT_COLOR; trailColor = 'rgba(255, 200, 100, 0.5)'; }
    if (isSplit) { color = config.color || color; trailColor = config.trailColor || trailColor; }

    // Add the ignoreEnemyObjectsWhenExploding flag, default to false
    const ignoreEnemyObjectsWhenExploding = config.ignoreEnemyObjectsWhenExploding || false;

    return {
        x: startX, y: startY, targetX: target.x, targetY: target.y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, speed: speed, color: color, trailColor: trailColor, alive: true, trail: [{x: startX, y: startY}], isPlaneBomb: false, isSmartBomb: isSmartBomb, isMIRV: isMIRV, isSplit: isSplit, hasSplit: false, wavePartType: config.wavePartType, ignoreEnemyObjectsWhenExploding: ignoreEnemyObjectsWhenExploding, countedAsDestroyed: false, // NEW: Flag for deferred counting

        update() {
            if (!this.alive) return;
            this.x += this.dx; this.y += this.dy; this.trail.push({x: this.x, y: this.y}); if (this.trail.length > 15) { this.trail.shift(); }

            if (this.isMIRV && !this.hasSplit && this.y >= MIRV_SPLIT_ALTITUDE) {
                this.alive = false; this.hasSplit = true;
                // Create an explosion that ignores enemy objects
                createExplosion(this.x, this.y, EXPLOSION_RADIUS_START * 0.5, this.color, null, null, true);

                for (let i = 0; i < MIRV_WARHEAD_COUNT; i++) {
                    // Use getBaseOrCityTarget for MIRV splits instead of getRandomTarget
                    const warheadTarget = getBaseOrCityTarget();
                    incomingMissiles.push(createIncomingMissile({
                        startX: this.x,
                        startY: this.y,
                        target: warheadTarget,
                        speed: this.speed * MIRV_WARHEAD_SPEED_FACTOR,
                        isSplit: true,
                        isMIRV: false,
                        isSmartBomb: false,
                        color: MIRV_WARHEAD_COLOR,
                        trailColor: 'rgba(255, 150, 150, 0.5)',
                        ignoreEnemyObjectsWhenExploding: true,
                        wavePartType: this.wavePartType
                    }));
                }
                return;
            }

            const splitAltitude = SMART_BOMB_SPLIT_ALTITUDE_MIN + Math.random() * (SMART_BOMB_SPLIT_ALTITUDE_MAX - SMART_BOMB_SPLIT_ALTITUDE_MIN);
            if (this.isSmartBomb && !this.hasSplit && this.y >= splitAltitude) {
                this.alive = false; this.hasSplit = true;
                // Create an explosion that ignores enemy objects
                createExplosion(this.x, this.y, EXPLOSION_RADIUS_START * 0.4, this.color, null, null, true);

                for (let i = 0; i < SMART_BOMB_SPLIT_COUNT; i++) {
                    // Use getBaseOrCityTarget for smart bomb splits instead of getRandomTarget
                    const splitTarget = getBaseOrCityTarget();
                    incomingMissiles.push(createIncomingMissile({
                        startX: this.x,
                        startY: this.y,
                        target: splitTarget,
                        speed: this.speed * SMART_BOMB_SPLIT_SPEED_FACTOR,
                        isSplit: true,
                        isMIRV: false,
                        isSmartBomb: false,
                        color: SMART_BOMB_SPLIT_COLOR,
                        trailColor: 'rgba(255, 200, 100, 0.5)',
                        ignoreEnemyObjectsWhenExploding: true,
                        wavePartType: this.wavePartType
                    }));
                }
                return;
            }

            if (this.y >= this.targetY || this.y >= groundY) {
                this.alive = false; const impactY = Math.min(this.targetY, groundY); const explosionSizeFactor = this.isSplit ? 0.6 : 1.0;
                createExplosion(this.x, impactY, (EXPLOSION_RADIUS_MAX_BASE / 2) * explosionSizeFactor, this.color, null, null, this.ignoreEnemyObjectsWhenExploding);
                checkObjectImpact(this.x, impactY, this.isPlaneBomb);
            }
        },

        draw() {
            if (!this.alive) return; ctx.strokeStyle = this.trailColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y); for (let i = 1; i < this.trail.length; i++) { ctx.lineTo(this.trail[i].x, this.trail[i].y); } ctx.stroke();
            const size = (this.isMIRV || this.isSmartBomb) && !this.hasSplit ? 5 : 4; ctx.fillStyle = this.color; ctx.fillRect(this.x - size/2, this.y - size/2, size, size); if ((this.isMIRV || this.isSmartBomb) && !this.hasSplit && Math.floor(Date.now() / 200) % 2 === 0) { ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fillRect(this.x - size/2 - 1, this.y - size/2 - 1, size + 2, size + 2); }
        }
    };
}
function createPlayerMissile(startX, startY, targetX, targetY) {
    const currentSpeed = getCurrentPlayerMissileSpeed(); const angle = Math.atan2(targetY - startY, targetX - startX); statsMissilesFired++;
    playSfx(launchBuffer); // ADDED: Play launch sound
    return {
        x: startX, y: startY, targetX: targetX, targetY: targetY, dx: Math.cos(angle) * currentSpeed, dy: Math.sin(angle) * currentSpeed, speed: currentSpeed, color: '#00ff00', trailColor: 'rgba(100, 255, 100, 0.5)', alive: true, trail: [{x: startX, y: startY}],
        update() {
            if (!this.alive) return; this.x += this.dx; this.y += this.dy; this.trail.push({x: this.x, y: this.y}); if (this.trail.length > 10) { this.trail.shift(); } const distToTarget = distance(this.x, this.y, this.targetX, this.targetY); if (distToTarget < this.speed || (this.dx * (this.targetX - this.x) + this.dy * (this.targetY - this.y)) < 0) { this.alive = false; const currentExplosionRadius = getCurrentPlayerExplosionRadius(); createExplosion(this.targetX, this.targetY, EXPLOSION_RADIUS_START, this.color, currentExplosionRadius); }
        },
        draw() { if (!this.alive) return; ctx.strokeStyle = this.trailColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y); for (let i = 1; i < this.trail.length; i++) { ctx.lineTo(this.trail[i].x, this.trail[i].y); } ctx.stroke(); ctx.fillStyle = this.color; ctx.fillRect(this.x - 1, this.y - 1, 3, 3); }
    };
}
function getBaseOrCityTarget() {
    const aliveCities = cities.filter(c => c.alive);
    const aliveBases = [...bases.filter(b => b.alive), ...satelliteBases.filter(s => s.alive)];
    let possibleTargets = [...aliveCities, ...aliveBases];
    const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);

    if (possibleTargets.length === 0) {
        // If no cities or bases are alive, target a random ground position
        let targetGroundX = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.4;
        return { x: targetGroundX, y: groundY };
    }

    // Select a random city or base
    const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
    return { x: target.x + (target.width / 2), y: target.y };
}
function createExplosion(x, y, startRadius, color, maxRadius = EXPLOSION_RADIUS_MAX_BASE, duration = EXPLOSION_DURATION, ignoreEnemyObjectsWhenExploding = false) {
    const effectiveMaxRadius = maxRadius || getCurrentPlayerExplosionRadius();
    if (typeof color !== 'string' || (!color.startsWith('#') && !color.startsWith('rgba'))) { color = '#888888'; }
    playSfx(explosionBuffer); // ADDED: Play explosion sound
    explosions.push({
        x: x, y: y, radius: startRadius, maxRadius: effectiveMaxRadius, duration: duration, currentFrame: 0, color: color, alive: true, collidedMissiles: new Set(), collidedBombs: new Set(), collidedPlanes: new Set(), ignoreEnemyObjectsWhenExploding: ignoreEnemyObjectsWhenExploding, killCount: 0, // NEW: Initialize kill count for combo
        update() { if (!this.alive) return; this.currentFrame++; const expansionPhase = this.duration * 0.6; if (this.currentFrame <= expansionPhase) { this.radius = startRadius + (this.maxRadius - startRadius) * (this.currentFrame / expansionPhase); } else { this.radius = this.maxRadius - (this.maxRadius * ((this.currentFrame - expansionPhase) / (this.duration - expansionPhase))); } this.radius = Math.max(0, this.radius); if (this.currentFrame >= this.duration) { this.alive = false; } if (this.currentFrame < expansionPhase) { checkExplosionCollisions(this); } },
        draw() { if (!this.alive) return; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); const intensity = Math.sin((this.currentFrame / this.duration) * Math.PI); let r = 180, g = 180, b = 180; try { if (this.color.startsWith('#') && this.color.length >= 7) { r = parseInt(this.color.slice(1, 3), 16); g = parseInt(this.color.slice(3, 5), 16); b = parseInt(this.color.slice(5, 7), 16); } else if (this.color.startsWith('rgba')) { const parts = this.color.match(/(\d+),\s*(\d+),\s*(\d+)/); if (parts) { r = parseInt(parts[1]); g = parseInt(parts[2]); b = parseInt(parts[3]); } } } catch (e) { console.warn("Could not parse explosion color:", this.color, e); r = 180; g = 180; b = 180; } ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.6})`; ctx.fill(); ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.3 * intensity, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.8})`; ctx.fill(); }
    });
}
function createPlane() {
    const startY = PLANE_MIN_Y + Math.random() * (PLANE_MAX_Y - PLANE_MIN_Y); const bombsToDrop = BASE_BOMBS_PER_PLANE + Math.floor(currentWave / 3) * BOMBS_INCREASE_PER_WAVE; const isVariant = Math.random() < PLANE_VARIANT_CHANCE; const speedMultiplier = isVariant ? 1.4 : 1.0; const planeSpeed = (PLANE_SPEED_BASE + currentWave * PLANE_SPEED_INCREASE_PER_WAVE) * speedMultiplier; const bodyColor = isVariant ? '#A9A9A9' : '#B0C4DE'; const wingColor = isVariant ? '#696969' : '#778899';
    return {
        x: canvas.width + PLANE_WIDTH, y: startY, width: PLANE_WIDTH, height: PLANE_HEIGHT, speed: planeSpeed, alive: true, bombsLeft: bombsToDrop, bombDropTimer: PLANE_BOMB_DROP_INTERVAL_MIN + Math.random() * (PLANE_BOMB_DROP_INTERVAL_MAX - PLANE_BOMB_DROP_INTERVAL_MIN), bodyColor: bodyColor, wingColor: wingColor, tailColor: '#708090', cockpitColor: '#1E90FF', engineColor: '#555555', isVariant: isVariant, wavePartType: 'plane',
        update() { if (!this.alive) return; this.x -= this.speed; this.bombDropTimer--; if (this.bombDropTimer <= 0 && this.bombsLeft > 0) { this.dropBomb(); this.bombsLeft--; this.bombDropTimer = PLANE_BOMB_DROP_INTERVAL_MIN + Math.random() * (PLANE_BOMB_DROP_INTERVAL_MAX - PLANE_BOMB_DROP_INTERVAL_MIN); } if (this.x < -this.width * 1.5) { this.alive = false; } },
        dropBomb() { const bombStartX = this.x + this.width / 2; const bombStartY = this.y + this.height * 0.7; planeBombs.push(createBomb(bombStartX, bombStartY)); },
        draw() { if (!this.alive) return; const w = this.width; const h = this.height; const x = this.x; const y = this.y; ctx.save(); ctx.translate(x, y); ctx.fillStyle = this.bodyColor; ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.3); ctx.lineTo(w * 0.85, h * 0.15); ctx.quadraticCurveTo(w, h * 0.5, w * 0.85, h * 0.85); ctx.lineTo(w * 0.1, h * 0.7); ctx.quadraticCurveTo(0, h * 0.5, w * 0.1, h * 0.3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = this.cockpitColor; ctx.beginPath(); ctx.moveTo(w * 0.7, h * 0.25); ctx.lineTo(w * 0.9, h * 0.4); ctx.lineTo(w * 0.9, h * 0.6); ctx.lineTo(w * 0.7, h * 0.75); ctx.closePath(); ctx.fill(); ctx.fillStyle = this.wingColor; ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.3); ctx.lineTo(w * 0.6, h * -0.1); ctx.lineTo(w * 0.7, h * 0.1); ctx.lineTo(w * 0.45, h * 0.4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.7); ctx.lineTo(w * 0.6, h * 1.1); ctx.lineTo(w * 0.7, h * 0.9); ctx.lineTo(w * 0.45, h * 0.6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#555'; ctx.stroke(); ctx.fillStyle = this.tailColor; ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.3); ctx.lineTo(w * 0.2, h * -0.1); ctx.lineTo(w * 0.25, h * 0.1); ctx.lineTo(w * 0.1, h * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = this.wingColor; ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.3); ctx.lineTo(w * 0.2, h * 0.1); ctx.lineTo(w * 0.25, h * 0.2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.7); ctx.lineTo(w * 0.2, h * 0.9); ctx.lineTo(w * 0.25, h * 0.8); ctx.closePath(); ctx.fill(); ctx.fillStyle = this.engineColor; ctx.fillRect(w * 0.4, h * 0.6, w * 0.25, h * 0.3); ctx.fillRect(w * 0.4, h * 0.1, w * 0.25, h * 0.3); ctx.restore(); }
    };
}
function createBomb(startX, startY) {
    const target = getRandomTarget(); const angle = Math.atan2(target.y - startY, target.x - startX); const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO); const speed = PLANE_BOMB_SPEED + (currentWave * 0.03);
    return {
        x: startX, y: startY, targetX: target.x, targetY: target.y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, color: PLANE_BOMB_COLOR, trailColor: PLANE_BOMB_TRAIL_COLOR, alive: true, trail: [{x: startX, y: startY}], isPlaneBomb: true,
        update() { if (!this.alive) return; this.x += this.dx; this.y += this.dy; this.trail.push({x: this.x, y: this.y}); if (this.trail.length > 12) { this.trail.shift(); } if (this.y >= this.targetY || this.y >= groundY) { this.alive = false; const impactY = Math.min(this.targetY, groundY); createExplosion(this.x, impactY, EXPLOSION_RADIUS_START * 0.8, this.color, EXPLOSION_RADIUS_MAX_BASE * 0.6); checkObjectImpact(this.x, impactY, this.isPlaneBomb); } },
        draw() { if (!this.alive) return; ctx.strokeStyle = this.trailColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y); for (let i = 1; i < this.trail.length; i++) { ctx.lineTo(this.trail[i].x, this.trail[i].y); } ctx.stroke(); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill(); }
    };
}

function createShieldBomb(config = {}) {
    const type = config.type || Math.floor(Math.random() * 3) + 1; // Random type 1-3 if not specified
    const startX = config.startX !== undefined ? config.startX : Math.random() * canvas.width;
    const startY = config.startY !== undefined ? config.startY : 0;
    const target = config.target || getRandomTarget();
    
    // Shield bombs move slower than regular missiles
    const baseSpeed = config.speed || (MISSILE_SPEED_ENEMY_BASE + (currentWave * 0.05)) * 0.7;
    const angle = Math.atan2(target.y - startY, target.x - startX);
    const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);
    
    // Size is 4x larger than regular missiles
    const size = 20; // Adjust based on your game scale
    
    // Define colors based on shield bomb type
    let colors = {
        coreColor: '#ff4400',
        innerShieldColor: '#ffcc00',
        middleShieldColor: '#44cc44',
        outerShieldColor: '#4488ff',
        trailColor: 'rgba(255, 100, 100, 0.4)'
    };
    
    // Adjust colors based on shield bomb type
    if (type === 2) { // Orbital Defense
        colors = {
            coreColor: '#990000',
            innerShieldColor: '#ffcc00',
            middleShieldColor: '#ff8800',
            outerShieldColor: '#ff4400',
            trailColor: 'rgba(255, 150, 100, 0.4)'
        };
    } else if (type === 3) { // Tech Sphere
        colors = {
            coreColor: '#ff3300',
            innerShieldColor: '#00ccff',
            middleShieldColor: '#00ffaa',
            outerShieldColor: '#88ff00',
            trailColor: 'rgba(100, 255, 150, 0.4)'
        };
    }
    
    return {
        x: startX,
        y: startY,
        targetX: target.x,
        targetY: target.y,
        dx: Math.cos(angle) * baseSpeed,
        dy: Math.sin(angle) * baseSpeed,
        speed: baseSpeed,
        color: colors.coreColor,
        trailColor: colors.trailColor,
        alive: true,
        trail: [{x: startX, y: startY}],
        
        // Shield bomb specific properties
        isShieldBomb: true,
        shieldBombType: type,
        shieldLayers: 3,
        hitsPerLayer: 3,
        currentLayerHits: 0,
        totalHitsTaken: 0,
        colors: colors,
        size: size,
        // IMPORTANT: Ensure the wavePartType is correctly set for counting
        wavePartType: 'shield_bomb', // Fixed value to ensure proper counting
        countedAsDestroyed: false, // NEW: Flag for deferred counting
        
        update() {
            if (!this.alive) return;
            
            this.x += this.dx;
            this.y += this.dy;
            
            // Update trail
            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > 20) { // Longer trail for shield bombs
                this.trail.shift();
            }
            
            // Check if reached target
            if (this.y >= this.targetY || this.y >= groundY) {
                this.alive = false;
                // Create a large explosion
                const impactY = Math.min(this.targetY, groundY);
                createExplosion(this.x, impactY, EXPLOSION_RADIUS_START * 2, this.color, EXPLOSION_RADIUS_MAX_BASE * 2, EXPLOSION_DURATION * 1.5);
                checkObjectImpact(this.x, impactY, false);
            }
        },
        
        draw() {
            if (!this.alive) return;
            
            // Draw trail
            ctx.strokeStyle = this.trailColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
            
            // Draw based on type
            if (this.shieldBombType === 1) {
                this.drawConcentricRings();
            } else if (this.shieldBombType === 2) {
                this.drawOrbitalDefense();
            } else if (this.shieldBombType === 3) {
                this.drawTechSphere();
            }
        },
        
        drawConcentricRings() {
            // Draw core
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw glow
            ctx.fillStyle = '#ff8800';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            
            // Draw shields based on remaining layers
            if (this.shieldLayers >= 1) {
                // Inner shield
                ctx.strokeStyle = this.colors.innerShieldColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            if (this.shieldLayers >= 2) {
                // Middle shield
                ctx.strokeStyle = this.colors.middleShieldColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            if (this.shieldLayers >= 3) {
                // Outer shield
                ctx.strokeStyle = this.colors.outerShieldColor;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        },
        
        drawOrbitalDefense() {
            // Draw core
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner orbit
            if (this.shieldLayers >= 1) {
                // Draw orbit path
                ctx.strokeStyle = this.colors.innerShieldColor;
                ctx.setLineDash([2, 2]);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw satellites (3 satellites in inner orbit)
                const innerRadius = this.size;
                for (let i = 0; i < 3; i++) {
                    const angle = (i * (Math.PI * 2 / 3)) + (Date.now() / 1000);
                    const satX = this.x + Math.cos(angle) * innerRadius;
                    const satY = this.y + Math.sin(angle) * innerRadius;
                    
                    ctx.fillStyle = this.colors.innerShieldColor;
                    ctx.beginPath();
                    ctx.arc(satX, satY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Middle orbit
            if (this.shieldLayers >= 2) {
                // Draw orbit path
                ctx.strokeStyle = this.colors.middleShieldColor;
                ctx.setLineDash([2, 2]);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw satellites (6 satellites in middle orbit)
                const middleRadius = this.size * 1.5;
                for (let i = 0; i < 6; i++) {
                    const angle = (i * (Math.PI * 2 / 6)) + (Date.now() / 1200);
                    const satX = this.x + Math.cos(angle) * middleRadius;
                    const satY = this.y + Math.sin(angle) * middleRadius;
                    
                    ctx.fillStyle = this.colors.middleShieldColor;
                    ctx.beginPath();
                    ctx.arc(satX, satY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Outer orbit
            if (this.shieldLayers >= 3) {
                // Draw orbit path
                ctx.strokeStyle = this.colors.outerShieldColor;
                ctx.setLineDash([2, 2]);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw satellites (12 satellites in outer orbit)
                const outerRadius = this.size * 2;
                for (let i = 0; i < 12; i++) {
                    const angle = (i * (Math.PI * 2 / 12)) + (Date.now() / 1500);
                    const satX = this.x + Math.cos(angle) * outerRadius;
                    const satY = this.y + Math.sin(angle) * outerRadius;
                    
                    ctx.fillStyle = this.colors.outerShieldColor;
                    ctx.beginPath();
                    ctx.arc(satX, satY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        },
        
        drawTechSphere() {
            // Draw core
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner shield
            if (this.shieldLayers >= 1) {
                // Main circle
                ctx.strokeStyle = this.colors.innerShieldColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                
                // Dashed overlay
                ctx.setLineDash([1, 2]);
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Cross pattern
                ctx.beginPath();
                ctx.moveTo(this.x - this.size * 0.7, this.y - this.size * 0.7);
                ctx.lineTo(this.x + this.size * 0.7, this.y + this.size * 0.7);
                ctx.moveTo(this.x - this.size * 0.7, this.y + this.size * 0.7);
                ctx.lineTo(this.x + this.size * 0.7, this.y - this.size * 0.7);
                ctx.strokeStyle = this.colors.innerShieldColor;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            
            // Middle shield
            if (this.shieldLayers >= 2) {
                // Main circle
                ctx.strokeStyle = this.colors.middleShieldColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                ctx.stroke();
                
                // Dashed overlay
                ctx.setLineDash([3, 2]);
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Cross pattern
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size * 1.5);
                ctx.lineTo(this.x, this.y + this.size * 1.5);
                ctx.moveTo(this.x - this.size * 1.5, this.y);
                ctx.lineTo(this.x + this.size * 1.5, this.y);
                ctx.strokeStyle = this.colors.middleShieldColor;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            
            // Outer shield
            if (this.shieldLayers >= 3) {
                // Main circle
                ctx.strokeStyle = this.colors.outerShieldColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.stroke();
                
                // Dashed overlay
                ctx.setLineDash([5, 3]);
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Tech nodes
                const radius = this.size * 2;
                for (let i = 0; i < 8; i++) {
                    const angle = (i * (Math.PI / 4)) + (Date.now() / 3000);
                    const nodeX = this.x + Math.cos(angle) * radius;
                    const nodeY = this.y + Math.sin(angle) * radius;
                    
                    ctx.fillStyle = this.colors.outerShieldColor;
                    ctx.beginPath();
                    ctx.arc(nodeX, nodeY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    };
}

// --- Collision Detection ---
function checkExplosionCollisions(explosion) {
    let explosionMadeKill = false;

    // Only check collisions with enemy missiles/planes/bombs if ignoreEnemyObjectsWhenExploding is false
    if (!explosion.ignoreEnemyObjectsWhenExploding) {
        incomingMissiles.forEach((missile, index) => { 
            if (missile.alive && !explosion.collidedMissiles.has(index)) { 
                const dist = distance(explosion.x, explosion.y, missile.x, missile.y); 
                if (dist < explosion.radius) { 
                    // Special handling for shield bombs
                    if (missile.isShieldBomb) {
                        // Register collision to prevent multiple hits from same explosion
                        explosion.collidedMissiles.add(index);
                        
                        // Apply damage to shield
                        missile.currentLayerHits++;
                        missile.totalHitsTaken++;
                        
                        // Create shield impact effect
                        const impactColor = missile.shieldLayers === 3 ? missile.colors.outerShieldColor : 
                                            missile.shieldLayers === 2 ? missile.colors.middleShieldColor : 
                                            missile.colors.innerShieldColor;
                        createExplosion(explosion.x, explosion.y, Math.min(explosion.radius * 0.5, 10), impactColor, null, 15, true);
                        
                        // Check if current layer is destroyed
                        if (missile.currentLayerHits >= missile.hitsPerLayer) {
                            missile.shieldLayers--;
                            missile.currentLayerHits = 0;
                            
                            // Create shield break effect
                            const breakColor = missile.shieldLayers === 2 ? missile.colors.outerShieldColor : 
                                              missile.shieldLayers === 1 ? missile.colors.middleShieldColor : 
                                              missile.colors.innerShieldColor;
                            createExplosion(missile.x, missile.y, missile.size * (missile.shieldLayers + 1), breakColor, missile.size * (missile.shieldLayers + 1.5), 30, true);
                            
                            // If all shields destroyed, explode the shield bomb
                            if (missile.shieldLayers <= 0) {
                                missile.alive = false; // Mark as destroyed
                                explosionMadeKill = true;
                                // Conditional immediate counting
                                if (!useDeferredKillCounting) {
                                    statsEnemyMissilesDestroyed++;
                                    statsShieldBombsDestroyed++;
                                }
                                
                                // Award points (3x normal missile points)
                                let pointsToAdd = POINTS_PER_MISSILE * 3;
                                if (explosion.color === '#00ff00' && dist < ACCURACY_BONUS_THRESHOLD) { 
                                    pointsToAdd += ACCURACY_BONUS_POINTS; 
                                    statsAccuracyBonusHits++; 
                                    messageBonusText.textContent = `ACCURACY BONUS +$${Math.round(ACCURACY_BONUS_POINTS * scoreMultiplier * difficultyScoreMultiplier)}!`; 
                                    accuracyBonusMessageTimer = 120; 
                                }
                                
                                const finalPoints = Math.round(pointsToAdd * scoreMultiplier * difficultyScoreMultiplier);
                                score += finalPoints;
                                gameTotalScore += finalPoints;
                                if (explosion.color === '#00ff00') explosion.killCount++; // Increment kill count for player explosions
                                
                                // Create large explosion
                                createExplosion(missile.x, missile.y, EXPLOSION_RADIUS_START * 2, missile.color, EXPLOSION_RADIUS_MAX_BASE * 2, EXPLOSION_DURATION * 1.5);
                                
                                // Spawn 2 smart bombs and 2 MIRVs
                                for (let i = 0; i < 2; i++) {
                                    // Smart bombs - top and bottom
                                    const angle1 = Math.PI / 4 + (i * Math.PI);
                                    const spawnX1 = missile.x + Math.cos(angle1) * 20;
                                    const spawnY1 = missile.y + Math.sin(angle1) * 20;
                                    
                                    incomingMissiles.push(createIncomingMissile({
                                        startX: spawnX1,
                                        startY: spawnY1,
                                        isSmartBomb: true,
                                        speed: missile.speed * 1.1,
                                        color: SMART_BOMB_SPLIT_COLOR,
                                        trailColor: 'rgba(255, 200, 100, 0.5)'
                                    }));
                                    
                                    // MIRVs - left and right
                                    const angle2 = -Math.PI / 4 + (i * Math.PI);
                                    const spawnX2 = missile.x + Math.cos(angle2) * 20;
                                    const spawnY2 = missile.y + Math.sin(angle2) * 20;
                                    
                                    incomingMissiles.push(createIncomingMissile({
                                        startX: spawnX2,
                                        startY: spawnY2,
                                        isMIRV: true,
                                        speed: missile.speed * 1.1,
                                        color: MIRV_WARHEAD_COLOR,
                                        trailColor: 'rgba(255, 150, 150, 0.5)'
                                    }));
                                }
                            }
                        }
                    } else {
                        // Original code for regular missiles
                        missile.alive = false; // Mark as destroyed
                        explosion.collidedMissiles.add(index);
                        explosionMadeKill = true;
                        // Conditional immediate counting
                        if (!useDeferredKillCounting) {
                            statsEnemyMissilesDestroyed++;
                        }
                        let pointsToAdd = POINTS_PER_MISSILE; if (explosion.color === '#00ff00' && dist < ACCURACY_BONUS_THRESHOLD) { pointsToAdd += ACCURACY_BONUS_POINTS; statsAccuracyBonusHits++; messageBonusText.textContent = `ACCURACY BONUS +$${Math.round(ACCURACY_BONUS_POINTS * scoreMultiplier * difficultyScoreMultiplier)}!`; accuracyBonusMessageTimer = 120; comboMessageTimer = 0; /* Clear combo message if accuracy bonus occurs */ } const finalPoints = Math.round(pointsToAdd * scoreMultiplier * difficultyScoreMultiplier); score += finalPoints; gameTotalScore += finalPoints; if (explosion.color === '#00ff00') explosion.killCount++; createExplosion(missile.x, missile.y, EXPLOSION_RADIUS_START, missile.color);
                    }
                }
            }
        });

        // Original code for planes and bombs (modified to increment killCount)
        planes.forEach((plane, index) => { if (plane.alive && !explosion.collidedPlanes.has(index)) { if (explosion.x + explosion.radius > plane.x && explosion.x - explosion.radius < plane.x + plane.width && explosion.y + explosion.radius > plane.y && explosion.y - explosion.radius < plane.y + plane.height) { plane.alive = false; explosion.collidedPlanes.add(index); explosionMadeKill = true; statsPlanesDestroyed++; const finalPoints = Math.round(PLANE_BONUS_SCORE * scoreMultiplier * difficultyScoreMultiplier); score += finalPoints; gameTotalScore += finalPoints; if (explosion.color === '#00ff00') explosion.killCount++; createExplosion(plane.x + plane.width / 2, plane.y + plane.height / 2, EXPLOSION_RADIUS_START * 1.5, plane.bodyColor, EXPLOSION_RADIUS_MAX_BASE * 1.2, EXPLOSION_DURATION * 1.2); } } });
        planeBombs.forEach((bomb, index) => { if (bomb.alive && !explosion.collidedBombs.has(index)) { const dist = distance(explosion.x, explosion.y, bomb.x, bomb.y); if (dist < explosion.radius) { bomb.alive = false; explosion.collidedBombs.add(index); explosionMadeKill = true; statsPlaneBombsDestroyed++; const finalPoints = Math.round(PLANE_BOMB_POINTS * scoreMultiplier * difficultyScoreMultiplier); score += finalPoints; gameTotalScore += finalPoints; if (explosion.color === '#00ff00') explosion.killCount++; createExplosion(bomb.x, bomb.y, EXPLOSION_RADIUS_START * 0.8, bomb.color); } } });
    }

    // --- NEW: Combo Bonus Logic ---
    if (explosion.color === '#00ff00' && explosion.killCount > 1) {
        const comboPoints = (explosion.killCount - 1) * COMBO_BONUS_POINTS_PER_EXTRA_KILL;
        const finalComboPoints = Math.round(comboPoints * scoreMultiplier * difficultyScoreMultiplier);
        score += finalComboPoints;
        gameTotalScore += finalComboPoints;
        messageBonusText.textContent = `COMBO x${explosion.killCount}! +$${finalComboPoints}!`;
        comboMessageTimer = 120; // Display for 2 seconds
        accuracyBonusMessageTimer = 0; // Combo message overrides accuracy bonus message
        console.log(`Combo x${explosion.killCount}! Bonus: +$${finalComboPoints}`);
    }
    // --- END Combo Bonus Logic ---


    if (explosionMadeKill && explosion.color === '#00ff00') { consecutiveIntercepts++; scoreMultiplier = Math.min(MULTIPLIER_MAX, 1.0 + Math.floor(consecutiveIntercepts / MULTIPLIER_INCREASE_INTERVAL)); updateUI(); }
}
function checkObjectImpact(impactX, impactY, isBomb = false) {
    const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO); const cityHeight = canvas.height * CITY_HEIGHT_RATIO; const baseHeight = canvas.height * BASE_HEIGHT_RATIO; let hitOccurred = false;
    for (let i = 0; i < baseShields.length; i++) { const shield = baseShields[i]; if (shield && shield.alive) { const base = bases[i]; const shieldCenterX = base.x + base.width / 2; const shieldRadius = BASE_SHIELD_RADIUS_MULTIPLIER * ((base.width / 2) + (canvas.width * CITY_WIDTH_RATIO / 2) + 5); const shieldBottomEdgeY = base.y - 15; const shieldApexY = shieldBottomEdgeY - shieldRadius * 0.3; const startX = shieldCenterX - shieldRadius; const endX = shieldCenterX + shieldRadius; const shieldWidth = endX - startX; if (impactX >= startX && impactX <= endX) { let y_on_curve; if (shieldWidth > 0) { const t = (impactX - startX) / shieldWidth; const one_minus_t = 1 - t; y_on_curve = (one_minus_t * one_minus_t * shieldBottomEdgeY) + (2 * one_minus_t * t * shieldApexY) + (t * t * shieldBottomEdgeY); } else { y_on_curve = shieldBottomEdgeY; } if (impactY >= y_on_curve) { shield.strength -= SHIELD_DAMAGE_PER_HIT; shield.flashTimer = SHIELD_FLASH_DURATION; if (shield.strength <= 0) { shield.alive = false; createExplosion(impactX, impactY, EXPLOSION_RADIUS_START * 1.5, '#ffffff'); } else { createExplosion(impactX, impactY, EXPLOSION_RADIUS_START * 0.5, SHIELD_FLASH_COLOR); } return; } } } }
    for (let i = 0; i < satelliteBases.length; i++) { const sat = satelliteBases[i]; if (sat.alive && sat.shield && sat.shield.alive) { const shieldCenterX = sat.x + sat.width / 2; const shieldCenterY = sat.y + sat.height / 2; const shieldRadiusX = sat.width * 0.6 + 4; const shieldRadiusY = sat.height * 0.8 + 4; const dx = impactX - shieldCenterX; const dy = impactY - shieldCenterY; if (((dx * dx) / (shieldRadiusX * shieldRadiusX)) + ((dy * dy) / (shieldRadiusY * shieldRadiusY)) <= 1) { sat.shield.strength -= SHIELD_DAMAGE_PER_HIT; sat.shield.flashTimer = SHIELD_FLASH_DURATION; if (sat.shield.strength <= 0) { sat.shield.alive = false; createExplosion(impactX, impactY, EXPLOSION_RADIUS_START * 1.2, '#eeeeee'); } else { createExplosion(impactX, impactY, EXPLOSION_RADIUS_START * 0.5, SHIELD_FLASH_COLOR); } return; } } }
    satelliteBases.forEach(sat => { if (sat.alive && impactX >= sat.x && impactX <= sat.x + sat.width && impactY >= sat.y && impactY <= sat.y + sat.height) { sat.alive = false; hitOccurred = true; createExplosion(impactX, impactY, EXPLOSION_RADIUS_START, sat.outlineColor); } });
    if (impactY >= groundY - cityHeight && impactY < groundY) { cities.forEach(city => { if (city.alive && impactX >= city.x && impactX <= city.x + city.width) { city.alive = false; hitOccurred = true; statsCitiesLost++; } }); }
    if (impactY >= groundY - baseHeight && impactY < groundY) { bases.forEach(base => { if (base.alive && impactX >= base.x && impactX <= base.x + base.width) { base.alive = false; hitOccurred = true; statsBasesLost++; } }); }
    if (hitOccurred) { consecutiveIntercepts = 0; scoreMultiplier = 1.0; updateUI(); }
}

/**
 * Generates extended wave definitions up to wave 100 based on the scaling formula
 * @param {Array} baseWaves - The base wave definitions (11 waves)
 * @param {number} maxWaveToDefine - The maximum wave number to define
 * @returns {Array} - All waves from 1 to maxWaveToDefine
 */
function generateExtendedWaveDefinitions(baseWaves, maxWaveToDefine) {
    const extendedWaves = [...baseWaves]; // Copy first 11 waves
    
    // Generate definitions for waves 12 to maxWaveToDefine
    for (let waveIndex = baseWaves.length; waveIndex < maxWaveToDefine; waveIndex++) {
        // Use existing scaling formula
        const baseScalingIncrease = 0.06;
        const maxScalingFactor = 4.0;
        
        const scalingFactor = Math.min(
            maxScalingFactor,
            1 + (waveIndex - (baseWaves.length - 1)) * baseScalingIncrease
        );
        
        // Clone the last defined wave and scale it
        const newWave = JSON.parse(JSON.stringify(baseWaves[baseWaves.length - 1]));
        newWave.forEach(part => {
            part.count = Math.ceil(part.count * scalingFactor);
            if (part.speedFactor) {
                part.speedFactor = Math.min(3.0, part.speedFactor * scalingFactor);
            }
        });
        
        extendedWaves.push(newWave);
    }
    
    return extendedWaves;
}

// --- Wave System Logic ---
function defineWaves() {
    return [
        [{ type: 'missile', count: 22, speedFactor: 1.1 }, { type: 'plane', count: 1 }], // Wave 1
        
        // Wave 2 - Introduce a single shield bomb (Type 1: Concentric Rings) at lower speed
        [{ type: 'missile', count: 28, speedFactor: 1.15 }, { type: 'plane', count: 1 }, { type: 'shield_bomb', count: 1, bombType: 1, speedFactor: 0.65 }],
        
        // Wave 3 - Slightly faster shield bomb, same type for consistency
        [{ type: 'missile', count: 33, speedFactor: 1.2 }, { type: 'plane', count: 3, variantChance: 0.1 }, { type: 'shield_bomb', count: 1, bombType: 1, speedFactor: 0.75 }],
        
        // Wave 4 - Introduce Type 2 shield bomb (Orbital Defense)
        [{ type: 'missile', count: 24, speedFactor: 1.25 }, { type: 'plane', count: 4, variantChance: 0.2 }, { type: 'smart_bomb', count: 5, speedFactor: 1.0 }, { type: 'shield_bomb', count: 1, bombType: 2, speedFactor: 0.80 }],
        
        // Wave 5 - Introduce Type 3 shield bomb (Tech Sphere)
        [{ type: 'missile', count: 26, speedFactor: 1.25 }, { type: 'plane', count: 6, variantChance: 0.2 }, { type: 'smart_bomb', count: 7, speedFactor: 1.1 }, { type: 'shield_bomb', count: 1, bombType: 3, speedFactor: 0.85 }],
        
        // Wave 6 - Two shield bombs (mixed types)
        [{ type: 'missile', count: 28, speedFactor: 1.35 }, { type: 'plane', count: 8, variantChance: 0.2 }, { type: 'mirv', count: 7, speedFactor: 1.0 }, { type: 'shield_bomb', count: 2, speedFactor: 0.85 }],
        
        // Wave 7 - Increase shield bomb count
        [{ type: 'missile', count: 31, speedFactor: 1.40 }, { type: 'smart_bomb', count: 7, speedFactor: 1.15 }, { type: 'plane', count: 9, variantChance: 0.35, speedFactor: 1.1 }, { type: 'shield_bomb', count: 2, speedFactor: 0.90 }],
        
        // Wave 8 - More shield bombs at faster speed
        [{ type: 'missile', count: 36, speedFactor: 1.45 }, { type: 'mirv', count: 16, speedFactor: 1.15 }, { type: 'smart_bomb', count: 7, speedFactor: 1.2 }, { type: 'shield_bomb', count: 3, speedFactor: 0.95 }],
        
        // Wave 9 - Mix of all enemy types
        [{ type: 'missile', count: 35, speedFactor: 1.5 }, { type: 'smart_bomb', count: 7, speedFactor: 1.35 }, { type: 'mirv', count: 5, speedFactor: 1.25 }, { type: 'plane', count: 9, variantChance: 0.5, speedFactor: 1.2 }, { type: 'shield_bomb', count: 3, speedFactor: 0.95 }],
        
        // Wave 10 - Even more challenging
        [{ type: 'missile', count: 38, speedFactor: 1.6 }, { type: 'smart_bomb', count: 7, speedFactor: 1.5 }, { type: 'mirv', count: 6, speedFactor: 1.4 }, { type: 'plane', count: 10, variantChance: 0.6, speedFactor: 1.3 }, { type: 'shield_bomb', count: 3, speedFactor: 1.0 }],
        
        // Wave 11 - Maximum challenge with all types and specific shield bomb types
        [{ type: 'missile', count: 38, speedFactor: 1.7 }, { type: 'smart_bomb', count: 7, speedFactor: 1.6 }, { type: 'mirv', count: 7, speedFactor: 1.5 }, { type: 'plane', count: 12, variantChance: 0.7, speedFactor: 1.4 }, { type: 'shield_bomb', count: 2, bombType: 1, speedFactor: 1.05 }, { type: 'shield_bomb', count: 2, bombType: 2, speedFactor: 1.05 }, { type: 'shield_bomb', count: 2, bombType: 3, speedFactor: 1.10 }],
    ];
}

const extendedWaveDefinitions = generateExtendedWaveDefinitions(waveDefinitions, 100);

function initWave(waveIndex) {
    try {
        console.log(`initWave: Entered for wave ${waveIndex}`);
        currentWave = waveIndex;
        waveTimer = 0; // Reset wave timer
        waveStartTime = Date.now(); // ADDED: Start wave timer

        // Use extended wave definitions when possible
        // For waves 1-100, use the pre-calculated definitions
        if (waveIndex < extendedWaveDefinitions.length) {
            console.log(`initWave: Using pre-defined wave configuration for wave ${waveIndex + 1}`);
            currentWaveConfig = JSON.parse(JSON.stringify(extendedWaveDefinitions[waveIndex]));
        } else {
            // For waves beyond 100, use the highest defined wave with dynamic scaling
            console.log(`initWave: Using dynamically scaled wave for wave ${waveIndex + 1}`);
            
            const baseWaveIndex = extendedWaveDefinitions.length - 1; // Wave 100
            const baseScalingIncrease = 0.06;
            const maxScalingFactor = 4.0;
            
            // Calculate scaling for waves beyond the pre-defined ones
            const extraWaveCount = waveIndex - baseWaveIndex;
            const scalingFactor = Math.min(
                maxScalingFactor,
                1 + extraWaveCount * baseScalingIncrease
            );
            
            // Clone the highest defined wave and scale it
            currentWaveConfig = JSON.parse(JSON.stringify(extendedWaveDefinitions[baseWaveIndex]));
            currentWaveConfig.forEach(part => {
                part.count = Math.ceil(part.count * scalingFactor);
                if (part.speedFactor) {
                    part.speedFactor = Math.min(3.0, part.speedFactor * scalingFactor);
                }
            });
            
            console.log(`initWave: Dynamically scaled wave ${waveIndex + 1} with factor ${scalingFactor.toFixed(2)}`);
        }

        // Rest of your existing initWave code...
        // Clear game objects
        incomingMissiles = [];
        playerMissiles = [];
        explosions = [];
        activeSonicWave = null;
        planes = [];
        planeBombs = [];
        waveEnemiesSpawned = 0;

        // Calculate with better error handling
        waveEnemiesRequired = 0;
        currentWaveConfig.forEach(part => {
            if (typeof part === 'object' && part !== null && typeof part.count === 'number') {
                waveEnemiesRequired += part.count;
            } else {
                console.warn(`Skipping invalid part in wave config ${waveIndex}:`, part);
            }
        });

        // Ensure we have at least some enemies
        if (waveEnemiesRequired <= 0) {
            console.warn(`Warning: waveEnemiesRequired calculated as ${waveEnemiesRequired}, setting to default 20`);
            waveEnemiesRequired = 20;
        }

        console.log(`initWave: waveEnemiesRequired = ${waveEnemiesRequired}`);

        // Refresh base ammo
        bases.forEach(b => { if (b.alive) b.ammo = selectedDifficultyAmmo; });
        satelliteBases.forEach(s => { if (s.alive) s.ammo = selectedDifficultyAmmo; });

        updateUI();
        updateSpecialWeaponsUI();

        console.log(`initWave: Exiting for wave ${waveIndex}`);
    } catch (error) {
        console.error(`Error during initWave(${waveIndex}):`, error);
        showMessage("WAVE INIT ERROR", `Failed to initialize wave ${waveIndex + 1}: ${error.message}`, "Check console for details.");
        isGameOver = true;
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
    }
}
function spawnEnemiesForWave() {
    if (transitioningWave || isGameOver || isPaused || waveEnemiesSpawned >= waveEnemiesRequired) return;
    
    // DEBUG: Log current shield bombs to help troubleshoot
    if (currentWave <= 5) { // Only for first few waves to minimize log spam
        const shieldBombsConfig = currentWaveConfig.find(p => p.type === 'shield_bomb');
        const shieldBombsRequired = shieldBombsConfig ? shieldBombsConfig.count : 0;
        const currentShieldBombs = incomingMissiles.filter(m => m.isShieldBomb).length;
        console.log(`Wave ${currentWave + 1}: Shield bombs - Current: ${currentShieldBombs}, Required: ${shieldBombsRequired}`);
    }
    
    const potentialSpawns = [];
    currentWaveConfig.forEach(part => {
        const requiredForThisPart = part.count || 0;
        
        // IMPROVED: Directly check for shield bombs by using isShieldBomb property
        let currentSpawnedForThisPart;
        if (part.type === 'plane') {
            currentSpawnedForThisPart = planes.filter(e => e.wavePartType === part.type).length;
        } else if (part.type === 'shield_bomb') {
            // Use isShieldBomb property for more reliable tracking
            currentSpawnedForThisPart = incomingMissiles.filter(m => m.isShieldBomb).length;
        } else {
            // Regular missile types
            currentSpawnedForThisPart = incomingMissiles.filter(e => e.wavePartType === part.type).length;
        }
        
        if (currentSpawnedForThisPart < requiredForThisPart) {
            // Cap the spawn rate multiplier to prevent excessively high spawn chances
            const spawnRateMultiplier = Math.min(5.0, 1 + currentWave * 0.15);
            
            // Adjust base spawn chances by enemy type
            let baseSpawnChance = 0.025;
            if (part.type === 'plane') { baseSpawnChance = PLANE_SPAWN_CHANCE; }
            if (part.type === 'shield_bomb') { baseSpawnChance = 0.015; } // Lower chance for shield bombs
            
            // Cap the speed factor to prevent excessively fast enemies
            const safeFactor = Math.min(3.0, part.speedFactor || 1.0);
            
            // Cap the final spawn chance to prevent issues
            let spawnChance = Math.min(0.75, baseSpawnChance * spawnRateMultiplier * safeFactor);
            
            potentialSpawns.push({ partConfig: part, spawnChance: spawnChance });
        }
    });
    
    if (potentialSpawns.length > 0) {
        const randomIndex = Math.floor(Math.random() * potentialSpawns.length);
        const selectedSpawn = potentialSpawns[randomIndex];
        const part = selectedSpawn.partConfig;
        
        if (Math.random() < selectedSpawn.spawnChance) {
            if (part.type === 'missile' || part.type === 'smart_bomb' || part.type === 'mirv') {
                // Original code for regular missiles, smart bombs, and MIRVs
                let missileType = part.type;
                let baseSpeed = MISSILE_SPEED_ENEMY_BASE + (currentWave * 0.08);
                baseSpeed = Math.min(baseSpeed, MAX_ENEMY_MISSILE_SPEED);
                let config = {
                    speed: baseSpeed * Math.min(3.0, part.speedFactor || 1.0),
                    isSmartBomb: missileType === 'smart_bomb',
                    isMIRV: missileType === 'mirv',
                    wavePartType: part.type
                };
                incomingMissiles.push(createIncomingMissile(config));
                waveEnemiesSpawned++;
            } 
            else if (part.type === 'shield_bomb') {
                // Shield bomb creation - with fixed wavePartType
                let baseSpeed = (MISSILE_SPEED_ENEMY_BASE + (currentWave * 0.05)) * 0.7; // Shield bombs move slower
                baseSpeed = Math.min(baseSpeed, MAX_ENEMY_MISSILE_SPEED * 0.7);
                
                const shieldBomb = createShieldBomb({
                    type: part.bombType || Math.floor(Math.random() * 3) + 1, // Random type if not specified
                    speed: baseSpeed * Math.min(3.0, part.speedFactor || 1.0)
                    // NOTE: wavePartType is now hardcoded in the createShieldBomb function
                });
                
                incomingMissiles.push(shieldBomb);
                waveEnemiesSpawned++;
                
                // DEBUG: Log when a shield bomb is spawned
                if (currentWave <= 5) {
                    const currentShieldBombs = incomingMissiles.filter(m => m.isShieldBomb).length;
                    console.log(`Added shield bomb of type ${shieldBomb.shieldBombType}. Current count: ${currentShieldBombs}`);
                }
            }
            else if (part.type === 'plane') {
                const newPlane = createPlane();
                newPlane.wavePartType = part.type;
                planes.push(newPlane);
                waveEnemiesSpawned++;
            }
        }
    }
    
    // Force wave completion when we've spawned enough enemies
    // This is an additional safeguard
    if (waveEnemiesSpawned >= waveEnemiesRequired && waveAllSpawnedTimestamp === 0) { // Check if timestamp not already set
        waveAllSpawnedTimestamp = Date.now(); // Record timestamp when last enemy is spawned
        console.log(`All required enemies (${waveEnemiesRequired}) spawned for wave ${currentWave + 1} at ${waveAllSpawnedTimestamp}`);
    }
}
function checkWaveEnd() {
    if (transitioningWave || isGameOver || isPaused) return;

    const allEnemiesSpawned = waveEnemiesRequired > 0 ? waveEnemiesSpawned >= waveEnemiesRequired : waveTimer > 600;

    // Count remaining active objects ON screen vs OFF screen
    let activeOnScreenEnemies = 0;
    let activeOffScreenEnemies = 0;
    const offScreenBuffer = 100; // How far off-screen before considered "stuck"

    incomingMissiles.forEach(m => {
        if (m.alive) {
            if (m.x < -offScreenBuffer || m.x > canvas.width + offScreenBuffer || m.y < -offScreenBuffer || m.y > canvas.height + offScreenBuffer) {
                activeOffScreenEnemies++;
            } else {
                activeOnScreenEnemies++;
            }
        }
    });
    planes.forEach(p => {
        if (p.alive) {
            // Planes only move left, check left boundary mainly + some top/bottom buffer
            if (p.x < -p.width - offScreenBuffer || p.y < -offScreenBuffer || p.y > canvas.height + offScreenBuffer) {
                 activeOffScreenEnemies++;
            } else {
                 activeOnScreenEnemies++;
            }
        }
    });
    planeBombs.forEach(b => {
         if (b.alive) {
            if (b.x < -offScreenBuffer || b.x > canvas.width + offScreenBuffer || b.y < -offScreenBuffer || b.y > canvas.height + offScreenBuffer) {
                activeOffScreenEnemies++;
            } else {
                activeOnScreenEnemies++;
            }
        }
    });

    // Count remaining active explosions ON screen vs OFF screen
    let activeOnScreenExplosions = 0;
    let activeOffScreenExplosions = 0;
     explosions.forEach(e => {
        if (e.alive) {
             // Check if explosion center is way off screen
             if (e.x < -offScreenBuffer || e.x > canvas.width + offScreenBuffer || e.y < -offScreenBuffer || e.y > canvas.height + offScreenBuffer) {
                 activeOffScreenExplosions++;
             } else {
         activeOnScreenExplosions++;
             }
        }
    });

    const noActiveSonicWave = !activeSonicWave || !activeSonicWave.alive;

    // Condition 1: Normal completion (zero active objects left)
    const normalCompletion = allEnemiesSpawned && activeOnScreenEnemies === 0 && activeOffScreenEnemies === 0 && activeOnScreenExplosions === 0 && activeOffScreenExplosions === 0 && noActiveSonicWave;

    // Condition 2: Completion because only off-screen objects remain
    const offScreenCompletion = allEnemiesSpawned && activeOnScreenEnemies === 0 && activeOnScreenExplosions === 0 && (activeOffScreenEnemies > 0 || activeOffScreenExplosions > 0) && noActiveSonicWave;

    if (normalCompletion) {
        console.log(`Wave ${currentWave + 1} completed successfully!`);
        transitioningWave = true;
        nextWave();
    } else if (offScreenCompletion) {
        // Log which objects were stuck off-screen for debugging
        if (activeOffScreenEnemies > 0) console.warn(`Found ${activeOffScreenEnemies} enemies stuck off-screen.`);
        if (activeOffScreenExplosions > 0) console.warn(`Found ${activeOffScreenExplosions} explosions stuck off-screen.`);
        console.warn(`Wave ${currentWave + 1} force-completed due to only off-screen objects remaining!`);
        transitioningWave = true;
        nextWave();
    } else if (allEnemiesSpawned && waveTimer > 7200) { // INCREASED Timeout safety net (120 seconds after all spawned)
        console.warn(`Wave ${currentWave + 1} force-completed due to cleanup timeout! ` +
                      `Spawned: ${waveEnemiesSpawned}/${waveEnemiesRequired}, ` +
                      `Remaining On-Screen Enemies: ${activeOnScreenEnemies}, ` +
                     `Remaining Off-Screen Enemies: ${activeOffScreenEnemies}, ` +
                     `Remaining On-Screen Explosions: ${activeOnScreenExplosions}`);
        transitioningWave = true;
        nextWave();
    }
}

// --- Game Flow ---
async function startGame() {
    try {
        // Fetch a new session token before starting the game
        await fetchSessionToken();
        console.log("startGame: Entered"); if (!difficultySelected) { console.warn("Difficulty not selected!"); return; } console.log("startGame: Difficulty selected, proceeding..."); optimizeCanvasForOrientation(); gameStartTimestamp = Date.now(); console.log(`Game started at: ${new Date(gameStartTimestamp).toISOString()}`);
        score = 0; scoreSubmitted = false; gameTotalScore = 0; gameClickData = []; storeActions = []; currentWave = -1; isGameOver = false; isPaused = false; transitioningWave = false; gameHasStarted = true; bonusMissileCount = 0;
        storeStockSatellite = MAX_STOCK_SATELLITE; storeStockBase = MAX_STOCK_BASE; storeStockCity = MAX_STOCK_CITY; storeStockShield = MAX_STOCK_SHIELD; storeStockSatShield = MAX_STOCK_SAT_SHIELD; storeStockSonicWave = MAX_STOCK_SONIC_WAVE; storeStockBomb = MAX_STOCK_BOMB;
        inventorySonicWave = 0; inventoryBomb = 0; isBombArmed = false; activeSonicWave = null; satelliteBases = []; baseShields = [null, null, null]; planes = []; planeBombs = []; incomingMissiles = []; playerMissiles = []; explosions = []; statsMissilesFired = 0; statsEnemyMissilesDestroyed = 0; statsPlaneBombsDestroyed = 0; statsPlanesDestroyed = 0; statsCitiesLost = 0; statsBasesLost = 0; statsAccuracyBonusHits = 0; playerMissileSpeedLevel = 0; explosionRadiusLevel = 0; consecutiveIntercepts = 0; scoreMultiplier = 1.0; highScore = parseInt(localStorage.getItem('missileCommandHighScore') || '0');

        initializeStars();

        // Reset duration/stat tracking
        totalGameDurationSeconds = 0; waveStartTime = 0; waveAllSpawnedTimestamp = 0; waveStats = [];
        console.log("startGame: State variables reset");
        console.log("startGame: Setting up UI..."); startMenuContainer.style.display = 'none'; canvasContainer.style.display = 'block'; canvas.style.display = 'block'; uiContainer.style.display = 'flex'; controlsContainer.style.display = 'flex'; specialWeaponsUIDiv.style.display = 'flex'; screenshotButton.style.display = 'inline-block'; hideMessage(); statsContainer.style.display = 'none'; pauseOverlay.style.display = 'none'; canvas.style.cursor = 'crosshair'; console.log("startGame: UI setup complete");
        console.log("startGame: Initializing game objects..."); cities = []; const cityWidth = canvas.width * CITY_WIDTH_RATIO; const citySpacingRatio = (INTERNAL_WIDTH - 6 * (INTERNAL_WIDTH * CITY_WIDTH_RATIO)) / (7 * INTERNAL_WIDTH); const cityWidthRatio = CITY_WIDTH_RATIO; for (let i = 0; i < 3; i++) cities.push(createCity(citySpacingRatio * (i + 1) + cityWidthRatio * i)); for (let i = 0; i < 3; i++) cities.push(createCity(citySpacingRatio * (i + 4) + cityWidthRatio * (i + 3))); cities.forEach(c => c.alive = true); bases = []; const basePositionsRatios = [0.15, 0.5, 0.85]; bases.push(createBase(basePositionsRatios[0])); bases.push(createBase(basePositionsRatios[1])); bases.push(createBase(basePositionsRatios[2])); bases.forEach(b => b.alive = true); console.log("startGame: Game objects initialized");
        console.log("startGame: Calling initWave(0)..."); initWave(0); console.log("startGame: initWave(0) complete");
        restartButton.style.display = 'inline-block'; pauseButton.style.display = 'inline-block'; pauseButton.textContent = 'Pause'; pauseButton.disabled = false;
        if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; } console.log("startGame: Calling gameLoop()...");
        // Reset keyboard controls
        keyboardSelectedBaseIndex = -1;
        reticleX = canvas.width / 2;
        reticleY = canvas.height / 2;
        keyboardTargetingActive = false;
        // Update to use new startGameLoop function
        startGameLoop();
        // playMusic(); // REMOVED: Don't autoplay music
        console.log("startGame: Exiting");
    } catch (error) { console.error("Error during startGame:", error); showMessage("STARTUP ERROR", `Failed to start game: ${error.message}`, "Check console for details."); isGameOver = true; }
}
function nextWave() {
    // ADDED: Accumulate wave duration
    const waveCompletionTimestamp = Date.now(); // Timestamp when wave actually completes
    let spawnToCompletionMs = null;
    if (waveAllSpawnedTimestamp > 0) { // Ensure spawn timestamp was recorded
        spawnToCompletionMs = waveCompletionTimestamp - waveAllSpawnedTimestamp;
        console.log(`Wave ${currentWave + 1}: Spawn-to-completion duration: ${(spawnToCompletionMs / 1000).toFixed(1)}s`);
    } else {
        console.warn(`Wave ${currentWave + 1}: waveAllSpawnedTimestamp not set, cannot calculate spawn-to-completion duration.`);
    }
    // Store the stat for this wave (even if null)
    waveStats[currentWave] = { spawnToCompletionMs: spawnToCompletionMs };
    waveAllSpawnedTimestamp = 0; // Reset for the next wave

    // ADDED: Accumulate wave duration
    if (waveStartTime > 0) {
        const waveDuration = (waveCompletionTimestamp - waveStartTime) / 1000; // Use completion timestamp
        totalGameDurationSeconds += waveDuration;
        console.log(`Wave ${currentWave + 1} total duration: ${waveDuration.toFixed(1)}s. Total game duration: ${totalGameDurationSeconds.toFixed(1)}s`);
        waveStartTime = 0; // Reset for next wave start in initWave
    }
    let bonusEarned = calculateBonus();
    score += Math.round(bonusEarned * difficultyScoreMultiplier);
    gameTotalScore += Math.round(bonusEarned * difficultyScoreMultiplier);
    updateUI();
    const citiesSurvived = cities.filter(c => c.alive).length;
    const citiesLost = 6 - citiesSurvived;
    let bonusChangeMsg = "";
    if (citiesLost > 0) {
        const lostBonus = Math.min(bonusMissileCount, citiesLost);
        if (lostBonus > 0) { bonusChangeMsg = `Lost ${lostBonus} bonus missile${lostBonus > 1 ? 's' : ''}!`; bonusMissileCount -= lostBonus; }
    } else { bonusMissileCount++; bonusChangeMsg = `PERFECT! +1 Bonus Missile!`; }
    bonusMissileCount = Math.max(0, bonusMissileCount);
    if (bonusMissileCount > 0) { bonusChangeMsg += ` (Total +${bonusMissileCount} active next wave)`; }
    else if (bonusChangeMsg !== "" && citiesLost > 0) { bonusChangeMsg += ` (Bonus Fire deactivated)`; }
    else if (bonusChangeMsg === "" && citiesLost > 0){ bonusChangeMsg = ""; }
    isBombArmed = false; canvas.style.cursor = 'crosshair'; bombControl.classList.remove('armed');
    // remove any existing summary link or back button before showing wave completion message
    const summaryLink = document.getElementById('viewGameSummaryLink');
    if (summaryLink) {
        summaryLink.remove();
    }
    const backButton = document.getElementById('backToScoreButton'); // ADDED: Find back button
    if (backButton) { // ADDED: Remove back button if it exists
        backButton.remove();
    }
    showMessage(`WAVE ${currentWave + 1} CLEARED`, `Score Bonus: $${Math.round(bonusEarned * difficultyScoreMultiplier)}`, "", bonusChangeMsg);
    goToStoreButton.style.display = 'inline-block'; skipStoreButton.style.display = 'inline-block'; pauseButton.disabled = true; statsContainer.style.display = 'none'; updateUI();
}
function proceedToNextWave() { storeModal.style.display = 'none'; hideMessage(); initWave(currentWave + 1); transitioningWave = false; pauseButton.disabled = false; if (!isPaused && !gameLoopId) { startGameLoop(); } }
function calculateBonus() { let bonus = 0; cities.forEach(city => { if (city.alive) bonus += POINTS_PER_CITY; }); bases.forEach(base => { if (base.alive) bonus += base.ammo * POINTS_PER_AMMO; }); satelliteBases.forEach(sat => { if (sat.alive) bonus += sat.ammo * POINTS_PER_AMMO; }); return bonus; }
function checkGameOverConditions() { if (isGameOver || !gameHasStarted) return; const basesRemaining = bases.filter(b => b.alive).length; const citiesRemaining = cities.filter(c => c.alive).length; const satellitesRemaining = satelliteBases.filter(s => s.alive).length; if (citiesRemaining === 0 || (basesRemaining === 0 && satellitesRemaining === 0)) { gameOver(); } }

// --- Game Over Function (Incorporates submission UI) ---
function gameOver() {
    if (isGameOver) return; // Prevent running multiple times
    console.log("Game Over triggered.");
    isGameOver = true;
    gameHasStarted = false; transitioningWave = false; isPaused = false;
    
    // ADDED: Calculate total game duration from start timestamp
    const gameEndTimestamp = Date.now();
    const actualGameDuration = (gameEndTimestamp - gameStartTimestamp) / 1000; // in seconds
    console.log(`Game ended at: ${new Date(gameEndTimestamp).toISOString()}`);
    console.log(`Total game time from button click: ${actualGameDuration.toFixed(1)}s`);
    
    // Compare with tracked wave durations for validation
    if (Math.abs(actualGameDuration - totalGameDurationSeconds) > 5) {
        if (window.enableDebugLogging) {
            console.warn(`Duration discrepancy: Wave-based calculation (${totalGameDurationSeconds.toFixed(1)}s) differs from start-to-end time (${actualGameDuration.toFixed(1)}s)`);
        }
    }
    
    // ADDED: Accumulate final wave duration on game over
    if (waveStartTime > 0) {
        const waveDuration = (Date.now() - waveStartTime) / 1000;
        totalGameDurationSeconds += waveDuration;
        console.log(`Final wave (${currentWave + 1}) duration: ${waveDuration.toFixed(1)}s. Total duration: ${totalGameDurationSeconds.toFixed(1)}s`);
        waveStartTime = 0;
    }
    
    bonusMissileCount = 0; baseShields = [null, null, null];
    isBombArmed = false; activeSonicWave = null;
    canvas.style.cursor = 'default'; // Change cursor back from crosshair/cell
    planes = []; planeBombs = []; // Clear remaining enemies

    // --- Save Click Data to Local Storage ---
    const fixedStorageKey = 'missileCommandLastGameData';
    if (gameClickData && gameClickData.length > 0) {
        try {
            const difficulty = selectedDifficultyName || 'Unknown';
            const timestamp = new Date().toISOString();
            const dataToStore = {
                // Metadata about the game session
                difficulty: difficulty,
                timestamp: timestamp,
                score: gameTotalScore,
                wave: currentWave + 1,
                // ADDED: Include game timing information
                timingInfo: {
                    gameStartTimestamp: gameStartTimestamp,
                    gameEndTimestamp: gameEndTimestamp,
                    totalDurationSeconds: actualGameDuration,
                    calculatedDurationSeconds: totalGameDurationSeconds
                },
                // Include game stats for analysis context
                stats: {
                    missilesFired: statsMissilesFired,
                    enemyMissilesDestroyed: statsEnemyMissilesDestroyed,
                    shieldBombsDestroyed: statsShieldBombsDestroyed,
                    planeBombsDestroyed: statsPlaneBombsDestroyed,
                    planesDestroyed: statsPlanesDestroyed,
                    citiesLost: statsCitiesLost,
                    basesLost: statsBasesLost,
                    accuracyBonusHits: statsAccuracyBonusHits,
                    // ADDED: Save game start timestamp directly in stats for submission
                    gameStartTime: gameStartTimestamp,
                    // ADDED: Save wave stats
                    waveStats: waveStats.map(stat => stat ? stat.spawnToCompletionMs : null) // Store only the duration in ms
                },
                // The raw click data
                clicks: gameClickData,
                // Store actions
                storeActions: storeActions
            };

            localStorage.setItem(fixedStorageKey, JSON.stringify(dataToStore));
            if (window.enableDebugLogging) {
                console.log(`Saved game data (${gameClickData.length} clicks) to local storage key: ${fixedStorageKey}`);
            } else {
                console.log("Game data saved to local storage");
            }

        } catch (e) {
            console.error("Failed to save game data to local storage:", e);
            // Clear potentially partial data if saving failed
            localStorage.removeItem(fixedStorageKey);
        } finally {
            // Clear the runtime array regardless of save success for the next game
            gameClickData = [];
        }
    } else {
        // If no clicks were recorded, ensure no old data persists for this key
        localStorage.removeItem(fixedStorageKey);
        console.log("No click data recorded for this game. Cleared any old saved data.");
    }

    // High score check (using gameTotalScore)
    let newHighScore = false;
    if (gameTotalScore > highScore) {
        highScore = gameTotalScore;
        localStorage.setItem('missileCommandHighScore', highScore.toString());
        newHighScore = true;
    }

    // --- [NEW] Store Score Locally if Offline ---
    if (!navigator.onLine && gameTotalScore > 0) {
        console.log("Offline: Storing score locally.");
        try {
            const storedScores = JSON.parse(localStorage.getItem('storedScores') || '[]');
            // Store score along with name and stats for submission later
            const scoreData = {
                name: 'TEMP_OFFLINE', // Placeholder name, user enters later if needed
                score: gameTotalScore,
                wave: currentWave + 1,
                stats: {
                    missilesFired: statsMissilesFired,
                    enemyMissilesDestroyed: statsEnemyMissilesDestroyed,
                    planeBombsDestroyed: statsPlaneBombsDestroyed,
                    planesDestroyed: statsPlanesDestroyed,
                    citiesLost: statsCitiesLost,
                    basesLost: statsBasesLost,
                    accuracyBonusHits: statsAccuracyBonusHits,
                    shieldBombsDestroyed: statsShieldBombsDestroyed,
                    difficulty: selectedDifficultyName,
                    missileSpeedLevel: playerMissileSpeedLevel,
                    explosionRadiusLevel: explosionRadiusLevel,
                    accuracy: parseFloat(statsMissilesFired > 0 ? ((statsEnemyMissilesDestroyed + statsPlaneBombsDestroyed) / statsMissilesFired * 100).toFixed(1) : "0.0"),
                    // ADDED: Include game start timestamp
                    gameStartTime: gameStartTimestamp,
                    // ADDED: Save wave stats for offline scores too
                    waveStats: waveStats.map(stat => stat ? stat.spawnToCompletionMs : null)
                },
                timestamp: Date.now() // Add a timestamp for potential sorting/debugging
            };
            storedScores.push(scoreData);
            localStorage.setItem('storedScores', JSON.stringify(storedScores));
            console.log(`Score of ${gameTotalScore} stored locally. Total stored: ${storedScores.length}`);
        } catch (e) {
            console.error("Error saving score to localStorage:", e);
        }
    }
    // --- [END NEW] ---

    // Determine game over reason
    const basesRemaining = bases.filter(b => b.alive).length;
    const citiesRemaining = cities.filter(c => c.alive).length;
    const satellitesRemaining = satelliteBases.filter(s => s.alive).length;
    let reason = "";
    if (citiesRemaining === 0) { reason = "All cities destroyed!"; }
    else if (basesRemaining === 0 && satellitesRemaining === 0) { reason = "All launch sites destroyed!"; }
    else { reason = "Targets eliminated!"; }
    
    // Calculate and display stats
    const accuracy = statsMissilesFired > 0 ? ((statsEnemyMissilesDestroyed + statsPlaneBombsDestroyed) / statsMissilesFired * 100).toFixed(1) : "N/A";

    statsContainer.innerHTML = ''; // Clear previous stats
    const stats = [
        `Wave Reached: ${currentWave + 1}`,
        `Accuracy Bonuses: ${statsAccuracyBonusHits}`,
        `Difficulty: ${selectedDifficultyName || 'N/A'}`,
        `Planes Down: ${statsPlanesDestroyed}`,
        `Missiles Fired: ${statsMissilesFired}`,
        `Cities Lost: ${statsCitiesLost}`,
        `Accuracy: ${accuracy}%`,
        `Bases Lost: ${statsBasesLost}`,
        `Enemy Missiles Down: ${statsEnemyMissilesDestroyed}`,
        `Shield Bombs Down: ${statsShieldBombsDestroyed}`,
        `Final Score: $${gameTotalScore}`,
        `Plane Bombs Down: ${statsPlaneBombsDestroyed}`,
        newHighScore ? `NEW HIGH SCORE!` : `High Score: $${highScore}`
    ];
    stats.forEach(statText => { 
        const span = document.createElement('span'); 
        span.textContent = statText; 
        statsContainer.appendChild(span); 
    });

    // Show the main game over message
    const title = newHighScore ? "GAME OVER - NEW HIGH SCORE!" : "GAME OVER";
    showMessage(title, `Total Score: $${gameTotalScore}`, reason);
    messageBonusText.textContent = "";
    statsContainer.style.display = 'grid';
    goToStoreButton.style.display = 'none'; skipStoreButton.style.display = 'none';

    // --- [NEW/MODIFIED] Manage AI Summary Link ---
    const buttonContainer = messageBox.querySelector('.messageBoxButtons');
    let summaryLink = document.getElementById('viewGameSummaryLink');

    // Only show when game is over AND data exists
    if (isGameOver && localStorage.getItem('missileCommandLastGameData')) {
        // Data exists, so ensure link is present and configured
        if (!summaryLink) {
            // Create a button instead of a link
            summaryLink = document.createElement('button');
            summaryLink.id = 'viewGameSummaryLink';
            summaryLink.style.display = 'inline-block'; // Match restart button display
            summaryLink.classList.add('gameAnalysisButton'); // Optional class for additional styling
            summaryLink.addEventListener('click', handleViewSummaryClick);

            // Append it to the button container (alongside restart)
            if (buttonContainer) {
                buttonContainer.appendChild(summaryLink); // Add it next to restart button
            }
        }
        
        // Ensure text and state are correct (in case it was left in 'Analyzing...' state)
        summaryLink.textContent = 'View Game Summary';
        summaryLink.disabled = !navigator.onLine; // Disable if offline
    } else {
        // No data saved, ensure link is removed if it exists
        if (summaryLink) {
            summaryLink.remove();
        }
    }

    // Show/Hide Score Submission Form - MODIFIED for offline support
    if (gameTotalScore > 0) {
        scoreSubmissionDiv.style.display = 'flex';
        playerNameInput.value = localStorage.getItem('missileCommandPlayerName') || 'ACE'; // Load last used name
        
        if (navigator.onLine) {
            submissionStatus.textContent = '';
            submitScoreButton.disabled = false;
            scoreSubmitted = false; // Reset submission status for new game over
        } else {
            submissionStatus.textContent = "Offline. Score saved locally.";
            submissionStatus.style.color = "#ffff00";
            submitScoreButton.disabled = true; // Disable submission button when offline
            scoreSubmitted = false;
        }
    } else {
        scoreSubmissionDiv.style.display = 'none';
    }

    // Display restart button in message box, disable pause button
    const messageRestartButton = messageBox.querySelector('#restartButton');
    if (messageRestartButton) messageRestartButton.style.display = 'inline-block';
    pauseButton.style.display = 'inline-block'; pauseButton.textContent = 'Pause'; pauseButton.disabled = true;
    pauseOverlay.style.display = 'none'; bonusIndicator.style.display = 'none'; storeModal.style.display = 'none';
    specialWeaponsUIDiv.style.display = 'none';

    // Stop game loop if running
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    stopMusic(); // ADDED: Stop music on game over
    submittedPlayerNameThisSession = null; // Reset submitted name tracker
    
    // We don't reset gameStartTimestamp here because we need it for score submission
    // It will be reset when a new game starts or when the game is fully restarted
    
    console.log("Game Over processing complete.");
}

// --- Pause/Resume Logic ---
function pauseGame() { if (isGameOver || transitioningWave || !gameHasStarted || storeModal.style.display === 'block' || messageBox.style.display === 'block') return; isPaused = true; pauseOverlay.style.display = 'flex'; pauseButton.textContent = 'Resume'; if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; } stopMusic(); } // ADDED: Stop music on pause
function resumeGame() { if (isGameOver || transitioningWave || !isPaused) return; isPaused = false; pauseOverlay.style.display = 'none'; pauseButton.textContent = 'Pause'; if (!gameLoopId) { startGameLoop(); } playMusic(); } // ADDED: Resume music
function togglePause() { if (isPaused) { resumeGame(); } else { pauseGame(); } isBombArmed = false; canvas.style.cursor = 'crosshair'; bombControl.classList.remove('armed'); updateSpecialWeaponsUI(); }

// --- Screenshot Logic ---
async function saveScreenshot() {
    console.log("Attempting to save screenshot...");
    const originalText = screenshotButton.textContent;
    screenshotButton.textContent = 'Saving...';
    screenshotButton.disabled = true;
    
    try {
        // Create a temporary canvas to draw everything onto
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Draw the game canvas content
        tempCtx.drawImage(canvas, 0, 0);
        
        // If message box is visible, draw it manually
        if (messageBox.style.display === 'block') {
            console.log("Message box is visible, manually drawing it on the screenshot");
            
            // Calculate message box position relative to the canvas
            const boxWidth = canvas.width * 0.8; // 80% of canvas width
            const boxHeight = canvas.height * 0.7; // 70% of canvas height
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = (canvas.height - boxHeight) / 2;
            
            // Background colors and styles similar to the game UI
            tempCtx.fillStyle = 'rgba(0, 0, 0, 1)'; // Pure black background
            tempCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            // No semi-transparent overlay, just draw a black box with red border
            tempCtx.fillStyle = 'rgba(0, 0, 0, 1)';
            tempCtx.beginPath();
            // Use rounded rectangle
            const radius = 10;
            tempCtx.moveTo(boxX + radius, boxY);
            tempCtx.lineTo(boxX + boxWidth - radius, boxY);
            tempCtx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius, radius);
            tempCtx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
            tempCtx.arcTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight, radius);
            tempCtx.lineTo(boxX + radius, boxY + boxHeight);
            tempCtx.arcTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius, radius);
            tempCtx.lineTo(boxX, boxY + radius);
            tempCtx.arcTo(boxX, boxY, boxX + radius, boxY, radius);
            tempCtx.fill();
            
            // Draw message box border
            tempCtx.strokeStyle = '#ff0000';
            tempCtx.lineWidth = 3;
            tempCtx.stroke();
            
            // Get message content
            const title = messageTitle.textContent;
            const text = messageText.textContent;
            const subText = messageSubText.style.display !== 'none' ? messageSubText.textContent : '';
            const bonusText = messageBonusText.style.display !== 'none' ? messageBonusText.textContent : '';
            
            // Draw title - much larger, matching game UI
            tempCtx.fillStyle = '#ff0000';
            tempCtx.font = '32px "Press Start 2P", monospace';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'top';
            tempCtx.fillText(title, boxX + boxWidth/2, boxY + 50);
            
            // Draw main message text
            tempCtx.fillStyle = '#ffff00';
            tempCtx.font = '16px "Press Start 2P", monospace';
            tempCtx.fillText(text, boxX + boxWidth/2, boxY + 100);
            
            // Draw sub text if visible
            if (subText) {
                tempCtx.fillText(subText, boxX + boxWidth/2, boxY + 130);
            }
            
            // Draw game stats if visible
            if (statsContainer.style.display !== 'none') {
                // Get all stat spans from the statsContainer
                const statSpans = Array.from(statsContainer.querySelectorAll('span'));
                
                if (statSpans.length > 0) {
                    // Add red horizontal line above stats (matching game UI)
                    tempCtx.strokeStyle = '#ff0000';
                    tempCtx.lineWidth = 1;
                    tempCtx.beginPath();
                    tempCtx.moveTo(boxX + boxWidth * 0.05, boxY + 170);
                    tempCtx.lineTo(boxX + boxWidth * 0.95, boxY + 170);
                    tempCtx.stroke();
                    
                    // Define the specific order of stats based on actual game UI
                    const leftColOrder = [
                        "Wave Reached:",
                        "Difficulty:",
                        "Missiles Fired:",
                        "Accuracy:",
                        "Enemy Missiles Down:",
                        "Final Score:",
                        "High Score:"
                    ];
                    
                    const rightColOrder = [
                        "Accuracy Bonuses:",
                        "Planes Down:",
                        "Cities Lost:",
                        "Bases Lost:",
                        "Shield Bombs Down:",
                        "Plane Bombs Down:"
                    ];
                    
                    // Adjusted positioning to match game UI exactly
                    const leftCol = boxX + boxWidth * 0.05; // Far left
                    const rightCol = boxX + boxWidth * 0.62; // Far right
                    const topRow = boxY + 190; // Start position
                    const rowHeight = 20; // Reduced row height
                    
                    // Set smaller font size matching game UI
                    tempCtx.font = '10px "Press Start 2P", monospace';
                    
                    // Draw left column stats in correct order
                    tempCtx.textAlign = 'left';
                    leftColOrder.forEach((statPrefix, index) => {
                        const statSpan = statSpans.find(span => span.textContent.startsWith(statPrefix));
                        if (statSpan) {
                            tempCtx.fillStyle = '#ffffff';
                            tempCtx.fillText(statSpan.textContent, leftCol, topRow + (index * rowHeight));
                        }
                    });
                    
                    // Draw right column stats in correct order
                    rightColOrder.forEach((statPrefix, index) => {
                        const statSpan = statSpans.find(span => span.textContent.startsWith(statPrefix));
                        if (statSpan) {
                            // Use yellow color for High Score
                            if (statSpan.textContent.includes('HIGH SCORE')) {
                                tempCtx.fillStyle = '#ffff00';
                            } else {
                                tempCtx.fillStyle = '#ffffff';
                            }
                            tempCtx.fillText(statSpan.textContent, rightCol, topRow + (index * rowHeight));
                        }
                    });
                    
                    // Add red horizontal line below stats (matching game UI)
                    tempCtx.strokeStyle = '#ff0000';
                    tempCtx.lineWidth = 1;
                    tempCtx.beginPath();
                    
                    // Calculate maximum rows between columns and add more padding (20px instead of 10px)
                    const maxRows = Math.max(leftColOrder.length, rightColOrder.length);
                    const bottomLineY = topRow + (maxRows * rowHeight) + 20; // Increased from 10px to 20px
                    
                    tempCtx.moveTo(boxX + boxWidth * 0.05, bottomLineY);
                    tempCtx.lineTo(boxX + boxWidth * 0.95, bottomLineY);
                    tempCtx.stroke();
                }
            }
        }

        // Convert canvas to Blob
        tempCanvas.toBlob(async (blob) => {
            if (!blob) {
                throw new Error("Canvas toBlob failed.");
            }
            try {
                // Use Clipboard API to copy the image
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                console.log("Screenshot copied to clipboard.");
                screenshotButton.textContent = 'Copied!';
            } catch (clipErr) {
                console.error("Clipboard API failed, falling back to download:", clipErr);
                // Fallback: Create a download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `missile_command_screenshot_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log("Screenshot download initiated.");
                screenshotButton.textContent = 'Saved!';
            } finally {
                setTimeout(() => {
                    screenshotButton.textContent = "Save Screenshot";
                    screenshotButton.disabled = false;
                }, 1500);
            }
        }, 'image/png');

    } catch (err) {
        console.error("Screenshot failed:", err);
        screenshotButton.textContent = 'Error!';
        setTimeout(() => {
            screenshotButton.textContent = "Save Screenshot";
            screenshotButton.disabled = false;
        }, 2000);
    }
}

// --- Message Display ---
function showMessage(title, textHTML, subtextHTML = "", bonusAlert = "") { messageTitle.textContent = title; messageText.innerHTML = textHTML; messageSubText.style.display = subtextHTML ? 'block' : 'none'; messageSubText.innerHTML = subtextHTML; messageBonusText.textContent = bonusAlert; messageBonusText.style.display = bonusAlert ? 'block' : 'none'; goToStoreButton.style.display = 'none'; skipStoreButton.style.display = 'none'; statsContainer.style.display = 'none'; messageBox.style.display = 'block'; }
function hideMessage() { messageBox.style.display = 'none'; }

// --- Store Logic ---
function updateStoreUI() {
            storeScoreDisplay.textContent = `Current Score: $${score}`;
            stockSatelliteDisplay.textContent = `Stock: ${storeStockSatellite}`;
            stockBaseDisplay.textContent = `Stock: ${storeStockBase}`;
            stockCityDisplay.textContent = `Stock: ${storeStockCity}`;
            stockShieldDisplay.textContent = `Stock: ${storeStockShield}`;
            stockSatShieldDisplay.textContent = `Stock: ${storeStockSatShield}`;
            stockSonicWaveDisplay.textContent = `Stock: ${storeStockSonicWave}`;
            stockBombDisplay.textContent = `Stock: ${storeStockBomb}`;

            // Get cost display elements (using new/existing IDs)
            const costSonicWaveDisplay = document.getElementById('costSonicWaveDisplay');
            const costBombDisplay = document.getElementById('costBombDisplay');
            const costSatelliteDisplay = document.getElementById('costSatelliteDisplay');
            const costSatShieldDisplay = document.getElementById('costSatShieldDisplay');
            const costBaseDisplay = document.getElementById('costBaseDisplay');
            const costCityDisplay = document.getElementById('costCityDisplay');
            const costShieldDisplay = document.getElementById('costShieldDisplay');
            const costFasterMissileDisplay = document.getElementById('costFasterMissile');
            const costWiderExplosionDisplay = document.getElementById('costWiderExplosion');
            const levelFasterMissileDisplay = document.getElementById('levelFasterMissile');
            const levelWiderExplosionDisplay = document.getElementById('levelWiderExplosion');


            // Update text content using the cost constants
            if (costSonicWaveDisplay) costSonicWaveDisplay.textContent = `Cost: $${COST_SONIC_WAVE}`;
            if (costBombDisplay) costBombDisplay.textContent = `Cost: $${COST_BOMB}`;
            if (costSatelliteDisplay) costSatelliteDisplay.textContent = `Cost: $${COST_SATELLITE}`;
            if (costSatShieldDisplay) costSatShieldDisplay.textContent = `Cost: $${COST_SAT_SHIELD}`;
            if (costBaseDisplay) costBaseDisplay.textContent = `Cost: $${COST_BASE}`;
            if (costCityDisplay) costCityDisplay.textContent = `Cost: $${COST_CITY}`;
            if (costShieldDisplay) costShieldDisplay.textContent = `Cost: $${COST_SHIELD}`;

            // Update upgrade costs
            const costFasterMissile = calculateUpgradeCost(COST_FASTER_MISSILE_BASE, playerMissileSpeedLevel);
            costFasterMissileDisplay.textContent = `Cost: $${costFasterMissile}`;
            levelFasterMissileDisplay.textContent = `Level: ${playerMissileSpeedLevel}/${MAX_UPGRADE_LEVEL}`;
            buyFasterMissileButton.disabled = !(score >= costFasterMissile && playerMissileSpeedLevel < MAX_UPGRADE_LEVEL);
            if (playerMissileSpeedLevel >= MAX_UPGRADE_LEVEL) { costFasterMissileDisplay.textContent = "MAX LEVEL"; buyFasterMissileButton.disabled = true; }

            const costWiderExplosion = calculateUpgradeCost(COST_WIDER_EXPLOSION_BASE, explosionRadiusLevel);
            costWiderExplosionDisplay.textContent = `Cost: $${costWiderExplosion}`;
            levelWiderExplosionDisplay.textContent = `Level: ${explosionRadiusLevel}/${MAX_UPGRADE_LEVEL}`;
            buyWiderExplosionButton.disabled = !(score >= costWiderExplosion && explosionRadiusLevel < MAX_UPGRADE_LEVEL);
            if (explosionRadiusLevel >= MAX_UPGRADE_LEVEL) { costWiderExplosionDisplay.textContent = "MAX LEVEL"; buyWiderExplosionButton.disabled = true; }

            // --- Rest of the button disabling logic ---
            const canAffordSatellite = score >= COST_SATELLITE;
            const satelliteInStock = storeStockSatellite > 0;
            const activeSatellites = satelliteBases.filter(s => s.alive).length;
            const canPlaceSatellite = activeSatellites < MAX_ACTIVE_SATELLITES;
            buySatelliteButton.disabled = !(canAffordSatellite && satelliteInStock && canPlaceSatellite);

            const canAffordBase = score >= COST_BASE;
            const baseInStock = storeStockBase > 0;
            const canRebuildBase = bases.some(b => !b.alive);
            buyBaseButton.disabled = !(canAffordBase && baseInStock && canRebuildBase);

            const canAffordCity = score >= COST_CITY;
            const cityInStock = storeStockCity > 0;
            const canRebuildCity = cities.some(c => !c.alive);
            buyCityButton.disabled = !(canAffordCity && cityInStock && canRebuildCity);

            const canAffordShield = score >= COST_SHIELD;
            const shieldInStock = storeStockShield > 0;
            const canPlaceShield = baseShields.some((shield, index) => bases[index].alive && (!shield || !shield.alive));
            buyShieldButton.disabled = !(canAffordShield && shieldInStock && canPlaceShield);

            const canAffordSatShield = score >= COST_SAT_SHIELD;
            const satShieldInStock = storeStockSatShield > 0;
            const canPlaceSatShield = satelliteBases.some(s => s.alive && (!s.shield || !s.shield.alive));
            buySatShieldButton.disabled = !(canAffordSatShield && satShieldInStock && canPlaceSatShield);

            const canAffordSonic = score >= COST_SONIC_WAVE;
            const sonicInStock = storeStockSonicWave > 0;
            buySonicWaveButton.disabled = !(canAffordSonic && sonicInStock);
            const canAffordSonic10 = score >= COST_SONIC_WAVE * 10;
            const sonicInStock10 = storeStockSonicWave >= 10;
            buySonicWave10Button.disabled = !(canAffordSonic10 && sonicInStock10);

            const canAffordBomb = score >= COST_BOMB;
            const bombInStock = storeStockBomb > 0;
            buyBombButton.disabled = !(canAffordBomb && bombInStock);
            const canAffordBomb10 = score >= COST_BOMB * 10;
            const bombInStock10 = storeStockBomb >= 10;
            buyBomb10Button.disabled = !(canAffordBomb10 && bombInStock10);
        }
function findAndRebuildBase() { const deadBaseIndex = bases.findIndex(b => !b.alive); if (deadBaseIndex !== -1) { bases[deadBaseIndex].alive = true; bases[deadBaseIndex].ammo = selectedDifficultyAmmo; return true; } return false; }
function findAndRebuildCity() { const deadCityIndex = cities.findIndex(c => !c.alive); if (deadCityIndex !== -1) { cities[deadCityIndex].alive = true; return true; } return false; }
function buyReplacementBase() { 
    if (score >= COST_BASE && storeStockBase > 0) { 
        if (findAndRebuildBase()) { 
            score -= COST_BASE; 
            storeStockBase--; 
            
            // Track the purchase
            storeActions.push({
                action: "buy",
                item: "base",
                cost: COST_BASE,
                timestamp: Date.now()
            });
            
            updateStoreUI(); 
            updateUI(); 
        } 
    } 
}

function buyReplacementCity() { 
    if (score >= COST_CITY && storeStockCity > 0) { 
        if (findAndRebuildCity()) { 
            score -= COST_CITY; 
            storeStockCity--; 
            
            // Track the purchase
            storeActions.push({
                action: "buy",
                item: "city",
                cost: COST_CITY,
                timestamp: Date.now()
            });
            
            updateStoreUI(); 
            updateUI(); 
        } 
    } 
}

function buySatellite() { 
    const activeSatellitesCount = satelliteBases.filter(s => s.alive).length; 
    if (score >= COST_SATELLITE && storeStockSatellite > 0 && activeSatellitesCount < MAX_ACTIVE_SATELLITES) { 
        let placed = false; 
        const basePositionsRatios = [0.15, 0.5, 0.85]; 
        for (let i = 0; i < 3; i++) { 
            const targetX = basePositionsRatios[i] * canvas.width; 
            const satelliteX = targetX - (canvas.width * SATELLITE_WIDTH_RATIO / 2); 
            const positionOccupied = satelliteBases.some(s => s.alive && Math.abs(s.x - satelliteX) < 1); 
            if (!positionOccupied) { 
                score -= COST_SATELLITE; 
                storeStockSatellite--; 
                const newSatellite = createSatelliteBase(basePositionsRatios[i], SATELLITE_Y_POS_RATIO); 
                satelliteBases.push(newSatellite); 
                placed = true; 
                
                // Track the purchase
                storeActions.push({
                    action: "buy",
                    item: "satellite",
                    cost: COST_SATELLITE,
                    timestamp: Date.now()
                });
                
                break; 
            } 
        } 
        if(placed) { 
            updateStoreUI(); 
            updateUI(); 
        } 
    } 
}

function buyShield() { 
    if (score >= COST_SHIELD && storeStockShield > 0) { 
        let shieldPlaced = false; 
        for (let i = 0; i < bases.length; i++) { 
            if (bases[i].alive && (!baseShields[i] || !baseShields[i].alive)) { 
                score -= COST_SHIELD; 
                storeStockShield--; 
                baseShields[i] = { alive: true, strength: SHIELD_STRENGTH_START, flashTimer: 0 }; 
                shieldPlaced = true; 
                
                // Track the purchase
                storeActions.push({
                    action: "buy",
                    item: "baseShield",
                    cost: COST_SHIELD,
                    timestamp: Date.now()
                });
                
                break; 
            } 
        } 
        if(shieldPlaced) { 
            updateStoreUI(); 
            updateUI(); 
        } 
    } 
}

function buySatShield() { 
    if (score >= COST_SAT_SHIELD && storeStockSatShield > 0) { 
        let shieldPlaced = false; 
        for (let i = 0; i < satelliteBases.length; i++) { 
            const sat = satelliteBases[i]; 
            if (sat.alive && (!sat.shield || !sat.shield.alive)) { 
                score -= COST_SAT_SHIELD; 
                storeStockSatShield--; 
                sat.shield = { alive: true, strength: SHIELD_STRENGTH_START, flashTimer: 0 }; 
                shieldPlaced = true; 
                
                // Track the purchase
                storeActions.push({
                    action: "buy",
                    item: "satelliteShield",
                    cost: COST_SAT_SHIELD,
                    timestamp: Date.now()
                });
                
                break; 
            } 
        } 
        if(shieldPlaced) { 
            updateStoreUI(); 
            updateUI(); 
        } 
    } 
}

function buySonicWave() { 
    if (score >= COST_SONIC_WAVE && storeStockSonicWave > 0) { 
        score -= COST_SONIC_WAVE; 
        storeStockSonicWave--; 
        inventorySonicWave++; 
        
        // Track the purchase
        storeActions.push({
            action: "buy",
            item: "sonicWave",
            cost: COST_SONIC_WAVE,
            timestamp: Date.now()
        });
        
        updateStoreUI(); 
        updateSpecialWeaponsUI(); 
    } 
}

function buyBomb() { 
    if (score >= COST_BOMB && storeStockBomb > 0) { 
        score -= COST_BOMB; 
        storeStockBomb--; 
        inventoryBomb++; 
        
        // Track the purchase
        storeActions.push({
            action: "buy",
            item: "bomb",
            cost: COST_BOMB,
            timestamp: Date.now()
        });
        
        updateStoreUI(); 
        updateSpecialWeaponsUI(); 
    } 
}

function buyFasterMissile() { 
    if (playerMissileSpeedLevel < MAX_UPGRADE_LEVEL) { 
        const cost = calculateUpgradeCost(COST_FASTER_MISSILE_BASE, playerMissileSpeedLevel); 
        if (score >= cost) { 
            score -= cost; 
            playerMissileSpeedLevel++; 
            
            // Track the purchase
            storeActions.push({
                action: "upgrade",
                item: "missileSpeed",
                level: playerMissileSpeedLevel,
                cost: cost,
                timestamp: Date.now()
            });
            
            updateStoreUI(); 
        } 
    } 
}

function buyWiderExplosion() { 
    if (explosionRadiusLevel < MAX_UPGRADE_LEVEL) { 
        const cost = calculateUpgradeCost(COST_WIDER_EXPLOSION_BASE, explosionRadiusLevel); 
        if (score >= cost) { 
            score -= cost; 
            explosionRadiusLevel++; 
            
            // Track the purchase
            storeActions.push({
                action: "upgrade",
                item: "explosionRadius",
                level: explosionRadiusLevel,
                cost: cost,
                timestamp: Date.now()
            });
            
            updateStoreUI(); 
        } 
    } 
}

function buySonicWave10() {
    const cost10 = COST_SONIC_WAVE * 10;
    if (score >= cost10 && storeStockSonicWave >= 10) {
        score -= cost10;
        storeStockSonicWave -= 10;
        inventorySonicWave += 10;
        
        // Track the purchase
        storeActions.push({
            action: "buy",
            item: "sonicWave",
            quantity: 10,
            cost: cost10,
            timestamp: Date.now()
        });
        
        updateStoreUI();
        updateSpecialWeaponsUI();
    }
}

function buyBomb10() {
    const cost10 = COST_BOMB * 10;
    if (score >= cost10 && storeStockBomb >= 10) {
        score -= cost10;
        storeStockBomb -= 10;
        inventoryBomb += 10;
        
        // Track the purchase
        storeActions.push({
            action: "buy",
            item: "bomb",
            quantity: 10,
            cost: cost10,
            timestamp: Date.now()
        });
        
        updateStoreUI();
        updateSpecialWeaponsUI();
    }
}

// --- Special Weapon Logic ---
function updateSpecialWeaponsUI() { sonicWaveCountDisplay.textContent = inventorySonicWave; bombCountDisplay.textContent = inventoryBomb; const canUseSpecials = gameHasStarted && !isGameOver && !isPaused && !transitioningWave; sonicWaveControl.classList.toggle('disabled', inventorySonicWave <= 0 || !canUseSpecials || activeSonicWave); bombControl.classList.toggle('disabled', inventoryBomb <= 0 || !canUseSpecials); bombControl.classList.toggle('armed', isBombArmed); if (canUseSpecials) { canvas.style.cursor = isBombArmed ? 'cell' : 'crosshair'; } else { canvas.style.cursor = 'default'; } }
function triggerSonicWave() { 
    if (inventorySonicWave > 0 && !activeSonicWave && !sonicWaveControl.classList.contains('disabled')) { 
        inventorySonicWave--; 
        activeSonicWave = { y: canvas.height - (canvas.height * GROUND_HEIGHT_RATIO), alive: true }; 
        // ADDED: Record Sonic Wave usage click
        recordGameClick(-1, -1, 'sonicWave'); // Use -1, -1 for coordinates as it's an icon click
        updateSpecialWeaponsUI(); 
    } 
}
function armBomb() { if (inventoryBomb > 0 && !bombControl.classList.contains('disabled')) { isBombArmed = !isBombArmed; updateSpecialWeaponsUI(); } }
function deployBomb(clickX, clickY) {
    if (isBombArmed) {
        inventoryBomb--;
        isBombArmed = false;
        const bombRadius = getCurrentPlayerExplosionRadius() * BOMB_EXPLOSION_RADIUS_MULTIPLIER;
        const bombDuration = EXPLOSION_DURATION * BOMB_EXPLOSION_DURATION_MULTIPLIER;
        createExplosion(clickX, clickY, EXPLOSION_RADIUS_START, '#ffffff', bombRadius, bombDuration);
        updateSpecialWeaponsUI();
    }
}

// --- Drawing Functions ---
function drawBackground() { 
  ctx.fillStyle = '#00001a'; 
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw stars from the pre-generated array
  ctx.fillStyle = 'white';
  const time = Date.now() / 1000; // Current time in seconds for twinkling effect
  
  for (const star of stars) {
    // Subtle twinkling effect by varying opacity and slightly varying size
    const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
    ctx.globalAlpha = 0.5 + (twinkle * 0.5); // Opacity varies between 0.5 and 1.0
    
    // Slightly vary star size for more natural twinkling
    const currentRadius = star.radius * (0.8 + (twinkle * 0.2));
    
    ctx.beginPath();
    ctx.arc(star.x, star.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Reset opacity
  ctx.globalAlpha = 1.0;
  
  // Draw the ground
  const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);
  ctx.fillStyle = '#3b2e1a';
  ctx.fillRect(0, groundY, canvas.width, canvas.height * GROUND_HEIGHT_RATIO);
}
function drawGameObjects() { cities.forEach(city => city.draw()); bases.forEach(base => base.draw()); satelliteBases.forEach(sat => { sat.draw(); if (sat.shield && sat.shield.alive) { const shieldCenterX = sat.x + sat.width / 2; const shieldCenterY = sat.y + sat.height / 2; const shieldRadiusX = sat.width * 0.6 + 4; const shieldRadiusY = sat.height * 0.8 + 4; let shieldColor = SHIELD_COLOR_25; if (sat.shield.strength > 75) shieldColor = SHIELD_COLOR_FULL; else if (sat.shield.strength > 50) shieldColor = SHIELD_COLOR_75; else if (sat.shield.strength > 25) shieldColor = SHIELD_COLOR_50; if (sat.shield.flashTimer > 0) { shieldColor = SHIELD_FLASH_COLOR; sat.shield.flashTimer--; } ctx.beginPath(); ctx.ellipse(shieldCenterX, shieldCenterY, shieldRadiusX, shieldRadiusY, 0, 0, Math.PI * 2); ctx.strokeStyle = shieldColor; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; } }); for (let i = 0; i < baseShields.length; i++) { const shield = baseShields[i]; if (shield && shield.alive) { const base = bases[i]; const shieldCenterX = base.x + base.width / 2; const shieldRadius = BASE_SHIELD_RADIUS_MULTIPLIER * ((base.width / 2) + (canvas.width * CITY_WIDTH_RATIO / 2) + 5); let shieldColor = SHIELD_COLOR_25; if (shield.strength > 75) shieldColor = SHIELD_COLOR_FULL; else if (shield.strength > 50) shieldColor = SHIELD_COLOR_75; else if (shield.strength > 25) shieldColor = SHIELD_COLOR_50; if (shield.flashTimer > 0) { shieldColor = SHIELD_FLASH_COLOR; shield.flashTimer--; } const startX = shieldCenterX - shieldRadius; const endX = shieldCenterX + shieldRadius; const shieldTopY = base.y - 15; const controlY = shieldTopY - shieldRadius * 0.3; ctx.beginPath(); ctx.moveTo(startX, shieldTopY); ctx.quadraticCurveTo(shieldCenterX, controlY, endX, shieldTopY); ctx.strokeStyle = shieldColor; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 1; } } if (activeSonicWave && activeSonicWave.alive) { ctx.fillStyle = SONIC_WAVE_COLOR; ctx.fillRect(0, activeSonicWave.y - SONIC_WAVE_HEIGHT, canvas.width, SONIC_WAVE_HEIGHT); ctx.strokeStyle = 'rgba(255, 100, 255, 0.8)'; ctx.lineWidth = 1; const numLines = 5; for(let i=0; i < numLines; i++) { const lineY = activeSonicWave.y - (SONIC_WAVE_HEIGHT / numLines * (i + 0.5)); ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(canvas.width, lineY); ctx.stroke(); } } incomingMissiles.forEach(missile => missile.draw()); playerMissiles.forEach(missile => missile.draw()); explosions.forEach(explosion => explosion.draw()); planes.forEach(plane => plane.draw()); planeBombs.forEach(bomb => bomb.draw()); }

// --- Update Functions ---
function updateGameObjects() {
    // Increment wave timer
    waveTimer++;

    spawnEnemiesForWave();
    if (activeSonicWave && activeSonicWave.alive) {
         activeSonicWave.y -= SONIC_WAVE_SPEED;
         const waveTop = activeSonicWave.y - SONIC_WAVE_HEIGHT;
         const waveBottom = activeSonicWave.y;
         incomingMissiles.forEach(missile => {
             if (missile.alive && missile.y >= waveTop && missile.y <= waveBottom) {
                 missile.alive = false; // Mark as destroyed
                 // Conditional immediate counting
                 if (!useDeferredKillCounting) {
                     if (missile.isShieldBomb) {
                         statsShieldBombsDestroyed++;
                     }
                     statsEnemyMissilesDestroyed++;
                 }
                 const finalPoints = Math.round(POINTS_PER_MISSILE * scoreMultiplier * difficultyScoreMultiplier); score += finalPoints; gameTotalScore += finalPoints; createExplosion(missile.x, missile.y, EXPLOSION_RADIUS_START, missile.color);
             }
         });
         planeBombs.forEach(bomb => { if (bomb.alive && bomb.y >= waveTop && bomb.y <= waveBottom) { bomb.alive = false; statsPlaneBombsDestroyed++; const finalPoints = Math.round(PLANE_BOMB_POINTS * scoreMultiplier * difficultyScoreMultiplier); score += finalPoints; gameTotalScore += finalPoints; createExplosion(bomb.x, bomb.y, EXPLOSION_RADIUS_START * 0.8, bomb.color); } });
         if (waveTop <= 0) { activeSonicWave.alive = false; activeSonicWave = null; updateSpecialWeaponsUI(); }
    }
    incomingMissiles.forEach(missile => missile.update());
    playerMissiles.forEach(missile => missile.update());
    explosions.forEach(explosion => explosion.update());
    planes.forEach(plane => plane.update());
    planeBombs.forEach(bomb => bomb.update());

    // --- NEW: Deferred Kill Counting Logic (Moved Here) ---
    if (useDeferredKillCounting) {
        incomingMissiles.forEach(missile => {
            if (!missile.alive && !missile.countedAsDestroyed) {
                if (missile.isShieldBomb) {
                    statsShieldBombsDestroyed++;
                }
                statsEnemyMissilesDestroyed++;
                missile.countedAsDestroyed = true; // Mark as counted
            }
        });
        // Note: Plane bombs are counted immediately in their collision check,
        // as they don't have the same potential for multiple hits within a frame.
    }
    // --- END Deferred Kill Counting Logic ---

    incomingMissiles = incomingMissiles.filter(missile => missile.alive);
    playerMissiles = playerMissiles.filter(missile => missile.alive);
    explosions = explosions.filter(explosion => explosion.alive);
    planes = planes.filter(plane => plane.alive);
    planeBombs = planeBombs.filter(bomb => bomb.alive);
    if (accuracyBonusMessageTimer > 0) {
         accuracyBonusMessageTimer--;
         if (accuracyBonusMessageTimer === 0 && comboMessageTimer === 0) { // Only clear if combo message is also done
             messageBonusText.textContent = ""; 
         }
    }
    if (comboMessageTimer > 0) { // NEW: Handle combo message timer
         comboMessageTimer--;
         if (comboMessageTimer === 0 && accuracyBonusMessageTimer === 0) { // Only clear if accuracy message is also done
              messageBonusText.textContent = "";
          }
     }
 }
 function updateUI() {
    scoreDisplay.textContent = `CURRENT SCORE: $${score}`;
    highScoreDisplay.textContent = `TOTAL: $${gameTotalScore}`; // Changed to display gameTotalScore
    waveDisplay.textContent = `WAVE: ${currentWave + 1}`;
    const livingCities = cities.filter(c => c.alive).length;
    citiesLeftDisplay.textContent = `CITIES: ${livingCities}`;
    multiplierDisplay.textContent = `MULT: ${scoreMultiplier.toFixed(1)}x`;
    bonusIndicator.style.display = bonusMissileCount > 0 ? 'inline-block' : 'none';
    if (bonusMissileCount > 0) { bonusIndicator.textContent = `BONUS FIRE +${bonusMissileCount}!`; }
}

// --- MODIFIED: Game Loop with Performance Monitoring ---
function gameLoop(timestamp) {
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }
    
    // Calculate frame time for performance monitoring
    const frameTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Monitor performance (optional)
    if (frameCount < FRAME_SAMPLE_SIZE) {
        frameTimes.push(frameTime);
        frameCount++;
    } else if (frameCount === FRAME_SAMPLE_SIZE) {
        const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / FRAME_SAMPLE_SIZE;
        console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms (${(1000/avgFrameTime).toFixed(2)} FPS)`);
        frameCount++; // Only log once
    }

    if (isPaused) { 
        gameLoopId = null; 
        return; 
    }
    
    checkGameOverConditions();
    if (isGameOver && explosions.length === 0 && planeBombs.length === 0 && !activeSonicWave && !transitioningWave) {
        console.log("gameLoop: Stopping loop (Game Over condition met)");
        gameLoopId = null;
        return;
    }
    
    // Clear only what's necessary - for better performance on mobile
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Only draw what's visible on screen
    drawBackground();
    drawGameObjects();
    
    if (!isGameOver && !transitioningWave) {
        updateGameObjects();
        updateUI();
        updateSpecialWeaponsUI();
        checkWaveEnd();
    } else if (isGameOver) {
        // Only update explosions and bombs if game is over but effects are still active
        explosions.forEach(explosion => explosion.update());
        planeBombs.forEach(bomb => bomb.update());
        if (activeSonicWave && activeSonicWave.alive) {
            activeSonicWave.y -= SONIC_WAVE_SPEED;
            if (activeSonicWave.y - SONIC_WAVE_HEIGHT <= 0) { 
                activeSonicWave.alive = false; 
                activeSonicWave = null; 
            }
        }
        explosions = explosions.filter(explosion => explosion.alive);
        planeBombs = planeBombs.filter(bomb => bomb.alive);
    }
    
    // Request next frame if game isn't over OR if there are still active effects
    if (!isGameOver || explosions.length > 0 || planeBombs.length > 0 || activeSonicWave) {
        gameLoopId = requestAnimationFrame(gameLoop);
    } else {
        console.log("gameLoop: Stopping loop (End condition met)");
        gameLoopId = null; // Ensure loop stops
    }
}

// --- ADDED: Function to start game loop ---
function startGameLoop() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    frameCount = 0;
    frameTimes = [];
    lastFrameTime = 0;
    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- ADDED: Function to optimize canvas for orientation ---
function optimizeCanvasForOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobileOrSmallScreen = window.innerHeight < 700; // Threshold for mobile/small screens
    
    // Keep internal resolution the same to avoid breaking game logic
    canvas.width = INTERNAL_WIDTH;
    canvas.height = INTERNAL_HEIGHT;
    initializeStars();
    
    // Apply landscape-specific layout adjustments ONLY for mobile/small screens
    if (isLandscape && isMobileOrSmallScreen) {
        console.log("Applying mobile landscape layout");
        // Calculate available width accounting for UI elements
        const uiSidePadding = 180; // Space for controls on both sides
        const availableWidth = window.innerWidth - uiSidePadding;
        
        // Calculate available height with some margin
        const topBottomMargin = 60; // Top/bottom margin
        const availableHeight = window.innerHeight - topBottomMargin;
        
        // Determine size based on maintaining aspect ratio
        // But prioritize filling the available width first
        let canvasWidth, canvasHeight;
        
        // Calculate based on aspect ratio (800/600 = 1.33)
        const gameAspectRatio = INTERNAL_WIDTH / INTERNAL_HEIGHT;
        
        // Calculate potential sizes
        const widthBasedHeight = availableWidth / gameAspectRatio;
        const heightBasedWidth = availableHeight * gameAspectRatio;
        
        if (widthBasedHeight <= availableHeight) {
            // Width is the limiting factor
            canvasWidth = availableWidth;
            canvasHeight = widthBasedHeight;
        } else {
            // Height is the limiting factor
            canvasWidth = heightBasedWidth;
            canvasHeight = availableHeight;
        }
        
        // Apply the calculated size
        canvasContainer.style.width = `${canvasWidth}px`;
        canvasContainer.style.height = `${canvasHeight}px`;
        canvasContainer.style.maxWidth = 'none'; // Override max-width constraints
        
        // Center the canvas container
        canvasContainer.style.margin = '0 auto';
        
        // Position controls on the left
        controlsContainer.style.position = 'absolute';
        controlsContainer.style.left = '10px';
        controlsContainer.style.top = '50%';
        controlsContainer.style.transform = 'translateY(-50%)';
        controlsContainer.style.flexDirection = 'column';
        controlsContainer.style.width = 'auto';
        controlsContainer.style.backgroundColor = 'rgba(0,0,0,0.6)';
        controlsContainer.style.padding = '8px';
        controlsContainer.style.borderRadius = '8px';
        controlsContainer.style.zIndex = '15';
        
        // Position special weapons UI on the right
        specialWeaponsUIDiv.style.position = 'absolute';
        specialWeaponsUIDiv.style.right = '10px';
        specialWeaponsUIDiv.style.top = '50%';
        specialWeaponsUIDiv.style.transform = 'translateY(-50%)';
        specialWeaponsUIDiv.style.flexDirection = 'column';
        specialWeaponsUIDiv.style.backgroundColor = 'rgba(0,0,0,0.6)';
        specialWeaponsUIDiv.style.padding = '8px';
        specialWeaponsUIDiv.style.borderRadius = '8px';
        specialWeaponsUIDiv.style.zIndex = '15';
        
        // Make buttons more compact for landscape
        const buttons = controlsContainer.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.padding = '6px 10px';
            button.style.margin = '3px 0';
            button.style.fontSize = '12px';
            button.style.width = '100%'; // Make buttons fill the container
        });
    } else {
        // Use standard layout for desktop and portrait mode
        console.log("Using standard layout");
        canvasContainer.style.width = '';
        canvasContainer.style.height = '';
        canvasContainer.style.maxWidth = "800px";
        
        // Clear all the inline styles for controls container
        controlsContainer.style.position = '';
        controlsContainer.style.left = '';
        controlsContainer.style.top = '';
        controlsContainer.style.transform = '';
        controlsContainer.style.flexDirection = '';
        controlsContainer.style.width = '';
        controlsContainer.style.backgroundColor = '';
        controlsContainer.style.padding = '';
        controlsContainer.style.borderRadius = '';
        controlsContainer.style.zIndex = '';
        
        // Clear all the inline styles for special weapons
        specialWeaponsUIDiv.style.position = '';
        specialWeaponsUIDiv.style.right = '';
        specialWeaponsUIDiv.style.top = '';
        specialWeaponsUIDiv.style.transform = '';
        specialWeaponsUIDiv.style.flexDirection = '';
        specialWeaponsUIDiv.style.backgroundColor = '';
        specialWeaponsUIDiv.style.padding = '';
        specialWeaponsUIDiv.style.borderRadius = '';
        specialWeaponsUIDiv.style.zIndex = '';
        
        // Reset button styles
        const buttons = controlsContainer.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.padding = '';
            button.style.margin = '';
            button.style.fontSize = '';
            button.style.width = '';
        });
    }
    
    // Force the canvas aspect ratio to remain constant
    canvasContainer.style.aspectRatio = `${INTERNAL_WIDTH} / ${INTERNAL_HEIGHT}`;
    
    // Update all UI positions
    updateUI();
    updateSpecialWeaponsUI();
}

// --- Function to standardize input coordinates ---
function getCanvasCoordinates(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle both mouse and touch events
    let clientX, clientY;
    
    if (event.type.startsWith('touch')) {
        // Prevent default to avoid scrolling/zooming on mobile
        event.preventDefault();
        // Use the first touch point
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// --- Generic handler function that processes clicks/touches ---
function handleCanvasInput(event) {
    if (isGameOver || isPaused || transitioningWave || !gameHasStarted) return;
    
    // Initialize audio context if not done already
    if (!audioInitialized) {
        initAudioContext();
        audioInitialized = true;
    }
    
    const coords = getCanvasCoordinates(canvas, event);
    const clickX = coords.x;
    const clickY = coords.y;
    const groundY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);

    // Record Click Data for AI analysis
    recordGameClick(clickX, clickY, isBombArmed ? 'bomb' : 'missile');

    if (clickY < 20 || clickY > groundY) return; // Ignore clicks too high or low
    if (isBombArmed) { deployBomb(clickX, clickY); return; } // Deploy bomb if armed

    // Find nearest base/satellite with ammo
    let nearestSource = null; 
    let minDistance = Infinity;
    const potentialSources = [ 
        ...bases.filter(b => b.alive && b.ammo > 0), 
        ...satelliteBases.filter(s => s.alive && s.ammo > 0) 
    ];
    
    potentialSources.forEach(source => {
        const sourceCenterX = source.x + source.width / 2;
        const sourceTopY = source.isSatellite ? source.y + source.height : source.y;
        const d = distance(clickX, clickY, sourceCenterX, sourceTopY);
        if (d < minDistance) { 
            minDistance = d; 
            nearestSource = source; 
        }
    });

    // Fire missile(s) from the nearest source
    if (nearestSource) {
        const startX = nearestSource.x + nearestSource.width / 2;
        const startY = nearestSource.isSatellite ? nearestSource.y + nearestSource.height : nearestSource.y;
        const totalMissilesToFire = 1 + bonusMissileCount; // Base + bonus
        const actualMissilesToFire = Math.min(totalMissilesToFire, nearestSource.ammo);

        if (actualMissilesToFire > 0) {
            nearestSource.ammo -= actualMissilesToFire;
            for (let i = 0; i < actualMissilesToFire; i++) {
                const currentOffset = (actualMissilesToFire > 1) ? 
                    (i - (actualMissilesToFire - 1) / 2) * BONUS_FIRE_SPREAD : 0;
                playerMissiles.push(createPlayerMissile(
                    startX + currentOffset, startY, clickX, clickY
                ));
            }
            updateUI(); // Update ammo display on base
        }
    }
}

// --- NEW: Keyboard Input Handler ---
function handleKeyDown(event) {
    if (isGameOver || isPaused || transitioningWave || !gameHasStarted) return;

    // Prevent default for keys we handle (will add more later)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '1', '2', '3', '4', '5', '6', 'f', 'q', 'w'].includes(event.key)) {
        event.preventDefault();
    }

    // --- Base Selection (Task 2) ---
    if (['1', '2', '3'].includes(event.key)) {
        const baseIndex = parseInt(event.key) - 1;
        if (bases[baseIndex] && bases[baseIndex].alive) {
            keyboardSelectedBaseIndex = baseIndex;
            keyboardTargetingActive = true;
            console.log(`Keyboard selected ground base: ${keyboardSelectedBaseIndex}`);
        }
    } else if (['4', '5', '6'].includes(event.key)) {
        const satIndex = parseInt(event.key) - 4;
        if (satelliteBases[satIndex] && satelliteBases[satIndex].alive) {
            keyboardSelectedBaseIndex = satIndex + 3; // 3, 4, or 5
            keyboardTargetingActive = true;
            console.log(`Keyboard selected satellite base: ${keyboardSelectedBaseIndex}`);
        }
    }

    // --- Reticle Movement (Task 3) ---
    const groundLevelY = canvas.height - (canvas.height * GROUND_HEIGHT_RATIO);
    if (event.key === 'ArrowUp') {
        keyboardTargetingActive = true;
        reticleY -= RETICLE_SPEED;
    } else if (event.key === 'ArrowDown') {
        keyboardTargetingActive = true;
        reticleY += RETICLE_SPEED;
    } else if (event.key === 'ArrowLeft') {
        keyboardTargetingActive = true;
        reticleX -= RETICLE_SPEED;
    } else if (event.key === 'ArrowRight') {
        keyboardTargetingActive = true;
        reticleX += RETICLE_SPEED;
    }

    // Clamp reticle coordinates
    reticleX = Math.max(0, Math.min(canvas.width, reticleX));
    reticleY = Math.max(0, Math.min(groundLevelY, reticleY));


    // --- Firing (Task 4) ---
    // ... to be added ...

    // --- Special Weapons (Task 6) ---
    // ... to be added ...
}

// --- NEW: Function to Record Game Click ---
function recordGameClick(clickX, clickY, armedWeapon) {
    // Record click data for AI analysis
    gameClickData.push({
        x: Math.round(clickX),
        y: Math.round(clickY),
        timestamp: Date.now(),
        armedWeapon: armedWeapon || 'missile',
        wave: currentWave // ADDED: Include current wave number
    });
}

// --- NEW: Function to Fetch and Display Leaderboard ---
async function fetchAndDisplayLeaderboard(limit = 10) { // Default limit to 10
    console.log(`Workspaceing leaderboard (limit: ${limit})...`);
    leaderboardLoading.textContent = "Loading...";
    leaderboardLoading.style.display = 'list-item'; // Show loading message
    leaderboardList.innerHTML = ''; // Clear previous entries
    leaderboardList.appendChild(leaderboardLoading); // Add loading back
    leaderboardContainer.style.display = 'block'; // Show container
    leaderboardViewMoreContainer.style.display = 'none'; // Hide view more link initially

    try {
        // Append limit to the fetch URL
        const response = await fetch(`/scores?limit=${limit}`); // [MODIFIED] Uses the Functions route with limit

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const scores = await response.json();
        console.log(`Leaderboard data received (limit ${limit}):`, scores);

        leaderboardLoading.style.display = 'none'; // Hide loading message
        leaderboardList.innerHTML = ''; // Clear loading message definitively

        if (scores && scores.length > 0) {
            scores.forEach((entry, index) => {
                const li = document.createElement('li');
                const rankSpan = document.createElement('span');
                rankSpan.className = 'rank';
                rankSpan.textContent = `${index + 1}.`;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'name';
                nameSpan.textContent = entry.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");

                const waveSpan = document.createElement('span');
                waveSpan.className = 'wave';
                if (typeof entry.wave === 'number') {
                    waveSpan.textContent = `W: ${entry.wave}`;
                } else {
                    waveSpan.textContent = `W: -`;
                }

                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'score';
                scoreSpan.textContent = `$${entry.score}`;

                li.appendChild(rankSpan);
                li.appendChild(nameSpan);
                li.appendChild(waveSpan);
                li.appendChild(scoreSpan);

                // Add click handler to show player stats
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => {
                    displayPlayerStats(entry);
                });

                leaderboardList.appendChild(li);
            });

            // Show "View More" link only if we displayed 10 scores and there might be more
            if (limit === 10 && scores.length === 10) {
                 leaderboardViewMoreContainer.style.display = 'block';
            } else if (limit === 1000) {
                 // Always hide the "View More" when already showing 1000
                 leaderboardViewMoreContainer.style.display = 'none';
            } else {
                 leaderboardViewMoreContainer.style.display = 'none'; // Hide if showing less than 10
            }

        } else {
            const li = document.createElement('li');
            li.textContent = "No scores yet!";
            leaderboardList.appendChild(li);
            leaderboardViewMoreContainer.style.display = 'none'; // Hide view more if no scores
        }

    } catch (error) {
        console.error(`Error fetching leaderboard (limit ${limit}):`, error);
        leaderboardLoading.textContent = "Error loading scores.";
        leaderboardLoading.style.display = 'list-item'; // Show error
        leaderboardViewMoreContainer.style.display = 'none'; // Hide view more on error
    }
}

// --- MODIFIED: Function to Display Player Stats Modal (Fetches Full Data) ---
async function displayPlayerStats(playerData) { // Made async
    // Create or update modal
    let statsModal = document.getElementById('playerStatsModal');
    if (!statsModal) {
        statsModal = document.createElement('div');
        statsModal.id = 'playerStatsModal';
        statsModal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 20, 0, 0.95);
            border: 3px solid #00ff00;
            border-radius: 15px;
            box-shadow: 0 0 25px #00ff00;
            padding: 15px;
            z-index: 25;
            color: #00ff00;
            font-size: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        document.body.appendChild(statsModal);
    }

    // --- Initial Display (Summary Data) ---
    statsModal.innerHTML = `
        <h2 style="color: #ffff00; text-align: center; margin-bottom: 10px;">Player: ${playerData.name}</h2>
        <div style="text-align: center; margin-bottom: 15px; line-height: 1.5;">
            <p style="margin: 0; color: #ffffff; font-size: 14px;">Score: $${playerData.score}</p>
            <p style="margin: 0;">Wave: ${playerData.wave || '?'} | Difficulty: Loading...</p>
            <p style="margin: 0; font-size: 8px; color: #aaaaaa;">Loading details...</p>
            <p style="margin: 0; font-size: 8px; color: #aaaaaa;">Game Duration: Loading...</p>
        </div>
        <p id="statsLoadingMsg" style="text-align: center; color: #aaaaaa; margin-top: 20px;">Loading detailed stats...</p>
        <div id="detailedStatsContainer" style="display: none;">
            <!-- Detailed stats will be populated here -->
        </div>
        <button id="closeStatsButton" style="display: block; margin: 20px auto 0;">Close</button>
    `;

    // Add close button listener immediately
    document.getElementById('closeStatsButton').addEventListener('click', () => {
        statsModal.style.display = 'none';
    });
    statsModal.style.display = 'block'; // Show modal with loading state

    // --- Fetch Full Game Data ---
    if (!playerData.gameId) {
        document.getElementById('statsLoadingMsg').textContent = 'Error: Missing gameId for detailed stats.';
        console.error("Missing gameId in playerData:", playerData);
        return;
    }

    try {
        if (window.enableDebugLogging) {
            console.log(`Fetching full stats for gameId: ${playerData.gameId}`);
        }
        const response = await fetch(`/game/${playerData.gameId}`); // Fetch from the new endpoint

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const fullGameData = await response.json();
        // Conditionally log the full data only if debug logging is enabled
        if (window.enableDebugLogging) {
            console.log("Full game data received:", fullGameData);
        }

        // --- Populate Modal with Full Data ---
        const stats = fullGameData.stats; // Use stats from the fetched data
        if (!stats) {
             document.getElementById('statsLoadingMsg').textContent = 'No detailed stats available for this player.';
             // Still update date/duration if available in top-level fullGameData
             updateModalSummary(statsModal, fullGameData);
             return;
        }

        // Update summary section with potentially more accurate data from full record
        updateModalSummary(statsModal, fullGameData);

        const accuracy = stats.accuracy !== undefined ? stats.accuracy : (stats.missilesFired > 0 ?
            ((stats.enemyMissilesDestroyed + stats.planeBombsDestroyed) / stats.missilesFired * 100).toFixed(1) :
            "N/A");

        const detailedStatsHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                <div style="border: 1px solid #005500; padding: 10px; border-radius: 8px;">
                    <h3 style="color: #ffff00; text-align: center; margin-top: 0;">Offensive Stats</h3>
                    <p>Missiles Fired: ${stats.missilesFired || 0}</p>
                    <p>Accuracy: ${accuracy}%</p>
                    <p>Accuracy Bonuses: ${stats.accuracyBonusHits || 0}</p>
                    <p>Missile Speed Level: ${stats.missileSpeedLevel || 0}/15</p>
                    <p>Explosion Radius Level: ${stats.explosionRadiusLevel || 0}/15</p>
                </div>

                <div style="border: 1px solid #005500; padding: 10px; border-radius: 8px;">
                    <h3 style="color: #ffff00; text-align: center; margin-top: 0;">Defensive Stats</h3>
                    <p>Cities Lost: ${stats.citiesLost || 0}</p>
                    <p>Bases Lost: ${stats.basesLost || 0}</p>
                </div>

                <div style="border: 1px solid #005500; padding: 10px; border-radius: 8px; grid-column: 1 / -1;">
                    <h3 style="color: #ffff00; text-align: center; margin-top: 0;">Enemy Kills</h3>
                    <p style="margin: 0;">Enemy Missiles: ${stats.enemyMissilesDestroyed || 0} | Shield Bombs: ${stats.shieldBombsDestroyed || 0}</p>
                    <p style="margin: 0;">Plane Bombs: ${stats.planeBombsDestroyed || 0} | Planes: ${stats.planesDestroyed || 0}</p>
                </div>
            </div>
        `;

        // Inject detailed stats and hide loading message
        document.getElementById('detailedStatsContainer').innerHTML = detailedStatsHTML;
        document.getElementById('detailedStatsContainer').style.display = 'block';
        document.getElementById('statsLoadingMsg').style.display = 'none';

    } catch (error) {
        console.error(`Error fetching detailed stats for gameId ${playerData.gameId}:`, error);
        document.getElementById('statsLoadingMsg').textContent = `Error loading detailed stats: ${error.message}`;
        document.getElementById('statsLoadingMsg').style.color = '#ff0000';
    }
}

// --- NEW Helper function to update modal summary section ---
function updateModalSummary(modalElement, data) {
    const summaryDiv = modalElement.querySelector('div'); // Assumes first div is the summary
    if (!summaryDiv) return;

    // Format Date
    let formattedDate = 'Date Unknown';
    if (data.submittedAt) {
        try {
            const date = new Date(data.submittedAt);
            formattedDate = date.toLocaleString('en-US', { // Use data.submittedAt
                weekday: 'short',
                year: 'numeric', // Use data.submittedAt
                month: 'short', // Use data.submittedAt
                day: 'numeric', // Use data.submittedAt
                hour: 'numeric', // Use data.submittedAt
                minute: '2-digit', // Use data.submittedAt
                timeZone: 'UTC', // Use data.submittedAt
                timeZoneName: 'short' // Use data.submittedAt
            }).replace(' GMT', ' UTC');
        } catch (e) {
            console.error("Error formatting date:", e);
            formattedDate = 'Invalid Date';
        }
    }

    // Format Duration from full data if available
    let formattedDuration = 'N/A';
    if (data.stats && typeof data.stats.duration === 'number' && data.stats.duration >= 0) {
        const totalSeconds = data.stats.duration;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.round(totalSeconds % 60);
        formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Update the summary part of the modal
    const paragraphs = summaryDiv.querySelectorAll('p');
    if (paragraphs.length >= 4) {
        // Update Score
        paragraphs[0].innerHTML = `<p style="margin: 0; color: #ffffff; font-size: 14px;">Score: $${data.score}</p>`;
        // Update Wave & Difficulty
        paragraphs[1].innerHTML = `<p style="margin: 0;">Wave: ${data.wave || '?'} | Difficulty: ${data.stats?.difficulty || 'Unknown'}</p>`;
        // Update Date (with smaller font size style)
        paragraphs[2].innerHTML = `<p style="margin: 0; font-size: 8px; color: #aaaaaa;">${formattedDate}</p>`;
        // Update Duration (with smaller font size style)
        paragraphs[3].innerHTML = `<p style="margin: 0; font-size: 8px; color: #aaaaaa;">Game Duration: ${formattedDuration}</p>`;
    }
}

// Function to clean up AI response text for display
function cleanupAIResponseText(text) {
  if (!text) return '';
  
  // 1. Strip markdown formatting
  let cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
    .replace(/`(.*?)`/g, '$1')       // Remove code ticks
    .replace(/^(>|\s*-)\s*/gm, '')   // Remove blockquotes and list markers
    
  // 2. Remove any leftover quotation marks from JSON strings
  cleanText = cleanText
    .replace(/^["']|["']$/g, '')     // Remove quotes at start/end
    .replace(/\\"/g, '"')            // Replace escaped quotes
  
  // 3. Fix weird patterns or terms that shouldn't be in the analysis
  const inappropriateTerms = {
    'andold': 'android', // Example: Fix typo
    'Enemy internet': 'Enemy intercept', // Example: Fix misinterpretation
    'holed MIRVs': 'incoming MIRVs', // Example: Fix game term
    // Add more specific replacements as needed based on observed AI outputs
  };
  
  Object.entries(inappropriateTerms).forEach(([badTerm, goodTerm]) => {
    // Use case-insensitive global replacement
    cleanText = cleanText.replace(new RegExp(badTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), goodTerm);
  });
  
  return cleanText.trim(); // Trim whitespace at the end
}

// Handler function for AI analysis results
function handleAIAnalysisResponse(analysisResult) {
  // Get UI elements
  const messageTitle = document.getElementById('messageTitle');
  const messageText = document.getElementById('messageText');
  const messageSubText = document.getElementById('messageSubText');
  
  // Process the summary text
  const cleanSummary = cleanupAIResponseText(analysisResult.summary);
  
  // Process each advice item
  let adviceHTML = '';
  if (Array.isArray(analysisResult.advice) && analysisResult.advice.length > 0) {
    adviceHTML = '<ul>';
    analysisResult.advice.forEach(tip => {
      // Clean up the tip text and remove any numbering at the start (we'll handle list formatting)
      let cleanTip = cleanupAIResponseText(tip);
      cleanTip = cleanTip.replace(/^\s*\d+\.?\s*/, ''); // Remove leading numbers/dots/spaces
      
      if (cleanTip) { // Only add non-empty tips
        adviceHTML += `<li>${cleanTip}</li>`;
      }
    });
    adviceHTML += '</ul>';
  }
  
  // Update the UI
  messageTitle.textContent = "AI Gameplay Analysis";
  messageText.innerHTML = cleanSummary || "Analysis complete, but no summary provided."; // Use innerHTML for potential line breaks if needed
  messageSubText.innerHTML = adviceHTML || ""; // Use innerHTML for the list
  messageSubText.style.display = adviceHTML ? 'block' : 'none';

  // --- Common UI updates needed after showing analysis ---
  messageBonusText.textContent = ""; // Clear bonus text area
  messageBonusText.style.display = 'none';
  statsContainer.style.display = 'none'; // Hide game stats
  scoreSubmissionDiv.style.display = 'none'; // Hide score submission

  // Hide store buttons if they were visible
  goToStoreButton.style.display = 'none';
  skipStoreButton.style.display = 'none';

  // Ensure the message box is visible
  messageBox.style.display = 'block';

  // Find the button container
  const buttonContainer = messageBox.querySelector('.messageBoxButtons');

  // First, remove any existing "Back to Score Submission" buttons
  const existingBackButtons = buttonContainer.querySelectorAll('#backToScoreButton'); // Use ID selector
  existingBackButtons.forEach(btn => btn.remove());

  // Add a back button to return to score submission/game over screen
  const backButton = document.createElement('button');
  backButton.id = 'backToScoreButton'; // Add an ID for easier selection
  backButton.textContent = 'Back to Score Submission';
  backButton.addEventListener('click', () => {
      // Show game over screen again with score submission
      const title = highScore === gameTotalScore && gameTotalScore > 0 ? "GAME OVER - NEW HIGH SCORE!" : "GAME OVER";
      messageTitle.textContent = title;
      messageText.innerHTML = `Total Score: $${gameTotalScore}`;
      messageSubText.innerHTML = "";
      messageSubText.style.display = 'none';
      statsContainer.style.display = 'grid'; // Show stats again
      
      // Show score submission form if score > 0
      if (gameTotalScore > 0) {
          scoreSubmissionDiv.style.display = 'flex';
          // Check if score was already submitted
          if (scoreSubmitted) {
              submissionStatus.textContent = 'Score already submitted!';
              submissionStatus.style.color = "#00ff00";
              submitScoreButton.disabled = true;
          } else if (!navigator.onLine) {
              submissionStatus.textContent = "Offline. Score saved locally.";
              submissionStatus.style.color = "#ffff00";
              submitScoreButton.disabled = true;
          } else {
              submissionStatus.textContent = '';
              submitScoreButton.disabled = false;
          }
      } else {
          scoreSubmissionDiv.style.display = 'none';
      }
      
      // Remove the back button itself
      backButton.remove();
  });

  // Add button to the message box buttons area
  buttonContainer.appendChild(backButton);
}

// --- [REMOVED] Function to Send Game Data for Analysis ---
// Logic moved into handleViewSummaryClick

// --- Function to Handle AI Summary Request ---
async function handleViewSummaryClick(event) {
    event.preventDefault(); // Prevent default link navigation behaviour
    const summaryLink = event.target; // Get the link element that was clicked
    const originalText = summaryLink.textContent; // Store original text
    summaryLink.textContent = 'Analyzing... Please Wait'; // Provide user feedback
    summaryLink.style.pointerEvents = 'none'; // Disable link during processing
    summaryLink.style.color = '#ffff00'; // Change color to indicate processing

    // Timeout controller for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        console.log("Fetch aborted due to timeout.");
    }, 20000); // 20-second timeout for the analysis request

    try {
        // --- MOVED LOGIC START ---
        // 1. Retrieve data from Local Storage
        const storedDataString = localStorage.getItem('missileCommandLastGameData');
        if (!storedDataString) {
            throw new Error("No game data found in local storage. Cannot analyze.");
        }
        const gameData = JSON.parse(storedDataString);

        // ADDED: Include player name if submitted this session
        if (submittedPlayerNameThisSession) {
            gameData.playerName = submittedPlayerNameThisSession;
            console.log(`Including submitted player name in analysis request: ${submittedPlayerNameThisSession}`);
        } else {
            console.log("No player name submitted this session, not including in analysis request.");
        }

        // 2. Check for Session Token
        if (!sessionToken) {
          // Don't throw an error, just log and exit if no token.
          console.warn('Session token is missing. Cannot send game data for analysis.');
          throw new Error("Session token missing. Cannot request analysis."); // Throw to trigger error display
        }

        // 3. Call your Cloudflare Worker
        const workerUrl = '/api'; // The endpoint for the analyzer worker
        console.log(`Sending ${gameData.clicks?.length || 0} clicks to worker: ${workerUrl}`);
        console.log(`Using session token: ${sessionToken ? sessionToken.substring(0, 6) + '...' : 'null'}`); // Log partial token

        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Token': sessionToken, // Include the session token
            },
            body: JSON.stringify(gameData), // Send the entire game data object
            signal: controller.signal // Link the AbortController signal
        });
        // --- MOVED LOGIC END ---

        // Clear the timeout timer as the fetch completed (successfully or not)
        clearTimeout(timeoutId);

        // 4. Handle Worker Response
        if (!response.ok) {
            // Handle HTTP errors from the Worker (e.g., 4xx, 5xx)
            const errorText = await response.text();
            let detail = `Status: ${response.status}.`;
            try { // Try to parse error JSON from worker
                const errorJson = JSON.parse(errorText);
                detail += ` Message: ${errorJson.error || 'Unknown worker error'}`;
            } catch {
                detail += ` Response: ${errorText || '(empty)'}`;
            }
            console.error("Worker request failed:", detail);
            throw new Error(`Analysis request failed. ${detail}`);
        }

        // Parse the successful JSON response from the Worker
        const analysisResult = await response.json();
        if (window.enableDebugLogging) {
            console.log("Received analysis:", analysisResult);
        } else {
            console.log("Analysis results received");
        }

        // 5. Display the Analysis Result using the new handler
        handleAIAnalysisResponse(analysisResult);

        // Disable the button after successful display
        summaryLink.disabled = true;
        summaryLink.textContent = 'Summary Viewed';
        summaryLink.style.color = '#aaaaaa'; // Optional: Grey out text

    } catch (error) {
        // Catch errors from local storage access, fetch (network, timeout), or response handling
        clearTimeout(timeoutId); // Ensure timeout is cleared on error
        console.error("Error in handleViewSummaryClick:", error);

        // Display Error in Message Box
        messageTitle.textContent = "Analysis Error";
        if (error.name === 'AbortError') {
            messageText.innerHTML = "The analysis request timed out. The AI might be busy or the request too large. Please try again later.";
            messageSubText.innerHTML = "";
        } else {
            messageText.innerHTML = "Could not retrieve or process game analysis.";
            // Provide specific error message for debugging
            messageSubText.innerHTML = `Error: ${error.message}`;
        }
        messageSubText.style.display = messageSubText.innerHTML ? 'block' : 'none';
        messageBonusText.textContent = "";
        messageBonusText.style.display = 'none';
        statsContainer.style.display = 'none';
        scoreSubmissionDiv.style.display = 'none';
        goToStoreButton.style.display = 'none';
        skipStoreButton.style.display = 'none';

        messageBox.style.display = 'block'; // Ensure message box shows error

    } finally {
        // Always reset the link state, whether success or error
        summaryLink.textContent = originalText; // Restore original text
        summaryLink.style.pointerEvents = 'auto'; // Re-enable link
        summaryLink.style.color = '#00ffff'; // Restore original color
    }
}

// --- [NEW/MODIFIED] Function to Submit Score ---
async function submitScoreData(scoreData) {
    // Takes a scoreData object (like the one stored locally)
    const name = scoreData.name;
    const finalScore = scoreData.score;
    const waveReached = scoreData.wave;
    const gameStats = scoreData.stats;

    if (!name || name === 'TEMP_OFFLINE' || name.length === 0 || name.length > 18) {
        console.error("Cannot submit score with invalid name:", name);
        return { success: false, error: "Invalid name" };
    }
    
    if (finalScore <= 0) {
        console.warn("Attempted to submit zero score.");
        return { success: false, error: "Zero score" };
    }

    console.log(`Submitting score: Name=${name}, Score=${finalScore}, Wave=${waveReached}`);

    try {
        // --- SESSION TOKEN: Attach to scoreData if present ---
        if (sessionToken) {
            scoreData.sessionToken = sessionToken;
        }

        const response = await fetch('/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData), // FIX: Stringify the complete scoreData object passed in
        });

        if (!response.ok) {
            const errorText = await response.text();
            // --- AUTO-CLEAR LOCAL STORED SCORES ON 403 INVALID SESSION TOKEN ---
            if (response.status === 403 && errorText.includes('Invalid or expired session token')) {
                localStorage.removeItem('storedScores');
                console.warn('Cleared local stored scores due to invalid/expired session token.');
            }
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        // Only log the full response if the user is the debug user
        if (window.enableDebugLogging) {
            console.log("Submission response:", result);
        } else {
            // Optionally log a simpler message for non-debug users
            console.log("Score submission processed.");
        }
        // Save the successfully submitted name for next time - DISABLED as requested
        // localStorage.setItem('missileCommandPlayerName', name);
        return { success: true };

    } catch (error) {
        console.error('Error submitting score data:', error);
        return { success: false, error: error.message };
    }
}

// --- [MODIFIED] Function to Submit High Score ---
async function submitHighScore() {
  // This function handles UI for submission when online
  const name = playerNameInput.value.trim().toUpperCase();
  const finalScore = gameTotalScore;
  const waveReached = currentWave + 1;

  if (!name || name.length === 0 || name.length > 18) {
    submissionStatus.textContent = "Enter 1-18 characters.";
    submissionStatus.style.color = "#ff0000";
    return;
  }
  if (finalScore <= 0) {
    submissionStatus.textContent = "No score to submit.";
    submissionStatus.style.color = "#ffff00";
    submitScoreButton.disabled = true;
    return;
  }

  // Collect stats for immediate submission
  const gameStats = {
    missilesFired: statsMissilesFired,
    enemyMissilesDestroyed: statsEnemyMissilesDestroyed,
    planeBombsDestroyed: statsPlaneBombsDestroyed,
    planesDestroyed: statsPlanesDestroyed,
    citiesLost: statsCitiesLost,
    basesLost: statsBasesLost,
    accuracyBonusHits: statsAccuracyBonusHits,
    shieldBombsDestroyed: statsShieldBombsDestroyed,
    difficulty: selectedDifficultyName,
    missileSpeedLevel: playerMissileSpeedLevel,
    explosionRadiusLevel: explosionRadiusLevel,
    accuracy: parseFloat(statsMissilesFired > 0 ?
      ((statsEnemyMissilesDestroyed + statsPlaneBombsDestroyed) / statsMissilesFired * 100).toFixed(1) :
      "0.0"),
    duration: Math.round(totalGameDurationSeconds),
    // ADDED: Include gameStartTime in submitted stats
    gameStartTime: gameStartTimestamp,
    // ADDED: Include wave stats in submission
    waveStats: waveStats.map(stat => stat ? stat.spawnToCompletionMs : null)
  };

  submitScoreButton.disabled = true;
  submissionStatus.textContent = "Submitting...";
  submissionStatus.style.color = "#00ff00";

  const scoreDataToSubmit = {
    name: name,
    score: finalScore,
    wave: waveReached,
    stats: gameStats,
    nonce: crypto.randomUUID() // Generate and add nonce
  };

  // Add signature if possible
  try {
    // Attach sessionToken before signing
    if (sessionToken) {
      scoreDataToSubmit.sessionToken = sessionToken;
    }
    const secretKey = await getGameSecret();

    if (window.enableDebugLogging) {
      console.log("Secret key fetch result:", secretKey ? "Success" : "Failed");
    }

    if (secretKey) {
      const signature = await generateScoreSignature(scoreDataToSubmit, secretKey);

      if (window.enableDebugLogging) {
        console.log("Generated signature:", signature.substring(0, 10) + "...");
      } else {
        console.log("Score signature generated");
      }

      scoreDataToSubmit.signature = signature;
    } else {
      // Keep warning for both debug and non-debug as it's important
      console.warn("Could not get secret key for signature");
    }
  } catch (e) {
    // Keep error log for both cases, but limit details for non-debug
    if (window.enableDebugLogging) {
      console.error("Failed to generate signature:", e);
    } else {
      console.error("Failed to generate score signature");
    }
    // Continue without signature - server will decide whether to accept
  }

  // Conditionally log the full payload
  if (window.enableDebugLogging) {
    console.log("Submitting score data (Debug):", JSON.stringify(scoreDataToSubmit));
  } else {
    console.log("Submitting score data (Non-Debug)..."); // Log less detail for regular users
  }

  // Continue with your existing function logic
  const result = await submitScoreData(scoreDataToSubmit);

  if (result.success) {
    submissionStatus.textContent = "Score Submitted!";
    submissionStatus.style.color = "#00ff00";
    scoreSubmitted = true; // Mark as submitted for this game instance
    submittedPlayerNameThisSession = name; // ADDED: Store name for this session
    // Save the player name for future use
    localStorage.setItem('missileCommandPlayerName', name);
    
    // NOW we can reset the gameStartTimestamp since submission is complete
    gameStartTimestamp = 0;
    
  } else {
    // If submission failed but we're online, store it locally to try again later
    if (navigator.onLine) {
      submissionStatus.textContent = `Submission Failed: ${result.error || 'Unknown error'}`;
      submissionStatus.style.color = "#ff0000";
      submitScoreButton.disabled = false; // Re-enable on failure
      
      // Store the failed submission attempt locally to retry later
      try {
        const storedScores = JSON.parse(localStorage.getItem('storedScores') || '[]');
        scoreDataToSubmit.timestamp = Date.now(); // Add timestamp
        storedScores.push(scoreDataToSubmit);
        localStorage.setItem('storedScores', JSON.stringify(storedScores));
        console.log(`Failed score submission stored locally for later retry.`);
      } catch (e) {
        console.error("Error storing failed submission:", e);
      }
    } else {
      // We're offline now, so store the score for later
      submissionStatus.textContent = "Offline. Score saved locally.";
      submissionStatus.style.color = "#ffff00";
      
      try {
        const storedScores = JSON.parse(localStorage.getItem('storedScores') || '[]');
        scoreDataToSubmit.timestamp = Date.now(); // Add timestamp
        storedScores.push(scoreDataToSubmit);
        localStorage.setItem('storedScores', JSON.stringify(storedScores));
        console.log(`Score stored locally due to going offline.`);
      } catch (e) {
        console.error("Error storing offline submission:", e);
      }
    }
  }
}

// --- [MODIFIED] Function to Sync Stored Scores ---
async function syncStoredScores() {
  const storedScoresString = localStorage.getItem('storedScores');
  if (!storedScoresString) {
    console.log("No scores stored locally to sync.");
    return { synced: 0, failed: 0 };
  }

  let storedScores = [];
  try {
    storedScores = JSON.parse(storedScoresString);
    if (!Array.isArray(storedScores)) {
      console.warn("Stored scores data is not an array, resetting.");
      storedScores = [];
    }
  } catch (e) {
    console.error("Error parsing stored scores, resetting:", e);
    localStorage.removeItem('storedScores');
    return { synced: 0, failed: 0 };
  }

  if (storedScores.length === 0) {
    console.log("No scores stored locally to sync after parsing.");
    localStorage.removeItem('storedScores'); // Clean up empty array storage
    return { synced: 0, failed: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const remainingScores = []; // Keep track of scores that failed to sync

  // Try to get the secret key once before the loop
  const secretKey = await getGameSecret();
  const defaultName = (playerNameInput.value.trim().toUpperCase() || 'ACE'); // Use input or 'ACE'

  for (const scoreData of storedScores) {
    // Ensure scoreData is an object
    if (typeof scoreData !== 'object' || scoreData === null) {
      console.warn("Skipping invalid score data entry:", scoreData);
      failedCount++; // Count as failed if data is invalid
      continue; // Skip this entry
    }

    // If the stored score doesn't have a valid name, use the default/last used one
    if (!scoreData.name || scoreData.name === 'TEMP_OFFLINE') {
      scoreData.name = defaultName;
      if (scoreData.name === 'ACE') { // Log if using the absolute fallback
        console.warn(`Submitting offline score for ${scoreData.score} with default name 'ACE'.`);
      }
    }

    // Generate a fresh signature if we have the key
    if (secretKey) {
      try {
        // Ensure scoreData has necessary fields before signing
        if (scoreData.name && scoreData.score && scoreData.wave) {
          scoreData.signature = await generateScoreSignature(scoreData, secretKey);
        } else {
          console.warn("Skipping signature generation due to missing score data fields:", scoreData);
        }
      } catch (e) {
        console.error("Failed to generate signature for stored score:", e);
      }
    }

    console.log(`Syncing score: Name=${scoreData.name}, Score=${scoreData.score}`);
    const result = await submitScoreData(scoreData); // Use your existing submission function

    // --- IMMEDIATE CLEAR AND EXIT ON 403 INVALID SESSION TOKEN ---
    if (
      result.error &&
      typeof result.error === 'string' &&
      result.error.includes('Invalid or expired session token')
    ) {
      localStorage.removeItem('storedScores');
      console.warn('Cleared local stored scores due to invalid/expired session token (syncStoredScores).');
      return { synced: syncedCount, failed: failedCount + 1 };
    }

    if (result.success) {
      syncedCount++;
    } else {
      failedCount++;
      remainingScores.push(scoreData); // Add failed score back to the list
    }
  }

  // Update localStorage with only the scores that failed to sync
  if (remainingScores.length > 0) {
    localStorage.setItem('storedScores', JSON.stringify(remainingScores));
    console.log(`Sync complete. Synced: ${syncedCount}, Failed: ${failedCount}. ${remainingScores.length} scores remain stored.`);
  } else {
    localStorage.removeItem('storedScores'); // Remove item if all scores were synced
    console.log(`Sync complete. Synced: ${syncedCount}, Failed: ${failedCount}. All stored scores processed.`);
  }

  if (remainingScores.length === 0) {
      // If all scores were synced, we can reset the timestamp
      gameStartTimestamp = 0;
      console.log("All scores synced, reset game start timestamp");
  }

  return { synced: syncedCount, failed: failedCount }; // Return the result object
}

// --- [NEW] Update UI function for sync status ---
function updateSyncStatusUI(syncResult) {
    // Add safety check for syncResult
    if (!syncResult || typeof syncResult.synced !== 'number' || typeof syncResult.failed !== 'number') {
        console.error("updateSyncStatusUI called with invalid syncResult:", syncResult);
        return; // Exit early if data is invalid
    }

    // If we're on the game over screen with a submission status display
    if (isGameOver && messageBox.style.display === 'block' && submissionStatus) {
        if (syncResult.synced > 0 && syncResult.failed === 0) {
            submissionStatus.textContent = `${syncResult.synced} offline score(s) synced!`;
            submissionStatus.style.color = "#00ff00";
            submitScoreButton.disabled = scoreSubmitted; // Enable if not already submitted
        } else if (syncResult.synced > 0 && syncResult.failed > 0) {
            submissionStatus.textContent = `Synced ${syncResult.synced}, failed to sync ${syncResult.failed} score(s).`;
            submissionStatus.style.color = "#ffaa00";
            submitScoreButton.disabled = false; // Re-enable button
        } else if (syncResult.synced === 0 && syncResult.failed > 0) {
            submissionStatus.textContent = `Failed to sync ${syncResult.failed} score(s).`;
            submissionStatus.style.color = "#ff0000";
            submitScoreButton.disabled = false; // Re-enable button
        }
    }
    
    // Optionally add UI notifications elsewhere in the game about synced scores
    // For example, a small notification banner at the top or a toast message
}

// Add this function to get the game secret
async function getGameSecret() {
  // Check if we already have the key in memory
  if (window.gameSecretKey) {
    if (window.enableDebugLogging) {
      console.log("Using cached game secret key");
    }
    return window.gameSecretKey;
  }
  
  try {
    if (window.enableDebugLogging) {
      console.log("Fetching game secret from server...");
    } else {
      console.log("Authenticating...");
    }
    
    const response = await fetch('/game-secret');
    
    if (window.enableDebugLogging) {
      console.log("Game secret response status:", response.status);
    }
    
    if (!response.ok) {
      console.error('Failed to get game secret, status:', response.status);
      if (window.enableDebugLogging) {
        const text = await response.text();
        console.error('Response text:', text);
      }
      return null;
    }
    
    const data = await response.json();
    
    if (!data.key) {
      console.error('Invalid game secret response - no key in data:', data);
      return null;
    }
    
    // Store the key in memory only (not localStorage)
    window.gameSecretKey = data.key;
    
    if (window.enableDebugLogging) {
      console.log("Successfully obtained game secret");
    } else {
      console.log("Authentication successful");
    }
    
    return data.key;
  } catch (error) {
    console.error('Error fetching game secret:', error);
    return null;
  }
}

/**
 * Deterministically serialize an object with sorted keys (for signature).
 * Handles only plain objects and primitives (no circular refs).
 */
function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',')}}`;
}

// Add this function to generate signatures
async function generateScoreSignature(scoreData, secretKey) {
  // Create a string to hash (include all important fields)
  // sessionToken and nonce must be present on scoreData
  const statsString = stableStringify(scoreData.stats || {});
  // ADDED nonce to the signature data
  const dataToHash = `${scoreData.name}-${scoreData.score}-${scoreData.wave}-${statsString}-${scoreData.sessionToken}-${scoreData.nonce}-${secretKey}`;

  // Use Web Crypto API to create a hash
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Event Listeners ---
// MODIFIED: Replace click listener with handleCanvasInput
// Initialize AudioContext on first user interaction (click or touch)

// ADDED: Touch event listeners
canvas.addEventListener('click', handleCanvasInput);
canvas.addEventListener('touchstart', handleCanvasInput, { passive: false });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

// ADDED: Enhance special weapon controls for touch
sonicWaveControl.addEventListener('touchstart', (event) => {
    event.preventDefault();
    if (!sonicWaveControl.classList.contains('disabled')) {
        triggerSonicWave();
    }
}, { passive: false });

bombControl.addEventListener('touchstart', (event) => {
    event.preventDefault();
    if (!bombControl.classList.contains('disabled')) {
        armBomb();
    }
}, { passive: false });

// --- [ADDED] Event Listener for View More Leaderboard ---
leaderboardViewMoreLink.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    console.log("View More clicked, fetching top 1000...");
    fetchAndDisplayLeaderboard(1000); // Fetch and display top 1000
});

// --- MODIFIED: restartButton Event Listener (handles both restart buttons) ---
document.querySelectorAll('#restartButton').forEach(button => {
    button.addEventListener('click', () => {
        // Check if the game is currently running and needs confirmation
        const gameIsActive = gameHasStarted && !isGameOver && !isPaused && !transitioningWave;
        if (gameIsActive && !confirm("Are you sure you want to restart the current game?")) {
            return; // User cancelled the restart
        }

        // Proceed with restart logic
        if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
        stopMusic(); // ADDED: Stop music on restart
        isGameOver = true; gameHasStarted = false; isPaused = false; transitioningWave = false; difficultySelected = false;
        // Reset game state variables
        score = 0; gameTotalScore = 0; currentWave = -1; consecutiveIntercepts = 0; scoreMultiplier = 1.0;
        playerMissileSpeedLevel = 0; explosionRadiusLevel = 0; bonusMissileCount = 0;
        totalGameDurationSeconds = 0; waveStartTime = 0; waveAllSpawnedTimestamp = 0; waveStats = []; gameStartTimestamp = 0;
        storeStockSatellite = MAX_STOCK_SATELLITE; storeStockBase = MAX_STOCK_BASE; storeStockCity = MAX_STOCK_CITY; storeStockShield = MAX_STOCK_SHIELD; storeStockSatShield = MAX_STOCK_SAT_SHIELD; storeStockSonicWave = MAX_STOCK_SONIC_WAVE; storeStockBomb = MAX_STOCK_BOMB;
        inventorySonicWave = 0; inventoryBomb = 0; isBombArmed = false; activeSonicWave = null;
        satelliteBases = []; baseShields = [null, null, null]; cities = []; bases = []; incomingMissiles = []; playerMissiles = []; explosions = []; planes = []; planeBombs = [];
        selectedDifficultyName = ''; difficultyScoreMultiplier = 1.0;
        statsMissilesFired = 0; statsEnemyMissilesDestroyed = 0; statsPlaneBombsDestroyed = 0; statsPlanesDestroyed = 0; statsCitiesLost = 0; statsBasesLost = 0; statsAccuracyBonusHits = 0;

        initializeStars();

        // Reset UI elements to initial state
        startMenuContainer.style.display = 'flex';
        canvasContainer.style.display = 'none'; canvas.style.display = 'none';
        uiContainer.style.display = 'none'; controlsContainer.style.display = 'none'; specialWeaponsUIDiv.style.display = 'none';
        pauseOverlay.style.display = 'none'; hideMessage(); storeModal.style.display = 'none';
        actualStartButton.style.display = 'none'; actualStartButton.disabled = true;
        // Hide all restart buttons initially
        document.querySelectorAll('#restartButton').forEach(btn => btn.style.display = 'none');
        pauseButton.style.display = 'none'; screenshotButton.style.display = 'none';
        bonusIndicator.style.display = 'none'; statsContainer.style.display = 'none';
        scoreSubmissionDiv.style.display = 'none'; // Hide submission form
        document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.remove('selected'));

        // Update high score and fetch leaderboard for start menu
        highScore = parseInt(localStorage.getItem('missileCommandHighScore') || '0');
        startHighScoreDisplay.textContent = `High Score: $${highScore}`;
        fetchAndDisplayLeaderboard(10); // Fetch leaderboard when returning to start menu
    });
});

pauseButton.addEventListener('click', togglePause);
screenshotButton.addEventListener('click', saveScreenshot);
storeContinueButton.addEventListener('click', proceedToNextWave);
buyBaseButton.addEventListener('click', buyReplacementBase);
buyCityButton.addEventListener('click', buyReplacementCity);
buySatelliteButton.addEventListener('click', buySatellite);
buyShieldButton.addEventListener('click', buyShield);
buySatShieldButton.addEventListener('click', buySatShield);
buySonicWaveButton.addEventListener('click', buySonicWave);
buyBombButton.addEventListener('click', buyBomb);
buyFasterMissileButton.addEventListener('click', buyFasterMissile);
buyWiderExplosionButton.addEventListener('click', buyWiderExplosion);
buySonicWave10Button.addEventListener('click', buySonicWave10);
buyBomb10Button.addEventListener('click', buyBomb10);
goToStoreButton.addEventListener('click', () => { hideMessage(); updateStoreUI(); storeModal.style.display = 'block'; });
skipStoreButton.addEventListener('click', proceedToNextWave);
document.querySelectorAll('.difficulty-button').forEach(button => {
    button.addEventListener('click', (event) => {
        try {
            console.log("Difficulty button clicked:", event.target.textContent);
            selectedDifficultyAmmo = parseInt(event.target.getAttribute('data-ammo'), 10);
            difficultyScoreMultiplier = parseFloat(event.target.getAttribute('data-multiplier') || '1.0');
            difficultySelected = true;
            selectedDifficultyName = event.target.textContent;
            console.log("Difficulty set:", selectedDifficultyName, "Ammo:", selectedDifficultyAmmo, "Multiplier:", difficultyScoreMultiplier);
            document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.remove('selected'));
            event.target.classList.add('selected');
            console.log("Selected class added.");
            if (actualStartButton) {
                 console.log("Attempting to show/enable Start Game button...");
                 actualStartButton.style.display = 'inline-block';
                 actualStartButton.disabled = false;
                 console.log("Start Game button display:", actualStartButton.style.display, "disabled:", actualStartButton.disabled);
            } else {
                 console.error("ERROR: actualStartButton element not found!");
            }
        } catch (error) {
             console.error("Error in difficulty button listener:", error);
        }
    });
});
actualStartButton.addEventListener('click', () => {
     if (difficultySelected) {
         initAudioContext(); // Ensure audio context is ready before starting
         startGame();
     }
});
sonicWaveControl.addEventListener('click', () => { if (!sonicWaveControl.classList.contains('disabled')) { triggerSonicWave(); } });
bombControl.addEventListener('click', () => { if (!bombControl.classList.contains('disabled')) { armBomb(); } });
window.addEventListener('keydown', (event) => {
    // Existing Spacebar pause toggle
    if (event.code === 'Space' && !isGameOver && !transitioningWave && gameHasStarted && storeModal.style.display === 'none' && messageBox.style.display === 'none' ) {
        event.preventDefault();
        togglePause();
    }
    // Call the main handler for other keys
    handleKeyDown(event);
});

// --- ADDED: Mute Button and Volume Slider Listeners ---
muteMusicButton.addEventListener('click', toggleMusicMute);
muteSfxButton.addEventListener('click', toggleSfxMute);
musicVolumeSlider.addEventListener('input', handleMusicVolumeChange); // NEW
sfxVolumeSlider.addEventListener('input', handleSfxVolumeChange);     // NEW

// --- NEW: Event Listener for Score Submission ---
submitScoreButton.addEventListener('click', submitHighScore);
// Allow submitting with Enter key from input field
playerNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        submitHighScore();
    }
});

// --- ADDED: Window resize and orientation change listeners ---
window.addEventListener('resize', optimizeCanvasForOrientation);
window.addEventListener('orientationchange', () => {
    // Small delay to ensure orientation has fully changed
    setTimeout(optimizeCanvasForOrientation, 100);
});

// --- ADDED: Prevent default pinch-zoom gestures ---
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

function debugDeviceInfo() {
    console.log(`Window size: ${window.innerWidth} x ${window.innerHeight}`);
    console.log(`Is landscape: ${window.innerWidth > window.innerHeight}`);
    console.log(`Is mobile/small: ${window.innerHeight < 700}`);
}

// Debug event listeners
window.addEventListener('load', debugDeviceInfo);
window.addEventListener('resize', debugDeviceInfo);
window.addEventListener('orientationchange', function() {
    console.log("Orientation changed");
    setTimeout(debugDeviceInfo, 100);
});

// --- [NEW] Event Listeners for Online/Offline Status ---
window.addEventListener('online', async () => {
    console.log("Browser detected online status.");
    // Attempt to sync any scores stored while offline
    const syncResult = await syncStoredScores();
    
    // Update UI based on sync results
    updateSyncStatusUI(syncResult);

    // Maybe sync done if needed
    maybeRefreshLeaderboard();

    // Update AI analysis button if present
    const summaryLink = document.getElementById('viewGameSummaryLink');
    if (summaryLink) {
        summaryLink.disabled = false;
    }
});

window.addEventListener('offline', () => {
    console.log("Browser detected offline status.");
    // If the game over screen is visible and submission was possible, update UI
    if (isGameOver && messageBox.style.display === 'block' && !submitScoreButton.disabled) {
        submissionStatus.textContent = "Offline. Score saved locally.";
        submissionStatus.style.color = "#ffff00";
        submitScoreButton.disabled = true;
    }
    
    // Disable AI analysis button if present
    const summaryLink = document.getElementById('viewGameSummaryLink');
    if (summaryLink) {
        summaryLink.disabled = true;
    }
});

// --- [HELPER] Conditional leaderboard refresh ---
function maybeRefreshLeaderboard() {
    // Only refresh if the leaderboard is currently displayed
    if (typeof fetchAndDisplayLeaderboard === 'function' && 
        leaderboardContainer && 
        leaderboardContainer.style.display !== 'none') {
        fetchAndDisplayLeaderboard();
    }
}

// About Game Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // Find or create the about game button based on your implementation choice
    const aboutGameButton = document.getElementById('aboutGameButton') || document.getElementById('aboutGameLink');
    const aboutGameModal = document.getElementById('aboutGameModal');
    const closeAboutButton = document.getElementById('closeAboutButton');
    
    if (aboutGameButton && aboutGameModal && closeAboutButton) {
        // Show the modal when clicking the about button
        aboutGameButton.addEventListener('click', function(event) {
            event.preventDefault();
            // Initialize audio context if not done already (to handle browser audio policy)
            if (typeof initAudioContext === 'function' && !audioInitialized) {
                initAudioContext();
                audioInitialized = true;
            }
            // Check if a game is active and pause it
            const wasPlaying = gameHasStarted && !isGameOver && !isPaused;
            if (wasPlaying) {
                pauseGame();
            }
            
            aboutGameModal.style.display = 'block';
            
            // Add data attribute to track if game was paused by modal
            aboutGameModal.dataset.pausedGame = wasPlaying ? 'true' : 'false';
        });
        
        // Hide the modal when clicking the close button
        closeAboutButton.addEventListener('click', function() {
            aboutGameModal.style.display = 'none';
            
            // Resume game if it was playing before
            if (aboutGameModal.dataset.pausedGame === 'true' && gameHasStarted && !isGameOver) {
                resumeGame();
            }
        });
        
        // Close modal with Escape key
        window.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && aboutGameModal.style.display === 'block') {
                closeAboutButton.click();
            }
        });
    }
});

// --- MODIFIED: window.onload ---
window.onload = () => {
    // Reset game state variables
    gameStartTimestamp = 0;

    // Set canvas dimensions
    canvas.width = INTERNAL_WIDTH; canvas.height = INTERNAL_HEIGHT;

    // initializeStars
    initializeStars();

    // ADDED: Optimize for current orientation on load
    optimizeCanvasForOrientation();
    
    // Load high score
    highScore = parseInt(localStorage.getItem('missileCommandHighScore') || '0');
    startHighScoreDisplay.textContent = `High Score: $${highScore}`;
    highScoreDisplay.textContent = `HI: $${highScore}`; // Also update in-game UI

    // Set initial UI visibility and slider states
    startMenuContainer.style.display = 'flex';
    canvasContainer.style.display = 'none'; canvas.style.display = 'none';
    uiContainer.style.display = 'none'; controlsContainer.style.display = 'none'; specialWeaponsUIDiv.style.display = 'none';
    messageBox.style.display = 'none'; storeModal.style.display = 'none'; pauseOverlay.style.display = 'none';
    actualStartButton.style.display = 'none';
    // Ensure all restart buttons are hidden initially
    document.querySelectorAll('#restartButton').forEach(btn => btn.style.display = 'none');
    pauseButton.style.display = 'none'; screenshotButton.style.display = 'none';
    bonusIndicator.style.display = 'none'; statsContainer.style.display = 'none';
    scoreSubmissionDiv.style.display = 'none'; // Ensure submission form is hidden initially
    // Set initial slider disabled state based on mute state
    musicVolumeSlider.disabled = isMusicMuted;
    sfxVolumeSlider.disabled = isSfxMuted;
    // Set initial mute button text
    muteMusicButton.textContent = isMusicMuted ? 'Unmute Music' : 'Mute Music';
    muteSfxButton.textContent = isSfxMuted ? 'Unmute SFX' : 'Mute SFX';

    // Fetch leaderboard on load
    fetchAndDisplayLeaderboard(10);

    // --- iOS Install Instructions Logic ---

    function isIOS() {
      return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
      ].includes(navigator.platform)
      // Plus iPad on iOS 13 detection
      || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    }

    const iosInstructionsDiv = document.getElementById('iosInstallInstructions');
    const closeInstructionsButton = document.getElementById('closeInstallInstructions');

    // Check if it's iOS AND not running in standalone mode (already installed)
    if (isIOS() && !window.navigator.standalone && iosInstructionsDiv) {
      // Check if the 'beforeinstallprompt' event is NOT supported by this browser
      // (This check is a bit indirect, we assume if it doesn't fire quickly, it's not supported)
      let promptSupported = false;
      window.addEventListener('beforeinstallprompt', () => {
        promptSupported = true;
      });

      // Wait a short time to see if beforeinstallprompt fires
      setTimeout(() => {
        if (!promptSupported && iosInstructionsDiv.style.display !== 'block') { // Double check it's not already shown
          console.log("iOS detected, standalone mode is false, and beforeinstallprompt likely not supported. Showing instructions.");
          iosInstructionsDiv.classList.add('show-instructions'); // Add class to trigger CSS display rule
          // Optional: Add class to body to hide the other install button via CSS
          document.body.classList.add('ios-device');
        } else {
          console.log("iOS detected, but PWA might be installed or prompt is supported.");
        }
      }, 1500); // Wait 1.5 seconds
    }

    // Add listener for the dismiss button (if it exists)
    if (closeInstructionsButton && iosInstructionsDiv) {
        closeInstructionsButton.addEventListener('click', () => {
            iosInstructionsDiv.style.display = 'none'; // Directly hide it
        });
    }

    // Service worker registration (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('[Service Worker] registered:', registration.scope);
        }).catch((error) => {
            console.error('[Service Worker] registration failed:', error);
        });
    } else {
        console.log('[Service Worker] not supported.');
    }
    
    // --- [NEW] Initial check for stored offline scores on load ---
    // Slight delay to ensure page is fully interactive
    setTimeout(async () => {
        if (navigator.onLine) {
            const syncResult = await syncStoredScores();
            if (syncResult.synced > 0) {
                console.log(`Synced ${syncResult.synced} previously stored scores on startup.`);
                // Optional: Show a notification to the user
                fetchAndDisplayLeaderboard(); // Refresh leaderboard
            }
        } else {
            const storedScores = localStorage.getItem('storedScores');
            if (storedScores && JSON.parse(storedScores).length > 0) {
                console.log("Offline on load, locally stored scores detected.");
                // Optional: Notify user they have scores waiting to sync
            }
        }
        // Extra brace removed from here
    }, 1000); // 1 second delay

    // --- [NEW] Fetch debug status on load (using IIAFE) ---
    (async () => {
      try {
          const debugResponse = await fetch('/check-debug-status');
          if (debugResponse.ok) {
              const debugData = await debugResponse.json();
              window.enableDebugLogging = debugData.isDebug;
              console.log(`Debug logging enabled: ${window.enableDebugLogging}`);
          } else {
              console.warn('Failed to fetch debug status from server.');
          }
      } catch (error) {
          console.error('Error fetching debug status:', error);
      }
    })(); // Immediately invoke the async function
    // --- END Fetch debug status ---

}; // End of window.onload
