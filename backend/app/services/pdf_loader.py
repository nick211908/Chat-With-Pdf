import os
import tempfile
from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from loguru import logger

class PDFLoader:
    """
    Handles loading, splitting, and processing of PDF files using PyPDFLoader.
    """
    # --- FIX: REMOVED `upload_file` from __init__ ---
    # The class is initialized once with its configuration.
    def __init__(self, chunk_size=1000, chunk_overlap=100):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        logger.info("PDFLoader initialized with PyPDFLoader.")

    # The file is passed to this method for processing.
    def load_and_split_documents(self, file: UploadFile):
        try:
            # Ensure the file is read correctly
            content = file.file.read()
            if not content:
                raise ValueError("Uploaded file is empty or could not be read.")

            # Save the file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                temp_file.write(content)
                temp_file_path = temp_file.name

            logger.info(f"Temporarily saved PDF to {temp_file_path}")

            # Process the file
            loader = PyPDFLoader(temp_file_path)
            documents = loader.load_and_split(text_splitter=self.text_splitter)

            logger.success(f"Successfully loaded and split PDF into {len(documents)} chunks.")
            return documents

        except Exception as e:
            logger.error(f"Failed to load or split PDF: {e}")
            raise
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")