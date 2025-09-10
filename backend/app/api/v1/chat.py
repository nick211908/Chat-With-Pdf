from fastapi import APIRouter, Depends, HTTPException
from app.models.request import ChatRequest
from app.models.response import ChatResponse
from app.core.security import get_current_user
from app.services.rag_pipeline import RAGPipeline
from app.services.vector_store import vector_store
from loguru import logger

router = APIRouter()
rag_pipeline = RAGPipeline()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_doc(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Handles chat requests for a specific document.
    The user must be authenticated.
    """
    user_id = current_user.get("sub") # 'sub' is the standard JWT claim for subject (user ID)
    logger.info(f"Received chat request from user {user_id} for doc {request.document_id}")
    logger.info(f"Document ID type: {type(request.document_id)}, value: '{request.document_id}'")
    logger.info(f"Question: '{request.question}'")

    try:
        # Get the retriever for the specific user and document
        retriever = vector_store.get_retriever(
            user_id=user_id, document_id=request.document_id
        )

        # Get the RAG chain
        chain = rag_pipeline.get_chain(retriever)

        # Invoke the chain with the user's question
        result = await chain.ainvoke(request.question)

        logger.info(f"Successfully generated response for user {user_id}")
        return ChatResponse(
            question=request.question,
            answer=result,
            document_id=request.document_id,
        )
    except Exception as e:
        # Log the full, detailed error for debugging purposes on the server.
        logger.error(f"Error processing chat request for user {user_id}: {e}")
        # Return a generic, user-friendly error to the client without exposing internal details.
        raise HTTPException(status_code=500, detail="An internal error occurred while processing your chat request.")

