import { Trade, BiasResult, RiskProfile, RiskLevel, ETFRecommendation } from "./types";

/**
 * Compute a simple risk behavior profile from trades + bias results.
 */
export function computeRiskProfile(
  trades: Trade[],
  biases: BiasResult[]
): RiskProfile {
  const reasons: string[] = [];

  // ── 1) Loss streak frequency ──────────────────────────────────────────
  const maxStreak = longestLossStreak(trades);
  let streakRisk = 0;
  if (maxStreak >= 8) {
    streakRisk = 3;
    reasons.push(`Your longest loss streak is ${maxStreak} trades — indicating high emotional risk.`);
  } else if (maxStreak >= 5) {
    streakRisk = 2;
    reasons.push(`Your longest loss streak is ${maxStreak} trades.`);
  } else {
    streakRisk = 1;
  }

  // ── 2) PnL trend ─────────────────────────────────────────────────────
  const cumulativePnl = trades.reduce((s, t) => s + t.pnl, 0);
  const pnlTrend: "POSITIVE" | "NEGATIVE" | "FLAT" =
    cumulativePnl > 50 ? "POSITIVE" : cumulativePnl < -50 ? "NEGATIVE" : "FLAT";

  let pnlRisk = 0;
  if (pnlTrend === "NEGATIVE") {
    pnlRisk = 3;
    reasons.push(`Net P&L is $${cumulativePnl.toFixed(2)} — you are losing money overall.`);
  } else if (pnlTrend === "FLAT") {
    pnlRisk = 2;
  } else {
    pnlRisk = 1;
  }

  // ── 3) PnL variance (volatility proxy) ───────────────────────────────
  const pnls = trades.map((t) => t.pnl);
  const variance = computeVariance(pnls);
  let volRisk = 0;
  if (variance > 2500) {
    volRisk = 3;
    reasons.push(`Your P&L volatility is very high (variance: ${variance.toFixed(0)}).`);
  } else if (variance > 1000) {
    volRisk = 2;
    reasons.push(`Your P&L shows moderate volatility.`);
  } else {
    volRisk = 1;
  }

  // ── 4) Bias severity multiplier ───────────────────────────────────────
  let biasRisk = 0;
  for (const b of biases) {
    if (b.severity === "HIGH") biasRisk += 3;
    else if (b.severity === "MEDIUM") biasRisk += 2;
    else biasRisk += 1;
  }
  const avgBiasRisk = biases.length > 0 ? biasRisk / biases.length : 1;

  // ── Combine ───────────────────────────────────────────────────────────
  const totalScore = (streakRisk + pnlRisk + volRisk + avgBiasRisk) / 4;

  let level: RiskLevel;
  if (totalScore >= 2.5) {
    level = "HIGH";
  } else if (totalScore >= 1.8) {
    level = "MEDIUM";
  } else {
    level = "LOW";
  }

  // ── ETF Recommendations ───────────────────────────────────────────────
  const recommendations = getETFRecommendations(level);

  return { level, reasons, pnlTrend, recommendations };
}

// ── ETF Recommendations ──────────────────────────────────────────────────────

function getETFRecommendations(riskLevel: RiskLevel): ETFRecommendation[] {
  const etfs: ETFRecommendation[] = [
    {
      ticker: "NBI Canadian Equity ETF",
      name: "NBI Canadian Equity ETF",
      description: "Broad Canadian equity exposure with professional management.",
      isSponsorPick: true,
    },
    {
      ticker: "NBI Global Equity ETF",
      name: "NBI Global Equity ETF",
      description: "Globally diversified equities to reduce home-country bias.",
      isSponsorPick: true,
    },
    {
      ticker: "NBI Sustainable Canadian Bond ETF",
      name: "NBI Sustainable Canadian Bond ETF",
      description: "Fixed-income stability with an ESG focus.",
      isSponsorPick: true,
    },
    {
      ticker: "XIU",
      name: "iShares S&P/TSX 60 ETF",
      description: "Low-cost exposure to Canada's 60 largest companies.",
      isSponsorPick: false,
    },
    {
      ticker: "VFV",
      name: "Vanguard S&P 500 ETF",
      description: "Track the S&P 500 with minimal fees.",
      isSponsorPick: false,
    },
    {
      ticker: "XBAL",
      name: "iShares Core Balanced ETF",
      description: "60/40 equity-bond mix for balanced risk exposure.",
      isSponsorPick: false,
    },
  ];

  // For high-risk users, emphasize bond/balanced options
  if (riskLevel === "HIGH") {
    // Move bond/balanced ETFs to top
    etfs.sort((a, b) => {
      const aScore = a.description.toLowerCase().includes("bond") ||
        a.description.toLowerCase().includes("balanced") ? 0 : 1;
      const bScore = b.description.toLowerCase().includes("bond") ||
        b.description.toLowerCase().includes("balanced") ? 0 : 1;
      return aScore - bScore;
    });
  }

  return etfs;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function longestLossStreak(trades: Trade[]): number {
  let max = 0;
  let current = 0;
  for (const t of trades) {
    if (t.pnl < 0) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

function computeVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return squaredDiffs.reduce((s, d) => s + d, 0) / values.length;
}
