function mainApp() {
    return {
        // ===== MENU STATES =====
        leftMenuOpen: false,
        rightAsideOpen: false,
        isMobile: window.innerWidth <= 768,
        
        // ===== PAGE STATES =====
        currentPage: 'chat.html',
        currentPageTitle: 'Chat',
        selectedModel: 'GPT-4',
        selectedTheme: 'chatgpt',
        currentChat: 'default',
        
        // ===== SEARCH STATE =====
        searchQuery: '',
        searchResults: [],
        showSearchResults: false,
        isSearching: false,
        
        // ===== USER DATA =====
        user: {
            name: 'Aung Myo Kyaw',
            email: 'aung@example.com',
            initials: 'AK'
        },
        
        // ===== CHAT HISTORY =====
        chatHistory: [],
        
        // ===== SETTINGS =====
        settings: {
            theme: 'dark',
            accent: 'chatgpt',
            fontSize: 'medium',
            soundEnabled: true,
            volume: 70
        },
        
        // ===== INIT =====
        init() {
            this.loadUser();
            this.loadTheme();
            this.loadChatHistory();
            this.setupEventListeners();
            this.checkScreenSize();
            this.loadSettings();
            this.setupMessageListener();
            
            // Watch for theme changes
            this.$watch('selectedTheme', (value) => {
                localStorage.setItem('selected_theme', value);
                this.applyTheme(value);
                this.broadcastThemeToAllFrames();
            });
            
            // Watch for search query
            this.$watch('searchQuery', (value) => {
                if (value.trim()) {
                    this.performSearch();
                } else {
                    this.clearSearch();
                }
            });
        },
        
        // ===== SEARCH FUNCTIONS =====
        performSearch() {
            if (!this.searchQuery.trim()) {
                this.searchResults = [];
                this.showSearchResults = false;
                this.isSearching = false;
                return;
            }
            
            this.isSearching = true;
            const query = this.searchQuery.toLowerCase();
            
            this.searchResults = this.chatHistory.filter(chat => {
                return chat.title.toLowerCase().includes(query);
            });
            
            this.showSearchResults = this.searchResults.length > 0;
        },
        
        clearSearch() {
            this.searchQuery = '';
            this.searchResults = [];
            this.showSearchResults = false;
            this.isSearching = false;
        },
        
        selectSearchResult(chatId) {
            this.loadChat(chatId);
            this.clearSearch();
        },
        
        focusSearch() {
            const searchInput = document.querySelector('.search-box input');
            if (searchInput) searchInput.focus();
        },
        
        // ===== CHAT HISTORY MANAGEMENT =====
        loadChatHistory() {
            const saved = localStorage.getItem('chat_history');
            if (saved) {
                try {
                    this.chatHistory = JSON.parse(saved);
                    // Ensure default chat exists
                    if (!this.chatHistory.find(c => c.id === 'default')) {
                        this.chatHistory.unshift({ id: 'default', title: 'Welcome chat' });
                    }
                } catch (e) {
                    this.chatHistory = [{ id: 'default', title: 'Welcome chat' }];
                }
            } else {
                this.chatHistory = [{ id: 'default', title: 'Welcome chat' }];
            }
        },
        
        saveChatHistory() {
            localStorage.setItem('chat_history', JSON.stringify(this.chatHistory));
        },
        
        // ===== NEW CHAT =====
        newChat() {
            const newChatId = 'chat_' + Date.now();
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const newChatTitle = `New chat ${timeStr}`;
            
            this.chatHistory.unshift({ 
                id: newChatId, 
                title: newChatTitle 
            });
            
            this.saveChatHistory();
            this.currentChat = newChatId;
            this.currentPage = 'chat.html';
            
            this.sendMessageToChat({
                type: 'new-chat',
                chatId: newChatId,
                title: newChatTitle
            });
            
            if (this.isMobile) {
                this.leftMenuOpen = false;
                this.rightAsideOpen = false;
            }
            
            this.playSoundInIframe('success');
            this.showNotification('✨ New chat created!');
        },
        
        loadChat(chatId) {
            this.currentChat = chatId;
            
            const chat = this.chatHistory.find(c => c.id === chatId);
            const chatTitle = chat ? chat.title : 'Chat';
            
            this.currentPage = 'chat.html';
            
            this.sendMessageToChat({
                type: 'load-chat',
                chatId: chatId,
                title: chatTitle
            });
            
            if (this.isMobile) {
                this.leftMenuOpen = false;
            }
            
            this.clearSearch();
        },
        
        // ===== DELETE CHAT =====
        deleteChat(chatId) {
            if (confirm('Delete this chat?')) {
                this.chatHistory = this.chatHistory.filter(c => c.id !== chatId);
                this.saveChatHistory();
                
                const allChats = JSON.parse(localStorage.getItem('all_chats') || '{}');
                delete allChats[chatId];
                localStorage.setItem('all_chats', JSON.stringify(allChats));
                
                if (this.currentChat === chatId) {
                    this.createDefaultChat();
                }
                
                this.showNotification('🗑️ Chat deleted');
                this.playSoundInIframe('pop');
            }
        },
        
        // ===== FIXED CLEAR ALL CHATS =====
        clearAllChats() {
            if (confirm('⚠️ Delete ALL chats?\n\nThis will permanently remove all your conversations. This action cannot be undone!')) {
                
                // Reset chat history to only default
                this.chatHistory = [{ id: 'default', title: 'Welcome chat' }];
                this.saveChatHistory();
                
                // Clear all chats storage
                localStorage.setItem('all_chats', JSON.stringify({}));
                
                // Set current chat to default
                this.currentChat = 'default';
                
                // Ensure we're on chat page
                if (this.currentPage !== 'chat.html') {
                    this.currentPage = 'chat.html';
                } else {
                    // Force iframe reload
                    const iframe = document.querySelector('.content-frame');
                    if (iframe) {
                        iframe.src = 'chat.html';
                    }
                }
                
                // Send message to create default chat
                setTimeout(() => {
                    this.sendMessageToChat({
                        type: 'new-chat',
                        chatId: 'default',
                        title: 'Welcome chat'
                    });
                }, 200);
                
                // Close aside
                this.rightAsideOpen = false;
                
                // Clear search
                this.clearSearch();
                
                // Show notification
                this.showNotification('🗑️ All chats cleared');
                this.playSoundInIframe('pop');
            }
        },
        
        createDefaultChat() {
            this.currentChat = 'default';
            
            if (!this.chatHistory.find(c => c.id === 'default')) {
                this.chatHistory.unshift({ id: 'default', title: 'Welcome chat' });
                this.saveChatHistory();
            }
            
            this.sendMessageToChat({
                type: 'new-chat',
                chatId: 'default',
                title: 'Welcome chat'
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
                    const settings = JSON.parse(saved);
                    this.settings = { ...this.settings, ...settings };
                    this.selectedTheme = settings.theme || 'chatgpt';
                } catch (e) {}
            }
        },
        
        loadTheme() {
            const saved = localStorage.getItem('selected_theme');
            if (saved) {
                this.selectedTheme = saved;
                this.applyTheme(saved);
            }
        },
        
        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
        },
        
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
        
        // ===== IFRAME COMMUNICATION =====
        sendMessageToChat(data) {
            const iframe = document.querySelector('.content-frame');
            if (iframe && iframe.contentWindow) {
                setTimeout(() => {
                    try {
                        iframe.contentWindow.postMessage(data, '*');
                    } catch (e) {}
                }, 200);
            }
        },
        
        playSoundInIframe(soundType) {
            if (!this.settings.soundEnabled) return;
            
            const iframe = document.querySelector('.content-frame');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'play-sound',
                    sound: soundType
                }, '*');
            }
        },
        
        broadcastThemeToAllFrames() {
            const iframes = document.querySelectorAll('.content-frame');
            iframes.forEach(iframe => {
                if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'global-theme-change',
                        theme: this.selectedTheme,
                        accent: this.settings.accent
                    }, '*');
                }
            });
        },
        
        // ===== MESSAGE LISTENER =====
        setupMessageListener() {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type) {
                    this.handleIframeMessage(event.data);
                }
            });
        },
        
        handleIframeMessage(data) {
            switch(data.type) {
                case 'chat-updated':
                    if (data.chatId && data.title) {
                        const chat = this.chatHistory.find(c => c.id === data.chatId);
                        if (chat) {
                            chat.title = data.title;
                            this.saveChatHistory();
                        } else if (data.chatId !== 'default') {
                            this.chatHistory.unshift({
                                id: data.chatId,
                                title: data.title
                            });
                            this.saveChatHistory();
                        }
                    }
                    break;
                    
                case 'settings-updated':
                    this.loadSettings();
                    this.broadcastThemeToAllFrames();
                    break;
            }
        },
        
        // ===== MENU CONTROLS =====
        toggleLeftMenu() {
            this.leftMenuOpen = !this.leftMenuOpen;
            if (this.leftMenuOpen) this.rightAsideOpen = false;
        },
        
        toggleRightAside() {
            this.rightAsideOpen = !this.rightAsideOpen;
            if (this.rightAsideOpen) this.leftMenuOpen = false;
        },
        
        closeMenusOnClickOutside(e) {
            if (this.isMobile && (this.leftMenuOpen || this.rightAsideOpen)) {
                if (!e.target.closest('.left-menu') && 
                    !e.target.closest('.right-aside') && 
                    !e.target.closest('.hamburger-btn') &&
                    !e.target.closest('.icon-btn')) {
                    this.leftMenuOpen = false;
                    this.rightAsideOpen = false;
                }
            }
        },
        
        // ===== NAVIGATION =====
        navigateTo(page, title) {
            this.currentPage = page;
            this.currentPageTitle = title;
            window.location.hash = page.replace('.html', '');
            
            const iframe = document.querySelector('.content-frame');
            if (iframe) {
                iframe.style.opacity = '0';
                setTimeout(() => {
                    iframe.src = page;
                    setTimeout(() => {
                        iframe.style.opacity = '1';
                        this.broadcastThemeToAllFrames();
                    }, 100);
                }, 150);
            }
            
            this.playSoundInIframe('chime');
            
            if (this.isMobile) {
                this.leftMenuOpen = false;
                this.rightAsideOpen = false;
            }
        },
        
        // ===== EVENT LISTENERS =====
        setupEventListeners() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.leftMenuOpen = false;
                    this.rightAsideOpen = false;
                    this.clearSearch();
                }
                
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.focusSearch();
                }
                
                if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                    e.preventDefault();
                    this.newChat();
                }
            });
        },
        
        checkScreenSize() {
            window.addEventListener('resize', () => {
                this.isMobile = window.innerWidth <= 768;
                if (!this.isMobile) {
                    this.leftMenuOpen = false;
                    this.rightAsideOpen = false;
                }
            });
        },
        
        // ===== NOTIFICATION =====
        showNotification(message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                background: var(--accent, #19c37d);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                opacity: 0;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.transform = 'translateX(-50%) translateY(0)';
                toast.style.opacity = '1';
            }, 10);
            
            setTimeout(() => {
                toast.style.transform = 'translateX(-50%) translateY(-20px)';
                toast.style.opacity = '0';
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);
        }
    };
}

window.mainApp = mainApp;