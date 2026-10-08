'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTask } from '../../../lib/api';
import { ArrowLeft, Sparkles, FolderGit2, Loader2, Play } from 'lucide-react';
import Link from 'next/link';

export default function NewTaskPage() {
  const router = useRouter();
  const [repository, setRepository] = useState('sample_repo');
  const [featureRequest, setFeatureRequest] = useState(
    'Add a wishlist button to every product card with live item counter badge and mobile responsive layout.'
  );
  const [loading, setLoading] = useState(false);

  const presets = [
    {
      title: 'Wishlist Button (Hackathon Demo Scenario)',
      repo: 'sample_repo',
      prompt: 'Add a wishlist button to every product card with live counter badge and responsive mobile layout.',
      highlight: true,
    },
    {
      title: 'Search & Category Filter',
      repo: 'sample_repo',
      prompt: 'Add instant live search filtering to products and a category tag selector.',
      highlight: false,
    },
    {
      title: 'Dark/Light Theme Toggle',
      repo: 'sample_repo',
      prompt: 'Add a theme switch in the top navigation bar to toggle light and dark modes with local storage persistence.',
      highlight: false,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repository.trim() || !featureRequest.trim()) {
      alert('Please provide both repository and feature request.');
      return;
    }

    setLoading(true);
    try {
      const task = await createTask(repository.trim(), featureRequest.trim());
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      alert('Failed to launch task: ' + err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="bg-[#0b1120] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Pipeline Orchestrator</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Launch Autonomous Engineering Task</h1>
          <p className="text-xs text-slate-400 mt-1">
            Nexus will provision an isolated workspace, deploy the 6 specialized AI agents, and coordinate execution through verification gates.
          </p>
        </div>

        {/* Demo Presets */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            Instant Demo Presets
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setRepository(p.repo);
                  setFeatureRequest(p.prompt);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between ${
                  featureRequest === p.prompt
                    ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>{p.title}</span>
                    {p.highlight && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full font-semibold">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.prompt}</p>
                </div>
                <Play className="w-3.5 h-3.5 text-blue-400 mt-1 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Repository (GitHub URL or Workspace Path)
            </label>
            <div className="relative">
              <FolderGit2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                placeholder="https://github.com/user/project or sample_repo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports public or private GitHub repositories (via GITHUB_TOKEN) and local sample sandboxes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Feature Request / Engineering Objective
            </label>
            <textarea
              value={featureRequest}
              onChange={(e) => setFeatureRequest(e.target.value)}
              placeholder="Describe the feature or bug fix in natural language..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Workspace & Spawning Agents...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Initialize Nexus Team & Begin PRD Generation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
