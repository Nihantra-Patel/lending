import { View, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { inr } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";
import { radiusLg } from "../lib/theme";

/**
 * Repayment progress ring + principal/interest breakdown — the at-a-glance
 * analytics a borrower expects. Pure SVG, theme-aware.
 */
export function RepaymentChart({
  paid,
  totalPayment,
  totalInterest,
}: {
  loanAmount: number;
  paid: number;
  totalPayment: number;
  totalInterest: number;
}) {
  const { palette } = useTheme();
  const size = 132;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const progress = totalPayment > 0 ? Math.min(paid / totalPayment, 1) : 0;
  const principal = Math.max(totalPayment - totalInterest, 0);
  const principalPct = totalPayment > 0 ? (principal / totalPayment) * 100 : 0;

  const Legend = ({ color, label, value }: { color: string; label: string; value: string }) => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, marginRight: 8, backgroundColor: color }} />
      <Text style={{ fontSize: 13, color: palette.muted, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color: palette.text }}>{value}</Text>
    </View>
  );

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radiusLg,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: palette.border,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, marginBottom: 14 }}>
        Repayment progress
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
          <Svg width={size} height={size}>
            <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={palette.border} strokeWidth={stroke} fill="none" />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={palette.accent}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${c}`}
                strokeDashoffset={c * (1 - progress)}
              />
            </G>
          </Svg>
          <View style={{ position: "absolute", alignItems: "center" }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: palette.text }}>
              {Math.round(progress * 100)}%
            </Text>
            <Text style={{ fontSize: 12, color: palette.muted }}>repaid</Text>
          </View>
        </View>

        <View style={{ flex: 1, gap: 12 }}>
          <Legend color={palette.accent} label="Paid" value={inr(paid)} />
          <Legend color={palette.border} label="Remaining" value={inr(Math.max(totalPayment - paid, 0))} />
        </View>
      </View>

      <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, marginTop: 18, marginBottom: 14 }}>
        What you pay
      </Text>
      <View style={{ flexDirection: "row", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 12 }}>
        <View style={{ flex: principalPct, backgroundColor: palette.accent }} />
        <View style={{ flex: 100 - principalPct, backgroundColor: palette.warning }} />
      </View>
      <View style={{ gap: 10 }}>
        <Legend color={palette.accent} label="Principal" value={inr(principal)} />
        <Legend color={palette.warning} label="Interest" value={inr(totalInterest)} />
      </View>
    </View>
  );
}
