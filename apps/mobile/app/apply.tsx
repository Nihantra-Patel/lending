import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { api, inr, LoanProduct } from "../src/lib/api";
import { useTheme } from "../src/lib/ThemeContext";
import { useResponsive } from "../src/lib/responsive";
import { radius } from "../src/lib/theme";

export default function Apply() {
  const router = useRouter();
  const { palette } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [selected, setSelected] = useState<LoanProduct | null>(null);
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("12");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.getLoanProducts();
        setProducts(p);
        setSelected(p[0] ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async () => {
    if (!selected) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Enter amount", "Please enter a valid loan amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.apply({
        loan_product: selected.name,
        loan_amount: amt,
        repayment_periods: Number(tenure) || 12,
      });
      Alert.alert("Application submitted", res.message, [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert("Could not apply", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: palette.text,
    backgroundColor: palette.card,
  } as const;

  const label = (t: string) => (
    <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted, marginTop: 18, marginBottom: 8 }}>{t}</Text>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
    >
      <Text style={{ fontSize: 26, fontWeight: "800", color: palette.text, letterSpacing: -0.5 }}>
        Online loans designed for you
      </Text>
      <Text style={{ fontSize: 14, color: palette.muted, marginTop: 6 }}>Select your conditions.</Text>

      {label("Loan product")}
      <View style={{ gap: 10 }}>
        {products.map((p) => {
          const active = selected?.name === p.name;
          return (
            <Pressable
              key={p.name}
              style={{
                backgroundColor: active ? palette.accentSoft : palette.card,
                borderRadius: radius,
                padding: 14,
                borderWidth: 1.5,
                borderColor: active ? palette.accent : palette.border,
              }}
              onPress={() => setSelected(p)}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: palette.text }}>{p.product_name}</Text>
              <Text style={{ fontSize: 13, color: palette.muted, marginTop: 2 }}>
                {p.rate_of_interest}% · up to {inr(p.maximum_loan_amount)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {label("Loan amount (₹)")}
      <TextInput style={inputStyle} keyboardType="numeric" placeholder="50000" placeholderTextColor={palette.muted} value={amount} onChangeText={setAmount} />

      {label("Tenure (months)")}
      <TextInput style={inputStyle} keyboardType="numeric" placeholder="12" placeholderTextColor={palette.muted} value={tenure} onChangeText={setTenure} />

      <Pressable
        style={{ backgroundColor: palette.primary, borderRadius: radius, paddingVertical: 16, alignItems: "center", marginTop: 28, opacity: submitting ? 0.7 : 1 }}
        onPress={submit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={palette.onPrimary} />
        ) : (
          <Text style={{ color: palette.onPrimary, fontSize: 16, fontWeight: "700" }}>Apply Now</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
