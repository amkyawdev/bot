function settingsApp() {
    return {
        // ===== USER STATE =====
        user: {
            name: 'Aung Myo Kyaw',
            email: 'aung@example.com',
            initials: 'AK',
            bio: 'AI enthusiast & developer'
        },
        
        // ===== SETTINGS STATE =====
        settings: {
            theme: 'dark',
            accent: 'chatgpt',
            fontSize: 'medium',
            animations: true,
            saveHistory: true,
            enterToSend: true,
            showTyping: true,
            markdown: true,
            apiEndpoint: 'https://oh.amkai.workers.dev',
            timeout: 30
        },
        
        // ===== NOTIFICATION STATE =====
        notification: {
            soundEnabled: true,
            notificationEnabled: true,
            volume: 70,
            messageSound: 'chime',
            loginSound: true
        },
        
        // ===== VOICE STATE =====
        voice: {
            enabled: true,
            autoSpeak: false,
            rate: 1.0,
            pitch: 1.0
        },
        
        // ===== ALARM STATE =====
        alarmMinutes: 5,
        alarmMessage: '',
        
        // ===== STORAGE STATE =====
        storage: {
            used: 0,
            total: 10,
            percentage: 0
        },
        
        // ===== UI STATE =====
        testResult: null,
        isLoading: false,
        
        // ===== INIT =====
        init() {
            this.loadUser();
            this.loadSettings();
            this.loadNotificationSettings();
            this.loadVoiceSettings();
            this.calculateStorage();
            this.applyTheme();
            this.setupMessageListener();
            
            // Request notification permission
            this.requestNotificationPermission();
        },
        
        // ===== MESSAGE LISTENER FOR PARENT =====
        setupMessageListener() {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'settings-updated') {
                    this.loadSettings();
                    this.loadNotificationSettings();
                }
            });
        },
        
        // ===== LOAD FUNCTIONS =====
        loadUser() {
            const saved = localStorage.getItem('user_profile');
            if (saved) {
                try {
                    const userData = JSON.parse(saved);
                    this.user = { ...this.user, ...userData };
                    this.updateInitials();
                } catch (e) {}
            }
        },
        
        loadSettings() {
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                try {
                    const settingsData = JSON.parse(saved);
                    this.settings = { ...this.settings, ...settingsData };
                } catch (e) {}
            }
        },
        
        loadNotificationSettings() {
            const saved = localStorage.getItem('notification_settings');
            if (saved) {
                try {
                    const notifData = JSON.parse(saved);
                    this.notification = { ...this.notification, ...notifData };
                    
                    // Update global notification system
                    if (window.NotificationSystem) {
                        NotificationSystem.soundEnabled = this.notification.soundEnabled;
                        NotificationSystem.notificationEnabled = this.notification.notificationEnabled;
                        NotificationSystem.volume = this.notification.volume;
                        NotificationSystem.messageSound = this.notification.messageSound;
                        NotificationSystem.loginSound = this.notification.loginSound;
                    }
                } catch (e) {}
            }
        },
        
        loadVoiceSettings() {
            const saved = localStorage.getItem('voice_settings');
            if (saved) {
                try {
                    const voiceData = JSON.parse(saved);
                    this.voice = { ...this.voice, ...voiceData };
                } catch (e) {}
            }
        },
        
        // ===== SAVE FUNCTIONS =====
        saveProfile() {
            this.updateInitials();
            localStorage.setItem('user_profile', JSON.stringify(this.user));
            this.showNotification('✅ Profile saved!');
            this.notifyParent();
        },
        
        saveSettings() {
            localStorage.setItem('app_settings', JSON.stringify(this.settings));
            this.applyTheme();
            this.showNotification('⚙️ Settings saved!');
            this.notifyParent();
        },
        
        saveNotificationSettings() {
            localStorage.setItem('notification_settings', JSON.stringify(this.notification));
            
            if (window.NotificationSystem) {
                NotificationSystem.soundEnabled = this.notification.soundEnabled;
                NotificationSystem.notificationEnabled = this.notification.notificationEnabled;
                NotificationSystem.volume = this.notification.volume;
                NotificationSystem.messageSound = this.notification.messageSound;
                NotificationSystem.loginSound = this.notification.loginSound;
                NotificationSystem.saveSettings();
            }
            
            this.showNotification('🔔 Notification settings saved!');
            this.notifyParent();
        },
        
        saveVoiceSettings() {
            localStorage.setItem('voice_settings', JSON.stringify(this.voice));
            this.showNotification('🎤 Voice settings saved!');
            this.notifyParent();
        },
        
        // ===== NOTIFY PARENT (MAIN PAGE) =====
        notifyParent() {
            if (window.parent) {
                window.parent.postMessage({
                    type: 'settings-updated',
                    settings: this.settings,
                    notification: this.notification,
                    voice: this.voice
                }, '*');
            }
        },
        
        // ===== THEME FUNCTIONS =====
        applyTheme() {
            // Set theme attribute
            document.documentElement.setAttribute('data-theme', this.settings.theme);
            
            // Set accent color
            let accentColor = '#19c37d';
            switch(this.settings.accent) {
                case 'chatgpt': accentColor = '#19c37d'; break;
                case 'deepseek': accentColor = '#10a37f'; break;
                case 'groq': accentColor = '#f5505e'; break;
                case 'claude': accentColor = '#c9975c'; break;
                case 'perplexity': accentColor = '#3b82f6'; break;
            }
            document.documentElement.style.setProperty('--accent', accentColor);
            document.documentElement.style.setProperty('--accent-light', accentColor + '80');
            
            // Save to localStorage
            localStorage.setItem('selected_theme', this.settings.theme);
            localStorage.setItem('selected_accent', this.settings.accent);
        },
        
        applyFontSize() {
            let fontSize = '15px';
            switch(this.settings.fontSize) {
                case 'small': fontSize = '13px'; break;
                case 'medium': fontSize = '15px'; break;
                case 'large': fontSize = '17px'; break;
            }
            document.documentElement.style.setProperty('--font-size-base', fontSize);
        },
        
        // ===== NOTIFICATION FUNCTIONS =====
        toggleSound() {
            if (window.NotificationSystem) {
                NotificationSystem.soundEnabled = this.notification.soundEnabled;
                if (this.notification.soundEnabled) {
                    setTimeout(() => this.testSound(), 100);
                }
            }
        },
        
        toggleNotification() {
            if (window.NotificationSystem) {
                NotificationSystem.notificationEnabled = this.notification.notificationEnabled;
            }
        },
        
        updateVolume() {
            if (window.NotificationSystem) {
                NotificationSystem.volume = this.notification.volume;
            }
        },
        
        testSound() {
            if (window.NotificationSystem) {
                NotificationSystem.playSound('success');
                setTimeout(() => NotificationSystem.playSound('message'), 500);
            }
        },
        
        testNotification() {
            if (window.NotificationSystem) {
                NotificationSystem.showNotification('🔔 Test Notification', {
                    body: 'This is a test notification from AmkyawDev AI'
                });
            }
        },
        
        setAlarm() {
            if (!this.alarmMinutes || this.alarmMinutes < 1) {
                alert('Please enter valid minutes');
                return;
            }
            
            if (window.NotificationSystem) {
                NotificationSystem.setAlarm(
                    this.alarmMinutes,
                    this.alarmMessage || '⏰ Time is up!'
                );
                this.showNotification(`⏰ Alarm set for ${this.alarmMinutes} minutes`);
                this.alarmMinutes = 5;
                this.alarmMessage = '';
            }
        },
        
        requestNotificationPermission() {
            if ('Notification' in window && Notification.permission !== 'granted') {
                Notification.requestPermission();
            }
        },
        
        // ===== VOICE FUNCTIONS =====
        testVoice() {
            if (!('speechSynthesis' in window)) {
                this.showNotification('❌ Text-to-speech not supported');
                return;
            }
            
            const utterance = new SpeechSynthesisUtterance('This is a test of the voice system.');
            utterance.rate = this.voice.rate;
            utterance.pitch = this.voice.pitch;
            window.speechSynthesis.speak(utterance);
        },
        
        // ===== API FUNCTIONS =====
        async testApi() {
            this.isLoading = true;
            this.testResult = null;
            
            try {
                const response = await fetch(`${this.settings.apiEndpoint}/api/health`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.testResult = {
                        success: true,
                        message: '✅ Connected successfully!'
                    };
                    
                    if (window.NotificationSystem && this.notification.soundEnabled) {
                        NotificationSystem.playSound('success');
                    }
                } else {
                    this.testResult = {
                        success: false,
                        message: `❌ Error: ${response.status}`
                    };
                }
            } catch (error) {
                this.testResult = {
                    success: false,
                    message: `❌ Failed to connect: ${error.message}`
                };
            } finally {
                this.isLoading = false;
            }
        },
        
        // ===== STORAGE FUNCTIONS =====
        calculateStorage() {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length * 2;
                }
            }
            
            const usedMB = (total / (1024 * 1024)).toFixed(2);
            this.storage.used = usedMB;
            this.storage.percentage = Math.min(100, (total / (10 * 1024 * 1024)) * 100);
        },
        
        clearCache() {
            if (confirm('Clear cached data? This will not delete your chats.')) {
                const keysToKeep = ['user_profile', 'app_settings', 'notification_settings', 'voice_settings', 'all_chats'];
                const allKeys = Object.keys(localStorage);
                
                allKeys.forEach(key => {
                    if (!keysToKeep.includes(key) && !key.startsWith('chat_')) {
                        localStorage.removeItem(key);
                    }
                });
                
                this.calculateStorage();
                this.showNotification('🧹 Cache cleared!');
            }
        },
        
        exportData() {
            const exportData = {
                user: this.user,
                settings: this.settings,
                notification: this.notification,
                voice: this.voice,
                chats: JSON.parse(localStorage.getItem('all_chats') || '{}'),
                exportDate: new Date().toISOString(),
                version: '2.0.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `amkyawdev-backup-${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('📥 Data exported!');
        },
        
        importData() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        
                        if (imported.user) {
                            this.user = { ...this.user, ...imported.user };
                            localStorage.setItem('user_profile', JSON.stringify(this.user));
                        }
                        
                        if (imported.settings) {
                            this.settings = { ...this.settings, ...imported.settings };
                            localStorage.setItem('app_settings', JSON.stringify(this.settings));
                        }
                        
                        if (imported.notification) {
                            this.notification = { ...this.notification, ...imported.notification };
                            localStorage.setItem('notification_settings', JSON.stringify(this.notification));
                        }
                        
                        if (imported.voice) {
                            this.voice = { ...this.voice, ...imported.voice };
                            localStorage.setItem('voice_settings', JSON.stringify(this.voice));
                        }
                        
                        if (imported.chats) {
                            localStorage.setItem('all_chats', JSON.stringify(imported.chats));
                        }
                        
                        this.applyTheme();
                        this.showNotification('✅ Data imported successfully!');
                        
                    } catch (error) {
                        this.showNotification('❌ Invalid backup file');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        },
        
        clearAllData() {
            if (confirm('⚠️ ARE YOU ABSOLUTELY SURE?\n\nThis will delete ALL your data including chats, settings, and profile. This action cannot be undone!')) {
                if (confirm('Type "DELETE" to confirm:')) {
                    localStorage.clear();
                    
                    // Reset to defaults
                    this.user = {
                        name: 'Guest User',
                        email: 'guest@example.com',
                        initials: 'GU',
                        bio: ''
                    };
                    
                    this.settings = {
                        theme: 'dark',
                        accent: 'chatgpt',
                        fontSize: 'medium',
                        animations: true,
                        saveHistory: true,
                        enterToSend: true,
                        showTyping: true,
                        markdown: true,
                        apiEndpoint: 'https://oh.amkai.workers.dev',
                        timeout: 30
                    };
                    
                    this.notification = {
                        soundEnabled: true,
                        notificationEnabled: true,
                        volume: 70,
                        messageSound: 'chime',
                        loginSound: true
                    };
                    
                    this.voice = {
                        enabled: true,
                        autoSpeak: false,
                        rate: 1.0,
                        pitch: 1.0
                    };
                    
                    this.calculateStorage();
                    this.applyTheme();
                    
                    this.showNotification('🗑️ All data cleared!');
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            }
        },
        
        // ===== PROFILE FUNCTIONS =====
        updateInitials() {
            if (this.user.name) {
                const names = this.user.name.split(' ');
                if (names.length >= 2) {
                    this.user.initials = (names[0][0] + names[1][0]).toUpperCase();
                } else {
                    this.user.initials = names[0].substring(0, 2).toUpperCase();
                }
            }
        },
        
        cancelEdit() {
            this.loadUser();
        },
        
        // ===== UTILITY =====
        goBack() {
            window.location.href = 'main.html';
        },
        
        showNotification(message) {
            // Create toast notification
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: var(--accent, #19c37d);
                color: white;
                padding: 12px 20px;
                border-radius: 12px;
                font-size: 14px;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                animation: slideInRight 0.3s ease;
                max-width: 300px;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(20px)';
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }
    };
}

// Make app globally available
window.settingsApp = settingsApp;