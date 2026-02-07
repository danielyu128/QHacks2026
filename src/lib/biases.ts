import { SummaryMetrics, BiasResult, BiasType, Severity } from "./types";

/**
 * Deterministic bias detection with explainable evidence.
 * No LLM involved -- pure heuristic logic.
 */
export function detectBiases(metrics: SummaryMetrics): BiasResult[] {
  const results: BiasResult[] = [];

  results.push(detectOvertrading(metrics));
  results.push(detectLossAversion(metrics));
  results.push(detectRevengeTrading(metrics));

  return results;
}

// ── Overtrading ──────────────────────────────────────────────────────────────

function detectOvertrading(m: SummaryMetrics): BiasResult {
  const evidence: string[] = [];
  let severity: Severity = "LOW";

  evidence.push(
    `You average ${m.tradesPerDayAvg} trades/day (healthy target: 10-15).`
  );
  evidence.push(
    `Your average time between trades is ${m.avgMinutesBetweenTrades} minutes.`
  );
  evidence.push(
    `Peak trading day: ${m.tradesPerDayMax} trades in a single session.`
  );

  if (m.tradesPerDayAvg > 20 || m.avgMinutesBetweenTrades < 15) {
    severity = "HIGH";
  } else if (m.tradesPerDayAvg > 12 || m.avgMinutesBetweenTrades < 30) {
    severity = "MEDIUM";
  }

  return { bias: "OVERTRADING", severity, evidence };
}

// ── Loss Aversion (Disposition Effect) ───────────────────────────────────────

function detectLossAversion(m: SummaryMetrics): BiasResult {
  const evidence: string[] = [];
  let severity: Severity = "LOW";

  const absAvgLoss = Math.abs(m.avgLoss);

  evidence.push(
    `Your average loss ($${absAvgLoss.toFixed(2)}) vs average win ($${m.avgWin.toFixed(2)}).`
  );

  if (m.avgHoldMinutesLosses != null && m.avgHoldMinutesWins != null) {
    const holdRatio = m.avgHoldMinutesLosses / Math.max(m.avgHoldMinutesWins, 0.1);
    evidence.push(
      `You hold losses ${holdRatio.toFixed(1)}x longer than winners (${m.avgHoldMinutesLosses.toFixed(1)} min vs ${m.avgHoldMinutesWins.toFixed(1)} min).`
    );

    if (holdRatio > 1.5 && absAvgLoss > m.avgWin) {
      severity = "HIGH";
    } else if (holdRatio > 1.2 || absAvgLoss > m.avgWin * 1.2) {
      severity = "MEDIUM";
    }
  } else {
    // No hold time data -- use magnitude only
    if (absAvgLoss > m.avgWin * 1.5) {
      severity = "HIGH";
      evidence.push("Your losses are significantly larger than your wins (no hold-time data available).");
    } else if (absAvgLoss > m.avgWin * 1.2) {
      severity = "MEDIUM";
      evidence.push("Your losses are moderately larger than your wins.");
    }
  }

  evidence.push(
    `Profit factor: ${m.profitFactor.toFixed(2)} (below 1.0 means net losing).`
  );

  return { bias: "LOSS_AVERSION", severity, evidence };
}

// ── Revenge Trading ──────────────────────────────────────────────────────────

function detectRevengeTrading(m: SummaryMetrics): BiasResult {
  const evidence: string[] = [];
  let severity: Severity = "LOW";

  evidence.push(
    `After losses, you place ~${m.postLossTradesWithin30MinAvg.toFixed(1)} trades within 30 minutes.`
  );

  const winRateDrop = m.winRate - m.postLossWinRate;
  evidence.push(
    `Your win rate after a loss: ${(m.postLossWinRate * 100).toFixed(0)}% (overall: ${(m.winRate * 100).toFixed(0)}%).`
  );

  if (m.postLossTradesWithin30MinAvg >= 3 && winRateDrop > 0.10) {
    severity = "HIGH";
  } else if (m.postLossTradesWithin30MinAvg >= 2 || winRateDrop > 0.05) {
    severity = "MEDIUM";
  }

  if (winRateDrop > 0) {
    evidence.push(
      `Your win rate drops by ${(winRateDrop * 100).toFixed(0)} percentage points after a loss.`
    );
  }

  return { bias: "REVENGE_TRADING", severity, evidence };
}

/**
 * Compute an overall risk score (0-100) from bias results.
 */
export function computeOverallRiskScore(biases: BiasResult[]): number {
  const weights: Record<Severity, number> = { LOW: 10, MEDIUM: 22, HIGH: 34 };
  let score = 0;
  for (const b of biases) {
    score += weights[b.severity];
  }
  return Math.min(100, score);
}
