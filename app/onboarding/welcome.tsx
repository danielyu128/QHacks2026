import PrimaryButton from "@/src/components/PrimaryButton";
import { Colors, Spacing, Typography } from "@/src/lib/theme";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.title}>Bias Detector</Text>
          <Text style={styles.subtitle}>+ Trading Coach</Text>
          <Text style={styles.tagline}>
            Detect overtrading, loss aversion & revenge trading. Get
            personalized interventions.
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <PrimaryButton
            title="Link Partner Bank (Demo)"
            onPress={() => router.push("/onboarding/partnerSelect")}
          />
          <PrimaryButton
            title="Continue as Guest"
            variant="outline"
            onPress={() => router.replace("/import")}
          />
        </View>

        <Text style={styles.disclaimer}>
          QHacks 2026 — National Bank Challenge
        </Text>
      </View>
    </SafeAreaView>
  );
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
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.h2,
    color: Colors.primaryLight,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  disclaimer: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
});
