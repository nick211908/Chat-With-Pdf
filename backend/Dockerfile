# --- Stage 1: Build Stage ---
FROM python:3.11-slim as builder

WORKDIR /app

# Environment variables for Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# --- Stage 2: Final/Production Stage ---
FROM python:3.11-slim

WORKDIR /app

# Create a non-root user
RUN addgroup --system app && adduser --system --group app
USER app

# Copy the virtual environment and application code
COPY --from=builder /opt/venv /opt/venv
COPY ./app ./app

# Set the virtual environment's Python as default
ENV PATH="/opt/venv/bin:$PATH"

# --- IMPORTANT: CHANGE PORT FOR HUGGING FACE ---
# Expose the application port required by Hugging Face Spaces
EXPOSE 7860

# --- IMPORTANT: CHANGE PORT FOR HUGGING FACE ---
# Command to run the application on the correct port
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

