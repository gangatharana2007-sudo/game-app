export interface TelemetrySignal {
  type:
    | 'IMPOSSIBLE_REACTION_TIME'
    | 'CLICK_BURST_RATE_LIMIT'
    | 'OUT_OF_ORDER_ACTION'
    | 'DESYNC_TIMESTAMP'
    | 'TAB_FOCUS_LOSS_EXCESSIVE'
    | 'RECONNECT_ANOMALY'
    | 'IDENTICAL_INTERVALS_BOT'
    | 'CLIENT_STATE_TAMPER';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface AntiCheatAssessment {
  riskScore: number; // 0 to 100
  confidence: number; // 0.0 to 1.0
  flaggedForReview: boolean;
  classification: 'NORMAL' | 'REVIEW_REQUIRED' | 'HIGH_RISK';
  reasons: string[];
  signals: TelemetrySignal[];
}

export const HUMAN_MIN_REACTION_TIME_MS = 110;
export const SUSPICIOUS_FAST_REACTION_MS = 140;
export const MAX_ACCEPTABLE_BURST_CLICKS_PER_SEC = 9;

export function evaluatePlayerTelemetry(params: {
  reactionTimes: number[];
  reconnectCount: number;
  tabLostFocusCount: number;
  clockSkewDeltas: number[];
  actionsCount: number;
  durationMs: number;
}): AntiCheatAssessment {
  const signals: TelemetrySignal[] = [];
  const reasons: string[] = [];
  let rawScore = 0;

  const { reactionTimes, reconnectCount, tabLostFocusCount, clockSkewDeltas, actionsCount, durationMs } = params;

  // 1. Impossible reaction times (Sub-110ms)
  const impossibleHits = reactionTimes.filter((rt) => rt > 0 && rt < HUMAN_MIN_REACTION_TIME_MS);
  if (impossibleHits.length > 0) {
    const penalty = Math.min(65, impossibleHits.length * 35);
    rawScore += penalty;
    const msg = `Detected ${impossibleHits.length} action(s) with impossible sub-110ms human neural latency (lowest: ${Math.min(...impossibleHits)}ms).`;
    reasons.push(msg);
    signals.push({
      type: 'IMPOSSIBLE_REACTION_TIME',
      severity: 'critical',
      details: msg,
      timestamp: Date.now(),
      data: { impossibleHits },
    });
  }

  // 2. Suspiciously fast reaction times (110ms - 140ms consistently)
  const borderlineHits = reactionTimes.filter((rt) => rt >= HUMAN_MIN_REACTION_TIME_MS && rt < SUSPICIOUS_FAST_REACTION_MS);
  if (borderlineHits.length >= 3 && reactionTimes.length >= 4) {
    rawScore += 25;
    const msg = `Consistent borderline reaction clustering: ${borderlineHits.length} hits under 140ms.`;
    reasons.push(msg);
    signals.push({
      type: 'IDENTICAL_INTERVALS_BOT',
      severity: 'medium',
      details: msg,
      timestamp: Date.now(),
      data: { borderlineHits },
    });
  }

  // 3. Robotic timing variance (Standard deviation < 12ms over multiple hits indicates script/macro)
  if (reactionTimes.length >= 4) {
    const mean = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const variance = reactionTimes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / reactionTimes.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 10) {
      rawScore += 40;
      const msg = `Sub-human standard deviation in reaction intervals (${stdDev.toFixed(1)}ms), typical of scripted macros.`;
      reasons.push(msg);
      signals.push({
        type: 'IDENTICAL_INTERVALS_BOT',
        severity: 'high',
        details: msg,
        timestamp: Date.now(),
        data: { stdDev, mean },
      });
    }
  }

  // 4. Rate-limiting burst clicks
  if (durationMs > 1000) {
    const clicksPerSec = (actionsCount / durationMs) * 1000;
    if (clicksPerSec > MAX_ACCEPTABLE_BURST_CLICKS_PER_SEC) {
      rawScore += 25;
      const msg = `Input click rate exceeded burst threshold: ${clicksPerSec.toFixed(1)} actions/sec.`;
      reasons.push(msg);
      signals.push({
        type: 'CLICK_BURST_RATE_LIMIT',
        severity: 'medium',
        details: msg,
        timestamp: Date.now(),
        data: { clicksPerSec },
      });
    }
  }

  // 5. Clock skew desync (client modifying local performance.now or timer tampering)
  const maxClockSkew = Math.max(0, ...clockSkewDeltas.map(Math.abs));
  if (maxClockSkew > 2500) {
    rawScore += 30;
    const msg = `Excessive client-server clock desynchronization (${maxClockSkew}ms), possible time-dilation exploit.`;
    reasons.push(msg);
    signals.push({
      type: 'DESYNC_TIMESTAMP',
      severity: 'high',
      details: msg,
      timestamp: Date.now(),
      data: { maxClockSkew },
    });
  }

  // 6. Excessive reconnects
  if (reconnectCount > 3) {
    rawScore += Math.min(25, (reconnectCount - 3) * 10);
    const msg = `Repeated disconnections/reconnections (${reconnectCount} times) during match window.`;
    reasons.push(msg);
    signals.push({
      type: 'RECONNECT_ANOMALY',
      severity: 'low',
      details: msg,
      timestamp: Date.now(),
      data: { reconnectCount },
    });
  }

  // 7. Tab visibility change & focus loss (signal only, NOT proof on its own)
  if (tabLostFocusCount >= 3) {
    rawScore += Math.min(20, (tabLostFocusCount - 2) * 5);
    const msg = `Player switched browser tabs or minimized window ${tabLostFocusCount} times during active rounds.`;
    reasons.push(msg);
    signals.push({
      type: 'TAB_FOCUS_LOSS_EXCESSIVE',
      severity: 'low',
      details: msg,
      timestamp: Date.now(),
      data: { tabLostFocusCount },
    });
  }

  const finalScore = Math.min(100, Math.max(0, rawScore));
  let classification: 'NORMAL' | 'REVIEW_REQUIRED' | 'HIGH_RISK' = 'NORMAL';

  if (finalScore >= 65) {
    classification = 'HIGH_RISK';
  } else if (finalScore >= 35) {
    classification = 'REVIEW_REQUIRED';
  }

  const confidence = reactionTimes.length >= 3 ? Math.min(0.98, 0.65 + reactionTimes.length * 0.06) : 0.45;

  return {
    riskScore: finalScore,
    confidence: Number(confidence.toFixed(2)),
    flaggedForReview: classification !== 'NORMAL',
    classification,
    reasons: reasons.length > 0 ? reasons : ['Match telemetry within baseline human performance envelope.'],
    signals,
  };
}
