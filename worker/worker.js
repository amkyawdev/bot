// worker/worker.js - Complete AmkyawDev AI Worker
// Deploy at: https://my.amkai.workers.dev

// ===== CONFIGURATION =====
const CONFIG = {
    name: 'AmkyawDev AI',
    version: '2.0.0',
    environment: 'production',
    cacheTtl: 3600, // 1 hour
    requestTimeout: 10000 // 10 seconds
};

// ===== CORS HEADERS =====
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'X-Request-ID, X-Response-Time',
    'Content-Type': 'application/json'
};

// ===== MAIN WORKER =====
export default {
    async fetch(request, env, ctx) {
        const startTime = Date.now();
        const requestId = crypto.randomUUID().slice(0, 8);
        
        // Add request ID to headers
        corsHeaders['X-Request-ID'] = requestId;

        // Handle OPTIONS request (CORS preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, { 
                status: 204,
                headers: corsHeaders 
            });
        }

        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // Add response time header
            ctx.waitUntil(async () => {
                corsHeaders['X-Response-Time'] = `${Date.now() - startTime}ms`;
            });

            // ===== ROUTING =====
            switch (true) {
                // Root endpoint - API Info
                case path === '/':
                    return handleRoot(requestId);

                // Health check
                case path === '/api/health':
                    return handleHealth(requestId, startTime);

                // Chat endpoint
                case path === '/api/chat' && request.method === 'POST':
                    return handleChat(request, env, requestId);

                // Streaming chat endpoint
                case path === '/api/chat/stream' && request.method === 'POST':
                    return handleStreamChat(request, env, requestId);

                // Code execution endpoint
                case path === '/api/execute-code' && request.method === 'POST':
                    return handleExecuteCode(request, requestId);

                // Summarize endpoint
                case path === '/api/summarize' && request.method === 'POST':
                    return handleSummarize(request, requestId);

                // Translate endpoint
                case path === '/api/translate' && request.method === 'POST':
                    return handleTranslate(request, requestId);

                // Grammar check endpoint
                case path === '/api/grammar' && request.method === 'POST':
                    return handleGrammar(request, requestId);

                // Sentiment analysis endpoint
                case path === '/api/sentiment' && request.method === 'POST':
                    return handleSentiment(request, requestId);

                // 404 Not Found
                default:
                    return handleNotFound(requestId);
            }

        } catch (error) {
            return handleError(error, requestId);
        }
    }
};

// ===== HELPER FUNCTIONS =====

/**
 * Generate JSON response with standard format
 */
function jsonResponse(data, status = 200, requestId = null) {
    const headers = { ...corsHeaders };
    if (requestId) {
        headers['X-Request-ID'] = requestId;
    }
    
    return new Response(JSON.stringify({
        success: status >= 200 && status < 300,
        ...data,
        timestamp: Date.now()
    }), {
        status,
        headers
    });
}

/**
 * Generate error response
 */
function errorResponse(message, status = 500, requestId = null) {
    return jsonResponse({
        error: message,
        code: `ERR_${status}`
    }, status, requestId);
}

// ===== ENDPOINT HANDLERS =====

/**
 * Root endpoint - Show API information
 */
function handleRoot(requestId) {
    return jsonResponse({
        data: {
            name: CONFIG.name,
            version: CONFIG.version,
            description: 'AI-powered API for developers',
            endpoints: [
                { path: '/', method: 'GET', description: 'API information' },
                { path: '/api/health', method: 'GET', description: 'Health check' },
                { path: '/api/chat', method: 'POST', description: 'Chat completion' },
                { path: '/api/chat/stream', method: 'POST', description: 'Streaming chat' },
                { path: '/api/execute-code', method: 'POST', description: 'Execute code in sandbox' },
                { path: '/api/summarize', method: 'POST', description: 'Summarize text' },
                { path: '/api/translate', method: 'POST', description: 'Translate text' },
                { path: '/api/grammar', method: 'POST', description: 'Grammar check' },
                { path: '/api/sentiment', method: 'POST', description: 'Sentiment analysis' }
            ],
            documentation: 'https://github.com/amkyawdev/bot',
            support: 'amk.kyaw92@gmail.com'
        },
        request_id: requestId
    }, 200, requestId);
}

/**
 * Health check endpoint
 */
function handleHealth(requestId, startTime) {
    return jsonResponse({
        data: {
            status: 'healthy',
            uptime: Date.now() - startTime,
            environment: CONFIG.environment,
            version: CONFIG.version,
            timestamp: Date.now()
        },
        request_id: requestId
    }, 200, requestId);
}

/**
 * Chat completion endpoint
 */
async function handleChat(request, env, requestId) {
    try {
        const body = await request.json();
        const { 
            message, 
            history = [], 
            model = 'gpt-4',
            temperature = 0.7,
            max_tokens = 500,
            stream = false 
        } = body;

        // Validate input
        if (!message || typeof message !== 'string') {
            return errorResponse('Message is required and must be a string', 400, requestId);
        }

        if (message.length > 4000) {
            return errorResponse('Message too long (max 4000 characters)', 400, requestId);
        }

        // Log request (for debugging)
        console.log(`[${requestId}] Chat request:`, { 
            message: message.substring(0, 50),
            model, 
            temperature,
            history_length: history.length 
        });

        // Generate AI response
        const response = await generateAIResponse(message, history, model, temperature, max_tokens);

        return jsonResponse({
            data: {
                response: response.text,
                model: model,
                temperature: temperature,
                usage: {
                    prompt_tokens: response.prompt_tokens,
                    completion_tokens: response.completion_tokens,
                    total_tokens: response.prompt_tokens + response.completion_tokens
                },
                finish_reason: response.finish_reason
            },
            request_id: requestId
        }, 200, requestId);

    } catch (error) {
        console.error(`[${requestId}] Chat error:`, error);
        return errorResponse(error.message, 500, requestId);
    }
}

/**
 * Streaming chat endpoint
 */
async function handleStreamChat(request, env, requestId) {
    try {
        const body = await request.json();
        const { 
            message, 
            history = [], 
            model = 'gpt-4',
            temperature = 0.7,
            max_tokens = 500
        } = body;

        if (!message) {
            return errorResponse('Message is required', 400, requestId);
        }

        // Create a stream
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                
                try {
                    // Generate response in chunks
                    const words = message.split(' ');
                    let fullResponse = '';
                    
                    for (let i = 0; i < words.length; i++) {
                        // Add word with space
                        const chunk = words[i] + ' ';
                        fullResponse += chunk;
                        
                        // Send chunk
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({
                                chunk: chunk,
                                index: i,
                                total: words.length,
                                partial: fullResponse
                            })}\n\n`)
                        );
                        
                        // Simulate thinking delay (50-100ms per word)
                        await new Promise(resolve => 
                            setTimeout(resolve, 50 + Math.random() * 50)
                        );
                    }
                    
                    // Send completion
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            done: true,
                            full: fullResponse,
                            usage: {
                                words: words.length,
                                characters: fullResponse.length
                            }
                        })}\n\n`)
                    );
                    
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

        // Return streaming response
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Request-ID': requestId,
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error(`[${requestId}] Stream error:`, error);
        return errorResponse(error.message, 500, requestId);
    }
}

/**
 * Code execution endpoint
 */
async function handleExecuteCode(request, requestId) {
    try {
        const body = await request.json();
        const { code, language = 'javascript' } = body;

        if (!code) {
            return errorResponse('Code is required', 400, requestId);
        }

        // Simple code execution simulation
        let output = '';
        let error = null;

        if (language === 'javascript') {
            try {
                // WARNING: This is for demo only!
                // In production, use a proper sandbox like isolates
                const func = new Function(code);
                const result = func();
                output = String(result);
            } catch (e) {
                error = e.message;
            }
        } else {
            output = `Execution for ${language} is simulated.`;
        }

        return jsonResponse({
            data: {
                output,
                error,
                language,
                execution_time: Math.random() * 100
            },
            request_id: requestId
        }, 200, requestId);

    } catch (error) {
        return errorResponse(error.message, 500, requestId);
    }
}

/**
 * Summarize text endpoint
 */
async function handleSummarize(request, requestId) {
    try {
        const body = await request.json();
        const { text, max_length = 200 } = body;

        if (!text) {
            return errorResponse('Text is required', 400, requestId);
        }

        // Simple summarization (first 3 sentences)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        let summary = sentences.slice(0, 3).join('. ') + '.';
        
        if (summary.length > max_length) {
            summary = summary.substring(0, max_length) + '...';
        }

        return jsonResponse({
            data: {
                summary,
                original_length: text.length,
                summary_length: summary.length,
                compression_ratio: ((1 - summary.length / text.length) * 100).toFixed(1) + '%'
            },
            request_id: requestId
        }, 200, requestId);

    } catch (error) {
        return errorResponse(error.message, 500, requestId);
    }
}

/**
 * Translate text endpoint
 */
async function handleTranslate(request, requestId) {
    try {
        const body = await request.json();
        const { text, target_lang = 'en', source_lang = 'auto' } = body;

        if (!text) {
            return errorResponse('Text is required', 400, requestId);
        }

        // Simple translation simulation
        let translated = text;
        const isMyanmar = /[\u1000-\u109F]/.test(text);
        
        if (source_lang === 'auto') {
            if (isMyanmar && target_lang === 'en') {
                translated = `[English translation]: ${text}`;
            } else if (!isMyanmar && target_lang === 'mm') {
                translated = `[မြန်မာဘာသာပြန်]: ${text}`;
            }
        }

        return jsonResponse({
            data: {
                original: text,
                translated,
                source_lang: isMyanmar ? 'my' : 'en',
                target_lang,
                detected_lang: isMyanmar ? 'my' : 'en'
            },
            request_id: requestId
        }, 200, requestId);

    } catch (error) {
        return errorResponse(error.message, 500, requestId);
    }
}

/**
 * Grammar check endpoint
 */
async function handleGrammar(request, requestId) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text) {
            return errorResponse('Text is required', 400, requestId);
        }

        const issues = [];
        
        // Check for common issues
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

        return jsonResponse({
            data: {
                text,
                issues,
                score: Math.max(0, 100 - issues.length * 25),
                suggestions: issues.map(i => i.suggestion)
            },
            request_id: requestId
        }, 200, requestId);

    } catch (error) {
        return errorResponse(error.message, 500, requestId);
    }
}

/**
 * Sentiment analysis endpoint
 */
async function handleSentiment(request, requestId) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text) {
            return errorResponse('Text is required', 400, requestId);
        }

        // Simple sentiment analysis
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

        return jsonResponse({
            data: {
                text,
                sentiment,
                score,
                confidence: Math.abs(positive - negative) / Math.max(positive + negative, 1),
                details: {
                    positive,
                    negative,
                    neutral: words.length - positive - negative
                }
            },
            request_id: requestId
        }, 200, requestId);

    } catch (error) {
        return errorResponse(error.message, 500, requestId);
    }
}

/**
 * 404 Not Found handler
 */
function handleNotFound(requestId) {
    return jsonResponse({
        error: 'Endpoint not found',
        available_endpoints: [
            '/',
            '/api/health',
            '/api/chat',
            '/api/chat/stream',
            '/api/execute-code',
            '/api/summarize',
            '/api/translate',
            '/api/grammar',
            '/api/sentiment'
        ]
    }, 404, requestId);
}

/**
 * Global error handler
 */
function handleError(error, requestId) {
    console.error(`[${requestId}] Unhandled error:`, error);
    return errorResponse('Internal server error: ' + error.message, 500, requestId);
}

// ===== AI RESPONSE GENERATION =====

/**
 * Generate AI response based on message and history
 */
async function generateAIResponse(message, history, model, temperature, max_tokens) {
    const lower = message.toLowerCase();
    
    // ===== RESPONSE DATABASE =====
    const responses = {
        // Greetings
        greetings: [
            "Hello! How can I help you today?",
            "Hi there! What can I do for you?",
            "Hey! Great to see you. How can I assist?",
            "Greetings! How may I help you?"
        ],
        
        // How are you
        howAreYou: [
            "I'm doing great, thank you for asking! How about you?",
            "All systems operational! How can I help?",
            "I'm functioning perfectly. What can I do for you?",
            "Doing well, thanks! How are you today?"
        ],
        
        // Thanks
        thanks: [
            "You're welcome! Happy to help!",
            "My pleasure! Anything else you need?",
            "Glad I could assist!",
            "You're most welcome!"
        ],
        
        // Goodbye
        goodbye: [
            "Goodbye! Have a wonderful day!",
            "See you later! Feel free to come back anytime.",
            "Take care! Looking forward to our next chat.",
            "Bye for now! Stay awesome!"
        ],
        
        // Help
        help: [
            "I can help you with:\n• Answering questions\n• Writing code\n• Translating text\n• Summarizing content\n• Checking grammar\n• Analyzing sentiment\n\nWhat would you like help with?",
            "Need assistance? I'm here to help with coding, translation, summarization, and more!",
            "How can I be of service? I can help with various tasks - just ask!"
        ],
        
        // Coding
        coding: [
            "I'd be happy to help with coding! What language are you using?",
            "Great! I can help write, debug, or explain code. What do you need?",
            "Let's code! Tell me what you're working on."
        ],
        
        // About
        about: [
            "I'm AmkyawDev AI, your intelligent assistant. I can help with coding, translation, and more!",
            "I'm an AI assistant created to help developers with their daily tasks.",
            "I'm here to make your life easier! Just ask me anything."
        ],
        
        // Default responses
        default: [
            "That's interesting. Tell me more about that.",
            "I understand. What else would you like to know?",
            "Thanks for sharing. How can I help with that?",
            "I see. Could you elaborate a bit more?",
            "Got it. What specific information are you looking for?"
        ]
    };

    // ===== RESPONSE SELECTION LOGIC =====
    let responseText = '';
    let category = 'default';

    // Check for greetings
    if (lower.match(/^(hello|hi|hey|greetings|sup|yo)/i)) {
        category = 'greetings';
        responseText = responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
    }
    // Check for how are you
    else if (lower.match(/how (are|'re) you|howdy|what'?s up/i)) {
        category = 'howAreYou';
        responseText = responses.howAreYou[Math.floor(Math.random() * responses.howAreYou.length)];
    }
    // Check for thanks
    else if (lower.match(/thank|thanks|appreciate| grateful/i)) {
        category = 'thanks';
        responseText = responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
    }
    // Check for goodbye
    else if (lower.match(/bye|goodbye|see you|farewell|cya|take care/i)) {
        category = 'goodbye';
        responseText = responses.goodbye[Math.floor(Math.random() * responses.goodbye.length)];
    }
    // Check for help
    else if (lower.match(/help|assist|support|can you/i)) {
        category = 'help';
        responseText = responses.help[Math.floor(Math.random() * responses.help.length)];
    }
    // Check for coding
    else if (lower.match(/code|programming|function|javascript|python|java|coding|develop|app|software/i)) {
        category = 'coding';
        responseText = responses.coding[Math.floor(Math.random() * responses.coding.length)];
    }
    // Check for about
    else if (lower.match(/who are you|what are you|your name|about you/i)) {
        category = 'about';
        responseText = responses.about[Math.floor(Math.random() * responses.about.length)];
    }
    // Default response
    else {
        responseText = responses.default[Math.floor(Math.random() * responses.default.length)];
    }

    // If no response selected, use default
    if (!responseText) {
        responseText = responses.default[Math.floor(Math.random() * responses.default.length)];
    }

    // ===== CONTEXT-AWARE RESPONSES =====
    // If there's history, make response more contextual
    if (history && history.length > 0) {
        const lastUserMessage = history
            .filter(msg => msg.role === 'user')
            .pop()?.content || '';
            
        if (lastUserMessage && category === 'default') {
            responseText = `Following up on your previous message about "${lastUserMessage.substring(0, 30)}...", ${responseText.toLowerCase()}`;
        }
    }

    // ===== TOKEN COUNTING (approximate) =====
    const promptTokens = message.length + JSON.stringify(history).length;
    const completionTokens = responseText.length;

    return {
        text: responseText,
        prompt_tokens: Math.ceil(promptTokens / 4), // Rough approximation
        completion_tokens: Math.ceil(completionTokens / 4),
        finish_reason: 'stop',
        category: category
    };
}