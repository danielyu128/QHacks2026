import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Colors, Spacing, Radius, Typography, Shadows, SeverityColors } from "@/src/lib/theme";
import { useApp } from "@/src/context/AppContext";
import SeverityBadge from "@/src/components/SeverityBadge";
import DisclaimerBanner from "@/src/components/DisclaimerBanner";

export default function SaferScreen() {
  const { state } = useApp();
  const { riskProfile } = state;

  if (!riskProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyText}>
            Risk profile will appear after analysis.
          </Text>
        </View>
      </View>
    );
  }

  const riskColor = SeverityColors[riskProfile.level] || Colors.textSecondary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <DisclaimerBanner text="Educational only — not financial advice. Consult a licensed advisor before making investment decisions." />

      {/* Risk Profile */}
      <View style={[styles.riskCard, { borderColor: riskColor + "40" }]}>
        <Text style={styles.riskLabel}>Your Behavioral Risk Profile</Text>
        <View style={styles.riskBadgeRow}>
          <View style={[styles.riskCircle, { backgroundColor: riskColor + "20", borderColor: riskColor }]}>
            <Text style={[styles.riskLevel, { color: riskColor }]}>{riskProfile.level}</Text>
          </View>
          <View style={styles.riskMeta}>
            <Text style={styles.riskTrend}>
              P&L Trend: <Text style={{ fontWeight: "700" }}>{riskProfile.pnlTrend}</Text>
            </Text>
          </View>
        </View>

        {riskProfile.reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            {riskProfile.reasons.map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <Text style={styles.reasonBullet}>•</Text>
                <Text style={styles.reasonText}>{r}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Why Diversify */}
      {riskProfile.level !== "LOW" && (
        <View style={styles.whyCard}>
          <Text style={styles.whyTitle}>Why Consider Safer Alternatives?</Text>
          <Text style={styles.whyText}>
            {riskProfile.level === "HIGH"
              ? "You trade frequently and your outcomes are volatile. Diversified ETFs can reduce decision fatigue, limit emotional trading, and provide steady long-term growth."
              : "Your trading patterns show moderate risk. Allocating a portion to diversified ETFs can provide stability alongside your active trading."}
          </Text>
        </View>
      )}

      {/* ETF Recommendations */}
      <Text style={styles.sectionTitle}>Recommended ETFs</Text>

      {/* Sponsor Picks */}
      {riskProfile.recommendations.filter((e) => e.isSponsorPick).length > 0 && (
        <>
          <Text style={styles.subSectionTitle}>⭐ Sponsor Picks</Text>
          {riskProfile.recommendations
            .filter((e) => e.isSponsorPick)
            .map((etf, i) => (
              <View key={i} style={[styles.etfCard, styles.etfCardSponsor]}>
                <View style={styles.etfHeader}>
                  <Text style={styles.etfTicker}>{etf.ticker}</Text>
                  <View style={styles.sponsorBadge}>
                    <Text style={styles.sponsorBadgeText}>NBC</Text>
                  </View>
                </View>
                <Text style={styles.etfName}>{etf.name}</Text>
                <Text style={styles.etfDesc}>{etf.description}</Text>
              </View>
            ))}
        </>
      )}

      {/* Other ETFs */}
      <Text style={styles.subSectionTitle}>Other Options</Text>
      {riskProfile.recommendations
        .filter((e) => !e.isSponsorPick)
        .map((etf, i) => (
          <View key={i} style={styles.etfCard}>
            <View style={styles.etfHeader}>
              <Text style={styles.etfTicker}>{etf.ticker}</Text>
            </View>
            <Text style={styles.etfName}>{etf.name}</Text>
            <Text style={styles.etfDesc}>{etf.description}</Text>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...Typography.body, color: Colors.textMuted },

  riskCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    borderWidth: 1,
    ...Shadows.card,
  },
  riskLabel: { ...Typography.label, marginBottom: Spacing.md },
  riskBadgeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.lg },
  riskCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  riskLevel: { fontSize: 16, fontWeight: "900" },
  riskMeta: { flex: 1 },
  riskTrend: { ...Typography.body },
  reasonsContainer: { marginTop: Spacing.lg, gap: Spacing.xs },
  reasonRow: { flexDirection: "row", gap: Spacing.sm },
  reasonBullet: { ...Typography.bodySmall, color: Colors.textMuted },
  reasonText: { ...Typography.bodySmall, flex: 1, lineHeight: 20 },

  whyCard: {
    backgroundColor: Colors.warning + "10",
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  whyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  whyText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },

  sectionTitle: { ...Typography.h2, marginTop: Spacing.xl, marginBottom: Spacing.md },
  subSectionTitle: { ...Typography.label, color: Colors.warning, marginBottom: Spacing.sm, marginTop: Spacing.md },

  etfCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  etfCardSponsor: { borderColor: Colors.primary + "40" },
  etfHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  etfTicker: { ...Typography.h3, color: Colors.primaryLight },
  sponsorBadge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  sponsorBadgeText: { ...Typography.caption, color: Colors.primaryLight, fontWeight: "700" },
  etfName: { ...Typography.body, fontWeight: "600", marginBottom: Spacing.xs },
  etfDesc: { ...Typography.bodySmall, lineHeight: 20 },
});
