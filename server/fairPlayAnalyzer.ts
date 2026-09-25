import { GoogleGenAI } from '@google/genai';
import { evaluatePlayerTelemetry } from '../src/lib/antiCheat.js';

export interface TelemetryPayload {
  matchId: string;
  anonymousAlias: string;
  reactionTimes: number[];
  reconnectCount: number;
  tabLostFocusCount: number;
  clockSkewDeltas: number[];
  actionsCount: number;
  durationMs: number;
  totalScore: number;
}

export interface FairPlayAnalysisResult {
  classification: 'NORMAL' | 'REVIEW_REQUIRED' | 'HIGH_RISK';
  riskScore: number; // 0 to 100
  confidenceScore: number; // 0.0 to 1.0
  evidenceSummary: string[];
  aiExplanation: string;
  source: 'gemini-ai' | 'deterministic-fallback';
}

export class FairPlayAnalyzer {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI();
    }
  }

  async analyzeMatchTelemetry(telemetry: TelemetryPayload): Promise<FairPlayAnalysisResult> {
    // 1. Calculate deterministic base signals
    const heuristic = evaluatePlayerTelemetry({
      reactionTimes: telemetry.reactionTimes,
      reconnectCount: telemetry.reconnectCount,
      tabLostFocusCount: telemetry.tabLostFocusCount,
      clockSkewDeltas: telemetry.clockSkewDeltas,
      actionsCount: telemetry.actionsCount,
      durationMs: telemetry.durationMs,
    });

    // 2. If Gemini API is available and match is non-trivial, enrich with server-side AI evaluation
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the FairPlayAnalyzer anti-cheat evaluation engine for NEXORA ARENA esports tournament platform.
Analyze the following sanitized competitive telemetry for an anonymous competitor:
- Competitor Anonymous Alias: "${telemetry.anonymousAlias}"
- Total Actions: ${telemetry.actionsCount}
- Validated Final Score: ${telemetry.totalScore}
- Reaction Times (ms across rounds): [${telemetry.reactionTimes.join(', ')}]
- Browser Tab Focus Lost Count: ${telemetry.tabLostFocusCount}
- Reconnect Events: ${telemetry.reconnectCount}
- Max Clock Skew Delta: ${Math.max(0, ...telemetry.clockSkewDeltas.map(Math.abs))}ms
- Deterministic Risk Indicators: ${JSON.stringify(heuristic.reasons)}

Safety & Ethics Rules:
1. Do NOT identify persons or request biometric data.
2. Human reaction time limit is 110ms. Anything below 110ms is physiologically impossible for visual motor reflex.
3. Tab focus loss is a mild risk signal, NOT proof of cheating alone.
4. Classify strictly as one of: "NORMAL", "REVIEW_REQUIRED", "HIGH_RISK".
5. Return explainable structured evidence for human moderators.

Respond strictly in JSON format matching this schema:
{
  "classification": "NORMAL" | "REVIEW_REQUIRED" | "HIGH_RISK",
  "riskScore": number (0 to 100),
  "confidenceScore": number (0.0 to 1.0),
  "evidenceSummary": string[],
  "aiExplanation": string
}`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return {
            classification: parsed.classification || heuristic.classification,
            riskScore: typeof parsed.riskScore === 'number' ? Math.min(100, Math.max(0, parsed.riskScore)) : heuristic.riskScore,
            confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : heuristic.confidence,
            evidenceSummary: Array.isArray(parsed.evidenceSummary) && parsed.evidenceSummary.length > 0 ? parsed.evidenceSummary : heuristic.reasons,
            aiExplanation: parsed.aiExplanation || 'Evaluated using Gemini 3.8 Flash fair-play reasoning model.',
            source: 'gemini-ai',
          };
        }
      } catch (err) {
        console.warn('Gemini FairPlayAnalyzer fallback triggered:', (err as Error).message);
      }
    }

    // Deterministic fallback explanation
    let fallbackExplanation = 'Calculated through server-side deterministic telemetry validation.';
    if (heuristic.classification === 'HIGH_RISK') {
      fallbackExplanation = 'Critical anomalies detected: reaction speeds exceed human physiological limit or robotic macro signatures detected.';
    } else if (heuristic.classification === 'REVIEW_REQUIRED') {
      fallbackExplanation = 'Mild telemetry anomalies detected (excessive reconnects, tab switches, or borderline reaction times). Case flagged for moderator review.';
    }

    return {
      classification: heuristic.classification,
      riskScore: heuristic.riskScore,
      confidenceScore: heuristic.confidence,
      evidenceSummary: heuristic.reasons,
      aiExplanation: fallbackExplanation,
      source: 'deterministic-fallback',
    };
  }
}
