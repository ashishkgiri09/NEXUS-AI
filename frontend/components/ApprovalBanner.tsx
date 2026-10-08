'use client';

import React, { useState } from 'react';
import { TaskState } from '../types';
import { approvePRD, rejectPRD, approveArchitecture, rejectArchitecture } from '../lib/api';
import { ShieldCheck, AlertTriangle, Check, X, Loader2 } from 'lucide-react';

interface ApprovalBannerProps {
  taskId: string;
  status: TaskState;
  onActionComplete: () => void;
}

export const ApprovalBanner: React.FC<ApprovalBannerProps> = ({ taskId, status, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const isPRDGate = status === 'PRD_PENDING_APPROVAL';
  const isArchGate = status === 'ARCHITECTURE_PENDING_APPROVAL';

  if (!isPRDGate && !isArchGate) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (isPRDGate) {
        await approvePRD(taskId);
      } else {
        await approveArchitecture(taskId);
      }
      onActionComplete();
    } catch (err) {
      alert('Failed to process approval: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      if (isPRDGate) {
        await rejectPRD(taskId, feedback || 'User requested revisions to PRD');
      } else {
        await rejectArchitecture(taskId, feedback || 'User requested revisions to Architecture');
      }
      setShowRejectModal(false);
      onActionComplete();
    } catch (err) {
      alert('Failed to process rejection: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden animate-pulse-subtle">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {isPRDGate ? 'Human Gate 1 Required' : 'Human Gate 2 Required'}
              </span>
              <span className="text-xs text-slate-400">&bull; Deterministic Enforcement</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {isPRDGate
                ? 'PRD Ready for Your Explicit Approval'
                : 'Architecture Blueprint Ready for Your Explicit Approval'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              {isPRDGate
                ? 'Inspect the generated product requirements document below. Upon approval, the Architect Agent will analyze repository context and design technical specifications.'
                : 'Inspect the technical architecture blueprint below. Upon approval, Developer Agent will be provisioned in the isolated workspace to implement code and Playwright tests.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <X className="w-4 h-4" />
            <span>Reject / Request Changes</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isPRDGate ? 'Approve PRD' : 'Approve Architecture'}</span>
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2">Provide Feedback for Rejection</h4>
            <p className="text-xs text-slate-400 mb-4">
              Explain why this artifact is rejected or what specific adjustments are required:
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Ensure responsive mobile viewports are explicitly addressed..."
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
