import HomeDashboard from "../../components/home/HomeDashboard";
export const metadata = {
  title: "HIVE — Profissionais",
  description: "Conheça profissionais cadastrados e serviços disponíveis.",
};
export default function Page() {
  return <HomeDashboard view="professionals" />;
}
