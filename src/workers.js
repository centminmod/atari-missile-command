// Cloudflare Worker: src/worker.js
// Handles POST requests with game data, calls OpenRouter via AI Gateway using fetch,
// includes AI Gateway's own bearer token, and robustly parses LLM JSON response.
// Added support for store action analysis.

export default {
  /**
   * Handles incoming requests to the Worker.
   * @param {Request} request - The incoming request object.
   * @param {object} env - Env object containing secrets (ACCOUNT_ID, GATEWAY_ID, OPENROUTER_TOKEN, CF_GATEWAY_AI_BEARER_TOKEN).
   * @param {object} ctx - The execution context.
   * @returns {Promise<Response>} - The response to send back to the client.
   */
  async fetch(request, env, ctx) {
    // 1. Validate Request Method
    if (request.method !== 'POST') {
      console.log(`Worker received non-POST request: ${request.method}`);
      return new Response(JSON.stringify({ error: 'Method Not Allowed. Expected POST.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
      });
    }

    // --- Secrets/Configuration Check ---
    if (!env.ACCOUNT_ID || !env.GATEWAY_ID || !env.OPENROUTER_TOKEN || !env.CF_GATEWAY_AI_BEARER_TOKEN) {
         console.error("FATAL: Missing required environment secrets: ACCOUNT_ID, GATEWAY_ID, OPENROUTER_TOKEN, or CF_GATEWAY_AI_BEARER_TOKEN.");
         return new Response(JSON.stringify({ error: 'Server configuration error: Missing required AI Gateway or provider credentials.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Process Request Body and Handle Errors
    try {
      const gameData = await request.json();

      // 3. Basic Input Validation
      if (!gameData || typeof gameData !== 'object' || !Array.isArray(gameData.clicks)) {
        console.warn('Received invalid game data format:', gameData);
        return new Response(JSON.stringify({ error: 'Invalid game data format. Expected JSON object with a "clicks" array.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      console.log(`Received game data: Difficulty=${gameData.difficulty}, Score=${gameData.score}, Wave=${gameData.wave}, Clicks=${gameData.clicks.length}`);
      
      // Log store actions if present
      if (Array.isArray(gameData.storeActions)) {
        console.log(`Store actions: ${gameData.storeActions.length} purchases/upgrades recorded`);
      }

      // 4. Input Token Limit Handling (Pre-check & Summarization)
      const MAX_RAW_CLICKS_TO_INCLUDE = 500;
      const ABSOLUTE_CLICK_LIMIT = 10000;

      if (gameData.clicks.length > ABSOLUTE_CLICK_LIMIT) {
          console.warn(`Input click data too large: ${gameData.clicks.length} clicks. Aborting analysis.`);
          return new Response(JSON.stringify({ error: `Gameplay data too large (${gameData.clicks.length} clicks). Analysis aborted before calling AI.` }), { status: 413, headers: { 'Content-Type': 'application/json' } });
      }

      // Summarize click data
      let clickSummaryText = `Total Clicks: ${gameData.clicks.length}. `;
       if (gameData.clicks.length > 0) {
          const bombClicks = gameData.clicks.filter(c => c.armedWeapon === 'bomb').length;
          const missileClicks = gameData.clicks.length - bombClicks;
          clickSummaryText += `Bomb Clicks: ${bombClicks} (${((bombClicks / gameData.clicks.length) * 100).toFixed(1)}%). `;
          clickSummaryText += `Missile Clicks: ${missileClicks} (${((missileClicks / gameData.clicks.length) * 100).toFixed(1)}%). `;
          if (gameData.clicks.length > 1) {
              const gameDurationSeconds = (gameData.clicks[gameData.clicks.length - 1].timestamp - gameData.clicks[0].timestamp) / 1000;
              clickSummaryText += `Approx. Game Duration: ${gameDurationSeconds.toFixed(1)}s. `;
          }
      } else {
           clickSummaryText += "No clicks recorded. ";
      }

      // Summarize store actions
      let storeActionsSummary = "";
      if (Array.isArray(gameData.storeActions) && gameData.storeActions.length > 0) {
        // Count item types and total spent
        const purchaseCounts = {};
        let totalSpent = 0;
        
        gameData.storeActions.forEach(action => {
          const itemType = action.item || 'unknown';
          purchaseCounts[itemType] = (purchaseCounts[itemType] || 0) + (action.quantity || 1);
          totalSpent += action.cost || 0;
        });
        
        storeActionsSummary = `Store purchases: ${gameData.storeActions.length} total. `;
        storeActionsSummary += `Items purchased: ${Object.entries(purchaseCounts)
          .map(([item, count]) => `${item} (${count})`)
          .join(', ')}. `;
        storeActionsSummary += `Total spent: $${totalSpent}. `;
      }

      // Select a sample of clicks
      let clickSampleForPrompt = gameData.clicks;
      let sampleInfo = `(${gameData.clicks.length} clicks)`;
      if (gameData.clicks.length > MAX_RAW_CLICKS_TO_INCLUDE) {
          const halfSample = Math.floor(MAX_RAW_CLICKS_TO_INCLUDE / 2);
          sampleInfo = `(Sample of first ${halfSample} and last ${halfSample} clicks from ${gameData.clicks.length} total)`;
          const firstHalf = gameData.clicks.slice(0, halfSample);
          const lastHalf = gameData.clicks.slice(-halfSample);
          clickSampleForPrompt = [...firstHalf, ...lastHalf];
      }

      // Select a sample of store actions (if any)
      let storeActionsSample = [];
      let storeActionsSampleInfo = "";
      if (Array.isArray(gameData.storeActions) && gameData.storeActions.length > 0) {
        storeActionsSample = gameData.storeActions.slice(0, 20); // Limit to 20 to save tokens
        storeActionsSampleInfo = gameData.storeActions.length > 20 
          ? `(First 20 of ${gameData.storeActions.length} store actions)`
          : `(${gameData.storeActions.length} store actions)`;
      }

      // 5. Construct the LLM Prompt
      const prompt = `
You are an expert Missile Command player and game analyst.
Analyze the provided Missile Command gameplay data. The game canvas is 800x600 pixels, with the ground near y=590. Player bases are near y=560 at x positions around 120, 400, and 680. Cities are also near y=560. Higher y values are lower on the screen.

Based *only* on the data below, provide:
1. A concise summary (2-4 sentences) of the player's likely playstyle or notable patterns.
2. 3-5 specific, actionable pieces of advice for improvement, referencing the data where possible (e.g., weapon usage ratio, potential targeting habits, resource management).

Please keep your advice items brief and concise to ensure complete response delivery.
Respond ONLY in valid JSON format like this: {"summary": "Your concise summary here.", "advice": ["Actionable tip 1.", "Actionable tip 2.", ...]}

Game Session Data:
- Difficulty: ${gameData.difficulty || 'N/A'}
- Final Score: ${gameData.score || 0}
- Wave Reached: ${gameData.wave || 1}
- Game Stats: ${JSON.stringify(gameData.stats || {})}
- Gameplay Click Summary: ${clickSummaryText}
${storeActionsSummary ? `- Store Purchases: ${storeActionsSummary}` : ''}
- Click Data Sample ${sampleInfo}: ${JSON.stringify(clickSampleForPrompt)}
${storeActionsSample.length > 0 ? `- Store Actions Sample ${storeActionsSampleInfo}: ${JSON.stringify(storeActionsSample)}` : ''}

Focus on clear, helpful analysis based *solely* on the provided data. Do not invent information. Ensure the output is valid JSON.
`;

      // 6. Prepare Fetch Request for AI Gateway -> OpenRouter
      const gatewayBaseUrl = `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${env.GATEWAY_ID}/openrouter`;
      const openRouterEndpoint = `${gatewayBaseUrl}/v1/chat/completions`;

      // Use the model name you specified
      const targetModel = "google/gemini-2.0-flash-exp:free"; // Or another model string

      const requestBody = {
        model: targetModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 550
      };

      // 7. Execute Fetch Request to AI Gateway
      console.log(`Sending fetch request to AI Gateway for model ${targetModel}: ${openRouterEndpoint}`);
      let aiResponse;
      try {
         aiResponse = await fetch(openRouterEndpoint, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${env.OPENROUTER_TOKEN}`,
                 'cf-aig-authorization': `Bearer ${env.CF_GATEWAY_AI_BEARER_TOKEN}`,
                 'HTTP-Referer': 'https://missile-command-game.centminmod.com/',
                 'X-Title': 'Missile Command AI Gameplay Analysis'
             },
             body: JSON.stringify(requestBody)
         });

         if (!aiResponse.ok) {
             let errorBody = await aiResponse.text();
             try { errorBody = JSON.stringify(JSON.parse(errorBody), null, 2); } catch {}
             console.error(`AI Gateway request failed with status ${aiResponse.status}: ${errorBody}`);
             if (aiResponse.status === 401 || aiResponse.status === 403) {
                  throw new Error(`AI Gateway request failed (${aiResponse.status} Unauthorized/Forbidden). Check both CF_GATEWAY_AI_BEARER_TOKEN and OPENROUTER_TOKEN. ${errorBody}`);
             } else {
                 throw new Error(`AI Gateway request failed (${aiResponse.status}). ${errorBody}`);
             }
         }

      } catch (fetchError) {
         console.error('Fetch to AI Gateway failed:', fetchError);
         return new Response(JSON.stringify({ error: `Failed to communicate with AI service: ${fetchError.message}` }), {
             status: 502, headers: { 'Content-Type': 'application/json' }
         });
      }

      // 8. Process Successful AI Gateway Response
      let llmResponsePayload;
      try {
          llmResponsePayload = await aiResponse.json();
          console.log("Raw LLM response payload received via AI Gateway.");

          if (!llmResponsePayload || !Array.isArray(llmResponsePayload.choices) || llmResponsePayload.choices.length === 0 || !llmResponsePayload.choices[0].message || typeof llmResponsePayload.choices[0].message.content !== 'string') {
               console.warn("LLM response payload via Gateway has unexpected structure:", llmResponsePayload);
               throw new Error("AI model returned an invalid response structure via Gateway.");
          }

      } catch (jsonError) {
           console.error("Failed to parse JSON response from AI Gateway:", jsonError);
           const rawText = await aiResponse.text().catch(() => "(could not read raw text)");
           console.log("Raw text response was:", rawText);
           return new Response(JSON.stringify({ error: `Failed to parse AI response: ${jsonError.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      // Extract the content string
      const llmContent = llmResponsePayload.choices[0].message.content;

      // 9. Process and Parse LLM Content (Robust JSON Extraction)
      let analysisResult;
      console.log("Raw LLM content received:", llmContent);

      try {
          let jsonString = llmContent;

          // Attempt to extract JSON string if wrapped in markdown fences or has surrounding text
          const jsonMatch = llmContent.match(/```json\s*([\s\S]*?)\s*```/); // Look for ```json ... ```
          if (jsonMatch && jsonMatch[1]) {
              jsonString = jsonMatch[1];
              console.log("Extracted JSON from markdown fences.");
          } else {
              // If no markdown fences, try finding the first '{' and last '}'
              const firstBrace = llmContent.indexOf('{');
              const lastBrace = llmContent.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                  jsonString = llmContent.substring(firstBrace, lastBrace + 1);
                  console.log("Extracted JSON using brace positions.");
              } else {
                   console.log("Could not reliably extract JSON structure, attempting to parse raw content.");
                   // Keep jsonString as llmContent if extraction fails, parse will likely fail below
              }
          }

          // Attempt to parse the extracted (or original) string
          analysisResult = JSON.parse(jsonString);

          // Basic validation of the parsed JSON structure
          if (typeof analysisResult.summary !== 'string' || !Array.isArray(analysisResult.advice)) {
              console.warn("Parsed LLM JSON response has unexpected structure:", analysisResult);
              throw new Error("Parsed AI response has incorrect format (missing summary string or advice array).");
          }
          analysisResult.advice = analysisResult.advice.map(item => String(item)); // Ensure advice items are strings
          console.log("Successfully parsed LLM content JSON:", analysisResult);

      } catch (parseError) {
          // Handle cases where extraction or parsing failed
          console.error("Failed to parse LLM content as JSON:", parseError);
          // Fallback: Use the raw content string as the summary if JSON parsing fails
          analysisResult = {
              summary: `AI analysis received, but failed to parse structured advice. Raw content: "${llmContent}"`,
              advice: ["Could not parse specific advice due to formatting issues in the AI response content."]
          };
      }


      // 10. Return Success Response to Client
      return new Response(JSON.stringify(analysisResult), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' // Adjust CORS
            },
        status: 200 // OK
      });

    } catch (error) {
      // 11. Catch All Other Errors
      console.error('Unhandled error processing analysis request:', error);
      return new Response(JSON.stringify({ error: `An internal server error occurred: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
};