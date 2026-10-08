# Nexus — Autonomous AI Software Engineering Team

> **Nexus** is an autonomous full-stack software engineering platform that coordinates a specialized team of **six AI agents** to take high-level natural language feature requests from inception to verified production-ready GitHub Pull Requests.

---

## 1. Problem

Traditional AI coding assistants act primarily as passive autocomplete plugins or single-turn prompt generators:
- **Lack of Verification**: They write unverified code that may fail to compile, break layouts, or fail responsive tests.
- **No Test Execution**: They do not run the application or test it in a real browser.
- **No Self-Correction**: When bugs occur, developers must manually troubleshoot and explain the error back to the LLM.
- **Uncontrolled Changes**: Single monolithic prompts often rewrite entire files without architectural discipline.

---

## 2. Solution

**Nexus** introduces an autonomous multi-agent engineering workflow that mirrors a senior software development team:
1. **Separation of Concerns**: Six dedicated agents each handle a specific phase of the engineering lifecycle.
2. **Deterministic Orchestrator**: Normal application backend code (not an LLM) guarantees state transitions and safety.
3. **Dual Human-in-the-Loop Gates**: Mandatory human approval after requirements definition (PRD) and technical architecture before code is written.
4. **Isolated Sandboxed Workspaces**: Agents modify code strictly within task-scoped workspaces.
5. **Real Headless Browser Verification**: Tester Agent uses **Playwright** to open browsers, test user journeys, verify responsive viewports, and capture screenshot evidence.
6. **Autonomous Self-Correction Loop**: Tester failure triggers the Debug Agent to diagnose root cause, passes a surgical fix plan to the Developer Agent, and retests automatically.
7. **Verified Pull Requests**: Reviewer Agent audits the final diff and publishes a GitHub Pull Request with test evidence and screenshots.

---

## 3. The Six Specialized AI Agents

| # | Agent | Role | Tools & Capabilities |
|---|---|---|---|
| **1** | **PRD Agent** | Requirements Engineer | Converts feature prompt into structured PRD, user stories, acceptance criteria, edge cases, and Definition of Done. *Does not modify code.* |
| **2** | **Architect Agent** | Systems Architect | Audits repository file tree and AST, determines target files to create/modify, API specs, and implementation steps. *Does not modify code.* |
| **3** | **Developer Agent** | Full-Stack Engineer | Implements approved architecture and surgical bug fixes strictly inside the isolated workspace sandbox. Manages Git commits and branches. |
| **4** | **Tester Agent** | QA & Automation Engineer | Boots the application in the workspace, drives **Playwright** headless Chromium, asserts DOM state, tests mobile/desktop viewports, and captures screenshot proofs. *Does not modify code.* |
| **5** | **Debug / Fix Agent** | Reliability & Diagnostics | Analyzes failed test runs, browser traces, and source code. Pinpoints root cause and formulates surgical fix plans for Developer Agent. |
| **6** | **Reviewer Agent** | Senior Staff Auditor | Inspects the final Git diff against PRD requirements, verifies passing tests, checks security posture, and authorizes Pull Request publication. |

> **Note**: The **Orchestrator** is deterministic backend code (FastAPI state machine), ensuring predictable state transitions and enforcing human approval gates.

---

## 4. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, Pydantic, SQLAlchemy, Uvicorn.
- **AI & Reasoning**: OpenAI API (`gpt-4o` / compatible), Structured JSON Schemas, resilient domain synthesizer.
- **Testing & QA**: Playwright Headless Chromium, automated assertions, full-page screenshot capture.
- **Isolation**: Ephemeral task workspaces (`/workspaces/task_<id>/`), Docker container manager with sandbox fallback.
- **VCS & Delivery**: Git CLI, GitHub REST API v3.
- **Real-Time Telemetry**: WebSockets (`/ws/tasks/{task_id}`).
- **Database**: SQLite (MVP) / PostgreSQL ready.

---

## 5. End-to-End Workflow & Gates

```
User Feature Request
        │
        ▼
[ Isolated Workspace Created ]
        │
        ▼
[ PRD Agent Generates Requirements ]
        │
        ▼
👤 HUMAN APPROVAL GATE 1 (Approve PRD)
        │
        ▼
[ Architect Agent Creates Technical Blueprint ]
        │
        ▼
👤 HUMAN APPROVAL GATE 2 (Approve Architecture)
        │
        ▼
[ Developer Agent Implements Code in Sandbox ]
        │
        ▼
[ Tester Agent Runs Playwright Browser Suite ]
        │
   ┌────┴──────────────────────────┐
   │                               │
 (Fails)                        (Passes)
   │                               │
   ▼                               ▼
[ Debug Agent Diagnoses Root Cause ]
   │
   ▼
[ Developer Agent Applies Targeted Fix ]
   │
   ▼
[ Tester Agent Retests (Self-Correction Loop) ]
                                   │
                                   ▼
                       [ Reviewer Agent Audits Diff ]
                                   │
                                   ▼
                       [ Verified GitHub Pull Request ]
```

---

## 6. Installation & Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (Node 20+ recommended)
- Git CLI

### 1. Clone & Enter Repository
```bash
cd nexus
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` (all secrets are optional for local demo mode!):
```env
# Optional: OpenAI API Key (falls back to intelligent synthesizer if omitted)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# Optional: GitHub Personal Access Token (creates local verified PR if omitted)
GITHUB_TOKEN=your_github_token_here

# Platform defaults
DATABASE_URL=sqlite:///./nexus.db
WORKSPACE_BASE_DIR=./workspaces
USE_DOCKER=false
DEMO_MODE=true
```

### 3. Install Backend Dependencies & Playwright
```bash
pip install -r requirements.txt
python -m playwright install chromium
```

*(Or direct pip install: `pip install fastapi uvicorn pydantic pydantic-settings sqlalchemy httpx websockets openai playwright pytest`)*

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 7. Running the Application

### Start the FastAPI Backend
From the root `nexus/` directory:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### Start the Next.js Frontend
In a new terminal window:
```bash
cd frontend
npm run dev
```
Open your browser to: **[http://localhost:3000](http://localhost:3000)**

---

## 8. Running the Docker Workspace

To run the containerized workspace environment:
```bash
docker-compose up --build
```
This boots the backend orchestrator and Next.js frontend with isolated Docker container execution enabled.

---

## 9. Running Automated Tests

Run the full end-to-end integration test validating all six agents, the Playwright browser runner, and the self-correction loop:
```bash
python -m pytest tests/test_workflow.py -v -s
```

---

## 10. The Hackathon Demo Scenario

Nexus includes an instant end-to-end demonstration featuring the **Apex Hardware** storefront:

1. **Launch Task**: Click **"Launch Instant Hackathon Demo"** on the dashboard.
2. **PRD Generation**: PRD Agent analyzes `sample_repo` and outputs requirements for adding a wishlist button.
3. **Gate 1 Approval**: Click **[Approve PRD]**.
4. **Architecture Blueprint**: Architect Agent inspects the codebase and specifies changes to `index.html`.
5. **Gate 2 Approval**: Click **[Approve Architecture]**.
6. **Development**: Developer Agent injects the wishlist button and reactive counter state into the workspace.
7. **Real Playwright Test Failure**:
   - Tester Agent verifies desktop layout (Passes).
   - Tester Agent tests mobile screen (375px viewport): Discovers wishlist button is hidden by a responsive CSS constraint!
   - Captures real screenshot: `03_mobile_viewport.png`.
8. **Autonomous Self-Correction**:
   - **Debug Agent** traces the root cause: `'hidden md:' class limits display on screens narrower than 768px`.
   - **Developer Agent** applies targeted fix: removes `'hidden md:'` constraint.
   - **Tester Agent** retests at 375px: Assertion passes! Captures updated screenshot.
9. **Final Review**: Reviewer Agent audits the Git diff and approves the code changes.
10. **Delivery**: Verified Pull Request is generated with test logs, diff breakdown, and screenshot proofs!

---

## 11. Limitations & Future Roadmap

### Current MVP Scope
- SQLite single-node database for zero-config hackathon execution.
- Sandboxed filesystem and Docker container workspace management.
- Single-repository branch targeting.

### Future Improvements
- Multi-tenant enterprise RBAC and team workspaces.
- MicroVM execution with Firecracker on bare metal.
- Automated production staging deployments and canary rollouts.
- Integration with GitLab, Bitbucket, and Jira.
