import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, Radius, Typography } from "@/src/lib/theme";
import PrimaryButton from "@/src/components/PrimaryButton";
import { useApp } from "@/src/context/AppContext";
import BackButton from "@/src/components/BackButton";

export default function FakeMfaScreen() {
  const router = useRouter();
  const { bank } = useLocalSearchParams<{ bank: string }>();
  const { dispatch } = useApp();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-advance to next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isFilled = code.every((c) => c.length === 1);

  const handleVerify = () => {
    dispatch({ type: "SET_PARTNER_BANK", payload: bank || "NBC" });
    setSuccess(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      router.replace("/import");
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <BackButton />
        {!success ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Verify Your Identity</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to your device
              </Text>
              <Text style={styles.hint}>(Enter any 6 digits for demo)</Text>
            </View>

            <View style={styles.codeRow}>
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  style={[styles.codeInput, digit && styles.codeInputFilled]}
                  value={digit}
                  onChangeText={(t) => handleCodeChange(t.slice(-1), i)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, i)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <PrimaryButton
              title="Verify"
              onPress={handleVerify}
              disabled={!isFilled}
            />

            <Text style={styles.resend}>Resend code</Text>
          </>
        ) : (
          <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Successfully Linked!</Text>
            <Text style={styles.successSubtitle}>
              {bank} account connected (demo)
            </Text>
          </Animated.View>
        )}
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
    justifyContent: "center",
    gap: Spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  codeInputFilled: {
    borderColor: Colors.primary,
  },
  resend: {
    ...Typography.bodySmall,
    color: Colors.primaryLight,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    gap: Spacing.md,
  },
  successIcon: {
    fontSize: 64,
  },
  successTitle: {
    ...Typography.h1,
    color: Colors.secondary,
  },
  successSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
