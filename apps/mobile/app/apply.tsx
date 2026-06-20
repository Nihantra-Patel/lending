import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, inr, LoanProduct } from "../src/lib/api";
import { useTheme } from "../src/lib/ThemeContext";
import { useResponsive } from "../src/lib/responsive";
import { radius, radiusLg } from "../src/lib/theme";

export default function Apply() {
  const router = useRouter();
  const { palette } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [selected, setSelected] = useState<LoanProduct | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
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

  // Accurate repayment estimate from the backend schedule engine (debounced).
  const [estimate, setEstimate] = useState<{ emi: number; total_payable: number; total_interest: number } | null>(null);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    const amt = Number(amount);
    const months = Number(tenure);
    if (!selected || !amt || amt <= 0 || !months) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    setEstimating(true);
    const t = setTimeout(async () => {
      try {
        const e = await api.estimate(selected.name, amt, months);
        if (!cancelled) setEstimate(e);
      } catch {
        if (!cancelled) setEstimate(null);
      } finally {
        if (!cancelled) setEstimating(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [amount, tenure, selected]);

  const overLimit = selected && Number(amount) > selected.maximum_loan_amount;

  const submit = async () => {
    if (!selected) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Enter amount", "Please enter a valid loan amount.");
      return;
    }
    if (overLimit) {
      Alert.alert("Amount too high", `Maximum for this product is ${inr(selected.maximum_loan_amount)}.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.apply({
        loan_product: selected.name,
        loan_amount: amt,
        repayment_periods: Number(tenure) || 12,
      });
      // Go straight to the new application so the borrower sees the journey + eKYC.
      router.replace(`/application/${res.loan_application}`);
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
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700" as const,
    color: palette.text,
    backgroundColor: palette.card,
  };
  const label = (t: string) => (
    <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted, marginTop: 18, marginBottom: 8 }}>{t}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Explicit back row so it always works on web + native */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingVertical: 4, paddingRight: 12 }}>
          <Text style={{ fontSize: 22, color: palette.text }}>‹</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: palette.text }}>Apply for a loan</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
      >
        <Text style={{ fontSize: 24, fontWeight: "800", color: palette.text, letterSpacing: -0.5 }}>
          Online loans designed for you
        </Text>
        <Text style={{ fontSize: 14, color: palette.muted, marginTop: 6 }}>Choose a product and your conditions.</Text>

        {label("Loan product")}
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{ ...inputStyle, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: palette.text }}>
            {selected?.product_name ?? "Select a product"}
          </Text>
          <Text style={{ color: palette.muted, fontSize: 14 }}>▾</Text>
        </Pressable>

        {/* Selected product details */}
        {selected ? (
          <View
            style={{
              backgroundColor: palette.card,
              borderRadius: radiusLg,
              borderWidth: 1,
              borderColor: palette.border,
              padding: 16,
              marginTop: 12,
              gap: 10,
            }}
          >
            <Detail label="Interest rate" value={`${selected.rate_of_interest}% p.a.`} palette={palette} />
            <Detail label="Maximum amount" value={inr(selected.maximum_loan_amount)} palette={palette} />
            <Detail label="Schedule" value={selected.repayment_schedule_type} palette={palette} />
          </View>
        ) : null}

        {label("Loan amount (₹)")}
        <TextInput
          style={[inputStyle, overLimit ? { borderColor: palette.danger } : null]}
          keyboardType="numeric"
          placeholder="50000"
          placeholderTextColor={palette.muted}
          value={amount}
          onChangeText={setAmount}
        />
        {overLimit ? (
          <Text style={{ color: palette.danger, fontSize: 12, marginTop: 6 }}>
            Max for this product is {inr(selected!.maximum_loan_amount)}
          </Text>
        ) : null}

        {label("Tenure (months)")}
        <TextInput
          style={inputStyle}
          keyboardType="numeric"
          placeholder="12"
          placeholderTextColor={palette.muted}
          value={tenure}
          onChangeText={setTenure}
        />

        {/* Live estimate from the real schedule engine */}
        {estimate || estimating ? (
          <View style={{ backgroundColor: palette.accentSoft, borderRadius: radiusLg, padding: 16, marginTop: 18 }}>
            <Text style={{ fontSize: 13, color: palette.accentDark, fontWeight: "600" }}>Estimated monthly EMI</Text>
            {estimating && !estimate ? (
              <ActivityIndicator color={palette.accentDark} style={{ alignSelf: "flex-start", marginTop: 8 }} />
            ) : estimate ? (
              <>
                <Text style={{ fontSize: 28, fontWeight: "800", color: palette.text, marginTop: 2 }}>
                  {inr(estimate.emi)}
                </Text>
                <Text style={{ fontSize: 12, color: palette.muted, marginTop: 4 }}>
                  You repay {inr(estimate.total_payable)} over {tenure} months (incl.{" "}
                  {inr(estimate.total_interest)} interest).
                </Text>
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky CTA */}
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
            opacity: submitting ? 0.7 : 1,
          }}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={palette.onPrimary} />
          ) : (
            <Text style={{ color: palette.onPrimary, fontSize: 16, fontWeight: "700" }}>Apply Now</Text>
          )}
        </Pressable>
      </View>

      {/* Product picker dropdown */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            style={{ backgroundColor: palette.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: insets.bottom + 8 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: palette.border }} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: palette.text, paddingHorizontal: 20, paddingBottom: 8 }}>
              Select a loan product
            </Text>
            <ScrollView>
              {products.map((p) => {
                const active = selected?.name === p.name;
                return (
                  <Pressable
                    key={p.name}
                    onPress={() => {
                      setSelected(p);
                      setPickerOpen(false);
                    }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderTopWidth: 1,
                      borderTopColor: palette.border,
                      backgroundColor: active ? palette.accentSoft : "transparent",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: palette.text }}>{p.product_name}</Text>
                      <Text style={{ fontSize: 13, color: palette.muted, marginTop: 2 }}>
                        {p.rate_of_interest}% · up to {inr(p.maximum_loan_amount)}
                      </Text>
                    </View>
                    {active ? <Text style={{ color: palette.accentDark, fontWeight: "800" }}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Detail({ label, value, palette }: { label: string; value: string; palette: import("../src/lib/theme").Palette }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 14, color: palette.muted }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: palette.text }}>{value}</Text>
    </View>
  );
}
