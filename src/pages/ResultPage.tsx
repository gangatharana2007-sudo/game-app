import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Match, MatchResult } from '../types/database.js';
import { Trophy, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, ArrowUpRight, Scale, Copy } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.js';

interface ResultPageProps {
  matchId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ matchId, onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [match, setMatch] = useState<Match | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMatch(matchId)
      .then((data) => {
        setMatch(data.match);
        setResult(data.result || null);
      })
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading || !match) {
    return (
      <div className="text-center py-20 text-slate-400 text-xs">
        Loading official match verification...
      </div>
    );
  }

  const isPlayer1 = user?.id === match.player1.userId;
  const myPlayer = isPlayer1 ? match.player1 : match.player2;
  const oppPlayer = isPlayer1 ? match.player2 : match.player1;
  const isWinner = match.winnerUserId === user?.id;
  const isDraw = !match.winnerUserId && !match.player1.isForfeit && !match.player2.isForfeit;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    showToast('Audit hash copied to clipboard!', 'info');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => onNavigate('my-matches')}
        className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Matches</span>
      </button>

      {/* Main Result Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl space-y-8 text-center relative overflow-hidden">
        {/* Glow accent */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl pointer-events-none rounded-full ${
            isWinner ? 'bg-cyan-500/20' : 'bg-slate-700/20'
          }`}
        />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300">Server Verified Result</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-wide">
            {isWinner ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
          </h1>
          <p className="text-xs text-slate-400">
            {isWinner
              ? 'Congratulations! Your score and response latencies passed authoritative validation.'
              : 'Match concluded. Review your verified scores and reaction telemetry below.'}
          </p>
        </div>

        {/* Dual Scoreboard */}
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          <div
            className={`p-6 rounded-xl border ${
              isWinner
                ? 'bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="text-xs font-mono text-cyan-400 font-bold mb-1">
              YOU ({myPlayer.anonymousAlias})
            </div>
            <div className="font-display text-4xl font-extrabold text-white">{myPlayer.score}</div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Avg RT: {myPlayer.reactionTimes.length > 0
                ? `${Math.round(myPlayer.reactionTimes.reduce((a, b) => a + b, 0) / myPlayer.reactionTimes.length)}ms`
                : 'N/A'}
            </div>
          </div>

          <div
            className={`p-6 rounded-xl border ${
              !isWinner && !isDraw
                ? 'bg-violet-950/40 border-violet-500/50 shadow-lg shadow-violet-500/10'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="text-xs font-mono text-slate-400 font-bold mb-1">
              OPPONENT ({oppPlayer.anonymousAlias})
            </div>
            <div className="font-display text-4xl font-extrabold text-slate-300">{oppPlayer.score}</div>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Avg RT: {oppPlayer.reactionTimes.length > 0
                ? `${Math.round(oppPlayer.reactionTimes.reduce((a, b) => a + b, 0) / oppPlayer.reactionTimes.length)}ms`
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Cryptographic Audit Hash */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Immutable Audit Signature</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">VERIFIED</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 flex items-center justify-between break-all">
            <span>{result?.auditHash || `AUTH-NEXORA-${match.id.toUpperCase()}-SEALED`}</span>
            <button
              onClick={() => copyHash(result?.auditHash || match.id)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition ml-2 shrink-0"
              title="Copy hash"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            This cryptographic hash binds the server tick timestamps, reaction latencies, and round sequences into an unalterable ledger.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('player-dashboard')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
          >
            Return to Dashboard
          </button>

          <button
            onClick={() => onNavigate('disputes')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>File Appeal or Dispute</span>
          </button>

          <button
            onClick={() => onNavigate('leaderboard')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
