import { initializeUploader } from './uploader.js';
import { postChatMessage, setAuthTokenProvider } from './api.js';

// --- IMPORTANT: REPLACE WITH YOUR SUPABASE CREDENTIALS ---
const SUPABASE_URL = 'https://neuogxpouxhiahdiuovg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ldW9neHBvdXhoaWFoZGl1b3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTAyMDgsImV4cCI6MjA3Mjk4NjIwOH0.ptaLhJyEB63wDd99nHhJM2rK0mhJ2H88AosnyG8tV8I';
// ---------------------------------------------------------

// --- Element Getters ---
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');
const mainSection = document.getElementById('main-section');
const logoutButton = document.getElementById('logout-button');
const userIdentifier = document.getElementById('user-identifier');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatStatus = document.getElementById('chat-status');
const uploaderContainer = document.getElementById('uploader-container');
const chatContainer = document.getElementById('chat-container');


// --- App State ---
let currentDocumentId = null;
let supabaseClient = null;

// --- Main App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Supabase Client (solves the race condition)
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        if (!supabaseClient) throw new Error("Supabase client creation failed.");
    } catch (error) {
        console.error("FATAL: Failed to initialize Supabase client.", error);
        authMessage.textContent = "Error: Could not connect to the authentication service.";
        return;
    }

    // 2. Wire up the API module to get the auth token when needed
    setAuthTokenProvider(async () => {
        const { data } = await supabaseClient.auth.getSession();
        return data.session?.access_token;
    });

    // 3. Initialize UI components
    initializeAuth();
    initializeUploader(onUploadSuccess);
    initializeChat();

    // 4. Set up the auth state listener to manage UI visibility
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateUIForAuthState(session);
    });
});

// --- UI and Event Handlers ---

function initializeAuth() {
    signupForm.addEventListener('submit', handleSignup);
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', () => supabaseClient.auth.signOut());
}

async function handleSignup(e) {
    e.preventDefault();
    const email = signupForm.email.value;
    const password = signupForm.password.value;
    authMessage.textContent = 'Signing up...';
    try {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        authMessage.textContent = 'Signup successful! Please check your email to confirm.';
    } catch (error) {
        authMessage.textContent = `Signup failed: ${error.message}`;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    authMessage.textContent = 'Logging in...';
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Success is handled by the onAuthStateChange listener
    } catch (error) {
        authMessage.textContent = `Login failed: ${error.message}`;
    }
}

function initializeChat() {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = chatInput.value.trim();
        if (!question) return;

        appendMessage('user', question);
        chatInput.value = '';
        chatStatus.textContent = 'Assistant is thinking...';
        chatInput.disabled = true;

        try {
            const response = await postChatMessage(currentDocumentId, question);
            appendMessage('bot', response.answer);
        } catch (error) {
            appendMessage('system', `Error: ${error.message}`);
        } finally {
            chatStatus.textContent = '';
            chatInput.disabled = false;
            chatInput.focus();
        }
    });
}

// --- State Management ---

function updateUIForAuthState(session) {
    if (session) {
        authSection.style.display = 'none';
        mainSection.style.display = 'block';
        userIdentifier.textContent = session.user.email;
        resetChatUI(); // Reset UI for a fresh session
    } else {
        authSection.style.display = 'block';
        mainSection.style.display = 'none';
        userIdentifier.textContent = '';
    }
}

function onUploadSuccess(docId) {
    currentDocumentId = docId;
    uploaderContainer.classList.add('disabled'); // Disable uploader after success
    chatContainer.classList.remove('disabled'); // Enable chat
    chatInput.disabled = false;
    appendMessage('system', `PDF processed successfully. You can now ask questions about the document.`);
    chatInput.focus();
}

function resetChatUI() {
    currentDocumentId = null;
    uploaderContainer.classList.remove('disabled');
    chatContainer.classList.add('disabled');
    chatInput.disabled = true;
    chatWindow.innerHTML = '';
    appendMessage('system', 'Please upload a PDF to begin a new chat session.');
}

function appendMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-wrapper');
    
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message', `${sender}-message`);
    messageBubble.textContent = text;
    
    messageElement.appendChild(messageBubble);
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

