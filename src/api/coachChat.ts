import { SummaryMetrics } from "@/src/lib/types";

const API_BASE = __DEV__
  ? "http://localhost:3001"
  : "http://localhost:3001";

export type ChatMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
  timestamp: number;
};

type ChatRequest = {
  messages: { role: "user" | "coach"; text: string }[];
  summaryMetrics?: Partial<SummaryMetrics> | null;
  detectedBiases?: string[];
  evidenceLines?: string[];
};

export async function sendChatMessage(
  request: ChatRequest
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/api/coach/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.warn("Coach chat unavailable:", error);
    return "Coach is offline. Please start the backend server to enable chat.";
  }
}
