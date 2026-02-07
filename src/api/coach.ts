import { SummaryMetrics, CoachOutput } from "@/src/lib/types";
import { generateFallbackCoaching } from "./fallback";

// Backend URL - adjust for your environment
const API_BASE = __DEV__
  ? "http://localhost:3001"
  : "http://localhost:3001"; // In production, use actual URL

/**
 * Call the Express backend /api/coach endpoint.
 * Falls back to template coaching if backend is unreachable.
 */
export async function fetchCoachOutput(
  metrics: SummaryMetrics
): Promise<CoachOutput> {
  try {
    const payload = {
      ...metrics,
      clientMeta: {
        app: "BiasDetector",
        version: "1.1.0",
      },
    };
    const response = await fetch(`${API_BASE}/api/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data: CoachOutput = await response.json();
    return data;
  } catch (error) {
    console.warn("Coach API unavailable, using fallback:", error);
    return generateFallbackCoaching(metrics);
  }
}
