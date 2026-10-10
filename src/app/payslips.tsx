import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { accessToken, apiBase, list } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useApi } from "@/lib/use-api";
import { Button, Card, Empty, ErrorBox, Header, Loading, money, Row, Screen, Txt } from "@/components/ui";

type Payslip = { id: string; year: number; month: number; net_salary: string; gross_salary: string; total_deductions: string };
type Loan = { id: string; amount: string; remaining_amount?: string; installments?: number; status: string };

export default function Payslips() {
  const { t, tc, lang } = useI18n();
  const router = useRouter();
  const slips = useApi<Payslip[]>("/me/payslips/?page_size=24", (b) => list<Payslip>(b));
  const loans = useApi<Loan[]>("/me/loans/", (b) => list<Loan>(b));
  const [downloading, setDownloading] = useState<string | null>(null);

  const monthName = (y: number, m: number) =>
    new Date(y, m - 1, 1).toLocaleDateString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { month: "long", year: "numeric" });

  const download = async (p: Payslip) => {
    setDownloading(p.id);
    try {
      const dest = new File(Paths.cache, `payslip-${p.year}-${String(p.month).padStart(2, "0")}.pdf`);
      if (dest.exists) dest.delete();
      const task = File.createDownloadTask(`${apiBase()}/me/payslips/${p.id}/download/`, dest, {
        headers: { Authorization: `Bearer ${accessToken()}` },
      });
      const file = await task.downloadAsync();
      if (file) await Sharing.shareAsync(file.uri, { mimeType: "application/pdf" });
    } catch {
      Alert.alert(t("error"));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Screen refreshing={slips.refreshing} onRefresh={() => { slips.reload(); loans.reload(); }}>
      <Header title={t("payslips")} onBack={() => router.back()} />
      {slips.error && <ErrorBox message={slips.error} onRetry={slips.reload} />}
      {slips.loading && !slips.data && <Loading />}
      {slips.data?.length === 0 && <Empty text={t("nothingHere")} icon="wallet-outline" />}
      {slips.data?.map((p) => (
        <Card key={p.id}>
          <Row>
            <Txt bold style={{ flex: 1 }}>{monthName(p.year, p.month)}</Txt>
            <Txt bold size={16} style={{ color: "#6ee7b7" }}>{money(p.net_salary)} {t("egp")}</Txt>
          </Row>
          <Txt muted size={12}>{t("netSalary")}</Txt>
          <Button title={t("download")} icon="download-outline" variant="outline" loading={downloading === p.id} onPress={() => download(p)} style={{ height: 42 }} />
        </Card>
      ))}

      {!!loans.data?.length && (
        <>
          <Txt bold size={16} style={{ marginTop: 8 }}>{t("loans")}</Txt>
          {loans.data.map((l) => (
            <Card key={l.id}>
              <Row>
                <Txt style={{ flex: 1 }}>{money(l.amount)} {t("egp")}</Txt>
                <Txt muted size={12}>{tc("st_", l.status)}</Txt>
              </Row>
              {l.remaining_amount !== undefined && <Txt muted size={12}>{t("remaining")}: {money(l.remaining_amount)} {t("egp")}</Txt>}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
