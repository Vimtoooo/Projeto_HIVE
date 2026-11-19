import { Suspense } from "react";
import DashboardLayout from "../../components/home/DashboardLayout";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<p>Carregando HIVE…</p>}>
        <DashboardLayout />
      </Suspense>
      {children}
    </>
  );
}
