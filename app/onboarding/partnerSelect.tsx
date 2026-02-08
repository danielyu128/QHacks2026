import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageSourcePropType } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import DisclaimerBanner from "@/src/components/DisclaimerBanner";
import BackButton from "@/src/components/BackButton";

const PLATFORM_LOGOS: Record<string, ImageSourcePropType> = {
  Wealthsimple: require("@/assets/images/logos/wealthsimple.png"),
  Questrade: require("@/assets/images/logos/questrade.png"),
  TD: require("@/assets/images/logos/td.png"),
  RBC: require("@/assets/images/logos/rbc.png"),
  BMO: require("@/assets/images/logos/bmo.png"),
  Scotia: require("@/assets/images/logos/scotia.png"),
  CIBC: require("@/assets/images/logos/cibc.png"),
  NBC: require("@/assets/images/logos/nbc.png"),
};

const PLATFORMS = [
  { id: "Wealthsimple", label: "Wealthsimple", color: "#512DA8" },
  { id: "Questrade", label: "Questrade", color: "#2C8F2C" },
  { id: "TD", label: "TD", color: "#00A651" },
  { id: "RBC", label: "RBC", color: "#005DAA" },
  { id: "BMO", label: "BMO", color: "#0075BE" },
  { id: "Scotia", label: "Scotia", color: "#EC111A" },
  { id: "CIBC", label: "CIBC", color: "#C41F3E" },
  { id: "NBC", label: "NBC", color: "#E31837" },
];

export default function PartnerSelectScreen() {
  const router = useRouter();

  const handleSelect = (platformId: string) => {
    router.push({
      pathname: "/onboarding/fakeLogin",
      params: { bank: platformId },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackButton />
        <Text style={styles.title}>Select Your Platform</Text>
        <Text style={styles.subtitle}>
          Choose your brokerage to link (demo simulation)
        </Text>

        <DisclaimerBanner text="Demo simulation only — do not enter real banking credentials." />

        <View style={styles.grid}>
          {PLATFORMS.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[styles.platformCard, { borderColor: platform.color + "60" }]}
              onPress={() => handleSelect(platform.id)}
              activeOpacity={0.7}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={PLATFORM_LOGOS[platform.id]}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.platformLabel}>{platform.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
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
  platformCard: {
    width: "45%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.card,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  platformLabel: {
    ...Typography.h3,
  },
});
