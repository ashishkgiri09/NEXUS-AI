import json
from typing import Dict, Any, List
from backend.agents.base_agent import BaseAgent
from backend.tools.filesystem import list_files, read_file
from backend.database.database import SessionLocal
from backend.database.models import PRDDocument

class PRDAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="prd_agent",
            role_description="Transforms user feature requests into structured Product Requirements Documents."
        )

    async def execute(self, task_id: str, feature_request: str) -> Dict[str, Any]:
        run_id = self.log_run_start(task_id, f"Feature Request: {feature_request}")
        await self.emit_progress(task_id, "working", "Analyzing feature request and repository file tree...")

        tool_calls: List[Dict[str, Any]] = []

        # 1. Tool call: list repository files
        files = list_files(task_id, ".")
        tool_calls.append({"tool": "list_files", "args": {"path": "."}, "result_count": len(files)})
        await self.emit_progress(task_id, "working", f"Discovered {len(files)} files in repository")

        # 2. Tool call: read key files for context if available
        repo_context = ""
        for key_file in ["index.html", "package.json", "README.md", "App.tsx", "main.py"]:
            if key_file in files:
                try:
                    content = read_file(task_id, key_file)
                    tool_calls.append({"tool": "read_file", "args": {"path": key_file}})
                    repo_context += f"\n--- {key_file} ---\n" + content[:1500]
                except Exception:
                    pass

        await self.emit_progress(task_id, "working", "Synthesizing product requirements & acceptance criteria...")

        prd_data: Dict[str, Any] = {}
        if self.client:
            try:
                system_prompt = (
                    "You are the Lead PRD Agent in the Nexus Autonomous Software Engineering Team.\n"
                    "Your job is to generate a comprehensive Product Requirements Document (PRD) in JSON format.\n"
                    "Schema:\n"
                    "{\n"
                    '  "title": "string",\n'
                    '  "summary": "string",\n'
                    '  "requirements": ["req1", "req2", ...],\n'
                    '  "acceptance_criteria": ["ac1", "ac2", ...],\n'
                    '  "definition_of_done": ["dod1", "dod2", ...],\n'
                    '  "edge_cases": ["ec1", "ec2", ...]\n'
                    "}\n"
                    "Do NOT propose altering existing core architecture unnecessarily."
                )
                user_prompt = f"Feature Request: {feature_request}\n\nRepository Context:\n{repo_context}\n\nRepository Files:\n{files}"
                prd_data = self.call_llm_json(system_prompt, user_prompt)
            except Exception as e:
                await self.emit_progress(task_id, "working", f"LLM error: {str(e)}. Falling back to deterministic synthesizer.")

        if not prd_data or not prd_data.get("title"):
            # Clean structured synthesis
            title = f"PRD: {feature_request[:60]}"
            prd_data = {
                "title": title,
                "summary": f"Specification to implement: {feature_request}. Seamlessly integrate functionality into the existing application with responsive design and state persistence.",
                "requirements": [
                    f"Implement user-facing functionality for: {feature_request}",
                    "Maintain seamless integration with existing UI components and responsive styling",
                    "Ensure interactive state updates smoothly upon user interaction",
                    "Support responsive viewport display including mobile screen widths (375px+)"
                ],
                "acceptance_criteria": [
                    "Feature UI controls are clearly visible and clickable on every product item",
                    "User interaction toggles active state and updates visual counter or indicator",
                    "Controls remain fully visible and usable on mobile viewports without horizontal clipping",
                    "Application loads cleanly without console errors or layout breaks"
                ],
                "definition_of_done": [
                    "Code implemented strictly within repository architecture",
                    "Browser automation tests pass for desktop and mobile viewports",
                    "No visual regressions introduced to existing layout",
                    "All code formatted and ready for pull request"
                ],
                "edge_cases": [
                    "Rapid consecutive clicking on interaction buttons",
                    "Viewport resizing between desktop (1280px) and mobile (375px)",
                    "Handling empty state when no items are selected"
                ]
            }

        # Save to database
        db = SessionLocal()
        try:
            doc = PRDDocument(
                task_id=task_id,
                title=prd_data["title"],
                summary=prd_data["summary"],
                requirements=json.dumps(prd_data["requirements"]),
                acceptance_criteria=json.dumps(prd_data["acceptance_criteria"]),
                definition_of_done=json.dumps(prd_data["definition_of_done"]),
                edge_cases=json.dumps(prd_data.get("edge_cases", [])),
                approved=False
            )
            db.add(doc)
            db.commit()
        finally:
            db.close()

        self.log_run_complete(run_id, f"Generated PRD: {prd_data['title']}", tool_calls=tool_calls)
        await self.emit_progress(task_id, "completed", f"PRD generated: '{prd_data['title']}'", data={"prd": prd_data})
        return prd_data

prd_agent = PRDAgent()
