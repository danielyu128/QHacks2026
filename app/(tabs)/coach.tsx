import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, Radius, Typography } from "@/src/lib/theme";
import { useApp } from "@/src/context/AppContext";
import { sendChatMessage, ChatMessage } from "@/src/api/coachChat";

const STORAGE_KEY = "financia_coach_chat";

const QUICK_PROMPTS = [
  "Why am I revenge trading?",
  "Give me rules for tomorrow",
  "Summarize my biases",
];

export default function CoachTab() {
  const { state } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  };

  const saveMessages = async (msgs: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch {
      // Ignore
    }
  };

  const clearChat = useCallback(() => {
    Alert.alert("Clear Chat", "Remove all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setMessages([]);
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text || input).trim();
      if (!messageText || loading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: messageText,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setLoading(true);

      const biases = state.biasResults.map((b) => b.bias);
      const evidence = state.biasResults.flatMap((b) => b.evidence).slice(0, 10);

      const reply = await sendChatMessage({
        messages: updatedMessages.slice(-20).map((m) => ({
          role: m.role,
          text: m.text,
        })),
        summaryMetrics: state.metrics,
        detectedBiases: biases,
        evidenceLines: evidence,
      });

      const coachMsg: ChatMessage = {
        id: `c-${Date.now()}`,
        role: "coach",
        text: reply,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, coachMsg];
      setMessages(finalMessages);
      setLoading(false);
      await saveMessages(finalMessages);
    },
    [input, loading, messages, state]
  );

  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages, loading]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleCoach]}>
        {!isUser && <Text style={styles.coachLabel}>Coach</Text>}
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextCoach]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Talk to your Coach</Text>
            <Text style={styles.emptySubtitle}>
              Ask about your biases, get rules for tomorrow, or reflect on a recent trade.
            </Text>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={[styles.bubble, styles.bubbleCoach]}>
              <Text style={styles.coachLabel}>Coach</Text>
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={Colors.primaryLight} />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {messages.length === 0 && !loading && (
        <View style={styles.quickPrompts}>
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              style={styles.quickChip}
              onPress={() => handleSend(prompt)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask your coach..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading}
          activeOpacity={0.7}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  messageList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  bubble: {
    maxWidth: "82%",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-end",
    borderBottomRightRadius: Spacing.xs,
  },
  bubbleCoach: {
    backgroundColor: Colors.surface,
    alignSelf: "flex-start",
    borderBottomLeftRadius: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coachLabel: {
    ...Typography.caption,
    color: Colors.primaryLight,
    marginBottom: Spacing.xs,
    fontWeight: "600",
  },
  bubbleText: { ...Typography.body, lineHeight: 22 },
  bubbleTextUser: { color: Colors.white },
  bubbleTextCoach: { color: Colors.textPrimary },
  timestamp: { ...Typography.caption, marginTop: Spacing.xs, textAlign: "right", opacity: 0.6 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  typingText: { ...Typography.bodySmall, color: Colors.textMuted, fontStyle: "italic" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...Typography.h2 },
  emptySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  quickPrompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: "center",
  },
  quickChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  quickChipText: { ...Typography.bodySmall, color: Colors.primaryLight },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: Colors.white, fontSize: 20, fontWeight: "700" },
});
