import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dbStore } from './server/store.js';
import { FairPlayAnalyzer } from './server/fairPlayAnalyzer.js';
import {
  advanceWinnerToNextRound,
  calculateTournamentStandings,
  createRoundRobinBracket,
  createSingleEliminationBracket,
  seedParticipants,
} from './server/bracketEngine.js';
import {
  finalizeMatchResult,
  generateMatchTargets,
  validatePlayerAction,
} from './server/gameEngine.js';
import {
  CreateTeamSchema,
  CreateTournamentSchema,
  DisputeSubmissionSchema,
  LoginSchema,
  PlayerActionSchema,
  RegisterSchema,
  Tournament,
} from './src/types/database.js';
import { env } from './server/env.js';
import { logger } from './server/logger.js';
import { createRateLimiter } from './server/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const fairPlayAnalyzer = new FairPlayAnalyzer();

app.use(express.json({ limit: '2mb' }));

// CORS & Preflight handling for browser clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-id, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Structured request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  (req as any).id = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const latencyMs = Date.now() - start;
    if (req.path.startsWith('/api')) {
      logger.info(`${req.method} ${req.path} ${res.statusCode}`, {
        requestId,
        statusCode: res.statusCode,
        latencyMs,
        userId: req.headers['x-user-id'] as string,
      });
    }
  });
  next();
});

// Production rate limiting on API endpoints
const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: env.RATE_LIMIT_PER_MINUTE,
});
app.use('/api', apiRateLimiter);

// Error monitoring ingest endpoint (receives frontend error reports)
app.post('/api/monitoring/errors', (req, res) => {
  logger.warn('Frontend client error reported', {
    metadata: req.body,
  });
  res.status(204).end();
});

// ==========================================
// Authentication & User APIs
// ==========================================
app.post('/api/auth/register', (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { email, displayName, preferredLanguage } = parsed.data;
  const existing = Array.from(dbStore.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const userId = `user_${Date.now()}`;
  const now = new Date().toISOString();
  const aliasNumber = Math.floor(1000 + Math.random() * 9000);
  const anonymousAlias = `Player-${aliasNumber}`;

  const user = {
    id: userId,
    email,
    displayName,
    role: 'player' as const,
    emailVerified: true,
    status: 'active' as const,
    createdAt: now,
    updatedAt: now,
  };

  const profile = {
    id: userId,
    userId,
    anonymousAlias,
    skillRating: 1200,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    tournamentWins: 0,
    fairPlayScore: 100,
    preferredLanguage,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.users.set(userId, user);
  dbStore.playerProfiles.set(userId, profile);
  dbStore.logAudit(userId, 'player', 'USER_REGISTERED', 'users', userId, { email, displayName });

  res.status(201).json({ user, profile });
});

app.post('/api/auth/login', (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { email } = parsed.data;
  const user = Array.from(dbStore.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email credentials' });
  }

  const profile = dbStore.playerProfiles.get(user.id);
  res.json({ user, profile });
});

app.post('/api/auth/switch-role', (req, res) => {
  const { userId, role } = req.body;
  const user = dbStore.users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (!['player', 'organizer', 'moderator', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  user.role = role;
  user.updatedAt = new Date().toISOString();
  dbStore.users.set(user.id, user);
  dbStore.logAudit(user.id, role, 'ROLE_SWITCHED', 'users', user.id, { newRole: role });

  res.json({ user, profile: dbStore.playerProfiles.get(user.id) });
});

// ==========================================
// Tournaments APIs
// ==========================================
app.get('/api/tournaments', (req, res) => {
  const list = Array.from(dbStore.tournaments.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(list);
});

app.get('/api/tournaments/:id', (req, res) => {
  const tournament = dbStore.tournaments.get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const bracket = Array.from(dbStore.brackets.values()).find((b) => b.tournamentId === tournament.id);
  const registrations = Array.from(dbStore.tournamentRegistrations.values()).filter(
    (r) => r.tournamentId === tournament.id
  );
  const matches = Array.from(dbStore.matches.values()).filter((m) => m.tournamentId === tournament.id);

  res.json({ tournament, bracket, registrations, matches });
});

app.post('/api/tournaments', (req, res) => {
  const parsed = CreateTournamentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const organizerId = (req.headers['x-user-id'] as string) || 'user_org_1';
  const now = new Date().toISOString();
  const id = `tourn_${Date.now()}`;

  const tournament: Tournament = {
    id,
    ...parsed.data,
    organizerId,
    status: 'registration_open',
    currentParticipantsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.tournaments.set(id, tournament);
  dbStore.logAudit(organizerId, 'organizer', 'TOURNAMENT_CREATED', 'tournaments', id, { title: tournament.title });

  res.status(201).json(tournament);
});

app.post('/api/tournaments/:id/register', (req, res) => {
  const tournament = dbStore.tournaments.get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const userId = req.body.userId;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const user = dbStore.users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (tournament.status !== 'registration_open') {
    return res.status(400).json({ error: `Registration is not open (status: ${tournament.status})` });
  }

  // Duplicate registration check
  const regKey = `reg_${tournament.id}_${userId}`;
  const existing = Array.from(dbStore.tournamentRegistrations.values()).find(
    (r) => r.tournamentId === tournament.id && r.userId === userId
  );
  if (existing) {
    return res.status(409).json({ error: 'You are already registered for this tournament' });
  }

  if (tournament.currentParticipantsCount >= tournament.maxParticipants) {
    return res.status(400).json({ error: 'Tournament capacity is full' });
  }

  const now = new Date().toISOString();
  const registration = {
    id: regKey,
    tournamentId: tournament.id,
    userId,
    status: 'confirmed' as const,
    registeredAt: now,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.tournamentRegistrations.set(regKey, registration);
  tournament.currentParticipantsCount += 1;
  tournament.updatedAt = now;

  dbStore.notifications.set(`notif_${Date.now()}`, {
    id: `notif_${Date.now()}`,
    userId,
    type: 'TOURNAMENT_REGISTRATION',
    title: 'Registration Confirmed',
    message: `You are confirmed for ${tournament.title}. Pre-match lobby will open automatically upon tournament start.`,
    read: false,
    createdAt: now,
    updatedAt: now,
  });

  res.status(201).json(registration);
});

app.post('/api/tournaments/:id/start', (req, res) => {
  const tournament = dbStore.tournaments.get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const organizerId = (req.headers['x-user-id'] as string) || 'user_org_1';
  const regs = Array.from(dbStore.tournamentRegistrations.values()).filter(
    (r) => r.tournamentId === tournament.id && r.status === 'confirmed'
  );

  if (regs.length < 2) {
    return res.status(400).json({ error: 'At least 2 participants are required to generate tournament brackets' });
  }

  const participants = regs.map((r) => {
    const profile = dbStore.playerProfiles.get(r.userId);
    return {
      userId: r.userId,
      anonymousAlias: profile?.anonymousAlias || `Player-${r.userId.slice(-4)}`,
      skillRating: profile?.skillRating || 1200,
    };
  });

  const seeds = seedParticipants(participants, 'skill_rating');
  let result;
  if (tournament.format === 'round_robin') {
    result = createRoundRobinBracket(tournament, seeds);
  } else {
    result = createSingleEliminationBracket(tournament, seeds);
  }

  dbStore.brackets.set(result.bracket.id, result.bracket);
  result.matches.forEach((m) => {
    m.roundTargets = generateMatchTargets(m.roundSeed, 5);
    dbStore.matches.set(m.id, m);
  });

  tournament.status = 'in_progress';
  tournament.updatedAt = new Date().toISOString();

  dbStore.logAudit(organizerId, 'organizer', 'TOURNAMENT_STARTED', 'tournaments', tournament.id, {
    format: tournament.format,
    participantsCount: participants.length,
    matchesCount: result.matches.length,
  });

  res.json({ tournament, bracket: result.bracket, matches: result.matches });
});

// ==========================================
// Matches & Server-Authoritative Live Room
// ==========================================
app.get('/api/matches/:id', (req, res) => {
  const match = dbStore.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const result = dbStore.matchResults.get(`res_${match.id}`);
  res.json({ match, result, serverTime: Date.now() });
});

// Match state polling / heartbeat
app.post('/api/matches/:id/heartbeat', (req, res) => {
  const match = dbStore.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const { userId } = req.body;
  const now = Date.now();

  if (match.player1.userId === userId) {
    match.player1.connected = true;
    match.player1.lastHeartbeat = now;
  } else if (match.player2.userId === userId) {
    match.player2.connected = true;
    match.player2.lastHeartbeat = now;
  }

  res.json({ match, serverTime: now });
});

// Toggle Ready in pre-match lobby
app.post('/api/matches/:id/ready', (req, res) => {
  const match = dbStore.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const { userId } = req.body;
  if (match.player1.userId === userId) {
    match.player1.ready = true;
  } else if (match.player2.userId === userId) {
    match.player2.ready = true;
  }

  // If both players ready, transition to COUNTDOWN -> ACTIVE
  if (match.player1.ready && match.player2.ready && match.status !== 'ACTIVE' && match.status !== 'COMPLETED') {
    match.status = 'COUNTDOWN';
    match.actualStartTime = new Date().toISOString();
    match.currentRound = 1;
    match.roundStartTime = Date.now() + 3000; // 3 second countdown

    if (!match.roundTargets || match.roundTargets.length === 0) {
      match.roundTargets = generateMatchTargets(match.roundSeed, 5);
    }
  }

  match.updatedAt = new Date().toISOString();
  res.json(match);
});

// Start round (server activates countdown)
app.post('/api/matches/:id/start-round', (req, res) => {
  const match = dbStore.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  match.status = 'ACTIVE';
  match.roundStartTime = Date.now();
  match.updatedAt = new Date().toISOString();

  res.json({ match, serverTime: Date.now() });
});

// Server-Authoritative Action Submission (Clicks on Reaction Grid)
app.post('/api/matches/:id/action', async (req, res) => {
  const match = dbStore.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const parsed = PlayerActionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const userId = (req.headers['x-user-id'] as string) || req.body.userId;
  const { round, targetId, gridIndex, clientTimestamp } = parsed.data;
  const serverReceiveTime = Date.now();

  const validation = validatePlayerAction(
    match,
    userId,
    round,
    targetId,
    gridIndex,
    clientTimestamp,
    serverReceiveTime
  );

  const isPlayer1 = match.player1.userId === userId;
  const player = isPlayer1 ? match.player1 : match.player2;

  if (validation.valid) {
    player.score = Math.max(0, player.score + validation.awardedScore);
    player.reactionTimes.push(validation.reactionTimeMs);
  }

  // Record Telemetry Event
  const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const matchEvent = {
    id: eventId,
    matchId: match.id,
    userId,
    anonymousAlias: player.anonymousAlias,
    eventType: (validation.valid ? 'CLICK_TARGET' : 'CLICK_MISS') as any,
    round,
    clientTimestamp,
    serverTimestamp: serverReceiveTime,
    deltaMs: Math.abs(serverReceiveTime - clientTimestamp),
    payload: {
      gridIndex,
      targetId,
      awardedScore: validation.awardedScore,
      reactionTimeMs: validation.reactionTimeMs,
      reason: validation.reason,
      isImpossibleSpeed: validation.isImpossibleSpeed,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  dbStore.matchEvents.set(eventId, matchEvent);

  // If impossible speed or suspicious activity detected, record flag
  if (validation.isImpossibleSpeed) {
    match.antiCheatFlagged = true;
    match.antiCheatReasons.push(`Sub-110ms impossible reaction time detected: ${validation.reactionTimeMs}ms on round ${round}`);
    match.antiCheatRiskScore = Math.min(100, match.antiCheatRiskScore + 35);
  }

  match.updatedAt = new Date().toISOString();
  res.json({
    validation,
    updatedScore: player.score,
    match,
    serverTime: serverReceiveTime,
  });
});

// Telemetry signal recording (tab focus loss, reconnects)
app.post('/api/matches/:id/telemetry', (req, res) => {
  const match = dbStore.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const { userId, eventType, details } = req.body;
  const isP1 = match.player1.userId === userId;
  const player = isP1 ? match.player1 : match.player2;

  if (eventType === 'TAB_FOCUS_LOST') {
    player.tabLostFocusCount += 1;
    if (player.tabLostFocusCount >= 3) {
      match.antiCheatReasons.push(`Player ${player.anonymousAlias} switched browser tab 3+ times during match.`);
      match.antiCheatRiskScore = Math.min(100, match.antiCheatRiskScore + 15);
    }
  } else if (eventType === 'RECONNECTED') {
    player.reconnectCount += 1;
  }

  const eventId = `tel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  dbStore.matchEvents.set(eventId, {
    id: eventId,
    matchId: match.id,
    userId,
    anonymousAlias: player.anonymousAlias,
    eventType: eventType || 'CLIENT_DESYNC',
    round: match.currentRound,
    clientTimestamp: Date.now(),
    serverTimestamp: Date.now(),
    deltaMs: 0,
    payload: { details },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.json({ ok: true, match });
});

// Advance Round or Finalize Match
app.post('/api/matches/:id/advance-round', async (req, res) => {
  const match = dbStore.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  if (match.currentRound < match.totalRounds) {
    match.currentRound += 1;
    match.status = 'COUNTDOWN';
    match.roundStartTime = Date.now() + 2500;
  } else {
    // Match finished!
    match.status = 'COMPLETED';
    match.completedAt = new Date().toISOString();

    const result = finalizeMatchResult(match);
    dbStore.matchResults.set(result.id, result);
    match.winnerUserId = result.winnerId;

    // Trigger FairPlayAnalyzer AI classification
    const p1Telemetry = {
      matchId: match.id,
      anonymousAlias: match.player1.anonymousAlias,
      reactionTimes: match.player1.reactionTimes,
      reconnectCount: match.player1.reconnectCount,
      tabLostFocusCount: match.player1.tabLostFocusCount,
      clockSkewDeltas: [12, -8],
      actionsCount: match.player1.reactionTimes.length,
      durationMs: 20000,
      totalScore: match.player1.score,
    };

    const analysis = await fairPlayAnalyzer.analyzeMatchTelemetry(p1Telemetry);
    match.antiCheatRiskScore = analysis.riskScore;

    if (analysis.classification !== 'NORMAL') {
      match.antiCheatFlagged = true;
      const caseId = `case_${match.id}_${Date.now()}`;
      dbStore.fairPlayCases.set(caseId, {
        id: caseId,
        matchId: match.id,
        tournamentId: match.tournamentId,
        suspectUserId: match.player1.userId,
        suspectAlias: match.player1.anonymousAlias,
        opponentUserId: match.player2.userId,
        classification: analysis.classification,
        riskScore: analysis.riskScore,
        confidenceScore: analysis.confidenceScore,
        evidenceSummary: analysis.evidenceSummary,
        aiAnalysisExplanation: analysis.aiExplanation,
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    dbStore.logAudit('server', 'admin', 'MATCH_COMPLETED', 'matches', match.id, {
      winner: match.winnerUserId,
      p1Score: match.player1.score,
      p2Score: match.player2.score,
      antiCheatFlagged: match.antiCheatFlagged,
    });

    // Advance winner in bracket
    if (match.tournamentId && match.winnerUserId) {
      const bracket = Array.from(dbStore.brackets.values()).find((b) => b.tournamentId === match.tournamentId);
      if (bracket && bracket.format === 'single_elimination') {
        const winnerAlias =
          match.winnerUserId === match.player1.userId
            ? match.player1.anonymousAlias
            : match.player2.anonymousAlias;
        const adv = advanceWinnerToNextRound(bracket, dbStore.matches, match.id, match.winnerUserId, winnerAlias);
        if (adv.tournamentCompleted) {
          const tournament = dbStore.tournaments.get(match.tournamentId);
          if (tournament) {
            tournament.status = 'completed';
            tournament.updatedAt = new Date().toISOString();
          }
        }
      }
    }
  }

  match.updatedAt = new Date().toISOString();
  res.json({ match, result: dbStore.matchResults.get(`res_${match.id}`) });
});

// Forfeit and absence handling
app.post('/api/matches/:id/forfeit', (req, res) => {
  const match = dbStore.matches.get(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const { forfeitUserId, reason } = req.body;
  if (match.player1.userId === forfeitUserId) {
    match.player1.isForfeit = true;
    match.player1.forfeitReason = reason || 'Grace period expired without joining';
    match.winnerUserId = match.player2.userId;
  } else if (match.player2.userId === forfeitUserId) {
    match.player2.isForfeit = true;
    match.player2.forfeitReason = reason || 'Grace period expired without joining';
    match.winnerUserId = match.player1.userId;
  }

  match.status = 'COMPLETED';
  match.completedAt = new Date().toISOString();
  match.updatedAt = new Date().toISOString();

  const result = finalizeMatchResult(match);
  dbStore.matchResults.set(result.id, result);

  // Advance winner in bracket
  if (match.tournamentId && match.winnerUserId) {
    const bracket = Array.from(dbStore.brackets.values()).find((b) => b.tournamentId === match.tournamentId);
    if (bracket && bracket.format === 'single_elimination') {
      const winnerAlias =
        match.winnerUserId === match.player1.userId
          ? match.player1.anonymousAlias
          : match.player2.anonymousAlias;
      const adv = advanceWinnerToNextRound(bracket, dbStore.matches, match.id, match.winnerUserId, winnerAlias);
      if (adv.tournamentCompleted) {
        const tournament = dbStore.tournaments.get(match.tournamentId);
        if (tournament) {
          tournament.status = 'completed';
          tournament.updatedAt = new Date().toISOString();
        }
      }
    }
  }

  dbStore.logAudit(forfeitUserId || 'system', 'player', 'MATCH_FORFEITED', 'matches', match.id, {
    reason: reason || 'Grace period expired',
    winner: match.winnerUserId,
  });

  res.json({ match, result });
});

// ==========================================
// Leaderboard & Profiles APIs
// ==========================================
app.get('/api/leaderboard', (req, res) => {
  const list = Array.from(dbStore.leaderboards.values()).sort((a, b) => b.skillRating - a.skillRating);
  res.json(list);
});

app.get('/api/profiles/:userId', (req, res) => {
  const profile = dbStore.playerProfiles.get(req.params.userId);
  const user = dbStore.users.get(req.params.userId);
  if (!profile || !user) return res.status(404).json({ error: 'Profile not found' });

  // Get user matches
  const matches = Array.from(dbStore.matches.values()).filter(
    (m) => m.player1.userId === user.id || m.player2.userId === user.id
  );

  res.json({
    user: { id: user.id, displayName: user.displayName, status: user.status, role: user.role },
    profile,
    matches,
  });
});

// ==========================================
// Teams APIs
// ==========================================
app.get('/api/teams', (req, res) => {
  const list = Array.from(dbStore.teams.values());
  res.json(list);
});

app.post('/api/teams', (req, res) => {
  const parsed = CreateTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const captainId = (req.headers['x-user-id'] as string) || req.body.captainId;
  const now = new Date().toISOString();
  const teamId = `team_${Date.now()}`;
  const inviteCode = `${parsed.data.tag}-${Math.floor(1000 + Math.random() * 9000)}`;

  const team = {
    id: teamId,
    name: parsed.data.name,
    tag: parsed.data.tag,
    captainId,
    inviteCode,
    maxMembers: parsed.data.maxMembers,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.teams.set(teamId, team);
  dbStore.teamMembers.set(`${teamId}_${captainId}`, {
    id: `tm_${teamId}_${captainId}`,
    teamId,
    userId: captainId,
    role: 'captain',
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const profile = dbStore.playerProfiles.get(captainId);
  if (profile) {
    profile.activeTeamId = teamId;
  }

  res.status(201).json(team);
});

app.post('/api/teams/join', (req, res) => {
  const { inviteCode, userId } = req.body;
  const team = Array.from(dbStore.teams.values()).find(
    (t) => t.inviteCode.toUpperCase() === inviteCode?.trim().toUpperCase()
  );
  if (!team) return res.status(404).json({ error: 'Invalid team invite code' });

  const members = Array.from(dbStore.teamMembers.values()).filter((m) => m.teamId === team.id);
  if (members.length >= team.maxMembers) {
    return res.status(400).json({ error: 'Team roster has reached maximum capacity' });
  }

  const alreadyIn = members.find((m) => m.userId === userId);
  if (alreadyIn) {
    return res.status(409).json({ error: 'You are already a member of this team' });
  }

  const now = new Date().toISOString();
  const member = {
    id: `tm_${team.id}_${userId}`,
    teamId: team.id,
    userId,
    role: 'member' as const,
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  dbStore.teamMembers.set(member.id, member);

  res.json({ team, member });
});

// ==========================================
// Disputes & Appeals APIs
// ==========================================
app.get('/api/disputes', (req, res) => {
  const list = Array.from(dbStore.disputes.values());
  res.json(list);
});

app.post('/api/disputes', (req, res) => {
  const parsed = DisputeSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const match = dbStore.matches.get(parsed.data.matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const petitionerUserId = (req.headers['x-user-id'] as string) || req.body.petitionerUserId;
  const opponentUserId = match.player1.userId === petitionerUserId ? match.player2.userId : match.player1.userId;
  const now = new Date().toISOString();
  const id = `disp_${Date.now()}`;

  const dispute = {
    id,
    matchId: match.id,
    tournamentId: match.tournamentId,
    petitionerUserId,
    opponentUserId,
    reason: parsed.data.reason,
    description: parsed.data.description,
    status: 'open' as const,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.disputes.set(id, dispute);
  dbStore.logAudit(petitionerUserId, 'player', 'DISPUTE_SUBMITTED', 'disputes', id, { matchId: match.id });

  res.status(201).json(dispute);
});

// ==========================================
// Moderator & Anti-Cheat APIs
// ==========================================
app.get('/api/moderation/cases', (req, res) => {
  const list = Array.from(dbStore.fairPlayCases.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(list);
});

app.post('/api/moderation/cases/:id/resolve', (req, res) => {
  const c = dbStore.fairPlayCases.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });

  const moderatorId = (req.headers['x-user-id'] as string) || 'user_mod_1';
  const { resolution, notes } = req.body;

  c.status = 'resolved';
  c.resolution = resolution;
  c.moderatorNotes = notes;
  c.assignedModeratorId = moderatorId;
  c.resolvedAt = new Date().toISOString();
  c.updatedAt = new Date().toISOString();

  // If suspension action selected
  if (resolution === 'temporary_suspension') {
    const suspect = dbStore.users.get(c.suspectUserId);
    if (suspect) {
      suspect.status = 'suspended';
    }
  }

  dbStore.logAudit(moderatorId, 'moderator', 'FAIRPLAY_CASE_RESOLVED', 'fairPlayCases', c.id, {
    resolution,
    notes,
    suspectUserId: c.suspectUserId,
  });

  res.json(c);
});

// ==========================================
// Admin APIs
// ==========================================
app.get('/api/admin/audit-logs', (req, res) => {
  const list = Array.from(dbStore.auditLogs.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json(list);
});

app.get('/api/admin/users', (req, res) => {
  const list = Array.from(dbStore.users.values());
  res.json(list);
});

app.get('/api/admin/settings', (req, res) => {
  res.json(dbStore.appSettings);
});

app.post('/api/admin/settings', (req, res) => {
  const adminId = (req.headers['x-user-id'] as string) || 'user_admin_1';
  dbStore.appSettings = {
    ...dbStore.appSettings,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  dbStore.logAudit(adminId, 'admin', 'SETTINGS_UPDATED', 'appSettings', 'default_settings', req.body);
  res.json(dbStore.appSettings);
});

// Admin Developer Reset Seed Button
app.post('/api/admin/reset-demo', (req, res) => {
  const adminId = (req.headers['x-user-id'] as string) || 'user_admin_1';
  const user = dbStore.users.get(adminId);
  if (user && user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Admin role required to reset seed.' });
  }

  dbStore.seedDemoData();
  dbStore.logAudit(adminId, 'admin', 'DEMO_DATA_RESET', 'system', 'root');
  res.json({ message: 'Demo data successfully re-seeded with 16 demo players and demo tournaments.' });
});

// Notifications
app.get('/api/notifications', (req, res) => {
  const userId = req.query.userId as string;
  const list = Array.from(dbStore.notifications.values()).filter(
    (n) => !userId || n.userId === userId
  );
  res.json(list);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const notif = dbStore.notifications.get(req.params.id);
  if (notif) {
    notif.read = true;
    notif.updatedAt = new Date().toISOString();
  }
  res.json({ ok: true });
});

// ==========================================
// Vite Middleware / Static Frontend
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server authoritative engine running on port ${PORT}`, {
      metadata: { port: PORT, env: env.NODE_ENV },
    });
  });
}

// Global Express Error Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled express endpoint exception', err, {
    requestId: (req as any).id,
    metadata: { path: req.path, method: req.method },
  });
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Internal server error occurred. Telemetry recorded.' });
});

// Process-level uncaught exception and rejection monitors
process.on('uncaughtException', (err) => {
  logger.error('Fatal Uncaught Exception', err);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', reason);
});

startServer();
