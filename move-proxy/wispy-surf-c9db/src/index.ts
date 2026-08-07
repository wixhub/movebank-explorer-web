/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	MOVEBANK_USERNAME: string;
	MOVEBANK_PASSWORD: string;
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
