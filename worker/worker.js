// worker/worker.js - ERROR 1101 FIXED VERSION
export default {
    async fetch(request, env, ctx) {
        // CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle OPTIONS request (CORS preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        const url = new URL(request.url);

        // Health check
        if (url.pathname === '/api/health') {
            return new Response(JSON.stringify({
                success: true,
                message: 'API is healthy',
                timestamp: Date.now()
            }), { headers });
        }

        // Chat endpoint
        if (url.pathname === '/api/chat' && request.method === 'POST') {
            try {
                const body = await request.json();
                const message = body.message || '';

                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        response: `Echo: ${message}`,
                        model: 'gpt-4',
                        usage: {
                            prompt_tokens: message.length,
                            completion_tokens: 50,
                            total_tokens: message.length + 50
                        }
                    },
                    timestamp: Date.now()
                }), { headers });

            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: error.message
                }), { 
                    status: 400,
                    headers 
                });
            }
        }

        // Root endpoint
        if (url.pathname === '/') {
            return new Response(JSON.stringify({
                success: true,
                name: 'AmkyawDev AI API',
                version: '1.0.0',
                endpoints: ['/api/health', '/api/chat']
            }), { headers });
        }

        // 404
        return new Response(JSON.stringify({
            success: false,
            error: 'Not found'
        }), { 
            status: 404,
            headers 
        });
    }
};
