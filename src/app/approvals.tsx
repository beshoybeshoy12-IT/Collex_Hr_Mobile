import { useState } from "react";
import { Alert, Modal, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { api, unwrap } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi, useErrorText } from "@/lib/use-api";
import { Badge, Button, Card, Empty, ErrorBox, fmtDate, Header, Input, Loading, money, Row, Screen, Txt } from "@/components/ui";

type Item = {
  id: string; employee_name: string; status: string; start_date: string | null; end_date: string | null; reason: string;
  leave_type_name?: string; total_days?: string; request_type?: string; permission_kind?: string | null;
  from_time?: string | null; to_time?: string | null; amount?: string | null;
};
type Inbox = { leaves: Item[]; requests: Item[] };

/** Managers approve their team from the app (the web is HR only). */
export default function Approvals() {
  const { t, tc, lang } = useI18n();
  const router = useRouter();
  const errorText = useErrorText();
  const { data, error, loading, refreshing, reload } = useApi<Inbox>("/me/approvals/", unwrap);
  const [acting, setActing] = useState<{ item: Item; kind: "leave" | "request"; verb: "approve" | "reject" } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!acting) return;
    setBusy(true);
    const base = acting.kind === "leave" ? "/leaves/requests" : "/requests";
    try {
      await api(`${base}/${acting.item.id}/${acting.verb}/`, { method: "POST", body: { remarks } });
      setActing(null);
      setRemarks("");
      reload();
    } catch (e) {
      Alert.alert(t("error"), errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const card = (item: Item, kind: "leave" | "request") => (
    <Card key={`${kind}-${item.id}`}>
      <Row>
        <Txt bold style={{ flex: 1 }}>{item.employee_name}</Txt>
        <Badge tone="warning" label={kind === "leave" ? item.leave_type_name ?? t("leaves") : tc("rt_", item.request_type)} />
      </Row>
      {item.start_date && (
        <Txt muted size={13}>
          {fmtDate(item.start_date, lang)}{item.end_date && item.end_date !== item.start_date ? ` - ${fmtDate(item.end_date, lang)}` : ""}
          {item.total_days ? ` · ${Number(item.total_days)} ${t("days")}` : ""}
          {item.from_time ? ` · ${item.from_time.slice(0, 5)} - ${(item.to_time ?? "").slice(0, 5)}` : ""}
        </Txt>
      )}
      {item.permission_kind && <Txt muted size={13}>{tc("pk_", item.permission_kind)}</Txt>}
      {item.amount && <Txt muted size={13}>{money(item.amount)} {t("egp")}</Txt>}
      {!!item.reason && <Txt size={13}>{item.reason}</Txt>}
      <Row gap={10}>
        <Button title={t("approve")} variant="success" icon="checkmark" style={{ flex: 1, height: 42 }} onPress={() => setActing({ item, kind, verb: "approve" })} />
        <Button title={t("reject")} variant="danger" icon="close" style={{ flex: 1, height: 42 }} onPress={() => setActing({ item, kind, verb: "reject" })} />
      </Row>
    </Card>
  );

  const empty = data && data.leaves.length + data.requests.length === 0;

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Header title={t("approvals")} onBack={() => router.back()} />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {empty && <Empty text={t("nothingHere")} icon="checkmark-done-outline" />}
      {data?.leaves.map((l) => card(l, "leave"))}
      {data?.requests.map((r) => card(r, "request"))}

      <Modal visible={!!acting} transparent animationType="fade" onRequestClose={() => setActing(null)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 }} onPress={() => setActing(null)}>
          <Pressable>
            <Card style={{ gap: 12 }}>
              <Txt bold size={17}>{acting?.verb === "approve" ? t("approve") : t("reject")} · {acting?.item.employee_name}</Txt>
              <Input multiline placeholder={t("remarks")} value={remarks} onChangeText={setRemarks} />
              <View style={{ gap: 8 }}>
                <Button title={t("confirm")} variant={acting?.verb === "approve" ? "success" : "danger"} loading={busy} onPress={submit} />
                <Button title={t("cancel")} variant="ghost" onPress={() => setActing(null)} />
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
