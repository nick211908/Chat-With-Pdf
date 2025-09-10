import logging
from typing import List
from langchain.chains.summarize import load_summarize_chain
from langchain.docstore.document import Document
from langchain_google_genai import ChatGoogleGenerativeAI
from ..core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

async def summarize_document(documents: List[Document]) -> str:
    """
    Generates a summary for a list of document chunks.

    Args:
        documents: A list of Document objects (chunks from a PDF).

    Returns:
        A string containing the summary.
    """

    if not documents:
        logger.warning("Summarization called with no documents.")
        return "The document is empty and cannot be summarized."

    logger.info(f"Starting summarization for a document with {len(documents)} chunks.")
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash-latest",
            google_api_key=settings.GOOGLE_API_KEY,
            temperature=0.1
        )

        # "map_reduce" is efficient for large documents. It summarizes each chunk (map)
        # and then combines the summaries into a final summary (reduce).
        summary_chain = load_summarize_chain(llm, chain_type="map_reduce")
        
        summary = await summary_chain.arun(documents)
        
        logger.info("Summarization completed successfully.")
        return summary

    except Exception as e:
        logger.exception("An error occurred during document summarization.")
        raise
