import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { api, unwrap } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi, useErrorText } from "@/lib/use-api";
import { Button, DateField, ErrorBox, Field, Header, Input, Picker, Row, Screen } from "@/components/ui";

type Option = { value: string; label: string };

const FIELDS: Record<string, string[]> = {
  PERMISSION: ["permission_kind", "start_date", "from_time", "to_time", "reason"],
  MISSION: ["start_date", "end_date", "destination", "reason"],
  WORK_FROM_HOME: ["start_date", "end_date", "reason"],
  ATTENDANCE_CORRECTION: ["start_date", "corrected_check_in", "corrected_check_out", "reason"],
  SALARY_ADVANCE: ["amount", "installments", "reason"],
  SALARY_INCREASE: ["amount", "start_date", "reason"],
  SALARY_CERTIFICATE: ["addressed_to"],
  EXPERIENCE_LETTER: ["addressed_to"],
  OTHER: ["reason"],
};

export default function NewRequest() {
  const { t, tc } = useI18n();
  const router = useRouter();
  const errorText = useErrorText();
  const types = useApi<{ types: Option[]; kinds: Option[] }>("/requests/types/", (b) => ({ types: unwrap<Option[]>(b) ?? [], kinds: b?.permission_kinds ?? [] }));
  const [type, setType] = useState("");
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  const fields = FIELDS[type] ?? [];
  const has = (k: string) => fields.includes(k);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const body: Record<string, unknown> = { request_type: type };
    for (const k of fields) if (f[k]) body[k] = f[k];
    // a correction is a time on the corrected day
    for (const k of ["corrected_check_in", "corrected_check_out"])
      if (f[k] && f.start_date) body[k] = `${f.start_date}T${f[k]}:00`;
    if (body.installments) body.installments = Number(body.installments);
    try {
      await api("/requests/", { method: "POST", body });
      router.back();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const missing =
    !type ||
    (has("permission_kind") && !f.permission_kind) ||
    (has("start_date") && !f.start_date) ||
    (has("from_time") && (!f.from_time || !f.to_time)) ||
    (has("amount") && !f.amount) ||
    (type === "ATTENDANCE_CORRECTION" && !f.corrected_check_in && !f.corrected_check_out) ||
    (type === "OTHER" && !f.reason);

  return (
    <Screen>
      <Header title={t("newRequest")} onBack={() => router.back()} />
      {error && <ErrorBox message={error} />}
      <Field label={t("requestType")}>
        <Picker value={type} onChange={(v) => { setType(v); setF({}); setError(null); }} options={(types.data?.types ?? []).map((o) => ({ value: o.value, label: tc("rt_", o.value) }))} />
      </Field>

      {has("permission_kind") && (
        <Field label={t("permissionKind")}>
          <Picker value={f.permission_kind ?? ""} onChange={(v) => set("permission_kind", v)} options={(types.data?.kinds ?? []).map((o) => ({ value: o.value, label: tc("pk_", o.value) }))} />
        </Field>
      )}
      {has("start_date") && (
        <Field label={type === "SALARY_INCREASE" ? t("startsFrom") : has("end_date") ? t("from") : t("date")}>
          <DateField value={f.start_date ?? ""} onChange={(v) => set("start_date", v)} />
        </Field>
      )}
      {has("end_date") && (
        <Field label={t("to")}>
          <DateField value={f.end_date ?? ""} onChange={(v) => set("end_date", v)} placeholder={f.start_date} />
        </Field>
      )}
      {has("from_time") && (
        <Row gap={10}>
          <View style={{ flex: 1 }}><Field label={t("from")}><DateField mode="time" value={f.from_time ?? ""} onChange={(v) => set("from_time", v)} /></Field></View>
          <View style={{ flex: 1 }}><Field label={t("to")}><DateField mode="time" value={f.to_time ?? ""} onChange={(v) => set("to_time", v)} /></Field></View>
        </Row>
      )}
      {has("corrected_check_in") && (
        <Field label={t("correctedIn")}><DateField mode="time" value={f.corrected_check_in ?? ""} onChange={(v) => set("corrected_check_in", v)} /></Field>
      )}
      {has("corrected_check_out") && (
        <Field label={t("correctedOut")}><DateField mode="time" value={f.corrected_check_out ?? ""} onChange={(v) => set("corrected_check_out", v)} /></Field>
      )}
      {has("destination") && (
        <Field label={t("destination")}><Input value={f.destination ?? ""} onChangeText={(v) => set("destination", v)} /></Field>
      )}
      {has("amount") && (
        <Field label={type === "SALARY_INCREASE" ? t("increaseAmount") : t("amount")}>
          <Input ltr keyboardType="numeric" value={f.amount ?? ""} onChangeText={(v) => set("amount", v.replace(/[^0-9.]/g, ""))} />
        </Field>
      )}
      {has("installments") && (
        <Field label={t("installments")}>
          <Input ltr keyboardType="number-pad" value={f.installments ?? ""} onChangeText={(v) => set("installments", v.replace(/\D/g, ""))} placeholder="1" />
        </Field>
      )}
      {has("addressed_to") && (
        <Field label={`${t("addressedTo")} (${t("optional")})`}><Input value={f.addressed_to ?? ""} onChangeText={(v) => set("addressed_to", v)} /></Field>
      )}
      {has("reason") && (
        <Field label={type === "OTHER" ? t("reason") : `${t("reason")} (${t("optional")})`}>
          <Input multiline value={f.reason ?? ""} onChangeText={(v) => set("reason", v)} />
        </Field>
      )}
      <Button title={t("send")} icon="send" loading={busy} disabled={!!missing} onPress={submit} />
    </Screen>
  );
}
