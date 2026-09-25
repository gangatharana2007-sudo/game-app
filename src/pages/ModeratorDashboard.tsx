import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { FairPlayCase } from '../types/database.js';
import { ShieldAlert, CheckCircle, Scale, Eye, AlertTriangle, ArrowRight, UserX, UserCheck } from 'lucide-react';

interface ModeratorDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [cases, setCases] = useState<FairPlayCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<FairPlayCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolutionAction, setResolutionAction] = useState<string>('no_action');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCases = async () => {
    try {
      const data = await api.getModerationCases();
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleResolve = async () => {
    if (!selectedCase || !user) return;
    setSubmitting(true);
    try {
      await api.resolveCase(selectedCase.id, user.id, resolutionAction, moderatorNotes);
      showToast(`Case resolved: ${resolutionAction.replace(/_/g, ' ')}`, 'success');
      setModeratorNotes('');
      loadCases();
    } catch (err: any) {
      showToast(err.message || 'Resolution failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider mb-1">
          Fair-Play & Integrity
        </div>
        <h1 className="font-display text-3xl font-extrabold text-white">
          Anti-Cheat Telemetry Review
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Human moderator oversight over FairPlayAnalyzer telemetry flags. AI never permanently bans; you verify the evidence.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading investigation dossiers...</div>
      ) : cases.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Queue is Clear</h3>
          <p className="text-xs text-slate-500 mt-1">No pending suspicious matches or high-risk cases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Dossier Cases List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Active Investigation Cases ({cases.length})
            </div>

            {cases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-cyan-400 font-bold">{c.suspectAlias}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.classification === 'HIGH_RISK'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      ● {c.classification}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-semibold mb-1">
                    Risk Score: {c.riskScore}/100
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    {c.evidenceSummary[0]}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Status: {c.status}</span>
                    <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Case Evidence Dossier & Action Inspector */}
          {selectedCase && (
            <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Case ID: {selectedCase.id}</div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Suspect: {selectedCase.suspectAlias}
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono">Confidence Level</div>
                  <div className="font-mono font-bold text-cyan-400">
                    {Math.round(selectedCase.confidenceScore * 100)}%
                  </div>
                </div>
              </div>

              {/* AI Explainable Summary Box */}
              <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-300">
                  <ShieldAlert className="w-4 h-4 text-violet-400" />
                  <span>FairPlayAnalyzer AI Classification</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCase.aiAnalysisExplanation ||
                    'Analyzed via server-side telemetry validation against human baseline physiological limits.'}
                </p>
              </div>

              {/* Telemetry Evidence Bullet List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Recorded Telemetry Evidence
                </h4>
                <div className="space-y-1.5">
                  {selectedCase.evidenceSummary.map((ev, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
                    >
                      <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        !
                      </span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human Moderator Adjudication Form */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Official Moderator Adjudication
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Select Policy-Based Action
                  </label>
                  <select
                    value={resolutionAction}
                    onChange={(e) => setResolutionAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="no_action">Dismiss Case (Telemetry within acceptable human variance)</option>
                    <option value="warning_issued">Issue Formal Fair-Play Warning to Player</option>
                    <option value="match_voided">Void Match Result (Order rematch if applicable)</option>
                    <option value="temporary_suspension">Apply Temporary 7-Day Competitive Suspension</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Moderator Audit Notes (Immutable Log)
                  </label>
                  <textarea
                    rows={3}
                    value={moderatorNotes}
                    onChange={(e) => setModeratorNotes(e.target.value)}
                    placeholder="Document the exact rule applied, reviewed timestamps, or player response..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleResolve}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
                  >
                    {submitting ? 'Committing...' : 'Commit Moderation Decision'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
