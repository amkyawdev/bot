export default {
  async fetch(request, env) {
    // CORS headers - Browser ကနေခေါ်လို့ရအောင်
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS request (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    // URL path ကိုခွဲကြည့်မယ်
    const url = new URL(request.url);
    const path = url.pathname;

    // ===== ROOT ENDPOINT - API Info =====
    if (path === '/' && request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          name: "AmkyawDev AI",
          version: "2.0.0",
          description: "AI-powered API for developers",
          endpoints: [
            { path: "/", method: "GET", description: "API information" },
            { path: "/api/health", method: "GET", description: "Health check" },
            { path: "/api/chat", method: "POST", description: "Chat completion" },
            { path: "/api/chat/stream", method: "POST", description: "Streaming chat" }
          ]
        },
        timestamp: Date.now()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // ===== HEALTH CHECK ENDPOINT =====
    if (path === '/api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        status: "healthy",
        timestamp: Date.now()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // ===== CHAT ENDPOINT =====
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        // Request body ကိုဖတ်မယ်
        const body = await request.json();
        const { prompt, message, messages } = body;
        
        // သုံးမယ့် prompt ကိုသတ်မှတ်မယ်
        const userPrompt = prompt || message || "What is the origin of the phrase Hello, World";

        // Cloudflare AI ကိုခေါ်မယ်
        const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          prompt: userPrompt,
          temperature: 0.7,
          max_tokens: 500
        });

        // Response ကိုပြန်ပို့မယ်
        return new Response(JSON.stringify({
          success: true,
          data: {
            response: aiResponse.response || aiResponse,
            prompt: userPrompt,
            model: "llama-3.1-8b-instruct",
            usage: {
              prompt_tokens: userPrompt.length,
              completion_tokens: (aiResponse.response || aiResponse).length,
              total_tokens: userPrompt.length + (aiResponse.response || aiResponse).length
            }
          },
          timestamp: Date.now()
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      } catch (error) {
        // Error ဖြစ်ရင်
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // ===== STREAMING CHAT ENDPOINT =====
    if (path === '/api/chat/stream' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { prompt, message } = body;
        const userPrompt = prompt || message || "Tell me a story";

        // Streaming response အတွက်
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            
            try {
              const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
                prompt: userPrompt,
                temperature: 0.7,
                max_tokens: 500,
                stream: true
              });

              // AI response ကိုအပိုင်းပိုင်းဖြတ်ပြီးပို့မယ်
              const words = (aiResponse.response || aiResponse).split(' ');
              
              for (let i = 0; i < words.length; i++) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    chunk: words[i] + ' ',
                    index: i,
                    total: words.length
                  })}\n\n`)
                );
                
                // 50ms ခြားပြီးပို့မယ်
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              
            } catch (error) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  error: error.message
                })}\n\n`)
              );
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // ===== 404 NOT FOUND =====
    return new Response(JSON.stringify({
      success: false,
      error: "Endpoint not found",
      available_endpoints: [
        "/",
        "/api/health",
        "/api/chat",
        "/api/chat/stream"
      ]
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}
