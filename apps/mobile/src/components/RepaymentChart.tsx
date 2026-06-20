import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { inr } from "../lib/api";
import { theme } from "../lib/theme";

/**
 * Repayment progress ring + principal/interest breakdown — the at-a-glance
 * analytics a borrower expects (how much of the loan is paid off, and what the
 * total payment splits into). Pure SVG, no chart library.
 */
export function RepaymentChart({
  loanAmount,
  paid,
  totalPayment,
  totalInterest,
}: {
  loanAmount: number;
  paid: number;
  totalPayment: number;
  totalInterest: number;
}) {
  const size = 132;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const progress = totalPayment > 0 ? Math.min(paid / totalPayment, 1) : 0;
  const principal = Math.max(totalPayment - totalInterest, 0);
  const principalPct = totalPayment > 0 ? (principal / totalPayment) * 100 : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Repayment progress</Text>
      <View style={styles.row}>
        <View style={styles.ringWrap}>
          <Svg width={size} height={size}>
            <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={theme.border}
                strokeWidth={stroke}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={theme.success}
                strokeWidth={stroke}
                strokelinecap="round"
                fill="none"
                strokeDasharray={`${c}`}
                strokeDashoffset={c * (1 - progress)}
              />
            </G>
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringPct}>{Math.round(progress * 100)}%</Text>
            <Text style={styles.ringLabel}>repaid</Text>
          </View>
        </View>

        <View style={styles.legend}>
          <Legend color={theme.success} label="Paid" value={inr(paid)} />
          <Legend
            color={theme.border}
            label="Remaining"
            value={inr(Math.max(totalPayment - paid, 0))}
          />
        </View>
      </View>

      <Text style={[styles.title, { marginTop: 18 }]}>What you pay</Text>
      <View style={styles.breakdownBar}>
        <View style={[styles.barSeg, { flex: principalPct, backgroundColor: theme.accent }]} />
        <View
          style={[styles.barSeg, { flex: 100 - principalPct, backgroundColor: theme.warning }]}
        />
      </View>
      <View style={styles.breakdownLegend}>
        <Legend color={theme.accent} label="Principal" value={inr(principal)} />
        <Legend color={theme.warning} label="Interest" value={inr(totalInterest)} />
      </View>
    </View>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radiusLg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  title: { fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 18 },
  ringWrap: { width: 132, height: 132, justifyContent: "center", alignItems: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringPct: { fontSize: 26, fontWeight: "800", color: theme.text },
  ringLabel: { fontSize: 12, color: theme.muted },
  legend: { flex: 1, gap: 12 },
  legendRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { fontSize: 13, color: theme.muted, flex: 1 },
  legendValue: { fontSize: 13, fontWeight: "700", color: theme.text },
  breakdownBar: {
    flexDirection: "row",
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    marginBottom: 12,
  },
  barSeg: { height: "100%" },
  breakdownLegend: { gap: 10 },
});
