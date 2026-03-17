// worker/api.js - Complete API Client for AmkyawDev AI Worker
// Worker URL: https://my.amkai.workers.dev

const API_BASE = 'https://my.amkai.workers.dev';

class AmkyawDevAPI {
    constructor() {
        this.baseUrl = API_BASE;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Client-Version': '2.0.0'
        };
        this.requestTimeout = 30000; // 30 seconds
        this.maxRetries = 3;
    }

    // ===== HELPER METHODS =====

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = { ...this.defaultHeaders, ...options.headers };
        
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add request ID for tracking
        const requestId = this.generateRequestId();
        headers['X-Request-ID'] = requestId;

        console.log(`[API Request] ${options.method || 'GET'} ${endpoint}`, { requestId });

        let retries = 0;
        let lastError = null;

        while (retries <= this.maxRetries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

                const response = await fetch(url, {
                    ...options,
                    headers,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Try to parse JSON response
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = { message: text };
                    }
                }

                // Check for HTTP errors
                if (!response.ok) {
                    throw new Error(data.error || data.message || `HTTP ${response.status}`);
                }

                console.log(`[API Response] ${endpoint}`, { requestId, status: response.status });
                return data;

            } catch (error) {
                lastError = error;
                retries++;

                if (error.name === 'AbortError') {
                    console.warn(`[API Timeout] ${endpoint} (attempt ${retries}/${this.maxRetries})`);
                    if (retries <= this.maxRetries) {
                        await this.sleep(1000 * retries);
                        continue;
                    }
                } else {
                    console.error(`[API Error] ${endpoint}:`, error);
                    break;
                }
            }
        }

        throw lastError || new Error('Request failed after retries');
    }

    generateRequestId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleError(error, endpoint) {
        console.error(`API Error (${endpoint}):`, error);
        
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            endpoint: endpoint,
            timestamp: Date.now(),
            offline: !navigator.onLine
        };
    }

    // ===== CHAT ENDPOINTS =====

    /**
     * Send a chat message and get AI response
     * @param {Object} params - Chat parameters
     * @param {string} params.message - User message
     * @param {Array} params.history - Chat history (optional)
     * @param {string} params.model - Model to use (gpt-4, gpt-3.5)
     * @param {number} params.temperature - Temperature (0-2)
     */
    async chat(params) {
        const endpoint = '/api/chat';
        try {
            const data = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    message: params.message,
                    history: params.history || [],
                    model: params.model || localStorage.getItem('ai_model') || 'gpt-4',
                    temperature: params.temperature || parseFloat(localStorage.getItem('ai_temperature')) || 0.7
                })
            });
            
            return {
                success: true,
                data: {
                    response: data.data?.response || data.response || data.message,
                    model: data.data?.model || data.model,
                    usage: data.data?.usage || data.usage
                }
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Stream chat responses
     * @param {Object} params - Chat parameters
     * @param {Function} onChunk - Callback for each chunk
     * @param {Function} onComplete - Callback when complete
     * @param {Function} onError - Error callback
     */
    async chatStream(params, onChunk, onComplete, onError) {
        const endpoint = '/api/chat/stream';
        
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'X-Request-ID': this.generateRequestId()
                },
                body: JSON.stringify({
                    message: params.message,
                    history: params.history || [],
                    model: params.model || localStorage.getItem('ai_model') || 'gpt-4',
                    temperature: params.temperature || parseFloat(localStorage.getItem('ai_temperature')) || 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            onComplete?.();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            onChunk?.(parsed);
                        } catch (e) {
                            console.warn('Failed to parse chunk:', data);
                        }
                    }
                }
            }
        } catch (error) {
            onError?.(error);
            return this.handleError(error, endpoint);
        }
    }

    // ===== IMAGE GENERATION =====

    /**
     * Generate image from text prompt
     * @param {string} prompt - Image description
     * @param {Object} options - Generation options
     * @param {string} options.size - Image size (512x512, 1024x1024)
     * @param {string} options.quality - Image quality (standard, hd)
     */
    async generateImage(prompt, options = {}) {
        const endpoint = '/api/generate-image';
        try {
            const data = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    prompt,
                    size: options.size || '512x512',
                    quality: options.quality || 'standard'
                })
            });

            return {
                success: true,
                data: {
                    id: data.data?.id || data.id,
                    url: data.data?.url || data.url,
                    prompt: data.data?.prompt || data.prompt,
                    created: data.data?.created || data.created
                }
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    // ===== CODE EXECUTION =====

    /**
     * Execute code in sandbox
     * @param {string} code - Code to execute
     * @param {string} language - Programming language
     */
    async executeCode(code, language = 'javascript') {
        const endpoint = '/api/execute-code';
        try {
            const data = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify({ code, language })
            });

            return {
                success: data.success,
                data: {
                    output: data.data?.output || data.output,
                    error: data.data?.error || data.error,
                    language: data.data?.language || data.language,
                    execution_time: data.data?.execution_time || data.execution_time
                }
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    // ===== TEXT PROCESSING =====

    /**
     * Summarize text
     * @param {string} text - Text to summarize
     * @param {number} maxLength - Maximum summary length
     */
    async summarize(text, maxLength = 200) {
        const endpoint = '/api/summarize';
        try {
            const data = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify({ text, max_length: maxLength })
            });

            return {
                success: true,
                data: {
                    summary: data.data?.summary || data.summary,
                    original_length: data.data?.original_length || data.original_length,
                    summary_length: data.data?.summary_length || data.summary_length,
                    compression_ratio: data.data?.compression_ratio || data.compression_ratio
                }
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Translate text
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language (en, mm, etc.)
     * @param {string} sourceLang - Source language (auto for detection)
     */
    async translate(text, targetLang = 'en', sourceLang = 'auto') {
        const endpoint = '/api/translate';
        try {
            const data = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify({ 
                    text, 
                    target_lang: targetLang,
                    source_lang: sourceLang
                })
            });

            return {
                success: true,
                data: {
                    original: data.data?.original || data.original,
                    translated: data.data?.translated || data.translated,
                    source_lang: data.data?.source_lang || data.source_lang,
                    target_lang: data.data?.target_lang || data.target_lang,
                    detected_lang: data.data?.detected_lang || data.detected_lang
                }
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Check grammar
     * @param {string} text - Text to check
     */
    async grammarCheck(text) {
        const endpoint = '/api/grammar';
        try {
            const data = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify({ text })
            });

            return {
                success: true,
                data: {
                    issues: data.data?.issues || data.issues,
                    score: data.data?.score || data.score,
                    suggestions: data.data?.suggestions || data.suggestions
                }
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Analyze sentiment
     * @param {string} text - Text to analyze
     */
    async sentimentAnalysis(text) {
        const endpoint = '/api/sentiment';
        try {
            const data = await this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify({ text })
            });

            return {
                success: true,
                data: {
                    sentiment: data.data?.sentiment || data.sentiment,
                    score: data.data?.score || data.score,
                    confidence: data.data?.confidence || data.confidence,
                    details: data.data?.details || data.details
                }
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    // ===== UTILITY =====

    /**
     * Check API health
     */
    async health() {
        const endpoint = '/api/health';
        try {
            const data = await this.request(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                status: data.status || data.message,
                timestamp: data.timestamp,
                uptime: data.uptime
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Get API info
     */
    async getInfo() {
        const endpoint = '/';
        try {
            const data = await this.request(endpoint, {
                method: 'GET'
            });

            return {
                success: true,
                data: {
                    name: data.data?.name || data.name,
                    version: data.data?.version || data.version,
                    description: data.data?.description || data.description,
                    endpoints: data.data?.endpoints || data.endpoints
                }
            };
        } catch (error) {
            return this.handleError(error, endpoint);
        }
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const start = Date.now();
            const result = await this.health();
            const latency = Date.now() - start;

            return {
                success: result.success,
                latency: latency,
                timestamp: result.timestamp,
                message: result.success ? 'Connected' : 'Failed'
            };
        } catch (error) {
            return {
                success: false,
                latency: -1,
                error: error.message,
                message: 'Connection failed'
            };
        }
    }

    /**
     * Local response for offline mode
     */
    getLocalResponse(message) {
        const lower = message.toLowerCase();
        
        if (lower.includes('hello') || lower.includes('hi')) {
            return "Hello! How can I help you today? (Offline Mode)";
        }
        if (lower.includes('thank')) {
            return "You're welcome! (Offline Mode)";
        }
        if (lower.includes('help')) {
            return "I can help with questions, code, and more. (Offline Mode)";
        }
        if (lower.includes('bye')) {
            return "Goodbye! (Offline Mode)";
        }
        
        const responses = [
            "I understand your message. This is an offline response.",
            "Thanks for your message! I'm in offline mode.",
            "I received your message. (Offline Mode)",
            "Got it! How can I help? (Offline Mode)"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Create and export singleton instance
const api = new AmkyawDevAPI();

// Make it available globally
if (typeof window !== 'undefined') {
    window.api = api;
    console.log('✅ API client initialized. Worker URL:', API_BASE);
    
    // Auto-test connection
    setTimeout(() => {
        api.testConnection().then(result => {
            if (result.success) {
                console.log(`✅ API connected (${result.latency}ms)`);
            } else {
                console.warn('⚠️ API connection failed, using offline mode');
            }
        });
    }, 1000);
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}