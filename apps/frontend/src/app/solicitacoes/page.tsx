import HomeDashboard from "../../components/home/HomeDashboard";
export const metadata = {
  title: "HIVE — Minhas solicitações",
  description: "Acompanhe e gerencie seus pedidos de serviços.",
};
export default function Page() {
  return <HomeDashboard view="requests" />;
}
