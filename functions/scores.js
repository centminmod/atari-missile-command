/**
 * Cloudflare Function to handle leaderboard GET and POST requests.
 *
 * Environment variables:
 * - LEADERBOARD_KV: The KV namespace binding for storing scores.
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (domains)
 * - SCORE_SECRET_KEY: Secret key used for score signature verification
 */

// Key to store the scores array in KV
const SCORES_KEY = 'topScores';
// Maximum number of scores to store persistently in the KV store
const MAX_SCORES_TO_STORE = 1000; // Changed from 10 to 1000
// Default number of scores to return in a GET request if no limit is specified
const DEFAULT_SCORES_TO_RETURN = 10; // Added for clarity
// Maximum number of scores that can be requested via the 'limit' parameter in a GET request
const MAX_SCORES_TO_RETURN = 1000; // Added limit for GET requests

// Helper function to handle CORS
function handleCors(request, env) {
  // Get allowed origins from environment variables
  const allowedOriginsStr = env.ALLOWED_ORIGINS || 'https://missile-command-game.centminmod.com';
  const allowedOrigins = allowedOriginsStr.split(',').map(origin => origin.trim());
  
  // Get the requesting origin
  const requestOrigin = request.headers.get('Origin');
  
  // Set default (fallback) origin
  let corsOrigin = 'https://missile-command-game.centminmod.com';
  
  // Check if the request origin is in our allowed list
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    corsOrigin = requestOrigin;
  }
  
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Vary': 'Origin'
  };
}

// Verify the signature of submitted score data
async function verifyScoreSignature(scoreData, signature, secretKey) {
  if (!secretKey) {
    console.error('Missing SCORE_SECRET_KEY environment variable');
    return false;
  }
  
  // Recreate the expected signature
  const dataToHash = `${scoreData.name}-${scoreData.score}-${scoreData.wave}-${secretKey}`;
  
  // Hash using the same algorithm
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex for comparison
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Compare signatures
  return signature === expectedSignature;
}

export async function onRequest(context) {
  // Environment variable is available on context.env
  const { request, env } = context;
  const kvStore = env.LEADERBOARD_KV;

  // Check if the KV namespace binding is configured
  if (!kvStore) {
    console.error('KV Namespace (LEADERBOARD_KV) not bound.');
    return new Response('KV Namespace (LEADERBOARD_KV) not bound.', { status: 500 });
  }

  try {
    // Handle preflight OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      const corsHeaders = handleCors(request, env);
      return new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400' // 24 hours
        },
        status: 204
      });
    }
    
    // Handle GET requests (fetching scores)
    if (request.method === 'GET') {
      console.log('GET request received for scores');

      // --- Get limit from query parameter ---
      const url = new URL(request.url);
      let limit = parseInt(url.searchParams.get('limit'), 10); // Get 'limit' from ?limit=X

      // Validate or set default limit
      if (isNaN(limit) || limit <= 0) {
        limit = DEFAULT_SCORES_TO_RETURN; // Default to 10 if invalid or not provided
      }
      // Ensure the requested limit does not exceed the maximum allowed
      limit = Math.min(limit, MAX_SCORES_TO_RETURN); // Cap at maximum

      console.log(`Requesting top ${limit} scores`);

      // Retrieve scores from KV store
      const storedScores = await kvStore.get(SCORES_KEY, { type: 'json' });
      let scores = storedScores || []; // Default to empty array if no scores exist

      // Slice the scores array based on the requested limit *before* returning
      scores = scores.slice(0, limit);

      console.log(`Returning top ${scores.length} scores:`, JSON.stringify(scores));

      // Get CORS headers
      const corsHeaders = handleCors(request, env);

      // Return the (potentially sliced) scores array as JSON
      return new Response(JSON.stringify(scores), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200,
      });

    // Handle POST requests (submitting a new score)
    } else if (request.method === 'POST') {
      console.log('POST request received to submit score');
      let newScoreEntry;

      // Try parsing the JSON body of the request
      try {
        newScoreEntry = await request.json();
        console.log('Received score entry:', JSON.stringify(newScoreEntry));
        
        // Verify signature if secret key is available
        if (env.SCORE_SECRET_KEY) {
          console.log('SCORE_SECRET_KEY found, attempting signature verification...'); // ADDED: Confirmation log
          if (!newScoreEntry.signature) {
            console.warn('Missing signature in score submission');
            return new Response('Missing signature', { status: 403 });
          }
          
          const isValid = await verifyScoreSignature(
            newScoreEntry, 
            newScoreEntry.signature, 
            env.SCORE_SECRET_KEY
          );
          
          if (!isValid) {
            console.error('Invalid signature for score submission');
            return new Response('Invalid signature', { status: 403 });
          }
          
          console.log('Score signature verified successfully');
        } else {
          console.warn('SCORE_SECRET_KEY not configured, signature verification skipped');
        }
      } catch (e) {
        console.error('Failed to parse request body:', e);
        return new Response('Invalid JSON body.', { status: 400 });
      }

      // Basic validation of the received score entry structure
      if (!newScoreEntry || typeof newScoreEntry.name !== 'string' || typeof newScoreEntry.score !== 'number') {
        console.warn('Invalid score entry format:', JSON.stringify(newScoreEntry));
        return new Response('Invalid score entry format. Required: { "name": string, "score": number, "wave": optional number }', { status: 400 });
      }
      // Enforce presence of stats object for all submissions
      if (!newScoreEntry.stats || typeof newScoreEntry.stats !== 'object') {
        console.warn('Missing or invalid stats object in score submission:', JSON.stringify(newScoreEntry));
        return new Response('Score submission must include a valid stats object.', { status: 400 });
      }

      // Sanitize the player name: trim whitespace, limit length, uppercase, allow specific characters
      const name = newScoreEntry.name.trim().substring(0, 18).toUpperCase().replace(/[^A-Z0-9\s_-]/g, '');
      // Sanitize the score: ensure it's a non-negative integer
      const score = Math.max(0, Math.floor(newScoreEntry.score));
      // Get optional wave number, ensuring it's a positive integer
      const wave = (typeof newScoreEntry.wave === 'number' && newScoreEntry.wave > 0)
                      ? Math.floor(newScoreEntry.wave)
                      : undefined; // Store as undefined if not valid or not present

      // Prepare the final data object to add to the leaderboard
      const scoreDataToAdd = { 
        name, 
        score,
        submittedAt: new Date().toISOString() 
      };
      
      // Only include the 'wave' property if it's valid
      if (wave !== undefined) {
        scoreDataToAdd.wave = wave;
      }
      
      // Process game stats if provided
      if (newScoreEntry.stats && typeof newScoreEntry.stats === 'object') {
        // Sanitize and validate each stat field
        const sanitizedStats = {};
        
        // Define valid stat fields and their expected types
        const validStatFields = {
          missilesFired: 'number',
          enemyMissilesDestroyed: 'number',
          planeBombsDestroyed: 'number',
          planesDestroyed: 'number',
          citiesLost: 'number',
          basesLost: 'number',
          accuracyBonusHits: 'number',
          shieldBombsDestroyed: 'number',
          accuracy: 'number',
          difficulty: 'string',
          missileSpeedLevel: 'number',
          explosionRadiusLevel: 'number',
          duration: 'number' // ADDED: Duration field
        };
        
        // Process each field if it matches expected type
        Object.entries(validStatFields).forEach(([field, expectedType]) => {
          if (field in newScoreEntry.stats && typeof newScoreEntry.stats[field] === expectedType) {
            if (expectedType === 'number') {
              // Ensure numbers are non-negative and reasonable
              sanitizedStats[field] = Math.max(0, 
                field === 'accuracy' ? 
                  parseFloat(newScoreEntry.stats[field].toFixed(1)) : 
                  Math.floor(newScoreEntry.stats[field])
              );
            } else if (expectedType === 'string') {
              // Sanitize strings
              sanitizedStats[field] = newScoreEntry.stats[field].substring(0, 30).replace(/[<>]/g, '');
            }
          }
        });

        // Perform basic consistency check between stats and score
        const isConsistent = validateScoreConsistency(score, sanitizedStats);
        if (!isConsistent) {
          console.warn('Score consistency check failed for entry:', JSON.stringify({
            score,
            stats: sanitizedStats
          }));
          // --- MODIFICATION START ---
          // Reject the score submission instead of just flagging it
          const corsHeaders = handleCors(request, env); // Get CORS headers for the error response
          return new Response(JSON.stringify({ success: false, error: 'Score rejected due to inconsistency with game statistics.' }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            },
            status: 400, // Bad Request
          });
          // --- MODIFICATION END ---
        }
        // Only add stats if they are consistent (this line is reached only if isConsistent is true)
        scoreDataToAdd.stats = sanitizedStats;

        // --- ADDED: Kill Count Plausibility Check ---
        let killCountsFlagged = false;
        if (wave !== undefined && wave > 0) { // Only check if wave is valid
            const maxEnemies = calculateMaxEnemiesForWave(wave);
            const tolerance = (wave <= waveDefinitions.length) ? 1.00 : 1.05; // Exact for defined waves, 5% buffer for scaled

            // Check total missile types (regular + smart + mirv)
            const totalMissilesDestroyed = sanitizedStats.enemyMissilesDestroyed || 0;
            if (totalMissilesDestroyed > maxEnemies.totalMissileTypes * tolerance) {
                killCountsFlagged = true;
                console.warn(`Flagged: Wave ${wave}, Missiles Destroyed (${totalMissilesDestroyed}) > Max Possible (${(maxEnemies.totalMissileTypes * tolerance).toFixed(0)})`);
            }

            // Check planes
            const planesDestroyed = sanitizedStats.planesDestroyed || 0;
            if (planesDestroyed > maxEnemies.plane * tolerance) {
                killCountsFlagged = true;
                console.warn(`Flagged: Wave ${wave}, Planes Destroyed (${planesDestroyed}) > Max Possible (${(maxEnemies.plane * tolerance).toFixed(0)})`);
            }

            // Check shield bombs
            const shieldBombsDestroyed = sanitizedStats.shieldBombsDestroyed || 0;
            if (shieldBombsDestroyed > maxEnemies.shield_bomb * tolerance) {
                killCountsFlagged = true;
                console.warn(`Flagged: Wave ${wave}, Shield Bombs Destroyed (${shieldBombsDestroyed}) > Max Possible (${(maxEnemies.shield_bomb * tolerance).toFixed(0)})`);
            }
            // Note: We don't check planeBombsDestroyed as it's highly variable per plane.
        }
        scoreDataToAdd.flagged_killcounts = killCountsFlagged; // Add the kill count flag

        // --- ADDED: Duration Plausibility Check ---
        let durationFlagged = false;
        if (wave !== undefined && wave > 0 && sanitizedStats.duration !== undefined) {
            if (!isDurationPlausible(wave, sanitizedStats.duration)) {
                durationFlagged = true;
                console.warn(`Flagged: Wave ${wave}, Duration (${sanitizedStats.duration}s) seems implausible.`);
            }
        } else if (sanitizedStats.duration === undefined) {
             // Flag if duration is missing, as client should now always send it
             durationFlagged = true;
             console.warn(`Flagged: Duration missing from submission for wave ${wave}.`);
        }
        scoreDataToAdd.flagged_duration = durationFlagged; // Add the duration flag
        // --- END Duration Plausibility Check ---

      } // End of stats processing block

      // Check if the name is valid after sanitization
      if (!name) {
         console.warn('Invalid name after sanitization.');
         return new Response('Invalid name provided.', { status: 400 });
      }

      // Get the current list of scores from KV
      const storedScores = await kvStore.get(SCORES_KEY, { type: 'json' });
      let scores = storedScores || []; // Default to empty array

      // Add the new score entry to the list
      scores.push(scoreDataToAdd);

      // Sort the scores array in descending order (highest score first)
      scores.sort((a, b) => b.score - a.score);

      // Keep only the top N scores, based on MAX_SCORES_TO_STORE
      scores = scores.slice(0, MAX_SCORES_TO_STORE); 

      // Store the updated (and potentially truncated) scores array back into KV
      // Use await to ensure the write operation completes before responding
      await kvStore.put(SCORES_KEY, JSON.stringify(scores));
      console.log(`Successfully updated scores in KV (up to ${MAX_SCORES_TO_STORE}):`, JSON.stringify(scores));

      // Get CORS headers for the response
      const corsHeaders = handleCors(request, env);

      // Respond with success and the updated leaderboard
      return new Response(JSON.stringify({ success: true, leaderboard: scores }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200,
      });

    // Handle methods other than GET or POST
    } else {
      console.log(`Method ${request.method} not allowed`);
      
      // Get CORS headers
      const corsHeaders = handleCors(request, env);
      
      return new Response('Method Not Allowed', {
         status: 405,
         headers: { 
           'Allow': 'GET, POST, OPTIONS',
           ...corsHeaders
         }
      });
    }
  // Catch any unexpected errors during request processing
  } catch (error) {
    console.error(`Error processing request (${request.method}):`, error);
    return new Response('An internal server error occurred.', { status: 500 });
  }
}

/**
 * Validates the consistency between a submitted score and the player's game stats.
 * Returns true if the score is reasonably consistent with the provided stats.
 * 
 * @param {number} score - The submitted score
 * @param {object} stats - The game statistics object
 * @returns {boolean} - Whether the score seems consistent with the stats
 */
function validateScoreConsistency(score, stats) {
  // If stats are missing, we can't validate
  if (!stats) return true;

  // Calculate expected score components
  const POINTS_PER_MISSILE = 100;
  const POINTS_PER_PLANE_BOMB = 10;
  const POINTS_PER_PLANE = 2000;
  const POINTS_PER_ACCURACY_BONUS = 25;
  const SHIELD_BOMB_MULTIPLIER = 3;

  // Calculate base points from enemy kills (without multipliers)
  const missilePoints = (stats.enemyMissilesDestroyed || 0) * POINTS_PER_MISSILE;
  // Apply special multiplier for shield bombs
  const shieldBombPoints = (stats.shieldBombsDestroyed || 0) * POINTS_PER_MISSILE * SHIELD_BOMB_MULTIPLIER;
  const planeBombPoints = (stats.planeBombsDestroyed || 0) * POINTS_PER_PLANE_BOMB;
  const planePoints = (stats.planesDestroyed || 0) * POINTS_PER_PLANE;
  const accuracyBonusPoints = (stats.accuracyBonusHits || 0) * POINTS_PER_ACCURACY_BONUS;

  // Sum the base points
  const basePoints = missilePoints + shieldBombPoints + planeBombPoints + planePoints + accuracyBonusPoints;

  // Get difficulty multiplier if available (default to 1.0)
  let difficultyMultiplier = 1.0;
  if (stats.difficulty) {
    if (stats.difficulty.includes("Easy")) difficultyMultiplier = 1.0;
    else if (stats.difficulty.includes("Normal")) difficultyMultiplier = 1.25;
    else if (stats.difficulty.includes("Hard")) difficultyMultiplier = 1.5;
    else if (stats.difficulty.includes("Insane")) difficultyMultiplier = 2.0;
  }

  // Estimate a reasonable score range
  // Note: We can't know the exact score because of wave bonuses, score multipliers during play,
  // and other factors, so we use a generous tolerance range.
  // The score multiplier (up to 5x) applies DURING the wave, so the final score can be significantly higher
  // than just base points * difficulty multiplier. We increase the max multiplier here to account for this.
  const minExpectedScore = basePoints * difficultyMultiplier * 0.5; // 50% of base estimate
  const maxExpectedScore = basePoints * difficultyMultiplier * 15.0; // Increased from 5.0 to 15.0 to allow for score multiplier effect

  // Add a minimum floor for very low scores to avoid false positives
  const absoluteMinScore = 100; 

  // Check if score is within reasonable bounds
  const isReasonable = (score >= Math.min(minExpectedScore, absoluteMinScore) && score <= maxExpectedScore);

  // If score seems inconsistent, log details for debugging
  if (!isReasonable) {
    console.warn('Score consistency check failed:', {
      submittedScore: score,
      estimatedBasePoints: basePoints,
      difficultyMultiplier,
      minExpectedScore,
      maxExpectedScore,
      stats
    });
  }

  return isReasonable;
}

// --- ADDED: Wave Definitions and Scaling Logic (from index.html) ---
const waveDefinitions = [
    [{ type: 'missile', count: 22, speedFactor: 1.1 }, { type: 'plane', count: 1 }], // Wave 1 (Index 0)
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

const baseScalingIncrease = 0.06;
const maxScalingFactor = 4.0;

/**
 * Calculates the maximum cumulative number of each enemy type spawned up to a given wave,
 * including random spawns.
 * @param {number} targetWave - The wave number (1-based) up to which to calculate spawns.
 * @returns {object} - An object containing max counts for each enemy type.
 */
function calculateMaxEnemiesForWave(targetWave) {
    const maxCounts = {
        missile: 0,
        smart_bomb: 0,
        mirv: 0,
        plane: 0,
        shield_bomb: 0,
        totalMissileTypes: 0 // Sum of missile, smart_bomb, mirv
    };

    if (targetWave <= 0) return maxCounts;

    // Estimated random plane spawns per wave (based on analysis of game mechanics)
    // These estimates account for the PLANE_SPAWN_CHANCE and increasing spawn rate multiplier
    const randomPlaneEstimates = [
        0,  // Wave 0 (not used)
        4,  // Wave 1
        7,  // Wave 2
        10, // Wave 3
        14, // Wave 4
        18, // Wave 5
        22, // Wave 6
        27, // Wave 7
        32, // Wave 8
        36, // Wave 9
        41, // Wave 10
        46  // Wave 11
    ];

    // Process each wave up to the target wave
    for (let waveIndex = 0; waveIndex < targetWave; waveIndex++) {
        let currentWaveConfig;
        const effectiveWaveIndex = Math.min(waveIndex, waveDefinitions.length - 1);

        // Deep copy the definition to avoid modifying the original
        currentWaveConfig = JSON.parse(JSON.stringify(waveDefinitions[effectiveWaveIndex]));

        // Apply scaling if the actual wave index is beyond the defined waves
        if (waveIndex >= waveDefinitions.length) {
            const scalingFactor = Math.min(
                maxScalingFactor,
                1 + (waveIndex - (waveDefinitions.length - 1)) * baseScalingIncrease
            );
            currentWaveConfig.forEach(part => {
                part.count = Math.ceil(part.count * scalingFactor);
            });
        }

        // Sum counts for the current wave from predefined wave definitions
        currentWaveConfig.forEach(part => {
            if (maxCounts.hasOwnProperty(part.type)) {
                maxCounts[part.type] += part.count || 0;
            }
        });

        // Add estimated random plane spawns for this wave
        const waveNumber = waveIndex + 1; // Convert to 1-based wave number
        if (waveNumber < randomPlaneEstimates.length) {
            maxCounts.plane += randomPlaneEstimates[waveNumber];
        } else {
            // For waves beyond our estimates, use a formula based on wave number
            // This assumes random planes continue to increase with wave number
            maxCounts.plane += Math.ceil(waveNumber * 5); // Approximately 5 additional planes per wave
        }
    }

    // Calculate total missile types
    maxCounts.totalMissileTypes = maxCounts.missile + maxCounts.smart_bomb + maxCounts.mirv;

    // Apply tolerance factors to account for variations in gameplay
    // Planes need a higher tolerance due to random spawn mechanics
    const planeTolerance = 1.5;  // 50% tolerance for planes
    const missileTolerance = 1.1; // 10% tolerance for missiles

    maxCounts.plane = Math.ceil(maxCounts.plane * planeTolerance);
    maxCounts.totalMissileTypes = Math.ceil(maxCounts.totalMissileTypes * missileTolerance);
    maxCounts.missile = Math.ceil(maxCounts.missile * missileTolerance);
    maxCounts.smart_bomb = Math.ceil(maxCounts.smart_bomb * missileTolerance);
    maxCounts.mirv = Math.ceil(maxCounts.mirv * missileTolerance);
    maxCounts.shield_bomb = Math.ceil(maxCounts.shield_bomb * missileTolerance);

    return maxCounts;
}

/**
 * Checks if the reported game duration is plausible for the given wave.
 * @param {number} wave - The wave number (1-based).
 * @param {number} durationSeconds - The total game duration in seconds.
 * @returns {boolean} - True if the duration seems plausible, false otherwise.
 */
function isDurationPlausible(wave, durationSeconds) {
    if (typeof wave !== 'number' || wave <= 0 || typeof durationSeconds !== 'number' || durationSeconds < 0) {
        return false; // Invalid input
    }

    // Basic checks:
    // - Minimum average time per wave (e.g., 5 seconds) for higher waves
    // - Maximum average time per wave (e.g., 5 minutes) to catch absurdly long durations
    const minAvgTimePerWave = 5; // seconds
    const maxAvgTimePerWave = 300; // seconds (5 minutes)

    const averageTime = durationSeconds / wave;

    if (wave > 5 && averageTime < minAvgTimePerWave) {
        return false; // Too fast for later waves
    }
    if (averageTime > maxAvgTimePerWave) {
        return false; // Too slow
    }

    // Could add more sophisticated checks later if needed
    return true;
}
// --- END ADDED Logic ---
