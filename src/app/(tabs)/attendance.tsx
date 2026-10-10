import { useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { list, unwrap } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { Badge, C, Card, Empty, ErrorBox, fmtTime, isoDate, Loading, Row, Screen, STATUS_TONE, Txt } from "@/components/ui";

type Record_ = {
  id: string;
  date: string;
  status: string;
  first_check_in: string | null;
  last_check_out: string | null;
  total_work_hours: string;
  late_entry_minutes: number;
  early_exit_minutes: number;
  overtime_hours: string;
};

export default function AttendanceScreen() {
  const { t, tc, lang, rtl } = useI18n();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const y = month.getFullYear();
  const mo = month.getMonth() + 1;
  const from = isoDate(month);
  const to = isoDate(new Date(y, mo, 0));

  const records = useApi<Record_[]>(`/me/attendance/?from_date=${from}&to_date=${to}&page_size=62&ordering=-date`, (b) => list<Record_>(b));
  const summary = useApi<Record<string, number>>(`/me/attendance/summary/?year=${y}&month=${mo}`, unwrap);

  const shift = (delta: number) => setMonth(new Date(y, mo - 1 + delta, 1));
  const isCurrent = (() => { const n = new Date(); return n.getFullYear() === y && n.getMonth() + 1 === mo; })();
  const title = month.toLocaleDateString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { month: "long", year: "numeric" });
  const s = summary.data;

  return (
    <Screen refreshing={records.refreshing} onRefresh={() => { records.reload(); summary.reload(); }}>
      <Txt size={22} bold>{t("attendance")}</Txt>
      <Card style={{ padding: 10 }}>
        <Row>
          <Pressable onPress={() => shift(-1)} hitSlop={10} style={{ padding: 6 }}>
            <Ionicons name={rtl ? "chevron-forward" : "chevron-back"} size={22} color={C.text} />
          </Pressable>
          <Txt center bold size={16} style={{ flex: 1 }}>{title}</Txt>
          <Pressable onPress={() => shift(1)} disabled={isCurrent} hitSlop={10} style={{ padding: 6, opacity: isCurrent ? 0.3 : 1 }}>
            <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={22} color={C.text} />
          </Pressable>
        </Row>
      </Card>

      {s && (
        <Card>
          <Txt bold>{t("monthSummary")}</Txt>
          <Row gap={6} style={{ flexWrap: "wrap" }}>
            <Badge tone="success" label={`${t("presentDays")}: ${s.present_days ?? 0}`} />
            <Badge tone="warning" label={`${t("lateDays")}: ${s.late_days ?? 0}`} />
            <Badge tone="danger" label={`${t("absentDays")}: ${s.absent_days ?? 0}`} />
            <Badge tone="info" label={`${t("leaves")}: ${s.leave_days ?? 0}`} />
            <Badge tone="accent" label={`${t("workHours")}: ${Math.round(s.total_work_hours ?? 0)}`} />
            <Badge tone="accent" label={`${t("overtime")}: ${Number(s.total_overtime_hours ?? 0).toFixed(1)}`} />
          </Row>
        </Card>
      )}

      {records.error && <ErrorBox message={records.error} onRetry={records.reload} />}
      {records.loading && !records.data && <Loading />}
      {records.data && records.data.length === 0 && <Empty text={t("noRecords")} icon="calendar-outline" />}
      {records.data?.map((r) => {
        const d = new Date(`${r.date}T12:00:00`);
        const day = d.toLocaleDateString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { weekday: "short" });
        const off = r.status === "WEEKEND" || r.status === "HOLIDAY";
        return (
          <Card key={r.id} style={{ paddingVertical: 12, opacity: off ? 0.6 : 1 }}>
            <Row gap={12}>
              <View style={{ width: 48, alignItems: "center" }}>
                <Txt center bold size={20}>{String(d.getDate())}</Txt>
                <Txt center muted size={11}>{day}</Txt>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Badge tone={STATUS_TONE[r.status] ?? "neutral"} label={tc("st_", r.status)} />
                {(r.first_check_in || r.last_check_out) && (
                  <Txt muted size={13}>{fmtTime(r.first_check_in)} {rtl ? "←" : "→"} {fmtTime(r.last_check_out)} · {Number(r.total_work_hours).toFixed(1)} {t("hours")}</Txt>
                )}
                {(r.late_entry_minutes > 0 || r.early_exit_minutes > 0) && (
                  <Txt size={12} style={{ color: "#fcd34d" }}>
                    {r.late_entry_minutes > 0 ? `${t("late")} ${r.late_entry_minutes} ${t("minutes")}` : ""}
                    {r.late_entry_minutes > 0 && r.early_exit_minutes > 0 ? " · " : ""}
                    {r.early_exit_minutes > 0 ? `${t("earlyExit")} ${r.early_exit_minutes} ${t("minutes")}` : ""}
                  </Txt>
                )}
              </View>
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
