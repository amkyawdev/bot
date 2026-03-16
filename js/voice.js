// Voice Output System for AmkyawDev AI
const VoiceSystem = {
    // State
    isSpeaking: false,
    isPaused: false,
    isMuted: false,
    voices: [],
    currentVoice: null,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    
    // Initialize
    init() {
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-speech not supported');
            return false;
        }
        
        this.loadVoices();
        
        // Load voices when they change
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        // Load settings
        this.loadSettings();
        
        return true;
    },
    
    // Load available voices
    loadVoices() {
        this.voices = window.speechSynthesis.getVoices();
        
        // Set default voice (prefer Google voices)
        const googleVoices = this.voices.filter(v => v.name.includes('Google'));
        if (googleVoices.length > 0) {
            this.currentVoice = googleVoices[0];
        } else {
            this.currentVoice = this.voices[0] || null;
        }
    },
    
    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('voice_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.rate = settings.rate || 1.0;
                this.pitch = settings.pitch || 1.0;
                this.volume = settings.volume || 1.0;
                this.isMuted = settings.isMuted || false;
            } catch (e) {
                console.error('Failed to load voice settings');
            }
        }
    },
    
    // Save settings
    saveSettings() {
        localStorage.setItem('voice_settings', JSON.stringify({
            rate: this.rate,
            pitch: this.pitch,
            volume: this.volume,
            isMuted: this.isMuted
        }));
    },
    
    // Speak text
    speak(text, options = {}) {
        if (this.isMuted || !('speechSynthesis' in window)) return null;
        
        // Cancel any ongoing speech
        this.stop();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        utterance.rate = options.rate || this.rate;
        utterance.pitch = options.pitch || this.pitch;
        utterance.volume = this.isMuted ? 0 : (options.volume || this.volume);
        
        // Set voice
        if (options.voice) {
            utterance.voice = options.voice;
        } else if (this.currentVoice) {
            utterance.voice = this.currentVoice;
        }
        
        // Set language
        if (options.lang) {
            utterance.lang = options.lang;
        }
        
        // Event handlers
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.isPaused = false;
            if (options.onStart) options.onStart();
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.isPaused = false;
            if (options.onEnd) options.onEnd();
        };
        
        utterance.onerror = (event) => {
            this.isSpeaking = false;
            this.isPaused = false;
            console.error('Speech error:', event);
            if (options.onError) options.onError(event);
        };
        
        utterance.onpause = () => {
            this.isPaused = true;
            if (options.onPause) options.onPause();
        };
        
        utterance.onresume = () => {
            this.isPaused = false;
            if (options.onResume) options.onResume();
        };
        
        utterance.onboundary = (event) => {
            if (options.onBoundary) options.onBoundary(event);
        };
        
        window.speechSynthesis.speak(utterance);
        return utterance;
    },
    
    // Speak message with queue
    speakMessage(message, options = {}) {
        // Clean message (remove markdown, code blocks, etc.)
        const cleanText = this.cleanMessageForSpeech(message);
        
        // Split long messages into chunks
        const chunks = this.splitText(cleanText, 200);
        
        // Speak chunks sequentially
        this.speakChunks(chunks, options);
    },
    
    // Clean message for speech
    cleanMessageForSpeech(text) {
        return text
            .replace(/```[\s\S]*?```/g, 'Code block omitted. ') // Remove code blocks
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
            .replace(/[*_~#>`]/g, '') // Remove markdown symbols
            .replace(/\n+/g, '. ') // Replace newlines with periods
            .replace(/\s+/g, ' ') // Remove extra spaces
            .trim();
    },
    
    // Split text into chunks
    splitText(text, maxLength) {
        const chunks = [];
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        let currentChunk = '';
        
        for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxLength) {
                currentChunk += sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
            }
        }
        
        if (currentChunk) chunks.push(currentChunk);
        
        return chunks;
    },
    
    // Speak chunks sequentially
    async speakChunks(chunks, options = {}) {
        for (let i = 0; i < chunks.length; i++) {
            if (!this.isSpeaking) break; // Stop if cancelled
            
            await new Promise((resolve) => {
                this.speak(chunks[i], {
                    ...options,
                    onEnd: () => {
                        if (i === chunks.length - 1 && options.onEnd) {
                            options.onEnd();
                        }
                        resolve();
                    }
                });
            });
        }
    },
    
    // Stop speaking
    stop() {
        window.speechSynthesis.cancel();
        this.isSpeaking = false;
        this.isPaused = false;
    },
    
    // Pause speaking
    pause() {
        window.speechSynthesis.pause();
        this.isPaused = true;
    },
    
    // Resume speaking
    resume() {
        window.speechSynthesis.resume();
        this.isPaused = false;
    },
    
    // Toggle mute
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.saveSettings();
        
        if (this.isMuted && this.isSpeaking) {
            this.stop();
        }
        
        return this.isMuted;
    },
    
    // Get available voices by language
    getVoicesByLang(lang) {
        return this.voices.filter(v => v.lang.startsWith(lang));
    },
    
    // Set voice by name
    setVoice(voiceName) {
        const voice = this.voices.find(v => v.name === voiceName);
        if (voice) {
            this.currentVoice = voice;
            return true;
        }
        return false;
    },
    
    // Set rate
    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(2, rate));
        this.saveSettings();
    },
    
    // Set pitch
    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch));
        this.saveSettings();
    },
    
    // Set volume
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    },
    
    // Get voice settings UI
    getSettingsUI() {
        return `
            <div class="voice-settings">
                <h3>Voice Settings</h3>
                
                <div class="setting-item">
                    <label>Voice</label>
                    <select id="voice-select" class="voice-select">
                        ${this.voices.map(v => 
                            `<option value="${v.name}" ${this.currentVoice?.name === v.name ? 'selected' : ''}>
                                ${v.name} (${v.lang})
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="setting-item">
                    <label>Speed: <span id="rate-value">${this.rate}x</span></label>
                    <input type="range" id="rate-slider" min="0.5" max="2" step="0.1" value="${this.rate}">
                </div>
                
                <div class="setting-item">
                    <label>Pitch: <span id="pitch-value">${this.pitch}</span></label>
                    <input type="range" id="pitch-slider" min="0" max="2" step="0.1" value="${this.pitch}">
                </div>
                
                <div class="setting-item">
                    <label>Volume: <span id="volume-value">${Math.round(this.volume * 100)}%</span></label>
                    <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="${this.volume}">
                </div>
                
                <div class="setting-item">
                    <label>
                        <input type="checkbox" id="mute-checkbox" ${this.isMuted ? 'checked' : ''}>
                        Mute all speech
                    </label>
                </div>
                
                <div class="voice-test">
                    <button class="test-btn" onclick="VoiceSystem.testVoice()">Test Voice</button>
                </div>
            </div>
        `;
    },
    
    // Test voice
    testVoice() {
        this.speak('Hello, this is a test of the voice system. How does it sound?');
    },
    
    // Check if speaking
    isCurrentlySpeaking() {
        return this.isSpeaking;
    }
};

// Initialize voice system
if (typeof window !== 'undefined') {
    window.VoiceSystem = VoiceSystem;
    document.addEventListener('DOMContentLoaded', () => VoiceSystem.init());
}