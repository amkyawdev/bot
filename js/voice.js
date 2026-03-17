// js/voice.js - Complete Voice System
console.log('Voice.js loading...');

class VoiceSystem {
    constructor() {
        this.isSpeaking = false;
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        
        this.init();
    }

    init() {
        console.log('Initializing voice system...');
        
        // Load voices
        this.loadVoices();
        
        // Initialize speech recognition
        this.initRecognition();
        
        console.log('Voice system ready');
    }

    loadVoices() {
        if (!this.synthesis) {
            console.error('Speech synthesis not supported');
            return;
        }

        // Load voices immediately
        this.voices = this.synthesis.getVoices();
        
        // If voices are not loaded yet, wait for them
        if (this.voices.length === 0) {
            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
                console.log('Voices loaded:', this.voices.length);
            };
        } else {
            console.log('Voices available:', this.voices.length);
        }
    }

    initRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Speech recognition not supported');
            return;
        }

        try {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            console.log('Speech recognition initialized');
        } catch (error) {
            console.error('Failed to initialize speech recognition:', error);
        }
    }

    // ===== TEXT TO SPEECH =====
    speak(text, options = {}) {
        return new Promise((resolve, reject) => {
            console.log('Speaking:', text.substring(0, 50) + '...');
            
            if (!this.synthesis) {
                reject('Speech synthesis not supported');
                return;
            }

            // Stop current speech
            this.stop();

            // Create utterance
            const utterance = new SpeechSynthesisUtterance(text);
            this.currentUtterance = utterance;

            // Set voice
            if (this.voices.length > 0) {
                // Try to find a good English voice
                const preferredVoice = this.voices.find(v => 
                    v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))
                ) || this.voices.find(v => v.lang.includes('en')) || this.voices[0];
                
                utterance.voice = preferredVoice;
                console.log('Using voice:', preferredVoice?.name);
            }

            // Set options
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;
            utterance.lang = options.lang || 'en-US';

            // Events
            utterance.onstart = () => {
                console.log('Speech started');
                this.isSpeaking = true;
                if (options.onStart) options.onStart();
            };

            utterance.onend = () => {
                console.log('Speech ended');
                this.isSpeaking = false;
                this.currentUtterance = null;
                if (options.onEnd) options.onEnd();
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech error:', event.error);
                this.isSpeaking = false;
                this.currentUtterance = null;
                if (options.onError) options.onError(event);
                reject(event);
            };

            // Speak
            try {
                this.synthesis.speak(utterance);
            } catch (error) {
                console.error('Failed to speak:', error);
                reject(error);
            }
        });
    }

    stop() {
        if (this.synthesis && this.isSpeaking) {
            console.log('Stopping speech');
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
        }
    }

    pause() {
        if (this.synthesis && this.isSpeaking) {
            console.log('Pausing speech');
            this.synthesis.pause();
        }
    }

    resume() {
        if (this.synthesis && this.isSpeaking) {
            console.log('Resuming speech');
            this.synthesis.resume();
        }
    }

    // ===== SPEECH TO TEXT =====
    listen(options = {}) {
        return new Promise((resolve, reject) => {
            console.log('Starting listening...');
            
            if (!this.recognition) {
                reject('Speech recognition not supported');
                return;
            }

            if (this.isListening) {
                this.stopListening();
            }

            // Set options
            this.recognition.lang = options.lang || 'en-US';
            this.recognition.interimResults = options.interim || true;
            this.recognition.continuous = options.continuous || false;

            let finalTranscript = '';
            let interimTranscript = '';

            // Events
            this.recognition.onstart = () => {
                console.log('Recognition started');
                this.isListening = true;
                if (options.onStart) options.onStart();
            };

            this.recognition.onresult = (event) => {
                interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (options.onInterim) {
                    options.onInterim(interimTranscript, finalTranscript);
                }
            };

            this.recognition.onend = () => {
                console.log('Recognition ended');
                this.isListening = false;
                
                if (options.onEnd) {
                    options.onEnd(finalTranscript.trim());
                }
                
                resolve(finalTranscript.trim());
            };

            this.recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
                this.isListening = false;
                
                if (options.onError) {
                    options.onError(event);
                }
                
                reject(event);
            };

            // Start listening
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Failed to start recognition:', error);
                this.isListening = false;
                reject(error);
            }
        });
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            console.log('Stopping listening');
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
            this.isListening = false;
        }
    }

    // ===== UTILITY =====
    isSupported() {
        return {
            speech: !!this.synthesis,
            recognition: !!this.recognition
        };
    }

    getVoices() {
        return this.voices;
    }

    setLanguage(lang) {
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    // Test function
    test() {
        console.log('Testing voice system...');
        
        if (!this.synthesis) {
            console.error('❌ Speech synthesis not supported');
        } else {
            console.log('✅ Speech synthesis supported');
            console.log('   Voices available:', this.voices.length);
        }
        
        if (!this.recognition) {
            console.error('❌ Speech recognition not supported');
        } else {
            console.log('✅ Speech recognition supported');
        }
    }
}

// Create global instance
const voice = new VoiceSystem();
window.voice = voice;

// Test on load
setTimeout(() => {
    voice.test();
}, 1000);

console.log('Voice.js loaded');