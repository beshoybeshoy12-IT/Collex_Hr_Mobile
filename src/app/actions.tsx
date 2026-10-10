import { useRouter } from "expo-router";
import { unwrap } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { Badge, Card, Empty, ErrorBox, fmtDate, Header, Loading, money, Row, Screen, STATUS_TONE, Txt } from "@/components/ui";

type Action = {
  id: string; reference: string; action_type: string; status: string; subject: string; action_date: string;
  start_date: string | null; end_date: string | null; days: string | null; amount: string | null;
  payroll_month: string | null; investigation_at: string | null;
};

/** Investigations, penalties, rewards… that HR shared with the employee. */
export default function Actions() {
  const { t, tc, lang } = useI18n();
  const router = useRouter();
  const { data, error, loading, refreshing, reload } = useApi<Action[]>("/me/actions/", (b) => unwrap<Action[]>(b) ?? []);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Header title={t("myActions")} onBack={() => router.back()} />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data?.length === 0 && <Empty text={t("nothingHere")} icon="briefcase-outline" />}
      {data?.map((a) => (
        <Card key={a.id}>
          <Row>
            <Txt bold style={{ flex: 1 }}>{tc("at_", a.action_type)}</Txt>
            <Badge tone={STATUS_TONE[a.status] ?? "neutral"} label={tc("st_", a.status)} />
          </Row>
          {!!a.subject && <Txt size={13}>{a.subject}</Txt>}
          <Txt muted size={12}>{a.reference} · {fmtDate(a.action_date, lang)}</Txt>
          {a.start_date && (
            <Txt muted size={12}>{fmtDate(a.start_date, lang)}{a.end_date ? ` - ${fmtDate(a.end_date, lang)}` : ""}</Txt>
          )}
          {a.investigation_at && <Txt muted size={12}>{fmtDate(a.investigation_at, lang, true)}</Txt>}
          {a.days && Number(a.days) > 0 && <Txt muted size={12}>{Number(a.days)} {t("days")}</Txt>}
          {a.amount && Number(a.amount) > 0 && <Txt muted size={12}>{money(a.amount)} {t("egp")}</Txt>}
        </Card>
      ))}
    </Screen>
  );
}
