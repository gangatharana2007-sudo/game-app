import { describe, it, expect } from 'vitest';
import {
  createRoundRobinBracket,
  createSingleEliminationBracket,
  pairSingleEliminationSeeds,
  seedParticipants,
} from '../server/bracketEngine.js';
import { Tournament } from '../src/types/database.js';

describe('Tournament Bracket Engine', () => {
  const dummyTournament: Tournament = {
    id: 'test_tourn_1',
    title: 'Test Apex Tournament',
    gameId: 'game_reaction_grid_duel',
    organizerId: 'org_1',
    format: 'single_elimination',
    status: 'registration_open',
    entryType: 'free',
    teamSize: 1,
    maxParticipants: 8,
    currentParticipantsCount: 4,
    registrationDeadline: new Date().toISOString(),
    startDate: new Date().toISOString(),
    gracePeriodSeconds: 120,
    rules: 'Official test rules',
    prizeDescription: '$1,000',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const rawParticipants = [
    { userId: 'p1', anonymousAlias: 'Player-1001', skillRating: 1400 },
    { userId: 'p2', anonymousAlias: 'Player-1002', skillRating: 1800 },
    { userId: 'p3', anonymousAlias: 'Player-1003', skillRating: 1200 },
    { userId: 'p4', anonymousAlias: 'Player-1004', skillRating: 1600 },
  ];

  it('correctly seeds participants descending by skill rating', () => {
    const seeded = seedParticipants(rawParticipants, 'skill_rating');
    expect(seeded[0].userId).toBe('p2'); // 1800 Elo -> Seed 1
    expect(seeded[0].seed).toBe(1);
    expect(seeded[1].userId).toBe('p4'); // 1600 Elo -> Seed 2
    expect(seeded[2].userId).toBe('p1'); // 1400 Elo -> Seed 3
    expect(seeded[3].userId).toBe('p3'); // 1200 Elo -> Seed 4
  });

  it('pairs seed 1 vs seed N in single elimination brackets', () => {
    const seeded = seedParticipants(rawParticipants, 'skill_rating');
    const pairings = pairSingleEliminationSeeds(seeded);

    expect(pairings.length).toBe(2);
    // Pair 1: Seed 1 (p2) vs Seed 4 (p3)
    expect(pairings[0][0].userId).toBe('p2');
    expect(pairings[0][1]?.userId).toBe('p3');
    // Pair 2: Seed 2 (p4) vs Seed 3 (p1)
    expect(pairings[1][0].userId).toBe('p4');
    expect(pairings[1][1]?.userId).toBe('p1');
  });

  it('generates correct total rounds and matches for single elimination', () => {
    const seeded = seedParticipants(rawParticipants, 'skill_rating');
    const { bracket, matches } = createSingleEliminationBracket(dummyTournament, seeded);

    expect(bracket.format).toBe('single_elimination');
    expect(bracket.totalRounds).toBe(2); // log2(4) = 2 rounds
    expect(matches.length).toBe(3); // Total matches for 4 players (2 in R1, 1 in Finals)
    expect(bracket.structure.rounds[0].matchIds.length).toBe(2);
    expect(matches[0].player1.userId).toBe('p2');
    expect(matches[0].player2.userId).toBe('p3');
  });

  it('generates correct round robin pairings (Berger algorithm)', () => {
    const seeded = seedParticipants(rawParticipants, 'skill_rating');
    const { bracket, matches } = createRoundRobinBracket(
      { ...dummyTournament, format: 'round_robin' },
      seeded
    );

    expect(bracket.format).toBe('round_robin');
    expect(bracket.totalRounds).toBe(3); // 4 participants = 3 rounds in round robin
    // Each round in 4-player round robin has 2 matches: total 3 * 2 = 6 matches
    expect(matches.length).toBe(6);
  });
});
