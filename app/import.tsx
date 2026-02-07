import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import { useApp } from "@/src/context/AppContext";
import { parseTrades } from "@/src/lib/csv";
import { SAMPLE_TRADES } from "@/src/lib/sampleData";

export default function ImportScreen() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [loading, setLoading] = useState(false);

  const handleUseSampleData = () => {
    dispatch({ type: "SET_TRADES", payload: SAMPLE_TRADES });
    router.push("/analyzing");
  };

  const handleUploadCSV = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/octet-stream"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      const csvString = await FileSystem.readAsStringAsync(file.uri);
      const trades = parseTrades(csvString);

      if (trades.length === 0) {
        Alert.alert("No Trades", "The CSV file contained no valid trades.");
        setLoading(false);
        return;
      }

      dispatch({ type: "SET_TRADES", payload: trades });
      router.push("/analyzing");
    } catch (error: any) {
      Alert.alert("Import Error", error.message || "Failed to parse CSV file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Import Your Trades</Text>
          <Text style={styles.subtitle}>
            Upload a CSV file or use our sample dataset for a quick demo
          </Text>
        </View>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardIcon}>📁</Text>
            <Text style={styles.cardTitle}>Upload CSV</Text>
            <Text style={styles.cardDesc}>
              Required columns: timestamp, side, asset, pnl{"\n"}
              Optional: qty, position_size, hold_minutes
            </Text>
            <PrimaryButton
              title="Choose File"
              onPress={handleUploadCSV}
              loading={loading}
              variant="outline"
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={[styles.card, styles.highlightCard]}>
            <Text style={styles.cardIcon}>🚀</Text>
            <Text style={styles.cardTitle}>Use Sample Dataset</Text>
            <Text style={styles.cardDesc}>
              Pre-loaded with ~{SAMPLE_TRADES.length} trades across 5 days.{"\n"}
              Demonstrates all bias detection features.
            </Text>
            <PrimaryButton
              title="Load Sample Data"
              onPress={handleUseSampleData}
            />
          </View>
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
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
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
  cards: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: Spacing.md,
    ...Shadows.card,
  },
  highlightCard: {
    borderColor: Colors.primary + "60",
  },
  cardIcon: {
    fontSize: 36,
  },
  cardTitle: {
    ...Typography.h3,
  },
  cardDesc: {
    ...Typography.bodySmall,
    textAlign: "center",
    lineHeight: 20,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.label,
    color: Colors.textMuted,
  },
});
