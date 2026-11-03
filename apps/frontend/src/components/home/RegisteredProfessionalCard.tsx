import Link from "next/link";
import type { ProfessionalSummary } from "../../services/ProfessionalsApi";
import { initials } from "../../lib/HomeCatalog";
import { requestMoney } from "../../lib/RequestFormatting";
import FavoriteButton from "../favorites/FavoriteButton";
import HomeIcon from "./HomeIcon";
import styles from "../../styles/home-page.module.css";

export default function RegisteredProfessionalCard({
  professional: p,
  busy,
  onMessage,
}: {
  professional: ProfessionalSummary;
  busy: number | null;
  onMessage: () => void;
}) {
  return (
    <article
      className={styles.card}
      aria-label={`Profissional cadastrado: ${p.nome}`}
    >
      <div className={styles.cardTop}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(p.nome)}
        </span>
        <FavoriteButton id={p.idPrestador} name={p.nome} compact />
      </div>
      <span className={styles.profession}>{p.areaAtuacao}</span>
      <h3>{p.nome}</h3>
      <p className={styles.specialty}>
        {p.quantidadeServicos}{" "}
        {p.quantidadeServicos === 1
          ? "serviço disponível"
          : "serviços disponíveis"}
      </p>
      <div className={styles.cardMeta}>
        <span>
          <HomeIcon name="star" size={15} />
          {p.avaliacao.quantidade > 0 && p.avaliacao.media !== null
            ? `${p.avaliacao.media.toFixed(1).replace(".", ",")} (${p.avaliacao.quantidade} avaliações)`
            : "Sem avaliações"}
        </span>
        <span>
          <HomeIcon name="location" size={14} />
          Distância indisponível
        </span>
      </div>
      <div className={styles.cardFooter}>
        <span>
          A partir de <strong>{requestMoney(p.precoInicial)}</strong>
        </span>
        <Link
          href={`/profissionais?profissional=${p.idPrestador}`}
          aria-label={`Ver detalhes de ${p.nome}`}
        >
          Ver detalhes <HomeIcon name="arrow" size={16} />
        </Link>
      </div>
      <button
        type="button"
        className={styles.messageButton}
        disabled={busy !== null}
        onClick={onMessage}
        aria-label={`Conversar com ${p.nome}`}
      >
        <HomeIcon name="message" size={17} />
        {busy === p.idPrestador ? "Abrindo…" : "Conversar"}
      </button>
    </article>
  );
}
