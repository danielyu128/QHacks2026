import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Share,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/src/context/AppContext";
import { useTheme } from "@/src/context/ThemeContext";
import { Spacing, Radius, Typography, SeverityColors } from "@/src/lib/theme";
import { computeOverallRiskScore } from "@/src/lib/biases";
import { Severity } from "@/src/lib/types";

const RULES_KEY = "financia_rules_toggles";
const AI_COACHING_KEY = "financia_ai_coaching";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useApp();
  const { colors, isDark, toggleTheme } = useTheme();
  const { biasResults, coachOutput, metrics, linkedPartnerBank } = state;

  const [ruleToggles, setRuleToggles] = useState<Record<string, boolean>>({});
  const [aiCoaching, setAiCoaching] = useState(true);

  // Load persisted settings
  useEffect(() => {
    AsyncStorage.getItem(RULES_KEY).then((val) => {
      if (val) setRuleToggles(JSON.parse(val));
    });
    AsyncStorage.getItem(AI_COACHING_KEY).then((val) => {
      if (val !== null) setAiCoaching(val === "true");
    });
  }, []);

  const toggleRule = useCallback(
    (key: string, value: boolean) => {
      const next = { ...ruleToggles, [key]: value };
      setRuleToggles(next);
      AsyncStorage.setItem(RULES_KEY, JSON.stringify(next));
    },
    [ruleToggles]
  );

  const toggleAiCoaching = useCallback(
    (value: boolean) => {
      setAiCoaching(value);
      AsyncStorage.setItem(AI_COACHING_KEY, value ? "true" : "false");
    },
    []
  );

  // Risk score
  const riskScore =
    coachOutput?.overallRiskScore ?? computeOverallRiskScore(biasResults);
  const scoreColor =
    riskScore >= 70
      ? colors.danger
      : riskScore >= 40
        ? colors.warning
        : colors.secondary;

  // Collect all rules from coach output
  const allRules: { key: string; title: string; details: string }[] = [];
  if (coachOutput?.biasCards) {
    for (const card of coachOutput.biasCards) {
      for (let i = 0; i < card.rules.length; i++) {
        allRules.push({
          key: `${card.bias}-${i}`,
          title: card.rules[i].title,
          details: card.rules[i].details,
        });
      }
    }
  }
  // Add rest mode rule
  if (coachOutput?.restModePlan) {
    allRules.push({
      key: "rest-mode-trigger",
      title: "Rest Mode Trigger",
      details: coachOutput.restModePlan.triggerRule,
    });
  }

  const handleExport = async () => {
    const biasLines = biasResults
      .filter((b) => b.severity !== "LOW")
      .map((b) => `${b.bias.replace(/_/g, " ")} ${b.severity}`)
      .join(", ");
    const cooldown = coachOutput?.restModePlan?.recommendedCooldownMinutes ?? 30;
    const text = [
      `financia summary`,
      `Risk score: ${riskScore}/100`,
      biasLines ? `Biases: ${biasLines}` : "No significant biases detected",
      metrics ? `Trades/day avg: ${metrics.tradesPerDayAvg}` : "",
      metrics ? `Win rate: ${(metrics.winRate * 100).toFixed(0)}%` : "",
      `Recommended cooldown: ${cooldown}m`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await Share.share({ message: text });
    } catch {
      // User cancelled
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out?", "You'll return to the welcome screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          dispatch({ type: "RESET" });
          router.replace("/onboarding/welcome");
        },
      },
    ]);
  };

  const s = makeStyles(colors);

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[s.content, { paddingBottom: Spacing.xxxl + insets.bottom }]}
    >
      {/* ── Avatar / Header ──────────────────────────────────────────────── */}
      <View style={s.avatarSection}>
        <View style={[s.avatar, { backgroundColor: colors.primary + "30" }]}>
          <Text style={[s.avatarLetter, { color: colors.primaryLight }]}>G</Text>
        </View>
        <Text style={[s.nameText, { color: colors.textPrimary }]}>Guest</Text>
        <Text style={[s.linkedText, { color: colors.textMuted }]}>
          {linkedPartnerBank
            ? `Linked: ${linkedPartnerBank} (Demo)`
            : "No platform linked"}
        </Text>
      </View>

      {/* ── My Trading Tendencies ────────────────────────────────────────── */}
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
          My Trading Tendencies
        </Text>

        <View style={s.tendencyRow}>
          <View style={s.scoreBox}>
            <Text style={[s.scoreValue, { color: scoreColor }]}>{riskScore}</Text>
            <Text style={[s.scoreUnit, { color: colors.textMuted }]}>/100</Text>
          </View>
          <Text style={[s.scoreLabel, { color: colors.textSecondary }]}>
            Bias Risk Score
          </Text>
        </View>

        {biasResults.length > 0 && (
          <View style={s.badgeRow}>
            {biasResults.map((b) => {
              const badgeColor = SeverityColors[b.severity] || colors.textMuted;
              return (
                <View
                  key={b.bias}
                  style={[
                    s.biasBadge,
                    { backgroundColor: badgeColor + "18", borderColor: badgeColor },
                  ]}
                >
                  <Text style={[s.biasBadgeText, { color: badgeColor }]}>
                    {b.bias.replace(/_/g, " ")} · {b.severity}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {metrics && (
          <View style={s.statRow}>
            <StatItem
              label="Trades/day"
              value={String(metrics.tradesPerDayAvg)}
              colors={colors}
            />
            <StatItem
              label="Win rate"
              value={`${(metrics.winRate * 100).toFixed(0)}%`}
              colors={colors}
            />
            {metrics.worstHours.length > 0 && (
              <StatItem
                label="Worst hour"
                value={metrics.worstHours[0]}
                colors={colors}
              />
            )}
          </View>
        )}
      </View>

      {/* ── My Rules ─────────────────────────────────────────────────────── */}
      {allRules.length > 0 && (
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>My Rules</Text>
          {allRules.map((rule) => (
            <View
              key={rule.key}
              style={[s.ruleRow, { borderBottomColor: colors.border }]}
            >
              <View style={s.ruleText}>
                <Text style={[s.ruleTitle, { color: colors.textPrimary }]}>
                  {rule.title}
                </Text>
                <Text style={[s.ruleDetails, { color: colors.textSecondary }]}>
                  {rule.details}
                </Text>
              </View>
              <Switch
                value={ruleToggles[rule.key] ?? false}
                onValueChange={(v) => toggleRule(rule.key, v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </View>
      )}

      {/* ── Settings ─────────────────────────────────────────────────────── */}
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Settings</Text>

        <View style={[s.settingRow, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[s.settingLabel, { color: colors.textPrimary }]}>Appearance</Text>
            <Text style={[s.settingHint, { color: colors.textMuted }]}>
              {isDark ? "Dark" : "Light"}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* ── Data & Privacy ───────────────────────────────────────────────── */}
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
          Data & Privacy
        </Text>
        <Text style={[s.privacyCopy, { color: colors.textSecondary }]}>
          Your trades are processed on-device. Only aggregated metrics are sent
          to coaching if enabled.
        </Text>
        <View style={[s.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[s.settingLabel, { color: colors.textPrimary }]}>
            Allow AI coaching
          </Text>
          <Switch
            value={aiCoaching}
            onValueChange={toggleAiCoaching}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* ── Export ────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[s.exportBtn, { borderColor: colors.border }]}
        onPress={handleExport}
        activeOpacity={0.7}
      >
        <Text style={[s.exportBtnText, { color: colors.primaryLight }]}>
          Export Summary
        </Text>
      </TouchableOpacity>

      {/* ── Logout ───────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[s.logoutBtn, { borderColor: colors.danger + "40" }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={[s.logoutBtnText, { color: colors.danger }]}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Small stat sub-component ────────────────────────────────────────────────

function StatItem({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ── Styles (parameterized by color palette) ─────────────────────────────────

function makeStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg, gap: Spacing.lg },

    // Avatar
    avatarSection: { alignItems: "center", paddingVertical: Spacing.xl },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    avatarLetter: { fontSize: 28, fontWeight: "700" },
    nameText: { ...Typography.h2 },
    linkedText: { fontSize: 13, marginTop: Spacing.xs },

    // Card
    card: {
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      gap: Spacing.md,
    },
    sectionTitle: { ...Typography.h3 },

    // Tendencies
    tendencyRow: { alignItems: "center", gap: Spacing.xs },
    scoreBox: { flexDirection: "row", alignItems: "baseline" },
    scoreValue: { fontSize: 42, fontWeight: "900" },
    scoreUnit: { fontSize: 18, fontWeight: "600", marginLeft: 2 },
    scoreLabel: { fontSize: 13 },

    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
    biasBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    biasBadgeText: { fontSize: 11, fontWeight: "700" },

    statRow: {
      flexDirection: "row",
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    // Rules
    ruleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
    },
    ruleText: { flex: 1 },
    ruleTitle: { fontSize: 14, fontWeight: "600" },
    ruleDetails: { fontSize: 12, marginTop: 2, lineHeight: 18 },

    // Settings
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
    },
    settingLabel: { fontSize: 15, fontWeight: "500" },
    settingHint: { fontSize: 12, marginTop: 2 },

    // Privacy
    privacyCopy: { fontSize: 13, lineHeight: 20 },

    // Export
    exportBtn: {
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: "center",
    },
    exportBtnText: { fontSize: 15, fontWeight: "600" },

    // Logout
    logoutBtn: {
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: "center",
    },
    logoutBtnText: { fontSize: 15, fontWeight: "600" },
  });
}
