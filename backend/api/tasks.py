import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.database.models import Task
from backend.orchestrator.workflow import orchestrator

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

class CreateTaskRequest(BaseModel):
    repository: str
    feature_request: str

class TaskResponse(BaseModel):
    id: str
    repository: str
    feature_request: str
    status: str
    current_agent: Optional[str] = None
    retry_count: int
    branch_name: Optional[str] = None
    github_pr_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str

@router.post("", response_model=TaskResponse)
async def create_task(req: CreateTaskRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    task = Task(
        repository=req.repository.strip(),
        feature_request=req.feature_request.strip(),
        status="CREATED"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Launch orchestrator in background
    background_tasks.add_task(orchestrator.start_task, task.id)

    return TaskResponse(
        id=task.id,
        repository=task.repository,
        feature_request=task.feature_request,
        status=task.status,
        current_agent=task.current_agent,
        retry_count=task.retry_count,
        branch_name=task.branch_name,
        github_pr_url=task.github_pr_url,
        error_message=task.error_message,
        created_at=str(task.created_at),
        updated_at=str(task.updated_at)
    )

@router.get("", response_model=List[TaskResponse])
def list_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    return [
        TaskResponse(
            id=t.id,
            repository=t.repository,
            feature_request=t.feature_request,
            status=t.status,
            current_agent=t.current_agent,
            retry_count=t.retry_count,
            branch_name=t.branch_name,
            github_pr_url=t.github_pr_url,
            error_message=t.error_message,
            created_at=str(t.created_at),
            updated_at=str(t.updated_at)
        )
        for t in tasks
    ]

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(
        id=task.id,
        repository=task.repository,
        feature_request=task.feature_request,
        status=task.status,
        current_agent=task.current_agent,
        retry_count=task.retry_count,
        branch_name=task.branch_name,
        github_pr_url=task.github_pr_url,
        error_message=task.error_message,
        created_at=str(task.created_at),
        updated_at=str(task.updated_at)
    )

@router.post("/{task_id}/cancel")
async def cancel_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await orchestrator.cancel_task(task_id)
    return {"status": "cancelled", "task_id": task_id}
