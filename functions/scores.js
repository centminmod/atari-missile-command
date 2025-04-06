/**
 * Cloudflare Function to handle leaderboard GET and POST requests.
 *
 * Environment variables:
 * - LEADERBOARD_KV: The KV namespace binding for storing scores.
 */

// Key to store the scores array in KV
const SCORES_KEY = 'topScores';
// Maximum number of scores to store persistently in the KV store
const MAX_SCORES_TO_STORE = 50; // Changed from 10 to 50
// Default number of scores to return in a GET request if no limit is specified
const DEFAULT_SCORES_TO_RETURN = 10; // Added for clarity
// Maximum number of scores that can be requested via the 'limit' parameter in a GET request
const MAX_SCORES_TO_RETURN = 1000; // Added limit for GET requests

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
      limit = Math.min(limit, MAX_SCORES_TO_RETURN); // Cap at 50

      console.log(`Requesting top ${limit} scores`);

      // Retrieve scores from KV store
      const storedScores = await kvStore.get(SCORES_KEY, { type: 'json' });
      let scores = storedScores || []; // Default to empty array if no scores exist

      // Slice the scores array based on the requested limit *before* returning
      scores = scores.slice(0, limit);

      console.log(`Returning top ${scores.length} scores:`, JSON.stringify(scores));

      // Return the (potentially sliced) scores array as JSON
      return new Response(JSON.stringify(scores), {
        headers: {
          'Content-Type': 'application/json',
          // Allow requests from any origin (adjust for production if needed)
          'Access-Control-Allow-Origin': '*',
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
          // Optionally flag suspicious entries but still accept them
          sanitizedStats.flagged = true;
        }
        
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
      scores = scores.slice(0, MAX_SCORES_TO_STORE); // Keep up to 50 scores

      // Store the updated (and potentially truncated) scores array back into KV
      // Use await to ensure the write operation completes before responding
      await kvStore.put(SCORES_KEY, JSON.stringify(scores));
      console.log(`Successfully updated scores in KV (up to ${MAX_SCORES_TO_STORE}):`, JSON.stringify(scores));

      // Respond with success and the updated leaderboard (up to 50 scores)
      return new Response(JSON.stringify({ success: true, leaderboard: scores }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Adjust for production
        },
        status: 200,
      });

    // Handle methods other than GET or POST
    } else {
      console.log(`Method ${request.method} not allowed`);
      return new Response('Method Not Allowed', {
         status: 405,
         headers: { 'Allow': 'GET, POST' } // Indicate allowed methods
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
  const POINTS_PER_MISSILE = 35;
  const POINTS_PER_PLANE_BOMB = 20;
  const POINTS_PER_PLANE = 1000;
  const POINTS_PER_ACCURACY_BONUS = 50;
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