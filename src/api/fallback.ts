import { SummaryMetrics, CoachOutput } from "@/src/lib/types";
import { computeOverallRiskScore } from "@/src/lib/biases";

/**
 * Generate template-based coaching output when LLM is unavailable.
 * Ensures the demo never breaks.
 */
export function generateFallbackCoaching(metrics: SummaryMetrics): CoachOutput {
  const biasResults = metrics.detectedBiases.map((bias) => ({
    bias,
    severity: metrics.severities[bias],
    evidence: metrics.evidence[bias] || [],
  }));

  const riskScore = computeOverallRiskScore(
    biasResults.map((b) => ({
      bias: b.bias,
      severity: b.severity as "LOW" | "MEDIUM" | "HIGH",
      evidence: b.evidence,
    }))
  );

  const biasCards = biasResults.map((b) => {
    const templates = BIAS_TEMPLATES[b.bias] || DEFAULT_TEMPLATE;
    return {
      bias: b.bias,
      severity: b.severity,
      evidence: b.evidence,
      whyItHurts: templates.whyItHurts,
      rules: templates.rules,
      microHabit: templates.microHabit,
    };
  });

  const literacyModules = metrics.detectedBiases.map((bias) => {
    return LITERACY_TEMPLATES[bias] || DEFAULT_LITERACY;
  });

  return {
    headline: `We detected ${metrics.detectedBiases.length} behavioral patterns affecting your trading performance.`,
    overallRiskScore: riskScore,
    biasCards,
    literacyModules,
    brokerageFit: {
      summary: `With ${metrics.tradesPerDayAvg} trades/day, your commission costs add up significantly. Consider fee structures that reward your volume.`,
      recommendations: [
        "Compare commission structures across brokerages",
        "Consider flat-fee or subscription models for high-volume trading",
        "Factor in hidden costs like ECN fees and currency conversion",
      ],
    },
    restModePlan: {
      recommendedCooldownMinutes:
        metrics.severities["REVENGE_TRADING"] === "HIGH" ? 60 : 30,
      triggerRule:
        metrics.severities["REVENGE_TRADING"] === "HIGH"
          ? "Activate after any loss exceeding your average loss"
          : "Activate after 2 consecutive losses",
      script:
        "Step away from your trading station. Take 5 deep breaths. Review your trading plan. Only return when you can articulate your next trade's thesis calmly.",
    },
    oneSentenceNudge:
      "The best traders don't trade more — they trade better. Today, focus on one less trade and one more review.",
  };
}

// ── Template Data ────────────────────────────────────────────────────────────

const BIAS_TEMPLATES: Record<string, any> = {
  OVERTRADING: {
    whyItHurts:
      "Each trade carries transaction costs and emotional toll. Overtrading erodes returns through fees and increases the chance of impulsive decisions.",
    rules: [
      {
        title: "Set a Daily Trade Cap",
        details:
          "Limit yourself to 60% of your current average. Quality over quantity.",
      },
      {
        title: "Pre-Trade Checklist",
        details:
          "Before every trade, confirm: (1) Clear thesis, (2) Defined exit, (3) Proper sizing.",
      },
      {
        title: "Session Windows",
        details:
          "Trade in 2 focused 45-minute sessions per day with breaks in between.",
      },
    ],
    microHabit:
      "Before your next trading session, write down your top 3 setups. Only trade those.",
  },
  LOSS_AVERSION: {
    whyItHurts:
      "Holding losers too long and cutting winners short (disposition effect) means your losses outsize your gains — the opposite of what profitable trading requires.",
    rules: [
      {
        title: "Define Exit Before Entry",
        details:
          "Set your stop-loss before placing any trade. Never widen a stop.",
      },
      {
        title: "Symmetric Exits",
        details:
          "If your stop is X%, your take-profit should be at least 1.5X%.",
      },
      {
        title: "Time-Based Stops",
        details:
          "If a trade hasn't moved in your favor within your expected timeframe, exit at market.",
      },
    ],
    microHabit:
      "For your next 5 trades, set stop-loss orders immediately after entry — no exceptions.",
  },
  REVENGE_TRADING: {
    whyItHurts:
      "Trading to 'win back' losses triggers cortisol-driven decisions. Your win rate drops significantly after losses, compounding damage.",
    rules: [
      {
        title: "Mandatory Cooldown",
        details: "After any loss, wait at least 30 minutes before your next trade.",
      },
      {
        title: "If-Then Plan",
        details:
          "If I take a loss, then I close the app and review my trading checklist.",
      },
      {
        title: "Loss Limit",
        details:
          "Set a daily loss limit. Once hit, you're done for the day. No exceptions.",
      },
    ],
    microHabit:
      "After your next loss, set a phone timer for 30 minutes. Journal what happened before returning.",
  },
};

const DEFAULT_TEMPLATE = {
  whyItHurts: "Behavioral biases erode trading performance over time.",
  rules: [
    { title: "Awareness", details: "Recognize the pattern when it happens." },
  ],
  microHabit: "Keep a trading journal and review it weekly.",
};

const LITERACY_TEMPLATES: Record<string, any> = {
  OVERTRADING: {
    title: "The Cost of Overtrading",
    minutes: 3,
    lesson:
      "Every trade has an expected cost: commission + spread + slippage. When you trade 25+ times/day, these costs compound into thousands annually. Studies show that the most active retail traders underperform passive investors by 6-7% per year on average.",
    oneRule: "Never trade without a written thesis for the specific setup.",
    reflectionQuestion:
      "Of your last 10 trades, how many had a clear, written rationale before entry?",
    miniChallenge:
      "Tomorrow, cut your usual trade count in half. Note whether your P&L improves.",
  },
  LOSS_AVERSION: {
    title: "Understanding the Disposition Effect",
    minutes: 3,
    lesson:
      "Loss aversion is a cognitive bias where losses feel ~2x more painful than equivalent gains feel good. This leads to holding losers (hoping for recovery) and selling winners too early (locking in comfort). The result: a portfolio of losers.",
    oneRule: "Always set your stop-loss before entering a trade.",
    reflectionQuestion:
      "When did you last move a stop-loss further away from your entry? What was the outcome?",
    miniChallenge:
      "For your next 3 trades, pre-commit to stop-loss and take-profit levels. Do not adjust them once set.",
  },
  REVENGE_TRADING: {
    title: "Emotions, Cortisol & Why Cooldowns Work",
    minutes: 3,
    lesson:
      "After a loss, cortisol spikes and your prefrontal cortex (rational thinking) gets suppressed. Trading in this state is like driving angry — you make poor decisions. A 30-minute cooldown lets cortisol levels normalize, restoring your ability to think clearly.",
    oneRule:
      "If I take a loss, I close the app and do something physical for 10 minutes.",
    reflectionQuestion:
      "Think of your worst trading day. How many trades were 'revenge' trades trying to recover?",
    miniChallenge:
      "Next time you take a loss, set a timer for 30 minutes. Journal what you feel before returning to trade.",
  },
};

const DEFAULT_LITERACY = {
  title: "Trading Psychology 101",
  minutes: 3,
  lesson: "Understanding your psychological biases is the first step to better trading.",
  oneRule: "Review your trading journal at the end of every week.",
  reflectionQuestion: "What patterns do you notice in your trading behavior?",
  miniChallenge: "Start a simple trading journal this week.",
};
