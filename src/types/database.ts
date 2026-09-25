import { z } from 'zod';

// ==========================================
// User Roles & Auth
// ==========================================
export type UserRole = 'player' | 'organizer' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl?: string;
  country?: string;
  status: 'active' | 'suspended' | 'banned' | 'under_investigation';
  createdAt: string;
  updatedAt: string;
}

export interface PlayerProfile {
  id: string; // matches userId
  userId: string;
  anonymousAlias: string; // e.g. "Shadow-4821"
  skillRating: number; // Elo/MMR default 1200
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  tournamentWins: number;
  fairPlayScore: number; // 0 to 100, default 100
  activeTeamId?: string;
  preferredLanguage: 'en' | 'ta';
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Teams
// ==========================================
export interface Team {
  id: string;
  name: string;
  tag: string; // 3-5 chars e.g. "NXR"
  captainId: string;
  inviteCode: string;
  maxMembers: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'captain' | 'member';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Games & Original Titles
// ==========================================
export interface GameDefinition {
  id: string;
  title: string;
  slug: string;
  description: string;
  rulesOverview: string;
  mode: '1v1' | 'team';
  rounds: number;
  timeLimitPerRoundMs: number;
  isOriginal: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Tournaments & Brackets
// ==========================================
export type TournamentFormat = 'single_elimination' | 'round_robin' | 'double_elimination' | 'swiss';
export type TournamentStatus = 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
export type EntryType = 'free' | 'invite_only' | 'ranked_qualifier';

export interface Tournament {
  id: string;
  title: string;
  titleTa?: string;
  gameId: string;
  organizerId: string;
  format: TournamentFormat;
  status: TournamentStatus;
  entryType: EntryType;
  teamSize: number; // 1 for solo
  maxParticipants: number;
  currentParticipantsCount: number;
  registrationDeadline: string;
  startDate: string;
  endDate?: string;
  gracePeriodSeconds: number; // e.g. 120 seconds
  rules: string;
  prizeDescription: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  userId: string;
  teamId?: string;
  seed?: number;
  status: 'confirmed' | 'waitlist' | 'disqualified' | 'withdrawn';
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bracket {
  id: string;
  tournamentId: string;
  format: TournamentFormat;
  totalRounds: number;
  currentRound: number;
  structure: {
    rounds: {
      roundNumber: number;
      name: string;
      matchIds: string[];
    }[];
  };
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Matches & Match State Machine
// ==========================================
export type MatchStatus =
  | 'WAITING'
  | 'READY'
  | 'COUNTDOWN'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'DISCONNECTED'
  | 'UNDER_REVIEW'
  | 'CANCELLED';

export interface MatchPlayerInfo {
  userId: string;
  anonymousAlias: string;
  ready: boolean;
  score: number;
  reactionTimes: number[];
  connected: boolean;
  lastHeartbeat: number;
  reconnectCount: number;
  tabLostFocusCount: number;
  isForfeit?: boolean;
  forfeitReason?: string;
}

export interface ReactionTarget {
  round: number;
  id: string;
  gridIndex: number; // 0 to 15 (4x4 grid)
  color: string;
  displayAtMs: number; // relative to round start
  durationMs: number;
  targetType: 'correct' | 'distractor' | 'bonus';
  points: number;
  penaltyPoints: number;
}

export interface Match {
  id: string;
  tournamentId?: string;
  gameId: string;
  bracketId?: string;
  roundIndex: number;
  matchRoomCode: string;
  status: MatchStatus;
  player1: MatchPlayerInfo;
  player2: MatchPlayerInfo;
  currentRound: number;
  totalRounds: number;
  roundSeed: string; // deterministic seed
  roundStartTime?: number;
  roundTargets?: ReactionTarget[];
  scheduledStartTime: string;
  actualStartTime?: string;
  completedAt?: string;
  winnerUserId?: string;
  isDraw?: boolean;
  antiCheatRiskScore: number; // 0 to 100
  antiCheatFlagged: boolean;
  antiCheatReasons: string[];
  reviewedByModeratorId?: string;
  reviewDecision?: 'verified' | 'overturned' | 'rematch_ordered' | 'penalty_applied';
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  userId: string;
  anonymousAlias: string;
  eventType:
    | 'PLAYER_READY'
    | 'ROUND_START'
    | 'CLICK_TARGET'
    | 'CLICK_MISS'
    | 'ROUND_TIMEOUT'
    | 'TAB_FOCUS_LOST'
    | 'TAB_FOCUS_RESTORED'
    | 'DISCONNECTED'
    | 'RECONNECTED'
    | 'SUSPICIOUS_TIMING'
    | 'CLIENT_DESYNC'
    | 'MATCH_FINISH';
  round: number;
  clientTimestamp: number;
  serverTimestamp: number;
  deltaMs: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  id: string;
  matchId: string;
  tournamentId?: string;
  player1Id: string;
  player2Id: string;
  player1FinalScore: number;
  player2FinalScore: number;
  winnerId?: string;
  isForfeit: boolean;
  forfeitPlayerId?: string;
  completedAt: string;
  verifiedByServer: boolean;
  auditHash: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Anti-Cheat & Fair Play
// ==========================================
export type FairPlayClassification = 'NORMAL' | 'REVIEW_REQUIRED' | 'HIGH_RISK';

export interface FairPlayCase {
  id: string;
  matchId: string;
  tournamentId?: string;
  suspectUserId: string;
  suspectAlias: string;
  opponentUserId: string;
  classification: FairPlayClassification;
  riskScore: number; // 0 to 100
  confidenceScore: number; // 0.0 to 1.0
  evidenceSummary: string[];
  aiAnalysisExplanation?: string;
  status: 'pending_review' | 'resolved' | 'appealed' | 'dismissed';
  assignedModeratorId?: string;
  moderatorNotes?: string;
  resolution?: 'no_action' | 'warning_issued' | 'match_voided' | 'temporary_suspension';
  playerStatement?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationAction {
  id: string;
  caseId?: string;
  moderatorId: string;
  targetUserId: string;
  actionType: 'warning' | 'forfeit_award' | 'match_overturn' | 'temp_suspension' | 'unban';
  reason: string;
  evidenceRef: string;
  durationDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  matchId: string;
  tournamentId?: string;
  petitionerUserId: string;
  opponentUserId: string;
  reason: 'anti_cheat_suspected' | 'disconnection_issue' | 'scoring_desync' | 'rules_infraction' | 'other';
  description: string;
  playerEvidenceUrl?: string;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  assignedModeratorId?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  targetResource: string;
  targetResourceId: string;
  metadata: Record<string, unknown>;
  ipHash?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Notifications & System
// ==========================================
export type NotificationType =
  | 'TOURNAMENT_REGISTRATION'
  | 'MATCH_ASSIGNED'
  | 'MATCH_REMINDER_24H'
  | 'MATCH_REMINDER_1H'
  | 'MATCH_REMINDER_10M'
  | 'MATCH_STARTED'
  | 'MATCH_RESULT'
  | 'DISPUTE_UPDATE'
  | 'FAIRPLAY_ALERT'
  | 'SYSTEM_ANNOUNCEMENT';

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleTa?: string;
  message: string;
  messageTa?: string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  anonymousAlias: string;
  rank: number;
  skillRating: number;
  wins: number;
  losses: number;
  winRate: number;
  fairPlayRating: number;
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  rateLimitPerMinute: number;
  antiCheatSensitivity: 'low' | 'balanced' | 'high' | 'strict';
  minReactionTimeThresholdMs: number; // default 110 ms
  maxAllowedReconnects: number; // default 3
  gracePeriodSeconds: number; // default 120
  aiReviewEnabled: boolean;
  updatedAt: string;
  createdAt: string;
}

// ==========================================
// Zod Validation Schemas
// ==========================================
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(3).max(30),
  preferredLanguage: z.enum(['en', 'ta']).default('en'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CreateTournamentSchema = z.object({
  title: z.string().min(3).max(100),
  titleTa: z.string().max(100).optional(),
  gameId: z.string(),
  format: z.enum(['single_elimination', 'round_robin', 'double_elimination', 'swiss']),
  entryType: z.enum(['free', 'invite_only', 'ranked_qualifier']).default('free'),
  teamSize: z.number().int().min(1).max(5).default(1),
  maxParticipants: z.number().int().min(2).max(128).default(16),
  registrationDeadline: z.string(),
  startDate: z.string(),
  gracePeriodSeconds: z.number().int().min(30).max(600).default(120),
  rules: z.string().min(10),
  prizeDescription: z.string().min(3),
});

export const CreateTeamSchema = z.object({
  name: z.string().min(3).max(30),
  tag: z.string().min(2).max(5).toUpperCase(),
  maxMembers: z.number().int().min(2).max(10).default(5),
});

export const PlayerActionSchema = z.object({
  matchId: z.string(),
  round: z.number().int().min(1).max(5),
  targetId: z.string(),
  gridIndex: z.number().int().min(0).max(15),
  clientTimestamp: z.number(),
  screenCoordinates: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export const DisputeSubmissionSchema = z.object({
  matchId: z.string(),
  reason: z.enum(['anti_cheat_suspected', 'disconnection_issue', 'scoring_desync', 'rules_infraction', 'other']),
  description: z.string().min(10).max(1000),
});
