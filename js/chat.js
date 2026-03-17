// js/chat.js - Complete Chat System with Upload & Voice
console.log('🚀 Chat.js loading...');

class ChatSystem {
    constructor() {
        console.log('Initializing ChatSystem...');
        
        // Core properties
        this.api = window.api;
        this.messages = [];
        this.currentChatId = Date.now();
        this.currentStatus = 'idle';
        this.apiStatus = 'checking';
        this.isOnline = navigator.onLine;
        this.isRecording = false;
        this.isSpeaking = false;
        this.isMicMode = false;
        this.currentFile = null;
        this.messageId = 0;
        this.pressTimer = null;
        this.recognition = null;
        this.uploadedFiles = [];
        
        // Status texts
        this.statusTexts = {
            idle: 'Ask something...',
            thinking: 'Thinking',
            typing: 'Typing',
            uploading: 'Uploading',
            processing: 'Processing',
            error: 'Error occurred',
            offline: 'Offline mode',
            prohibited: 'Prohibited'
        };

        // Initialize
        this.init();
    }

    // ===== INITIALIZATION =====

    async init() {
        console.log('Setting up ChatSystem...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Check if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }

    cacheElements() {
        this.elements = {
            messagesArea: document.getElementById('messagesArea'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            fileUpload: document.getElementById('fileUpload'),
            statusText: document.getElementById('statusText'),
            statusDots: document.getElementById('statusDots'),
            statusLight: document.getElementById('statusLight'),
            connectionText: document.getElementById('connectionText'),
            uploadPreview: document.getElementById('uploadPreview'),
            fileName: document.getElementById('fileName'),
            fileSize: document.getElementById('fileSize'),
            fileIcon: document.getElementById('fileIcon'),
            fileCount: document.getElementById('fileCount'),
            wordCount: document.getElementById('wordCount'),
            sendIcon: document.getElementById('sendIcon'),
            micIcon: document.getElementById('micIcon'),
            buttonTooltip: document.getElementById('buttonTooltip')
        };
    }

    async setup() {
        console.log('ChatSystem setup starting...');
        
        // Load settings
        this.loadSettings();
        
        // Load messages
        await this.loadMessages();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Test API connection
        await this.testAPIConnection();
        
        // Start periodic checks
        this.startPeriodicChecks();
        
        // Update UI
        this.updateUI();
        
        console.log('✅ ChatSystem ready');
    }

    loadSettings() {
        this.settings = {
            model: localStorage.getItem('ai_model') || 'gpt-4',
            temperature: parseFloat(localStorage.getItem('ai_temperature')) || 0.7,
            stream: localStorage.getItem('ai_stream') !== 'false',
            language: localStorage.getItem('preferred_language') || 'en'
        };
        console.log('Settings loaded:', this.settings);
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Message input
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('input', (e) => {
                this.autoResize(e.target);
                this.updateWordCount();
            });

            this.elements.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.elements.messageInput.addEventListener('focus', () => {
                this.setStatus('idle');
            });
        }

        // Send button
        if (this.elements.sendBtn) {
            // Mouse events
            this.elements.sendBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.startPressTimer();
            });

            this.elements.sendBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.clearPressTimer();
                this.handleSendClick();
            });

            this.elements.sendBtn.addEventListener('mouseleave', () => {
                this.clearPressTimer();
            });

            // Touch events
            this.elements.sendBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.startPressTimer();
            });

            this.elements.sendBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.clearPressTimer();
                this.handleSendClick();
            });
        }

        // File upload
        if (this.elements.fileUpload) {
            this.elements.fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Network status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.testAPIConnection();
            this.showNotification('Back online', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.apiStatus = 'offline';
            this.updateConnectionStatus();
            this.showNotification('You are offline', 'warning');
        });

        // Parent messages (for iframe)
        window.addEventListener('message', (e) => {
            if (e.data.type === 'new-chat') {
                this.newChat();
            } else if (e.data.type === 'load-chat') {
                this.loadChat(e.data.chatId);
            } else if (e.data.type === 'settings-updated') {
                this.loadSettings();
            }
        });

        console.log('✅ Event listeners ready');
    }

    startPeriodicChecks() {
        // Check API status every 30 seconds
        setInterval(() => this.testAPIConnection(), 30000);
        
        // Check connection status every 5 seconds
        setInterval(() => {
            if (this.isOnline !== navigator.onLine) {
                this.isOnline = navigator.onLine;
                this.updateConnectionStatus();
            }
        }, 5000);
    }

    // ===== API METHODS =====

    async testAPIConnection() {
        console.log('Testing API connection...');
        
        if (!this.api) {
            console.warn('API not available');
            this.apiStatus = 'unavailable';
            this.updateConnectionStatus();
            return false;
        }

        try {
            const result = await this.api.testConnection();
            
            if (result.success) {
                this.apiStatus = 'online';
                console.log(`✅ API connected (${result.latency}ms)`);
            } else {
                this.apiStatus = 'error';
                console.warn('⚠️ API error');
            }
            
            this.updateConnectionStatus();
            return result.success;
            
        } catch (error) {
            console.error('API connection test failed:', error);
            this.apiStatus = 'offline';
            this.updateConnectionStatus();
            return false;
        }
    }

    updateConnectionStatus() {
        if (!this.elements.statusLight || !this.elements.connectionText) return;

        const { statusLight, connectionText } = this.elements;

        if (!this.isOnline) {
            statusLight.className = 'status-light offline';
            connectionText.textContent = 'Offline';
        } else {
            switch(this.apiStatus) {
                case 'online':
                    statusLight.className = 'status-light online';
                    connectionText.textContent = 'Connected';
                    break;
                case 'error':
                    statusLight.className = 'status-light error';
                    connectionText.textContent = 'API Error';
                    break;
                case 'checking':
                    statusLight.className = 'status-light warning';
                    connectionText.textContent = 'Checking...';
                    break;
                default:
                    statusLight.className = 'status-light offline';
                    connectionText.textContent = 'Disconnected';
            }
        }
    }

    // ===== MESSAGE HANDLING =====

    async sendMessage() {
        const message = this.elements.messageInput?.value.trim();
        
        if (!message && !this.currentFile) {
            console.log('No message to send');
            return;
        }

        console.log('Sending message:', message);
        
        this.analyzeIntent(message);

        // Add user message with file if exists
        this.addMessage('user', message || '📎 File uploaded', this.currentFile);
        
        // Clear input
        if (this.elements.messageInput) {
            this.elements.messageInput.value = '';
            this.autoResize(this.elements.messageInput);
            this.updateWordCount();
        }

        this.showTyping();

        try {
            let response;
            
            if (this.api && this.apiStatus === 'online' && this.isOnline) {
                response = await this.getAPIResponse(message);
            } else {
                response = this.getLocalResponse(message);
            }

            this.hideTyping();
            this.addMessage('assistant', response);
            this.setStatus('idle');

            // Auto-play if in mic mode
            if (this.isMicMode && !this.isRecording) {
                setTimeout(() => {
                    const lastMsg = document.querySelector('.message.assistant:last-child .voice-mini-btn');
                    if (lastMsg) {
                        this.playMessage(lastMsg);
                    }
                }, 500);
            }

            this.saveToHistory(message, response);

        } catch (error) {
            console.error('Send error:', error);
            this.hideTyping();
            this.addMessage('system', '❌ Error: ' + error.message);
            this.setStatus('error');
        } finally {
            this.clearUpload();
        }
    }

    async getAPIResponse(message) {
        try {
            const history = this.getChatHistory();

            if (this.settings.stream && this.api.chatStream) {
                return await this.getStreamingResponse(message, history);
            } else {
                const result = await this.api.chat({
                    message: message,
                    history: history,
                    model: this.settings.model,
                    temperature: this.settings.temperature
                });

                if (result.success) {
                    return result.data.response;
                } else {
                    throw new Error(result.error);
                }
            }
        } catch (error) {
            console.error('API error, falling back to offline:', error);
            return this.getLocalResponse(message);
        }
    }

    async getStreamingResponse(message, history) {
        return new Promise((resolve, reject) => {
            let fullResponse = '';

            this.api.chatStream({
                message: message,
                history: history,
                model: this.settings.model,
                temperature: this.settings.temperature
            }, 
            (chunk) => {
                if (chunk.chunk) {
                    fullResponse += chunk.chunk;
                    this.updateStreamingMessage(fullResponse);
                }
            },
            () => {
                this.removeStreamingMessage();
                resolve(fullResponse);
            },
            (error) => {
                this.removeStreamingMessage();
                reject(error);
            });
        });
    }

    getLocalResponse(message) {
        const lower = message.toLowerCase();
        
        if (lower.match(/^(hello|hi|hey)/i)) {
            return "👋 Hello! How can I help you today? (Offline Mode)";
        }
        if (lower.includes('thank')) {
            return "🙏 You're welcome! (Offline Mode)";
        }
        if (lower.includes('bye')) {
            return "👋 Goodbye! (Offline Mode)";
        }
        if (lower.includes('help')) {
            return "💡 I can help with questions, code, and more. (Offline Mode)";
        }
        
        const responses = [
            "I understand. (Offline Mode)",
            "Thanks for your message! (Offline Mode)",
            "Got it. (Offline Mode)",
            "How can I help? (Offline Mode)"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    analyzeIntent(message) {
        if (!message) return;
        
        const lower = message.toLowerCase();
        
        if (lower.includes('think')) {
            this.setStatus('thinking');
        } else if (lower.includes('upload')) {
            this.setStatus('uploading');
        } else {
            this.setStatus('thinking');
        }
    }

    // ===== MESSAGE RENDERING =====

    addMessage(role, content, file = null) {
        if (!this.elements.messagesArea) return;

        this.messageId++;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.id = `msg-${this.messageId}`;

        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let fileHtml = '';
        if (file) {
            const fileSize = (file.size / 1024).toFixed(1);
            fileHtml = `
                <div class="file-attachment">
                    <i class="fas fa-paperclip"></i>
                    ${file.name} (${fileSize} KB)
                </div>
            `;
        }

        let actionsHtml = '';
        if (role === 'assistant' || role === 'user') {
            actionsHtml = `
                <div class="message-actions">
                    <button class="voice-mini-btn" onclick="window.chat?.playMessage(this)">
                        <i class="fas fa-volume-up"></i>
                        <span>Listen</span>
                    </button>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${this.getAvatarIcon(role)}"></i>
            </div>
            <div class="message-content">
                ${this.escapeHtml(content)}
                ${fileHtml}
                ${actionsHtml}
            </div>
            <div class="message-time">${time}</div>
        `;

        this.elements.messagesArea.appendChild(messageDiv);
        this.scrollToBottom();
        this.saveMessages();
    }

    getAvatarIcon(role) {
        switch(role) {
            case 'user': return 'fa-user';
            case 'system': return 'fa-exclamation-triangle';
            default: return 'fa-robot';
        }
    }

    updateStreamingMessage(content) {
        let streamingEl = document.getElementById('streaming-message');
        
        if (!streamingEl) {
            streamingEl = document.createElement('div');
            streamingEl.id = 'streaming-message';
            streamingEl.className = 'message assistant streaming';
            streamingEl.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content"></div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            `;
            this.elements.messagesArea.appendChild(streamingEl);
        }
        
        const contentEl = streamingEl.querySelector('.message-content');
        contentEl.innerHTML = this.escapeHtml(content);
        this.scrollToBottom();
    }

    removeStreamingMessage() {
        const el = document.getElementById('streaming-message');
        if (el) el.remove();
    }

    showTyping() {
        this.hideTyping();

        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.id = 'typingIndicator';
        typing.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        this.elements.messagesArea.appendChild(typing);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }

    scrollToBottom() {
        if (this.elements.messagesArea) {
            this.elements.messagesArea.scrollTop = this.elements.messagesArea.scrollHeight;
        }
    }

    // ===== VOICE METHODS =====

    async startVoiceRecording() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showNotification('Voice recognition not supported', 'error');
            return;
        }

        try {
            if (this.elements.sendBtn) {
                this.elements.sendBtn.classList.add('recording');
            }
            
            this.setStatus('processing');
            this.isRecording = true;

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = this.settings.language === 'mm' ? 'my-MM' : 'en-US';

            let finalTranscript = '';

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (this.elements.messageInput) {
                    this.elements.messageInput.value = finalTranscript || interimTranscript;
                    this.autoResize(this.elements.messageInput);
                }
            };

            this.recognition.onend = () => {
                if (this.elements.sendBtn) {
                    this.elements.sendBtn.classList.remove('recording');
                }
                this.isRecording = false;
                this.setStatus('idle');
                
                if (finalTranscript.trim() && this.elements.messageInput) {
                    this.elements.messageInput.value = finalTranscript.trim();
                    this.sendMessage();
                }
            };

            this.recognition.onerror = (error) => {
                console.error('Recognition error:', error);
                if (this.elements.sendBtn) {
                    this.elements.sendBtn.classList.remove('recording');
                }
                this.isRecording = false;
                this.setStatus('idle');
                
                if (error.error === 'not-allowed') {
                    this.showNotification('Microphone access denied', 'error');
                }
            };

            this.recognition.start();

        } catch (error) {
            console.error('Voice recording error:', error);
            if (this.elements.sendBtn) {
                this.elements.sendBtn.classList.remove('recording');
            }
            this.isRecording = false;
            this.setStatus('idle');
            this.showNotification('Failed to start recording', 'error');
        }
    }

    speakText(text, button) {
        if (!('speechSynthesis' in window)) {
            this.showNotification('Text-to-speech not supported', 'error');
            return;
        }

        if (this.isSpeaking) {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
            
            if (button) {
                button.classList.remove('playing');
                button.innerHTML = '<i class="fas fa-volume-up"></i><span>Listen</span>';
            }
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))
        ) || voices.find(v => v.lang.includes('en')) || voices[0];
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = this.settings.language === 'mm' ? 'my-MM' : 'en-US';

        utterance.onstart = () => {
            this.isSpeaking = true;
            if (button) {
                button.classList.add('playing');
                button.innerHTML = '<i class="fas fa-stop"></i><span>Stop</span>';
            }
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (button) {
                button.classList.remove('playing');
                button.innerHTML = '<i class="fas fa-volume-up"></i><span>Listen</span>';
            }
        };

        utterance.onerror = (error) => {
            console.error('Speech error:', error);
            this.isSpeaking = false;
            if (button) {
                button.classList.remove('playing');
                button.innerHTML = '<i class="fas fa-volume-up"></i><span>Listen</span>';
            }
        };

        window.speechSynthesis.speak(utterance);
    }

    playMessage(button) {
        const messageDiv = button.closest('.message');
        const contentDiv = messageDiv.querySelector('.message-content');
        const text = contentDiv.childNodes[0]?.textContent || contentDiv.textContent;
        this.speakText(text, button);
    }

    // ===== SEND BUTTON LOGIC =====

    startPressTimer() {
        this.pressTimer = setTimeout(() => {
            this.toggleMicMode();
        }, 500);
    }

    clearPressTimer() {
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
    }

    toggleMicMode() {
        this.isMicMode = !this.isMicMode;
        
        if (this.elements.sendBtn) {
            if (this.isMicMode) {
                this.elements.sendBtn.classList.add('mic-mode');
                if (this.elements.sendIcon) this.elements.sendIcon.style.display = 'none';
                if (this.elements.micIcon) this.elements.micIcon.style.display = 'block';
                if (this.elements.buttonTooltip) this.elements.buttonTooltip.textContent = 'Click to speak';
            } else {
                this.elements.sendBtn.classList.remove('mic-mode');
                if (this.elements.sendIcon) this.elements.sendIcon.style.display = 'block';
                if (this.elements.micIcon) this.elements.micIcon.style.display = 'none';
                if (this.elements.buttonTooltip) this.elements.buttonTooltip.textContent = 'Send message';
            }
        }
    }

    handleSendClick() {
        if (this.isMicMode) {
            this.startVoiceRecording();
        } else {
            this.sendMessage();
        }
    }

    // ===== FILE UPLOAD =====

    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        this.currentFile = files[0];
        this.uploadedFiles = files;
        
        if (!this.elements.uploadPreview || !this.elements.fileName || 
            !this.elements.fileSize || !this.elements.fileIcon || !this.elements.fileCount) {
            return;
        }

        const ext = this.currentFile.name.split('.').pop().toLowerCase();
        const iconMap = {
            'jpg': 'fa-image', 'jpeg': 'fa-image', 'png': 'fa-image', 'gif': 'fa-image',
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word', 'docx': 'fa-file-word',
            'xls': 'fa-file-excel', 'xlsx': 'fa-file-excel',
            'txt': 'fa-file-alt',
            'zip': 'fa-file-archive', 'rar': 'fa-file-archive',
            'mp3': 'fa-file-audio', 'wav': 'fa-file-audio',
            'mp4': 'fa-file-video', 'mov': 'fa-file-video'
        };
        
        this.elements.fileIcon.className = `fas ${iconMap[ext] || 'fa-file'}`;
        this.elements.fileName.textContent = this.currentFile.name;
        
        const sizeKB = (this.currentFile.size / 1024).toFixed(1);
        this.elements.fileSize.textContent = `(${sizeKB} KB)`;
        
        this.elements.uploadPreview.style.display = 'flex';
        this.elements.fileCount.innerHTML = `<i class="fas fa-paperclip"></i> ${files.length} file(s)`;
    }

    clearUpload() {
        this.currentFile = null;
        this.uploadedFiles = [];
        
        if (this.elements.uploadPreview) {
            this.elements.uploadPreview.style.display = 'none';
        }
        if (this.elements.fileUpload) {
            this.elements.fileUpload.value = '';
        }
        if (this.elements.fileCount) {
            this.elements.fileCount.innerHTML = '<i class="fas fa-paperclip"></i> No files';
        }
    }

    // ===== UI HELPERS =====

    setStatus(status) {
        this.currentStatus = status;
        
        if (!this.elements.statusText || !this.elements.statusDots) return;

        if (status === 'idle') {
            this.elements.statusText.textContent = this.statusTexts.idle;
            this.elements.statusDots.style.display = 'none';
        } else {
            this.elements.statusText.textContent = this.statusTexts[status] || status;
            this.elements.statusDots.style.display = 'flex';
        }
    }

    autoResize(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    updateWordCount() {
        if (this.elements.messageInput && this.elements.wordCount) {
            const length = this.elements.messageInput.value.length;
            this.elements.wordCount.textContent = `${length}/2000`;
            
            if (length > 1600) {
                this.elements.wordCount.style.color = '#f59e0b';
            } else {
                this.elements.wordCount.style.color = '#6b6b6b';
            }
        }
    }

    updateUI() {
        this.updateConnectionStatus();
        this.updateWordCount();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== MESSAGE STORAGE =====

    saveMessages() {
        try {
            const messages = [];
            document.querySelectorAll('.message').forEach(msg => {
                const role = msg.classList.contains('user') ? 'user' : 
                            msg.classList.contains('system') ? 'system' : 'assistant';
                const contentDiv = msg.querySelector('.message-content');
                const content = contentDiv?.childNodes[0]?.textContent || contentDiv?.textContent || '';
                messages.push({ role, content });
            });
            
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            console.log('Messages saved:', messages.length);
        } catch (e) {
            console.error('Failed to save messages:', e);
        }
    }

    async loadMessages() {
        try {
            const saved = localStorage.getItem('chatMessages');
            if (saved) {
                const messages = JSON.parse(saved);
                if (this.elements.messagesArea) {
                    this.elements.messagesArea.innerHTML = '';
                    messages.forEach(msg => {
                        this.addMessage(msg.role, msg.content);
                    });
                }
                console.log('Loaded messages:', messages.length);
            } else {
                this.addMessage('assistant', '👋 Hello! How can I help you today?');
            }
        } catch (e) {
            console.error('Failed to load messages:', e);
            this.addMessage('assistant', '👋 Hello! How can I help you today?');
        }
    }

    saveToHistory(userMessage, aiResponse) {
        try {
            const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            
            const chatEntry = {
                id: Date.now(),
                title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
                userMessage: userMessage,
                aiResponse: aiResponse,
                timestamp: new Date().toISOString()
            };
            
            history.unshift(chatEntry);
            
            if (history.length > 50) {
                history.pop();
            }
            
            localStorage.setItem('chatHistory', JSON.stringify(history));
            
            if (window.parent) {
                window.parent.postMessage({ 
                    type: 'chat-history-update', 
                    history: history 
                }, '*');
            }
        } catch (e) {
            console.error('Failed to save to history:', e);
        }
    }

    getChatHistory() {
        try {
            const messages = [];
            document.querySelectorAll('.message').forEach(msg => {
                if (msg.classList.contains('system')) return;
                const role = msg.classList.contains('user') ? 'user' : 'assistant';
                const contentDiv = msg.querySelector('.message-content');
                const content = contentDiv?.childNodes[0]?.textContent || '';
                messages.push({ role, content });
            });
            return messages.slice(-10);
        } catch (e) {
            return [];
        }
    }

    // ===== CHAT MANAGEMENT =====

    newChat() {
        if (this.elements.messagesArea) {
            this.elements.messagesArea.innerHTML = '';
            this.addMessage('assistant', '👋 Hello! How can I help you today?');
        }
        
        localStorage.removeItem('chatMessages');
        this.setStatus('idle');
        this.clearUpload();
        
        if (window.parent) {
            window.parent.postMessage({ 
                type: 'chat-title-update', 
                title: 'New Chat' 
            }, '*');
        }
    }

    loadChat(chatId) {
        console.log('Loading chat:', chatId);
    }

    clearChat() {
        if (confirm('Clear all messages?')) {
            this.newChat();
        }
    }

    // ===== NOTIFICATIONS =====

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ===== CLEANUP =====

    destroy() {
        console.log('Cleaning up ChatSystem...');
        
        if (this.isSpeaking) {
            window.speechSynthesis.cancel();
        }
        
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
        
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
        }
    }
}

// ===== INITIALIZATION =====

let chat;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        chat = new ChatSystem();
        window.chat = chat;
    });
} else {
    chat = new ChatSystem();
    window.chat = chat;
}

window.addEventListener('beforeunload', () => {
    if (chat) {
        chat.destroy();
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatSystem;
}

console.log('✅ Chat.js loaded');