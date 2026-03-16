// API Service for AmkyawDev AI
const ApiService = {
    // ===== BASE URL =====
    baseUrl: 'https://oh.amkai.workers.dev',
    
    // ===== DEFAULT HEADERS =====
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },

    // ===== REQUEST TIMEOUT =====
    timeout: 30000, // 30 seconds

    // ===== HELPER METHOD FOR MAKING REQUESTS =====
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        // Add timestamp to prevent caching
        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = `${url}${separator}_t=${Date.now()}`;
        
        try {
            const response = await fetch(finalUrl, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                },
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText.substring(0, 100)}`);
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
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error - please check your connection';
            }
            
            return {
                success: false,
                error: errorMessage,
                status: error.status || 0
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
        async streamMessage(message, callbacks = {}) {
            const { onChunk, onComplete, onError } = callbacks;
            
            try {
                const response = await fetch(`${ApiService.baseUrl}/api/chat/stream`, {
                    method: 'POST',
                    headers: ApiService.headers,
                    body: JSON.stringify({ message })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullResponse = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        if (onComplete) onComplete(fullResponse);
                        break;
                    }
                    
                    const chunk = decoder.decode(value, { stream: true });
                    fullResponse += chunk;
                    if (onChunk) onChunk(chunk, fullResponse);
                }
            } catch (error) {
                console.error('Stream error:', error);
                if (onError) onError(error);
            }
        },

        // Get chat history
        async getHistory(limit = 50, chatId = null) {
            const url = chatId ? `/api/chat/history?limit=${limit}&chatId=${chatId}` : `/api/chat/history?limit=${limit}`;
            return ApiService.request(url);
        },

        // Clear chat history
        async clearHistory(chatId = null) {
            const url = chatId ? `/api/chat/history?chatId=${chatId}` : '/api/chat/history';
            return ApiService.request(url, {
                method: 'DELETE'
            });
        },

        // Save chat
        async saveChat(chatId, messages, title) {
            return ApiService.request('/api/chat/save', {
                method: 'POST',
                body: JSON.stringify({ chatId, messages, title })
            });
        },

        // Delete chat
        async deleteChat(chatId) {
            return ApiService.request(`/api/chat/${chatId}`, {
                method: 'DELETE'
            });
        },

        // Get all chats
        async getAllChats() {
            return ApiService.request('/api/chat/list');
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
        async getUserImages(limit = 50) {
            return ApiService.request(`/api/user-images?limit=${limit}`);
        },

        // Save image
        async saveImage(imageData) {
            return ApiService.request('/api/images', {
                method: 'POST',
                body: JSON.stringify(imageData)
            });
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
        },

        // Save code snippet
        async saveSnippet(code, language, name) {
            return ApiService.request('/api/snippets', {
                method: 'POST',
                body: JSON.stringify({ code, language, name })
            });
        },

        // Get saved snippets
        async getSnippets() {
            return ApiService.request('/api/snippets');
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
        },

        // Spell check
        async spellCheck(text) {
            return ApiService.request('/api/spell-check', {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        },

        // Text to speech
        async textToSpeech(text, options = {}) {
            return ApiService.request('/api/tts', {
                method: 'POST',
                body: JSON.stringify({
                    text,
                    voice: options.voice || 'en-US',
                    speed: options.speed || 1.0
                })
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
        },

        // Get API key
        async getApiKey() {
            return ApiService.request('/api/user/apikey');
        },

        // Regenerate API key
        async regenerateApiKey() {
            return ApiService.request('/api/user/apikey', {
                method: 'POST'
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
        },

        // Get system metrics
        async getMetrics() {
            return ApiService.request('/api/metrics');
        },

        // Get announcements
        async getAnnouncements() {
            return ApiService.request('/api/announcements');
        }
    },

    // ===== STORAGE API =====
    storage: {
        // Save data
        async save(key, data, options = {}) {
            return ApiService.request('/api/storage/save', {
                method: 'POST',
                body: JSON.stringify({ 
                    key, 
                    data,
                    ttl: options.ttl || null,
                    public: options.public || false
                })
            });
        },

        // Load data
        async load(key) {
            return ApiService.request(`/api/storage/load?key=${encodeURIComponent(key)}`);
        },

        // Delete data
        async delete(key) {
            return ApiService.request('/api/storage/delete', {
                method: 'DELETE',
                body: JSON.stringify({ key })
            });
        },

        // List all keys
        async list(prefix = '') {
            return ApiService.request(`/api/storage/list?prefix=${encodeURIComponent(prefix)}`);
        },

        // Get storage usage
        async getUsage() {
            return ApiService.request('/api/storage/usage');
        },

        // Clear all data
        async clear() {
            return ApiService.request('/api/storage/clear', {
                method: 'DELETE'
            });
        }
    },

    // ===== UPLOAD API =====
    upload: {
        // Upload file
        async uploadFile(file, onProgress = null) {
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const xhr = new XMLHttpRequest();
                
                const promise = new Promise((resolve, reject) => {
                    xhr.open('POST', `${ApiService.baseUrl}/api/upload`);
                    
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                resolve({
                                    success: true,
                                    data: response
                                });
                            } catch (e) {
                                resolve({
                                    success: true,
                                    data: { url: xhr.responseText }
                                });
                            }
                        } else {
                            reject(new Error(`Upload failed: ${xhr.status}`));
                        }
                    };
                    
                    xhr.onerror = () => reject(new Error('Network error'));
                    
                    if (onProgress) {
                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                const percent = (e.loaded / e.total) * 100;
                                onProgress(percent);
                            }
                        };
                    }
                    
                    xhr.send(formData);
                });
                
                return await promise;
                
            } catch (error) {
                console.error('Upload error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        },

        // Get file info
        async getFileInfo(fileId) {
            return ApiService.request(`/api/upload/${fileId}`);
        },

        // Delete file
        async deleteFile(fileId) {
            return ApiService.request(`/api/upload/${fileId}`, {
                method: 'DELETE'
            });
        }
    },

    // ===== SEARCH API =====
    search: {
        // Search conversations
        async searchChats(query) {
            return ApiService.request(`/api/search/chats?q=${encodeURIComponent(query)}`);
        },

        // Search images
        async searchImages(query) {
            return ApiService.request(`/api/search/images?q=${encodeURIComponent(query)}`);
        },

        // Search code snippets
        async searchCode(query) {
            return ApiService.request(`/api/search/code?q=${encodeURIComponent(query)}`);
        },

        // Global search
        async searchAll(query) {
            return ApiService.request(`/api/search/all?q=${encodeURIComponent(query)}`);
        }
    },

    // ===== HELPER METHODS =====
    // Set custom base URL
    setBaseUrl(url) {
        this.baseUrl = url;
        console.log(`API base URL set to: ${url}`);
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

    // Get auth token
    getAuthToken() {
        return localStorage.getItem('auth_token');
    },

    // Set auth token
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('auth_token', token);
            this.addHeader('Authorization', `Bearer ${token}`);
        } else {
            localStorage.removeItem('auth_token');
            delete this.headers['Authorization'];
        }
    },

    // Clear all headers
    clearHeaders() {
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    },

    // ===== TEST CONNECTION =====
    async testConnection() {
        try {
            const result = await this.system.health();
            return {
                success: result.success,
                message: result.success ? '✅ Connected successfully' : '❌ Connection failed',
                data: result.data,
                url: this.baseUrl
            };
        } catch (error) {
            return {
                success: false,
                message: `❌ Connection error: ${error.message}`,
                url: this.baseUrl
            };
        }
    },

    // ===== GET API INFO =====
    getInfo() {
        return {
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            headers: { ...this.headers },
            hasToken: !!this.headers['Authorization']
        };
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}

// Make globally available in browser
if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
    
    // Auto-initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Check for saved auth token
        const token = localStorage.getItem('auth_token');
        if (token) {
            ApiService.setAuthToken(token);
        }
        
        console.log('✅ ApiService initialized', ApiService.getInfo());
    });
}