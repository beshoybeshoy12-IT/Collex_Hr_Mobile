import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { unwrap } from "@/lib/api";
import { deviceId } from "@/lib/device";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { Badge, Card, Empty, ErrorBox, fmtDate, Header, Loading, Row, Screen, STATUS_TONE, Txt } from "@/components/ui";

type Device = { id: string; device_id: string; device_model: string; os_version: string; status: string; created_at: string };

export default function Devices() {
  const { t, tc, lang } = useI18n();
  const router = useRouter();
  const [mine, setMine] = useState<string | null>(null);
  const { data, error, loading, refreshing, reload } = useApi<Device[]>("/me/devices/", (b) => unwrap<Device[]>(b) ?? []);
  useEffect(() => { deviceId().then(setMine); }, []);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Header title={t("myDevices")} onBack={() => router.back()} />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data?.length === 0 && <Empty text={t("nothingHere")} icon="phone-portrait-outline" />}
      {data?.map((d) => (
        <Card key={d.id}>
          <Row>
            <Txt bold style={{ flex: 1 }}>{d.device_model || "Android"}</Txt>
            <Badge tone={STATUS_TONE[d.status] ?? "neutral"} label={tc("st_", d.status)} />
          </Row>
          <Txt muted size={12}>{d.os_version} · {fmtDate(d.created_at, lang)}</Txt>
          {d.device_id === mine && <Badge tone="accent" label={t("thisDevice")} />}
        </Card>
      ))}
    </Screen>
  );
}
