import { describe, it, expect } from 'vitest';
import {
  evaluatePlayerTelemetry,
  HUMAN_MIN_REACTION_TIME_MS,
} from '../src/lib/antiCheat.js';

describe('Anti-Cheat Telemetry Risk Assessment', () => {
  it('classifies normal human gameplay as NORMAL risk with low risk score', () => {
    // Normal human reactions: 210ms, 195ms, 240ms, 220ms, 185ms
    const assessment = evaluatePlayerTelemetry({
      reactionTimes: [210, 195, 240, 220, 185],
      reconnectCount: 0,
      tabLostFocusCount: 0,
      clockSkewDeltas: [4, -2, 6],
      actionsCount: 5,
      durationMs: 15000,
    });

    expect(assessment.classification).toBe('NORMAL');
    expect(assessment.riskScore).toBeLessThan(30);
    expect(assessment.flaggedForReview).toBe(false);
  });

  it('classifies sub-110ms hits as HIGH_RISK with critical severity signal', () => {
    // Impossible neural hits: 45ms, 60ms
    const assessment = evaluatePlayerTelemetry({
      reactionTimes: [45, 60, 210, 220, 190],
      reconnectCount: 0,
      tabLostFocusCount: 0,
      clockSkewDeltas: [0],
      actionsCount: 5,
      durationMs: 15000,
    });

    expect(assessment.classification).toBe('HIGH_RISK');
    expect(assessment.riskScore).toBeGreaterThanOrEqual(65);
    expect(assessment.flaggedForReview).toBe(true);
    expect(assessment.signals.some((s) => s.type === 'IMPOSSIBLE_REACTION_TIME')).toBe(true);
  });

  it('detects robotic macro script via sub-human standard deviation (<10ms variance)', () => {
    // Robotic intervals: exactly 142ms, 143ms, 142ms, 141ms, 142ms
    const assessment = evaluatePlayerTelemetry({
      reactionTimes: [142, 143, 142, 141, 142],
      reconnectCount: 0,
      tabLostFocusCount: 0,
      clockSkewDeltas: [0],
      actionsCount: 5,
      durationMs: 15000,
    });

    expect(assessment.signals.some((s) => s.type === 'IDENTICAL_INTERVALS_BOT')).toBe(true);
    expect(assessment.riskScore).toBeGreaterThanOrEqual(35);
  });

  it('treats single tab focus loss as non-punitive, but flags 3+ tab switches as REVIEW_REQUIRED signal', () => {
    // 1 tab blur -> not flagged
    const singleBlur = evaluatePlayerTelemetry({
      reactionTimes: [220, 230, 240, 210, 250],
      reconnectCount: 0,
      tabLostFocusCount: 1,
      clockSkewDeltas: [0],
      actionsCount: 5,
      durationMs: 15000,
    });
    expect(singleBlur.signals.some((s) => s.type === 'TAB_FOCUS_LOSS_EXCESSIVE')).toBe(false);

    // 4 tab blurs -> telemetry signal recorded
    const multipleBlurs = evaluatePlayerTelemetry({
      reactionTimes: [220, 230, 240, 210, 250],
      reconnectCount: 0,
      tabLostFocusCount: 4,
      clockSkewDeltas: [0],
      actionsCount: 5,
      durationMs: 15000,
    });
    expect(multipleBlurs.signals.some((s) => s.type === 'TAB_FOCUS_LOSS_EXCESSIVE')).toBe(true);
  });
});
