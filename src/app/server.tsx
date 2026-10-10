import { useState } from "react";
import { useRouter } from "expo-router";
import { DEFAULT_SERVER, getServer, setServer } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button, ErrorBox, Field, Header, Input, Notice, Screen } from "@/components/ui";

/** Where the company server is on the office network (it changes if the PC's IP changes). */
export default function ServerSettings() {
  const { t } = useI18n();
  const router = useRouter();
  const [url, setUrl] = useState(getServer());
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  const normalized = () => {
    let u = url.trim().replace(/\/+$/, "");
    if (u && !/^https?:\/\//.test(u)) u = `http://${u}`;
    return u;
  };

  const test = async () => {
    setBusy(true);
    setOk(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(`${normalized()}/api/v1/health/`, { signal: controller.signal });
      setOk(res.ok);
      return res.ok;
    } catch {
      setOk(false);
      return false;
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={t("serverAddress")} onBack={() => router.back()} />
      <Field label={t("serverAddress")} hint={t("serverHint")}>
        <Input ltr value={url} onChangeText={(v) => { setUrl(v); setOk(null); }} autoCapitalize="none" keyboardType="url" placeholder={DEFAULT_SERVER} />
      </Field>
      {ok === true && <Notice text={t("connected")} tone="success" icon="checkmark-circle" />}
      {ok === false && <ErrorBox message={t("cantReachServer")} />}
      <Button title={t("testConnection")} variant="outline" icon="pulse-outline" loading={busy} onPress={test} />
      <Button
        title={t("save")}
        onPress={async () => {
          await setServer(normalized());
          router.back();
        }}
      />
    </Screen>
  );
}
