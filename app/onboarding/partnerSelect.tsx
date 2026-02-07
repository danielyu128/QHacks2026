import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import DisclaimerBanner from "@/src/components/DisclaimerBanner";
import BackButton from "@/src/components/BackButton";

const BANKS = [
  { id: "TD", label: "TD", color: "#00A651" },
  { id: "RBC", label: "RBC", color: "#005DAA" },
  { id: "BMO", label: "BMO", color: "#0075BE" },
  { id: "Scotia", label: "Scotia", color: "#EC111A" },
  { id: "CIBC", label: "CIBC", color: "#C41F3E" },
  { id: "NBC", label: "NBC", color: "#E31837" },
];

export default function PartnerSelectScreen() {
  const router = useRouter();

  const handleSelect = (bankId: string) => {
    router.push({
      pathname: "/onboarding/fakeLogin",
      params: { bank: bankId },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <BackButton />
        <Text style={styles.title}>Select Partner Bank</Text>
        <Text style={styles.subtitle}>
          Choose your brokerage to link (demo simulation)
        </Text>

        <DisclaimerBanner text="Simulation for hackathon demo only. Do not enter real banking credentials." />

        <View style={styles.grid}>
          {BANKS.map((bank) => (
            <TouchableOpacity
              key={bank.id}
              style={[styles.bankCard, { borderColor: bank.color + "60" }]}
              onPress={() => handleSelect(bank.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.bankIcon, { backgroundColor: bank.color + "20" }]}>
                <Text style={[styles.bankInitial, { color: bank.color }]}>
                  {bank.label.charAt(0)}
                </Text>
              </View>
              <Text style={styles.bankLabel}>{bank.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    gap: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  bankCard: {
    width: "45%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.card,
  },
  bankIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  bankInitial: {
    fontSize: 24,
    fontWeight: "800",
  },
  bankLabel: {
    ...Typography.h3,
  },
});
