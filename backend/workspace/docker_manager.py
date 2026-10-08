import shutil
import subprocess
from typing import Dict, Any, Optional
from backend.config import settings
from backend.workspace.manager import workspace_manager

class DockerWorkspaceManager:
    def __init__(self):
        self.docker_available = self._check_docker()

    def _check_docker(self) -> bool:
        if not settings.USE_DOCKER:
            return False
        docker_bin = shutil.which("docker")
        if not docker_bin:
            return False
        try:
            res = subprocess.run(["docker", "info"], capture_output=True, timeout=5)
            return res.returncode == 0
        except Exception:
            return False

    def setup_workspace(self, task_id: str, repo_source: Optional[str] = None) -> Dict[str, str]:
        # Both docker and local workspace use the isolated directory layout
        paths = workspace_manager.create_workspace(task_id, repo_source)
        if self.docker_available:
            # If docker is running, we can spin up a container with volume mount
            container_name = f"nexus_workspace_{task_id}"
            try:
                subprocess.run([
                    "docker", "run", "-d",
                    "--name", container_name,
                    "-v", f"{paths['task_dir']}:/workspace",
                    "nexus-workspace:latest",
                    "tail", "-f", "/dev/null"
                ], capture_output=True, check=False)
            except Exception:
                pass
        return paths

    def run_command(self, task_id: str, command: str, cwd_subpath: str = "repository", timeout: int = 120) -> Dict[str, Any]:
        """
        Executes command either inside docker container or in the safe sandbox directory.
        """
        task_dir = workspace_manager.get_task_dir(task_id)
        exec_cwd = task_dir / cwd_subpath
        exec_cwd.mkdir(parents=True, exist_ok=True)

        if self.docker_available:
            container_name = f"nexus_workspace_{task_id}"
            try:
                res = subprocess.run(
                    ["docker", "exec", "-w", f"/workspace/{cwd_subpath}", container_name, "sh", "-c", command],
                    capture_output=True,
                    text=True,
                    timeout=timeout
                )
                return {
                    "returncode": res.returncode,
                    "stdout": res.stdout,
                    "stderr": res.stderr,
                    "success": res.returncode == 0
                }
            except Exception as e:
                return {
                    "returncode": -1,
                    "stdout": "",
                    "stderr": str(e),
                    "success": False
                }

        # Local sandboxed execution
        try:
            res = subprocess.run(
                command,
                cwd=str(exec_cwd),
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {
                "returncode": res.returncode,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "success": res.returncode == 0
            }
        except subprocess.TimeoutExpired:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": f"Command timed out after {timeout} seconds",
                "success": False
            }
        except Exception as e:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": str(e),
                "success": False
            }

docker_manager = DockerWorkspaceManager()
