import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/auth";
import { useTheme, ThemePreference } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { radiusLg, radius, radiusFull } from "../../src/lib/theme";

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: string }[] = [
  { key: "light", label: "Light", icon: "☀️" },
  { key: "dark", label: "Dark", icon: "🌙" },
  { key: "system", label: "System", icon: "📱" },
];

export default function Profile() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const { palette, preference, setPreference } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();

  const name = (profile?.full_name || "?").replace(/^_+/, "");
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
    >
      <Text style={{ fontSize: 28, fontWeight: "800", color: palette.text, marginBottom: 18, letterSpacing: -0.5 }}>Profile</Text>

      {/* Profile card */}
      <View style={{ backgroundColor: palette.card, borderRadius: radiusLg, padding: 24, alignItems: "center", borderWidth: 1, borderColor: palette.border }}>
        <View style={{ width: 84, height: 84, borderRadius: radiusFull, backgroundColor: palette.accent, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: palette.onAccent, fontSize: 30, fontWeight: "800" }}>{initials}</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: "800", color: palette.text, marginTop: 16 }}>{name}</Text>
        <Text style={{ fontSize: 14, color: palette.muted, marginTop: 2 }}>{profile?.email}</Text>
        {profile?.mobile_no ? <Text style={{ fontSize: 14, color: palette.muted, marginTop: 2 }}>{profile.mobile_no}</Text> : null}
      </View>

      {/* Appearance */}
      <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted, marginTop: 26, marginBottom: 10 }}>APPEARANCE</Text>
      <View style={{ backgroundColor: palette.card, borderRadius: radiusLg, borderWidth: 1, borderColor: palette.border, padding: 8, flexDirection: "row", gap: 8 }}>
        {THEME_OPTIONS.map((opt) => {
          const active = preference === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setPreference(opt.key)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: radius,
                alignItems: "center",
                backgroundColor: active ? palette.accentSoft : "transparent",
                borderWidth: 1.5,
                borderColor: active ? palette.accent : "transparent",
              }}
            >
              <Text style={{ fontSize: 20, marginBottom: 6 }}>{opt.icon}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: active ? palette.text : palette.muted }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Sign out */}
      <Pressable
        style={{ marginTop: 26, borderRadius: radius, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: palette.danger }}
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <Text style={{ color: palette.danger, fontSize: 16, fontWeight: "700" }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
