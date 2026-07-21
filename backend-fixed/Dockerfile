FROM python:3.12-slim

WORKDIR /app

# System dependencies for Pillow (QR codes), psycopg2 (Postgres), bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libffi-dev \
    cargo \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency file first (better layer caching)
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Create a non-root user for safety
RUN useradd -m appuser
USER appuser

EXPOSE 8000

# Run with uvicorn (listening on all interfaces)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]