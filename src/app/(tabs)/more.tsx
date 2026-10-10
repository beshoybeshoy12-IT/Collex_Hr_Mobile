import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { appVersion } from "@/lib/device";
import { useI18n, type Lang } from "@/lib/i18n";
import { Card, fmtDate, ListItem, Row, Screen, Segmented, Txt } from "@/components/ui";

export default function MoreScreen() {
  const { t, lang, setLang } = useI18n();
  const { user, me, signOut, canApprove } = useAuth();
  const router = useRouter();
  const e = me?.employee;

  const changeLang = (next: Lang) => {
    setLang(next);
    api("/auth/profile/", { method: "PATCH", body: { preferred_language: next } }).catch(() => {});
  };

  return (
    <Screen>
      <Txt size={22} bold>{t("more")}</Txt>

      <Card style={{ gap: 10 }}>
        <Txt bold size={17}>{user?.full_name}</Txt>
        <Txt muted size={13}>{user?.email}</Txt>
        {e && (
          <View style={{ gap: 6, marginTop: 4 }}>
            <Info label={t("employeeCode")} value={e.employee_id} />
            <Info label={t("department")} value={e.department_name} />
            <Info label={t("designation")} value={e.designation_title} />
            {me?.manager && <Info label={t("manager")} value={me.manager.name} />}
            <Info label={t("joined")} value={fmtDate(e.date_of_joining, lang)} />
            {!!e.phone_number && <Info label={t("phone")} value={e.phone_number} />}
          </View>
        )}
      </Card>

      <Card style={{ padding: 6, gap: 0 }}>
        {canApprove && <ListItem icon="checkmark-done-outline" title={t("approvals")} onPress={() => router.push("/approvals")} />}
        <ListItem icon="wallet-outline" title={t("payslips")} onPress={() => router.push("/payslips")} />
        <ListItem icon="briefcase-outline" title={t("myActions")} onPress={() => router.push("/actions")} />
        <ListItem icon="phone-portrait-outline" title={t("myDevices")} onPress={() => router.push("/devices")} />
        <ListItem icon="key-outline" title={t("changePassword")} onPress={() => router.push("/change-password")} />
      </Card>

      <Card>
        <Txt bold>{t("language")}</Txt>
        <Segmented value={lang} onChange={changeLang} options={[{ value: "ar", label: "العربية" }, { value: "en", label: "English" }]} />
      </Card>

      <Card style={{ padding: 6 }}>
        <ListItem
          icon="log-out-outline"
          tone="rgba(239,68,68,0.15)"
          title={t("signOut")}
          onPress={() => Alert.alert(t("signOut"), t("confirmSignOut"), [{ text: t("cancel"), style: "cancel" }, { text: t("signOut"), style: "destructive", onPress: signOut }])}
        />
      </Card>
      <Txt center muted size={12}>{t("appVersion")} {appVersion()}</Txt>
    </Screen>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <Row>
      <Txt muted size={13} style={{ flex: 1 }}>{label}</Txt>
      <Txt size={13}>{value || "—"}</Txt>
    </Row>
  );
}
