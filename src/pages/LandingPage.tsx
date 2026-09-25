import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Gamepad2, ShieldCheck, Zap, Trophy, Users, ArrowRight, EyeOff, Scale, Play } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t, language } = useAuth();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20 border-b border-cyan-950/40">
        <div className="absolute inset-0 cyber-grid opacity-25 pointer-events-none" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white mb-6 leading-tight">
            {t.hero.title}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('tournaments')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition duration-200 flex items-center justify-center gap-2"
            >
              <span>{t.hero.exploreBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('match-room', { matchId: 'match_tourn_active_apex_1_r1_m1' })}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-violet-500 text-slate-100 font-semibold text-sm hover:bg-slate-800 transition duration-200 flex items-center justify-center gap-2 group"
            >
              <Play className="w-4 h-4 text-violet-400 group-hover:scale-110 transition duration-200" />
              <span>{t.hero.quickPlayBtn}</span>
            </button>
          </div>

          {/* Key Stats Bar */}
          <div className="mt-14 pt-8 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <div className="font-display text-2xl sm:text-3xl font-bold text-cyan-400">100%</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{t.hero.statServerTick}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <div className="font-display text-2xl sm:text-3xl font-bold text-violet-400">110ms</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Human Reflex Neural Limit</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
              <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-400">AI Explainable</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{t.hero.statFairPlay}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Game Section: Reaction Grid Duel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-cyan-900/40 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-violet-950/60 border border-violet-500/40 text-violet-300 text-xs font-semibold uppercase">
                <Gamepad2 className="w-3.5 h-3.5 text-violet-400" />
                <span>Original Competitive Title</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                Reaction Grid Duel
              </h2>

              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                An original browser reflex duel where two competitors receive synchronized server-seeded visual targets on a 4x4 sensory grid over 5 high-speed rounds.
              </p>

              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <span>Deterministic server seeds guarantee identical target sequences for both competitors.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <span>Client sends raw action telemetry; server validates coordinate, order, and millisecond latency.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <span>Sub-110ms impossible speeds or scripted macros immediately alert the server FairPlayAnalyzer.</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('match-room', { matchId: 'match_tourn_active_apex_1_r1_m1' })}
                  className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide transition flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Enter Match Room</span>
                </button>
                <button
                  onClick={() => onNavigate('rules')}
                  className="px-6 py-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-sm font-medium transition"
                >
                  Read Official Rulebook
                </button>
              </div>
            </div>

            {/* Interactive Grid Preview Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-72 sm:w-80 p-5 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE DUAL GRID
                  </span>
                  <span className="text-slate-400">ROUND 1 / 5</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-mono transition-all duration-300 ${
                        i === 6
                          ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/50 scale-105'
                          : i === 13
                          ? 'bg-rose-500/80 text-white font-bold animate-pulse'
                          : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {i === 6 ? 'HIT!' : i === 13 ? 'WARN' : ''}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>P1: 182ms (VALID)</span>
                  <span className="text-cyan-400">+920 PTS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            Built for Competitive Integrity
          </h2>
          <p className="text-slate-400 text-sm">
            Architected specifically to solve cheating, toxic intimidation, and organizer result manipulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition">
            <div className="w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">Anonymous Lobby Mode</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Competitors are masked with randomized handles (e.g. Player-4821). Real names, emails, and opponent histories remain invisible until the match concludes.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition">
            <div className="w-12 h-12 rounded-lg bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">16-Layer Anti-Cheat Guard</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sub-110ms human reflex thresholds, click frequency rate limiting, out-of-order action trapping, and clock skew validation prevent macros and memory injectors.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">AI-Assisted Human Moderation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Gemini 3.8 Flash evaluates match telemetry and delivers explainable classifications. AI never automatically bans—human moderators review full replay logs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
