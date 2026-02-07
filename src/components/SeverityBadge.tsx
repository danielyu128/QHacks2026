import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SeverityColors, Colors, Spacing, Radius, Typography } from "@/src/lib/theme";
import { Severity } from "@/src/lib/types";

type Props = {
  severity: Severity;
};

export default function SeverityBadge({ severity }: Props) {
  const color = SeverityColors[severity] || Colors.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{severity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: "700",
  },
});
