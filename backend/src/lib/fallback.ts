/**
 * Template-based fallback when Gemini is unavailable.
 * Ensures demo never breaks.
 */
export function generateFallback(metrics: any): any {
  const biases: string[] = metrics.detectedBiases || [];
  const severities: Record<string, string> = metrics.severities || {};
  const evidence: Record<string, string[]> = metrics.evidence || {};

  // Compute risk score from severities
  const weights: Record<string, number> = { LOW: 10, MEDIUM: 22, HIGH: 34 };
  let riskScore = 0;
  for (const bias of biases) {
    riskScore += weights[severities[bias]] || 10;
  }
  riskScore = Math.min(100, riskScore);

  const biasCards = biases.map((bias) => {
    const templates: Record<string, any> = {
      OVERTRADING: {
        whyItHurts:
          "Each trade carries transaction costs and emotional toll. Overtrading erodes returns through fees and increases the chance of impulsive decisions.",
        rules: [
          {
            title: "Set a Daily Trade Cap",
            details: `Limit yourself to ${Math.round(metrics.tradesPerDayAvg * 0.6)} trades/day (60% of current average).`,
          },
          {
            title: "Pre-Trade Checklist",
            details: "Before every trade: (1) Clear thesis, (2) Defined exit, (3) Proper sizing.",
          },
          {
            title: "Session Windows",
            details: "Trade in 2 focused 45-minute sessions per day with breaks in between.",
          },
        ],
        microHabit: "Before your next session, write down your top 3 setups. Only trade those.",
      },
      LOSS_AVERSION: {
        whyItHurts:
          "Holding losers too long and cutting winners short means your losses outsize your gains — the opposite of profitable trading.",
        rules: [
          {
            title: "Define Exit Before Entry",
            details: "Set your stop-loss before placing any trade. Never widen a stop.",
          },
          {
            title: "Symmetric Exits",
            details: "If your stop is X%, your take-profit should be at least 1.5X%.",
          },
          {
            title: "Time-Based Stops",
            details: "If a trade hasn't moved in your favor within your expected timeframe, exit.",
          },
        ],
        microHabit: "For your next 5 trades, set stop-loss orders immediately after entry.",
      },
      REVENGE_TRADING: {
        whyItHurts:
          "Trading to 'win back' losses triggers cortisol-driven decisions. Your win rate drops significantly after losses.",
        rules: [
          {
            title: "Mandatory Cooldown",
            details: "After any loss, wait at least 30 minutes before your next trade.",
          },
          {
            title: "If-Then Plan",
            details: "If I take a loss, then I close the app and review my trading checklist.",
          },
          {
            title: "Daily Loss Limit",
            details: "Set a maximum daily loss. Once hit, you're done for the day.",
          },
        ],
        microHabit: "After your next loss, set a 30-minute timer before returning.",
      },
    };

    const tmpl = templates[bias] || {
      whyItHurts: "Behavioral biases erode trading performance over time.",
      rules: [{ title: "Awareness", details: "Recognize the pattern when it happens." }],
      microHabit: "Keep a trading journal.",
    };

    return {
      bias,
      severity: severities[bias] || "MEDIUM",
      evidence: evidence[bias] || [],
      ...tmpl,
    };
  });

  const literacyModules = biases.map((bias) => {
    const modules: Record<string, any> = {
      OVERTRADING: {
        title: "The Cost of Overtrading",
        minutes: 3,
        lesson: `Every trade has an expected cost: commission + spread + slippage. At ${metrics.tradesPerDayAvg} trades/day, these costs compound into thousands annually.`,
        oneRule: "Never trade without a written thesis for the specific setup.",
        reflectionQuestion: "Of your last 10 trades, how many had a clear rationale before entry?",
        miniChallenge: "Tomorrow, cut your usual trade count in half. Note whether your P&L improves.",
      },
      LOSS_AVERSION: {
        title: "Understanding the Disposition Effect",
        minutes: 3,
        lesson: "Loss aversion makes losses feel ~2x more painful than equivalent gains feel good. This leads to holding losers and selling winners too early.",
        oneRule: "Always set your stop-loss before entering a trade.",
        reflectionQuestion: "When did you last move a stop-loss further away? What was the outcome?",
        miniChallenge: "For your next 3 trades, pre-commit to stop-loss and take-profit levels.",
      },
      REVENGE_TRADING: {
        title: "Emotions, Cortisol & Cooldowns",
        minutes: 3,
        lesson: `After a loss, cortisol spikes and rational thinking gets suppressed. Your post-loss win rate drops to ${(metrics.postLossWinRate * 100).toFixed(0)}% vs overall ${(metrics.winRate * 100).toFixed(0)}%.`,
        oneRule: "If I take a loss, I close the app for at least 10 minutes.",
        reflectionQuestion: "Think of your worst trading day — how many were revenge trades?",
        miniChallenge: "After your next loss, set a 30-minute timer and journal what you feel.",
      },
    };

    return modules[bias] || {
      title: "Trading Psychology 101",
      minutes: 3,
      lesson: "Understanding your biases is the first step to better trading.",
      oneRule: "Review your trading journal weekly.",
      reflectionQuestion: "What patterns do you notice in your behavior?",
      miniChallenge: "Start a simple trading journal this week.",
    };
  });

  return {
    headline: `We detected ${biases.length} behavioral patterns affecting your trading performance.`,
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
      recommendedCooldownMinutes: severities["REVENGE_TRADING"] === "HIGH" ? 60 : 30,
      triggerRule: severities["REVENGE_TRADING"] === "HIGH"
        ? "Activate after any loss exceeding your average loss"
        : "Activate after 2 consecutive losses",
      script: "Step away from your trading station. Take 5 deep breaths. Review your trading plan. Only return when you can articulate your next trade's thesis calmly.",
    },
    oneSentenceNudge: "The best traders don't trade more — they trade better. Today, focus on one less trade and one more review.",
  };
}
