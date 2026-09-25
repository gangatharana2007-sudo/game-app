import {
  AppSettings,
  AuditLog,
  Bracket,
  Dispute,
  FairPlayCase,
  GameDefinition,
  InAppNotification,
  LeaderboardEntry,
  Match,
  MatchEvent,
  MatchResult,
  ModerationAction,
  PlayerProfile,
  Team,
  TeamMember,
  Tournament,
  TournamentRegistration,
  User,
} from '../src/types/database.js';
import { createSingleEliminationBracket, seedParticipants } from './bracketEngine.js';
import { generateMatchTargets } from './gameEngine.js';

export class DatabaseStore {
  users: Map<string, User> = new Map();
  playerProfiles: Map<string, PlayerProfile> = new Map();
  teams: Map<string, Team> = new Map();
  teamMembers: Map<string, TeamMember> = new Map();
  games: Map<string, GameDefinition> = new Map();
  tournaments: Map<string, Tournament> = new Map();
  tournamentRegistrations: Map<string, TournamentRegistration> = new Map();
  brackets: Map<string, Bracket> = new Map();
  matches: Map<string, Match> = new Map();
  matchEvents: Map<string, MatchEvent> = new Map();
  matchResults: Map<string, MatchResult> = new Map();
  notifications: Map<string, InAppNotification> = new Map();
  disputes: Map<string, Dispute> = new Map();
  fairPlayCases: Map<string, FairPlayCase> = new Map();
  moderationActions: Map<string, ModerationAction> = new Map();
  auditLogs: Map<string, AuditLog> = new Map();
  leaderboards: Map<string, LeaderboardEntry> = new Map();
  appSettings: AppSettings;

  constructor() {
    this.appSettings = {
      id: 'default_settings',
      maintenanceMode: false,
      registrationOpen: true,
      rateLimitPerMinute: 120,
      antiCheatSensitivity: 'balanced',
      minReactionTimeThresholdMs: 110,
      maxAllowedReconnects: 3,
      gracePeriodSeconds: 120,
      aiReviewEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.seedDemoData();
  }

  seedDemoData() {
    this.clearAll();
    const now = new Date();
    const pastDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);

    // 1. Game Definition: Reaction Grid Duel
    const gameId = 'game_reaction_grid_duel';
    this.games.set(gameId, {
      id: gameId,
      title: 'Reaction Grid Duel',
      slug: 'reaction-grid-duel',
      description: 'Synchronized visual target reaction combat over 5 fast-paced rounds on a 4x4 sensory grid.',
      rulesOverview: 'Click designated target upon appearance. Accuracy and sub-second reflexes yield high points.',
      mode: '1v1',
      rounds: 5,
      timeLimitPerRoundMs: 4000,
      isOriginal: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // 2. Admin & Moderator Accounts
    const adminUser: User = {
      id: 'user_admin_1',
      email: 'admin@nexora.arena',
      displayName: 'Commander Nexora',
      role: 'admin',
      emailVerified: true,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.users.set(adminUser.id, adminUser);
    this.playerProfiles.set(adminUser.id, {
      id: adminUser.id,
      userId: adminUser.id,
      anonymousAlias: 'Nexora-Prime',
      skillRating: 2100,
      matchesPlayed: 45,
      matchesWon: 42,
      matchesLost: 3,
      tournamentWins: 5,
      fairPlayScore: 100,
      preferredLanguage: 'en',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    const modUser: User = {
      id: 'user_mod_1',
      email: 'moderator@nexora.arena',
      displayName: 'Sentinel Guardian',
      role: 'moderator',
      emailVerified: true,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.users.set(modUser.id, modUser);
    this.playerProfiles.set(modUser.id, {
      id: modUser.id,
      userId: modUser.id,
      anonymousAlias: 'Guardian-01',
      skillRating: 1850,
      matchesPlayed: 30,
      matchesWon: 25,
      matchesLost: 5,
      tournamentWins: 2,
      fairPlayScore: 100,
      preferredLanguage: 'ta',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    const orgUser: User = {
      id: 'user_org_1',
      email: 'organizer@nexora.arena',
      displayName: 'Aero Esports Org',
      role: 'organizer',
      emailVerified: true,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.users.set(orgUser.id, orgUser);

    // 3. 16 Demo Players
    const demoPlayerAliases = [
      { name: 'Arun Kumar', alias: 'Player-4821', elo: 1650, lang: 'ta' as const },
      { name: 'Deepa Raj', alias: 'Vortex-99', elo: 1580, lang: 'ta' as const },
      { name: 'Marcus Vance', alias: 'Ghost-104', elo: 1720, lang: 'en' as const },
      { name: 'Kavitha S', alias: 'Kavitha-Titan', elo: 1490, lang: 'ta' as const },
      { name: 'Leo Sterling', alias: 'Apex-Pulse', elo: 1810, lang: 'en' as const },
      { name: 'Sanjay Nathan', alias: 'Sanjay-Grid', elo: 1530, lang: 'ta' as const },
      { name: 'Elena Rostova', alias: 'Echo-710', elo: 1680, lang: 'en' as const },
      { name: 'Vikram Seth', alias: 'Shadow-Blade', elo: 1620, lang: 'ta' as const },
      { name: 'Zara Chen', alias: 'Cipher-404', elo: 1750, lang: 'en' as const },
      { name: 'Mani Maran', alias: 'Mani-Reflex', elo: 1420, lang: 'ta' as const },
      { name: 'Tariq Al-Mansoor', alias: 'Falcon-33', elo: 1560, lang: 'en' as const },
      { name: 'Nithya Sri', alias: 'Nova-Tamil', elo: 1600, lang: 'ta' as const },
      { name: 'Chloe Dubois', alias: 'Mirage-09', elo: 1510, lang: 'en' as const },
      { name: 'Praveen Vel', alias: 'Vel-Striker', elo: 1470, lang: 'ta' as const },
      { name: 'Dante King', alias: 'Rogue-88', elo: 1640, lang: 'en' as const },
      { name: 'Ananya Roy', alias: 'Aura-22', elo: 1590, lang: 'ta' as const },
    ];

    demoPlayerAliases.forEach((p, idx) => {
      const pId = `demo_player_${idx + 1}`;
      const user: User = {
        id: pId,
        email: `player${idx + 1}@demo.nexora.arena`,
        displayName: p.name,
        role: 'player',
        emailVerified: true,
        status: 'active',
        createdAt: pastDate.toISOString(),
        updatedAt: now.toISOString(),
      };
      this.users.set(pId, user);

      this.playerProfiles.set(pId, {
        id: pId,
        userId: pId,
        anonymousAlias: p.alias,
        skillRating: p.elo,
        matchesPlayed: 12 + idx,
        matchesWon: 7 + Math.floor(idx / 2),
        matchesLost: 5 + Math.floor(idx / 3),
        tournamentWins: idx === 4 ? 2 : idx === 8 ? 1 : 0,
        fairPlayScore: idx === 1 ? 78 : 98, // Demo player 2 has lower fair play score for testing
        preferredLanguage: p.lang,
        createdAt: pastDate.toISOString(),
        updatedAt: now.toISOString(),
      });

      this.leaderboards.set(pId, {
        id: `lead_${pId}`,
        userId: pId,
        displayName: p.name,
        anonymousAlias: p.alias,
        rank: idx + 1,
        skillRating: p.elo,
        wins: 7 + Math.floor(idx / 2),
        losses: 5 + Math.floor(idx / 3),
        winRate: Number(((7 + Math.floor(idx / 2)) / (12 + idx) * 100).toFixed(1)),
        fairPlayRating: idx === 1 ? 78 : 98,
        badges: idx === 4 ? ['Apex Champion', 'Zero Latency'] : ['Verified Competitor'],
        createdAt: pastDate.toISOString(),
        updatedAt: now.toISOString(),
      });
    });

    // 4. 4 Demo Teams
    const demoTeams = [
      { id: 'team_1', name: 'Cyber Knights', tag: 'CYBER', cap: 'demo_player_1' },
      { id: 'team_2', name: 'Tamil Titans', tag: 'TAMIL', cap: 'demo_player_2' },
      { id: 'team_3', name: 'Quantum Pulse', tag: 'QPULS', cap: 'demo_player_5' },
      { id: 'team_4', name: 'Shadow Vanguard', tag: 'SHADW', cap: 'demo_player_8' },
    ];

    demoTeams.forEach((t) => {
      this.teams.set(t.id, {
        id: t.id,
        name: t.name,
        tag: t.tag,
        captainId: t.cap,
        inviteCode: `${t.tag}-2026`,
        maxMembers: 5,
        createdAt: pastDate.toISOString(),
        updatedAt: now.toISOString(),
      });

      this.teamMembers.set(`${t.id}_${t.cap}`, {
        id: `tm_${t.id}_${t.cap}`,
        teamId: t.id,
        userId: t.cap,
        role: 'captain',
        joinedAt: pastDate.toISOString(),
        createdAt: pastDate.toISOString(),
        updatedAt: now.toISOString(),
      });
    });

    // 5. Active Tournament (Single Elimination with 8 registered players)
    const activeTournId = 'tourn_active_apex_1';
    const activeTourn: Tournament = {
      id: activeTournId,
      title: 'Nexora Apex Season 1: Reaction Grid Duel',
      titleTa: 'நெக்ஸோரா ஏபெக்ஸ் பருவம் 1: ரியாக்ஷன் கிரிட் டூயல்',
      gameId,
      organizerId: orgUser.id,
      format: 'single_elimination',
      status: 'in_progress',
      entryType: 'free',
      teamSize: 1,
      maxParticipants: 16,
      currentParticipantsCount: 8,
      registrationDeadline: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      startDate: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      gracePeriodSeconds: 180,
      rules: '5 rounds of Reaction Grid Duel. Server-authoritative scoring. No external macro aids permitted.',
      prizeDescription: '$5,000 Verified Prize Pool + Elite Pro Badge',
      isDemo: true,
      createdAt: pastDate.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.tournaments.set(activeTournId, activeTourn);

    // Register 8 demo players for active tournament
    const activeParticipants: { userId: string; anonymousAlias: string; skillRating: number }[] = [];
    for (let i = 1; i <= 8; i++) {
      const pId = `demo_player_${i}`;
      const profile = this.playerProfiles.get(pId)!;
      this.tournamentRegistrations.set(`reg_${activeTournId}_${pId}`, {
        id: `reg_${activeTournId}_${pId}`,
        tournamentId: activeTournId,
        userId: pId,
        status: 'confirmed',
        registeredAt: pastDate.toISOString(),
        createdAt: pastDate.toISOString(),
        updatedAt: now.toISOString(),
      });
      activeParticipants.push({
        userId: pId,
        anonymousAlias: profile.anonymousAlias,
        skillRating: profile.skillRating,
      });
    }

    // Seed and generate Bracket
    const seeds = seedParticipants(activeParticipants, 'skill_rating');
    const { bracket, matches } = createSingleEliminationBracket(activeTourn, seeds);
    this.brackets.set(bracket.id, bracket);

    matches.forEach((m, idx) => {
      m.roundTargets = generateMatchTargets(m.roundSeed, 5);
      if (idx === 0) {
        // Active live match ready to play in the demo!
        m.status = 'READY';
        m.player1.ready = true;
        m.player2.ready = true;
      }
      this.matches.set(m.id, m);
    });

    // 6. Completed Tournament (Historic Results & Audit Hash)
    const completedTournId = 'tourn_completed_chennai_cup';
    const compTourn: Tournament = {
      id: completedTournId,
      title: 'Chennai Cyber Cup 2026',
      titleTa: 'சென்னை சைபர் கோப்பை 2026',
      gameId,
      organizerId: orgUser.id,
      format: 'single_elimination',
      status: 'completed',
      entryType: 'free',
      teamSize: 1,
      maxParticipants: 8,
      currentParticipantsCount: 8,
      registrationDeadline: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
      startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      endDate: new Date(now.getTime() - 1000 * 60 * 60 * 20).toISOString(),
      gracePeriodSeconds: 120,
      rules: 'Standard Reaction Grid Duel tournament rules. All rounds verified by FairPlayAnalyzer.',
      prizeDescription: '$2,500 Trophy Pool',
      isDemo: true,
      createdAt: pastDate.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.tournaments.set(completedTournId, compTourn);

    // Historical match result
    const histMatchId = 'match_hist_finals_1';
    const histResult: MatchResult = {
      id: `res_${histMatchId}`,
      matchId: histMatchId,
      tournamentId: completedTournId,
      player1Id: 'demo_player_5',
      player2Id: 'demo_player_9',
      player1FinalScore: 3420,
      player2FinalScore: 2890,
      winnerId: 'demo_player_5',
      isForfeit: false,
      completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 20).toISOString(),
      verifiedByServer: true,
      auditHash: 'AUTH-NEXORA-994A1F-FINAL-SEALED',
      createdAt: pastDate.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.matchResults.set(histResult.id, histResult);

    // 7. Demo Fair Play Case & Dispute
    const caseId = 'case_demo_1';
    this.fairPlayCases.set(caseId, {
      id: caseId,
      matchId: histMatchId,
      tournamentId: completedTournId,
      suspectUserId: 'demo_player_2',
      suspectAlias: 'Vortex-99',
      opponentUserId: 'demo_player_7',
      classification: 'REVIEW_REQUIRED',
      riskScore: 48,
      confidenceScore: 0.88,
      evidenceSummary: [
        'Detected 2 reaction times between 112ms and 118ms (near human minimum limit)',
        'Browser tab lost focus 3 times between rounds 2 and 3',
        'Valid action sequence with slightly elevated burst clicks',
      ],
      aiAnalysisExplanation:
        'FairPlayAnalyzer classified as REVIEW_REQUIRED: Sub-120ms clustering observed without conclusive macro signatures. Human review recommended.',
      status: 'pending_review',
      createdAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
      updatedAt: now.toISOString(),
    });

    const disputeId = 'disp_demo_1';
    this.disputes.set(disputeId, {
      id: disputeId,
      matchId: histMatchId,
      tournamentId: completedTournId,
      petitionerUserId: 'demo_player_7',
      opponentUserId: 'demo_player_2',
      reason: 'anti_cheat_suspected',
      description: 'Opponent exhibited unusual reaction speed during round 3 transitions.',
      status: 'investigating',
      assignedModeratorId: modUser.id,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      updatedAt: now.toISOString(),
    });

    // 8. Immutable Audit Log
    const auditId = 'audit_init_1';
    this.auditLogs.set(auditId, {
      id: auditId,
      actorUserId: adminUser.id,
      actorRole: 'admin',
      action: 'SYSTEM_SEED_INITIALIZED',
      targetResource: 'system',
      targetResourceId: 'root',
      metadata: { demoSeed: true, playersSeeded: 16, teamsSeeded: 4 },
      timestamp: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // 9. Notifications
    this.notifications.set('notif_1', {
      id: 'notif_1',
      userId: 'demo_player_1',
      type: 'MATCH_ASSIGNED',
      title: 'Match Ready: Round 1 Finals',
      titleTa: 'ஆட்டம் தயார்: முதல் சுற்று',
      message: 'Your anonymous pre-match lobby is active in Nexora Apex Season 1.',
      messageTa: 'நெக்ஸோரா ஏபெக்ஸ் சீசன் 1-ல் உங்கள் காத்திருப்புக்கூடம் தயார்.',
      linkUrl: `/matches/${matches[0].id}`,
      read: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  clearAll() {
    this.users.clear();
    this.playerProfiles.clear();
    this.teams.clear();
    this.teamMembers.clear();
    this.games.clear();
    this.tournaments.clear();
    this.tournamentRegistrations.clear();
    this.brackets.clear();
    this.matches.clear();
    this.matchEvents.clear();
    this.matchResults.clear();
    this.notifications.clear();
    this.disputes.clear();
    this.fairPlayCases.clear();
    this.moderationActions.clear();
    this.auditLogs.clear();
    this.leaderboards.clear();
  }

  logAudit(actorUserId: string, actorRole: any, action: string, targetResource: string, targetResourceId: string, metadata: Record<string, unknown> = {}) {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    this.auditLogs.set(id, {
      id,
      actorUserId,
      actorRole,
      action,
      targetResource,
      targetResourceId,
      metadata,
      timestamp: now,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export const dbStore = new DatabaseStore();
