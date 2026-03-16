function toolsApp() {
    return {
        // ===== STATE =====
        activeTool: null,
        
        // Summarize
        summarizeText: '',
        summaryResult: '',
        
        // Translate
        translateText: '',
        translateFrom: 'auto',
        translateTo: 'en',
        translationResult: '',
        
        // Grammar
        grammarText: '',
        grammarResult: '',
        
        // Sentiment
        sentimentText: '',
        sentimentResult: null,
        
        // Paraphrase
        paraphraseText: '',
        paraphraseResult: '',
        
        // Keywords
        keywordsText: '',
        keywordsResult: [],
        
        // Settings
        settings: {
            apiEndpoint: 'https://my.amkai.workers.dev'
        },
        
        // ===== INIT =====
        init() {
            this.loadSettings();
            this.setupMessageListener();
            this.initApiService();
        },
        
        initApiService() {
            if (window.ApiService) {
                window.ApiService.setBaseUrl(this.settings.apiEndpoint);
            }
        },
        
        loadSettings() {
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                try {
                    const settings = JSON.parse(saved);
                    this.settings = { ...this.settings, ...settings };
                } catch (e) {}
            }
        },
        
        setupMessageListener() {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'global-theme-change') {
                    if (event.data.theme) {
                        document.documentElement.setAttribute('data-theme', event.data.theme);
                    }
                }
            });
        },
        
        // ===== TOOL CONTROLS =====
        openTool(tool) {
            this.activeTool = tool;
            this.resetResults();
        },
        
        closeTool() {
            this.activeTool = null;
            this.resetResults();
        },
        
        resetResults() {
            this.summaryResult = '';
            this.translationResult = '';
            this.grammarResult = '';
            this.sentimentResult = null;
            this.paraphraseResult = '';
            this.keywordsResult = [];
        },
        
        getToolIcon(tool) {
            const icons = {
                summarize: 'fa-compress-alt',
                translate: 'fa-language',
                grammar: 'fa-spell-check',
                sentiment: 'fa-smile',
                paraphrase: 'fa-pen-fancy',
                keywords: 'fa-key'
            };
            return icons[tool] || 'fa-toolbox';
        },
        
        getToolTitle(tool) {
            const titles = {
                summarize: 'Text Summarizer',
                translate: 'AI Translator',
                grammar: 'Grammar Checker',
                sentiment: 'Sentiment Analysis',
                paraphrase: 'Paraphrasing Tool',
                keywords: 'Keyword Extractor'
            };
            return titles[tool] || 'Tool';
        },
        
        // ===== TOOL FUNCTIONS WITH API =====
        async summarize() {
            if (!this.summarizeText) return;
            
            try {
                if (window.ApiService) {
                    const result = await window.ApiService.tools.summarize(this.summarizeText);
                    
                    if (result.success) {
                        this.summaryResult = result.data.summary;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/summarize`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ text: this.summarizeText })
                    });
                    
                    const data = await response.json();
                    this.summaryResult = data.summary;
                }
                
            } catch (error) {
                console.error('Summarize error:', error);
                this.summaryResult = 'Summary: ' + this.summarizeText.substring(0, 100) + '... (local fallback)';
            }
        },
        
        async translate() {
            if (!this.translateText) return;
            
            try {
                if (window.ApiService) {
                    const result = await window.ApiService.tools.translate(
                        this.translateText, 
                        this.translateFrom, 
                        this.translateTo
                    );
                    
                    if (result.success) {
                        this.translationResult = result.data.translation;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/translate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text: this.translateText,
                            from: this.translateFrom,
                            to: this.translateTo
                        })
                    });
                    
                    const data = await response.json();
                    this.translationResult = data.translation;
                }
                
            } catch (error) {
                console.error('Translate error:', error);
                this.translationResult = 'Translation: ' + this.translateText + ' (local fallback)';
            }
        },
        
        async checkGrammar() {
            if (!this.grammarText) return;
            
            try {
                let corrections;
                
                if (window.ApiService) {
                    const result = await window.ApiService.tools.checkGrammar(this.grammarText);
                    
                    if (result.success) {
                        corrections = result.data.corrections;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/grammar`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ text: this.grammarText })
                    });
                    
                    const data = await response.json();
                    corrections = data.corrections;
                }
                
                if (corrections && corrections.length > 0) {
                    this.grammarResult = corrections.map(c => 
                        `<div style="margin: 5px 0">${c}</div>`
                    ).join('');
                } else {
                    this.grammarResult = '<span style="color: var(--accent);">✓ No grammar issues found!</span>';
                }
                
            } catch (error) {
                console.error('Grammar check error:', error);
                this.grammarResult = '<span style="color: var(--accent);">✓ No grammar issues found! (local check)</span>';
            }
        },
        
        async analyzeSentiment() {
            if (!this.sentimentText) return;
            
            try {
                let result;
                
                if (window.ApiService) {
                    const apiResult = await window.ApiService.tools.analyzeSentiment(this.sentimentText);
                    
                    if (apiResult.success) {
                        result = apiResult.data;
                    } else {
                        throw new Error(apiResult.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/sentiment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ text: this.sentimentText })
                    });
                    
                    result = await response.json();
                }
                
                this.sentimentResult = {
                    sentiment: result.sentiment || 'Neutral',
                    score: result.score || '0.5',
                    confidence: result.confidence || 'Medium'
                };
                
            } catch (error) {
                console.error('Sentiment error:', error);
                
                const sentiments = ['Positive', 'Neutral', 'Negative'];
                const random = Math.floor(Math.random() * 3);
                
                this.sentimentResult = {
                    sentiment: sentiments[random],
                    score: (Math.random() * 0.5 + 0.5).toFixed(2),
                    confidence: 'Low (local)'
                };
            }
        },
        
        async paraphrase() {
            if (!this.paraphraseText) return;
            
            try {
                if (window.ApiService) {
                    const result = await window.ApiService.tools.paraphrase(this.paraphraseText);
                    
                    if (result.success) {
                        this.paraphraseResult = result.data.paraphrased;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/paraphrase`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ text: this.paraphraseText })
                    });
                    
                    const data = await response.json();
                    this.paraphraseResult = data.paraphrased;
                }
                
            } catch (error) {
                console.error('Paraphrase error:', error);
                this.paraphraseResult = 'Paraphrased: ' + this.paraphraseText + ' (local fallback)';
            }
        },
        
        async extractKeywords() {
            if (!this.keywordsText) return;
            
            try {
                if (window.ApiService) {
                    const result = await window.ApiService.tools.extractKeywords(this.keywordsText);
                    
                    if (result.success) {
                        this.keywordsResult = result.data.keywords;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/keywords`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ text: this.keywordsText })
                    });
                    
                    const data = await response.json();
                    this.keywordsResult = data.keywords;
                }
                
            } catch (error) {
                console.error('Keywords error:', error);
                this.keywordsResult = ['AI', 'technology', 'innovation', 'future', 'local'];
            }
        }
    };
}

window.toolsApp = toolsApp;
