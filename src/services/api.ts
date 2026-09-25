import {
  AppSettings,
  AuditLog,
  Dispute,
  FairPlayCase,
  InAppNotification,
  LeaderboardEntry,
  Match,
  MatchResult,
  PlayerProfile,
  Team,
  Tournament,
  User,
} from '../types/database.js';

const getHeaders = (userId?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
};

// Resilient fetch wrapper with retry logic for server warmup and network transitions
async function safeFetch(url: string, options?: RequestInit, retries = 2): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error('Network request failed');
}

export const api = {
  // Auth
  async register(data: { email: string; password?: string; displayName: string; preferredLanguage?: 'en' | 'ta' }) {
    const res = await safeFetch('/api/auth/register', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Failed to register');
    }
    return res.json() as Promise<{ user: User; profile: PlayerProfile }>;
  },

  async login(data: { email: string; password?: string }) {
    const res = await safeFetch('/api/auth/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Sign in failed' }));
      throw new Error(err.error || 'Failed to sign in');
    }
    return res.json() as Promise<{ user: User; profile: PlayerProfile }>;
  },

  async switchRole(userId: string, role: string) {
    const res = await safeFetch('/api/auth/switch-role', {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ userId, role }),
    });
    return res.json() as Promise<{ user: User; profile: PlayerProfile }>;
  },

  // Tournaments
  async getTournaments(): Promise<Tournament[]> {
    try {
      const res = await safeFetch('/api/tournaments');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return [];
  },

  async getTournamentDetails(id: string): Promise<{ tournament: Tournament; bracket?: any; registrations: any[]; matches: Match[] }> {
    const res = await safeFetch(`/api/tournaments/${id}`);
    if (!res.ok) throw new Error('Tournament not found');
    return res.json();
  },

  async createTournament(userId: string, data: any): Promise<Tournament> {
    const res = await safeFetch('/api/tournaments', {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create tournament' }));
      throw new Error(err.error || 'Failed to create tournament');
    }
    return res.json();
  },

  async registerTournament(tournamentId: string, userId: string) {
    const res = await safeFetch(`/api/tournaments/${tournamentId}/register`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to register' }));
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  async startTournament(tournamentId: string, userId: string) {
    const res = await safeFetch(`/api/tournaments/${tournamentId}/start`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to start tournament' }));
      throw new Error(err.error || 'Failed to start tournament');
    }
    return res.json();
  },

  // Matches
  async getMatch(id: string): Promise<{ match: Match; result?: MatchResult; serverTime: number }> {
    const res = await safeFetch(`/api/matches/${id}`);
    if (!res.ok) throw new Error('Match not found');
    return res.json();
  },

  async sendHeartbeat(matchId: string, userId: string): Promise<{ match: Match; serverTime: number }> {
    const res = await safeFetch(`/api/matches/${matchId}/heartbeat`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async setReady(matchId: string, userId: string): Promise<Match> {
    const res = await safeFetch(`/api/matches/${matchId}/ready`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async startRound(matchId: string): Promise<{ match: Match; serverTime: number }> {
    const res = await safeFetch(`/api/matches/${matchId}/start-round`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async submitAction(matchId: string, userId: string, data: { round: number; targetId: string; gridIndex: number; clientTimestamp: number }) {
    const res = await safeFetch(`/api/matches/${matchId}/action`, {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ ...data, matchId, userId }),
    });
    return res.json();
  },

  async sendTelemetry(matchId: string, userId: string, eventType: string, details?: string) {
    try {
      const res = await safeFetch(`/api/matches/${matchId}/telemetry`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ matchId, userId, eventType, details }),
      });
      return res.json();
    } catch (e) {
      return { ok: true };
    }
  },

  async advanceRound(matchId: string): Promise<{ match: Match; result?: MatchResult }> {
    const res = await safeFetch(`/api/matches/${matchId}/advance-round`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async forfeitMatch(matchId: string, forfeitUserId: string, reason?: string) {
    const res = await safeFetch(`/api/matches/${matchId}/forfeit`, {
      method: 'POST',
      headers: getHeaders(forfeitUserId),
      body: JSON.stringify({ forfeitUserId, reason }),
    });
    return res.json();
  },

  // Leaderboard & Profile
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await safeFetch('/api/leaderboard');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return [];
  },

  async getProfile(userId: string): Promise<{ user: Partial<User>; profile: PlayerProfile; matches: Match[] }> {
    const res = await safeFetch(`/api/profiles/${userId}`);
    if (!res.ok) throw new Error('Profile not found');
    return res.json();
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    try {
      const res = await safeFetch('/api/teams');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return [];
  },

  async createTeam(captainId: string, data: { name: string; tag: string; maxMembers?: number }) {
    const res = await safeFetch('/api/teams', {
      method: 'POST',
      headers: getHeaders(captainId),
      body: JSON.stringify({ ...data, captainId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create team' }));
      throw new Error(err.error || 'Failed to create team');
    }
    return res.json();
  },

  async joinTeam(userId: string, inviteCode: string) {
    const res = await safeFetch('/api/teams/join', {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ userId, inviteCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to join team' }));
      throw new Error(err.error || 'Failed to join team');
    }
    return res.json();
  },

  // Disputes
  async getDisputes(): Promise<Dispute[]> {
    try {
      const res = await safeFetch('/api/disputes');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return [];
  },

  async submitDispute(userId: string, data: { matchId: string; reason: any; description: string }) {
    const res = await safeFetch('/api/disputes', {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ ...data, petitionerUserId: userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to submit dispute' }));
      throw new Error(err.error || 'Failed to submit dispute');
    }
    return res.json();
  },

  // Moderation
  async getModerationCases(): Promise<FairPlayCase[]> {
    try {
      const res = await safeFetch('/api/moderation/cases');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return [];
  },

  async resolveCase(caseId: string, moderatorId: string, resolution: string, notes: string) {
    const res = await safeFetch(`/api/moderation/cases/${caseId}/resolve`, {
      method: 'POST',
      headers: getHeaders(moderatorId),
      body: JSON.stringify({ resolution, notes }),
    });
    return res.json();
  },

  // Admin
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await safeFetch('/api/admin/audit-logs');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return [];
  },

  async getAdminUsers(): Promise<User[]> {
    try {
      const res = await safeFetch('/api/admin/users');
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return [];
  },

  async getAppSettings(): Promise<AppSettings> {
    const res = await safeFetch('/api/admin/settings');
    return res.json();
  },

  async updateAppSettings(adminId: string, settings: Partial<AppSettings>) {
    const res = await safeFetch('/api/admin/settings', {
      method: 'POST',
      headers: getHeaders(adminId),
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async resetDemoSeed(adminId: string) {
    const res = await safeFetch('/api/admin/reset-demo', {
      method: 'POST',
      headers: getHeaders(adminId),
    });
    return res.json();
  },

  // Notifications
  async getNotifications(userId?: string): Promise<InAppNotification[]> {
    try {
      const res = await safeFetch(`/api/notifications${userId ? `?userId=${userId}` : ''}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Return safe initial notification during cold start / server restart
    }
    return [
      {
        id: 'notif_1',
        userId: userId || 'demo_player_1',
        type: 'MATCH_ASSIGNED',
        title: 'Match Ready: Round 1 Finals',
        titleTa: 'ஆட்டம் தயார்: முதல் சுற்று',
        message: 'Your anonymous pre-match lobby is active in Nexora Apex Season 1.',
        messageTa: 'நெக்ஸோரா ஏபெக்ஸ் சீசன் 1-ல் உங்கள் காத்திருப்புக்கூடம் தயார்.',
        linkUrl: '/matches/match_tourn_active_apex_1_r1_m1',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  async markNotificationRead(id: string) {
    try {
      await safeFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // Ignore
    }
  },
};
