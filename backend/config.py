import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_BASE_URL: Optional[str] = None
    GITHUB_TOKEN: str = ""
    DATABASE_URL: str = "sqlite:///./nexus.db"
    WORKSPACE_BASE_DIR: str = "./workspaces"
    USE_DOCKER: bool = False
    MAX_RETRIES: int = 3
    DEMO_MODE: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
