import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, inr, Journey, JourneyMeta, LoanProduct } from "../src/lib/api";
import { DynamicField } from "../src/components/DynamicField";
import { useTheme } from "../src/lib/ThemeContext";
import { useResponsive } from "../src/lib/responsive";
import { radius, radiusLg } from "../src/lib/theme";

export default function Apply() {
  const router = useRouter();
  const { palette } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [journeyTypes, setJourneyTypes] = useState<JourneyMeta[]>([]);
  const [product, setProduct] = useState<LoanProduct | null>(null);
  const [journeyType, setJourneyType] = useState<JourneyMeta | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("12");
  const [estimate, setEstimate] = useState<{ emi: number; total_payable: number; total_interest: number } | null>(null);
  const [productPicker, setProductPicker] = useState(false);
  const [journeyPicker, setJourneyPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, j] = await Promise.all([api.getLoanProducts(), api.listJourneys()]);
        setProducts(p);
        setJourneyTypes(j);
        setProduct(p[0] ?? null);
        setJourneyType(j[0] ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Debounced EMI estimate
  useEffect(() => {
    const amt = Number(amount);
    const months = Number(tenure);
    if (!product || !amt || amt <= 0 || !months) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const e = await api.estimate(product.name, amt, months);
        if (!cancelled) setEstimate(e);
      } catch {
        if (!cancelled) setEstimate(null);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [amount, tenure, product]);

  const overLimit = product && Number(amount) > product.maximum_loan_amount;

  const goToStep2 = async () => {
    if (!product || !journeyType) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return Alert.alert("Enter amount", "Please enter a valid loan amount.");
    if (overLimit) return Alert.alert("Amount too high", `Maximum is ${inr(product.maximum_loan_amount)}.`);
    setSubmitting(true);
    try {
      const j = await api.getJourney(journeyType.journey_type);
      setJourney(j);
      setStep(2);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!product || !journey) return;
    // Validate required journey fields
    for (const sec of journey.sections) {
      for (const f of sec.fields) {
        if (f.reqd && !values[f.fieldname]) {
          return Alert.alert("Missing field", `Please fill "${f.label}".`);
        }
      }
    }
    setSubmitting(true);
    try {
      const res = await api.apply({
        loan_product: product.name,
        loan_amount: Number(amount),
        repayment_periods: Number(tenure) || 12,
        journey_type: journey.journey_type,
        journey_data: JSON.stringify(values),
      });
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
  const fieldLabel = (t: string) => (
    <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted, marginTop: 18, marginBottom: 8 }}>{t}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header with back / step */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => (step === 2 ? setStep(1) : router.back())} hitSlop={10} style={{ paddingVertical: 4, paddingRight: 12 }}>
          <Text style={{ fontSize: 24, color: palette.text }}>‹</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: palette.text }}>
          {step === 1 ? "Apply for a loan" : journey?.title}
        </Text>
        <Text style={{ marginLeft: "auto", fontSize: 13, color: palette.muted }}>Step {step}/2</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}>
        {step === 1 ? (
          <>
            <Text style={{ fontSize: 24, fontWeight: "800", color: palette.text, letterSpacing: -0.5 }}>Online loans designed for you</Text>
            <Text style={{ fontSize: 14, color: palette.muted, marginTop: 6 }}>Choose your loan and conditions.</Text>

            {fieldLabel("Loan type")}
            <Pressable onPress={() => setJourneyPicker(true)} style={{ ...inputStyle, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: palette.text }}>{journeyType?.title ?? "Select"}</Text>
              <Text style={{ color: palette.muted }}>▾</Text>
            </Pressable>

            {fieldLabel("Loan product")}
            <Pressable onPress={() => setProductPicker(true)} style={{ ...inputStyle, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: palette.text }}>{product?.product_name ?? "Select"}</Text>
              <Text style={{ color: palette.muted }}>▾</Text>
            </Pressable>
            {product ? (
              <View style={{ backgroundColor: palette.card, borderRadius: radiusLg, borderWidth: 1, borderColor: palette.border, padding: 16, marginTop: 12, gap: 10 }}>
                <Row label="Interest rate" value={`${product.rate_of_interest}% p.a.`} palette={palette} />
                <Row label="Maximum amount" value={inr(product.maximum_loan_amount)} palette={palette} />
              </View>
            ) : null}

            {fieldLabel("Loan amount (₹)")}
            <TextInput style={[inputStyle, overLimit ? { borderColor: palette.danger } : null]} keyboardType="numeric" placeholder="50000" placeholderTextColor={palette.muted} value={amount} onChangeText={setAmount} />

            {fieldLabel("Tenure (months)")}
            <TextInput style={inputStyle} keyboardType="numeric" placeholder="12" placeholderTextColor={palette.muted} value={tenure} onChangeText={setTenure} />

            {estimate ? (
              <View style={{ backgroundColor: palette.accentSoft, borderRadius: radiusLg, padding: 16, marginTop: 18 }}>
                <Text style={{ fontSize: 13, color: palette.accentDark, fontWeight: "600" }}>Estimated monthly EMI</Text>
                <Text style={{ fontSize: 28, fontWeight: "800", color: palette.text, marginTop: 2 }}>{inr(estimate.emi)}</Text>
                <Text style={{ fontSize: 12, color: palette.muted, marginTop: 4 }}>
                  You repay {inr(estimate.total_payable)} over {tenure} months (incl. {inr(estimate.total_interest)} interest).
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text style={{ fontSize: 14, color: palette.muted, marginBottom: 4 }}>
              {inr(Number(amount))} · {product?.product_name}
            </Text>
            {journey?.sections.map((sec) => (
              <View key={sec.title} style={{ marginTop: 18 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, marginBottom: 12 }}>{sec.title}</Text>
                {sec.fields.map((f) => (
                  <DynamicField key={f.fieldname} field={f} value={values[f.fieldname] || ""} onChange={(v) => setValues((p) => ({ ...p, [f.fieldname]: v }))} />
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 10, backgroundColor: palette.bg, borderTopWidth: 1, borderTopColor: palette.border, alignItems: "center" }}>
        <Pressable
          style={{ width: "100%", maxWidth: contentMaxWidth - 32, backgroundColor: palette.primary, borderRadius: radius, paddingVertical: 16, alignItems: "center", opacity: submitting ? 0.7 : 1 }}
          onPress={step === 1 ? goToStep2 : submit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={palette.onPrimary} /> : <Text style={{ color: palette.onPrimary, fontSize: 16, fontWeight: "700" }}>{step === 1 ? "Continue" : "Submit application"}</Text>}
        </Pressable>
      </View>

      {/* Pickers */}
      <PickerSheet
        open={journeyPicker}
        title="Select loan type"
        options={journeyTypes.map((j) => ({ key: j.journey_type, label: j.title }))}
        selected={journeyType?.journey_type}
        onSelect={(k) => setJourneyType(journeyTypes.find((j) => j.journey_type === k) || null)}
        onClose={() => setJourneyPicker(false)}
        insetBottom={insets.bottom}
      />
      <PickerSheet
        open={productPicker}
        title="Select loan product"
        options={products.map((p) => ({ key: p.name, label: p.product_name, sub: `${p.rate_of_interest}% · up to ${inr(p.maximum_loan_amount)}` }))}
        selected={product?.name}
        onSelect={(k) => setProduct(products.find((p) => p.name === k) || null)}
        onClose={() => setProductPicker(false)}
        insetBottom={insets.bottom}
      />
    </View>
  );
}

function Row({ label, value, palette }: { label: string; value: string; palette: import("../src/lib/theme").Palette }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 14, color: palette.muted }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: palette.text }}>{value}</Text>
    </View>
  );
}

function PickerSheet({
  open,
  title,
  options,
  selected,
  onSelect,
  onClose,
  insetBottom,
}: {
  open: boolean;
  title: string;
  options: { key: string; label: string; sub?: string }[];
  selected?: string;
  onSelect: (key: string) => void;
  onClose: () => void;
  insetBottom: number;
}) {
  const { palette } = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={onClose}>
        <Pressable style={{ backgroundColor: palette.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: insetBottom + 8 }} onPress={(e) => e.stopPropagation()}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: palette.text, padding: 18 }}>{title}</Text>
          <ScrollView>
            {options.map((o) => (
              <Pressable
                key={o.key}
                onPress={() => {
                  onSelect(o.key);
                  onClose();
                }}
                style={{ paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: selected === o.key ? palette.accentSoft : "transparent", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
              >
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: palette.text }}>{o.label}</Text>
                  {o.sub ? <Text style={{ fontSize: 13, color: palette.muted, marginTop: 2 }}>{o.sub}</Text> : null}
                </View>
                {selected === o.key ? <Text style={{ color: palette.accentDark, fontWeight: "800" }}>✓</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
