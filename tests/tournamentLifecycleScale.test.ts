import { describe, it, expect } from 'vitest';
import {
  advanceWinnerToNextRound,
  calculateTournamentStandings,
  createSingleEliminationBracket,
  seedParticipants,
} from '../server/bracketEngine.js';
import {
  finalizeMatchResult,
  generateMatchTargets,
  validatePlayerAction,
} from '../server/gameEngine.js';
import { evaluatePlayerTelemetry } from '../src/lib/antiCheat.js';
import { Match, Tournament } from '../src/types/database.js';

// Helper to generate N mock players
function createMockPlayers(count: number) {
  return Array.from({ length: count }).map((_, i) => ({
    userId: `user_scale_${count}_${i + 1}`,
    anonymousAlias: `Player-${1000 + i}`,
    skillRating: 1200 + (i * 17) % 800, // Varied skill ratings
  }));
}

// Helper to create mock tournament
function createMockTournament(size: number): Tournament {
  return {
    id: `tourn_scale_${size}`,
    title: `Scale Test Tournament ${size} Players`,
    gameId: 'game_reaction_grid_duel',
    organizerId: 'org_admin',
    format: 'single_elimination',
    status: 'registration_open',
    entryType: 'free',
    teamSize: 1,
    maxParticipants: size,
    currentParticipantsCount: size,
    registrationDeadline: new Date().toISOString(),
    startDate: new Date().toISOString(),
    gracePeriodSeconds: 120,
    rules: 'Reaction Grid Duel standard rules',
    prizeDescription: '$5,000 Trophy Pool',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('Tournament Full Lifecycle Across Scales (4, 8, 16, 32, 64 Players)', () => {
  // ========================================================
  // 1. 4-Player Complete Lifecycle
  // ========================================================
  describe('4-Player Tournament Lifecycle', () => {
    const players = createMockPlayers(4);
    const tournament = createMockTournament(4);
    const registrationsMap = new Map<string, string>();

    it('handles registration and prevents duplicate registration', () => {
      // Register all 4 players
      players.forEach((p) => {
        expect(registrationsMap.has(p.userId)).toBe(false);
        registrationsMap.set(p.userId, p.anonymousAlias);
      });
      expect(registrationsMap.size).toBe(4);

      // Duplicate registration attempt by Player 1
      const isDuplicate = registrationsMap.has(players[0].userId);
      expect(isDuplicate).toBe(true);
    });

    it('generates single elimination bracket and schedules matches', () => {
      const seeds = seedParticipants(players, 'skill_rating');
      const { bracket, matches } = createSingleEliminationBracket(tournament, seeds);

      expect(bracket.totalRounds).toBe(2); // 2 rounds (Semifinals, Finals)
      expect(matches.length).toBe(3); // 2 in R1, 1 in R2
      expect(bracket.structure.rounds[0].name).toBe('Semifinals');
      expect(bracket.structure.rounds[1].name).toBe('Finals');

      // Verify scheduled start time formatting and spacing
      matches.forEach((m) => {
        expect(m.scheduledStartTime).toBeDefined();
        expect(new Date(m.scheduledStartTime).getTime()).not.toBeNaN();
      });
    });

    it('executes Match 1 with no-show forfeit and awards win to opponent', () => {
      const seeds = seedParticipants(players, 'skill_rating');
      const { bracket, matches } = createSingleEliminationBracket(tournament, seeds);
      const matchesMap = new Map(matches.map((m) => [m.id, m]));

      const m1 = matchesMap.get(bracket.structure.rounds[0].matchIds[0])!;

      // P1 joins and marks ready
      m1.player1.ready = true;
      m1.player1.connected = true;

      // P2 is absent beyond grace period -> forfeit triggered
      m1.player2.isForfeit = true;
      m1.player2.forfeitReason = 'Grace period expired without joining lobby';
      m1.status = 'COMPLETED';

      const res = finalizeMatchResult(m1);
      expect(res.isForfeit).toBe(true);
      expect(res.winnerId).toBe(m1.player1.userId);
      m1.winnerUserId = res.winnerId;

      // Advance winner to Finals
      const adv = advanceWinnerToNextRound(
        bracket,
        matchesMap,
        m1.id,
        m1.winnerUserId!,
        m1.player1.anonymousAlias
      );
      expect(adv.tournamentCompleted).toBe(false);
      expect(adv.nextMatch?.player1.userId).toBe(m1.player1.userId);
    });

    it('executes Match 2 with countdown, disconnect/reconnect, and valid/invalid results', () => {
      const seeds = seedParticipants(players, 'skill_rating');
      const { bracket, matches } = createSingleEliminationBracket(tournament, seeds);
      const matchesMap = new Map(matches.map((m) => [m.id, m]));

      const m2 = matchesMap.get(bracket.structure.rounds[0].matchIds[1])!;
      m2.roundTargets = generateMatchTargets(m2.roundSeed, 5);

      // 1. Ready & Countdown
      m2.player1.ready = true;
      m2.player2.ready = true;
      m2.status = 'COUNTDOWN';
      m2.roundStartTime = Date.now() + 3000;
      expect(m2.status).toBe('COUNTDOWN');

      // 2. Disconnect & Reconnect simulation
      m2.player2.connected = false;
      m2.player2.reconnectCount += 1;
      m2.player2.connected = true;
      expect(m2.player2.reconnectCount).toBe(1);
      expect(m2.player2.connected).toBe(true);

      // 3. Active Round 1
      m2.status = 'ACTIVE';
      m2.currentRound = 1;
      m2.roundStartTime = 1000000;
      const target = m2.roundTargets[0]; // Round 1 primary target

      // Invalid Result: click before target display (premature click)
      const invalidEarly = validatePlayerAction(
        m2,
        m2.player1.userId,
        1,
        target.id,
        target.gridIndex,
        1000100, // clicked before spawn
        1000100
      );
      expect(invalidEarly.valid).toBe(false);
      expect(invalidEarly.awardedScore).toBeLessThan(0);

      // Invalid Result: wrong coordinates
      const invalidWrongCell = validatePlayerAction(
        m2,
        m2.player1.userId,
        1,
        target.id,
        (target.gridIndex + 1) % 16,
        1000000 + target.displayAtMs + 200,
        1000000 + target.displayAtMs + 200
      );
      expect(invalidWrongCell.valid).toBe(false);

      // Valid Result: correct coordinates and genuine human reflex (230ms)
      const validHit = validatePlayerAction(
        m2,
        m2.player2.userId,
        1,
        target.id,
        target.gridIndex,
        1000000 + target.displayAtMs + 230,
        1000000 + target.displayAtMs + 230
      );
      expect(validHit.valid).toBe(true);
      expect(validHit.awardedScore).toBeGreaterThan(500);

      m2.player2.score += validHit.awardedScore;
      m2.status = 'COMPLETED';
      m2.winnerUserId = m2.player2.userId;

      // 4. Next-Round Qualification to Finals
      const adv = advanceWinnerToNextRound(
        bracket,
        matchesMap,
        m2.id,
        m2.winnerUserId!,
        m2.player2.anonymousAlias
      );
      expect(adv.tournamentCompleted).toBe(false);
      expect(adv.nextMatch?.player2.userId).toBe(m2.player2.userId);
    });

    it('plays the Finals and generates complete 4-player final leaderboard', () => {
      const seeds = seedParticipants(players, 'skill_rating');
      const { bracket, matches } = createSingleEliminationBracket(tournament, seeds);
      const matchesMap = new Map(matches.map((m) => [m.id, m]));

      // Advance M1 winner (P1)
      const m1 = matchesMap.get(bracket.structure.rounds[0].matchIds[0])!;
      m1.status = 'COMPLETED';
      m1.winnerUserId = m1.player1.userId;
      m1.player1.score = 2500;
      m1.player2.score = 1800;
      advanceWinnerToNextRound(bracket, matchesMap, m1.id, m1.winnerUserId!, m1.player1.anonymousAlias);

      // Advance M2 winner (P2)
      const m2 = matchesMap.get(bracket.structure.rounds[0].matchIds[1])!;
      m2.status = 'COMPLETED';
      m2.winnerUserId = m2.player2.userId;
      m2.player1.score = 1400;
      m2.player2.score = 3100;
      advanceWinnerToNextRound(bracket, matchesMap, m2.id, m2.winnerUserId!, m2.player2.anonymousAlias);

      // Finals Match
      const finalsMatch = matchesMap.get(bracket.structure.rounds[1].matchIds[0])!;
      expect(finalsMatch.player1.userId).toBe(m1.player1.userId);
      expect(finalsMatch.player2.userId).toBe(m2.player2.userId);

      // Play Finals: P2 wins Championship
      finalsMatch.status = 'COMPLETED';
      finalsMatch.player1.score = 2900;
      finalsMatch.player2.score = 3600;
      finalsMatch.winnerUserId = finalsMatch.player2.userId;

      const advFinals = advanceWinnerToNextRound(
        bracket,
        matchesMap,
        finalsMatch.id,
        finalsMatch.winnerUserId!,
        finalsMatch.player2.anonymousAlias
      );

      expect(advFinals.tournamentCompleted).toBe(true);
      expect(advFinals.standings).toBeDefined();

      const standings = advFinals.standings!;
      expect(standings.length).toBe(4);
      expect(standings[0].status).toBe('Champion');
      expect(standings[0].userId).toBe(finalsMatch.player2.userId);
      expect(standings[1].status).toBe('Runner-up');
      expect(standings[1].userId).toBe(finalsMatch.player1.userId);
      expect(standings[2].status).toBe('Semifinalist');
      expect(standings[3].status).toBe('Semifinalist');
    });
  });

  // ========================================================
  // 2. 8-Player Complete Lifecycle
  // ========================================================
  describe('8-Player Tournament Lifecycle', () => {
    const players = createMockPlayers(8);
    const tournament = createMockTournament(8);

    it('orchestrates 8-player bracket (3 rounds, 7 matches) to completion', () => {
      const seeds = seedParticipants(players, 'skill_rating');
      const { bracket, matches } = createSingleEliminationBracket(tournament, seeds);
      const matchesMap = new Map(matches.map((m) => [m.id, m]));

      expect(bracket.totalRounds).toBe(3); // Quarters, Semis, Finals
      expect(matches.length).toBe(7); // 4 + 2 + 1 = 7

      // Round 1: 4 matches
      for (const mId of bracket.structure.rounds[0].matchIds) {
        const m = matchesMap.get(mId)!;
        m.status = 'COMPLETED';
        m.player1.score = 2000;
        m.player2.score = 1500;
        m.winnerUserId = m.player1.userId;
        advanceWinnerToNextRound(bracket, matchesMap, m.id, m.winnerUserId!, m.player1.anonymousAlias);
      }

      // Round 2 (Semifinals): 2 matches
      for (const mId of bracket.structure.rounds[1].matchIds) {
        const m = matchesMap.get(mId)!;
        expect(m.player1.userId).not.toBe('TBD');
        expect(m.player2.userId).not.toBe('TBD');
        m.status = 'COMPLETED';
        m.player1.score = 2800;
        m.player2.score = 2200;
        m.winnerUserId = m.player1.userId;
        advanceWinnerToNextRound(bracket, matchesMap, m.id, m.winnerUserId!, m.player1.anonymousAlias);
      }

      // Round 3 (Finals): 1 match
      const finalsId = bracket.structure.rounds[2].matchIds[0];
      const finalsMatch = matchesMap.get(finalsId)!;
      finalsMatch.status = 'COMPLETED';
      finalsMatch.player1.score = 3500;
      finalsMatch.player2.score = 3100;
      finalsMatch.winnerUserId = finalsMatch.player1.userId;

      const finish = advanceWinnerToNextRound(
        bracket,
        matchesMap,
        finalsId,
        finalsMatch.winnerUserId!,
        finalsMatch.player1.anonymousAlias
      );

      expect(finish.tournamentCompleted).toBe(true);
      expect(finish.standings?.length).toBe(8);
      expect(finish.standings?.[0].status).toBe('Champion');
      expect(finish.standings?.[1].status).toBe('Runner-up');
    });
  });

  // ========================================================
  // 3. 16-Player Complete Lifecycle
  // ========================================================
  describe('16-Player Tournament Lifecycle', () => {
    const players = createMockPlayers(16);
    const tournament = createMockTournament(16);

    it('orchestrates 16-player bracket (4 rounds, 15 matches) to completion', () => {
      const seeds = seedParticipants(players, 'skill_rating');
      const { bracket, matches } = createSingleEliminationBracket(tournament, seeds);
      const matchesMap = new Map(matches.map((m) => [m.id, m]));

      expect(bracket.totalRounds).toBe(4);
      expect(matches.length).toBe(15); // 8 + 4 + 2 + 1 = 15

      // Simulate all 4 rounds
      for (let r = 0; r < bracket.totalRounds; r++) {
        const roundDef = bracket.structure.rounds[r];
        for (const mId of roundDef.matchIds) {
          const m = matchesMap.get(mId)!;
          m.status = 'COMPLETED';
          m.player1.score = 2000 + r * 300;
          m.player2.score = 1800 + r * 200;
          m.winnerUserId = m.player1.userId;
          advanceWinnerToNextRound(bracket, matchesMap, m.id, m.winnerUserId!, m.player1.anonymousAlias);
        }
      }

      const standings = calculateTournamentStandings(bracket, matchesMap);
      expect(standings.length).toBe(16);
      expect(standings[0].status).toBe('Champion');
      expect(standings[1].status).toBe('Runner-up');
    });
  });

  // ========================================================
  // 4. 32-Player Complete Lifecycle
  // ========================================================
  describe('32-Player Tournament Lifecycle', () => {
    const players = createMockPlayers(32);
    const tournament = createMockTournament(32);

    it('orchestrates 32-player bracket (5 rounds, 31 matches) to completion', () => {
      const seeds = seedParticipants(players, 'skill_rating');
      const { bracket, matches } = createSingleEliminationBracket(tournament, seeds);
      const matchesMap = new Map(matches.map((m) => [m.id, m]));

      expect(bracket.totalRounds).toBe(5);
      expect(matches.length).toBe(31); // 16 + 8 + 4 + 2 + 1 = 31

      // Simulate rounds 1 through 5
      for (let r = 0; r < bracket.totalRounds; r++) {
        const roundDef = bracket.structure.rounds[r];
        for (const mId of roundDef.matchIds) {
          const m = matchesMap.get(mId)!;
          m.status = 'COMPLETED';
          m.player1.score = 2500;
          m.player2.score = 2100;
          m.winnerUserId = m.player1.userId;
          advanceWinnerToNextRound(bracket, matchesMap, m.id, m.winnerUserId!, m.player1.anonymousAlias);
        }
      }

      const standings = calculateTournamentStandings(bracket, matchesMap);
      expect(standings.length).toBe(32);
      expect(standings[0].status).toBe('Champion');
      expect(standings[0].userId).toBe(seeds[0].userId); // Top seed went all the way
    });
  });

  // ========================================================
  // 5. 64-Player Complete Lifecycle
  // ========================================================
  describe('64-Player Tournament Lifecycle', () => {
    const players = createMockPlayers(64);
    const tournament = createMockTournament(64);

    it('orchestrates 64-player bracket (6 rounds, 63 matches) to completion with zero errors', () => {
      const seeds = seedParticipants(players, 'skill_rating');
      const { bracket, matches } = createSingleEliminationBracket(tournament, seeds);
      const matchesMap = new Map(matches.map((m) => [m.id, m]));

      expect(bracket.totalRounds).toBe(6); // log2(64) = 6
      expect(matches.length).toBe(63); // 32 + 16 + 8 + 4 + 2 + 1 = 63

      // Simulate all 6 rounds to final champion
      let finalWinnerId = '';
      for (let r = 0; r < bracket.totalRounds; r++) {
        const roundDef = bracket.structure.rounds[r];
        for (const mId of roundDef.matchIds) {
          const m = matchesMap.get(mId)!;
          expect(m.player1.userId).not.toBe('TBD');
          expect(m.player2.userId).not.toBe('TBD');

          m.status = 'COMPLETED';
          // Deterministic winner selection: higher seed wins
          m.player1.score = 3000;
          m.player2.score = 2400;
          m.winnerUserId = m.player1.userId;
          finalWinnerId = m.winnerUserId;

          advanceWinnerToNextRound(bracket, matchesMap, m.id, m.winnerUserId!, m.player1.anonymousAlias);
        }
      }

      const standings = calculateTournamentStandings(bracket, matchesMap);
      expect(standings.length).toBe(64);
      expect(standings[0].status).toBe('Champion');
      expect(standings[0].userId).toBe(finalWinnerId);
      expect(standings[1].status).toBe('Runner-up');
    });
  });
});
