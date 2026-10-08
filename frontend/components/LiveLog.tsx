'use client';

import React, { useEffect, useRef } from 'react';
import { NexusEvent } from '../types';
import { Terminal, Activity, ArrowDown } from 'lucide-react';

interface LiveLogProps {
  logs: NexusEvent[];
  connected: boolean;
}

export const LiveLog: React.FC<LiveLogProps> = ({ logs, connected }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-80">
      {/* Header */}
      <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Live Agent Telemetry</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
          <span className="text-[11px] text-slate-400">{connected ? 'Streaming Real-Time' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 bg-[#080d1a]"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center flex flex-col items-center justify-center">
            <Activity className="w-6 h-6 mb-2 animate-pulse text-slate-700" />
            <span>Awaiting telemetry broadcast from Orchestrator...</span>
          </div>
        ) : (
          logs.map((log, idx) => {
            const isError = log.status === 'failed' || log.status === 'rejected';
            const isCompleted = log.status === 'completed';
            const isWait = log.status === 'waiting_for_approval';

            return (
              <div
                key={idx}
                className="flex items-start space-x-2.5 leading-relaxed hover:bg-slate-900/40 p-1 rounded transition-colors"
              >
                <span className="text-slate-600 select-none text-[10px] mt-0.5 whitespace-nowrap">
                  [{log.timestamp || '00:00:00'}]
                </span>

                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase whitespace-nowrap ${
                    log.agent === 'prd_agent'
                      ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                      : log.agent === 'architect_agent'
                      ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40'
                      : log.agent === 'developer_agent'
                      ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                      : log.agent === 'tester_agent'
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                      : log.agent === 'debug_agent'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                      : log.agent === 'reviewer_agent'
                      ? 'bg-teal-950/60 text-teal-300 border border-teal-800/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {log.agent.replace('_agent', '')}
                </span>

                <span
                  className={`flex-1 break-words ${
                    isError
                      ? 'text-red-400 font-semibold'
                      : isCompleted
                      ? 'text-emerald-300'
                      : isWait
                      ? 'text-amber-300 font-semibold'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
