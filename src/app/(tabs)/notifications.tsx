import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, list } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { C, Card, Empty, ErrorBox, fmtDate, Loading, Row, Screen, Txt, type IconName } from "@/components/ui";

type Notification = { id: string; title: string; message: string; category: string; is_read: boolean; data: Record<string, string>; created_at: string };

const ICONS: Record<string, IconName> = {
  LEAVE: "airplane-outline", REQUEST: "document-text-outline", ATTENDANCE: "time-outline", PAYROLL: "wallet-outline",
  ANNOUNCEMENT: "megaphone-outline", DOCUMENT: "folder-outline", DEVICE: "phone-portrait-outline", PERFORMANCE: "star-outline",
  CELEBRATION: "gift-outline", ASSET: "cube-outline", SYSTEM: "information-circle-outline",
};

/** In-app route for a notification's deep link (`data.type`); the web `link` is never used. */
function target(n: Notification): string | null {
  switch (n.data?.type) {
    case "leave_request":
      return n.data.action === "approve" ? "/approvals" : "/requests";
    case "hr_request":
      return n.data.action === "approve" ? "/approvals" : "/requests";
    case "payslip":
      return "/payslips";
    case "attendance":
      return "/attendance";
    case "check_in_reminder":
    case "birthday":
    case "anniversary":
      return "/";
    case "device":
      return "/devices";
    case "employee_action":
      return "/actions";
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { data, error, loading, refreshing, reload, setData } = useApi<Notification[]>("/notifications/?page_size=50", (b) => list<Notification>(b));

  const open = (n: Notification) => {
    if (!n.is_read) {
      setData((d) => d?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)) ?? d);
      api(`/notifications/${n.id}/mark-read/`, { method: "POST", body: {} }).catch(() => {});
    }
    const to = target(n);
    if (to) router.push(to as never);
  };

  const unread = data?.some((n) => !n.is_read);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Row>
        <Txt size={22} bold style={{ flex: 1 }}>{t("notifications")}</Txt>
        {unread && (
          <Pressable
            hitSlop={8}
            onPress={() => {
              setData((d) => d?.map((x) => ({ ...x, is_read: true })) ?? d);
              api("/notifications/mark-all-read/", { method: "POST", body: {} }).catch(() => {});
            }}
          >
            <Txt style={{ color: C.accentText }} size={13}>{t("markAllRead")}</Txt>
          </Pressable>
        )}
      </Row>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data?.length === 0 && <Empty text={t("noNotifications")} icon="notifications-off-outline" />}
      {data?.map((n) => (
        <Card key={n.id} onPress={() => open(n)} style={{ paddingVertical: 12, borderColor: n.is_read ? C.border : "rgba(124,58,237,0.4)" }}>
          <Row gap={12} style={{ alignItems: "flex-start" }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={ICONS[n.category] ?? "notifications-outline"} size={19} color={C.accentText} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Row>
                <Txt bold style={{ flex: 1 }}>{n.title}</Txt>
                {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent }} />}
              </Row>
              <Txt muted size={13}>{n.message}</Txt>
              <Txt size={11} style={{ color: C.faint }}>{fmtDate(n.created_at, lang, true)}</Txt>
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
