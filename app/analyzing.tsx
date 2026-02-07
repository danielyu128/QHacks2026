import { fetchCoachOutput } from "@/src/api/coach";
import BackButton from "@/src/components/BackButton";
import { useApp } from "@/src/context/AppContext";
import { compareBrokerages } from "@/src/lib/brokerage";
import { computeMetrics } from "@/src/lib/metrics";
import { computeRiskProfile } from "@/src/lib/risk";
import { Colors, Spacing, Typography } from "@/src/lib/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
  { label: "Parsing trades", icon: "📊" },
  { label: "Computing bias metrics", icon: "🧠" },
  { label: "Generating coaching plan", icon: "🎯" },
];

export default function AnalyzingScreen() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    runAnalysis();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / STEPS.length,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const runAnalysis = async () => {
    try {
      if (state.trades.length === 0) {
        setError("No trades loaded. Please go back and import data.");
        return;
      }

      // Step 1: Compute metrics (also runs detectBiases internally)
      setCurrentStep(0);
      await delay(600); // Brief visual delay for UX
      const metrics = computeMetrics(state.trades);

      // Step 2: Compute brokerage + risk
      setCurrentStep(1);
      await delay(600);
      const biasResults = metrics.detectedBiases.map((bias) => ({
        bias,
        severity: metrics.severities[bias] as "LOW" | "MEDIUM" | "HIGH",
        evidence: metrics.evidence[bias] || [],
      }));
      const brokerageComparison = compareBrokerages(metrics);
      const riskProfile = computeRiskProfile(state.trades, biasResults);

      dispatch({
        type: "SET_ANALYSIS",
        payload: { metrics, biasResults, riskProfile, brokerageComparison },
      });

      // Step 3: Fetch coach output (LLM)
      setCurrentStep(2);
      const coachOutput = await fetchCoachOutput(metrics);
      dispatch({ type: "SET_COACH_OUTPUT", payload: coachOutput });

      await delay(400);
      router.replace("/(tabs)/insights");
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.headerTitle}>Analyzing Your Trades</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.main}>
          <Text style={styles.title}>Analyzing Your Trades</Text>
          <Text style={styles.subtitle}>
            {state.trades.length} trades loaded
          </Text>

          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.steps}>
            {STEPS.map((step, i) => (
              <View
                key={i}
                style={[
                  styles.stepRow,
                  i < currentStep && styles.stepComplete,
                  i === currentStep && styles.stepActive,
                ]}
              >
                <Text style={styles.stepIcon}>
                  {i < currentStep
                    ? "✅"
                    : i === currentStep
                      ? step.icon
                      : "⏳"}
                </Text>
                <Text
                  style={[
                    styles.stepLabel,
                    i <= currentStep && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "space-between",
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    ...Typography.h2,
    textAlign: "center",
    flex: 1,
  },
  title: {
    ...Typography.h1,
    textAlign: "center",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.xl,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  steps: {
    gap: Spacing.lg,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
  },
  stepActive: {
    backgroundColor: Colors.surface,
  },
  stepComplete: {},
  stepIcon: {
    fontSize: 24,
  },
  stepLabel: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  stepLabelActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: Colors.danger + "20",
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger + "40",
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    textAlign: "center",
  },
});
