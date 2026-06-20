import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "../../src/lib/auth";
import { useTheme } from "../../src/lib/ThemeContext";

export default function TabsLayout() {
  const { profile, loading } = useAuth();
  const { palette } = useTheme();
  if (!loading && !profile) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.card, borderTopColor: palette.border },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text> }}
      />
      <Tabs.Screen
        name="applications"
        options={{ title: "Applications", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📄</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text> }}
      />
    </Tabs>
  );
}
