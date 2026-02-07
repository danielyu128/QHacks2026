import { Trade } from "./types";

/**
 * Generate a deterministic sample dataset (~200 trades over 5 trading days)
 * that triggers all 3 biases:
 *
 * - Overtrading: ~25-30 trades/day, < 10 min between many trades
 * - Loss Aversion: hold losses longer, avg loss > avg win
 * - Revenge Trading: bursts of trades after losses with lower win rate
 */
function generateSampleTrades(): Trade[] {
  const trades: Trade[] = [];
  const assets = ["AAPL", "TSLA", "NVDA", "AMD", "SPY", "QQQ", "MSFT", "AMZN"];

  // Seed-like deterministic pseudo-random (simple LCG)
  let seed = 42;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(rand() * arr.length)];
  }

  // 5 trading days
  const baseDates = [
    new Date("2025-01-27T09:30:00"),
    new Date("2025-01-28T09:30:00"),
    new Date("2025-01-29T09:30:00"),
    new Date("2025-01-30T09:30:00"),
    new Date("2025-01-31T09:30:00"),
  ];

  for (const dayStart of baseDates) {
    let cursor = dayStart.getTime();
    const dayEnd = cursor + 6.5 * 60 * 60 * 1000; // 6.5hr trading day
    const tradesThisDay: Trade[] = [];

    while (cursor < dayEnd && tradesThisDay.length < 40) {
      const isWin = rand() < 0.42; // 42% win rate overall
      const side: "BUY" | "SELL" = rand() < 0.6 ? "BUY" : "SELL";
      const asset = pick(assets);

      // Loss aversion pattern: wins are smaller, losses are bigger
      let pnl: number;
      let holdMinutes: number;
      if (isWin) {
        pnl = +(15 + rand() * 50).toFixed(2); // avg ~$35 wins
        holdMinutes = +(3 + rand() * 15).toFixed(1); // cut winners short (3-18 min)
      } else {
        pnl = -(25 + rand() * 90).toFixed(2) as unknown as number;
        pnl = +pnl;
        holdMinutes = +(10 + rand() * 50).toFixed(1); // hold losers long (10-60 min)
      }

      const trade: Trade = {
        timestamp: cursor,
        side,
        asset,
        pnl,
        qty: +(10 + Math.floor(rand() * 90)),
        holdMinutes,
      };
      tradesThisDay.push(trade);

      // Time gap: mostly 5-15 min (overtrading), but sometimes bursts after losses
      let gap: number;
      if (!isWin && rand() < 0.65) {
        // Revenge trading: rapid follow-up after loss (2-8 min)
        gap = 2 + rand() * 6;
      } else {
        gap = 5 + rand() * 15;
      }
      cursor += gap * 60 * 1000;
    }

    trades.push(...tradesThisDay);
  }

  return trades;
}

export const SAMPLE_TRADES: Trade[] = generateSampleTrades();
