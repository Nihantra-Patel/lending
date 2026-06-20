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
import { radius } from "../src/lib/theme";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const { palette } = useTheme();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!usr.trim() || !pwd) {
      setError("Please enter your email and password.");
      return;
    }
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

  const fieldStyle = {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.card,
  } as const;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg, alignItems: "center", paddingHorizontal: 24, paddingTop: 96 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ width: "100%", maxWidth: 360 }}>
        {/* Brand */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius,
            backgroundColor: palette.accent,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <Text style={{ color: palette.onAccent, fontSize: 24, fontWeight: "800" }}>L</Text>
        </View>

        <Text style={{ fontSize: 26, fontWeight: "800", color: palette.text }}>Sign in</Text>
        <Text style={{ fontSize: 15, color: palette.muted, marginTop: 4, marginBottom: 24 }}>
          Welcome! Please sign in to continue.
        </Text>

        <Text style={{ fontSize: 13, fontWeight: "600", color: palette.textSecondary, marginBottom: 6 }}>
          Email
        </Text>
        <TextInput
          style={fieldStyle}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={palette.muted}
          value={usr}
          onChangeText={setUsr}
          onSubmitEditing={onSubmit}
        />

        <Text style={{ fontSize: 13, fontWeight: "600", color: palette.textSecondary, marginBottom: 6, marginTop: 16 }}>
          Password
        </Text>
        <View style={{ position: "relative", justifyContent: "center" }}>
          <TextInput
            style={[fieldStyle, { paddingRight: 56 }]}
            secureTextEntry={!show}
            placeholder="••••••••"
            placeholderTextColor={palette.muted}
            value={pwd}
            onChangeText={setPwd}
            onSubmitEditing={onSubmit}
          />
          <Pressable
            onPress={() => setShow((s) => !s)}
            style={{ position: "absolute", right: 12, padding: 6 }}
            hitSlop={8}
          >
            <Text style={{ color: palette.muted, fontSize: 13, fontWeight: "600" }}>{show ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        {error ? <Text style={{ color: palette.danger, marginTop: 12, fontSize: 13 }}>{error}</Text> : null}

        <Pressable
          style={{
            backgroundColor: palette.primary,
            borderRadius: radius,
            paddingVertical: 15,
            alignItems: "center",
            marginTop: 24,
            opacity: busy ? 0.7 : 1,
          }}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={palette.onPrimary} />
          ) : (
            <Text style={{ color: palette.onPrimary, fontSize: 16, fontWeight: "700" }}>Sign in</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
