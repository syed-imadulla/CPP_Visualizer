// Initialize CodeMirror
const codeEditor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    theme: 'default',
    lineNumbers: true,
    indentUnit: 4,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    lineWrapping: true,
    lineHeight: 1.6,
    extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Ctrl-S': saveCode,
        'Ctrl-R': runCode,
        'Ctrl-F': formatCode,
        'Ctrl-=': () => {
            fontSize = Math.min(fontSize + 1, 24);
            document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
            codeEditor.refresh();
            logToConsole(`Font size: ${fontSize}px (Ctrl+=)`, 'info');
            return false; // Prevent default
        },
        'Ctrl--': () => {
            fontSize = Math.max(fontSize - 1, 10);
            document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
            codeEditor.refresh();
            logToConsole(`Font size: ${fontSize}px (Ctrl+-)`, 'info');
            return false; // Prevent default
        },
        'Ctrl-0': () => {
            fontSize = 14;
            document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
            codeEditor.refresh();
            logToConsole(`Font size reset to ${fontSize}px (Ctrl+0)`, 'info');
            return false; // Prevent default
        }
    }
});

// DOM Elements
const runBtn = document.getElementById('runBtn');
const visualizeBtn = document.getElementById('visualizeBtn');
const debugBtn = document.getElementById('debugBtn');
const newBtn = document.getElementById('newBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const formatBtn = document.getElementById('formatBtn');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');
const themeBtn = document.getElementById('themeBtn');
const helpBtn = document.getElementById('helpBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const viewTabs = document.querySelectorAll('.view-tab');
const consoleOutput = document.getElementById('consoleOutput');
const lineCount = document.getElementById('lineCount');
const charCount = document.getElementById('charCount');
const objectCount = document.getElementById('objectCount');
const connectionStatus = document.getElementById('connectionStatus');

// Theme Management
function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update CodeMirror theme
    codeEditor.setOption('theme', theme === 'dark' ? 'material-darker' : 'default');

    // Update theme button icon
    const icon = themeBtn.querySelector('i');
    const text = themeBtn.querySelector('span');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark';
    }

    // Update console output
    logToConsole(`Switched to ${theme} theme`, 'info');
}

function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// View Management
let currentView = 'structure';

viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        switchView(view);

        // Update active tab
        viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

function switchView(view) {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(el => {
        el.classList.remove('active');
    });

    // Show selected view
    const viewElement = document.getElementById(`${view}View`);
    if (viewElement) {
        viewElement.classList.add('active');
        currentView = view;
    }
}

// Code Operations
function saveCode() {
    const code = codeEditor.getValue();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code.cpp';
    a.click();
    URL.revokeObjectURL(url);

    logToConsole('Code saved successfully', 'success');
}

function loadCode() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cpp,.h,.txt,.hpp,.cc,.cxx';

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = e => {
            codeEditor.setValue(e.target.result);
            logToConsole(`Loaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'success');
            updateCounters();
        };

        reader.onerror = () => {
            logToConsole('Error loading file', 'error');
        };

        reader.readAsText(file);
    };

    input.click();
}

function formatCode() {
    try {
        let code = codeEditor.getValue();
        
        if (!code.trim()) {
            logToConsole('No code to format', 'info');
            return;
        }

        // Enhanced formatting rules
        code = code
            // Remove multiple empty lines
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Add space after commas
            .replace(/,(\S)/g, ', $1')
            // Format opening braces
            .replace(/\s*{\s*/g, ' {\n')
            // Format closing braces
            .replace(/\s*}\s*/g, '\n}\n')
            // Format semicolons with proper indentation
            .replace(/;\s*/g, ';\n')
            // Add space around operators
            .replace(/([=+\-*/%&|^<>!])(?!=)/g, ' $1 ')
            .replace(/(\S)([=+\-*/%&|^<>!]=)/g, '$1 $2')
            // Fix multiple spaces
            .replace(/\s+/g, ' ')
            // Proper indentation
            .split('\n')
            .map((line, index, arr) => {
                let indent = 0;
                // Count opening braces in previous lines
                for (let i = 0; i < index; i++) {
                    indent += (arr[i].match(/{/g) || []).length;
                    indent -= (arr[i].match(/}/g) || []).length;
                }
                // Remove existing indentation and add proper indentation
                line = line.trim();
                return '    '.repeat(Math.max(0, indent)) + line;
            })
            .join('\n')
            // Clean up extra newlines
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();

        codeEditor.setValue(code);
        logToConsole('Code formatted successfully', 'success');
    } catch (error) {
        logToConsole(`Formatting error: ${error.message}`, 'error');
    }
}

function runCode() {
    const code = codeEditor.getValue();

    if (!code.trim()) {
        logToConsole('Error: No code to execute', 'error');
        return;
    }

    // Switch to console view
    switchView('console');
    viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === 'console');
    });

    logToConsole('Executing code...', 'info');
    
    // Simulate execution with timeout
    setTimeout(() => {
        logToConsole('Execution completed', 'success');
        logToConsole('Note: This is a simulation. Real execution would require a C++ compiler backend.', 'info');
    }, 1000);
}

function logToConsole(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `console-line`;
    line.dataset.type = type;

    // Add timestamp
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Add styling based on type
    if (type === 'error') {
        line.style.color = '#F56565';
        line.style.fontWeight = '600';
    } else if (type === 'success') {
        line.style.color = '#48BB78';
    } else if (type === 'info') {
        line.style.color = '#4299E1';
    } else if (type === 'warning') {
        line.style.color = '#ED8936';
    }

    line.innerHTML = `<span class="console-timestamp">[${timestamp}]</span> > ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Update counters
function updateCounters() {
    const code = codeEditor.getValue();
    const lines = code.split('\n').length;
    const chars = code.length;
    const words = code.split(/\s+/).filter(word => word.length > 0).length;

    lineCount.textContent = `Lines: ${lines}`;
    charCount.textContent = `Chars: ${chars}`;

    // Enhanced object detection
    const classMatches = code.match(/\bclass\s+\w+/g);
    const structMatches = code.match(/\bstruct\s+\w+/g);
    const functionMatches = code.match(/\b(int|void|double|float|char|bool|string)\s+\w+\s*\(/g);
    const objectCountNum = (classMatches ? classMatches.length : 0) + (structMatches ? structMatches.length : 0);
    objectCount.textContent = `Objects: ${objectCountNum}`;
    
    // Update title with file info
    if (lines > 0) {
        document.title = `C++ Visualizer (${lines} lines)`;
    } else {
        document.title = 'C++ Code Visualizer';
    }
}

// Zoom functionality using CSS variables
let fontSize = 14;

function updateZoomIndicator() {
    // You could add a visual indicator if needed
    // For example, update a status element
    const zoomIndicator = document.getElementById('zoomIndicator') || (() => {
        const elem = document.createElement('span');
        elem.id = 'zoomIndicator';
        elem.className = 'status-item';
        elem.style.marginLeft = '10px';
        elem.innerHTML = '<i class="fas fa-search"></i><span>100%</span>';
        document.querySelector('.status-right').appendChild(elem);
        return elem;
    })();
    
    const percentage = Math.round((fontSize / 14) * 100);
    zoomIndicator.querySelector('span').textContent = `${percentage}%`;
}

zoomInBtn.addEventListener('click', () => {
    fontSize = Math.min(fontSize + 1, 24);
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    codeEditor.refresh();
    updateZoomIndicator();
    logToConsole(`Zoom: ${Math.round((fontSize / 14) * 100)}%`, 'info');
});

zoomOutBtn.addEventListener('click', () => {
    fontSize = Math.max(fontSize - 1, 10);
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    codeEditor.refresh();
    updateZoomIndicator();
    logToConsole(`Zoom: ${Math.round((fontSize / 14) * 100)}%`, 'info');
});

// Reset zoom with double-click on zoom buttons
zoomInBtn.addEventListener('dblclick', () => {
    fontSize = 14;
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    codeEditor.refresh();
    updateZoomIndicator();
    logToConsole('Zoom reset to 100%', 'info');
});

zoomOutBtn.addEventListener('dblclick', () => {
    fontSize = 14;
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    codeEditor.refresh();
    updateZoomIndicator();
    logToConsole('Zoom reset to 100%', 'info');
});

// Event Listeners
runBtn.addEventListener('click', runCode);
saveBtn.addEventListener('click', saveCode);
loadBtn.addEventListener('click', loadCode);
formatBtn.addEventListener('click', formatCode);
themeBtn.addEventListener('click', toggleTheme);

helpBtn.addEventListener('click', () => {
    switchView('console');
    viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === 'console');
    });

    consoleOutput.innerHTML = '';
    logToConsole('=== C++ Code Visualizer Help ===', 'info');
    logToConsole('Write C++ code in the editor and click "Run Code"', 'info');
    logToConsole('Use "Visualize" to see class diagrams and memory layout', 'info');
    logToConsole('Use "Debug" to step through code execution', 'info');
    logToConsole('Switch between different views using the tabs above', 'info');
    logToConsole('Save and load your code files using the buttons in the top bar', 'info');
    logToConsole('Format your code for better readability (Ctrl+F)', 'info');
    logToConsole('Zoom in/out: Ctrl+= / Ctrl+- or use the zoom buttons', 'info');
    logToConsole('Reset zoom: Ctrl+0 or double-click zoom buttons', 'info');
    logToConsole('Save: Ctrl+S | Run: Ctrl+R | Format: Ctrl+F', 'info');
});

clearConsoleBtn.addEventListener('click', () => {
    consoleOutput.innerHTML = '';
    logToConsole('Console cleared', 'info');
});

newBtn.addEventListener('click', () => {
    if (codeEditor.getValue().trim() !== '' && !confirm('Create new file? Unsaved changes will be lost.')) {
        return;
    }
    codeEditor.setValue('');
    logToConsole('New file created', 'info');
    updateCounters();
});

visualizeBtn.addEventListener('click', () => {
    const code = codeEditor.getValue();
    if (!code.trim()) {
        logToConsole('Error: No code to visualize', 'error');
        return;
    }

    // Switch to structure view for visualization
    switchView('structure');
    viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === 'structure');
    });

    logToConsole('Generating structure visualization...', 'info');
    logToConsole('Analyzing class hierarchy and relationships...', 'info');
    
    // Simulate visualization generation
    setTimeout(() => {
        logToConsole('Structure visualization ready', 'success');
    }, 800);
});

debugBtn.addEventListener('click', () => {
    const code = codeEditor.getValue();
    if (!code.trim()) {
        logToConsole('Error: No code to debug', 'error');
        return;
    }

    switchView('flow');
    viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === 'flow');
    });

    logToConsole('Debug mode activated', 'info');
    logToConsole('Step through your code execution', 'info');
    logToConsole('Use breakpoints to pause execution at specific lines', 'info');
});

// Initialize
const savedTheme = getCurrentTheme();
setTheme(savedTheme);
updateCounters();
updateZoomIndicator();

// Set initial font size
document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);

// Update counters on editor change
codeEditor.on('change', updateCounters);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Don't trigger if user is typing in the editor
    if (e.target !== document.body && !e.target.classList.contains('CodeMirror')) return;
    
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                saveCode();
                break;
            case 'r':
                e.preventDefault();
                runCode();
                break;
            case 'f':
                e.preventDefault();
                formatCode();
                break;
            case 'n':
                e.preventDefault();
                newBtn.click();
                break;
            case 'o':
                e.preventDefault();
                loadCode();
                break;
            case 'd':
                e.preventDefault();
                debugBtn.click();
                break;
            case 'h':
                e.preventDefault();
                helpBtn.click();
                break;
        }
    }
});

// Simulate connection status
let connectionCounter = 0;
setInterval(() => {
    connectionCounter++;
    if (connectionCounter % 10 === 0) {
        // Simulate occasional disconnection
        connectionStatus.textContent = 'Reconnecting...';
        connectionStatus.style.color = '#ED8936';
        setTimeout(() => {
            connectionStatus.textContent = 'Connected';
            connectionStatus.style.color = '#48BB78';
        }, 1000);
    } else {
        connectionStatus.textContent = 'Connected';
        connectionStatus.style.color = '#48BB78';
    }
}, 1000);

// Auto-save functionality (optional)
let autoSaveTimer;
codeEditor.on('change', () => {
    // Clear existing timer
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    // Set new timer to auto-save after 30 seconds of inactivity
    autoSaveTimer = setTimeout(() => {
        const code = codeEditor.getValue();
        if (code.trim()) {
            localStorage.setItem('autoSaveCode', code);
            logToConsole('Auto-saved to browser storage', 'info');
        }
    }, 30000);
});

// Load auto-saved code on startup
window.addEventListener('load', () => {
    const autoSavedCode = localStorage.getItem('autoSaveCode');
    if (autoSavedCode && autoSavedCode.trim() && confirm('Found auto-saved code. Load it?')) {
        codeEditor.setValue(autoSavedCode);
        logToConsole('Loaded auto-saved code', 'success');
        updateCounters();
    }
    
    // Initial console message
    setTimeout(() => {
        logToConsole('Welcome to C++ Code Visualizer', 'info');
        logToConsole('Start by writing C++ code in the editor', 'info');
        logToConsole('Type "help" or click Help button for assistance', 'info');
    }, 1000);
});

// Console command handling
document.addEventListener('keydown', (e) => {
    // Focus console on Ctrl+`
    if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        switchView('console');
        viewTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === 'console');
        });
    }
});

// Add CSS for console timestamp
const style = document.createElement('style');
style.textContent = `
    .console-timestamp {
        color: var(--text-secondary);
        opacity: 0.7;
        font-size: 0.8em;
        margin-right: 8px;
    }
    
    #zoomIndicator {
        transition: all 0.3s ease;
    }
    
    #zoomIndicator:hover {
        color: var(--primary);
    }
`;
document.head.appendChild(style);