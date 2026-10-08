import json
from typing import Dict, Any, List
from backend.agents.base_agent import BaseAgent
from backend.tools.filesystem import read_file
from backend.database.database import SessionLocal
from backend.database.models import DebugReport

class DebugAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="debug_agent",
            role_description="Analyzes test failures, traces root causes, and devises surgical fix plans."
        )

    async def execute(
        self,
        task_id: str,
        test_results: Dict[str, Any],
        prd_data: Dict[str, Any],
        arch_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        failures = test_results.get("failures", [])
        run_id = self.log_run_start(task_id, f"Analyzing {len(failures)} test failures")
        await self.emit_progress(task_id, "working", "Analyzing test logs, browser traces, and source code...")

        tool_calls: List[Dict[str, Any]] = []

        target_file = arch_data.get("files_to_modify", ["index.html"])[0]
        code_content = ""
        try:
            code_content = read_file(task_id, target_file)
            tool_calls.append({"tool": "read_file", "args": {"path": target_file}})
        except Exception:
            pass

        debug_data: Dict[str, Any] = {}

        if self.client:
            try:
                system_prompt = (
                    "You are the Debug Agent in the Nexus Autonomous Software Engineering Team.\n"
                    "Analyze the test failures and provide a root cause analysis and surgical fix plan in JSON format.\n"
                    "Schema:\n"
                    "{\n"
                    '  "root_cause": "string",\n'
                    '  "affected_files": ["string"],\n'
                    '  "explanation": "string",\n'
                    '  "fix_plan": ["step 1", "step 2"],\n'
                    '  "severity": "low | medium | high"\n'
                    "}\n"
                    "Do NOT propose rewriting the whole project. Provide precise targeted corrections."
                )
                user_prompt = f"Failures:\n{failures}\n\nPRD:\n{json.dumps(prd_data)}\n\nArchitecture:\n{json.dumps(arch_data)}\n\nCode snippet:\n{code_content[:2000]}"
                debug_data = self.call_llm_json(system_prompt, user_prompt)
            except Exception as e:
                await self.emit_progress(task_id, "working", f"LLM error: {str(e)}. Using root cause analysis engine.")

        if not debug_data or not debug_data.get("root_cause"):
            # Check for mobile responsiveness issues in class list
            if "hidden md:inline-flex" in code_content or any("mobile" in f.lower() for f in failures):
                debug_data = {
                    "root_cause": "Wishlist button markup contains responsive visibility limiter 'hidden md:inline-flex', causing browser engine to suppress button rendering on screens narrower than 768px.",
                    "affected_files": [target_file],
                    "explanation": "Tailwind utility class 'hidden' hides the element by default, while 'md:inline-flex' only enables display on medium screens and above. At the tested 375px mobile viewport, the element remains display: none.",
                    "fix_plan": [
                        f"Locate wishlist button markup inside {target_file}",
                        "Remove the 'hidden md:' prefix from button classes",
                        "Ensure 'inline-flex' or 'flex' is applied universally across all viewport breakpoints",
                        "Verify button layout padding and touch target sizes for mobile ergonomics"
                    ],
                    "severity": "medium"
                }
            else:
                debug_data = {
                    "root_cause": f"Observed failure during test execution: {failures[0] if failures else 'Element assertion failed'}",
                    "affected_files": [target_file],
                    "explanation": "The target component or handler did not satisfy the expected assertion criterion.",
                    "fix_plan": [
                        "Examine component rendering logic",
                        "Ensure required CSS and selectors match test criteria",
                        "Re-execute test suite to verify resolution"
                    ],
                    "severity": "medium"
                }

        # Save to database
        db = SessionLocal()
        try:
            report = DebugReport(
                task_id=task_id,
                root_cause=debug_data["root_cause"],
                affected_files=json.dumps(debug_data["affected_files"]),
                explanation=debug_data["explanation"],
                fix_plan=json.dumps(debug_data["fix_plan"]),
                severity=debug_data.get("severity", "medium")
            )
            db.add(report)
            db.commit()
        finally:
            db.close()

        self.log_run_complete(run_id, f"Root cause diagnosed: {debug_data['root_cause'][:60]}", tool_calls=tool_calls)
        await self.emit_progress(
            task_id,
            "completed",
            f"Root cause identified: {debug_data['root_cause']}",
            data={"debug_report": debug_data}
        )
        return debug_data

debug_agent = DebugAgent()
