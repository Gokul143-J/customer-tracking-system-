"""
Jewellery CRM - Application Configuration
==========================================
Centralized configuration using Pydantic BaseSettings.
All values are loaded from environment variables or .env file.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Application ----
    APP_NAME: str = "Jewellery CRM"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # ---- Server ----
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    # ---- Database ----
    DATABASE_URL: str = "postgresql+asyncpg://jewellery_admin:jewellery_secure_2026@localhost:5432/jewellery_crm"

    @property
    def sync_database_url(self) -> str:
        """Convert async database URL to sync for Alembic migrations."""
        url = self.DATABASE_URL
        if "postgresql+asyncpg" in url:
            return url.replace("postgresql+asyncpg", "postgresql+psycopg2")
        if "sqlite+aiosqlite" in url:
            return url.replace("sqlite+aiosqlite", "sqlite")
        return url

    # ---- Redis ----
    REDIS_URL: str = "redis://localhost:6379/0"

    # ---- JWT Authentication ----
    JWT_SECRET_KEY: str = "change-this-in-production-please-use-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---- First Admin (Seeding) ----
    FIRST_ADMIN_EMAIL: str = "admin@jewellerycrm.com"
    FIRST_ADMIN_PASSWORD: str = "Admin@2026!Secure"

    # ---- Email ----
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@jewellerycrm.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    # ---- Store Defaults ----
    DEFAULT_STORE_NAME: str = "Royal Jewellers"
    DEFAULT_STORE_GST: str = ""


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance. Uses lru_cache to avoid re-reading
    environment variables on every request.
    """
    return Settings()
