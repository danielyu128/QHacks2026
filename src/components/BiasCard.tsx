import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import { BiasResult } from "@/src/lib/types";
import SeverityBadge from "./SeverityBadge";

const BIAS_LABELS: Record<string, string> = {
  OVERTRADING: "Overtrading",
  LOSS_AVERSION: "Loss Aversion",
  REVENGE_TRADING: "Revenge Trading",
};

const BIAS_ICONS: Record<string, string> = {
  OVERTRADING: "📊",
  LOSS_AVERSION: "😰",
  REVENGE_TRADING: "🔥",
};

type Props = {
  result: BiasResult;
  onPressCTA?: () => void;
};

export default function BiasCard({ result, onPressCTA }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{BIAS_ICONS[result.bias] || "⚠️"}</Text>
        <Text style={styles.title}>{BIAS_LABELS[result.bias] || result.bias}</Text>
        <SeverityBadge severity={result.severity} />
      </View>

      <View style={styles.evidenceContainer}>
        {result.evidence.map((e, i) => (
          <View key={i} style={styles.evidenceRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.evidenceText}>{e}</Text>
          </View>
        ))}
      </View>

      {onPressCTA && (
        <TouchableOpacity onPress={onPressCTA} style={styles.cta}>
          <Text style={styles.ctaText}>See recommendations →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    ...Typography.h3,
    flex: 1,
  },
  evidenceContainer: {
    gap: Spacing.xs,
  },
  evidenceRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  bullet: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  evidenceText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  cta: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaText: {
    ...Typography.label,
    color: Colors.primaryLight,
  },
});
