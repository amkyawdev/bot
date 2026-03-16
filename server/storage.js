// Storage Management System for AmkyawDev AI
const StorageManager = {
    // Storage keys
    keys: {
        CHAT_MESSAGES: 'chat_messages',
        GENERATED_IMAGES: 'generated_images',
        SAVED_CODE: 'saved_code',
        USER_SETTINGS: 'app_settings',
        USER_PROFILE: 'user_profile',
        CHAT_HISTORY: 'chat_history',
        VOICE_SETTINGS: 'voice_settings',
        TOOL_HISTORY: 'tool_history'
    },

    // Initialize storage with defaults
    init() {
        // Set default values if not exists
        if (!this.get(this.keys.CHAT_MESSAGES)) {
            this.set(this.keys.CHAT_MESSAGES, [{
                role: 'assistant',
                content: 'Hello! How can I help you today?',
                timestamp: Date.now()
            }]);
        }

        if (!this.get(this.keys.GENERATED_IMAGES)) {
            this.set(this.keys.GENERATED_IMAGES, []);
        }

        if (!this.get(this.keys.SAVED_CODE)) {
            this.set(this.keys.SAVED_CODE, '// Write your code here\n\nfunction hello() {\n    console.log("Hello, World!");\n}\n\nhello();');
        }

        if (!this.get(this.keys.USER_SETTINGS)) {
            this.set(this.keys.USER_SETTINGS, {
                theme: 'dark',
                fontSize: 'medium',
                notifications: true,
                saveHistory: true
            });
        }

        if (!this.get(this.keys.VOICE_SETTINGS)) {
            this.set(this.keys.VOICE_SETTINGS, {
                enabled: true,
                autoSpeak: false,
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                voice: 'default'
            });
        }

        if (!this.get(this.keys.CHAT_HISTORY)) {
            this.set(this.keys.CHAT_HISTORY, []);
        }
    },

    // Get item from localStorage
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error getting ${key}:`, error);
            return null;
        }
    },

    // Set item in localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting ${key}:`, error);
            return false;
        }
    },

    // Remove item
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return false;
        }
    },

    // Clear all app data
    clearAll() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    },

    // Get storage usage
    getUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // Approximate bytes
            }
        }
        return {
            bytes: total,
            kilobytes: (total / 1024).toFixed(2),
            megabytes: (total / (1024 * 1024)).toFixed(2)
        };
    },

    // Export all data
    exportData() {
        const data = {};
        Object.values(this.keys).forEach(key => {
            data[key] = this.get(key);
        });
        return data;
    },

    // Import data
    importData(data) {
        try {
            Object.entries(data).forEach(([key, value]) => {
                if (Object.values(this.keys).includes(key)) {
                    this.set(key, value);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    // Chat specific methods
    chat: {
        // Get all messages
        getAll() {
            return StorageManager.get(StorageManager.keys.CHAT_MESSAGES) || [];
        },

        // Add message
        add(message) {
            const messages = this.getAll();
            messages.push({
                ...message,
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                timestamp: Date.now()
            });
            
            // Keep only last 100 messages
            if (messages.length > 100) {
                messages.splice(0, messages.length - 100);
            }
            
            StorageManager.set(StorageManager.keys.CHAT_MESSAGES, messages);
            return messages;
        },

        // Clear all
        clear() {
            StorageManager.set(StorageManager.keys.CHAT_MESSAGES, []);
        },

        // Search messages
        search(query) {
            const messages = this.getAll();
            return messages.filter(msg => 
                msg.content.toLowerCase().includes(query.toLowerCase())
            );
        }
    },

    // Images specific methods
    images: {
        // Get all images
        getAll() {
            return StorageManager.get(StorageManager.keys.GENERATED_IMAGES) || [];
        },

        // Add image
        add(imageData) {
            const images = this.getAll();
            images.unshift({
                ...imageData,
                id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                timestamp: Date.now()
            });
            
            // Keep only last 20 images
            if (images.length > 20) {
                images.pop();
            }
            
            StorageManager.set(StorageManager.keys.GENERATED_IMAGES, images);
            return images;
        },

        // Delete image
        delete(imageId) {
            const images = this.getAll();
            const filtered = images.filter(img => img.id !== imageId);
            StorageManager.set(StorageManager.keys.GENERATED_IMAGES, filtered);
            return filtered;
        },

        // Clear all
        clear() {
            StorageManager.set(StorageManager.keys.GENERATED_IMAGES, []);
        }
    },

    // Code specific methods
    code: {
        // Get saved code
        get() {
            return StorageManager.get(StorageManager.keys.SAVED_CODE) || '';
        },

        // Save code
        save(code) {
            StorageManager.set(StorageManager.keys.SAVED_CODE, code);
        },

        // Get history
        getHistory() {
            return StorageManager.get('code_history') || [];
        },

        // Add to history
        addToHistory(code, language) {
            const history = this.getHistory();
            history.unshift({
                code,
                language,
                timestamp: Date.now(),
                id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
            });
            
            if (history.length > 20) {
                history.pop();
            }
            
            StorageManager.set('code_history', history);
            return history;
        }
    },

    // Settings methods
    settings: {
        // Get all settings
        getAll() {
            return StorageManager.get(StorageManager.keys.USER_SETTINGS) || {};
        },

        // Update settings
        update(newSettings) {
            const current = this.getAll();
            const updated = { ...current, ...newSettings };
            StorageManager.set(StorageManager.keys.USER_SETTINGS, updated);
            return updated;
        },

        // Reset to defaults
        reset() {
            const defaults = {
                theme: 'dark',
                fontSize: 'medium',
                notifications: true,
                saveHistory: true
            };
            StorageManager.set(StorageManager.keys.USER_SETTINGS, defaults);
            return defaults;
        }
    },

    // Voice settings methods
    voice: {
        // Get voice settings
        get() {
            return StorageManager.get(StorageManager.keys.VOICE_SETTINGS) || {
                enabled: true,
                autoSpeak: false,
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                voice: 'default'
            };
        },

        // Update voice settings
        update(settings) {
            const current = this.get();
            const updated = { ...current, ...settings };
            StorageManager.set(StorageManager.keys.VOICE_SETTINGS, updated);
            return updated;
        }
    },

    // Profile methods
    profile: {
        // Get profile
        get() {
            return StorageManager.get(StorageManager.keys.USER_PROFILE) || {
                name: 'Guest User',
                email: '',
                avatar: null,
                createdAt: Date.now()
            };
        },

        // Update profile
        update(profileData) {
            const current = this.get();
            const updated = { ...current, ...profileData };
            StorageManager.set(StorageManager.keys.USER_PROFILE, updated);
            return updated;
        }
    }
};

// Auto-initialize
StorageManager.init();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}