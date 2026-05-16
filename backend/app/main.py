from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.ai_interview import router as ai_interview_router
from app.api.routes.auth import router as auth_router
from app.api.routes.charts import router as charts_router
from app.api.routes.profiles import router as profiles_router
from app.api.routes.reports import router as reports_router
from app.api.routes.tarot import router as tarot_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401
from app.schemas.common import HealthResponse

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    setup_logging(debug=settings.DEBUG)

    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(auth_router)
    app.include_router(profiles_router)
    app.include_router(charts_router)
    app.include_router(reports_router)
    app.include_router(ai_interview_router)
    app.include_router(tarot_router)

    @app.on_event("startup")
    def create_tables_if_missing() -> None:
        try:
            Base.metadata.create_all(bind=engine)
        except Exception:
            logger.exception("Failed to initialize database schema on startup")

    @app.get("/", response_model=HealthResponse, tags=["system"])
    def root() -> HealthResponse:
        return HealthResponse(status="ok", app=settings.APP_NAME)

    @app.get("/healthz", response_model=HealthResponse, tags=["system"])
    def healthz() -> HealthResponse:
        return HealthResponse(status="ok", app=settings.APP_NAME)

    return app


app = create_app()
