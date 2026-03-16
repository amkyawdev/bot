// Cloudflare Worker for AmkyawDev AI - Enhanced Version

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

// ===== CHAT HANDLERS =====
async function handleChat(request) {
    try {
        const { message, context = [], model = 'gpt-3.5', chatId } = await request.json();
        
        if (!message) {
            return errorResponse('Message is required', 400);
        }
        
        // Here you would integrate with AI API (OpenAI, Claude, etc.)
        // For demo, return intelligent responses
        
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

// Stream handler (for real-time responses)
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
                    
                    // Random delay between 50-150ms
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
        
        // Mock image generation with multiple images
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
        
        // Mock code execution with different outputs per language
        let output = '';
        let executionTime = Math.random() * 500 + 100; // 100-600ms
        
        switch(language.toLowerCase()) {
            case 'javascript':
            case 'js':
                output = `> ${code.includes('console.log') ? 'Hello, World!' : 'Code executed successfully!'}\n> Execution time: ${executionTime.toFixed(2)}ms\n> Memory used: ${(Math.random() * 10 + 5).toFixed(2)} MB`;
                break;
            case 'python':
            case 'py':
                output = `>>> ${code.includes('print') ? 'Hello, World!' : 'Code executed successfully!'}\n>>> Execution time: ${executionTime.toFixed(2)}ms\n>>> Memory used: ${(Math.random() * 15 + 10).toFixed(2)} MB`;
                break;
            case 'html':
                output = 'HTML rendered successfully';
                break;
            case 'css':
                output = 'CSS parsed successfully';
                break;
            default:
                output = `Code executed successfully!\nLanguage: ${language}\nExecution time: ${executionTime.toFixed(2)}ms`;
        }
        
        const response = {
            output,
            language,
            execution_time_ms: executionTime,
            memory_used_mb: Math.random() * 20 + 5,
            exit_code: 0,
            input_received: input ? true : false
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
        const { text, length = 'medium', format = 'paragraph' } = await request.json();
        
        if (!text) {
            return errorResponse('Text is required', 400);
        }
        
        // Mock summarization
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
            summary_length: summary.split(' ').length,
            format,
            compression_ratio: (summary.length / text.length * 100).toFixed(2) + '%'
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
        
        if (!text) {
            return errorResponse('Text is required', 400);
        }
        
        // Mock translation with language mapping
        const languages = {
            'en': 'English',
            'my': 'Burmese',
            'th': 'Thai',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'fr': 'French',
            'de': 'German',
            'es': 'Spanish'
        };
        
        const fromLang = languages[from] || from;
        const toLang = languages[to] || to;
        
        const response = {
            original_text: text,
            translated_text: `[${toLang}] ${text}`,
            from: fromLang,
            to: toLang,
            confidence: (Math.random() * 0.3 + 0.7).toFixed(2), // 0.7-1.0
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
        
        // Mock grammar check with common corrections
        let corrections = [];
        let corrected = text;
        
        // Common corrections
        const patterns = [
            { find: /\bi\b/g, replace: 'I', desc: 'Capitalize "I"' },
            { find: /\bdont\b/g, replace: "don't", desc: 'Add apostrophe' },
            { find: /\bcant\b/g, replace: "can't", desc: 'Add apostrophe' },
            { find: /\bwont\b/g, replace: "won't", desc: 'Add apostrophe' },
            { find: /\bisnt\b/g, replace: "isn't", desc: 'Add apostrophe' },
            { find: /\barent\b/g, replace: "aren't", desc: 'Add apostrophe' }
        ];
        
        patterns.forEach(pattern => {
            if (pattern.find.test(corrected)) {
                corrected = corrected.replace(pattern.find, pattern.replace);
                corrections.push({
                    type: 'grammar',
                    description: pattern.desc,
                    suggestion: pattern.replace
                });
            }
        });
        
        // Check for sentence capitalization
        const sentences = corrected.split(/[.!?]+\s+/);
        sentences.forEach((sentence, index) => {
            if (sentence.length > 0 && sentence[0] !== sentence[0].toUpperCase()) {
                corrections.push({
                    type: 'style',
                    description: 'Capitalize first letter of sentence',
                    suggestion: sentence[0].toUpperCase() + sentence.slice(1)
                });
            }
        });
        
        const response = {
            original: text,
            corrected: corrections.length > 0 ? corrected : null,
            corrections: corrections,
            issues_found: corrections.length,
            score: Math.max(0, 100 - corrections.length * 10)
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
        
        // Simple sentiment analysis based on keywords
        const words = text.toLowerCase().split(/\W+/);
        
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'happy', 'love', 'best'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'angry', 'hate', 'worst', 'poor'];
        
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
            confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(3)),
            details: {
                positive_words: positiveCount,
                negative_words: negativeCount,
                total_words: words.length
            }
        };
        
        return successResponse(response, 'Sentiment analysis completed');
        
    } catch (error) {
        console.error('Sentiment error:', error);
        return errorResponse('Failed to analyze sentiment', 500, error.message);
    }
}

// ===== HEALTH CHECK HANDLER =====
function handleHealth() {
    return successResponse({
        status: 'healthy',
        version: '2.0.0',
        uptime: process.uptime ? process.uptime() : 'N/A',
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
        ],
        documentation: 'https://oh.amkai.workers.dev/docs'
    }, 404);
}

// ===== MAIN WORKER HANDLER =====
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;
        
        // Log request for debugging
        console.log(`${method} ${url.pathname} - ${new Date().toISOString()}`);
        
        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return handleOptions();
        }
        
        try {
            // API Routes
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
            
            // Root path - show API info
            if (url.pathname === '/' || url.pathname === '/api') {
                return successResponse({
                    name: 'AmkyawDev AI API',
                    version: '2.0.0',
                    description: 'AI-powered API for chat, image generation, code execution, and more',
                    endpoints: [
                        { path: '/api/chat', method: 'POST', description: 'Send a chat message' },
                        { path: '/api/chat/stream', method: 'POST', description: 'Stream chat responses' },
                        { path: '/api/generate-image', method: 'POST', description: 'Generate images from text' },
                        { path: '/api/execute-code', method: 'POST', description: 'Execute code in various languages' },
                        { path: '/api/summarize', method: 'POST', description: 'Summarize text' },
                        { path: '/api/translate', method: 'POST', description: 'Translate text' },
                        { path: '/api/grammar', method: 'POST', description: 'Check grammar' },
                        { path: '/api/sentiment', method: 'POST', description: 'Analyze sentiment' },
                        { path: '/api/health', method: 'GET', description: 'Health check' }
                    ],
                    timestamp: Date.now()
                });
            }
            
            // Handle 404 for unknown routes
            return handleNotFound();
            
        } catch (error) {
            console.error('Worker error:', error);
            return errorResponse('Internal server error', 500, error.message);
        }
    }
};