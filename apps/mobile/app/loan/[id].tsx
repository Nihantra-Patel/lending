import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, Dues, inr, LoanSummary, ScheduleRow } from "../../src/lib/api";
import { theme } from "../../src/lib/theme";

export default function LoanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<LoanSummary | null>(null);
  const [dues, setDues] = useState<Dues | null>(null);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [kyc, setKyc] = useState<{ status: string | null; verified: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [l, d, s, k] = await Promise.all([
          api.getLoan(id),
          api.getDues(id),
          api.getSchedule(id),
          api.getKycStatus(id),
        ]);
        setLoan(l);
        setDues(d);
        setSchedule(s);
        setKyc(k);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Outstanding principal</Text>
        <Text style={styles.heroAmount}>{inr(dues?.principal_outstanding)}</Text>
        <Text style={styles.heroMeta}>
          {loan?.loan_product} · {loan?.status}
        </Text>
      </View>

      {kyc ? (
        <View
          style={[
            styles.kyc,
            { borderColor: kyc.verified ? theme.success : theme.warning },
          ]}
        >
          <Text style={styles.kycLabel}>eKYC / e-Sign</Text>
          <Text
            style={[
              styles.kycStatus,
              { color: kyc.verified ? theme.success : theme.warning },
            ]}
          >
            {kyc.verified ? "✓ Verified" : kyc.status || "Pending"}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Amount due</Text>
        <Row label="Overdue principal" value={inr(dues?.overdue_principal)} />
        <Row label="Overdue interest" value={inr(dues?.overdue_interest)} />
        <Row label="Penalty" value={inr(dues?.penalty_amount)} />
        <Row label="Charges" value={inr(dues?.charges)} />
        <View style={styles.divider} />
        <Row label="Total due" value={inr(dues?.total_due)} bold />
        {dues?.oldest_due_date ? (
          <Text style={styles.dueDate}>Oldest due date: {String(dues.oldest_due_date).slice(0, 10)}</Text>
        ) : null}
        <Pressable
          style={styles.payButton}
          onPress={() =>
            Alert.alert("Pay EMI", "Payment gateway integration goes here (Razorpay/UPI).")
          }
        >
          <Text style={styles.payText}>Pay {inr(dues?.total_due)}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>EMI schedule</Text>
        {schedule.length === 0 ? (
          <Text style={styles.meta}>No schedule available.</Text>
        ) : (
          schedule.map((row, i) => (
            <View key={i} style={styles.emiRow}>
              <View>
                <Text style={styles.emiDate}>{String(row.payment_date).slice(0, 10)}</Text>
                <Text style={styles.meta}>
                  P {inr(row.principal_amount)} · I {inr(row.interest_amount)}
                </Text>
              </View>
              <Text style={styles.emiTotal}>{inr(row.total_payment)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && { color: theme.text, fontWeight: "700" }]}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: "800", fontSize: 18 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hero: {
    backgroundColor: theme.primary,
    borderRadius: 18,
    padding: 22,
    marginBottom: 14,
  },
  heroLabel: { color: "#cdd9ff", fontSize: 13 },
  heroAmount: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 },
  heroMeta: { color: "#cdd9ff", fontSize: 13, marginTop: 6 },
  kyc: {
    backgroundColor: theme.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kycLabel: { fontSize: 14, fontWeight: "600", color: theme.muted },
  kycStatus: { fontSize: 15, fontWeight: "800" },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  rowLabel: { fontSize: 14, color: theme.muted },
  rowValue: { fontSize: 14, color: theme.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 8 },
  dueDate: { fontSize: 12, color: theme.warning, marginTop: 8 },
  payButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  payText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  emiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  emiDate: { fontSize: 14, fontWeight: "600", color: theme.text },
  emiTotal: { fontSize: 15, fontWeight: "700", color: theme.text },
  meta: { fontSize: 13, color: theme.muted, marginTop: 2 },
});
