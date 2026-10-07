import HomeDashboard from "../../components/home/HomeDashboard";
export const metadata = {
  title: "HIVE — Favoritos",
  description: "Encontre os profissionais salvos na sua conta.",
};
export default function Page() {
  return <HomeDashboard view="favorites" />;
}
