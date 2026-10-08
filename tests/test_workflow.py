import os
import pytest
import asyncio
from pathlib import Path
from backend.database.database import init_db, SessionLocal
from backend.database.models import Task, PRDDocument, Architecture, TestRun, DebugReport, ReviewResult, PullRequest
from backend.orchestrator.workflow import orchestrator
from backend.orchestrator.state import TaskState

def test_end_to_end_orchestrator_flow():
    async def run_flow():
        # 1. Initialize DB
        init_db()
        db = SessionLocal()

        # 2. Create Task with sample repo
        sample_path = str(Path("sample_repo").resolve())
        task = Task(
            repository=sample_path,
            feature_request="Add a wishlist button to every product card with live counter badge.",
            status="CREATED"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        task_id = task.id
        db.close()

        # 3. Start task -> PRD generation
        await orchestrator.start_task(task_id)

        db = SessionLocal()
        t = db.query(Task).filter(Task.id == task_id).first()
        assert t.status == TaskState.PRD_PENDING_APPROVAL.value
        prd = db.query(PRDDocument).filter(PRDDocument.task_id == task_id).first()
        assert prd is not None
        assert len(prd.title) > 0
        db.close()

        # 4. Human Approval Gate 1: Approve PRD
        await orchestrator.approve_prd(task_id)

        db = SessionLocal()
        t = db.query(Task).filter(Task.id == task_id).first()
        assert t.status == TaskState.ARCHITECTURE_PENDING_APPROVAL.value
        arch = db.query(Architecture).filter(Architecture.task_id == task_id).first()
        assert arch is not None
        assert len(arch.summary) > 0
        db.close()

        # 5. Human Approval Gate 2: Approve Architecture -> Full Autonomous Execution
        # Runs Development -> Testing (fails on mobile) -> Debug -> Fix -> Retesting (passes) -> Review -> PR
        await orchestrator.approve_architecture(task_id)

        db = SessionLocal()
        final_task = db.query(Task).filter(Task.id == task_id).first()
        assert final_task.status == TaskState.COMPLETED.value
        assert final_task.retry_count >= 1

        # Check that debug report was filed
        debug_rep = db.query(DebugReport).filter(DebugReport.task_id == task_id).first()
        assert debug_rep is not None
        assert "hidden" in debug_rep.root_cause.lower() or "mobile" in debug_rep.root_cause.lower()

        # Check review was approved
        review = db.query(ReviewResult).filter(ReviewResult.task_id == task_id).first()
        assert review is not None
        assert review.status == "approved"

        # Check pull request was created
        pr = db.query(PullRequest).filter(PullRequest.task_id == task_id).first()
        assert pr is not None
        assert len(pr.pr_url) > 0

        db.close()

    asyncio.run(run_flow())
