import * as Config from './configAndUtils.js';
import { playSfx, playExplosionSound } from './uiAndIO.js'; // Assuming playSfx/playExplosionSound will be in uiAndIO.js
import { updateUI, updateSpecialWeaponsUI, showMessage } from './uiAndIO.js'; // Assuming these UI functions will be in uiAndIO.js

// --- Game Object Factories ---

export function createCity(gameState, xRatio) {
    const { canvas, ctx } = gameState;
    const cityWidth = canvas.width * Config.CITY_WIDTH_RATIO;
    const cityHeight = canvas.height * Config.CITY_HEIGHT_RATIO;
    const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);
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

export function createBase(gameState, xRatio) {
    const { canvas, ctx, selectedDifficultyAmmo } = gameState;
    const baseWidth = canvas.width * Config.BASE_WIDTH_RATIO;
    const baseHeight = canvas.height * Config.BASE_HEIGHT_RATIO;
    const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);
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

export function createSatelliteBase(gameState, xRatio, yRatio) {
    const { canvas, ctx, selectedDifficultyAmmo } = gameState;
    const satWidth = canvas.width * Config.SATELLITE_WIDTH_RATIO;
    const satHeight = canvas.height * Config.SATELLITE_HEIGHT_RATIO;
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

export function createIncomingMissile(gameState, config = {}) {
    const { canvas, ctx, currentWave, incomingMissiles } = gameState; // Added incomingMissiles
    const startX = config.startX !== undefined ? config.startX : Math.random() * canvas.width;
    const startY = config.startY !== undefined ? config.startY : 0;
    const target = config.target || Config.getRandomTarget(gameState); // Pass gameState
    let baseSpeed = Config.MISSILE_SPEED_ENEMY_BASE + (currentWave * 0.08);
    baseSpeed = Math.min(baseSpeed, Config.MAX_ENEMY_MISSILE_SPEED);
    const speed = config.speed || baseSpeed * (config.speedFactor || 1.0);
    const angle = Math.atan2(target.y - startY, target.x - startX);
    const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);
    const waveSmartBombChance = Config.SMART_BOMB_CHANCE * (1 + currentWave * 0.05);
    const waveMIRVChance = Config.MIRV_CHANCE * (1 + currentWave * 0.03);
    let isSmartBomb = config.isSmartBomb !== undefined ? config.isSmartBomb : (!config.isMIRV && !config.isSplit && Math.random() < waveSmartBombChance);
    let isMIRV = config.isMIRV !== undefined ? config.isMIRV : (!isSmartBomb && !config.isSplit && Math.random() < waveMIRVChance);
    let isSplit = config.isSplit || false;
    let color = '#ff0000'; let trailColor = 'rgba(255, 100, 100, 0.5)';
    if (isMIRV) { color = Config.MIRV_WARHEAD_COLOR; trailColor = 'rgba(255, 150, 150, 0.5)'; }
    if (isSmartBomb) { color = Config.SMART_BOMB_SPLIT_COLOR; trailColor = 'rgba(255, 200, 100, 0.5)'; }
    if (isSplit) { color = config.color || color; trailColor = config.trailColor || trailColor; }

    // Add the ignoreEnemyObjectsWhenExploding flag, default to false
    const ignoreEnemyObjectsWhenExploding = config.ignoreEnemyObjectsWhenExploding || false;

    return {
        x: startX, y: startY, targetX: target.x, targetY: target.y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, speed: speed, color: color, trailColor: trailColor, alive: true, trail: [{x: startX, y: startY}], isPlaneBomb: false, isSmartBomb: isSmartBomb, isMIRV: isMIRV, isSplit: isSplit, hasSplit: false, wavePartType: config.wavePartType, ignoreEnemyObjectsWhenExploding: ignoreEnemyObjectsWhenExploding, countedAsDestroyed: false, // NEW: Flag for deferred counting

        update() {
            if (!this.alive) return;
            this.x += this.dx; this.y += this.dy; this.trail.push({x: this.x, y: this.y}); if (this.trail.length > 15) { this.trail.shift(); }

            if (this.isMIRV && !this.hasSplit && this.y >= Config.MIRV_SPLIT_ALTITUDE) {
                this.alive = false; this.hasSplit = true;
                // Create an explosion that ignores enemy objects
                createExplosion(gameState, this.x, this.y, Config.EXPLOSION_RADIUS_START * 0.5, this.color, null, null, true);

                for (let i = 0; i < Config.MIRV_WARHEAD_COUNT; i++) {
                    // Use getBaseOrCityTarget for MIRV splits instead of getRandomTarget
                    const warheadTarget = Config.getBaseOrCityTarget(gameState); // Pass gameState
                    gameState.incomingMissiles.push(createIncomingMissile(gameState, { // Pass gameState
                        startX: this.x,
                        startY: this.y,
                        target: warheadTarget,
                        speed: this.speed * Config.MIRV_WARHEAD_SPEED_FACTOR,
                        isSplit: true,
                        isMIRV: false,
                        isSmartBomb: false,
                        color: Config.MIRV_WARHEAD_COLOR,
                        trailColor: 'rgba(255, 150, 150, 0.5)',
                        ignoreEnemyObjectsWhenExploding: true,
                        wavePartType: this.wavePartType
                    }));
                }
                return;
            }

            const splitAltitude = Config.SMART_BOMB_SPLIT_ALTITUDE_MIN + Math.random() * (Config.SMART_BOMB_SPLIT_ALTITUDE_MAX - Config.SMART_BOMB_SPLIT_ALTITUDE_MIN);
            if (this.isSmartBomb && !this.hasSplit && this.y >= splitAltitude) {
                this.alive = false; this.hasSplit = true;
                // Create an explosion that ignores enemy objects
                createExplosion(gameState, this.x, this.y, Config.EXPLOSION_RADIUS_START * 0.4, this.color, null, null, true);

                for (let i = 0; i < Config.SMART_BOMB_SPLIT_COUNT; i++) {
                    // Use getBaseOrCityTarget for smart bomb splits instead of getRandomTarget
                    const splitTarget = Config.getBaseOrCityTarget(gameState); // Pass gameState
                    gameState.incomingMissiles.push(createIncomingMissile(gameState, { // Pass gameState
                        startX: this.x,
                        startY: this.y,
                        target: splitTarget,
                        speed: this.speed * Config.SMART_BOMB_SPLIT_SPEED_FACTOR,
                        isSplit: true,
                        isMIRV: false,
                        isSmartBomb: false,
                        color: Config.SMART_BOMB_SPLIT_COLOR,
                        trailColor: 'rgba(255, 200, 100, 0.5)',
                        ignoreEnemyObjectsWhenExploding: true,
                        wavePartType: this.wavePartType
                    }));
                }
                return;
            }

            if (this.y >= this.targetY || this.y >= groundY) {
                this.alive = false; const impactY = Math.min(this.targetY, groundY); const explosionSizeFactor = this.isSplit ? 0.6 : 1.0;
                createExplosion(gameState, this.x, impactY, (Config.EXPLOSION_RADIUS_MAX_BASE / 2) * explosionSizeFactor, this.color, null, null, this.ignoreEnemyObjectsWhenExploding);
                checkObjectImpact(gameState, this.x, impactY, this.isPlaneBomb);
            }
        },

        draw() {
            if (!this.alive) return; ctx.strokeStyle = this.trailColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y); for (let i = 1; i < this.trail.length; i++) { ctx.lineTo(this.trail[i].x, this.trail[i].y); } ctx.stroke();
            const size = (this.isMIRV || this.isSmartBomb) && !this.hasSplit ? 5 : 4; ctx.fillStyle = this.color; ctx.fillRect(this.x - size/2, this.y - size/2, size, size); if ((this.isMIRV || this.isSmartBomb) && !this.hasSplit && Math.floor(Date.now() / 200) % 2 === 0) { ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fillRect(this.x - size/2 - 1, this.y - size/2 - 1, size + 2, size + 2); }
        }
    };
}

export function createPlayerMissile(gameState, startX, startY, targetX, targetY) {
    const { ctx } = gameState;
    const currentSpeed = Config.getCurrentPlayerMissileSpeed(gameState);
    const angle = Math.atan2(targetY - startY, targetX - startX);
    gameState.statsMissilesFired++;
    playSfx(gameState, 'launch'); // Pass gameState and sound type
    return {
        x: startX, y: startY, targetX: targetX, targetY: targetY, dx: Math.cos(angle) * currentSpeed, dy: Math.sin(angle) * currentSpeed, speed: currentSpeed, color: '#00ff00', trailColor: 'rgba(100, 255, 100, 0.5)', alive: true, trail: [{x: startX, y: startY}],
        update() {
            if (!this.alive) return;
            this.x += this.dx; this.y += this.dy;
            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > 10) { this.trail.shift(); }
            const distToTarget = Config.distance(this.x, this.y, this.targetX, this.targetY);
            if (distToTarget < this.speed || (this.dx * (this.targetX - this.x) + this.dy * (this.targetY - this.y)) < 0) {
                this.alive = false;
                const currentExplosionRadius = Config.getCurrentPlayerExplosionRadius(gameState);
                createExplosion(gameState, this.targetX, this.targetY, Config.EXPLOSION_RADIUS_START, this.color, currentExplosionRadius);
            }
        },
        draw() {
            if (!this.alive) return;
            ctx.strokeStyle = this.trailColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y); for (let i = 1; i < this.trail.length; i++) { ctx.lineTo(this.trail[i].x, this.trail[i].y); } ctx.stroke();
            ctx.fillStyle = this.color; ctx.fillRect(this.x - 1, this.y - 1, 3, 3);
        }
    };
}

export function createExplosion(gameState, x, y, startRadius, color, maxRadius = Config.EXPLOSION_RADIUS_MAX_BASE, duration = Config.EXPLOSION_DURATION, ignoreEnemyObjectsWhenExploding = false) {
    const { ctx, explosions } = gameState;
    const effectiveMaxRadius = maxRadius || Config.getCurrentPlayerExplosionRadius(gameState);
    if (typeof color !== 'string' || (!color.startsWith('#') && !color.startsWith('rgba'))) { color = '#888888'; }
    playExplosionSound(gameState); // Use the specific explosion sound function
    explosions.push({
        x: x, y: y, radius: startRadius, maxRadius: effectiveMaxRadius, duration: duration, currentFrame: 0, color: color, alive: true, collidedMissiles: new Set(), collidedBombs: new Set(), collidedPlanes: new Set(), ignoreEnemyObjectsWhenExploding: ignoreEnemyObjectsWhenExploding, killCount: 0, // NEW: Initialize kill count for combo
        update() {
            if (!this.alive) return;
            this.currentFrame++;
            const expansionPhase = this.duration * 0.6;
            if (this.currentFrame <= expansionPhase) {
                this.radius = startRadius + (this.maxRadius - startRadius) * (this.currentFrame / expansionPhase);
            } else {
                this.radius = this.maxRadius - (this.maxRadius * ((this.currentFrame - expansionPhase) / (this.duration - expansionPhase)));
            }
            this.radius = Math.max(0, this.radius);
            if (this.currentFrame >= this.duration) { this.alive = false; }
            if (this.currentFrame < expansionPhase) { checkExplosionCollisions(gameState, this); } // Pass gameState
        },
        draw() {
            if (!this.alive) return;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            const intensity = Math.sin((this.currentFrame / this.duration) * Math.PI);
            let r = 180, g = 180, b = 180;
            try {
                if (this.color.startsWith('#') && this.color.length >= 7) { r = parseInt(this.color.slice(1, 3), 16); g = parseInt(this.color.slice(3, 5), 16); b = parseInt(this.color.slice(5, 7), 16); }
                else if (this.color.startsWith('rgba')) { const parts = this.color.match(/(\d+),\s*(\d+),\s*(\d+)/); if (parts) { r = parseInt(parts[1]); g = parseInt(parts[2]); b = parseInt(parts[3]); } }
            } catch (e) { console.warn("Could not parse explosion color:", this.color, e); r = 180; g = 180; b = 180; }
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.6})`; ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.3 * intensity, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.8})`; ctx.fill();
        }
    });
}

export function createPlane(gameState) {
    const { canvas, ctx, currentWave, planeBombs } = gameState; // Added planeBombs
    const startY = Config.PLANE_MIN_Y + Math.random() * (Config.PLANE_MAX_Y - Config.PLANE_MIN_Y);
    const bombsToDrop = Config.BASE_BOMBS_PER_PLANE + Math.floor(currentWave / 3) * Config.BOMBS_INCREASE_PER_WAVE;
    const isVariant = Math.random() < Config.PLANE_VARIANT_CHANCE;
    const speedMultiplier = isVariant ? 1.4 : 1.0;
    const planeSpeed = (Config.PLANE_SPEED_BASE + currentWave * Config.PLANE_SPEED_INCREASE_PER_WAVE) * speedMultiplier;
    const bodyColor = isVariant ? '#A9A9A9' : '#B0C4DE';
    const wingColor = isVariant ? '#696969' : '#778899';
    return {
        x: canvas.width + Config.PLANE_WIDTH, y: startY, width: Config.PLANE_WIDTH, height: Config.PLANE_HEIGHT, speed: planeSpeed, alive: true, bombsLeft: bombsToDrop, bombDropTimer: Config.PLANE_BOMB_DROP_INTERVAL_MIN + Math.random() * (Config.PLANE_BOMB_DROP_INTERVAL_MAX - Config.PLANE_BOMB_DROP_INTERVAL_MIN), bodyColor: bodyColor, wingColor: wingColor, tailColor: '#708090', cockpitColor: '#1E90FF', engineColor: '#555555', isVariant: isVariant, wavePartType: 'plane',
        update() {
            if (!this.alive) return;
            this.x -= this.speed;
            this.bombDropTimer--;
            if (this.bombDropTimer <= 0 && this.bombsLeft > 0) {
                this.dropBomb();
                this.bombsLeft--;
                this.bombDropTimer = Config.PLANE_BOMB_DROP_INTERVAL_MIN + Math.random() * (Config.PLANE_BOMB_DROP_INTERVAL_MAX - Config.PLANE_BOMB_DROP_INTERVAL_MIN);
            }
            if (this.x < -this.width * 1.5) { this.alive = false; }
        },
        dropBomb() {
            const bombStartX = this.x + this.width / 2;
            const bombStartY = this.y + this.height * 0.7;
            // Correctly push to the gameState's planeBombs array
            gameState.planeBombs.push(createBomb(gameState, bombStartX, bombStartY));
        },
        draw() {
            if (!this.alive) return;
            const w = this.width; const h = this.height; const x = this.x; const y = this.y;
            ctx.save(); ctx.translate(x, y);
            ctx.fillStyle = this.bodyColor; ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.3); ctx.lineTo(w * 0.85, h * 0.15); ctx.quadraticCurveTo(w, h * 0.5, w * 0.85, h * 0.85); ctx.lineTo(w * 0.1, h * 0.7); ctx.quadraticCurveTo(0, h * 0.5, w * 0.1, h * 0.3); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = this.cockpitColor; ctx.beginPath(); ctx.moveTo(w * 0.7, h * 0.25); ctx.lineTo(w * 0.9, h * 0.4); ctx.lineTo(w * 0.9, h * 0.6); ctx.lineTo(w * 0.7, h * 0.75); ctx.closePath(); ctx.fill();
            ctx.fillStyle = this.wingColor; ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.3); ctx.lineTo(w * 0.6, h * -0.1); ctx.lineTo(w * 0.7, h * 0.1); ctx.lineTo(w * 0.45, h * 0.4); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.7); ctx.lineTo(w * 0.6, h * 1.1); ctx.lineTo(w * 0.7, h * 0.9); ctx.lineTo(w * 0.45, h * 0.6); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#555'; ctx.stroke();
            ctx.fillStyle = this.tailColor; ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.3); ctx.lineTo(w * 0.2, h * -0.1); ctx.lineTo(w * 0.25, h * 0.1); ctx.lineTo(w * 0.1, h * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = this.wingColor; ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.3); ctx.lineTo(w * 0.2, h * 0.1); ctx.lineTo(w * 0.25, h * 0.2); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(w * 0.05, h * 0.7); ctx.lineTo(w * 0.2, h * 0.9); ctx.lineTo(w * 0.25, h * 0.8); ctx.closePath(); ctx.fill();
            ctx.fillStyle = this.engineColor; ctx.fillRect(w * 0.4, h * 0.6, w * 0.25, h * 0.3); ctx.fillRect(w * 0.4, h * 0.1, w * 0.25, h * 0.3);
            ctx.restore();
        }
    };
}

export function createBomb(gameState, startX, startY) {
    const { canvas, ctx, currentWave } = gameState;
    const target = Config.getRandomTarget(gameState); // Pass gameState
    const angle = Math.atan2(target.y - startY, target.x - startX);
    const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);
    const speed = Config.PLANE_BOMB_SPEED + (currentWave * 0.03);
    return {
        x: startX, y: startY, targetX: target.x, targetY: target.y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, color: Config.PLANE_BOMB_COLOR, trailColor: Config.PLANE_BOMB_TRAIL_COLOR, alive: true, trail: [{x: startX, y: startY}], isPlaneBomb: true,
        update() {
            if (!this.alive) return;
            this.x += this.dx; this.y += this.dy;
            this.trail.push({x: this.x, y: this.y});
            if (this.trail.length > 12) { this.trail.shift(); }
            if (this.y >= this.targetY || this.y >= groundY) {
                this.alive = false;
                const impactY = Math.min(this.targetY, groundY);
                createExplosion(gameState, this.x, impactY, Config.EXPLOSION_RADIUS_START * 0.8, this.color, Config.EXPLOSION_RADIUS_MAX_BASE * 0.6); // Pass gameState
                checkObjectImpact(gameState, this.x, impactY, this.isPlaneBomb); // Pass gameState
            }
        },
        draw() {
            if (!this.alive) return;
            ctx.strokeStyle = this.trailColor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y); for (let i = 1; i < this.trail.length; i++) { ctx.lineTo(this.trail[i].x, this.trail[i].y); } ctx.stroke();
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill();
        }
    };
}

export function createShieldBomb(gameState, config = {}) {
    const { canvas, ctx, currentWave } = gameState;
    const type = config.type || Math.floor(Math.random() * 3) + 1; // Random type 1-3 if not specified
    const startX = config.startX !== undefined ? config.startX : Math.random() * canvas.width;
    const startY = config.startY !== undefined ? config.startY : 0;
    const target = config.target || Config.getRandomTarget(gameState); // Pass gameState

    // Shield bombs move slower than regular missiles
    const baseSpeed = config.speed || (Config.MISSILE_SPEED_ENEMY_BASE + (currentWave * 0.05)) * 0.7;
    const angle = Math.atan2(target.y - startY, target.x - startX);
    const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);

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
                createExplosion(gameState, this.x, impactY, Config.EXPLOSION_RADIUS_START * 2, this.color, Config.EXPLOSION_RADIUS_MAX_BASE * 2, Config.EXPLOSION_DURATION * 1.5); // Pass gameState
                checkObjectImpact(gameState, this.x, impactY, false); // Pass gameState
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
export function checkExplosionCollisions(gameState, explosion) {
    const { incomingMissiles, planes, planeBombs, messageBonusText } = gameState;
    let explosionMadeKill = false;

    // Only check collisions with enemy missiles/planes/bombs if ignoreEnemyObjectsWhenExploding is false
    if (!explosion.ignoreEnemyObjectsWhenExploding) {
        incomingMissiles.forEach((missile, index) => {
            if (missile.alive && !explosion.collidedMissiles.has(index)) {
                const dist = Config.distance(explosion.x, explosion.y, missile.x, missile.y);
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
                        createExplosion(gameState, explosion.x, explosion.y, Math.min(explosion.radius * 0.5, 10), impactColor, null, 15, true); // Pass gameState

                        // Check if current layer is destroyed
                        if (missile.currentLayerHits >= missile.hitsPerLayer) {
                            missile.shieldLayers--;
                            missile.currentLayerHits = 0;

                            // Create shield break effect
                            const breakColor = missile.shieldLayers === 2 ? missile.colors.outerShieldColor :
                                              missile.shieldLayers === 1 ? missile.colors.middleShieldColor :
                                              missile.colors.innerShieldColor;
                            createExplosion(gameState, missile.x, missile.y, missile.size * (missile.shieldLayers + 1), breakColor, missile.size * (missile.shieldLayers + 1.5), 30, true); // Pass gameState

                            // If all shields destroyed, explode the shield bomb
                            if (missile.shieldLayers <= 0) {
                                missile.alive = false; // Mark as destroyed
                                explosionMadeKill = true;
                                // Conditional immediate counting
                                if (!gameState.useDeferredKillCounting) {
                                    gameState.statsEnemyMissilesDestroyed++;
                                    gameState.statsShieldBombsDestroyed++;
                                }

                                // Award points (3x normal missile points)
                                let pointsToAdd = Config.POINTS_PER_MISSILE * 3;
                                if (explosion.color === '#00ff00' && dist < Config.ACCURACY_BONUS_THRESHOLD) {
                                    pointsToAdd += Config.ACCURACY_BONUS_POINTS;
                                    gameState.statsAccuracyBonusHits++;
                                    messageBonusText.textContent = `ACCURACY BONUS +$${Math.round(Config.ACCURACY_BONUS_POINTS * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier)}!`;
                                    gameState.accuracyBonusMessageTimer = 120;
                                }

                                const finalPoints = Math.round(pointsToAdd * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier);
                                gameState.score += finalPoints;
                                gameState.gameTotalScore += finalPoints;
                                if (explosion.color === '#00ff00') explosion.killCount++; // Increment kill count for player explosions

                                // Create large explosion
                                createExplosion(gameState, missile.x, missile.y, Config.EXPLOSION_RADIUS_START * 2, missile.color, Config.EXPLOSION_RADIUS_MAX_BASE * 2, Config.EXPLOSION_DURATION * 1.5); // Pass gameState

                                // Spawn 2 smart bombs and 2 MIRVs
                                for (let i = 0; i < 2; i++) {
                                    // Smart bombs - top and bottom
                                    const angle1 = Math.PI / 4 + (i * Math.PI);
                                    const spawnX1 = missile.x + Math.cos(angle1) * 20;
                                    const spawnY1 = missile.y + Math.sin(angle1) * 20;

                                    incomingMissiles.push(createIncomingMissile(gameState, { // Pass gameState
                                        startX: spawnX1,
                                        startY: spawnY1,
                                        isSmartBomb: true,
                                        speed: missile.speed * 1.1,
                                        color: Config.SMART_BOMB_SPLIT_COLOR,
                                        trailColor: 'rgba(255, 200, 100, 0.5)'
                                    }));

                                    // MIRVs - left and right
                                    const angle2 = -Math.PI / 4 + (i * Math.PI);
                                    const spawnX2 = missile.x + Math.cos(angle2) * 20;
                                    const spawnY2 = missile.y + Math.sin(angle2) * 20;

                                    incomingMissiles.push(createIncomingMissile(gameState, { // Pass gameState
                                        startX: spawnX2,
                                        startY: spawnY2,
                                        isMIRV: true,
                                        speed: missile.speed * 1.1,
                                        color: Config.MIRV_WARHEAD_COLOR,
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
                        if (!gameState.useDeferredKillCounting) {
                            gameState.statsEnemyMissilesDestroyed++;
                        }
                        let pointsToAdd = Config.POINTS_PER_MISSILE;
                        if (explosion.color === '#00ff00' && dist < Config.ACCURACY_BONUS_THRESHOLD) {
                            pointsToAdd += Config.ACCURACY_BONUS_POINTS;
                            gameState.statsAccuracyBonusHits++;
                            messageBonusText.textContent = `ACCURACY BONUS +$${Math.round(Config.ACCURACY_BONUS_POINTS * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier)}!`;
                            gameState.accuracyBonusMessageTimer = 120;
                            gameState.comboMessageTimer = 0; /* Clear combo message if accuracy bonus occurs */
                        }
                        const finalPoints = Math.round(pointsToAdd * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier);
                        gameState.score += finalPoints;
                        gameState.gameTotalScore += finalPoints;
                        if (explosion.color === '#00ff00') explosion.killCount++;
                        createExplosion(gameState, missile.x, missile.y, Config.EXPLOSION_RADIUS_START, missile.color); // Pass gameState
                    }
                }
            }
        });

        // Original code for planes and bombs (modified to increment killCount)
        planes.forEach((plane, index) => {
            if (plane.alive && !explosion.collidedPlanes.has(index)) {
                if (explosion.x + explosion.radius > plane.x && explosion.x - explosion.radius < plane.x + plane.width && explosion.y + explosion.radius > plane.y && explosion.y - explosion.radius < plane.y + plane.height) {
                    plane.alive = false;
                    explosion.collidedPlanes.add(index);
                    explosionMadeKill = true;
                    gameState.statsPlanesDestroyed++;
                    const finalPoints = Math.round(Config.PLANE_BONUS_SCORE * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier);
                    gameState.score += finalPoints;
                    gameState.gameTotalScore += finalPoints;
                    if (explosion.color === '#00ff00') explosion.killCount++;
                    createExplosion(gameState, plane.x + plane.width / 2, plane.y + plane.height / 2, Config.EXPLOSION_RADIUS_START * 1.5, plane.bodyColor, Config.EXPLOSION_RADIUS_MAX_BASE * 1.2, Config.EXPLOSION_DURATION * 1.2); // Pass gameState
                }
            }
        });
        planeBombs.forEach((bomb, index) => {
            if (bomb.alive && !explosion.collidedBombs.has(index)) {
                const dist = Config.distance(explosion.x, explosion.y, bomb.x, bomb.y);
                if (dist < explosion.radius) {
                    bomb.alive = false;
                    explosion.collidedBombs.add(index);
                    explosionMadeKill = true;
                    gameState.statsPlaneBombsDestroyed++;
                    const finalPoints = Math.round(Config.PLANE_BOMB_POINTS * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier);
                    gameState.score += finalPoints;
                    gameState.gameTotalScore += finalPoints;
                    if (explosion.color === '#00ff00') explosion.killCount++;
                    createExplosion(gameState, bomb.x, bomb.y, Config.EXPLOSION_RADIUS_START * 0.8, bomb.color); // Pass gameState
                }
            }
        });
    }

    // --- NEW: Combo Bonus Logic ---
    if (explosion.color === '#00ff00' && explosion.killCount > 1) {
        const comboPoints = (explosion.killCount - 1) * Config.COMBO_BONUS_POINTS_PER_EXTRA_KILL;
        const finalComboPoints = Math.round(comboPoints * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier);
        gameState.score += finalComboPoints;
        gameState.gameTotalScore += finalComboPoints;
        messageBonusText.textContent = `COMBO x${explosion.killCount}! +$${finalComboPoints}!`;
        gameState.comboMessageTimer = 120; // Display for 2 seconds
        gameState.accuracyBonusMessageTimer = 0; // Combo message overrides accuracy bonus message
        console.log(`Combo x${explosion.killCount}! Bonus: +$${finalComboPoints}`);
    }
    // --- END Combo Bonus Logic ---


    if (explosionMadeKill && explosion.color === '#00ff00') {
        gameState.consecutiveIntercepts++;
        gameState.scoreMultiplier = Math.min(Config.MULTIPLIER_MAX, 1.0 + Math.floor(gameState.consecutiveIntercepts / Config.MULTIPLIER_INCREASE_INTERVAL));
        updateUI(gameState); // Pass gameState
    }
}

export function checkObjectImpact(gameState, impactX, impactY, isBomb = false) {
    const { canvas, baseShields, bases, satelliteBases, cities } = gameState;
    const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);
    const cityHeight = canvas.height * Config.CITY_HEIGHT_RATIO;
    const baseHeight = canvas.height * Config.BASE_HEIGHT_RATIO;
    let hitOccurred = false;

    for (let i = 0; i < baseShields.length; i++) {
        const shield = baseShields[i];
        if (shield && shield.alive) {
            const base = bases[i];
            const shieldCenterX = base.x + base.width / 2;
            const shieldRadius = Config.BASE_SHIELD_RADIUS_MULTIPLIER * ((base.width / 2) + (canvas.width * Config.CITY_WIDTH_RATIO / 2) + 5);
            const shieldBottomEdgeY = base.y - 15;
            const shieldApexY = shieldBottomEdgeY - shieldRadius * 0.3;
            const startX = shieldCenterX - shieldRadius;
            const endX = shieldCenterX + shieldRadius;
            const shieldWidth = endX - startX;
            if (impactX >= startX && impactX <= endX) {
                let y_on_curve;
                if (shieldWidth > 0) {
                    const t = (impactX - startX) / shieldWidth;
                    const one_minus_t = 1 - t;
                    y_on_curve = (one_minus_t * one_minus_t * shieldBottomEdgeY) + (2 * one_minus_t * t * shieldApexY) + (t * t * shieldBottomEdgeY);
                } else {
                    y_on_curve = shieldBottomEdgeY;
                }
                if (impactY >= y_on_curve) {
                    shield.strength -= Config.SHIELD_DAMAGE_PER_HIT;
                    shield.flashTimer = Config.SHIELD_FLASH_DURATION;
                    if (shield.strength <= 0) {
                        shield.alive = false;
                        createExplosion(gameState, impactX, impactY, Config.EXPLOSION_RADIUS_START * 1.5, '#ffffff'); // Pass gameState
                    } else {
                        createExplosion(gameState, impactX, impactY, Config.EXPLOSION_RADIUS_START * 0.5, Config.SHIELD_FLASH_COLOR); // Pass gameState
                    }
                    return; // Impact absorbed by shield
                }
            }
        }
    }

    for (let i = 0; i < satelliteBases.length; i++) {
        const sat = satelliteBases[i];
        if (sat.alive && sat.shield && sat.shield.alive) {
            const shieldCenterX = sat.x + sat.width / 2;
            const shieldCenterY = sat.y + sat.height / 2;
            const shieldRadiusX = sat.width * 0.6 + 4;
            const shieldRadiusY = sat.height * 0.8 + 4;
            const dx = impactX - shieldCenterX;
            const dy = impactY - shieldCenterY;
            if (((dx * dx) / (shieldRadiusX * shieldRadiusX)) + ((dy * dy) / (shieldRadiusY * shieldRadiusY)) <= 1) {
                sat.shield.strength -= Config.SHIELD_DAMAGE_PER_HIT;
                sat.shield.flashTimer = Config.SHIELD_FLASH_DURATION;
                if (sat.shield.strength <= 0) {
                    sat.shield.alive = false;
                    createExplosion(gameState, impactX, impactY, Config.EXPLOSION_RADIUS_START * 1.2, '#eeeeee'); // Pass gameState
                } else {
                    createExplosion(gameState, impactX, impactY, Config.EXPLOSION_RADIUS_START * 0.5, Config.SHIELD_FLASH_COLOR); // Pass gameState
                }
                return; // Impact absorbed by shield
            }
        }
    }

    satelliteBases.forEach(sat => {
        if (sat.alive && impactX >= sat.x && impactX <= sat.x + sat.width && impactY >= sat.y && impactY <= sat.y + sat.height) {
            sat.alive = false;
            hitOccurred = true;
            createExplosion(gameState, impactX, impactY, Config.EXPLOSION_RADIUS_START, sat.outlineColor); // Pass gameState
        }
    });

    if (impactY >= groundY - cityHeight && impactY < groundY) {
        cities.forEach(city => {
            if (city.alive && impactX >= city.x && impactX <= city.x + city.width) {
                city.alive = false;
                hitOccurred = true;
                gameState.statsCitiesLost++;
            }
        });
    }

    if (impactY >= groundY - baseHeight && impactY < groundY) {
        bases.forEach(base => {
            if (base.alive && impactX >= base.x && impactX <= base.x + base.width) {
                base.alive = false;
                hitOccurred = true;
                gameState.statsBasesLost++;
            }
        });
    }

    if (hitOccurred) {
        gameState.consecutiveIntercepts = 0;
        gameState.scoreMultiplier = 1.0;
        updateUI(gameState); // Pass gameState
    }
}


// --- Wave System Logic ---
function defineWaves() {
    return [
        [{ type: 'missile', count: 22, speedFactor: 1.1 }, { type: 'plane', count: 1 }], // Wave 1
        [{ type: 'missile', count: 28, speedFactor: 1.15 }, { type: 'plane', count: 1 }, { type: 'shield_bomb', count: 1, bombType: 1, speedFactor: 0.65 }], // Wave 2
        [{ type: 'missile', count: 33, speedFactor: 1.2 }, { type: 'plane', count: 3, variantChance: 0.1 }, { type: 'shield_bomb', count: 1, bombType: 1, speedFactor: 0.75 }], // Wave 3
        [{ type: 'missile', count: 24, speedFactor: 1.25 }, { type: 'plane', count: 4, variantChance: 0.2 }, { type: 'smart_bomb', count: 5, speedFactor: 1.0 }, { type: 'shield_bomb', count: 1, bombType: 2, speedFactor: 0.80 }], // Wave 4
        [{ type: 'missile', count: 26, speedFactor: 1.25 }, { type: 'plane', count: 6, variantChance: 0.2 }, { type: 'smart_bomb', count: 7, speedFactor: 1.1 }, { type: 'shield_bomb', count: 1, bombType: 3, speedFactor: 0.85 }], // Wave 5
        [{ type: 'missile', count: 28, speedFactor: 1.35 }, { type: 'plane', count: 8, variantChance: 0.2 }, { type: 'mirv', count: 7, speedFactor: 1.0 }, { type: 'shield_bomb', count: 2, speedFactor: 0.85 }], // Wave 6
        [{ type: 'missile', count: 31, speedFactor: 1.40 }, { type: 'smart_bomb', count: 7, speedFactor: 1.15 }, { type: 'plane', count: 9, variantChance: 0.35, speedFactor: 1.1 }, { type: 'shield_bomb', count: 2, speedFactor: 0.90 }], // Wave 7
        [{ type: 'missile', count: 36, speedFactor: 1.45 }, { type: 'mirv', count: 16, speedFactor: 1.15 }, { type: 'smart_bomb', count: 7, speedFactor: 1.2 }, { type: 'shield_bomb', count: 3, speedFactor: 0.95 }], // Wave 8
        [{ type: 'missile', count: 35, speedFactor: 1.5 }, { type: 'smart_bomb', count: 7, speedFactor: 1.35 }, { type: 'mirv', count: 5, speedFactor: 1.25 }, { type: 'plane', count: 9, variantChance: 0.5, speedFactor: 1.2 }, { type: 'shield_bomb', count: 3, speedFactor: 0.95 }], // Wave 9
        [{ type: 'missile', count: 38, speedFactor: 1.6 }, { type: 'smart_bomb', count: 7, speedFactor: 1.5 }, { type: 'mirv', count: 6, speedFactor: 1.4 }, { type: 'plane', count: 10, variantChance: 0.6, speedFactor: 1.3 }, { type: 'shield_bomb', count: 3, speedFactor: 1.0 }], // Wave 10
        [{ type: 'missile', count: 38, speedFactor: 1.7 }, { type: 'smart_bomb', count: 7, speedFactor: 1.6 }, { type: 'mirv', count: 7, speedFactor: 1.5 }, { type: 'plane', count: 12, variantChance: 0.7, speedFactor: 1.4 }, { type: 'shield_bomb', count: 2, bombType: 1, speedFactor: 1.05 }, { type: 'shield_bomb', count: 2, bombType: 2, speedFactor: 1.05 }, { type: 'shield_bomb', count: 2, bombType: 3, speedFactor: 1.10 }], // Wave 11
    ];
}

const baseWaveDefinitions = defineWaves();

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

const extendedWaveDefinitions = generateExtendedWaveDefinitions(baseWaveDefinitions, 100);

export function initWave(gameState, waveIndex) {
    try {
        console.log(`initWave: Entered for wave ${waveIndex}`);
        gameState.currentWave = waveIndex;
        gameState.waveTimer = 0; // Reset wave timer
        gameState.waveStartTime = Date.now(); // ADDED: Start wave timer

        // Use extended wave definitions when possible
        // For waves 1-100, use the pre-calculated definitions
        if (waveIndex < extendedWaveDefinitions.length) {
            console.log(`initWave: Using pre-defined wave configuration for wave ${waveIndex + 1}`);
            gameState.currentWaveConfig = JSON.parse(JSON.stringify(extendedWaveDefinitions[waveIndex]));
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
            gameState.currentWaveConfig = JSON.parse(JSON.stringify(extendedWaveDefinitions[baseWaveIndex]));
            gameState.currentWaveConfig.forEach(part => {
                part.count = Math.ceil(part.count * scalingFactor);
                if (part.speedFactor) {
                    part.speedFactor = Math.min(3.0, part.speedFactor * scalingFactor);
                }
            });

            console.log(`initWave: Dynamically scaled wave ${waveIndex + 1} with factor ${scalingFactor.toFixed(2)}`);
        }

        // Rest of your existing initWave code...
        // Clear game objects
        gameState.incomingMissiles = [];
        gameState.playerMissiles = [];
        gameState.explosions = [];
        gameState.activeSonicWave = null;
        gameState.planes = [];
        gameState.planeBombs = [];
        gameState.waveEnemiesSpawned = 0;

        // Calculate with better error handling
        gameState.waveEnemiesRequired = 0;
        gameState.currentWaveConfig.forEach(part => {
            if (typeof part === 'object' && part !== null && typeof part.count === 'number') {
                gameState.waveEnemiesRequired += part.count;
            } else {
                console.warn(`Skipping invalid part in wave config ${waveIndex}:`, part);
            }
        });

        // Ensure we have at least some enemies
        if (gameState.waveEnemiesRequired <= 0) {
            console.warn(`Warning: waveEnemiesRequired calculated as ${gameState.waveEnemiesRequired}, setting to default 20`);
            gameState.waveEnemiesRequired = 20;
        }

        console.log(`initWave: waveEnemiesRequired = ${gameState.waveEnemiesRequired}`);

        // Refresh base ammo
        gameState.bases.forEach(b => { if (b.alive) b.ammo = gameState.selectedDifficultyAmmo; });
        gameState.satelliteBases.forEach(s => { if (s.alive) s.ammo = gameState.selectedDifficultyAmmo; });

        updateUI(gameState); // Pass gameState
        updateSpecialWeaponsUI(gameState); // Pass gameState

        console.log(`initWave: Exiting for wave ${waveIndex}`);
    } catch (error) {
        console.error(`Error during initWave(${waveIndex}):`, error);
        showMessage(gameState, "WAVE INIT ERROR", `Failed to initialize wave ${waveIndex + 1}: ${error.message}`, "Check console for details."); // Pass gameState
        gameState.isGameOver = true;
        if (gameState.gameLoopId) {
            cancelAnimationFrame(gameState.gameLoopId);
            gameState.gameLoopId = null;
        }
    }
}

export function spawnEnemiesForWave(gameState) {
    const { transitioningWave, isGameOver, isPaused, waveEnemiesSpawned, waveEnemiesRequired, currentWaveConfig, currentWave, incomingMissiles, planes } = gameState;
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
            if (part.type === 'plane') { baseSpawnChance = Config.PLANE_SPAWN_CHANCE; }
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
                let baseSpeed = Config.MISSILE_SPEED_ENEMY_BASE + (currentWave * 0.08);
                baseSpeed = Math.min(baseSpeed, Config.MAX_ENEMY_MISSILE_SPEED);
                let config = {
                    speed: baseSpeed * Math.min(3.0, part.speedFactor || 1.0),
                    isSmartBomb: missileType === 'smart_bomb',
                    isMIRV: missileType === 'mirv',
                    wavePartType: part.type
                };
                incomingMissiles.push(createIncomingMissile(gameState, config)); // Pass gameState
                gameState.waveEnemiesSpawned++;
            }
            else if (part.type === 'shield_bomb') {
                // Shield bomb creation - with fixed wavePartType
                let baseSpeed = (Config.MISSILE_SPEED_ENEMY_BASE + (currentWave * 0.05)) * 0.7; // Shield bombs move slower
                baseSpeed = Math.min(baseSpeed, Config.MAX_ENEMY_MISSILE_SPEED * 0.7);

                const shieldBomb = createShieldBomb(gameState, { // Pass gameState
                    type: part.bombType || Math.floor(Math.random() * 3) + 1, // Random type if not specified
                    speed: baseSpeed * Math.min(3.0, part.speedFactor || 1.0)
                    // NOTE: wavePartType is now hardcoded in the createShieldBomb function
                });

                incomingMissiles.push(shieldBomb);
                gameState.waveEnemiesSpawned++;

                // DEBUG: Log when a shield bomb is spawned
                if (currentWave <= 5) {
                    const currentShieldBombs = incomingMissiles.filter(m => m.isShieldBomb).length;
                    console.log(`Added shield bomb of type ${shieldBomb.shieldBombType}. Current count: ${currentShieldBombs}`);
                }
            }
            else if (part.type === 'plane') {
                const newPlane = createPlane(gameState); // Pass gameState
                newPlane.wavePartType = part.type;
                planes.push(newPlane);
                gameState.waveEnemiesSpawned++;
            }
        }
    }

    // Force wave completion when we've spawned enough enemies
    // This is an additional safeguard
    if (gameState.waveEnemiesSpawned >= gameState.waveEnemiesRequired && gameState.waveAllSpawnedTimestamp === 0) { // Check if timestamp not already set
        gameState.waveAllSpawnedTimestamp = Date.now(); // Record timestamp when last enemy is spawned
        console.log(`All required enemies (${gameState.waveEnemiesRequired}) spawned for wave ${currentWave + 1} at ${gameState.waveAllSpawnedTimestamp}`);
    }
}

export function checkWaveEnd(gameState, nextWaveCallback) { // Added nextWaveCallback
    const { transitioningWave, isGameOver, isPaused, waveEnemiesRequired, waveEnemiesSpawned, waveTimer, incomingMissiles, planes, planeBombs, explosions, activeSonicWave, canvas, currentWave } = gameState;
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
        gameState.transitioningWave = true;
        nextWaveCallback(); // Call the callback from main.js
    } else if (offScreenCompletion) {
        // Log which objects were stuck off-screen for debugging
        if (activeOffScreenEnemies > 0) console.warn(`Found ${activeOffScreenEnemies} enemies stuck off-screen.`);
        if (activeOffScreenExplosions > 0) console.warn(`Found ${activeOffScreenExplosions} explosions stuck off-screen.`);
        console.warn(`Wave ${currentWave + 1} force-completed due to only off-screen objects remaining!`);
        gameState.transitioningWave = true;
        nextWaveCallback(); // Call the callback from main.js
    } else if (allEnemiesSpawned && waveTimer > 7200) { // INCREASED Timeout safety net (120 seconds after all spawned)
        console.warn(`Wave ${currentWave + 1} force-completed due to cleanup timeout! ` +
                      `Spawned: ${waveEnemiesSpawned}/${waveEnemiesRequired}, ` +
                      `Remaining On-Screen Enemies: ${activeOnScreenEnemies}, ` +
                     `Remaining Off-Screen Enemies: ${activeOffScreenEnemies}, ` +
                     `Remaining On-Screen Explosions: ${activeOnScreenExplosions}`);
        gameState.transitioningWave = true;
        nextWaveCallback(); // Call the callback from main.js
    }
}


// --- Game Flow ---
export function calculateBonus(gameState) {
    const { cities, bases, satelliteBases } = gameState;
    let bonus = 0;
    cities.forEach(city => { if (city.alive) bonus += Config.POINTS_PER_CITY; });
    bases.forEach(base => { if (base.alive) bonus += base.ammo * Config.POINTS_PER_AMMO; });
    satelliteBases.forEach(sat => { if (sat.alive) bonus += sat.ammo * Config.POINTS_PER_AMMO; });
    return bonus;
}

export function checkGameOverConditions(gameState, gameOverCallback) { // Added gameOverCallback
    const { isGameOver, gameHasStarted, bases, cities, satelliteBases } = gameState;
    if (isGameOver || !gameHasStarted) return;
    const basesRemaining = bases.filter(b => b.alive).length;
    const citiesRemaining = cities.filter(c => c.alive).length;
    const satellitesRemaining = satelliteBases.filter(s => s.alive).length;
    if (citiesRemaining === 0 || (basesRemaining === 0 && satellitesRemaining === 0)) {
        gameOverCallback(); // Call the callback from main.js
    }
}


// --- Update Functions ---
export function updateGameObjects(gameState) {
    const { incomingMissiles, playerMissiles, explosions, planes, planeBombs, activeSonicWave, useDeferredKillCounting } = gameState;
    // Increment wave timer
    gameState.waveTimer++;

    spawnEnemiesForWave(gameState); // Pass gameState
    if (activeSonicWave && activeSonicWave.alive) {
         activeSonicWave.y -= Config.SONIC_WAVE_SPEED;
         const waveTop = activeSonicWave.y - Config.SONIC_WAVE_HEIGHT;
         const waveBottom = activeSonicWave.y;
         incomingMissiles.forEach(missile => {
             if (missile.alive && missile.y >= waveTop && missile.y <= waveBottom) {
                 missile.alive = false; // Mark as destroyed
                 // Conditional immediate counting
                 if (!useDeferredKillCounting) {
                     if (missile.isShieldBomb) {
                         gameState.statsShieldBombsDestroyed++;
                     }
                     gameState.statsEnemyMissilesDestroyed++;
                 }
                 const finalPoints = Math.round(Config.POINTS_PER_MISSILE * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier);
                 gameState.score += finalPoints;
                 gameState.gameTotalScore += finalPoints;
                 createExplosion(gameState, missile.x, missile.y, Config.EXPLOSION_RADIUS_START, missile.color); // Pass gameState
             }
         });
         planeBombs.forEach(bomb => {
             if (bomb.alive && bomb.y >= waveTop && bomb.y <= waveBottom) {
                 bomb.alive = false;
                 gameState.statsPlaneBombsDestroyed++;
                 const finalPoints = Math.round(Config.PLANE_BOMB_POINTS * gameState.scoreMultiplier * gameState.difficultyScoreMultiplier);
                 gameState.score += finalPoints;
                 gameState.gameTotalScore += finalPoints;
                 createExplosion(gameState, bomb.x, bomb.y, Config.EXPLOSION_RADIUS_START * 0.8, bomb.color); // Pass gameState
             }
         });
         if (waveTop <= 0) {
             activeSonicWave.alive = false;
             gameState.activeSonicWave = null; // Update gameState directly
             updateSpecialWeaponsUI(gameState); // Pass gameState
         }
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
                    gameState.statsShieldBombsDestroyed++;
                }
                gameState.statsEnemyMissilesDestroyed++;
                missile.countedAsDestroyed = true; // Mark as counted
            }
        });
        // Note: Plane bombs are counted immediately in their collision check,
        // as they don't have the same potential for multiple hits within a frame.
    }
    // --- END Deferred Kill Counting Logic ---

    // Filter dead objects (update gameState arrays directly)
    gameState.incomingMissiles = incomingMissiles.filter(missile => missile.alive);
    gameState.playerMissiles = playerMissiles.filter(missile => missile.alive);
    gameState.explosions = explosions.filter(explosion => explosion.alive);
    gameState.planes = planes.filter(plane => plane.alive);
    gameState.planeBombs = planeBombs.filter(bomb => bomb.alive);

    // Update message timers
    if (gameState.accuracyBonusMessageTimer > 0) {
         gameState.accuracyBonusMessageTimer--;
         if (gameState.accuracyBonusMessageTimer === 0 && gameState.comboMessageTimer === 0) { // Only clear if combo message is also done
             gameState.messageBonusText.textContent = "";
         }
    }
    if (gameState.comboMessageTimer > 0) { // NEW: Handle combo message timer
         gameState.comboMessageTimer--;
         if (gameState.comboMessageTimer === 0 && gameState.accuracyBonusMessageTimer === 0) { // Only clear if accuracy message is also done
              gameState.messageBonusText.textContent = "";
          }
     }
 }


// --- Drawing Functions ---
export function initializeStars(gameState) {
  const { canvas } = gameState;
  gameState.stars = []; // Clear any existing stars
  const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);
  const numStars = Math.floor(canvas.width * canvas.height / 5000);

  for (let i = 0; i < numStars; i++) {
    gameState.stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * groundY,
      radius: 0.3 + Math.random() * 1.2, // Base radius between 0.3 and 1.5
      twinkleSpeed: 0.3 + Math.random() * 0.7, // Random speed for twinkling
      twinkleOffset: Math.random() * Math.PI * 2 // Random starting phase
    });
  }
}

export function drawBackground(gameState) {
  const { ctx, canvas, stars } = gameState;
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
  const groundY = canvas.height - (canvas.height * Config.GROUND_HEIGHT_RATIO);
  ctx.fillStyle = '#3b2e1a';
  ctx.fillRect(0, groundY, canvas.width, canvas.height * Config.GROUND_HEIGHT_RATIO);
}

export function drawGameObjects(gameState) {
    const { ctx, canvas, cities, bases, satelliteBases, baseShields, activeSonicWave, incomingMissiles, playerMissiles, explosions, planes, planeBombs } = gameState;
    cities.forEach(city => city.draw());
    bases.forEach(base => base.draw());
    satelliteBases.forEach(sat => {
        sat.draw();
        if (sat.shield && sat.shield.alive) {
            const shieldCenterX = sat.x + sat.width / 2;
            const shieldCenterY = sat.y + sat.height / 2;
            const shieldRadiusX = sat.width * 0.6 + 4;
            const shieldRadiusY = sat.height * 0.8 + 4;
            let shieldColor = Config.SHIELD_COLOR_25;
            if (sat.shield.strength > 75) shieldColor = Config.SHIELD_COLOR_FULL;
            else if (sat.shield.strength > 50) shieldColor = Config.SHIELD_COLOR_75;
            else if (sat.shield.strength > 25) shieldColor = Config.SHIELD_COLOR_50;
            if (sat.shield.flashTimer > 0) { shieldColor = Config.SHIELD_FLASH_COLOR; sat.shield.flashTimer--; }
            ctx.beginPath(); ctx.ellipse(shieldCenterX, shieldCenterY, shieldRadiusX, shieldRadiusY, 0, 0, Math.PI * 2); ctx.strokeStyle = shieldColor; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
        }
    });
    for (let i = 0; i < baseShields.length; i++) {
        const shield = baseShields[i];
        if (shield && shield.alive) {
            const base = bases[i];
            const shieldCenterX = base.x + base.width / 2;
            const shieldRadius = Config.BASE_SHIELD_RADIUS_MULTIPLIER * ((base.width / 2) + (canvas.width * Config.CITY_WIDTH_RATIO / 2) + 5);
            let shieldColor = Config.SHIELD_COLOR_25;
            if (shield.strength > 75) shieldColor = Config.SHIELD_COLOR_FULL;
            else if (shield.strength > 50) shieldColor = Config.SHIELD_COLOR_75;
            else if (shield.strength > 25) shieldColor = Config.SHIELD_COLOR_50;
            if (shield.flashTimer > 0) { shieldColor = Config.SHIELD_FLASH_COLOR; shield.flashTimer--; }
            const startX = shieldCenterX - shieldRadius;
            const endX = shieldCenterX + shieldRadius;
            const shieldTopY = base.y - 15;
            const controlY = shieldTopY - shieldRadius * 0.3;
            ctx.beginPath(); ctx.moveTo(startX, shieldTopY); ctx.quadraticCurveTo(shieldCenterX, controlY, endX, shieldTopY); ctx.strokeStyle = shieldColor; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 1;
        }
    }
    if (activeSonicWave && activeSonicWave.alive) {
        ctx.fillStyle = Config.SONIC_WAVE_COLOR;
        ctx.fillRect(0, activeSonicWave.y - Config.SONIC_WAVE_HEIGHT, canvas.width, Config.SONIC_WAVE_HEIGHT);
        ctx.strokeStyle = 'rgba(255, 100, 255, 0.8)'; ctx.lineWidth = 1;
        const numLines = 5;
        for(let i=0; i < numLines; i++) {
            const lineY = activeSonicWave.y - (Config.SONIC_WAVE_HEIGHT / numLines * (i + 0.5));
            ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(canvas.width, lineY); ctx.stroke();
        }
    }
    incomingMissiles.forEach(missile => missile.draw());
    playerMissiles.forEach(missile => missile.draw());
    explosions.forEach(explosion => explosion.draw());
    planes.forEach(plane => plane.draw());
    planeBombs.forEach(bomb => bomb.draw());
}
