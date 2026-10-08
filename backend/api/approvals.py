from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.database.models import Task
from backend.orchestrator.workflow import orchestrator

router = APIRouter(prefix="/api/tasks/{task_id}", tags=["approvals"])

class FeedbackRequest(BaseModel):
    feedback: Optional[str] = "Changes requested by user"

@router.post("/approve-prd")
async def approve_prd(task_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "PRD_PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Task is in '{task.status}', not awaiting PRD approval.")

    background_tasks.add_task(orchestrator.approve_prd, task_id)
    return {"status": "approved", "message": "PRD approved. Initiating Architecture generation."}

@router.post("/reject-prd")
async def reject_prd(task_id: str, req: FeedbackRequest, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await orchestrator.reject_prd(task_id, req.feedback)
    return {"status": "rejected", "message": "PRD rejected."}

@router.post("/approve-architecture")
async def approve_architecture(task_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "ARCHITECTURE_PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Task is in '{task.status}', not awaiting Architecture approval.")

    background_tasks.add_task(orchestrator.approve_architecture, task_id)
    return {"status": "approved", "message": "Architecture approved. Commencing autonomous development, browser testing, and verification."}

@router.post("/reject-architecture")
async def reject_architecture(task_id: str, req: FeedbackRequest, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await orchestrator.reject_architecture(task_id, req.feedback)
    return {"status": "rejected", "message": "Architecture rejected."}
