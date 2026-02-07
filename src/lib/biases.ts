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
  let score = 0;

  evidence.push(
    `You average ${m.tradesPerDayAvg} trades/day (healthy target: 10-15).`
  );
  evidence.push(
    `Your average time between trades is ${m.avgMinutesBetweenTrades} minutes.`
  );
  evidence.push(
    `Peak trading day: ${m.tradesPerDayMax} trades in a single session.`
  );

  if (m.tradesPerDayAvg > 20 || m.avgMinutesBetweenTrades < 15) score += 2;
  else if (m.tradesPerDayAvg > 12 || m.avgMinutesBetweenTrades < 30) score += 1;

  if (m.balanceTurnover != null) {
    evidence.push(
      `Balance turnover: ${m.balanceTurnover.toFixed(1)}x of account value traded in this window.`
    );
    if (m.balanceTurnover > 5) score += 2;
    else if (m.balanceTurnover > 3) score += 1;
  }

  if (m.assetSwitchRate > 0) {
    evidence.push(
      `Asset switching rate: ${(m.assetSwitchRate * 100).toFixed(0)}% of consecutive trades change symbols.`
    );
    if (m.assetSwitchRate > 0.6) score += 1;
  }

  if (m.maxHourlyTradeShare > 0) {
    evidence.push(
      `Hourly clustering: ${(m.maxHourlyTradeShare * 100).toFixed(0)}% of trades occur in your busiest hour.`
    );
    if (m.maxHourlyTradeShare > 0.25) score += 1;
  }

  if (m.postWinTradesWithin30MinAvg != null && m.postWinTradesWithin30MinAvg > 0) {
    const thresholdText = m.largeWinThreshold != null
      ? ` (large win ≥ $${m.largeWinThreshold.toFixed(0)})`
      : "";
    evidence.push(
      `After large wins${thresholdText}, you place ~${m.postWinTradesWithin30MinAvg.toFixed(1)} trades within 30 minutes.`
    );
    if (m.postWinTradesWithin30MinAvg >= 3) score += 1;
  }

  if (score >= 4) severity = "HIGH";
  else if (score >= 2) severity = "MEDIUM";

  return { bias: "OVERTRADING", severity, evidence };
}

// ── Loss Aversion (Disposition Effect) ───────────────────────────────────────

function detectLossAversion(m: SummaryMetrics): BiasResult {
  const evidence: string[] = [];
  let severity: Severity = "LOW";
  let score = 0;

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
      score += 2;
    } else if (holdRatio > 1.2 || absAvgLoss > m.avgWin * 1.2) {
      score += 1;
    }
  } else {
    // No hold time data -- use magnitude only
    if (absAvgLoss > m.avgWin * 1.5) {
      score += 2;
      evidence.push("Your losses are significantly larger than your wins (no hold-time data available).");
    } else if (absAvgLoss > m.avgWin * 1.2) {
      score += 1;
      evidence.push("Your losses are moderately larger than your wins.");
    }
  }

  if (m.riskRewardRatio != null && m.avgWinReturnPct != null && m.avgLossReturnPct != null) {
    evidence.push(
      `Avg win return ${(m.avgWinReturnPct * 100).toFixed(1)}% vs avg loss return ${(m.avgLossReturnPct * 100).toFixed(1)}% (risk/reward ${m.riskRewardRatio.toFixed(2)}x).`
    );
    if (m.riskRewardRatio < 0.7) score += 2;
    else if (m.riskRewardRatio < 0.9) score += 1;
  }

  if (m.smallWinRate != null && m.smallWinThreshold != null) {
    evidence.push(
      `${(m.smallWinRate * 100).toFixed(0)}% of winning trades are small (≤ ${(m.smallWinThreshold * 100).toFixed(1)}% return).`
    );
    if (m.smallWinRate > 0.6) score += 1;
  }

  evidence.push(
    `Profit factor: ${m.profitFactor.toFixed(2)} (below 1.0 means net losing).`
  );

  if (score >= 3) severity = "HIGH";
  else if (score >= 2) severity = "MEDIUM";

  return { bias: "LOSS_AVERSION", severity, evidence };
}

// ── Revenge Trading ──────────────────────────────────────────────────────────

function detectRevengeTrading(m: SummaryMetrics): BiasResult {
  const evidence: string[] = [];
  let severity: Severity = "LOW";
  let score = 0;

  evidence.push(
    `After losses, you place ~${m.postLossTradesWithin30MinAvg.toFixed(1)} trades within 30 minutes.`
  );

  const winRateDrop = m.winRate - m.postLossWinRate;
  evidence.push(
    `Your win rate after a loss: ${(m.postLossWinRate * 100).toFixed(0)}% (overall: ${(m.winRate * 100).toFixed(0)}%).`
  );

  if (m.postLossTradesWithin30MinAvg >= 3 && winRateDrop > 0.10) score += 2;
  else if (m.postLossTradesWithin30MinAvg >= 2 || winRateDrop > 0.05) score += 1;

  if (winRateDrop > 0) {
    evidence.push(
      `Your win rate drops by ${(winRateDrop * 100).toFixed(0)} percentage points after a loss.`
    );
  }

  if (m.sizeAfterLossRatio != null && m.avgTradeSizeAfterLoss != null && m.avgTradeSize != null) {
    evidence.push(
      `Avg trade size after a loss: ${m.avgTradeSizeAfterLoss.toFixed(0)} vs ${m.avgTradeSize.toFixed(0)} (x${m.sizeAfterLossRatio.toFixed(2)}).`
    );
    if (m.sizeAfterLossRatio >= 1.3) score += 1;
  }

  if (m.avgMinutesBetweenTradesAfterStreak != null && m.avgMinutesBetweenTradesAfterStreak > 0) {
    evidence.push(
      `After 2+ loss streaks, you trade again after ~${m.avgMinutesBetweenTradesAfterStreak.toFixed(1)} minutes.`
    );
    if (m.avgMinutesBetweenTradesAfterStreak < m.avgMinutesBetweenTrades * 0.7) score += 1;
  }

  if (m.avgTradeSizeAfterStreak != null && m.avgTradeSize != null) {
    evidence.push(
      `Trade size after loss streaks: ${m.avgTradeSizeAfterStreak.toFixed(0)} vs ${m.avgTradeSize.toFixed(0)}.`
    );
    if (m.avgTradeSizeAfterStreak > m.avgTradeSize * 1.2) score += 1;
  }

  if (score >= 3) severity = "HIGH";
  else if (score >= 2) severity = "MEDIUM";

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
