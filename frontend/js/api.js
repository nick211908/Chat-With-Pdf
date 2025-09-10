import { supabase } from './chatUI.js';

const API_BASE_URL = 'http://127.0.0.1:8000';

async function getAuthToken() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error getting auth session:", error);
        return null;
    }
    return data.session?.access_token;
}

export async function uploadPDF(file) {
    const token = await getAuthToken();
    if (!token) {
        console.error("ERROR: No auth token found. Cannot upload."); // Critical failure point.
        throw new Error('You must be logged in to upload files.');
    }
    console.log("4. Attempting to send file to backend. Token found."); // Probe 4: Confirms we have a token and are proceeding.

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

export async function postChatMessage(documentId, question) {
    const token = await getAuthToken();
    if (!token) {
        throw new Error('You must be logged in to chat.');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            document_id: documentId,
            question: question,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown server error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

