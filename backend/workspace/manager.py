import os
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from backend.config import settings

class WorkspaceManager:
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.WORKSPACE_BASE_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_task_dir(self, task_id: str) -> Path:
        return self.base_dir / f"task_{task_id}"

    def create_workspace(self, task_id: str, repo_source: Optional[str] = None) -> Dict[str, str]:
        """
        Creates an isolated workspace directory structure for the task:
        task_<id>/
          ├── repository/
          ├── logs/
          ├── screenshots/
          ├── test-results/
          └── artifacts/
        """
        task_dir = self.get_task_dir(task_id)
        repo_dir = task_dir / "repository"
        logs_dir = task_dir / "logs"
        screenshots_dir = task_dir / "screenshots"
        test_results_dir = task_dir / "test-results"
        artifacts_dir = task_dir / "artifacts"

        for directory in [repo_dir, logs_dir, screenshots_dir, test_results_dir, artifacts_dir]:
            directory.mkdir(parents=True, exist_ok=True)

        # Populate repository directory
        if repo_source:
            if repo_source.startswith("http://") or repo_source.startswith("https://") or repo_source.startswith("git@"):
                # Clone git repository
                try:
                    subprocess.run(
                        ["git", "clone", repo_source, str(repo_dir)],
                        check=True,
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                except Exception as e:
                    raise RuntimeError(f"Failed to clone repository {repo_source}: {str(e)}")
            elif os.path.exists(repo_source):
                # Copy from local sample repo
                shutil.copytree(repo_source, repo_dir, dirs_exist_ok=True)
            else:
                # Default initialize an empty repo
                subprocess.run(["git", "init"], cwd=str(repo_dir), check=False)
        else:
            # Check if sample_repo exists, copy it as default demo repo
            sample_repo_path = Path("sample_repo").resolve()
            if sample_repo_path.exists() and any(sample_repo_path.iterdir()):
                shutil.copytree(sample_repo_path, repo_dir, dirs_exist_ok=True)
            else:
                subprocess.run(["git", "init"], cwd=str(repo_dir), check=False)

        return {
            "task_dir": str(task_dir),
            "repository": str(repo_dir),
            "logs": str(logs_dir),
            "screenshots": str(screenshots_dir),
            "test_results": str(test_results_dir),
            "artifacts": str(artifacts_dir),
        }

    def resolve_safe_path(self, task_id: str, relative_path: str) -> Path:
        """
        Ensures target path is strictly within the repository sandbox.
        Prevents directory traversal attacks.
        """
        repo_dir = (self.get_task_dir(task_id) / "repository").resolve()
        target = (repo_dir / relative_path).resolve()
        if not str(target).startswith(str(repo_dir)):
            raise ValueError(f"Access denied: Path '{relative_path}' escapes workspace repository sandbox.")
        return target

    def cleanup_workspace(self, task_id: str):
        task_dir = self.get_task_dir(task_id)
        if task_dir.exists():
            shutil.rmtree(task_dir, ignore_errors=True)

workspace_manager = WorkspaceManager()
