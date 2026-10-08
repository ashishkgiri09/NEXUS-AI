import { Task, PRDDocument, ArchitectureDocument, AgentRun, TestRun, ScreenshotItem, PullRequest, DebugReport, ReviewResult } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/api/tasks`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function fetchTask(taskId: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch task ${taskId}`);
  return res.json();
}

export async function createTask(repository: string, feature_request: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repository, feature_request }),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function approvePRD(taskId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/approve-prd`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve PRD');
  return res.json();
}

export async function rejectPRD(taskId: string, feedback: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/reject-prd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error('Failed to reject PRD');
  return res.json();
}

export async function approveArchitecture(taskId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/approve-architecture`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve architecture');
  return res.json();
}

export async function rejectArchitecture(taskId: string, feedback: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/reject-architecture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error('Failed to reject architecture');
  return res.json();
}

export async function fetchPRD(taskId: string): Promise<PRDDocument | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/prd`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchArchitecture(taskId: string): Promise<ArchitectureDocument | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/architecture`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchAgents(taskId: string): Promise<AgentRun[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/agents`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchTests(taskId: string): Promise<TestRun[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/tests`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchDebugReports(taskId: string): Promise<DebugReport[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/debug`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchReview(taskId: string): Promise<ReviewResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/review`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchScreenshots(taskId: string): Promise<ScreenshotItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/screenshots`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchPullRequest(taskId: string): Promise<PullRequest | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/pull-request`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchSampleRepo(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/repositories/sample`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function getWebSocketUrl(taskId: string): string {
  const wsHost = API_BASE.replace(/^http/, 'ws');
  return `${wsHost}/ws/tasks/${taskId}`;
}

export function getScreenshotUrl(taskId: string, filename: string): string {
  return `${API_BASE}/api/tasks/${taskId}/screenshots/${filename}`;
}
