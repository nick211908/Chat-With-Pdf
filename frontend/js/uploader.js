import { uploadPDF } from './api.js';
import { debugLog, showStatus } from './utils.js';

export class UploaderManager {
    constructor() {
        this.onUploadSuccess = null;
    }

    initialize() {
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', this.handleUpload.bind(this));
        }
    }

    async handleUpload(event) {
        event.preventDefault();
        const fileInput = document.getElementById('pdf-file-input');
        const uploadStatus = document.getElementById('upload-status');
        const uploadButton = document.querySelector('#upload-form button');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showStatus(uploadStatus, 'Please select a PDF file first.', 'error');
            return;
        }

        const file = fileInput.files[0];
        debugLog('Starting upload', { fileName: file.name, fileSize: file.size });
        
        showStatus(uploadStatus, `Uploading and processing: ${file.name}...`, 'loading');
        uploadButton.disabled = true;

        try {
            const result = await uploadPDF(file);
            showStatus(uploadStatus, 'File processed successfully! You can now ask questions.', 'success');
            
            if (this.onUploadSuccess) {
                this.onUploadSuccess(result.document_id);
            }
        } catch (error) {
            showStatus(uploadStatus, `Upload failed: ${error.message}`, 'error');
        } finally {
            uploadButton.disabled = false;
            event.target.reset();
        }
    }

    setUploadSuccessHandler(handler) {
        this.onUploadSuccess = handler;
    }
}