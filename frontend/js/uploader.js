import { uploadPDF } from './api.js';

const uploaderForm = document.getElementById('uploader-form');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');

export function initializeUploader(onUploadSuccess) {
    if (uploaderForm) {
        uploaderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleUpload(onUploadSuccess);
        });
    }
}

async function handleUpload(onUploadSuccess) {
    console.log("1. Upload button clicked."); // Probe 1: Confirms the event listener is working.

    if (!fileInput.files || fileInput.files.length === 0) {
        uploadStatus.textContent = 'Please select a file first.';
        console.error("ERROR: No file selected.");
        return;
    }

    const file = fileInput.files[0];
    console.log("2. File selected:", file); // Probe 2: Confirms we have the file object.

    uploadStatus.textContent = `Uploading ${file.name}...`;
    uploadStatus.classList.remove('error');
    uploadStatus.classList.add('processing');

    try {
        console.log("3. Preparing to call uploadPDF from api.js..."); // Probe 3: Confirms we are about to make the API call.
        const result = await uploadPDF(file);
        
        console.log("SUCCESS: Received response from backend:", result); // Confirms API call was successful.
        
        uploadStatus.textContent = 'File uploaded successfully! Processing...';
        onUploadSuccess(result.document_id); // Pass the document ID to the main UI

    } catch (error) {
        console.error("ERROR in handleUpload:", error); // Logs the actual error object.
        uploadStatus.textContent = `Upload failed: ${error.message}`;
        uploadStatus.classList.add('error');
    } finally {
        console.log("Finished handleUpload function.");
        uploaderForm.reset(); // Clear the file input
    }
}

