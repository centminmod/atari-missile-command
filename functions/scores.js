/**
 * Cloudflare Function to handle leaderboard GET and POST requests.
 *
 * Environment variables:
 * - LEADERBOARD_KV: The KV namespace binding for storing scores.
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (domains)
 * - SCORE_SECRET_KEY: Secret key used for score signature verification
 */

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

// Key to store the scores array in KV
const SCORES_KEY = 'topScores';
// Maximum number of scores to store persistently in the KV store
const MAX_SCORES_TO_STORE = 1000; // Changed from 10 to 1000
// Default number of scores to return in a GET request if no limit is specified
const DEFAULT_SCORES_TO_RETURN = 10; // Added for clarity
// Maximum number of scores that can be requested via the 'limit' parameter in a GET request
const MAX_SCORES_TO_RETURN = 1000; // Added limit for GET requests

// --- VALIDATION CONFIG ---
const VALIDATION_MODE = {
  LOG_ONLY: 'log_only',    // Log validation failures but still accept scores
  ENFORCE: 'enforce'       // Reject scores that fail validation
};

// Set this to VALIDATION_MODE.LOG_ONLY initially, change to VALIDATION_MODE.ENFORCE when ready
const CURRENT_VALIDATION_MODE = VALIDATION_MODE.LOG_ONLY;

// Configure which validations to run
const VALIDATION_CONFIG = {
  checkScoreConsistency: true,     // Check if score makes sense with stats
  checkKillCounts: true,           // Check if kill counts are plausible for the wave
  checkDuration: true,             // Check if the game duration is plausible
  checkHoneyPot: true,             // Check for honeypot fields that should never exist
  checkMaxWave: true,              // Check for implausibly high wave claims
  maxReasonableWave: 150           // Adjust based on what's realistically achievable
};

// Tolerance factors for validation (adjust as needed)
const VALIDATION_TOLERANCES = {
  definedWaveTolerance: 1.05,      // 5% tolerance for waves 1-11 (exactly defined)
  generatedWaveTolerance: 1.30,    // 30% tolerance for waves 12+ (formula-generated)
  minAccuracyForHighWaves: 85,     // Minimum accuracy % required for very high waves
  minSecondsPerWave: 15            // Minimum seconds per wave for duration check
};

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

// --- ENHANCED VALIDATION FUNCTION ---
/**
 * Comprehensive validation of score submission
 * @param {object} scoreData - The score data to validate
 * @param {string} clientIp - The submitting client's IP address (for logging)
 * @returns {object} Validation result with valid flag and details
 */
function validateSubmission(scoreData, clientIp) {
  // Store validation issues for logging/rejection
  const validationIssues = [];
  const validationFlags = {};
  
  // --- TIER 1: Basic structure validation ---
  // This should be kept as immediate rejection regardless of mode
  if (!scoreData || typeof scoreData.score !== 'number' || 
      typeof scoreData.name !== 'string' || !scoreData.stats) {
    return { 
      valid: false, 
      reason: "Missing required fields",
      enforceRejection: true // Always enforce regardless of mode
    };
  }
  
  // --- TIER 2: Honeypot checks ---
  if (VALIDATION_CONFIG.checkHoneyPot) {
    // Look for fields that should never exist in legitimate submissions
    const honeypotFields = ['_honeyPotRNG', '_clientValidation', '_verifiedPlay'];
    for (const field of honeypotFields) {
      if (scoreData.stats[field] !== undefined) {
        validationIssues.push(`Honeypot field detected: ${field}`);
        validationFlags.honeypot_detected = true;
        break;
      }
    }
  }
  
  // --- TIER 3: Duration check ---
  if (VALIDATION_CONFIG.checkDuration && scoreData.stats.duration !== undefined) {
    const durationValid = isDurationPlausible(scoreData.wave, scoreData.stats.duration);
    if (!durationValid) {
      validationIssues.push(`Implausible game duration (${scoreData.stats.duration}s) for wave ${scoreData.wave}`);
      validationFlags.flagged_duration = true;
      
      // Additional check for extremely fast completion of high waves
      if (scoreData.wave > 20) {
        const minimumExpectedDuration = scoreData.wave * VALIDATION_TOLERANCES.minSecondsPerWave;
        if (scoreData.stats.duration < minimumExpectedDuration) {
          validationIssues.push(`Impossibly fast completion: ${scoreData.stats.duration}s for wave ${scoreData.wave}`);
          validationFlags.impossible_speed = true;
        }
      }
    }
  }
  
  // --- TIER 4: Wave-specific kill count validation ---
  if (VALIDATION_CONFIG.checkKillCounts && scoreData.wave && scoreData.wave > 0) {
    // Determine if we're dealing with a defined wave or generated wave
    const isDefinedWave = scoreData.wave <= waveDefinitions.length;
    const isHighWave = scoreData.wave > 15;
    const tolerance = isDefinedWave ? 
      VALIDATION_TOLERANCES.definedWaveTolerance : 
      (isHighWave ? VALIDATION_TOLERANCES.generatedWaveTolerance * 1.2 : VALIDATION_TOLERANCES.generatedWaveTolerance);
    
    // Get maximum possible enemies for this wave
    const maxEnemies = calculateMaxEnemiesForWave(scoreData.wave);
    const stats = scoreData.stats;
    
    // Track which kill counts failed validation
    const killChecksFailed = [];
    
    // Check missile kills
    if (stats.enemyMissilesDestroyed > maxEnemies.totalMissileTypes * tolerance) {
      killChecksFailed.push({
        type: "missiles",
        reported: stats.enemyMissilesDestroyed,
        max: Math.round(maxEnemies.totalMissileTypes * tolerance)
      });
    }
    
    // Check plane kills
    if (stats.planesDestroyed > maxEnemies.plane * tolerance) {
      killChecksFailed.push({
        type: "planes",
        reported: stats.planesDestroyed,
        max: Math.round(maxEnemies.plane * tolerance)
      });
    }
    
    // Check shield bomb kills
    if (stats.shieldBombsDestroyed > maxEnemies.shield_bomb * tolerance) {
      killChecksFailed.push({
        type: "shield_bombs",
        reported: stats.shieldBombsDestroyed,
        max: Math.round(maxEnemies.shield_bomb * tolerance)
      });
    }
    
    // Evaluate the failed checks
    if (killChecksFailed.length > 0) {
      // Log the details of the failed checks
      const failDetails = killChecksFailed.map(f => 
        `${f.type}: ${f.reported}/${f.max}`).join(', ');
      
      validationIssues.push(`Kill count anomalies: ${failDetails}`);
      validationFlags.flagged_killcounts = true;
      
      // For defined waves or multiple failed checks, mark as a serious issue
      if (isDefinedWave || killChecksFailed.length >= 2) {
        validationFlags.serious_killcount_issues = true;
      }
    }
  }
  
  // --- TIER 5: Score/stats consistency check ---
  if (VALIDATION_CONFIG.checkScoreConsistency) {
    const scoreConsistent = validateScoreConsistency(scoreData.score, scoreData.stats);
    if (!scoreConsistent) {
      validationIssues.push(
        `Score inconsistency: ${scoreData.score} doesn't match expected range based on stats`
      );
      validationFlags.flagged_score_inconsistency = true;
    }
  }
  
  // --- TIER 6: Extremely high wave claims ---
  if (VALIDATION_CONFIG.checkMaxWave && 
      scoreData.wave > VALIDATION_CONFIG.maxReasonableWave) {
    // For extremely high waves, require proportionally high accuracy
    const playerAccuracy = scoreData.stats.accuracy || 
      (scoreData.stats.missilesFired > 0 ? 
        ((scoreData.stats.enemyMissilesDestroyed + scoreData.stats.planeBombsDestroyed) / 
         scoreData.stats.missilesFired * 100).toFixed(1) : 0);
        
    if (playerAccuracy < VALIDATION_TOLERANCES.minAccuracyForHighWaves) {
      validationIssues.push(
        `Unrealistic wave (${scoreData.wave}) with low accuracy (${playerAccuracy}%)`
      );
      validationFlags.flagged_unrealistic_wave = true;
    }
  }
  
  // --- Final Validation Decision ---
  const hasSerious = Object.keys(validationFlags).some(flag => 
    flag.startsWith('serious_') || flag === 'impossible_speed' || flag === 'honeypot_detected'
  );
  
  // If we have validation issues, decide whether to log or enforce
  if (validationIssues.length > 0) {
    // Log all validation issues regardless of enforcement mode
    const ipInfo = clientIp ? ` from IP ${clientIp}` : '';
    console.warn(`Validation issues for score ${scoreData.name} (${scoreData.score})${ipInfo}:`);
    validationIssues.forEach(issue => console.warn(`- ${issue}`));
    
    // Apply flags to the score data
    Object.assign(scoreData, validationFlags);
    
    // Determine if we should reject
    if (CURRENT_VALIDATION_MODE === VALIDATION_MODE.ENFORCE && hasSerious) {
      // Add additional check for skilled players with high accuracy
      const playerAccuracy = scoreData.stats.accuracy || 
        (scoreData.stats.missilesFired > 0 ? 
          ((scoreData.stats.enemyMissilesDestroyed + scoreData.stats.planeBombsDestroyed) / 
           scoreData.stats.missilesFired * 100) : 0);
          
      // Don't reject if they have very high accuracy (skilled player)
      const isLikelySkilled = playerAccuracy > 100 && 
                             scoreData.stats.missileSpeedLevel > 5 &&
                             scoreData.stats.explosionRadiusLevel > 5;
      
      if (!isLikelySkilled) {
        return {
          valid: false,
          reason: `Score validation failed: ${validationIssues[0]}`,
          allIssues: validationIssues,
          enforceRejection: true
        };
      }
    }
  }
  
  // Score passed validation or we're in LOG_ONLY mode
  return { 
    valid: true,
    flags: Object.keys(validationFlags),
    hasIssues: validationIssues.length > 0
  };
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
      const limitedScores = scores.slice(0, limit);

      // IMPORTANT: Ensure the full stats object is included for each score
      // The current code seems to store the full entry including stats,
      // so just returning the sliced array should be sufficient, assuming
      // the 'scores' array retrieved from KV contains the full objects.
      // Let's log one entry to confirm structure before returning.
      if (limitedScores.length > 0) {
        console.log('Sample score entry being returned (GET):', JSON.stringify(limitedScores[0]));
      } else {
        console.log('No scores to return.');
      }

      console.log(`Returning top ${limitedScores.length} scores.`); // Simplified log

      // Get CORS headers
      const corsHeaders = handleCors(request, env);

      // Return the limited scores array as JSON
      return new Response(JSON.stringify(limitedScores), {
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
          duration: 'number',
          gameStartTime: 'number'
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

        // Perform enhanced validation with our new function
        const clientIp = request.headers.get('CF-Connecting-IP');
        const validationResult = validateSubmission({
          name: name,
          score: score,
          wave: wave,
          stats: sanitizedStats
        }, clientIp);
      
        // Check if we should reject this submission
        if (!validationResult.valid && validationResult.enforceRejection) {
          const corsHeaders = handleCors(request, env);
          return new Response(JSON.stringify({ 
            success: false, 
            error: validationResult.reason 
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            },
            status: 400
          });
        }
        
        // Apply any flags from validation
        if (validationResult.flags && validationResult.flags.length > 0) {
          validationResult.flags.forEach(flag => {
            scoreDataToAdd[flag] = true;
          });
        }

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
        
        // Check if we're dealing with a defined wave or need to use scaling
        if (waveIndex < waveDefinitions.length) {
            // Use the predefined wave configuration
            currentWaveConfig = JSON.parse(JSON.stringify(waveDefinitions[waveIndex]));
        } else {
            // Calculate a scaled version based on the last defined wave
            const baseWaveIndex = waveDefinitions.length - 1;
            const extraWaves = waveIndex - baseWaveIndex;
            const scalingFactor = Math.min(
                maxScalingFactor,
                1 + extraWaves * baseScalingIncrease
            );
            
            // Clone the highest defined wave and scale it
            currentWaveConfig = JSON.parse(JSON.stringify(waveDefinitions[baseWaveIndex]));
            currentWaveConfig.forEach(part => {
                part.count = Math.ceil(part.count * scalingFactor);
            });
        }

        // Sum counts for the current wave from wave configuration
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

    // Add another check for high waves - more challenging waves should take longer
    if (wave > 20) {
        // For very high waves, more lenient check based on player skill
        const minHighWaveTime = Math.max(10, VALIDATION_TOLERANCES.minSecondsPerWave - (wave / 4));
        if (averageTime < minHighWaveTime) {
          return false;
        }
    }

    return true;
}
