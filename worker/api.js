// worker/api.js - COMPLETE FIXED VERSION
console.log('📡 API.js loading...');

const API_BASE = 'https://my.amkai.workers.dev';

const api = {
    // Test connection
    async testConnection() {
        try {
            const start = Date.now();
            const response = await fetch(`${API_BASE}/api/health`);
            const data = await response.json();
            const latency = Date.now() - start;

            return {
                success: data.success,
                latency: latency,
                message: data.success ? 'Connected' : 'Failed'
            };
        } catch (error) {
            return {
                success: false,
                latency: -1,
                message: 'Connection failed'
            };
        }
    },

    // Health check
    async health() {
        try {
            const response = await fetch(`${API_BASE}/api/health`);
            return await response.json();
        } catch (error) {
            return { success: false };
        }
    },

    // Main chat function - FIXED for worker API
    async chat(params) {
        console.log('API chat called with:', params);

        try {
            // ဒီနေရာမှာ params.message ကို prompt အဖြစ်ပြောင်းပေးလိုက်တယ်
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: params.message  // ✅ "message" -> "prompt" ပြောင်းတယ်
                })
            });

            const data = await response.json();
            console.log('API response:', data);

            // Worker API ရဲ့ response format နဲ့ကိုက်အောင်ပြန်ပေးတယ်
            if (data.success && data.data?.response) {
                return {
                    success: true,
                    data: {
                        response: data.data.response
                    }
                };
            } else {
                return {
                    success: false,
                    data: {
                        response: this.getLocalResponse(params.message)
                    }
                };
            }
        } catch (error) {
            console.error('API error:', error);
            return {
                success: false,
                data: {
                    response: this.getLocalResponse(params.message)
                }
            };
        }
    },

    // Local response for fallback
    getLocalResponse(message) {
        const lower = message.toLowerCase();

        if (lower.includes('hello') || lower.includes('hi')) {
            return "👋 Hello! How can I help you today? (Local Mode)";
        }
        if (lower.includes('thank')) {
            return "🙏 You're welcome! (Local Mode)";
        }
        if (lower.includes('bye')) {
            return "👋 Goodbye! (Local Mode)";
        }
        if (lower.includes('help')) {
            return "💡 I can help with questions, code, and more. (Local Mode)";
        }

        const responses = [
            "I understand. (Local Mode)",
            "Thanks for your message! (Local Mode)",
            "Got it. (Local Mode)",
            "How can I help? (Local Mode)"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    // Stream function 
    async chatStream(params, onChunk, onComplete, onError) {
        try {
            // For streaming, we'll use the regular chat for now
            // (You can implement proper streaming later)
            const result = await this.chat(params);
            const text = result.data.response;
            const words = text.split(' ');

            for (let i = 0; i < words.length; i++) {
                setTimeout(() => {
                    onChunk({ chunk: words[i] + ' ' });
                    if (i === words.length - 1) {
                        setTimeout(() => onComplete(), 100);
                    }
                }, i * 100);
            }
        } catch (error) {
            onError(error);
        }
    }
};

// Make it global
window.api = api;
console.log('✅ API.js loaded - Ready to use with AmkyawDev Worker');
