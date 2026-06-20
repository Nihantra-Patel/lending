import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, inr, LoanSummary } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth";
import { useTheme } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { radius, radiusLg, radiusFull, Palette } from "../../src/lib/theme";

function StatusPill({ status, npa, palette }: { status: string; npa: number; palette: Palette }) {
  const color = npa ? palette.danger : status === "Closed" ? palette.muted : palette.accentDark;
  const bg = npa ? palette.dangerSoft : status === "Closed" ? palette.border : palette.accentSoft;
  return (
    <View style={{ borderRadius: radiusFull, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: bg }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color }}>{npa ? "NPA" : status}</Text>
    </View>
  );
}

function LoanCard({ loan, palette, tint }: { loan: LoanSummary; palette: Palette; tint: string }) {
  return (
    <Link href={`/loan/${loan.name}`} asChild>
      <Pressable
        style={{
          backgroundColor: tint,
          borderRadius: radiusLg,
          padding: 18,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: palette.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted }}>{loan.loan_product}</Text>
          <StatusPill status={loan.status} npa={loan.is_npa} palette={palette} />
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

  const tints = [palette.tintGreen, palette.tintBlue, palette.tintViolet];
  const firstName = (profile?.full_name || "there").split(" ")[0];

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
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 14, color: palette.muted }}>Welcome back,</Text>
            <Text style={{ fontSize: 30, fontWeight: "800", color: palette.text, letterSpacing: -0.5 }}>
              {firstName}
            </Text>
            <Text style={{ fontSize: 15, color: palette.muted, marginTop: 6 }}>
              {loans.length} active {loans.length === 1 ? "loan" : "loans"}
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
        renderItem={({ item, index }) => (
          <LoanCard loan={item} palette={palette} tint={tints[index % tints.length]} />
        )}
      />
      <View style={{ position: "absolute", bottom: 20, left: 0, right: 0, alignItems: "center" }} pointerEvents="box-none">
        <Pressable
          style={{
            width: "100%",
            maxWidth: contentMaxWidth - 32,
            marginHorizontal: 16,
            backgroundColor: palette.primary,
            borderRadius: radius,
            paddingVertical: 17,
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
