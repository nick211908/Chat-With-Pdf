import { initializeUploader } from './uploader.js';
import { postChatMessage } from './api.js';

// --- IMPORTANT: REPLACE WITH YOUR SUPABASE CREDENTIALS ---
const SUPABASE_URL = 'https://neuogxpouxhiahdiuovg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ldW9neHBvdXhoaWFoZGl1b3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTAyMDgsImV4cCI6MjA3Mjk4NjIwOH0.ptaLhJyEB63wDd99nHhJM2rK0mhJ2H88AosnyG8tV8I';
// ---------------------------------------------------------

// Auth elements
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');

// Main app elements
const mainSection = document.getElementById('main-section');
const logoutButton = document.getElementById('logout-button');
const userIdentifier = document.getElementById('user-identifier');

// Chat elements
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatStatus = document.getElementById('chat-status');

let currentDocumentId = null;

// Initialize Supabase client.
// The global `supabase` object is provided by the script tag in index.html.
// We create our own client instance from it.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeUploader(onUploadSuccess);
    initializeChat();
    checkUserSession();
});

function initializeAuth() {
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSignup();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
        });
    }
}

async function handleSignup() {
    const email = signupForm.email.value;
    const password = signupForm.password.value;
    authMessage.textContent = '';
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        authMessage.textContent = 'Signup successful! Please check your email to confirm your account.';
    } catch (error) {
        authMessage.textContent = `Signup failed: ${error.message}`;
    }
}

async function handleLogin() {
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    authMessage.textContent = '';

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Successful login is handled by the onAuthStateChange listener
    } catch (error) {
        authMessage.textContent = `Login failed: ${error.message}`;
    }
}

function checkUserSession() {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session) {
            authSection.style.display = 'none';
            mainSection.style.display = 'block';
            userIdentifier.textContent = `Logged in as: ${session.user.email}`;
        } else {
            authSection.style.display = 'block';
            mainSection.style.display = 'none';
            currentDocumentId = null;
            chatWindow.innerHTML = '';
        }
    });
}

function initializeChat() {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = chatInput.value.trim();
        if (!question || !currentDocumentId) return;

        appendMessage('You', question);
        chatInput.value = '';
        chatStatus.textContent = 'Thinking...';

        try {
            const response = await postChatMessage(currentDocumentId, question);
            appendMessage('Assistant', response.answer);
        } catch (error) {
            appendMessage('Error', error.message);
        } finally {
            chatStatus.textContent = '';
        }
    });
}

function onUploadSuccess(docId) {
    currentDocumentId = docId;
    chatWindow.innerHTML = `<div class="message system">PDF processed. Document ID: ${docId}. You can now ask questions.</div>`;
}

function appendMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender.toLowerCase());
    messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

