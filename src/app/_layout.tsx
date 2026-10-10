import { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { C, Loading } from "@/components/ui";

function Gate() {
  const { ready, user } = useAuth();
  const { setLang } = useI18n();
  const segments = useSegments();
  const router = useRouter();
  const first = segments[0] as string | undefined;

  useEffect(() => {
    if (!ready) return;
    const open = first === "login" || first === "server";
    if (!user && !open) router.replace("/login");
    else if (user?.must_change_password && first !== "change-password") router.replace("/change-password");
    else if (user && !user.must_change_password && (open || first === "change-password")) router.replace("/");
  }, [ready, user, first, router]);

  useEffect(() => {
    if (user?.preferred_language) setLang(user.preferred_language);
  }, [user?.preferred_language, setLang]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center" }}><Loading /></View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: "fade_from_bottom" }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar style="light" />
            <Gate />
          </View>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
