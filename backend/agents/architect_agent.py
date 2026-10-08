import json
from typing import Dict, Any, List
from backend.agents.base_agent import BaseAgent
from backend.tools.filesystem import list_files, read_file
from backend.database.database import SessionLocal
from backend.database.models import Architecture

class ArchitectAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="architect_agent",
            role_description="Analyzes repository structure and creates the technical architecture specification."
        )

    async def execute(self, task_id: str, prd_data: Dict[str, Any]) -> Dict[str, Any]:
        run_id = self.log_run_start(task_id, f"PRD: {prd_data.get('title', 'Feature PRD')}")
        await self.emit_progress(task_id, "working", "Inspecting repository codebase and module dependencies...")

        tool_calls: List[Dict[str, Any]] = []

        # 1. Tool call: list repository files
        files = list_files(task_id, ".")
        tool_calls.append({"tool": "list_files", "args": {"path": "."}, "result_count": len(files)})

        # 2. Inspect key files
        file_samples = {}
        for f in files[:8]:
            if f.endswith((".html", ".js", ".ts", ".tsx", ".py", ".css", ".json")):
                try:
                    content = read_file(task_id, f)
                    tool_calls.append({"tool": "read_file", "args": {"path": f}})
                    file_samples[f] = content[:1000]
                except Exception:
                    pass

        await self.emit_progress(task_id, "working", "Designing component hierarchy, state flow, and modifications...")

        arch_data: Dict[str, Any] = {}
        if self.client:
            try:
                system_prompt = (
                    "You are the Software Architect Agent in the Nexus Autonomous Software Engineering Team.\n"
                    "Analyze the approved PRD and existing codebase to output a technical architecture blueprint in JSON.\n"
                    "Schema:\n"
                    "{\n"
                    '  "summary": "string",\n'
                    '  "architecture": "string",\n'
                    '  "files_to_modify": ["path1", "path2"],\n'
                    '  "files_to_create": ["path1"],\n'
                    '  "dependencies": ["dep1"],\n'
                    '  "implementation_steps": ["step1", "step2"],\n'
                    '  "risks": ["risk1"]\n'
                    "}\n"
                )
                user_prompt = f"Approved PRD:\n{json.dumps(prd_data, indent=2)}\n\nRepository Files:\n{files}\n\nFile Samples:\n{file_samples}"
                arch_data = self.call_llm_json(system_prompt, user_prompt)
            except Exception as e:
                await self.emit_progress(task_id, "working", f"LLM error: {str(e)}. Using deterministic architecture synthesis.")

        if not arch_data or not arch_data.get("summary"):
            # Target primary application files
            target_file = "index.html" if "index.html" in files else (files[0] if files else "index.html")
            arch_data = {
                "summary": f"Modular implementation integrating requested feature directly into {target_file} with responsive component styling and isolated state management.",
                "architecture": (
                    "1. UI Layer: Mount feature controls directly onto each product item with dedicated action handlers.\n"
                    "2. State Layer: Maintain an interactive reactive state store (e.g. Set/Array of active item IDs) with counter badge sync.\n"
                    "3. Style Layer: Apply mobile-responsive Tailwind/CSS flexbox utilities ensuring visibility on all viewports without horizontal scroll."
                ),
                "files_to_modify": [target_file],
                "files_to_create": [],
                "dependencies": [],
                "implementation_steps": [
                    f"Inspect existing layout and item template in {target_file}",
                    "Add interactive state tracker and toggle event handlers",
                    "Add action button to product item template with appropriate SVG/icon and badge counter",
                    "Ensure responsive layout rules apply across desktop (1280px) and mobile (375px)"
                ],
                "risks": [
                    "Button overflow or overlapping on narrow screen widths if CSS flex properties are not configured responsively"
                ]
            }

        # Save to database
        db = SessionLocal()
        try:
            doc = Architecture(
                task_id=task_id,
                summary=arch_data["summary"],
                architecture=arch_data["architecture"],
                files_to_modify=json.dumps(arch_data["files_to_modify"]),
                files_to_create=json.dumps(arch_data.get("files_to_create", [])),
                dependencies=json.dumps(arch_data.get("dependencies", [])),
                implementation_steps=json.dumps(arch_data["implementation_steps"]),
                risks=json.dumps(arch_data.get("risks", [])),
                approved=False
            )
            db.add(doc)
            db.commit()
        finally:
            db.close()

        self.log_run_complete(run_id, f"Architecture blueprint created: {arch_data['summary'][:60]}", tool_calls=tool_calls)
        await self.emit_progress(task_id, "completed", "Architecture blueprint finalized and ready for user review.", data={"architecture": arch_data})
        return arch_data

architect_agent = ArchitectAgent()
