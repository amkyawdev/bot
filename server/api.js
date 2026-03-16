// API Service for Cloudflare Worker
const ApiService = {
    // ===== BASE URL =====
    baseUrl: 'https://oh.amkai.workers.dev',
    
    // ===== DEFAULT HEADERS =====
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },

    // ===== REQUEST TIMEOUT =====
    timeout: 30000, // 30 seconds

    // ===== HELPER METHOD FOR MAKING REQUESTS =====
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data,
                status: response.status
            };
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('API Request failed:', error);
            
            let errorMessage = error.message;
            if (error.name === 'AbortError') {
                errorMessage = 'Request timeout - please try again';
            }
            
            return {
                success: false,
                error: errorMessage,
                status: error.status || 500
            };
        }
    },

    // ===== CHAT API =====
    chat: {
        // Send a message to AI
        async sendMessage(message, context = [], model = 'gpt-3.5') {
            return ApiService.request('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message,
                    context: context.slice(-10), // Last 10 messages for context
                    model,
                    timestamp: Date.now()
                })
            });
        },

        // Stream message (for real-time responses)
        async streamMessage(message, onChunk, onComplete, onError) {
            try {
                const response = await fetch(`${ApiService.baseUrl}/api/chat/stream`, {
                    method: 'POST',
                    headers: ApiService.headers,
                    body: JSON.stringify({ message })
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        if (onComplete) onComplete();
                        break;
                    }
                    
                    const chunk = decoder.decode(value);
                    if (onChunk) onChunk(chunk);
                }
            } catch (error) {
                console.error('Stream error:', error);
                if (onError) onError(error);
            }
        },

        // Get chat history
        async getHistory(limit = 50) {
            return ApiService.request(`/api/chat/history?limit=${limit}`);
        },

        // Clear chat history
        async clearHistory() {
            return ApiService.request('/api/chat/history', {
                method: 'DELETE'
            });
        }
    },

    // ===== IMAGE GENERATION API =====
    image: {
        // Generate image from prompt
        async generate(prompt, options = {}) {
            return ApiService.request('/api/generate-image', {
                method: 'POST',
                body: JSON.stringify({
                    prompt,
                    style: options.style || 'photorealistic',
                    size: options.size || '1024x1024',
                    quality: options.quality || 'standard',
                    num_images: options.numImages || 1,
                    negative_prompt: options.negativePrompt || ''
                })
            });
        },

        // Get generation status
        async getStatus(taskId) {
            return ApiService.request(`/api/image-status/${taskId}`);
        },

        // Get user's generated images
        async getUserImages() {
            return ApiService.request('/api/user-images');
        },

        // Delete image
        async deleteImage(imageId) {
            return ApiService.request(`/api/images/${imageId}`, {
                method: 'DELETE'
            });
        }
    },

    // ===== CODE EXECUTION API =====
    code: {
        // Execute code
        async execute(code, language, input = '') {
            return ApiService.request('/api/execute-code', {
                method: 'POST',
                body: JSON.stringify({
                    code,
                    language,
                    input,
                    timestamp: Date.now()
                })
            });
        },

        // Get supported languages
        async getLanguages() {
            return ApiService.request('/api/languages');
        },

        // Format code
        async format(code, language) {
            return ApiService.request('/api/format-code', {
                method: 'POST',
                body: JSON.stringify({ code, language })
            });
        },

        // Analyze code
        async analyze(code, language) {
            return ApiService.request('/api/analyze-code', {
                method: 'POST',
                body: JSON.stringify({ code, language })
            });
        },

        // Explain code
        async explain(code, language, level = 'simple') {
            return ApiService.request('/api/explain-code', {
                method: 'POST',
                body: JSON.stringify({ code, language, level })
            });
        },

        // Debug code
        async debug(code, language, level = 'quick') {
            return ApiService.request('/api/debug-code', {
                method: 'POST',
                body: JSON.stringify({ code, language, level })
            });
        },

        // Optimize code
        async optimize(code, language, target = 'speed') {
            return ApiService.request('/api/optimize-code', {
                method: 'POST',
                body: JSON.stringify({ code, language, target })
            });
        },

        // Convert code
        async convert(code, fromLang, toLang) {
            return ApiService.request('/api/convert-code', {
                method: 'POST',
                body: JSON.stringify({ code, from: fromLang, to: toLang })
            });
        }
    },

    // ===== TOOLS API =====
    tools: {
        // Summarize text
        async summarize(text, options = {}) {
            return ApiService.request('/api/summarize', {
                method: 'POST',
                body: JSON.stringify({
                    text,
                    length: options.length || 'medium',
                    format: options.format || 'paragraph'
                })
            });
        },

        // Translate text
        async translate(text, from, to) {
            return ApiService.request('/api/translate', {
                method: 'POST',
                body: JSON.stringify({ text, from, to })
            });
        },

        // Check grammar
        async checkGrammar(text) {
            return ApiService.request('/api/grammar', {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        },

        // Sentiment analysis
        async analyzeSentiment(text) {
            return ApiService.request('/api/sentiment', {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        },

        // Paraphrase text
        async paraphrase(text, options = {}) {
            return ApiService.request('/api/paraphrase', {
                method: 'POST',
                body: JSON.stringify({
                    text,
                    creativity: options.creativity || 0.5
                })
            });
        },

        // Extract keywords
        async extractKeywords(text) {
            return ApiService.request('/api/keywords', {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        },

        // Generate text
        async generateText(prompt, options = {}) {
            return ApiService.request('/api/generate-text', {
                method: 'POST',
                body: JSON.stringify({
                    prompt,
                    max_tokens: options.maxTokens || 500,
                    temperature: options.temperature || 0.7
                })
            });
        },

        // Answer question
        async answerQuestion(question, context = '') {
            return ApiService.request('/api/answer', {
                method: 'POST',
                body: JSON.stringify({ question, context })
            });
        }
    },

    // ===== USER API =====
    user: {
        // Login
        async login(token, provider = 'google') {
            return ApiService.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ token, provider })
            });
        },

        // Logout
        async logout() {
            return ApiService.request('/api/auth/logout', {
                method: 'POST'
            });
        },

        // Get user profile
        async getProfile() {
            return ApiService.request('/api/user/profile');
        },

        // Update profile
        async updateProfile(profile) {
            return ApiService.request('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify(profile)
            });
        },

        // Get usage stats
        async getStats() {
            return ApiService.request('/api/user/stats');
        },

        // Get user settings
        async getSettings() {
            return ApiService.request('/api/user/settings');
        },

        // Update user settings
        async updateSettings(settings) {
            return ApiService.request('/api/user/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });
        },

        // Delete account
        async deleteAccount() {
            return ApiService.request('/api/user/account', {
                method: 'DELETE'
            });
        }
    },

    // ===== SYSTEM API =====
    system: {
        // Check API health
        async health() {
            return ApiService.request('/api/health');
        },

        // Get system status
        async status() {
            return ApiService.request('/api/status');
        },

        // Get version info
        async version() {
            return ApiService.request('/api/version');
        },

        // Get supported models
        async getModels() {
            return ApiService.request('/api/models');
        }
    },

    // ===== STORAGE API =====
    storage: {
        // Save data
        async save(key, data) {
            return ApiService.request('/api/storage/save', {
                method: 'POST',
                body: JSON.stringify({ key, data })
            });
        },

        // Load data
        async load(key) {
            return ApiService.request(`/api/storage/load?key=${key}`);
        },

        // Delete data
        async delete(key) {
            return ApiService.request('/api/storage/delete', {
                method: 'DELETE',
                body: JSON.stringify({ key })
            });
        },

        // List all keys
        async list() {
            return ApiService.request('/api/storage/list');
        }
    },

    // ===== HELPER METHODS =====
    // Set custom base URL
    setBaseUrl(url) {
        this.baseUrl = url;
    },

    // Set timeout
    setTimeout(ms) {
        this.timeout = ms;
    },

    // Add custom header
    addHeader(key, value) {
        this.headers[key] = value;
    },

    // Remove header
    removeHeader(key) {
        delete this.headers[key];
    },

    // ===== TEST CONNECTION =====
    async testConnection() {
        try {
            const result = await this.system.health();
            return {
                success: result.success,
                message: result.success ? 'Connected successfully' : 'Connection failed',
                data: result.data
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection error: ${error.message}`
            };
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}

// Make globally available in browser
if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
}
