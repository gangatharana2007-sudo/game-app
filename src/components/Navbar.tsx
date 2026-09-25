import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { useMotion } from '../context/MotionContext.js';
import { MotionEffectsSelector } from './MotionEffectsSelector.js';
import { Bell, Shield, Users, Trophy, Gamepad2, Award, Globe, RefreshCw, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { UserRole } from '../types/database.js';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, profile, language, setLanguage, t, switchRole, switchDemoUser } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { motionMode } = useMotion();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showMotionModal, setShowMotionModal] = useState(false);

  const isAuthOrLanding = currentPage === 'landing' || currentPage === 'auth';

  const demoPlayers = [
    { id: 'demo_player_1', name: 'Arun Kumar (Player-4821)', elo: 1650 },
    { id: 'demo_player_2', name: 'Deepa Raj (Vortex-99)', elo: 1580 },
    { id: 'demo_player_3', name: 'Marcus Vance (Ghost-104)', elo: 1720 },
    { id: 'demo_player_5', name: 'Leo Sterling (Apex-Pulse)', elo: 1810 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-cyan-950/60">
      {/* Demo Mode Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-violet-950/40 to-slate-950 border-b border-cyan-800/30 px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/40 text-[10px] tracking-wider">
            {t.common.demoData}
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Active Test Environment • Server-Authoritative Simulation Engine
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[11px] hidden md:inline">Test As:</span>
            <select
              value={user?.id || ''}
              onChange={(e) => switchDemoUser(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-cyan-300 focus:outline-none"
            >
              {demoPlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Motion Effects Toggle Button */}
          <button
            onClick={() => setShowMotionModal(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 transition text-[11px]"
            title="Configure Motion Effects (Full / Reduced / Off)"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline text-slate-400">Motion:</span>
            <span className="font-semibold capitalize text-cyan-300">{motionMode}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 transition text-[11px]"
            title="Toggle English / தமிழ்"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span className="font-semibold">{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo with subtle glow on landing & auth pages */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center p-0.5 shadow-lg group-hover:glow-cyan transition duration-300 ${isAuthOrLanding ? 'arena-logo-glow' : ''}`}>
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition duration-300" />
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-lg tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>NEXORA</span>
              <span className="text-cyan-400">ARENA</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:block">
              Authoritative Esports
            </div>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => onNavigate('tournaments')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              currentPage === 'tournaments'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t.nav.tournaments}
          </button>

          <button
            onClick={() => onNavigate('my-matches')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              currentPage === 'my-matches'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t.nav.myMatches}
          </button>

          <button
            onClick={() => onNavigate('teams')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              currentPage === 'teams'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t.nav.teams}
          </button>

          <button
            onClick={() => onNavigate('leaderboard')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              currentPage === 'leaderboard'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t.nav.leaderboard}
          </button>

          <button
            onClick={() => onNavigate('disputes')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              currentPage === 'disputes'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t.nav.disputes}
          </button>

          <button
            onClick={() => onNavigate('rules')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              currentPage === 'rules'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t.nav.rules}
          </button>
        </nav>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-3">
          {/* Role Badges & Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-semibold hover:border-violet-500 transition"
            >
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span className="capitalize text-violet-300">{user?.role || 'Guest'}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {showRoleSelector && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase">
                  Switch Operational Role
                </div>
                {(['player', 'organizer', 'moderator', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setShowRoleSelector(false);
                      if (r === 'organizer') onNavigate('organizer-dashboard');
                      else if (r === 'moderator') onNavigate('moderator-dashboard');
                      else if (r === 'admin') onNavigate('admin-dashboard');
                      else onNavigate('player-dashboard');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 ${
                      user?.role === r ? 'text-cyan-300 font-bold bg-cyan-950/30' : 'text-slate-300'
                    }`}
                  >
                    <span className="capitalize">{r}</span>
                    {user?.role === r && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-slate-950 rounded-full text-[10px] font-extrabold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-semibold text-xs text-slate-200">In-App Notifications</span>
                  <span className="text-[10px] text-slate-400">{notifications.length} total</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500">No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-2 rounded text-xs cursor-pointer transition ${
                          n.read ? 'bg-slate-950/40 text-slate-400' : 'bg-cyan-950/30 text-slate-200 border-l-2 border-cyan-400'
                        }`}
                      >
                        <div className="font-semibold text-cyan-300">{n.title}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{n.message}</div>
                        <div className="text-[9px] text-slate-500 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Anonymous Alias & Profile Trigger */}
          {user ? (
            <div
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-lg px-2.5 py-1 transition"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-black">
                {profile?.anonymousAlias?.slice(0, 2) || 'P'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-cyan-300">
                  {profile?.anonymousAlias || user.displayName}
                </div>
                <div className="text-[10px] text-slate-400">{profile?.skillRating || 1200} MMR</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
            >
              {t.nav.login}
            </button>
          )}
        </div>
      </div>

      {/* Motion Effects Modal */}
      {showMotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <MotionEffectsSelector variant="modal" onClose={() => setShowMotionModal(false)} />
        </div>
      )}
    </header>
  );
};
