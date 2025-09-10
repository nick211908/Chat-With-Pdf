import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import upload, chat
from app.core.logger import setup_logging

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup and shutdown events."""
    setup_logging()
    yield

app = FastAPI(title="Chat with PDF API", lifespan=lifespan)

# --- THIS IS THE CRUCIAL PART ---
# The list of origins that are allowed to make requests to this backend.
origins = [
    "http://localhost",
    "http://localhost:8080",  # Your frontend server
    "http://127.0.0.1:8080", # Also add this for good measure
    # In production, you would add your Netlify URL here, e.g., "https://your-app.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Allow specific origins
    allow_credentials=True,      # Allow cookies
    allow_methods=["*"],         # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],         # Allow all headers
)
# --------------------------------

# Include API routers
app.include_router(upload.router, prefix="/api/v1", tags=["PDF Management"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])

@app.get("/", tags=["Health Check"])
def read_root():
    """Health check endpoint."""
    return {"status": "ok"}

