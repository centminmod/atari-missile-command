/**
 * Cloudflare Pages Function - Wrapper for /scores endpoint.
 * Forwards requests to the Worker via Service Binding.
 */
export async function onRequest(context) {
  // Ensure 'API_WORKER' matches the Variable Name of your Service Binding
  // in the Cloudflare Pages dashboard settings.
  const backendWorker = context.env.API_WORKER;

  if (!backendWorker) {
    console.error("Service Binding 'API_WORKER' not found. Ensure it is configured in Pages settings.");
    return new Response("Backend service binding not configured.", { status: 500 });
  }

  try {
    // Forward the incoming request (method, headers, body, etc.) directly
    // to the bound backend worker service.
    return await backendWorker.fetch(context.request);
  } catch (error) {
    console.error(`Error forwarding request to API_WORKER for /scores: ${error}`);
    return new Response("Error communicating with backend service.", { status: 502 }); // Bad Gateway
  }
}