import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, inr, LoanSummary, Summary } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth";
import { useTheme } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { radius, radiusLg, radiusFull, Palette } from "../../src/lib/theme";

function statusTone(loan: LoanSummary, palette: Palette) {
  if (loan.is_npa) return { color: palette.danger, bg: palette.dangerSoft, label: "NPA" };
  if (loan.status === "Closed" || loan.status === "Settled")
    return { color: palette.muted, bg: palette.border, label: loan.status };
  if (loan.days_past_due > 0) return { color: palette.warning, bg: palette.warningSoft, label: loan.status };
  return { color: palette.accentDark, bg: palette.accentSoft, label: loan.status };
}

function Stat({ label, value, palette, color }: { label: string; value: string; palette: Palette; color?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{label}</Text>
      <Text style={{ fontSize: 17, fontWeight: "800", color: color || "#fff", marginTop: 2 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function LoanCard({ loan, palette }: { loan: LoanSummary; palette: Palette }) {
  const tone = statusTone(loan, palette);
  return (
    <Link href={`/loan/${loan.name}`} asChild>
      <Pressable
        style={{
          backgroundColor: palette.card,
          borderRadius: radiusLg,
          padding: 18,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: palette.border,
          borderLeftWidth: 4,
          borderLeftColor: tone.color,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted }}>{loan.loan_product}</Text>
          <View style={{ borderRadius: radiusFull, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: tone.bg }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: tone.color }}>{tone.label}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 26, fontWeight: "800", color: palette.text, marginTop: 10, letterSpacing: -0.5 }}>
          {inr(loan.loan_amount)}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
          <Text style={{ fontSize: 13, color: palette.muted }}>Paid {inr(loan.total_amount_paid)}</Text>
          {loan.days_past_due > 0 ? (
            <Text style={{ fontSize: 13, fontWeight: "600", color: palette.warning }}>{loan.days_past_due} days past due</Text>
          ) : (
            <Text style={{ fontSize: 13, fontWeight: "600", color: palette.accentDark }}>On track</Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

export default function MyLoans() {
  const router = useRouter();
  const { palette } = useTheme();
  const { profile } = useAuth();
  const { contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const [loans, setLoans] = useState<LoanSummary[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, s] = await Promise.all([api.listLoans(), api.getSummary()]);
      setLoans(l);
      setSummary(s);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const name = (profile?.full_name || "there").replace(/^_+/, "");

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
      data={loans}
      keyExtractor={(l) => l.name}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        width: "100%",
        maxWidth: contentMaxWidth,
        alignSelf: "center",
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={palette.accent}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: palette.muted }}>Welcome back,</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: palette.text, letterSpacing: -0.5 }} numberOfLines={1}>
            {name}
          </Text>

          {/* Portfolio summary card */}
          <View style={{ backgroundColor: palette.primary, borderRadius: radiusLg, padding: 18, marginTop: 14 }}>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Total outstanding</Text>
            <Text style={{ fontSize: 30, fontWeight: "800", color: "#fff", marginTop: 2, letterSpacing: -0.5 }}>
              {inr(summary?.outstanding)}
            </Text>
            <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
              <Stat label="Borrowed" value={inr(summary?.total_borrowed)} palette={palette} />
              <Stat label="Paid" value={inr(summary?.total_paid)} palette={palette} color={palette.accent} />
            </View>
            <View style={{ flexDirection: "row", marginTop: 14, gap: 12 }}>
              <Stat label="Active loans" value={String(summary?.active_loans ?? 0)} palette={palette} />
              <Stat
                label="Overdue"
                value={String(summary?.overdue_loans ?? 0)}
                palette={palette}
                color={summary && summary.overdue_loans > 0 ? palette.warning : "#fff"}
              />
            </View>
          </View>

          {/* Quick actions */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <Pressable
              style={{ flex: 1, backgroundColor: palette.accent, borderRadius: radius, paddingVertical: 14, alignItems: "center" }}
              onPress={() => router.push("/apply")}
            >
              <Text style={{ color: palette.onAccent, fontWeight: "700", fontSize: 15 }}>+ Apply</Text>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                backgroundColor: palette.card,
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: radius,
                paddingVertical: 14,
                alignItems: "center",
              }}
              onPress={() => router.push("/(tabs)/applications")}
            >
              <Text style={{ color: palette.text, fontWeight: "700", fontSize: 15 }}>My applications</Text>
            </Pressable>
          </View>

          <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, marginTop: 22, marginBottom: 4 }}>
            Your loans
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={{ alignItems: "center", padding: 32, gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: palette.text }}>No loans yet</Text>
          <Text style={{ fontSize: 13, color: palette.muted, textAlign: "center" }}>Tap Apply to get started.</Text>
        </View>
      }
      renderItem={({ item }) => <LoanCard loan={item} palette={palette} />}
    />
  );
}
