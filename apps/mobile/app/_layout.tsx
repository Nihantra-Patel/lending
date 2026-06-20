import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/lib/auth";
import { ThemeProvider, useTheme } from "../src/lib/ThemeContext";

function ThemedStack() {
  const { palette, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: palette.card },
          headerTitleStyle: { color: palette.text },
          headerTintColor: palette.text,
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="loan/[id]" options={{ headerShown: true, title: "Loan details", headerBackTitle: "Back" }} />
        <Stack.Screen name="application/[id]" options={{ headerShown: true, title: "Application", headerBackTitle: "Back" }} />
        <Stack.Screen name="apply" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStack />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
