// worker/api.js - ULTIMATE FIXED VERSION
console.log('📡 API.js loading...');

const API_BASE = 'https://my.amkai.workers.dev';

const api = {
    async testConnection() {
        try {
            const response = await fetch(`${API_BASE}/api/health`);
            const data = await response.json();
            return {
                success: true,
                latency: 0,
                message: 'Connected'
            };
        } catch (error) {
            return {
                success: false,
                latency: -1,
                message: 'Connection failed'
            };
        }
    },

    async chat(params) {
        console.log('API chat called with:', params);

        try {
            // တိုက်ရိုက် fetch လုပ်မယ်
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: params.message
                })
            });

            const data = await response.json();
            console.log('API response:', data);

            // response ကိုတိုက်ရိုက်ပြန်ပေး
            return {
                success: true,
                data: {
                    response: data.data?.response || 'No response'
                }
            };

        } catch (error) {
            console.error('API error:', error);
            return {
                success: false,
                data: {
                    response: 'Hello! (Local Mode)'
                }
            };
        }
    }
};

window.api = api;
console.log('✅ API.js loaded');
