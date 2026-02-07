import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import { useApp } from "@/src/context/AppContext";
import MetricRow from "@/src/components/MetricRow";
import DisclaimerBanner from "@/src/components/DisclaimerBanner";
import PrimaryButton from "@/src/components/PrimaryButton";
import { getSavingsMessage } from "@/src/lib/brokerage";

export default function BrokerageScreen() {
  const { state } = useApp();
  const { metrics, brokerageComparison, coachOutput } = state;
  const [showCustomize, setShowCustomize] = useState(false);

  const comparisons = brokerageComparison || [];
  const savingsMessage = useMemo(
    () => (comparisons.length > 0 ? getSavingsMessage(comparisons) : ""),
    [comparisons]
  );
  const coachFit = coachOutput?.brokerageFit?.summary || null;

  const estimatedAnnualTrades = metrics
    ? Math.round(metrics.tradesPerDayAvg * 252)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <DisclaimerBanner text="Fee estimates are illustrative for hackathon/demo purposes only. Not real brokerage quotes." />

      {/* User Metrics Summary */}
      {metrics && (
        <View style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>Your Trading Profile</Text>
          <MetricRow label="Avg Trades/Day" value={metrics.tradesPerDayAvg} highlight />
          <MetricRow label="Active Days (sample)" value={metrics.activeDays} />
          <MetricRow label="Est. Annual Trades" value={estimatedAnnualTrades.toLocaleString()} highlight />
        </View>
      )}

      {/* Savings Highlight */}
      {savingsMessage ? (
        <View style={styles.savingsCard}>
          <Text style={styles.savingsIcon}>💰</Text>
          <Text style={styles.savingsText}>{savingsMessage}</Text>
        </View>
      ) : null}

      {/* Comparison Table */}
      <Text style={styles.sectionTitle}>Estimated Annual Costs</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Brokerage</Text>
          <Text style={styles.tableHeaderCell}>Per Trade</Text>
          <Text style={styles.tableHeaderCell}>Monthly</Text>
          <Text style={styles.tableHeaderCell}>Annual</Text>
        </View>
        {comparisons
          .sort((a, b) => a.estimatedAnnualCost - b.estimatedAnnualCost)
          .map((c, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                c.isNBC && styles.tableRowHighlight,
              ]}
            >
              <View style={{ flex: 2 }}>
                <Text
                  style={[
                    styles.tableCell,
                    c.isNBC && styles.tableCellHighlight,
                  ]}
                  numberOfLines={2}
                >
                  {c.name}
                </Text>
                {c.isNBC && (
                  <Text style={styles.sponsorTag}>⭐ Sponsor Pick</Text>
                )}
              </View>
              <Text style={styles.tableCell}>
                {c.perTrade > 0 ? `$${c.perTrade.toFixed(2)}` : "Free"}
              </Text>
              <Text style={styles.tableCell}>
                {c.monthlyFee > 0 ? `$${c.monthlyFee.toFixed(2)}` : "—"}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellBold]}>
                ${c.estimatedAnnualCost.toLocaleString()}
              </Text>
            </View>
          ))}
      </View>

      {/* NBC Sponsor Card */}
      {comparisons.find((c) => c.isNBC) && (
        <View style={styles.nbcCard}>
          <Text style={styles.nbcTitle}>🏦 NBC Direct Brokerage</Text>
          <Text style={styles.nbcText}>
            {comparisons.find((c) => c.isNBC)?.highlight ||
              "Consider National Bank Direct Brokerage for competitive pricing on high-volume trading."}
          </Text>
          {coachFit && (
            <Text style={styles.nbcCoachText}>
              {coachFit}
            </Text>
          )}
        </View>
      )}

      {/* Customize Assumptions */}
      <PrimaryButton
        title={showCustomize ? "Hide Assumptions" : "Customize Assumptions"}
        variant="outline"
        onPress={() => setShowCustomize(!showCustomize)}
        style={{ marginTop: Spacing.md }}
      />

      {showCustomize && (
        <View style={styles.customizeCard}>
          <Text style={styles.customizeText}>
            The estimates above assume {estimatedAnnualTrades.toLocaleString()} trades/year
            based on your {metrics?.tradesPerDayAvg} trades/day average across 252 trading days.
            {"\n\n"}
            Fees shown are mock values for demo purposes. Actual brokerage fees vary by account type,
            trade size, and market. Always verify with the brokerage directly.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },

  metricsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md },

  savingsCard: {
    backgroundColor: Colors.secondary + "15",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  savingsIcon: { fontSize: 28 },
  savingsText: { ...Typography.body, color: Colors.secondary, flex: 1, fontWeight: "600", lineHeight: 22 },

  table: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderCell: { ...Typography.label, flex: 1, fontSize: 10 },
  tableRow: {
    flexDirection: "row",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: "center",
  },
  tableRowHighlight: { backgroundColor: Colors.primary + "08" },
  tableCell: { ...Typography.bodySmall, flex: 1 },
  tableCellHighlight: { color: Colors.primaryLight, fontWeight: "600" },
  tableCellBold: { fontWeight: "700" },
  sponsorTag: { ...Typography.caption, color: Colors.warning, marginTop: 2 },

  nbcCard: {
    backgroundColor: Colors.primary + "15",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    gap: Spacing.sm,
  },
  nbcTitle: { ...Typography.h3 },
  nbcText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  nbcCoachText: { ...Typography.bodySmall, color: Colors.primaryLight, fontStyle: "italic", lineHeight: 20 },

  customizeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customizeText: { ...Typography.bodySmall, lineHeight: 20 },
});
