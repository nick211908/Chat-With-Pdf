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

// A helper to handle fetch responses and parse errors
async function handleResponse(response) {
    if (!response.ok) {
        // Try to parse the error message from the backend for better feedback
        let errorMessage;
        try {
            const errorData = await response.json();
            // FastAPI validation errors are often nested in errorData.detail
            if (Array.isArray(errorData.detail)) {
                 errorMessage = errorData.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
            } else {
                 errorMessage = errorData.detail || JSON.stringify(errorData);
            }
        } catch (e) {
            errorMessage = `HTTP error! Status: ${response.status}`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
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

    const result = await handleResponse(response);
    console.log('uploadPDF result:', result);
    console.log('uploadPDF result.document_id:', result.document_id, 'type:', typeof result.document_id);
    
    return result;
}

async function postChatMessage(documentId, question) {
    console.log('postChatMessage called with:', { documentId, question });
    console.log('documentId type:', typeof documentId, 'value:', documentId);

    const token = await getAuthToken();
    if (!token) {
        throw new Error('Authentication error: You must be logged in to chat.');
    }

    const requestBody = {
        document_id: documentId,
        question: question,
    };
    
    console.log('Request body:', requestBody);
    console.log('Request body JSON:', JSON.stringify(requestBody));

    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    return handleResponse(response);
}
