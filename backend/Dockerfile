# --- Stage 1: Build Stage ---
# Use a full Python image to build the application and its dependencies.
# This stage has build tools that are not needed in the final runtime image.
FROM python:3.11-slim as builder

# Set the working directory inside the container
WORKDIR /app

# Set environment variables
# Prevents Python from writing pyc files to disk
ENV PYTHONDONTWRITEBYTECODE 1
# Ensures that output is sent straight to the terminal without being buffered
ENV PYTHONUNBUFFERED 1

# Install system dependencies that might be required by Python packages
# For example, build-essential for compiling some packages from source.
# While not strictly necessary for this set of dependencies, it's a good practice.
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy the requirements file first to leverage Docker's layer caching.
# This layer will only be rebuilt if requirements.txt changes.
COPY requirements.txt .

# Install Python dependencies into the virtual environment
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# --- Stage 2: Final/Production Stage ---
# Use a minimal, non-root base image for the final application.
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Create a non-root user for security best practices
RUN addgroup --system app && adduser --system --group app
USER app

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy the application code from the current directory to the container
COPY ./app ./app

# Make the virtual environment's Python the default
ENV PATH="/opt/venv/bin:$PATH"

# Expose the port the app runs on
# This informs Docker that the container listens on this network port at runtime.
EXPOSE 8000

# Define the command to run the application
# Uvicorn is started, listening on all interfaces (0.0.0.0) on port 8000.
# The --host flag is crucial for the app to be accessible from outside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
