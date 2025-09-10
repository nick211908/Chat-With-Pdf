const API_BASE_URL = 'http://127.0.0.1:8000';

// This is a "provider" function that chatUI will set.
// It allows this module to get the token without depending on the Supabase client directly.
let getAuthToken = async () => null;

export function setAuthTokenProvider(provider) {
    getAuthToken = provider;
}

export async function uploadPDF(file) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication token not found. Please log in again.');

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
        const errorData = await response.json().catch(() => ({ detail: 'The server returned an unreadable error.' }));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    return response.json();
}

export async function postChatMessage(documentId, question) {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication token not found. Please log in again.');

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
        const errorData = await response.json().catch(() => ({ detail: 'The server returned an unreadable error.' }));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    return response.json();
}

