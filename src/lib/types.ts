// ── Core Data Types ──────────────────────────────────────────────────────────

export type Trade = {
  timestamp: number; // ms epoch
  side: "BUY" | "SELL";
  asset: string;
  pnl: number;
  qty?: number;
  positionSize?: number;
  holdMinutes?: number;
};

// ── Computed Metrics ─────────────────────────────────────────────────────────

export type SummaryMetrics = {
  tradingWindow: string;
  totalTrades: number;
  activeDays: number;

  tradesPerDayAvg: number;
  tradesPerDayMax: number;
  avgMinutesBetweenTrades: number;

  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;

  avgHoldMinutesWins: number | null;
  avgHoldMinutesLosses: number | null;

  postLossTradesWithin30MinAvg: number;
  postLossWinRate: number;

  worstHours: string[];

  detectedBiases: BiasType[];
  severities: Record<string, Severity>;
  evidence: Record<string, string[]>;
};

// ── Bias Detection ───────────────────────────────────────────────────────────

export type BiasType = "OVERTRADING" | "LOSS_AVERSION" | "REVENGE_TRADING";
export type Severity = "LOW" | "MEDIUM" | "HIGH";

export type BiasResult = {
  bias: BiasType;
  severity: Severity;
  evidence: string[];
};

// ── Coach Output (from LLM) ─────────────────────────────────────────────────

export type CoachOutput = {
  headline: string;
  overallRiskScore: number;
  biasCards: Array<{
    bias: string;
    severity: string;
    evidence: string[];
    whyItHurts: string;
    rules: Array<{ title: string; details: string }>;
    microHabit: string;
  }>;
  literacyModules: Array<{
    title: string;
    minutes: number;
    lesson: string;
    oneRule: string;
    reflectionQuestion: string;
    miniChallenge: string;
  }>;
  brokerageFit: {
    summary: string;
    recommendations: string[];
  };
  restModePlan: {
    recommendedCooldownMinutes: number;
    triggerRule: string;
    script: string;
  };
  oneSentenceNudge: string;
};

// ── Brokerage Comparison ─────────────────────────────────────────────────────

export type BrokerageComparison = {
  name: string;
  perTrade: number;
  monthlyFee: number;
  estimatedAnnualCost: number;
  isNBC: boolean;
  highlight?: string;
};

// ── Risk Profile ─────────────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ETFRecommendation = {
  ticker: string;
  name: string;
  description: string;
  isSponsorPick: boolean;
};

export type RiskProfile = {
  level: RiskLevel;
  reasons: string[];
  pnlTrend: "POSITIVE" | "NEGATIVE" | "FLAT";
  recommendations: ETFRecommendation[];
};

// ── App State ────────────────────────────────────────────────────────────────

export type AppState = {
  linkedPartnerBank: string | null;
  trades: Trade[];
  metrics: SummaryMetrics | null;
  biasResults: BiasResult[];
  coachOutput: CoachOutput | null;
  restMode: { active: boolean; endsAt: number | null };
  riskProfile: RiskProfile | null;
  brokerageComparison: BrokerageComparison[] | null;
};
