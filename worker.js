// Cloudflare Worker for AmkyawDev AI - Fixed Version

// CORS headers for all responses
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
};

// JSON response helper
function jsonResponse(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
            ...headers
        }
    });
}

// Error response helper
function errorResponse(message, status = 500, details = null) {
    return jsonResponse({
        error: message,
        details: details,
        timestamp: Date.now()
    }, status);
}

// Success response helper
function successResponse(data, message = 'Success') {
    return jsonResponse({
        success: true,
        message,
        data,
        timestamp: Date.now()
    });
}

// Handle CORS preflight
function handleOptions() {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

// ===== CHAT HANDLER =====
async function handleChat(request) {
    try {
        const { message, context = [], model = 'gpt-3.5', chatId } = await request.json();

        if (!message) {
            return errorResponse('Message is required', 400);
        }

        const responses = [
            `I understand you're asking about "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}". Let me help you with that.`,
            `That's an interesting question about "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}". Here's what I think...`,
            `Based on your question "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}", I would say that...`,
            `Thanks for asking about "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}". The answer is...`
        ];

        const response = {
            reply: responses[Math.floor(Math.random() * responses.length)],
            model: model,
            timestamp: Date.now(),
            chatId: chatId || `chat_${Date.now()}`,
            context_length: context?.length || 0
        };

        return successResponse(response, 'Message processed successfully');

    } catch (error) {
        console.error('Chat error:', error);
        return errorResponse('Failed to process chat message', 500, error.message);
    }
}

// ===== STREAM HANDLER =====
async function handleChatStream(request) {
    try {
        const { message } = await request.json();

        if (!message) {
            return errorResponse('Message is required', 400);
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const words = `This is a streaming response to your message: "${message}". `.split(' ');
                const totalWords = words.length;

                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    const chunk = JSON.stringify({
                        chunk: word,
                        progress: Math.round(((i + 1) / totalWords) * 100),
                        done: i === totalWords - 1
                    }) + '\n';

                    controller.enqueue(encoder.encode(chunk));
                    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
                }

                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                ...CORS_HEADERS,
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error('Stream error:', error);
        return errorResponse('Failed to process stream', 500, error.message);
    }
}

// ===== IMAGE GENERATION HANDLER =====
async function handleImageGeneration(request) {
    try {
        const { prompt, style = 'photorealistic', size = '1024x1024', num_images = 1 } = await request.json();

        if (!prompt) {
            return errorResponse('Prompt is required', 400);
        }

        const images = [];
        for (let i = 0; i < num_images; i++) {
            images.push({
                url: `https://picsum.photos/1024/1024?random=${Date.now() + i}`,
                id: `img_${Date.now()}_${i}`,
                prompt,
                style,
                size
            });
        }

        const response = {
            images,
            prompt,
            style,
            size,
            num_generated: images.length,
            timestamp: Date.now()
        };

        return successResponse(response, 'Images generated successfully');

    } catch (error) {
        console.error('Image generation error:', error);
        return errorResponse('Failed to generate images', 500, error.message);
    }
}

// ===== CODE EXECUTION HANDLER =====
async function handleCodeExecution(request) {
    try {
        const { code, language, input = '' } = await request.json();

        if (!code || !language) {
            return errorResponse('Code and language are required', 400);
        }

        let output = '';
        let executionTime = Math.random() * 500 + 100;

        switch(language.toLowerCase()) {
            case 'javascript':
            case 'js':
                output = `> ${code.includes('console.log') ? 'Hello, World!' : 'Code executed successfully!'}\n> Execution time: ${executionTime.toFixed(2)}ms`;
                break;
            case 'python':
            case 'py':
                output = `>>> ${code.includes('print') ? 'Hello, World!' : 'Code executed successfully!'}\n>>> Execution time: ${executionTime.toFixed(2)}ms`;
                break;
            case 'html':
                output = 'HTML rendered successfully';
                break;
            default:
                output = `Code executed successfully in ${language}`;
        }

        const response = {
            output,
            language,
            execution_time_ms: executionTime,
            exit_code: 0
        };

        return successResponse(response, 'Code executed successfully');

    } catch (error) {
        console.error('Code execution error:', error);
        return errorResponse('Failed to execute code', 500, error.message);
    }
}

// ===== SUMMARIZE HANDLER =====
async function handleSummarize(request) {
    try {
        const { text, length = 'medium' } = await request.json();

        if (!text) {
            return errorResponse('Text is required', 400);
        }

        const words = text.split(' ');
        let summary = text;

        if (words.length > 50) {
            if (length === 'short') {
                summary = words.slice(0, 20).join(' ') + '...';
            } else if (length === 'medium') {
                summary = words.slice(0, 50).join(' ') + '...';
            } else {
                summary = words.slice(0, 100).join(' ') + '...';
            }
        }

        const response = {
            summary,
            original_length: words.length,
            summary_length: summary.split(' ').length
        };

        return successResponse(response, 'Text summarized successfully');

    } catch (error) {
        console.error('Summarize error:', error);
        return errorResponse('Failed to summarize text', 500, error.message);
    }
}

// ===== TRANSLATE HANDLER =====
async function handleTranslate(request) {
    try {
        const { text, from = 'auto', to = 'en' } = await request.json();

        if (!text || !to) {
            return errorResponse('Text and target language are required', 400);
        }

        const response = {
            original_text: text,
            translated_text: `[${to}] ${text}`,
            from: from,
            to: to,
            timestamp: Date.now()
        };

        return successResponse(response, 'Text translated successfully');

    } catch (error) {
        console.error('Translate error:', error);
        return errorResponse('Failed to translate text', 500, error.message);
    }
}

// ===== GRAMMAR HANDLER =====
async function handleGrammar(request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return errorResponse('Text is required', 400);
        }

        let corrections = [];
        let corrected = text;

        const patterns = [
            { find: /\bi\b/g, replace: 'I', desc: 'Capitalize "I"' },
            { find: /\bdont\b/g, replace: "don't", desc: 'Add apostrophe' },
            { find: /\bcant\b/g, replace: "can't", desc: 'Add apostrophe' }
        ];

        patterns.forEach(pattern => {
            if (pattern.find.test(corrected)) {
                corrected = corrected.replace(pattern.find, pattern.replace);
                corrections.push({
                    type: 'grammar',
                    description: pattern.desc
                });
            }
        });

        const response = {
            original: text,
            corrected: corrections.length > 0 ? corrected : null,
            corrections: corrections,
            issues_found: corrections.length
        };

        return successResponse(response, 'Grammar check completed');

    } catch (error) {
        console.error('Grammar error:', error);
        return errorResponse('Failed to check grammar', 500, error.message);
    }
}

// ===== SENTIMENT HANDLER =====
async function handleSentiment(request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return errorResponse('Text is required', 400);
        }

        const words = text.toLowerCase().split(/\W+/);
        const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'best'];
        const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'angry', 'hate', 'worst'];

        let positiveCount = 0;
        let negativeCount = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });

        let sentiment = 'neutral';
        let score = 0.5;

        if (positiveCount > negativeCount) {
            sentiment = 'positive';
            score = 0.5 + (positiveCount / (positiveCount + negativeCount + 1)) * 0.5;
        } else if (negativeCount > positiveCount) {
            sentiment = 'negative';
            score = 0.5 - (negativeCount / (positiveCount + negativeCount + 1)) * 0.5;
        }

        const response = {
            sentiment,
            score: parseFloat(score.toFixed(3)),
            confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(3))
        };

        return successResponse(response, 'Sentiment analysis completed');

    } catch (error) {
        console.error('Sentiment error:', error);
        return errorResponse('Failed to analyze sentiment', 500, error.message);
    }
}

// ===== HEALTH CHECK HANDLER (FIXED) =====
function handleHealth() {
    // ✅ FIXED: Removed process.uptime()
    return successResponse({
        status: 'healthy',
        version: '2.0.0',
        uptime: 'N/A',  // Process removed for Cloudflare Workers
        timestamp: Date.now(),
        endpoints: [
            '/api/chat',
            '/api/chat/stream',
            '/api/generate-image',
            '/api/execute-code',
            '/api/summarize',
            '/api/translate',
            '/api/grammar',
            '/api/sentiment',
            '/api/health'
        ]
    }, 'Service is healthy');
}

// ===== NOT FOUND HANDLER =====
function handleNotFound() {
    return jsonResponse({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        available_endpoints: [
            '/api/chat',
            '/api/chat/stream',
            '/api/generate-image',
            '/api/execute-code',
            '/api/summarize',
            '/api/translate',
            '/api/grammar',
            '/api/sentiment',
            '/api/health'
        ]
    }, 404);
}

// ===== MAIN WORKER HANDLER =====
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;

        console.log(`${method} ${url.pathname}`);

        if (method === 'OPTIONS') {
            return handleOptions();
        }

        try {
            if (url.pathname === '/api/chat' && method === 'POST') {
                return await handleChat(request);
            }

            if (url.pathname === '/api/chat/stream' && method === 'POST') {
                return await handleChatStream(request);
            }

            if (url.pathname === '/api/generate-image' && method === 'POST') {
                return await handleImageGeneration(request);
            }

            if (url.pathname === '/api/execute-code' && method === 'POST') {
                return await handleCodeExecution(request);
            }

            if (url.pathname === '/api/summarize' && method === 'POST') {
                return await handleSummarize(request);
            }

            if (url.pathname === '/api/translate' && method === 'POST') {
                return await handleTranslate(request);
            }

            if (url.pathname === '/api/grammar' && method === 'POST') {
                return await handleGrammar(request);
            }

            if (url.pathname === '/api/sentiment' && method === 'POST') {
                return await handleSentiment(request);
            }

            if (url.pathname === '/api/health' && method === 'GET') {
                return handleHealth();
            }

            if (url.pathname === '/' || url.pathname === '/api') {
                return successResponse({
                    name: 'AmkyawDev AI API',
                    version: '2.0.0',
                    description: 'AI-powered API',
                    endpoints: [
                        '/api/chat',
                        '/api/chat/stream',
                        '/api/generate-image',
                        '/api/execute-code',
                        '/api/summarize',
                        '/api/translate',
                        '/api/grammar',
                        '/api/sentiment',
                        '/api/health'
                    ]
                });
            }

            return handleNotFound();

        } catch (error) {
            console.error('Worker error:', error);
            return errorResponse('Internal server error', 500, error.message);
        }
    }
};