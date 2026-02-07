import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  AppState,
  Trade,
  SummaryMetrics,
  BiasResult,
  CoachOutput,
  RiskProfile,
  BrokerageComparison,
} from "@/src/lib/types";

// ── Initial State ────────────────────────────────────────────────────────────

const initialState: AppState = {
  linkedPartnerBank: null,
  trades: [],
  metrics: null,
  biasResults: [],
  coachOutput: null,
  restMode: { active: false, endsAt: null },
  riskProfile: null,
  brokerageComparison: null,
};

// ── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_PARTNER_BANK"; payload: string }
  | { type: "SET_TRADES"; payload: Trade[] }
  | {
      type: "SET_ANALYSIS";
      payload: {
        metrics: SummaryMetrics;
        biasResults: BiasResult[];
        riskProfile: RiskProfile;
        brokerageComparison: BrokerageComparison[];
      };
    }
  | { type: "SET_COACH_OUTPUT"; payload: CoachOutput }
  | { type: "TOGGLE_REST_MODE"; payload: { active: boolean; endsAt: number | null } }
  | { type: "RESET" };

// ── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_PARTNER_BANK":
      return { ...state, linkedPartnerBank: action.payload };
    case "SET_TRADES":
      return { ...state, trades: action.payload };
    case "SET_ANALYSIS":
      return {
        ...state,
        metrics: action.payload.metrics,
        biasResults: action.payload.biasResults,
        riskProfile: action.payload.riskProfile,
        brokerageComparison: action.payload.brokerageComparison,
      };
    case "SET_COACH_OUTPUT":
      return { ...state, coachOutput: action.payload };
    case "TOGGLE_REST_MODE":
      return { ...state, restMode: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
