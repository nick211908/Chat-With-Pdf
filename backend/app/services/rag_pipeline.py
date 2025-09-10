from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
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
        chain = (
            {"context": retriever, "question": RunnablePassthrough()}
            | self.prompt
            | self.llm
            | self.output_parser
        )
        return chain

