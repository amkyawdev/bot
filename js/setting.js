// js/setting.js - Advanced Settings System

class SettingsSystem {
    constructor() {
        this.currentSection = 'profile';
        this.currentLang = localStorage.getItem('preferred_language') || 'en';
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.applySettings();
        this.checkAPIStatus();
        this.updateSystemInfo();
        this.setupSidebar();
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Profile save
        document.getElementById('saveProfile')?.addEventListener('click', () => {
            this.saveProfile();
        });

        // Appearance save
        document.getElementById('saveAppearance')?.addEventListener('click', () => {
            this.saveAppearance();
        });

        // Language save
        document.getElementById('saveLanguage')?.addEventListener('click', () => {
            this.saveLanguage();
        });

        // Language cards
        document.querySelectorAll('.language-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.language-card').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const lang = e.currentTarget.dataset.lang;
                this.previewLanguage(lang);
            });
        });

        // Model cards
        document.querySelectorAll('.model-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.model-card').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Temperature slider
        document.getElementById('aiTemp')?.addEventListener('input', (e) => {
            document.getElementById('tempValue').textContent = parseFloat(e.target.value).toFixed(1);
        });

        // Notifications save
        document.getElementById('saveNotifications')?.addEventListener('click', () => {
            this.saveNotifications();
        });

        // Test notification
        document.getElementById('testNotification')?.addEventListener('click', () => {
            this.testNotification();
        });

        // Privacy save
        document.getElementById('savePrivacy')?.addEventListener('click', () => {
            this.savePrivacy();
        });

        // Clear data
        document.getElementById('clearData')?.addEventListener('click', () => {
            this.clearAllData();
        });

        // AI save
        document.getElementById('saveAI')?.addEventListener('click', () => {
            this.saveAISettings();
        });

        // Test API
        document.getElementById('testAPI')?.addEventListener('click', () => {
            this.testAPIConnection();
        });

        // Export data
        document.getElementById('exportData')?.addEventListener('click', () => {
            this.exportData();
        });

        // Import data
        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.importData(e);
        });

        // Auto backup toggle
        document.getElementById('autoBackup')?.addEventListener('change', (e) => {
            this.settings.autoBackup = e.target.checked;
            this.saveSettings();
        });

        // Reset settings
        document.getElementById('resetSettings')?.addEventListener('click', () => {
            this.resetAllSettings();
        });

        // Dev mode toggle
        document.getElementById('devMode')?.addEventListener('change', (e) => {
            this.settings.devMode = e.target.checked;
            this.saveSettings();
            this.showNotification(
                e.target.checked ? 'Developer mode enabled' : 'Developer mode disabled',
                'info'
            );
        });

        // API endpoint change
        document.getElementById('apiEndpoint')?.addEventListener('change', (e) => {
            this.settings.apiEndpoint = e.target.value;
            this.saveSettings();
        });
    }

    setupSidebar() {
        // Set active section based on URL hash
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.switchSection(hash);
        }
    }

    switchSection(section) {
        // Update active class on sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Update active class on content sections
        document.querySelectorAll('.settings-section').forEach(sectionEl => {
            sectionEl.classList.remove('active');
        });
        document.getElementById(`section-${section}`)?.classList.add('active');

        // Update URL hash
        window.location.hash = section;
        this.currentSection = section;
    }

    loadSettings() {
        const defaultSettings = {
            theme: 'dark',
            compact: false,
            fontSize: 'medium',
            animations: true,
            emailNotifications: true,
            desktopNotifications: false,
            soundNotifications: false,
            mentionNotifications: true,
            shareData: false,
            saveHistory: true,
            onlineStatus: true,
            readReceipts: true,
            aiModel: 'gpt-4',
            aiTemp: 0.7,
            aiStream: true,
            aiContext: 20,
            autoBackup: false,
            devMode: false,
            apiEndpoint: 'https://my.amkai.workers.dev',
            timeout: 30,
            cacheSize: 100,
            dateFormat: 'MM/DD/YYYY'
        };

        const saved = localStorage.getItem('app_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('app_settings', JSON.stringify(this.settings));
    }

    loadUserData() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        document.getElementById('displayName').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('bio').value = user.bio || '';

        // Update last backup info
        const lastBackup = localStorage.getItem('last_backup');
        if (lastBackup) {
            document.getElementById('lastBackup').textContent = new Date(lastBackup).toLocaleString();
        }
    }

    applySettings() {
        // Apply theme
        document.getElementById('theme').value = this.settings.theme;
        this.applyTheme(this.settings.theme);

        // Apply appearance
        document.getElementById('compact').checked = this.settings.compact;
        document.getElementById('fontSize').value = this.settings.fontSize;
        document.getElementById('animations').checked = this.settings.animations;

        // Apply language
        const langCard = document.querySelector(`.language-card[data-lang="${this.currentLang}"]`);
        if (langCard) {
            document.querySelectorAll('.language-card').forEach(c => c.classList.remove('active'));
            langCard.classList.add('active');
        }

        // Apply notifications
        document.getElementById('emailNotifications').checked = this.settings.emailNotifications;
        document.getElementById('desktopNotifications').checked = this.settings.desktopNotifications;
        document.getElementById('soundNotifications').checked = this.settings.soundNotifications;
        document.getElementById('mentionNotifications').checked = this.settings.mentionNotifications;

        // Apply privacy
        document.getElementById('shareData').checked = this.settings.shareData;
        document.getElementById('saveHistory').checked = this.settings.saveHistory;
        document.getElementById('onlineStatus').checked = this.settings.onlineStatus;
        document.getElementById('readReceipts').checked = this.settings.readReceipts;

        // Apply AI settings
        document.querySelectorAll('.model-card').forEach(card => {
            card.classList.remove('active');
            if (card.dataset.model === this.settings.aiModel) {
                card.classList.add('active');
            }
        });
        document.getElementById('aiTemp').value = this.settings.aiTemp;
        document.getElementById('tempValue').textContent = this.settings.aiTemp.toFixed(1);
        document.getElementById('aiStream').checked = this.settings.aiStream;
        document.getElementById('aiContext').value = this.settings.aiContext;

        // Apply advanced
        document.getElementById('devMode').checked = this.settings.devMode;
        document.getElementById('apiEndpoint').value = this.settings.apiEndpoint;
        document.getElementById('timeout').value = this.settings.timeout;
        document.getElementById('cacheSize').value = this.settings.cacheSize;
        document.getElementById('autoBackup').checked = this.settings.autoBackup;
        document.getElementById('dateFormat').value = this.settings.dateFormat;
    }

    saveProfile() {
        const name = document.getElementById('displayName').value;
        const email = document.getElementById('email').value;
        const bio = document.getElementById('bio').value;

        if (!name || !email) {
            this.showNotification('Name and email are required', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Invalid email address', 'error');
            return;
        }

        const user = {
            name: name,
            email: email,
            bio: bio,
            initials: this.getInitials(name)
        };

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userBio', bio);

        this.showNotification('Profile saved successfully!', 'success');

        // Notify parent if in iframe
        if (window.parent) {
            window.parent.postMessage({ type: 'profile-updated', user: user }, '*');
        }
    }

    saveAppearance() {
        this.settings.theme = document.getElementById('theme').value;
        this.settings.compact = document.getElementById('compact').checked;
        this.settings.fontSize = document.getElementById('fontSize').value;
        this.settings.animations = document.getElementById('animations').checked;

        this.applyTheme(this.settings.theme);
        this.applyFontSize(this.settings.fontSize);
        this.saveSettings();

        this.showNotification('Appearance settings saved!', 'success');
    }

    saveLanguage() {
        const activeLang = document.querySelector('.language-card.active')?.dataset.lang;
        if (activeLang) {
            this.currentLang = activeLang;
            localStorage.setItem('preferred_language', activeLang);
            this.settings.dateFormat = document.getElementById('dateFormat').value;
            this.saveSettings();

            this.showNotification(
                activeLang === 'en' ? 'Language changed to English' : 'ဘာသာစကား မြန်မာသို့ ပြောင်းလဲပြီးပါပြီ',
                'success'
            );

            // Reload to apply language (in a real app, you'd use i18n)
            setTimeout(() => {
                if (confirm('Reload to apply language changes?')) {
                    location.reload();
                }
            }, 1500);
        }
    }

    previewLanguage(lang) {
        // Preview language without saving
        console.log('Previewing language:', lang);
    }

    saveNotifications() {
        this.settings.emailNotifications = document.getElementById('emailNotifications').checked;
        this.settings.desktopNotifications = document.getElementById('desktopNotifications').checked;
        this.settings.soundNotifications = document.getElementById('soundNotifications').checked;
        this.settings.mentionNotifications = document.getElementById('mentionNotifications').checked;

        this.saveSettings();

        if (this.settings.desktopNotifications) {
            this.requestNotificationPermission();
        }

        this.showNotification('Notification settings saved!', 'success');
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                this.showNotification('Please enable notifications for desktop alerts', 'warning');
            }
        }
    }

    testNotification() {
        if (this.settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('AmkyawDev AI', {
                body: 'This is a test notification!',
                icon: '/assets/images/logo.svg'
            });
        }

        if (this.settings.soundNotifications) {
            this.playTestSound();
        }

        this.showNotification('Test notification sent!', 'info');
    }

    playTestSound() {
        // Simple beep sound
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAAA=';
        audio.play().catch(() => {});
    }

    savePrivacy() {
        this.settings.shareData = document.getElementById('shareData').checked;
        this.settings.saveHistory = document.getElementById('saveHistory').checked;
        this.settings.onlineStatus = document.getElementById('onlineStatus').checked;
        this.settings.readReceipts = document.getElementById('readReceipts').checked;

        this.saveSettings();
        this.showNotification('Privacy settings saved!', 'success');
    }

    saveAISettings() {
        const activeModel = document.querySelector('.model-card.active')?.dataset.model;
        if (activeModel) {
            this.settings.aiModel = activeModel;
        }
        this.settings.aiTemp = parseFloat(document.getElementById('aiTemp').value);
        this.settings.aiStream = document.getElementById('aiStream').checked;
        this.settings.aiContext = parseInt(document.getElementById('aiContext').value);

        localStorage.setItem('ai_model', this.settings.aiModel);
        localStorage.setItem('ai_temperature', this.settings.aiTemp);
        localStorage.setItem('ai_stream', this.settings.aiStream);
        localStorage.setItem('ai_context', this.settings.aiContext);

        this.saveSettings();
        this.showNotification('AI settings saved!', 'success');
    }

    async testAPIConnection() {
        const statusEl = document.getElementById('apiStatus');
        const badgeEl = document.getElementById('apiStatusBadge');
        const endpoint = document.getElementById('apiEndpoint').value;

        statusEl.textContent = 'Testing connection...';
        badgeEl.textContent = 'Testing';
        badgeEl.className = 'api-status status-warning';

        try {
            const response = await fetch(`${endpoint}/api/health`);
            const data = await response.json();

            if (data.success) {
                statusEl.textContent = 'Connected to API';
                badgeEl.textContent = 'Online';
                badgeEl.className = 'api-status status-success';
                this.showNotification('API connection successful!', 'success');
            } else {
                throw new Error('API error');
            }
        } catch (error) {
            statusEl.textContent = 'Failed to connect to API';
            badgeEl.textContent = 'Offline';
            badgeEl.className = 'api-status status-error';
            this.showNotification('API connection failed', 'error');
        }
    }

    async checkAPIStatus() {
        const badgeEl = document.getElementById('apiStatusBadge');
        if (!badgeEl) return;

        try {
            const response = await fetch('https://my.amkai.workers.dev/api/health');
            const data = await response.json();

            if (data.success) {
                badgeEl.textContent = 'Online';
                badgeEl.className = 'api-status status-success';
            } else {
                badgeEl.textContent = 'Error';
                badgeEl.className = 'api-status status-error';
            }
        } catch (error) {
            badgeEl.textContent = 'Offline';
            badgeEl.className = 'api-status status-error';
        }
    }

    exportData() {
        const data = {
            user: JSON.parse(localStorage.getItem('user') || '{}'),
            settings: this.settings,
            chatHistory: JSON.parse(localStorage.getItem('chatHistory') || '[]'),
            exportDate: new Date().toISOString(),
            version: '2.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amkyawdev-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        localStorage.setItem('last_backup', new Date().toISOString());
        document.getElementById('lastBackup').textContent = new Date().toLocaleString();

        this.showNotification('Data exported successfully!', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Restore user data
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                // Restore settings
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                    this.saveSettings();
                }

                // Restore chat history
                if (data.chatHistory) {
                    localStorage.setItem('chatHistory', JSON.stringify(data.chatHistory));
                }

                this.applySettings();
                this.loadUserData();

                this.showNotification('Data imported successfully! Reloading...', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error) {
                this.showNotification('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);

        // Clear input
        event.target.value = '';
    }

    clearAllData() {
        const lang = localStorage.getItem('preferred_language') || 'en';
        const confirmMsg = lang === 'mm' ?
            'သေချာပါသလား? ဒေတာအားလုံး ဖျက်ပစ်မည်ဖြစ်သည်။' :
            'Are you sure? This will delete all your data.';

        if (confirm(confirmMsg)) {
            localStorage.clear();
            this.showNotification('All data cleared. Redirecting...', 'warning');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        }
    }

    resetAllSettings() {
        const lang = localStorage.getItem('preferred_language') || 'en';
        const confirmMsg = lang === 'mm' ?
            'ဆက်တင်အားလုံးကို မူလအတိုင်း ပြန်လည်သတ်မှတ်မည်လား?' :
            'Reset all settings to default?';

        if (confirm(confirmMsg)) {
            localStorage.removeItem('app_settings');
            localStorage.removeItem('ai_model');
            localStorage.removeItem('ai_temperature');
            localStorage.removeItem('ai_stream');
            localStorage.removeItem('ai_context');
            localStorage.removeItem('theme');
            localStorage.removeItem('fontSize');

            this.settings = this.loadSettings();
            this.applySettings();

            this.showNotification('Settings reset. Reloading...', 'success');
            setTimeout(() => location.reload(), 1500);
        }
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.style.background = '#0f0f0f';
            this.updateCSSVariables('dark');
        } else if (theme === 'light') {
            document.body.style.background = '#f5f5f5';
            this.updateCSSVariables('light');
        } else {
            // System preference
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.style.background = systemDark ? '#0f0f0f' : '#f5f5f5';
            this.updateCSSVariables(systemDark ? 'dark' : 'light');
        }

        localStorage.setItem('theme', theme);
    }

    updateCSSVariables(mode) {
        if (mode === 'dark') {
            document.documentElement.style.setProperty('--bg-primary', '#0f0f0f');
            document.documentElement.style.setProperty('--bg-secondary', '#1a1a1a');
            document.documentElement.style.setProperty('--text-primary', '#e5e5e5');
        } else {
            document.documentElement.style.setProperty('--bg-primary', '#f5f5f5');
            document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
            document.documentElement.style.setProperty('--text-primary', '#333333');
        }
    }

    applyFontSize(size) {
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        document.body.style.fontSize = sizes[size] || '16px';
        localStorage.setItem('fontSize', size);
    }

    updateSystemInfo() {
        // Browser info
        const browserInfo = document.getElementById('browserInfo');
        if (browserInfo) {
            const ua = navigator.userAgent;
            let browser = 'Unknown';
            if (ua.includes('Chrome')) browser = 'Chrome';
            else if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Safari')) browser = 'Safari';
            else if (ua.includes('Edge')) browser = 'Edge';
            browserInfo.textContent = browser;
        }

        // Storage used
        this.calculateStorageUsed();
    }

    calculateStorageUsed() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // Approximate bytes
            }
        }

        const storageEl = document.getElementById('storageUsed');
        if (storageEl) {
            if (total < 1024) {
                storageEl.textContent = `${total} B`;
            } else if (total < 1024 * 1024) {
                storageEl.textContent = `${(total / 1024).toFixed(2)} KB`;
            } else {
                storageEl.textContent = `${(total / (1024 * 1024)).toFixed(2)} MB`;
            }
        }
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize settings system
document.addEventListener('DOMContentLoaded', () => {
    window.settingsSystem = new SettingsSystem();
});

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);