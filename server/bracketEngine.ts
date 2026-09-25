import { Bracket, Match, Tournament } from '../src/types/database.js';

export interface ParticipantSeed {
  userId: string;
  anonymousAlias: string;
  skillRating: number;
  seed: number;
}

export interface TournamentStanding {
  rank: number;
  userId: string;
  anonymousAlias: string;
  roundEliminated: number | 'Champion';
  status: 'Champion' | 'Runner-up' | 'Semifinalist' | 'Quarterfinalist' | 'Participant';
  score: number;
}

/**
 * Deterministically seeds participants based on skill rating descending and randomized tie-breakers
 */
export function seedParticipants(
  registrations: { userId: string; anonymousAlias: string; skillRating: number }[],
  mode: 'skill_rating' | 'random' = 'skill_rating'
): ParticipantSeed[] {
  const list = [...registrations];

  if (mode === 'skill_rating') {
    list.sort((a, b) => {
      if (b.skillRating !== a.skillRating) {
        return b.skillRating - a.skillRating;
      }
      return a.userId.localeCompare(b.userId);
    });
  } else {
    list.sort((a, b) => a.userId.localeCompare(b.userId));
  }

  return list.map((item, index) => ({
    userId: item.userId,
    anonymousAlias: item.anonymousAlias,
    skillRating: item.skillRating,
    seed: index + 1,
  }));
}

/**
 * Standard tournament bracket pairing: 1 vs N, 2 vs N-1, etc.
 */
export function pairSingleEliminationSeeds(seeds: ParticipantSeed[]): [ParticipantSeed, ParticipantSeed | null][] {
  const count = seeds.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, count))));
  const paddedList: (ParticipantSeed | null)[] = [...seeds];
  while (paddedList.length < bracketSize) {
    paddedList.push(null); // bye
  }

  const pairings: [ParticipantSeed, ParticipantSeed | null][] = [];
  const half = bracketSize / 2;

  for (let i = 0; i < half; i++) {
    const p1 = paddedList[i];
    const p2 = paddedList[bracketSize - 1 - i];
    if (p1) {
      pairings.push([p1, p2]);
    }
  }

  return pairings;
}

function getRoundName(roundIndex: number, totalRounds: number): string {
  if (roundIndex === totalRounds) return 'Finals';
  if (roundIndex === totalRounds - 1) return 'Semifinals';
  if (roundIndex === totalRounds - 2) return 'Quarterfinals';
  const remainingTeams = Math.pow(2, totalRounds - roundIndex + 1);
  return `Round of ${remainingTeams}`;
}

/**
 * Creates full Single Elimination bracket tree for 2, 4, 8, 16, 32, 64, or 128 players
 */
export function createSingleEliminationBracket(
  tournament: Tournament,
  seeds: ParticipantSeed[]
): { bracket: Bracket; matches: Match[] } {
  const bracketId = `bracket_${tournament.id}`;
  const totalParticipants = Math.max(2, seeds.length);
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalParticipants)));
  const totalRounds = Math.ceil(Math.log2(bracketSize));

  const matches: Match[] = [];
  const roundsDef: Bracket['structure']['rounds'] = [];
  const now = new Date();

  // 1. Build Round 1 matches
  const pairings = pairSingleEliminationSeeds(seeds);
  const round1MatchIds: string[] = [];

  pairings.forEach((pair, idx) => {
    const [p1, p2] = pair;
    const matchId = `match_${tournament.id}_r1_m${idx + 1}`;
    round1MatchIds.push(matchId);

    const scheduledTime = new Date(now.getTime() + 1000 * 60 * 5).toISOString();
    const isBye = !p2;

    const match: Match = {
      id: matchId,
      tournamentId: tournament.id,
      gameId: tournament.gameId,
      bracketId,
      roundIndex: 1,
      matchRoomCode: `R1-M${idx + 1}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      status: isBye ? 'COMPLETED' : 'WAITING',
      player1: {
        userId: p1.userId,
        anonymousAlias: p1.anonymousAlias,
        ready: isBye,
        score: isBye ? 1000 : 0,
        reactionTimes: [],
        connected: false,
        lastHeartbeat: Date.now(),
        reconnectCount: 0,
        tabLostFocusCount: 0,
      },
      player2: {
        userId: p2 ? p2.userId : 'BYE_PLAYER',
        anonymousAlias: p2 ? p2.anonymousAlias : 'BYE',
        ready: isBye,
        score: 0,
        reactionTimes: [],
        connected: false,
        lastHeartbeat: Date.now(),
        reconnectCount: 0,
        tabLostFocusCount: 0,
      },
      currentRound: 1,
      totalRounds: 5,
      roundSeed: `seed_${matchId}_${Date.now()}`,
      scheduledStartTime: scheduledTime,
      actualStartTime: isBye ? scheduledTime : undefined,
      completedAt: isBye ? scheduledTime : undefined,
      winnerUserId: isBye ? p1.userId : undefined,
      antiCheatRiskScore: 0,
      antiCheatFlagged: false,
      antiCheatReasons: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    matches.push(match);
  });

  roundsDef.push({
    roundNumber: 1,
    name: getRoundName(1, totalRounds),
    matchIds: round1MatchIds,
  });

  // 2. Pre-allocate all subsequent rounds (Round 2 to totalRounds)
  let prevRoundMatchCount = pairings.length;
  for (let r = 2; r <= totalRounds; r++) {
    const currentRoundMatchCount = prevRoundMatchCount / 2;
    const currentRoundMatchIds: string[] = [];
    const scheduledTime = new Date(now.getTime() + 1000 * 60 * (15 * (r - 1) + 5)).toISOString();

    for (let m = 1; m <= currentRoundMatchCount; m++) {
      const matchId = `match_${tournament.id}_r${r}_m${m}`;
      currentRoundMatchIds.push(matchId);

      const match: Match = {
        id: matchId,
        tournamentId: tournament.id,
        gameId: tournament.gameId,
        bracketId,
        roundIndex: r,
        matchRoomCode: `R${r}-M${m}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: 'WAITING',
        player1: {
          userId: 'TBD',
          anonymousAlias: 'Winner of Prev Match',
          ready: false,
          score: 0,
          reactionTimes: [],
          connected: false,
          lastHeartbeat: Date.now(),
          reconnectCount: 0,
          tabLostFocusCount: 0,
        },
        player2: {
          userId: 'TBD',
          anonymousAlias: 'Winner of Prev Match',
          ready: false,
          score: 0,
          reactionTimes: [],
          connected: false,
          lastHeartbeat: Date.now(),
          reconnectCount: 0,
          tabLostFocusCount: 0,
        },
        currentRound: 1,
        totalRounds: 5,
        roundSeed: `seed_${matchId}_${Date.now()}`,
        scheduledStartTime: scheduledTime,
        antiCheatRiskScore: 0,
        antiCheatFlagged: false,
        antiCheatReasons: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      matches.push(match);
    }

    roundsDef.push({
      roundNumber: r,
      name: getRoundName(r, totalRounds),
      matchIds: currentRoundMatchIds,
    });

    prevRoundMatchCount = currentRoundMatchCount;
  }

  const bracket: Bracket = {
    id: bracketId,
    tournamentId: tournament.id,
    format: 'single_elimination',
    totalRounds,
    currentRound: 1,
    structure: {
      rounds: roundsDef,
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  return { bracket, matches };
}

/**
 * Advances winner of a match to the next round match node
 */
export function advanceWinnerToNextRound(
  bracket: Bracket,
  matches: Map<string, Match> | Match[],
  completedMatchId: string,
  winnerUserId: string,
  winnerAlias: string
): { nextMatch?: Match; tournamentCompleted: boolean; standings?: TournamentStanding[] } {
  const getMatch = (id: string): Match | undefined => {
    if (matches instanceof Map) return matches.get(id);
    return matches.find((m) => m.id === id);
  };

  const completedMatch = getMatch(completedMatchId);
  if (!completedMatch) return { tournamentCompleted: false };

  const currentRound = completedMatch.roundIndex;
  const isFinals = currentRound === bracket.totalRounds;

  if (isFinals) {
    const standings = calculateTournamentStandings(bracket, matches);
    return { tournamentCompleted: true, standings };
  }

  // Find position in current round's match list
  const currentRoundDef = bracket.structure.rounds.find((r) => r.roundNumber === currentRound);
  if (!currentRoundDef) return { tournamentCompleted: false };

  const matchIdxInRound = currentRoundDef.matchIds.indexOf(completedMatchId);
  if (matchIdxInRound === -1) return { tournamentCompleted: false };

  // Next round match index
  const nextRoundNumber = currentRound + 1;
  const nextRoundDef = bracket.structure.rounds.find((r) => r.roundNumber === nextRoundNumber);
  if (!nextRoundDef) return { tournamentCompleted: false };

  const nextMatchIdx = Math.floor(matchIdxInRound / 2);
  const nextMatchId = nextRoundDef.matchIds[nextMatchIdx];
  const nextMatch = getMatch(nextMatchId);

  if (!nextMatch) return { tournamentCompleted: false };

  const isPlayer1Slot = matchIdxInRound % 2 === 0;

  if (isPlayer1Slot) {
    nextMatch.player1.userId = winnerUserId;
    nextMatch.player1.anonymousAlias = winnerAlias;
    nextMatch.player1.ready = false;
  } else {
    nextMatch.player2.userId = winnerUserId;
    nextMatch.player2.anonymousAlias = winnerAlias;
    nextMatch.player2.ready = false;
  }

  // If both players have qualified and neither is TBD, match can transition to READY/ACTIVE
  if (nextMatch.player1.userId !== 'TBD' && nextMatch.player2.userId !== 'TBD') {
    nextMatch.status = 'WAITING';
  }

  nextMatch.updatedAt = new Date().toISOString();
  return { nextMatch, tournamentCompleted: false };
}

/**
 * Calculates final tournament rankings and leaderboard points
 */
export function calculateTournamentStandings(
  bracket: Bracket,
  matches: Map<string, Match> | Match[]
): TournamentStanding[] {
  const getMatch = (id: string): Match | undefined => {
    if (matches instanceof Map) return matches.get(id);
    return matches.find((m) => m.id === id);
  };

  const standings: TournamentStanding[] = [];
  const processedUserIds = new Set<string>();

  const finalRound = bracket.structure.rounds[bracket.totalRounds - 1];
  const finalMatch = finalRound && finalRound.matchIds.length > 0 ? getMatch(finalRound.matchIds[0]) : undefined;

  // 1. Champion and Runner-up
  if (finalMatch && finalMatch.status === 'COMPLETED' && finalMatch.winnerUserId) {
    const isP1Winner = finalMatch.winnerUserId === finalMatch.player1.userId;
    const champ = isP1Winner ? finalMatch.player1 : finalMatch.player2;
    const runnerUp = isP1Winner ? finalMatch.player2 : finalMatch.player1;

    standings.push({
      rank: 1,
      userId: champ.userId,
      anonymousAlias: champ.anonymousAlias,
      roundEliminated: 'Champion',
      status: 'Champion',
      score: champ.score,
    });
    processedUserIds.add(champ.userId);

    if (runnerUp.userId !== 'TBD' && runnerUp.userId !== 'BYE_PLAYER') {
      standings.push({
        rank: 2,
        userId: runnerUp.userId,
        anonymousAlias: runnerUp.anonymousAlias,
        roundEliminated: bracket.totalRounds,
        status: 'Runner-up',
        score: runnerUp.score,
      });
      processedUserIds.add(runnerUp.userId);
    }
  }

  // 2. Semifinalists, Quarterfinalists, etc. (inspect rounds in reverse order)
  for (let r = bracket.totalRounds - 1; r >= 1; r--) {
    const roundDef = bracket.structure.rounds[r - 1];
    if (!roundDef) continue;

    let rankLabel: TournamentStanding['status'] = 'Participant';
    if (r === bracket.totalRounds - 1) rankLabel = 'Semifinalist';
    else if (r === bracket.totalRounds - 2) rankLabel = 'Quarterfinalist';

    for (const matchId of roundDef.matchIds) {
      const match = getMatch(matchId);
      if (!match || match.status !== 'COMPLETED') continue;

      const loser = match.winnerUserId === match.player1.userId ? match.player2 : match.player1;
      if (loser && loser.userId !== 'TBD' && loser.userId !== 'BYE_PLAYER' && !processedUserIds.has(loser.userId)) {
        standings.push({
          rank: standings.length + 1,
          userId: loser.userId,
          anonymousAlias: loser.anonymousAlias,
          roundEliminated: r,
          status: rankLabel,
          score: loser.score,
        });
        processedUserIds.add(loser.userId);
      }
    }
  }

  return standings;
}

/**
 * Creates Round Robin schedule (Berger algorithm)
 */
export function createRoundRobinBracket(
  tournament: Tournament,
  seeds: ParticipantSeed[]
): { bracket: Bracket; matches: Match[] } {
  const bracketId = `bracket_${tournament.id}`;
  const list: (ParticipantSeed | null)[] = [...seeds];
  if (list.length % 2 !== 0) {
    list.push(null);
  }

  const numParticipants = list.length;
  const numRounds = numParticipants - 1;
  const matchesPerRound = numParticipants / 2;
  const matches: Match[] = [];
  const roundsDef: Bracket['structure']['rounds'] = [];
  const now = new Date();

  for (let r = 0; r < numRounds; r++) {
    const roundMatchIds: string[] = [];

    for (let m = 0; m < matchesPerRound; m++) {
      const p1Index = (r + m) % (numParticipants - 1);
      let p2Index = (numParticipants - 1 - m + r) % (numParticipants - 1);

      if (m === 0) {
        p2Index = numParticipants - 1;
      }

      const p1 = list[p1Index];
      const p2 = list[p2Index];

      if (p1 && p2) {
        const matchId = `match_${tournament.id}_r${r + 1}_m${m + 1}`;
        roundMatchIds.push(matchId);

        const scheduledTime = new Date(now.getTime() + 1000 * 60 * 15 * (r + 1)).toISOString();

        matches.push({
          id: matchId,
          tournamentId: tournament.id,
          gameId: tournament.gameId,
          bracketId,
          roundIndex: r + 1,
          matchRoomCode: `RR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: 'WAITING',
          player1: {
            userId: p1.userId,
            anonymousAlias: p1.anonymousAlias,
            ready: false,
            score: 0,
            reactionTimes: [],
            connected: false,
            lastHeartbeat: Date.now(),
            reconnectCount: 0,
            tabLostFocusCount: 0,
          },
          player2: {
            userId: p2.userId,
            anonymousAlias: p2.anonymousAlias,
            ready: false,
            score: 0,
            reactionTimes: [],
            connected: false,
            lastHeartbeat: Date.now(),
            reconnectCount: 0,
            tabLostFocusCount: 0,
          },
          currentRound: 1,
          totalRounds: 5,
          roundSeed: `seed_${matchId}_${Date.now()}`,
          scheduledStartTime: scheduledTime,
          antiCheatRiskScore: 0,
          antiCheatFlagged: false,
          antiCheatReasons: [],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }
    }

    roundsDef.push({
      roundNumber: r + 1,
      name: `Round Robin Set ${r + 1}`,
      matchIds: roundMatchIds,
    });
  }

  const bracket: Bracket = {
    id: bracketId,
    tournamentId: tournament.id,
    format: 'round_robin',
    totalRounds: numRounds,
    currentRound: 1,
    structure: {
      rounds: roundsDef,
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  return { bracket, matches };
}
