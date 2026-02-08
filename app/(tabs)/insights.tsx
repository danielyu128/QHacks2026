import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Radius, Typography, Shadows, SeverityColors } from "@/src/lib/theme";
import { useApp } from "@/src/context/AppContext";
import BiasCard from "@/src/components/BiasCard";
import { computeOverallRiskScore } from "@/src/lib/biases";

export default function InsightsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { biasResults, coachOutput, metrics } = state;

  const riskScore =
    coachOutput?.overallRiskScore ?? computeOverallRiskScore(biasResults);

  const scoreColor =
    riskScore >= 70
      ? Colors.danger
      : riskScore >= 40
      ? Colors.warning
      : Colors.secondary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Risk Score Banner */}
      <View style={styles.scoreBanner}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>
            {riskScore}
          </Text>
          <Text style={styles.scoreLabel}>/100</Text>
        </View>
        <Text style={styles.scoreTitle}>Bias Risk Score</Text>
        <Text style={styles.scoreSubtitle}>
          {biasResults.filter((b) => b.severity !== "LOW").length} patterns
          detected
        </Text>
      </View>

      {/* Data Completeness Warning */}
      {metrics?.dataCompleteness?.missingFields?.length ? (
        <View style={styles.dataWarning}>
          <Text style={styles.dataWarningTitle}>Limited Insights</Text>
          <Text style={styles.dataWarningText}>
            Add {metrics.dataCompleteness.missingFields.join(", ")} to unlock balance-based,
            risk/reward, and size-based bias signals.
          </Text>
        </View>
      ) : null}

      {/* Coach Headline */}
      {coachOutput && (
        <View style={styles.headlineCard}>
          <Text style={styles.headlineIcon}>🎯</Text>
          <Text style={styles.headlineText}>{coachOutput.headline}</Text>
        </View>
      )}

      {/* Bias Cards */}
      <Text style={styles.sectionTitle}>Detected Biases</Text>
      {biasResults.map((result) => (
        <BiasCard
          key={result.bias}
          result={result}
          onPressCTA={() => router.push("/(tabs)/plan")}
          onPressJournal={() =>
            router.push({
              pathname: "/journal",
              params: {
                bias: result.bias,
                prompt: result.evidence.slice(0, 2).join(" "),
              },
            })
          }
        />
      ))}

      {/* Nudge */}
      {coachOutput?.oneSentenceNudge && (
        <View style={styles.nudgeCard}>
          <Text style={styles.nudgeText}>
            💡 {coachOutput.oneSentenceNudge}
          </Text>
        </View>
      )}

      {/* Metrics Summary */}
      {metrics && (
        <View style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.metricsGrid}>
            <MetricPill label="Total Trades" value={String(metrics.totalTrades)} />
            <MetricPill label="Active Days" value={String(metrics.activeDays)} />
            <MetricPill
              label="Win Rate"
              value={`${(metrics.winRate * 100).toFixed(0)}%`}
            />
            <MetricPill
              label="Avg/Day"
              value={String(metrics.tradesPerDayAvg)}
            />
            <MetricPill
              label="Avg Win"
              value={`$${metrics.avgWin.toFixed(0)}`}
            />
            <MetricPill
              label="Avg Loss"
              value={`$${metrics.avgLoss.toFixed(0)}`}
            />
          </View>
        </View>
      )}

      {/* Quick Links */}
      <Text style={styles.sectionTitle}>Explore More</Text>
      <View style={styles.linkCards}>
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => router.push("/(tabs)/learn")}
          activeOpacity={0.7}
        >
          <Text style={styles.linkIcon}>📚</Text>
          <Text style={styles.linkLabel}>Learn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => router.push("/(tabs)/brokerage")}
          activeOpacity={0.7}
        >
          <Text style={styles.linkIcon}>🏦</Text>
          <Text style={styles.linkLabel}>Broker</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => router.push("/(tabs)/safer")}
          activeOpacity={0.7}
        >
          <Text style={styles.linkIcon}>🛡️</Text>
          <Text style={styles.linkLabel}>ETFs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricPillValue}>{value}</Text>
      <Text style={styles.metricPillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  scoreBanner: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  scoreCircle: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: "900",
  },
  scoreLabel: {
    ...Typography.h2,
    color: Colors.textMuted,
  },
  scoreTitle: {
    ...Typography.h2,
  },
  scoreSubtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  headlineCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  headlineIcon: {
    fontSize: 24,
  },
  headlineText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 22,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  nudgeCard: {
    backgroundColor: Colors.primary + "15",
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  nudgeText: {
    ...Typography.body,
    color: Colors.primaryLight,
    lineHeight: 22,
  },
  dataWarning: {
    backgroundColor: Colors.warning + "15",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + "40",
    marginBottom: Spacing.lg,
  },
  dataWarningTitle: {
    ...Typography.label,
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  dataWarningText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  metricsCard: {
    marginTop: Spacing.sm,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metricPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: "31%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricPillValue: {
    ...Typography.h3,
    fontSize: 16,
    marginBottom: 2,
  },
  metricPillLabel: {
    ...Typography.caption,
    textAlign: "center",
  },
  linkCards: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  linkCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkIcon: {
    fontSize: 24,
  },
  linkLabel: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
