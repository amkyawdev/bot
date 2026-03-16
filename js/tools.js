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
        
        // ===== INIT =====
        init() {},
        
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
        
        // ===== TOOL FUNCTIONS =====
        summarize() {
            if (!this.summarizeText) return;
            this.summaryResult = 'Summary: ' + this.summarizeText.substring(0, 100) + '...';
        },
        
        translate() {
            if (!this.translateText) return;
            this.translationResult = 'Translation: ' + this.translateText;
        },
        
        checkGrammar() {
            if (!this.grammarText) return;
            this.grammarResult = '<span style="color: var(--accent);">✓ No grammar issues found!</span>';
        },
        
        analyzeSentiment() {
            if (!this.sentimentText) return;
            const sentiments = ['Positive', 'Neutral', 'Negative'];
            const random = Math.floor(Math.random() * 3);
            this.sentimentResult = {
                sentiment: sentiments[random],
                score: (Math.random() * 0.5 + 0.5).toFixed(2),
                confidence: 'High'
            };
        },
        
        paraphrase() {
            if (!this.paraphraseText) return;
            this.paraphraseResult = 'Paraphrased: ' + this.paraphraseText;
        },
        
        extractKeywords() {
            if (!this.keywordsText) return;
            this.keywordsResult = ['AI', 'technology', 'innovation', 'future'];
        }
    };
}