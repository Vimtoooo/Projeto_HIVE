import { redirect } from "next/navigation";
import HomeDashboard from "../../components/home/HomeDashboard";
export const metadata = {
  title: "HIVE — Início",
  description: "Encontre o profissional ideal para o seu dia.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ secao?: string }>;
}) {
  const { secao } = await searchParams;
  if (secao === "Profissionais") redirect("/profissionais");
  return (
    <HomeDashboard
      initialSection={secao === "Favoritos" ? "Favoritos" : "Início"}
    />
  );
}
