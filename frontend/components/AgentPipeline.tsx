'use client';

import React from 'react';
import { TaskState } from '../types';
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';

interface AgentPipelineProps {
  status: TaskState;
  currentAgent: string | null;
  retryCount: number;
}

export const AgentPipeline: React.FC<AgentPipelineProps> = ({ status, currentAgent, retryCount }) => {
  // Determine state of each agent
  const getAgentStatus = (agentKey: string) => {
    switch (agentKey) {
      case 'prd':
        if (['CREATED', 'WORKSPACE_CREATING'].includes(status)) return 'waiting';
        if (status === 'PRD_GENERATING') return 'running';
        if (status === 'PRD_FAILED') return 'failed';
        return 'completed';

      case 'architect':
        if (['CREATED', 'WORKSPACE_CREATING', 'PRD_GENERATING', 'PRD_PENDING_APPROVAL', 'PRD_FAILED'].includes(status)) return 'waiting';
        if (status === 'ARCHITECTURE_GENERATING') return 'running';
        if (status === 'ARCHITECTURE_FAILED') return 'failed';
        return 'completed';

      case 'developer':
        if (['CREATED', 'WORKSPACE_CREATING', 'PRD_GENERATING', 'PRD_PENDING_APPROVAL', 'ARCHITECTURE_GENERATING', 'ARCHITECTURE_PENDING_APPROVAL'].includes(status)) return 'waiting';
        if (['DEVELOPMENT', 'FIXING'].includes(status)) return 'running';
        if (status === 'DEVELOPMENT_FAILED') return 'failed';
        return 'completed';

      case 'tester':
        if (['CREATED', 'WORKSPACE_CREATING', 'PRD_GENERATING', 'PRD_PENDING_APPROVAL', 'ARCHITECTURE_GENERATING', 'ARCHITECTURE_PENDING_APPROVAL', 'DEVELOPMENT'].includes(status)) return 'waiting';
        if (['TESTING', 'RETESTING'].includes(status)) return 'running';
        if (status === 'TEST_FAILED') return 'failed';
        return 'completed';

      case 'debug':
        if (status === 'DEBUGGING') return 'running';
        if (status === 'DEBUG_FAILED') return 'failed';
        if (['FIXING', 'RETESTING', 'REVIEW', 'PR_CREATING', 'COMPLETED'].includes(status) && retryCount > 0) return 'completed';
        if (status === 'NEEDS_HUMAN_REVIEW') return 'failed';
        return 'waiting';

      case 'reviewer':
        if (status === 'REVIEW') return 'running';
        if (status === 'REVIEW_FAILED') return 'failed';
        if (['PR_CREATING', 'COMPLETED'].includes(status)) return 'completed';
        return 'waiting';

      default:
        return 'waiting';
    }
  };

  const agents = [
    { key: 'prd', name: '1. PRD Agent', role: 'Requirements & Scope', gate: 'Gate 1 Approval' },
    { key: 'architect', name: '2. Architect Agent', role: 'System Blueprint', gate: 'Gate 2 Approval' },
    { key: 'developer', name: '3. Developer Agent', role: 'Isolated Workspace Code', gate: null },
    { key: 'tester', name: '4. Tester Agent', role: 'Playwright Browser Verification', gate: null },
    { key: 'debug', name: '5. Debug / Fix Agent', role: 'Root Cause & Self-Correction', gate: null },
    { key: 'reviewer', name: '6. Reviewer Agent', role: 'Diff & Security Audit', gate: null },
  ];

  return (
    <div className="w-full bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Autonomous Multi-Agent Pipeline</span>
            {retryCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                Self-Correction Loop: Retry #{retryCount}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">Strictly sequenced six-agent execution tree with deterministic orchestration</p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500">Pipeline State: </span>
          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {agents.map((ag) => {
          const st = getAgentStatus(ag.key);

          return (
            <div
              key={ag.key}
              className={`relative rounded-xl p-3.5 border transition-all duration-300 ${
                st === 'running'
                  ? 'bg-blue-950/30 border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                  : st === 'completed'
                  ? 'bg-slate-900/60 border-emerald-500/30 text-slate-300'
                  : st === 'failed'
                  ? 'bg-red-950/20 border-red-500/40 text-red-300'
                  : 'bg-slate-900/30 border-slate-800/60 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {ag.key}
                </span>

                {st === 'running' && (
                  <span className="flex items-center text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </span>
                )}
                {st === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {st === 'failed' && (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                {st === 'waiting' && (
                  <Circle className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>

              <div className="text-xs font-semibold text-white mb-0.5">{ag.name}</div>
              <div className="text-[11px] text-slate-400 leading-tight">{ag.role}</div>

              {ag.gate && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-amber-400/90 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{ag.gate}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
