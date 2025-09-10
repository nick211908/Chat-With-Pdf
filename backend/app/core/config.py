from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Explicitly load the .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

class Settings(BaseSettings):
    """
    Manages application settings and environment variables.
    """
    # MongoDB
    MONGO_CONNECTION_STRING: str

    # Google Gemini (for the Chat LLM)
    GOOGLE_API_KEY: str

    # Supabase Auth
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_ANON_KEY: str

    model_config = {
        'env_file': '.env',
        'env_file_encoding': 'utf-8',
        'extra': 'ignore'
    }

settings = Settings()