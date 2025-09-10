from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import create_client, Client
from jose import jwt, JWTError
from loguru import logger
from .config import settings

# This scheme expects the token to be sent in the Authorization header
# as 'Bearer <token>'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decodes and validates the JWT token from the Authorization header.
    Returns the user data payload if the token is valid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # The payload itself contains the user data from Supabase token
        # You can add a check here to see if the user exists in your DB if needed
        # For now, we trust the valid token from Supabase
        logger.info(f"Successfully validated token for user_id: {user_id}")
        return payload

    except JWTError as e:
        logger.error(f"JWT Error: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"An unexpected error occurred during token validation: {e}")
        raise credentials_exception

