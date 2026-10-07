import HomeDashboard from "../../components/home/HomeDashboard";
export const metadata = {
  title: "HIVE — Notificações",
  description: "Acompanhe as novidades de suas conversas e solicitações.",
};
export default function Page() {
  return <HomeDashboard view="notifications" />;
}
