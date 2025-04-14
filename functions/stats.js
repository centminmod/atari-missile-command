/**
 * Cloudflare Pages Function - Wrapper for /stats endpoint.
 * Forwards requests to the Worker via Service Binding.
 */
export async function onRequestGet(context) { // Use onRequestGet for GET requests
  // Ensure 'API_WORKER' matches the Variable Name of your Service Binding
  const backendWorker = context.env.API_WORKER;

  if (!backendWorker) {
    console.error("Service Binding 'API_WORKER' not found.");
    return new Response("Backend service binding not configured.", { status: 500 });
  }

  try {
    // Construct a new Request object targeting the /stats path on the worker
    // We need to preserve the original request's headers if necessary,
    // but for a simple GET /stats, just forwarding the path is usually enough.
    // Create a new URL object based on a dummy base URL, setting the pathname
    const workerUrl = new URL(context.request.url); // Get original URL
    workerUrl.pathname = '/stats'; // Change path to target worker's endpoint

    // Create a new Request object for the worker
    const workerRequest = new Request(workerUrl.toString(), {
      method: 'GET',
      headers: context.request.headers // Forward original headers if needed
    });

    // Forward the modified request to the bound backend worker service.
    console.log(`Forwarding request to API_WORKER for /stats`);
    return await backendWorker.fetch(workerRequest);

  } catch (error) {
    console.error(`Error forwarding request to API_WORKER for /stats: ${error}`);
    return new Response("Error communicating with backend service.", { status: 502 }); // Bad Gateway
  }
}
