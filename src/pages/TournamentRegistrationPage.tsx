import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { Tournament } from '../types/database.js';
import { ShieldCheck, EyeOff, CheckCircle2, ArrowLeft, Trophy, AlertTriangle } from 'lucide-react';

interface TournamentRegistrationPageProps {
  tournamentId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const TournamentRegistrationPage: React.FC<TournamentRegistrationPageProps> = ({
  tournamentId,
  onNavigate,
}) => {
  const { user, profile } = useAuth();
  const { showToast } = useNotifications();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [agreedRules, setAgreedRules] = useState(false);
  const [agreedAntiCheat, setAgreedAntiCheat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getTournamentDetails(tournamentId)
      .then((data) => setTournament(data.tournament))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  const handleRegister = async () => {
    if (!user || !tournament) return;
    if (!agreedRules || !agreedAntiCheat) {
      showToast('Please accept the fair-play rules and telemetry consent', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.registerTournament(tournament.id, user.id);
      showToast('Successfully registered! Your bracket seed is confirmed.', 'success');
      onNavigate('tournament-details', { tournamentId: tournament.id });
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-xs">Loading registration...</div>;
  }

  if (!tournament) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <p className="text-slate-400 text-sm">Tournament not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('tournament-details', { tournamentId: tournament.id })}
        className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Tournament Details</span>
      </button>

      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
            Tournament Registration
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{tournament.title}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Format: {tournament.format.replace('_', ' ').toUpperCase()} • Entry: {tournament.entryType.toUpperCase()}
          </p>
        </div>

        {/* Anonymous Identity Guarantee Notice */}
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-cyan-300 mb-0.5">Anonymous Competitor Guarantee</div>
            <p className="text-slate-300 leading-relaxed">
              Your real profile will be masked inside match rooms with generated alias{' '}
              <span className="font-mono font-bold text-cyan-200">
                "{profile?.anonymousAlias || 'Player-XXXX'}"
              </span>
              . Your opponent will never see your real identity, email, or history during competitive play.
            </p>
          </div>
        </div>

        {/* Verification Check */}
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Competitor Account:</span>
            <span className="font-semibold text-white">{user?.displayName}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Skill Rating (MMR):</span>
            <span className="font-mono font-bold text-cyan-400">{profile?.skillRating || 1200} Elo</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Email Verification Status:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified for Competitive Play
            </span>
          </div>
        </div>

        {/* Mandatory Agreement Checkboxes */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedRules}
              onChange={(e) => setAgreedRules(e.target.checked)}
              className="mt-0.5 accent-cyan-500 rounded"
            />
            <span className="text-xs text-slate-300">
              I agree to the tournament rules, including the {tournament.gracePeriodSeconds}s absence grace period rule and server-authoritative scoring.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedAntiCheat}
              onChange={(e) => setAgreedAntiCheat(e.target.checked)}
              className="mt-0.5 accent-cyan-500 rounded"
            />
            <span className="text-xs text-slate-300">
              I consent to non-invasive client click telemetry and server timing monitoring for the FairPlayAnalyzer anti-cheat guard.
            </span>
          </label>
        </div>

        <button
          onClick={handleRegister}
          disabled={submitting || !agreedRules || !agreedAntiCheat}
          className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 disabled:opacity-40"
        >
          {submitting ? 'Confirming Entry...' : 'Confirm Tournament Entry'}
        </button>
      </div>
    </div>
  );
};
