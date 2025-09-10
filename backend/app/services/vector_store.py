from pymongo import MongoClient
# --- THE FIX: Import from the new, correct package ---
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.docstore.document import Document
from app.core.config import settings
from loguru import logger

class MongoVectorStore:
    """
    Manages storing and retrieving document embeddings from MongoDB using
    a local sentence-transformers model.
    """
    def __init__(self):
        try:
            self.client = MongoClient(settings.MONGO_CONNECTION_STRING)
            self.db = self.client.get_database("chat_with_pdf_db")
            self.collection = self.db.get_collection("document_embeddings_local")

            # --- CRITICAL CHANGE: Use local HuggingFaceEmbeddings from the new package ---
            # This will download the model on the first run and cache it.
            logger.info("Initializing local sentence-transformer model. This may take a moment on the first run...")
            self.embedding_model = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2"
            )
            
            logger.success("Successfully connected to MongoDB and initialized local embedding model.")
        except Exception as e:
            logger.error(f"Failed to initialize MongoVectorStore: {e}")
            raise

    def add_documents(self, documents: list[Document], user_id: str, document_id: str):
        """
        Embeds and adds a list of document chunks to the vector store.
        This process is now fast and runs locally without rate limits.
        """
        try:
            texts_to_embed = [doc.page_content for doc in documents]
            if not texts_to_embed:
                logger.warning("No text found in documents to embed.")
                return

            embeddings = self.embedding_model.embed_documents(texts_to_embed)

            docs_to_insert = []
            for i, doc in enumerate(documents):
                doc.metadata["user_id"] = user_id
                doc.metadata["document_id"] = document_id
                docs_to_insert.append({
                    "text": doc.page_content,
                    "embedding": embeddings[i],
                    "metadata": doc.metadata
                })

            if docs_to_insert:
                self.collection.insert_many(docs_to_insert)

            logger.success(f"All {len(documents)} chunks have been successfully embedded and stored locally.")
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {e}")
            raise

    def get_retriever(self, user_id: str, document_id: str):
        """
        Returns a simplified retriever for a specific user and document.
        """
        def simple_retriever(query: str):
            # For a production app, you would perform a vector similarity search here.
            results = self.collection.find({
                "metadata.user_id": user_id,
                "metadata.document_id": document_id
            })
            return [Document(page_content=r['text'], metadata=r['metadata']) for r in results]
        return simple_retriever

vector_store = MongoVectorStore()

