/**
 * Cloudflare Worker: Movebank API Proxy & AI Agent Gateway
 *
 * Acts as a secure CORS proxy for the Movebank direct-read endpoint,
 * and provides an AI-powered query parser using Groq API.
 *
 * - Run `npm run dev` to start a local development server
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	MOVEBANK_USERNAME: string;
	MOVEBANK_PASSWORD: string;
	GROQ_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const incomingUrl = new URL(request.url);

		// Official Movebank direct-read endpoint used for scientific data retrieval
		const targetBaseUrl = 'https://www.movebank.org/movebank/service/direct-read';

		// CORS headers to allow cross-origin requests from your Angular frontend
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// Handle AI natural language queries
			if (incomingUrl.pathname === '/api/ai-query' && request.method === 'POST') {
				const body = (await request.json()) as { prompt: string };

				const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${env.GROQ_API_KEY}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						model: 'openai/gpt-oss-120b',
						messages: [
							{
								role: 'system',
								content: `You are an expert AI assistant for the Movebank database API. Your task is to analyze natural language user queries and map them into a strict JSON object containing "entity_type" and "filters".

Valid "entity_type" options:
- "study": for projects, initiatives, or broad studies (use when looking for general study lists or specific study IDs).
- "individual": for specific animals, tracks, or species-level telemetry filtering (use this for animal/species queries like white storks).
- "deployment": for animal-tag attachments.
- "tag": for tracking sensors/tags.
- "event": for telemetry locations, GPS fixes, coordinates, or timestamps.
- "taxon": for species or taxonomy.

Instructions for "filters":
1. Extract relevant Movebank API query parameters into the "filters" object.
2. Common parameters to extract if mentioned:
   - "study_id": numeric study identifier (e.g., "123456").
   - "taxon_canonical_name": scientific or common species name translated to canonical form when possible (e.g., "Ciconia ciconia" for white storks).
   - "individual_local_identifier": name or ID of a specific animal.
   - "sensor_type_id": type of sensor (e.g., "gps").
3. Return ONLY a valid JSON object matching this exact structure, with no markdown formatting, code blocks or extra text:
{
  "entity_type": "individual",
  "filters": {
    "taxon_canonical_name": ""
  }
}`,
							},
							{
								role: 'user',
								content: body.prompt,
							},
						],
						response_format: { type: 'json_object' },
					}),
				});

				const aiData = (await groqResponse.json()) as any;
				const rawContent = aiData.choices?.[0]?.message?.content || '{}';
				const parsedContent = JSON.parse(rawContent);

				// Return the clean, unpacked JSON object directly to the client
				return new Response(JSON.stringify(parsedContent), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				});
			}

			const targetUrl = new URL(targetBaseUrl);

			// Forward all incoming query parameters (e.g., entity_type, study_id, etc.) to Movebank
			incomingUrl.searchParams.forEach((value, key) => {
				targetUrl.searchParams.set(key, value);
			});

			const upstreamHeaders: Record<string, string> = {
				'User-Agent': 'Cloudflare-Worker-Movebank-Proxy',
				Accept: 'text/plain, application/json, */*',
			};

			// Inject Basic Authentication and user credentials from Cloudflare secrets
			if (env.MOVEBANK_USERNAME && env.MOVEBANK_PASSWORD) {
				const credentials = btoa(`${env.MOVEBANK_USERNAME}:${env.MOVEBANK_PASSWORD}`);
				upstreamHeaders['Authorization'] = `Basic ${credentials}`;

				// Ensure Movebank receives credentials as query parameters if required by the service
				targetUrl.searchParams.set('user', env.MOVEBANK_USERNAME);
				targetUrl.searchParams.set('password', env.MOVEBANK_PASSWORD);
			}

			const fetchOptions: RequestInit = {
				method: request.method,
				headers: upstreamHeaders,
			};

			if (request.method !== 'GET' && request.method !== 'HEAD') {
				fetchOptions.body = await request.text();
			}

			// Fetch data from the upstream Movebank API
			const apiResponse = await fetch(targetUrl.toString(), fetchOptions);
			const responseData = await apiResponse.text();

			// Intercept upstream HTML error responses (such as Tomcat HTTP Status 500) and return clean JSON
			if (responseData.trim().startsWith('<!DOCTYPE html>') || responseData.includes('HTTP Status 500')) {
				return new Response(
					JSON.stringify({
						error: 'Movebank API Error',
						details: 'The upstream Movebank server rejected the entity/filters combination with an internal error.',
					}),
					{
						status: 502,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' },
					},
				);
			}

			const contentType = apiResponse.headers.get('content-type') || 'text/plain; charset=utf-8';

			// Return the response back to the Angular client with appropriate headers
			return new Response(responseData, {
				status: apiResponse.status,
				headers: {
					...corsHeaders,
					'Content-Type': contentType,
				},
			});
		} catch (err: any) {
			// Catch any proxy-level fetch errors and return a clean JSON error response
			return new Response(JSON.stringify({ error: 'Proxy fetch failed', details: err.message }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}
	},
};
