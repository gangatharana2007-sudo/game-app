import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { LeaderboardEntry } from '../types/database.js';
import { Trophy, ShieldCheck, Medal, Search, Flame, ArrowUpRight } from 'lucide-react';

interface LeaderboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getLeaderboard()
      .then((data) => setEntries(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter(
    (e) =>
      e.displayName.toLowerCase().includes(search.toLowerCase()) ||
      e.anonymousAlias.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide">
            Global Skill Ratings (Elo)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Competitive ladder ranked by server-verified tournament wins, match reflex accuracy, and fair-play rating.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search competitor alias..."
            className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {entries.slice(0, 3).map((top, idx) => (
          <div
            key={top.id}
            className={`p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between shadow-xl ${
              idx === 0
                ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/50 shadow-amber-500/10'
                : idx === 1
                ? 'bg-gradient-to-b from-slate-800/40 to-slate-900 border-slate-600/50'
                : 'bg-gradient-to-b from-amber-900/20 to-slate-900 border-amber-700/40'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-black text-3xl text-white">
                #{idx + 1}
              </span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-slate-950 ${
                  idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-700 text-white'
                }`}
              >
                <Medal className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="font-display font-bold text-xl text-white mb-0.5">{top.displayName}</div>
              <div className="text-xs font-mono text-cyan-400 mb-4">{top.anonymousAlias}</div>

              <div className="space-y-1.5 text-xs text-slate-300 py-3 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Skill Rating:</span>
                  <span className="font-mono font-bold text-white text-sm">{top.skillRating} MMR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Win Rate:</span>
                  <span className="font-mono text-emerald-400">{top.winRate}% ({top.wins}W - {top.losses}L)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fair-Play Rating:</span>
                  <span className="font-mono text-cyan-300">{top.fairPlayRating}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5">
              {top.badges.map((b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Competitor</th>
                <th className="py-3.5 px-4">Anonymous Alias</th>
                <th className="py-3.5 px-4 text-right">Skill MMR</th>
                <th className="py-3.5 px-4 text-right">Record (W-L)</th>
                <th className="py-3.5 px-4 text-right">Win Rate</th>
                <th className="py-3.5 px-4 text-center">Fair Play</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading rankings...
                  </td>
                </tr>
              ) : filtered.map((e, index) => (
                <tr
                  key={e.id}
                  className={`hover:bg-slate-800/50 transition ${
                    e.userId === user?.id ? 'bg-cyan-950/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                    #{index + 1}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {e.displayName}
                    {e.userId === user?.id && (
                      <span className="ml-2 text-[10px] text-cyan-400 font-normal">(You)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-cyan-300">{e.anonymousAlias}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    {e.skillRating}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    {e.wins}W - {e.losses}L
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                    {e.winRate}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{e.fairPlayRating}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
