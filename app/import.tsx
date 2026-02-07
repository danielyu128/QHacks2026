import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import BackButton from "@/src/components/BackButton";
import { useApp } from "@/src/context/AppContext";
import { parseTrades } from "@/src/lib/csv";
import { parseXlsx } from "@/src/lib/xlsx";
import { SAMPLE_TRADES } from "@/src/lib/sampleData";
import { MOCK_DATASETS, loadMockDataset } from "@/src/lib/mockDatasets";

export default function ImportScreen() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [loading, setLoading] = useState(false);

  const handleUseSampleData = () => {
    dispatch({ type: "SET_TRADES", payload: SAMPLE_TRADES });
    router.push("/analyzing");
  };

  const handleLoadMockDataset = async (id: string) => {
    try {
      setLoading(true);
      const { trades, warnings } = await loadMockDataset(id);
      if (warnings.length > 0) {
        const proceed = await confirmProceed(
          "Missing Fields Detected",
          `${warnings.join("\n")}\n\nYou can continue with limited analysis, or re-upload a file that includes entry price, exit price, and account balance.`
        );
        if (!proceed) {
          setLoading(false);
          return;
        }
      }
      dispatch({ type: "SET_TRADES", payload: trades });
      router.push("/analyzing");
    } catch (error: any) {
      Alert.alert("Mock Dataset Error", error.message || "Failed to load mock dataset.");
    } finally {
      setLoading(false);
    }
  };

  const confirmProceed = (title: string, message: string): Promise<boolean> =>
    new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Continue", onPress: () => resolve(true) },
      ]);
    });

  const handleUploadFile = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/octet-stream",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      const isXlsx =
        file.name?.toLowerCase().endsWith(".xlsx") ||
        file.mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      let parsed;
      if (isXlsx) {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        parsed = parseXlsx(base64, { allowLegacy: true });
      } else {
        const csvString = await FileSystem.readAsStringAsync(file.uri);
        parsed = parseTrades(csvString, { allowLegacy: true });
      }

      const { trades, warnings } = parsed;

      if (trades.length === 0) {
        Alert.alert("No Trades", "The file contained no valid trades.");
        setLoading(false);
        return;
      }

      if (warnings.length > 0) {
        const proceed = await confirmProceed(
          "Missing Fields Detected",
          `${warnings.join("\n")}\n\nYou can continue with limited analysis, or re-upload a file that includes entry price, exit price, and account balance.`
        );
        if (!proceed) {
          setLoading(false);
          return;
        }
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackButton />
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
              Required columns: timestamp, side, asset, pnl, entry_price, exit_price, account_balance{"\n"}
              Optional: qty, position_size, hold_minutes
            </Text>
            <PrimaryButton
              title="Choose CSV/Excel"
              onPress={handleUploadFile}
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

          <View style={styles.card}>
            <Text style={styles.cardIcon}>🧪</Text>
            <Text style={styles.cardTitle}>Mock Datasets</Text>
            <Text style={styles.cardDesc}>
              Provided datasets for judging scenarios. Pick one to load instantly.
            </Text>
            <View style={styles.datasetList}>
              {MOCK_DATASETS.map((d) => (
                <PrimaryButton
                  key={d.id}
                  title={d.label}
                  variant="outline"
                  onPress={() => handleLoadMockDataset(d.id)}
                  style={{ marginBottom: Spacing.sm }}
                />
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>✍️</Text>
            <Text style={styles.cardTitle}>Manual Entry</Text>
            <Text style={styles.cardDesc}>
              Add trades one-by-one with entry/exit price and account balance.
            </Text>
            <PrimaryButton
              title="Add Trades Manually"
              onPress={() => router.push("/manual-entry")}
            />
          </View>
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
    gap: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    gap: Spacing.sm,
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
  datasetList: {
    marginTop: Spacing.sm,
    width: "100%",
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
