import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    repository = Column(String(255), nullable=False)
    feature_request = Column(Text, nullable=False)
    status = Column(String(64), default="CREATED")
    current_agent = Column(String(64), nullable=True)
    retry_count = Column(Integer, default=0)
    branch_name = Column(String(128), nullable=True)
    github_pr_url = Column(String(512), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agent_runs = relationship("AgentRun", back_populates="task", cascade="all, delete-orphan")
    prd_documents = relationship("PRDDocument", back_populates="task", cascade="all, delete-orphan")
    architectures = relationship("Architecture", back_populates="task", cascade="all, delete-orphan")
    test_runs = relationship("TestRun", back_populates="task", cascade="all, delete-orphan")
    debug_reports = relationship("DebugReport", back_populates="task", cascade="all, delete-orphan")
    review_results = relationship("ReviewResult", back_populates="task", cascade="all, delete-orphan")
    screenshots = relationship("Screenshot", back_populates="task", cascade="all, delete-orphan")
    pull_requests = relationship("PullRequest", back_populates="task", cascade="all, delete-orphan")

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    agent_name = Column(String(64), nullable=False)
    status = Column(String(32), default="started")  # started, working, completed, failed
    input_summary = Column(Text, nullable=True)
    output_summary = Column(Text, nullable=True)
    tool_calls = Column(Text, nullable=True)  # JSON string
    error = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    task = relationship("Task", back_populates="agent_runs")

class PRDDocument(Base):
    __tablename__ = "prd_documents"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)  # JSON
    acceptance_criteria = Column(Text, nullable=False)  # JSON
    definition_of_done = Column(Text, nullable=False)  # JSON
    edge_cases = Column(Text, nullable=True)  # JSON
    approved = Column(Boolean, default=False)
    user_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="prd_documents")

class Architecture(Base):
    __tablename__ = "architectures"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    summary = Column(Text, nullable=False)
    architecture = Column(Text, nullable=False)
    files_to_modify = Column(Text, nullable=False)  # JSON
    files_to_create = Column(Text, nullable=False)  # JSON
    dependencies = Column(Text, nullable=True)  # JSON
    implementation_steps = Column(Text, nullable=False)  # JSON
    risks = Column(Text, nullable=True)  # JSON
    approved = Column(Boolean, default=False)
    user_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="architectures")

class TestRun(Base):
    __tablename__ = "test_runs"
    __test__ = False

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    status = Column(String(32), default="pending")  # passed, failed, error
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="test_runs")
    results = relationship("TestResult", back_populates="test_run", cascade="all, delete-orphan")

class TestResult(Base):
    __tablename__ = "test_results"
    __test__ = False

    id = Column(String(64), primary_key=True, default=generate_uuid)
    test_run_id = Column(String(64), ForeignKey("test_runs.id"), nullable=False)
    task_id = Column(String(64), nullable=False)
    requirement = Column(Text, nullable=False)
    status = Column(String(32), nullable=False)  # passed, failed
    evidence = Column(Text, nullable=True)
    screenshot_url = Column(String(512), nullable=True)

    test_run = relationship("TestRun", back_populates="results")

class DebugReport(Base):
    __tablename__ = "debug_reports"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    root_cause = Column(Text, nullable=False)
    affected_files = Column(Text, nullable=False)  # JSON
    explanation = Column(Text, nullable=False)
    fix_plan = Column(Text, nullable=False)  # JSON
    severity = Column(String(32), default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="debug_reports")

class ReviewResult(Base):
    __tablename__ = "review_results"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    status = Column(String(32), nullable=False)  # approved, rejected
    summary = Column(Text, nullable=False)
    issues = Column(Text, nullable=True)  # JSON
    recommendations = Column(Text, nullable=True)  # JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="review_results")

class Screenshot(Base):
    __tablename__ = "screenshots"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)
    step_description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="screenshots")

class PullRequest(Base):
    __tablename__ = "pull_requests"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("tasks.id"), nullable=False)
    pr_number = Column(Integer, nullable=True)
    pr_url = Column(String(512), nullable=False)
    branch_name = Column(String(128), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(32), default="open")
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="pull_requests")
