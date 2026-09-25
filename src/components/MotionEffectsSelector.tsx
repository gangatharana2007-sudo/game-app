import React, { useState } from 'react';
import { useMotion, MotionMode } from '../context/MotionContext.js';
import { Sparkles, Eye, Power, Check, Sliders, X, Cpu, Gauge } from 'lucide-react';

interface MotionEffectsSelectorProps {
  variant?: 'inline' | 'dropdown' | 'modal' | 'pill';
  onClose?: () => void;
}

export const MotionEffectsSelector: React.FC<MotionEffectsSelectorProps> = ({
  variant = 'modal',
  onClose,
}) => {
  const { motionMode, setMotionMode, devToolsOpen, toggleDevTools } = useMotion();

  const options: { id: MotionMode; label: string; desc: string; icon: any }[] = [
    {
      id: 'full',
      label: 'Full',
      desc: 'Cinematic cyber aurora, floating luminous particles, and undulating energy waves.',
      icon: Sparkles,
    },
    {
      id: 'reduced',
      label: 'Reduced',
      desc: 'Disables moving particles and waving ribbons. Displays calm static gradients and soft glow.',
      icon: Eye,
    },
    {
      id: 'off',
      label: 'Off',
      desc: 'Turns off decorative movement, waves, and particles. Clean solid arena base with subtle grid.',
      icon: Power,
    },
  ];

  if (variant === 'pill') {
    return (
      <div className="inline-flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = motionMode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setMotionMode(opt.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium text-[11px] ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title={opt.desc}
            >
              <Icon className="w-3 h-3" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-cyan-900/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md max-w-sm w-full space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white">Motion Effects</h3>
            <p className="text-[10px] text-slate-400">Customized visual intensity & accessibility</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3 Choices */}
      <div className="space-y-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = motionMode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setMotionMode(opt.id)}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-white shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div
                className={`p-2 rounded-lg mt-0.5 ${
                  isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-xs text-white">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer / Developer Tools Toggle */}
      <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span className="text-[10px]">Saved automatically to your device</span>
        <button
          onClick={toggleDevTools}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[10px] hover:underline"
          title="Toggle developer preview inspector (Alt + M)"
        >
          <Sliders className="w-3 h-3" />
          <span>{devToolsOpen ? 'Close Dev Inspector' : 'Dev Inspector'}</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Developer-only Debug Preview Dock (Protected from normal users, toggled via Alt + M)
 */
export const MotionDevInspector: React.FC<{ currentPage: string }> = ({ currentPage }) => {
  const { motionMode, setMotionMode, devToolsOpen, setDevToolsOpen } = useMotion();

  if (!devToolsOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-xs w-full font-mono text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
          <Cpu className="w-3.5 h-3.5" />
          <span>ARENA MOTION DEV DOCK</span>
        </div>
        <button
          onClick={() => setDevToolsOpen(false)}
          className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
          title="Close (Alt + M)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 text-[11px] text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-500">Route Context:</span>
          <span className="text-cyan-300 font-semibold">{currentPage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Motion Mode:</span>
          <span className="text-violet-300 font-bold uppercase">{motionMode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tab State:</span>
          <span className="text-emerald-400">Foreground Active</span>
        </div>
      </div>

      {/* Quick Mode Switches */}
      <div className="grid grid-cols-3 gap-1 pt-1">
        {(['full', 'reduced', 'off'] as MotionMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setMotionMode(mode)}
            className={`py-1 rounded text-[10px] font-bold uppercase transition ${
              motionMode === mode
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="text-[9px] text-slate-500 text-center pt-1 border-t border-slate-900">
        Press <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-700 text-slate-300">Alt+M</kbd> anytime to toggle
      </div>
    </div>
  );
};
