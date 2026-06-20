import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../src/lib/auth";
import { useTheme } from "../src/lib/ThemeContext";
import { radius, radiusLg } from "../src/lib/theme";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const { palette } = useTheme();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(usr.trim(), pwd);
      router.replace("/(tabs)");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: palette.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ width: "100%", maxWidth: 400 }}>
        <View style={{ marginBottom: 28 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radius,
              backgroundColor: palette.accent,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: palette.onAccent, fontSize: 28, fontWeight: "800" }}>L</Text>
          </View>
          <Text style={{ fontSize: 34, fontWeight: "800", color: palette.text, letterSpacing: -0.5 }}>
            Online loans{"\n"}designed for you
          </Text>
          <Text style={{ fontSize: 15, color: palette.muted, marginTop: 10 }}>
            Sign in to manage your loans, EMIs and payments.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: palette.card,
            borderRadius: radiusLg,
            padding: 20,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted, marginBottom: 6 }}>
            Email
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: radius,
              paddingHorizontal: 14,
              paddingVertical: 13,
              fontSize: 15,
              color: palette.text,
              backgroundColor: palette.cardAlt,
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={palette.muted}
            value={usr}
            onChangeText={setUsr}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: palette.muted,
              marginBottom: 6,
              marginTop: 14,
            }}
          >
            Password
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: radius,
              paddingHorizontal: 14,
              paddingVertical: 13,
              fontSize: 15,
              color: palette.text,
              backgroundColor: palette.cardAlt,
            }}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={palette.muted}
            value={pwd}
            onChangeText={setPwd}
          />
          {error ? (
            <Text style={{ color: palette.danger, marginTop: 12, fontSize: 13 }}>{error}</Text>
          ) : null}
          <Pressable
            style={{
              backgroundColor: palette.primary,
              borderRadius: radius,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 22,
              opacity: busy ? 0.7 : 1,
            }}
            onPress={onSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <Text style={{ color: palette.onPrimary, fontSize: 16, fontWeight: "700" }}>
                Sign in
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
