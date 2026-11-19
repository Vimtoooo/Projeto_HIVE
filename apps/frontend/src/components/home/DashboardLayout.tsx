"use client";
import { usePathname, useSearchParams } from "next/navigation";
import HomeDashboard from "./HomeDashboard";
const views = {
  home: "home",
  perfil: "profile",
  mensagens: "messages",
  notificacoes: "notifications",
  profissionais: "professionals",
  favoritos: "favorites",
  solicitacoes: "requests",
  ajuda: "help",
} as const;
export default function DashboardLayout() {
  const pathname = usePathname();
  const params = useSearchParams();
  const section = pathname.split("/")[1] as keyof typeof views;
  return (
    <HomeDashboard
      view={views[section] ?? "home"}
      initialSection={
        section === "home" && params.get("secao") === "Favoritos"
          ? "Favoritos"
          : "Início"
      }
      activateProvider={pathname === "/perfil/prestador"}
    />
  );
}
