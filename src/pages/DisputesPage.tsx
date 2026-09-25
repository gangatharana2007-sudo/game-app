import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { Dispute, Match } from '../types/database.js';
import { Scale, AlertCircle, Plus, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

interface DisputesPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DisputesPage: React.FC<DisputesPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form
  const [matchId, setMatchId] = useState('');
  const [reason, setReason] = useState<any>('anti_cheat_suspected');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDisputes = async () => {
    try {
      const data = await api.getDisputes();
      setDisputes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await api.submitDispute(user.id, {
        matchId,
        reason,
        description,
      });
      showToast('Dispute filed successfully! Case routed to Anti-Cheat Moderator queue.', 'success');
      setShowSubmitModal(false);
      setMatchId('');
      setDescription('');
      loadDisputes();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit dispute', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide">
            Disputes & Fair-Play Appeals
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contest match scoring, report suspected automation, or submit evidence for human moderation review.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>File Match Dispute</span>
        </button>
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading dispute dossiers...</div>
      ) : disputes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Scale className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No active disputes</h3>
          <p className="text-xs text-slate-500 mt-1">All competitive matches have clean verified audit trails.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-amber-400 font-bold uppercase">{d.reason.replace(/_/g, ' ')}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Match: {d.matchId}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    d.status === 'resolved'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : d.status === 'investigating'
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  ● {d.status}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-400 block mb-1">Competitor Statement:</span>
                "{d.description}"
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span>Filed: {new Date(d.createdAt).toLocaleString()}</span>
                <span>Petitioner: {d.petitionerUserId}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Dispute Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span>File Official Match Dispute</span>
            </h3>

            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Match ID / Room Code</label>
                <input
                  type="text"
                  required
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  placeholder="e.g. match_tourn_active_apex_1_r1_m1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Dispute</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="anti_cheat_suspected">Suspected Automation / Macro / Script</option>
                  <option value="disconnection_issue">Unfair Disconnection or Server Desync</option>
                  <option value="scoring_desync">Scoring Coordinate Discrepancy</option>
                  <option value="rules_infraction">Rule Infraction or Exploitation</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description & Evidence</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the round numbers, specific timestamps, or behavior observed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit to Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
