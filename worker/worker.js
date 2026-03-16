// Cloudflare Worker for AmkyawDev AI
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // API Routes
        if (url.pathname === '/api/chat' && request.method === 'POST') {
            return handleChat(request, env, corsHeaders);
        }

        if (url.pathname === '/api/chat/stream' && request.method === 'POST') {
            return handleChatStream(request, env, corsHeaders);
        }

        if (url.pathname === '/api/generate-image' && request.method === 'POST') {
            return handleImageGeneration(request, env, corsHeaders);
        }

        if (url.pathname === '/api/execute-code' && request.method === 'POST') {
            return handleCodeExecution(request, env, corsHeaders);
        }

        if (url.pathname === '/api/summarize' && request.method === 'POST') {
            return handleSummarize(request, env, corsHeaders);
        }

        if (url.pathname === '/api/translate' && request.method === 'POST') {
            return handleTranslate(request, env, corsHeaders);
        }

        if (url.pathname === '/api/grammar' && request.method === 'POST') {
            return handleGrammar(request, env, corsHeaders);
        }

        if (url.pathname === '/api/sentiment' && request.method === 'POST') {
            return handleSentiment(request, env, corsHeaders);
        }

        if (url.pathname === '/api/health') {
            return handleHealth(corsHeaders);
        }

        // Serve static files
        return serveStatic(url.pathname, corsHeaders);
    }
};

// Chat handler
async function handleChat(request, env, corsHeaders) {
    try {
        const { message, history } = await request.json();
        
        // Here you would integrate with AI API (OpenAI, Claude, etc.)
        // For demo, return mock response
        
        const responses = [
            `I understand you're asking about "${message}". Let me help you with that.`,
            `That's an interesting question about "${message}". Here's what I think...`,
            `Based on your question "${message}", I would say that...`,
            `Thanks for asking about "${message}". The answer is...`
        ];
        
        const response = {
            reply: responses[Math.floor(Math.random() * responses.length)],
            timestamp: Date.now()
        };
        
        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Stream handler (for real-time responses)
async function handleChatStream(request, env, corsHeaders) {
    try {
        const { message } = await request.json();
        
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const words = `This is a streaming response to your message: "${message}". `.split(' ');
                
                for (const word of words) {
                    controller.enqueue(encoder.encode(word + ' '));
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Image generation handler
async function handleImageGeneration(request, env, corsHeaders) {
    try {
        const { prompt, style, size } = await request.json();
        
        // Mock image generation
        const response = {
            imageUrl: `https://picsum.photos/1024/1024?random=${Date.now()}`,
            prompt,
            style,
            size
        };
        
        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Code execution handler
async function handleCodeExecution(request, env, corsHeaders) {
    try {
        const { code, language } = await request.json();
        
        // Mock code execution
        let output = '';
        
        if (language === 'javascript') {
            output = 'Hello, World!\n> Code executed successfully!';
        } else if (language === 'python') {
            output = 'Hello, World!\n>>> Code executed successfully!';
        } else {
            output = 'Code executed successfully!';
        }
        
        const response = {
            output,
            language
        };
        
        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Summarize handler
async function handleSummarize(request, env, corsHeaders) {
    try {
        const { text } = await request.json();
        
        // Mock summarization
        const summary = text.length > 100 ? 
            text.substring(0, 100) + '... (summarized)' : 
            text;
        
        return new Response(JSON.stringify({ summary }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Translate handler
async function handleTranslate(request, env, corsHeaders) {
    try {
        const { text, from, to } = await request.json();
        
        // Mock translation
        const translations = {
            'en': `[English] ${text}`,
            'my': `[Burmese] ${text}`,
            'th': `[Thai] ${text}`,
            'zh': `[Chinese] ${text}`
        };
        
        const translation = translations[to] || `[Translated] ${text}`;
        
        return new Response(JSON.stringify({ translation }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Grammar handler
async function handleGrammar(request, env, corsHeaders) {
    try {
        const { text } = await request.json();
        
        // Mock grammar check
        const corrected = text
            .replace(/ i /g, ' I ')
            .replace(/ dont /g, " don't ")
            .replace(/ cant /g, " can't ");
        
        return new Response(JSON.stringify({ 
            original: text,
            corrected: corrected !== text ? corrected : null
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Sentiment handler
async function handleSentiment(request, env, corsHeaders) {
    try {
        const { text } = await request.json();
        
        // Mock sentiment analysis
        const sentiments = ['positive', 'neutral', 'negative'];
        const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        
        const response = {
            sentiment: randomSentiment,
            score: Math.random(),
            confidence: 0.8 + Math.random() * 0.2
        };
        
        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Health check
function handleHealth(corsHeaders) {
    return new Response(JSON.stringify({ 
        status: 'healthy',
        timestamp: Date.now(),
        version: '2.0.0'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Static file serving (for production)
async function serveStatic(pathname, corsHeaders) {
    // In production, you would serve static files from KV or R2
    return new Response('Not found', { 
        status: 404,
        headers: corsHeaders
    });
}
