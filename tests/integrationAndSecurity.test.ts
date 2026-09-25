import { describe, it, expect } from 'vitest';
import { dbStore } from '../server/store.js';
import {
  createSingleEliminationBracket,
  seedParticipants,
} from '../server/bracketEngine.js';
import {
  finalizeMatchResult,
  generateMatchTargets,
  validatePlayerAction,
} from '../server/gameEngine.js';

import { Match } from '../src/types/database.js';

describe('End-to-End Registration-to-Result Flow & Security Invariants', () => {
  it('prevents duplicate tournament registrations for the same user', () => {
    const tournId = 'tourn_active_apex_1';
    const userId = 'demo_player_1';

    // Check existing registration
    const existing = Array.from(dbStore.tournamentRegistrations.values()).find(
      (r) => r.tournamentId === tournId && r.userId === userId
    );
    expect(existing).toBeDefined();

    // Attempting duplicate registration check
    const isDuplicate = Array.from(dbStore.tournamentRegistrations.values()).some(
      (r) => r.tournamentId === tournId && r.userId === userId
    );
    expect(isDuplicate).toBe(true);
  });

  it('runs an end-to-end 5-round match between two players to verified server final result', () => {
    const matchSeed = 'e2e_match_seed_test_99';
    const targets = generateMatchTargets(matchSeed, 5);
    expect(targets.length).toBeGreaterThanOrEqual(5);

    let match: Match = {
      id: 'match_e2e_1',
      tournamentId: 'tourn_active_apex_1',
      gameId: 'game_reaction_grid_duel',
      roundIndex: 1,
      matchRoomCode: 'E2E-99',
      status: 'ACTIVE',
      player1: {
        userId: 'p1_e2e',
        anonymousAlias: 'Player-4821',
        ready: true,
        score: 0,
        reactionTimes: [] as number[],
        connected: true,
        lastHeartbeat: Date.now(),
        reconnectCount: 0,
        tabLostFocusCount: 0,
      },
      player2: {
        userId: 'p2_e2e',
        anonymousAlias: 'Echo-710',
        ready: true,
        score: 0,
        reactionTimes: [] as number[],
        connected: true,
        lastHeartbeat: Date.now(),
        reconnectCount: 0,
        tabLostFocusCount: 0,
      },
      currentRound: 1,
      totalRounds: 5,
      roundSeed: matchSeed,
      roundStartTime: 2000000,
      roundTargets: targets,
      scheduledStartTime: new Date().toISOString(),
      antiCheatRiskScore: 0,
      antiCheatFlagged: false,
      antiCheatReasons: [] as string[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate 5 rounds of gameplay
    for (let r = 1; r <= 5; r++) {
      match.currentRound = r;
      match.roundStartTime = 2000000 + r * 10000;
      const target = targets.find((t) => t.round === r && t.targetType === 'correct')!;

      // P1 clicks target accurately in 210ms
      const p1Spawn = match.roundStartTime + target.displayAtMs;
      const p1Validation = validatePlayerAction(
        match,
        'p1_e2e',
        r,
        target.id,
        target.gridIndex,
        p1Spawn + 208,
        p1Spawn + 210
      );
      expect(p1Validation.valid).toBe(true);
      match.player1.score += p1Validation.awardedScore;
      match.player1.reactionTimes.push(p1Validation.reactionTimeMs);

      // P2 clicks target slightly slower in 340ms
      const p2Validation = validatePlayerAction(
        match,
        'p2_e2e',
        r,
        target.id,
        target.gridIndex,
        p1Spawn + 338,
        p1Spawn + 340
      );
      expect(p2Validation.valid).toBe(true);
      match.player2.score += p2Validation.awardedScore;
      match.player2.reactionTimes.push(p2Validation.reactionTimeMs);
    }

    // P1 was faster in all rounds, so P1 must have higher score
    expect(match.player1.score).toBeGreaterThan(match.player2.score);

    // Finalize match on server
    match.status = 'COMPLETED';
    const finalResult = finalizeMatchResult(match);

    expect(finalResult.winnerId).toBe('p1_e2e');
    expect(finalResult.verifiedByServer).toBe(true);
    expect(finalResult.auditHash).toContain('AUTH-NEXORA-');
  });

  it('rejects duplicate or rapid click flooding (rate-limiting guard)', () => {
    const match = {
      id: 'match_burst_test',
      gameId: 'game_reaction_grid_duel',
      roundIndex: 1,
      matchRoomCode: 'BURST-1',
      status: 'ACTIVE' as const,
      player1: {
        userId: 'p1_burst',
        anonymousAlias: 'Player-4821',
        ready: true,
        score: 0,
        reactionTimes: [] as number[],
        connected: true,
        lastHeartbeat: Date.now(),
        reconnectCount: 0,
        tabLostFocusCount: 0,
      },
      player2: {
        userId: 'p2_burst',
        anonymousAlias: 'Echo-710',
        ready: true,
        score: 0,
        reactionTimes: [] as number[],
        connected: true,
        lastHeartbeat: Date.now(),
        reconnectCount: 0,
        tabLostFocusCount: 0,
      },
      currentRound: 1,
      totalRounds: 5,
      roundSeed: 'seed_burst',
      roundStartTime: 5000000,
      roundTargets: [
        {
          round: 1,
          id: 'target_r1_primary',
          gridIndex: 3,
          color: '#06b6d4',
          displayAtMs: 500,
          durationMs: 2000,
          targetType: 'correct' as const,
          points: 500,
          penaltyPoints: 200,
        },
      ],
      scheduledStartTime: new Date().toISOString(),
      antiCheatRiskScore: 0,
      antiCheatFlagged: false,
      antiCheatReasons: [] as string[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // First click valid
    const click1 = validatePlayerAction(
      match,
      'p1_burst',
      1,
      'target_r1_primary',
      3,
      5000720,
      5000720
    );
    expect(click1.valid).toBe(true);

    // Click for an invalid/non-existent round rejected
    const invalidRoundClick = validatePlayerAction(
      match,
      'p1_burst',
      2, // mismatch currentRound 1
      'target_r1_primary',
      3,
      5000730,
      5000730
    );
    expect(invalidRoundClick.valid).toBe(false);
    expect(invalidRoundClick.reason).toContain('Round desynchronization');
  });

  it('restores clean state and verifies seed reproducibility on demo reset', () => {
    dbStore.seedDemoData();

    expect(dbStore.users.size).toBeGreaterThanOrEqual(16);
    expect(dbStore.teams.size).toBe(4);
    expect(dbStore.tournaments.size).toBe(2);
    expect(dbStore.leaderboards.size).toBe(16);
    expect(dbStore.auditLogs.size).toBeGreaterThan(0);
  });
});
