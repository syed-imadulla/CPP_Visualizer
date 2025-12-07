// Initialize CodeMirror
const codeEditor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    theme: 'default',
    lineNumbers: true,
    indentUnit: 4,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    lineWrapping: true,
    extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Ctrl-S': saveCode,
        'Ctrl-R': runCode,
        'Ctrl-F': formatCode
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
    document.getElementById(`${view}View`).classList.add('active');
    currentView = view;
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
    input.accept = '.cpp,.h,.txt';

    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = e => {
            codeEditor.setValue(e.target.result);
            logToConsole(`Loaded: ${file.name}`, 'info');
            updateCounters();
        };

        reader.readAsText(file);
    };

    input.click();
}

function formatCode() {
    // Simple formatting
    let code = codeEditor.getValue();

    // Basic formatting rules
    code = code
        .replace(/\s*{\s*/g, ' {\n    ')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/;\s*/g, ';\n    ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

    codeEditor.setValue(code);
    logToConsole('Code formatted', 'info');
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
}

function logToConsole(message, type = 'info') {
    const line = document.createElement('div');
    line.className = `console-line`;

    // Add styling based on type
    if (type === 'error') line.style.color = '#F56565';
    if (type === 'success') line.style.color = '#48BB78';
    if (type === 'info') line.style.color = '#4299E1';

    line.textContent = `> ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Update counters
function updateCounters() {
    const code = codeEditor.getValue();
    const lines = code.split('\n').length;
    const chars = code.length;

    lineCount.textContent = `Lines: ${lines}`;
    charCount.textContent = `Chars: ${chars}`;

    // Simple object detection
    const classMatches = code.match(/\bclass\s+\w+/g);
    const structMatches = code.match(/\bstruct\s+\w+/g);
    const objectCountNum = (classMatches ? classMatches.length : 0) + (structMatches ? structMatches.length : 0);
    objectCount.textContent = `Objects: ${objectCountNum}`;
}

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
    logToConsole('Switch between different views using the tabs above', 'info');
    logToConsole('Save and load your code files using the buttons in the top bar', 'info');
    logToConsole('Format your code for better readability', 'info');
});

clearConsoleBtn.addEventListener('click', () => {
    consoleOutput.innerHTML = '';
    logToConsole('Console cleared', 'info');
});

newBtn.addEventListener('click', () => {
    if (confirm('Create new file? Unsaved changes will be lost.')) {
        codeEditor.setValue('');
        logToConsole('New file created', 'info');
        updateCounters();
    }
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

    logToConsole('Generating visualizations...', 'info');
});

debugBtn.addEventListener('click', () => {
    switchView('flow');
    viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === 'flow');
    });

    logToConsole('Debug mode activated', 'info');
    logToConsole('Step through your code execution', 'info');
});

// Zoom functionality
let fontSize = 14;
zoomInBtn.addEventListener('click', () => {
    fontSize = Math.min(fontSize + 1, 20);
    codeEditor.getWrapperElement().style.fontSize = `${fontSize}px`;
    logToConsole(`Font size: ${fontSize}px`, 'info');
});

zoomOutBtn.addEventListener('click', () => {
    fontSize = Math.max(fontSize - 1, 10);
    codeEditor.getWrapperElement().style.fontSize = `${fontSize}px`;
    logToConsole(`Font size: ${fontSize}px`, 'info');
});

// Initialize
const savedTheme = getCurrentTheme();
setTheme(savedTheme);
updateCounters();
codeEditor.on('change', updateCounters);

// Simulate connection status
setInterval(() => {
    connectionStatus.textContent = 'Connected';
    connectionStatus.style.color = '#48BB78';
}, 5000);

// Initial console message
setTimeout(() => {
    logToConsole('Welcome to C++ Code Visualizer', 'info');
    logToConsole('Start by writing C++ code in the editor', 'info');
}, 500);