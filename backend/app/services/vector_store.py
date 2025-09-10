import time
from pymongo import MongoClient
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.docstore.document import Document
from app.core.config import settings
from loguru import logger

class MongoVectorStore:
    """
    Manages storing and retrieving document embeddings from MongoDB.
    """
    def __init__(self):
        try:
            self.client = MongoClient(settings.MONGO_CONNECTION_STRING)
            self.db = self.client.get_database("chat_with_pdf_db")
            self.collection = self.db.get_collection("document_embeddings")

            # Explicitly pass the API key to ensure simple key-based auth is used.
            self.embedding_model = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=settings.GOOGLE_API_KEY
            )
            
            logger.info("Successfully connected to MongoDB and initialized embedding model.")
        except Exception as e:
            logger.error(f"Failed to initialize MongoVectorStore: {e}")
            raise

    def add_documents(self, documents: list[Document], user_id: str, document_id: str):
        """
        Embeds and adds a list of document chunks to the vector store,
        respecting API rate limits.
        """
        try:
            for doc in documents:
                doc.metadata["user_id"] = user_id
                doc.metadata["document_id"] = document_id
                embedding = self.embedding_model.embed_query(doc.page_content)
                self.collection.insert_one({
                    "text": doc.page_content,
                    "embedding": embedding,
                    "metadata": doc.metadata
                })
                logger.info(f"Embedded and stored a chunk for doc_id: {document_id}")
                # This delay is CRITICAL for staying within the free tier limits.
                time.sleep(4)
            logger.success("All documents have been successfully embedded and stored.")
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {e}")
            raise

    def get_retriever(self, user_id: str, document_id: str):
        """
        Returns a simplified retriever for a specific user and document.
        """
        def simple_retriever(query: str):
            # This is a basic retriever. For production, you'd implement a proper
            # vector similarity search here.
            results = self.collection.find({
                "metadata.user_id": user_id,
                "metadata.document_id": document_id
            })
            # Limiting to 5 most recent chunks for context to avoid overwhelming the LLM
            return [Document(page_content=r['text'], metadata=r['metadata']) for r in results][-5:]
        return simple_retriever

vector_store = MongoVectorStore()

