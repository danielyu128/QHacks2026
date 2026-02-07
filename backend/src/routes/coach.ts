import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "../lib/prompt.js";
import { coachOutputSchema } from "../lib/schema.js";
import { generateFallback } from "../lib/fallback.js";

export const coachRouter = Router();

coachRouter.post("/coach", async (req: Request, res: Response) => {
  try {
    const metrics = req.body;

    // Quick validation
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

    // Attempt 1
    let result = await model.generateContent(fullPrompt);
    let text = result.response.text();
    let parsed = tryParseJSON(text);

    // Retry once if invalid JSON
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

    // Light schema validation
    const validation = coachOutputSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn("Schema validation failed:", validation.error.issues.slice(0, 3));
      // Still return parsed data if it has required fields
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

function tryParseJSON(text: string): any {
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
