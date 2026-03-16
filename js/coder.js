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
            autoSave: 'on'
        },
        
        // ===== INIT =====
        init() {
            this.loadSavedCode();
            this.loadSettings();
            this.setupKeyboardShortcuts();
            this.updateCursorPosition();
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
                // Ctrl/Cmd + Enter to run
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.runCode();
                }
                
                // Ctrl/Cmd + S to save
                if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                    e.preventDefault();
                    this.saveFile();
                }
                
                // Ctrl/Cmd + Shift + F to format
                if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
                    e.preventDefault();
                    this.formatCode();
                }
                
                // Esc to close dialogs
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
        
        // ===== CODE ACTIONS =====
        async runCode() {
            this.isWaiting = true;
            this.waitingMessage = 'Running code...';
            this.activeTab = 'output';
            
            try {
                // Simulate code execution
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                if (this.selectedLanguage === 'javascript') {
                    this.output = '<span class="success">✓ Code executed successfully!</span>\n\n> Hello, World!\n> Process finished with exit code 0';
                } else if (this.selectedLanguage === 'python') {
                    this.output = '<span class="success">✓ Code executed successfully!</span>\n\nHello, World!\n\nProcess finished with exit code 0';
                } else if (this.selectedLanguage === 'html') {
                    this.output = '<span class="success">✓ HTML rendered successfully!</span>\n\nPreview available in Preview tab';
                    this.preview = this.generateHtmlPreview();
                } else {
                    this.output = `<span class="success">✓ Code executed successfully!</span>\n\nOutput for ${this.selectedLanguage}:\nHello, World!`;
                }
                
                // Generate preview (markdown)
                this.preview = this.generateMarkdownPreview();
                
            } catch (error) {
                this.output = `<span class="error">✗ Error: ${error.message}</span>`;
            } finally {
                this.isWaiting = false;
            }
        },
        
        formatCode() {
            this.isWaiting = true;
            this.waitingMessage = 'Formatting code...';
            
            setTimeout(() => {
                // Simple formatting
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
        
        explainCode(level) {
            this.closeDialog();
            this.isWaiting = true;
            this.waitingMessage = 'Analyzing code...';
            this.activeTab = 'explanation';
            
            setTimeout(() => {
                if (level === 'simple') {
                    this.explanation = this.getSimpleExplanation();
                } else if (level === 'detailed') {
                    this.explanation = this.getDetailedExplanation();
                } else {
                    this.explanation = this.getTechnicalExplanation();
                }
                
                this.isWaiting = false;
            }, 1200);
        },
        
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

## Optimization Opportunities:
- Could use arrow function
- Could add parameters
- Consider module export
            `;
        },
        
        debugCode() {
            this.closeDialog();
            this.isWaiting = true;
            this.waitingMessage = 'Debugging code...';
            this.activeTab = 'output';
            
            setTimeout(() => {
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
                this.isWaiting = false;
            }, 1500);
        },
        
        getQuickDebug() {
            return `
## Quick Check Results:
- ✅ Syntax: No errors found
- ✅ Variables: All defined
- ⚠️ Best practices: Consider adding comments
- ✅ Function calls: Valid
- ✅ Return values: Properly used
            `;
        },
        
        getThoroughDebug() {
            return `
## Thorough Analysis:
- ✅ No syntax errors
- ✅ No undefined variables
- ✅ Proper function declaration
- ✅ Correct semicolon usage
- ⚠️ Missing error handling
- ℹ️ Consider adding input validation
- ✅ Memory usage: Optimal
- ✅ No memory leaks detected
            `;
        },
        
        getSecurityDebug() {
            return `
## Security Audit:
- ✅ No eval() usage
- ✅ No dangerous functions
- ✅ Safe string operations
- ⚠️ Input not validated (if any)
- ✅ No XSS vulnerabilities
- ✅ No prototype pollution
- ✅ Secure coding practices followed
            `;
        },
        
        getPerformanceDebug() {
            return `
## Performance Check:
- ✅ Efficient function call
- ✅ No memory leaks detected
- ✅ Fast execution (<1ms)
- ℹ️ Could be memoized if called frequently
- ✅ No unnecessary loops
- ✅ Optimal algorithm used
- ✅ Good time complexity
            `;
        },
        
        optimizeCode() {
            this.closeDialog();
            this.isWaiting = true;
            this.waitingMessage = 'Optimizing code...';
            this.activeTab = 'explanation';
            
            setTimeout(() => {
                let optimization = '# Code Optimization Suggestions\n\n';
                
                switch(this.optimizeTarget) {
                    case 'speed':
                        optimization += this.getSpeedOptimization();
                        break;
                    case 'memory':
                        optimization += this.getMemoryOptimization();
                        break;
                    case 'readability':
                        optimization += this.getReadabilityOptimization();
                        break;
                    case 'best-practices':
                        optimization += this.getBestPractices();
                        break;
                }
                
                this.explanation = marked.parse(optimization);
                this.isWaiting = false;
            }, 1500);
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
- ✅ Arrow function is faster in V8 engine
- ✅ Reduced memory overhead
- ✅ Inline execution possible
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
- 📦 20% memory reduction
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
- ✅ Added JSDoc comment
- ✅ Descriptive function name
- ✅ Variable for message
- ✅ Proper spacing and comments
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
- ✅ Strict mode enabled
- ✅ IIFE for scope isolation
- ✅ const for immutable values
- ✅ Error handling added
            `;
        },
        
        convertCode() {
            this.closeDialog();
            this.isWaiting = true;
            this.waitingMessage = `Converting from ${this.convertFrom} to ${this.convertTo}...`;
            this.activeTab = 'preview';
            
            setTimeout(() => {
                let converted = '';
                
                if (this.convertFrom === 'javascript' && this.convertTo === 'python') {
                    converted = `# Converted from JavaScript to Python\n\ndef hello():\n    print("Hello, World!")\n\nhello()`;
                } else if (this.convertFrom === 'python' && this.convertTo === 'javascript') {
                    converted = `// Converted from Python to JavaScript\n\nfunction hello() {\n    console.log("Hello, World!");\n}\n\nhello();`;
                } else if (this.convertFrom === 'javascript' && this.convertTo === 'java') {
                    converted = `// Converted from JavaScript to Java\n\npublic class Main {\n    public static void main(String[] args) {\n        hello();\n    }\n    \n    public static void hello() {\n        System.out.println("Hello, World!");\n    }\n}`;
                } else if (this.convertFrom === 'javascript' && this.convertTo === 'cpp') {
                    converted = `// Converted from JavaScript to C++\n\n#include <iostream>\n\nvoid hello() {\n    std::cout << "Hello, World!" << std::endl;\n}\n\nint main() {\n    hello();\n    return 0;\n}`;
                } else {
                    converted = `// Conversion from ${this.convertFrom} to ${this.convertTo}\n\n// Original code:\n${this.code}\n\n// Converted code would appear here`;
                }
                
                this.preview = '```' + this.convertTo + '\n' + converted + '\n```\n\n### Conversion Notes:\n- ✅ Syntax converted successfully\n- ✅ Logic preserved\n- ℹ️ Review for language-specific optimizations';
                this.isWaiting = false;
            }, 2000);
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
- ✅ Syntax: Valid
- ✅ Runtime: Success
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

// Make app globally available
window.coderApp = coderApp;