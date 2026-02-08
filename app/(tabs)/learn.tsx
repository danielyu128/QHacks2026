import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import { useApp } from "@/src/context/AppContext";
import PrimaryButton from "@/src/components/PrimaryButton";

export default function LearnScreen() {
  const { state } = useApp();
  const { coachOutput } = state;
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const modules = coachOutput?.literacyModules || [];

  const toggleComplete = (idx: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📚 Financial Literacy</Text>
        <Text style={styles.subtitle}>
          Modules personalized to your detected biases
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width:
                    modules.length > 0
                      ? `${(completed.size / modules.length) * 100}%`
                      : "0%",
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completed.size}/{modules.length} completed
          </Text>
        </View>
      </View>

      {modules.map((mod, i) => {
        const isExpanded = expandedIdx === i;
        const isDone = completed.has(i);
        return (
          <TouchableOpacity
            key={i}
            style={[styles.moduleCard, isDone && styles.moduleCardDone]}
            onPress={() => setExpandedIdx(isExpanded ? null : i)}
            activeOpacity={0.8}
          >
            <View style={styles.moduleHeader}>
              <View style={styles.moduleHeaderLeft}>
                <Text style={styles.moduleIcon}>{isDone ? "✅" : "📖"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Text style={styles.moduleDuration}>~{mod.minutes} min read</Text>
                </View>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</Text>
            </View>

            {isExpanded && (
              <View style={styles.moduleBody}>
                <View style={styles.lessonSection}>
                  <Text style={styles.lessonLabel}>💡 Lesson</Text>
                  <Text style={styles.lessonText}>{mod.lesson}</Text>
                </View>

                <View style={styles.ruleSection}>
                  <Text style={styles.ruleLabel}>📏 One Rule</Text>
                  <Text style={styles.ruleText}>{mod.oneRule}</Text>
                </View>

                <View style={styles.reflectionSection}>
                  <Text style={styles.reflectionLabel}>🤔 Reflection</Text>
                  <Text style={styles.reflectionText}>
                    {mod.reflectionQuestion}
                  </Text>
                </View>

                <View style={styles.challengeSection}>
                  <Text style={styles.challengeLabel}>🏆 Mini-Challenge</Text>
                  <Text style={styles.challengeText}>{mod.miniChallenge}</Text>
                </View>

                <PrimaryButton
                  title={isDone ? "Mark Incomplete" : "Mark Complete"}
                  variant={isDone ? "outline" : "secondary"}
                  onPress={() => toggleComplete(i)}
                />
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {modules.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>
            Modules will appear after analysis is complete.
          </Text>
        </View>
      )}

      {/* Roadmap */}
      <View style={styles.roadmapCard}>
        <Text style={styles.roadmapTitle}>Roadmap</Text>
        <Text style={styles.roadmapText}>
          • More bias types (richer trade labels + notes){"\n"}
          • Portfolio optimization (holdings + risk targets){"\n"}
          • Sentiment analysis of trader notes{"\n"}
          • Predictive bias trigger model{"\n"}
          • Stress/emotional tagging (check-ins)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  header: { marginBottom: Spacing.xl },
  title: { ...Typography.h1, marginBottom: Spacing.xs },
  subtitle: { ...Typography.bodySmall, marginBottom: Spacing.md },
  progressRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  progressBarBg: { flex: 1, height: 6, backgroundColor: Colors.surface, borderRadius: 3 },
  progressBarFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 3 },
  progressText: { ...Typography.caption },

  moduleCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  moduleCardDone: { borderColor: Colors.secondary + "40" },
  moduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  moduleHeaderLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md, flex: 1 },
  moduleIcon: { fontSize: 24 },
  moduleTitle: { ...Typography.h3 },
  moduleDuration: { ...Typography.caption },
  expandIcon: { color: Colors.textMuted, fontSize: 14 },

  moduleBody: { marginTop: Spacing.lg, gap: Spacing.md },

  lessonSection: { gap: Spacing.xs },
  lessonLabel: { ...Typography.label, color: Colors.primaryLight },
  lessonText: { ...Typography.body, lineHeight: 22, color: Colors.textSecondary },

  ruleSection: {
    backgroundColor: Colors.primary + "10",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  ruleLabel: { ...Typography.label, color: Colors.primaryLight, marginBottom: Spacing.xs },
  ruleText: { ...Typography.body, fontWeight: "600" },

  reflectionSection: { gap: Spacing.xs },
  reflectionLabel: { ...Typography.label, color: Colors.warning },
  reflectionText: { ...Typography.body, color: Colors.textSecondary, fontStyle: "italic", lineHeight: 22 },

  challengeSection: {
    backgroundColor: Colors.secondary + "10",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  challengeLabel: { ...Typography.label, color: Colors.secondary, marginBottom: Spacing.xs },
  challengeText: { ...Typography.body, lineHeight: 22 },

  emptyState: { alignItems: "center", marginTop: Spacing.xxxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...Typography.body, color: Colors.textMuted },

  roadmapCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  roadmapTitle: { ...Typography.h3 },
  roadmapText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
});
