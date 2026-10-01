import type { Professional } from "../../types/HomeTypes";
import { money } from "../../lib/HomeCatalog";
import ProfessionalAvatar from "./ProfessionalAvatar";
import HomeIcon from "./HomeIcon";
import styles from "../../styles/home-page.module.css";
export default function ProfessionalCard({
  professional: p,
  saved,
  onSave,
  onDetails,
  onMessage,
}: {
  professional: Professional;
  saved: boolean;
  onSave: () => void;
  onDetails: () => void;
  onMessage: () => void;
}) {
  return (
    <article className={styles.card} aria-label={p.name}>
      <div className={styles.cardTop}>
        <ProfessionalAvatar professional={p} />
        <button
          type="button"
          className={styles.favorite + (saved ? " " + styles.saved : "")}
          aria-label={
            (saved ? "Remover dos favoritos: " : "Salvar favorito: ") + p.name
          }
          aria-pressed={saved}
          onClick={onSave}
        >
          <HomeIcon name="heart" />
        </button>
      </div>
      <span className={styles.profession}>{p.profession}</span>
      <h3>{p.name}</h3>
      <p className={styles.specialty}>{p.specialty}</p>
      <div className={styles.cardMeta}>
        <span>
          <HomeIcon name="star" size={15} />{" "}
          <strong>{p.rating.toFixed(1).replace(".", ",")}</strong>{" "}
          <span>({p.reviews})</span>
        </span>
        <span>
          <HomeIcon name="location" size={14} />
          {p.distance.toFixed(1).replace(".", ",")} km
        </span>
      </div>
      <div className={styles.cardFooter}>
        <span>
          A partir de <strong>{money(p.price)}</strong>
        </span>
        <button
          type="button"
          onClick={onDetails}
          aria-label={"Ver detalhes de " + p.name}
        >
          Ver perfil <HomeIcon name="arrow" size={16} />
        </button>
      </div>
      <button
        type="button"
        className={styles.messageButton}
        onClick={onMessage}
        aria-label={"Conversar com " + p.name}
      >
        <HomeIcon name="message" size={17} /> Conversar{" "}
        <small>Perfil demonstrativo</small>
      </button>
    </article>
  );
}
