import PrimaryButton from "@/src/components/PrimaryButton";
import { addJournalEntry, loadJournalEntries, deleteJournalEntry } from "@/src/lib/journal";
import { Colors, Radius, Spacing, Typography } from "@/src/lib/theme";
import { JournalEntry } from "@/src/lib/types";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function JournalTab() {
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
      text: text.trim(),
    };
    const next = await addJournalEntry(entry);
    setEntries(next);
    setText("");
    setLoading(false);
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert("Delete entry?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const next = await deleteJournalEntry(entry.id);
          setEntries(next);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>New Entry</Text>
        <TextInput
          style={styles.input}
          placeholder="What happened? What were you feeling?"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={4}
        />
        <PrimaryButton title="Save Entry" onPress={handleSave} loading={loading} />
      </View>

      <Text style={styles.sectionTitle}>Recent Entries</Text>
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>
            No journal entries yet. Start reflecting on your trades.
          </Text>
        </View>
      ) : (
        entries.slice(0, 20).map((e) => (
          <View key={e.id} style={styles.entryCard}>
            <View style={styles.entryContent}>
              <Text style={styles.entryMeta}>
                {new Date(e.createdAt).toLocaleString()}
                {e.bias ? ` · ${e.bias}` : ""}
              </Text>
              <Text style={styles.entryText}>{e.text}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(e)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sectionTitle: { ...Typography.h3 },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
    ...Typography.body,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: "center" },
  entryCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  entryContent: { flex: 1 },
  entryMeta: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  entryText: { ...Typography.bodySmall, lineHeight: 20 },
  deleteBtn: { padding: Spacing.xs, alignSelf: "flex-start" },
  deleteIcon: { fontSize: 16 },
});
