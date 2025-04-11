/**
 * Cloudflare Function to check if the requesting IP matches a debug IP.
 *
 * Environment variables:
 * - DEBUG_IP_ADDRESS: The specific IP address allowed for debug logging.
 */

export async function onRequest(context) {
  const { request, env } = context;

  // Default to not debug mode
  let isDebug = false;

  // Get the connecting IP address from Cloudflare headers
  const clientIp = request.headers.get('CF-Connecting-IP');
  const debugIp = env.DEBUG_IP_ADDRESS;

  console.log(`[check-debug-status] Request from IP: ${clientIp}, Debug IP Env: ${debugIp}`);

  // Check if the DEBUG_IP_ADDRESS is set and matches the client IP
  if (debugIp && clientIp === debugIp) {
    isDebug = true;
    console.log(`[check-debug-status] Debug IP match found.`);
  } else if (!debugIp) {
    console.warn(`[check-debug-status] DEBUG_IP_ADDRESS environment variable not set.`);
  } else {
     console.log(`[check-debug-status] No debug IP match.`);
  }

  // Respond with JSON indicating debug status
  // IMPORTANT: Use CORS headers similar to the /scores endpoint if needed,
  // assuming this might be called cross-origin or you want consistency.
  // For simplicity here, assuming same-origin or permissive CORS.
  const responseBody = JSON.stringify({ isDebug });
  return new Response(responseBody, {
    headers: {
      'Content-Type': 'application/json',
      // Add CORS headers if necessary, copying logic from handleCors if applicable
      'Access-Control-Allow-Origin': '*', // Example: Allow all origins for this simple check
      'Cache-Control': 'no-store' // Prevent caching of debug status
    },
    status: 200,
  });
}
