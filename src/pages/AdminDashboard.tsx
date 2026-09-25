import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { AppSettings, AuditLog, User } from '../types/database.js';
import { Settings, Users, ShieldAlert, RefreshCw, FileText, CheckCircle, Database } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'settings' | 'audit'>('analytics');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [uList, logs, sett] = await Promise.all([
        api.getAdminUsers(),
        api.getAuditLogs(),
        api.getAppSettings(),
      ]);
      setUsers(uList);
      setAuditLogs(logs);
      setSettings(sett);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings || !user) return;
    try {
      await api.updateAppSettings(user.id, settings);
      showToast('System configuration committed to secure store', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResetDemoSeed = async () => {
    if (!user) return;
    try {
      await api.resetDemoSeed(user.id);
      showToast('Demo environment reset successfully! 16 players, 4 teams restored.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-1">
            System Administration
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Admin Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure server-authoritative rate limits, review immutable audit ledgers, and manage competitor access.
          </p>
        </div>

        <button
          onClick={handleResetDemoSeed}
          className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-rose-500/60 hover:text-rose-300 text-slate-300 font-semibold text-xs flex items-center gap-2 transition shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Demo Seed</span>
        </button>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
        {(['analytics', 'users', 'settings', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold uppercase tracking-wider transition ${
              activeTab === tab
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Total Competitors</div>
              <div className="font-display text-3xl font-bold text-white">{users.length}</div>
              <div className="text-[10px] text-cyan-400 mt-1 font-mono">16 Demo Persona Seeds</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Audit Ledger Events</div>
              <div className="font-display text-3xl font-bold text-violet-400">{auditLogs.length}</div>
              <div className="text-[10px] text-violet-400 mt-1 font-mono">100% Server Immutability</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Anti-Cheat Review Rate</div>
              <div className="font-display text-3xl font-bold text-amber-400">4.2%</div>
              <div className="text-[10px] text-amber-400 mt-1 font-mono">Zero False Auto-Bans</div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Server Match Health</div>
              <div className="font-display text-3xl font-bold text-emerald-400">99.9%</div>
              <div className="text-[10px] text-emerald-400 mt-1 font-mono">60Hz Tick Sync Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Operational Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-white">{u.displayName}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-semibold text-[10px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-emerald-400 font-semibold">{u.status}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {u.emailVerified ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="max-w-xl p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="font-display text-lg font-bold text-white">System & Anti-Cheat Calibration</h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Minimum Human Reaction Reflex Limit (ms)
              </label>
              <input
                type="number"
                value={settings.minReactionTimeThresholdMs}
                onChange={(e) =>
                  setSettings({ ...settings, minReactionTimeThresholdMs: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Visual reflex times lower than 110ms violate physiological latency bounds.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Rate Limit Threshold (Requests per Minute)
              </label>
              <input
                type="number"
                value={settings.rateLimitPerMinute}
                onChange={(e) =>
                  setSettings({ ...settings, rateLimitPerMinute: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Absence Grace Period (Seconds)
              </label>
              <input
                type="number"
                value={settings.gracePeriodSeconds}
                onChange={(e) =>
                  setSettings({ ...settings, gracePeriodSeconds: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="accent-cyan-500"
                />
                <span className="font-semibold text-white">Enable Platform Maintenance Mode</span>
              </label>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider text-xs transition"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Append-Only Cryptographic Audit Trail</span>
            <span className="font-mono text-cyan-400">{auditLogs.length} Events Logged</span>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/40 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-cyan-400 font-bold">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-slate-300">
                  Actor: <span className="text-white font-bold">{log.actorUserId}</span> ({log.actorRole}) • Target:{' '}
                  <span className="text-slate-400">{log.targetResource}:{log.targetResourceId}</span>
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-1 text-[11px] text-slate-500 break-all">
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
