import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useI18n } from "@/lib/i18n";

export const C = {
  bg: "#020617",
  card: "#0f172a",
  cardAlt: "#111a33",
  border: "rgba(255,255,255,0.08)",
  text: "#f8fafc",
  muted: "#94a3b8",
  faint: "#64748b",
  accent: "#7c3aed",
  accentSoft: "rgba(124,58,237,0.16)",
  accentText: "#c4b5fd",
  success: "#10b981",
  successSoft: "rgba(16,185,129,0.15)",
  warning: "#f59e0b",
  warningSoft: "rgba(245,158,11,0.15)",
  danger: "#ef4444",
  dangerSoft: "rgba(239,68,68,0.15)",
  info: "#38bdf8",
  infoSoft: "rgba(56,189,248,0.15)",
};

export type IconName = keyof typeof Ionicons.glyphMap;

/** Text that aligns to the reading direction (Arabic right, English left). */
export function Txt({ style, muted, bold, size = 14, center, ...props }: TextProps & { muted?: boolean; bold?: boolean; size?: number; center?: boolean }) {
  const { rtl } = useI18n();
  return (
    <Text
      {...props}
      style={[
        { color: muted ? C.muted : C.text, fontSize: size, fontWeight: bold ? "700" : "400", textAlign: center ? "center" : rtl ? "right" : "left", writingDirection: rtl ? "rtl" : "ltr" },
        style,
      ]}
    />
  );
}

/** Lays children in the reading direction. */
export function Row({ children, style, gap = 8 }: { children: React.ReactNode; style?: ViewStyle; gap?: number }) {
  const { rtl } = useI18n();
  return <View style={[{ flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Screen({ children, refreshing, onRefresh, scroll = true, padded = true }: { children: React.ReactNode; refreshing?: boolean; onRefresh?: () => void; scroll?: boolean; padded?: boolean }) {
  const content = padded ? { padding: 16, gap: 14, paddingBottom: 32 } : undefined;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={content}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.accentText} colors={[C.accent]} progressBackgroundColor={C.card} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  const { rtl } = useI18n();
  return (
    <Row style={{ marginBottom: 4 }} gap={12}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={12} style={s.iconBtn}>
          <Ionicons name={rtl ? "chevron-forward" : "chevron-back"} size={22} color={C.text} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Txt size={22} bold>{title}</Txt>
        {subtitle ? <Txt muted size={13}>{subtitle}</Txt> : null}
      </View>
      {right}
    </Row>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }, style]}>
        {children}
      </Pressable>
    );
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <Row style={{ marginTop: 6 }}>
      <Txt bold size={16} style={{ flex: 1 }}>{children}</Txt>
      {right}
    </Row>
  );
}

type Variant = "primary" | "outline" | "danger" | "success" | "ghost";

export function Button({ title, onPress, variant = "primary", loading, disabled, icon, style }: { title: string; onPress: () => void; variant?: Variant; loading?: boolean; disabled?: boolean; icon?: IconName; style?: ViewStyle }) {
  const bg = { primary: C.accent, outline: "transparent", danger: C.danger, success: C.success, ghost: "transparent" }[variant];
  const fg = variant === "outline" || variant === "ghost" ? C.accentText : "#fff";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg, borderWidth: variant === "outline" ? 1 : 0, borderColor: C.accent, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Row gap={8} style={{ justifyContent: "center" }}>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={{ color: fg, fontWeight: "700", fontSize: 15 }}>{title}</Text>
        </Row>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Txt size={13} style={{ color: "#cbd5e1", fontWeight: "600" }}>{label}</Txt>
      {children}
      {hint ? <Txt size={12} style={{ color: C.faint }}>{hint}</Txt> : null}
    </View>
  );
}

export function Input(props: TextInputProps & { ltr?: boolean }) {
  const { rtl } = useI18n();
  const ltr = props.ltr ?? false;
  return (
    <TextInput
      placeholderTextColor={C.faint}
      {...props}
      style={[s.input, { textAlign: ltr ? "left" : rtl ? "right" : "left", writingDirection: ltr ? "ltr" : rtl ? "rtl" : "ltr" }, props.multiline && { minHeight: 90, textAlignVertical: "top" }, props.style]}
    />
  );
}

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const [bg, fg] = TONES[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";
const TONES: Record<Tone, [string, string]> = {
  neutral: ["rgba(148,163,184,0.15)", "#cbd5e1"],
  success: [C.successSoft, "#6ee7b7"],
  warning: [C.warningSoft, "#fcd34d"],
  danger: [C.dangerSoft, "#fca5a5"],
  info: [C.infoSoft, "#7dd3fc"],
  accent: [C.accentSoft, C.accentText],
};

export const STATUS_TONE: Record<string, Tone> = {
  PRESENT: "success", LATE: "warning", ABSENT: "danger", HALF_DAY: "warning", ON_LEAVE: "info", ON_MISSION: "info",
  HOLIDAY: "accent", WEEKEND: "neutral", PENDING: "warning", MANAGER_APPROVED: "info", APPROVED: "success",
  REJECTED: "danger", CANCELLED: "neutral", BLOCKED: "danger", OPEN: "warning", CLOSED: "info", PAID: "success",
};

export function Loading() {
  return (
    <View style={{ padding: 40, alignItems: "center" }}>
      <ActivityIndicator color={C.accentText} size="large" />
    </View>
  );
}

export function Empty({ text, icon = "file-tray-outline" }: { text: string; icon?: IconName }) {
  return (
    <View style={{ padding: 36, alignItems: "center", gap: 10 }}>
      <Ionicons name={icon} size={40} color={C.faint} />
      <Txt muted center>{text}</Txt>
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <Card style={{ borderColor: "rgba(239,68,68,0.35)", backgroundColor: "rgba(239,68,68,0.08)", gap: 10 }}>
      <Row>
        <Ionicons name="alert-circle" size={20} color="#fca5a5" />
        <Txt style={{ flex: 1, color: "#fecaca" }}>{message}</Txt>
      </Row>
      {onRetry && <Button title={t("retry")} variant="outline" onPress={onRetry} />}
    </Card>
  );
}

export function Notice({ text, tone = "info", icon = "information-circle" }: { text: string; tone?: Tone; icon?: IconName }) {
  const [bg, fg] = TONES[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 14, padding: 12 }}>
      <Row>
        <Ionicons name={icon} size={18} color={fg} />
        <Txt style={{ flex: 1, color: fg }} size={13}>{text}</Txt>
      </Row>
    </View>
  );
}

/** Tabs inside a screen (e.g. Leaves | Requests). */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Row gap={6} style={{ backgroundColor: C.card, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border }}>
      {options.map((o) => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: value === o.value ? C.accent : "transparent" }}>
          <Text style={{ color: value === o.value ? "#fff" : C.muted, textAlign: "center", fontWeight: "600" }}>{o.label}</Text>
        </Pressable>
      ))}
    </Row>
  );
}

/** A select as a bottom sheet list. */
export function Picker<T extends string>({ value, options, onChange, placeholder }: { value: T | ""; options: { value: T; label: string }[]; onChange: (v: T) => void; placeholder?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={s.input}>
        <Row>
          <Txt style={{ flex: 1, color: current ? C.text : C.faint }}>{current?.label ?? placeholder ?? t("pick")}</Txt>
          <Ionicons name="chevron-down" size={18} color={C.muted} />
        </Row>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet}>
            <ScrollView style={{ maxHeight: 420 }}>
              {options.map((o) => (
                <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} style={({ pressed }) => [s.option, pressed && { backgroundColor: C.cardAlt }]}>
                  <Row>
                    <Txt style={{ flex: 1 }} bold={o.value === value}>{o.label}</Txt>
                    {o.value === value && <Ionicons name="checkmark" size={20} color={C.accentText} />}
                  </Row>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Date / time field using the native Android picker. Value: "YYYY-MM-DD" or "HH:MM". */
export function DateField({ value, onChange, mode = "date", placeholder }: { value: string; onChange: (v: string) => void; mode?: "date" | "time"; placeholder?: string }) {
  const open = () => {
    const now = new Date();
    let current = now;
    if (value && mode === "date") current = new Date(`${value}T12:00:00`);
    if (value && mode === "time") {
      const [h, m] = value.split(":").map(Number);
      current = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    }
    DateTimePickerAndroid.open({
      value: current,
      mode,
      is24Hour: true,
      onChange: (event, date) => {
        if (event.type === "set" && date) onChange(mode === "date" ? isoDate(date) : hhmm(date));
      },
    });
  };
  return (
    <Pressable onPress={open} style={s.input}>
      <Row>
        <Txt style={{ flex: 1, color: value ? C.text : C.faint }}>{value || placeholder || "—"}</Txt>
        <Ionicons name={mode === "date" ? "calendar-outline" : "time-outline"} size={18} color={C.muted} />
      </Row>
    </Pressable>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)}>
      <Row>
        <Ionicons name={value ? "checkbox" : "square-outline"} size={22} color={value ? C.accent : C.muted} />
        <Txt>{label}</Txt>
      </Row>
    </Pressable>
  );
}

export function ListItem({ icon, title, subtitle, right, onPress, tone }: { icon?: IconName; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; tone?: string }) {
  const { rtl } = useI18n();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.listItem, pressed && { backgroundColor: C.cardAlt }]}>
      <Row gap={12}>
        {icon && (
          <View style={[s.iconBox, tone ? { backgroundColor: tone } : null]}>
            <Ionicons name={icon} size={20} color={C.accentText} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Txt bold>{title}</Txt>
          {subtitle ? <Txt muted size={12}>{subtitle}</Txt> : null}
        </View>
        {right ?? (onPress ? <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={18} color={C.faint} /> : null)}
      </Row>
    </Pressable>
  );
}

/** Western digits, short month, in the app language. */
export function fmtDate(value: string | null | undefined, lang: string, withTime = false) {
  if (!value) return "—";
  const d = value.length <= 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const locale = lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  try {
    return d.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
  } catch {
    return withTime ? `${isoDate(d)} ${hhmm(d)}` : isoDate(d);
  }
}

export function fmtTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : hhmm(d);
}

export const money = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 });

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, gap: 8 },
  button: { height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, paddingVertical: 12, color: C.text, fontSize: 15, justifyContent: "center" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 10, paddingBottom: 26, borderWidth: 1, borderColor: C.border },
  option: { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12 },
  listItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: "center", justifyContent: "center" },
});
