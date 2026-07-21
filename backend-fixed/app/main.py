"""
Jewellery CRM - FastAPI Application Entry Point
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppException
from app.db.init_db import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifecycle: initialise DB on startup."""
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Jewellery CRM & Customer Journey Tracker API. "
        "Manage customer visits, track showroom journeys, "
        "handle sales, and analyze performance."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — must be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


# ---- Exception handlers ----
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {"message": exc.detail, "status_code": exc.status_code},
        },
        headers=exc.headers,
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    detail = str(exc) if settings.DEBUG else "An unexpected error occurred"
    # NOTE: unhandled exceptions bypass CORSMiddleware, so we must attach
    # CORS headers manually — otherwise the browser reports "Failed to fetch"
    # instead of showing the actual error message.
    origin = request.headers.get("origin", "")
    headers = {}
    if origin and (origin in (settings.cors_origins or []) or not settings.cors_origins):
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"message": detail, "status_code": 500},
        },
        headers=headers,
    )


# ---- Health & Root ----
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"])
async def root() -> dict:
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR,
    }
