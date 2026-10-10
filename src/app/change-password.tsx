import { useState } from "react";
import { useRouter } from "expo-router";
import { api, setTokens, unwrap } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { registerDevice } from "@/lib/device";
import { useI18n } from "@/lib/i18n";
import { useErrorText } from "@/lib/use-api";
import { Button, ErrorBox, Field, Header, Input, Notice, Screen } from "@/components/ui";

export default function ChangePassword() {
  const { t } = useI18n();
  const { user, setUser, reload, signOut } = useAuth();
  const router = useRouter();
  const errorText = useErrorText();
  const forced = !!user?.must_change_password;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (next !== again) return setError(t("passwordsDontMatch"));
    setBusy(true);
    setError(null);
    try {
      const body = await api("/auth/change-password/", { method: "POST", body: { old_password: current, new_password: next } });
      const data = unwrap<{ access?: string; refresh?: string }>(body);
      // other devices are signed out: keep the new tokens
      if (data?.access && data?.refresh) await setTokens(data.access, data.refresh);
      if (user) setUser({ ...user, must_change_password: false });
      await reload().catch(() => {});
      await registerDevice();
      if (!forced) router.back();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t("changePassword")} onBack={forced ? undefined : () => router.back()} />
      {forced && <Notice text={t("mustChangePassword")} tone="warning" icon="key" />}
      {error && <ErrorBox message={error} />}
      <Field label={t("currentPassword")}>
        <Input ltr value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
      </Field>
      <Field label={t("newPassword")} hint={t("passwordRules")}>
        <Input ltr value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" />
      </Field>
      <Field label={t("confirmPassword")}>
        <Input ltr value={again} onChangeText={setAgain} secureTextEntry autoCapitalize="none" />
      </Field>
      <Button title={t("save")} loading={busy} disabled={!current || next.length < 10 || !again} onPress={submit} />
      {forced && <Button title={t("signOut")} variant="ghost" onPress={signOut} />}
    </Screen>
  );
}
