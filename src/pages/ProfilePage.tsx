import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { useMotion, MotionMode } from '../context/MotionContext.js';
import { api } from '../services/api.js';
import { Match, PlayerProfile } from '../types/database.js';
import { Trophy, ShieldCheck, Mail, Globe, Users, ArrowUpRight, Award, CheckCircle, Sparkles } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, profile, language, setLanguage, logout } = useAuth();
  const { showToast } = useNotifications();
  const { motionMode, setMotionMode } = useMotion();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      api.getProfile(user.id)
        .then((res) => {
          if (res.matches) setMatches(res.matches);
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  if (!user || !profile) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-slate-400 text-xs">
        Please sign in to view your competitor profile.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Identity Profile Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-display text-3xl font-extrabold text-slate-950 shadow-xl shadow-cyan-500/20">
            {profile.anonymousAlias.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {user.displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold">
                {profile.anonymousAlias}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.email}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Fair-Play Score: {profile.fairPlayScore}%</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              logout();
              onNavigate('auth');
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile Details & Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Preferences & Security */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3">
            Account & Preferences
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Interface Language</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`py-2 rounded-lg border text-xs font-semibold transition ${
                  language === 'en'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`py-2 rounded-lg border text-xs font-semibold transition ${
                  language === 'ta'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          {/* Motion Effects Preference */}
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Motion Effects</span>
              </span>
              <span className="text-[10px] text-cyan-400 capitalize font-mono">{motionMode}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['full', 'reduced', 'off'] as MotionMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMotionMode(mode)}
                  className={`py-2 rounded-lg border text-xs font-semibold capitalize transition ${
                    motionMode === mode
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Full = Animated aurora & particles. Reduced = Static calm glow. Off = Minimal solid background.
            </p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Account Role</span>
              <span className="capitalize font-semibold text-violet-400">{user.role}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Account Status</span>
              <span className="capitalize font-semibold text-emerald-400">{user.status}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Competitive Division</span>
              <span className="font-semibold text-amber-400">Tier 1 Gold</span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Match History & Telemetry Breakdown */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-base text-white">Recent Match History</h3>
            <button
              onClick={() => onNavigate('match-history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Full Replay Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No match history recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 5).map((m) => {
                const isP1 = m.player1.userId === user.id;
                const myScore = isP1 ? m.player1.score : m.player2.score;
                const oppScore = isP1 ? m.player2.score : m.player1.score;
                const oppAlias = isP1 ? m.player2.anonymousAlias : m.player1.anonymousAlias;
                const won = m.winnerUserId === user.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => onNavigate('result-page', { matchId: m.id })}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          won ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {won ? 'W' : 'L'}
                      </div>
                      <div>
                        <div className="font-bold text-white">vs {oppAlias}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {m.matchRoomCode} • {new Date(m.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-white">
                        {myScore} - {oppScore}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono">Server Verified</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
