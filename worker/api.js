// worker/api.js - FIXED VERSION - ချက်ချင်းအလုပ်လုပ်မယ်
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

    // Main chat function
    async chat(params) {
        console.log('API chat called with:', params);
        
        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: params.message,
                    history: params.history || [],
                    model: params.model || 'gpt-4',
                    temperature: params.temperature || 0.7
                })
            });

            const data = await response.json();
            console.log('API response:', data);

            if (data.success) {
                return {
                    success: true,
                    data: {
                        response: data.data?.response || 'No response'
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
            return "Hello! (Local Mode)";
        }
        if (lower.includes('thank')) {
            return "You're welcome! (Local Mode)";
        }
        if (lower.includes('help')) {
            return "How can I help? (Local Mode)";
        }
        
        const responses = [
            "I understand. (Local Mode)",
            "Thanks! (Local Mode)",
            "Got it. (Local Mode)"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    // Stream function (simplified)
    async chatStream(params, onChunk, onComplete, onError) {
        try {
            const result = await this.chat(params);
            const words = result.data.response.split(' ');
            
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
console.log('✅ API.js loaded');