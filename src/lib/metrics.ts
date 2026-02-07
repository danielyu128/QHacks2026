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
    worstHours,
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

function formatWindow(startMs: number, endMs: number): string {
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return `${fmt(startMs)} to ${fmt(endMs)}`;
}

function round(n: number, decimals: number = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
