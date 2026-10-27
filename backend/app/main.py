from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, auth, code_submissions, dashboards, experiments, instructor, quizzes


def create_app() -> FastAPI:
    # The interactive API docs are switched off in production.
    docs_enabled = settings.ENV != "production"
    application = FastAPI(
        title="ML Virtual Lab API",
        version="0.1.0",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(auth.router)
    application.include_router(admin.router)
    application.include_router(experiments.router)
    application.include_router(quizzes.router)
    application.include_router(code_submissions.router)
    application.include_router(dashboards.router)
    application.include_router(instructor.router)

    @application.get("/health")
    def health_check():
        return {"status": "ok"}

    return application


app = create_app()
