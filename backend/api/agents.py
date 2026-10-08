import os
import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.database.models import (
    PRDDocument, Architecture, AgentRun, TestRun, TestResult, Screenshot, PullRequest, DebugReport, ReviewResult
)
from backend.workspace.manager import workspace_manager

router = APIRouter(prefix="/api/tasks/{task_id}", tags=["agents_and_artifacts"])

@router.get("/prd")
def get_task_prd(task_id: str, db: Session = Depends(get_db)):
    doc = db.query(PRDDocument).filter(PRDDocument.task_id == task_id).order_by(PRDDocument.created_at.desc()).first()
    if not doc:
        raise HTTPException(status_code=404, detail="PRD document not yet generated.")
    return {
        "id": doc.id,
        "task_id": doc.task_id,
        "title": doc.title,
        "summary": doc.summary,
        "requirements": json.loads(doc.requirements),
        "acceptance_criteria": json.loads(doc.acceptance_criteria),
        "definition_of_done": json.loads(doc.definition_of_done),
        "edge_cases": json.loads(doc.edge_cases) if doc.edge_cases else [],
        "approved": doc.approved,
        "created_at": str(doc.created_at)
    }

@router.get("/architecture")
def get_task_architecture(task_id: str, db: Session = Depends(get_db)):
    doc = db.query(Architecture).filter(Architecture.task_id == task_id).order_by(Architecture.created_at.desc()).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Architecture blueprint not yet generated.")
    return {
        "id": doc.id,
        "task_id": doc.task_id,
        "summary": doc.summary,
        "architecture": doc.architecture,
        "files_to_modify": json.loads(doc.files_to_modify),
        "files_to_create": json.loads(doc.files_to_create),
        "dependencies": json.loads(doc.dependencies) if doc.dependencies else [],
        "implementation_steps": json.loads(doc.implementation_steps),
        "risks": json.loads(doc.risks) if doc.risks else [],
        "approved": doc.approved,
        "created_at": str(doc.created_at)
    }

@router.get("/agents")
def get_task_agents(task_id: str, db: Session = Depends(get_db)):
    runs = db.query(AgentRun).filter(AgentRun.task_id == task_id).order_by(AgentRun.started_at.asc()).all()
    return [
        {
            "id": r.id,
            "agent_name": r.agent_name,
            "status": r.status,
            "input_summary": r.input_summary,
            "output_summary": r.output_summary,
            "tool_calls": json.loads(r.tool_calls) if r.tool_calls else [],
            "error": r.error,
            "started_at": str(r.started_at),
            "completed_at": str(r.completed_at) if r.completed_at else None
        }
        for r in runs
    ]

@router.get("/logs")
def get_task_logs(task_id: str, db: Session = Depends(get_db)):
    from backend.orchestrator.events import manager
    events = manager.task_event_history.get(task_id, [])
    return {"task_id": task_id, "logs": events}

@router.get("/tests")
def get_task_tests(task_id: str, db: Session = Depends(get_db)):
    runs = db.query(TestRun).filter(TestRun.task_id == task_id).order_by(TestRun.created_at.desc()).all()
    result_list = []
    for r in runs:
        items = db.query(TestResult).filter(TestResult.test_run_id == r.id).all()
        result_list.append({
            "id": r.id,
            "status": r.status,
            "total_tests": r.total_tests,
            "passed_tests": r.passed_tests,
            "failed_tests": r.failed_tests,
            "created_at": str(r.created_at),
            "results": [
                {
                    "requirement": item.requirement,
                    "status": item.status,
                    "evidence": item.evidence,
                    "screenshot_url": item.screenshot_url
                }
                for item in items
            ]
        })
    return result_list

@router.get("/debug")
def get_task_debug(task_id: str, db: Session = Depends(get_db)):
    reports = db.query(DebugReport).filter(DebugReport.task_id == task_id).order_by(DebugReport.created_at.desc()).all()
    return [
        {
            "id": rep.id,
            "root_cause": rep.root_cause,
            "affected_files": json.loads(rep.affected_files),
            "explanation": rep.explanation,
            "fix_plan": json.loads(rep.fix_plan),
            "severity": rep.severity,
            "created_at": str(rep.created_at)
        }
        for rep in reports
    ]

@router.get("/review")
def get_task_review(task_id: str, db: Session = Depends(get_db)):
    rev = db.query(ReviewResult).filter(ReviewResult.task_id == task_id).order_by(ReviewResult.created_at.desc()).first()
    if not rev:
        return None
    return {
        "id": rev.id,
        "status": rev.status,
        "summary": rev.summary,
        "issues": json.loads(rev.issues) if rev.issues else [],
        "recommendations": json.loads(rev.recommendations) if rev.recommendations else [],
        "created_at": str(rev.created_at)
    }

@router.get("/screenshots")
def get_task_screenshots(task_id: str, db: Session = Depends(get_db)):
    screenshots = db.query(Screenshot).filter(Screenshot.task_id == task_id).order_by(Screenshot.created_at.asc()).all()
    return [
        {
            "id": s.id,
            "filename": s.filename,
            "step_description": s.step_description,
            "url": f"/api/tasks/{task_id}/screenshots/{s.filename}",
            "created_at": str(s.created_at)
        }
        for s in screenshots
    ]

@router.get("/screenshots/{filename}")
def serve_screenshot(task_id: str, filename: str):
    file_path = workspace_manager.get_task_dir(task_id) / "screenshots" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Screenshot not found")
    return FileResponse(str(file_path), media_type="image/png")

@router.get("/pull-request")
def get_task_pull_request(task_id: str, db: Session = Depends(get_db)):
    pr = db.query(PullRequest).filter(PullRequest.task_id == task_id).order_by(PullRequest.created_at.desc()).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not yet created.")
    return {
        "id": pr.id,
        "pr_number": pr.pr_number,
        "pr_url": pr.pr_url,
        "branch_name": pr.branch_name,
        "title": pr.title,
        "body": pr.body,
        "status": pr.status,
        "created_at": str(pr.created_at)
    }
