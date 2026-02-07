import { Link, Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "@/src/lib/theme";
import PrimaryButton from "@/src/components/PrimaryButton";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.title}>Screen not found</Text>
        <Link href="/onboarding/welcome" asChild>
          <PrimaryButton title="Go to Home" onPress={() => {}} />
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    ...Typography.h2,
  },
});
