import HomeDashboard from "../../components/home/HomeDashboard";
export const metadata = {
  title: "HIVE — Central de Ajuda",
  description: "Orientações sobre sua conta, serviços, mensagens e notificações.",
};
export default function Page() {
  return <HomeDashboard view="help" />;
}
