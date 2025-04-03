/**
 * Cloudflare Function to handle leaderboard GET and POST requests.
 *
 * Environment variables:
 * - LEADERBOARD_KV: The KV namespace binding for storing scores.
 */

const SCORES_KEY = 'topScores'; // Key to store the scores array in KV
const MAX_SCORES = 10; // Number of top scores to keep

export async function onRequest(context) {
  // Environment variable is available on context.env
  const { request, env } = context;
  const kvStore = env.LEADERBOARD_KV;

  if (!kvStore) {
    return new Response('KV Namespace (LEADERBOARD_KV) not bound.', { status: 500 });
  }

  try {
    if (request.method === 'GET') {
      // --- Handle GET request ---
      console.log('GET request received for scores');
      const storedScores = await kvStore.get(SCORES_KEY, { type: 'json' });
      const scores = storedScores || []; // Default to empty array if no scores yet
      console.log('Returning scores:', JSON.stringify(scores));

      return new Response(JSON.stringify(scores), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Allow requests from your game's domain
        },
        status: 200,
      });

    } else if (request.method === 'POST') {
      // --- Handle POST request ---
      console.log('POST request received to submit score');
      let newScoreEntry;
      try {
        newScoreEntry = await request.json();
        console.log('Received score entry:', JSON.stringify(newScoreEntry));
      } catch (e) {
        console.error('Failed to parse request body:', e);
        return new Response('Invalid JSON body.', { status: 400 });
      }

      // Basic validation
      if (!newScoreEntry || typeof newScoreEntry.name !== 'string' || typeof newScoreEntry.score !== 'number') {
        console.warn('Invalid score entry format:', JSON.stringify(newScoreEntry));
        return new Response('Invalid score entry format. Required: { "name": string, "score": number }', { status: 400 });
      }

      // Sanitize name (limit length, basic characters)
      const name = newScoreEntry.name.trim().substring(0, 18).toUpperCase().replace(/[^A-Z0-9\s_-]/g, '');
      const score = Math.max(0, Math.floor(newScoreEntry.score)); // Ensure score is non-negative integer

      // Get optional wave number
      const wave = (typeof newScoreEntry.wave === 'number' && newScoreEntry.wave > 0)
                    ? Math.floor(newScoreEntry.wave)
                    : undefined;

      // Prepare the entry object - include wave only if it exists
      const scoreDataToAdd = { name, score };
      if (wave !== undefined) {
        scoreDataToAdd.wave = wave;
      }
 
      if (!name) {
         console.warn('Invalid name after sanitization.');
         return new Response('Invalid name provided.', { status: 400 });
      }

      // Get current scores
      const storedScores = await kvStore.get(SCORES_KEY, { type: 'json' });
      let scores = storedScores || [];

      // Add the new score
      scores.push(scoreDataToAdd); Add the object possibly containing 'wave'

      // Sort scores descending
      scores.sort((a, b) => b.score - a.score);

      // Keep only the top MAX_SCORES
      scores = scores.slice(0, MAX_SCORES);

      // Store updated scores back in KV
      // Use await here to ensure the write completes before responding
      await kvStore.put(SCORES_KEY, JSON.stringify(scores));
      console.log('Successfully updated scores in KV with potential wave numbers:', JSON.stringify(scores));

      return new Response(JSON.stringify({ success: true, leaderboard: scores }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Adjust for production
        },
        status: 200,
      });

    } else {
      // --- Handle other methods ---
      console.log(`Method ${request.method} not allowed`);
      return new Response('Method Not Allowed', {
         status: 405,
         headers: { 'Allow': 'GET, POST' }
      });
    }
  } catch (error) {
    console.error(`Error processing request (${request.method}):`, error);
    return new Response('An internal server error occurred.', { status: 500 });
  }
}