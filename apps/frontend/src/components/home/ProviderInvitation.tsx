"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApiError, session } from "../../services/MessagingApi";
import { subscribeViewer } from "../../lib/ViewerStore";
import HomeIcon from "./HomeIcon";
import styles from "../../styles/home-page.module.css";

export default function ProviderInvitation() {
  const [visible, setVisible] = useState(false);
  const version = useRef(0);
  useEffect(() => {
    let active = true;
    async function refresh() {
      const current = ++version.current;
      setVisible(false);
      try {
        const user = await session();
        if (active && current === version.current)
          setVisible(user.tipoUsuario === "CONTRATANTE");
      } catch (error) {
        if (active && current === version.current)
          setVisible(error instanceof ApiError && error.status === 401);
      }
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const unsubscribe = subscribeViewer(() => {
      void refresh();
    });
    void refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  if (!visible) return null;
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
      <Link href="/cadastro/prestador">
        Quero ser profissional <HomeIcon name="arrow" size={16} />
      </Link>
    </div>
  );
}
