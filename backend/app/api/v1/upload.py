import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from app.models.response import UploadResponse
from app.core.security import get_current_user
from app.services.pdf_loader import PDFLoader
from app.services.vector_store import vector_store
from loguru import logger

router = APIRouter()
pdf_loader = PDFLoader()

@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile,
    current_user: dict = Depends(get_current_user),
):
    """
    Handles PDF file uploads.
    The user must be authenticated. The endpoint processes the PDF and stores
    it in the vector database.
    """
    user_id = current_user.get("sub")
    logger.info(f"Received upload request from user: {user_id}")

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")

    try:
        # --- FIX: GENERATE A UNIQUE DOCUMENT ID ---
        document_id = str(uuid.uuid4())
        # ----------------------------------------

        # Process the PDF to get document chunks
        documents = pdf_loader.load_and_split_documents(file=file)

        # Add the processed documents to the vector store
        vector_store.add_documents(
            documents=documents,
            user_id=user_id,
            document_id=document_id # <-- Pass the generated ID
        )

        logger.success(f"Successfully processed and stored document {document_id} for user {user_id}")
        return UploadResponse(
            message="File uploaded and processed successfully.",
            filename=file.filename,  # Include the original filename
            document_id=document_id
        )
    except Exception as e:
        logger.error(f"Error during file upload for user {user_id}: {e}")
        # Propagate the specific error message for better debugging
        raise HTTPException(status_code=500, detail=str(e))

