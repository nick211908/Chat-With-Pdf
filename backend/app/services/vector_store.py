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

    def get_retriever(self, user_id: str, document_id: str, k: int = 5):
        """
        Returns a retriever that performs vector similarity search for a specific user and document.
        
        Args:
            user_id: The user ID to filter documents
            document_id: The document ID to filter documents  
            k: Number of most similar documents to retrieve (default: 5)
        """
        def vector_similarity_retriever(query: str):
            try:
                # Add detailed logging for debugging
                logger.info(f"Searching for documents with user_id='{user_id}' and document_id='{document_id}'")
                
                # First, let's see what documents exist for this user
                all_user_docs = list(self.collection.find({"metadata.user_id": user_id}))
                logger.info(f"Found {len(all_user_docs)} total documents for user {user_id}")
                
                if all_user_docs:
                    # Log the document IDs we have for this user
                    doc_ids = [doc.get('metadata', {}).get('document_id', 'MISSING') for doc in all_user_docs]
                    logger.info(f"Available document IDs for user {user_id}: {doc_ids}")
                
                # Embed the query using the same model used for document embeddings
                query_embedding = self.embedding_model.embed_query(query)
                
                # Retrieve all documents for the user and document_id
                results = list(self.collection.find({
                    "metadata.user_id": user_id,
                    "metadata.document_id": document_id
                }))
                
                if not results:
                    logger.warning(f"No documents found for user {user_id} and document {document_id}")
                    logger.warning(f"Query was looking for exact match on document_id: '{document_id}' (type: {type(document_id)})")
                    return []
                
                # Calculate similarity scores in Python (more reliable than MongoDB aggregation)
                import numpy as np
                
                scored_docs = []
                for result in results:
                    doc_embedding = result['embedding']
                    
                    # Calculate cosine similarity (dot product for normalized vectors)
                    similarity_score = np.dot(query_embedding, doc_embedding)
                    
                    # Add similarity score to metadata
                    metadata = result['metadata'].copy()
                    metadata['similarity_score'] = float(similarity_score)
                    
                    scored_docs.append({
                        'document': Document(
                            page_content=result['text'], 
                            metadata=metadata
                        ),
                        'score': similarity_score
                    })
                
                # Sort by similarity score (descending) and take top k
                scored_docs.sort(key=lambda x: x['score'], reverse=True)
                top_docs = [item['document'] for item in scored_docs[:k]]
                
                logger.info(f"Retrieved {len(top_docs)} similar documents for query: '{query[:50]}...'")
                if top_docs:
                    logger.debug(f"Top similarity score: {top_docs[0].metadata.get('similarity_score', 'N/A')}")
                
                return top_docs
                
            except Exception as e:
                logger.error(f"Error in vector similarity search: {e}")
                # Fallback to simple text search if vector search fails
                logger.warning("Falling back to simple text search")
                results = self.collection.find({
                    "metadata.user_id": user_id,
                    "metadata.document_id": document_id,
                    "text": {"$regex": query, "$options": "i"}  # Case-insensitive text search
                }).limit(k)
                
                return [Document(page_content=r['text'], metadata=r['metadata']) for r in results]
        
        return vector_similarity_retriever

vector_store = MongoVectorStore()

