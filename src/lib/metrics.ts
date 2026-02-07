import { Trade, SummaryMetrics, BiasType, Severity } from "./types";
import { detectBiases } from "./biases";

/**
 * Compute all summary metrics from a Trade array.
 */
export function computeMetrics(trades: Trade[]): SummaryMetrics {
  if (trades.length === 0) {
    throw new Error("No trades to analyze");
  }

  // Sort by timestamp
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  // ── Basic stats ───────────────────────────────────────────────────────
  const totalTrades = sorted.length;
  const firstTs = sorted[0].timestamp;
  const lastTs = sorted[sorted.length - 1].timestamp;
  const tradingWindow = formatWindow(firstTs, lastTs);

  // ── Trades per day ────────────────────────────────────────────────────
  const dayBuckets = new Map<string, number>();
  for (const t of sorted) {
    const dayKey = new Date(t.timestamp).toISOString().slice(0, 10);
    dayBuckets.set(dayKey, (dayBuckets.get(dayKey) || 0) + 1);
  }
  const activeDays = dayBuckets.size;
  const dayCounts = Array.from(dayBuckets.values());
  const tradesPerDayAvg = round(totalTrades / activeDays);
  const tradesPerDayMax = Math.max(...dayCounts);

  // ── Time between trades ───────────────────────────────────────────────
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gapMs = sorted[i].timestamp - sorted[i - 1].timestamp;
    const gapMin = gapMs / 60000;
    // Only count gaps within same day (< 12 hours)
    if (gapMin < 720) {
      gaps.push(gapMin);
    }
  }
  const avgMinutesBetweenTrades = gaps.length > 0
    ? round(gaps.reduce((s, g) => s + g, 0) / gaps.length)
    : 0;

  // ── Win/loss stats ────────────────────────────────────────────────────
  const wins = sorted.filter((t) => t.pnl > 0);
  const losses = sorted.filter((t) => t.pnl < 0);
  const winRate = round(wins.length / totalTrades);
  const avgWin = wins.length > 0
    ? round(wins.reduce((s, t) => s + t.pnl, 0) / wins.length)
    : 0;
  const avgLoss = losses.length > 0
    ? round(losses.reduce((s, t) => s + t.pnl, 0) / losses.length)
    : 0;

  const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
  const totalLosses = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? round(totalWins / totalLosses) : totalWins > 0 ? 999 : 0;

  // ── Hold time stats ───────────────────────────────────────────────────
  const winsWithHold = wins.filter((t) => t.holdMinutes != null);
  const lossesWithHold = losses.filter((t) => t.holdMinutes != null);

  const avgHoldMinutesWins = winsWithHold.length > 0
    ? round(winsWithHold.reduce((s, t) => s + t.holdMinutes!, 0) / winsWithHold.length)
    : null;
  const avgHoldMinutesLosses = lossesWithHold.length > 0
    ? round(lossesWithHold.reduce((s, t) => s + t.holdMinutes!, 0) / lossesWithHold.length)
    : null;

  // ── Post-loss analysis (revenge trading) ──────────────────────────────
  const { postLossTradesWithin30MinAvg, postLossWinRate } = computePostLossStats(sorted);

  // ── Data completeness ────────────────────────────────────────────────
  const entryExitCount = sorted.filter((t) => t.entryPrice != null && t.exitPrice != null).length;
  const balanceCount = sorted.filter((t) => t.accountBalance != null).length;
  const sizeCount = sorted.filter((t) => tradeSize(t) != null).length;

  const entryExitCoverage = entryExitCount / totalTrades;
  const balanceCoverage = balanceCount / totalTrades;
  const sizeCoverage = sizeCount / totalTrades;

  const missingFields: string[] = [];
  if (entryExitCoverage < 0.6) missingFields.push("entry_price/exit_price");
  if (balanceCoverage < 0.6) missingFields.push("account_balance");
  if (sizeCoverage < 0.6) missingFields.push("qty/position_size");

  // ── Balance & size metrics ───────────────────────────────────────────
  const balances = sorted.map((t) => t.accountBalance).filter((v): v is number => v != null);
  const avgAccountBalance = balances.length > 0 ? round(avg(balances)) : null;

  const sizes = sorted.map((t) => tradeSize(t)).filter((v): v is number => v != null);
  const avgTradeSize = sizes.length > 0 ? round(avg(sizes)) : null;
  const totalNotional = sizes.reduce((s, v) => s + v, 0);
  const balanceTurnover =
    avgAccountBalance && totalNotional > 0 ? round(totalNotional / avgAccountBalance) : null;

  // ── Position switching metrics ───────────────────────────────────────
  let assetSwitches = 0;
  let sideFlips = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].asset !== sorted[i - 1].asset) assetSwitches++;
    if (sorted[i].side !== sorted[i - 1].side) sideFlips++;
  }
  const assetSwitchRate = sorted.length > 1 ? round(assetSwitches / (sorted.length - 1)) : 0;
  const sideFlipRate = sorted.length > 1 ? round(sideFlips / (sorted.length - 1)) : 0;

  // ── Hourly clustering ────────────────────────────────────────────────
  const hourlyTradeCounts = Array.from({ length: 24 }, () => 0);
  for (const t of sorted) {
    const h = new Date(t.timestamp).getHours();
    hourlyTradeCounts[h] += 1;
  }
  const maxHourlyTradeShare = totalTrades > 0
    ? round(Math.max(...hourlyTradeCounts) / totalTrades)
    : 0;

  // ── Large win follow-up trades ───────────────────────────────────────
  const { postWinTradesWithin30MinAvg, largeWinThreshold } = computePostWinStats(sorted, {
    avgAccountBalance,
  });

  // ── Return-based metrics (risk/reward, early winners) ────────────────
  const returns = sorted.map((t) => tradeReturnPct(t)).filter((v): v is number => v != null);
  const winReturns = returns.filter((r) => r > 0);
  const lossReturns = returns.filter((r) => r < 0).map((r) => Math.abs(r));

  const avgWinReturnPct = winReturns.length > 0 ? round(avg(winReturns), 4) : null;
  const avgLossReturnPct = lossReturns.length > 0 ? round(avg(lossReturns), 4) : null;
  const riskRewardRatio =
    avgWinReturnPct != null && avgLossReturnPct != null && avgLossReturnPct > 0
      ? round(avgWinReturnPct / avgLossReturnPct, 2)
      : null;

  const smallWinThreshold = winReturns.length > 0 ? percentile(winReturns, 0.25) : null;
  const smallWinRate =
    winReturns.length > 0 && smallWinThreshold != null
      ? round(winReturns.filter((r) => r <= smallWinThreshold).length / winReturns.length, 2)
      : null;

  // ── Size escalation after loss ───────────────────────────────────────
  const { avgTradeSizeAfterLoss, sizeAfterLossRatio } = computeSizeAfterLoss(sorted, avgTradeSize);

  // ── Risk-taking after negative streaks ───────────────────────────────
  const { avgTradeSizeAfterStreak, avgMinutesBetweenTradesAfterStreak } =
    computeAfterStreakStats(sorted);

  // ── Worst hours ───────────────────────────────────────────────────────
  const worstHours = computeWorstHours(sorted);

  // ── Detect biases ─────────────────────────────────────────────────────
  const partialMetrics = {
    tradingWindow,
    totalTrades,
    activeDays,
    tradesPerDayAvg,
    tradesPerDayMax,
    avgMinutesBetweenTrades,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    avgHoldMinutesWins,
    avgHoldMinutesLosses,
    postLossTradesWithin30MinAvg,
    postLossWinRate,
    avgAccountBalance,
    avgTradeSize,
    balanceTurnover,
    assetSwitchRate,
    sideFlipRate,
    hourlyTradeCounts,
    maxHourlyTradeShare,
    postWinTradesWithin30MinAvg,
    largeWinThreshold,
    avgWinReturnPct,
    avgLossReturnPct,
    riskRewardRatio,
    smallWinRate,
    smallWinThreshold,
    avgTradeSizeAfterLoss,
    sizeAfterLossRatio,
    avgTradeSizeAfterStreak,
    avgMinutesBetweenTradesAfterStreak,
    worstHours,
    dataCompleteness: {
      entryExitCoverage,
      balanceCoverage,
      sizeCoverage,
      missingFields,
    },
    detectedBiases: [] as BiasType[],
    severities: {} as Record<string, Severity>,
    evidence: {} as Record<string, string[]>,
  };

  const biasResults = detectBiases(partialMetrics);
  const detectedBiases = biasResults.map((b) => b.bias);
  const severities: Record<string, Severity> = {};
  const evidence: Record<string, string[]> = {};
  for (const b of biasResults) {
    severities[b.bias] = b.severity;
    evidence[b.bias] = b.evidence;
  }

  return {
    ...partialMetrics,
    detectedBiases,
    severities,
    evidence,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computePostLossStats(sorted: Trade[]): {
  postLossTradesWithin30MinAvg: number;
  postLossWinRate: number;
} {
  const lossIndices: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].pnl < 0) lossIndices.push(i);
  }

  if (lossIndices.length === 0) {
    return { postLossTradesWithin30MinAvg: 0, postLossWinRate: 0 };
  }

  let totalPostLossTrades = 0;
  let postLossWins = 0;
  let postLossTotal = 0;

  for (const idx of lossIndices) {
    const lossTime = sorted[idx].timestamp;
    let count = 0;
    for (let j = idx + 1; j < sorted.length; j++) {
      const diff = (sorted[j].timestamp - lossTime) / 60000;
      if (diff > 30) break;
      count++;
      postLossTotal++;
      if (sorted[j].pnl > 0) postLossWins++;
    }
    totalPostLossTrades += count;
  }

  return {
    postLossTradesWithin30MinAvg: round(totalPostLossTrades / lossIndices.length),
    postLossWinRate: postLossTotal > 0 ? round(postLossWins / postLossTotal) : 0,
  };
}

function computeWorstHours(sorted: Trade[]): string[] {
  const hourPnl = new Map<number, number>();
  for (const t of sorted) {
    const hour = new Date(t.timestamp).getHours();
    hourPnl.set(hour, (hourPnl.get(hour) || 0) + t.pnl);
  }

  const worstEntries = Array.from(hourPnl.entries())
    .filter(([, pnl]) => pnl < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  return worstEntries.map(([h]) => `${h.toString().padStart(2, "0")}:00-${(h + 1).toString().padStart(2, "0")}:00`);
}

function computePostWinStats(
  sorted: Trade[],
  opts: { avgAccountBalance: number | null }
): { postWinTradesWithin30MinAvg: number | null; largeWinThreshold: number | null } {
  const wins = sorted.filter((t) => t.pnl > 0);
  if (wins.length === 0) return { postWinTradesWithin30MinAvg: 0, largeWinThreshold: null };

  let largeWinThreshold: number | null = null;

  if (opts.avgAccountBalance) {
    largeWinThreshold = round(opts.avgAccountBalance * 0.01, 2); // 1% of balance
  } else {
    const winPnls = wins.map((w) => w.pnl);
    largeWinThreshold = percentile(winPnls, 0.9);
  }

  const largeWinIndices = sorted
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.pnl > 0 && largeWinThreshold != null && t.pnl >= largeWinThreshold!)
    .map(({ i }) => i);

  if (largeWinIndices.length === 0) {
    return { postWinTradesWithin30MinAvg: 0, largeWinThreshold };
  }

  let totalPostWinTrades = 0;
  for (const idx of largeWinIndices) {
    const winTime = sorted[idx].timestamp;
    let count = 0;
    for (let j = idx + 1; j < sorted.length; j++) {
      const diff = (sorted[j].timestamp - winTime) / 60000;
      if (diff > 30) break;
      count++;
    }
    totalPostWinTrades += count;
  }

  return {
    postWinTradesWithin30MinAvg: round(totalPostWinTrades / largeWinIndices.length),
    largeWinThreshold,
  };
}

function computeSizeAfterLoss(
  sorted: Trade[],
  avgTradeSize: number | null
): { avgTradeSizeAfterLoss: number | null; sizeAfterLossRatio: number | null } {
  const sizesAfterLoss: number[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].pnl >= 0) continue;
    const lossTime = sorted[i].timestamp;
    for (let j = i + 1; j < sorted.length; j++) {
      const diff = (sorted[j].timestamp - lossTime) / 60000;
      if (diff > 30) break;
      const size = tradeSize(sorted[j]);
      if (size != null) sizesAfterLoss.push(size);
    }
  }

  const avgTradeSizeAfterLoss =
    sizesAfterLoss.length > 0 ? round(avg(sizesAfterLoss)) : null;
  const sizeAfterLossRatio =
    avgTradeSizeAfterLoss != null && avgTradeSize != null && avgTradeSize > 0
      ? round(avgTradeSizeAfterLoss / avgTradeSize, 2)
      : null;

  return { avgTradeSizeAfterLoss, sizeAfterLossRatio };
}

function computeAfterStreakStats(sorted: Trade[]): {
  avgTradeSizeAfterStreak: number | null;
  avgMinutesBetweenTradesAfterStreak: number | null;
} {
  const sizes: number[] = [];
  const gaps: number[] = [];

  for (let i = 2; i < sorted.length; i++) {
    if (sorted[i - 1].pnl < 0 && sorted[i - 2].pnl < 0) {
      const size = tradeSize(sorted[i]);
      if (size != null) sizes.push(size);
      const gapMin = (sorted[i].timestamp - sorted[i - 1].timestamp) / 60000;
      if (!isNaN(gapMin)) gaps.push(gapMin);
    }
  }

  return {
    avgTradeSizeAfterStreak: sizes.length > 0 ? round(avg(sizes)) : null,
    avgMinutesBetweenTradesAfterStreak: gaps.length > 0 ? round(avg(gaps)) : null,
  };
}

function tradeSize(t: Trade): number | null {
  if (t.positionSize != null) return Math.abs(t.positionSize);
  if (t.qty != null && t.entryPrice != null) return Math.abs(t.qty * t.entryPrice);
  return null;
}

function tradeReturnPct(t: Trade): number | null {
  if (t.entryPrice == null || t.exitPrice == null) return null;
  const diff = t.side === "BUY" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice;
  return diff / t.entryPrice;
}

function formatWindow(startMs: number, endMs: number): string {
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return `${fmt(startMs)} to ${fmt(endMs)}`;
}

function round(n: number, decimals: number = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function avg(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}
