import HomeDashboard from "../../components/home/HomeDashboard";
export const metadata = {
  title: "HIVE — Meu perfil",
  description: "Consulte e atualize seus dados pessoais.",
};
export default function Page() {
  return <HomeDashboard view="profile" />;
}
