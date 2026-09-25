import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Match, Tournament } from '../types/database.js';
import { Trophy, ShieldCheck, Zap, Play, Calendar, Users, AlertCircle, ArrowUpRight } from 'lucide-react';

interface PlayerDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ onNavigate }) => {
  const { user, profile, t } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tList, pData] = await Promise.all([
          api.getTournaments(),
          user?.id ? api.getProfile(user.id) : Promise.resolve(null),
        ]);
        setTournaments(tList);
        if (pData?.matches) {
          setMyMatches(pData.matches);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const activeMatches = myMatches.filter((m) => m.status !== 'COMPLETED' && m.status !== 'CANCELLED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Identity Strip */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-display text-2xl font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
            {profile?.anonymousAlias?.slice(0, 2) || 'NX'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-white">{user?.displayName}</h1>
              <span className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                {profile?.anonymousAlias}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Verified Competitor</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Fair-Play Rating {profile?.fairPlayScore || 100}/100
              </span>
            </p>
          </div>
        </div>

        {/* Quick Launch CTA */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('match-room', { matchId: 'match_tourn_active_apex_1_r1_m1' })}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Launch Reaction Duel</span>
          </button>
        </div>
      </div>

      {/* Competitive Stats Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Skill Rating (Elo)</span>
            <Trophy className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-display text-3xl font-bold text-white">{profile?.skillRating || 1200}</div>
          <div className="text-[11px] text-cyan-400 mt-1 font-mono">Rank Tier: Gold Competitor</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Matches Record</span>
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <div className="font-display text-3xl font-bold text-white">
            {profile?.matchesWon || 0}W <span className="text-slate-500 text-xl font-normal">/ {profile?.matchesLost || 0}L</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {profile?.matchesPlayed
              ? `${Math.round(((profile.matchesWon || 0) / profile.matchesPlayed) * 100)}% Win Rate`
              : '0% Win Rate'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Tournament Trophies</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display text-3xl font-bold text-white">{profile?.tournamentWins || 0}</div>
          <div className="text-[11px] text-amber-400 mt-1 font-mono">Champion Titles Won</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Fair-Play Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display text-3xl font-bold text-emerald-400">{profile?.fairPlayScore || 100}%</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">Zero Penalties Recorded</div>
        </div>
      </div>

      {/* Active Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Active & Upcoming Scheduled Matches</span>
          </h2>
          <button
            onClick={() => onNavigate('my-matches')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
          >
            <span>View All Schedules</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeMatches.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
            <p className="text-slate-400 text-xs mb-3">No active pending match rooms. Join a tournament to get scheduled!</p>
            <button
              onClick={() => onNavigate('tournaments')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold"
            >
              Browse Open Tournaments
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMatches.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-xl bg-slate-900/80 border border-cyan-900/40 hover:border-cyan-500/50 transition shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-400 font-mono font-semibold">
                    {m.matchRoomCode} • Round {m.roundIndex}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                    {m.status}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-slate-800">
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">{m.player1.anonymousAlias}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {m.player1.ready ? 'READY' : 'WAITING'} • Score: {m.player1.score}
                    </div>
                  </div>
                  <div className="font-display font-bold text-slate-500 text-sm">VS</div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{m.player2.anonymousAlias}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {m.player2.ready ? 'READY' : 'WAITING'} • Score: {m.player2.score}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Scheduled: {new Date(m.scheduledStartTime).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => onNavigate('match-room', { matchId: m.id })}
                    className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <span>Enter Match Lobby</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Active Tournaments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Active Tournaments</h2>
          <button
            onClick={() => onNavigate('tournaments')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
          >
            <span>Explore All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.slice(0, 3).map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 uppercase">
                    {t.format.replace('_', ' ')}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      t.status === 'in_progress' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    ● {t.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h3 className="font-display font-bold text-white text-base mb-2">{t.title}</h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{t.rules}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Prize Pool</div>
                  <div className="font-bold text-cyan-400">{t.prizeDescription}</div>
                </div>
                <button
                  onClick={() => onNavigate('tournament-details', { tournamentId: t.id })}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
                >
                  View Bracket
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
