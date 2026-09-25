import { describe, it, expect } from 'vitest';
import {
  generateMatchTargets,
  validatePlayerAction,
  finalizeMatchResult,
} from '../server/gameEngine.js';
import { Match } from '../src/types/database.js';

describe('Reaction Grid Duel Score & Action Validation Engine', () => {
  const baseMatch: Match = {
    id: 'test_match_val_1',
    gameId: 'game_reaction_grid_duel',
    roundIndex: 1,
    matchRoomCode: 'VAL-101',
    status: 'ACTIVE',
    player1: {
      userId: 'p1',
      anonymousAlias: 'Player-4821',
      ready: true,
      score: 0,
      reactionTimes: [],
      connected: true,
      lastHeartbeat: Date.now(),
      reconnectCount: 0,
      tabLostFocusCount: 0,
    },
    player2: {
      userId: 'p2',
      anonymousAlias: 'Echo-710',
      ready: true,
      score: 0,
      reactionTimes: [],
      connected: true,
      lastHeartbeat: Date.now(),
      reconnectCount: 0,
      tabLostFocusCount: 0,
    },
    currentRound: 1,
    totalRounds: 5,
    roundSeed: 'seed_deterministic_123',
    roundStartTime: 1000000,
    roundTargets: [
      {
        round: 1,
        id: 'target_r1_primary',
        gridIndex: 5,
        color: '#06b6d4',
        displayAtMs: 800,
        durationMs: 2000,
        targetType: 'correct',
        points: 500,
        penaltyPoints: 200,
      },
    ],
    scheduledStartTime: new Date().toISOString(),
    antiCheatRiskScore: 0,
    antiCheatFlagged: false,
    antiCheatReasons: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('awards valid score and speed bonus for genuine human reaction times', () => {
    // Target displays at 1000000 + 800 = 1000800
    // Click arrives at 1001050 -> Reaction time = 250ms (human valid)
    const result = validatePlayerAction(
      baseMatch,
      'p1',
      1,
      'target_r1_primary',
      5, // correct gridIndex
      1001048,
      1001050
    );

    expect(result.valid).toBe(true);
    expect(result.reactionTimeMs).toBe(250);
    expect(result.isImpossibleSpeed).toBe(false);
    expect(result.awardedScore).toBeGreaterThan(500); // 500 base + speed bonus
  });

  it('rejects premature click before target was visually spawned', () => {
    // Click arrives before displayAtMs (at 1000500 vs spawn at 1000800)
    const result = validatePlayerAction(
      baseMatch,
      'p1',
      1,
      'target_r1_primary',
      5,
      1000490,
      1000500
    );

    expect(result.valid).toBe(false);
    expect(result.reactionTimeMs).toBeLessThan(0);
    expect(result.isImpossibleSpeed).toBe(true);
    expect(result.awardedScore).toBeLessThan(0); // Penalty
  });

  it('flags impossible sub-110ms human reflex speed as suspicious anomaly', () => {
    // Click arrives at 1000840 -> Reaction time = 40ms (physiologically impossible)
    const result = validatePlayerAction(
      baseMatch,
      'p1',
      1,
      'target_r1_primary',
      5,
      1000839,
      1000840
    );

    expect(result.reactionTimeMs).toBe(40);
    expect(result.isImpossibleSpeed).toBe(true);
  });

  it('penalizes incorrect grid coordinate clicks', () => {
    // Target is on grid 5, player clicks grid 10
    const result = validatePlayerAction(
      baseMatch,
      'p1',
      1,
      'target_r1_primary',
      10, // wrong cell
      1001190,
      1001200
    );

    expect(result.valid).toBe(false);
    expect(result.awardedScore).toBe(-200); // penaltyPoints
  });

  it('generates cryptographic sealed audit hash upon match finalization', () => {
    const finishedMatch: Match = {
      ...baseMatch,
      status: 'COMPLETED',
      player1: { ...baseMatch.player1, score: 3200 },
      player2: { ...baseMatch.player2, score: 2400 },
    };

    const res = finalizeMatchResult(finishedMatch);
    expect(res.winnerId).toBe('p1');
    expect(res.verifiedByServer).toBe(true);
    expect(res.auditHash).toMatch(/^AUTH-NEXORA-/);
  });
});
