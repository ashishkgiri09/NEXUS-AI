import os
from pathlib import Path
from typing import List, Dict, Any
from backend.workspace.manager import workspace_manager

def list_files(task_id: str, subpath: str = ".") -> List[str]:
    """Lists relative file paths inside the task's repository workspace."""
    repo_dir = (workspace_manager.get_task_dir(task_id) / "repository").resolve()
    target_dir = workspace_manager.resolve_safe_path(task_id, subpath)

    if not target_dir.exists():
        return []

    file_list = []
    for root, dirs, files in os.walk(target_dir):
        # Skip git and node_modules
        dirs[:] = [d for d in dirs if d not in [".git", "node_modules", ".next", "__pycache__", ".venv"]]
        for f in files:
            full_path = Path(root) / f
            rel_path = full_path.relative_to(repo_dir)
            file_list.append(str(rel_path).replace("\\", "/"))

    return file_list

def read_file(task_id: str, rel_path: str) -> str:
    """Reads content of a file inside the task repository sandbox."""
    file_path = workspace_manager.resolve_safe_path(task_id, rel_path)
    if not file_path.is_file():
        raise FileNotFoundError(f"File '{rel_path}' does not exist in task repository.")
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()

def write_file(task_id: str, rel_path: str, content: str) -> Dict[str, Any]:
    """Writes content to a file inside the task repository sandbox."""
    file_path = workspace_manager.resolve_safe_path(task_id, rel_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    return {"path": rel_path, "bytes_written": len(content), "status": "success"}

def edit_file(task_id: str, rel_path: str, old_str: str, new_str: str) -> Dict[str, Any]:
    """Replaces old_str with new_str inside target file."""
    content = read_file(task_id, rel_path)
    if old_str not in content:
        raise ValueError(f"Target text not found in file '{rel_path}'.")
    updated_content = content.replace(old_str, new_str, 1)
    write_file(task_id, rel_path, updated_content)
    return {"path": rel_path, "status": "updated"}

def search_code(task_id: str, query: str) -> List[Dict[str, Any]]:
    """Searches for a text query across all files in repository."""
    repo_dir = (workspace_manager.get_task_dir(task_id) / "repository").resolve()
    results = []
    files = list_files(task_id, ".")

    for rel_path in files:
        full_path = repo_dir / rel_path
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                for line_no, line in enumerate(f, start=1):
                    if query.lower() in line.lower():
                        results.append({
                            "file": rel_path,
                            "line": line_no,
                            "content": line.strip()
                        })
                        if len(results) >= 50:
                            return results
        except Exception:
            continue

    return results
