import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, Radius, Typography, Shadows } from "@/src/lib/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import { useApp } from "@/src/context/AppContext";
import { Trade } from "@/src/lib/types";
import BackButton from "@/src/components/BackButton";

type FormState = {
  timestamp: string;
  side: "BUY" | "SELL";
  asset: string;
  pnl: string;
  qty: string;
  positionSize: string;
  entryPrice: string;
  exitPrice: string;
  accountBalance: string;
  holdMinutes: string;
};

const emptyForm = (): FormState => ({
  timestamp: new Date().toISOString(),
  side: "BUY",
  asset: "",
  pnl: "",
  qty: "",
  positionSize: "",
  entryPrice: "",
  exitPrice: "",
  accountBalance: "",
  holdMinutes: "",
});

export default function ManualEntryScreen() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [trades, setTrades] = useState<Trade[]>([]);

  const parseNumber = (val: string): number | null => {
    if (!val) return null;
    const cleaned = val.replace(/[^0-9.+-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const buildTradeFromForm = (): Trade | null => {
    const ts = new Date(form.timestamp).getTime();
    if (isNaN(ts)) {
      Alert.alert("Invalid Timestamp", "Use ISO format like 2025-01-27T09:30:00");
      return null;
    }
    if (form.side !== "BUY" && form.side !== "SELL") {
      Alert.alert("Invalid Side", "Side must be BUY or SELL.");
      return null;
    }
    if (!form.asset.trim()) {
      Alert.alert("Missing Asset", "Please enter an asset symbol.");
      return null;
    }

    const entryPrice = parseNumber(form.entryPrice);
    const exitPrice = parseNumber(form.exitPrice);
    const accountBalance = parseNumber(form.accountBalance);

    if (entryPrice === null || exitPrice === null || accountBalance === null) {
      Alert.alert(
        "Missing Required Fields",
        "Entry price, exit price, and account balance are required."
      );
      return null;
    }

    let pnl = parseNumber(form.pnl);
    const qty = parseNumber(form.qty);
    const positionSize = parseNumber(form.positionSize);
    const holdMinutes = parseNumber(form.holdMinutes);

    if (pnl === null) {
      if (qty !== null) {
        const direction = form.side === "BUY" ? 1 : -1;
        pnl = (exitPrice - entryPrice) * qty * direction;
      } else {
        Alert.alert(
          "Missing P/L",
          "Provide P/L or enter quantity to auto-calculate it."
        );
        return null;
      }
    }

    const trade: Trade = {
      id: `${ts}-${form.asset}-${trades.length}`,
      timestamp: ts,
      side: form.side,
      asset: form.asset.trim(),
      pnl,
      entryPrice,
      exitPrice,
      accountBalance,
    };

    if (qty !== null) trade.qty = qty;
    if (positionSize !== null) trade.positionSize = positionSize;
    if (holdMinutes !== null) trade.holdMinutes = holdMinutes;

    return trade;
  };

  const handleAddTrade = () => {
    const trade = buildTradeFromForm();
    if (!trade) return;
    setTrades((prev) => [...prev, trade]);
    setForm((prev) => ({
      ...emptyForm(),
      side: prev.side,
      accountBalance: prev.accountBalance,
    }));
  };

  const handleAnalyze = () => {
    let nextTrades = trades;
    if (trades.length === 0) {
      const trade = buildTradeFromForm();
      if (!trade) return;
      nextTrades = [trade];
    }
    dispatch({ type: "SET_TRADES", payload: nextTrades });
    router.push("/analyzing");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <Text style={styles.title}>Manual Trade Entry</Text>
        <Text style={styles.subtitle}>
          Required: timestamp, side, asset, entry price, exit price, account balance (per trade), P/L
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trade Details</Text>

          <Input label="Timestamp (ISO)" value={form.timestamp} onChange={(v) => setForm({ ...form, timestamp: v })} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Side (BUY/SELL)" value={form.side} onChange={(v) => setForm({ ...form, side: v.toUpperCase() as "BUY" | "SELL" })} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Asset" value={form.asset} onChange={(v) => setForm({ ...form, asset: v })} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Entry Price" value={form.entryPrice} onChange={(v) => setForm({ ...form, entryPrice: v })} keyboard="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Exit Price" value={form.exitPrice} onChange={(v) => setForm({ ...form, exitPrice: v })} keyboard="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="P/L" value={form.pnl} onChange={(v) => setForm({ ...form, pnl: v })} keyboard="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Account Balance" value={form.accountBalance} onChange={(v) => setForm({ ...form, accountBalance: v })} keyboard="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Quantity (optional)" value={form.qty} onChange={(v) => setForm({ ...form, qty: v })} keyboard="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Position Size (optional)" value={form.positionSize} onChange={(v) => setForm({ ...form, positionSize: v })} keyboard="numeric" />
            </View>
          </View>

          <Input label="Hold Minutes (optional)" value={form.holdMinutes} onChange={(v) => setForm({ ...form, holdMinutes: v })} keyboard="numeric" />

          <View style={styles.buttonRow}>
            <PrimaryButton title="Add Trade" onPress={handleAddTrade} />
            <PrimaryButton title="Finish & Analyze" variant="secondary" onPress={handleAnalyze} />
          </View>
        </View>

        {trades.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Trades Added</Text>
            {trades.map((t, i) => (
              <View key={t.id || i} style={styles.tradeRow}>
                <Text style={styles.tradeText}>
                  {i + 1}. {t.asset} {t.side} — P/L ${t.pnl.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({
  label,
  value,
  onChange,
  keyboard = "default",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: "default" | "numeric";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
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
  row: { flexDirection: "row", gap: Spacing.md },
  inputGroup: { gap: Spacing.xs, flex: 1 },
  label: { ...Typography.label },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    ...Typography.body,
  },
  buttonRow: { gap: Spacing.md },
  tradeRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tradeText: { ...Typography.bodySmall },
});
