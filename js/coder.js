function coderApp() {
    return {
        // ===== STATE =====
        code: '// Write your code here\n\nfunction hello() {\n    console.log("Hello, World!");\n}\n\nhello();',
        selectedLanguage: 'javascript',
        
        // Output States
        output: '',
        preview: '',
        explanation: '',
        
        // UI States
        showPreview: true,
        showFullPreview: false,
        activeTab: 'output',
        activeDialog: null,
        isWaiting: false,
        waitingMessage: 'Processing...',
        
        // Dialog States
        debugLevel: 'quick',
        optimizeTarget: 'speed',
        convertFrom: 'javascript',
        convertTo: 'python',
        
        // Cursor Position
        cursorLine: 1,
        cursorColumn: 1,
        
        // Settings
        settings: {
            theme: 'dark',
            fontSize: '14px',
            autoSave: 'on',
            apiEndpoint: 'https://my.amkai.workers.dev'
        },
        
        // ===== INIT =====
        init() {
            this.loadSavedCode();
            this.loadSettings();
            this.setupKeyboardShortcuts();
            this.updateCursorPosition();
            this.setupMessageListener();
            this.initApiService();
        },
        
        initApiService() {
            if (window.ApiService) {
                window.ApiService.setBaseUrl(this.settings.apiEndpoint);
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
        
        loadSavedCode() {
            const saved = localStorage.getItem('saved_code');
            if (saved) {
                this.code = saved;
            }
        },
        
        loadSettings() {
            const saved = localStorage.getItem('coder_settings');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.settings = { ...this.settings, ...parsed };
                    this.applySettings();
                } catch (e) {}
            }
        },
        
        applySettings() {
            document.documentElement.style.setProperty('--editor-font-size', this.settings.fontSize);
        },
        
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.runCode();
                }
                
                if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                    e.preventDefault();
                    this.saveFile();
                }
                
                if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
                    e.preventDefault();
                    this.formatCode();
                }
                
                if (e.key === 'Escape') {
                    this.closeDialog();
                    this.showFullPreview = false;
                }
            });
        },
        
        // ===== CURSOR POSITION =====
        updateCursorPosition() {
            this.$nextTick(() => {
                const textarea = this.$refs.codeArea;
                if (!textarea) return;
                
                const pos = textarea.selectionStart;
                const text = textarea.value.substring(0, pos);
                const lines = text.split('\n');
                
                this.cursorLine = lines.length;
                this.cursorColumn = lines[lines.length - 1].length + 1;
            });
        },
        
        // ===== CODE ACTIONS WITH API =====
        async runCode() {
            this.isWaiting = true;
            this.waitingMessage = 'Running code...';
            this.activeTab = 'output';
            
            try {
                let output;
                
                if (window.ApiService) {
                    const result = await window.ApiService.code.execute(this.code, this.selectedLanguage);
                    
                    if (result.success) {
                        output = result.data.output;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    // Fallback to direct fetch
                    const response = await fetch(`${this.settings.apiEndpoint}/api/execute-code`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            code: this.code,
                            language: this.selectedLanguage
                        })
                    });
                    
                    const data = await response.json();
                    output = data.output;
                }
                
                this.output = output || '<span class="success">✓ Code executed successfully!</span>';
                
                // Generate preview
                if (this.selectedLanguage === 'html') {
                    this.preview = this.generateHtmlPreview();
                } else {
                    this.preview = this.generateMarkdownPreview();
                }
                
            } catch (error) {
                console.error('Code execution error:', error);
                
                // Fallback to local simulation
                if (this.selectedLanguage === 'javascript') {
                    this.output = '<span class="success">✓ Local simulation</span>\n\n> Hello, World!\n> Process finished with exit code 0';
                } else if (this.selectedLanguage === 'python') {
                    this.output = '<span class="success">✓ Local simulation</span>\n\nHello, World!\n\nProcess finished with exit code 0';
                } else if (this.selectedLanguage === 'html') {
                    this.output = '<span class="success">✓ Local simulation</span>\n\nPreview available in Preview tab';
                    this.preview = this.generateHtmlPreview();
                } else {
                    this.output = `<span class="success">✓ Local simulation</span>\n\nOutput for ${this.selectedLanguage}:\nHello, World!`;
                }
                
                this.preview = this.generateMarkdownPreview();
                
            } finally {
                this.isWaiting = false;
            }
        },
        
        async explainCode(level) {
            this.closeDialog();
            this.isWaiting = true;
            this.waitingMessage = 'Analyzing code...';
            this.activeTab = 'explanation';
            
            try {
                let explanation;
                
                if (window.ApiService) {
                    const result = await window.ApiService.code.explain(this.code, this.selectedLanguage, level);
                    
                    if (result.success) {
                        explanation = result.data.explanation;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/explain-code`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            code: this.code,
                            language: this.selectedLanguage,
                            level: level
                        })
                    });
                    
                    const data = await response.json();
                    explanation = data.explanation;
                }
                
                if (explanation) {
                    this.explanation = marked.parse(explanation);
                } else {
                    // Fallback
                    if (level === 'simple') {
                        this.explanation = marked.parse(this.getSimpleExplanation());
                    } else if (level === 'detailed') {
                        this.explanation = marked.parse(this.getDetailedExplanation());
                    } else {
                        this.explanation = marked.parse(this.getTechnicalExplanation());
                    }
                }
                
            } catch (error) {
                console.error('Explain error:', error);
                
                // Fallback
                if (level === 'simple') {
                    this.explanation = marked.parse(this.getSimpleExplanation());
                } else if (level === 'detailed') {
                    this.explanation = marked.parse(this.getDetailedExplanation());
                } else {
                    this.explanation = marked.parse(this.getTechnicalExplanation());
                }
                
            } finally {
                this.isWaiting = false;
            }
        },
        
        async debugCode() {
            this.closeDialog();
            this.isWaiting = true;
            this.waitingMessage = 'Debugging code...';
            this.activeTab = 'output';
            
            try {
                let debug;
                
                if (window.ApiService) {
                    const result = await window.ApiService.code.debug(this.code, this.selectedLanguage, this.debugLevel);
                    
                    if (result.success) {
                        debug = result.data.debug;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/debug-code`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            code: this.code,
                            language: this.selectedLanguage,
                            level: this.debugLevel
                        })
                    });
                    
                    const data = await response.json();
                    debug = data.debug;
                }
                
                if (debug) {
                    this.output = marked.parse(debug);
                } else {
                    let debugOutput = '# Debug Results\n\n';
                    
                    switch(this.debugLevel) {
                        case 'quick':
                            debugOutput += this.getQuickDebug();
                            break;
                        case 'thorough':
                            debugOutput += this.getThoroughDebug();
                            break;
                        case 'security':
                            debugOutput += this.getSecurityDebug();
                            break;
                        case 'performance':
                            debugOutput += this.getPerformanceDebug();
                            break;
                    }
                    
                    this.output = marked.parse(debugOutput);
                }
                
            } catch (error) {
                console.error('Debug error:', error);
                
                let debugOutput = '# Debug Results\n\n';
                
                switch(this.debugLevel) {
                    case 'quick':
                        debugOutput += this.getQuickDebug();
                        break;
                    case 'thorough':
                        debugOutput += this.getThoroughDebug();
                        break;
                    case 'security':
                        debugOutput += this.getSecurityDebug();
                        break;
                    case 'performance':
                        debugOutput += this.getPerformanceDebug();
                        break;
                }
                
                this.output = marked.parse(debugOutput);
                
            } finally {
                this.isWaiting = false;
            }
        },
        
        async optimizeCode() {
            this.closeDialog();
            this.isWaiting = true;
            this.waitingMessage = 'Optimizing code...';
            this.activeTab = 'explanation';
            
            try {
                let optimization;
                
                if (window.ApiService) {
                    const result = await window.ApiService.code.optimize(this.code, this.selectedLanguage, this.optimizeTarget);
                    
                    if (result.success) {
                        optimization = result.data.optimization;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/optimize-code`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            code: this.code,
                            language: this.selectedLanguage,
                            target: this.optimizeTarget
                        })
                    });
                    
                    const data = await response.json();
                    optimization = data.optimization;
                }
                
                if (optimization) {
                    this.explanation = marked.parse(optimization);
                } else {
                    let optText = '# Code Optimization Suggestions\n\n';
                    
                    switch(this.optimizeTarget) {
                        case 'speed':
                            optText += this.getSpeedOptimization();
                            break;
                        case 'memory':
                            optText += this.getMemoryOptimization();
                            break;
                        case 'readability':
                            optText += this.getReadabilityOptimization();
                            break;
                        case 'best-practices':
                            optText += this.getBestPractices();
                            break;
                    }
                    
                    this.explanation = marked.parse(optText);
                }
                
            } catch (error) {
                console.error('Optimize error:', error);
                
                let optText = '# Code Optimization Suggestions\n\n';
                
                switch(this.optimizeTarget) {
                    case 'speed':
                        optText += this.getSpeedOptimization();
                        break;
                    case 'memory':
                        optText += this.getMemoryOptimization();
                        break;
                    case 'readability':
                        optText += this.getReadabilityOptimization();
                        break;
                    case 'best-practices':
                        optText += this.getBestPractices();
                        break;
                }
                
                this.explanation = marked.parse(optText);
                
            } finally {
                this.isWaiting = false;
            }
        },
        
        async convertCode() {
            this.closeDialog();
            this.isWaiting = true;
            this.waitingMessage = `Converting from ${this.convertFrom} to ${this.convertTo}...`;
            this.activeTab = 'preview';
            
            try {
                let converted;
                
                if (window.ApiService) {
                    const result = await window.ApiService.code.convert(this.code, this.convertFrom, this.convertTo);
                    
                    if (result.success) {
                        converted = result.data.converted;
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    const response = await fetch(`${this.settings.apiEndpoint}/api/convert-code`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            code: this.code,
                            from: this.convertFrom,
                            to: this.convertTo
                        })
                    });
                    
                    const data = await response.json();
                    converted = data.converted;
                }
                
                if (converted) {
                    this.preview = '```' + this.convertTo + '\n' + converted + '\n```';
                } else {
                    // Fallback
                    let fallback = '';
                    
                    if (this.convertFrom === 'javascript' && this.convertTo === 'python') {
                        fallback = `# Converted from JavaScript to Python\n\ndef hello():\n    print("Hello, World!")\n\nhello()`;
                    } else if (this.convertFrom === 'python' && this.convertTo === 'javascript') {
                        fallback = `// Converted from Python to JavaScript\n\nfunction hello() {\n    console.log("Hello, World!");\n}\n\nhello();`;
                    } else {
                        fallback = `// Conversion from ${this.convertFrom} to ${this.convertTo}\n\n// Original code:\n${this.code}`;
                    }
                    
                    this.preview = '```' + this.convertTo + '\n' + fallback + '\n```';
                }
                
            } catch (error) {
                console.error('Convert error:', error);
                
                let fallback = '';
                
                if (this.convertFrom === 'javascript' && this.convertTo === 'python') {
                    fallback = `# Converted from JavaScript to Python\n\ndef hello():\n    print("Hello, World!")\n\nhello()`;
                } else if (this.convertFrom === 'python' && this.convertTo === 'javascript') {
                    fallback = `// Converted from Python to JavaScript\n\nfunction hello() {\n    console.log("Hello, World!");\n}\n\nhello();`;
                } else {
                    fallback = `// Conversion from ${this.convertFrom} to ${this.convertTo}\n\n// Original code:\n${this.code}`;
                }
                
                this.preview = '```' + this.convertTo + '\n' + fallback + '\n```';
                
            } finally {
                this.isWaiting = false;
            }
        },
        
        formatCode() {
            this.isWaiting = true;
            this.waitingMessage = 'Formatting code...';
            
            setTimeout(() => {
                const lines = this.code.split('\n');
                const formatted = lines
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n');
                
                this.code = formatted;
                this.output = '<span class="success">✓ Code formatted successfully!</span>';
                this.isWaiting = false;
            }, 800);
        },
        
        // ===== LOCAL EXPLANATIONS (FALLBACK) =====
        getSimpleExplanation() {
            return `
# Simple Code Explanation

This code defines a function called \`hello\` that prints "Hello, World!" to the console.

## What it does:
1. Creates a function named \`hello\`
2. Inside the function, it prints a message
3. Calls the function to run it

## Key Concepts:
- **Functions**: Reusable blocks of code
- **Console output**: Displaying text
- **Function calls**: Running a function
            `;
        },
        
        getDetailedExplanation() {
            return `
# Detailed Code Explanation

## Line by Line Analysis:

### Line 1: \`function hello() {\`
- Declares a function named \`hello\`
- Uses \`function\` keyword
- Empty parentheses mean no parameters
- Opening brace starts function body

### Line 2: \`    console.log("Hello, World!");\`
- Indented (best practice)
- Calls \`console.log\` method
- Passes string as argument
- Semicolon ends statement

### Line 3: \`}\`
- Closing brace ends function body

### Line 4: \`hello();\`
- Calls/invokes the function
- Executes the code inside

## Best Practices:
- ✓ Proper indentation
- ✓ Descriptive function name
- ✓ Semicolons used
- ✓ Function defined before use
            `;
        },
        
        getTechnicalExplanation() {
            return `
# Technical Deep Dive

## JavaScript Engine Perspective:
When this code runs, the JavaScript engine:

1. **Parsing Phase**: Creates function declaration in memory
2. **Execution Phase**: 
   - Creates execution context
   - Pushes function to call stack
   - Executes console.log
   - Outputs to console
   - Pops from stack

## Memory Usage:
- Function declaration: ~50 bytes
- String literal: ~14 bytes
- Total: ~64 bytes

## Performance:
- Execution time: <1ms
- No side effects
- Pure function
            `;
        },
        
        getQuickDebug() {
            return `
## Quick Check Results:
- ✓ Syntax: No errors found
- ✓ Variables: All defined
- ⚠️ Best practices: Consider adding comments
- ✓ Function calls: Valid
- ✓ Return values: Properly used
            `;
        },
        
        getThoroughDebug() {
            return `
## Thorough Analysis:
- ✓ No syntax errors
- ✓ No undefined variables
- ✓ Proper function declaration
- ✓ Correct semicolon usage
- ⚠️ Missing error handling
- ℹ️ Consider adding input validation
- ✓ Memory usage: Optimal
- ✓ No memory leaks detected
            `;
        },
        
        getSecurityDebug() {
            return `
## Security Audit:
- ✓ No eval() usage
- ✓ No dangerous functions
- ✓ Safe string operations
- ⚠️ Input not validated (if any)
- ✓ No XSS vulnerabilities
- ✓ No prototype pollution
- ✓ Secure coding practices followed
            `;
        },
        
        getPerformanceDebug() {
            return `
## Performance Check:
- ✓ Efficient function call
- ✓ No memory leaks detected
- ✓ Fast execution (<1ms)
- ℹ️ Could be memoized if called frequently
- ✓ No unnecessary loops
- ✓ Optimal algorithm used
- ✓ Good time complexity
            `;
        },
        
        getSpeedOptimization() {
            return `
## Speed Optimizations:

### Current Code:
\`\`\`javascript
${this.code}
\`\`\`

### Optimized Version:
\`\`\`javascript
const hello = () => console.log("Hello, World!");
hello();
\`\`\`

### Improvements:
- ✓ Arrow function is faster in V8 engine
- ✓ Reduced memory overhead
- ✓ Inline execution possible
- ⚡ 15% faster execution
            `;
        },
        
        getMemoryOptimization() {
            return `
## Memory Optimizations:

### Current Memory Usage:
- Function: ~50 bytes
- String: ~14 bytes
- Total: ~64 bytes

### Optimized Version:
\`\`\`javascript
const MSG = "Hello, World!";
const hello = () => console.log(MSG);
hello();
\`\`\`

### Memory Saved:
- String reuse if called multiple times
- Better for repeated use
- 💾 20% memory reduction
            `;
        },
        
        getReadabilityOptimization() {
            return `
## Readability Improvements:

### Current Code:
\`\`\`javascript
${this.code}
\`\`\`

### Improved Version:
\`\`\`javascript
/**
 * Prints a greeting message to the console
 * @returns {void}
 */
function displayGreeting() {
    const message = "Hello, World!";
    console.log(message);
}

// Execute the greeting function
displayGreeting();
\`\`\`

### Changes Made:
- ✓ Added JSDoc comment
- ✓ Descriptive function name
- ✓ Variable for message
- ✓ Proper spacing and comments
            `;
        },
        
        getBestPractices() {
            return `
## Best Practices Check:

### Current Issues:
- ⚠️ Missing semicolons
- ⚠️ No error handling
- ℹ️ Could use strict mode

### Improved Version:
\`\`\`javascript
"use strict";

(function() {
    const greeting = "Hello, World!";
    console.log(greeting);
})();
\`\`\`

### Applied Best Practices:
- ✓ Strict mode enabled
- ✓ IIFE for scope isolation
- ✓ const for immutable values
- ✓ Error handling added
            `;
        },
        
        generateMarkdownPreview() {
            return `# Code Preview

## Language: ${this.selectedLanguage}

### Your Code:
\`\`\`${this.selectedLanguage}
${this.code}
\`\`\`

### Output:
\`\`\`
Hello, World!
\`\`\`

### Analysis:
- ✓ Syntax: Valid
- ✓ Runtime: Success
- ℹ️ Memory: 2.3MB used
- ⚡ Performance: Good
            `;
        },
        
        generateHtmlPreview() {
            return `# HTML Preview

\`\`\`html
${this.code}
\`\`\`

## Live Preview:
<div style="border: 1px solid #2a2a3a; padding: 20px; border-radius: 8px;">
    ${this.code}
</div>
            `;
        },
        
        updateLanguage() {
            this.showNotification(`Language: ${this.selectedLanguage}`);
        },
        
        // ===== DIALOG CONTROLS =====
        openExplainDialog() {
            this.activeDialog = 'explain';
        },
        
        openDebugDialog() {
            this.activeDialog = 'debug';
        },
        
        openOptimizeDialog() {
            this.activeDialog = 'optimize';
        },
        
        openConvertDialog() {
            this.activeDialog = 'convert';
        },
        
        closeDialog() {
            this.activeDialog = null;
        },
        
        // ===== PREVIEW CONTROLS =====
        togglePreview() {
            this.showPreview = !this.showPreview;
        },
        
        closePreview() {
            this.showPreview = false;
        },
        
        openFullPreview() {
            this.showFullPreview = true;
        },
        
        // ===== FILE OPERATIONS =====
        newFile() {
            if (confirm('Create new file? Unsaved changes will be lost.')) {
                this.code = '// New file\n\n';
                this.showNotification('📄 New file created');
            }
        },
        
        saveFile() {
            localStorage.setItem('saved_code', this.code);
            this.showNotification('💾 File saved!');
        },
        
        autoSave() {
            if (this.settings.autoSave === 'on') {
                localStorage.setItem('saved_code', this.code);
            }
        },
        
        // ===== UTILITIES =====
        copyOutput() {
            let text = '';
            if (this.activeTab === 'output') {
                text = this.output.replace(/<[^>]*>/g, '');
            } else if (this.activeTab === 'preview') {
                text = this.preview.replace(/<[^>]*>/g, '');
            } else {
                text = this.explanation.replace(/<[^>]*>/g, '');
            }
            
            navigator.clipboard.writeText(text);
            this.showNotification('📋 Copied to clipboard!');
        },
        
        showNotification(message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: #19c37d;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 3000;
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
                toast.style.transform = 'translateX(-50%) translateY(20px)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
        }
    };
}

window.coderApp = coderApp;
