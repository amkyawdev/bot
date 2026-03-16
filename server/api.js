// API Service for AmkyawDev AI - Simplified Version for Current Worker

const ApiService = {
    // ===== BASE URL =====
    baseUrl: 'https://my.amkai.workers.dev',
    
    // ===== DEFAULT HEADERS =====
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },

    // ===== REQUEST TIMEOUT =====
    timeout: 30000,

    // ===== HELPER METHOD =====
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...this.headers, ...options.headers },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('API Error:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    // ===== CHAT API =====
    chat: {
        async sendMessage(message, context = []) {
            return ApiService.request('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ 
                    message, 
                    context: context.slice(-5) 
                })
            });
        }
    },

    // ===== IMAGE API =====
    image: {
        async generate(prompt, options = {}) {
            return ApiService.request('/api/image', {
                method: 'POST',
                body: JSON.stringify({ 
                    prompt,
                    style: options.style || 'photorealistic',
                    num_images: options.numImages || 1
                })
            });
        }
    },

    // ===== TOOLS API =====
    tools: {
        async summarize(text) {
            return ApiService.request('/api/summarize', {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        },
        
        async translate(text, to = 'en') {
            return ApiService.request('/api/translate', {
                method: 'POST',
                body: JSON.stringify({ text, to })
            });
        }
    },

    // ===== SYSTEM API =====
    system: {
        async health() {
            return ApiService.request('/api/health');
        }
    },

    // ===== HELPER METHODS =====
    setBaseUrl(url) {
        this.baseUrl = url;
        console.log(`API base URL set to: ${url}`);
    },

    async testConnection() {
        try {
            const result = await this.system.health();
            return {
                success: result.success,
                message: result.success ? '✅ Connected' : '❌ Failed',
                url: this.baseUrl
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
};

// Make globally available
if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
    console.log('✅ ApiService ready', ApiService.baseUrl);
                }
