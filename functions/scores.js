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
const MAX_SCORES_TO_RETURN = 50; // Added limit for GET requests

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
      const scoreDataToAdd = { name, score };
      // Only include the 'wave' property if it's valid
      if (wave !== undefined) {
        scoreDataToAdd.wave = wave;
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
