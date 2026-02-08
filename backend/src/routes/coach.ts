import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "../lib/prompt.js";
import { coachOutputSchema } from "../lib/schema.js";
import { generateFallback } from "../lib/fallback.js";

export const coachRouter = Router();

// ── Existing coaching endpoint ──────────────────────────────────────────────

coachRouter.post("/coach", async (req: Request, res: Response) => {
  try {
    const metrics = req.body;

    if (!metrics || !metrics.totalTrades || !metrics.detectedBiases) {
      res.status(400).json({ error: "Invalid metrics payload" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY — returning fallback coaching");
      const fallback = generateFallback(metrics);
      res.json(fallback);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const { systemPrompt, userPrompt } = buildPrompt(metrics);
    const fullPrompt = systemPrompt + "\n\n" + userPrompt;

    let result = await model.generateContent(fullPrompt);
    let text = result.response.text();
    let parsed = tryParseJSON(text);

    if (!parsed) {
      console.warn("First attempt returned invalid JSON, retrying...");
      result = await model.generateContent(
        fullPrompt + "\n\nIMPORTANT: Respond with ONLY valid JSON, no markdown."
      );
      text = result.response.text();
      parsed = tryParseJSON(text);
    }

    if (!parsed) {
      console.warn("Both attempts failed — using fallback");
      const fallback = generateFallback(metrics);
      res.json(fallback);
      return;
    }

    const validation = coachOutputSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn("Schema validation failed:", validation.error.issues.slice(0, 3));
      if (parsed.headline && parsed.biasCards) {
        res.json(parsed);
        return;
      }
      const fallback = generateFallback(metrics);
      res.json(fallback);
      return;
    }

    res.json(validation.data);
  } catch (error: any) {
    console.error("Coach endpoint error:", error.message);
    try {
      const fallback = generateFallback(req.body);
      res.json(fallback);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ── Chat endpoint ───────────────────────────────────────────────────────────

type ChatMessage = {
  role: "user" | "coach";
  text: string;
};

coachRouter.post("/coach/chat", async (req: Request, res: Response) => {
  try {
    const { messages, summaryMetrics, detectedBiases, evidenceLines } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    const latestUserMsg = messages[messages.length - 1]?.text || "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({
        reply: generateChatFallback(latestUserMsg, summaryMetrics, detectedBiases),
      });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      },
    });

    const systemContext = buildChatSystemPrompt(summaryMetrics, detectedBiases, evidenceLines);

    const conversationHistory = messages
      .map((m: ChatMessage) => `${m.role === "user" ? "User" : "Coach"}: ${m.text}`)
      .join("\n");

    const fullPrompt = `${systemContext}\n\nConversation so far:\n${conversationHistory}\n\nRespond as the Coach. Be concise (2-4 sentences), empathetic, and actionable. Reference the trader's specific data when relevant. Do NOT use markdown formatting.`;

    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text().trim();

    res.json({ reply });
  } catch (error: any) {
    console.error("Coach chat error:", error.message);
    res.json({
      reply: "I'm having trouble connecting right now. Try again in a moment.",
    });
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildChatSystemPrompt(
  metrics: any,
  biases: string[] | undefined,
  evidence: string[] | undefined
): string {
  let prompt = `You are a behavioral finance coach in the "financia" app. You help retail traders understand and overcome their trading biases.

RULES:
- Be warm, direct, and concise. This is a mobile chat — keep responses to 2-4 sentences.
- Reference the trader's actual data when relevant.
- Never give specific buy/sell recommendations or financial advice.
- Focus on behavioral patterns and psychology.
- If the trader seems distressed, suggest activating Rest Mode.`;

  if (metrics) {
    prompt += `\n\nTRADER DATA:
- Total trades: ${metrics.totalTrades || "unknown"}
- Win rate: ${metrics.winRate ? (metrics.winRate * 100).toFixed(1) + "%" : "unknown"}
- Avg win: $${metrics.avgWin || "unknown"}
- Avg loss: $${metrics.avgLoss || "unknown"}
- Trades/day: ${metrics.tradesPerDayAvg || "unknown"}`;
  }

  if (biases && biases.length > 0) {
    prompt += `\n\nDETECTED BIASES: ${biases.join(", ")}`;
  }

  if (evidence && evidence.length > 0) {
    prompt += `\n\nEVIDENCE:\n${evidence.slice(0, 10).map((e) => `- ${e}`).join("\n")}`;
  }

  return prompt;
}

function generateChatFallback(
  userMsg: string,
  metrics: any,
  biases: string[] | undefined
): string {
  const lowerMsg = userMsg.toLowerCase();

  if (lowerMsg.includes("revenge")) {
    return "Revenge trading often happens after a loss stings emotionally. The key is to build a pause between feeling the loss and placing the next trade. Try activating Rest Mode for 15 minutes after any losing streak of 3+.";
  }
  if (lowerMsg.includes("overtrad")) {
    return "Overtrading usually stems from the urge to 'make it back' or the excitement of being in the market. Setting a daily trade limit — and sticking to it — is one of the most effective interventions.";
  }
  if (lowerMsg.includes("loss aversion") || lowerMsg.includes("loss")) {
    return "Loss aversion makes us hold losers too long and cut winners too short. A practical rule: define your exit before entering any trade, and commit to honoring it regardless of how you feel in the moment.";
  }
  if (lowerMsg.includes("rule") || lowerMsg.includes("tomorrow")) {
    return "Here are 3 rules for tomorrow: (1) Set a max of 5 trades for the day. (2) Take a 10-minute break after any loss. (3) Write one sentence in your journal before your first trade about what you want to achieve.";
  }
  if (lowerMsg.includes("summar") || lowerMsg.includes("bias")) {
    const biasStr = biases?.join(", ") || "no biases detected yet";
    return `Based on your data, here's what I see: ${biasStr}. Each of these can be addressed with simple habit changes. Want to dive into any specific one?`;
  }

  return "That's a great question. Building awareness of your patterns is the first step to changing them. What specific trading behavior would you like to work on?";
}

function tryParseJSON(text: string): any {
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
