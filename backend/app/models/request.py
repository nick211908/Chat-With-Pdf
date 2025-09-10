from pydantic import BaseModel, Field, EmailStr

class UserCreate(BaseModel):
    """
    Schema for user registration request.
    Validates email format and ensures password is provided.
    """
    username: str = Field(..., min_length=3, max_length=50, description="The user's unique username.")
    email: EmailStr = Field(..., description="The user's email address.")
    password: str = Field(..., min_length=8, description="The user's password (at least 8 characters).")

class ChatRequest(BaseModel):
    """
    Schema for a chat message request.
    Requires a question and the ID of the document to chat with.
    """
    document_id: str = Field(..., description="The unique identifier for the processed document.")
    question: str = Field(..., min_length=1, description="The question being asked by the user.")
