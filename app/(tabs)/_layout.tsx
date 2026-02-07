import BackButton from "@/src/components/BackButton";
import { Colors } from "@/src/lib/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import React from "react";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={20} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
          minWidth: 0,
          flex: 1,
          alignItems: "center",
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <BackButton onPress={() => router.replace("/onboarding/welcome")} />
        ),
      }}
    >
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => <TabBarIcon name="eye" color={color} />,
          headerTitle: "Bias Insights",
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: "Charts",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bar-chart" color={color} />
          ),
          headerTitle: "Visual Analysis",
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="check-square-o" color={color} />
          ),
          headerTitle: "Action Plan",
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="graduation-cap" color={color} />
          ),
          headerTitle: "Financial Literacy",
        }}
      />
      <Tabs.Screen
        name="brokerage"
        options={{
          title: "Broker",
          tabBarIcon: ({ color }) => <TabBarIcon name="bank" color={color} />,
          headerTitle: "Brokerage Comparison",
        }}
      />
      <Tabs.Screen
        name="safer"
        options={{
          title: "ETFs",
          tabBarIcon: ({ color }) => <TabBarIcon name="shield" color={color} />,
          headerTitle: "Safer Alternatives",
        }}
      />
    </Tabs>
  );
}
