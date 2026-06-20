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
        headerStyle: { backgroundColor: palette.bg },
        headerTitleStyle: { color: palette.text },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Loans",
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏦</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
