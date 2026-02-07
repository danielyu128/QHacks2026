import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography } from "@/src/lib/theme";

type Props = {
  label?: string;
  onPress?: () => void;
  fallbackHref?: string;
};

export default function BackButton({ label = "Back", onPress, fallbackHref = "/onboarding/welcome" }: Props) {
  const router = useRouter();
  const canGoBack = typeof router.canGoBack === "function" ? router.canGoBack() : false;
  return (
    <TouchableOpacity
      onPress={
        onPress ||
        (() => {
          if (canGoBack) {
            router.back();
          } else if (fallbackHref) {
            router.replace(fallbackHref);
          }
        })
      }
      style={styles.button}
      accessibilityRole="button"
    >
      <Text style={styles.text}>← {label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.sm,
    alignSelf: "flex-start",
  },
  text: {
    ...Typography.bodySmall,
    color: Colors.primaryLight,
  },
});
