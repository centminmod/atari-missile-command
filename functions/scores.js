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
          explosionRadiusLevel: 'number'
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
      }

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
  // and other factors, so we use a generous tolerance range
  const minExpectedScore = basePoints * difficultyMultiplier * 0.5; // 50% of base estimate
  const maxExpectedScore = basePoints * difficultyMultiplier * 5.0; // Up to 5x multiplier

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
