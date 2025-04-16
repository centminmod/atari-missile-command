import * as Config from './configAndUtils.js';
import * as GameLogic from './gameLogic.js';
import * as UI from './uiAndIO.js';

// --- Game State Object ---
// Centralized state management
let gameState = {
    // Canvas and Context (references from UI module)
    canvas: UI.canvas,
    ctx: UI.ctx,
    // ADD THESE LINES: Include references needed by optimizeCanvasForOrientation
    canvasContainer: UI.canvasContainer,
    controlsContainer: UI.controlsContainer,
    specialWeaponsUIDiv: UI.specialWeaponsUIDiv,

    // Core Game State
    score: 0,
    gameTotalScore: 0,
    highScore: 0,
    currentWave: 0,
    cities: [],
    bases: [],
    incomingMissiles: [],
    playerMissiles: [],
    explosions: [],
    isGameOver: true,
    gameLoopId: null,
    transitioningWave: false,
    isPaused: false,
    gameHasStarted: false,
    difficultySelected: false,
    selectedDifficultyName: '',
    selectedDifficultyAmmo: 50,
    difficultyScoreMultiplier: 1.0,
    bonusMissileCount: 0,

    // Store State
    storeStockSatellite: Config.MAX_STOCK_SATELLITE,
    storeStockBase: Config.MAX_STOCK_BASE,
    storeStockCity: Config.MAX_STOCK_CITY,
    storeStockShield: Config.MAX_STOCK_SHIELD,
    storeStockSatShield: Config.MAX_STOCK_SAT_SHIELD,
    storeStockSonicWave: Config.MAX_STOCK_SONIC_WAVE,
    storeStockBomb: Config.MAX_STOCK_BOMB,

    // Inventory & Special Weapons
    satelliteBases: [],
    baseShields: [null, null, null],
    inventorySonicWave: 0,
    inventoryBomb: 0,
    isBombArmed: false,
    activeSonicWave: null,

    // Scoring & Stats
    consecutiveIntercepts: 0,
    scoreMultiplier: 1.0,
    playerMissileSpeedLevel: 0,
    explosionRadiusLevel: 0,
    accuracyBonusMessageTimer: 0,
    comboMessageTimer: 0,
    statsMissilesFired: 0,
    statsEnemyMissilesDestroyed: 0,
    statsPlaneBombsDestroyed: 0,
    statsPlanesDestroyed: 0,
    statsCitiesLost: 0,
    statsBasesLost: 0,
    statsAccuracyBonusHits: 0,
    statsShieldBombsDestroyed: 0,

    // Planes & Bombs
    planes: [],
    planeBombs: [],

    // Timing & Wave Control
    gameStartTimestamp: 0,
    waveTimer: 0,
    waveEnemiesSpawned: 0,
    waveEnemiesRequired: 0,
    currentWaveConfig: {},
    waveStartTime: 0,
    totalGameDurationSeconds: 0,
    waveAllSpawnedTimestamp: 0,
    waveStats: [],

    // Input & Performance
    gameClickData: [],
    storeActions: [],
    keyboardSelectedBaseIndex: -1,
    reticleX: Config.INTERNAL_WIDTH / 2,
    reticleY: Config.INTERNAL_HEIGHT / 2,
    keyboardTargetingActive: false,
    lastFrameTime: 0,
    frameCount: 0,
    frameTimes: [],
    useDeferredKillCounting: true, // Or false based on preference

    // Background
    stars: [],

    // UI Element References (Directly from UI module for convenience)
    messageBonusText: UI.messageBonusText,
    // Add other UI elements if directly manipulated often, otherwise access via UI.elementName
};

// --- Game Flow Functions ---

async function startGame() {
    try {
        await UI.fetchSessionToken(); // Fetch token via UI module
        console.log("startGame: Entered");
        if (!gameState.difficultySelected) { console.warn("Difficulty not selected!"); return; }
        console.log("startGame: Difficulty selected, proceeding...");
        UI.optimizeCanvasForOrientation(gameState); // Pass gameState
        gameState.gameStartTimestamp = Date.now();
        console.log(`Game started at: ${new Date(gameState.gameStartTimestamp).toISOString()}`);

        // Reset core state variables within gameState
        gameState.score = 0;
        gameState.scoreSubmitted = false; // Assuming scoreSubmitted is managed in UI module now
        gameState.gameTotalScore = 0;
        gameState.gameClickData = [];
        gameState.storeActions = [];
        gameState.currentWave = -1;
        gameState.isGameOver = false;
        gameState.isPaused = false;
        gameState.transitioningWave = false;
        gameState.gameHasStarted = true;
        gameState.bonusMissileCount = 0;
        gameState.storeStockSatellite = Config.MAX_STOCK_SATELLITE;
        gameState.storeStockBase = Config.MAX_STOCK_BASE;
        gameState.storeStockCity = Config.MAX_STOCK_CITY;
        gameState.storeStockShield = Config.MAX_STOCK_SHIELD;
        gameState.storeStockSatShield = Config.MAX_STOCK_SAT_SHIELD;
        gameState.storeStockSonicWave = Config.MAX_STOCK_SONIC_WAVE;
        gameState.storeStockBomb = Config.MAX_STOCK_BOMB;
        gameState.inventorySonicWave = 0;
        gameState.inventoryBomb = 0;
        gameState.isBombArmed = false;
        gameState.activeSonicWave = null;
        gameState.satelliteBases = [];
        gameState.baseShields = [null, null, null];
        gameState.planes = [];
        gameState.planeBombs = [];
        gameState.incomingMissiles = [];
        gameState.playerMissiles = [];
        gameState.explosions = [];
        gameState.statsMissilesFired = 0;
        gameState.statsEnemyMissilesDestroyed = 0;
        gameState.statsPlaneBombsDestroyed = 0;
        gameState.statsPlanesDestroyed = 0;
        gameState.statsCitiesLost = 0;
        gameState.statsBasesLost = 0;
        gameState.statsAccuracyBonusHits = 0;
        gameState.statsShieldBombsDestroyed = 0;
        gameState.playerMissileSpeedLevel = 0;
        gameState.explosionRadiusLevel = 0;
        gameState.consecutiveIntercepts = 0;
        gameState.scoreMultiplier = 1.0;
        gameState.highScore = parseInt(localStorage.getItem('missileCommandHighScore') || '0');
        gameState.totalGameDurationSeconds = 0;
        gameState.waveStartTime = 0;
        gameState.waveAllSpawnedTimestamp = 0;
        gameState.waveStats = [];
        gameState.keyboardSelectedBaseIndex = -1;
        gameState.reticleX = gameState.canvas.width / 2;
        gameState.reticleY = gameState.canvas.height / 2;
        gameState.keyboardTargetingActive = false;

        GameLogic.initializeStars(gameState); // Pass gameState

        console.log("startGame: State variables reset");
        console.log("startGame: Setting up UI...");
        UI.startMenuContainer.style.display = 'none';
        UI.canvasContainer.style.display = 'block';
        UI.canvas.style.display = 'block';
        UI.uiContainer.style.display = 'flex';
        UI.controlsContainer.style.display = 'flex';
        UI.specialWeaponsUIDiv.style.display = 'flex';
        UI.screenshotButton.style.display = 'inline-block';
        UI.hideMessage();
        UI.statsContainer.style.display = 'none';
        UI.pauseOverlay.style.display = 'none';
        UI.canvas.style.cursor = 'crosshair';
        console.log("startGame: UI setup complete");

        UI.sonicWaveControl.style.display = 'flex';
        UI.bombControl.style.display = 'flex';
        document.querySelectorAll('#restartButton').forEach(btn => btn.style.display = 'inline-block');
        UI.pauseButton.style.display = 'inline-block';
        UI.screenshotButton.style.display = 'inline-block';

        console.log("startGame: Initializing game objects...");
        gameState.cities = [];
        const cityWidth = gameState.canvas.width * Config.CITY_WIDTH_RATIO;
        const citySpacingRatio = (Config.INTERNAL_WIDTH - 6 * (Config.INTERNAL_WIDTH * Config.CITY_WIDTH_RATIO)) / (7 * Config.INTERNAL_WIDTH);
        const cityWidthRatio = Config.CITY_WIDTH_RATIO;
        for (let i = 0; i < 3; i++) gameState.cities.push(GameLogic.createCity(gameState, citySpacingRatio * (i + 1) + cityWidthRatio * i));
        for (let i = 0; i < 3; i++) gameState.cities.push(GameLogic.createCity(gameState, citySpacingRatio * (i + 4) + cityWidthRatio * (i + 3)));
        gameState.cities.forEach(c => c.alive = true);
        gameState.bases = [];
        const basePositionsRatios = [0.15, 0.5, 0.85];
        gameState.bases.push(GameLogic.createBase(gameState, basePositionsRatios[0]));
        gameState.bases.push(GameLogic.createBase(gameState, basePositionsRatios[1]));
        gameState.bases.push(GameLogic.createBase(gameState, basePositionsRatios[2]));
        gameState.bases.forEach(b => b.alive = true);
        console.log("startGame: Game objects initialized");

        console.log("startGame: Calling initWave(0)...");
        GameLogic.initWave(gameState, 0); // Pass gameState
        console.log("startGame: initWave(0) complete");

        UI.restartButton.style.display = 'inline-block'; // Ensure correct restart button is shown
        UI.pauseButton.style.display = 'inline-block';
        UI.pauseButton.textContent = 'Pause';
        UI.pauseButton.disabled = false;

        if (gameState.gameLoopId) { cancelAnimationFrame(gameState.gameLoopId); gameState.gameLoopId = null; }
        console.log("startGame: Calling startGameLoop()...");
        startGameLoop(); // Use the new loop starter function

        // Music might start if conditions are right (handled by toggleMusicMute/resumeGame)
        if (!UI.audioInitialized) { UI.initAudioContext(); } // Ensure audio is ready
        if (!gameState.isMusicMuted) { UI.playMusic(); } // Play if not muted

        console.log("startGame: Exiting");
    } catch (error) {
        console.error("Error during startGame:", error);
        UI.showMessage(gameState, "STARTUP ERROR", `Failed to start game: ${error.message}`, "Check console for details."); // Pass gameState
        gameState.isGameOver = true;
    }
}

function nextWave() {
    const waveCompletionTimestamp = Date.now();
    let spawnToCompletionMs = null;
    if (gameState.waveAllSpawnedTimestamp > 0) {
        spawnToCompletionMs = waveCompletionTimestamp - gameState.waveAllSpawnedTimestamp;
        console.log(`Wave ${gameState.currentWave + 1}: Spawn-to-completion duration: ${(spawnToCompletionMs / 1000).toFixed(1)}s`);
    } else {
        console.warn(`Wave ${gameState.currentWave + 1}: waveAllSpawnedTimestamp not set, cannot calculate spawn-to-completion duration.`);
    }
    if (gameState.waveStats.length <= gameState.currentWave) { gameState.waveStats.length = gameState.currentWave + 1; } // Ensure array is large enough
    gameState.waveStats[gameState.currentWave] = { spawnToCompletionMs: spawnToCompletionMs };
    gameState.waveAllSpawnedTimestamp = 0;

    if (gameState.waveStartTime > 0) {
        const waveDuration = (waveCompletionTimestamp - gameState.waveStartTime) / 1000;
        gameState.totalGameDurationSeconds += waveDuration;
        console.log(`Wave ${gameState.currentWave + 1} total duration: ${waveDuration.toFixed(1)}s. Total game duration: ${gameState.totalGameDurationSeconds.toFixed(1)}s`);
        gameState.waveStartTime = 0;
    }

    let bonusEarned = GameLogic.calculateBonus(gameState); // Pass gameState
    gameState.score += Math.round(bonusEarned * gameState.difficultyScoreMultiplier);
    gameState.gameTotalScore += Math.round(bonusEarned * gameState.difficultyScoreMultiplier);
    UI.updateUI(gameState); // Pass gameState

    const citiesSurvived = gameState.cities.filter(c => c.alive).length;
    const citiesLost = 6 - citiesSurvived;
    let bonusChangeMsg = "";
    if (citiesLost > 0) {
        const lostBonus = Math.min(gameState.bonusMissileCount, citiesLost);
        if (lostBonus > 0) { bonusChangeMsg = `Lost ${lostBonus} bonus missile${lostBonus > 1 ? 's' : ''}!`; gameState.bonusMissileCount -= lostBonus; }
    } else { gameState.bonusMissileCount++; bonusChangeMsg = `PERFECT! +1 Bonus Missile!`; }
    gameState.bonusMissileCount = Math.max(0, gameState.bonusMissileCount);
    if (gameState.bonusMissileCount > 0) { bonusChangeMsg += ` (Total +${gameState.bonusMissileCount} active next wave)`; }
    else if (bonusChangeMsg !== "" && citiesLost > 0) { bonusChangeMsg += ` (Bonus Fire deactivated)`; }
    else if (bonusChangeMsg === "" && citiesLost > 0){ bonusChangeMsg = ""; }

    gameState.isBombArmed = false;
    UI.canvas.style.cursor = 'crosshair';
    UI.bombControl.classList.remove('armed');

    const summaryLink = document.getElementById('viewGameSummaryLink');
    if (summaryLink) { summaryLink.remove(); }
    const backButton = document.getElementById('backToScoreButton');
    if (backButton) { backButton.remove(); }

    UI.showMessage(gameState, `WAVE ${gameState.currentWave + 1} CLEARED`, `Score Bonus: $${Math.round(bonusEarned * gameState.difficultyScoreMultiplier)}`, "", bonusChangeMsg); // Pass gameState
    UI.goToStoreButton.style.display = 'inline-block';
    UI.skipStoreButton.style.display = 'inline-block';
    UI.pauseButton.disabled = true;
    UI.statsContainer.style.display = 'none';
    UI.updateUI(gameState); // Pass gameState
}

function proceedToNextWave() {
    UI.storeModal.style.display = 'none';
    UI.hideMessage();
    GameLogic.initWave(gameState, gameState.currentWave + 1); // Pass gameState
    gameState.transitioningWave = false;
    UI.pauseButton.disabled = false;
    if (!gameState.isPaused && !gameState.gameLoopId) {
        startGameLoop();
    }
}

function gameOver() {
    if (gameState.isGameOver) return;
    console.log("Game Over triggered.");
    gameState.isGameOver = true;
    gameState.gameHasStarted = false;
    gameState.transitioningWave = false;
    gameState.isPaused = false;

    const gameEndTimestamp = Date.now();
    const actualGameDuration = (gameEndTimestamp - gameState.gameStartTimestamp) / 1000;
    console.log(`Game ended at: ${new Date(gameEndTimestamp).toISOString()}`);
    console.log(`Total game time from button click: ${actualGameDuration.toFixed(1)}s`);

    if (Math.abs(actualGameDuration - gameState.totalGameDurationSeconds) > 5) {
        if (window.enableDebugLogging) {
            console.warn(`Duration discrepancy: Wave-based calculation (${gameState.totalGameDurationSeconds.toFixed(1)}s) differs from start-to-end time (${actualGameDuration.toFixed(1)}s)`);
        }
    }

    if (gameState.waveStartTime > 0) {
        const waveDuration = (Date.now() - gameState.waveStartTime) / 1000;
        gameState.totalGameDurationSeconds += waveDuration;
        console.log(`Final wave (${gameState.currentWave + 1}) duration: ${waveDuration.toFixed(1)}s. Total duration: ${gameState.totalGameDurationSeconds.toFixed(1)}s`);
        gameState.waveStartTime = 0;
    }

    gameState.bonusMissileCount = 0;
    gameState.baseShields = [null, null, null];
    gameState.isBombArmed = false;
    gameState.activeSonicWave = null;
    UI.canvas.style.cursor = 'default';
    gameState.planes = [];
    gameState.planeBombs = [];

    // Save Click Data
    const fixedStorageKey = 'missileCommandLastGameData';
    if (gameState.gameClickData && gameState.gameClickData.length > 0) {
        try {
            const difficulty = gameState.selectedDifficultyName || 'Unknown';
            const timestamp = new Date().toISOString();
            const dataToStore = {
                difficulty: difficulty,
                timestamp: timestamp,
                score: gameState.gameTotalScore,
                wave: gameState.currentWave + 1,
                timingInfo: {
                    gameStartTimestamp: gameState.gameStartTimestamp,
                    gameEndTimestamp: gameEndTimestamp,
                    totalDurationSeconds: actualGameDuration,
                    calculatedDurationSeconds: gameState.totalGameDurationSeconds
                },
                stats: {
                    missilesFired: gameState.statsMissilesFired,
                    enemyMissilesDestroyed: gameState.statsEnemyMissilesDestroyed,
                    shieldBombsDestroyed: gameState.statsShieldBombsDestroyed,
                    planeBombsDestroyed: gameState.statsPlaneBombsDestroyed,
                    planesDestroyed: gameState.statsPlanesDestroyed,
                    citiesLost: gameState.statsCitiesLost,
                    basesLost: gameState.statsBasesLost,
                    accuracyBonusHits: gameState.statsAccuracyBonusHits,
                    gameStartTime: gameState.gameStartTimestamp,
                    waveStats: gameState.waveStats.map(stat => stat ? stat.spawnToCompletionMs : null)
                },
                clicks: gameState.gameClickData,
                storeActions: gameState.storeActions
            };
            localStorage.setItem(fixedStorageKey, JSON.stringify(dataToStore));
            if (window.enableDebugLogging) { console.log(`Saved game data (${gameState.gameClickData.length} clicks) to local storage key: ${fixedStorageKey}`); }
            else { console.log("Game data saved to local storage"); }
        } catch (e) {
            console.error("Failed to save game data to local storage:", e);
            localStorage.removeItem(fixedStorageKey);
        } finally {
            gameState.gameClickData = []; // Clear runtime array
        }
    } else {
        localStorage.removeItem(fixedStorageKey);
        console.log("No click data recorded for this game. Cleared any old saved data.");
    }

    // High score check
    let newHighScore = false;
    if (gameState.gameTotalScore > gameState.highScore) {
        gameState.highScore = gameState.gameTotalScore;
        localStorage.setItem('missileCommandHighScore', gameState.highScore.toString());
        newHighScore = true;
    }

    // Store Score Locally if Offline
    if (!navigator.onLine && gameState.gameTotalScore > 0) {
        console.log("Offline: Storing score locally.");
        try {
            const storedScores = JSON.parse(localStorage.getItem('storedScores') || '[]');
            const scoreData = {
                name: 'TEMP_OFFLINE',
                score: gameState.gameTotalScore,
                wave: gameState.currentWave + 1,
                stats: { /* Populate stats similar to submitHighScore */
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
                    gameStartTime: gameState.gameStartTimestamp,
                    waveStats: gameState.waveStats.map(stat => stat ? stat.spawnToCompletionMs : null)
                },
                timestamp: Date.now()
            };
            storedScores.push(scoreData);
            localStorage.setItem('storedScores', JSON.stringify(storedScores));
            console.log(`Score of ${gameState.gameTotalScore} stored locally. Total stored: ${storedScores.length}`);
        } catch (e) { console.error("Error saving score to localStorage:", e); }
    }

    // Determine game over reason
    const basesRemaining = gameState.bases.filter(b => b.alive).length;
    const citiesRemaining = gameState.cities.filter(c => c.alive).length;
    const satellitesRemaining = gameState.satelliteBases.filter(s => s.alive).length;
    let reason = "";
    if (citiesRemaining === 0) { reason = "All cities destroyed!"; }
    else if (basesRemaining === 0 && satellitesRemaining === 0) { reason = "All launch sites destroyed!"; }
    else { reason = "Targets eliminated!"; }

    // Display stats
    const accuracy = gameState.statsMissilesFired > 0 ? ((gameState.statsEnemyMissilesDestroyed + gameState.statsPlaneBombsDestroyed) / gameState.statsMissilesFired * 100).toFixed(1) : "N/A";
    UI.statsContainer.innerHTML = '';
    const stats = [
        `Wave Reached: ${gameState.currentWave + 1}`, `Accuracy Bonuses: ${gameState.statsAccuracyBonusHits}`,
        `Difficulty: ${gameState.selectedDifficultyName || 'N/A'}`, `Planes Down: ${gameState.statsPlanesDestroyed}`,
        `Missiles Fired: ${gameState.statsMissilesFired}`, `Cities Lost: ${gameState.statsCitiesLost}`,
        `Accuracy: ${accuracy}%`, `Bases Lost: ${gameState.statsBasesLost}`,
        `Enemy Missiles Down: ${gameState.statsEnemyMissilesDestroyed}`, `Shield Bombs Down: ${gameState.statsShieldBombsDestroyed}`,
        `Final Score: $${gameState.gameTotalScore}`, `Plane Bombs Down: ${gameState.statsPlaneBombsDestroyed}`,
        newHighScore ? `NEW HIGH SCORE!` : `High Score: $${gameState.highScore}`
    ];
    stats.forEach(statText => { const span = document.createElement('span'); span.textContent = statText; UI.statsContainer.appendChild(span); });

    const title = newHighScore ? "GAME OVER - NEW HIGH SCORE!" : "GAME OVER";
    UI.showMessage(gameState, title, `Total Score: $${gameState.gameTotalScore}`, reason); // Pass gameState
    UI.messageBonusText.textContent = "";
    UI.statsContainer.style.display = 'grid';
    UI.goToStoreButton.style.display = 'none'; UI.skipStoreButton.style.display = 'none';

    // Manage AI Summary Link
    const buttonContainer = UI.messageBox.querySelector('.messageBoxButtons');
    let summaryLink = document.getElementById('viewGameSummaryLink');
    if (localStorage.getItem('missileCommandLastGameData')) {
        if (!summaryLink) {
            summaryLink = document.createElement('button');
            summaryLink.id = 'viewGameSummaryLink';
            summaryLink.style.display = 'inline-block';
            summaryLink.classList.add('gameAnalysisButton');
            summaryLink.addEventListener('click', (event) => UI.handleViewSummaryClick(event, gameState)); // Pass gameState
            if (buttonContainer) { buttonContainer.appendChild(summaryLink); }
        }
        summaryLink.textContent = 'View Game Summary';
        summaryLink.disabled = !navigator.onLine;
    } else {
        if (summaryLink) { summaryLink.remove(); }
    }

    // Show/Hide Score Submission Form
    if (gameState.gameTotalScore > 0) {
        UI.scoreSubmissionDiv.style.display = 'flex';
        UI.playerNameInput.value = localStorage.getItem('missileCommandPlayerName') || 'ACE';
        if (navigator.onLine) {
            UI.submissionStatus.textContent = '';
            UI.submitScoreButton.disabled = false;
            // scoreSubmitted is managed internally in UI module
        } else {
            UI.submissionStatus.textContent = "Offline. Score saved locally.";
            UI.submissionStatus.style.color = "#ffff00";
            UI.submitScoreButton.disabled = true;
        }
    } else {
        UI.scoreSubmissionDiv.style.display = 'none';
    }

    // Display restart button, disable pause
    const messageRestartButton = UI.messageBox.querySelector('#restartButton');
    if (messageRestartButton) messageRestartButton.style.display = 'inline-block';
    UI.pauseButton.style.display = 'inline-block'; UI.pauseButton.textContent = 'Pause'; UI.pauseButton.disabled = true;
    UI.pauseOverlay.style.display = 'none'; UI.bonusIndicator.style.display = 'none'; UI.storeModal.style.display = 'none';
    UI.specialWeaponsUIDiv.style.display = 'none';

    if (gameState.gameLoopId) { cancelAnimationFrame(gameState.gameLoopId); gameState.gameLoopId = null; }
    UI.stopMusic();
    // submittedPlayerNameThisSession is managed internally in UI module
    // gameStartTimestamp reset happens after successful submission in UI module

    console.log("Game Over processing complete.");
}

function pauseGame() {
    if (gameState.isGameOver || gameState.transitioningWave || !gameState.gameHasStarted || UI.storeModal.style.display === 'block' || UI.messageBox.style.display === 'block') return false; // Return status
    gameState.isPaused = true;
    UI.pauseOverlay.style.display = 'flex';
    UI.pauseButton.textContent = 'Resume';
    if (gameState.gameLoopId) { cancelAnimationFrame(gameState.gameLoopId); gameState.gameLoopId = null; }
    UI.stopMusic();
    return true; // Indicate game was paused
}

function resumeGame() {
    if (gameState.isGameOver || gameState.transitioningWave || !gameState.isPaused) return;
    gameState.isPaused = false;
    UI.pauseOverlay.style.display = 'none';
    UI.pauseButton.textContent = 'Pause';
    if (!gameState.gameLoopId) { startGameLoop(); }
    if (!gameState.isMusicMuted) UI.playMusic(); // Resume music if not muted
}

function togglePause() {
    if (gameState.isPaused) { resumeGame(); }
    else { pauseGame(); }
    gameState.isBombArmed = false;
    UI.canvas.style.cursor = 'crosshair';
    UI.bombControl.classList.remove('armed');
    UI.updateSpecialWeaponsUI(gameState); // Pass gameState
}

// --- Game Loop ---
function gameLoop(timestamp) {
    if (!gameState.lastFrameTime) { gameState.lastFrameTime = timestamp; }
    const frameTime = timestamp - gameState.lastFrameTime;
    gameState.lastFrameTime = timestamp;

    if (gameState.frameCount < Config.FRAME_SAMPLE_SIZE) { gameState.frameTimes.push(frameTime); gameState.frameCount++; }
    else if (gameState.frameCount === Config.FRAME_SAMPLE_SIZE) {
        const avgFrameTime = gameState.frameTimes.reduce((sum, time) => sum + time, 0) / Config.FRAME_SAMPLE_SIZE;
        console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms (${(1000/avgFrameTime).toFixed(2)} FPS)`);
        gameState.frameCount++;
    }

    if (gameState.isPaused) { gameState.gameLoopId = null; return; }

    GameLogic.checkGameOverConditions(gameState, gameOver); // Pass gameState and callback
    if (gameState.isGameOver && gameState.explosions.length === 0 && gameState.planeBombs.length === 0 && !gameState.activeSonicWave && !gameState.transitioningWave) {
        console.log("gameLoop: Stopping loop (Game Over condition met)");
        gameState.gameLoopId = null;
        return;
    }

    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    GameLogic.drawBackground(gameState); // Pass gameState
    GameLogic.drawGameObjects(gameState); // Pass gameState

    if (!gameState.isGameOver && !gameState.transitioningWave) {
        GameLogic.updateGameObjects(gameState); // Pass gameState
        UI.updateUI(gameState); // Pass gameState
        UI.updateSpecialWeaponsUI(gameState); // Pass gameState
        GameLogic.checkWaveEnd(gameState, nextWave); // Pass gameState and callback
    } else if (gameState.isGameOver) {
        // Only update effects if game is over
        gameState.explosions.forEach(explosion => explosion.update());
        gameState.planeBombs.forEach(bomb => bomb.update());
        if (gameState.activeSonicWave && gameState.activeSonicWave.alive) {
            gameState.activeSonicWave.y -= Config.SONIC_WAVE_SPEED;
            if (gameState.activeSonicWave.y - Config.SONIC_WAVE_HEIGHT <= 0) { gameState.activeSonicWave.alive = false; gameState.activeSonicWave = null; }
        }
        gameState.explosions = gameState.explosions.filter(explosion => explosion.alive);
        gameState.planeBombs = gameState.planeBombs.filter(bomb => bomb.alive);
    }

    if (!gameState.isGameOver || gameState.explosions.length > 0 || gameState.planeBombs.length > 0 || gameState.activeSonicWave) {
        gameState.gameLoopId = requestAnimationFrame(gameLoop);
    } else {
        console.log("gameLoop: Stopping loop (End condition met)");
        gameState.gameLoopId = null;
    }
}

function startGameLoop() {
    if (gameState.gameLoopId) { cancelAnimationFrame(gameState.gameLoopId); }
    gameState.frameCount = 0;
    gameState.frameTimes = [];
    gameState.lastFrameTime = 0;
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Canvas Input
    UI.canvas.addEventListener('click', (event) => UI.handleCanvasInput(gameState, event));
    UI.canvas.addEventListener('touchstart', (event) => UI.handleCanvasInput(gameState, event), { passive: false });
    UI.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    UI.canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

    // Buttons
    document.querySelectorAll('#restartButton').forEach(button => {
        button.addEventListener('click', () => {
            const gameIsActive = gameState.gameHasStarted && !gameState.isGameOver && !gameState.isPaused && !gameState.transitioningWave;
            if (gameIsActive && !confirm("Are you sure you want to restart the current game?")) { return; }
            if (gameState.gameLoopId) { cancelAnimationFrame(gameState.gameLoopId); gameState.gameLoopId = null; }
            UI.stopMusic();
            // Reset most of gameState (simplified for brevity, needs full reset like original)
            Object.assign(gameState, {
                score: 0, gameTotalScore: 0, currentWave: -1, isGameOver: true, gameHasStarted: false, isPaused: false, transitioningWave: false, difficultySelected: false,
                cities: [], bases: [], incomingMissiles: [], playerMissiles: [], explosions: [], satelliteBases: [], baseShields: [null, null, null], planes: [], planeBombs: [],
                bonusMissileCount: 0, inventorySonicWave: 0, inventoryBomb: 0, isBombArmed: false, activeSonicWave: null,
                consecutiveIntercepts: 0, scoreMultiplier: 1.0, playerMissileSpeedLevel: 0, explosionRadiusLevel: 0,
                gameStartTimestamp: 0, totalGameDurationSeconds: 0, waveStartTime: 0, waveAllSpawnedTimestamp: 0, waveStats: [],
                storeStockSatellite: Config.MAX_STOCK_SATELLITE, storeStockBase: Config.MAX_STOCK_BASE, storeStockCity: Config.MAX_STOCK_CITY, storeStockShield: Config.MAX_STOCK_SHIELD, storeStockSatShield: Config.MAX_STOCK_SAT_SHIELD, storeStockSonicWave: Config.MAX_STOCK_SONIC_WAVE, storeStockBomb: Config.MAX_STOCK_BOMB,
                selectedDifficultyName: '', difficultyScoreMultiplier: 1.0,
                statsMissilesFired: 0, statsEnemyMissilesDestroyed: 0, statsPlaneBombsDestroyed: 0, statsPlanesDestroyed: 0, statsCitiesLost: 0, statsBasesLost: 0, statsAccuracyBonusHits: 0, statsShieldBombsDestroyed: 0,
            });
            GameLogic.initializeStars(gameState);
            // Reset UI
            UI.startMenuContainer.style.display = 'flex';
            UI.canvasContainer.style.display = 'none'; UI.canvas.style.display = 'none';
            UI.uiContainer.style.display = 'none'; UI.controlsContainer.style.display = 'none'; UI.specialWeaponsUIDiv.style.display = 'none';
            UI.pauseOverlay.style.display = 'none'; UI.hideMessage(); UI.storeModal.style.display = 'none';
            UI.actualStartButton.style.display = 'none'; UI.actualStartButton.disabled = true;
            document.querySelectorAll('#restartButton').forEach(btn => btn.style.display = 'none');
            UI.pauseButton.style.display = 'none'; UI.screenshotButton.style.display = 'none';
            UI.bonusIndicator.style.display = 'none'; UI.statsContainer.style.display = 'none';
            UI.scoreSubmissionDiv.style.display = 'none';
            document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.remove('selected'));
            gameState.highScore = parseInt(localStorage.getItem('missileCommandHighScore') || '0');
            UI.startHighScoreDisplay.textContent = `High Score: $${gameState.highScore}`;
            UI.fetchAndDisplayLeaderboard(10);
        });
    });
    UI.pauseButton.addEventListener('click', togglePause);
    UI.screenshotButton.addEventListener('click', () => UI.saveScreenshot(gameState)); // Pass gameState
    UI.storeContinueButton.addEventListener('click', proceedToNextWave);
    UI.buyBaseButton.addEventListener('click', () => UI.buyReplacementBase(gameState));
    UI.buyCityButton.addEventListener('click', () => UI.buyReplacementCity(gameState));
    UI.buySatelliteButton.addEventListener('click', () => UI.buySatellite(gameState));
    UI.buyShieldButton.addEventListener('click', () => UI.buyShield(gameState));
    UI.buySatShieldButton.addEventListener('click', () => UI.buySatShield(gameState));
    UI.buySonicWaveButton.addEventListener('click', () => UI.buySonicWave(gameState));
    UI.buyBombButton.addEventListener('click', () => UI.buyBomb(gameState));
    UI.buyFasterMissileButton.addEventListener('click', () => UI.buyFasterMissile(gameState));
    UI.buyWiderExplosionButton.addEventListener('click', () => UI.buyWiderExplosion(gameState));
    UI.buySonicWave10Button.addEventListener('click', () => UI.buySonicWave10(gameState));
    UI.buyBomb10Button.addEventListener('click', () => UI.buyBomb10(gameState));
    UI.goToStoreButton.addEventListener('click', () => { UI.hideMessage(); UI.updateStoreUI(gameState); UI.storeModal.style.display = 'block'; });
    UI.skipStoreButton.addEventListener('click', proceedToNextWave);

    // Difficulty Selection
    document.querySelectorAll('.difficulty-button').forEach(button => {
        button.addEventListener('click', (event) => {
            try {
                gameState.selectedDifficultyAmmo = parseInt(event.target.getAttribute('data-ammo'), 10);
                gameState.difficultyScoreMultiplier = parseFloat(event.target.getAttribute('data-multiplier') || '1.0');
                gameState.difficultySelected = true;
                gameState.selectedDifficultyName = event.target.textContent;
                console.log("Difficulty set:", gameState.selectedDifficultyName, "Ammo:", gameState.selectedDifficultyAmmo, "Multiplier:", gameState.difficultyScoreMultiplier);
                document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.remove('selected'));
                event.target.classList.add('selected');
                if (UI.actualStartButton) {
                     UI.actualStartButton.style.display = 'inline-block';
                     UI.actualStartButton.disabled = false;
                } else { console.error("ERROR: actualStartButton element not found!"); }
            } catch (error) { console.error("Error in difficulty button listener:", error); }
        });
    });
    UI.actualStartButton.addEventListener('click', () => { if (gameState.difficultySelected) { UI.initAudioContext(); startGame(); } });

    // Special Weapons
    UI.sonicWaveControl.addEventListener('click', () => UI.triggerSonicWave(gameState));
    UI.bombControl.addEventListener('click', () => UI.armBomb(gameState));
    UI.sonicWaveControl.addEventListener('touchstart', (event) => { event.preventDefault(); if (!UI.sonicWaveControl.classList.contains('disabled')) { UI.triggerSonicWave(gameState); } }, { passive: false });
    UI.bombControl.addEventListener('touchstart', (event) => { event.preventDefault(); if (!UI.bombControl.classList.contains('disabled')) { UI.armBomb(gameState); } }, { passive: false });

    // Keyboard
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && !gameState.isGameOver && !gameState.transitioningWave && gameState.gameHasStarted && UI.storeModal.style.display === 'none' && UI.messageBox.style.display === 'none' ) {
            event.preventDefault();
            togglePause();
        }
        UI.handleKeyDown(gameState, event); // Pass gameState
    });

    // Audio Controls
    UI.muteMusicButton.addEventListener('click', () => {
        const muted = UI.toggleMusicMute();
        gameState.isMusicMuted = muted; // Sync state
        // If unmuting and game is running, play music
        if (!muted && gameState.gameHasStarted && !gameState.isGameOver && !gameState.isPaused) {
            UI.playMusic();
        }
    });
    UI.muteSfxButton.addEventListener('click', UI.toggleSfxMute);
    UI.musicVolumeSlider.addEventListener('input', UI.handleMusicVolumeChange);
    UI.sfxVolumeSlider.addEventListener('input', UI.handleSfxVolumeChange);

    // Leaderboard
    UI.leaderboardViewMoreLink.addEventListener('click', (event) => { event.preventDefault(); UI.fetchAndDisplayLeaderboard(1000); });
    UI.submitScoreButton.addEventListener('click', () => UI.submitHighScore(gameState)); // Pass gameState
    UI.playerNameInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); UI.submitHighScore(gameState); } }); // Pass gameState

    // Window/Device
    window.addEventListener('resize', () => UI.optimizeCanvasForOrientation(gameState)); // Pass gameState
    window.addEventListener('orientationchange', () => { setTimeout(() => UI.optimizeCanvasForOrientation(gameState), 100); }); // Pass gameState
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    window.addEventListener('load', UI.debugDeviceInfo);
    window.addEventListener('resize', UI.debugDeviceInfo);
    window.addEventListener('orientationchange', () => { console.log("Orientation changed"); setTimeout(UI.debugDeviceInfo, 100); });

    // PWA Install
    UI.setupPwaInstallHandlers();

    // About Modal
    UI.setupAboutGameModal(pauseGame, resumeGame); // Pass pause/resume functions

    // iOS Install Instructions
    UI.setupIOSInstallInstructions();

    // Online/Offline
    UI.setupOnlineOfflineListeners(gameState); // Pass gameState
}

// --- Initialization on Load ---
window.onload = () => {
    gameState.gameStartTimestamp = 0; // Reset timestamp
    gameState.canvas.width = Config.INTERNAL_WIDTH;
    gameState.canvas.height = Config.INTERNAL_HEIGHT;

    GameLogic.initializeStars(gameState); // Initialize stars into gameState
    UI.optimizeCanvasForOrientation(gameState); // Initial setup

    gameState.highScore = parseInt(localStorage.getItem('missileCommandHighScore') || '0');
    UI.startHighScoreDisplay.textContent = `High Score: $${gameState.highScore}`;
    UI.highScoreDisplay.textContent = `HI: $${gameState.highScore}`;

    // Initial UI state
    UI.startMenuContainer.style.display = 'flex';
    UI.canvasContainer.style.display = 'none'; UI.canvas.style.display = 'none';
    UI.uiContainer.style.display = 'none'; UI.controlsContainer.style.display = 'none'; UI.specialWeaponsUIDiv.style.display = 'none';
    UI.messageBox.style.display = 'none'; UI.storeModal.style.display = 'none'; UI.pauseOverlay.style.display = 'none';
    UI.actualStartButton.style.display = 'none';
    document.querySelectorAll('#restartButton').forEach(btn => btn.style.display = 'none');
    UI.pauseButton.style.display = 'none'; UI.screenshotButton.style.display = 'none';
    UI.bonusIndicator.style.display = 'none'; UI.statsContainer.style.display = 'none';
    UI.scoreSubmissionDiv.style.display = 'none';
    UI.musicVolumeSlider.disabled = gameState.isMusicMuted; // Use gameState value
    UI.sfxVolumeSlider.disabled = gameState.isSfxMuted;   // Use gameState value
    UI.muteMusicButton.textContent = gameState.isMusicMuted ? 'Unmute Music' : 'Mute Music';
    UI.muteSfxButton.textContent = gameState.isSfxMuted ? 'Unmute SFX' : 'Mute SFX';

    UI.fetchAndDisplayLeaderboard(10); // Fetch initial leaderboard
    UI.registerServiceWorker(); // Register SW

    // Setup all event listeners
    setupEventListeners();

    // Initial check for stored offline scores
    setTimeout(async () => {
        if (navigator.onLine) {
            const syncResult = await UI.syncStoredScores(gameState); // Pass gameState
            if (syncResult.synced > 0) {
                console.log(`Synced ${syncResult.synced} previously stored scores on startup.`);
                UI.fetchAndDisplayLeaderboard(); // Refresh leaderboard
            }
        } else {
            const storedScores = localStorage.getItem('storedScores');
            if (storedScores && JSON.parse(storedScores).length > 0) {
                console.log("Offline on load, locally stored scores detected.");
            }
        }
    }, 1000);

    // Check debug status
    UI.checkDebugStatus();
};
