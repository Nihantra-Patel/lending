import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, inr, LoanSummary } from "../../src/lib/api";
import { theme } from "../../src/lib/theme";
import { useResponsive } from "../../src/lib/responsive";

function StatusPill({ status, npa }: { status: string; npa: number }) {
  const color = npa ? theme.danger : status === "Closed" ? theme.muted : theme.success;
  const label = npa ? "NPA" : status;
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1a` }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function LoanCard({ loan }: { loan: LoanSummary }) {
  return (
    <Link href={`/loan/${loan.name}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.product}>{loan.loan_product}</Text>
          <StatusPill status={loan.status} npa={loan.is_npa} />
        </View>
        <Text style={styles.amount}>{inr(loan.loan_amount)}</Text>
        <View style={styles.row}>
          <Text style={styles.meta}>Paid {inr(loan.total_amount_paid)}</Text>
          {loan.days_past_due > 0 ? (
            <Text style={[styles.meta, { color: theme.warning }]}>
              {loan.days_past_due} days past due
            </Text>
          ) : (
            <Text style={[styles.meta, { color: theme.success }]}>On track</Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

export default function MyLoans() {
  const router = useRouter();
  const { contentMaxWidth } = useResponsive();
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={loans}
        keyExtractor={(l) => l.name}
        style={{ width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No loans yet</Text>
            <Text style={styles.meta}>
              {error ? error : "Tap the button below to apply for your first loan."}
            </Text>
          </View>
        }
        renderItem={({ item }) => <LoanCard loan={item} />}
      />
      <View style={styles.fabWrap} pointerEvents="box-none">
        <Pressable
          style={[styles.fab, { maxWidth: contentMaxWidth - 32 }]}
          onPress={() => router.push("/apply")}
        >
          <Text style={styles.fabText}>+  Apply for a loan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  product: { fontSize: 14, fontWeight: "600", color: theme.muted },
  amount: { fontSize: 24, fontWeight: "800", color: theme.text, marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  meta: { fontSize: 13, color: theme.muted },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: "700" },
  fabWrap: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    width: "100%",
    marginHorizontal: 16,
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
