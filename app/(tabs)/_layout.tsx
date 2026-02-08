import { Spacing } from "@/src/lib/theme";
import { useTheme } from "@/src/context/ThemeContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { View, Text, TouchableOpacity, Platform, StyleSheet } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  size?: number;
  focused?: boolean;
}) {
  const { focused, size = 20, ...rest } = props;
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center" }}>
      <FontAwesome size={size} style={{ marginBottom: -2 }} {...rest} />
      {focused && (
        <View
          style={{
            width: 24,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.primaryLight,
            marginTop: 4,
            ...(Platform.OS === "web"
              ? { boxShadow: `0 0 8px ${colors.primaryLight}` }
              : {}),
          }}
        />
      )}
    </View>
  );
}

function ProfileHeaderButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/profile")}
      style={[styles.profilePill, { borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <FontAwesome name="user-circle-o" size={14} color={colors.textSecondary} />
      <Text style={[styles.profilePillText, { color: colors.textSecondary }]}>
        Profile
      </Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerShadowVisible: false,
        headerLeft: () => null,
        headerRight: () => <ProfileHeaderButton />,
        headerRightContainerStyle: { paddingRight: Spacing.lg },
      }}
    >
      {/* Visible tabs: Charts | Plan | Insights (center) | Coach | Profile */}
      <Tabs.Screen
        name="charts"
        options={{
          title: "Charts",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="bar-chart" color={color} focused={focused} />
          ),
          headerTitle: "Visual Analysis",
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="check-square-o" color={color} focused={focused} />
          ),
          headerTitle: "Action Plan",
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="eye" color={color} size={24} focused={focused} />
          ),
          headerTitle: "Bias Insights",
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="comments" color={color} focused={focused} />
          ),
          headerTitle: "Coach Chat",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="user" color={color} focused={focused} />
          ),
          headerTitle: "My Profile",
          headerRight: () => null,
        }}
      />

      {/* Hidden tabs — accessible via navigation but not in bottom bar */}
      <Tabs.Screen name="journal" options={{ href: null, headerTitle: "Journal" }} />
      <Tabs.Screen name="learn" options={{ href: null, headerTitle: "Financial Literacy" }} />
      <Tabs.Screen name="brokerage" options={{ href: null, headerTitle: "Brokerage Comparison" }} />
      <Tabs.Screen name="safer" options={{ href: null, headerTitle: "Safer Alternatives" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
