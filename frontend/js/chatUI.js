import { initializeUploader } from './uploader.js';
import { initializeApi } from './api.js';

// --- IMPORTANT: REPLACE WITH YOUR SUPABASE CREDENTIALS ---
const SUPABASE_URL = 'https://neuogxpouxhiahdiuovg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ldW9neHBvdXhoaWFoZGl1b3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTAyMDgsImV4cCI6MjA3Mjk4NjIwOH0.ptaLhJyEB63wDd99nHhJM2rK0mhJ2H88AosnyG8tV8I';
// ---------------------------------------------------------

// --- State and DOM Elements ---
let supabaseClient;
let currentDocumentId = null;

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
 
 // Create a more explicit callback to avoid parameter confusion
 const uploadSuccessCallback = (docId) => {
     console.log('uploadSuccessCallback called with:', docId, 'type:', typeof docId);
     onUploadSuccess(elements, docId);
 };
 
 initializeUploader(elements, api, uploadSuccessCallback);
 initializeAuth(elements, supabaseClient);
 initializeChat(elements, api);
});

function initializeAuth(elements, supabaseClient) {
 supabaseClient.auth.onAuthStateChange((_event, session) => {
 updateAuthState(elements, session);
 });

 elements.loginForm.addEventListener('submit', async (e) => {
 e.preventDefault(); // Prevent default form submission
 const email = elements.loginForm.email.value.trim();
 const password = elements.loginForm.password.value.trim();
 setAuthMessage(elements.authMessage, '');

 if (!email || !password) {
 setAuthMessage(elements.authMessage, 'Please enter both email and password.', 'error');
 return;
 }

 const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
 if (!emailRegex.test(email)) {
 setAuthMessage(elements.authMessage, 'Invalid email format.', 'error');
 return;
 }
 if (password.length <6) {
 setAuthMessage(elements.authMessage, 'Password must be at least6 characters.', 'error');
 return;
 }

 try {
 const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
 if (error) throw error;
 } catch (error) {
 setAuthMessage(elements.authMessage, `Login failed: ${error.message}`, 'error');
 }
 });
    
 elements.signupForm.addEventListener('submit', async (e) => {
 e.preventDefault(); // Prevent default form submission
 const email = prompt("Please enter your email to sign up:").trim();
 if (!email) return;
        
 const password = prompt("Please enter a password (min.6 characters):").trim();
 if (!password) return;

 setAuthMessage(elements.authMessage, '');

 const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
 if (!emailRegex.test(email)) {
 setAuthMessage(elements.authMessage, 'Invalid email format.', 'error');
 return;
 }
 if (password.length <6) {
 setAuthMessage(elements.authMessage, 'Password must be at least6 characters.', 'error');
 return;
 }

 try {
 const { error } = await supabaseClient.auth.signUp({ email, password });
 if (error) throw error;
 setAuthMessage(elements.authMessage, 'Signup successful! Please check your email.', 'success');
 } catch (error) {
 setAuthMessage(elements.authMessage, `Signup failed: ${error.message}`, 'error');
 }
 });

 elements.logoutButton.addEventListener('click', () => {
 supabaseClient.auth.signOut();
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
 resetChat(elements);
 }
}

function initializeChat(elements, api) {
 elements.chatForm.addEventListener('submit', async (e) => {
 e.preventDefault();
 const question = elements.chatInput.value.trim();
        
 // --- CRITICAL FIX: Validate that a document is loaded ---
 if (!currentDocumentId) {
 appendMessage(elements, 'bot', 'Error: Please upload a document before asking a question.');
 return;
 }
 if (!question) {
 return; // Don't send empty questions
 }

 appendMessage(elements, 'user', question);
 elements.chatInput.value = '';
        
 const thinkingMessage = appendMessage(elements, 'bot', 'Thinking...');
 thinkingMessage.classList.add('thinking-message');

 try {
 console.log('Sending chat message with documentId:', currentDocumentId, 'type:', typeof currentDocumentId);
 console.log('Question:', question);
 const response = await api.postChatMessage(String(currentDocumentId), String(question));
 console.log('Received response:', response);
 thinkingMessage.querySelector('p').textContent = response.answer;
 thinkingMessage.classList.remove('thinking-message');
 } catch (error) {
 console.error('Chat error:', error);
 thinkingMessage.querySelector('p').textContent = `Error: ${error.message}`;
 thinkingMessage.classList.add('error-message');
 }
 });
}

function onUploadSuccess(elements, docId) {
 console.log('onUploadSuccess called with docId:', docId, 'type:', typeof docId);
 
 // Ensure docId is a valid string
 if (!docId || typeof docId !== 'string') {
     console.error('Invalid docId received:', docId);
     appendMessage(elements, 'bot', 'Error: Invalid document ID received from server.');
     return;
 }
 
 // Additional check for the [object Object] issue
 if (docId === '[object Object]' || docId.includes('[object Object]')) {
     console.error('Received [object Object] as docId, this indicates a frontend bug');
     appendMessage(elements, 'bot', 'Error: Invalid document ID format. Please try uploading again.');
     return;
 }
 
 currentDocumentId = docId; // Set the document ID for the chat
 console.log('currentDocumentId set to:', currentDocumentId, 'type:', typeof currentDocumentId);
 elements.chatInput.disabled = false;
 elements.chatSendButton.disabled = false;
 elements.chatMessages.innerHTML = ''; 
 appendMessage(elements, 'bot', `PDF processed successfully. Document ID: ${docId}. You can now ask questions.`);
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