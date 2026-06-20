import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, Application, inr } from "../../src/lib/api";
import { useTheme } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { radiusLg, radiusFull, Palette } from "../../src/lib/theme";

function stageTone(stage: string, palette: Palette) {
  const s = stage.toLowerCase();
  if (s.includes("reject")) return { color: palette.danger, bg: palette.dangerSoft };
  if (s.includes("approve") || s.includes("complete")) return { color: palette.accentDark, bg: palette.accentSoft };
  if (s.includes("pending") || s.includes("kyc") || s.includes("review")) return { color: palette.warning, bg: palette.warningSoft };
  return { color: palette.muted, bg: palette.border };
}

export default function Applications() {
  const { palette } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setApps(await api.listApplications());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.bg }}
      data={apps}
      keyExtractor={(a) => a.name}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        width: "100%",
        maxWidth: contentMaxWidth,
        alignSelf: "center",
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} tintColor={palette.accent} onRefresh={() => { setRefreshing(true); load(); }} />
      }
      ListHeaderComponent={
        <Text style={{ fontSize: 28, fontWeight: "800", color: palette.text, marginBottom: 16, letterSpacing: -0.5 }}>
          Applications
        </Text>
      }
      ListEmptyComponent={
        <View style={{ alignItems: "center", padding: 32, gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: palette.text }}>No applications yet</Text>
          <Text style={{ fontSize: 13, color: palette.muted }}>Your loan applications will appear here.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const tone = stageTone(item.stage, palette);
        return (
          <Link href={`/application/${item.name}`} asChild>
            <Pressable
              style={{
                backgroundColor: palette.card,
                borderRadius: radiusLg,
                padding: 18,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted }}>{item.loan_product}</Text>
                <View style={{ borderRadius: radiusFull, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: tone.bg }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: tone.color }}>{item.stage}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 24, fontWeight: "800", color: palette.text, marginTop: 8 }}>{inr(item.loan_amount)}</Text>
              <Text style={{ fontSize: 12, color: palette.muted, marginTop: 6 }}>
                {item.name} · {String(item.posting_date).slice(0, 10)}
              </Text>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}
