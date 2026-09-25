import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { api } from '../services/api.js';
import { Match, Tournament } from '../types/database.js';
import { Trophy, Calendar, Users, Shield, Play, ArrowLeft, CheckCircle, Clock } from 'lucide-react';

interface TournamentDetailsPageProps {
  tournamentId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const TournamentDetailsPage: React.FC<TournamentDetailsPageProps> = ({ tournamentId, onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await api.getTournamentDetails(tournamentId);
      setTournament(data.tournament);
      setBracket(data.bracket);
      setMatches(data.matches);
      setRegistrations(data.registrations);
    } catch (err: any) {
      showToast(err.message || 'Failed to load tournament', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  const handleStartTournament = async () => {
    if (!tournament || !user) return;
    try {
      await api.startTournament(tournament.id, user.id);
      showToast('Tournament started! Automatic brackets generated.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to start tournament', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-xs">Loading tournament details...</div>;
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Tournament Not Found</h2>
        <button
          onClick={() => onNavigate('tournaments')}
          className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tournaments</span>
        </button>
      </div>
    );
  }

  const isOrganizerOrAdmin = user?.role === 'organizer' || user?.role === 'admin';
  const isRegistered = user ? registrations.some((r) => r.userId === user.id) : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <button
        onClick={() => onNavigate('tournaments')}
        className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Tournaments</span>
      </button>

      {/* Tournament Hero Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                {tournament.format.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-0.5 rounded font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 uppercase">
                ● {tournament.status.replace('_', ' ')}
              </span>
              {tournament.isDemo && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  DEMO DATA
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-wide">
              {tournament.title}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              {tournament.rules}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Trophy className="w-4 h-4" />
                <span>Prize: {tournament.prizeDescription}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-violet-400" />
                <span>
                  {tournament.currentParticipantsCount} / {tournament.maxParticipants} Registered
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Grace Period: {tournament.gracePeriodSeconds}s</span>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {tournament.status === 'registration_open' && !isRegistered && (
              <button
                onClick={() => onNavigate('tournament-registration', { tournamentId: tournament.id })}
                className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20"
              >
                Register For Tournament
              </button>
            )}

            {isRegistered && (
              <div className="px-4 py-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>You are Registered</span>
              </div>
            )}

            {isOrganizerOrAdmin && tournament.status === 'registration_open' && (
              <button
                onClick={handleStartTournament}
                className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg"
              >
                Generate Brackets & Start
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Bracket Visualization Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-400" />
            <span>Interactive Tournament Bracket</span>
          </h2>
          <span className="text-xs text-slate-400">Click any match to enter pre-match lobby</span>
        </div>

        {matches.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <p className="text-xs text-slate-400">
              Bracket pairings will be automatically generated once registration closes or the organizer starts the tournament.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
            <div className="min-w-[650px] flex items-center justify-around gap-8">
              {/* Round 1 Column */}
              <div className="space-y-4 flex-1">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider text-center border-b border-slate-800 pb-2">
                  Round of {matches.length * 2}
                </div>
                {matches.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onNavigate('match-room', { matchId: m.id })}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/80 cursor-pointer transition shadow-md hover:shadow-cyan-500/10 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{m.matchRoomCode}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 font-bold">
                        {m.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div
                        className={`flex items-center justify-between p-1 rounded ${
                          m.winnerUserId === m.player1.userId ? 'bg-cyan-950/60 text-cyan-300 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate">{m.player1.anonymousAlias}</span>
                        <span className="font-mono font-semibold">{m.player1.score}</span>
                      </div>
                      <div
                        className={`flex items-center justify-between p-1 rounded ${
                          m.winnerUserId === m.player2.userId ? 'bg-cyan-950/60 text-cyan-300 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate">{m.player2.anonymousAlias}</span>
                        <span className="font-mono font-semibold">{m.player2.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Finals Column (Mock tree advancement) */}
              <div className="space-y-4 flex-1">
                <div className="text-xs font-bold text-violet-400 uppercase tracking-wider text-center border-b border-slate-800 pb-2">
                  Championship Finals
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-violet-900/60 space-y-3">
                  <div className="text-[10px] text-violet-300 font-mono flex items-center justify-between">
                    <span>FINALS-01</span>
                    <span className="px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 font-bold">CHAMPIONSHIP</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 text-slate-200">
                      <span>Winner Match 1</span>
                      <span className="font-mono text-slate-500">TBD</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900 text-slate-200">
                      <span>Winner Match 2</span>
                      <span className="font-mono text-slate-500">TBD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participants List */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <span>Registered Competitors ({registrations.length})</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {registrations.map((r, idx) => (
            <div
              key={r.id}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-xs flex items-center gap-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-mono font-bold text-[10px]">
                {idx + 1}
              </div>
              <div className="truncate">
                <div className="text-white font-semibold truncate">Competitor #{idx + 1}</div>
                <div className="text-[10px] text-slate-500 font-mono">Confirmed Entry</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
