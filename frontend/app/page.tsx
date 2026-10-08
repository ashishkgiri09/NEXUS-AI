'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchTasks, createTask, fetchSampleRepo } from '../lib/api';
import { Task } from '../types';
import {
  Layers,
  PlusCircle,
  Play,
  GitPullRequest,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Flame,
  Bug,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLaunching, setDemoLaunching] = useState(false);

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 4000);
    return () => clearInterval(interval);
  }, []);

  const launchDemo = async () => {
    setDemoLaunching(true);
    try {
      const sample = await fetchSampleRepo();
      const repoUrl = sample?.path || 'sample_repo';
      const feature = 'Add a wishlist button to every product card with live counter badge and responsive mobile layout.';
      const created = await createTask(repoUrl, feature);
      router.push(`/tasks/${created.id}`);
    } catch (err) {
      alert('Error launching demo: ' + err);
      setDemoLaunching(false);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const activeCount = tasks.filter((t) => !['COMPLETED', 'CANCELLED'].includes(t.status) && !t.status.includes('FAILED')).length;
  const retriesCount = tasks.reduce((acc, t) => acc + (t.retry_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous AI Software Engineering MVP</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Deploy an Autonomous Six-Agent Engineering Team
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            From high-level feature prompt to PRD generation, architectural blueprinting, isolated workspace coding,
            Playwright browser testing, autonomous self-correction, and verified GitHub Pull Requests.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={launchDemo}
              disabled={demoLaunching}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{demoLaunching ? 'Starting Workspace...' : 'Launch Instant Hackathon Demo'}</span>
            </button>

            <Link
              href="/tasks/new"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4 text-blue-400" />
              <span>Create Custom Task</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{tasks.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Autonomous orchestrations initialized</div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pipelines</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Executing multi-agent stages</div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed PRs</span>
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{completedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Reviewed & verified pull requests</div>
        </div>

        <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Self-Corrections</span>
            <Bug className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{retriesCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Autonomous bug fix loops executed</div>
        </div>
      </div>

      {/* Six Agent Architecture Overview */}
      <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span>The Nexus Six-Agent Autonomous Hierarchy</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span>1. PRD Agent</span>
            </div>
            <p className="text-xs text-slate-300">Synthesizes user requests into formal PRD specifications, acceptance criteria, and edge cases.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>2. Architect Agent</span>
            </div>
            <p className="text-xs text-slate-300">Audits codebase AST, plans target files, API contracts, and implementation steps.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>3. Developer Agent</span>
            </div>
            <p className="text-xs text-slate-300">Modifies code strictly inside the isolated workspace sandbox and manages Git branches.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>4. Tester Agent</span>
            </div>
            <p className="text-xs text-slate-300">Boots the app, executes headless Playwright browser tests, and captures visual screenshots.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>5. Debug / Fix Agent</span>
            </div>
            <p className="text-xs text-slate-300">Traces Playwright test failures, determines root causes, and passes surgical fix plans to Developer.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-bold text-teal-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>6. Reviewer Agent</span>
            </div>
            <p className="text-xs text-slate-300">Inspects Git diffs against PRD acceptance criteria before approving Pull Request creation.</p>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Engineering Tasks</h3>
            <p className="text-xs text-slate-400">Real-time status of all autonomous workflows</p>
          </div>
          <Link
            href="/tasks/new"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>+ Create Task</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading active tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No tasks created yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Launch the demo task above or create a new task to see the six AI agents execute autonomously.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block p-4 sm:px-6 hover:bg-slate-900/60 transition group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {task.id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : task.status.includes('PENDING_APPROVAL')
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : task.status.includes('FAILED')
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {task.status.replace(/_/g, ' ')}
                      </span>

                      {task.retry_count > 0 && (
                        <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/30">
                          {task.retry_count} {task.retry_count === 1 ? 'fix' : 'fixes'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {task.feature_request}
                    </h4>

                    <p className="text-xs text-slate-500 truncate max-w-xl">
                      Repository: <span className="font-mono text-slate-400">{task.repository}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className="text-right text-xs text-slate-500">
                      <div>{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
