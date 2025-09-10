import { CONFIG, ENDPOINTS } from './config.js';
import { debugLog } from './utils.js';

let supabaseClient = null;

export function setSupabaseClient(client) {
    supabaseClient = client;
}

async function makeAuthenticatedRequest(url, options = {}) {
    try {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            debugLog('Session error', sessionError);
            throw new Error('Authentication session error');
        }

        if (!sessionData.session?.access_token) {
            debugLog('No access token found');
            throw new Error('No authentication token found. Please log in again.');
        }

        const token = sessionData.session.access_token;
        debugLog(`Making request to: ${url}`);

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        debugLog(`Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            
            debugLog(`API Error: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const result = await response.json();
        debugLog('API Response', result);
        return result;

    } catch (error) {
        if (error.name === 'TimeoutError') {
            debugLog('Request timeout');
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        debugLog('Request failed', error);
        throw error;
    }
}

export async function uploadPDF(file) {
    const formData = new FormData();
    formData.append('file', file);

    return await makeAuthenticatedRequest(`${CONFIG.API_BASE_URL}${ENDPOINTS.UPLOAD}`, {
        method: 'POST',
        body: formData
    });
}

export async function postChatMessage(documentId, question) {
    return await makeAuthenticatedRequest(`${CONFIG.API_BASE_URL}${ENDPOINTS.CHAT}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            document_id: documentId,
            question: question
        })
    });
}

export async function testBackendConnectivity() {
    try {
        debugLog('Testing backend connectivity');
        const healthCheck = await fetch(`${CONFIG.API_BASE_URL}${ENDPOINTS.HEALTH_CHECK}`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        
        if (healthCheck.ok) {
            debugLog('Backend is reachable');
            return true;
        } else {
            debugLog('Backend health check failed', { status: healthCheck.status });
            return false;
        }
    } catch (error) {
        debugLog('Backend connectivity test failed', error);
        return false;
    }
}