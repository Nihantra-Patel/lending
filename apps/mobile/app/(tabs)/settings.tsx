import { ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, ThemePreference } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { radius, radiusLg } from "../../src/lib/theme";

const OPTIONS: { key: ThemePreference; label: string; icon: string }[] = [
  { key: "light", label: "Light", icon: "☀️" },
  { key: "dark", label: "Dark", icon: "🌙" },
  { key: "system", label: "System", icon: "📱" },
];

export default function Settings() {
  const { palette, preference, setPreference } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: insets.top + 12,
        width: "100%",
        maxWidth: contentMaxWidth,
        alignSelf: "center",
      }}
    >
      <Text style={{ fontSize: 30, fontWeight: "800", color: palette.text, marginBottom: 18, letterSpacing: -0.5 }}>
        Settings
      </Text>

      <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted, marginBottom: 10 }}>
        APPEARANCE
      </Text>
      <View
        style={{
          backgroundColor: palette.card,
          borderRadius: radiusLg,
          borderWidth: 1,
          borderColor: palette.border,
          padding: 8,
          flexDirection: "row",
          gap: 8,
        }}
      >
        {OPTIONS.map((opt) => {
          const active = preference === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setPreference(opt.key)}
              style={{
                flex: 1,
                paddingVertical: 16,
                borderRadius: radius,
                alignItems: "center",
                backgroundColor: active ? palette.accentSoft : "transparent",
                borderWidth: 1.5,
                borderColor: active ? palette.accent : "transparent",
              }}
            >
              <Text style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: active ? palette.text : palette.muted,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontSize: 12, color: palette.muted, marginTop: 10 }}>
        Choose how the app looks. “System” follows your device’s light or dark setting.
      </Text>
    </ScrollView>
  );
}
