import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import { addJournalEntry, loadJournalEntries } from "@/src/lib/journal";
import { JournalEntry } from "@/src/lib/types";

export default function JournalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bias?: string; prompt?: string; tradeId?: string }>();
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJournalEntries().then(setEntries);
  }, []);

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert("Empty Entry", "Write a short reflection before saving.");
      return;
    }
    setLoading(true);
    const entry: JournalEntry = {
      id: `${Date.now()}`,
      createdAt: Date.now(),
      bias: params.bias as any,
      tradeId: params.tradeId,
      prompt: params.prompt,
      text: text.trim(),
    };
    const next = await addJournalEntry(entry);
    setEntries(next);
    setText("");
    setLoading(false);
    Alert.alert("Saved", "Your journal entry was saved.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Journal</Text>
        <Text style={styles.subtitle}>
          Reflect on a bias moment or trade decision. Entries are saved locally.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>New Entry</Text>
          {params.prompt ? (
            <View style={styles.promptBox}>
              <Text style={styles.promptLabel}>Prompt</Text>
              <Text style={styles.promptText}>{params.prompt}</Text>
            </View>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="What happened? What were you feeling? What will you do next time?"
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={5}
          />
          <PrimaryButton title="Save Entry" onPress={handleSave} loading={loading} />
          <PrimaryButton
            title="Back to Insights"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No journal entries yet.</Text>
          ) : (
            entries.slice(0, 10).map((e) => (
              <View key={e.id} style={styles.entryRow}>
                <Text style={styles.entryMeta}>
                  {new Date(e.createdAt).toLocaleString()} {e.bias ? `• ${e.bias}` : ""}
                </Text>
                <Text style={styles.entryText}>{e.text}</Text>
              </View>
            ))
          )}
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
    gap: Spacing.md,
  },
  sectionTitle: { ...Typography.h3 },
  promptBox: {
    backgroundColor: Colors.primary + "10",
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  promptLabel: { ...Typography.label, color: Colors.primaryLight, marginBottom: Spacing.xs },
  promptText: { ...Typography.bodySmall, color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: "top",
    ...Typography.body,
  },
  emptyText: { ...Typography.bodySmall, color: Colors.textMuted },
  entryRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  entryMeta: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  entryText: { ...Typography.bodySmall },
});
