import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Radius, Typography } from "@/src/lib/theme";

type Props = {
  text: string;
};

export default function DisclaimerBanner({ text }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    backgroundColor: Colors.warning + "15",
    borderWidth: 1,
    borderColor: Colors.warning + "40",
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  icon: {
    fontSize: 16,
  },
  text: {
    ...Typography.caption,
    color: Colors.warning,
    flex: 1,
    lineHeight: 16,
  },
});
