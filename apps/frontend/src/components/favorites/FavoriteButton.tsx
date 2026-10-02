"use client";
import { useState } from "react";
import Link from "next/link";
import { useFavorites } from "./FavoritesProvider";
import HomeIcon from "../home/HomeIcon";
import styles from "../../styles/favorites-page.module.css";
export default function FavoriteButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const { data, loading, busy, unauthorized, change, refresh } = useFavorites();
  const saved = Boolean(data?.itens.some((p) => p.idPrestador === id));
  const [error, setError] = useState("");
  return (
    <div className={styles.action}>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={`${saved ? "Remover dos favoritos" : "Favoritar"}: ${name}`}
        disabled={loading || busy}
        onClick={() => {
          setError("");
          void change(id, !saved).catch((e) =>
            setError(
              e instanceof Error
                ? e.message
                : "Não foi possível alterar o favorito.",
            ),
          );
        }}
      >
        <HomeIcon name="heart" size={17} />
        {loading ? "Consultando…" : saved ? "Salvo nos favoritos" : "Favoritar"}
      </button>
      {error && (
        <div role="alert">
          <p>{error}</p>
          {unauthorized ? (
            <Link href="/login">Entrar para favoritar</Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError("");
                void refresh();
              }}
            >
              Atualizar favoritos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
