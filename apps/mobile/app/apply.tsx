import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, inr, LoanProduct } from "../src/lib/api";
import { theme } from "../src/lib/theme";

export default function Apply() {
  const router = useRouter();
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
      Alert.alert("Application submitted", res.message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Could not apply", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Loan product</Text>
      <View style={styles.products}>
        {products.map((p) => {
          const active = selected?.name === p.name;
          return (
            <Pressable
              key={p.name}
              style={[styles.product, active && styles.productActive]}
              onPress={() => setSelected(p)}
            >
              <Text style={[styles.productName, active && { color: "#fff" }]}>{p.product_name}</Text>
              <Text style={[styles.productMeta, active && { color: "#cdd9ff" }]}>
                {p.rate_of_interest}% · up to {inr(p.maximum_loan_amount)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Loan amount (₹)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="50000"
        placeholderTextColor={theme.muted}
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Tenure (months)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="12"
        placeholderTextColor={theme.muted}
        value={tenure}
        onChangeText={setTenure}
      />

      <Pressable
        style={[styles.button, submitting && { opacity: 0.7 }]}
        onPress={submit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit application</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "600", color: theme.muted, marginTop: 16, marginBottom: 8 },
  products: { gap: 10 },
  product: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  productActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  productName: { fontSize: 15, fontWeight: "700", color: theme.text },
  productMeta: { fontSize: 13, color: theme.muted, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
