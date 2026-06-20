import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { api, Dues, inr, LoanSummary, ScheduleRow } from "../../src/lib/api";
import { useTheme } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { RepaymentChart } from "../../src/components/RepaymentChart";
import { radiusLg, radius } from "../../src/lib/theme";

export default function LoanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const { contentMaxWidth } = useResponsive();
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
      <View style={{ flex: 1, backgroundColor: palette.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
      <Text style={{ fontSize: 14, color: bold ? palette.text : palette.muted, fontWeight: bold ? "700" : "400" }}>
        {label}
      </Text>
      <Text style={{ fontSize: bold ? 18 : 14, color: palette.text, fontWeight: bold ? "800" : "600" }}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
    >
      {/* Hero balance card */}
      <View style={{ backgroundColor: palette.accent, borderRadius: radiusLg, padding: 22, marginBottom: 14 }}>
        <Text style={{ color: palette.onAccent, opacity: 0.8, fontSize: 13 }}>Outstanding principal</Text>
        <Text style={{ color: palette.onAccent, fontSize: 34, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 }}>
          {inr(dues?.principal_outstanding)}
        </Text>
        <Text style={{ color: palette.onAccent, opacity: 0.8, fontSize: 13, marginTop: 6 }}>
          {loan?.loan_product} · {loan?.status}
        </Text>
      </View>

      {loan ? (
        <RepaymentChart
          loanAmount={loan.loan_amount}
          paid={loan.total_amount_paid}
          totalPayment={loan.total_payment || loan.loan_amount}
          totalInterest={Math.max((loan.total_payment || 0) - loan.loan_amount, 0)}
        />
      ) : null}

      {kyc ? (
        <View
          style={{
            backgroundColor: palette.card,
            borderRadius: radius,
            padding: 16,
            marginBottom: 14,
            borderWidth: 1.5,
            borderColor: kyc.verified ? palette.accent : palette.warning,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: palette.muted }}>eKYC / e-Sign</Text>
          <Text style={{ fontSize: 15, fontWeight: "800", color: kyc.verified ? palette.accentDark : palette.warning }}>
            {kyc.verified ? "✓ Verified" : kyc.status || "Pending"}
          </Text>
        </View>
      ) : null}

      <View style={{ backgroundColor: palette.card, borderRadius: radiusLg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: palette.border }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, marginBottom: 12 }}>Amount due</Text>
        <Row label="Overdue principal" value={inr(dues?.overdue_principal)} />
        <Row label="Overdue interest" value={inr(dues?.overdue_interest)} />
        <Row label="Penalty" value={inr(dues?.penalty_amount)} />
        <Row label="Charges" value={inr(dues?.charges)} />
        <View style={{ height: 1, backgroundColor: palette.border, marginVertical: 8 }} />
        <Row label="Total due" value={inr(dues?.total_due)} bold />
        {dues?.oldest_due_date ? (
          <Text style={{ fontSize: 12, color: palette.warning, marginTop: 8 }}>
            Oldest due date: {String(dues.oldest_due_date).slice(0, 10)}
          </Text>
        ) : null}
        <Pressable
          style={{ backgroundColor: palette.primary, borderRadius: radius, paddingVertical: 15, alignItems: "center", marginTop: 16 }}
          onPress={() =>
            Alert.alert(
              "Online payment coming soon",
              "Paying EMIs in-app will be enabled once a payment gateway (Razorpay / UPI) is connected. Until then, please use your existing repayment channel."
            )
          }
        >
          <Text style={{ color: palette.onPrimary, fontSize: 16, fontWeight: "700" }}>Pay {inr(dues?.total_due)}</Text>
        </Pressable>
      </View>

      <View style={{ backgroundColor: palette.card, borderRadius: radiusLg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: palette.border }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, marginBottom: 12 }}>EMI schedule</Text>
        {schedule.length === 0 ? (
          <Text style={{ fontSize: 13, color: palette.muted }}>No schedule available.</Text>
        ) : (
          schedule.map((row, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 10,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: palette.border,
              }}
            >
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: palette.text }}>
                  {String(row.payment_date).slice(0, 10)}
                </Text>
                <Text style={{ fontSize: 13, color: palette.muted, marginTop: 2 }}>
                  P {inr(row.principal_amount)} · I {inr(row.interest_amount)}
                </Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: palette.text }}>{inr(row.total_payment)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
