// worker/worker.js - Complete Cloudflare Worker for AmkyawDev AI API
// API Base URL: https://my.amkai.workers.dev

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        // ===== API ROOT =====
        if (url.pathname === '/') {
            return this.handleRoot(corsHeaders);
        }

        // ===== HEALTH CHECK =====
        if (url.pathname === '/api/health') {
            return this.handleHealth(corsHeaders);
        }

        // ===== CHAT ENDPOINTS =====
        if (url.pathname === '/api/chat' && request.method === 'POST') {
            return this.handleChat(request, corsHeaders);
        }

        if (url.pathname === '/api/chat/stream' && request.method === 'POST') {
            return this.handleStreamChat(request, corsHeaders);
        }

        // ===== IMAGE GENERATION =====
        if (url.pathname === '/api/generate-image' && request.method === 'POST') {
            return this.handleGenerateImage(request, corsHeaders);
        }

        // ===== CODE EXECUTION =====
        if (url.pathname === '/api/execute-code' && request.method === 'POST') {
            return this.handleExecuteCode(request, corsHeaders);
        }

        // ===== TEXT PROCESSING =====
        if (url.pathname === '/api/summarize' && request.method === 'POST') {
            return this.handleSummarize(request, corsHeaders);
        }

        if (url.pathname === '/api/translate' && request.method === 'POST') {
            return this.handleTranslate(request, corsHeaders);
        }

        if (url.pathname === '/api/grammar' && request.method === 'POST') {
            return this.handleGrammar(request, corsHeaders);
        }

        if (url.pathname === '/api/sentiment' && request.method === 'POST') {
            return this.handleSentiment(request, corsHeaders);
        }

        // 404 Not Found
        return new Response(JSON.stringify({
            success: false,
            error: 'Endpoint not found',
            available_endpoints: [
                '/',
                '/api/health',
                '/api/chat',
                '/api/chat/stream',
                '/api/generate-image',
                '/api/execute-code',
                '/api/summarize',
                '/api/translate',
                '/api/grammar',
                '/api/sentiment'
            ]
        }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    },

    // ===== HANDLER FUNCTIONS =====

    handleRoot(corsHeaders) {
        const data = {
            success: true,
            message: "Welcome to AmkyawDev AI API",
            data: {
                name: "AmkyawDev AI API",
                version: "2.0.0",
                description: "AI-powered API for developers",
                endpoints: [
                    "/api/chat",
                    "/api/chat/stream",
                    "/api/generate-image",
                    "/api/execute-code",
                    "/api/summarize",
                    "/api/translate",
                    "/api/grammar",
                    "/api/sentiment",
                    "/api/health"
                ],
                documentation: "https://docs.amkyawdev.com",
                support: "support@amkyawdev.com"
            },
            timestamp: Date.now()
        };

        return new Response(JSON.stringify(data, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    },

    handleHealth(corsHeaders) {
        return new Response(JSON.stringify({
            success: true,
            status: 'healthy',
            message: 'API is running',
            timestamp: Date.now(),
            uptime: process.uptime ? Math.floor(process.uptime()) : 0
        }), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    },

    async handleChat(request, corsHeaders) {
        try {
            const body = await request.json();
            const { message, history = [], model = 'gpt-4', temperature = 0.7 } = body;

            if (!message) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Message is required'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            const response = this.generateAIResponse(message, history);

            return new Response(JSON.stringify({
                success: true,
                data: {
                    response: response,
                    model: model,
                    temperature: temperature,
                    usage: {
                        prompt_tokens: message.length,
                        completion_tokens: response.length,
                        total_tokens: message.length + response.length
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
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid request body',
                message: error.message
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },

    async handleStreamChat(request, corsHeaders) {
        try {
            const body = await request.json();
            const { message, model = 'gpt-4', temperature = 0.7 } = body;

            if (!message) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Message is required'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    const words = message.split(' ');
                    let response = '';

                    for (let i = 0; i < words.length; i++) {
                        response += words[i] + ' ';
                        
                        const chunk = {
                            chunk: words[i] + ' ',
                            index: i,
                            total: words.length,
                            model: model,
                            temperature: temperature
                        };
                        
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

                        await new Promise(resolve => setTimeout(resolve, 50));
                    }

                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    ...corsHeaders
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Stream error',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },

    async handleGenerateImage(request, corsHeaders) {
        try {
            const body = await request.json();
            const { prompt, size = '512x512', quality = 'standard' } = body;

            if (!prompt) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Prompt is required'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            const imageId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            return new Response(JSON.stringify({
                success: true,
                data: {
                    id: imageId,
                    url: `https://via.placeholder.com/${size}.png?text=${encodeURIComponent(prompt)}`,
                    prompt: prompt,
                    size: size,
                    quality: quality,
                    created: new Date().toISOString()
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Image generation failed',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },

    async handleExecuteCode(request, corsHeaders) {
        try {
            const body = await request.json();
            const { code, language = 'javascript' } = body;

            if (!code) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Code is required'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            let output = '';
            let error = null;

            if (language === 'javascript') {
                try {
                    const func = new Function(code);
                    const result = func();
                    output = String(result);
                } catch (e) {
                    error = e.message;
                }
            } else {
                output = `Execution for ${language} is simulated.`;
            }

            return new Response(JSON.stringify({
                success: !error,
                data: {
                    output: output,
                    error: error,
                    language: language,
                    execution_time: Math.random() * 100
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Code execution failed',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },

    async handleSummarize(request, corsHeaders) {
        try {
            const body = await request.json();
            const { text, max_length = 200 } = body;

            if (!text) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Text is required'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            const sentences = text.split(/[.!?]+/);
            let summary = sentences.slice(0, 3).join('. ') + '.';
            
            if (summary.length > max_length) {
                summary = summary.substring(0, max_length) + '...';
            }

            return new Response(JSON.stringify({
                success: true,
                data: {
                    summary: summary,
                    original_length: text.length,
                    summary_length: summary.length,
                    compression_ratio: ((1 - summary.length / text.length) * 100).toFixed(1) + '%'
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Summarization failed',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },

    async handleTranslate(request, corsHeaders) {
        try {
            const body = await request.json();
            const { text, target_lang = 'en', source_lang = 'auto' } = body;

            if (!text) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Text is required'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            let translated = text;
            if (source_lang === 'auto') {
                const isMyanmar = /[\u1000-\u109F]/.test(text);
                if (isMyanmar && target_lang === 'en') {
                    translated = 'This is a translation from Myanmar: ' + text;
                } else if (!isMyanmar && target_lang === 'mm') {
                    translated = 'မြန်မာဘာသာပြန်: ' + text;
                } else {
                    translated = text;
                }
            }

            return new Response(JSON.stringify({
                success: true,
                data: {
                    original: text,
                    translated: translated,
                    source_lang: source_lang,
                    target_lang: target_lang,
                    detected_lang: /[\u1000-\u109F]/.test(text) ? 'my' : 'en'
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Translation failed',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },

    async handleGrammar(request, corsHeaders) {
        try {
            const body = await request.json();
            const { text } = body;

            if (!text) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Text is required'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            const issues = [];
            
            if (!text.match(/[.!?]$/)) {
                issues.push({
                    type: 'punctuation',
                    message: 'Sentence should end with punctuation',
                    position: text.length,
                    suggestion: text + '.'
                });
            }

            if (text.match(/\s{2,}/)) {
                issues.push({
                    type: 'spacing',
                    message: 'Multiple spaces detected',
                    suggestion: text.replace(/\s{2,}/g, ' ')
                });
            }

            if (text.match(/\bi\b/g)) {
                issues.push({
                    type: 'capitalization',
                    message: "'i' should be capitalized",
                    suggestion: text.replace(/\bi\b/g, 'I')
                });
            }

            return new Response(JSON.stringify({
                success: true,
                data: {
                    text: text,
                    issues: issues,
                    score: Math.max(0, 100 - issues.length * 25),
                    suggestions: issues.map(i => i.suggestion)
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Grammar check failed',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },

    async handleSentiment(request, corsHeaders) {
        try {
            const body = await request.json();
            const { text } = body;

            if (!text) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Text is required'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            const positiveWords = ['good', 'great', 'excellent', 'awesome', 'love', 'best', 'happy', 'wonderful'];
            const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'sad', 'angry', 'horrible'];
            
            const words = text.toLowerCase().split(/\s+/);
            let positive = 0, negative = 0;
            
            words.forEach(word => {
                if (positiveWords.includes(word)) positive++;
                if (negativeWords.includes(word)) negative++;
            });

            let sentiment = 'neutral';
            let score = 0.5;
            
            if (positive > negative) {
                sentiment = 'positive';
                score = 0.5 + (positive * 0.1);
            } else if (negative > positive) {
                sentiment = 'negative';
                score = 0.5 - (negative * 0.1);
            }

            score = Math.max(0, Math.min(1, score));

            return new Response(JSON.stringify({
                success: true,
                data: {
                    text: text,
                    sentiment: sentiment,
                    score: score,
                    confidence: Math.abs(positive - negative) / Math.max(positive + negative, 1),
                    details: {
                        positive: positive,
                        negative: negative,
                        neutral: words.length - positive - negative
                    }
                }
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Sentiment analysis failed',
                message: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },

    generateAIResponse(message, history) {
        const lower = message.toLowerCase();
        
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            return "Hello! How can I help you today?";
        }

        if (lower.includes('thank')) {
            return "You're welcome! Is there anything else I can help with?";
        }

        if (lower.includes('bye') || lower.includes('goodbye')) {
            return "Goodbye! Feel free to come back if you need more help.";
        }

        if (lower.includes('help')) {
            return "I can help you with various tasks:\n- Answering questions\n- Writing code\n- Translating text\n- Summarizing content\n- Checking grammar\n- Analyzing sentiment\n\nWhat would you like help with?";
        }

        if (lower.includes('code') || lower.includes('programming') || lower.includes('function')) {
            return "I'd be happy to help with coding! Could you specify what language and what you're trying to accomplish?";
        }

        if (history && history.length > 0) {
            return "Based on our conversation, I understand your query. Let me help you with that.";
        }

        const responses = [
            "I understand. Could you tell me more?",
            "That's interesting! What else would you like to know?",
            "I'm here to help. What specific information are you looking for?",
            "Got it. Let me think about that for a moment.",
            "Thanks for your message. How can I assist you further?"
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }
};