import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/lib/auth";
import { useTheme } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { radiusLg, radius, radiusFull } from "../../src/lib/theme";

export default function Profile() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const { palette } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();

  const initials = (profile?.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View
      style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + 12, paddingHorizontal: 16, alignItems: "center" }}
    >
      <View style={{ width: "100%", maxWidth: contentMaxWidth }}>
        <Text style={{ fontSize: 30, fontWeight: "800", color: palette.text, marginBottom: 18, letterSpacing: -0.5 }}>
          Profile
        </Text>
        <View
          style={{
            backgroundColor: palette.card,
            borderRadius: radiusLg,
            padding: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: radiusFull,
              backgroundColor: palette.accent,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: palette.onAccent, fontSize: 30, fontWeight: "800" }}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: palette.text, marginTop: 16 }}>
            {profile?.full_name}
          </Text>
          <Text style={{ fontSize: 14, color: palette.muted, marginTop: 2 }}>{profile?.email}</Text>
          {profile?.mobile_no ? (
            <Text style={{ fontSize: 14, color: palette.muted, marginTop: 2 }}>{profile.mobile_no}</Text>
          ) : null}
        </View>

        <Pressable
          style={{
            marginTop: 20,
            borderRadius: radius,
            paddingVertical: 15,
            alignItems: "center",
            borderWidth: 1,
            borderColor: palette.danger,
          }}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <Text style={{ color: palette.danger, fontSize: 16, fontWeight: "700" }}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
