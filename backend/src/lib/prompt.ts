/**
 * Build the system + user prompts for Gemini.
 * Strict instruction: use ONLY provided evidence lines.
 */
export function buildPrompt(metrics: any): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `You are a behavioral finance coach analyzing a retail trader's patterns.

STRICT RULES:
1. Use ONLY the evidence lines and metrics provided below. Do NOT invent statistics or numbers.
2. Respond with ONLY valid JSON matching the exact schema specified.
3. Be empathetic but direct. This trader needs actionable advice.
4. Reference specific numbers from the evidence when giving recommendations.
5. Keep each field concise — this renders on a mobile screen.

OUTPUT JSON SCHEMA:
{
  "headline": "One-sentence summary of the trader's key behavioral patterns",
  "overallRiskScore": <number 0-100>,
  "biasCards": [
    {
      "bias": "OVERTRADING|LOSS_AVERSION|REVENGE_TRADING",
      "severity": "LOW|MEDIUM|HIGH",
      "evidence": ["evidence line 1", "evidence line 2"],
      "whyItHurts": "Brief explanation of impact",
      "rules": [{"title": "Rule name", "details": "Rule description"}],
      "microHabit": "One small actionable habit"
    }
  ],
  "literacyModules": [
    {
      "title": "Module title",
      "minutes": 3,
      "lesson": "Educational content about the bias",
      "oneRule": "Single actionable rule",
      "reflectionQuestion": "A question for self-reflection",
      "miniChallenge": "A challenge for their next session"
    }
  ],
  "brokerageFit": {
    "summary": "How their trading style relates to brokerage choice",
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "restModePlan": {
    "recommendedCooldownMinutes": <number>,
    "triggerRule": "When to activate rest mode",
    "script": "Step-by-step cooldown instructions"
  },
  "oneSentenceNudge": "A motivational closing sentence"
}`;

  const userPrompt = `Here are the trader's metrics and detected biases. Analyze them and generate coaching output.

TRADER METRICS:
- Trading window: ${metrics.tradingWindow}
- Total trades: ${metrics.totalTrades}
- Active days: ${metrics.activeDays}
- Trades/day avg: ${metrics.tradesPerDayAvg}
- Trades/day max: ${metrics.tradesPerDayMax}
- Avg minutes between trades: ${metrics.avgMinutesBetweenTrades}
- Win rate: ${(metrics.winRate * 100).toFixed(1)}%
- Avg win: $${metrics.avgWin}
- Avg loss: $${metrics.avgLoss}
- Profit factor: ${metrics.profitFactor}
${metrics.avgHoldMinutesWins ? `- Avg hold time (wins): ${metrics.avgHoldMinutesWins} min` : ""}
${metrics.avgHoldMinutesLosses ? `- Avg hold time (losses): ${metrics.avgHoldMinutesLosses} min` : ""}
- Post-loss trades within 30min (avg): ${metrics.postLossTradesWithin30MinAvg}
- Post-loss win rate: ${(metrics.postLossWinRate * 100).toFixed(1)}%
- Worst hours: ${metrics.worstHours?.join(", ") || "N/A"}

DETECTED BIASES:
${metrics.detectedBiases
  .map(
    (bias: string) =>
      `- ${bias} (${metrics.severities[bias]})\n  Evidence:\n${(metrics.evidence[bias] || [])
        .map((e: string) => `    • ${e}`)
        .join("\n")}`
  )
  .join("\n\n")}

Generate the coaching JSON now. Remember: use ONLY the numbers above, do not invent any statistics.`;

  return { systemPrompt, userPrompt };
}
