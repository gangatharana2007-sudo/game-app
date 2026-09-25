import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { useMotion } from '../context/MotionContext.js';
import { MotionEffectsSelector } from './MotionEffectsSelector.js';
import { api } from '../services/api.js';
import { ShieldCheck, Cpu, RefreshCw, Scale, Lock, HeartHandshake, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { user, t } = useAuth();
  const { showToast } = useNotifications();
  const { motionMode } = useMotion();
  const [showMotionModal, setShowMotionModal] = useState(false);

  const handleResetSeed = async () => {
    try {
      await api.resetDemoSeed(user?.id || 'user_admin_1');
      showToast('Demo environment reset successfully! 16 demo players and matches restored.', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      showToast(e.message || 'Reset failed', 'error');
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-900 mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="font-display font-bold text-white text-base tracking-wider flex items-center gap-2 mb-3">
              <span className="text-cyan-400">NEXORA</span> ARENA
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              Original browser-based esports tournament platform featuring server-authoritative Reaction Grid Duel, zero-guess anti-cheat, and automated tournament orchestration.
            </p>
            <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>Tick: Authoritative 60Hz Server Loop</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Tournaments</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('tournaments')} className="hover:text-cyan-300 transition">
                  Browse Active Brackets
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-matches')} className="hover:text-cyan-300 transition">
                  My Match Schedules
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('teams')} className="hover:text-cyan-300 transition">
                  Rosters & Teams
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('leaderboard')} className="hover:text-cyan-300 transition">
                  Global Skill Rating
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Fair Play & Legal</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('rules')} className="hover:text-cyan-300 transition flex items-center gap-1.5">
                  <Scale className="w-3 h-3 text-cyan-400" />
                  <span>Fair-Play & Anti-Cheat Rules</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-cyan-300 transition flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-violet-400" />
                  <span>Privacy & Data Consent</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('disputes')} className="hover:text-cyan-300 transition flex items-center gap-1.5">
                  <HeartHandshake className="w-3 h-3 text-amber-400" />
                  <span>Disputes & Appeals Board</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Operational Center</h4>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('organizer-dashboard')}
                className="block text-slate-400 hover:text-cyan-300 transition"
              >
                Organizer Hub
              </button>
              <button
                onClick={() => onNavigate('moderator-dashboard')}
                className="block text-slate-400 hover:text-cyan-300 transition"
              >
                Anti-Cheat Telemetry Review
              </button>
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className="block text-slate-400 hover:text-cyan-300 transition"
              >
                Admin Command Center
              </button>
              
              <div className="pt-3">
                <button
                  onClick={handleResetSeed}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:text-rose-300 text-slate-400 flex items-center gap-2 transition text-[11px]"
                  title="Restores 16 demo players, 4 teams, and active tournaments"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Developer Reset Demo Seed</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <div>
            © 2026 NEXORA ARENA. All game logic and visual assets are 100% original. Built with zero third-party game dependencies.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMotionModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 transition text-[11px]"
              title="Change background motion effects"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Motion Effects: <strong className="capitalize text-cyan-300 font-semibold">{motionMode}</strong></span>
            </button>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Cheat AI Telemetry Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Motion Effects Modal */}
      {showMotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <MotionEffectsSelector variant="modal" onClose={() => setShowMotionModal(false)} />
        </div>
      )}
    </footer>
  );
};
