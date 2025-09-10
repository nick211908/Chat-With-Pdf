import { postChatMessage } from './api.js';
import { debugLog } from './utils.js';

export class ChatManager {
    constructor() {
        this.currentDocumentId = null;
    }

    initialize() {
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', this.handleChat.bind(this));
        }
    }

    async handleChat(event) {
        event.preventDefault();
        const chatInput = document.getElementById('chat-input');
        const question = chatInput.value.trim();
        
        if (!question || !this.currentDocumentId) {
            if (!this.currentDocumentId) {
                this.appendMessage('bot', 'Error: Please upload and process a document before asking questions.');
            }
            return;
        }

        debugLog('Sending chat message', { question, documentId: this.currentDocumentId });
        
        this.appendMessage('user', question);
        chatInput.value = '';
        
        const thinkingMessage = this.appendMessage('bot', 'Thinking...');
        thinkingMessage.classList.add('thinking-message');

        try {
            const response = await postChatMessage(this.currentDocumentId, question);
            thinkingMessage.querySelector('p').textContent = response.answer;
            thinkingMessage.classList.remove('thinking-message');
            debugLog('Chat response received');
        } catch (error) {
            thinkingMessage.querySelector('p').textContent = `Error: ${error.message}`;
            thinkingMessage.classList.add('error-message');
            thinkingMessage.classList.remove('thinking-message');
        }
    }

    appendMessage(sender, text) {
        const chatMessages = document.getElementById('chat-messages');
        const chatWindow = document.getElementById('chat-window');
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        const content = document.createElement('p');
        content.textContent = text;
        messageElement.appendChild(content);
        chatMessages.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return messageElement;
    }

    resetChat() {
        this.currentDocumentId = null;
        const chatInput = document.getElementById('chat-input');
        const chatSendButton = document.querySelector('#chat-form button');
        const chatMessages = document.getElementById('chat-messages');
        
        chatInput.disabled = true;
        chatSendButton.disabled = true;
        chatMessages.innerHTML = '';
        this.appendMessage('bot', 'Please upload a document to begin.');
    }

    onUploadSuccess(docId) {
        this.currentDocumentId = docId;
        const chatInput = document.getElementById('chat-input');
        const chatSendButton = document.querySelector('#chat-form button');
        const chatMessages = document.getElementById('chat-messages');
        
        chatInput.disabled = false;
        chatSendButton.disabled = false;
        chatMessages.innerHTML = '';
        this.appendMessage('bot', 'PDF processed successfully. You can now ask questions about your document.');
        debugLog('Upload successful', { documentId: docId });
    }

    setCurrentDocumentId(docId) {
        this.currentDocumentId = docId;
    }
}