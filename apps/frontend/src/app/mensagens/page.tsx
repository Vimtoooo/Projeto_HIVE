import HomeDashboard from "../../components/home/HomeDashboard";
export const metadata = {
  title: "HIVE — Mensagens",
  description: "Converse e combine os detalhes do serviço no HIVE.",
};
export default function Page() {
  return <HomeDashboard view="messages" />;
}
