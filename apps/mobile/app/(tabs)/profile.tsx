import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/lib/auth";
import { theme } from "../../src/lib/theme";
import { useResponsive } from "../../src/lib/responsive";

export default function Profile() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const { contentMaxWidth } = useResponsive();

  const initials = (profile?.full_name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={[styles.screen, { alignItems: "center" }]}>
      <View style={{ width: "100%", maxWidth: contentMaxWidth }}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <Text style={styles.meta}>{profile?.email}</Text>
        {profile?.mobile_no ? <Text style={styles.meta}>{profile.mobile_no}</Text> : null}
      </View>

      <Pressable
        style={styles.logout}
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  name: { fontSize: 20, fontWeight: "800", color: theme.text, marginTop: 16 },
  meta: { fontSize: 14, color: theme.muted, marginTop: 2 },
  logout: {
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.danger,
  },
  logoutText: { color: theme.danger, fontSize: 16, fontWeight: "700" },
});
