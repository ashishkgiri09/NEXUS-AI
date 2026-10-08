import os
import time
import socket
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from typing import Dict, Any, Optional
from backend.workspace.manager import workspace_manager
from backend.tools.browser import BrowserService

class AppServerManager:
    """Manages application server process inside task repository."""
    def __init__(self):
        self.active_servers: Dict[str, Any] = {}

    def find_free_port(self) -> int:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            return s.getsockname()[1]

    def start_app(self, task_id: str) -> Dict[str, Any]:
        """
        Starts the application server inside the task repository.
        Serves the workspace web application on a dedicated free port.
        """
        if task_id in self.active_servers:
            return self.active_servers[task_id]

        repo_dir = (workspace_manager.get_task_dir(task_id) / "repository").resolve()
        port = self.find_free_port()

        # Custom HTTP handler to serve repository files
        class Handler(SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(repo_dir), **kwargs)

            def log_message(self, format, *args):
                # Silence standard logging to keep terminal clean
                pass

        server = HTTPServer(('127.0.0.1', port), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        server_info = {
            "port": port,
            "url": f"http://127.0.0.1:{port}",
            "server": server,
            "thread": thread
        }
        self.active_servers[task_id] = server_info
        time.sleep(0.5)  # Allow server socket to bind
        return server_info

    def stop_app(self, task_id: str):
        if task_id in self.active_servers:
            try:
                self.active_servers[task_id]["server"].shutdown()
            except Exception:
                pass
            del self.active_servers[task_id]

app_server_manager = AppServerManager()
