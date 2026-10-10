import { useEffect, useState } from "react";
import type { ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, unwrap } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { C, type IconName } from "@/components/ui";

const icon = (name: IconName, active: IconName) =>
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Ionicons name={focused ? active : name} size={23} color={color as string} />;
  };

export default function TabsLayout() {
  const { t, rtl } = useI18n();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const poll = () =>
      api("/notifications/unread-count/")
        .then((b) => setUnread(Number(unwrap<{ count?: number; unread?: number }>(b)?.count ?? unwrap<any>(b)?.unread ?? 0)))
        .catch(() => {});
    poll();
    const id = setInterval(poll, 60000);
    return () => clearInterval(id);
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
        tabBarActiveTintColor: C.accentText,
        tabBarInactiveTintColor: C.faint,
        // `direction` flips the row of tabs for Arabic
        tabBarStyle: { backgroundColor: "#0b1222", borderTopColor: C.border, height: 64, paddingTop: 6, direction: rtl ? "rtl" : "ltr" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("home"), tabBarIcon: icon("home-outline", "home") }} />
      <Tabs.Screen name="attendance" options={{ title: t("attendance"), tabBarIcon: icon("calendar-outline", "calendar") }} />
      <Tabs.Screen name="requests" options={{ title: t("requests"), tabBarIcon: icon("document-text-outline", "document-text") }} />
      <Tabs.Screen
        name="notifications"
        listeners={{ focus: () => setUnread(0) }}
        options={{ title: t("notifications"), tabBarIcon: icon("notifications-outline", "notifications"), tabBarBadge: unread > 0 ? unread : undefined, tabBarBadgeStyle: { backgroundColor: C.danger } }}
      />
      <Tabs.Screen name="more" options={{ title: t("more"), tabBarIcon: icon("grid-outline", "grid") }} />
    </Tabs>
  );
}
