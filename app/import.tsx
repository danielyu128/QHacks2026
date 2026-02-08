import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Colors, Spacing, Radius, Typography } from "@/src/lib/theme";
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
  const [showDemoData, setShowDemoData] = useState(false);

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
          `${warnings.join("\n")}\n\nContinue with limited analysis?`
        );
        if (!proceed) {
          setLoading(false);
          return;
        }
      }
      dispatch({ type: "SET_TRADES", payload: trades });
      router.push("/analyzing");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load dataset.");
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
          `${warnings.join("\n")}\n\nContinue with limited analysis?`
        );
        if (!proceed) {
          setLoading(false);
          return;
        }
      }

      dispatch({ type: "SET_TRADES", payload: trades });
      router.push("/analyzing");
    } catch (error: any) {
      Alert.alert("Import Error", error.message || "Failed to parse file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BackButton />
        <View style={styles.header}>
          <Text style={styles.title}>Import Trades</Text>
          <Text style={styles.subtitle}>
            Upload your trading history or use demo data
          </Text>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <View style={styles.uploadArea}>
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.uploadTitle}>Upload CSV or Excel</Text>
            <Text style={styles.uploadDesc}>
              Columns: timestamp, side, asset, pnl, entry_price, exit_price, account_balance
            </Text>
            <PrimaryButton
              title="Choose File"
              onPress={handleUploadFile}
              loading={loading}
            />
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Demo Data Section */}
        <View style={styles.section}>
          <PrimaryButton
            title="Quick Demo (~191 trades)"
            variant="outline"
            onPress={handleUseSampleData}
          />

          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => setShowDemoData(!showDemoData)}
            activeOpacity={0.7}
          >
            <Text style={styles.expandBtnText}>
              {showDemoData ? "Hide" : "Show"} Judging Datasets
            </Text>
            <Text style={styles.expandArrow}>
              {showDemoData ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {showDemoData && (
            <View style={styles.datasetGrid}>
              {MOCK_DATASETS.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.datasetCard}
                  onPress={() => handleLoadMockDataset(d.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.datasetLabel}>{d.label}</Text>
                  <Text style={styles.datasetDesc}>{d.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Manual Entry */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.manualEntry}
            onPress={() => router.push("/manual-entry")}
            activeOpacity={0.7}
          >
            <Text style={styles.manualIcon}>✍️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.manualTitle}>Manual Entry</Text>
              <Text style={styles.manualDesc}>Add trades one-by-one</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
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
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  section: {
    gap: Spacing.md,
  },
  uploadArea: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    gap: Spacing.md,
  },
  uploadIcon: {
    fontSize: 36,
  },
  uploadTitle: {
    ...Typography.h3,
  },
  uploadDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
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
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  expandBtnText: {
    ...Typography.bodySmall,
    color: Colors.primaryLight,
  },
  expandArrow: {
    color: Colors.primaryLight,
    fontSize: 12,
  },
  datasetGrid: {
    gap: Spacing.sm,
  },
  datasetCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datasetLabel: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  datasetDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  manualEntry: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  manualIcon: {
    fontSize: 24,
  },
  manualTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  manualDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  chevron: {
    fontSize: 24,
    color: Colors.textMuted,
  },
});
