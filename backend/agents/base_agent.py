import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from openai import OpenAI
from backend.config import settings
from backend.database.database import SessionLocal
from backend.database.models import AgentRun
from backend.orchestrator.events import manager

logger = logging.getLogger("nexus.agent")

class BaseAgent:
    def __init__(self, name: str, role_description: str):
        self.name = name
        self.role_description = role_description
        self.client: Optional[OpenAI] = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL if settings.OPENAI_BASE_URL else None
            )

    async def emit_progress(self, task_id: str, status: str, message: str, data: Dict[str, Any] = None):
        """Emits real-time event to connected frontend WebSockets."""
        logger.info(f"[{self.name}][{task_id}] {status}: {message}")
        await manager.broadcast(
            task_id=task_id,
            agent=self.name,
            status=status,
            message=message,
            data=data or {}
        )

    def log_run_start(self, task_id: str, input_summary: str) -> str:
        db = SessionLocal()
        try:
            run = AgentRun(
                task_id=task_id,
                agent_name=self.name,
                status="started",
                input_summary=input_summary,
                tool_calls="[]"
            )
            db.add(run)
            db.commit()
            db.refresh(run)
            return run.id
        finally:
            db.close()

    def log_run_complete(self, run_id: str, output_summary: str, tool_calls: List[Dict[str, Any]] = None, status: str = "completed", error: Optional[str] = None):
        db = SessionLocal()
        try:
            run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
            if run:
                run.status = status
                run.output_summary = output_summary
                if tool_calls:
                    run.tool_calls = json.dumps(tool_calls)
                run.error = error
                run.completed_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()

    def call_llm_json(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """
        Calls OpenAI API with JSON mode if client exists.
        Raises error if API call fails or key is missing.
        """
        if not self.client:
            raise ValueError("OPENAI_API_KEY is not configured.")

        response = self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt + "\nAlways output valid structured JSON."},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )
        content = response.choices[0].message.content
        return json.loads(content)
