import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Match } from '../types/database.js';
import { Calendar, Clock, Play, Trophy, Shield, ArrowUpRight } from 'lucide-react';

interface MatchSchedulePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MatchSchedulePage: React.FC<MatchSchedulePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my' | 'live' | 'completed'>('all');

  useEffect(() => {
    async function load() {
      try {
        const tList = await api.getTournaments();
        // Fetch details of tournaments to gather all matches
        const allMatches: Match[] = [];
        for (const t of tList.slice(0, 5)) {
          try {
            const details = await api.getTournamentDetails(t.id);
            if (details.matches) {
              allMatches.push(...details.matches);
            }
          } catch (e) {}
        }
        setMatches(allMatches);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const filtered = matches.filter((m) => {
    if (filter === 'my') {
      return m.player1.userId === user?.id || m.player2.userId === user?.id;
    }
    if (filter === 'live') {
      return m.status === 'ACTIVE' || m.status === 'READY' || m.status === 'COUNTDOWN';
    }
    if (filter === 'completed') {
      return m.status === 'COMPLETED';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide">
            Automated Match Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Server-synchronized schedule, countdown clocks, and instant pre-match anonymous lobby access.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {(['all', 'my', 'live', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                filter === f
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'my' ? 'My Matches' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Match Schedule Table / Cards */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading match schedules...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No matches found for this filter</h3>
          <p className="text-xs text-slate-500 mt-1">Check back as tournaments advance through brackets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition duration-300 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 font-bold">
                  {m.matchRoomCode} • Round {m.roundIndex}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    m.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : m.status === 'ACTIVE'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/30 animate-pulse'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  ● {m.status}
                </span>
              </div>

              {/* Competitors Display */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="text-left flex-1 truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {m.player1.anonymousAlias}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Score: {m.player1.score}
                  </div>
                </div>

                <div className="px-3 font-display font-bold text-slate-600 text-xs">VS</div>

                <div className="text-right flex-1 truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {m.player2.anonymousAlias}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Score: {m.player2.score}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Start: {new Date(m.scheduledStartTime).toLocaleTimeString()}</span>
                </div>

                <button
                  onClick={() => onNavigate('match-room', { matchId: m.id })}
                  className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md"
                >
                  <span>{m.status === 'COMPLETED' ? 'View Results' : 'Enter Lobby'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
