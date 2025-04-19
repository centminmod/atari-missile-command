import * as Config from './configAndUtils.js';
import * as GameLogic from './gameLogic.js'; // Import the entire module as GameLogic

// --- DOM Element References ---
export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const scoreDisplay = document.getElementById('score');
export const highScoreDisplay = document.getElementById('highScore');
export const waveDisplay = document.getElementById('wave');
export const citiesLeftDisplay = document.getElementById('citiesLeft');
export const multiplierDisplay = document.getElementById('multiplier');
export const restartButton = document.getElementById('restartButton'); // Note: Multiple restart buttons exist, handled in main.js listener
export const pauseButton = document.getElementById('pauseButton');
export const screenshotButton = document.getElementById('screenshotButton');
export const messageBox = document.getElementById('messageBox');
export const messageTitle = document.getElementById('messageTitle');
export const messageText = document.getElementById('messageText');
export const messageSubText = document.getElementById('messageSubText');
export const messageBonusText = document.getElementById('messageBonusText');
export const statsContainer = document.getElementById('statsContainer');
export const pauseOverlay = document.getElementById('pauseOverlay');
export const uiContainer = document.getElementById('uiContainer');
export const controlsContainer = document.getElementById('controlsContainer');
export const difficultySelectionDiv = document.getElementById('difficultySelection');
export const startMenuContainer = document.getElementById('startMenuContainer');
export const startHighScoreDisplay = document.getElementById('startHighScore');
export const actualStartButton = document.getElementById('actualStartButton');
export const bonusIndicator = document.getElementById('bonusIndicator');
export const goToStoreButton = document.getElementById('goToStoreButton');
export const skipStoreButton = document.getElementById('skipStoreButton');
export const storeModal = document.getElementById('storeModal');
export const storeScoreDisplay = document.getElementById('storeScore');
export const stockSatelliteDisplay = document.getElementById('stockSatellite');
export const stockBaseDisplay = document.getElementById('stockBase');
export const stockCityDisplay = document.getElementById('stockCity');
export const stockShieldDisplay = document.getElementById('stockShield');
export const stockSatShieldDisplay = document.getElementById('stockSatShield');
export const stockSonicWaveDisplay = document.getElementById('stockSonicWave');
export const stockBombDisplay = document.getElementById('stockBomb');
export const buySatelliteButton = document.getElementById('buySatelliteButton');
export const buyBaseButton = document.getElementById('buyBaseButton');
export const buyCityButton = document.getElementById('buyCityButton');
export const buyShieldButton = document.getElementById('buyShieldButton');
export const buySatShieldButton = document.getElementById('buySatShieldButton');
export const buySonicWaveButton = document.getElementById('buySonicWaveButton');
export const buyBombButton = document.getElementById('buyBombButton');
export const buySonicWave10Button = document.getElementById('buySonicWave10Button');
export const buyBomb10Button = document.getElementById('buyBomb10Button');
export const storeContinueButton = document.getElementById('storeContinueButton');
export const specialWeaponsUIDiv = document.getElementById('specialWeaponsUI');
export const sonicWaveControl = document.getElementById('sonicWaveControl');
export const sonicWaveCountDisplay = document.getElementById('sonicWaveCount');
export const bombControl = document.getElementById('bombControl');
export const bombCountDisplay = document.getElementById('bombCount');
export const canvasContainer = document.getElementById('canvasContainer');
export const costFasterMissileDisplay = document.getElementById('costFasterMissile');
export const levelFasterMissileDisplay = document.getElementById('levelFasterMissile');
export const buyFasterMissileButton = document.getElementById('buyFasterMissileButton');
export const costWiderExplosionDisplay = document.getElementById('costWiderExplosion');
export const levelWiderExplosionDisplay = document.getElementById('levelWiderExplosion');
export const buyWiderExplosionButton = document.getElementById('buyWiderExplosionButton');
export const muteMusicButton = document.getElementById('muteMusicButton');
export const muteSfxButton = document.getElementById('muteSfxButton');
export const musicVolumeSlider = document.getElementById('musicVolumeSlider');
export const sfxVolumeSlider = document.getElementById('sfxVolumeSlider');
export const leaderboardContainer = document.getElementById('leaderboardContainer');
export const leaderboardList = document.getElementById('leaderboardList');
export const leaderboardLoading = document.getElementById('leaderboardLoading');
export const leaderboardViewMoreContainer = document.getElementById('leaderboardViewMoreContainer');
export const leaderboardViewMoreLink = document.getElementById('leaderboardViewMoreLink');
export const scoreSubmissionDiv = document.getElementById('scoreSubmission');
export const playerNameInput = document.getElementById('playerNameInput');
export const submitScoreButton = document.getElementById('submitScoreButton');
export const submissionStatus = document.getElementById('submissionStatus');
export const installButton = document.getElementById('installPwaButton');
export const aboutGameButton = document.getElementById('aboutGameButton') || document.getElementById('aboutGameLink');
export const aboutGameModal = document.getElementById('aboutGameModal');
export const closeAboutButton = document.getElementById('closeAboutButton');
export const iosInstructionsDiv = document.getElementById('iosInstallInstructions');
export const closeInstructionsButton = document.getElementById('closeInstallInstructions');


// --- PWA Install Prompt Variables ---
export let deferredPrompt = null; // Export to allow main.js to potentially access

// --- Audio State & Context (Managed within this module) ---
let audioContext;
let masterGainNode;
let musicGainNode;
let sfxGainNode;
let musicBuffer = null;
let launchBuffer = null;
let explosionBuffer = null;
let musicSourceNode = null;
let isMusicMuted = true;
let isSfxMuted = false;
export let audioInitialized = false; // Export to allow main.js to check

// --- Session Token (Managed within this module) ---
let sessionToken = null;

// --- Score Submission State (Managed within this module) ---
let scoreSubmitted = false;
let submittedPlayerNameThisSession = null;

// --- SESSION TOKEN FOR SCORE SUBMISSION ---
export async function fetchSessionToken() {
  try {
    const response = await fetch('/start-session', { method: 'POST' });
    if (!response.ok) throw new Error('Failed to get session token');
    const data = await response.json();
    sessionToken = data.sessionToken; // Store token internally
    console.log('Session token acquired:', sessionToken ? sessionToken.substring(0, 6) + '...' : 'null');
    return sessionToken; // Return for potential use elsewhere if needed
  } catch (e) {
    sessionToken = null;
    console.error('Session token error:', e);
    // Optionally: disable score submission UI here (handled in gameOver logic)
    return null;
  }
}

// --- PWA Install Logic ---
export function setupPwaInstallHandlers() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('`beforeinstallprompt` event fired.');
      if (installButton) {
        installButton.style.display = 'block';
      } else {
        console.warn('Install button not found.');
      }
    });

    if (installButton) {
      installButton.addEventListener('click', async () => {
        installButton.style.display = 'none';
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
        } else {
          console.log('No deferred prompt available to show.');
        }
      });
    } else {
      console.warn('Install button not found, cannot add click listener.');
    }

    window.addEventListener('appinstalled', () => {
       if (installButton) {
        installButton.style.display = 'none';
       }
      deferredPrompt = null;
      console.log('PWA was installed');
    });
}

// --- Web Audio API Setup ---
export function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGainNode = audioContext.createGain();
            musicGainNode = audioContext.createGain();
            sfxGainNode = audioContext.createGain();

            musicGainNode.gain.value = parseFloat(musicVolumeSlider.value);
            sfxGainNode.gain.value = parseFloat(sfxVolumeSlider.value);

            musicGainNode.connect(masterGainNode);
            sfxGainNode.connect(masterGainNode);
            masterGainNode.connect(audioContext.destination);

            console.log("AudioContext initialized successfully.");
            loadAllSounds(); // Start loading sounds
            audioInitialized = true; // Mark as initialized
        } catch (e) {
            console.error("Web Audio API is not supported in this browser", e);
            if (muteMusicButton) muteMusicButton.disabled = true;
            if (muteSfxButton) muteSfxButton.disabled = true;
            audioInitialized = false;
        }
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

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
        return null;
    }
}

async function loadAllSounds() {
    if (!audioContext) return;
    console.log("Loading all sounds...");
    [musicBuffer, launchBuffer, explosionBuffer] = await Promise.all([
        loadSound(Config.audioFilePaths.music),
        loadSound(Config.audioFilePaths.launch),
        loadSound(Config.audioFilePaths.explosion)
    ]);
    console.log("Sound loading process finished.");
    // Music playback is handled by main.js based on game state
}

// Function to play a sound effect (accepts gameState for context if needed later)
export function playSfx(gameState, soundType) {
    if (!audioContext || isSfxMuted) return;
    let bufferToPlay = null;
    switch (soundType) {
        case 'launch': bufferToPlay = launchBuffer; break;
        // Add other SFX types here if needed
        default: console.warn(`Unknown SFX type: ${soundType}`); return;
    }

    if (!bufferToPlay) {
        console.warn(`SFX buffer not loaded for type: ${soundType}`);
        return;
    }

    if (audioContext.state === 'suspended') {
         audioContext.resume();
    }
    const source = audioContext.createBufferSource();
    source.buffer = bufferToPlay;
    source.connect(sfxGainNode);
    source.start(0);
}

// Specific function for explosion sound to avoid string lookups in critical path
export function playExplosionSound(gameState) {
    if (!audioContext || !explosionBuffer || isSfxMuted) return;
    if (audioContext.state === 'suspended') {
         audioContext.resume();
    }
    const source = audioContext.createBufferSource();
    source.buffer = explosionBuffer;
    source.connect(sfxGainNode);
    source.start(0);
}


export function playMusic() {
    if (!audioContext || !musicBuffer || musicSourceNode || isMusicMuted) return;
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

export function stopMusic() {
    if (musicSourceNode) {
        musicSourceNode.stop(0);
        musicSourceNode.disconnect();
        musicSourceNode = null;
        console.log("Music stopped.");
    }
}

export function toggleMusicMute() {
    if (!audioContext) return;
    isMusicMuted = !isMusicMuted;
    if (isMusicMuted) {
        musicGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        muteMusicButton.textContent = 'Unmute Music';
        musicVolumeSlider.disabled = true;
        stopMusic();
    } else {
        musicGainNode.gain.setValueAtTime(parseFloat(musicVolumeSlider.value), audioContext.currentTime);
        muteMusicButton.textContent = 'Mute Music';
        musicVolumeSlider.disabled = false;
        // Music restart logic should be handled by main.js based on game state
    }
    console.log("Music Muted:", isMusicMuted);
    return isMusicMuted; // Return state for main.js if needed
}

export function toggleSfxMute() {
    if (!audioContext) return;
    isSfxMuted = !isSfxMuted;
    if (isSfxMuted) {
        sfxGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        muteSfxButton.textContent = 'Unmute SFX';
        sfxVolumeSlider.disabled = true;
    } else {
        sfxGainNode.gain.setValueAtTime(parseFloat(sfxVolumeSlider.value), audioContext.currentTime);
        muteSfxButton.textContent = 'Mute SFX';
        sfxVolumeSlider.disabled = false;
    }
    console.log("SFX Muted:", isSfxMuted);
}

export function handleMusicVolumeChange(event) {
    if (!audioContext || isMusicMuted) return;
    const volume = parseFloat(event.target.value);
    musicGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    console.log("Music Volume:", volume);
}

export function handleSfxVolumeChange(event) {
    if (!audioContext || isSfxMuted) return;
    const volume = parseFloat(event.target.value);
    sfxGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    console.log("SFX Volume:", volume);
}

// --- UI Update Functions ---
export function updateUI(gameState) {
    const { score, gameTotalScore, currentWave, cities, scoreMultiplier, bonusMissileCount, highScore } = gameState;
    scoreDisplay.textContent = `CURRENT SCORE: $${score}`;
    highScoreDisplay.textContent = `TOTAL: $${gameTotalScore}`; // Changed to display gameTotalScore
    waveDisplay.textContent = `WAVE: ${currentWave + 1}`;
    const livingCities = cities.filter(c => c.alive).length;
    citiesLeftDisplay.textContent = `CITIES: ${livingCities}`;
    multiplierDisplay.textContent = `MULT: ${scoreMultiplier.toFixed(1)}x`;
    bonusIndicator.style.display = bonusMissileCount > 0 ? 'inline-block' : 'none';
    if (bonusMissileCount > 0) { bonusIndicator.textContent = `BONUS FIRE +${bonusMissileCount}!`; }
    // Update start menu high score as well if needed (though typically done on load/restart)
    startHighScoreDisplay.textContent = `High Score: $${highScore}`;
}

export function updateSpecialWeaponsUI(gameState) {
    const { inventorySonicWave, inventoryBomb, isBombArmed, gameHasStarted, isGameOver, isPaused, transitioningWave, activeSonicWave } = gameState;
    sonicWaveCountDisplay.textContent = inventorySonicWave;
    bombCountDisplay.textContent = inventoryBomb;
    const canUseSpecials = gameHasStarted && !isGameOver && !isPaused && !transitioningWave;
    sonicWaveControl.classList.toggle('disabled', inventorySonicWave <= 0 || !canUseSpecials || activeSonicWave);
    bombControl.classList.toggle('disabled', inventoryBomb <= 0 || !canUseSpecials);
    bombControl.classList.toggle('armed', isBombArmed);
    if (canUseSpecials) {
        canvas.style.cursor = isBombArmed ? 'cell' : 'crosshair';
    } else {
        canvas.style.cursor = 'default';
    }
}

// --- Message Display ---
export function showMessage(gameState, title, textHTML, subtextHTML = "", bonusAlert = "") {
    messageTitle.textContent = title;
    messageText.innerHTML = textHTML;
    messageSubText.style.display = subtextHTML ? 'block' : 'none';
    messageSubText.innerHTML = subtextHTML;
    messageBonusText.textContent = bonusAlert;
    messageBonusText.style.display = bonusAlert ? 'block' : 'none';
    goToStoreButton.style.display = 'none';
    skipStoreButton.style.display = 'none';
    statsContainer.style.display = 'none';
    messageBox.style.display = 'block';
}
export function hideMessage() {
    messageBox.style.display = 'none';
}

// --- Store Logic ---
export function updateStoreUI(gameState) {
    const { score, storeStockSatellite, storeStockBase, storeStockCity, storeStockShield, storeStockSatShield, storeStockSonicWave, storeStockBomb, playerMissileSpeedLevel, explosionRadiusLevel, satelliteBases, bases, cities, baseShields } = gameState;

    storeScoreDisplay.textContent = `Current Score: $${score}`;
    stockSatelliteDisplay.textContent = `Stock: ${storeStockSatellite}`;
    stockBaseDisplay.textContent = `Stock: ${storeStockBase}`;
    stockCityDisplay.textContent = `Stock: ${storeStockCity}`;
    stockShieldDisplay.textContent = `Stock: ${storeStockShield}`;
    stockSatShieldDisplay.textContent = `Stock: ${storeStockSatShield}`;
    stockSonicWaveDisplay.textContent = `Stock: ${storeStockSonicWave}`;
    stockBombDisplay.textContent = `Stock: ${storeStockBomb}`;

    // Get cost display elements
    const costSonicWaveDisplay = document.getElementById('costSonicWaveDisplay');
    const costBombDisplay = document.getElementById('costBombDisplay');
    const costSatelliteDisplay = document.getElementById('costSatelliteDisplay');
    const costSatShieldDisplay = document.getElementById('costSatShieldDisplay');
    const costBaseDisplay = document.getElementById('costBaseDisplay');
    const costCityDisplay = document.getElementById('costCityDisplay');
    const costShieldDisplay = document.getElementById('costShieldDisplay');

    // Update text content using the cost constants
    if (costSonicWaveDisplay) costSonicWaveDisplay.textContent = `Cost: $${Config.COST_SONIC_WAVE}`;
    if (costBombDisplay) costBombDisplay.textContent = `Cost: $${Config.COST_BOMB}`;
    if (costSatelliteDisplay) costSatelliteDisplay.textContent = `Cost: $${Config.COST_SATELLITE}`;
    if (costSatShieldDisplay) costSatShieldDisplay.textContent = `Cost: $${Config.COST_SAT_SHIELD}`;
    if (costBaseDisplay) costBaseDisplay.textContent = `Cost: $${Config.COST_BASE}`;
    if (costCityDisplay) costCityDisplay.textContent = `Cost: $${Config.COST_CITY}`;
    if (costShieldDisplay) costShieldDisplay.textContent = `Cost: $${Config.COST_SHIELD}`;

    // Update upgrade costs
    const costFasterMissile = Config.calculateUpgradeCost(Config.COST_FASTER_MISSILE_BASE, playerMissileSpeedLevel);
    costFasterMissileDisplay.textContent = `Cost: $${costFasterMissile}`;
    levelFasterMissileDisplay.textContent = `Level: ${playerMissileSpeedLevel}/${Config.MAX_UPGRADE_LEVEL}`;
    buyFasterMissileButton.disabled = !(score >= costFasterMissile && playerMissileSpeedLevel < Config.MAX_UPGRADE_LEVEL);
    if (playerMissileSpeedLevel >= Config.MAX_UPGRADE_LEVEL) { costFasterMissileDisplay.textContent = "MAX LEVEL"; buyFasterMissileButton.disabled = true; }

    const costWiderExplosion = Config.calculateUpgradeCost(Config.COST_WIDER_EXPLOSION_BASE, explosionRadiusLevel);
    costWiderExplosionDisplay.textContent = `Cost: $${costWiderExplosion}`;
    levelWiderExplosionDisplay.textContent = `Level: ${explosionRadiusLevel}/${Config.MAX_UPGRADE_LEVEL}`;
    buyWiderExplosionButton.disabled = !(score >= costWiderExplosion && explosionRadiusLevel < Config.MAX_UPGRADE_LEVEL);
    if (explosionRadiusLevel >= Config.MAX_UPGRADE_LEVEL) { costWiderExplosionDisplay.textContent = "MAX LEVEL"; buyWiderExplosionButton.disabled = true; }

    // --- Rest of the button disabling logic ---
    const canAffordSatellite = score >= Config.COST_SATELLITE;
    const satelliteInStock = storeStockSatellite > 0;
    const activeSatellites = satelliteBases.filter(s => s.alive).length;
    const canPlaceSatellite = activeSatellites < Config.MAX_ACTIVE_SATELLITES;
    buySatelliteButton.disabled = !(canAffordSatellite && satelliteInStock && canPlaceSatellite);

    const canAffordBase = score >= Config.COST_BASE;
    const baseInStock = storeStockBase > 0;
    const canRebuildBase = bases.some(b => !b.alive);
    buyBaseButton.disabled = !(canAffordBase && baseInStock && canRebuildBase);

    const canAffordCity = score >= Config.COST_CITY;
    const cityInStock = storeStockCity > 0;
    const canRebuildCity = cities.some(c => !c.alive);
    buyCityButton.disabled = !(canAffordCity && cityInStock && canRebuildCity);

    const canAffordShield = score >= Config.COST_SHIELD;
    const shieldInStock = storeStockShield > 0;
    const canPlaceShield = baseShields.some((shield, index) => bases[index].alive && (!shield || !shield.alive));
    buyShieldButton.disabled = !(canAffordShield && shieldInStock && canPlaceShield);

    const canAffordSatShield = score >= Config.COST_SAT_SHIELD;
    const satShieldInStock = storeStockSatShield > 0;
    const canPlaceSatShield = satelliteBases.some(s => s.alive && (!s.shield || !s.shield.alive));
    buySatShieldButton.disabled = !(canAffordSatShield && satShieldInStock && canPlaceSatShield);

    const canAffordSonic = score >= Config.COST_SONIC_WAVE;
    const sonicInStock = storeStockSonicWave > 0;
    buySonicWaveButton.disabled = !(canAffordSonic && sonicInStock);
    const canAffordSonic10 = score >= Config.COST_SONIC_WAVE * 10;
    const sonicInStock10 = storeStockSonicWave >= 10;
    buySonicWave10Button.disabled = !(canAffordSonic10 && sonicInStock10);

    const canAffordBomb = score >= Config.COST_BOMB;
    const bombInStock = storeStockBomb > 0;
    buyBombButton.disabled = !(canAffordBomb && bombInStock);
    const canAffordBomb10 = score >= Config.COST_BOMB * 10;
    const bombInStock10 = storeStockBomb >= 10;
    buyBomb10Button.disabled = !(canAffordBomb10 && bombInStock10);
}

function findAndRebuildBase(gameState) {
    const deadBaseIndex = gameState.bases.findIndex(b => !b.alive);
    if (deadBaseIndex !== -1) {
        gameState.bases[deadBaseIndex].alive = true;
        gameState.bases[deadBaseIndex].ammo = gameState.selectedDifficultyAmmo;
        return true;
    }
    return false;
}
function findAndRebuildCity(gameState) {
    const deadCityIndex = gameState.cities.findIndex(c => !c.alive);
    if (deadCityIndex !== -1) {
        gameState.cities[deadCityIndex].alive = true;
        return true;
    }
    return false;
}

export function buyReplacementBase(gameState) {
    if (gameState.score >= Config.COST_BASE && gameState.storeStockBase > 0) {
        if (findAndRebuildBase(gameState)) {
            gameState.score -= Config.COST_BASE;
            gameState.storeStockBase--;
            gameState.storeActions.push({ action: "buy", item: "base", cost: Config.COST_BASE, timestamp: Date.now() });
            updateStoreUI(gameState);
            updateUI(gameState);
        }
    }
}
export function buyReplacementCity(gameState) {
    if (gameState.score >= Config.COST_CITY && gameState.storeStockCity > 0) {
        if (findAndRebuildCity(gameState)) {
            gameState.score -= Config.COST_CITY;
            gameState.storeStockCity--;
            gameState.storeActions.push({ action: "buy", item: "city", cost: Config.COST_CITY, timestamp: Date.now() });
            updateStoreUI(gameState);
            updateUI(gameState);
        }
    }
}
export function buySatellite(gameState) {
    const activeSatellitesCount = gameState.satelliteBases.filter(s => s.alive).length;
    if (gameState.score >= Config.COST_SATELLITE && gameState.storeStockSatellite > 0 && activeSatellitesCount < Config.MAX_ACTIVE_SATELLITES) {
        let placed = false;
        const basePositionsRatios = [0.15, 0.5, 0.85];
        for (let i = 0; i < 3; i++) {
            const targetX = basePositionsRatios[i] * gameState.canvas.width;
            const satelliteX = targetX - (gameState.canvas.width * Config.SATELLITE_WIDTH_RATIO / 2);
            const positionOccupied = gameState.satelliteBases.some(s => s.alive && Math.abs(s.x - satelliteX) < 1);
            if (!positionOccupied) {
                gameState.score -= Config.COST_SATELLITE;
                gameState.storeStockSatellite--;
                const newSatellite = GameLogic.createSatelliteBase(gameState, basePositionsRatios[i], Config.SATELLITE_Y_POS_RATIO); // Needs createSatelliteBase from gameLogic
                gameState.satelliteBases.push(newSatellite);
                placed = true;
                gameState.storeActions.push({ action: "buy", item: "satellite", cost: Config.COST_SATELLITE, timestamp: Date.now() });
                break;
            }
        }
        if(placed) { updateStoreUI(gameState); updateUI(gameState); }
    }
}
export function buyShield(gameState) {
    if (gameState.score >= Config.COST_SHIELD && gameState.storeStockShield > 0) {
        let shieldPlaced = false;
        for (let i = 0; i < gameState.bases.length; i++) {
            if (gameState.bases[i].alive && (!gameState.baseShields[i] || !gameState.baseShields[i].alive)) {
                gameState.score -= Config.COST_SHIELD;
                gameState.storeStockShield--;
                gameState.baseShields[i] = { alive: true, strength: Config.SHIELD_STRENGTH_START, flashTimer: 0 };
                shieldPlaced = true;
                gameState.storeActions.push({ action: "buy", item: "baseShield", cost: Config.COST_SHIELD, timestamp: Date.now() });
                break;
            }
        }
        if(shieldPlaced) { updateStoreUI(gameState); updateUI(gameState); }
    }
}
export function buySatShield(gameState) {
    if (gameState.score >= Config.COST_SAT_SHIELD && gameState.storeStockSatShield > 0) {
        let shieldPlaced = false;
        for (let i = 0; i < gameState.satelliteBases.length; i++) {
            const sat = gameState.satelliteBases[i];
            if (sat.alive && (!sat.shield || !sat.shield.alive)) {
                gameState.score -= Config.COST_SAT_SHIELD;
                gameState.storeStockSatShield--;
                sat.shield = { alive: true, strength: Config.SHIELD_STRENGTH_START, flashTimer: 0 };
                shieldPlaced = true;
                gameState.storeActions.push({ action: "buy", item: "satelliteShield", cost: Config.COST_SAT_SHIELD, timestamp: Date.now() });
                break;
            }
        }
        if(shieldPlaced) { updateStoreUI(gameState); updateUI(gameState); }
    }
}
export function buySonicWave(gameState) {
    if (gameState.score >= Config.COST_SONIC_WAVE && gameState.storeStockSonicWave > 0) {
        gameState.score -= Config.COST_SONIC_WAVE;
        gameState.storeStockSonicWave--;
        gameState.inventorySonicWave++;
        gameState.storeActions.push({ action: "buy", item: "sonicWave", cost: Config.COST_SONIC_WAVE, timestamp: Date.now() });
        updateStoreUI(gameState);
        updateSpecialWeaponsUI(gameState);
    }
}
export function buyBomb(gameState) {
    if (gameState.score >= Config.COST_BOMB && gameState.storeStockBomb > 0) {
        gameState.score -= Config.COST_BOMB;
        gameState.storeStockBomb--;
        gameState.inventoryBomb++;
        gameState.storeActions.push({ action: "buy", item: "bomb", cost: Config.COST_BOMB, timestamp: Date.now() });
        updateStoreUI(gameState);
        updateSpecialWeaponsUI(gameState);
    }
}
export function buyFasterMissile(gameState) {
    if (gameState.playerMissileSpeedLevel < Config.MAX_UPGRADE_LEVEL) {
        const cost = Config.calculateUpgradeCost(Config.COST_FASTER_MISSILE_BASE, gameState.playerMissileSpeedLevel);
        if (gameState.score >= cost) {
            gameState.score -= cost;
            gameState.playerMissileSpeedLevel++;
            gameState.storeActions.push({ action: "upgrade", item: "missileSpeed", level: gameState.playerMissileSpeedLevel, cost: cost, timestamp: Date.now() });
            updateStoreUI(gameState);
        }
    }
}
export function buyWiderExplosion(gameState) {
    if (gameState.explosionRadiusLevel < Config.MAX_UPGRADE_LEVEL) {
        const cost = Config.calculateUpgradeCost(Config.COST_WIDER_EXPLOSION_BASE, gameState.explosionRadiusLevel);
        if (gameState.score >= cost) {
            gameState.score -= cost;
            gameState.explosionRadiusLevel++;
            gameState.storeActions.push({ action: "upgrade", item: "explosionRadius", level: gameState.explosionRadiusLevel, cost: cost, timestamp: Date.now() });
            updateStoreUI(gameState);
        }
    }
}
export function buySonicWave10(gameState) {
    const cost10 = Config.COST_SONIC_WAVE * 10;
    if (gameState.score >= cost10 && gameState.storeStockSonicWave >= 10) {
        gameState.score -= cost10;
        gameState.storeStockSonicWave -= 10;
        gameState.inventorySonicWave += 10;
        gameState.storeActions.push({ action: "buy", item: "sonicWave", quantity: 10, cost: cost10, timestamp: Date.now() });
        updateStoreUI(gameState);
        updateSpecialWeaponsUI(gameState);
    }
}
export function buyBomb10(gameState) {
    const cost10 = Config.COST_BOMB * 10;
    if (gameState.score >= cost10 && gameState.storeStockBomb >= 10) {
        gameState.score -= cost10;
        gameState.storeStockBomb -= 10;
        gameState.inventoryBomb += 10;
        gameState.storeActions.push({ action: "buy", item: "bomb", quantity: 10, cost: cost10, timestamp: Date.now() });
        updateStoreUI(gameState);
        updateSpecialWeaponsUI(gameState);
    }
}

// --- Special Weapon Logic ---
export function triggerSonicWave(gameState) {
    if (gameState.inventorySonicWave > 0 && !gameState.activeSonicWave && !sonicWaveControl.classList.contains('disabled')) {
        gameState.inventorySonicWave--;
        gameState.activeSonicWave = { y: gameState.canvas.height - (gameState.canvas.height * Config.GROUND_HEIGHT_RATIO), alive: true };
        recordGameClick(gameState, -1, -1, 'sonicWave'); // Pass gameState
        updateSpecialWeaponsUI(gameState);
    }
}
export function armBomb(gameState) {
    if (gameState.inventoryBomb > 0 && !bombControl.classList.contains('disabled')) {
        gameState.isBombArmed = !gameState.isBombArmed;
        updateSpecialWeaponsUI(gameState);
    }
}
export function deployBomb(gameState, clickX, clickY) {
    if (gameState.isBombArmed) {
        gameState.inventoryBomb--;
        gameState.isBombArmed = false;
        const bombRadius = Config.getCurrentPlayerExplosionRadius(gameState) * Config.BOMB_EXPLOSION_RADIUS_MULTIPLIER;
        const bombDuration = Config.EXPLOSION_DURATION * Config.BOMB_EXPLOSION_DURATION_MULTIPLIER;
        GameLogic.createExplosion(gameState, clickX, clickY, Config.EXPLOSION_RADIUS_START, '#ffffff', bombRadius, bombDuration); // Pass gameState // Use GameLogic namespace
        updateSpecialWeaponsUI(gameState);
    }
}

// --- Input Handling ---
export function getCanvasCoordinates(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if (event.type.startsWith('touch')) {
        event.preventDefault();
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

export function handleCanvasInput(gameState, event) {
    const { isGameOver, isPaused, transitioningWave, gameHasStarted, canvas, bases, satelliteBases, playerMissiles, isBombArmed, bonusMissileCount } = gameState;
    if (isGameOver || isPaused || transitioningWave || !gameHasStarted) return;

    if (!audioInitialized) {
        initAudioContext();
    }

    const coords = getCanvasCoordinates(canvas, event);
    const clickX = coords.x;
    const clickY = coords.y;
    const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);

    recordGameClick(gameState, clickX, clickY, isBombArmed ? 'bomb' : 'missile'); // Pass gameState

    if (clickY < 20 || clickY > groundY) return;
    if (isBombArmed) { deployBomb(gameState, clickX, clickY); return; } // Pass gameState

    let nearestSource = null;
    let minDistance = Infinity;
    const potentialSources = [
        ...bases.filter(b => b.alive && b.ammo > 0),
        ...satelliteBases.filter(s => s.alive && s.ammo > 0)
    ];

    potentialSources.forEach(source => {
        const sourceCenterX = source.x + source.width / 2;
        const sourceTopY = source.isSatellite ? source.y + source.height : source.y;
        const d = Config.distance(clickX, clickY, sourceCenterX, sourceTopY);
        if (d < minDistance) {
            minDistance = d;
            nearestSource = source;
        }
    });

    if (nearestSource) {
        const startX = nearestSource.x + nearestSource.width / 2;
        const startY = nearestSource.isSatellite ? nearestSource.y + nearestSource.height : nearestSource.y;
        const totalMissilesToFire = 1 + bonusMissileCount;
        const actualMissilesToFire = Math.min(totalMissilesToFire, nearestSource.ammo);

        if (actualMissilesToFire > 0) {
            nearestSource.ammo -= actualMissilesToFire;
            for (let i = 0; i < actualMissilesToFire; i++) {
                const currentOffset = (actualMissilesToFire > 1) ?
                    (i - (actualMissilesToFire - 1) / 2) * Config.BONUS_FIRE_SPREAD : 0;
                playerMissiles.push(GameLogic.createPlayerMissile(gameState, // Pass gameState // Use GameLogic namespace
                    startX + currentOffset, startY, clickX, clickY
                ));
            }
            updateUI(gameState); // Pass gameState
        }
    }
}

export function handleKeyDown(gameState, event) {
    const { isGameOver, isPaused, transitioningWave, gameHasStarted, bases, satelliteBases, canvas } = gameState;
    if (isGameOver || isPaused || transitioningWave || !gameHasStarted) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '1', '2', '3', '4', '5', '6', 'f', 'q', 'w'].includes(event.key)) {
        event.preventDefault();
    }

    if (['1', '2', '3'].includes(event.key)) {
        const baseIndex = parseInt(event.key) - 1;
        if (bases[baseIndex] && bases[baseIndex].alive) {
            gameState.keyboardSelectedBaseIndex = baseIndex;
            gameState.keyboardTargetingActive = true;
            console.log(`Keyboard selected ground base: ${gameState.keyboardSelectedBaseIndex}`);
        }
    } else if (['4', '5', '6'].includes(event.key)) {
        const satIndex = parseInt(event.key) - 4;
        if (satelliteBases[satIndex] && satelliteBases[satIndex].alive) {
            gameState.keyboardSelectedBaseIndex = satIndex + 3; // 3, 4, or 5
            gameState.keyboardTargetingActive = true;
            console.log(`Keyboard selected satellite base: ${gameState.keyboardSelectedBaseIndex}`);
        }
    }

    const groundLevelY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);
    if (event.key === 'ArrowUp') {
        gameState.keyboardTargetingActive = true;
        gameState.reticleY -= Config.RETICLE_SPEED;
    } else if (event.key === 'ArrowDown') {
        gameState.keyboardTargetingActive = true;
        gameState.reticleY += Config.RETICLE_SPEED;
    } else if (event.key === 'ArrowLeft') {
        gameState.keyboardTargetingActive = true;
        gameState.reticleX -= Config.RETICLE_SPEED;
    } else if (event.key === 'ArrowRight') {
        gameState.keyboardTargetingActive = true;
        gameState.reticleX += Config.RETICLE_SPEED;
    }

    gameState.reticleX = Math.max(0, Math.min(canvas.width, gameState.reticleX));
    gameState.reticleY = Math.max(0, Math.min(groundLevelY, gameState.reticleY));

    // Firing (Task 4) - Needs implementation in main.js or here if state allows
    // Special Weapons (Task 6) - Needs implementation in main.js or here if state allows
}

export function recordGameClick(gameState, clickX, clickY, armedWeapon) {
    gameState.gameClickData.push({
        x: Math.round(clickX),
        y: Math.round(clickY),
        timestamp: Date.now(),
        armedWeapon: armedWeapon || 'missile',
        wave: gameState.currentWave
    });
}

// --- Screenshot Logic ---
export async function saveScreenshot(gameState) {
    console.log("Attempting to save screenshot...");
    const originalText = screenshotButton.textContent;
    screenshotButton.textContent = 'Saving...';
    screenshotButton.disabled = true;

    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(canvas, 0, 0);

        if (messageBox.style.display === 'block') {
            console.log("Message box is visible, manually drawing it on the screenshot");
            const boxWidth = canvas.width * 0.8;
            const boxHeight = canvas.height * 0.7;
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = (canvas.height - boxHeight) / 2;

            tempCtx.fillStyle = 'rgba(0, 0, 0, 1)';
            tempCtx.fillRect(0, 0, canvas.width, canvas.height);

            tempCtx.fillStyle = 'rgba(0, 0, 0, 1)';
            tempCtx.beginPath();
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

            tempCtx.strokeStyle = '#ff0000';
            tempCtx.lineWidth = 3;
            tempCtx.stroke();

            const title = messageTitle.textContent;
            const text = messageText.textContent;
            const subText = messageSubText.style.display !== 'none' ? messageSubText.textContent : '';
            const bonusText = messageBonusText.style.display !== 'none' ? messageBonusText.textContent : '';

            tempCtx.fillStyle = '#ff0000';
            tempCtx.font = '32px "Press Start 2P", monospace';
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'top';
            tempCtx.fillText(title, boxX + boxWidth/2, boxY + 50);

            tempCtx.fillStyle = '#ffff00';
            tempCtx.font = '16px "Press Start 2P", monospace';
            tempCtx.fillText(text, boxX + boxWidth/2, boxY + 100);

            if (subText) {
                tempCtx.fillText(subText, boxX + boxWidth/2, boxY + 130);
            }

            if (statsContainer.style.display !== 'none') {
                const statSpans = Array.from(statsContainer.querySelectorAll('span'));
                if (statSpans.length > 0) {
                    tempCtx.strokeStyle = '#ff0000';
                    tempCtx.lineWidth = 1;
                    tempCtx.beginPath();
                    tempCtx.moveTo(boxX + boxWidth * 0.05, boxY + 170);
                    tempCtx.lineTo(boxX + boxWidth * 0.95, boxY + 170);
                    tempCtx.stroke();

                    const leftColOrder = ["Wave Reached:", "Difficulty:", "Missiles Fired:", "Accuracy:", "Enemy Missiles Down:", "Final Score:", "High Score:"];
                    const rightColOrder = ["Accuracy Bonuses:", "Planes Down:", "Cities Lost:", "Bases Lost:", "Shield Bombs Down:", "Plane Bombs Down:"];
                    const leftCol = boxX + boxWidth * 0.05;
                    const rightCol = boxX + boxWidth * 0.62;
                    const topRow = boxY + 190;
                    const rowHeight = 20;
                    tempCtx.font = '10px "Press Start 2P", monospace';
                    tempCtx.textAlign = 'left';

                    leftColOrder.forEach((statPrefix, index) => {
                        const statSpan = statSpans.find(span => span.textContent.startsWith(statPrefix));
                        if (statSpan) { tempCtx.fillStyle = '#ffffff'; tempCtx.fillText(statSpan.textContent, leftCol, topRow + (index * rowHeight)); }
                    });
                    rightColOrder.forEach((statPrefix, index) => {
                        const statSpan = statSpans.find(span => span.textContent.startsWith(statPrefix));
                        if (statSpan) { tempCtx.fillStyle = statSpan.textContent.includes('HIGH SCORE') ? '#ffff00' : '#ffffff'; tempCtx.fillText(statSpan.textContent, rightCol, topRow + (index * rowHeight)); }
                    });

                    tempCtx.strokeStyle = '#ff0000';
                    tempCtx.lineWidth = 1;
                    tempCtx.beginPath();
                    const maxRows = Math.max(leftColOrder.length, rightColOrder.length);
                    const bottomLineY = topRow + (maxRows * rowHeight) + 20;
                    tempCtx.moveTo(boxX + boxWidth * 0.05, bottomLineY);
                    tempCtx.lineTo(boxX + boxWidth * 0.95, bottomLineY);
                    tempCtx.stroke();
                }
            }
        }

        tempCanvas.toBlob(async (blob) => {
            if (!blob) { throw new Error("Canvas toBlob failed."); }
            try {
                await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
                console.log("Screenshot copied to clipboard.");
                screenshotButton.textContent = 'Copied!';
            } catch (clipErr) {
                console.error("Clipboard API failed, falling back to download:", clipErr);
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
                setTimeout(() => { screenshotButton.textContent = "Save Screenshot"; screenshotButton.disabled = false; }, 1500);
            }
        }, 'image/png');

    } catch (err) {
        console.error("Screenshot failed:", err);
        screenshotButton.textContent = 'Error!';
        setTimeout(() => { screenshotButton.textContent = "Save Screenshot"; screenshotButton.disabled = false; }, 2000);
    }
}

// --- Leaderboard & Scoring ---
export async function fetchAndDisplayLeaderboard(limit = 10) {
    console.log(`Fetching leaderboard (limit: ${limit})...`);
    leaderboardLoading.textContent = "Loading...";
    leaderboardLoading.style.display = 'list-item';
    leaderboardList.innerHTML = '';
    leaderboardList.appendChild(leaderboardLoading);
    leaderboardContainer.style.display = 'block';
    leaderboardViewMoreContainer.style.display = 'none';

    try {
        let totalPlaytimeFormatted = 'Loading...';
        try {
            const statsResponse = await fetch('/stats/playtime');
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                totalPlaytimeFormatted = Config.formatDuration(statsData.totalDurationSeconds);
            } else {
                console.error(`Error fetching stats: ${statsResponse.status}`);
                totalPlaytimeFormatted = 'Error';
            }
        } catch (statsError) {
            console.error('Error fetching /stats/playtime:', statsError);
            totalPlaytimeFormatted = 'Error';
        }

        const response = await fetch(`/scores?limit=${limit}`);
        if (!response.ok) { throw new Error(`HTTP error fetching scores! status: ${response.status}`); }
        const scores = await response.json();
        console.log(`Leaderboard data received (limit ${limit}):`, scores);

        leaderboardLoading.style.display = 'none';
        leaderboardList.innerHTML = '';

        const statsLi = document.createElement('li');
        statsLi.className = 'leaderboard-stat';
        statsLi.style.cssText = 'text-align: center; margin-bottom: 10px; color: #aaaaff; border-bottom: 1px dashed #555588; padding-bottom: 8px;';
        statsLi.textContent = `Total Playtime: ${totalPlaytimeFormatted}`;
        leaderboardList.appendChild(statsLi);

        if (scores && scores.length > 0) {
            scores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.style.backgroundColor = index % 2 === 0 ? 'rgba(0, 50, 0, 0.3)' : 'transparent';
                li.style.padding = '3px 5px';
                const rankSpan = document.createElement('span'); rankSpan.className = 'rank'; rankSpan.textContent = `${index + 1}.`;
                const nameSpan = document.createElement('span'); nameSpan.className = 'name'; nameSpan.textContent = entry.name.replace(/</g, "<").replace(/>/g, ">");
                const waveSpan = document.createElement('span'); waveSpan.className = 'wave'; waveSpan.textContent = typeof entry.wave === 'number' ? `W: ${entry.wave}` : `W: -`;
                const scoreSpan = document.createElement('span'); scoreSpan.className = 'score'; scoreSpan.textContent = `$${entry.score}`;
                li.appendChild(rankSpan); li.appendChild(nameSpan); li.appendChild(waveSpan); li.appendChild(scoreSpan);
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => displayPlayerStats(entry)); // displayPlayerStats is defined below
                leaderboardList.appendChild(li);
            });
            if (limit === 10 && scores.length === 10) { leaderboardViewMoreContainer.style.display = 'block'; }
            else { leaderboardViewMoreContainer.style.display = 'none'; }
        } else {
            const li = document.createElement('li'); li.textContent = "No scores yet!"; leaderboardList.appendChild(li);
            leaderboardViewMoreContainer.style.display = 'none';
        }
    } catch (error) {
        console.error(`Error fetching leaderboard (limit ${limit}):`, error);
        leaderboardLoading.textContent = "Error loading scores.";
        leaderboardLoading.style.display = 'list-item';
        leaderboardViewMoreContainer.style.display = 'none';
    }
}

async function displayPlayerStats(playerData) {
    let statsModal = document.getElementById('playerStatsModal');
    if (!statsModal) {
        statsModal = document.createElement('div');
        statsModal.id = 'playerStatsModal';
        statsModal.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(0, 20, 0, 0.95); border: 3px solid #00ff00; border-radius: 15px; box-shadow: 0 0 25px #00ff00; padding: 15px; z-index: 25; color: #00ff00; font-size: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;`;
        document.body.appendChild(statsModal);
    }

    statsModal.innerHTML = `
        <h2 style="color: #ffff00; text-align: center; margin-bottom: 10px;">Player: ${playerData.name}</h2>
        <div style="text-align: center; margin-bottom: 15px; line-height: 1.5;">
            <p style="margin: 0; color: #ffffff; font-size: 14px;">Score: $${playerData.score}</p>
            <p style="margin: 0;">Wave: ${playerData.wave || '?'} | Difficulty: Loading...</p>
            <p style="margin: 0; font-size: 8px; color: #aaaaaa;">Loading details...</p>
            <p style="margin: 0; font-size: 8px; color: #aaaaaa;">Game Duration: Loading...</p>
        </div>
        <p id="statsLoadingMsg" style="text-align: center; color: #aaaaaa; margin-top: 20px;">Loading detailed stats...</p>
        <div id="detailedStatsContainer" style="display: none;"></div>
        <button id="closeStatsButton" style="display: block; margin: 20px auto 0;">Close</button>
    `;

    document.getElementById('closeStatsButton').addEventListener('click', () => { statsModal.style.display = 'none'; });
    statsModal.style.display = 'block';

    if (!playerData.gameId) {
        document.getElementById('statsLoadingMsg').textContent = 'Error: Missing gameId for detailed stats.';
        console.error("Missing gameId in playerData:", playerData);
        return;
    }

    try {
        if (window.enableDebugLogging) { console.log(`Fetching full stats for gameId: ${playerData.gameId}`); }
        const response = await fetch(`/game/${playerData.gameId}`);
        if (!response.ok) { const errorText = await response.text(); throw new Error(`HTTP error! status: ${response.status} - ${errorText}`); }
        const fullGameData = await response.json();
        if (window.enableDebugLogging) { console.log("Full game data received:", fullGameData); }

        updateModalSummary(statsModal, fullGameData); // Defined below

        const stats = fullGameData.stats;
        if (!stats) { document.getElementById('statsLoadingMsg').textContent = 'No detailed stats available for this player.'; return; }

        const accuracy = stats.accuracy !== undefined ? stats.accuracy : (stats.missilesFired > 0 ? ((stats.enemyMissilesDestroyed + stats.planeBombsDestroyed) / stats.missilesFired * 100).toFixed(1) : "N/A");
        const detailedStatsHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                <div style="border: 1px solid #005500; padding: 10px; border-radius: 8px;">
                    <h3 style="color: #ffff00; text-align: center; margin-top: 0;">Offensive Stats</h3>
                    <p>Missiles Fired: ${stats.missilesFired || 0}</p> <p>Accuracy: ${accuracy}%</p> <p>Accuracy Bonuses: ${stats.accuracyBonusHits || 0}</p>
                    <p>Missile Speed Level: ${stats.missileSpeedLevel || 0}/15</p> <p>Explosion Radius Level: ${stats.explosionRadiusLevel || 0}/15</p>
                </div>
                <div style="border: 1px solid #005500; padding: 10px; border-radius: 8px;">
                    <h3 style="color: #ffff00; text-align: center; margin-top: 0;">Defensive Stats</h3>
                    <p>Cities Lost: ${stats.citiesLost || 0}</p> <p>Bases Lost: ${stats.basesLost || 0}</p>
                </div>
                <div style="border: 1px solid #005500; padding: 10px; border-radius: 8px; grid-column: 1 / -1;">
                    <h3 style="color: #ffff00; text-align: center; margin-top: 0;">Enemy Kills</h3>
                    <p style="margin: 0;">Enemy Missiles: ${stats.enemyMissilesDestroyed || 0} | Shield Bombs: ${stats.shieldBombsDestroyed || 0}</p>
                    <p style="margin: 0;">Plane Bombs: ${stats.planeBombsDestroyed || 0} | Planes: ${stats.planesDestroyed || 0}</p>
                </div>
            </div>`;
        document.getElementById('detailedStatsContainer').innerHTML = detailedStatsHTML;
        document.getElementById('detailedStatsContainer').style.display = 'block';
        document.getElementById('statsLoadingMsg').style.display = 'none';
    } catch (error) {
        console.error(`Error fetching detailed stats for gameId ${playerData.gameId}:`, error);
        document.getElementById('statsLoadingMsg').textContent = `Error loading detailed stats: ${error.message}`;
        document.getElementById('statsLoadingMsg').style.color = '#ff0000';
    }
}

function updateModalSummary(modalElement, data) {
    const summaryDiv = modalElement.querySelector('div');
    if (!summaryDiv) return;
    let formattedDate = 'Date Unknown';
    if (data.submittedAt) {
        try {
            const date = new Date(data.submittedAt);
            formattedDate = date.toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }).replace(' GMT', ' UTC');
        } catch (e) { console.error("Error formatting date:", e); formattedDate = 'Invalid Date'; }
    }
    let formattedDuration = 'N/A';
    if (data.stats && typeof data.stats.duration === 'number' && data.stats.duration >= 0) {
        const totalSeconds = data.stats.duration;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.round(totalSeconds % 60);
        formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    const paragraphs = summaryDiv.querySelectorAll('p');
    if (paragraphs.length >= 4) {
        paragraphs[0].innerHTML = `<p style="margin: 0; color: #ffffff; font-size: 14px;">Score: $${data.score}</p>`;
        paragraphs[1].innerHTML = `<p style="margin: 0;">Wave: ${data.wave || '?'} | Difficulty: ${data.stats?.difficulty || 'Unknown'}</p>`;
        paragraphs[2].innerHTML = `<p style="margin: 0; font-size: 8px; color: #aaaaaa;">${formattedDate}</p>`;
        paragraphs[3].innerHTML = `<p style="margin: 0; font-size: 8px; color: #aaaaaa;">Game Duration: ${formattedDuration}</p>`;
    }
}

async function submitScoreData(scoreData) {
    const name = scoreData.name;
    const finalScore = scoreData.score;
    const waveReached = scoreData.wave;

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
        if (sessionToken) { scoreData.sessionToken = sessionToken; } // Use internal sessionToken

        const response = await fetch('/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scoreData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Check for specific 400 Bad Request (likely validation error)
            if (response.status === 400) {
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson && errorJson.error) {
                        // Throw a specific error type for validation failures, without exposing the detail
                        throw new Error('Validation Error: 400');
                    }
                } catch (parseError) {
                    // Ignore parsing error, fall through to generic error
                    console.warn("Could not parse 400 error response body as JSON:", parseError);
                }
            }
            // Handle 403 specifically for token issues
            if (response.status === 403 && errorText.includes('Invalid or expired session token')) {
                localStorage.removeItem('storedScores');
                console.warn('Cleared local stored scores due to invalid/expired session token.');
            }
            // Throw generic error for other non-ok statuses or unparsed 400s
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        if (window.enableDebugLogging) { console.log("Submission response:", result); }
        else { console.log("Score submission processed."); }
        return { success: true };
    } catch (error) {
        console.error('Error submitting score data:', error);
        // Check for specific validation error first
        if (error && error.message === 'Validation Error: 400') {
            return { success: false, error: "Invalid Data", validationError: true };
        }
        // Check if the error is likely a 403
        if (error && error.message && error.message.includes('status: 403')) {
            return { success: false, error: "Submission Blocked by Security", blocked: true };
        }
        // Fallback for other errors
        return { success: false, error: error.message };
    }
}

export async function submitHighScore(gameState) {
    const name = playerNameInput.value.trim().toUpperCase();
    const finalScore = gameState.gameTotalScore;
    const waveReached = gameState.currentWave + 1;

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

    const gameStats = {
        missilesFired: gameState.statsMissilesFired,
        enemyMissilesDestroyed: gameState.statsEnemyMissilesDestroyed,
        planeBombsDestroyed: gameState.statsPlaneBombsDestroyed,
        planesDestroyed: gameState.statsPlanesDestroyed,
        citiesLost: gameState.statsCitiesLost,
        basesLost: gameState.statsBasesLost,
        accuracyBonusHits: gameState.statsAccuracyBonusHits,
        shieldBombsDestroyed: gameState.statsShieldBombsDestroyed,
        difficulty: gameState.selectedDifficultyName,
        missileSpeedLevel: gameState.playerMissileSpeedLevel,
        explosionRadiusLevel: gameState.explosionRadiusLevel,
        accuracy: parseFloat(gameState.statsMissilesFired > 0 ? ((gameState.statsEnemyMissilesDestroyed + gameState.statsPlaneBombsDestroyed) / gameState.statsMissilesFired * 100).toFixed(1) : "0.0"),
        duration: Math.round(gameState.totalGameDurationSeconds),
        gameStartTime: gameState.gameStartTimestamp,
        waveStats: gameState.waveStats.map(stat => stat ? stat.spawnToCompletionMs : null)
    };

    submitScoreButton.disabled = true;
    submissionStatus.textContent = "Submitting...";
    submissionStatus.style.color = "#00ff00";

    const scoreDataToSubmit = {
        name: name, score: finalScore, wave: waveReached, stats: gameStats, nonce: crypto.randomUUID()
    };

    try {
        if (sessionToken) { scoreDataToSubmit.sessionToken = sessionToken; } // Use internal sessionToken
        const secretKey = await getGameSecret(); // Defined below
        if (window.enableDebugLogging) { console.log("Secret key fetch result:", secretKey ? "Success" : "Failed"); }
        if (secretKey) {
            const signature = await generateScoreSignature(scoreDataToSubmit, secretKey); // Defined below
            if (window.enableDebugLogging) { console.log("Generated signature:", signature.substring(0, 10) + "..."); }
            else { console.log("Score signature generated"); }
            scoreDataToSubmit.signature = signature;
        } else { console.warn("Could not get secret key for signature"); }
    } catch (e) {
        if (window.enableDebugLogging) { console.error("Failed to generate signature:", e); }
        else { console.error("Failed to generate score signature"); }
    }

    if (window.enableDebugLogging) { console.log("Submitting score data (Debug):", JSON.stringify(scoreDataToSubmit)); }
    else { console.log("Submitting score data (Non-Debug)..."); }

    const result = await submitScoreData(scoreDataToSubmit);

    if (result.success) {
        submissionStatus.textContent = "Score Submitted!";
        submissionStatus.style.color = "#00ff00";
        scoreSubmitted = true; // Use internal state variable
        submittedPlayerNameThisSession = name; // Use internal state variable
        localStorage.setItem('missileCommandPlayerName', name);
        gameState.gameStartTimestamp = 0; // Reset timestamp in main gameState
    } else {
        if (result.blocked) {
            // Specific handling for blocks
            submissionStatus.textContent = "Submission Blocked by Security. Please try again later.";
            submissionStatus.style.color = "#ffaa00"; // Orange/Yellow for blocked
            submitScoreButton.disabled = false; // Allow retry, maybe the block is temporary
            console.warn("Score submission blocked by security.");
        } else if (result.validationError) {
             // Specific handling for validation errors (400)
            submissionStatus.textContent = "Submission Failed: Invalid data.";
            submissionStatus.style.color = "#ff0000"; // Red for invalid data
            submitScoreButton.disabled = false; // Allow retry after fixing potential issues (though unlikely client-fixable here)
            console.warn("Score submission failed due to invalid data (400).");
        } else if (navigator.onLine) {
            // Existing online failure handling for other errors
            submissionStatus.textContent = `Submission Failed: ${result.error || 'Unknown error'}`;
            submissionStatus.style.color = "#ff0000";
            submitScoreButton.disabled = false;
            try {
                const storedScores = JSON.parse(localStorage.getItem('storedScores') || '[]');
                scoreDataToSubmit.timestamp = Date.now();
                storedScores.push(scoreDataToSubmit);
                localStorage.setItem('storedScores', JSON.stringify(storedScores));
                console.log(`Failed score submission stored locally for later retry.`);
            } catch (e) { console.error("Error storing failed submission:", e); }
        } else {
            submissionStatus.textContent = "Offline. Score saved locally.";
            submissionStatus.style.color = "#ffff00";
            try {
                const storedScores = JSON.parse(localStorage.getItem('storedScores') || '[]');
                scoreDataToSubmit.timestamp = Date.now();
                storedScores.push(scoreDataToSubmit);
                localStorage.setItem('storedScores', JSON.stringify(storedScores));
                console.log(`Score stored locally due to going offline.`);
            } catch (e) { console.error("Error storing offline submission:", e); }
        }
    }
}

export async function syncStoredScores(gameState) { // Pass gameState to reset timestamp if needed
    const storedScoresString = localStorage.getItem('storedScores');
    if (!storedScoresString) { console.log("No scores stored locally to sync."); return { synced: 0, failed: 0 }; }
    let storedScores = [];
    try {
        storedScores = JSON.parse(storedScoresString);
        if (!Array.isArray(storedScores)) { console.warn("Stored scores data is not an array, resetting."); storedScores = []; }
    } catch (e) { console.error("Error parsing stored scores, resetting:", e); localStorage.removeItem('storedScores'); return { synced: 0, failed: 0 }; }
    if (storedScores.length === 0) { console.log("No scores stored locally to sync after parsing."); localStorage.removeItem('storedScores'); return { synced: 0, failed: 0 }; }

    let syncedCount = 0;
    let failedCount = 0;
    const remainingScores = [];
    const secretKey = await getGameSecret();
    const defaultName = (playerNameInput.value.trim().toUpperCase() || 'ACE');

    for (const scoreData of storedScores) {
        if (typeof scoreData !== 'object' || scoreData === null) { console.warn("Skipping invalid score data entry:", scoreData); failedCount++; continue; }
        if (!scoreData.name || scoreData.name === 'TEMP_OFFLINE') {
            scoreData.name = defaultName;
            if (scoreData.name === 'ACE') { console.warn(`Submitting offline score for ${scoreData.score} with default name 'ACE'.`); }
        }
        if (secretKey) {
            try {
                if (scoreData.name && scoreData.score && scoreData.wave) { scoreData.signature = await generateScoreSignature(scoreData, secretKey); }
                else { console.warn("Skipping signature generation due to missing score data fields:", scoreData); }
            } catch (e) { console.error("Failed to generate signature for stored score:", e); }
        }
        console.log(`Syncing score: Name=${scoreData.name}, Score=${scoreData.score}`);
        const result = await submitScoreData(scoreData);

        if (result.error && typeof result.error === 'string' && result.error.includes('Invalid or expired session token')) {
            localStorage.removeItem('storedScores');
            console.warn('Cleared local stored scores due to invalid/expired session token (syncStoredScores).');
            return { synced: syncedCount, failed: failedCount + 1 };
        }
        if (result.success) {
             syncedCount++;
        } else {
            failedCount++;
            // Only keep the score for retry if it wasn't blocked or a validation error
            if (!result.blocked && !result.validationError) {
                remainingScores.push(scoreData);
            } else {
                console.log(`Discarding stored score due to ${result.blocked ? 'block (403)' : 'validation error (400)'}: Name=${scoreData.name}, Score=${scoreData.score}`);
            }
        }
    }

    if (remainingScores.length > 0) {
        localStorage.setItem('storedScores', JSON.stringify(remainingScores));
        console.log(`Sync complete. Synced: ${syncedCount}, Failed: ${failedCount}. ${remainingScores.length} scores remain stored.`);
    } else {
        localStorage.removeItem('storedScores');
        console.log(`Sync complete. Synced: ${syncedCount}, Failed: ${failedCount}. All stored scores processed.`);
        if (gameState) gameState.gameStartTimestamp = 0; // Reset timestamp if all synced
        console.log("All scores synced, reset game start timestamp");
    }
    return { synced: syncedCount, failed: failedCount };
}

export function updateSyncStatusUI(syncResult) {
    if (!syncResult || typeof syncResult.synced !== 'number' || typeof syncResult.failed !== 'number') { console.error("updateSyncStatusUI called with invalid syncResult:", syncResult); return; }
    // Check if game over screen is visible
    const isGameOverScreenVisible = messageBox.style.display === 'block' && statsContainer.style.display !== 'none'; // Heuristic check

    if (isGameOverScreenVisible && submissionStatus) {
        if (syncResult.synced > 0 && syncResult.failed === 0) {
            submissionStatus.textContent = `${syncResult.synced} offline score(s) synced!`;
            submissionStatus.style.color = "#00ff00";
            submitScoreButton.disabled = scoreSubmitted; // Use internal state
        } else if (syncResult.synced > 0 && syncResult.failed > 0) {
            submissionStatus.textContent = `Synced ${syncResult.synced}, failed to sync ${syncResult.failed} score(s).`;
            submissionStatus.style.color = "#ffaa00";
            submitScoreButton.disabled = false;
        } else if (syncResult.synced === 0 && syncResult.failed > 0) {
            submissionStatus.textContent = `Failed to sync ${syncResult.failed} score(s).`;
            submissionStatus.style.color = "#ff0000";
            submitScoreButton.disabled = false;
        }
    }
}

// --- Signature Generation ---
async function getGameSecret() {
  if (window.gameSecretKey) {
    if (window.enableDebugLogging) { console.log("Using cached game secret key"); }
    return window.gameSecretKey;
  }
  try {
    if (window.enableDebugLogging) { console.log("Fetching game secret from server..."); }
    else { console.log("Authenticating..."); }
    const response = await fetch('/game-secret');
    if (window.enableDebugLogging) { console.log("Game secret response status:", response.status); }
    if (!response.ok) {
      console.error('Failed to get game secret, status:', response.status);
      if (window.enableDebugLogging) { const text = await response.text(); console.error('Response text:', text); }
      return null;
    }
    const data = await response.json();
    if (!data.key) { console.error('Invalid game secret response - no key in data:', data); return null; }
    window.gameSecretKey = data.key;
    if (window.enableDebugLogging) { console.log("Successfully obtained game secret"); }
    else { console.log("Authentication successful"); }
    return data.key;
  } catch (error) { console.error('Error fetching game secret:', error); return null; }
}

async function generateScoreSignature(scoreData, secretKey) {
  const statsString = Config.stableStringify(scoreData.stats || {});
  const dataToHash = `${scoreData.name}-${scoreData.score}-${scoreData.wave}-${statsString}-${scoreData.sessionToken}-${scoreData.nonce}-${secretKey}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function optimizeCanvasForOrientation(gameState) {
    const { canvas, canvasContainer, controlsContainer, specialWeaponsUIDiv, gameHasStarted, isGameOver } = gameState;
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobileOrSmallScreen = window.innerHeight < 700;

    canvas.width = Config.INTERNAL_WIDTH;
    canvas.height = Config.INTERNAL_HEIGHT;

    if (isLandscape && isMobileOrSmallScreen) {
        console.log("Applying mobile landscape layout");
        // ... calculate canvasWidth, canvasHeight ... (code remains the same)
        const uiSidePadding = 180;
        const availableWidth = window.innerWidth - uiSidePadding;
        const topBottomMargin = 60;
        const availableHeight = window.innerHeight - topBottomMargin;
        let canvasWidth, canvasHeight;
        const gameAspectRatio = Config.INTERNAL_WIDTH / Config.INTERNAL_HEIGHT;
        const widthBasedHeight = availableWidth / gameAspectRatio;
        const heightBasedWidth = availableHeight * gameAspectRatio;
        if (widthBasedHeight <= availableHeight) { canvasWidth = availableWidth; canvasHeight = widthBasedHeight; }
        else { canvasWidth = heightBasedWidth; canvasHeight = availableHeight; }
        canvasContainer.style.width = `${canvasWidth}px`;
        canvasContainer.style.height = `${canvasHeight}px`;
        canvasContainer.style.maxWidth = 'none';
        canvasContainer.style.margin = '0 auto';

        // **** MODIFIED CSS TEXT for controlsContainer ****
        controlsContainer.style.cssText = 'display: flex; position: absolute; left: 10px; top: 50%; transform: translateY(-50%); flex-direction: column; width: auto; background-color: rgba(0,0,0,0.6); padding: 8px; border-radius: 8px; z-index: 15;';
        // Apply similar change if specialWeaponsUIDiv should also be flex
        specialWeaponsUIDiv.style.cssText = 'display: flex; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); flex-direction: column; background-color: rgba(0,0,0,0.6); padding: 8px; border-radius: 8px; z-index: 15;';

        const buttons = controlsContainer.querySelectorAll('button');
        buttons.forEach(button => {
            if (gameHasStarted && !isGameOver && (button.id === 'restartButton' || button.id === 'pauseButton' || button.id === 'screenshotButton')) {
                 button.style.cssText = 'padding: 6px 10px; margin: 3px 0; font-size: 12px; width: 100%; display: block;';
            } else if (!gameHasStarted || isGameOver) {
                 if (button.id === 'restartButton' || button.id === 'pauseButton' || button.id === 'screenshotButton') {
                    button.style.display = 'none';
                 }
            } else {
                 // Apply styles to other potential buttons inside controlsContainer
                 button.style.cssText = 'padding: 6px 10px; margin: 3px 0; font-size: 12px; width: 100%; display: block;';
            }
        });

    } else {
        // Standard layout code (should be correct from previous fix)
        console.log("Applying standard layout");
        canvasContainer.style.width = ''; canvasContainer.style.height = ''; canvasContainer.style.maxWidth = "800px";
        controlsContainer.style.cssText = ''; specialWeaponsUIDiv.style.cssText = '';
        controlsContainer.style.display = 'flex'; // Ensure display is flex here too
        specialWeaponsUIDiv.style.display = 'flex'; // Ensure display is flex here too
        const buttons = controlsContainer.querySelectorAll('button');
        buttons.forEach(button => { button.style.cssText = ''; });
        if (gameHasStarted && !isGameOver) {
            const restartBtn = document.getElementById('restartButton'); // Assuming IDs are unique enough
            const pauseBtn = document.getElementById('pauseButton');
            const screenshotBtn = document.getElementById('screenshotButton');
            if (restartBtn) restartBtn.style.display = 'inline-block';
            if (pauseBtn) pauseBtn.style.display = 'inline-block';
            if (screenshotBtn) screenshotBtn.style.display = 'inline-block';
        }
    }
    canvasContainer.style.aspectRatio = `${Config.INTERNAL_WIDTH} / ${Config.INTERNAL_HEIGHT}`;
    updateUI(gameState);
    updateSpecialWeaponsUI(gameState);
}

// --- AI Analysis ---
function cleanupAIResponseText(text) {
  if (!text) return '';
  let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1').replace(/^(>|\s*-)\s*/gm, '');
  cleanText = cleanText.replace(/^["']|["']$/g, '').replace(/\\"/g, '"');
  const inappropriateTerms = { 'andold': 'android', 'Enemy internet': 'Enemy intercept', 'holed MIRVs': 'incoming MIRVs' };
  Object.entries(inappropriateTerms).forEach(([badTerm, goodTerm]) => { cleanText = cleanText.replace(new RegExp(badTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), goodTerm); });
  return cleanText.trim();
}

function handleAIAnalysisResponse(analysisResult, gameState) { // Pass gameState
  const cleanSummary = cleanupAIResponseText(analysisResult.summary);
  let adviceHTML = '';
  if (Array.isArray(analysisResult.advice) && analysisResult.advice.length > 0) {
    adviceHTML = '<ul>';
    analysisResult.advice.forEach(tip => {
      let cleanTip = cleanupAIResponseText(tip).replace(/^\s*\d+\.?\s*/, '');
      if (cleanTip) { adviceHTML += `<li>${cleanTip}</li>`; }
    });
    adviceHTML += '</ul>';
  }
  messageTitle.textContent = "AI Gameplay Analysis";
  messageText.innerHTML = cleanSummary || "Analysis complete, but no summary provided.";
  messageSubText.innerHTML = adviceHTML || "";
  messageSubText.style.display = adviceHTML ? 'block' : 'none';
  messageBonusText.textContent = ""; messageBonusText.style.display = 'none';
  statsContainer.style.display = 'none'; scoreSubmissionDiv.style.display = 'none';
  goToStoreButton.style.display = 'none'; skipStoreButton.style.display = 'none';
  messageBox.style.display = 'block';

  const buttonContainer = messageBox.querySelector('.messageBoxButtons');
  const existingBackButtons = buttonContainer.querySelectorAll('#backToScoreButton');
  existingBackButtons.forEach(btn => btn.remove());

  const backButton = document.createElement('button');
  backButton.id = 'backToScoreButton';
  backButton.textContent = 'Back to Score Submission';
  backButton.addEventListener('click', () => {
      const title = gameState.highScore === gameState.gameTotalScore && gameState.gameTotalScore > 0 ? "GAME OVER - NEW HIGH SCORE!" : "GAME OVER";
      messageTitle.textContent = title;
      messageText.innerHTML = `Total Score: $${gameState.gameTotalScore}`;
      messageSubText.innerHTML = ""; messageSubText.style.display = 'none';
      statsContainer.style.display = 'grid';
      if (gameState.gameTotalScore > 0) {
          scoreSubmissionDiv.style.display = 'flex';
          if (scoreSubmitted) { submissionStatus.textContent = 'Score already submitted!'; submissionStatus.style.color = "#00ff00"; submitScoreButton.disabled = true; }
          else if (!navigator.onLine) { submissionStatus.textContent = "Offline. Score saved locally."; submissionStatus.style.color = "#ffff00"; submitScoreButton.disabled = true; }
          else { submissionStatus.textContent = ''; submitScoreButton.disabled = false; }
      } else { scoreSubmissionDiv.style.display = 'none'; }
      backButton.remove();
  });
  buttonContainer.appendChild(backButton);
}

export async function handleViewSummaryClick(event, gameState) { // Pass gameState
    event.preventDefault();
    const summaryLink = event.target;
    const originalText = summaryLink.textContent;
    summaryLink.textContent = 'Analyzing... Please Wait';
    summaryLink.style.pointerEvents = 'none';
    summaryLink.style.color = '#ffff00';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); console.log("Fetch aborted due to timeout."); }, 20000);

    try {
        const storedDataString = localStorage.getItem('missileCommandLastGameData');
        if (!storedDataString) { throw new Error("No game data found in local storage. Cannot analyze."); }
        const gameData = JSON.parse(storedDataString);
        if (submittedPlayerNameThisSession) { gameData.playerName = submittedPlayerNameThisSession; console.log(`Including submitted player name in analysis request: ${submittedPlayerNameThisSession}`); }
        else { console.log("No player name submitted this session, not including in analysis request."); }

        if (!sessionToken) { console.warn('Session token is missing. Cannot send game data for analysis.'); throw new Error("Session token missing. Cannot request analysis."); }

        const workerUrl = '/api';
        console.log(`Sending ${gameData.clicks?.length || 0} clicks to worker: ${workerUrl}`);
        console.log(`Using session token: ${sessionToken ? sessionToken.substring(0, 6) + '...' : 'null'}`);

        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
            body: JSON.stringify(gameData),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            let detail = `Status: ${response.status}.`;
            try { const errorJson = JSON.parse(errorText); detail += ` Message: ${errorJson.error || 'Unknown worker error'}`; }
            catch { detail += ` Response: ${errorText || '(empty)'}`; }
            console.error("Worker request failed:", detail);
            throw new Error(`Analysis request failed. ${detail}`);
        }
        const analysisResult = await response.json();
        if (window.enableDebugLogging) { console.log("Received analysis:", analysisResult); }
        else { console.log("Analysis results received"); }

        handleAIAnalysisResponse(analysisResult, gameState); // Pass gameState

        summaryLink.disabled = true; summaryLink.textContent = 'Summary Viewed'; summaryLink.style.color = '#aaaaaa';
    } catch (error) {
        clearTimeout(timeoutId);
        console.error("Error in handleViewSummaryClick:", error);
        messageTitle.textContent = "Analysis Error";
        if (error.name === 'AbortError') { messageText.innerHTML = "The analysis request timed out. Please try again later."; messageSubText.innerHTML = ""; }
        else { messageText.innerHTML = "Could not retrieve or process game analysis."; messageSubText.innerHTML = `Error: ${error.message}`; }
        messageSubText.style.display = messageSubText.innerHTML ? 'block' : 'none';
        messageBonusText.textContent = ""; messageBonusText.style.display = 'none';
        statsContainer.style.display = 'none'; scoreSubmissionDiv.style.display = 'none';
        goToStoreButton.style.display = 'none'; skipStoreButton.style.display = 'none';
        messageBox.style.display = 'block';
    } finally {
        summaryLink.textContent = originalText; summaryLink.style.pointerEvents = 'auto'; summaryLink.style.color = '#00ffff';
    }
}

// --- Debug/Info ---
export function debugDeviceInfo() {
    console.log(`Window size: ${window.innerWidth} x ${window.innerHeight}`);
    console.log(`Is landscape: ${window.innerWidth > window.innerHeight}`);
    console.log(`Is mobile/small: ${window.innerHeight < 700}`);
}

// --- About Game Modal ---
export function setupAboutGameModal(pauseGameCallback, resumeGameCallback) { // Accept callbacks
    if (aboutGameButton && aboutGameModal && closeAboutButton) {
        aboutGameButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (typeof initAudioContext === 'function' && !audioInitialized) { initAudioContext(); }
            const wasPlaying = pauseGameCallback(); // Call pause callback, get status
            aboutGameModal.style.display = 'block';
            aboutGameModal.dataset.pausedGame = wasPlaying ? 'true' : 'false';
        });
        closeAboutButton.addEventListener('click', function() {
            aboutGameModal.style.display = 'none';
            if (aboutGameModal.dataset.pausedGame === 'true') { resumeGameCallback(); } // Call resume callback
        });
        window.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && aboutGameModal.style.display === 'block') { closeAboutButton.click(); }
        });
    }
}

// --- iOS Install Instructions ---
export function setupIOSInstallInstructions() {
    function isIOS() { return ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document); }
    if (isIOS() && !window.navigator.standalone && iosInstructionsDiv) {
        let promptSupported = false;
        window.addEventListener('beforeinstallprompt', () => { promptSupported = true; });
        setTimeout(() => {
            if (!promptSupported && iosInstructionsDiv.style.display !== 'block') {
                console.log("iOS detected, standalone mode is false, and beforeinstallprompt likely not supported. Showing instructions.");
                iosInstructionsDiv.classList.add('show-instructions');
                document.body.classList.add('ios-device');
            } else { console.log("iOS detected, but PWA might be installed or prompt is supported."); }
        }, 1500);
    }
    if (closeInstructionsButton && iosInstructionsDiv) {
        closeInstructionsButton.addEventListener('click', () => { iosInstructionsDiv.style.display = 'none'; });
    }
}

// --- Service Worker ---
export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('[Service Worker] registered:', registration.scope);
        }).catch((error) => {
            console.error('[Service Worker] registration failed:', error);
        });
    } else {
        console.log('[Service Worker] not supported.');
    }
}

// --- Online/Offline Handling ---
export function setupOnlineOfflineListeners(gameState) { // Pass gameState
    window.addEventListener('online', async () => {
        console.log("Browser detected online status.");
        const syncResult = await syncStoredScores(gameState); // Pass gameState
        updateSyncStatusUI(syncResult);
        maybeRefreshLeaderboard();
        const summaryLink = document.getElementById('viewGameSummaryLink');
        if (summaryLink) { summaryLink.disabled = false; }
    });
    window.addEventListener('offline', () => {
        console.log("Browser detected offline status.");
        const isGameOverScreenVisible = messageBox.style.display === 'block' && statsContainer.style.display !== 'none';
        if (isGameOverScreenVisible && !submitScoreButton.disabled) {
            submissionStatus.textContent = "Offline. Score saved locally.";
            submissionStatus.style.color = "#ffff00";
            submitScoreButton.disabled = true;
        }
        const summaryLink = document.getElementById('viewGameSummaryLink');
        if (summaryLink) { summaryLink.disabled = true; }
    });
}

function maybeRefreshLeaderboard() {
    if (typeof fetchAndDisplayLeaderboard === 'function' && leaderboardContainer && leaderboardContainer.style.display !== 'none') {
        fetchAndDisplayLeaderboard();
    }
}

// --- Debug Status Check ---
export async function checkDebugStatus() {
    try {
        const debugResponse = await fetch('/check-debug-status');
        if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            window.enableDebugLogging = debugData.isDebug; // Store globally for other modules
            console.log(`Debug logging enabled: ${window.enableDebugLogging}`);
        } else {
            console.warn('Failed to fetch debug status from server.');
        }
    } catch (error) {
        console.error('Error fetching debug status:', error);
    }
}
