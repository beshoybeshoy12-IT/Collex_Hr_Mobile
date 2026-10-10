import { useState } from "react";
import { useRouter } from "expo-router";
import { api, list, unwrap } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi, useErrorText } from "@/lib/use-api";
import { Button, DateField, ErrorBox, Field, Header, Input, Picker, Screen, Toggle } from "@/components/ui";

type LeaveType = { id: string; name: string; requires_attachment: boolean; min_notice_days: number };
type Balance = { leave_type: string; total_remaining: string };

export default function NewLeave() {
  const { t } = useI18n();
  const router = useRouter();
  const errorText = useErrorText();
  const types = useApi<LeaveType[]>("/leaves/types/?is_active=true&page_size=50", (b) => list<LeaveType>(b));
  const balances = useApi<Balance[]>(`/me/leave-balances/?year=${new Date().getFullYear()}`, (b) => unwrap<Balance[]>(b) ?? []);
  const [form, setForm] = useState({ leave_type: "", start_date: "", end_date: "", is_half_day: false, reason: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const balanceOf = (id: string) => balances.data?.find((b) => b.leave_type === id)?.total_remaining;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/leaves/requests/", {
        method: "POST",
        body: { ...form, end_date: form.is_half_day ? form.start_date : form.end_date || form.start_date },
      });
      router.back();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t("newLeave")} onBack={() => router.back()} />
      {error && <ErrorBox message={error} />}
      <Field label={t("leaveType")}>
        <Picker
          value={form.leave_type}
          onChange={(v) => set({ leave_type: v })}
          options={(types.data ?? []).map((x) => {
            const left = balanceOf(x.id);
            return { value: x.id, label: left !== undefined ? `${x.name} (${Number(left)} ${t("remaining")})` : x.name };
          })}
        />
      </Field>
      <Toggle label={t("halfDay")} value={form.is_half_day} onChange={(v) => set({ is_half_day: v })} />
      <Field label={form.is_half_day ? t("date") : t("from")}>
        <DateField value={form.start_date} onChange={(v) => set({ start_date: v, end_date: form.end_date && form.end_date < v ? v : form.end_date })} />
      </Field>
      {!form.is_half_day && (
        <Field label={t("to")}>
          <DateField value={form.end_date} onChange={(v) => set({ end_date: v })} placeholder={form.start_date} />
        </Field>
      )}
      <Field label={t("reason")}>
        <Input multiline value={form.reason} onChangeText={(v) => set({ reason: v })} />
      </Field>
      <Button title={t("send")} icon="send" loading={busy} disabled={!form.leave_type || !form.start_date} onPress={submit} />
    </Screen>
  );
}
