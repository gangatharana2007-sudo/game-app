import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { Lock, Mail, User, Shield, CheckCircle, Globe } from 'lucide-react';

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { login, register, switchDemoUser, language, t } = useAuth();
  const { showToast } = useNotifications();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [preferredLang, setPreferredLang] = useState<'en' | 'ta'>(language);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email);
        showToast('Signed in successfully', 'success');
        onNavigate('player-dashboard');
      } else {
        if (displayName.length < 3) {
          setError('Display name must be at least 3 characters');
          setLoading(false);
          return;
        }
        await register({ email, displayName, preferredLanguage: preferredLang });
        showToast('Account created and verified! Anonymous handle generated.', 'success');
        onNavigate('player-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (userId: string) => {
    await switchDemoUser(userId);
    showToast('Logged in as demo persona', 'info');
    onNavigate('player-dashboard');
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Toggle Mode */}
        <div className="flex rounded-lg bg-slate-950 p-1 mb-6 border border-slate-800">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
              mode === 'login' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.nav.login}
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition ${
              mode === 'register' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.nav.signup}
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome Back, Competitor' : 'Join Nexora Arena'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Access scheduled matches and competitive rating'
              : 'Sign up to compete anonymously with verified fair play'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Your real name is kept private during matches. An anonymous alias like Player-4821 is assigned.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="competitor@nexora.arena"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Language</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredLang('en')}
                  className={`flex-1 py-1.5 rounded border text-xs font-medium ${
                    preferredLang === 'en'
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLang('ta')}
                  className={`flex-1 py-1.5 rounded border text-xs font-medium ${
                    preferredLang === 'ta'
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Arena' : 'Complete Registration'}
          </button>
        </form>

        {/* Quick Demo Switcher Section */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick Instant Demo Login
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('demo_player_1')}
              className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition"
            >
              <div className="text-xs font-bold text-cyan-400">Player-4821</div>
              <div className="text-[10px] text-slate-400">Arun Kumar (Player)</div>
            </button>
            <button
              onClick={() => handleQuickDemo('user_admin_1')}
              className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-violet-500/50 text-left transition"
            >
              <div className="text-xs font-bold text-violet-400">Admin</div>
              <div className="text-[10px] text-slate-400">Commander Nexora</div>
            </button>
            <button
              onClick={() => handleQuickDemo('user_mod_1')}
              className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition"
            >
              <div className="text-xs font-bold text-emerald-400">Moderator</div>
              <div className="text-[10px] text-slate-400">Sentinel Guardian</div>
            </button>
            <button
              onClick={() => handleQuickDemo('user_org_1')}
              className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition"
            >
              <div className="text-xs font-bold text-amber-400">Organizer</div>
              <div className="text-[10px] text-slate-400">Aero Esports Org</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
