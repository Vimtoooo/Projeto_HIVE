"use client";
import Link from "next/link";
import { useAccountSession } from "../../lib/useAccountSession";
import HomeIcon from "./HomeIcon";
import styles from "../../styles/home-page.module.css";

export default function ProviderInvitation() {
  const { user, loading, error } = useAccountSession();
  if (loading || error || user?.possuiPerfilProfissional) return null;
  return (
    <div className={styles.joinCard}>
      <span className={styles.joinIcon}>
        <HomeIcon name="wrench" />
      </span>
      <h3>
        Seu talento tem
        <br />
        lugar aqui.
      </h3>
      <p>Faça parte da comunidade de profissionais HIVE.</p>
      <Link href={user ? "/perfil/prestador" : "/cadastro/prestador"}>
        Quero ser profissional <HomeIcon name="arrow" size={16} />
      </Link>
    </div>
  );
}
