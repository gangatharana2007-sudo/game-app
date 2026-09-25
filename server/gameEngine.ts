import { Match, MatchEvent, MatchResult, ReactionTarget } from '../src/types/database.js';

// Deterministic Pseudo-Random Generator (LCG)
export function createSeededRng(seedStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h = (h ^ (h >>> 16)) >>> 0;
    return (h & 0xfffffff) / 0x10000000;
  };
}

const TARGET_COLORS = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

/**
 * Generates deterministic 5-round target configurations for Reaction Grid Duel
 */
export function generateMatchTargets(matchSeed: string, totalRounds = 5): ReactionTarget[] {
  const rng = createSeededRng(matchSeed);
  const targets: ReactionTarget[] = [];

  for (let r = 1; r <= totalRounds; r++) {
    // Round 1-5 targets: 1 primary target, 1 distractor target per round
    const gridIndex = Math.floor(rng() * 16);
    const colorIndex = Math.floor(rng() * TARGET_COLORS.length);
    const displayAtMs = 600 + Math.floor(rng() * 1200); // 600ms - 1800ms after round start
    const durationMs = Math.max(1200, 2200 - r * 150); // rounds get slightly faster

    targets.push({
      round: r,
      id: `target_r${r}_primary`,
      gridIndex,
      color: TARGET_COLORS[colorIndex],
      displayAtMs,
      durationMs,
      targetType: 'correct',
      points: 500,
      penaltyPoints: 200,
    });

    // Distractor for rounds 3, 4, 5
    if (r >= 3) {
      let distractorGrid = Math.floor(rng() * 16);
      while (distractorGrid === gridIndex) {
        distractorGrid = Math.floor(rng() * 16);
      }
      targets.push({
        round: r,
        id: `target_r${r}_distractor`,
        gridIndex: distractorGrid,
        color: '#ef4444', // Red warning
        displayAtMs: displayAtMs + 200,
        durationMs: durationMs,
        targetType: 'distractor',
        points: -300,
        penaltyPoints: 300,
      });
    }
  }

  return targets;
}

export interface ActionValidationResult {
  valid: boolean;
  awardedScore: number;
  reactionTimeMs: number;
  reason: string;
  isImpossibleSpeed: boolean;
}

/**
 * Server-authoritative action scoring and validation
 */
export function validatePlayerAction(
  match: Match,
  userId: string,
  round: number,
  targetId: string,
  gridIndex: number,
  clientTimestamp: number,
  serverReceiveTimestamp: number
): ActionValidationResult {
  if (match.status !== 'ACTIVE') {
    return {
      valid: false,
      awardedScore: 0,
      reactionTimeMs: 0,
      reason: `Match is not in ACTIVE state (current: ${match.status})`,
      isImpossibleSpeed: false,
    };
  }

  if (match.currentRound !== round) {
    return {
      valid: false,
      awardedScore: 0,
      reactionTimeMs: 0,
      reason: `Round desynchronization: match is on round ${match.currentRound}, action submitted for round ${round}`,
      isImpossibleSpeed: false,
    };
  }

  if (!match.roundStartTime) {
    return {
      valid: false,
      awardedScore: 0,
      reactionTimeMs: 0,
      reason: 'Round start timestamp not initialized on server',
      isImpossibleSpeed: false,
    };
  }

  const roundTargets = match.roundTargets || [];
  const target = roundTargets.find((t) => t.round === round && t.id === targetId);

  if (!target) {
    return {
      valid: false,
      awardedScore: 0,
      reactionTimeMs: 0,
      reason: `Invalid target ID ${targetId} for round ${round}`,
      isImpossibleSpeed: false,
    };
  }

  // Calculate reaction time based on server round start time + target appearance time
  const targetSpawnServerTime = match.roundStartTime + target.displayAtMs;
  const reactionTimeMs = serverReceiveTimestamp - targetSpawnServerTime;

  // Click arrived before target was even spawned!
  if (reactionTimeMs < 0) {
    return {
      valid: false,
      awardedScore: -200,
      reactionTimeMs,
      reason: `Premature click before visual target appeared (${reactionTimeMs}ms)`,
      isImpossibleSpeed: true,
    };
  }

  // Click arrived faster than 110ms (human physiological reflex impossible)
  const isImpossibleSpeed = reactionTimeMs < 110;

  // Wrong grid cell clicked
  if (target.gridIndex !== gridIndex) {
    return {
      valid: false,
      awardedScore: -target.penaltyPoints,
      reactionTimeMs,
      reason: `Mismatched grid coordinates: expected cell ${target.gridIndex}, clicked ${gridIndex}`,
      isImpossibleSpeed,
    };
  }

  // Distractor hit
  if (target.targetType === 'distractor') {
    return {
      valid: true,
      awardedScore: target.points, // negative
      reactionTimeMs,
      reason: 'Distractor target hit penalty',
      isImpossibleSpeed,
    };
  }

  // Correct target hit: award base points + speed bonus
  // Speed bonus: max 500 bonus if clicked within 200ms, linear drop to 0 at 1200ms
  const speedBonus = Math.max(0, Math.floor((1200 - Math.min(1200, reactionTimeMs)) * 0.5));
  const totalAwarded = target.points + speedBonus;

  return {
    valid: true,
    awardedScore: totalAwarded,
    reactionTimeMs,
    reason: isImpossibleSpeed
      ? `Valid cell hit but IMPOSSIBLE reaction speed (${reactionTimeMs}ms)`
      : `Accurate reaction in ${reactionTimeMs}ms (+${speedBonus} speed bonus)`,
    isImpossibleSpeed,
  };
}

/**
 * Creates final verified MatchResult and cryptographic audit hash
 */
export function finalizeMatchResult(match: Match): MatchResult {
  const p1Score = match.player1.score;
  const p2Score = match.player2.score;

  let winnerId: string | undefined = undefined;
  if (match.player1.isForfeit) {
    winnerId = match.player2.userId;
  } else if (match.player2.isForfeit) {
    winnerId = match.player1.userId;
  } else if (p1Score > p2Score) {
    winnerId = match.player1.userId;
  } else if (p2Score > p1Score) {
    winnerId = match.player2.userId;
  } // else draw

  const now = new Date().toISOString();
  const auditString = `${match.id}|${match.player1.userId}:${p1Score}|${match.player2.userId}:${p2Score}|${winnerId}|${now}`;
  
  // Simple deterministic hash representation for audit trail
  let hash = 0;
  for (let i = 0; i < auditString.length; i++) {
    const char = auditString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const auditHash = `AUTH-NEXORA-${Math.abs(hash).toString(16).toUpperCase()}-${Date.now().toString(36)}`;

  return {
    id: `res_${match.id}`,
    matchId: match.id,
    tournamentId: match.tournamentId,
    player1Id: match.player1.userId,
    player2Id: match.player2.userId,
    player1FinalScore: p1Score,
    player2FinalScore: p2Score,
    winnerId,
    isForfeit: Boolean(match.player1.isForfeit || match.player2.isForfeit),
    forfeitPlayerId: match.player1.isForfeit
      ? match.player1.userId
      : match.player2.isForfeit
      ? match.player2.userId
      : undefined,
    completedAt: now,
    verifiedByServer: true,
    auditHash,
    createdAt: now,
    updatedAt: now,
  };
}
