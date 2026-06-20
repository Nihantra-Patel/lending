import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/lib/auth";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="loan/[id]"
            options={{ headerShown: true, title: "Loan details" }}
          />
          <Stack.Screen
            name="apply"
            options={{ headerShown: true, title: "Apply for a loan", presentation: "modal" }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
