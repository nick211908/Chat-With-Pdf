// Global state
export let debugMode = false;

export function toggleDebugMode() {
    debugMode = !debugMode;
    const debugPanel = document.getElementById('debug-panel');
    debugPanel.style.display = debugMode ? 'block' : 'none';
    if (debugMode) {
        debugLog('Debug mode enabled');
    }
}

export function debugLog(message, data = null) {
    console.log(`[DEBUG] ${message}`, data);
    if (debugMode) {
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            const time = new Date().toLocaleTimeString();
            debugContent.innerHTML += `<div>[${time}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}</div>`;
            debugContent.scrollTop = debugContent.scrollHeight;
        }
    }
}

export function showStatus(element, message, type = 'info') {
    if (element) {
        element.textContent = message;
        element.className = `status-message ${type}`;
        debugLog(`Status: ${type} - ${message}`);
    }
}

export function showNotification(element, message, type = 'success') {
    if (element) {
        element.textContent = message;
        element.className = message ? `notification ${type}` : 'notification';
        debugLog(`Notification: ${type} - ${message}`);
    }
}