import subprocess
from typing import Dict, Any
from backend.workspace.manager import workspace_manager

def _run_git(task_id: str, args: list) -> subprocess.CompletedProcess:
    repo_dir = workspace_manager.get_task_dir(task_id) / "repository"
    return subprocess.run(
        ["git"] + args,
        cwd=str(repo_dir),
        capture_output=True,
        text=True
    )

def init_or_branch(task_id: str, branch_name: str) -> Dict[str, Any]:
    # Ensure git is initialized and create/checkout branch
    res = _run_git(task_id, ["status"])
    if res.returncode != 0:
        _run_git(task_id, ["init"])
        _run_git(task_id, ["config", "user.name", "Nexus Agent"])
        _run_git(task_id, ["config", "user.email", "agent@nexus.ai"])
        _run_git(task_id, ["add", "."])
        _run_git(task_id, ["commit", "-m", "Initial baseline commit"])

    _run_git(task_id, ["checkout", "-b", branch_name])
    return {"branch": branch_name, "status": "checked_out"}

def git_diff(task_id: str) -> str:
    """Returns the git diff of uncommitted or committed changes."""
    res = _run_git(task_id, ["diff", "HEAD~1"])
    if res.returncode == 0 and res.stdout.strip():
        return res.stdout
    # Try diff of working tree against HEAD
    res2 = _run_git(task_id, ["diff", "HEAD"])
    if res2.returncode == 0 and res2.stdout.strip():
        return res2.stdout
    # Fallback to unstaged diff
    res3 = _run_git(task_id, ["diff"])
    return res3.stdout

def git_commit(task_id: str, message: str) -> Dict[str, Any]:
    _run_git(task_id, ["config", "user.name", "Nexus Autonomous Agent"])
    _run_git(task_id, ["config", "user.email", "nexus@ai.dev"])
    _run_git(task_id, ["add", "."])
    res = _run_git(task_id, ["commit", "-m", message])
    return {
        "success": res.returncode == 0,
        "stdout": res.stdout,
        "stderr": res.stderr
    }

def git_push(task_id: str, branch_name: str, remote: str = "origin") -> Dict[str, Any]:
    res = _run_git(task_id, ["push", "-u", remote, branch_name])
    return {
        "success": res.returncode == 0,
        "stdout": res.stdout,
        "stderr": res.stderr
    }
