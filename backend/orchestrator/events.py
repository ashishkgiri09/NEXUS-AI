import asyncio
from typing import Dict, Set, Any
from datetime import datetime
from fastapi import WebSocket
from pydantic import BaseModel

class NexusEvent(BaseModel):
    task_id: str
    agent: str
    status: str
    message: str
    timestamp: str = ""
    data: Dict[str, Any] = {}

    def __init__(self, **data):
        super().__init__(**data)
        if not self.timestamp:
            self.timestamp = datetime.utcnow().strftime("%H:%M:%S")

class ConnectionManager:
    def __init__(self):
        # task_id -> set of WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # global event log per task for late-joining UI subscribers
        self.task_event_history: Dict[str, list] = {}

    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = set()
        self.active_connections[task_id].add(websocket)

        # Replay event history
        history = self.task_event_history.get(task_id, [])
        for event in history:
            try:
                await websocket.send_json(event)
            except Exception:
                pass

    def disconnect(self, websocket: WebSocket, task_id: str):
        if task_id in self.active_connections:
            self.active_connections[task_id].discard(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

    async def broadcast(self, task_id: str, agent: str, status: str, message: str, data: Dict[str, Any] = None):
        event = NexusEvent(
            task_id=task_id,
            agent=agent,
            status=status,
            message=message,
            data=data or {}
        ).dict()

        if task_id not in self.task_event_history:
            self.task_event_history[task_id] = []
        self.task_event_history[task_id].append(event)
        # Keep last 500 events
        if len(self.task_event_history[task_id]) > 500:
            self.task_event_history[task_id] = self.task_event_history[task_id][-500:]

        if task_id in self.active_connections:
            dead_sockets = set()
            for connection in self.active_connections[task_id]:
                try:
                    await connection.send_json(event)
                except Exception:
                    dead_sockets.add(connection)
            for dead in dead_sockets:
                self.active_connections[task_id].discard(dead)

manager = ConnectionManager()
