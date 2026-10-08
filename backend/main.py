import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database.database import init_db
from backend.api.tasks import router as tasks_router
from backend.api.approvals import router as approvals_router
from backend.api.agents import router as agents_router
from backend.api.repositories import router as repositories_router
from backend.api.websocket import router as websocket_router

app = FastAPI(
    title="Nexus — Autonomous AI Software Engineering Platform",
    description="Backend Orchestrator and Multi-Agent Execution Engine",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database schema
init_db()

# Mount API routers
app.include_router(tasks_router)
app.include_router(approvals_router)
app.include_router(agents_router)
app.include_router(repositories_router)
app.include_router(websocket_router)

@app.get("/")
def read_root():
    return {
        "platform": "Nexus",
        "tagline": "Autonomous AI Software Engineering Team",
        "status": "online",
        "version": "1.0.0",
        "demo_mode": settings.DEMO_MODE,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "github_configured": bool(settings.GITHUB_TOKEN),
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
