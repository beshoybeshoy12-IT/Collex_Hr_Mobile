import { useState } from "react";
import { Image, KeyboardAvoidingView, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, ApiError, getServer } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useErrorText } from "@/lib/use-api";
import { Button, C, Card, ErrorBox, Field, Input, Notice, Row, Screen, Txt } from "@/components/ui";

type Mode = "signin" | "forgot" | "reset";

export default function Login() {
  const { t, lang, setLang } = useI18n();
  const { signIn } = useAuth();
  const router = useRouter();
  const errorText = useErrorText();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) setError(t("cantReachServer"));
      else if (e instanceof ApiError && e.status === 401) setError(t("wrongCredentials"));
      else setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior="height">
        <Row style={{ justifyContent: "space-between", marginTop: 4 }}>
          <Pressable onPress={() => setLang(lang === "ar" ? "en" : "ar")} hitSlop={10}>
            <Row gap={6}>
              <Ionicons name="language" size={18} color={C.muted} />
              <Txt muted>{lang === "ar" ? "English" : "العربية"}</Txt>
            </Row>
          </Pressable>
          <Pressable onPress={() => router.push("/server")} hitSlop={10}>
            <Ionicons name="settings-outline" size={20} color={C.muted} />
          </Pressable>
        </Row>

        <View style={{ alignItems: "center", marginTop: 36, marginBottom: 28, gap: 14 }}>
          <View style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(124,58,237,0.18)" }} />
            <Image source={require("../../assets/logo-white.png")} style={{ width: 84, height: 84 }} resizeMode="contain" />
          </View>
          <Row gap={8} style={{ flexDirection: "row" }}>
            <Txt size={28} bold>Collex</Txt>
            <View style={{ backgroundColor: C.accentSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Txt bold style={{ color: C.accentText }}>HR</Txt>
            </View>
          </Row>
        </View>

        <Card style={{ gap: 14, padding: 18 }}>
          <Txt size={18} bold>{mode === "signin" ? t("signIn") : t("forgotPassword")}</Txt>
          <Txt muted size={13}>{mode === "signin" ? t("signInHint") : t("forgotHint")}</Txt>
          {error && <ErrorBox message={error} />}
          {info && <Notice text={info} tone="success" icon="checkmark-circle" />}

          <Field label={t("email")}>
            <Input ltr value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="name@company.com" editable={mode !== "reset"} />
          </Field>

          {mode === "signin" && (
            <Field label={t("password")}>
              <View>
                <Input ltr value={password} onChangeText={setPassword} secureTextEntry={!show} autoCapitalize="none" autoComplete="password" style={{ paddingEnd: 44 }} />
                <Pressable onPress={() => setShow(!show)} style={{ position: "absolute", right: 12, top: 14 }} hitSlop={10}>
                  <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={C.muted} />
                </Pressable>
              </View>
            </Field>
          )}

          {mode === "reset" && (
            <>
              <Field label={t("code")}>
                <Input ltr value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
              </Field>
              <Field label={t("newPassword")} hint={t("passwordRules")}>
                <Input ltr value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
              </Field>
            </>
          )}

          {mode === "signin" && (
            <Button
              title={t("signIn")}
              icon="log-in-outline"
              loading={busy}
              disabled={!email || !password}
              onPress={() => run(async () => { await signIn(email, password); })}
            />
          )}
          {mode === "forgot" && (
            <Button
              title={t("sendCode")}
              loading={busy}
              disabled={!email}
              onPress={() => run(async () => {
                await api("/auth/forgot-password/", { method: "POST", auth: false, body: { email: email.trim().toLowerCase() } });
                setPassword("");
                setMode("reset");
              })}
            />
          )}
          {mode === "reset" && (
            <Button
              title={t("save")}
              loading={busy}
              disabled={code.length < 6 || password.length < 10}
              onPress={() => run(async () => {
                await api("/auth/reset-password/", { method: "POST", auth: false, body: { email: email.trim().toLowerCase(), code, new_password: password } });
                setInfo(t("resetDone"));
                setPassword("");
                setCode("");
                setMode("signin");
              })}
            />
          )}

          <Pressable onPress={() => { setError(null); setInfo(null); setMode(mode === "signin" ? "forgot" : "signin"); }} hitSlop={8}>
            <Txt center style={{ color: C.accentText }}>{mode === "signin" ? t("forgotPassword") : t("signIn")}</Txt>
          </Pressable>
        </Card>

        <Txt center size={12} style={{ color: C.faint, marginTop: 18 }}>{getServer().replace(/^https?:\/\//, "")}</Txt>
      </KeyboardAvoidingView>
    </Screen>
  );
}
