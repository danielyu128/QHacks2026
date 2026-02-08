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
          <Text style={styles.title}>financia</Text>
          <Text style={styles.subtitle}>
            Bias Detector for smarter trading habits
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <PrimaryButton
            title="Connect Trading Platform"
            onPress={() => router.push("/onboarding/partnerSelect")}
          />
          <PrimaryButton
            title="Use Sample Data"
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
    letterSpacing: 1,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
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
