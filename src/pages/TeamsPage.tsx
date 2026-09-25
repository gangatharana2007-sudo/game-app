import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { Team } from '../types/database.js';
import { Users, Plus, KeyRound, Shield, Trophy, Copy, Check } from 'lucide-react';

interface TeamsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const TeamsPage: React.FC<TeamsPageProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const { showToast } = useNotifications();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [inviteCode, setInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadTeams = async () => {
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.createTeam(user.id, { name: teamName, tag: teamTag.toUpperCase(), maxMembers });
      showToast('Team roster created successfully!', 'success');
      setShowCreateModal(false);
      setTeamName('');
      setTeamTag('');
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to create team', 'error');
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.joinTeam(user.id, inviteCode);
      showToast('Successfully joined team roster!', 'success');
      setShowJoinModal(false);
      setInviteCode('');
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to join team', 'error');
    }
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Invite code ${code} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide">
            Esports Teams & Rosters
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Form competitive squads, invite teammates with secure codes, and register for team-format tournaments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-violet-500 text-slate-200 font-semibold text-xs flex items-center gap-2 transition"
          >
            <KeyRound className="w-4 h-4 text-violet-400" />
            <span>Join with Code</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Squad</span>
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading squads...</div>
      ) : teams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No teams created yet</h3>
          <p className="text-xs text-slate-500 mt-1">Be the first captain to establish a squad!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition duration-300 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/40">
                    [{t.tag}]
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Max: {t.maxMembers} Players
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-white mb-1">{t.name}</h3>
                <div className="text-xs text-slate-400 mb-4">
                  Captain ID: <span className="font-mono text-cyan-400">{t.captainId.slice(0, 10)}...</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Invite Code</div>
                    <div className="font-mono font-bold text-sm text-cyan-300">{t.inviteCode}</div>
                  </div>
                  <button
                    onClick={() => copyInvite(t.inviteCode)}
                    className="p-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                    title="Copy invite code"
                  >
                    {copiedCode === t.inviteCode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Roster Protected</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Eligible</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-xl font-bold text-white">Create Esports Squad</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Squad Name</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Cyber Knights"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Squad Tag (2-5 letters)</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={teamTag}
                  onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                  placeholder="e.g. CYBER"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Max Capacity</label>
                <select
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={2}>2 Players (Duo)</option>
                  <option value={3}>3 Players (Trio)</option>
                  <option value={5}>5 Players (Full Squad)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Establish Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-xl font-bold text-white">Join Squad with Invite Code</h3>
            <form onSubmit={handleJoinTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Invite Code</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g. CYBER-2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs"
                >
                  Join Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
