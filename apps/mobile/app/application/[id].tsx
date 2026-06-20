import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { api, Application, inr } from "../../src/lib/api";
import { useTheme } from "../../src/lib/ThemeContext";
import { useResponsive } from "../../src/lib/responsive";
import { radius, radiusLg, Palette } from "../../src/lib/theme";

type Flow = { has_workflow: boolean; workflow?: string; state: string; actions: string[] };
type Kyc = { available?: boolean; status: string | null; verified: boolean };

export default function ApplicationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const { contentMaxWidth } = useResponsive();
  const [app, setApp] = useState<Application | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [a, f] = await Promise.all([api.getApplication(id), api.getApplicationFlow(id)]);
    setApp(a);
    setFlow(f);
    try {
      setKyc(await api.getKycStatusForApplication(id));
    } catch {
      setKyc(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action: string) => {
    if (!id) return;
    setActing(true);
    try {
      const res = await api.applyApplicationAction(id, action);
      Alert.alert("Done", res.message);
      await load();
    } catch (e) {
      Alert.alert("Could not complete", (e as Error).message);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  const steps = buildSteps(flow, kyc);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, width: "100%", maxWidth: contentMaxWidth, alignSelf: "center" }}
    >
      {/* Hero */}
      <View style={{ backgroundColor: palette.primary, borderRadius: radiusLg, padding: 22, marginBottom: 14 }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Application · {app?.loan_product}</Text>
        <Text style={{ color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 4 }}>{inr(app?.loan_amount)}</Text>
        <View style={{ alignSelf: "flex-start", marginTop: 10, backgroundColor: palette.accent, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ color: palette.onAccent, fontWeight: "700", fontSize: 13 }}>{app?.stage}</Text>
        </View>
      </View>

      {/* Progress / journey */}
      <View style={{ backgroundColor: palette.card, borderRadius: radiusLg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: palette.border }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, marginBottom: 14 }}>Your application journey</Text>
        {steps.map((s, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: i === steps.length - 1 ? 0 : 14 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: s.done ? palette.accent : s.active ? palette.warning : palette.border,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>{s.done ? "✓" : i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: palette.text }}>{s.title}</Text>
              {s.subtitle ? <Text style={{ fontSize: 12, color: palette.muted, marginTop: 2 }}>{s.subtitle}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {/* eKYC card */}
      <KycCard kyc={kyc} flow={flow} palette={palette} />

      {/* Actions available to the borrower (workflow-driven) */}
      {flow?.actions?.length ? (
        <View style={{ backgroundColor: palette.card, borderRadius: radiusLg, padding: 18, borderWidth: 1, borderColor: palette.border }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, marginBottom: 12 }}>Next steps</Text>
          {flow.actions.map((a) => (
            <Pressable
              key={a}
              disabled={acting}
              onPress={() => runAction(a)}
              style={{ backgroundColor: palette.primary, borderRadius: radius, paddingVertical: 14, alignItems: "center", marginBottom: 8, opacity: acting ? 0.7 : 1 }}
            >
              {acting ? <ActivityIndicator color={palette.onPrimary} /> : <Text style={{ color: palette.onPrimary, fontWeight: "700" }}>{a}</Text>}
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={{ fontSize: 13, color: palette.muted, textAlign: "center", marginTop: 4 }}>
          {flow?.has_workflow
            ? "Your application is being processed. We'll update this page as it progresses."
            : "Your application has been submitted and is under review."}
        </Text>
      )}
    </ScrollView>
  );
}

function KycCard({ kyc, flow, palette }: { kyc: Kyc | null; flow: Flow | null; palette: Palette }) {
  if (!kyc) return null;
  const verified = kyc.verified;
  const pending = !verified && (flow?.state?.toLowerCase().includes("kyc") || kyc.status);
  const color = verified ? palette.accentDark : pending ? palette.warning : palette.muted;
  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radiusLg,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: color,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: palette.text }}>eKYC / e-Sign</Text>
        <Text style={{ fontSize: 12, color: palette.muted, marginTop: 2 }}>
          {verified ? "Identity verified" : pending ? "Complete the KYC link sent to you" : "Not started yet"}
        </Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: "800", color }}>{verified ? "✓ Verified" : kyc.status || "Pending"}</Text>
    </View>
  );
}

function buildSteps(flow: Flow | null, kyc: Kyc | null) {
  // A friendly, generic journey view derived from the workflow state + KYC.
  const state = (flow?.state || "Submitted").toLowerCase();
  const order = ["submitted", "review", "kyc", "approve", "sign", "disbursed"];
  const idx = order.findIndex((k) => state.includes(k));
  const cur = idx < 0 ? 0 : idx;
  return [
    { title: "Application submitted", subtitle: "We received your request", done: true, active: false },
    { title: "Under review", subtitle: "Lender is reviewing your profile", done: cur > 1, active: cur === 1 },
    {
      title: "eKYC verification",
      subtitle: kyc?.verified ? "Identity verified" : "Complete identity verification",
      done: !!kyc?.verified,
      active: state.includes("kyc"),
    },
    { title: "Approval", subtitle: "Final decision on your loan", done: cur > 3, active: state.includes("approve") },
    { title: "Disbursement", subtitle: "Funds released to your account", done: state.includes("disbursed"), active: false },
  ];
}
