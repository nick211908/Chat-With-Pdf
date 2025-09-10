from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from app.core.config import settings  # Import the settings

class RAGPipeline:
    """
    Manages the Retrieval-Augmented Generation pipeline using LangChain.
    """
    def __init__(self):
        # Explicitly pass the API key to ensure simple key-based auth is used.
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.GOOGLE_API_KEY
        )

        self.template = """
        You are a helpful assistant that answers questions based on the following context.
        Context: {context}
        Question: {question}
        Answer:
        """
        self.prompt = ChatPromptTemplate.from_template(self.template)
        self.output_parser = StrOutputParser()

    def get_chain(self, retriever):
        """
        Builds and returns the RAG chain.
        """
        def format_docs(docs):
            """Format retrieved documents into a single context string."""
            if not docs:
                return "No relevant context found."
            
            formatted_context = []
            for i, doc in enumerate(docs, 1):
                # Include similarity score if available for debugging
                score_info = ""
                if hasattr(doc, 'metadata') and 'similarity_score' in doc.metadata:
                    score_info = f" (similarity: {doc.metadata['similarity_score']:.3f})"
                
                formatted_context.append(f"Document {i}{score_info}:\n{doc.page_content}")
            
            return "\n\n".join(formatted_context)
        
        # Create a simple function that handles the retrieval and formatting
        def get_context(question):
            docs = retriever(question)
            return format_docs(docs)
        
        # Build the chain using RunnableLambda for the context retrieval
        chain = (
            {
                "context": RunnableLambda(get_context),
                "question": RunnablePassthrough()
            }
            | self.prompt
            | self.llm
            | self.output_parser
        )
        return chain

