import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Match } from '../types/database.js';
import { Trophy, Clock, ShieldCheck, ArrowLeft, ArrowUpRight, Scale } from 'lucide-react';

interface MatchHistoryPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MatchHistoryPage: React.FC<MatchHistoryPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const tList = await api.getTournaments();
        const all: Match[] = [];
        for (const t of tList) {
          try {
            const d = await api.getTournamentDetails(t.id);
            if (d.matches) all.push(...d.matches);
          } catch (e) {}
        }
        setMatches(all.filter((m) => m.status === 'COMPLETED'));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide">
            Match History & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete event log archives with server timestamps, reaction latencies, and immutable cryptographic hashes.
          </p>
        </div>

        <button
          onClick={() => onNavigate('disputes')}
          className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
        >
          <Scale className="w-4 h-4 text-amber-400" />
          <span>Disputes & Appeals</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading match archives...</div>
      ) : matches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No completed matches found</h3>
          <p className="text-xs text-slate-500 mt-1">Complete a match duel to generate an immutable archive record.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const isWinnerP1 = m.winnerUserId === m.player1.userId;
            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition duration-300 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-cyan-400 font-bold">{m.matchRoomCode}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
                    <span className="px-2 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      VERIFIED
                    </span>
                  </div>

                  <div className="flex items-center gap-6 pt-1 text-sm font-semibold text-white">
                    <span className={isWinnerP1 ? 'text-cyan-300' : 'text-slate-400'}>
                      {m.player1.anonymousAlias} ({m.player1.score} pts)
                    </span>
                    <span className="text-slate-600 text-xs font-normal">VS</span>
                    <span className={!isWinnerP1 ? 'text-cyan-300' : 'text-slate-400'}>
                      {m.player2.anonymousAlias} ({m.player2.score} pts)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => onNavigate('result-page', { matchId: m.id })}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Inspect Audit</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onNavigate('disputes')}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 text-xs font-semibold transition"
                  >
                    Dispute
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
