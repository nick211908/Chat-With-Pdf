from pydantic import BaseModel, Field
from typing import List, Optional

class TokenResponse(BaseModel):
    """
    Schema for the response when a user successfully logs in.
    """
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    """
    Schema for returning basic, non-sensitive user information.
    """
    username: str
    email: Optional[str] = None

class UploadResponse(BaseModel):
    """
    Schema for the response after a successful file upload and processing.
    """
    message: str = "File uploaded successfully."
    filename: str = Field(..., description="The original name of the uploaded file.")
    document_id: str = Field(..., description="The unique identifier assigned to the processed document.")

class ChatResponse(BaseModel):
    """
    Schema for the response from the chat endpoint.
    """
    question: str = Field(..., description="The original question asked by the user.")
    answer: str = Field(..., description="The generated answer to the user's question.")
    document_id: str = Field(..., description="The ID of the document the chat is based on.")
