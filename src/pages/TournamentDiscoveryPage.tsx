import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Tournament, TournamentFormat, TournamentStatus } from '../types/database.js';
import { Trophy, Users, Calendar, Plus, Filter, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface TournamentDiscoveryPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const TournamentDiscoveryPage: React.FC<TournamentDiscoveryPageProps> = ({ onNavigate }) => {
  const { user, t } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  useEffect(() => {
    api.getTournaments()
      .then((data) => setTournaments(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tournaments.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (formatFilter !== 'all' && t.format !== formatFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide">
            Competitive Esports Tournaments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse automated browser brackets, compete with anonymous handles, and climb the verified leaderboards.
          </p>
        </div>

        {(user?.role === 'organizer' || user?.role === 'admin') && (
          <button
            onClick={() => onNavigate('organizer-dashboard')}
            className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tournament</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {['all', 'registration_open', 'in_progress', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs transition capitalize ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Format:</span>
          {['all', 'single_elimination', 'round_robin'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormatFilter(fmt)}
              className={`px-2.5 py-1 rounded text-xs transition capitalize ${
                formatFilter === fmt
                  ? 'bg-violet-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-950'
              }`}
            >
              {fmt.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading tournaments...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No tournaments found</h3>
          <p className="text-xs text-slate-500 mt-1">Try switching your filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition duration-300 p-6 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 uppercase">
                    {t.format.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'in_progress'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                        : t.status === 'registration_open'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ● {t.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-white mb-2">{t.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{t.rules}</p>

                <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Capacity</span>
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {t.currentParticipantsCount} / {t.maxParticipants} Registered
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Start Window</span>
                    </span>
                    <span className="text-white font-mono">
                      {new Date(t.startDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Prize Reward</span>
                    </span>
                    <span className="text-cyan-400 font-bold">{t.prizeDescription}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 flex items-center gap-3">
                <button
                  onClick={() => onNavigate('tournament-details', { tournamentId: t.id })}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition text-center"
                >
                  View Bracket
                </button>

                {t.status === 'registration_open' && (
                  <button
                    onClick={() => onNavigate('tournament-registration', { tournamentId: t.id })}
                    className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition text-center"
                  >
                    Register
                  </button>
                )}

                {t.status === 'in_progress' && (
                  <button
                    onClick={() => onNavigate('tournament-details', { tournamentId: t.id })}
                    className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition text-center"
                  >
                    Live Matches
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
