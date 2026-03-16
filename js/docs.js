function docsApp() {
    return {
        // ===== STATE =====
        activeSection: 'intro',
        searchQuery: '',
        searchResults: [],
        isSearching: false,
        
        // ===== DOCUMENTATION SECTIONS =====
        sections: [
            { id: 'intro', title: 'Introduction', icon: 'fa-flag', category: 'Getting Started' },
            { id: 'quickstart', title: 'Quick Start', icon: 'fa-rocket', category: 'Getting Started' },
            { id: 'image-gen', title: 'Image Generator', icon: 'fa-palette', category: 'Generator Guide' },
            { id: 'code-gen', title: 'Code Generator', icon: 'fa-code', category: 'Generator Guide' },
            { id: 'text-gen', title: 'Text Generator', icon: 'fa-pen', category: 'Generator Guide' },
            { id: 'summarize', title: 'Summarizer', icon: 'fa-compress', category: 'Tools' },
            { id: 'translate', title: 'Translator', icon: 'fa-language', category: 'Tools' },
            { id: 'grammar', title: 'Grammar Check', icon: 'fa-spell-check', category: 'Tools' },
            { id: 'sentiment', title: 'Sentiment Analysis', icon: 'fa-smile', category: 'Tools' },
            { id: 'paraphrase', title: 'Paraphrasing', icon: 'fa-pen-fancy', category: 'Tools' },
            { id: 'keywords', title: 'Keyword Extractor', icon: 'fa-key', category: 'Tools' },
            { id: 'faq', title: 'FAQ', icon: 'fa-question-circle', category: 'Support' },
            { id: 'api', title: 'API Reference', icon: 'fa-cloud', category: 'Support' }
        ],
        
        // ===== SEARCHABLE CONTENT =====
        content: {
            intro: "Introduction to AmkyawDev AI. AI assistant with chat, image generation, code assistance, and various AI tools.",
            quickstart: "Quick start guide. Login, choose feature, customize settings. Keyboard shortcuts: Ctrl/Cmd+K for search, Ctrl/Cmd+N for new chat.",
            'image-gen': "Image generator guide. Create AI images from text prompts. Styles: photorealistic, digital art, anime. Sizes: 512x512, 1024x1024.",
            'code-gen': "Code generator guide. Write, run, format, explain, debug code. Supports JavaScript, Python, Java, C++, and more.",
            'text-gen': "Text generator guide. Summarize, translate, check grammar, analyze sentiment, paraphrase, extract keywords.",
            summarize: "Text summarizer. Condense long texts into key points. Paste text, choose length, get summary.",
            translate: "AI translator. Translate between English, Burmese, Thai, Chinese, Japanese, Korean.",
            grammar: "Grammar checker. Fix grammar, spelling, punctuation, style issues in your writing.",
            sentiment: "Sentiment analysis. Analyze emotional tone: positive, neutral, negative. Get confidence score.",
            paraphrase: "Paraphrasing tool. Rewrite text while maintaining original meaning. Improve clarity and style.",
            keywords: "Keyword extractor. Extract important keywords and phrases from text. Useful for SEO and analysis.",
            faq: "Frequently asked questions. Free to use? Data storage? Accuracy? Supported languages?",
            api: "API reference. Base URL: https://oh.amkai.workers.dev. Endpoints: /api/chat, /api/generate-image, /api/execute-code, /api/summarize, /api/translate, /api/grammar, /api/sentiment."
        },
        
        // ===== FAQ DATA =====
        faqItems: [
            {
                question: "Is it free?",
                answer: "Yes, all basic features are completely free. Premium plans coming soon.",
                open: false
            },
            {
                question: "Where is my data stored?",
                answer: "All data is stored locally in your browser. We don't collect personal information.",
                open: false
            },
            {
                question: "How accurate is the AI?",
                answer: "Our AI models are state-of-the-art and provide high-quality results, but always verify important information.",
                open: false
            },
            {
                question: "What languages are supported?",
                answer: "English, Burmese, Thai, Chinese, Japanese, Korean, and more coming soon.",
                open: false
            },
            {
                question: "Can I use the API?",
                answer: "Yes, API access is available. Check the API Reference section for documentation.",
                open: false
            }
        ],
        
        // ===== INIT =====
        init() {
            this.loadFromHash();
            this.setupWatchers();
            this.loadSettings();
        },
        
        loadFromHash() {
            const hash = window.location.hash.substring(1);
            if (hash && this.sections.some(s => s.id === hash)) {
                this.activeSection = hash;
            }
        },
        
        setupWatchers() {
            this.$watch('activeSection', (value) => {
                window.location.hash = value;
                this.scrollToTop();
            });
            
            this.$watch('searchQuery', () => {
                this.performSearch();
            });
        },
        
        loadSettings() {
            // Load theme from parent
            const savedTheme = localStorage.getItem('selected_theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
        },
        
        // ===== SEARCH FUNCTIONS =====
        performSearch() {
            if (!this.searchQuery.trim()) {
                this.searchResults = [];
                this.isSearching = false;
                return;
            }
            
            this.isSearching = true;
            const query = this.searchQuery.toLowerCase();
            
            // Search in sections and content
            this.searchResults = this.sections.filter(section => {
                const titleMatch = section.title.toLowerCase().includes(query);
                const contentMatch = this.content[section.id]?.toLowerCase().includes(query);
                const categoryMatch = section.category.toLowerCase().includes(query);
                
                return titleMatch || contentMatch || categoryMatch;
            });
        },
        
        clearSearch() {
            this.searchQuery = '';
            this.searchResults = [];
            this.isSearching = false;
        },
        
        selectSearchResult(sectionId) {
            this.activeSection = sectionId;
            this.clearSearch();
        },
        
        // ===== NAVIGATION =====
        navigateTo(sectionId) {
            this.activeSection = sectionId;
        },
        
        scrollToTop() {
            const content = document.querySelector('.docs-content');
            if (content) {
                content.scrollTop = 0;
            }
        },
        
        // ===== FAQ FUNCTIONS =====
        toggleFaq(index) {
            this.faqItems[index].open = !this.faqItems[index].open;
        },
        
        // ===== UTILITY FUNCTIONS =====
        getSectionIcon(sectionId) {
            const section = this.sections.find(s => s.id === sectionId);
            return section ? section.icon : 'fa-file';
        },
        
        getSectionTitle(sectionId) {
            const section = this.sections.find(s => s.id === sectionId);
            return section ? section.title : 'Documentation';
        },
        
        getCategorySections(category) {
            return this.sections.filter(s => s.category === category);
        },
        
        // ===== CONTENT RENDERING =====
        renderMarkdown(text) {
            if (!text) return '';
            // Simple markdown rendering (can be expanded)
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>');
        },
        
        // ===== KEYBOARD SHORTCUTS =====
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + K to focus search
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.focusSearch();
                }
                
                // Escape to clear search
                if (e.key === 'Escape' && this.searchQuery) {
                    this.clearSearch();
                }
            });
        },
        
        focusSearch() {
            this.$nextTick(() => {
                const searchInput = document.querySelector('.sidebar-search input');
                if (searchInput) {
                    searchInput.focus();
                }
            });
        },
        
        // ===== PRINT FUNCTION =====
        printSection() {
            window.print();
        },
        
        // ===== COPY LINK =====
        copyLink() {
            const url = window.location.href.split('#')[0] + '#' + this.activeSection;
            navigator.clipboard.writeText(url);
            this.showNotification('🔗 Link copied to clipboard');
        },
        
        // ===== NOTIFICATION =====
        showNotification(message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--accent, #19c37d);
                color: white;
                padding: 10px 20px;
                border-radius: 30px;
                font-size: 13px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);
        }
    };
}

// Make app globally available
window.docsApp = docsApp;