from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """
    Manages application settings and environment variables.
    """
    # MongoDB
    MONGO_CONNECTION_STRING: str

    # Google Gemini (using the standard environment variable name)
    GOOGLE_API_KEY: str = Field(..., alias="GOOGLE_API_KEY")

    # Supabase Auth
    SUPABASE_URL: str
    SUPABASE_KEY: str  # This is the service_role key
    SUPABASE_JWT_SECRET: str
    SUPABASE_ANON_KEY: str # This is the public anon key

    model_config = {
        'env_file': '.env',
        'env_file_encoding': 'utf-8',
        'extra': 'ignore'
    }

settings = Settings()

