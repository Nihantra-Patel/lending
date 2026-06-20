import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { JourneyField } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";
import { radius } from "../lib/theme";

/**
 * Renders one onboarding field from the backend journey schema. Keeps the app
 * free of any per-product-type code — the form is entirely data-driven.
 */
export function DynamicField({
  field,
  value,
  onChange,
}: {
  field: JourneyField;
  value: string;
  onChange: (v: string) => void;
}) {
  const { palette } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  const label = (
    <Text style={{ fontSize: 13, fontWeight: "600", color: palette.muted, marginBottom: 6 }}>
      {field.label}
      {field.reqd ? <Text style={{ color: palette.danger }}> *</Text> : null}
    </Text>
  );

  const baseInput = {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.card,
  } as const;

  if (field.fieldtype === "Select") {
    return (
      <View style={{ marginBottom: 16 }}>
        {label}
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{ ...baseInput, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <Text style={{ color: value ? palette.text : palette.muted, fontSize: 15 }}>
            {value || `Select ${field.label.toLowerCase()}`}
          </Text>
          <Text style={{ color: palette.muted }}>▾</Text>
        </Pressable>
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setPickerOpen(false)}>
            <Pressable style={{ backgroundColor: palette.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%" }} onPress={(e) => e.stopPropagation()}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: palette.text, padding: 18 }}>{field.label}</Text>
              <ScrollView>
                {field.options.map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      onChange(opt);
                      setPickerOpen(false);
                    }}
                    style={{ paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: value === opt ? palette.accentSoft : "transparent" }}
                  >
                    <Text style={{ fontSize: 15, color: palette.text, fontWeight: value === opt ? "700" : "400" }}>{opt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  if (field.fieldtype === "Check") {
    return (
      <Pressable
        onPress={() => onChange(value === "1" ? "" : "1")}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: value === "1" ? palette.accent : palette.border,
            backgroundColor: value === "1" ? palette.accent : "transparent",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
          }}
        >
          {value === "1" ? <Text style={{ color: palette.onAccent, fontWeight: "800" }}>✓</Text> : null}
        </View>
        <Text style={{ fontSize: 15, color: palette.text }}>{field.label}</Text>
      </Pressable>
    );
  }

  if (field.fieldtype === "File") {
    // True uploads need native file pickers; for the portal we capture a reference/URL.
    return (
      <View style={{ marginBottom: 16 }}>
        {label}
        <TextInput
          style={baseInput}
          placeholder={field.placeholder || "Paste a document link or reference"}
          placeholderTextColor={palette.muted}
          value={value}
          onChangeText={onChange}
        />
        {field.help_text ? <Text style={{ fontSize: 11, color: palette.muted, marginTop: 4 }}>{field.help_text}</Text> : null}
      </View>
    );
  }

  const keyboard =
    field.fieldtype === "Number" || field.fieldtype === "Float"
      ? "numeric"
      : field.fieldtype === "Email"
        ? "email-address"
        : field.fieldtype === "Phone"
          ? "phone-pad"
          : "default";

  return (
    <View style={{ marginBottom: 16 }}>
      {label}
      <TextInput
        style={[baseInput, field.fieldtype === "Text" ? { height: 84, textAlignVertical: "top" } : null]}
        placeholder={field.placeholder || field.label}
        placeholderTextColor={palette.muted}
        keyboardType={keyboard as never}
        multiline={field.fieldtype === "Text"}
        autoCapitalize={field.fieldtype === "Email" ? "none" : "sentences"}
        value={value}
        onChangeText={onChange}
      />
      {field.help_text ? <Text style={{ fontSize: 11, color: palette.muted, marginTop: 4 }}>{field.help_text}</Text> : null}
    </View>
  );
}
