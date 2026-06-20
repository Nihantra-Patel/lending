import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, inr, LoanSummary } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth";
import { useTheme } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { radius, radiusLg, radiusFull, Palette } from "../../src/lib/theme";

function statusTone(loan: LoanSummary, palette: Palette) {
  if (loan.is_npa) return { color: palette.danger, bg: palette.dangerSoft, label: "NPA" };
  if (loan.status === "Closed" || loan.status === "Settled")
    return { color: palette.muted, bg: palette.border, label: loan.status };
  if (loan.days_past_due > 0)
    return { color: palette.warning, bg: palette.warningSoft, label: loan.status };
  return { color: palette.accentDark, bg: palette.accentSoft, label: loan.status };
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
        <Text style={{ fontSize: 28, fontWeight: "800", color: palette.text, marginTop: 10, letterSpacing: -0.5 }}>
          {inr(loan.loan_amount)}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
          <Text style={{ fontSize: 13, color: palette.muted }}>Paid {inr(loan.total_amount_paid)}</Text>
          {loan.days_past_due > 0 ? (
            <Text style={{ fontSize: 13, fontWeight: "600", color: palette.warning }}>
              {loan.days_past_due} days past due
            </Text>
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoans(await api.listLoans());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const name = profile?.full_name || "there";

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <FlatList
        data={loans}
        keyExtractor={(l) => l.name}
        style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 96 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 14, color: palette.muted }}>Welcome back,</Text>
            <Text style={{ fontSize: 26, fontWeight: "800", color: palette.text, letterSpacing: -0.5 }} numberOfLines={1}>
              {name}
            </Text>
            <Text style={{ fontSize: 14, color: palette.muted, marginTop: 6 }}>
              {loans.length} {loans.length === 1 ? "loan" : "loans"}
            </Text>
          </View>
        }
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
        ListEmptyComponent={
          <View style={{ alignItems: "center", padding: 32, gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: palette.text }}>No loans yet</Text>
            <Text style={{ fontSize: 13, color: palette.muted, textAlign: "center" }}>
              {error ?? "Tap the button below to apply for your first loan."}
            </Text>
          </View>
        }
        renderItem={({ item }) => <LoanCard loan={item} palette={palette} />}
      />
      {/* Sticky bottom action bar so the CTA never covers a card */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
          backgroundColor: palette.bg,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          alignItems: "center",
        }}
      >
        <Pressable
          style={{
            width: "100%",
            maxWidth: contentMaxWidth - 32,
            backgroundColor: palette.primary,
            borderRadius: radius,
            paddingVertical: 16,
            alignItems: "center",
          }}
          onPress={() => router.push("/apply")}
        >
          <Text style={{ color: palette.onPrimary, fontSize: 16, fontWeight: "700" }}>+  Apply for a loan</Text>
        </Pressable>
      </View>
    </View>
  );
}
