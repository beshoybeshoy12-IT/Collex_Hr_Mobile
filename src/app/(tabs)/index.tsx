import { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { unwrap } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { LocationDenied, punch } from "@/lib/punch";
import { useApi, useErrorText } from "@/lib/use-api";
import { Badge, C, Card, ErrorBox, fmtDate, fmtTime, Loading, Notice, Row, Screen, SectionTitle, Txt } from "@/components/ui";

type Today = {
  date: string;
  is_working_day: boolean;
  holiday: { name: string } | null;
  on_leave: { leave_type_name?: string } | null;
  on_mission: boolean;
  work_from_home: boolean;
  attendance_exempt?: boolean;
  shift: { name: string; start: string; end: string; grace_minutes: number } | null;
  record: { first_check_in: string | null; last_check_out: string | null; status: string } | null;
  checked_in: boolean;
  checked_out: boolean;
  can_check_in: boolean;
  can_check_out: boolean;
};

type Home = {
  today: Today;
  month_summary: Record<string, number>;
  leave_balances: { id: string; leave_type_name: string; total_remaining: string; total_allocated: string }[];
  announcements: { id: string; title: string; body: string; is_read: boolean }[];
  next_holiday: { name: string; date: string } | null;
  celebrations: { type: string; date: string; employee_name: string }[];
  approvals_waiting: { leaves: number; requests: number } | null;
  unread_notifications: number;
};

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function HomeScreen() {
  const { t, tc, lang } = useI18n();
  const { user, deviceStatus } = useAuth();
  const router = useRouter();
  const errorText = useErrorText();
  const now = useClock();
  const { data, error, loading, refreshing, reload, setData } = useApi<Home>("/me/home/", unwrap);
  const [busy, setBusy] = useState(false);
  const [punchMsg, setPunchMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const today = data?.today;
  const action: "check-in" | "check-out" | null = today?.can_check_out ? "check-out" : today?.can_check_in ? "check-in" : null;

  const doPunch = async () => {
    if (!action) return;
    setBusy(true);
    setPunchMsg({ text: t("locating"), ok: true });
    try {
      const res = await punch(action);
      setData((d) => (d ? { ...d, today: res.today } : d));
      const where = res.punch?.location_name ? ` · ${res.punch.location_name}` : "";
      setPunchMsg({ text: `${t("punchAccepted")} ${fmtTime(res.punch?.timestamp)}${where}`, ok: true });
    } catch (e) {
      setPunchMsg({ text: e instanceof LocationDenied ? t("locationDenied") : errorText(e), ok: false });
    } finally {
      setBusy(false);
    }
  };

  const status = (() => {
    if (!today) return null;
    if (today.attendance_exempt) return t("attendanceExempt");
    if (today.holiday) return `${t("holidayToday")}: ${today.holiday.name}`;
    if (today.on_leave) return t("onLeaveToday");
    if (today.on_mission) return t("onMission");
    if (today.work_from_home) return t("workFromHome");
    if (!today.is_working_day) return t("dayOff");
    return null;
  })();

  const m = data?.month_summary;
  const hour = now.getHours();
  const greeting = lang === "ar" ? (hour < 12 ? "صباح الخير" : "مساء الخير") : hour < 12 ? "Good morning" : "Good evening";

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Row gap={12}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.accentSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {user?.avatar ? <Image source={{ uri: user.avatar }} style={{ width: 46, height: 46 }} /> : <Txt bold style={{ color: C.accentText }}>{(user?.first_name?.[0] ?? "") + (user?.last_name?.[0] ?? "")}</Txt>}
        </View>
        <View style={{ flex: 1 }}>
          <Txt muted size={13}>{greeting}</Txt>
          <Txt bold size={18}>{user?.full_name}</Txt>
        </View>
        <Pressable onPress={() => router.push("/notifications")} hitSlop={10}>
          <Ionicons name="notifications-outline" size={24} color={C.text} />
          {!!data?.unread_notifications && <View style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: C.danger }} />}
        </Pressable>
      </Row>

      {deviceStatus === "PENDING" && <Notice text={t("e_DEVICE_NOT_APPROVED")} tone="warning" icon="phone-portrait-outline" />}
      {deviceStatus === "BLOCKED" && <Notice text={t("e_DEVICE_BLOCKED")} tone="danger" icon="ban" />}
      {error && !data && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}

      {today && (
        <Card style={{ alignItems: "center", paddingVertical: 22, gap: 14, backgroundColor: "#0d1430" }}>
          <Txt muted center>{fmtDate(today.date, lang)}</Txt>
          <Txt center bold size={40} style={{ letterSpacing: 1 }}>{fmtTime(now.toISOString())}</Txt>
          {today.shift && (
            <Badge tone="accent" label={`${t("shift")}: ${today.shift.name} · ${fmtTime(today.shift.start)} - ${fmtTime(today.shift.end)}`} />
          )}
          {status && <Txt center style={{ color: C.accentText }}>{status}</Txt>}

          {action ? (
            <Pressable
              onPress={doPunch}
              disabled={busy}
              style={({ pressed }) => ({
                width: 168, height: 168, borderRadius: 84, alignItems: "center", justifyContent: "center",
                backgroundColor: action === "check-in" ? C.accent : "#be123c",
                opacity: busy ? 0.7 : pressed ? 0.85 : 1,
                borderWidth: 8, borderColor: action === "check-in" ? "rgba(124,58,237,0.35)" : "rgba(190,18,60,0.35)",
              })}
            >
              <Ionicons name={busy ? "locate" : "finger-print"} size={54} color="#fff" />
              <Txt center bold size={16} style={{ color: "#fff", marginTop: 6 }}>{action === "check-in" ? t("checkIn") : t("checkOut")}</Txt>
            </Pressable>
          ) : (
            today.checked_out && <Txt center bold style={{ color: "#6ee7b7" }}>{t("dayDone")}</Txt>
          )}

          <Row gap={18} style={{ justifyContent: "center" }}>
            {today.record?.first_check_in && <Txt muted size={13}>{t("checkedInAt")} {fmtTime(today.record.first_check_in)}</Txt>}
            {today.record?.last_check_out && <Txt muted size={13}>{t("checkedOutAt")} {fmtTime(today.record.last_check_out)}</Txt>}
          </Row>
          {punchMsg && <Notice text={punchMsg.text} tone={punchMsg.ok ? "success" : "danger"} icon={punchMsg.ok ? "checkmark-circle" : "alert-circle"} />}
        </Card>
      )}

      {data?.approvals_waiting && data.approvals_waiting.leaves + data.approvals_waiting.requests > 0 && (
        <Card onPress={() => router.push("/approvals")} style={{ borderColor: "rgba(245,158,11,0.35)" }}>
          <Row>
            <Ionicons name="checkmark-done-circle" size={24} color={C.warning} />
            <Txt bold style={{ flex: 1 }}>{t("approvalsWaiting")}</Txt>
            <Badge tone="warning" label={String(data.approvals_waiting.leaves + data.approvals_waiting.requests)} />
          </Row>
        </Card>
      )}

      {m && (
        <>
          <SectionTitle>{t("thisMonth")}</SectionTitle>
          <Row gap={10}>
            <Stat label={t("presentDays")} value={m.present_days} color="#6ee7b7" />
            <Stat label={t("lateDays")} value={m.late_days} color="#fcd34d" />
            <Stat label={t("absentDays")} value={m.absent_days} color="#fca5a5" />
            <Stat label={t("workHours")} value={Math.round(m.total_work_hours ?? 0)} color={C.accentText} />
          </Row>
        </>
      )}

      {!!data?.leave_balances?.length && (
        <>
          <SectionTitle right={<Pressable onPress={() => router.push("/new-leave")}><Txt style={{ color: C.accentText }}>{t("newLeave")}</Txt></Pressable>}>{t("leaveBalances")}</SectionTitle>
          <Card style={{ gap: 12 }}>
            {data.leave_balances.filter((b) => Number(b.total_allocated) > 0).slice(0, 5).map((b) => {
              const pct = Math.max(0, Math.min(1, Number(b.total_remaining) / Number(b.total_allocated)));
              return (
                <View key={b.id} style={{ gap: 6 }}>
                  <Row>
                    <Txt style={{ flex: 1 }}>{b.leave_type_name}</Txt>
                    <Txt muted size={13}>{Number(b.total_remaining)} / {Number(b.total_allocated)} {t("days")}</Txt>
                  </Row>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", flexDirection: lang === "ar" ? "row-reverse" : "row" }}>
                    <View style={{ width: `${pct * 100}%`, borderRadius: 3, backgroundColor: C.accent }} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      {!!data?.announcements?.length && (
        <>
          <SectionTitle>{t("announcements")}</SectionTitle>
          {data.announcements.slice(0, 3).map((a) => (
            <Card key={a.id}>
              <Row>
                <Ionicons name="megaphone-outline" size={18} color={C.accentText} />
                <Txt bold style={{ flex: 1 }}>{a.title}</Txt>
              </Row>
              <Txt muted size={13} numberOfLines={4}>{a.body}</Txt>
            </Card>
          ))}
        </>
      )}

      {(data?.next_holiday || !!data?.celebrations?.length) && (
        <Card style={{ gap: 10 }}>
          {data?.next_holiday && (
            <Row>
              <Ionicons name="sunny-outline" size={18} color={C.warning} />
              <Txt style={{ flex: 1 }}>{t("nextHoliday")}: {data.next_holiday.name}</Txt>
              <Txt muted size={12}>{fmtDate(data.next_holiday.date, lang)}</Txt>
            </Row>
          )}
          {data?.celebrations?.slice(0, 4).map((c, i) => (
            <Row key={i}>
              <Ionicons name={c.type === "birthday" ? "gift-outline" : "ribbon-outline"} size={18} color="#f9a8d4" />
              <Txt style={{ flex: 1 }}>{c.type === "birthday" ? t("birthday") : t("anniversary")}: {c.employee_name}</Txt>
              <Txt muted size={12}>{fmtDate(c.date, lang)}</Txt>
            </Row>
          ))}
        </Card>
      )}
      {today?.record?.status && <Txt muted center size={12}>{tc("st_", today.record.status)}</Txt>}
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card style={{ flex: 1, padding: 12, alignItems: "center", gap: 2 }}>
      <Txt center bold size={22} style={{ color }}>{String(value ?? 0)}</Txt>
      <Txt center muted size={11}>{label}</Txt>
    </Card>
  );
}
