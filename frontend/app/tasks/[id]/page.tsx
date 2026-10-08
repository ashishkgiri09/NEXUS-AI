'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchTask,
  fetchPRD,
  fetchArchitecture,
  fetchAgents,
  fetchTests,
  fetchDebugReports,
  fetchReview,
  fetchScreenshots,
  fetchPullRequest,
  getWebSocketUrl,
} from '../../../lib/api';
import {
  Task,
  PRDDocument,
  ArchitectureDocument,
  AgentRun,
  TestRun,
  DebugReport,
  ReviewResult,
  ScreenshotItem,
  PullRequest,
  NexusEvent,
} from '../../../types';
import { AgentPipeline } from '../../../components/AgentPipeline';
import { LiveLog } from '../../../components/LiveLog';
import { ApprovalBanner } from '../../../components/ApprovalBanner';
import { ScreenshotGallery } from '../../../components/ScreenshotGallery';
import {
  ArrowLeft,
  FileText,
  Compass,
  Activity,
  CheckCircle2,
  Bug,
  GitPullRequest,
  Image as ImageIcon,
  ExternalLink,
  Code2,
  AlertTriangle,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [prd, setPrd] = useState<PRDDocument | null>(null);
  const [architecture, setArchitecture] = useState<ArchitectureDocument | null>(null);
  const [agents, setAgents] = useState<AgentRun[]>([]);
  const [tests, setTests] = useState<TestRun[]>([]);
  const [debugReports, setDebugReports] = useState<DebugReport[]>([]);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [pullRequest, setPullRequest] = useState<PullRequest | null>(null);

  const [activeTab, setActiveTab] = useState<'prd' | 'architecture' | 'activity' | 'tests' | 'debug' | 'screenshots' | 'pr'>('prd');
  const [logs, setLogs] = useState<NexusEvent[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Poll Task state and artifacts
  const refreshData = async () => {
    if (!taskId) return;
    try {
      const t = await fetchTask(taskId);
      setTask(t);

      const [p, a, ag, te, deb, rev, sc, pr] = await Promise.all([
        fetchPRD(taskId),
        fetchArchitecture(taskId),
        fetchAgents(taskId),
        fetchTests(taskId),
        fetchDebugReports(taskId),
        fetchReview(taskId),
        fetchScreenshots(taskId),
        fetchPullRequest(taskId),
      ]);

      if (p) setPrd(p);
      if (a) setArchitecture(a);
      if (ag) setAgents(ag);
      if (te) setTests(te);
      if (deb) setDebugReports(deb);
      if (rev) setReview(rev);
      if (sc) setScreenshots(sc);
      if (pr) setPullRequest(pr);

      // Auto switch tabs based on lifecycle
      if (t.status === 'PRD_PENDING_APPROVAL') setActiveTab('prd');
      else if (t.status === 'ARCHITECTURE_PENDING_APPROVAL') setActiveTab('architecture');
      else if (t.status === 'COMPLETED' && pr) setActiveTab('pr');
      else if (['TESTING', 'RETESTING'].includes(t.status)) setActiveTab('tests');
      else if (['DEBUGGING', 'FIXING'].includes(t.status)) setActiveTab('debug');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [taskId]);

  // Setup WebSocket connection for live telemetry
  useEffect(() => {
    if (!taskId) return;
    const wsUrl = getWebSocketUrl(taskId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs((prev) => [...prev, data]);
        // When telemetry indicates a state update, refresh immediately
        refreshData();
      } catch (err) {
        console.error(err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [taskId]);

  if (!task) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Connecting to task orchestration telemetry...</p>
      </div>
    );
  }

  const latestTestRun = tests[0];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Task Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {task.feature_request}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center space-x-1 font-mono text-slate-300">
              <FolderGit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{task.repository}</span>
            </span>
            {task.branch_name && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-mono text-[11px] border border-slate-700">
                {task.branch_name}
              </span>
            )}
            <span className="text-slate-600">&bull;</span>
            <span>Task ID: <code className="text-slate-400">{task.id.slice(0, 8)}</code></span>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={refreshData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700 text-xs"
            title="Refresh State"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Human Approval Gate Banner (if awaiting Gate 1 or Gate 2) */}
      <ApprovalBanner
        taskId={task.id}
        status={task.status}
        onActionComplete={refreshData}
      />

      {/* Six-Agent Pipeline Visualizer */}
      <AgentPipeline
        status={task.status}
        currentAgent={task.current_agent}
        retryCount={task.retry_count}
      />

      {/* Live Agent Telemetry Console */}
      <LiveLog logs={logs} connected={wsConnected} />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('prd')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'prd'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>PRD Document</span>
          {prd && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'architecture'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Architecture</span>
          {architecture && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Agent Activity ({agents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'tests'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Playwright Tests ({tests.length})</span>
          {latestTestRun && (
            <span
              className={`w-2 h-2 rounded-full ${
                latestTestRun.status === 'passed' ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            ></span>
          )}
        </button>

        {debugReports.length > 0 && (
          <button
            onClick={() => setActiveTab('debug')}
            className={`px-4 py-2.5 rounded-xl font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'debug'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-rose-400 hover:text-white hover:bg-rose-950/40'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Self-Correction ({debugReports.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('screenshots')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'screenshots'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Screenshots ({screenshots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pr')}
          className={`px-4 py-2.5 rounded-xl font-semibold transition flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'pr'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Pull Request</span>
          {pullRequest && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-xl">
        {/* TAB 1: PRD */}
        {activeTab === 'prd' && (
          <div className="space-y-6">
            {!prd ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                PRD Agent is generating requirements document...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                      Product Requirements Document
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1.5">{prd.title}</h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">{prd.summary}</p>
                  </div>
                  {prd.approved && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approved by User</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Core Functional Requirements
                    </h3>
                    <ul className="space-y-2">
                      {prd.requirements.map((req, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start space-x-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Acceptance Criteria (Tested by Playwright)
                    </h3>
                    <ul className="space-y-2">
                      {prd.acceptance_criteria.map((ac, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start space-x-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-teal-400 font-bold">✓</span>
                          <span>{ac}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Definition of Done
                    </h3>
                    <ul className="space-y-1.5">
                      {prd.definition_of_done.map((dod, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-center space-x-2">
                          <span className="text-emerald-400 text-[10px]">■</span>
                          <span>{dod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Identified Edge Cases
                    </h3>
                    <ul className="space-y-1.5">
                      {prd.edge_cases.map((ec, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-center space-x-2">
                          <span className="text-amber-400 text-[10px]">▲</span>
                          <span>{ec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            {!architecture ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Architect Agent is awaiting PRD approval or analyzing codebase...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      Technical Architecture Blueprint
                    </span>
                    <h2 className="text-base font-bold text-white mt-1.5">{architecture.summary}</h2>
                  </div>
                  {architecture.approved && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approved by User</span>
                    </span>
                  )}
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    <span>System Architecture Specification</span>
                  </h3>
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {architecture.architecture}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Target Files to Modify & Create
                    </h3>
                    <div className="space-y-1.5">
                      {architecture.files_to_modify.map((f, i) => (
                        <div key={i} className="text-xs font-mono bg-slate-900/60 p-2 rounded border border-slate-800 text-blue-300 flex items-center space-x-2">
                          <span className="text-amber-400 text-[10px]">MOD</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Sequenced Implementation Steps
                    </h3>
                    <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-300">
                      {architecture.implementation_steps.map((st, i) => (
                        <li key={i} className="p-1.5 rounded bg-slate-900/40 border border-slate-800/60">
                          {st}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: AGENT ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Agent Execution Runs & Sandboxed Tool Traces
            </h3>
            {agents.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No agent runs recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {agents.map((ag) => (
                  <div key={ag.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white uppercase">{ag.agent_name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {ag.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{ag.started_at}</span>
                    </div>

                    {ag.output_summary && (
                      <p className="text-xs text-slate-300">{ag.output_summary}</p>
                    )}

                    {ag.tool_calls && ag.tool_calls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Executed Tools ({ag.tool_calls.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ag.tool_calls.map((t, idx) => (
                            <span key={idx} className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-blue-300 border border-slate-800">
                              {t.tool || 'tool'}()
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PLAYWRIGHT TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Playwright Browser Automation Suite
                </span>
                <h3 className="text-base font-bold text-white mt-1">Acceptance Test Results</h3>
              </div>
            </div>

            {tests.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Browser test suite has not run yet. Executes after Developer Agent finishes coding.
              </div>
            ) : (
              <div className="space-y-4">
                {tests.map((run, idx) => (
                  <div key={run.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">Test Execution Run #{tests.length - idx}</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            run.status === 'passed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {run.passed_tests} Passed / {run.failed_tests} Failed
                      </span>
                    </div>

                    <div className="space-y-2">
                      {run.results.map((res, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-4 ${
                            res.status === 'passed'
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-red-950/20 border-red-500/30 text-red-200'
                          }`}
                        >
                          <div>
                            <div className="font-semibold flex items-center space-x-2">
                              <span>{res.status === 'passed' ? '✓' : '✗'}</span>
                              <span>{res.requirement}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{res.evidence}</p>
                          </div>
                          {res.screenshot_url && (
                            <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                              📷 {res.screenshot_url}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SELF-CORRECTION (DEBUG) */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                Autonomous Self-Correction Loop
              </span>
              <h3 className="text-base font-bold text-white mt-1">Debug Agent Failure Diagnosis & Fix Plan</h3>
            </div>

            {debugReports.map((report) => (
              <div key={report.id} className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-5 space-y-4">
                <div>
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Root Cause Analysis</span>
                  <p className="text-xs text-white font-semibold mt-1">{report.root_cause}</p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{report.explanation}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Surgical Fix Plan Passed to Developer Agent
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
                    {report.fix_plan.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: SCREENSHOTS */}
        {activeTab === 'screenshots' && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Visual Regression & Evidence Screenshots</h3>
              <p className="text-xs text-slate-400">Captured automatically during Playwright headless execution</p>
            </div>
            <ScreenshotGallery taskId={task.id} screenshots={screenshots} />
          </div>
        )}

        {/* TAB 7: PULL REQUEST */}
        {activeTab === 'pr' && (
          <div className="space-y-6">
            {!pullRequest ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Pull Request will be generated after Reviewer Agent approves the final diff.
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      GitHub Pull Request Created
                    </span>
                    <h2 className="text-lg font-bold text-white mt-1">{pullRequest.title}</h2>
                    <p className="text-xs text-slate-400">Branch: <code className="text-blue-400 font-bold">{pullRequest.branch_name}</code></p>
                  </div>

                  <a
                    href={pullRequest.pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 flex-shrink-0"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {review && (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-1">
                      Final Reviewer Agent Verdict: {review.status.toUpperCase()}
                    </span>
                    <p className="text-xs text-slate-300">{review.summary}</p>
                  </div>
                )}

                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Pull Request Description Body
                  </h3>
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {pullRequest.body}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
