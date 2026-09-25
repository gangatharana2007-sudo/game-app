import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { Match } from '../types/database.js';
import { EyeOff, ShieldCheck, Clock, CheckCircle2, AlertTriangle, ArrowLeft, Play, UserCheck } from 'lucide-react';

interface PreMatchLobbyPageProps {
  matchId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const PreMatchLobbyPage: React.FC<PreMatchLobbyPageProps> = ({ matchId, onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState<number>(120);

  const loadMatch = async () => {
    try {
      const data = await api.getMatch(matchId);
      setMatch(data.match);

      // If match is already ACTIVE or COUNTDOWN, go straight to live game
      if (data.match.status === 'ACTIVE' || data.match.status === 'COUNTDOWN') {
        onNavigate('live-game', { matchId: data.match.id });
      } else if (data.match.status === 'COMPLETED') {
        onNavigate('result-page', { matchId: data.match.id });
      }
    } catch (e: any) {
      showToast(e.message || 'Match not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatch();
    const interval = setInterval(() => {
      if (user?.id) {
        api.sendHeartbeat(matchId, user.id)
          .then((res) => {
            setMatch(res.match);
            if (res.match.status === 'COUNTDOWN' || res.match.status === 'ACTIVE') {
              onNavigate('live-game', { matchId: res.match.id });
            }
          })
          .catch(() => {});
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [matchId, user?.id]);

  // Grace period countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setGracePeriodRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReady = async () => {
    if (!user || !match) return;
    try {
      const updated = await api.setReady(match.id, user.id);
      setMatch(updated);
      showToast('You are marked READY! Awaiting opponent or countdown.', 'info');
      if (updated.status === 'COUNTDOWN' || updated.status === 'ACTIVE') {
        onNavigate('live-game', { matchId: updated.id });
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSimulateForfeit = async (forfeitUserId: string) => {
    if (!match) return;
    try {
      await api.forfeitMatch(match.id, forfeitUserId, 'Grace period expired without joining');
      showToast('Opponent exceeded grace period. Forfeit victory awarded!', 'warning');
      loadMatch();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-xs">Entering anonymous pre-match lobby...</div>;
  }

  if (!match) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-slate-400 text-xs">
        Match lobby not available.
      </div>
    );
  }

  const isPlayer1 = user?.id === match.player1.userId;
  const myPlayer = isPlayer1 ? match.player1 : match.player2;
  const oppPlayer = isPlayer1 ? match.player2 : match.player1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('my-matches')}
        className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Matches</span>
      </button>

      {/* Main Lobby Container */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Lobby Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono mb-1">
              <span className="text-cyan-400 font-bold">{match.matchRoomCode}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Round {match.roundIndex} of 5</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Anonymous Pre-Match Lobby
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Anti-Cheat Guard Active</span>
            </div>
          </div>
        </div>

        {/* Anonymous Guarantee Strip */}
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-950 flex items-start gap-3">
          <EyeOff className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-white mb-0.5">Zero Opponent Telemetry Leakage</div>
            <p className="text-slate-400 leading-relaxed">
              In accordance with NEXORA ARENA competitive protocols, your real name, country, and match history are masked. Both players see only deterministic anonymous aliases during competition.
            </p>
          </div>
        </div>

        {/* Dual Competitor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* My Player Card */}
          <div className="p-6 rounded-xl bg-slate-950/80 border-2 border-cyan-500/60 shadow-lg shadow-cyan-500/10 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-[10px]">
                YOU
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>

            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center font-display text-xl font-bold text-slate-950 shadow-md mb-2">
                {myPlayer.anonymousAlias.slice(0, 2)}
              </div>
              <div className="font-display text-xl font-bold text-white">{myPlayer.anonymousAlias}</div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                {myPlayer.ready ? (
                  <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CONFIRMED READY
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">CLICK READY TO COMMENCE</span>
                )}
              </div>
            </div>

            <button
              onClick={handleReady}
              disabled={myPlayer.ready}
              className={`w-full py-3 rounded-lg text-xs font-bold tracking-wider uppercase transition shadow-lg ${
                myPlayer.ready
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
              }`}
            >
              {myPlayer.ready ? 'Locked & Ready' : 'Mark Ready'}
            </button>
          </div>

          {/* Opponent Player Card */}
          <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono font-bold text-[10px]">
                OPPONENT
              </span>
              <span className="text-cyan-400 flex items-center gap-1 font-semibold text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                {oppPlayer.connected ? 'Connected' : 'Syncing'}
              </span>
            </div>

            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-300 mx-auto flex items-center justify-center font-display text-xl font-bold mb-2">
                {oppPlayer.anonymousAlias.slice(0, 2)}
              </div>
              <div className="font-display text-xl font-bold text-white">{oppPlayer.anonymousAlias}</div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                {oppPlayer.ready ? (
                  <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    CONFIRMED READY
                  </span>
                ) : (
                  <span className="text-slate-500">Waiting for competitor...</span>
                )}
              </div>
            </div>

            {/* Quick Simulate Opponent Ready or Forfeit in Demo */}
            {!oppPlayer.ready && (
              <div className="flex gap-2">
                <button
                  onClick={() => api.setReady(match.id, oppPlayer.userId).then((m) => setMatch(m))}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Simulate Opponent Ready
                </button>
                <button
                  onClick={() => handleSimulateForfeit(oppPlayer.userId)}
                  className="px-3 py-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-semibold transition"
                  title="Test absence forfeit rule"
                >
                  Forfeit
                </button>
              </div>
            )}

            {oppPlayer.ready && (
              <div className="py-2.5 text-center text-xs font-semibold text-emerald-400 bg-emerald-950/40 rounded-lg border border-emerald-500/30">
                Opponent Ready
              </div>
            )}
          </div>
        </div>

        {/* Absence Grace Period Countdown */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Absence Grace Period Countdown:</span>
          </div>
          <span className="font-mono font-bold text-amber-400 text-sm">
            00:{gracePeriodRemaining < 10 ? `0${gracePeriodRemaining}` : gracePeriodRemaining}
          </span>
        </div>

        {/* Start Game Button (if both ready) */}
        {match.player1.ready && match.player2.ready && (
          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate('live-game', { matchId: match.id })}
              className="px-8 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm tracking-wide uppercase transition shadow-xl shadow-cyan-500/20 flex items-center gap-2 mx-auto animate-pulse"
            >
              <Play className="w-4 h-4" />
              <span>Initiate Reaction Grid Duel Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
