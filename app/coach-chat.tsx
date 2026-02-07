import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import BackButton from "@/src/components/BackButton";

export default function CoachChatPlaceholder() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <Text style={styles.title}>Coach Chat (Coming Soon)</Text>
        <Text style={styles.subtitle}>
          We currently generate coaching insights from metrics only. A chat experience
          will require new backend capabilities.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What’s Needed</Text>
          <Text style={styles.bodyText}>
            • A message-based endpoint (e.g., `POST /api/coach/chat`){"\n"}
            • Conversation memory (local + server){"\n"}
            • Optional trade-level context attachment{"\n"}
            • Safety filters + rate limits
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Planned UX</Text>
          <Text style={styles.bodyText}>
            • Ask follow-up questions about a specific bias{"\n"}
            • Suggest next actions based on your journal entries{"\n"}
            • Provide a daily check-in and reflection prompts
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  title: { ...Typography.h1, textAlign: "center" },
  subtitle: { ...Typography.bodySmall, textAlign: "center", color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  bodyText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
});
