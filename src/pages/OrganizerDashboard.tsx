import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { Tournament } from '../types/database.js';
import { Trophy, Plus, Users, Calendar, Play, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

interface OrganizerDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [titleTa, setTitleTa] = useState('');
  const [format, setFormat] = useState<any>('single_elimination');
  const [entryType, setEntryType] = useState<any>('free');
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [gracePeriod, setGracePeriod] = useState(120);
  const [prizeDescription, setPrizeDescription] = useState('$1,000 Verified Prize Pool');
  const [rules, setRules] = useState(
    '5 rounds of Reaction Grid Duel. Server-authoritative scoring. Sub-110ms actions flagged for review.'
  );

  const loadData = async () => {
    try {
      const data = await api.getTournaments();
      setTournaments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const now = new Date();
      await api.createTournament(user.id, {
        title,
        titleTa,
        gameId: 'game_reaction_grid_duel',
        format,
        entryType,
        teamSize: 1,
        maxParticipants,
        gracePeriodSeconds: gracePeriod,
        registrationDeadline: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(),
        startDate: new Date(now.getTime() + 1000 * 60 * 60 * 25).toISOString(),
        rules,
        prizeDescription,
      });
      showToast('Tournament published successfully! Registration open.', 'success');
      setShowCreateModal(false);
      setTitle('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Creation failed', 'error');
    }
  };

  const handleStartTournament = async (tId: string) => {
    if (!user) return;
    try {
      await api.startTournament(tId, user.id);
      showToast('Tournament started! Automatic brackets & rooms generated.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to start tournament', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
            Tournament Operations
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">Organizer Command Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish tournaments, trigger automated bracket orchestration, and monitor live match rooms.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Tournament</span>
        </button>
      </div>

      {/* Tournament Management Cards */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading organizer consoles...</div>
      ) : tournaments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No tournaments organized yet</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold uppercase text-cyan-400">
                    {t.format.replace('_', ' ')}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span
                    className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded ${
                      t.status === 'in_progress'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : t.status === 'registration_open'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    ● {t.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-white">{t.title}</h3>
                <p className="text-xs text-slate-400 max-w-2xl">{t.rules}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono pt-1">
                  <span>Capacity: {t.currentParticipantsCount} / {t.maxParticipants}</span>
                  <span>•</span>
                  <span>Grace: {t.gracePeriodSeconds}s</span>
                  <span>•</span>
                  <span className="text-cyan-400">Prize: {t.prizeDescription}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={() => onNavigate('tournament-details', { tournamentId: t.id })}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  View Bracket
                </button>

                {t.status === 'registration_open' && (
                  <button
                    onClick={() => handleStartTournament(t.id)}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    Start Bracket Engine
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl font-bold text-white">Create Esports Tournament</h3>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tournament Title (English)</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nexora Apex Championship 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tournament Title (Tamil)</label>
                <input
                  type="text"
                  value={titleTa}
                  onChange={(e) => setTitleTa(e.target.value)}
                  placeholder="e.g. நெக்ஸோரா ஏபெக்ஸ் சாம்பியன்ஷிப்"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-tamil"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bracket Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="single_elimination">Single Elimination</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Participants</label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value={4}>4 Players</option>
                    <option value={8}>8 Players</option>
                    <option value={16}>16 Players</option>
                    <option value={32}>32 Players</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Absence Grace Period</label>
                  <select
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value={60}>60 Seconds</option>
                    <option value={120}>120 Seconds (Standard)</option>
                    <option value={180}>180 Seconds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prize Description</label>
                  <input
                    type="text"
                    required
                    value={prizeDescription}
                    onChange={(e) => setPrizeDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Rules Description</label>
                <textarea
                  rows={3}
                  required
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Publish Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
