# Nexus — Autonomous AI Software Engineering Platform

> **Nexus** is an autonomous software engineering platform that transforms natural language feature requests into fully implemented, tested, and verified pull requests. Operating within isolated disposable workspaces, Nexus coordinates an ensemble of six specialized agents alongside deterministic orchestration, dual human-in-the-loop approval gates, automated Playwright browser testing, and a self-correction loop.

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Tier"]
        User["Developer / User"]
        Dashboard["Nexus Next.js Dashboard"]
        User <--> Dashboard
    end

    subgraph Backend["FastAPI Orchestration Control Plane"]
        API["REST Endpoints & WebSockets"]
        SM["Deterministic State Machine Orchestrator"]
        DB[("SQLite / PostgreSQL Telemetry Store")]
        API <--> SM
        SM <--> DB
        Dashboard <-->|REST & WSS| API
    end

    subgraph AgentEnsemble["Six Specialized AI Agents"]
        PRD["1. PRD Agent"]
        Arch["2. Architect Agent"]
        Dev["3. Developer Agent"]
        Test["4. Tester Agent"]
        Debug["5. Debug / Fix Agent"]
        Rev["6. Reviewer Agent"]
    end

    subgraph Workspace["Isolated Task Workspace Sandbox"]
        Repo["Git Repository Sandbox"]
        App["Live Application Server"]
        Browser["Playwright Chromium Automation"]
        Screenshots["Artifacts & Screenshot Storage"]
    end

    subgraph VCS["Version Control Integration"]
        GitHub["GitHub REST API & Git CLI"]
    end

    SM --> PRD
    SM --> Arch
    SM --> Dev
    SM --> Test
    SM --> Debug
    SM --> Rev

    Dev -->|Edit Files & Git Commit| Repo
    Test -->|Launch & Assert| App
    Test -->|Automate Journeys & Capture| Browser
    Browser --> Screenshots
    Rev -->|Verify Diff & Test Proofs| GitHub
```

---

## 2. Six-Agent Architecture

```mermaid
flowchart LR
    subgraph Agents["Six Specialized AI Agents"]
        direction TB
        A1["PRD Agent<br/>(Scope & Acceptance Criteria)"]
        A2["Architect Agent<br/>(System Design & Target Files)"]
        A3["Developer Agent<br/>(Workspace Code Modifications)"]
        A4["Tester Agent<br/>(Playwright UI & Functional QA)"]
        A5["Debug/Fix Agent<br/>(Failure Diagnosis & Root Cause)"]
        A6["Reviewer Agent<br/>(Diff Audit & Quality Gate)"]
    end

    Input["Feature Request"] --> A1
    A1 -->|PRD Document| G1{"Gate 1: Human Approval"}
    G1 -- Approved --> A2
    A2 -->|Technical Blueprint| G2{"Gate 2: Human Approval"}
    G2 -- Approved --> A3
    A3 -->|Working Tree| A4
    A4 -- Fails --> A5
    A5 -- Fix Plan --> A3
    A4 -- Passes --> A6
    A6 --> Output["Verified Pull Request"]
```

---

## 3. Orchestrator Workflow (State Machine)

```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> WORKSPACE_CREATING
    WORKSPACE_CREATING --> PRD_GENERATING
    PRD_GENERATING --> PRD_PENDING_APPROVAL
    
    PRD_PENDING_APPROVAL --> PRD_FAILED: User Rejects
    PRD_PENDING_APPROVAL --> ARCHITECTURE_GENERATING: User Approves (Gate 1)
    
    ARCHITECTURE_GENERATING --> ARCHITECTURE_PENDING_APPROVAL
    ARCHITECTURE_PENDING_APPROVAL --> ARCHITECTURE_FAILED: User Rejects
    ARCHITECTURE_PENDING_APPROVAL --> DEVELOPMENT: User Approves (Gate 2)
    
    DEVELOPMENT --> TESTING
    TESTING --> REVIEW: Tests Pass
    TESTING --> DEBUGGING: Tests Fail (Attempt < Max)
    
    DEBUGGING --> FIXING
    FIXING --> RETESTING
    RETESTING --> REVIEW: Tests Pass
    RETESTING --> DEBUGGING: Tests Fail (Retry < Max)
    RETESTING --> NEEDS_HUMAN_REVIEW: Max Retries Exceeded
    
    REVIEW --> PR_CREATING: Reviewer Approves
    REVIEW --> REVIEW_FAILED: Reviewer Rejects
    
    PR_CREATING --> COMPLETED
    COMPLETED --> [*]
```

---

## 4. Autonomous Self-Correction Loop

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer Agent
    participant Box as Isolated Workspace
    participant Test as Tester Agent
    participant Play as Playwright Browser
    participant Dbg as Debug Agent
    participant Rev as Reviewer Agent

    Dev->>Box: Write code changes to target files
    Dev->>Box: Commit changes to task branch
    Test->>Box: Start application test server
    Test->>Play: Launch Chromium (1280x800)
    Test->>Play: Execute Scenario 1 (Desktop UI & Catalog)
    Play-->>Test: Capture desktop screenshot
    Test->>Play: Execute Scenario 2 (Interaction & Counter)
    Play-->>Test: Capture interaction screenshot
    Test->>Play: Execute Scenario 3 (Mobile 375px Viewport)
    Play-->>Test: Assertion fails (Element hidden)
    Play-->>Test: Capture mobile failure screenshot

    Test-->>Dbg: Diagnostic Packet (Failure logs + Screenshots)
    Dbg->>Box: Inspect target file classes & styles
    Dbg-->>Dbg: Diagnose root cause ('hidden md:' class constraint)
    Dbg-->>Dev: Surgical Fix Plan (Update class to visible)

    Dev->>Box: Apply fix to target file
    Dev->>Box: Commit fix: 'fix(ui): ensure mobile visibility'

    Test->>Play: Retest Mobile 375px Viewport
    Play-->>Test: Assertion passes!
    Play-->>Test: Capture verified mobile screenshot
    Test-->>Rev: Verification Evidence (All scenarios passed)
    Rev->>Rev: Audit Git diff against PRD acceptance criteria
    Rev-->>Dev: Review Approved
```

---

## 5. Isolated Workspace Architecture

```mermaid
flowchart TB
    subgraph Host["Host Operating System"]
        Orchestrator["Nexus Orchestrator"]
        DockerMgr["Workspace Manager"]
    end

    subgraph Sandbox["Isolated Task Sandbox (/workspaces/task_id/)"]
        direction TB
        Repo["repository/<br/>• Cloned Git Worktree<br/>• Target Source Files<br/>• Local App Server"]
        Logs["logs/<br/>• Stdout & Stderr traces"]
        Screenshots["screenshots/<br/>• Playwright Browser Captures"]
        TestResults["test-results/<br/>• Structured JSON Assertions"]
        Artifacts["artifacts/<br/>• PRD & Architecture Specs"]
    end

    Orchestrator --> DockerMgr
    DockerMgr --> Sandbox
    Sandbox -. Path Traversal Denied .-> Host
```

---

## 6. GitHub Integration Lifecycle

```mermaid
flowchart LR
    subgraph LocalWorkspace["Workspace"]
        Init["git init / clone"] --> Branch["Checkout nexus/task-id"]
        Branch --> Commit["git commit patches"]
        Commit --> Diff["git diff generation"]
    end

    subgraph CloudVCS["GitHub Platform"]
        Diff --> Push["git push origin nexus/task-id"]
        Push --> API["GitHub REST API: /repos/:owner/:repo/pulls"]
        API --> PR["Verified Pull Request with Screenshots & Test Trace"]
    end
```

---

## 7. Live Progress Telemetry via WebSockets

```mermaid
sequenceDiagram
    autonumber
    participant UI as Next.js Dashboard Client
    participant WS as WebSocket Endpoint (/ws/tasks/:id)
    participant Conn as Connection Manager
    participant Agent as Specialized Agents

    UI->>WS: Connect WebSocket
    WS->>Conn: Register client socket & replay event history
    Conn-->>UI: Replay initial buffered telemetry logs

    loop Agent Execution
        Agent->>Conn: broadcast(task_id, agent_name, status, message)
        Conn-->>UI: Real-time JSON Event Packet
        UI->>UI: Update Agent Pipeline Status & Append Live Log
    end
```

---

## 8. End-to-End Data Flow

```mermaid
flowchart TD
    UserReq["User Feature Request"] --> TaskTable[("Task Record (CREATED)")]
    TaskTable --> PRDRun["PRD Agent Execution"]
    PRDRun --> PRDDoc[("PRDDocument Record")]
    PRDDoc --> Gate1{"Human Gate 1 Approval"}
    
    Gate1 --> ArchRun["Architect Agent Execution"]
    ArchRun --> ArchDoc[("Architecture Record")]
    ArchDoc --> Gate2{"Human Gate 2 Approval"}
    
    Gate2 --> DevRun["Developer Agent Code Modifications"]
    DevRun --> WorkspaceFiles["Workspace Repository Files"]
    WorkspaceFiles --> TestRun["Tester Agent (Playwright Suite)"]
    
    TestRun --> TestDoc[("TestRun & TestResult Records")]
    TestDoc --> ScreenDoc[("Screenshot Records")]
    
    TestDoc --> Check{"Tests Passed?"}
    Check -- No --> DebugRun["Debug Agent Analysis"]
    DebugRun --> DebugDoc[("DebugReport Record")]
    DebugDoc --> DevFix["Developer Fix Application"]
    DevFix --> TestRun
    
    Check -- Yes --> RevRun["Reviewer Agent Audit"]
    RevRun --> RevDoc[("ReviewResult Record")]
    RevDoc --> PRCreate["Pull Request Generation"]
    PRCreate --> PRDoc[("PullRequest Record (COMPLETED)")]
```

---

## 9. Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, WebSocket client.
- **Backend**: Python 3.10+, FastAPI, Pydantic, SQLAlchemy, Uvicorn, WebSockets.
- **AI Engine**: OpenAI API (`gpt-4o`), Structured JSON Schema outputs, deterministic synthesizer fallback.
- **Testing & Vision**: Playwright Headless Chromium, automated assertions, high-res screenshots.
- **VCS & Workspace**: Git CLI, GitHub REST API, isolated directory and container sandboxing.
- **Database**: SQLite (MVP) / PostgreSQL (production-ready).
