// worker/api.js - PRO VERSION
console.log('📡 API.js loading...');

const API_BASE = 'https://my.amkai.workers.dev';

const api = {

    // 🌐 Health Check
    async testConnection() {
        const start = Date.now();

        try {
            const res = await fetch(`${API_BASE}/api/health`);
            const data = await res.json();

            return {
                success: true,
                latency: Date.now() - start,
                message: data?.data?.status || 'Connected'
            };

        } catch (error) {
            return {
                success: false,
                latency: -1,
                message: error.message || 'Connection failed'
            };
        }
    },

    // 💬 Chat (non-stream)
    async chat(params = {}) {
        console.log('💬 API chat called:', params);

        try {
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: params.message,          // ✅ FIXED
                    history: params.history || [],    // optional
                    model: params.model || 'gpt-4',
                    temperature: params.temperature ?? 0.7
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            console.log('📥 API response:', data);

            return {
                success: true,
                data: {
                    response:
                        data?.data?.response ||
                        data?.data?.reply ||
                        data?.reply ||
                        'No response 🤖'
                }
            };

        } catch (error) {
            console.error('❌ API error:', error);

            return {
                success: false,
                data: {
                    response: `⚠️ Error: ${error.message}`
                }
            };
        }
    },

    // 🔴 Streaming Chat (REAL-TIME)
    async chatStream(params = {}, onChunk) {
        console.log('🔴 Streaming chat:', params);

        try {
            const res = await fetch(`${API_BASE}/api/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: params.message
                })
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';
            let full = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const parts = buffer.split("\n\n");
                buffer = parts.pop();

                for (let part of parts) {
                    if (part.startsWith("data: ")) {
                        try {
                            const json = JSON.parse(part.replace("data: ", ""));

                            if (json.chunk) {
                                full += json.chunk;
                                onChunk && onChunk(full, false);
                            }

                            if (json.done) {
                                onChunk && onChunk(json.full, true);
                            }

                        } catch (e) {
                            console.warn('Parse error:', e);
                        }
                    }
                }
            }

            return { success: true };

        } catch (error) {
            console.error('❌ Stream error:', error);

            onChunk && onChunk(`⚠️ ${error.message}`, true);

            return { success: false };
        }
    }

};

window.api = api;
console.log('✅ API.js ready');
