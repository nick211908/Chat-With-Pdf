// This module no longer searches for elements, preventing race conditions.
// It receives all necessary elements and functions from chatUI.js.
export function initializeUploader(elements, api, onUploadSuccess) {
    if (elements.uploadForm) {
        elements.uploadForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            await handleUpload(elements, api, onUploadSuccess);
        });
    } else {
        console.error("Critical Error: Uploader form not found in the DOM.");
    }
}

async function handleUpload(elements, api, onUploadSuccess) {
    if (!elements.pdfFileInput.files || elements.pdfFileInput.files.length === 0) {
        elements.uploadStatus.textContent = 'Please select a PDF file first.';
        elements.uploadStatus.className = 'status-message error';
        return;
    }

    const file = elements.pdfFileInput.files[0];
    
    // Provide immediate, clear user feedback
    elements.uploadStatus.textContent = `Uploading and processing: ${file.name}...`;
    elements.uploadStatus.className = 'status-message loading';
    elements.uploadButton.disabled = true;

    try {
        const result = await api.uploadPDF(file);
        
        elements.uploadStatus.textContent = 'File processed successfully! You can now ask questions.';
        elements.uploadStatus.className = 'status-message success';
        
        // Callback to the main UI to update the application state
        onUploadSuccess(elements, result.document_id);

    } catch (error) {
        console.error("Upload failed:", error);
        elements.uploadStatus.textContent = `Upload failed: ${error.message}`;
        elements.uploadStatus.className = 'status-message error';
    } finally {
        // Always re-enable the form for the next upload attempt
        elements.uploadButton.disabled = false;
        elements.uploadForm.reset(); 
    }
}

