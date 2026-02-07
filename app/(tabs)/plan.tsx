import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import { useApp } from "@/src/context/AppContext";
import PrimaryButton from "@/src/components/PrimaryButton";
import SeverityBadge from "@/src/components/SeverityBadge";

export default function PlanScreen() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { coachOutput, restMode } = state;
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [cooldownMinutes, setCooldownMinutes] = useState(30);
  const [reflectionText, setReflectionText] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rest mode timer
  useEffect(() => {
    if (restMode.active && restMode.endsAt) {
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, restMode.endsAt! - Date.now());
        setTimeLeft(remaining);
        if (remaining <= 0) {
          dispatch({ type: "TOGGLE_REST_MODE", payload: { active: false, endsAt: null } });
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restMode.active]);

  const startRestMode = () => {
    const endsAt = Date.now() + cooldownMinutes * 60 * 1000;
    dispatch({ type: "TOGGLE_REST_MODE", payload: { active: true, endsAt } });
  };

  const stopRestMode = () => {
    if (!reflectionText.trim()) {
      Alert.alert(
        "Reflection Required",
        "Please write a brief reflection on why you want to end rest mode early."
      );
      return;
    }
    dispatch({ type: "TOGGLE_REST_MODE", payload: { active: false, endsAt: null } });
    setReflectionText("");
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const openScreenTime = () => {
    if (Platform.OS === "ios") {
      Linking.openSettings();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Rest Mode Section */}
      {restMode.active ? (
        <View style={styles.restModeActive}>
          <Text style={styles.restModeIcon}>🛑</Text>
          <Text style={styles.restModeTitle}>Rest Mode Active</Text>
          <Text style={styles.restModeTimer}>
            {timeLeft != null ? formatTime(timeLeft) : "..."}
          </Text>
          <Text style={styles.restModeScript}>
            {coachOutput?.restModePlan?.script ||
              "Step away from trading. Take deep breaths. Review your plan."}
          </Text>

          <View style={styles.reflectionBox}>
            <Text style={styles.reflectionLabel}>
              To end rest mode early, write a reflection:
            </Text>
            <TextInput
              style={styles.reflectionInput}
              placeholder="Why do I want to return to trading? Am I calm?"
              placeholderTextColor={Colors.textMuted}
              value={reflectionText}
              onChangeText={setReflectionText}
              multiline
              numberOfLines={3}
            />
            <PrimaryButton
              title="End Rest Mode"
              variant="outline"
              onPress={stopRestMode}
            />
          </View>
        </View>
      ) : (
        <View style={styles.restModeSetup}>
          <Text style={styles.sectionTitle}>🛡️ Rest Mode</Text>
          <Text style={styles.sectionDesc}>
            Activate a cooldown period to prevent impulsive trading
          </Text>
          <View style={styles.cooldownSelector}>
            {[15, 30, 60, 120].map((min) => (
              <PrimaryButton
                key={min}
                title={min < 60 ? `${min}m` : `${min / 60}h`}
                variant={cooldownMinutes === min ? "primary" : "outline"}
                onPress={() => setCooldownMinutes(min)}
                style={styles.cooldownBtn}
              />
            ))}
          </View>
          <PrimaryButton
            title={`Start Rest Mode (${cooldownMinutes} min)`}
            variant="danger"
            onPress={startRestMode}
          />

          {/* OS Guidance */}
          <View style={styles.osGuide}>
            <Text style={styles.osGuideTitle}>
              📱 Block Trading Apps on Your Device
            </Text>
            <Text style={styles.osGuideText}>
              {Platform.OS === "ios"
                ? "Go to Settings → Screen Time → App Limits to set time limits on trading apps."
                : "Go to Settings → Digital Wellbeing → Focus Mode to pause trading apps."}
            </Text>
            <PrimaryButton
              title="Open Device Settings"
              variant="outline"
              onPress={openScreenTime}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </View>
      )}

      {/* Personalized Rules */}
      {coachOutput?.biasCards && (
        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>📋 Personalized Rules</Text>
          {coachOutput.biasCards.map((card) => (
            <View key={card.bias} style={styles.biasRulesGroup}>
              <View style={styles.biasRulesHeader}>
                <Text style={styles.biasRulesTitle}>{card.bias.replace(/_/g, " ")}</Text>
                <SeverityBadge severity={card.severity as any} />
              </View>
              {card.rules.map((rule, i) => {
                const key = `${card.bias}-${i}`;
                return (
                  <View key={key} style={styles.ruleRow}>
                    <View style={styles.ruleTextCol}>
                      <Text style={styles.ruleTitle}>{rule.title}</Text>
                      <Text style={styles.ruleDetails}>{rule.details}</Text>
                    </View>
                    <Switch
                      value={toggles[key] ?? false}
                      onValueChange={(val) =>
                        setToggles((prev) => ({ ...prev, [key]: val }))
                      }
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor={Colors.white}
                    />
                  </View>
                );
              })}
              <View style={styles.microHabitBox}>
                <Text style={styles.microHabitLabel}>🌱 Micro-Habit</Text>
                <Text style={styles.microHabitText}>{card.microHabit}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Journal Prompt */}
      <View style={styles.journalCard}>
        <Text style={styles.sectionTitle}>📝 Journal Prompt</Text>
        <Text style={styles.sectionDesc}>
          Reflect on a recent trade or bias moment to build awareness.
        </Text>
        <PrimaryButton
          title="Open Journal"
          variant="outline"
          onPress={() =>
            router.push({
              pathname: "/journal",
              params: {
                prompt:
                  "What triggered your most recent impulsive trade, and how will you respond next time?",
              },
            })
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  // Rest Mode
  restModeActive: {
    backgroundColor: Colors.danger + "15",
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.danger + "40",
    marginBottom: Spacing.xl,
  },
  restModeIcon: { fontSize: 48 },
  restModeTitle: { ...Typography.h2, color: Colors.danger, marginTop: Spacing.sm },
  restModeTimer: { fontSize: 48, fontWeight: "900", color: Colors.textPrimary, marginVertical: Spacing.md },
  restModeScript: { ...Typography.body, color: Colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: Spacing.lg },

  restModeSetup: { marginBottom: Spacing.xl, gap: Spacing.md },
  cooldownSelector: { flexDirection: "row", gap: Spacing.sm },
  cooldownBtn: { flex: 1, paddingHorizontal: Spacing.sm },

  osGuide: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  osGuideTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  osGuideText: { ...Typography.bodySmall, lineHeight: 20 },

  // Reflection
  reflectionBox: { width: "100%", gap: Spacing.md, marginTop: Spacing.md },
  reflectionLabel: { ...Typography.bodySmall, textAlign: "center" },
  reflectionInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Rules
  rulesSection: { gap: Spacing.md },
  sectionTitle: { ...Typography.h2, marginBottom: Spacing.sm },
  sectionDesc: { ...Typography.bodySmall, marginBottom: Spacing.sm },
  biasRulesGroup: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadows.card,
  },
  biasRulesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  biasRulesTitle: { ...Typography.h3 },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ruleTextCol: { flex: 1 },
  ruleTitle: { ...Typography.body, fontWeight: "600" },
  ruleDetails: { ...Typography.bodySmall, marginTop: 2 },
  microHabitBox: {
    backgroundColor: Colors.secondary + "10",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.secondary + "30",
  },
  microHabitLabel: { ...Typography.label, color: Colors.secondary, marginBottom: Spacing.xs },
  microHabitText: { ...Typography.bodySmall, lineHeight: 20 },

  journalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
});
