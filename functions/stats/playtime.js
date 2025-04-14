/**
 * Cloudflare Pages Function - Wrapper for /stats/playtime endpoint.
 * Forwards requests to the Worker via Service Binding.
 */
export async function onRequestGet(context) {
  // Ensure 'API_WORKER' matches the Variable Name of your Service Binding
  const backendWorker = context.env.API_WORKER;

  if (!backendWorker) {
    console.error("Service Binding 'API_WORKER' not found.");
    return new Response("Backend service binding not configured.", { status: 500 });
  }

  try {
    // Construct a new Request object targeting the /stats/playtime path on the worker
    const workerUrl = new URL(context.request.url); // Get original URL
    workerUrl.pathname = '/stats/playtime'; // Change path to target worker's endpoint

    // Create a new Request object for the worker
    const workerRequest = new Request(workerUrl.toString(), {
      method: 'GET',
      headers: context.request.headers // Forward original headers if needed
    });

    // Forward the modified request to the bound backend worker service.
    console.log(`Forwarding request to API_WORKER for /stats/playtime`);
    const response = await backendWorker.fetch(workerRequest);

    // Return the worker's response, potentially adding caching headers
    const newHeaders = new Headers(response.headers);
    // Add a cache control header (e.g., cache for 5 minutes)
    // This will be respected by Cloudflare's edge cache
    newHeaders.set('Cache-Control', 'public, max-age=300');

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });

  } catch (error) {
    console.error(`Error forwarding request to API_WORKER for /stats/playtime: ${error}`);
    return new Response("Error communicating with backend service.", { status: 502 }); // Bad Gateway
  }
}
