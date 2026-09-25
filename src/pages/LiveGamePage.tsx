import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { Match, ReactionTarget } from '../types/database.js';
import { Shield, Zap, AlertTriangle, Eye, Volume2, VolumeX, CheckCircle, RotateCcw } from 'lucide-react';

interface LiveGamePageProps {
  matchId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const LiveGamePage: React.FC<LiveGamePageProps> = ({ matchId, onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundPhase, setRoundPhase] = useState<'WAITING' | 'COUNTDOWN' | 'SPAWNED' | 'RESOLVED'>('COUNTDOWN');
  const [countdownValue, setCountdownValue] = useState(3);
  const [activeTarget, setActiveTarget] = useState<ReactionTarget | null>(null);
  const [distractorTarget, setDistractorTarget] = useState<ReactionTarget | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roundTimerRef = useRef<any>(null);
  const targetSpawnTimeoutRef = useRef<any>(null);

  // Play audio tones using Web Audio API
  const playTone = (freq: number, type: OscillatorType = 'sine', duration = 0.12) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Anti-cheat tab visibility detector
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && user?.id && match?.id) {
        api.sendTelemetry(match.id, user.id, 'TAB_FOCUS_LOST', 'Competitor switched browser tab during round.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [match?.id, user?.id]);

  // Sync round phase to document attribute for background reactivity
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-arena-phase',
      roundPhase === 'COUNTDOWN' ? 'countdown' : 'active'
    );
    return () => {
      document.documentElement.removeAttribute('data-arena-phase');
    };
  }, [roundPhase]);

  // Initial load & Polling
  useEffect(() => {
    api.getMatch(matchId)
      .then((data) => {
        setMatch(data.match);
        setCurrentRound(data.match.currentRound);
        if (data.match.status === 'COMPLETED') {
          onNavigate('result-page', { matchId: data.match.id });
        }
      })
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoading(false));

    // Server heartbeat loop
    const hb = setInterval(() => {
      if (user?.id) {
        api.sendHeartbeat(matchId, user.id)
          .then((res) => {
            setMatch((prev) => (prev ? { ...prev, ...res.match } : res.match));
            if (res.match.status === 'COMPLETED') {
              onNavigate('result-page', { matchId: res.match.id });
            }
          })
          .catch(() => {});
      }
    }, 2000);

    return () => clearInterval(hb);
  }, [matchId, user?.id]);

  // Round progression logic
  useEffect(() => {
    if (!match || match.status === 'COMPLETED') return;

    // Start 3-second Countdown for the round
    setRoundPhase('COUNTDOWN');
    setCountdownValue(3);
    setActiveTarget(null);
    setDistractorTarget(null);

    const countInterval = setInterval(() => {
      setCountdownValue((val) => {
        if (val <= 1) {
          clearInterval(countInterval);
          initiateRoundSpawn();
          return 0;
        }
        playTone(440, 'triangle', 0.08);
        return val - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countInterval);
      clearTimeout(targetSpawnTimeoutRef.current);
    };
  }, [currentRound, match?.id]);

  const initiateRoundSpawn = async () => {
    if (!match) return;
    try {
      await api.startRound(match.id);
    } catch (e) {}

    playTone(880, 'sine', 0.2);

    const roundTargets = match.roundTargets || [];
    const primary = roundTargets.find((t) => t.round === currentRound && t.targetType === 'correct');
    const distractor = roundTargets.find((t) => t.round === currentRound && t.targetType === 'distractor');

    const spawnDelay = primary ? primary.displayAtMs : 800;

    targetSpawnTimeoutRef.current = setTimeout(() => {
      setRoundPhase('SPAWNED');
      setActiveTarget(primary || null);
      setDistractorTarget(distractor || null);
      playTone(1200, 'square', 0.1);
    }, spawnDelay);
  };

  // Grid Cell Click Handler (Sends RAW client action to server, NEVER client-side score)
  const handleCellClick = async (gridIndex: number) => {
    if (!match || !user || isSubmitting || roundPhase !== 'SPAWNED') return;

    setIsSubmitting(true);
    const clientTimestamp = Date.now();
    const targetId = activeTarget?.id || `target_r${currentRound}_primary`;

    try {
      const res = await api.submitAction(match.id, user.id, {
        round: currentRound,
        targetId,
        gridIndex,
        clientTimestamp,
      });

      setMatch(res.match);
      setLastReactionTime(res.validation.reactionTimeMs);
      setLastFeedback(res.validation.reason);

      if (res.validation.valid) {
        playTone(1050, 'sine', 0.15);
      } else {
        playTone(250, 'sawtooth', 0.25);
      }

      setRoundPhase('RESOLVED');

      // Check if impossible speed flagged
      if (res.validation.isImpossibleSpeed) {
        showToast('Telemetry Alert: Reaction time under 110ms recorded for audit review.', 'warning');
      }

      // Progress to next round after short feedback delay
      setTimeout(async () => {
        if (currentRound < match.totalRounds) {
          setCurrentRound((r) => r + 1);
        } else {
          // Finalize match on server
          const adv = await api.advanceRound(match.id);
          setMatch(adv.match);
          showToast('Match concluded! Calculating verified scores...', 'success');
          setTimeout(() => {
            onNavigate('result-page', { matchId: match.id });
          }, 1500);
        }
        setIsSubmitting(false);
      }, 1500);
    } catch (err: any) {
      showToast(err.message, 'error');
      setIsSubmitting(false);
    }
  };

  if (loading || !match) {
    return (
      <div className="text-center py-24 text-slate-400 text-xs">
        Syncing server-authoritative match room...
      </div>
    );
  }

  const isPlayer1 = user?.id === match.player1.userId;
  const myPlayer = isPlayer1 ? match.player1 : match.player2;
  const oppPlayer = isPlayer1 ? match.player2 : match.player1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* HUD Header Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl flex items-center justify-between">
        {/* Left: My Stats */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-display font-bold text-sm flex items-center justify-center">
            YOU
          </div>
          <div>
            <div className="text-xs font-mono text-cyan-400 font-bold">{myPlayer.anonymousAlias}</div>
            <div className="font-display font-extrabold text-2xl text-white">
              {myPlayer.score} <span className="text-[10px] text-slate-400 font-normal">PTS</span>
            </div>
          </div>
        </div>

        {/* Center: Round Indicator & Match Code */}
        <div className="text-center">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            {match.matchRoomCode}
          </div>
          <div className="font-display font-bold text-lg text-white">
            ROUND {currentRound} / {match.totalRounds}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-mono mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SERVER TICK: 60Hz</span>
          </div>
        </div>

        {/* Right: Opponent Anonymous Stats */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-xs font-mono text-slate-400 font-bold">{oppPlayer.anonymousAlias}</div>
            <div className="font-display font-extrabold text-2xl text-slate-300">
              {oppPlayer.score} <span className="text-[10px] text-slate-500 font-normal">PTS</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 font-display font-bold text-sm flex items-center justify-center">
            OPP
          </div>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Anti-Cheat Shield Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Anti-Cheat Guard Active</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute top-4 right-4 p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white transition"
          title="Toggle SFX"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Feedback / Round Notice Overlay */}
        <div className="h-10 flex items-center justify-center mb-4 text-center">
          {roundPhase === 'COUNTDOWN' && (
            <div className="font-display font-bold text-2xl text-cyan-400 animate-bounce">
              ROUND {currentRound} STARTING IN {countdownValue}...
            </div>
          )}

          {roundPhase === 'SPAWNED' && (
            <div className="font-display font-bold text-sm text-cyan-300 tracking-wider uppercase animate-pulse">
              CLICK THE HIGHLIGHTED TARGET CELL IMMEDIATELY!
            </div>
          )}

          {roundPhase === 'RESOLVED' && lastFeedback && (
            <div className="space-y-0.5">
              <div className="font-display font-bold text-sm text-emerald-400">
                {lastFeedback}
              </div>
              {lastReactionTime !== null && (
                <div className="text-[11px] font-mono text-cyan-300">
                  Latency to Target: {lastReactionTime}ms
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4x4 Sensory Reaction Grid */}
        <div className="w-full max-w-sm sm:max-w-md aspect-square p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl grid grid-cols-4 gap-3 relative">
          {Array.from({ length: 16 }).map((_, gridIdx) => {
            const isTarget = roundPhase === 'SPAWNED' && activeTarget?.gridIndex === gridIdx;
            const isDistractor = roundPhase === 'SPAWNED' && distractorTarget?.gridIndex === gridIdx;

            return (
              <button
                key={gridIdx}
                disabled={roundPhase !== 'SPAWNED' || isSubmitting}
                onClick={() => handleCellClick(gridIdx)}
                className={`relative rounded-xl transition-all duration-150 flex items-center justify-center font-mono font-bold text-sm select-none ${
                  isTarget
                    ? 'bg-cyan-400 text-slate-950 scale-105 shadow-xl shadow-cyan-400/60 ring-4 ring-cyan-300 animate-pulse'
                    : isDistractor
                    ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/50 ring-2 ring-rose-400 animate-pulse'
                    : 'bg-slate-950/80 border border-slate-800 hover:border-slate-700 active:scale-95 text-slate-600'
                }`}
              >
                {isTarget ? (
                  <span className="font-display font-black text-lg">HIT!</span>
                ) : isDistractor ? (
                  <span className="font-display font-black text-xs">AVOID</span>
                ) : (
                  <span className="text-[10px] opacity-25">{gridIdx + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Telemetry Indicator Footer */}
        <div className="w-full max-w-md mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Client Actions: Raw Input Stream</span>
          <span className="text-cyan-400">Zero Score Trust</span>
        </div>
      </div>
    </div>
  );
};
