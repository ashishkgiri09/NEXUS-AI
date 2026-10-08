export type TaskState =
  | 'CREATED'
  | 'WORKSPACE_CREATING'
  | 'PRD_GENERATING'
  | 'PRD_PENDING_APPROVAL'
  | 'ARCHITECTURE_GENERATING'
  | 'ARCHITECTURE_PENDING_APPROVAL'
  | 'DEVELOPMENT'
  | 'TESTING'
  | 'DEBUGGING'
  | 'FIXING'
  | 'RETESTING'
  | 'REVIEW'
  | 'PR_CREATING'
  | 'COMPLETED'
  | 'PRD_FAILED'
  | 'ARCHITECTURE_FAILED'
  | 'DEVELOPMENT_FAILED'
  | 'TEST_FAILED'
  | 'DEBUG_FAILED'
  | 'REVIEW_FAILED'
  | 'NEEDS_HUMAN_REVIEW'
  | 'CANCELLED';

export interface Task {
  id: string;
  repository: string;
  feature_request: string;
  status: TaskState;
  current_agent: string | null;
  retry_count: number;
  branch_name: string | null;
  github_pr_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PRDDocument {
  id: string;
  task_id: string;
  title: string;
  summary: string;
  requirements: string[];
  acceptance_criteria: string[];
  definition_of_done: string[];
  edge_cases: string[];
  approved: boolean;
  created_at: string;
}

export interface ArchitectureDocument {
  id: string;
  task_id: string;
  summary: string;
  architecture: string;
  files_to_modify: string[];
  files_to_create: string[];
  dependencies: string[];
  implementation_steps: string[];
  risks: string[];
  approved: boolean;
  created_at: string;
}

export interface AgentRun {
  id: string;
  agent_name: string;
  status: string;
  input_summary: string | null;
  output_summary: string | null;
  tool_calls: any[];
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface TestResultItem {
  requirement: string;
  status: 'passed' | 'failed';
  evidence: string;
  screenshot_url?: string;
}

export interface TestRun {
  id: string;
  status: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  created_at: string;
  results: TestResultItem[];
}

export interface DebugReport {
  id: string;
  root_cause: string;
  affected_files: string[];
  explanation: string;
  fix_plan: string[];
  severity: string;
  created_at: string;
}

export interface ReviewResult {
  id: string;
  status: 'approved' | 'rejected';
  summary: string;
  issues: string[];
  recommendations: string[];
  created_at: string;
}

export interface ScreenshotItem {
  id: string;
  filename: string;
  step_description: string;
  url: string;
  created_at: string;
}

export interface PullRequest {
  id: string;
  pr_number: number | null;
  pr_url: string;
  branch_name: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
}

export interface NexusEvent {
  task_id: string;
  agent: string;
  status: string;
  message: string;
  timestamp: string;
  data?: any;
}
