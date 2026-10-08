from typing import Dict, Any
from backend.workspace.docker_manager import docker_manager

def run_command(task_id: str, command: str, timeout: int = 60) -> Dict[str, Any]:
    """Runs a sandboxed shell command inside the task's repository folder."""
    return docker_manager.run_command(task_id=task_id, command=command, cwd_subpath="repository", timeout=timeout)

def install_dependency(task_id: str, package: str, package_manager: str = "npm") -> Dict[str, Any]:
    """Installs a dependency in the task workspace."""
    if package_manager == "npm":
        cmd = f"npm install {package}"
    elif package_manager == "pip":
        cmd = f"pip install {package}"
    else:
        cmd = f"{package_manager} install {package}"
    return run_command(task_id, cmd, timeout=120)
