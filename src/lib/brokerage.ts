import { SummaryMetrics, BrokerageComparison } from "./types";

type FeeOverrides = {
  perTrade?: number;
  monthlyFee?: number;
};

/**
 * Mock fee schedules for illustrative brokerage comparison.
 * NOT real fees — strictly for hackathon demo.
 */
const MOCK_BROKERAGES = [
  { name: "Brokerage A (Full-Service)", perTrade: 9.99, monthlyFee: 0 },
  { name: "Brokerage B (Discount)", perTrade: 6.95, monthlyFee: 0 },
  { name: "Brokerage C (Online)", perTrade: 4.95, monthlyFee: 0 },
  { name: "NBC Direct Brokerage (Illustrative)", perTrade: 0, monthlyFee: 9.95, isNBC: true },
  { name: "Brokerage D (Zero-Commission)", perTrade: 0, monthlyFee: 0 },
];

/**
 * Estimate annual trading costs for each brokerage based on user metrics.
 */
export function compareBrokerages(
  metrics: SummaryMetrics,
  overrides?: Record<string, FeeOverrides>
): BrokerageComparison[] {
  // Estimate annual trades: avg trades/day * ~252 trading days
  const tradingDaysPerYear = 252;
  const estimatedAnnualTrades = Math.round(
    metrics.tradesPerDayAvg * tradingDaysPerYear
  );

  return MOCK_BROKERAGES.map((b) => {
    const customOverride = overrides?.[b.name];
    const perTrade = customOverride?.perTrade ?? b.perTrade;
    const monthlyFee = customOverride?.monthlyFee ?? b.monthlyFee;
    const isNBC = "isNBC" in b && b.isNBC === true;

    const estimatedAnnualCost = Math.round(
      perTrade * estimatedAnnualTrades + monthlyFee * 12
    );

    return {
      name: b.name,
      perTrade,
      monthlyFee,
      estimatedAnnualCost,
      isNBC,
      highlight: isNBC
        ? `Based on your ${metrics.tradesPerDayAvg} trades/day, a lower-cost commission structure could save you money.`
        : undefined,
    };
  });
}

/**
 * Get personalized savings message comparing highest-cost vs NBC.
 */
export function getSavingsMessage(comparisons: BrokerageComparison[]): string {
  const sorted = [...comparisons].sort(
    (a, b) => b.estimatedAnnualCost - a.estimatedAnnualCost
  );
  const highestCost = sorted[0];
  const nbc = comparisons.find((c) => c.isNBC);
  if (!nbc) return "";

  const savings = highestCost.estimatedAnnualCost - nbc.estimatedAnnualCost;
  if (savings <= 0) return "";

  return `Compared to ${highestCost.name}, a lower-cost model could save you ~$${savings.toLocaleString()}/year.`;
}
