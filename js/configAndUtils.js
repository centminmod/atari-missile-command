// --- Game Constants ---
export const INTERNAL_WIDTH = 800;
export const INTERNAL_HEIGHT = 600;
export const GROUND_HEIGHT_RATIO = 10 / INTERNAL_HEIGHT;
export const BASE_WIDTH_RATIO = 40 / INTERNAL_WIDTH;
export const BASE_HEIGHT_RATIO = 40 / INTERNAL_HEIGHT;
export const CITY_WIDTH_RATIO = 50 / INTERNAL_WIDTH;
export const CITY_HEIGHT_RATIO = 30 / INTERNAL_HEIGHT;
export const SATELLITE_WIDTH_RATIO = 35 / INTERNAL_WIDTH;
export const SATELLITE_HEIGHT_RATIO = 25 / INTERNAL_HEIGHT;
export const SATELLITE_Y_POS_RATIO = (INTERNAL_HEIGHT * 0.55) / INTERNAL_HEIGHT;
export const MISSILE_SPEED_PLAYER_BASE = 5;
export const MISSILE_SPEED_ENEMY_BASE = 0.4;
export const MAX_ENEMY_MISSILE_SPEED = 3.25;
export const EXPLOSION_RADIUS_START = 13;
export const EXPLOSION_RADIUS_MAX_BASE = 65;
export const EXPLOSION_DURATION = 60;
export const POINTS_PER_MISSILE = 100;
export const POINTS_PER_CITY = 1000;
export const POINTS_PER_AMMO = 10;
export const BONUS_FIRE_SPREAD = 8;
export const BASE_SHIELD_RADIUS_MULTIPLIER = 2.45;
export const SHIELD_STRENGTH_START = 150;
export const SHIELD_DAMAGE_PER_HIT = 10;
export const SHIELD_COLOR_FULL = 'rgba(0, 150, 255, 0.6)';
export const SHIELD_COLOR_75 = 'rgba(0, 255, 150, 0.6)';
export const SHIELD_COLOR_50 = 'rgba(255, 255, 0, 0.6)';
export const SHIELD_COLOR_25 = 'rgba(255, 100, 0, 0.6)';
export const SHIELD_FLASH_COLOR = 'rgba(255, 255, 255, 0.8)';
export const SHIELD_FLASH_DURATION = 5;
export const BOMB_EXPLOSION_RADIUS_MULTIPLIER = 5.5;
export const BOMB_EXPLOSION_DURATION_MULTIPLIER = 1.5;
export const SONIC_WAVE_SPEED = 3.5;
export const SONIC_WAVE_HEIGHT = 10;
export const SONIC_WAVE_COLOR = 'rgba(200, 0, 255, 0.5)';
export const ACCURACY_BONUS_THRESHOLD = 20;
export const ACCURACY_BONUS_POINTS = 25;
export const MULTIPLIER_INCREASE_INTERVAL = 5;
export const MULTIPLIER_MAX = 5.0;
export const COST_FASTER_MISSILE_BASE = 10000;
export const COST_WIDER_EXPLOSION_BASE = 10000;
export const UPGRADE_COST_MULTIPLIER = 1.55;
export const MAX_UPGRADE_LEVEL = 15;
export const MISSILE_SPEED_INCREASE_PER_LEVEL = 0.9;
export const EXPLOSION_RADIUS_INCREASE_PER_LEVEL = 8;
export const SMART_BOMB_CHANCE = 0.05;
export const SMART_BOMB_SPLIT_ALTITUDE_MIN = INTERNAL_HEIGHT * 0.45;
export const SMART_BOMB_SPLIT_ALTITUDE_MAX = INTERNAL_HEIGHT * 0.65;
export const SMART_BOMB_SPLIT_COUNT = 3;
export const SMART_BOMB_SPLIT_SPEED_FACTOR = 0.7;
export const SMART_BOMB_SPLIT_COLOR = '#ff8800';
export const MIRV_CHANCE = 0.10;
export const MIRV_SPLIT_ALTITUDE = INTERNAL_HEIGHT * 0.35;
export const MIRV_WARHEAD_COUNT = 4;
export const MIRV_WARHEAD_SPEED_FACTOR = 0.9;
export const MIRV_WARHEAD_COLOR = '#ff4444';
export const COMBO_BONUS_POINTS_PER_EXTRA_KILL = 15; // Points per extra kill in a combo
export const PLANE_SPEED_INCREASE_PER_WAVE = 0.05;
export const PLANE_VARIANT_CHANCE = 0.2;
export const MAX_ACTIVE_SATELLITES = 3;
export const COST_SATELLITE = 100000;
export const MAX_STOCK_SATELLITE = 100;
export const COST_BASE = 50000;
export const MAX_STOCK_BASE = 100;
export const COST_CITY = 100000;
export const MAX_STOCK_CITY = 100;
export const COST_SHIELD = 50000;
export const MAX_STOCK_SHIELD = 100;
export const COST_SAT_SHIELD = 50000;
export const MAX_STOCK_SAT_SHIELD = 100;
export const COST_SONIC_WAVE = 20000;
export const MAX_STOCK_SONIC_WAVE = 100;
export const COST_BOMB = 10000;
export const MAX_STOCK_BOMB = 100;
export const PLANE_SPEED_BASE = 1.5;
export const PLANE_WIDTH = 50;
export const PLANE_HEIGHT = 20;
export const PLANE_BONUS_SCORE = 2000;
export const PLANE_BOMB_POINTS = 10;
export const PLANE_BOMB_SPEED = 1.0;
export const BASE_BOMBS_PER_PLANE = 20;
export const BOMBS_INCREASE_PER_WAVE = 1;
export const PLANE_SPAWN_CHANCE = 0.025;
export const PLANE_MIN_Y = INTERNAL_HEIGHT * 0.1;
export const PLANE_MAX_Y = INTERNAL_HEIGHT * 0.3;
export const PLANE_BOMB_DROP_INTERVAL_MIN = 75;
export const PLANE_BOMB_DROP_INTERVAL_MAX = 150;
export const PLANE_BOMB_COLOR = '#FFA500';
export const PLANE_BOMB_TRAIL_COLOR = 'rgba(255, 165, 0, 0.4)';
export const RETICLE_SPEED = 8;
export const FRAME_SAMPLE_SIZE = 60; // Number of frames to sample for performance

// --- Audio File Paths ---
export const audioFilePaths = {
    music: 'audio/music-lowest.mp3',
    launch: 'audio/launch.mp3',
    explosion: 'audio/explosion.mp3'
};

// --- Utility Functions ---
export function distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getRandomTarget(gameState, avoidX = -1, avoidRadius = 0) {
    const { cities, bases, satelliteBases, canvas } = gameState;
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

export function getBaseOrCityTarget(gameState) {
    const { cities, bases, satelliteBases, canvas } = gameState;
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


export function getCurrentPlayerMissileSpeed(gameState) {
    return MISSILE_SPEED_PLAYER_BASE + (gameState.playerMissileSpeedLevel * MISSILE_SPEED_INCREASE_PER_LEVEL);
}

export function getCurrentPlayerExplosionRadius(gameState) {
    return EXPLOSION_RADIUS_MAX_BASE + (gameState.explosionRadiusLevel * EXPLOSION_RADIUS_INCREASE_PER_LEVEL);
}

export function calculateUpgradeCost(baseCost, level) {
    return Math.floor(baseCost * Math.pow(UPGRADE_COST_MULTIPLIER, level));
}

export function formatDuration(totalSeconds) {
    if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) {
        return 'N/A';
    }
    if (totalSeconds === 0) {
        return '0s';
    }

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    // Round seconds *up* as requested
    const seconds = Math.ceil(totalSeconds % 60);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    // Show seconds if > 0 or if it's the only unit, or if totalSeconds < 60
    if (seconds > 0 || parts.length === 0 || totalSeconds < 60) parts.push(`${seconds}s`);

    return parts.join(' ');
}

/**
 * Deterministically serialize an object with sorted keys (for signature).
 * Handles only plain objects and primitives (no circular refs).
 */
export function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',')}}`;
}
