import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "../../src/lib/auth";
import { theme } from "../../src/lib/theme";

export default function TabsLayout() {
  const { profile, loading } = useAuth();
  if (!loading && !profile) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Loans",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏦</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
