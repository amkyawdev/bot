function chatApp() {
    return {
        // ===== STATE =====
        messages: [],
        inputMessage: '',
        isTyping: false,
        isSending: false,
        isThinking: false,
        isOnline: navigator.onLine,
        
        // UI State
        isAtBottom: true,
        activeMessageIndex: -1,
        speakingMessageIndex: -1,
        currentChatId: 'default',
        currentChatTitle: 'Chat',
        
        // Upload State
        uploadedFiles: [],
        
        // Voice State
        showVoiceMenu: false,
        voiceRate: 1.0,
        voicePitch: 1.0,
        isSpeaking: false,
        voices: [],
        
        // Settings
        settings: {
            theme: 'dark',
            accent: 'chatgpt',
            fontSize: 'medium',
            apiEndpoint: 'https://oh.amkai.workers.dev' // api.js baseUrl
        },
        
        // Long Press Timers
        longPressTimer: null,
        longPressDuration: 500,
        messageLongPressTimer: null,
        
        // ===== INIT =====
        init() {
            this.loadMessages();
            this.loadVoiceSettings();
            this.loadSettings();
            this.setupEventListeners();
            this.setupMessageListener();
            this.scrollToBottom();
            this.initVoiceSystem();
            this.initApiService();
            this.checkMobileAndAdjust();
            
            window.addEventListener('resize', () => this.checkMobileAndAdjust());
            
            this.$watch('messages', () => {
                this.saveMessages();
                this.saveToChatHistory();
                this.$nextTick(() => {
                    if (this.isAtBottom) {
                        this.scrollToBottom();
                    }
                });
            });
            
            this.$watch('inputMessage', () => {
                this.autoResize();
            });
        },
        
        initApiService() {
            // Set API endpoint from settings
            if (window.ApiService) {
                window.ApiService.setBaseUrl(this.settings.apiEndpoint);
            }
        },
        
        checkMobileAndAdjust() {
            const isMobile = window.innerWidth <= 768;
            const messagesArea = this.$refs.messagesArea;
            
            if (messagesArea) {
                if (isMobile) {
                    messagesArea.style.height = 'calc(100vh - 28px - 70px - 56px)';
                } else {
                    messagesArea.style.height = 'calc(100vh - 28px - 70px)';
                }
            }
        },
        
        // ===== LOAD FUNCTIONS =====
        loadSettings() {
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                try {
                    const settings = JSON.parse(saved);
                    this.settings = { ...this.settings, ...settings };
                } catch (e) {}
            }
        },
        
        loadMessages() {
            const allChats = JSON.parse(localStorage.getItem('all_chats') || '{}');
            
            if (allChats[this.currentChatId]) {
                this.messages = allChats[this.currentChatId];
            } else {
                const saved = localStorage.getItem('chat_messages');
                if (saved) {
                    try {
                        this.messages = JSON.parse(saved);
                    } catch (e) {
                        this.messages = this.getWelcomeMessage();
                    }
                } else {
                    this.messages = this.getWelcomeMessage();
                }
            }
        },
        
        getWelcomeMessage() {
            return [{
                role: 'assistant',
                content: '👋 Hello! I\'m AmkyawDev AI. How can I help you today?',
                timestamp: Date.now()
            }];
        },
        
        saveMessages() {
            localStorage.setItem('chat_messages', JSON.stringify(this.messages));
            
            const allChats = JSON.parse(localStorage.getItem('all_chats') || '{}');
            allChats[this.currentChatId] = this.messages;
            localStorage.setItem('all_chats', JSON.stringify(allChats));
        },
        
        saveToChatHistory() {
            const allChats = JSON.parse(localStorage.getItem('all_chats') || '{}');
            allChats[this.currentChatId] = this.messages;
            localStorage.setItem('all_chats', JSON.stringify(allChats));
            
            if (window.parent && this.messages.length > 1) {
                const firstUserMsg = this.messages.find(m => m.role === 'user');
                let title = this.currentChatTitle;
                
                if (firstUserMsg) {
                    title = firstUserMsg.content.substring(0, 30);
                    if (firstUserMsg.content.length > 30) title += '...';
                }
                
                window.parent.postMessage({
                    type: 'chat-updated',
                    chatId: this.currentChatId,
                    title: title
                }, '*');
            }
        },
        
        // ===== MESSAGE LISTENER =====
        setupMessageListener() {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type) {
                    this.handleParentMessage(event.data);
                }
            });
        },
        
        handleParentMessage(data) {
            switch(data.type) {
                case 'new-chat':
                    this.startNewChat(data.chatId, data.title);
                    if (window.parent) {
                        window.parent.postMessage({
                            type: 'chat-updated',
                            chatId: data.chatId,
                            title: data.title || 'New chat'
                        }, '*');
                    }
                    break;
                    
                case 'load-chat':
                    this.loadChatById(data.chatId, data.title);
                    break;
                    
                case 'search':
                    this.handleSearch(data.query);
                    break;
                    
                case 'global-theme-change':
                    this.applyThemeFromMain(data);
                    break;
            }
        },
        
        startNewChat(chatId, title) {
            this.currentChatId = chatId || 'chat_' + Date.now();
            this.currentChatTitle = title || 'New chat';
            this.messages = [{
                role: 'assistant',
                content: '👋 Hello! How can I help you today?',
                timestamp: Date.now()
            }];
            this.saveMessages();
            
            this.inputMessage = '';
            this.uploadedFiles = [];
        },
        
        loadChatById(chatId, title) {
            this.currentChatId = chatId;
            this.currentChatTitle = title || 'Chat';
            const allChats = JSON.parse(localStorage.getItem('all_chats') || '{}');
            
            if (allChats[chatId]) {
                this.messages = allChats[chatId];
            } else {
                this.startNewChat(chatId, title);
            }
        },
        
        handleSearch(query) {
            console.log('Searching for:', query);
        },
        
        applyThemeFromMain(data) {
            if (data.theme) {
                document.documentElement.setAttribute('data-theme', data.theme);
            }
            if (data.accent) {
                let accentColor = '#19c37d';
                switch(data.accent) {
                    case 'chatgpt': accentColor = '#19c37d'; break;
                    case 'deepseek': accentColor = '#10a37f'; break;
                    case 'groq': accentColor = '#f5505e'; break;
                    case 'claude': accentColor = '#c9975c'; break;
                    case 'perplexity': accentColor = '#3b82f6'; break;
                }
                document.documentElement.style.setProperty('--accent', accentColor);
            }
        },
        
        // ===== VOICE SYSTEM =====
        initVoiceSystem() {
            if ('speechSynthesis' in window) {
                const loadVoices = () => {
                    this.voices = window.speechSynthesis.getVoices();
                };
                loadVoices();
                if (window.speechSynthesis.onvoiceschanged !== undefined) {
                    window.speechSynthesis.onvoiceschanged = loadVoices;
                }
            }
        },
        
        loadVoiceSettings() {
            const rate = localStorage.getItem('voice_rate');
            const pitch = localStorage.getItem('voice_pitch');
            if (rate) this.voiceRate = parseFloat(rate);
            if (pitch) this.voicePitch = parseFloat(pitch);
        },
        
        // ===== SEND MESSAGE TO API USING ApiService =====
        async sendMessage() {
            if (!this.inputMessage.trim() || this.isSending) return;
            
            const userMessage = {
                role: 'user',
                content: this.inputMessage,
                timestamp: Date.now()
            };
            
            this.messages.push(userMessage);
            
            const question = this.inputMessage;
            const files = [...this.uploadedFiles];
            
            this.inputMessage = '';
            this.uploadedFiles = [];
            this.autoResize();
            
            this.isTyping = true;
            this.isSending = true;
            this.isThinking = true;
            
            // Simulate thinking animation
            setTimeout(() => {
                this.isThinking = false;
            }, 800);
            
            try {
                let response;
                
                // Use ApiService if available
                if (window.ApiService) {
                    // Get last 10 messages for context
                    const context = this.messages.slice(-10).map(m => ({
                        role: m.role,
                        content: m.content
                    }));
                    
                    const result = await window.ApiService.chat.sendMessage(question, context);
                    
                    if (result.success) {
                        response = result.data.reply || result.data.response;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    // Fallback to direct fetch
                    const fetchResponse = await fetch(`${this.settings.apiEndpoint}/api/chat`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: question,
                            context: this.messages.slice(-5)
                        })
                    });
                    
                    const data = await fetchResponse.json();
                    response = data.reply || data.response;
                }
                
                const assistantMessage = {
                    role: 'assistant',
                    content: response || 'No response from server',
                    timestamp: Date.now()
                };
                
                this.messages.push(assistantMessage);
                
            } catch (error) {
                console.error('API Error:', error);
                
                // Fallback to local response
                const fallbackResponse = {
                    role: 'assistant',
                    content: this.generateLocalResponse(question, files),
                    timestamp: Date.now()
                };
                
                this.messages.push(fallbackResponse);
                
            } finally {
                this.isTyping = false;
                this.isSending = false;
            }
        },
        
        generateLocalResponse(question, files) {
            if (files.length > 0) {
                return `📎 I received your message: "${question}" along with ${files.length} file(s). (Local response - API not available)`;
            }
            
            const responses = [
                `I understand you're asking about "${question}". Let me help you with that.`,
                `That's an interesting question about "${question.substring(0, 30)}...". Here's what I think.`,
                `Based on your message: "${question.substring(0, 30)}...", I can provide some insights.`,
                `Thank you for your message. I'll do my best to help with "${question.substring(0, 30)}...".`
            ];
            
            return responses[Math.floor(Math.random() * responses.length)] + ' (Local response)';
        },
        
        // ===== UPLOAD HANDLING =====
        uploadFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*,.pdf,.txt,.doc,.docx';
            
            input.onchange = (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                    if (this.uploadedFiles.length < 5) {
                        this.uploadedFiles.push({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            file: file
                        });
                    }
                });
            };
            
            input.click();
        },
        
        removeFile(index) {
            this.uploadedFiles.splice(index, 1);
        },
        
        getFileIcon(type) {
            if (type.startsWith('image/')) return 'fa-image';
            if (type.includes('pdf')) return 'fa-file-pdf';
            if (type.includes('word')) return 'fa-file-word';
            if (type.includes('text')) return 'fa-file-alt';
            return 'fa-file';
        },
        
        // ===== LONG PRESS =====
        startLongPress() {
            this.longPressTimer = setTimeout(() => {
                this.showVoiceMenu = true;
            }, this.longPressDuration);
        },
        
        endLongPress() {
            clearTimeout(this.longPressTimer);
        },
        
        startMessageLongPress(index) {
            this.messageLongPressTimer = setTimeout(() => {
                this.activeMessageIndex = index;
            }, this.longPressDuration);
        },
        
        endMessageLongPress() {
            clearTimeout(this.messageLongPressTimer);
        },
        
        // ===== VOICE CONTROLS =====
        openVoiceMenu() {
            this.showVoiceMenu = !this.showVoiceMenu;
        },
        
        setVoiceRate(rate) {
            this.voiceRate = rate;
            localStorage.setItem('voice_rate', rate);
        },
        
        setVoicePitch(pitch) {
            this.voicePitch = pitch;
            localStorage.setItem('voice_pitch', pitch);
        },
        
        speakMessage(content) {
            if (!('speechSynthesis' in window)) return;
            
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(content);
            utterance.rate = this.voiceRate;
            utterance.pitch = this.voicePitch;
            
            const msgIndex = this.messages.findIndex(m => m.content === content);
            if (msgIndex !== -1) this.speakingMessageIndex = msgIndex;
            
            utterance.onstart = () => this.isSpeaking = true;
            utterance.onend = () => {
                this.isSpeaking = false;
                this.speakingMessageIndex = -1;
            };
            
            window.speechSynthesis.speak(utterance);
        },
        
        stopSpeaking() {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.speakingMessageIndex = -1;
            this.showVoiceMenu = false;
        },
        
        // ===== MESSAGE ACTIONS =====
        regenerateMessage(index) {
            for (let i = index - 1; i >= 0; i--) {
                if (this.messages[i].role === 'user') {
                    this.messages = this.messages.slice(0, i + 1);
                    this.inputMessage = this.messages[i].content;
                    this.sendMessage();
                    break;
                }
            }
            this.activeMessageIndex = -1;
        },
        
        editMessage(index) {
            if (this.messages[index].role === 'user') {
                this.inputMessage = this.messages[index].content;
                this.messages = this.messages.slice(0, index);
                this.$refs.textarea.focus();
            }
            this.activeMessageIndex = -1;
        },
        
        copyMessage(content) {
            navigator.clipboard.writeText(content);
            this.activeMessageIndex = -1;
        },
        
        // ===== UI HELPERS =====
        renderMessage(content) {
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    highlight: function(code, lang) {
                        if (lang && hljs.getLanguage(lang)) {
                            return hljs.highlight(code, { language: lang }).value;
                        }
                        return hljs.highlightAuto(code).value;
                    }
                });
                return marked.parse(content);
            }
            return content.replace(/\n/g, '<br>');
        },
        
        autoResize() {
            this.$nextTick(() => {
                const textarea = this.$refs.textarea;
                if (textarea) {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                }
            });
        },
        
        scrollToBottom() {
            this.$nextTick(() => {
                const area = this.$refs.messagesArea;
                if (area) {
                    area.scrollTop = area.scrollHeight;
                    this.isAtBottom = true;
                }
            });
        },
        
        handleScroll() {
            const area = this.$refs.messagesArea;
            if (area) {
                const threshold = 100;
                this.isAtBottom = area.scrollHeight - area.scrollTop - area.clientHeight < threshold;
            }
        },
        
        formatTime(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const now = new Date();
            
            if (date.toDateString() === now.toDateString()) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString();
        }
    };
}

window.chatApp = chatApp;