import { Stack } from "expo-router";
import { Colors } from "@/src/lib/theme";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="partnerSelect" />
      <Stack.Screen name="fakeLogin" />
      <Stack.Screen name="fakeMfa" />
    </Stack>
  );
}
