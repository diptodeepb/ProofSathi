"""ProofSathi FastAPI main application entrypoint."""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.repositories.mongo import db_manager
from app.fixtures_generator import ensure_fixtures_generated

# Import API Routers
from app.api.health import router as health_router
from app.api.preferences import router as preferences_router
from app.api.documents import router as documents_router
from app.api.bills import router as bills_router
from app.api.actions import router as actions_router
from app.api.speech import router as speech_router
from app.api.fixtures import router as fixtures_router
from app.api.payments import router as payments_router

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger("proofsathi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting ProofSathi API...")
    db_manager.connect()
    try:
        ensure_fixtures_generated()
    except Exception as e:
        logger.warning(f"Could not generate initial fixtures: {e}")
    yield
    # Shutdown
    logger.info("Shutting down ProofSathi API...")
    db_manager.close()


app = FastAPI(
    title="ProofSathi API",
    version="0.1.0",
    description="Multilingual document assistant API for older adults in India.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID"],
)


# Standard Error Handling matching Section 16 specification
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        err_dict = exc.detail
    else:
        err_dict = {
            "code": "HTTP_ERROR",
            "message": str(exc.detail),
            "retryable": exc.status_code >= 500,
        }
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": err_dict},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The submitted request format was invalid.",
                "details": exc.errors(),
                "retryable": False,
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected server error occurred. Please try again.",
                "retryable": True,
            }
        },
    )


# Mount API V1 routes
api_prefix = settings.api_prefix  # "/api/v1"
app.include_router(health_router, prefix=api_prefix)
app.include_router(preferences_router, prefix=api_prefix)
app.include_router(documents_router, prefix=api_prefix)
app.include_router(bills_router, prefix=api_prefix)
app.include_router(actions_router, prefix=api_prefix)
app.include_router(speech_router, prefix=api_prefix)
app.include_router(fixtures_router, prefix=api_prefix)
app.include_router(payments_router, prefix=api_prefix)
