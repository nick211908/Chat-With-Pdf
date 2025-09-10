import { initializeUploader } from './uploader.js';
import { initializeApi } from './api.js';

// --- IMPORTANT: REPLACE WITH YOUR SUPABASE CREDENTIALS ---
const SUPABASE_URL = 'https://neuogxpouxhiahdiuovg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ldW9neHBvdXhoaWFoZGl1b3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTAyMDgsImV4cCI6MjA3Mjk4NjIwOH0.ptaLhJyEB63wDd99nHhJM2rK0mhJ2H88AosnyG8tV8I';
// ---------------------------------------------------------

// --- State and DOM Elements ---
let supabaseClient;
let currentDocumentId = null;

// This is the main entry point for the entire frontend application.
document.addEventListener('DOMContentLoaded', () => {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error("Supabase initialization failed:", error);
        document.body.innerHTML = "<h1>Error: Could not connect to authentication service.</h1>";
        return;
    }

    const elements = {
        authSection: document.getElementById('auth-section'),
        loginForm: document.getElementById('login-form'),
        signupForm: document.getElementById('signup-form'),
        authMessage: document.getElementById('auth-message'),
        mainSection: document.getElementById('main-section'),
        logoutButton: document.getElementById('logout-button'),
        userIdentifier: document.getElementById('user-identifier'),
        chatWindow: document.getElementById('chat-window'),
        chatMessages: document.getElementById('chat-messages'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        chatSendButton: document.querySelector('#chat-form button'),
        uploadForm: document.getElementById('upload-form'),
        pdfFileInput: document.getElementById('pdf-file-input'),
        uploadStatus: document.getElementById('upload-status'),
        uploadButton: document.querySelector('#upload-form button')
    };

    const api = initializeApi(() => supabaseClient.auth.getSession());
    initializeUploader(elements, api, (docId) => onUploadSuccess(elements, docId));
    initializeAuth(elements, supabaseClient);
    initializeChat(elements, api);
});


function initializeAuth(elements, supabaseClient) {
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateAuthState(elements, session);
    });

    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = elements.loginForm.email.value;
        const password = elements.loginForm.password.value;
        setAuthMessage(elements.authMessage, '');

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (error) {
            setAuthMessage(elements.authMessage, `Login failed: ${error.message}`, 'error');
        }
    });
    
    elements.signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = prompt("Please enter your email to sign up:");
        if (!email) return;
        
        const password = prompt("Please enter a password (min. 6 characters):");
        if (!password) return;

        setAuthMessage(elements.authMessage, '');

        try {
            const { error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            setAuthMessage(elements.authMessage, 'Signup successful! Please check your email for a confirmation link.', 'success');
        } catch (error) {
            setAuthMessage(elements.authMessage, `Signup failed: ${error.message}`, 'error');
        }
    });

    elements.logoutButton.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
    });
}

function updateAuthState(elements, session) {
    if (session) {
        elements.authSection.style.display = 'none';
        elements.mainSection.style.display = 'block';
        elements.userIdentifier.textContent = `User: ${session.user.email}`;
    } else {
        elements.authSection.style.display = 'block';
        elements.mainSection.style.display = 'none';
        elements.userIdentifier.textContent = '';
        resetChat(elements);
    }
}

function initializeChat(elements, api) {
    elements.chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = elements.chatInput.value.trim();
        if (!question || !currentDocumentId) {
            // Provide feedback if user tries to chat without a doc
            if (!currentDocumentId) {
                appendMessage(elements, 'bot', 'Error: Please upload and process a document before asking questions.');
            }
            return;
        }

        appendMessage(elements, 'user', question);
        elements.chatInput.value = '';
        
        const thinkingMessage = appendMessage(elements, 'bot', 'Thinking...');
        thinkingMessage.classList.add('thinking-message');

        try {
            const response = await api.postChatMessage(currentDocumentId, question);
            thinkingMessage.querySelector('p').textContent = response.answer;
            thinkingMessage.classList.remove('thinking-message');
        } catch (error) {
            // --- THE FIX: Display error.message instead of the whole object ---
            thinkingMessage.querySelector('p').textContent = `Error: ${error.message}`;
            thinkingMessage.classList.add('error-message');
        }
    });
}

function onUploadSuccess(elements, docId) {
    currentDocumentId = docId;
    elements.chatInput.disabled = false;
    elements.chatSendButton.disabled = false;
    elements.chatMessages.innerHTML = '';
    appendMessage(elements, 'bot', `PDF processed successfully. You can now ask questions about your document.`);
}

function resetChat(elements) {
    currentDocumentId = null;
    elements.chatInput.disabled = true;
    elements.chatSendButton.disabled = true;
    elements.chatMessages.innerHTML = '';
    appendMessage(elements, 'bot', 'Please upload a document to begin.');
}

function appendMessage(elements, sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    const content = document.createElement('p');
    content.textContent = text;
    messageElement.appendChild(content);
    elements.chatMessages.appendChild(messageElement);
    elements.chatWindow.scrollTop = elements.chatWindow.scrollHeight;
    return messageElement;
}

function setAuthMessage(element, message, type = 'success') {
    element.textContent = message;
    element.className = message ? `notification ${type}` : 'notification';
}

