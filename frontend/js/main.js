import { CONFIG } from './config.js';
import { debugLog, toggleDebugMode } from './utils.js';
import { setSupabaseClient, testBackendConnectivity } from './api.js';
import { AuthManager } from './auth.js';
import { UploaderManager } from './uploader.js';
import { ChatManager } from './chat.js';

// Application state
let supabaseClient;
let authManager;
let uploaderManager;
let chatManager;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    debugLog('Initializing application');
    
    try {
        // Test backend connectivity
        const backendReachable = await testBackendConnectivity();
        if (!backendReachable) {
            alert('Warning: Cannot connect to backend server. Please ensure your backend is running on ' + CONFIG.API_BASE_URL);
        }

        // Initialize Supabase
        supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        setSupabaseClient(supabaseClient);
        debugLog('Supabase client initialized');
        
        // Initialize managers
        authManager = new AuthManager(supabaseClient);
        uploaderManager = new UploaderManager();
        chatManager = new ChatManager();

        // Set up cross-manager communication
        authManager.setAuthStateChangeHandler(updateAuthState);
        uploaderManager.setUploadSuccessHandler((docId) => chatManager.onUploadSuccess(docId));

        // Initialize all managers
        authManager.initialize();
        uploaderManager.initialize();
        chatManager.initialize();

        // Setup debug toggle
        const debugToggle = document.getElementById('debug-toggle');
        if (debugToggle) {
            debugToggle.addEventListener('click', toggleDebugMode);
        }

        debugLog('Application initialized successfully');
        
    } catch (error) {
        debugLog('Initialization failed', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h1>Error: Could not initialize application</h1>
                <p>Error: ${error.message}</p>
                <p>Please check the console for more details.</p>
            </div>
        `;
    }
});

function updateAuthState(session) {
    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');
    const userIdentifier = document.getElementById('user-identifier');
    
    debugLog('Auth state changed', { hasSession: !!session });
    
    if (session) {
        authSection.style.display = 'none';
        mainSection.style.display = 'block';
        userIdentifier.textContent = `User: ${session.user.email}`;
    } else {
        authSection.style.display = 'block';
        mainSection.style.display = 'none';
        userIdentifier.textContent = '';
        chatManager.resetChat();
    }
}