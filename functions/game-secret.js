export async function onRequest(context) {
  // Get the environment variables
  const secretKey = context.env.SCORE_SECRET_KEY;
  
  // Handle CORS the same way as scores.js
  const allowedOriginsStr = context.env.ALLOWED_ORIGINS || 'https://missile-command-game.centminmod.com';
  const allowedOrigins = allowedOriginsStr.split(',').map(origin => origin.trim());
  const requestOrigin = context.request.headers.get('Origin');
  
  // Set default origin
  let corsOrigin = 'https://missile-command-game.centminmod.com';
  
  // Check if request origin is allowed
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    corsOrigin = requestOrigin;
  }
  
  // Check if we have the key
  if (!secretKey) {
    return new Response(JSON.stringify({ error: "Secret not configured" }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
        'Vary': 'Origin'
      }
    });
  }
  
  // Return the key with proper security headers
  return new Response(JSON.stringify({ key: secretKey }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, private, max-age=0',
      'Access-Control-Allow-Origin': corsOrigin,
      'Vary': 'Origin'
    }
  });
}