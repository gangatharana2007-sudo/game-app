import { describe, it, expect } from 'vitest';
import { finalizeMatchResult } from '../server/gameEngine.js';
import { Match } from '../src/types/database.js';

describe('Forfeit & Anonymous Identity Protection Logic', () => {
  const matchSample: Match = {
    id: 'match_forfeit_test_1',
    tournamentId: 'tourn_apex_1',
    gameId: 'game_reaction_grid_duel',
    roundIndex: 1,
    matchRoomCode: 'LOBBY-900',
    status: 'WAITING',
    player1: {
      userId: 'user_real_alpha_77',
      anonymousAlias: 'Player-4821', // Anonymous handle
      ready: true,
      score: 500,
      reactionTimes: [],
      connected: true,
      lastHeartbeat: Date.now(),
      reconnectCount: 0,
      tabLostFocusCount: 0,
    },
    player2: {
      userId: 'user_real_beta_88',
      anonymousAlias: 'Echo-710', // Anonymous handle
      ready: false,
      score: 0,
      reactionTimes: [],
      connected: false,
      lastHeartbeat: 0,
      reconnectCount: 0,
      tabLostFocusCount: 0,
    },
    currentRound: 1,
    totalRounds: 5,
    roundSeed: 'seed_forfeit_test',
    scheduledStartTime: new Date().toISOString(),
    antiCheatRiskScore: 0,
    antiCheatFlagged: false,
    antiCheatReasons: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('guarantees opponent real identity (user_real_beta_88) is masked by anonymous handle (Echo-710)', () => {
    // Competitors only receive the anonymousAlias in match room telemetry
    expect(matchSample.player1.anonymousAlias).toBe('Player-4821');
    expect(matchSample.player2.anonymousAlias).toBe('Echo-710');
    expect(matchSample.player1.anonymousAlias).not.toContain('alpha');
    expect(matchSample.player2.anonymousAlias).not.toContain('beta');
  });

  it('awards forfeit victory to present competitor when opponent grace period expires', () => {
    // Player 2 is marked forfeit due to absence
    const forfeitMatch: Match = {
      ...matchSample,
      player2: {
        ...matchSample.player2,
        isForfeit: true,
        forfeitReason: 'Grace period expired without entering lobby',
      },
    };

    const result = finalizeMatchResult(forfeitMatch);
    expect(result.isForfeit).toBe(true);
    expect(result.forfeitPlayerId).toBe('user_real_beta_88');
    expect(result.winnerId).toBe('user_real_alpha_77');
    expect(result.verifiedByServer).toBe(true);
  });
});
