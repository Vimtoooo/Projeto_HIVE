"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFavorites } from "./FavoritesProvider";
import FavoriteButton from "./FavoriteButton";
import ProfessionalCard from "../professionals/ProfessionalCard";
import ProfessionalDetails from "../professionals/ProfessionalDetails";
import HomeIcon from "../home/HomeIcon";
import favoriteStyles from "../../styles/favorites-page.module.css";
import styles from "../../styles/professionals-page.module.css";
export default function FavoritesWorkspace() {
  const { data, loading, error, unauthorized, refresh } = useFavorites();
  const params = useSearchParams(),
    selected = Number(params.get("profissional"));
  const item = data?.itens.find((p) => p.idPrestador === selected);
  return (
    <section className={styles.page} aria-labelledby="favorites-title">
      <header className={styles.heading}>
        <span className={styles.eyebrow}>BONS CONTATOS, SEMPRE POR PERTO</span>
        <h1 id="favorites-title">
          <HomeIcon name="heart" /> Favoritos
        </h1>
        <p>
          Os profissionais que você salvou na sua conta, em qualquer
          dispositivo.
        </p>
      </header>
      {unauthorized ? (
        <div className={styles.empty}>
          <h2>Entre para ver seus favoritos</h2>
          <p>Sua sessão terminou ou ainda não foi iniciada.</p>
          <Link href="/login">Entrar na conta</Link>
        </div>
      ) : (
        <>
          <button
            className={favoriteStyles.refresh}
            type="button"
            disabled={loading}
            onClick={() => void refresh()}
          >
            Atualizar favoritos
          </button>
          {error && <p role="alert">{error}</p>}
          {loading && <p role="status">Carregando favoritos…</p>}
          {data && (
            <div
              className={`${styles.panels} ${item?.disponivel ? styles.hasDetail : ""}`}
            >
              <section className={styles.list} aria-label="Lista de favoritos">
                <p role="status">
                  {data.itens.length}{" "}
                  {data.itens.length === 1
                    ? "profissional salvo"
                    : "profissionais salvos"}
                </p>
                {!data.itens.length && (
                  <div className={styles.empty}>
                    <HomeIcon name="heart" size={30} />
                    <h2>Seus profissionais favoritos ficam aqui</h2>
                    <p>
                      Abra o catálogo e salve quem você quer encontrar
                      novamente.
                    </p>
                    <Link href="/profissionais">Explorar profissionais</Link>
                  </div>
                )}
                <div className={styles.cards}>
                  {data.itens.map((p) =>
                    p.disponivel && p.profissional ? (
                      <ProfessionalCard
                        key={p.idPrestador}
                        professional={p.profissional}
                        selected={selected === p.idPrestador}
                        href={`/favoritos?profissional=${p.idPrestador}`}
                      />
                    ) : (
                      <article className={styles.card} key={p.idPrestador}>
                        <span className={styles.area}>{p.areaAtuacao}</span>
                        <h3>{p.nome}</h3>
                        <p>Indisponível no momento</p>
                        <p>
                          Conversas e novas solicitações estão indisponíveis por
                          este perfil. Você pode removê-lo dos favoritos.
                        </p>
                        <FavoriteButton id={p.idPrestador} name={p.nome} />
                      </article>
                    ),
                  )}
                </div>
              </section>
              {item?.disponivel ? (
                <ProfessionalDetails
                  key={`${data.usuarioId}:${selected}`}
                  id={selected}
                  back="/favoritos"
                />
              ) : (
                <aside className={styles.placeholder}>
                  <HomeIcon name="heart" size={34} />
                  <h2>Seus contatos, organizados</h2>
                  <p>
                    Selecione um profissional disponível para ver os serviços e
                    retomar o contato.
                  </p>
                  <small>
                    Favoritos demonstrativos da Home ficam separados, apenas no
                    navegador.
                  </small>
                </aside>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
