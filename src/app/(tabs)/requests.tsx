import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { api, list } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi, useErrorText } from "@/lib/use-api";
import { Badge, Button, C, Card, Empty, ErrorBox, fmtDate, Loading, money, Row, Screen, Segmented, STATUS_TONE, Txt } from "@/components/ui";

type Leave = {
  id: string; leave_type_name: string; start_date: string; end_date: string; total_days: string; is_half_day: boolean;
  status: string; reason: string; can_cancel?: boolean; entered_by_hr?: boolean; review_remarks?: string | null;
};
type Req = {
  id: string; request_type: string; status: string; start_date: string | null; end_date: string | null; from_time: string | null;
  to_time: string | null; permission_kind: string | null; amount: string | null; destination: string; reason: string;
  can_cancel: boolean; entered_by_hr: boolean; review_remarks: string | null; created_at: string;
};

export default function RequestsScreen() {
  const { t, tc, lang } = useI18n();
  const router = useRouter();
  const errorText = useErrorText();
  const [tab, setTab] = useState<"leaves" | "requests">("leaves");
  const leaves = useApi<Leave[]>(tab === "leaves" ? "/me/leaves/?page_size=50" : null, (b) => list<Leave>(b));
  const requests = useApi<Req[]>(tab === "requests" ? "/me/requests/?page_size=50" : null, (b) => list<Req>(b));
  const current = tab === "leaves" ? leaves : requests;

  const cancel = (path: string, reload: () => void) =>
    Alert.alert(t("cancelRequest"), t("confirmCancel"), [
      { text: t("no"), style: "cancel" },
      {
        text: t("yes"),
        style: "destructive",
        onPress: () => api(path, { method: "POST", body: {} }).then(reload).catch((e) => Alert.alert(t("error"), errorText(e))),
      },
    ]);

  return (
    <Screen refreshing={current.refreshing} onRefresh={current.reload}>
      <Txt size={22} bold>{t("requests")}</Txt>
      <Segmented value={tab} onChange={setTab} options={[{ value: "leaves", label: t("leaves") }, { value: "requests", label: t("otherRequests") }]} />
      <Button
        title={tab === "leaves" ? t("newLeave") : t("newRequest")}
        icon="add-circle-outline"
        onPress={() => router.push(tab === "leaves" ? "/new-leave" : "/new-request")}
      />

      {current.error && <ErrorBox message={current.error} onRetry={current.reload} />}
      {current.loading && !current.data && <Loading />}

      {tab === "leaves" && leaves.data?.length === 0 && <Empty text={t("nothingHere")} icon="airplane-outline" />}
      {tab === "leaves" && leaves.data?.map((l) => (
        <Card key={l.id}>
          <Row>
            <Txt bold style={{ flex: 1 }}>{l.leave_type_name}</Txt>
            <Badge tone={STATUS_TONE[l.status] ?? "neutral"} label={tc("st_", l.status)} />
          </Row>
          <Txt muted size={13}>
            {fmtDate(l.start_date, lang)}{l.end_date !== l.start_date ? ` - ${fmtDate(l.end_date, lang)}` : ""} · {Number(l.total_days)} {t("days")}{l.is_half_day ? ` (${t("halfDay")})` : ""}
          </Txt>
          {!!l.reason && <Txt size={13}>{l.reason}</Txt>}
          {l.entered_by_hr && <Badge tone="info" label={t("enteredByHr")} />}
          {!!l.review_remarks && <Txt size={12} style={{ color: C.faint }}>{l.review_remarks}</Txt>}
          {l.can_cancel && <Button title={t("cancelRequest")} variant="ghost" onPress={() => cancel(`/leaves/requests/${l.id}/cancel/`, leaves.reload)} style={{ height: 38 }} />}
        </Card>
      ))}

      {tab === "requests" && requests.data?.length === 0 && <Empty text={t("nothingHere")} icon="document-text-outline" />}
      {tab === "requests" && requests.data?.map((r) => (
        <Card key={r.id}>
          <Row>
            <Txt bold style={{ flex: 1 }}>
              {tc("rt_", r.request_type)}{r.permission_kind ? ` · ${tc("pk_", r.permission_kind)}` : ""}
            </Txt>
            <Badge tone={STATUS_TONE[r.status] ?? "neutral"} label={tc("st_", r.status)} />
          </Row>
          <View style={{ gap: 2 }}>
            {r.start_date && (
              <Txt muted size={13}>
                {fmtDate(r.start_date, lang)}{r.end_date && r.end_date !== r.start_date ? ` - ${fmtDate(r.end_date, lang)}` : ""}
                {r.from_time ? ` · ${r.from_time.slice(0, 5)} - ${(r.to_time ?? "").slice(0, 5)}` : ""}
              </Txt>
            )}
            {r.amount && <Txt muted size={13}>{t("amount")}: {money(r.amount)} {t("egp")}</Txt>}
            {!!r.destination && <Txt muted size={13}>{t("destination")}: {r.destination}</Txt>}
          </View>
          {!!r.reason && <Txt size={13}>{r.reason}</Txt>}
          {r.entered_by_hr && <Badge tone="info" label={t("enteredByHr")} />}
          {!!r.review_remarks && <Txt size={12} style={{ color: C.faint }}>{r.review_remarks}</Txt>}
          {r.can_cancel && <Button title={t("cancelRequest")} variant="ghost" onPress={() => cancel(`/requests/${r.id}/cancel/`, requests.reload)} style={{ height: 38 }} />}
        </Card>
      ))}
    </Screen>
  );
}
