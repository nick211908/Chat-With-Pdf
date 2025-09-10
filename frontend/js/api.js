const API_BASE_URL = 'http://127.0.0.1:8000';
let getSession; // This will be our function to get the Supabase session

// This function is called by chatUI.js once Supabase is ready.
export function initializeApi(sessionProvider) {
    getSession = sessionProvider;
    // Return the public API methods that the rest of the app can use.
    return {
        uploadPDF,
        postChatMessage
    };
}

async function getAuthToken() {
    if (!getSession) {
        throw new Error("API module has not been initialized.");
    }
    const { data, error } = await getSession();
    if (error) {
        console.error("Error getting auth session from Supabase:", error);
        return null;
    }
    return data.session?.access_token;
}

async function uploadPDF(file) {
    const token = await getAuthToken();
    if (!token) {
        throw new Error('Authentication error: You must be logged in to upload files.');
    }

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
        // Try to parse the error message from the backend for better feedback
        const errorData = await response.json().catch(() => ({ detail: 'The server returned an unexpected error.' }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    return response.json();
}

async function postChatMessage(documentId, question) {
    const token = await getAuthToken();
    if (!token) {
        throw new Error('Authentication error: You must be logged in to chat.');
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
        const errorData = await response.json().catch(() => ({ detail: 'The server returned an unexpected error.' }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
    }

    return response.json();
}

